import { DynamoDBClient as DocumentClient } from "@aws-sdk/client-dynamodb";
import { v4 as uuid } from "uuid";
import { expect } from "chai";
import { Entity, Service } from "../";

const client = new DocumentClient({
  region: "us-east-1",
  endpoint: process.env.LOCAL_DYNAMO_ENDPOINT ?? "http://localhost:8000",
  credentials: {
    accessKeyId: "test",
    secretAccessKey: "test",
  },
});

const table = "electro_compositeprojection";

function createEntity(service: string) {
  return new Entity(
    {
      model: {
        entity: "compositeProjection",
        version: "1",
        service,
      },
      attributes: {
        tenantId: { type: "string", required: true },
        status: { type: "string" },
        name: { type: "string" },
        email: { type: "string" },
        age: { type: "number" },
      },
      indexes: {
        primary: {
          pk: { field: "pk", composite: ["tenantId"] },
          sk: { field: "sk", composite: ["status"] },
        },
        keysOnlyComposite: {
          index: "gsi1-index",
          type: "composite",
          collection: "compositeKeysOnly",
          projection: "keys_only",
          pk: { composite: ["tenantId"] },
          sk: { composite: ["age"] },
        },
        includeComposite: {
          index: "gsi2-index",
          type: "composite",
          collection: "compositeInclude",
          projection: ["name"],
          pk: { composite: ["tenantId"] },
          sk: { composite: ["email"] },
        },
        keysOnlyCompositeNoSk: {
          index: "gsi3-index",
          type: "composite",
          projection: "keys_only",
          pk: { composite: ["email"] },
        },
        includeCompositeNoSk: {
          index: "gsi4-index",
          type: "composite",
          projection: ["name", "age"],
          pk: { composite: ["email"] },
        },
      },
    },
    { table, client },
  );
}

describe("composite index projection tests", () => {
  const service = uuid();
  const entity = createEntity(service);

  const tenantId = uuid();
  const email = `${uuid()}@test.com`;
  const testItem = {
    tenantId,
    status: "active",
    name: "Test User",
    email,
    age: 30,
  };

  before(async () => {
    await entity.put(testItem).go();
  });

  describe("keys_only composite index with sk", () => {
    it("should return composite key attributes (tenantId and age)", async () => {
      const result = await entity.query
        .keysOnlyComposite({ tenantId })
        .go();

      expect(result.data).to.have.length.greaterThan(0);
      const item = result.data[0];
      expect(item.tenantId).to.equal(tenantId);
      expect(item.age).to.equal(30);
    });

    it("should not return non-key attributes", async () => {
      const result = await entity.query
        .keysOnlyComposite({ tenantId })
        .go();

      const item = result.data[0] as any;
      expect(item.name).to.be.undefined;
      expect(item.email).to.be.undefined;
      expect(item.status).to.be.undefined;
    });

    it("should support attributes parameter with composite key attributes", async () => {
      const result = await entity.query
        .keysOnlyComposite({ tenantId })
        .go({ attributes: ["tenantId"] });

      expect(result.data).to.have.length.greaterThan(0);
      expect(result.data[0].tenantId).to.equal(tenantId);
    });

    it("should support sk range queries with gte", async () => {
      const result = await entity.query
        .keysOnlyComposite({ tenantId })
        .gte({ age: 25 })
        .go();

      expect(result.data).to.have.length.greaterThan(0);
      expect(result.data[0].age).to.be.gte(25);
    });

    it("should support between queries on sk", async () => {
      const result = await entity.query
        .keysOnlyComposite({ tenantId })
        .between({ age: 20 }, { age: 40 })
        .go();

      expect(result.data).to.have.length.greaterThan(0);
      expect(result.data[0].age).to.be.within(20, 40);
    });
  });

  describe("array projection composite index with sk", () => {
    it("should return composite key attributes plus projected attributes", async () => {
      const result = await entity.query
        .includeComposite({ tenantId })
        .go();

      expect(result.data).to.have.length.greaterThan(0);
      const item = result.data[0];
      expect(item.tenantId).to.equal(tenantId);
      expect(item.email).to.equal(email);
      expect(item.name).to.equal("Test User");
    });

    it("should not return non-projected non-key attributes", async () => {
      const result = await entity.query
        .includeComposite({ tenantId })
        .go();

      const item = result.data[0] as any;
      expect(item.age).to.be.undefined;
      expect(item.status).to.be.undefined;
    });

    it("should support where clause on non-key projected attributes", async () => {
      const result = await entity.query
        .includeComposite({ tenantId })
        .where((attrs, ops) => ops.eq(attrs.name, "Test User"))
        .go();

      expect(result.data).to.have.length.greaterThan(0);
      expect(result.data[0].name).to.equal("Test User");
    });

    it("should support attributes parameter with composite key + projected attrs", async () => {
      const result = await entity.query
        .includeComposite({ tenantId })
        .go({ attributes: ["tenantId", "name"] });

      expect(result.data).to.have.length.greaterThan(0);
      expect(result.data[0].tenantId).to.equal(tenantId);
      expect(result.data[0].name).to.equal("Test User");
    });

    it("should support attributes with only composite key attrs", async () => {
      const result = await entity.query
        .includeComposite({ tenantId })
        .go({ attributes: ["email"] });

      expect(result.data).to.have.length.greaterThan(0);
      expect(result.data[0].email).to.equal(email);
    });
  });

  describe("keys_only composite index without sk", () => {
    it("should return pk composite attribute", async () => {
      const result = await entity.query
        .keysOnlyCompositeNoSk({ email })
        .go();

      expect(result.data).to.have.length.greaterThan(0);
      expect(result.data[0].email).to.equal(email);
    });

    it("should not return non-key attributes", async () => {
      const result = await entity.query
        .keysOnlyCompositeNoSk({ email })
        .go();

      const item = result.data[0] as any;
      expect(item.name).to.be.undefined;
      expect(item.age).to.be.undefined;
      expect(item.tenantId).to.be.undefined;
      expect(item.status).to.be.undefined;
    });

    it("should support attributes parameter with pk composite attribute", async () => {
      const result = await entity.query
        .keysOnlyCompositeNoSk({ email })
        .go({ attributes: ["email"] });

      expect(result.data).to.have.length.greaterThan(0);
      expect(result.data[0].email).to.equal(email);
    });
  });

  describe("array projection composite index without sk", () => {
    it("should return pk composite attribute plus projected attributes", async () => {
      const result = await entity.query
        .includeCompositeNoSk({ email })
        .go();

      expect(result.data).to.have.length.greaterThan(0);
      const item = result.data[0];
      expect(item.email).to.equal(email);
      expect(item.name).to.equal("Test User");
      expect(item.age).to.equal(30);
    });

    it("should not return non-projected non-key attributes", async () => {
      const result = await entity.query
        .includeCompositeNoSk({ email })
        .go();

      const item = result.data[0] as any;
      expect(item.tenantId).to.be.undefined;
      expect(item.status).to.be.undefined;
    });

    it("should support where clause on non-key projected attrs", async () => {
      const result = await entity.query
        .includeCompositeNoSk({ email })
        .where((attrs, ops) => ops.eq(attrs.name, "Test User"))
        .go();

      expect(result.data).to.have.length.greaterThan(0);
    });

    it("should support attributes parameter", async () => {
      const result = await entity.query
        .includeCompositeNoSk({ email })
        .go({ attributes: ["email", "name"] });

      expect(result.data).to.have.length.greaterThan(0);
      expect(result.data[0].email).to.equal(email);
      expect(result.data[0].name).to.equal("Test User");
    });
  });

  describe("collection queries", () => {
    function createEntity2(service: string) {
      return new Entity(
        {
          model: {
            entity: "compositeProjection2",
            version: "1",
            service,
          },
          attributes: {
            tenantId: { type: "string", required: true },
            age: { type: "number" },
            email: { type: "string" },
            name: { type: "string" },
            category: { type: "string" },
            score: { type: "number" },
          },
          indexes: {
            primary: {
              pk: { field: "pk", composite: ["tenantId"] },
              sk: { field: "sk", composite: ["category"] },
            },
            keysOnlyComposite: {
              index: "gsi1-index",
              type: "composite",
              collection: "compositeKeysOnly",
              projection: "keys_only",
              pk: { composite: ["tenantId"] },
              sk: { composite: ["age"] },
            },
            includeComposite: {
              index: "gsi2-index",
              type: "composite",
              collection: "compositeInclude",
              projection: ["name"],
              pk: { composite: ["tenantId"] },
              sk: { composite: ["email"] },
            },
          },
        },
        { table, client },
      );
    }

    const collectionService = uuid();
    const entity1 = createEntity(collectionService);
    const entity2 = createEntity2(collectionService);
    const svc = new Service({ entity1, entity2 });

    const collectionTenantId = uuid();
    const entity1Email = `${uuid()}@test.com`;
    const entity2Email = `${uuid()}@test.com`;

    before(async () => {
      await entity1.put({
        tenantId: collectionTenantId,
        status: "active",
        name: "Entity1User",
        email: entity1Email,
        age: 30,
      }).go();
      await entity2.put({
        tenantId: collectionTenantId,
        category: "catA",
        age: 40,
        email: entity2Email,
        score: 100,
      }).go();
    });

    it("should return items from both entities via keys_only collection", async () => {
      const result = await svc.collections
        .compositeKeysOnly({ tenantId: collectionTenantId })
        .go();

      expect(result.data.entity1).to.have.length.greaterThan(0);
      expect(result.data.entity2).to.have.length.greaterThan(0);
      expect(result.data.entity1[0].tenantId).to.equal(collectionTenantId);
      expect(result.data.entity1[0].age).to.equal(30);
      expect(result.data.entity2[0].tenantId).to.equal(collectionTenantId);
      expect(result.data.entity2[0].age).to.equal(40);
    });

    it("should not return non-key attributes from keys_only collection", async () => {
      const result = await svc.collections
        .compositeKeysOnly({ tenantId: collectionTenantId })
        .go();

      const item1 = result.data.entity1[0] as any;
      expect(item1.name).to.be.undefined;
      expect(item1.email).to.be.undefined;
      const item2 = result.data.entity2[0] as any;
      expect(item2.category).to.be.undefined;
      expect(item2.score).to.be.undefined;
    });

    it("should return items from both entities via include collection", async () => {
      const result = await svc.collections
        .compositeInclude({ tenantId: collectionTenantId })
        .go();

      expect(result.data.entity1).to.have.length.greaterThan(0);
      expect(result.data.entity2).to.have.length.greaterThan(0);
      expect(result.data.entity1[0].tenantId).to.equal(collectionTenantId);
      expect(result.data.entity1[0].email).to.equal(entity1Email);
      expect(result.data.entity1[0].name).to.equal("Entity1User");
      expect(result.data.entity2[0].tenantId).to.equal(collectionTenantId);
      expect(result.data.entity2[0].email).to.equal(entity2Email);
    });

    it("should not return non-projected non-key attributes from include collection", async () => {
      const result = await svc.collections
        .compositeInclude({ tenantId: collectionTenantId })
        .go();

      const item1 = result.data.entity1[0] as any;
      expect(item1.age).to.be.undefined;
      expect(item1.status).to.be.undefined;
      const item2 = result.data.entity2[0] as any;
      expect(item2.age).to.be.undefined;
      expect(item2.category).to.be.undefined;
      expect(item2.score).to.be.undefined;
    });

    it("should support attributes parameter on collection query", async () => {
      const result = await svc.collections
        .compositeInclude({ tenantId: collectionTenantId })
        .go({ attributes: ["tenantId", "email"] });

      expect(result.data.entity1).to.have.length.greaterThan(0);
      expect(result.data.entity1[0].tenantId).to.equal(collectionTenantId);
      expect(result.data.entity1[0].email).to.equal(entity1Email);
    });
  });

  describe("multiple items", () => {
    const multiTenantId = uuid();
    const items = [
      { tenantId: multiTenantId, status: "active", name: "Alice", email: `${uuid()}@test.com`, age: 25 },
      { tenantId: multiTenantId, status: "inactive", name: "Bob", email: `${uuid()}@test.com`, age: 35 },
      { tenantId: multiTenantId, status: "pending", name: "Charlie", email: `${uuid()}@test.com`, age: 45 },
    ];

    before(async () => {
      await Promise.all(items.map((item) => entity.put(item).go()));
    });

    it("should return multiple items from keys_only composite query", async () => {
      const result = await entity.query
        .keysOnlyComposite({ tenantId: multiTenantId })
        .go();

      expect(result.data).to.have.lengthOf(3);
      const ages = result.data.map((d) => d.age).sort();
      expect(ages).to.deep.equal([25, 35, 45]);
    });

    it("should support sk range queries across multiple items", async () => {
      const result = await entity.query
        .keysOnlyComposite({ tenantId: multiTenantId })
        .between({ age: 30 }, { age: 50 })
        .go();

      expect(result.data).to.have.lengthOf(2);
      result.data.forEach((item) => {
        expect(item.age).to.be.within(30, 50);
      });
    });

    it("should return multiple items from include composite query with all expected attrs", async () => {
      const result = await entity.query
        .includeComposite({ tenantId: multiTenantId })
        .go();

      expect(result.data).to.have.lengthOf(3);
      result.data.forEach((item) => {
        expect(item.tenantId).to.equal(multiTenantId);
        expect(item.email).to.be.a("string");
        expect(item.name).to.be.a("string");
      });
    });

    it("should filter with where clause on non-key projected attributes", async () => {
      const result = await entity.query
        .includeComposite({ tenantId: multiTenantId })
        .where((attrs, ops) => ops.eq(attrs.name, "Alice"))
        .go();

      expect(result.data).to.have.lengthOf(1);
      expect(result.data[0].name).to.equal("Alice");
    });
  });
});
