# Live documentation examples

Each directory here is a self-contained, type-safe example rendered in the
docs by the `LiveExample` component (`src/components/LiveExample`):

```
src/examples/<example-name>/
  example.ts   # the code shown by default; imports the entity from ./entity
  entity.ts    # the Entity instantiation; imports the table name from ./table
  table.ts     # the DynamoDB table definition + exported table name
```

Usage inside an `.mdx` page:

```mdx
import LiveExample from "../../../components/LiveExample/LiveExample.astro";

<LiveExample name="put-store-location" />
```

The control renders each file as a tab and executes `example.ts` in the
browser against a mocked ElectroDB client
(`public/scripts/electrodb-playground.js`, built from `playground/` at the
repo root via `npm run build`) to display the generated DynamoDB parameters.
It also links to the playground (electrodb.fun) preloaded with the example's
files.

Because these are real TypeScript modules compiled by the site's `check`
step, examples cannot silently drift out of sync with the ElectroDB API: if
an example stops compiling, the docs build fails. An example that needs a
schema tweak can modify its own `entity.ts`/`table.ts` copies without
affecting other pages.

## Testing

`npm run test:examples` (run in CI by `.github/workflows/docs.yml` alongside
`npm run check` and the site build) executes every example against the
repository's own ElectroDB with a mocked DynamoDB client and fails if any
example throws.

Examples that are *supposed* to throw — pages that intentionally demonstrate
an error — opt in by adding an `expected-error.txt` file (containing a short
explanation) to their directory; for those, completing without an error is
the test failure. The file is not rendered by the control.
