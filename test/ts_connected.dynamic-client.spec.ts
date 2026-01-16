process.env.AWS_NODEJS_CONNECTION_REUSE_ENABLED = "1";
import { Entity, Service } from "../index";
import { expect } from "chai";
import { v4 as uuid } from "uuid";
import DynamoDB from "aws-sdk/clients/dynamodb";

const table = "electro";

function createClient() {
  return new DynamoDB.DocumentClient({
    region: "us-east-1",
    endpoint: process.env.LOCAL_DYNAMO_ENDPOINT ?? "http://localhost:8000",
    credentials: {
      accessKeyId: "test",
      secretAccessKey: "test",
    },
  });
}

const primaryClient = createClient();
const alternateClient = createClient();

function createTrackingClient(realClient: DynamoDB.DocumentClient) {
  const calls: { method: string; params: any }[] = [];

  const trackingClient = {
    get: (params: any) => {
      calls.push({ method: "get", params });
      return realClient.get(params);
    },
    put: (params: any) => {
      calls.push({ method: "put", params });
      return realClient.put(params);
    },
    update: (params: any) => {
      calls.push({ method: "update", params });
      return realClient.update(params);
    },
    delete: (params: any) => {
      calls.push({ method: "delete", params });
      return realClient.delete(params);
    },
    query: (params: any) => {
      calls.push({ method: "query", params });
      return realClient.query(params);
    },
    scan: (params: any) => {
      calls.push({ method: "scan", params });
      return realClient.scan(params);
    },
    batchGet: (params: any) => {
      calls.push({ method: "batchGet", params });
      return realClient.batchGet(params);
    },
    batchWrite: (params: any) => {
      calls.push({ method: "batchWrite", params });
      return realClient.batchWrite(params);
    },
    transactGet: (params: any) => {
      calls.push({ method: "transactGet", params });
      return realClient.transactGet(params);
    },
    transactWrite: (params: any) => {
      calls.push({ method: "transactWrite", params });
      return realClient.transactWrite(params);
    },
    createSet: (list: any, options?: any) => {
      return realClient.createSet(list, options);
    },
    getCalls: () => calls,
    clearCalls: () => {
      calls.length = 0;
    },
  };

  return trackingClient;
}

const serviceName = uuid();

function createTestEntity(options: { client?: any; table: string }) {
  return new Entity(
    {
      model: {
        service: serviceName,
        entity: "testEntity",
        version: "1",
      },
      attributes: {
        id: {
          type: "string",
        },
        data: {
          type: "string",
        },
        category: {
          type: "string",
        },
      },
      indexes: {
        primary: {
          pk: {
            field: "pk",
            composite: ["id"],
          },
          sk: {
            field: "sk",
            composite: [],
          },
        },
        byCategory: {
          index: "gsi1pk-gsi1sk-index",
          collection: "items",
          pk: {
            field: "gsi1pk",
            composite: ["category"],
          },
          sk: {
            field: "gsi1sk",
            composite: ["id"],
          },
        },
      },
    },
    options,
  );
}

function createTestService(options: { client?: any; table: string }) {
  const entity1 = new Entity(
    {
      model: {
        service: serviceName,
        entity: "serviceEntity1",
        version: "1",
      },
      attributes: {
        id: {
          type: "string",
        },
        data: {
          type: "string",
        },
        category: {
          type: "string",
        },
      },
      indexes: {
        primary: {
          pk: {
            field: "pk",
            composite: ["id"],
          },
          sk: {
            field: "sk",
            composite: [],
          },
        },
        byCategory: {
          index: "gsi1pk-gsi1sk-index",
          collection: "serviceItems",
          pk: {
            field: "gsi1pk",
            composite: ["category"],
          },
          sk: {
            field: "gsi1sk",
            composite: ["id"],
          },
        },
      },
    },
    options,
  );

  const entity2 = new Entity(
    {
      model: {
        service: serviceName,
        entity: "serviceEntity2",
        version: "1",
      },
      attributes: {
        id: {
          type: "string",
        },
        info: {
          type: "string",
        },
        category: {
          type: "string",
        },
      },
      indexes: {
        primary: {
          pk: {
            field: "pk",
            composite: ["id"],
          },
          sk: {
            field: "sk",
            composite: [],
          },
        },
        byCategory: {
          index: "gsi1pk-gsi1sk-index",
          collection: "serviceItems",
          pk: {
            field: "gsi1pk",
            composite: ["category"],
          },
          sk: {
            field: "gsi1sk",
            composite: ["id"],
          },
        },
      },
    },
    options,
  );

  return new Service({ entity1, entity2 });
}

describe("Dynamic Client", () => {
  describe("Entity Operations", () => {
    it("should use dynamic client for get operation", async () => {
      const instanceClient = createTrackingClient(primaryClient);
      const goClient = createTrackingClient(alternateClient);

      const entity = createTestEntity({ client: instanceClient, table });
      const id = uuid();

      await entity.put({ id, data: "test", category: "cat1" }).go();
      instanceClient.clearCalls();

      await entity.get({ id }).go({ client: goClient });

      expect(instanceClient.getCalls()).to.have.length(0);
      expect(goClient.getCalls()).to.have.length(1);
      expect(goClient.getCalls()[0].method).to.equal("get");
    });

    it("should use dynamic client for put operation", async () => {
      const instanceClient = createTrackingClient(primaryClient);
      const goClient = createTrackingClient(alternateClient);

      const entity = createTestEntity({ client: instanceClient, table });
      const id = uuid();

      await entity.put({ id, data: "test", category: "cat1" }).go({ client: goClient });

      expect(instanceClient.getCalls()).to.have.length(0);
      expect(goClient.getCalls()).to.have.length(1);
      expect(goClient.getCalls()[0].method).to.equal("put");
    });

    it("should use dynamic client for update operation", async () => {
      const instanceClient = createTrackingClient(primaryClient);
      const goClient = createTrackingClient(alternateClient);

      const entity = createTestEntity({ client: instanceClient, table });
      const id = uuid();

      await entity.put({ id, data: "test", category: "cat1" }).go();
      instanceClient.clearCalls();

      await entity
        .update({ id })
        .set({ data: "updated" })
        .go({ client: goClient });

      expect(instanceClient.getCalls()).to.have.length(0);
      expect(goClient.getCalls()).to.have.length(1);
      expect(goClient.getCalls()[0].method).to.equal("update");
    });

    it("should use dynamic client for delete operation", async () => {
      const instanceClient = createTrackingClient(primaryClient);
      const goClient = createTrackingClient(alternateClient);

      const entity = createTestEntity({ client: instanceClient, table });
      const id = uuid();

      await entity.put({ id, data: "test", category: "cat1" }).go();
      instanceClient.clearCalls();

      await entity.delete({ id }).go({ client: goClient });

      expect(instanceClient.getCalls()).to.have.length(0);
      expect(goClient.getCalls()).to.have.length(1);
      expect(goClient.getCalls()[0].method).to.equal("delete");
    });

    it("should use dynamic client for query operation", async () => {
      const instanceClient = createTrackingClient(primaryClient);
      const goClient = createTrackingClient(alternateClient);

      const entity = createTestEntity({ client: instanceClient, table });
      const id = uuid();

      await entity.put({ id, data: "test", category: "cat1" }).go();
      instanceClient.clearCalls();

      await entity.query.primary({ id }).go({ client: goClient });

      expect(instanceClient.getCalls()).to.have.length(0);
      expect(goClient.getCalls()).to.have.length(1);
      expect(goClient.getCalls()[0].method).to.equal("query");
    });

    it("should use dynamic client for scan operation", async () => {
      const instanceClient = createTrackingClient(primaryClient);
      const goClient = createTrackingClient(alternateClient);

      const entity = createTestEntity({ client: instanceClient, table });

      await entity.scan.go({ client: goClient });

      expect(instanceClient.getCalls()).to.have.length(0);
      expect(goClient.getCalls()).to.have.length(1);
      expect(goClient.getCalls()[0].method).to.equal("scan");
    });

    it("should fall back to instance client when no go-time client is provided", async () => {
      const instanceClient = createTrackingClient(primaryClient);

      const entity = createTestEntity({ client: instanceClient, table });
      const id = uuid();

      await entity.put({ id, data: "test", category: "cat1" }).go();

      expect(instanceClient.getCalls()).to.have.length(1);
      expect(instanceClient.getCalls()[0].method).to.equal("put");
    });
  });

  describe("Collection Queries", () => {
    it("should use dynamic client for collection query", async () => {
      const instanceClient = createTrackingClient(primaryClient);
      const goClient = createTrackingClient(alternateClient);

      const service = createTestService({ client: instanceClient, table });
      const category = uuid();
      const id1 = uuid();
      const id2 = uuid();

      await service.entities.entity1.put({ id: id1, data: "test1", category }).go();
      await service.entities.entity2.put({ id: id2, info: "test2", category }).go();
      instanceClient.clearCalls();

      await service.collections.serviceItems({ category }).go({ client: goClient });

      expect(instanceClient.getCalls()).to.have.length(0);
      expect(goClient.getCalls()).to.have.length(1);
      expect(goClient.getCalls()[0].method).to.equal("query");
    });
  });

  describe("Batch Operations", () => {
    it("should use dynamic client for batch get operation", async () => {
      const instanceClient = createTrackingClient(primaryClient);
      const goClient = createTrackingClient(alternateClient);

      const entity = createTestEntity({ client: instanceClient, table });
      const id1 = uuid();
      const id2 = uuid();

      await entity.put({ id: id1, data: "test1", category: "cat1" }).go();
      await entity.put({ id: id2, data: "test2", category: "cat1" }).go();
      instanceClient.clearCalls();

      await entity.get([{ id: id1 }, { id: id2 }]).go({ client: goClient });

      expect(instanceClient.getCalls()).to.have.length(0);
      expect(goClient.getCalls().length).to.be.greaterThan(0);
      expect(goClient.getCalls()[0].method).to.equal("batchGet");
    });

    it("should use dynamic client for batch put operation", async () => {
      const instanceClient = createTrackingClient(primaryClient);
      const goClient = createTrackingClient(alternateClient);

      const entity = createTestEntity({ client: instanceClient, table });
      const id1 = uuid();
      const id2 = uuid();

      await entity
        .put([
          { id: id1, data: "test1", category: "cat1" },
          { id: id2, data: "test2", category: "cat1" },
        ])
        .go({ client: goClient });

      expect(instanceClient.getCalls()).to.have.length(0);
      expect(goClient.getCalls().length).to.be.greaterThan(0);
      expect(goClient.getCalls()[0].method).to.equal("batchWrite");
    });

    it("should use dynamic client for batch delete operation", async () => {
      const instanceClient = createTrackingClient(primaryClient);
      const goClient = createTrackingClient(alternateClient);

      const entity = createTestEntity({ client: instanceClient, table });
      const id1 = uuid();
      const id2 = uuid();

      await entity.put({ id: id1, data: "test1", category: "cat1" }).go();
      await entity.put({ id: id2, data: "test2", category: "cat1" }).go();
      instanceClient.clearCalls();

      await entity.delete([{ id: id1 }, { id: id2 }]).go({ client: goClient });

      expect(instanceClient.getCalls()).to.have.length(0);
      expect(goClient.getCalls().length).to.be.greaterThan(0);
      expect(goClient.getCalls()[0].method).to.equal("batchWrite");
    });
  });

  describe("Transactions", () => {
    it("should use dynamic client for transaction write", async () => {
      const instanceClient = createTrackingClient(primaryClient);
      const goClient = createTrackingClient(alternateClient);

      const service = createTestService({ client: instanceClient, table });
      const id1 = uuid();
      const id2 = uuid();

      await service.transaction
        .write(({ entity1, entity2 }) => [
          entity1.put({ id: id1, data: "txn-test1", category: "cat1" }).commit(),
          entity2.put({ id: id2, info: "txn-test2", category: "cat1" }).commit(),
        ])
        .go({ client: goClient });

      expect(instanceClient.getCalls()).to.have.length(0);
      expect(goClient.getCalls()).to.have.length(1);
      expect(goClient.getCalls()[0].method).to.equal("transactWrite");
    });

    it("should use dynamic client for transaction get", async () => {
      const instanceClient = createTrackingClient(primaryClient);
      const goClient = createTrackingClient(alternateClient);

      const service = createTestService({ client: instanceClient, table });
      const id1 = uuid();
      const id2 = uuid();

      await service.entities.entity1.put({ id: id1, data: "test1", category: "cat1" }).go();
      await service.entities.entity2.put({ id: id2, info: "test2", category: "cat1" }).go();
      instanceClient.clearCalls();

      await service.transaction
        .get(({ entity1, entity2 }) => [
          entity1.get({ id: id1 }).commit(),
          entity2.get({ id: id2 }).commit(),
        ])
        .go({ client: goClient });

      expect(instanceClient.getCalls()).to.have.length(0);
      expect(goClient.getCalls()).to.have.length(1);
      expect(goClient.getCalls()[0].method).to.equal("transactGet");
    });
  });

  describe("Edge Cases", () => {
    it("should throw error when no client is provided at instance level or go time", async () => {
      const entity = createTestEntity({ table });
      const id = uuid();

      try {
        await entity.get({ id }).go();
        expect.fail("Should have thrown an error");
      } catch (err: any) {
        expect(err.message).to.include("No client defined on model or provided in query options");
      }
    });

    it("should allow operation with only go-time client (no instance client)", async () => {
      const goClient = createTrackingClient(alternateClient);
      const entity = createTestEntity({ table });
      const id = uuid();

      await entity.put({ id, data: "test", category: "cat1" }).go({ client: goClient });

      expect(goClient.getCalls()).to.have.length(1);
      expect(goClient.getCalls()[0].method).to.equal("put");

      goClient.clearCalls();
      const result = await entity.get({ id }).go({ client: goClient });
      expect(result.data).to.deep.equal({ id, data: "test", category: "cat1" });
    });

    it("should normalize v2 client provided at go time", async () => {
      const entity = createTestEntity({ table });
      const id = uuid();

      await entity.put({ id, data: "test", category: "cat1" }).go({ client: primaryClient });

      const result = await entity.get({ id }).go({ client: primaryClient });
      expect(result.data).to.deep.equal({ id, data: "test", category: "cat1" });
    });

    it("should use go-time client for multiple pages in pagination", async () => {
      const instanceClient = createTrackingClient(primaryClient);
      const goClient = createTrackingClient(alternateClient);

      const entity = createTestEntity({ client: instanceClient, table });
      const category = uuid();

      for (let i = 0; i < 5; i++) {
        await entity.put({ id: uuid(), data: `test${i}`, category }).go();
      }
      instanceClient.clearCalls();

      await entity.query
        .byCategory({ category })
        .go({ client: goClient, limit: 2, pages: "all" });

      expect(instanceClient.getCalls()).to.have.length(0);
      expect(goClient.getCalls().length).to.be.gte(1);
      goClient.getCalls().forEach((call) => {
        expect(call.method).to.equal("query");
      });
    });
  });
});
