#!/usr/bin/env node
/**
 * CI gate for the docs examples (src/examples/<dir>/), enforcing both type
 * correctness and runtime behavior against the repository's own ElectroDB.
 *
 * Runs directly under Node >= 23.6 (native type stripping; CI uses Node 24):
 * `node scripts/test-examples.ts`. Only erasable TypeScript syntax is used.
 * The script itself is type-checked by `npm run check`.
 *
 * An example that intentionally fails declares it in an optional
 * `expect.json` file in its directory (never displayed — the LiveExample
 * control only reads .ts files). Each key's value is the expected error
 * message (or a distinctive part of it — matching is by substring):
 *
 *   "typeError": "..."    — the example must FAIL type-checking with a
 *                           diagnostic containing this text. All other
 *                           examples must type-check cleanly (tsc resolves
 *                           "electrodb" to ../index.d.ts via tsconfig
 *                           paths, so examples check against the current
 *                           API).
 *   "thrownError": "..."  — executing example.ts must throw a plain
 *                           (non-ElectroDB) exception whose message
 *                           contains this text.
 *   "electroError": "..." — executing example.ts must throw an ElectroError
 *                           whose message contains this text. In the
 *                           browser the LiveExample control catches it and
 *                           renders the message (that display is the point
 *                           of such examples), so this script is the only
 *                           place the "it really does error" contract is
 *                           enforced.
 *
 * Examples with no expect.json must type-check cleanly and run without
 * errors of any kind.
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, resolve, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import ts from "typescript";

const here = dirname(fileURLToPath(import.meta.url));
const wwwRoot = resolve(here, "..");
const examplesRoot = resolve(wwwRoot, "src/examples");
const nodeRequire = createRequire(import.meta.url);

interface EntityOptions {
  table?: string;
  client?: unknown;
}

interface ElectroDBModule {
  Entity: new (schema: unknown, options?: EntityOptions) => object;
  ElectroError: new (...args: never[]) => Error;
}

// The repository's ElectroDB (www/scripts -> repo root)
const ElectroDB = nodeRequire(resolve(wwwRoot, "../index.js")) as ElectroDBModule;

const KINDS = ["typeError", "thrownError", "electroError"] as const;

type Kind = (typeof KINDS)[number];
/** Expected-error kinds mapped to the message text they must contain. */
type Expectation = Partial<Record<Kind, string>>;

function firstLine(err: unknown): string {
  return (err instanceof Error ? err.message : String(err)).split("\n")[0];
}

// ---------------------------------------------------------------------------
// Expectations: each dir's optional expect.json.
// ---------------------------------------------------------------------------

function collectExpectations(dirs: string[]): {
  expectations: Map<string, Expectation>;
  problems: string[];
} {
  const expectations = new Map<string, Expectation>();
  const problems: string[] = [];
  for (const name of dirs) {
    const path = join(examplesRoot, name, "expect.json");
    if (!existsSync(path)) continue;
    let parsed: unknown;
    try {
      parsed = JSON.parse(readFileSync(path, "utf8"));
    } catch (err) {
      problems.push(`${name}/expect.json is not valid JSON (${firstLine(err)})`);
      continue;
    }
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      problems.push(`${name}/expect.json must be a JSON object`);
      continue;
    }
    const expectation: Expectation = {};
    let valid = true;
    for (const [key, value] of Object.entries(parsed)) {
      if (!(KINDS as readonly string[]).includes(key)) {
        problems.push(
          `${name}/expect.json: unknown key "${key}" (allowed: ${KINDS.join(", ")})`,
        );
        valid = false;
      } else if (typeof value !== "string" || value.length === 0) {
        problems.push(
          `${name}/expect.json: "${key}" must be the expected error message (a non-empty string)`,
        );
        valid = false;
      } else {
        expectation[key as Kind] = value;
      }
    }
    if (valid) expectations.set(name, expectation);
  }
  return { expectations, problems };
}

// ---------------------------------------------------------------------------
// Type-check: one program over every dir without "typeError" (must be
// clean); individual programs assert the declared ones really do fail.
// ---------------------------------------------------------------------------

type Verdict = { ok: true; note?: string } | { ok: false; why: string };

function loadCompilerOptions(): ts.CompilerOptions {
  const configPath = resolve(wwwRoot, "tsconfig.json");
  const host: ts.ParseConfigFileHost = {
    ...ts.sys,
    onUnRecoverableConfigFileDiagnostic: (d) => {
      throw new Error(ts.flattenDiagnosticMessageText(d.messageText, " "));
    },
  };
  const parsed = ts.getParsedCommandLineOfConfigFile(configPath, {}, host);
  if (!parsed) {
    throw new Error(`unable to parse ${configPath}`);
  }
  return { ...parsed.options, noEmit: true };
}

function dirTsFiles(dir: string): string[] {
  return readdirSync(dir)
    .filter((name) => name.endsWith(".ts"))
    .map((name) => join(dir, name));
}

function formatDiagnostic(diagnostic: ts.Diagnostic): string {
  const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, " ");
  if (!diagnostic.file) return message;
  const { line } = diagnostic.file.getLineAndCharacterOfPosition(
    diagnostic.start ?? 0,
  );
  return `${relative(examplesRoot, diagnostic.file.fileName)}:${line + 1} ${message}`;
}

function typeCheck(
  dirs: string[],
  expectations: Map<string, Expectation>,
): Map<string, Verdict> {
  const options = loadCompilerOptions();
  const examplesPrefix = examplesRoot.replaceAll("\\", "/");
  const verdicts = new Map<string, Verdict>();
  const expectFail = dirs.filter((d) => expectations.get(d)?.typeError);
  const expectClean = dirs.filter((d) => !expectations.get(d)?.typeError);

  // One program for everything that must be clean.
  const program = ts.createProgram({
    rootNames: expectClean.flatMap((d) => dirTsFiles(join(examplesRoot, d))),
    options,
  });
  const errorsByDir = new Map<string, string[]>();
  for (const diagnostic of ts.getPreEmitDiagnostics(program)) {
    const fileName = diagnostic.file?.fileName;
    const dir = fileName?.startsWith(examplesPrefix)
      ? relative(examplesRoot, fileName).split("/")[0]
      : "(type-check setup)";
    errorsByDir.set(dir, [...(errorsByDir.get(dir) ?? []), formatDiagnostic(diagnostic)]);
  }
  for (const dir of expectClean) {
    const errors = errorsByDir.get(dir);
    verdicts.set(
      dir,
      errors
        ? {
            ok: false,
            why: `type errors — ${errors[0]}${errors.length > 1 ? ` (+${errors.length - 1} more)` : ""}`,
          }
        : { ok: true },
    );
  }
  const setup = errorsByDir.get("(type-check setup)");
  if (setup) {
    throw new Error(`type-check setup failed: ${setup[0]}`);
  }

  // Each declared type failure must actually fail, with the declared text.
  for (const dir of expectFail) {
    const expected = expectations.get(dir)?.typeError ?? "";
    const errors = ts
      .getPreEmitDiagnostics(
        ts.createProgram({ rootNames: dirTsFiles(join(examplesRoot, dir)), options }),
      )
      .filter((d) => d.file && d.file.fileName.startsWith(examplesPrefix))
      .map(formatDiagnostic);
    if (errors.length === 0) {
      verdicts.set(dir, {
        ok: false,
        why: 'expect.json declares "typeError" but the example type-checks cleanly',
      });
    } else if (!errors.some((e) => e.includes(expected))) {
      verdicts.set(dir, {
        ok: false,
        why: `type error message mismatch — expected "${expected}", got: ${errors[0]}`,
      });
    } else {
      verdicts.set(dir, { ok: true, note: "type error as documented" });
    }
  }
  return verdicts;
}

// ---------------------------------------------------------------------------
// Execute: mock client mirrors the browser playground; throws are
// classified as ElectroDB errors vs plain exceptions.
// ---------------------------------------------------------------------------

let clientCalls = 0;

function promiseCallback(results: unknown) {
  clientCalls += 1;
  return { promise: async () => results };
}

function createMockClient(table: string | undefined) {
  const tableKey = table ?? "";
  return {
    put: () => promiseCallback({}),
    delete: () => promiseCallback({}),
    update: () => promiseCallback({}),
    get: () => promiseCallback({ Item: {} }),
    query: () => promiseCallback({ Items: [] }),
    scan: () => promiseCallback({ Items: [] }),
    batchWrite: () => promiseCallback({ UnprocessedItems: { [tableKey]: [] } }),
    batchGet: () =>
      promiseCallback({
        Responses: { [tableKey]: [] },
        UnprocessedKeys: { [tableKey]: { Keys: [] } },
      }),
    transactWrite: () => ({ ...promiseCallback({}), on: () => {} }),
    transactGet: () => ({
      ...promiseCallback({ Responses: [] }),
      on: () => {},
    }),
    createSet: (value: unknown) => value,
  };
}

// Entities in example files are constructed without a client (the browser
// control injects a mocked one); do the same here so `.go()` executes.
class MockedEntity extends ElectroDB.Entity {
  constructor(schema: unknown, options: EntityOptions = {}) {
    super(schema, { ...options, client: createMockClient(options.table) });
  }
}

const electrodbModule = {
  ...ElectroDB,
  Entity: MockedEntity,
};

function transpile(source: string, fileName: string): string {
  return ts.transpileModule(source, {
    fileName,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2017,
      esModuleInterop: true,
    },
  }).outputText;
}

async function executeExample(dir: string): Promise<void> {
  const modules = new Map<string, string>();
  for (const file of dirTsFiles(dir)) {
    const name = relative(dir, file);
    modules.set(name, transpile(readFileSync(file, "utf8"), name));
  }
  const entry = modules.get("example.ts");
  if (entry === undefined) {
    throw new Error("missing example.ts");
  }

  const cache = new Map<string, { exports: Record<string, unknown> }>();
  const requireModule = (request: string): unknown => {
    if (request === "electrodb") return electrodbModule;
    const base = request.startsWith("./") ? request.slice(2) : "";
    const name = [base, `${base}.ts`].find((n) => modules.has(n));
    if (name === undefined) throw new Error(`Cannot find module '${request}'`);
    const cached = cache.get(name);
    if (cached) return cached.exports;
    const record = { exports: {} as Record<string, unknown> };
    cache.set(name, record);
    new Function("require", "module", "exports", modules.get(name) ?? "")(
      requireModule,
      record,
      record.exports,
    );
    return record.exports;
  };

  // The entry module is wrapped in an async function so examples can use
  // top-level await, mirroring how they appear in the documentation.
  const record = { exports: {} as Record<string, unknown> };
  await new Function(
    "require",
    "module",
    "exports",
    `return (async () => {\n${entry}\n})();`,
  )(requireModule, record, record.exports);
  // Give un-awaited `.go()` calls a beat to surface rejections.
  await new Promise((r) => setTimeout(r, 10));
}

async function runExample(name: string): Promise<unknown> {
  // Attribute un-awaited rejections to the example being executed
  // (examples run serially).
  const rejections: unknown[] = [];
  const onRejection = (reason: unknown) => rejections.push(reason);
  process.on("unhandledRejection", onRejection);
  let thrown: unknown = null;
  try {
    await executeExample(join(examplesRoot, name));
  } catch (err) {
    thrown = err;
  }
  process.off("unhandledRejection", onRejection);
  return thrown ?? rejections[0] ?? null;
}

function runtimeVerdict(thrown: unknown, expectation: Expectation): Verdict {
  const kind: Kind =
    thrown instanceof ElectroDB.ElectroError ? "electroError" : "thrownError";
  const labels: Record<Kind, string> = {
    typeError: "type error",
    thrownError: "exception",
    electroError: "ElectroDB error",
  };

  if (thrown === null) {
    const missing = (["electroError", "thrownError"] as const).find(
      (k) => expectation[k],
    );
    return missing
      ? {
          ok: false,
          why: `expect.json declares "${missing}" but the example completed without one`,
        }
      : { ok: true };
  }

  const expected = expectation[kind];
  if (expected === undefined) {
    return {
      ok: false,
      why: `${labels[kind]} (declare "${kind}" in expect.json if intended) — ${firstLine(thrown)}`,
    };
  }
  if (!String(thrown instanceof Error ? thrown.message : thrown).includes(expected)) {
    return {
      ok: false,
      why: `${labels[kind]} message mismatch — expected "${expected}", got: ${firstLine(thrown)}`,
    };
  }
  return { ok: true, note: `${labels[kind]} as documented` };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const dirs = readdirSync(examplesRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

const { expectations, problems } = collectExpectations(dirs);
if (problems.length > 0) {
  console.error("docs examples: configuration problems\n");
  for (const problem of problems) console.error(`  FAIL     ${problem}`);
  process.exit(1);
}

const typeVerdicts = typeCheck(dirs, expectations);

const lines: string[] = [];
const warnings: string[] = [];
let failures = 0;

for (const name of dirs) {
  const expectation = expectations.get(name) ?? {};
  const verdicts: Verdict[] = [typeVerdicts.get(name) ?? { ok: true }];

  clientCalls = 0;
  verdicts.push(runtimeVerdict(await runExample(name), expectation));

  const failed = verdicts.filter((v): v is { ok: false; why: string } => !v.ok);
  if (failed.length > 0) {
    failures += 1;
    lines.push(`  FAIL     ${name} — ${failed.map((v) => v.why).join("; ")}`);
  } else {
    const notes = verdicts.flatMap((v) => (v.ok && v.note ? [v.note] : []));
    lines.push(`  ok       ${name}${notes.length ? ` (${notes.join("; ")})` : ""}`);
    if (clientCalls === 0 && Object.keys(expectation).length === 0) {
      warnings.push(
        `  warn     ${name} — made no DynamoDB client calls (does this example demonstrate anything live?)`,
      );
    }
  }
}

const flagged = dirs.filter((d) => expectations.has(d));
console.log(`docs examples: ${dirs.length} type-checked and executed`);
console.log(
  `expected-error examples: ${flagged.length ? flagged.join(", ") : "(none)"}\n`,
);
console.log(lines.join("\n"));
if (warnings.length > 0) {
  console.log(`\n${warnings.join("\n")}`);
}
console.log(`\n${dirs.length - failures} passed, ${failures} failed`);
if (failures > 0) {
  process.exit(1);
}
