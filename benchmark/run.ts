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
 *     --threshold <percent>     practical-significance threshold
 *     --time <milliseconds>     within-run sampling time per task
 *     --runs <count>            repeat the whole suite this many times and
 *                               derive error bars from the between-run spread
 *     (defaults for all of these live in config.ts, with documentation on
 *     how the knobs interact)
 *
 * Scenarios live in benchmark/scenarios/*.benchmark.ts; each default-exports an
 * array of `{ name, fn, options? }` entries (see README.md). A fixed reference
 * task runs with every invocation and task throughput is recorded relative to
 * it (`normalized = task operations/second ÷ reference operations/second`),
 * which makes the committed baseline
 * roughly machine-independent.
 *
 * Compare verdicts use two gates (see README "Interpreting a compare"):
 *   statistical — the change must exceed the noise floor derived from both
 *     sides' 95% confidence intervals. With --runs > 1 the interval comes
 *     from the between-run spread of the normalized value (which captures
 *     GC/JIT/thermal variance that within-run sampling underestimates,
 *     especially for long async tasks); with --runs 1 it falls back to the
 *     within-run tinybench relative margin of error combined with the
 *     reference task's.
 *   practical — the change must also exceed --threshold percent to be worth
 *     acting on. Real-but-small changes report as "within threshold", and
 *     changes inside the noise floor report as "~noise".
 */
import * as fs from "fs";
import * as path from "path";
import { Bench } from "tinybench";
import { makeFixtureEntity, makeStoredItem } from "../test/fixtures/entities";
import {
  BAR_WIDTH,
  BASELINE_SCHEMA_VERSION,
  CONSISTENCY_MINIMUM_RUNS,
  CONSISTENCY_NOTE_RATIO,
  DEFAULT_DECISION_RUNS,
  DEFAULT_THRESHOLD_PERCENT,
  DEFAULT_SAMPLING_TIME_MILLISECONDS,
  DRIFT_CAUTION_PERCENT,
  DRIFT_ACCEPTABLE_PERCENT,
  LANE_WIDTH,
  REFERENCE_TASK,
  SPREAD_LANE_WIDTH,
  STABILITY_MODERATE_PERCENT,
  STABILITY_STEADY_PERCENT,
  VERDICT_LABEL_WIDTH,
  WARMUP_TIME_MILLISECONDS,
} from "./config";

export interface ScenarioEntry {
  /** task name, conventionally `group/task` */
  name: string;
  /** the operation under test; may be async */
  fn: () => unknown | Promise<unknown>;
  /** optional tinybench task options (beforeAll/beforeEach/...) */
  options?: Record<string, unknown>;
}

interface TaskStatistics {
  operationsPerSecond: number;
  mean: number;
  percentile99: number;
  /** tinybench's relative margin of error for the task itself (95%, percent) */
  relativeMarginOfErrorPercent: number;
  samples: number;
  normalized?: number;
  /**
   * relative 95% margin of error of `normalized` (percent). `normalized` is a
   * ratio of two independent estimates (task speed ÷ reference speed), so
   * its relative error combines both sides' margins:
   * sqrt(taskMargin² + referenceMargin²).
   */
  normalizedRelativeMarginOfErrorPercent?: number;
}

interface RunResults {
  referenceOperationsPerSecond: number | null;
  tasks: Record<string, TaskStatistics>;
}

interface BaselineTask {
  operationsPerSecond: number;
  mean: number;
  normalized: number;
  /** relative 95% margin of error of `normalized` (percent) */
  normalizedRelativeMarginOfErrorPercent: number;
  samples: number;
}

interface BaselineFile {
  schemaVersion: number;
  generatedAt: string;
  node: string;
  /** --runs the baseline was captured at; absent on older baselines */
  runs?: number;
  referenceOperationsPerSecond: number | null;
  tasks: Record<string, BaselineTask>;
}

interface CommandLineArguments {
  json: boolean;
  compare: boolean;
  updateBaseline: boolean;
  strict: boolean;
  filter: string | null;
  /** practical-significance threshold, percent */
  threshold: number;
  /** tinybench sampling time per task, milliseconds */
  time: number;
  /** full-suite repetitions; >1 derives error bars from between-run spread */
  runs: number;
}

const SCENARIO_DIRECTORY = path.join(__dirname, "scenarios");
const BASELINE_PATH = path.join(__dirname, "baseline.json");

function parseCommandLineArguments(
  processArguments: string[],
): CommandLineArguments {
  const commandLineArguments: CommandLineArguments = {
    json: false,
    compare: false,
    updateBaseline: false,
    strict: false,
    filter: null,
    threshold: DEFAULT_THRESHOLD_PERCENT,
    time: DEFAULT_SAMPLING_TIME_MILLISECONDS,
    runs: 0, // resolved after flags are read; see below
  };
  for (let i = 2; i < processArguments.length; i++) {
    const argument = processArguments[i];
    if (argument === "--json") commandLineArguments.json = true;
    else if (argument === "--compare") commandLineArguments.compare = true;
    else if (argument === "--update-baseline")
      commandLineArguments.updateBaseline = true;
    else if (argument === "--strict") commandLineArguments.strict = true;
    else if (argument === "--filter")
      commandLineArguments.filter = processArguments[++i] ?? null;
    else if (
      argument === "--threshold" ||
      argument === "--time" ||
      argument === "--runs"
    ) {
      const value = Number(processArguments[++i]);
      if (!Number.isFinite(value) || value <= 0) {
        console.error(`${argument} requires a positive number`);
        process.exit(1);
      }
      if (argument === "--threshold") commandLineArguments.threshold = value;
      else if (argument === "--time") commandLineArguments.time = value;
      else commandLineArguments.runs = Math.floor(value);
    } else {
      console.error(`Unknown argument: ${argument}`);
      process.exit(1);
    }
  }
  if (commandLineArguments.runs === 0) {
    // compare/update need trustworthy error bars, which only between-run
    // spread provides; plain exploratory runs stay fast by default
    commandLineArguments.runs =
      commandLineArguments.compare || commandLineArguments.updateBaseline
        ? DEFAULT_DECISION_RUNS
        : 1;
  }
  return commandLineArguments;
}

function makeReferenceTask(): ScenarioEntry {
  const entity = makeFixtureEntity();
  const Items: Record<string, any>[] = [];
  for (let i = 0; i < 500; i++) {
    Items.push(makeStoredItem(entity, i));
  }
  return {
    name: REFERENCE_TASK,
    fn: () => entity.parse({ Items }),
  };
}

function loadScenarios(): ScenarioEntry[] {
  const entries: ScenarioEntry[] = [makeReferenceTask()];
  const files = fs
    .readdirSync(SCENARIO_DIRECTORY)
    .filter(
      (file) =>
        file.endsWith(".benchmark.ts") || file.endsWith(".benchmark.js"),
    )
    .sort();
  for (const file of files) {
    const loadedModule = require(path.join(SCENARIO_DIRECTORY, file));
    const scenario: unknown = loadedModule.default ?? loadedModule;
    if (!Array.isArray(scenario)) {
      throw new Error(
        `${file} must export an array of {name, fn, options?}`,
      );
    }
    for (const entry of scenario) {
      if (
        !entry ||
        typeof entry.name !== "string" ||
        typeof entry.fn !== "function"
      ) {
        throw new Error(
          `${file} exported an entry without {name, fn}`,
        );
      }
      entries.push(entry);
    }
  }
  return entries;
}

function collectResults(benchmarkSuite: Bench): RunResults {
  const tasks: Record<string, TaskStatistics> = {};
  let failed = false;
  for (const task of benchmarkSuite.tasks) {
    if (!task.result || task.result.error) {
      console.error(`Task "${task.name}" failed:`);
      console.error(task.result && task.result.error);
      failed = true;
      continue;
    }
    tasks[task.name] = {
      operationsPerSecond: task.result.hz,
      mean: task.result.mean,
      percentile99: task.result.p99,
      relativeMarginOfErrorPercent: task.result.rme,
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
      task.normalized =
        task.operationsPerSecond / reference.operationsPerSecond;
      task.normalizedRelativeMarginOfErrorPercent = Math.sqrt(
        task.relativeMarginOfErrorPercent * task.relativeMarginOfErrorPercent +
          reference.relativeMarginOfErrorPercent *
            reference.relativeMarginOfErrorPercent,
      );
    }
  }
  return {
    referenceOperationsPerSecond: reference
      ? reference.operationsPerSecond
      : null,
    tasks,
  };
}

const Verdicts = {
  regression: "regression",
  improved: "improved",
  within_threshold: "within_threshold",
  noise: "noise",
  added: "added",
  removed: "removed",
} as const;

type Verdict = keyof typeof Verdicts;

const VerdictDisplayText: Record<Verdict, string> = {
  regression: "REGRESSION",
  improved: "improved",
  within_threshold: "within threshold",
  noise: "~noise",
  added: "added (not in baseline)",
  removed: "removed",
};

// ---------------------------------------------------------------------------
// terminal rendering — ANSI colors, CI lanes, and throughput bars
// ---------------------------------------------------------------------------

const useColor =
  process.stdout.isTTY && process.env.NO_COLOR === undefined;

function paint(code: number): (text: string) => string {
  return (text) => (useColor ? `\u001b[${code}m${text}\u001b[0m` : text);
}

const bold = paint(1);
const dim = paint(2);
const red = paint(31);
const green = paint(32);
const yellow = paint(33);
const magenta = paint(35);
const cyan = paint(36);

// color semantics used across all output:
//   green = good (improved / steady)   red = bad (regression / jittery)
//   yellow = caution (real-but-small / moderate variance)
//   cyan = neutral measurement         magenta = abnormal (instrument too
//   blunt: noise floor above the threshold, or large machine drift)
const VerdictPaint: Record<Verdict, (text: string) => string> = {
  regression: (text) => bold(red(text)),
  improved: green,
  within_threshold: yellow,
  noise: dim,
  added: cyan,
  removed: dim,
};

// the lane/delta color for a verdict; ~noise stays a visible neutral so the
// current lane never disappears into the dim baseline lane
const VerdictEmphasisPaint: Record<Verdict, (text: string) => string> = {
  regression: red,
  improved: green,
  within_threshold: yellow,
  noise: cyan,
  added: cyan,
  removed: dim,
};

function stabilityPaint(
  relativeMarginOfErrorPercent: number,
): (text: string) => string {
  if (relativeMarginOfErrorPercent <= STABILITY_STEADY_PERCENT) return green;
  if (relativeMarginOfErrorPercent <= STABILITY_MODERATE_PERCENT) return yellow;
  return red;
}

const LANE_INDENT = " ".repeat(VERDICT_LABEL_WIDTH + 1);

function verdictLabel(verdict: Verdict): string {
  return VerdictPaint[verdict](
    VerdictDisplayText[verdict].padEnd(VERDICT_LABEL_WIDTH),
  );
}

// dim, single-line "how to read this" bullets under a section header
function explain(bullets: string[]): void {
  for (const bullet of bullets) {
    console.log(dim(`  • ${bullet}`));
  }
}

interface Interval {
  lowerBound: number;
  mean: number;
  upperBound: number;
}

function intervalOf(
  mean: number,
  relativeMarginOfErrorPercent: number,
): Interval {
  const half = mean * (relativeMarginOfErrorPercent / 100);
  return {
    lowerBound: Math.max(0, mean - half),
    mean,
    upperBound: mean + half,
  };
}

// one fixed-width lane — ····├────●────┤···· — the 95% CI drawn over a dotted
// track; two lanes rendered on the same scale make interval overlap (or the
// gap between them) directly visible in the terminal
function renderLane(
  interval: Interval,
  scaleLowerBound: number,
  scaleUpperBound: number,
  color: (text: string) => string,
): string {
  const cells: string[] = new Array(LANE_WIDTH).fill("·");
  const span = scaleUpperBound - scaleLowerBound;
  const at = (value: number) =>
    span <= 0
      ? 0
      : Math.max(
          0,
          Math.min(
            LANE_WIDTH - 1,
            Math.round(((value - scaleLowerBound) / span) * (LANE_WIDTH - 1)),
          ),
        );
  const lowerBoundPosition = at(interval.lowerBound);
  const upperBoundPosition = at(interval.upperBound);
  if (upperBoundPosition - lowerBoundPosition < 2) {
    // interval narrower than the lane resolution: render a point, not caps
    cells[at(interval.mean)] = "●";
  } else {
    for (let i = lowerBoundPosition; i <= upperBoundPosition; i++) {
      cells[i] = "─";
    }
    cells[lowerBoundPosition] = "├";
    cells[upperBoundPosition] = "┤";
    cells[at(interval.mean)] = "●";
  }
  const track = cells.join("");
  return (
    dim(track.slice(0, lowerBoundPosition)) +
    color(track.slice(lowerBoundPosition, upperBoundPosition + 1)) +
    dim(track.slice(upperBoundPosition + 1))
  );
}

// log scale: tasks span ~140 to ~450k ops/sec, so linear bars would flatten
// everything but the fastest group
function renderThroughputBars(tasks: Record<string, TaskStatistics>): void {
  const names = Object.keys(tasks);
  if (names.length === 0) {
    return;
  }
  const nameWidth = Math.max(...names.map((name) => name.length));
  const logarithms = names.map((name) =>
    Math.log10(tasks[name].operationsPerSecond),
  );
  const logarithmLowerBound = Math.min(...logarithms);
  const logarithmUpperBound = Math.max(...logarithms);
  console.log("");
  console.log("throughput — operations per second");
  explain([
    "longer bar = faster (log scale: small bar gaps are big speed gaps)",
    "±% = sampling wobble — smaller is more trustworthy",
  ]);
  console.log(
    `  • bar color = stability: ${green(
      `steady ≤${STABILITY_STEADY_PERCENT}%`,
    )} · ${yellow(`moderate ≤${STABILITY_MODERATE_PERCENT}%`)} · ${red(
      "jittery above",
    )}`,
  );
  for (const name of names) {
    const task = tasks[name];
    const fraction =
      logarithmUpperBound > logarithmLowerBound
        ? (Math.log10(task.operationsPerSecond) - logarithmLowerBound) /
          (logarithmUpperBound - logarithmLowerBound)
        : 1;
    const filled = Math.max(1, Math.round(fraction * BAR_WIDTH));
    const stability = stabilityPaint(task.relativeMarginOfErrorPercent);
    const bar =
      stability("█".repeat(filled)) + dim("░".repeat(BAR_WIDTH - filled));
    const operationsPerSecondLabel = Math.round(task.operationsPerSecond)
      .toLocaleString("en-US")
      .padStart(9);
    const relativeMarginOfErrorLabel = stability(
      `±${task.relativeMarginOfErrorPercent.toFixed(1)}%`.padStart(7),
    );
    console.log(
      `  ${name.padEnd(
        nameWidth,
      )}  ${bar}  ${operationsPerSecondLabel} ${relativeMarginOfErrorLabel}`,
    );
  }
}

// terminal version of the "same scatter, shrinking bracket" picture: every
// lane shares ONE percent scale centered on each task's own mean, so rows
// are directly comparable even across apples-and-oranges tasks (deviation
// from your own mean is dimensionless). Dots = individual runs (colored by
// deviation band; ○ marks the first, usually-cold run), │ = the task's
// mean, ├ ┤ = the 95% CI of the mean — caps tighten with --runs while the
// scatter does not. Rows sort noisiest-first for triage.
function renderRunSpread(allRuns: RunResults[], current: RunResults): void {
  const names = Object.keys(current.tasks).filter(
    (name) => name !== REFERENCE_TASK,
  );
  if (names.length === 0) {
    return;
  }
  const rows = names.map((name) => {
    const stats = current.tasks[name];
    const mean = stats.normalized ?? 0;
    const values = allRuns.map((run) => run.tasks[name].normalized ?? 0);
    const deviations = values.map((value) =>
      mean > 0 ? (value / mean - 1) * 100 : 0,
    );
    return {
      name,
      mean,
      relativeMarginOfErrorPercent:
        stats.normalizedRelativeMarginOfErrorPercent ?? 0,
      deviations,
    };
  });
  rows.sort(
    (a, b) => b.relativeMarginOfErrorPercent - a.relativeMarginOfErrorPercent,
  );
  const scaleMaximum = Math.max(
    1,
    ...rows.map((row) =>
      Math.max(
        row.relativeMarginOfErrorPercent,
        ...row.deviations.map(Math.abs),
      ),
    ),
  );
  const nameWidth = Math.max(...names.map((name) => name.length));
  const center = Math.floor(SPREAD_LANE_WIDTH / 2);
  const at = (percent: number) =>
    center +
    Math.max(
      -center,
      Math.min(center, Math.round((percent / scaleMaximum) * center)),
    );
  console.log("");
  console.log(
    `normalized score per run — each dot is one of ${
      allRuns.length
    } runs, every lane spans ±${scaleMaximum.toFixed(1)}% of its task's mean`,
  );
  explain([
    "one shared scale: wider dot scatter = jitterier task — rows sorted noisiest first for triage",
  ]);
  console.log(
    `  • dots = individual runs, colored by deviation from their mean: ${green(
      `≤${STABILITY_STEADY_PERCENT}%`,
    )} · ${yellow(`≤${STABILITY_MODERATE_PERCENT}%`)} · ${red(
      "beyond",
    )}; ${cyan("○")} = first run (often cold)`,
  );
  explain([
    "│ = the mean · ├ ┤ = how precisely that mean is known (the ±% column) — more --runs pulls the caps inward",
    "the dot scatter is the code's actual jitter — more runs measure it better but don't shrink it",
  ]);
  for (const row of rows) {
    const cells: string[] = new Array(SPREAD_LANE_WIDTH).fill("·");
    const paints: ((text: string) => string)[] = new Array(
      SPREAD_LANE_WIDTH,
    ).fill(dim);
    const capPaint = stabilityPaint(row.relativeMarginOfErrorPercent);
    // the mean line stays un-dimmed so the lane has a visible anchor
    cells[center] = "│";
    paints[center] = (text) => text;
    if (at(row.relativeMarginOfErrorPercent) !== center) {
      cells[at(-row.relativeMarginOfErrorPercent)] = "├";
      paints[at(-row.relativeMarginOfErrorPercent)] = capPaint;
      cells[at(row.relativeMarginOfErrorPercent)] = "┤";
      paints[at(row.relativeMarginOfErrorPercent)] = capPaint;
    }
    row.deviations.forEach((deviation, runIndex) => {
      const position = at(deviation);
      // first run is marked distinctly: it is the usual cold-JIT outlier
      cells[position] = runIndex === 0 ? "○" : "●";
      paints[position] = stabilityPaint(Math.abs(deviation));
    });
    const lane = cells.map((cell, index) => paints[index](cell)).join("");
    const normalized = row.mean.toFixed(4).padStart(10);
    const confidenceIntervalLabel = capPaint(
      `±${row.relativeMarginOfErrorPercent.toFixed(1)}%`.padStart(7),
    );
    console.log(
      `  ${row.name.padEnd(
        nameWidth,
      )}  ${normalized} ${confidenceIntervalLabel}  ${lane}`,
    );
  }
}

/**
 * Two-gate comparison per task:
 *
 * 1. statistical -- is the change distinguishable from sampling error? Each
 *    run's normalized value carries a 95% confidence interval (normalizedRelativeMarginOfErrorPercent).
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
    runs,
  }: {
    strict: boolean;
    threshold: number;
    filter: string | null;
    runs: number;
  },
): void {
  if (baseline.schemaVersion !== BASELINE_SCHEMA_VERSION) {
    console.error(
      `baseline.json has schemaVersion ${baseline.schemaVersion}; expected ${BASELINE_SCHEMA_VERSION}. Regenerate it with \`npm run benchmark:update\`.`,
    );
    process.exit(1);
  }
  const regressions: string[] = [];
  let insensitive = 0;
  console.log("");
  console.log(
    `compare vs baseline from ${baseline.generatedAt} (node ${baseline.node})`,
  );
  explain([
    "each lane = 95% CI of normalized speed (\u25cf mean) \u2014 further right is faster/better",
    "overlapping lanes \u2192 no provable change (~noise)",
    `\u0394 = % vs baseline (positive is better); must beat noise \u00b1 and the ${threshold}% threshold for a verdict`,
    "noise \u00b1 = smallest provable change \u2014 smaller is sharper (raise --runs to sharpen)",
    "\u00b1 per lane = that side's CI width: current much narrower than baseline = consistency improved (hint, not a verdict)",
  ]);
  console.log(
    `  \u2022 current lane color: ${red("regression")} \u00b7 ${green(
      "improved",
    )} \u00b7 ${yellow("within threshold")} \u00b7 ${cyan("~noise")}; ${magenta(
      "magenta \u00b1",
    )} = noise floor above threshold`,
  );
  if (baseline.runs !== undefined && baseline.runs !== runs) {
    console.log(
      yellow(
        `  \u2022 run counts differ (baseline ${baseline.runs}, current ${runs}) \u2014 \u00b1 widths partly reflect sampling effort; the consistency hint corrects for this, the raw \u00b1 columns do not`,
      ),
    );
  }
  console.log("");
  for (const [name, base] of Object.entries(baseline.tasks)) {
    if (name === REFERENCE_TASK) continue;
    // a filtered run intentionally skips tasks; don't report those as removed
    if (filter !== null && !name.includes(filter)) continue;
    const task = current.tasks[name];
    if (
      !task ||
      task.normalized === undefined ||
      task.normalizedRelativeMarginOfErrorPercent === undefined
    ) {
      console.log(`${verdictLabel(Verdicts.removed)} ${name}`);
      continue;
    }
    const deltaPercent = (task.normalized / base.normalized - 1) * 100;
    const baseHalfWidth =
      base.normalized * (base.normalizedRelativeMarginOfErrorPercent / 100);
    const currentHalfWidth =
      task.normalized * (task.normalizedRelativeMarginOfErrorPercent / 100);
    const noiseFloorPercent =
      ((baseHalfWidth + currentHalfWidth) / base.normalized) * 100;
    const significant = Math.abs(deltaPercent) > noiseFloorPercent;
    const material = Math.abs(deltaPercent) >= threshold;
    const verdict: Verdict = !significant
      ? Verdicts.noise
      : !material
      ? Verdicts.within_threshold
      : deltaPercent < 0
      ? Verdicts.regression
      : Verdicts.improved;
    if (noiseFloorPercent > threshold) {
      insensitive++;
    }
    if (verdict === Verdicts.regression) {
      regressions.push(name);
    }
    const baseInterval = intervalOf(
      base.normalized,
      base.normalizedRelativeMarginOfErrorPercent,
    );
    const currentInterval = intervalOf(
      task.normalized,
      task.normalizedRelativeMarginOfErrorPercent,
    );
    const scaleLowerBound = Math.min(
      baseInterval.lowerBound,
      currentInterval.lowerBound,
    );
    const scaleUpperBound = Math.max(
      baseInterval.upperBound,
      currentInterval.upperBound,
    );
    const margin =
      (scaleUpperBound - scaleLowerBound) * 0.05 || scaleUpperBound * 0.01 || 1;
    const emphasis = VerdictEmphasisPaint[verdict];
    const deltaText = emphasis(
      `\u0394 ${deltaPercent >= 0 ? "+" : ""}${deltaPercent.toFixed(1)}%`,
    );
    // magenta marks the abnormal case: the comparison itself is too blunt to
    // detect threshold-sized changes for this task
    const noisePaint = noiseFloorPercent > threshold ? magenta : dim;
    const noiseText = noisePaint(
      `vs noise \u00b1${noiseFloorPercent.toFixed(1)}%`,
    );
    // consistency hint: a much narrower/wider current CI than the baseline's
    // means the change altered run-to-run variability, not just the mean.
    // CI width = t(n-1)\u00b7sd/\u221an, so each side is converted back to its
    // underlying spread (sd \u221d width\u00b7\u221an/t) before comparing \u2014 otherwise a
    // higher --runs on one side fakes a consistency change. Spread estimates
    // from a handful of runs are themselves noisy, so only call it out
    // beyond a conservative ratio (\u2248 what an F-test needs at 5 runs).
    // Requires the per-side run count, and CONSISTENCY_MINIMUM_RUNS runs (at 1
    // run the \u00b1 is a within-run margin, not a between-run spread; at 2 the
    // spread estimate has a single degree of freedom and swings wildly).
    let consistencyText = "";
    if (
      baseline.runs !== undefined &&
      baseline.runs >= CONSISTENCY_MINIMUM_RUNS &&
      runs >= CONSISTENCY_MINIMUM_RUNS &&
      base.normalizedRelativeMarginOfErrorPercent > 0 &&
      task.normalizedRelativeMarginOfErrorPercent > 0
    ) {
      const confidenceIntervalWidthToSpread = (
        relativeMarginOfErrorPercent: number,
        runCount: number,
      ) =>
        (relativeMarginOfErrorPercent * Math.sqrt(runCount)) /
        studentTCriticalValue95(runCount - 1);
      const ratio =
        confidenceIntervalWidthToSpread(
          base.normalizedRelativeMarginOfErrorPercent,
          baseline.runs,
        ) /
        confidenceIntervalWidthToSpread(
          task.normalizedRelativeMarginOfErrorPercent,
          runs,
        );
      if (ratio >= CONSISTENCY_NOTE_RATIO) {
        consistencyText = ` ${green(
          `\u00b7 consistency \u00d7${ratio.toFixed(1)} steadier`,
        )}`;
      } else if (ratio <= 1 / CONSISTENCY_NOTE_RATIO) {
        consistencyText = ` ${red(
          `\u00b7 consistency \u00d7${(1 / ratio).toFixed(1)} noisier`,
        )}`;
      }
    }
    console.log(
      `${verdictLabel(
        verdict,
      )} ${name}  ${deltaText} ${noiseText}${consistencyText}`,
    );
    console.log(
      `${LANE_INDENT}baseline ${base.normalized
        .toFixed(4)
        .padStart(10)} ${stabilityPaint(
        base.normalizedRelativeMarginOfErrorPercent,
      )(
        `\u00b1${base.normalizedRelativeMarginOfErrorPercent.toFixed(
          1,
        )}%`.padStart(7),
      )}  ${renderLane(
        baseInterval,
        scaleLowerBound - margin,
        scaleUpperBound + margin,
        dim,
      )}`,
    );
    console.log(
      `${LANE_INDENT}current  ${task.normalized
        .toFixed(4)
        .padStart(10)} ${stabilityPaint(
        task.normalizedRelativeMarginOfErrorPercent,
      )(
        `\u00b1${task.normalizedRelativeMarginOfErrorPercent.toFixed(
          1,
        )}%`.padStart(7),
      )}  ${renderLane(
        currentInterval,
        scaleLowerBound - margin,
        scaleUpperBound + margin,
        emphasis,
      )}`,
    );
    console.log("");
  }
  for (const name of Object.keys(current.tasks)) {
    if (name !== REFERENCE_TASK && !baseline.tasks[name]) {
      console.log(`${verdictLabel(Verdicts.added)} ${name}`);
    }
  }
  // Normalization absorbs *uniform* machine slowdown, but drift is rarely
  // uniform (GC/async-heavy tasks throttle harder), so large reference drift
  // means conditions changed between runs and borderline verdicts are suspect.
  if (
    baseline.referenceOperationsPerSecond &&
    current.referenceOperationsPerSecond
  ) {
    const driftPercent =
      (current.referenceOperationsPerSecond /
        baseline.referenceOperationsPerSecond -
        1) *
      100;
    const driftPaint =
      Math.abs(driftPercent) <= DRIFT_ACCEPTABLE_PERCENT
        ? green
        : Math.abs(driftPercent) <= DRIFT_CAUTION_PERCENT
        ? yellow
        : magenta;
    console.log(
      `Reference-task raw throughput drift since baseline: ${driftPaint(
        `${driftPercent >= 0 ? "+" : ""}${driftPercent.toFixed(1)}%`,
      )}.`,
    );
    if (Math.abs(driftPercent) > DRIFT_CAUTION_PERCENT) {
      console.warn(
        magenta(
          "Machine conditions differ noticeably from the baseline run (thermal throttling, background load, or a different machine). Treat borderline verdicts with suspicion; re-run when idle or regenerate the baseline.",
        ),
      );
    }
  }
  if (insensitive > 0) {
    console.warn(
      magenta(
        `Note: ${insensitive} task(s) have a noise floor above ${threshold}% -- a change of that size could hide in noise there. Increase --runs on both sides (and regenerate the baseline) for more sensitivity.`,
      ),
    );
  }
  if (regressions.length) {
    console.error(
      bold(
        red(`${regressions.length} regression(s): ${regressions.join(", ")}.`),
      ),
    );
    if (strict) process.exit(1);
  } else {
    console.log(green("No regressions."));
  }
}

// two-sided 95% critical values of Student's t, indexed by degrees of freedom
const STUDENT_T_CRITICAL_VALUES_95_TWO_SIDED = [
  12.71, 4.3, 3.18, 2.78, 2.57, 2.45, 2.36, 2.31, 2.26, 2.23, 2.2, 2.18, 2.16,
  2.14, 2.13,
];
function studentTCriticalValue95(degreesOfFreedom: number): number {
  return degreesOfFreedom <= 0
    ? Infinity
    : degreesOfFreedom <= STUDENT_T_CRITICAL_VALUES_95_TWO_SIDED.length
    ? STUDENT_T_CRITICAL_VALUES_95_TWO_SIDED[degreesOfFreedom - 1]
    : 1.96;
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
  const runCount = runs.length;
  const tasks: Record<string, TaskStatistics> = {};
  for (const name of Object.keys(runs[0].tasks)) {
    const perRun = runs.map((run) => run.tasks[name]);
    const normalizedValues = perRun.map((task) => task.normalized ?? 0);
    const normalizedMean = average(normalizedValues);
    const variance =
      normalizedValues.reduce(
        (sum, value) => sum + (value - normalizedMean) ** 2,
        0,
      ) /
      (runCount - 1);
    const confidenceIntervalHalfWidth =
      studentTCriticalValue95(runCount - 1) * Math.sqrt(variance / runCount);
    tasks[name] = {
      operationsPerSecond: average(
        perRun.map((task) => task.operationsPerSecond),
      ),
      mean: average(perRun.map((task) => task.mean)),
      percentile99: average(perRun.map((task) => task.percentile99)),
      relativeMarginOfErrorPercent: average(
        perRun.map((task) => task.relativeMarginOfErrorPercent),
      ),
      samples: perRun.reduce((sum, task) => sum + task.samples, 0),
      normalized: normalizedMean,
      normalizedRelativeMarginOfErrorPercent:
        normalizedMean > 0
          ? (confidenceIntervalHalfWidth / normalizedMean) * 100
          : 0,
    };
  }
  return {
    referenceOperationsPerSecond: average(
      runs.map((run) => run.referenceOperationsPerSecond ?? 0),
    ),
    tasks,
  };
}

async function main(): Promise<void> {
  const commandLineArguments = parseCommandLineArguments(process.argv);
  let entries = loadScenarios();
  if (commandLineArguments.filter !== null) {
    const filter = commandLineArguments.filter;
    entries = entries.filter(
      (entry) => entry.name === REFERENCE_TASK || entry.name.includes(filter),
    );
  }

  const allRuns: RunResults[] = [];
  for (let run = 0; run < commandLineArguments.runs; run++) {
    const benchmarkSuite = new Bench({
      time: commandLineArguments.time,
      warmupTime: WARMUP_TIME_MILLISECONDS,
    });
    for (const { name, fn, options } of entries) {
      benchmarkSuite.add(name, fn, options);
    }
    await benchmarkSuite.warmup();
    await benchmarkSuite.run();
    allRuns.push(collectResults(benchmarkSuite));
    if (commandLineArguments.runs > 1) {
      console.error(`run ${run + 1}/${commandLineArguments.runs} complete`);
    }
    if (!commandLineArguments.json && run === commandLineArguments.runs - 1) {
      console.table(benchmarkSuite.table());
    }
  }

  const current = aggregateRuns(allRuns);

  if (!commandLineArguments.json) {
    renderThroughputBars(current.tasks);
    if (commandLineArguments.runs > 1) {
      renderRunSpread(allRuns, current);
    }
  }

  if (commandLineArguments.json) {
    console.log(
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          node: process.version,
          runs: commandLineArguments.runs,
          referenceOperationsPerSecond: current.referenceOperationsPerSecond,
          tasks: current.tasks,
        },
        null,
        2,
      ),
    );
  }

  if (commandLineArguments.updateBaseline) {
    const baseline: BaselineFile = {
      schemaVersion: BASELINE_SCHEMA_VERSION,
      generatedAt: new Date().toISOString(),
      node: process.version,
      runs: commandLineArguments.runs,
      referenceOperationsPerSecond: current.referenceOperationsPerSecond,
      tasks: {},
    };
    let noisy = 0;
    for (const [name, task] of Object.entries(current.tasks)) {
      baseline.tasks[name] = {
        operationsPerSecond: task.operationsPerSecond,
        mean: task.mean,
        normalized: task.normalized ?? 0,
        normalizedRelativeMarginOfErrorPercent:
          task.normalizedRelativeMarginOfErrorPercent ?? 0,
        samples: task.samples,
      };
      if (
        name !== REFERENCE_TASK &&
        (task.normalizedRelativeMarginOfErrorPercent ?? 0) >
          commandLineArguments.threshold
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
        `Note: ${noisy} task(s) were captured with a margin of error above ${commandLineArguments.threshold}% — comparisons against them will have a high noise floor. Consider regenerating with more --runs.`,
      );
    }
  }

  if (commandLineArguments.compare) {
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
      strict: commandLineArguments.strict,
      threshold: commandLineArguments.threshold,
      filter: commandLineArguments.filter,
      runs: commandLineArguments.runs,
    });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
