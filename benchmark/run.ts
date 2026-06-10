#!/usr/bin/env ts-node
/**
 * ElectroDB benchmark runner (manual/local — not wired into the test gate).
 *
 *   npm run benchmark           run all scenarios, print a table
 *   npm run benchmark:json      print machine-readable results
 *   npm run benchmark:update    write benchmark/baseline.json
 *   npm run benchmark:compare   compare against baseline.json (advisory)
 *     --strict                  exit 1 when the compare finds regressions
 *     --filter <substring>      only run tasks whose name includes substring
 *
 * Scenarios live in benchmark/scenarios/*.bench.ts; each default-exports an
 * array of `{ name, fn, opts? }` entries (see README.md). A fixed reference
 * task runs with every invocation and task throughput is recorded relative to
 * it (`normalized = hz / referenceHz`), which makes the committed baseline
 * roughly machine-independent.
 */
import * as fs from "fs";
import * as path from "path";
import { Bench } from "tinybench";
import { makeFixtureEntity, makeStoredItem } from "../test/fixtures/entities";

export interface ScenarioEntry {
  /** task name, conventionally `group/task` */
  name: string;
  /** the operation under test; may be async */
  fn: () => unknown | Promise<unknown>;
  /** optional tinybench task options (beforeAll/beforeEach/...) */
  opts?: Record<string, unknown>;
}

interface TaskStats {
  hz: number;
  mean: number;
  p99: number;
  rme: number;
  samples: number;
  normalized?: number;
}

interface RunResults {
  referenceHz: number | null;
  tasks: Record<string, TaskStats>;
}

interface BaselineTask {
  hz: number;
  mean: number;
  normalized: number;
}

interface BaselineFile {
  schemaVersion: number;
  generatedAt: string;
  node: string;
  referenceHz: number | null;
  tasks: Record<string, BaselineTask>;
}

interface CliArgs {
  json: boolean;
  compare: boolean;
  updateBaseline: boolean;
  strict: boolean;
  filter: string | null;
}

const SCENARIO_DIR = path.join(__dirname, "scenarios");
const BASELINE_PATH = path.join(__dirname, "baseline.json");
const REFERENCE_TASK = "reference/parse-500-items";
const DEFAULT_TOLERANCE = 0.2;

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    json: false,
    compare: false,
    updateBaseline: false,
    strict: false,
    filter: null,
  };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--json") args.json = true;
    else if (arg === "--compare") args.compare = true;
    else if (arg === "--update-baseline") args.updateBaseline = true;
    else if (arg === "--strict") args.strict = true;
    else if (arg === "--filter") args.filter = argv[++i] ?? null;
    else {
      console.error(`Unknown argument: ${arg}`);
      process.exit(1);
    }
  }
  return args;
}

function makeReferenceTask(): ScenarioEntry {
  const entity = makeFixtureEntity();
  const Items: Record<string, any>[] = [];
  for (let i = 0; i < 500; i++) {
    Items.push(makeStoredItem(entity, i));
  }
  return { name: REFERENCE_TASK, fn: () => entity.parse({ Items }) };
}

function loadScenarios(): ScenarioEntry[] {
  const entries: ScenarioEntry[] = [makeReferenceTask()];
  const files = fs
    .readdirSync(SCENARIO_DIR)
    .filter((file) => file.endsWith(".bench.ts") || file.endsWith(".bench.js"))
    .sort();
  for (const file of files) {
    const mod = require(path.join(SCENARIO_DIR, file));
    const scenario: unknown = mod.default ?? mod;
    if (!Array.isArray(scenario)) {
      throw new Error(`${file} must export an array of {name, fn, opts?}`);
    }
    for (const entry of scenario) {
      if (
        !entry ||
        typeof entry.name !== "string" ||
        typeof entry.fn !== "function"
      ) {
        throw new Error(`${file} exported an entry without {name, fn}`);
      }
      entries.push(entry);
    }
  }
  return entries;
}

function collectResults(bench: Bench): RunResults {
  const tasks: Record<string, TaskStats> = {};
  let failed = false;
  for (const task of bench.tasks) {
    if (!task.result || task.result.error) {
      console.error(`Task "${task.name}" failed:`);
      console.error(task.result && task.result.error);
      failed = true;
      continue;
    }
    tasks[task.name] = {
      hz: task.result.hz,
      mean: task.result.mean,
      p99: task.result.p99,
      rme: task.result.rme,
      samples: task.result.samples.length,
    };
  }
  if (failed) {
    process.exit(1);
  }
  const referenceHz = tasks[REFERENCE_TASK] ? tasks[REFERENCE_TASK].hz : null;
  if (referenceHz) {
    for (const name of Object.keys(tasks)) {
      tasks[name].normalized = tasks[name].hz / referenceHz;
    }
  }
  return { referenceHz, tasks };
}

function compare(
  baseline: BaselineFile,
  current: RunResults,
  { strict }: { strict: boolean },
): void {
  const tolerance = DEFAULT_TOLERANCE;
  const rows: Record<string, string>[] = [];
  const regressions: Record<string, string>[] = [];
  for (const [name, base] of Object.entries(baseline.tasks)) {
    if (name === REFERENCE_TASK) continue;
    const task = current.tasks[name];
    if (!task || task.normalized === undefined) {
      rows.push({ task: name, status: "removed" });
      continue;
    }
    const ratio = task.normalized / base.normalized;
    const row = {
      task: name,
      "baseline (norm)": base.normalized.toFixed(4),
      "current (norm)": task.normalized.toFixed(4),
      ratio: ratio.toFixed(3),
      status:
        ratio < 1 - tolerance
          ? "REGRESSION"
          : ratio > 1 + tolerance
          ? "improved"
          : "ok",
    };
    rows.push(row);
    if (row.status === "REGRESSION") regressions.push(row);
  }
  for (const name of Object.keys(current.tasks)) {
    if (name !== REFERENCE_TASK && !baseline.tasks[name]) {
      rows.push({ task: name, status: "added (not in baseline)" });
    }
  }
  console.table(rows);
  if (regressions.length) {
    console.error(
      `${regressions.length} regression(s) beyond ${
        tolerance * 100
      }% tolerance (vs baseline from ${baseline.generatedAt}, node ${
        baseline.node
      }).`,
    );
    if (strict) process.exit(1);
  } else {
    console.log(
      `No regressions beyond ${tolerance * 100}% tolerance (vs baseline from ${
        baseline.generatedAt
      }).`,
    );
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv);
  let entries = loadScenarios();
  if (args.filter !== null) {
    const filter = args.filter;
    entries = entries.filter(
      (entry) => entry.name === REFERENCE_TASK || entry.name.includes(filter),
    );
  }

  const bench = new Bench({ time: 500, warmupTime: 100 });
  for (const { name, fn, opts } of entries) {
    bench.add(name, fn, opts);
  }

  await bench.warmup();
  await bench.run();

  const current = collectResults(bench);

  if (args.json) {
    console.log(
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          node: process.version,
          referenceHz: current.referenceHz,
          tasks: current.tasks,
        },
        null,
        2,
      ),
    );
  } else {
    console.table(bench.table());
  }

  if (args.updateBaseline) {
    const baseline: BaselineFile = {
      schemaVersion: 1,
      generatedAt: new Date().toISOString(),
      node: process.version,
      referenceHz: current.referenceHz,
      tasks: {},
    };
    for (const [name, task] of Object.entries(current.tasks)) {
      baseline.tasks[name] = {
        hz: task.hz,
        mean: task.mean,
        normalized: task.normalized ?? 0,
      };
    }
    fs.writeFileSync(BASELINE_PATH, `${JSON.stringify(baseline, null, 2)}\n`);
    console.log(
      `Baseline written to ${path.relative(process.cwd(), BASELINE_PATH)}`,
    );
  }

  if (args.compare) {
    if (!fs.existsSync(BASELINE_PATH)) {
      console.error(
        "No baseline.json found — run `npm run benchmark:update` first.",
      );
      process.exit(1);
    }
    const baseline: BaselineFile = JSON.parse(
      fs.readFileSync(BASELINE_PATH, "utf8"),
    );
    compare(baseline, current, { strict: args.strict });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
