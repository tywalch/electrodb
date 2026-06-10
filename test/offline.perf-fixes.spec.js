/**
 * Behavioral guard tests for the performance-focused batch of audit fixes
 * ("stage 2"). Each describe block pins user-visible behavior that the
 * corresponding optimization must preserve; none of these rely on timing.
 */
const { expect } = require("chai");
const { Entity } = require("../src/entity");
const { Service } = require("../src/service");
const {
  makeMockV2Client,
  makePagingQueryHandler,
} = require("./fixtures/mock-client");
const {
  table,
  makeFixtureEntity,
  makeStoredItem,
  makeItemData,
} = require("./fixtures/entities");

// ---------------------------------------------------------------------------
// P5: validateModel ran the (always-failing) ModelBeta schema pass for every
//     modern v1 model before validating Modelv1, and getInstanceType ran full
//     jsonschema validation before the cheap `_instance` symbol checks. These
//     tests pin the thrown messages byte-for-byte (captured from the pre-fix
//     implementation) and the instance-type resolution order.
// ---------------------------------------------------------------------------
describe("P5: model validation short-circuits", () => {
  const validations = require("../src/validations");
  const u = require("../src/util");
  const { ElectroInstance, ElectroInstanceTypes } = require("../src/types");

  // captured verbatim from the pre-fix validateModel implementation
  const invalidModelFixtures = [
    {
      name: "empty object",
      model: {},
      message:
        'instance.model is required, instance requires property "model", instance requires property "attributes", instance requires property "indexes" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#invalid-model',
    },
    {
      name: "v1 model missing indexes",
      model: {
        model: { entity: "e", service: "s", version: "1" },
        attributes: { id: { type: "string" } },
      },
      message:
        'instance requires property "indexes" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#invalid-model',
    },
    {
      name: "v1 model with non-function getter",
      model: {
        model: { entity: "e", service: "s", version: "1" },
        attributes: { id: { type: "string", get: "not-a-function" } },
        indexes: { main: { pk: { field: "pk", composite: ["id"] } } },
      },
      message:
        "instance.attributes.id.get must be a function - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#invalid-model",
    },
    {
      name: "beta-shaped model missing indexes (still throws v1 messages)",
      model: {
        entity: "e",
        service: "s",
        attributes: { id: { type: "string" } },
      },
      message:
        'instance.model is required, instance requires property "model", instance requires property "indexes" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#invalid-model',
    },
    {
      name: "non-object model namespace",
      model: {
        model: "nope",
        attributes: { id: { type: "string" } },
        indexes: { main: { pk: { field: "pk", composite: ["id"] } } },
      },
      message:
        "instance.model is not of a type(s) object - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#invalid-model",
    },
  ];

  for (const { name, model, message } of invalidModelFixtures) {
    it(`throws the exact pre-fix message for: ${name}`, () => {
      let thrown;
      try {
        validations.model(model);
      } catch (err) {
        thrown = err;
      }
      expect(thrown, "expected validateModel to throw").to.not.equal(undefined);
      expect(thrown.isElectroError).to.equal(true);
      expect(thrown.message).to.equal(message);
    });
  }

  it("accepts a valid v1 model and a valid beta model", () => {
    const v1Model = {
      model: { entity: "e", service: "s", version: "1" },
      attributes: { id: { type: "string" } },
      indexes: { main: { pk: { field: "pk", composite: ["id"] } } },
    };
    const betaModel = {
      entity: "e",
      service: "s",
      version: "1",
      attributes: { id: { type: "string" } },
      indexes: { main: { pk: { field: "pk", facets: ["id"] } } },
    };
    expect(() => validations.model(v1Model)).to.not.throw();
    expect(() => validations.model(betaModel)).to.not.throw();
    expect(() => new Entity(v1Model, { table })).to.not.throw();
  });

  it("resolves instance types via symbols and bare models via validation", () => {
    const entity = makeFixtureEntity();
    expect(u.getInstanceType(entity)).to.equal(ElectroInstanceTypes.entity);
    expect(u.getInstanceType({ _instance: ElectroInstance.service })).to.equal(
      ElectroInstanceTypes.service,
    );
    expect(u.getInstanceType({ _instance: ElectroInstance.electro })).to.equal(
      ElectroInstanceTypes.electro,
    );
    expect(
      u.getInstanceType({
        model: { entity: "e", service: "s", version: "1" },
        attributes: { id: { type: "string" } },
        indexes: { main: { pk: { field: "pk", composite: ["id"] } } },
      }),
    ).to.equal(ElectroInstanceTypes.model);
    expect(u.getInstanceType({})).to.equal("");
    expect(u.getInstanceType(undefined)).to.equal("");
    expect(u.getInstanceType({ anything: "else" })).to.equal("");
  });
});

// ---------------------------------------------------------------------------
// P2: formatResponse eagerly allocated an ElectroError (with stack capture)
//     on every call — once per item on batchGet/collection paths — only to
//     discard it on success. The error is now built lazily on the throw path;
//     these tests pin the wrapping contract, which had no prior coverage.
// ---------------------------------------------------------------------------
describe("P2: formatResponse error wrapping", () => {
  const { ElectroError, ErrorCodes } = require("../src/errors");

  function makeThrowingEntity(makeError) {
    return new Entity(
      {
        model: { entity: "thrower", service: "perfService", version: "1" },
        table,
        attributes: {
          org: { type: "string" },
          id: { type: "string" },
          boom: {
            type: "string",
            get: () => {
              throw makeError();
            },
          },
        },
        indexes: {
          records: {
            pk: { field: "pk", composite: ["org"] },
            sk: { field: "sk", composite: ["id"] },
          },
        },
      },
      { table },
    );
  }

  function makeGetClient(entity) {
    const { Item } = entity
      .put({ org: "org1", id: "id1", boom: "value" })
      .params();
    return makeMockV2Client({ get: { Item } });
  }

  it("wraps a plain error thrown during formatting in an ElectroError", async () => {
    const original = new Error("boom");
    const entity = makeThrowingEntity(() => original);
    const { client } = makeGetClient(entity);
    let thrown;
    try {
      await entity.get({ org: "org1", id: "id1" }).go({ client });
    } catch (err) {
      thrown = err;
    }
    expect(thrown, "expected go() to reject").to.not.equal(undefined);
    expect(thrown.isElectroError).to.equal(true);
    expect(thrown.code).to.equal(ErrorCodes.AWSError.code);
    expect(thrown.cause).to.equal(original);
    expect(thrown.message).to.equal(
      'Error thrown by DynamoDB client: "boom" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#aws-error',
    );
    expect(thrown.stack).to.be.a("string").and.to.have.length.greaterThan(0);
  });

  it("rethrows an ElectroError unwrapped (same instance)", async () => {
    const original = new ElectroError(
      ErrorCodes.InvalidAttribute,
      "already electro",
    );
    const entity = makeThrowingEntity(() => original);
    const { client } = makeGetClient(entity);
    let thrown;
    try {
      await entity.get({ org: "org1", id: "id1" }).go({ client });
    } catch (err) {
      thrown = err;
    }
    expect(thrown).to.equal(original);
  });

  it("rethrows the raw error when originalErr is set", async () => {
    const original = new Error("boom");
    const entity = makeThrowingEntity(() => original);
    const { client } = makeGetClient(entity);
    let thrown;
    try {
      await entity
        .get({ org: "org1", id: "id1" })
        .go({ client, originalErr: true });
    } catch (err) {
      thrown = err;
    }
    expect(thrown).to.equal(original);
    expect(thrown.isElectroError).to.equal(undefined);
  });

  it("wraps errors surfaced through the public parse() path", () => {
    const original = new Error("parse boom");
    const entity = makeThrowingEntity(() => original);
    const { Item } = entity
      .put({ org: "org1", id: "id1", boom: "value" })
      .params();
    let thrown;
    try {
      entity.parse({ Item });
    } catch (err) {
      thrown = err;
    }
    expect(thrown.isElectroError).to.equal(true);
    expect(thrown.cause).to.equal(original);
  });
});

// ---------------------------------------------------------------------------
// P4: each getter/setter pass copied the entire payload once per attribute
//     (`getSiblings`) and re-ran a regex per path lookup. The snapshot is now
//     shared per pass and the regex skipped for bracket-free paths. These
//     tests pin the sibling-visibility semantics and bracketed-path
//     resolution the optimizations must preserve.
// ---------------------------------------------------------------------------
describe("P4: attribute mutation passes", () => {
  it("setters see original sibling values, not other setters' output", () => {
    const entity = new Entity(
      {
        model: { entity: "siblings", service: "perfService", version: "1" },
        table,
        attributes: {
          org: { type: "string" },
          id: { type: "string" },
          a: { type: "string", set: (value, item) => `${value}:${item.b}` },
          b: { type: "string", set: (value, item) => `${value}:${item.a}` },
        },
        indexes: {
          records: {
            pk: { field: "pk", composite: ["org"] },
            sk: { field: "sk", composite: ["id"] },
          },
        },
      },
      { table },
    );
    const { Item } = entity
      .put({ org: "org1", id: "id1", a: "1", b: "2" })
      .params();
    // each setter saw the *original* value of its sibling
    expect(Item.a).to.equal("1:2");
    expect(Item.b).to.equal("2:1");
  });

  it("watchers fire exactly once and see the watched attribute's set output", () => {
    const counts = { name: 0, display: 0 };
    const entity = new Entity(
      {
        model: { entity: "watchers", service: "perfService", version: "1" },
        table,
        attributes: {
          org: { type: "string" },
          id: { type: "string" },
          name: {
            type: "string",
            set: (value) => {
              counts.name++;
              return `${value}!`;
            },
          },
          display: {
            type: "string",
            watch: ["name"],
            set: (_, item) => {
              counts.display++;
              return `D:${item.name}`;
            },
          },
        },
        indexes: {
          records: {
            pk: { field: "pk", composite: ["org"] },
            sk: { field: "sk", composite: ["id"] },
          },
        },
      },
      { table },
    );
    const { Item } = entity
      .put({ org: "org1", id: "id1", name: "joe" })
      .params();
    expect(counts).to.deep.equal({ name: 1, display: 1 });
    expect(Item.name).to.equal("joe!");
    // the watcher pass runs against the first pass's output
    expect(Item.display).to.equal("D:joe!");
  });

  it("getters see sibling values during retrieval formatting", () => {
    const entity = new Entity(
      {
        model: { entity: "getters", service: "perfService", version: "1" },
        table,
        attributes: {
          org: { type: "string" },
          id: { type: "string" },
          label: {
            type: "string",
            get: (value, item) => `${value}@${item.org}`,
          },
        },
        indexes: {
          records: {
            pk: { field: "pk", composite: ["org"] },
            sk: { field: "sk", composite: ["id"] },
          },
        },
      },
      { table },
    );
    const { Item } = entity
      .put({ org: "org1", id: "id1", label: "x" })
      .params();
    const { data } = entity.parse({ Item });
    expect(data.label).to.equal("x@org1");
  });

  it("resolves bracketed list paths through update validation", () => {
    const entity = makeFixtureEntity();
    const params = entity
      .update({ org: "org1", id: "id1" })
      .data((attr, op) => op.set(attr.notes[0].body, "edited"))
      .params();
    expect(params.UpdateExpression).to.equal(
      "SET #notes[0].#body = :body_u0, #org = :org_u0, #id = :id_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0",
    );
    expect(params.ExpressionAttributeNames).to.deep.equal({
      "#notes": "notes",
      "#body": "body",
      "#org": "org",
      "#id": "id",
      "#__edb_e__": "__edb_e__",
      "#__edb_v__": "__edb_v__",
    });
    expect(params.ExpressionAttributeValues[":body_u0"]).to.equal("edited");
  });
});

// ---------------------------------------------------------------------------
// P1: executeQuery accumulated results by rebuilding the whole accumulator on
//     every page (`results = [...results, ...items]`), making auto-paging
//     O(pages²). These tests pin paging semantics: order, count truncation,
//     cursor resumability, and collection demixing.
// ---------------------------------------------------------------------------
describe("P1: executeQuery result accumulation", () => {
  const entity = makeFixtureEntity();

  function makePagingClient({ pages, perPage }) {
    const query = makePagingQueryHandler({
      pages,
      perPage,
      makeItem: (i) => makeStoredItem(entity, i),
    });
    return makeMockV2Client({ query });
  }

  it("returns the in-order union of all pages with pages:'all'", async () => {
    const pages = 5;
    const perPage = 4;
    const { client, calls } = makePagingClient({ pages, perPage });
    const { data, cursor } = await entity.query
      .records({ org: "org1" })
      .go({ client, pages: "all" });
    expect(calls.length).to.equal(pages);
    expect(cursor).to.equal(null);
    expect(data.map((item) => item.id)).to.deep.equal(
      Array.from({ length: pages * perPage }, (_, i) => makeItemData(i).id),
    );
    // items keep full attribute formatting, not just identity
    expect(data[0]).to.deep.equal(makeItemData(0));
    expect(data[data.length - 1]).to.deep.equal(makeItemData(19));
  });

  it("truncates to exactly `count` mid-page and returns a resumable cursor", async () => {
    const pages = 3;
    const perPage = 4;
    const count = 5; // straddles the first page boundary
    const { client } = makePagingClient({ pages, perPage });
    const first = await entity.query
      .records({ org: "org1" })
      .go({ client, count });
    expect(first.data.length).to.equal(count);
    expect(first.data.map((item) => item.count)).to.deep.equal([0, 1, 2, 3, 4]);
    expect(first.cursor).to.be.a("string");

    // resuming from the returned cursor picks up at the very next item
    const rest = await entity.query
      .records({ org: "org1" })
      .go({ client, cursor: first.cursor, pages: "all" });
    expect(rest.data.map((item) => item.count)).to.deep.equal([
      5, 6, 7, 8, 9, 10, 11,
    ]);
    expect(rest.cursor).to.equal(null);
  });

  describe("collection queries", () => {
    function makeCollectionModel(name) {
      return {
        model: { entity: name, service: "perfService", version: "1" },
        table,
        attributes: {
          org: { type: "string" },
          id: { type: "string" },
          label: { type: "string" },
        },
        indexes: {
          records: {
            collection: "shared",
            pk: { field: "pk", composite: ["org"] },
            sk: { field: "sk", composite: ["id"] },
          },
        },
      };
    }
    const alpha = new Entity(makeCollectionModel("alpha"), { table });
    const beta = new Entity(makeCollectionModel("beta"), { table });
    const service = new Service({ alpha, beta });

    it("accumulates per-entity arrays in order across pages", async () => {
      const pages = 4;
      const perPage = 3;
      const query = makePagingQueryHandler({
        pages,
        perPage,
        makeItem: (i) => {
          const owner = i % 2 === 0 ? alpha : beta;
          const { Item } = owner
            .put({
              org: "org1",
              id: `id${String(i).padStart(4, "0")}`,
              label: `label${i}`,
            })
            .params();
          return Item;
        },
      });
      const { client, calls } = makeMockV2Client({ query });
      const { data, cursor } = await service.collections
        .shared({ org: "org1" })
        .go({ client, pages: "all" });
      expect(calls.length).to.equal(pages);
      expect(cursor).to.equal(null);
      const expectedIds = Array.from(
        { length: pages * perPage },
        (_, i) => `id${String(i).padStart(4, "0")}`,
      );
      expect(data.alpha.map((item) => item.id)).to.deep.equal(
        expectedIds.filter((_, i) => i % 2 === 0),
      );
      expect(data.beta.map((item) => item.id)).to.deep.equal(
        expectedIds.filter((_, i) => i % 2 === 1),
      );
      expect(data.alpha[0]).to.deep.equal({
        org: "org1",
        id: "id0000",
        label: "label0",
      });
    });
  });
});
