"use strict";

// Loaded via `mocha --file` by `npm run test:unit:parity`. Every read formatted
// through Schema#formatItemForRetrieval runs both the compiled and interpreted
// paths and fails the test if they diverge. Entities without `compile: true`
// get a shadow compiled formatter so the whole suite is covered.
// offline.compile.spec.js is skipped: it asserts both paths directly and covers
// documented divergences on hostile inputs. The skip flag is set per test, so
// reads in before/after hooks inherit the previous test's flag.

const { isDeepStrictEqual } = require("util");
const { Schema } = require("../../src/schema");
const { DataOptions } = require("../../src/types");
const { ElectroError } = require("../../src/errors");
const format = require("../../src/format");

const SKIPPED_SPECS = ["offline.compile.spec.js"];

function attempt(fn) {
  try {
    return { value: fn() };
  } catch (error) {
    return { error };
  }
}

function sameOutcome(a, b) {
  if (a.error || b.error) {
    return !!a.error && !!b.error && a.error.message === b.error.message;
  }
  return isDeepStrictEqual(a.value, b.value);
}

function describeOutcome(outcome) {
  return outcome.error
    ? `threw: ${outcome.error.message}`
    : JSON.stringify(outcome.value);
}

function fail(message) {
  throw new ElectroError(undefined, `compile parity: ${message}`);
}

const stats = { compared: 0 };
const shadows = new WeakMap();
let enabled = true;

// lazily compiled, never assigned to schema.compiled so library behavior is untouched
function shadowFor(schema) {
  if (!shadows.has(schema)) {
    const shadow = format.compileDocumentFormatter(schema);
    if (
      shadow === null &&
      format.supportsCompilation() &&
      format.isCompilable(schema)
    ) {
      fail("an eligible schema failed to compile");
    }
    shadows.set(schema, shadow);
  }
  return shadows.get(schema);
}

const formatItemForRetrieval = Schema.prototype.formatItemForRetrieval;
Schema.prototype.formatItemForRetrieval = function (item, config) {
  const eligible =
    enabled &&
    (config.data === undefined || config.data === DataOptions.attributes);
  const compiled = this.compiled;
  const shadow = eligible && compiled === null ? shadowFor(this) : null;
  if (!eligible || (compiled === null && shadow === null)) {
    return formatItemForRetrieval.call(this, item, config);
  }
  const actual = attempt(() => formatItemForRetrieval.call(this, item, config));
  const other = attempt(() =>
    compiled !== null
      ? this._formatItemForRetrievalInterpreted(item, config)
      : shadow.fromDocument(item, config._returnAttributesFilter),
  );
  stats.compared++;
  if (!sameOutcome(actual, other)) {
    const [viaCompiled, viaInterpreted] =
      compiled !== null ? [actual, other] : [other, actual];
    fail(
      "compiled formatter diverged from interpreted formatter\n" +
        `  item:        ${JSON.stringify(item)}\n` +
        `  compiled:    ${describeOutcome(viaCompiled)}\n` +
        `  interpreted: ${describeOutcome(viaInterpreted)}`,
    );
  }
  if (actual.error) {
    throw actual.error;
  }
  return actual.value;
};

beforeEach(function () {
  const file = (this.currentTest && this.currentTest.file) || "";
  enabled = !SKIPPED_SPECS.some((name) => file.endsWith(name));
});

after("compile parity harness compared reads from the suite", () => {
  if (stats.compared === 0) {
    throw new Error(
      "compile parity harness is installed but compared no reads",
    );
  }
});

describe("compile parity harness", () => {
  const { expect } = require("chai");
  const { Entity } = require("../../src/entity");
  const model = {
    model: { entity: "parity", service: "harness", version: "1" },
    attributes: { id: { type: "string" }, name: { type: "string" } },
    indexes: {
      main: {
        pk: { field: "pk", composite: ["id"] },
        sk: { field: "sk", composite: [] },
      },
    },
  };
  const response = { Attributes: { id: "1", name: "a" } };

  // self-test reads must not satisfy the "compared reads from the suite" guard
  let compared;
  beforeEach(() => {
    compared = stats.compared;
  });
  afterEach(() => {
    stats.compared = compared;
  });

  it("throws when the compiled formatter diverges", () => {
    const entity = new Entity(model, { table: "t", compile: true });
    entity.model.schema.compiled.fromDocument = () => ({ name: "WRONG" });
    expect(() => entity.parse(response)).to.throw(
      ElectroError,
      "compiled formatter diverged",
    );
  });

  it("shadow-compiles entities without compile:true", () => {
    const entity = new Entity(model, { table: "t" });
    expect(entity.parse(response).data).to.deep.equal(response.Attributes);
    expect(entity.model.schema.compiled).to.equal(null);
    expect(stats.compared).to.equal(compared + 1);
  });

  it("throws when an eligible schema silently fails to compile", () => {
    const entity = new Entity(model, { table: "t" });
    const compileDocumentFormatter = format.compileDocumentFormatter;
    format.compileDocumentFormatter = () => null;
    try {
      expect(() => entity.parse(response)).to.throw(
        "eligible schema failed to compile",
      );
    } finally {
      format.compileDocumentFormatter = compileDocumentFormatter;
    }
  });
});

module.exports = { stats };
