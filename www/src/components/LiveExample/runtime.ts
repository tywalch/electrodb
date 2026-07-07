export interface ExampleFile {
  /** File name within the example directory, e.g. "entity.ts" */
  name: string;
  /** Tab label, e.g. "Entity" */
  label: string;
  /** Original TypeScript source (displayed in the tab) */
  source: string;
  /** CommonJS output produced at build time (executed in the browser) */
  compiled: string;
}

export type OutputItem =
  | { kind: "params"; label: string | null; json: string }
  | { kind: "message"; type: "info" | "error"; html: string };

interface PlaygroundListener {
  onParams(event: { label: string | null; params: unknown }): void;
  onMessage(event: { type: "info" | "error"; html: string; text: string }): void;
  onClear(): void;
}

interface ElectroDBPlayground {
  Entity: unknown;
  Service: unknown;
  createSchema: unknown;
  createCustomAttribute: unknown;
  CustomAttributeType: unknown;
  configure(listener: Partial<PlaygroundListener>): () => void;
  clearScreen(): void;
  printMessage(type: string, message: string): void;
}

declare global {
  interface Window {
    ElectroDB?: ElectroDBPlayground;
  }
}

const BUNDLE_SRC = "/scripts/electrodb-playground.js";

let bundlePromise: Promise<void> | null = null;

function loadBundle(): Promise<void> {
  if (typeof window.ElectroDB !== "undefined") {
    return Promise.resolve();
  }
  if (!bundlePromise) {
    bundlePromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = BUNDLE_SRC;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () =>
        reject(new Error("Failed to load the ElectroDB playground bundle"));
      document.head.appendChild(script);
    });
  }
  return bundlePromise;
}

function stripLabelWrapper(label: string | null): string | null {
  if (!label) {
    return null;
  }
  return label.replace(/^<h2>/, "").replace(/<\/h2>$/, "");
}

function resolveRequest(request: string, moduleNames: Set<string>): string {
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

function executeFiles(files: ExampleFile[]): Promise<unknown> {
  const playground = window.ElectroDB;
  if (!playground) {
    throw new Error("The ElectroDB playground bundle failed to load.");
  }
  const electrodbModule = {
    Entity: playground.Entity,
    Service: playground.Service,
    createSchema: playground.createSchema,
    createCustomAttribute: playground.createCustomAttribute,
    CustomAttributeType: playground.CustomAttributeType,
  };
  const byName = new Map(files.map((file) => [file.name, file]));
  const moduleNames = new Set(byName.keys());
  const cache = new Map<string, { exports: Record<string, unknown> }>();

  function requireModule(name: string): unknown {
    if (name === "electrodb") {
      return electrodbModule;
    }
    const cached = cache.get(name);
    if (cached) {
      return cached.exports;
    }
    const file = byName.get(name);
    if (!file) {
      throw new Error(`Cannot find module '${name}'`);
    }
    const record = { exports: {} as Record<string, unknown> };
    cache.set(name, record);
    const localRequire = (request: string) =>
      requireModule(resolveRequest(request, moduleNames));
    const factory = new Function("require", "module", "exports", file.compiled);
    factory(localRequire, record, record.exports);
    return record.exports;
  }

  const entry = files[0];
  const record = { exports: {} as Record<string, unknown> };
  cache.set(entry.name, record);
  const localRequire = (request: string) =>
    requireModule(resolveRequest(request, moduleNames));
  // The entry module is wrapped in an async function so examples can use
  // top-level await, mirroring how they appear in the documentation.
  const factory = new Function(
    "require",
    "module",
    "exports",
    `return (async () => {\n${entry.compiled}\n})();`,
  );
  return Promise.resolve(factory(localRequire, record, record.exports));
}

async function collectOutput(files: ExampleFile[]): Promise<OutputItem[]> {
  await loadBundle();
  const playground = window.ElectroDB;
  if (!playground) {
    throw new Error("The ElectroDB playground bundle failed to load.");
  }
  let items: OutputItem[] = [];
  const restore = playground.configure({
    onParams: ({ label, params }) => {
      items.push({
        kind: "params",
        label: stripLabelWrapper(label),
        json: JSON.stringify(params, null, 2),
      });
    },
    onMessage: ({ type, html }) => {
      items.push({ kind: "message", type, html });
    },
    onClear: () => {
      items = [];
    },
  });
  try {
    playground.clearScreen();
    await executeFiles(files);
    // Allow un-awaited `.go()` calls (e.g. transactions) to flush output.
    await new Promise((resolve) => setTimeout(resolve, 10));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    playground.printMessage("error", message);
  } finally {
    restore();
  }
  return items;
}

// Multiple LiveExample islands can exist on one documentation page; the
// playground listener is global state, so runs are serialized.
let queue: Promise<unknown> = Promise.resolve();

export function runExample(files: ExampleFile[]): Promise<OutputItem[]> {
  const run = queue.then(() => collectOutput(files));
  queue = run.catch(() => undefined);
  return run;
}
