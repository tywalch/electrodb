# ElectroDB benchmarks

Manual/local micro-benchmarks for ElectroDB's hot paths, built on
[tinybench](https://github.com/tinylibs/tinybench). They are **not** part of
the test suite or CI — nothing here gates a build.

## Running

```sh
npm run benchmark           # run everything, print a table
npm run benchmark:json      # machine-readable results (hz, mean, p99, rme)
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
`--threshold <pct>` sets the practical-significance bar (default 5),
`--time <ms>` sets within-run sampling time per task (default 500), and
`--runs <n>` repeats the whole suite n times to derive error bars from the
between-run spread (default 3 for compare/update, 1 for plain runs).

## Baseline + normalization

Raw ops/sec is machine-dependent, so the committed `baseline.json` stores each
task's throughput **normalized** to a fixed reference task
(`reference/parse-500-items`, a representative formatting workload) that runs
with every invocation: `normalized = task.hz / referenceHz`. Comparing
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
   - With `--runs 1` it falls back to tinybench's within-run `rme`, combined
     with the reference task's (`√(rme_task² + rme_reference²)`, since a
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
npm run benchmark:update      # capture the "before" baseline (3 runs)
git stash pop
npm run benchmark:compare     # verdicts tell you if the change is real
```

Practical notes:

- If a task you care about shows a high noise floor (the runner warns when it
  exceeds the threshold), increase repetitions on **both** sides:
  `--runs 5`. More runs shrink the between-run confidence interval, which is
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

Drop a file matching `benchmark/scenarios/*.bench.ts` that default-exports an
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
