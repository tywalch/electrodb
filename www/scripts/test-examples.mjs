#!/usr/bin/env node
/**
 * Executes every docs example (src/examples/<dir>/example.ts) against the
 * repository's own ElectroDB build with a mocked DynamoDB client — the same
 * way the LiveExample control runs them in the browser — and fails if any
 * example throws.
 *
 * Examples that are SUPPOSED to throw (the docs render their error on
 * purpose) opt in with an `expected-error.txt` file in their directory; for
 * those, NOT throwing is the failure.
 *
 * Type-correctness is covered separately by `npm run check` (tsc resolves
 * "electrodb" to ../index.d.ts via tsconfig paths).
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import ts from "typescript";

const here = dirname(fileURLToPath(import.meta.url));
const examplesRoot = resolve(here, "../src/examples");
const nodeRequire = createRequire(import.meta.url);
// The repository's ElectroDB (www/scripts -> repo root)
const ElectroDB = nodeRequire(resolve(here, "../../index.js"));

function promiseCallback(results) {
  return { promise: async () => results };
}

function createMockClient(table) {
  return {
    put: () => promiseCallback({}),
    delete: () => promiseCallback({}),
    update: () => promiseCallback({}),
    get: () => promiseCallback({ Item: {} }),
    query: () => promiseCallback({ Items: [] }),
    scan: () => promiseCallback({ Items: [] }),
    batchWrite: () =>
      promiseCallback({ UnprocessedItems: { [table]: [] } }),
    batchGet: () =>
      promiseCallback({
        Responses: { [table]: [] },
        UnprocessedKeys: { [table]: { Keys: [] } },
      }),
    transactWrite: () => ({ promise: async () => ({}), on: () => {} }),
    transactGet: () => ({
      promise: async () => ({ Responses: [] }),
      on: () => {},
    }),
    createSet: (value) => value,
  };
}

// Entities in example files are constructed without a client (the browser
// control injects a mocked one); do the same here so `.go()` executes.
class MockedEntity extends ElectroDB.Entity {
  constructor(schema, options = {}) {
    super(schema, { ...options, client: createMockClient(options.table) });
  }
}

const electrodbModule = {
  ...ElectroDB,
  Entity: MockedEntity,
};

function transpile(source, fileName) {
  const output = ts.transpileModule(source, {
    fileName,
    reportDiagnostics: true,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2017,
      esModuleInterop: true,
    },
  });
  const syntaxErrors = (output.diagnostics ?? []).map((diagnostic) =>
    ts.flattenDiagnosticMessageText(diagnostic.messageText, " "),
  );
  return { js: output.outputText, syntaxErrors };
}

function resolveRequest(request, moduleNames) {
  if (request === "electrodb") {
    return request;
  }
  if (!request.startsWith("./")) {
    throw new Error(`Cannot find module '${request}'`);
  }
  const base = request.slice(2);
  const candidates = [base, `${base}.ts`, `${base}.tsx`];
  const resolved = candidates.find((candidate) => moduleNames.has(candidate));
  if (resolved === undefined) {
    throw new Error(`Cannot find module '${request}'`);
  }
  return resolved;
}

async function executeExample(dir) {
  const fileNames = readdirSync(dir).filter((name) => name.endsWith(".ts"));
  const modules = new Map();
  for (const name of fileNames) {
    const source = readFileSync(join(dir, name), "utf8");
    const { js, syntaxErrors } = transpile(source, name);
    if (syntaxErrors.length > 0) {
      throw new Error(`${name}: ${syntaxErrors.join("; ")}`);
    }
    modules.set(name, js);
  }
  if (!modules.has("example.ts")) {
    throw new Error("missing example.ts");
  }
  const moduleNames = new Set(modules.keys());
  const cache = new Map();

  function requireModule(name) {
    if (name === "electrodb") {
      return electrodbModule;
    }
    const cached = cache.get(name);
    if (cached) {
      return cached.exports;
    }
    const record = { exports: {} };
    cache.set(name, record);
    const localRequire = (request) =>
      requireModule(resolveRequest(request, moduleNames));
    const factory = new Function(
      "require",
      "module",
      "exports",
      modules.get(name),
    );
    factory(localRequire, record, record.exports);
    return record.exports;
  }

  const record = { exports: {} };
  cache.set("example.ts", record);
  const localRequire = (request) =>
    requireModule(resolveRequest(request, moduleNames));
  const factory = new Function(
    "require",
    "module",
    "exports",
    `return (async () => {\n${modules.get("example.ts")}\n})();`,
  );
  await factory(localRequire, record, record.exports);
  // Give un-awaited `.go()` calls a beat to surface rejections.
  await new Promise((r) => setTimeout(r, 10));
}

const dirs = readdirSync(examplesRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

let failures = 0;
const results = [];

for (const name of dirs) {
  const dir = join(examplesRoot, name);
  const expectedErrorFile = join(dir, "expected-error.txt");
  const expectsError = existsSync(expectedErrorFile);

  // Attribute un-awaited rejections to the example being executed
  // (examples run serially).
  const rejections = [];
  const onRejection = (reason) => rejections.push(reason);
  process.on("unhandledRejection", onRejection);

  let thrown = null;
  try {
    await executeExample(dir);
  } catch (err) {
    thrown = err;
  }
  process.off("unhandledRejection", onRejection);
  if (thrown === null && rejections.length > 0) {
    thrown = rejections[0];
  }

  if (expectsError) {
    if (thrown !== null) {
      results.push(`  ok       ${name} (threw as documented)`);
    } else {
      failures += 1;
      results.push(
        `  FAIL     ${name} — marked expected-error but completed without throwing`,
      );
    }
  } else if (thrown === null) {
    results.push(`  ok       ${name}`);
  } else {
    failures += 1;
    const message =
      thrown instanceof Error ? thrown.message : String(thrown);
    results.push(`  FAIL     ${name} — ${message.split("\n")[0]}`);
  }
}

console.log(`docs examples: ${dirs.length} executed\n`);
console.log(results.join("\n"));
console.log(
  `\n${dirs.length - failures} passed, ${failures} failed`,
);
if (failures > 0) {
  process.exit(1);
}
