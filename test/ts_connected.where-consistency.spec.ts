process.env.AWS_NODEJS_CONNECTION_REUSE_ENABLED = "1";
import { Entity } from "../index";
import { expect } from "chai";
import { v4 as uuid } from "uuid";
import DynamoDB from "aws-sdk/clients/dynamodb";

const client = new DynamoDB.DocumentClient({
  region: "us-east-1",
  endpoint: process.env.LOCAL_DYNAMO_ENDPOINT ?? "http://localhost:8000",
  credentials: {
    accessKeyId: "test",
    secretAccessKey: "test",
  },
});

const table = "electro_projectioninclude";

function createEntity(service: string) {
  return new Entity(
    {
      model: {
        entity: "projectedSk",
        version: "1",
        service,
      },
      attributes: {
        id: { type: "string", required: true },
        include1: { type: "string", required: true },
        include2: { type: "boolean" },
        include3: { type: "number" },
        exclude1: { type: "string" },
        exclude2: { type: "number" },
        exclude3: { type: "boolean" },
      },
      indexes: {
        primary: {
          pk: { field: "pk", composite: ["id"] },
          sk: { field: "sk", composite: ["include1"] },
        },
        includeIndex: {
          index: "gsi1pk-gsi1sk-index",
          projection: ["include1", "include2", "include3"],
          pk: {
            field: "gsi1pk",
            composite: ["id"],
          },
          sk: {
            field: "gsi1sk",
            composite: ["include1"],
          },
        },
      },
    },
    { table, client },
  );
}

describe("where clause consistency between QueryOperations and QueryBranches", () => {
  const service = uuid();
  const entity = createEntity(service);

  const id = uuid();
  const items = [
    { id, include1: "alpha", include2: true, include3: 10, exclude1: "x", exclude2: 1, exclude3: true },
    { id, include1: "beta", include2: false, include3: 20, exclude1: "y", exclude2: 2, exclude3: false },
    { id, include1: "gamma", include2: true, include3: 30, exclude1: "z", exclude2: 3, exclude3: true },
  ];

  before(async () => {
    await Promise.all(items.map((item) => entity.put(item).go()));
  });

  it("should filter with .where() directly (QueryOperations path)", async () => {
    const result = await entity.query
      .includeIndex({ id })
      .where((attrs, ops) => ops.eq(attrs.include2, true))
      .go();

    expect(result.data).to.have.lengthOf(2);
    result.data.forEach((item) => {
      expect(item.include2).to.equal(true);
    });
  });

  it("should filter with .gte().where() (QueryBranches path)", async () => {
    const result = await entity.query
      .includeIndex({ id })
      .gte({ include1: "" })
      .where((attrs, ops) => ops.eq(attrs.include2, true))
      .go();

    expect(result.data).to.have.lengthOf(2);
    result.data.forEach((item) => {
      expect(item.include2).to.equal(true);
    });
  });

  it("should return same results from both paths", async () => {
    const directResult = await entity.query
      .includeIndex({ id })
      .where((attrs, ops) => ops.eq(attrs.include3, 20))
      .go();

    const gteResult = await entity.query
      .includeIndex({ id })
      .gte({ include1: "" })
      .where((attrs, ops) => ops.eq(attrs.include3, 20))
      .go();

    expect(directResult.data).to.have.lengthOf(1);
    expect(gteResult.data).to.have.lengthOf(1);
    expect(directResult.data[0].include1).to.equal(gteResult.data[0].include1);
    expect(directResult.data[0].include3).to.equal(gteResult.data[0].include3);
  });

  it("should support chained .where().where() directly", async () => {
    const result = await entity.query
      .includeIndex({ id })
      .where((attrs, ops) => ops.eq(attrs.include2, true))
      .where((attrs, ops) => ops.gte(attrs.include3, 20))
      .go();

    expect(result.data).to.have.lengthOf(1);
    expect(result.data[0].include1).to.equal("gamma");
  });

  it("should support chained .where().where() after .gte()", async () => {
    const result = await entity.query
      .includeIndex({ id })
      .gte({ include1: "" })
      .where((attrs, ops) => ops.eq(attrs.include2, true))
      .where((attrs, ops) => ops.gte(attrs.include3, 20))
      .go();

    expect(result.data).to.have.lengthOf(1);
    expect(result.data[0].include1).to.equal("gamma");
  });

  it("should only return projected attributes from includeIndex", async () => {
    const result = await entity.query
      .includeIndex({ id })
      .where((attrs, ops) => ops.eq(attrs.include2, true))
      .go();

    expect(result.data).to.have.length.greaterThan(0);
    const item = result.data[0] as any;
    expect(item.include1).to.be.a("string");
    expect(item.exclude1).to.be.undefined;
    expect(item.exclude2).to.be.undefined;
    expect(item.exclude3).to.be.undefined;
  });
});
