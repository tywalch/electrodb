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
 *     --threshold <pct>         practical-significance threshold (default 5)
 *     --time <ms>               within-run sampling time per task (default 500)
 *     --runs <n>                repeat the whole suite n times and derive
 *                               error bars from the between-run spread
 *                               (default 3 for compare/update, 1 otherwise)
 *
 * Scenarios live in benchmark/scenarios/*.bench.ts; each default-exports an
 * array of `{ name, fn, opts? }` entries (see README.md). A fixed reference
 * task runs with every invocation and task throughput is recorded relative to
 * it (`normalized = hz / referenceHz`), which makes the committed baseline
 * roughly machine-independent.
 *
 * Compare verdicts use two gates (see README "Interpreting a compare"):
 *   statistical — the change must exceed the noise floor derived from both
 *     sides' 95% confidence intervals. With --runs > 1 the interval comes
 *     from the between-run spread of the normalized value (which captures
 *     GC/JIT/thermal variance that within-run sampling underestimates,
 *     especially for long async tasks); with --runs 1 it falls back to the
 *     within-run tinybench rme combined with the reference task's.
 *   practical — the change must also exceed --threshold percent to be worth
 *     acting on. Real-but-small changes report as "within threshold", and
 *     changes inside the noise floor report as "~noise".
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
  /** tinybench's relative margin of error for the task itself (95%, percent) */
  rme: number;
  samples: number;
  normalized?: number;
  /**
   * relative 95% margin of error of `normalized` (percent). `normalized` is a
   * ratio of two independent estimates (task hz / reference hz), so its
   * relative error combines both: sqrt(rme² + rmeReference²).
   */
  normalizedRme?: number;
}

interface RunResults {
  referenceHz: number | null;
  tasks: Record<string, TaskStats>;
}

interface BaselineTask {
  hz: number;
  mean: number;
  normalized: number;
  /** relative 95% margin of error of `normalized` (percent) */
  normalizedRme: number;
  samples: number;
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
  /** practical-significance threshold, percent */
  threshold: number;
  /** tinybench sampling time per task, ms */
  time: number;
  /** full-suite repetitions; >1 derives error bars from between-run spread */
  runs: number;
}

const SCENARIO_DIR = path.join(__dirname, "scenarios");
const BASELINE_PATH = path.join(__dirname, "baseline.json");
const REFERENCE_TASK = "reference/parse-500-items";
const BASELINE_SCHEMA_VERSION = 2;
const DEFAULT_THRESHOLD_PCT = 5;
const DEFAULT_TIME_MS = 500;
const DEFAULT_DECISION_RUNS = 3;

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    json: false,
    compare: false,
    updateBaseline: false,
    strict: false,
    filter: null,
    threshold: DEFAULT_THRESHOLD_PCT,
    time: DEFAULT_TIME_MS,
    runs: 0, // resolved after flags are read; see below
  };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--json") args.json = true;
    else if (arg === "--compare") args.compare = true;
    else if (arg === "--update-baseline") args.updateBaseline = true;
    else if (arg === "--strict") args.strict = true;
    else if (arg === "--filter") args.filter = argv[++i] ?? null;
    else if (arg === "--threshold" || arg === "--time" || arg === "--runs") {
      const value = Number(argv[++i]);
      if (!Number.isFinite(value) || value <= 0) {
        console.error(`${arg} requires a positive number`);
        process.exit(1);
      }
      if (arg === "--threshold") args.threshold = value;
      else if (arg === "--time") args.time = value;
      else args.runs = Math.floor(value);
    } else {
      console.error(`Unknown argument: ${arg}`);
      process.exit(1);
    }
  }
  if (args.runs === 0) {
    // compare/update need trustworthy error bars, which only between-run
    // spread provides; plain exploratory runs stay fast by default
    args.runs = args.compare || args.updateBaseline ? DEFAULT_DECISION_RUNS : 1;
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
  const reference = tasks[REFERENCE_TASK];
  if (reference) {
    for (const name of Object.keys(tasks)) {
      const task = tasks[name];
      task.normalized = task.hz / reference.hz;
      task.normalizedRme = Math.sqrt(
        task.rme * task.rme + reference.rme * reference.rme,
      );
    }
  }
  return { referenceHz: reference ? reference.hz : null, tasks };
}

type Verdict =
  | "REGRESSION"
  | "improved"
  | "within threshold"
  | "~noise"
  | "added (not in baseline)"
  | "removed";

interface CompareRow {
  task: string;
  "baseline (norm)"?: string;
  "current (norm)"?: string;
  "delta %"?: string;
  "noise +/-%"?: string;
  verdict: Verdict;
}

/**
 * Two-gate comparison per task:
 *
 * 1. statistical -- is the change distinguishable from sampling error? Each
 *    run's normalized value carries a 95% confidence interval (normalizedRme).
 *    The change is significant only when the two intervals do not overlap,
 *    i.e. |delta| exceeds the "noise floor" (the sum of both CI half-widths,
 *    expressed in percent of the baseline value). This is conservative: when
 *    in doubt it says "~noise".
 * 2. practical -- a real change must also exceed `threshold` percent before
 *    it is labeled REGRESSION/improved; real-but-small changes report as
 *    "within threshold".
 */
function compare(
  baseline: BaselineFile,
  current: RunResults,
  {
    strict,
    threshold,
    filter,
  }: { strict: boolean; threshold: number; filter: string | null },
): void {
  if (baseline.schemaVersion !== BASELINE_SCHEMA_VERSION) {
    console.error(
      `baseline.json has schemaVersion ${baseline.schemaVersion}; expected ${BASELINE_SCHEMA_VERSION}. Regenerate it with \`npm run benchmark:update\`.`,
    );
    process.exit(1);
  }
  const rows: CompareRow[] = [];
  const regressions: CompareRow[] = [];
  let insensitive = 0;
  for (const [name, base] of Object.entries(baseline.tasks)) {
    if (name === REFERENCE_TASK) continue;
    // a filtered run intentionally skips tasks; don't report those as removed
    if (filter !== null && !name.includes(filter)) continue;
    const task = current.tasks[name];
    if (
      !task ||
      task.normalized === undefined ||
      task.normalizedRme === undefined
    ) {
      rows.push({ task: name, verdict: "removed" });
      continue;
    }
    const deltaPct = (task.normalized / base.normalized - 1) * 100;
    const baseHalfWidth = base.normalized * (base.normalizedRme / 100);
    const currentHalfWidth = task.normalized * (task.normalizedRme / 100);
    const noiseFloorPct =
      ((baseHalfWidth + currentHalfWidth) / base.normalized) * 100;
    const significant = Math.abs(deltaPct) > noiseFloorPct;
    const material = Math.abs(deltaPct) >= threshold;
    const verdict: Verdict = !significant
      ? "~noise"
      : !material
      ? "within threshold"
      : deltaPct < 0
      ? "REGRESSION"
      : "improved";
    if (noiseFloorPct > threshold) {
      insensitive++;
    }
    const row: CompareRow = {
      task: name,
      "baseline (norm)": base.normalized.toFixed(4),
      "current (norm)": task.normalized.toFixed(4),
      "delta %": `${deltaPct >= 0 ? "+" : ""}${deltaPct.toFixed(1)}`,
      "noise +/-%": noiseFloorPct.toFixed(1),
      verdict,
    };
    rows.push(row);
    if (verdict === "REGRESSION") regressions.push(row);
  }
  for (const name of Object.keys(current.tasks)) {
    if (name !== REFERENCE_TASK && !baseline.tasks[name]) {
      rows.push({ task: name, verdict: "added (not in baseline)" });
    }
  }
  console.table(rows);
  console.log(
    `Gates: statistical (|delta| must beat the per-task noise floor, from both runs' 95% CIs) and practical (|delta| >= ${threshold}%). Baseline: ${baseline.generatedAt}, node ${baseline.node}.`,
  );
  // Normalization absorbs *uniform* machine slowdown, but drift is rarely
  // uniform (GC/async-heavy tasks throttle harder), so large reference drift
  // means conditions changed between runs and borderline verdicts are suspect.
  if (baseline.referenceHz && current.referenceHz) {
    const driftPct = (current.referenceHz / baseline.referenceHz - 1) * 100;
    console.log(
      `Reference-task raw throughput drift since baseline: ${
        driftPct >= 0 ? "+" : ""
      }${driftPct.toFixed(1)}%.`,
    );
    if (Math.abs(driftPct) > 10) {
      console.warn(
        "Machine conditions differ noticeably from the baseline run (thermal throttling, background load, or a different machine). Treat borderline verdicts with suspicion; re-run when idle or regenerate the baseline.",
      );
    }
  }
  if (insensitive > 0) {
    console.warn(
      `Note: ${insensitive} task(s) have a noise floor above ${threshold}% -- a change of that size could hide in noise there. Increase --runs on both sides (and regenerate the baseline) for more sensitivity.`,
    );
  }
  if (regressions.length) {
    console.error(
      `${regressions.length} regression(s): ${regressions
        .map((row) => row.task)
        .join(", ")}.`,
    );
    if (strict) process.exit(1);
  } else {
    console.log("No regressions.");
  }
}

// two-sided 95% critical values of Student's t, indexed by degrees of freedom
const T95 = [
  12.71, 4.3, 3.18, 2.78, 2.57, 2.45, 2.36, 2.31, 2.26, 2.23, 2.2, 2.18, 2.16,
  2.14, 2.13,
];
function t95(df: number): number {
  return df <= 0 ? Infinity : df <= T95.length ? T95[df - 1] : 1.96;
}

function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/**
 * Collapse N independent runs into one result. For N > 1, each task's
 * normalized value is averaged across runs and its margin of error is
 * computed from the BETWEEN-run spread (t-based 95% CI of the mean). This
 * captures variance that within-run sampling cannot see — GC phasing, JIT
 * state, thermal drift — which dominates for long async tasks. For N = 1 the
 * within-run estimate from collectResults is kept as-is.
 */
function aggregateRuns(runs: RunResults[]): RunResults {
  if (runs.length === 1) {
    return runs[0];
  }
  // collectResults aborts the process on any task failure, so every run
  // contains every task
  const n = runs.length;
  const tasks: Record<string, TaskStats> = {};
  for (const name of Object.keys(runs[0].tasks)) {
    const perRun = runs.map((run) => run.tasks[name]);
    const normalizedValues = perRun.map((task) => task.normalized ?? 0);
    const normalizedMean = average(normalizedValues);
    const variance =
      normalizedValues.reduce(
        (sum, value) => sum + (value - normalizedMean) ** 2,
        0,
      ) /
      (n - 1);
    const ciHalfWidth = t95(n - 1) * Math.sqrt(variance / n);
    tasks[name] = {
      hz: average(perRun.map((task) => task.hz)),
      mean: average(perRun.map((task) => task.mean)),
      p99: average(perRun.map((task) => task.p99)),
      rme: average(perRun.map((task) => task.rme)),
      samples: perRun.reduce((sum, task) => sum + task.samples, 0),
      normalized: normalizedMean,
      normalizedRme:
        normalizedMean > 0 ? (ciHalfWidth / normalizedMean) * 100 : 0,
    };
  }
  return {
    referenceHz: average(runs.map((run) => run.referenceHz ?? 0)),
    tasks,
  };
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

  const allRuns: RunResults[] = [];
  for (let run = 0; run < args.runs; run++) {
    const bench = new Bench({ time: args.time, warmupTime: 100 });
    for (const { name, fn, opts } of entries) {
      bench.add(name, fn, opts);
    }
    await bench.warmup();
    await bench.run();
    allRuns.push(collectResults(bench));
    if (args.runs > 1) {
      console.error(`run ${run + 1}/${args.runs} complete`);
    }
    if (!args.json && run === args.runs - 1) {
      console.table(bench.table());
    }
  }

  const current = aggregateRuns(allRuns);

  if (args.runs > 1 && !args.json) {
    console.table(
      Object.entries(current.tasks).map(([name, task]) => ({
        task: name,
        "normalized (mean)": (task.normalized ?? 0).toFixed(4),
        "±% (95% CI, between-run)": (task.normalizedRme ?? 0).toFixed(1),
        runs: args.runs,
      })),
    );
  }

  if (args.json) {
    console.log(
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          node: process.version,
          runs: args.runs,
          referenceHz: current.referenceHz,
          tasks: current.tasks,
        },
        null,
        2,
      ),
    );
  }

  if (args.updateBaseline) {
    const baseline: BaselineFile = {
      schemaVersion: BASELINE_SCHEMA_VERSION,
      generatedAt: new Date().toISOString(),
      node: process.version,
      referenceHz: current.referenceHz,
      tasks: {},
    };
    let noisy = 0;
    for (const [name, task] of Object.entries(current.tasks)) {
      baseline.tasks[name] = {
        hz: task.hz,
        mean: task.mean,
        normalized: task.normalized ?? 0,
        normalizedRme: task.normalizedRme ?? 0,
        samples: task.samples,
      };
      if (
        name !== REFERENCE_TASK &&
        (task.normalizedRme ?? 0) > args.threshold
      ) {
        noisy++;
      }
    }
    fs.writeFileSync(BASELINE_PATH, `${JSON.stringify(baseline, null, 2)}\n`);
    console.log(
      `Baseline written to ${path.relative(process.cwd(), BASELINE_PATH)}`,
    );
    if (noisy > 0) {
      console.warn(
        `Note: ${noisy} task(s) were captured with a margin of error above ${args.threshold}% — comparisons against them will have a high noise floor. Consider regenerating with more --runs.`,
      );
    }
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
    compare(baseline, current, {
      strict: args.strict,
      threshold: args.threshold,
      filter: args.filter,
    });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
