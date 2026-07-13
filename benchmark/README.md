# ElectroDB benchmarks

Manual/local micro-benchmarks for ElectroDB's hot paths, built on
[tinybench](https://github.com/tinylibs/tinybench). They are **not** part of
the test suite or CI — nothing here gates a build.

## Running

```sh
npm run benchmark           # run everything, print a table
npm run benchmark:json      # machine-readable results (operations per second, mean, 99th percentile, margin of error)
npm run benchmark:update    # rewrite baseline.json from a fresh run
npm run benchmark:compare   # run + diff against baseline.json (advisory)
```

`benchmark:compare` always exits 0 (advisory); add `--strict` to exit 1 on
regressions — that one flag is the hook for promoting the comparison to CI
later:

```sh
npx ts-node ./benchmark/run.ts --compare --strict
```

Other flags: `--filter <substring>` runs a subset while iterating,
`--threshold <percent>` sets the practical-significance bar,
`--time <milliseconds>` sets within-run sampling time per task, and
`--runs <count>` repeats the whole suite that many times to derive error bars from the
between-run spread.

All defaults and tuning knobs — sampling (`runs`/`time`/warmup), the verdict
gates, the reference task, color bands, and lane widths — live in
[`config.ts`](./config.ts), each documented with how it is used and how the
knobs interact (the file header walks the whole pipeline).

Human-readable output includes terminal visualizations (suppressed by
`--json`; colors respect `NO_COLOR`/non-TTY): plain runs print log-scale
throughput bars; multi-run invocations plot each run's normalized score as a
dot, with every task's lane sharing one percent scale centered on that
task's own mean (deviation-from-own-mean is dimensionless, so rows are
comparable across otherwise apples-and-oranges tasks — sorted noisiest
first for triage, with ├ ┤ marking the CI of the mean over the scatter);
and compare draws each task's baseline and current confidence intervals as
two lanes on a shared scale — the overlap test from the section below, made
literal. Color carries
meaning everywhere: green = good (improved, steady sampling), red = bad
(regression, jittery sampling), yellow = caution (real-but-small change,
moderate variance), cyan = neutral measurement, and magenta = abnormal —
the instrument itself is suspect (a task's noise floor exceeds the
threshold, or machine conditions drifted since the baseline).

```
~noise            params-chain/get  Δ -3.9% vs noise ±11.8%
                  baseline   160.1759   ±5.4%  ··········├──────────────●───────────────┤··
                  current    153.8809   ±6.1%  ··├─────────────●────────────┤··············
```

Each lane also prints its own CI width (`±`), which is the consistency
signal: a current lane much narrower than its baseline lane means the change
made the benchmark steadier run-to-run, not just faster. When the underlying
spreads differ by ≥2.5x the header calls it out (`· consistency ×N steadier`
/ `noisier`) — a deliberate hint rather than a gated verdict, since spread
estimates from a handful of runs are themselves noisy. Note that a raw CI
width shrinks with more `--runs` regardless of the code (`width =
t(n−1)·sd/√n` — sampling effort, not steadiness), so the baseline records
its run count and the hint converts both sides back to underlying spread
before comparing; compare also warns when the two sides used different
`--runs`.

## Baseline + normalization

Raw ops/sec is machine-dependent, so the committed `baseline.json` stores each
task's throughput **normalized** to a fixed reference task
(`reference/parse-500-items`, a representative formatting workload) that runs
with every invocation: `normalized = task operations per second ÷ reference operations per second`. Comparing
normalized values makes the baseline meaningful across reasonably similar
machines; for precise A/B work, regenerate the baseline on your own machine
first (`npm run benchmark:update`), apply your change, then
`npm run benchmark:compare`.

## Interpreting a compare: is the difference significant?

Micro-benchmark deltas are meaningless without an error model, so every
compare applies **two gates** per task and prints a verdict:

1. **Statistical — is the change real?** Both the baseline and the current
   measurement carry a 95% confidence interval, and a change counts as _real_
   only when the two intervals do **not** overlap. The table prints this as
   the task's **noise ±%** — if `|Δ%|` is below it, the verdict is `~noise`
   no matter how the raw numbers look. Where the interval comes from matters:
   - With `--runs > 1` (the default for compare/update) the suite executes
     N times and the interval is a t-based CI of the normalized value's
     **between-run spread**. This is the trustworthy estimate: it captures
     GC phasing, JIT state, and thermal drift, which dominate for long
     async tasks (the pagination scenarios can swing ±20% between runs
     while their within-run margin reads ±1%).
   - With `--runs 1` it falls back to tinybench's within-run relative margin of error, combined
     with the reference task's (combining both sides as `√(taskMargin² + referenceMargin²)`, since a
     normalized value is a ratio of two measurements). Fine for quick
     iteration; too optimistic for decisions.
2. **Practical — is it big enough to care?** A real change must also exceed
   `--threshold` (default 5%) to be labeled `REGRESSION` or `improved`;
   otherwise it reports as `within threshold`.

| Verdict            | Meaning                                                        |
| ------------------ | -------------------------------------------------------------- |
| `REGRESSION`       | Real (beats the noise floor) **and** ≥ threshold slower        |
| `improved`         | Real **and** ≥ threshold faster                                |
| `within threshold` | Real, but smaller than the threshold — judgment call           |
| `~noise`           | Indistinguishable from sampling error — not evidence of change |

### Evaluating one of your own changes

```sh
git stash                     # or check out the pre-change tree
npm run benchmark:update      # capture the "before" baseline
git stash pop
npm run benchmark:compare     # verdicts tell you if the change is real
```

Practical notes:

- If a task you care about shows a high noise floor (the runner warns when it
  exceeds the threshold), increase repetitions on **both** sides, e.g.
  `--runs 8`. More runs shrink the between-run confidence interval, which is
  the only honest way to detect small differences; `--time` only tightens
  the (already optimistic) within-run estimate.
- The compare prints the reference task's raw throughput drift since the
  baseline. Normalization absorbs uniform machine slowdown, but drift is
  rarely uniform — when the drift is large the runner warns and borderline
  verdicts deserve suspicion.
- The statistical gate assumes both sides came from the same machine under
  broadly similar load. Close heavy apps, and re-run a suspicious result once
  before believing it — two consistent verdicts beat one.
- The noise-floor test is deliberately conservative (CI overlap). A `~noise`
  verdict doesn't prove there is no difference — only that this run can't
  detect one at its current sensitivity.

## Adding a scenario

Drop a file matching `benchmark/scenarios/*.benchmark.ts` that default-exports an
array of entries — there is no registration list to edit:

```ts
import type { ScenarioEntry } from "../run";
import { makeFixtureEntity } from "../../test/fixtures/entities";

const entity = makeFixtureEntity();

const scenarios: ScenarioEntry[] = [
  {
    name: "my-scenario/some-task", // group/task; sizes get their own task names
    fn: () => entity.query.records({ org: "org1" }).params(),
    // opts: optional tinybench task options (beforeAll/beforeEach/...)
  },
];

export default scenarios;
```

Conventions:

- Do setup (entities, stored items, mock clients) at module scope or in
  `opts.beforeAll` so it stays outside the timed region; `fn` should measure
  only the operation under test. `fn` may be async.
- Express sizes as separate named tasks (`parse-format/1000-items`) rather
  than parameters, so the baseline tracks each size independently.
- Reuse `test/fixtures/` (mock clients, fixture entities) rather than talking
  to a real DynamoDB — benchmarks must run offline.
