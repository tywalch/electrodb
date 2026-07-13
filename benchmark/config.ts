/**
 * Tuning knobs for the benchmark runner, grouped by the pipeline stage they
 * affect. How they play together, end to end:
 *
 *   1. sampling    Each invocation repeats the whole suite `--runs` times
 *                  (DEFAULT_DECISION_RUNS for compare/update, 1 otherwise);
 *                  within each run tinybench warms a task for
 *                  WARMUP_TIME_MILLISECONDS and then samples it for `--time`
 *                  milliseconds (DEFAULT_SAMPLING_TIME_MILLISECONDS).
 *                  RUNS buys narrower between-run confidence intervals — the
 *                  error bars every decision is made with. TIME buys steadier
 *                  within-run numbers — mostly cosmetic at runs > 1 (it feeds
 *                  the stability colors and the runs=1 fallback interval).
 *   2. normalize   Every task's operations/second is divided by
 *                  REFERENCE_TASK's, so stored scores are machine-portable
 *                  ratios.
 *   3. verdicts    compare labels a task REGRESSION/improved only when |Δ|
 *                  beats BOTH the measured noise floor (from the two
 *                  confidence intervals — shrinks as runs grow) AND
 *                  DEFAULT_THRESHOLD_PERCENT. CONSISTENCY_NOTE_RATIO and
 *                  CONSISTENCY_MINIMUM_RUNS separately gate the
 *                  spread-change hint. DRIFT_* only annotate machine
 *                  conditions; they never change a verdict.
 *   4. rendering   STABILITY_* bands pick green/yellow/red for ± values, and
 *                  the *_WIDTH knobs size the ASCII lanes and bars.
 *
 * Rules of thumb: to detect smaller effects raise --runs (not --time); to
 * make verdicts stricter or looser change DEFAULT_THRESHOLD_PERCENT;
 * everything else is presentation.
 */

// ---------------------------------------------------------------------------
// sampling — how much data an invocation collects
// ---------------------------------------------------------------------------

/**
 * Whole-suite repetitions when `--runs` is not given to compare/update
 * (plain/exploratory runs default to 1). This is the dominant cost AND the
 * dominant sensitivity lever: the between-run 95% confidence interval
 * shrinks roughly as t(n−1)/√n, so 5→10 runs is ~1.7x sharper, each
 * doubling ~1.5x more. The consistency hint needs CONSISTENCY_MINIMUM_RUNS
 * on both sides to fire at all.
 */
export const DEFAULT_DECISION_RUNS = 10;

/**
 * tinybench sampling window per task per run, milliseconds, when `--time` is
 * not given. Total invocation cost ≈ runs × tasks × (sampling time +
 * WARMUP_TIME_MILLISECONDS). Raising it tightens the within-run margin of
 * error — which colors the throughput-bar stability and is the confidence
 * interval fallback at runs=1 — but does NOT tighten the between-run
 * interval that verdicts use; raise runs for that.
 */
export const DEFAULT_SAMPLING_TIME_MILLISECONDS = 500;

/**
 * tinybench per-task warmup before sampling starts, milliseconds, within
 * every run. This warms a task immediately before ITS measurement; it does
 * not prevent the first whole-suite run from being JIT-cold relative to
 * later runs — that effect is what the ○ marker in the spread view shows.
 */
export const WARMUP_TIME_MILLISECONDS = 100;

// ---------------------------------------------------------------------------
// normalization — what raw operations/second is divided by
// ---------------------------------------------------------------------------

/**
 * The yardstick task every score is normalized against
 * (normalized = task speed ÷ reference speed). It runs in every invocation,
 * is excluded from verdicts/spread rows, and its raw drift between baseline
 * and compare is reported as the machine-condition indicator. Pick a
 * workload representative of the library's hot path; changing it invalidates
 * committed baselines (regenerate with benchmark:update).
 */
export const REFERENCE_TASK = "reference/parse-500-items";

// ---------------------------------------------------------------------------
// verdict gates — when compare is allowed to claim something
// ---------------------------------------------------------------------------

/**
 * Practical-significance gate, percent, when `--threshold` is not given.
 * A delta must beat BOTH the statistical noise floor and this value to earn
 * REGRESSION/improved; real-but-smaller deltas report "within threshold".
 * It also drives the undersensitivity warnings: tasks whose noise floor
 * exceeds it are flagged magenta (the run cannot detect changes this small).
 */
export const DEFAULT_THRESHOLD_PERCENT = 5;

/**
 * Underlying-spread ratio before compare calls out a consistency change
 * (`consistency ×N steadier/noisier`). Spread estimates from a handful of
 * runs are themselves noisy — ~2.5x is what an F-test needs to clear 95%
 * confidence at 5 runs — so this stays conservative; lower it only if you
 * also raise runs. The hint converts confidence-interval widths back to
 * spread (spread ∝ width·√n/t(n−1)) so unequal --runs between baseline and
 * current do not fake a change.
 */
export const CONSISTENCY_NOTE_RATIO = 2.5;

/**
 * Minimum --runs on BOTH sides before the consistency hint may fire. A
 * spread estimated from 2 runs has one degree of freedom and swings wildly;
 * 3+ keeps the hint from reacting to pure sampling luck.
 */
export const CONSISTENCY_MINIMUM_RUNS = 3;

/**
 * Reference-task raw-drift bands, percent: ≤ ACCEPTABLE green, ≤ CAUTION
 * yellow, beyond magenta plus a warning. Drift means machine conditions
 * changed between baseline and compare (thermal, load); normalization
 * absorbs uniform drift but not GC/async-heavy skew, so large drift makes
 * borderline verdicts suspect. Advisory only — never changes a verdict.
 */
export const DRIFT_ACCEPTABLE_PERCENT = 3;
export const DRIFT_CAUTION_PERCENT = 10;

// ---------------------------------------------------------------------------
// rendering — colors and layout only; no effect on measurements or verdicts
// ---------------------------------------------------------------------------

/**
 * Variance bands, percent, for coloring ± values green/yellow/red across all
 * views (throughput bars, spread rows, compare lanes) and per-dot deviation
 * colors in the spread view. Purely presentational.
 */
export const STABILITY_STEADY_PERCENT = 3;
export const STABILITY_MODERATE_PERCENT = 10;

/** column width for verdict labels; lane rows indent to clear it */
export const VERDICT_LABEL_WIDTH = 17;

/** character width of compare confidence-interval lanes */
export const LANE_WIDTH = 44;

/** character width of spread-view lanes; odd so the mean has an exact center */
export const SPREAD_LANE_WIDTH = 45;

/** character width of throughput bars */
export const BAR_WIDTH = 28;

// ---------------------------------------------------------------------------
// wiring — not tuning knobs
// ---------------------------------------------------------------------------

/**
 * Bump when baseline.json's shape changes incompatibly; compare refuses
 * baselines with a different version and asks for benchmark:update.
 * (Version 3: field names spelled out — operationsPerSecond,
 * normalizedRelativeMarginOfErrorPercent, referenceOperationsPerSecond.)
 */
export const BASELINE_SCHEMA_VERSION = 3;
