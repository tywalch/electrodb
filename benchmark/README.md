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

`benchmark:compare` flags a task as a regression when its normalized
throughput drops more than 20% below the baseline. It always exits 0
(advisory); add `--strict` to exit 1 on regressions — that one flag is the
hook for promoting the comparison to CI later:

```sh
npx ts-node ./benchmark/run.ts --compare --strict
```

You can also run a subset while iterating:

```sh
npx ts-node ./benchmark/run.ts --filter pagination
```

## Baseline + normalization

Raw ops/sec is machine-dependent, so the committed `baseline.json` stores each
task's throughput **normalized** to a fixed reference task
(`reference/parse-500-items`, a representative formatting workload) that runs
with every invocation: `normalized = task.hz / referenceHz`. Comparing
normalized values makes the baseline meaningful across reasonably similar
machines; for precise A/B work, regenerate the baseline on your own machine
first (`npm run benchmark:update`), apply your change, then
`npm run benchmark:compare`.

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
