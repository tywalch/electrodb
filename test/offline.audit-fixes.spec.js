/**
 * Regression tests for the "stage 1" batch of audit fixes.
 *
 * Each describe block documents the bug it pins, and is written to FAIL against
 * the pre-fix source and PASS once the corresponding fix is applied.
 */
const { Entity } = require("../src/entity");
const {
  cleanseTransactionData,
  cleanseCanceledData,
  createWriteTransaction,
} = require("../src/transaction");
const { DynamoDBSet } = require("../src/set");
const { TableIndex } = require("../src/types");
const { expect } = require("chai");

const table = "electro";

// A minimal v2-style DocumentClient mock. Non-transaction methods return an
// object with `.promise()`; transaction methods return a request-like object
// (`on`/`abort`/`promise`) so it works both directly (via `_exec`) and through
// the v2 wrapper. `handlers` maps a method name to a canned response (or a
// function of the params). Transaction handlers may return
// `{ cancellationReasons: [...] }` to simulate a canceled transaction.
function makeMockV2Client(handlers = {}) {
  const calls = [];
  const transactMethods = new Set(["transactWrite", "transactGet"]);
  const methods = [
    "get",
    "put",
    "update",
    "delete",
    "batchWrite",
    "batchGet",
    "scan",
    "query",
    "transactWrite",
    "transactGet",
  ];
  const client = {
    createSet: (value) => new Set([].concat(value)),
  };
  for (const method of methods) {
    client[method] = (params) => {
      calls.push({ method, params });
      const handler = handlers[method];
      const value = typeof handler === "function" ? handler(params) : handler;
      if (transactMethods.has(method)) {
        const stored = {};
        return {
          on: (event, cb) => {
            stored[event] = cb;
          },
          abort: () => {},
          promise: () => {
            if (value && value.cancellationReasons) {
              if (stored.extractError) {
                stored.extractError({
                  httpResponse: {
                    body: {
                      toString: () =>
                        JSON.stringify({
                          CancellationReasons: value.cancellationReasons,
                        }),
                    },
                  },
                });
              }
              return Promise.reject(new Error("TransactionCanceledException"));
            }
            return Promise.resolve(value === undefined ? {} : value);
          },
        };
      }
      return {
        promise: () => Promise.resolve(value === undefined ? {} : value),
      };
    };
  }
  return { client, calls };
}

// ---------------------------------------------------------------------------
// B1: `unprocessed: "raw"` execution option is dropped due to a property typo
//     (`config.unproessed`) in `_normalizeExecutionOptions`.
// ---------------------------------------------------------------------------
describe("B1: unprocessed:'raw' execution option", () => {
  const MallStores = new Entity(
    {
      model: { service: "BugBeater", entity: "TEST_ENTITY", version: "1" },
      table,
      attributes: {
        id: { type: "string", field: "storeLocationId" },
        sector: { type: "string" },
      },
      indexes: {
        store: {
          pk: { field: "pk", facets: ["sector"] },
          sk: { field: "sk", facets: ["id"] },
        },
      },
    },
    {},
  );

  const rawKey = {
    pk: "$bugbeater#sector_a1",
    sk: "$test_entity_1#id_abc",
  };
  const cannedBatchGet = {
    Responses: { electro: [] },
    UnprocessedKeys: { electro: { Keys: [rawKey] } },
  };

  it("normalizes onto config.unprocessed (not a typo'd property)", () => {
    const config = MallStores._normalizeExecutionOptions({
      provided: [{ unprocessed: "raw" }],
    });
    expect(config.unprocessed).to.equal("raw");
    expect(config).to.not.have.property("unproessed");
  });

  it("returns raw DynamoDB keys when unprocessed:'raw'", async () => {
    const { client } = makeMockV2Client({ batchGet: cannedBatchGet });
    const res = await MallStores.get([{ sector: "a1", id: "abc" }]).go({
      client,
      unprocessed: "raw",
    });
    expect(res.unprocessed).to.deep.equal([rawKey]);
  });

  it("still returns deconstructed composite attributes by default", async () => {
    const { client } = makeMockV2Client({ batchGet: cannedBatchGet });
    const res = await MallStores.get([{ sector: "a1", id: "abc" }]).go({
      client,
    });
    expect(res.unprocessed).to.deep.equal([{ sector: "a1", id: "abc" }]);
  });
});

// ---------------------------------------------------------------------------
// S3: Hidden Set attributes nested inside a map leak on read because
//     SetAttribute._makeGet lacks the `if (this.hidden) return;` guard that the
//     string/map/list getters have.
// ---------------------------------------------------------------------------
describe("S3: hidden nested Set attributes on read", () => {
  const HiddenSet = new Entity({
    model: { service: "audit", entity: "hiddenset", version: "1" },
    table,
    attributes: {
      id: { type: "string" },
      secretRootSet: { type: "set", items: "string", hidden: true },
      data: {
        type: "map",
        properties: {
          secretSet: { type: "set", items: "string", hidden: true },
          secretStr: { type: "string", hidden: true },
          visible: { type: "string" },
        },
      },
    },
    indexes: {
      primary: {
        pk: { field: "pk", composite: ["id"] },
        sk: { field: "sk", composite: [] },
      },
    },
  });

  it("strips a hidden Set nested inside a map", () => {
    const result = HiddenSet.parse({
      Item: {
        pk: "$audit#id_1",
        sk: "$hiddenset_1",
        id: "1",
        secretRootSet: ["x", "y"],
        data: { secretSet: ["a", "b"], secretStr: "shh", visible: "ok" },
        __edb_e__: "hiddenset",
        __edb_v__: "1",
      },
    }).data;
    expect(result.data).to.deep.equal({ visible: "ok" });
    expect(result.data).to.not.have.property("secretSet");
    // root-level hidden set should also be absent (already true pre-fix)
    expect(result).to.not.have.property("secretRootSet");
  });
});

// ---------------------------------------------------------------------------
// set.js: (1) the `Invalid Set type` Error is constructed but never thrown, and
//         (2) `enum`-typed set members are not mapped, producing a DynamoDBSet
//         with `type: undefined` in client-less `.params()`.
// ---------------------------------------------------------------------------
describe("set.js: DynamoDBSet type handling", () => {
  it("throws on an unknown set member type", () => {
    expect(() => new DynamoDBSet(["a"], "bogus")).to.throw(/Invalid Set type/);
  });

  it("maps known and enum member types to a DynamoDB set type", () => {
    expect(new DynamoDBSet(["a"], "string").type).to.equal("String");
    expect(new DynamoDBSet([1], "number").type).to.equal("Number");
    expect(new DynamoDBSet(["a"], "enum").type).to.equal("String");
  });

  it("produces a typed set for enum-item sets in client-less params()", () => {
    const EnumSet = new Entity({
      model: { service: "audit", entity: "enumset", version: "1" },
      table,
      attributes: {
        id: { type: "string" },
        tags: { type: "set", items: ["red", "green", "blue"] },
      },
      indexes: {
        primary: {
          pk: { field: "pk", composite: ["id"] },
          sk: { field: "sk", composite: [] },
        },
      },
    });
    const params = EnumSet.put({ id: "1", tags: ["red", "green"] }).params();
    expect(params.Item.tags.wrapperName).to.equal("Set");
    expect(params.Item.tags.type).to.equal("String");
  });
});

// ---------------------------------------------------------------------------
// WatchAll: an invalid `watch` value should raise an ElectroError, but the
//           error message template references an undefined identifier
//           (`WatchAll` instead of `AttributeWildCard`), so model construction
//           dies with a raw ReferenceError instead.
// ---------------------------------------------------------------------------
describe("WatchAll: invalid watch definition error", () => {
  const build = () =>
    new Entity({
      model: { service: "audit", entity: "watcher", version: "1" },
      table,
      attributes: {
        id: { type: "string" },
        a: { type: "string", watch: "notvalid" },
      },
      indexes: {
        primary: {
          pk: { field: "pk", composite: ["id"] },
          sk: { field: "sk", composite: [] },
        },
      },
    });

  it("throws a descriptive ElectroError, not a ReferenceError", () => {
    let err;
    try {
      build();
    } catch (e) {
      err = e;
    }
    expect(err, "expected model construction to throw").to.exist;
    expect(err).to.not.be.an.instanceof(ReferenceError);
    expect(err.message).to.match(/array of attribute names/);
  });
});

// ---------------------------------------------------------------------------
// B4: Transaction result-handling defects.
// ---------------------------------------------------------------------------
describe("B4: transaction result handling", () => {
  const makeEntity = (entity, extraAttr) =>
    new Entity({
      model: { service: "txtest", entity, version: "1" },
      table,
      attributes: {
        id: { type: "string" },
        [extraAttr]: { type: "string" },
      },
      indexes: {
        primary: {
          pk: { field: "pk", composite: ["id"] },
          sk: { field: "sk", composite: [] },
        },
      },
    });

  const A = makeEntity("alpha", "name");
  const B = makeEntity("bravo", "label");
  const X = makeEntity("xray", "value"); // never joined to the entities map

  const recA = A.put({ id: "a1", name: "alice" }).params().Item;
  const recB = B.put({ id: "b1", label: "bob" }).params().Item;
  const recX = X.put({ id: "x1", value: "ghost" }).params().Item;

  it("(a) preserves position/size of transactGet results when an item is unmatched", () => {
    const results = cleanseTransactionData(
      TableIndex,
      { a: A, b: B },
      { Items: [recA, recX, recB] },
      {},
    );
    expect(results).to.have.length(3);
    expect(results[0].item).to.deep.equal({ id: "a1", name: "alice" });
    expect(results[1].item).to.equal(null); // unmatched -> null placeholder
    expect(results[2].item).to.deep.equal({ id: "b1", label: "bob" });
  });

  it("(b) does not crash on a canceled reason whose Item is unmatched", () => {
    let results;
    expect(() => {
      results = cleanseCanceledData(
        TableIndex,
        { a: A, b: B },
        {
          canceled: [
            { Code: "None", Item: recA },
            { Code: "ConditionalCheckFailed", Item: recX },
            { Code: "None", Item: recB },
          ],
        },
        {},
      );
    }).to.not.throw();
    expect(results).to.have.length(3);
    expect(results[0].item).to.deep.equal({ id: "a1", name: "alice" });
    expect(results[1]).to.deep.include({
      rejected: true,
      code: "ConditionalCheckFailed",
      item: null,
    });
    expect(results[2].item).to.deep.equal({ id: "b1", label: "bob" });
  });

  it("(c) does not share a single result object across all slots", async () => {
    const { client } = makeMockV2Client({ transactWrite: {} });
    const tx = createWriteTransaction({ alpha: A }, (e) => [
      e.alpha.put({ id: "a1", name: "alice" }).commit(),
      e.alpha.put({ id: "a2", name: "amy" }).commit(),
    ]);
    const result = await tx.go({ client });
    expect(result.data).to.have.length(2);
    result.data[0].code = "MUTATED";
    expect(result.data[1].code).to.equal("None");
  });

  it("(d) does not mutate the caller's options object", async () => {
    const { client } = makeMockV2Client({ transactWrite: {} });
    const events = [];
    const options = { client, logger: (event) => events.push(event.type) };
    const makeTx = () =>
      createWriteTransaction({ alpha: A }, (e) => [
        e.alpha.put({ id: "a1", name: "alice" }).commit(),
      ]);
    await makeTx().go(options);
    const afterFirst = events.length;
    await makeTx().go(options);
    const afterSecond = events.length - afterFirst;
    expect(options).to.not.have.property("listeners");
    // logger should fire the same number of times on each identical call
    expect(afterSecond).to.equal(afterFirst);
  });
});
