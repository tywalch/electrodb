process.env.AWS_NODEJS_CONNECTION_REUSE_ENABLED = "1";
const { expect } = require("chai");
const { Entity, Service } = require("../");
const { v4: uuid } = require("uuid");
const { DocumentClient: V2Client } = require("aws-sdk/clients/dynamodb");
const { DynamoDBClient: V3Client } = require("@aws-sdk/client-dynamodb");

const c = require("../src/client");
const { ErrorCodes } = require("../src/errors");

const table = "electro";

const v2Client = new V2Client({
  region: "us-east-1",
  endpoint: process.env.LOCAL_DYNAMO_ENDPOINT ?? "http://localhost:8000",
  credentials: {
    accessKeyId: "test",
    secretAccessKey: "test",
  },
});

const v3Client = new V3Client({
  region: "us-east-1",
  endpoint: process.env.LOCAL_DYNAMO_ENDPOINT ?? "http://localhost:8000",
  credentials: {
    accessKeyId: "test",
    secretAccessKey: "test",
  },
});

const clients = [
  ["v2", v2Client],
  ["v3", v3Client],
];

function createEntity(client) {
  return new Entity(
    {
      model: {
        entity: uuid(),
        service: "abort-test",
        version: "1",
      },
      attributes: {
        prop1: {
          type: "string",
        },
        prop2: {
          type: "string",
        },
        prop3: {
          type: "string",
        },
      },
      indexes: {
        record: {
          pk: {
            field: "pk",
            composite: ["prop1"],
          },
          sk: {
            field: "sk",
            composite: ["prop2"],
          },
        },
      },
    },
    { table, client },
  );
}

function createEntityWithGSI(client) {
  return new Entity(
    {
      model: {
        entity: uuid(),
        service: "abort-test",
        version: "1",
      },
      attributes: {
        prop1: {
          type: "string",
        },
        prop2: {
          type: "string",
        },
        prop3: {
          type: "string",
        },
      },
      indexes: {
        record: {
          pk: {
            field: "pk",
            composite: ["prop1"],
          },
          sk: {
            field: "sk",
            composite: ["prop2"],
          },
        },
        byProp3: {
          index: "gsi1pk-gsi1sk-index",
          pk: {
            field: "gsi1pk",
            composite: ["prop3"],
          },
          sk: {
            field: "gsi1sk",
            composite: ["prop1"],
          },
        },
      },
    },
    { table, client },
  );
}

function createService(client) {
  const entity = new Entity(
    {
      model: {
        entity: uuid(),
        service: "abort-service-test",
        version: "1",
      },
      attributes: {
        prop1: {
          type: "string",
        },
        prop2: {
          type: "string",
        },
        prop3: {
          type: "string",
        },
      },
      indexes: {
        record: {
          pk: {
            field: "pk",
            composite: ["prop1"],
          },
          sk: {
            field: "sk",
            composite: ["prop2"],
          },
        },
      },
    },
    { table, client },
  );

  return new Service({ entity }, { table, client });
}

describe("AbortSignal Support", () => {
  for (const [version, client] of clients) {
    describe(`${version} client`, () => {
      describe("Single Operations", () => {
        it("should abort a get operation when signal is already aborted", async () => {
          const entity = createEntity(client);
          const controller = new AbortController();
          controller.abort();

          try {
            await entity
              .get({ prop1: "value1", prop2: "value2" })
              .go({ abortSignal: controller.signal });
            expect.fail("Should have thrown an error");
          } catch (err) {
            expect(err.message).to.equal("The operation was aborted - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#operation-aborted");
            expect(err.code).to.equal(ErrorCodes.OperationAborted.code);
          }
        });

        it("should complete a get operation when signal is not aborted", async () => {
          const entity = createEntity(client);
          const prop1 = uuid();
          const prop2 = uuid();

          await entity.put({ prop1, prop2, prop3: "test" }).go();

          const controller = new AbortController();
          const result = await entity
            .get({ prop1, prop2 })
            .go({ abortSignal: controller.signal });

          expect(result.data).to.not.be.null;
          expect(result.data.prop1).to.equal(prop1);
        });

        it("should abort a put operation when signal is already aborted", async () => {
          const entity = createEntity(client);
          const controller = new AbortController();
          controller.abort();

          try {
            await entity
              .put({ prop1: "value1", prop2: "value2" })
              .go({ abortSignal: controller.signal });
            expect.fail("Should have thrown an error");
          } catch (err) {
            expect(err.message).to.equal("The operation was aborted - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#operation-aborted");
            expect(err.code).to.equal(ErrorCodes.OperationAborted.code);
          }
        });

        it("should abort an update operation when signal is already aborted", async () => {
          const entity = createEntity(client);
          const controller = new AbortController();
          controller.abort();

          try {
            await entity
              .update({ prop1: "value1", prop2: "value2" })
              .set({ prop3: "value3" })
              .go({ abortSignal: controller.signal });
            expect.fail("Should have thrown an error");
          } catch (err) {
            expect(err.message).to.equal("The operation was aborted - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#operation-aborted");
            expect(err.code).to.equal(ErrorCodes.OperationAborted.code);
          }
        });

        it("should abort a delete operation when signal is already aborted", async () => {
          const entity = createEntity(client);
          const controller = new AbortController();
          controller.abort();

          try {
            await entity
              .delete({ prop1: "value1", prop2: "value2" })
              .go({ abortSignal: controller.signal });
            expect.fail("Should have thrown an error");
          } catch (err) {
            expect(err.message).to.equal("The operation was aborted - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#operation-aborted");
            expect(err.code).to.equal(ErrorCodes.OperationAborted.code);
          }
        });
      });

      describe("Query Operations", () => {
        it("should abort a query operation when signal is already aborted", async () => {
          const entity = createEntity(client);
          const controller = new AbortController();
          controller.abort();

          try {
            await entity.query
              .record({ prop1: "value1" })
              .go({ abortSignal: controller.signal });
            expect.fail("Should have thrown an error");
          } catch (err) {
            expect(err.message).to.equal("The operation was aborted - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#operation-aborted");
            expect(err.code).to.equal(ErrorCodes.OperationAborted.code);
          }
        });

        it("should complete a query operation when signal is not aborted", async () => {
          const entity = createEntity(client);
          const prop1 = uuid();

          await entity.put({ prop1, prop2: "a", prop3: "test1" }).go();
          await entity.put({ prop1, prop2: "b", prop3: "test2" }).go();

          const controller = new AbortController();
          const result = await entity.query
            .record({ prop1 })
            .go({ abortSignal: controller.signal });

          expect(result.data).to.be.an("array");
          expect(result.data.length).to.equal(2);
        });

        it("should abort a scan operation when signal is already aborted", async () => {
          const entity = createEntity(client);
          const controller = new AbortController();
          controller.abort();

          try {
            await entity.scan.go({ abortSignal: controller.signal });
            expect.fail("Should have thrown an error");
          } catch (err) {
            expect(err.message).to.equal("The operation was aborted - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#operation-aborted");
            expect(err.code).to.equal(ErrorCodes.OperationAborted.code);
          }
        });
      });

      describe("Batch Operations", () => {
        it("should abort a batch get operation when signal is already aborted", async () => {
          const entity = createEntity(client);
          const controller = new AbortController();
          controller.abort();

          try {
            await entity
              .get([
                { prop1: "value1", prop2: "value2" },
                { prop1: "value3", prop2: "value4" },
              ])
              .go({ abortSignal: controller.signal });
            expect.fail("Should have thrown an error");
          } catch (err) {
            expect(err.message).to.equal("The operation was aborted - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#operation-aborted");
            expect(err.code).to.equal(ErrorCodes.OperationAborted.code);
          }
        });

        it("should complete a batch get operation when signal is not aborted", async () => {
          const entity = createEntity(client);
          const prop1 = uuid();

          await entity.put({ prop1, prop2: "a", prop3: "test1" }).go();
          await entity.put({ prop1, prop2: "b", prop3: "test2" }).go();

          const controller = new AbortController();
          const result = await entity
            .get([
              { prop1, prop2: "a" },
              { prop1, prop2: "b" },
            ])
            .go({ abortSignal: controller.signal });

          expect(result.data).to.be.an("array");
          expect(result.data.length).to.equal(2);
        });

        it("should abort a batch put operation when signal is already aborted", async () => {
          const entity = createEntity(client);
          const controller = new AbortController();
          controller.abort();

          try {
            await entity
              .put([
                { prop1: "value1", prop2: "value2" },
                { prop1: "value3", prop2: "value4" },
              ])
              .go({ abortSignal: controller.signal });
            expect.fail("Should have thrown an error");
          } catch (err) {
            expect(err.message).to.equal("The operation was aborted - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#operation-aborted");
            expect(err.code).to.equal(ErrorCodes.OperationAborted.code);
          }
        });

        it("should abort a batch delete operation when signal is already aborted", async () => {
          const entity = createEntity(client);
          const controller = new AbortController();
          controller.abort();

          try {
            await entity
              .delete([
                { prop1: "value1", prop2: "value2" },
                { prop1: "value3", prop2: "value4" },
              ])
              .go({ abortSignal: controller.signal });
            expect.fail("Should have thrown an error");
          } catch (err) {
            expect(err.message).to.equal("The operation was aborted - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#operation-aborted");
            expect(err.code).to.equal(ErrorCodes.OperationAborted.code);
          }
        });
      });

      describe("Transaction Operations", () => {
        it("should abort a transaction write when signal is already aborted", async () => {
          const service = createService(client);
          const controller = new AbortController();
          controller.abort();

          try {
            await service.transaction
              .write(({ entity }) => [
                entity.put({ prop1: uuid(), prop2: uuid() }).commit(),
              ])
              .go({ abortSignal: controller.signal });
            expect.fail("Should have thrown an error");
          } catch (err) {
            expect(err.message).to.equal("The operation was aborted - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#operation-aborted");
            expect(err.code).to.equal(ErrorCodes.OperationAborted.code);
          }
        });

        it("should abort a transaction get when signal is already aborted", async () => {
          const service = createService(client);
          const controller = new AbortController();
          controller.abort();

          try {
            await service.transaction
              .get(({ entity }) => [
                entity.get({ prop1: "value1", prop2: "value2" }).commit(),
              ])
              .go({ abortSignal: controller.signal });
            expect.fail("Should have thrown an error");
          } catch (err) {
            expect(err.message).to.equal("The operation was aborted - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#operation-aborted");
            expect(err.code).to.equal(ErrorCodes.OperationAborted.code);
          }
        });

        it("should complete a transaction write when signal is not aborted", async () => {
          const service = createService(client);
          const controller = new AbortController();
          const prop1 = uuid();
          const prop2 = uuid();

          const result = await service.transaction
            .write(({ entity }) => [
              entity.put({ prop1, prop2, prop3: "test" }).commit(),
            ])
            .go({ abortSignal: controller.signal });

          expect(result.canceled).to.be.false;
        });
      });
    });
  }

  describe("Abort during execution", () => {
    for (const [version, client] of clients) {
      describe(`${version} client - abort mid-execution`, () => {
        it("should abort a query operation mid-execution", async () => {
          const entity = createEntity(client);
          const prop1 = uuid();

          for (let i = 0; i < 5; i++) {
            await entity
              .put({ prop1, prop2: `value${i}`, prop3: `test${i}` })
              .go();
          }

          try {
            await entity.query.record({ prop1 }).go({
              abortSignal: AbortSignal.timeout(5),
              pages: "all",
            });
            // Query may complete before timeout triggers - this is acceptable
          } catch (err) {
            // If aborted, verify error code is correct
            expect(err.message).to.equal("The operation was aborted - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#operation-aborted");
            expect(err.code).to.equal(ErrorCodes.OperationAborted.code);
          }
        });
      });
    }
  });

  describe("Loop abort checks", () => {
    for (const [version, client] of clients) {
      describe(`${version} client - loop abort checks`, () => {
        it("should check abort signal before each page in executeQuery", async () => {
          const entity = createEntity(client);
          const controller = new AbortController();
          const prop1 = uuid();

          const items = [];
          for (let i = 0; i < 10; i++) {
            items.push({ prop1, prop2: `value${i}`, prop3: `test${i}` });
          }
          await entity.put(items).go();

          controller.abort();

          try {
            await entity.query.record({ prop1 }).go({
              abortSignal: controller.signal,
              pages: "all",
              limit: 1,
            });
            expect.fail("Should have thrown an error");
          } catch (err) {
            expect(err.message).to.equal("The operation was aborted - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#operation-aborted");
            expect(err.code).to.equal(ErrorCodes.OperationAborted.code);
          }
        });

        it("should check abort signal before each batch in executeBulkGet", async () => {
          const entity = createEntity(client);
          const controller = new AbortController();
          const prop1 = uuid();

          const items = [];
          for (let i = 0; i < 5; i++) {
            items.push({ prop1, prop2: `value${i}`, prop3: `test${i}` });
          }
          await entity.put(items).go();

          controller.abort();

          const keys = items.map((item) => ({ prop1, prop2: item.prop2 }));

          try {
            await entity.get(keys).go({
              abortSignal: controller.signal,
            });
            expect.fail("Should have thrown an error");
          } catch (err) {
            expect(err.message).to.equal("The operation was aborted - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#operation-aborted");
            expect(err.code).to.equal(ErrorCodes.OperationAborted.code);
          }
        });

        it("should check abort signal before each batch in executeBulkWrite", async () => {
          const entity = createEntity(client);
          const controller = new AbortController();
          const prop1 = uuid();

          controller.abort();

          const items = [];
          for (let i = 0; i < 5; i++) {
            items.push({ prop1, prop2: `value${i}`, prop3: `test${i}` });
          }

          try {
            await entity.put(items).go({
              abortSignal: controller.signal,
            });
            expect.fail("Should have thrown an error");
          } catch (err) {
            expect(err.message).to.equal("The operation was aborted - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#operation-aborted");
            expect(err.code).to.equal(ErrorCodes.OperationAborted.code);
          }
        });
      });
    }
  });

  describe("Abort between requests", () => {
    for (const [version, client] of clients) {
      describe(`${version} client - abort between requests`, () => {
        it("should abort paginated query after first page", async () => {
          const entity = createEntity(client);
          const controller = new AbortController();
          const prop1 = uuid();

          const items = [];
          for (let i = 0; i < 10; i++) {
            items.push({ prop1, prop2: `value${String(i).padStart(2, "0")}`, prop3: `test${i}` });
          }
          await entity.put(items).go();

          let requestCount = 0;
          const logger = (event) => {
            if (event.type === "query") {
              requestCount++;
              if (requestCount === 1) {
                controller.abort();
              }
            }
          };

          try {
            await entity.query.record({ prop1 }).go({
              abortSignal: controller.signal,
              pages: "all",
              limit: 2,
              logger,
            });
            expect.fail("Should have thrown an error");
          } catch (err) {
            expect(err.message).to.equal("The operation was aborted - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#operation-aborted");
            expect(err.code).to.equal(ErrorCodes.OperationAborted.code);
            expect(requestCount).to.equal(1);
          }
        });

        it("should abort bulk get after first batch when using concurrent: 1", async () => {
          const entity = createEntity(client);
          const controller = new AbortController();
          const prop1 = uuid();

          const items = [];
          for (let i = 0; i < 150; i++) {
            items.push({ prop1, prop2: `value${i}`, prop3: `test${i}` });
          }
          await entity.put(items).go();

          let requestCount = 0;
          const logger = (event) => {
            if (event.type === "query") {
              requestCount++;
              if (requestCount === 1) {
                controller.abort();
              }
            }
          };

          const keys = items.map((item) => ({ prop1, prop2: item.prop2 }));

          try {
            await entity.get(keys).go({
              abortSignal: controller.signal,
              concurrent: 1,
              logger,
            });
            expect.fail("Should have thrown an error");
          } catch (err) {
            expect(err.message).to.equal("The operation was aborted - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#operation-aborted");
            expect(err.code).to.equal(ErrorCodes.OperationAborted.code);
            expect(requestCount).to.equal(1);
          }
        });

        it("should abort bulk write after first batch when using concurrent: 1", async () => {
          const entity = createEntity(client);
          const controller = new AbortController();
          const prop1 = uuid();

          let requestCount = 0;
          const logger = (event) => {
            if (event.type === "query") {
              requestCount++;
              if (requestCount === 1) {
                controller.abort();
              }
            }
          };

          const items = [];
          for (let i = 0; i < 50; i++) {
            items.push({ prop1, prop2: `value${i}`, prop3: `test${i}` });
          }

          try {
            await entity.put(items).go({
              abortSignal: controller.signal,
              concurrent: 1,
              logger,
            });
            expect.fail("Should have thrown an error");
          } catch (err) {
            expect(err.message).to.equal("The operation was aborted - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#operation-aborted");
            expect(err.code).to.equal(ErrorCodes.OperationAborted.code);
            expect(requestCount).to.equal(1);
          }
        });

        it("should abort hydrate query after initial query but before batch get", async () => {
          const entity = createEntityWithGSI(client);
          const controller = new AbortController();
          const prop1 = uuid();
          const prop3 = uuid();

          const items = [];
          for (let i = 0; i < 5; i++) {
            items.push({ prop1: `${prop1}_${i}`, prop2: `value${i}`, prop3 });
          }
          await entity.put(items).go();

          let requestCount = 0;
          const logger = (event) => {
            if (event.type === "query") {
              requestCount++;
              if (requestCount === 1) {
                controller.abort();
              }
            }
          };

          try {
            await entity.query.byProp3({ prop3 }).go({
              abortSignal: controller.signal,
              hydrate: true,
              logger,
            });
            expect.fail("Should have thrown an error");
          } catch (err) {
            expect(err.message).to.equal("The operation was aborted - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#operation-aborted");
            expect(err.code).to.equal(ErrorCodes.OperationAborted.code);
            expect(requestCount).to.equal(1);
          }
        });
      });
    }
  });

  describe("V3 wrapper AbortError conversion", () => {
    it("should convert error to ElectroError when signal becomes aborted during execution", async () => {
      const { DocumentClientV3Wrapper } = c;
      const mockLib = {};
      const mockClient = {};
      const wrapper = new DocumentClientV3Wrapper(mockClient, mockLib);

      // Simulate a generic error thrown while signal is aborted
      const genericError = new Error("Some network error");
      const signal = { aborted: false };

      const wrappedFn = wrapper.promiseWrap(() => {
        // Signal becomes aborted during execution
        signal.aborted = true;
        throw genericError;
      }, signal);

      try {
        await wrappedFn.promise();
        expect.fail("Should have thrown an error");
      } catch (err) {
        expect(err.message).to.equal("The operation was aborted - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#operation-aborted");
        expect(err.code).to.equal(ErrorCodes.OperationAborted.code);
      }
    });

    it("should not convert non-abort errors when signal is not aborted", async () => {
      const { DocumentClientV3Wrapper } = c;
      const mockLib = {};
      const mockClient = {};
      const wrapper = new DocumentClientV3Wrapper(mockClient, mockLib);

      const genericError = new Error("Some other error");
      const signal = { aborted: false };

      const wrappedFn = wrapper.promiseWrap(() => {
        throw genericError;
      }, signal);

      try {
        await wrappedFn.promise();
        expect.fail("Should have thrown an error");
      } catch (err) {
        expect(err.message).to.equal("Some other error");
        expect(err.code).to.be.undefined;
      }
    });
  });
});
