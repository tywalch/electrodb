process.env.AWS_NODEJS_CONNECTION_REUSE_ENABLED = "1";
import {ElectroError, Entity, Service} from "../index";
import { expect } from "chai";
import { v4 as uuid } from "uuid";
import { DocumentClient as V2Client } from "aws-sdk/clients/dynamodb";
import { DynamoDBClient as V3Client } from "@aws-sdk/client-dynamodb";

const c = require("../src/client");

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
  [c.DocumentClientVersions.v2, v2Client],
  [c.DocumentClientVersions.v3, v3Client],
];

function createEntity(client?: typeof v2Client | typeof v3Client) {
  return new Entity(
    {
      model: {
        entity: uuid(),
        service: "client-test",
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
          type: "set",
          items: "string",
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

describe("dynamodb sdk client compatibility", () => {
  it("should validate the provide method has the require methods", () => {
    expect(() => createEntity({} as any)).to.throw(
      "Invalid DynamoDB Document Client provided. ElectroDB supports the v2 and v3 DynamoDB Document Clients from the aws-sdk - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#invalid-client-provided",
    );
  });
  for (const [version, client] of clients) {
    describe(`${version} client`, () => {
      const entity = createEntity(client);

      it("should create valid params for the get method", async () => {
        const prop1 = uuid();
        const prop2 = uuid();
        const results = await entity
          .get({
            prop1,
            prop2,
          })
          .go()
          .then((res) => res.data);

        expect(results).to.be.null;
      });

      it("should create valid params for the put method", async () => {
        const prop1 = uuid();
        const prop2 = uuid();
        const prop3 = [uuid()];
        const results = await entity
          .put({
            prop1,
            prop2,
            prop3,
          })
          .go({ response: "all_old" })
          .then((res) => res.data);

        expect(results).to.be.null;
      });

      it("should create valid params for the update method", async () => {
        const prop1 = uuid();
        const prop2 = uuid();
        const prop3 = [uuid()];
        const results = await entity
          .update({ prop1, prop2 })
          .set({
            prop3,
          })
          .go({ response: "all_new" })
          .then((res) => res.data);

        expect(results).to.deep.equal({
          prop1,
          prop2,
          prop3,
        });
      });

      it("should create valid params for the delete method", async () => {
        const prop1 = uuid();
        const prop2 = uuid();
        const results = await entity
          .delete({
            prop1,
            prop2,
          })
          .go({ response: "all_old" })
          .then((res) => res.data);

        expect(results).to.be.null;
      });

      it("should create valid params for the batchWrite (put) method", async () => {
        const prop1 = uuid();
        const prop2 = uuid();
        const prop3 = [uuid()];
        const results = await entity
          .put([
            {
              prop1,
              prop2,
              prop3,
            },
          ])
          .go({});
      });

      it("should create valid params for the batchWrite (delete) method", async () => {
        const prop1 = uuid();
        const prop2 = uuid();
        await entity
          .delete([
            {
              prop1,
              prop2,
            },
          ])
          .go({});
      });

      it("should create valid params for the batchGet method", async () => {
        const prop1 = uuid();
        const prop2 = uuid();
        await entity
          .get([
            {
              prop1,
              prop2,
            },
          ])
          .go();
      });

      it("should create valid params for the scan method", async () => {
        const results = await entity.scan.go().then((res) => res.data);
        expect(results).to.be.an("array");
      });

      it("should create valid params for the query method", async () => {
        const prop1 = uuid();
        const prop2 = uuid();
        const results = await entity.query
          .record({ prop1, prop2 })
          .go()
          .then((res) => res.data);
        expect(results).to.be.an("array");
      });

      describe('electro error params', () => {
        it('the params function should not be visible in console logs', async () => {
          const entity = new Entity(
            {
              model: {
                service: "tests",
                entity: uuid(),
                version: "1",
              },
              attributes: {
                prop1: {
                  type: "string",
                  default: () => uuid(),
                  field: "p",
                },
                prop2: {
                  type: "string",
                  required: true,
                  field: "r",
                },
                prop3: {
                  type: "string",
                  required: true,
                  field: "a",
                },
              },
              indexes: {
                farm: {
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
            {client, table: "electro"},
          );

          const prop1 = uuid();
          const prop2 = uuid();
          const prop3 = "abc";

          let params: Record<string, unknown> | undefined = undefined;
          await entity.create({prop1, prop2, prop3}).go();
          const results = await entity.create({prop1, prop2, prop3}).go()
            .then(() => null)
            .catch((err: ElectroError) => err);

          expect(results).to.not.be.null;

          if (results) {
            expect(JSON.parse(JSON.stringify(results))).to.not.have.keys('params');
            expect(Object.keys(results).find(key => key === 'params')).to.be.undefined;
            console.log(results);
          }  
        });

        it('should return null parameters if error occurs prior to compiling parameters', async () => {
          const entity = new Entity(
            {
              model: {
                service: "tests",
                entity: uuid(),
                version: "1",
              },
              attributes: {
                prop1: {
                  type: "string",
                  default: () => uuid(),
                  field: "p",
                },
                prop2: {
                  type: "string",
                  required: true,
                  field: "r",
                },
                prop3: {
                  type: "string",
                  required: true,
                  field: "a",
                  validate: (val) => {
                    return val !== "abc";
                  }
                },
              },
              indexes: {
                farm: {
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
            {client, table: "electro"},
          );

          const prop1 = uuid();
          const prop2 = uuid();
          const prop3 = "abc";

          let params: Record<string, unknown> | undefined = undefined;
          
          
          const results = await entity.create({prop1, prop2, prop3}).go({
              logger: (event) => {
                if (event.type === 'query') {
                  params = event.params;
                }
              }
            })
            .then(() => null)
            .catch((err: ElectroError) => err);

          expect(params).to.be.undefined;  
          expect(results).to.not.be.null;

          if (results) {
            expect(results.params()).to.be.null;
          } 
        });

        it('should return the parameters sent to DynamoDB if available', async () => {
          const entity = new Entity(
            {
              model: {
                service: "tests",
                entity: uuid(),
                version: "1",
              },
              attributes: {
                prop1: {
                  type: "string",
                  default: () => uuid(),
                  field: "p",
                },
                prop2: {
                  type: "string",
                  required: true,
                  field: "r",
                },
                prop3: {
                  type: "string",
                  required: true,
                  field: "a",
                },
              },
              indexes: {
                farm: {
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
            {client, table: "electro"},
          );

          const prop1 = uuid();
          const prop2 = uuid();
          const prop3 = "abc";

          let params: Record<string, unknown> | undefined = undefined;
          await entity.create({prop1, prop2, prop3}).go();
          const results = await entity.create({prop1, prop2, prop3}).go({
            logger: (event) => {
              if (event.type === 'query') {
                params = event.params;
              }
            }
          })
            .then(() => null)
            .catch((err: ElectroError) => err);

          expect(results).to.not.be.null;

          if (results) {
            expect(results.params()).to.not.be.undefined.and.not.to.be.null;
            expect(results.params()).to.deep.equal(params);
          }
        });
      });

      it('should include original aws error as cause on thrown ElectroError', async () => {
        const entity = new Entity(
            {
              model: {
                service: "tests",
                entity: uuid(),
                version: "1",
              },
              attributes: {
                prop1: {
                  type: "string",
                  default: () => uuid(),
                  field: "p",
                },
                prop2: {
                  type: "string",
                  required: true,
                  field: "r",
                },
                prop3: {
                  type: "string",
                  required: true,
                  field: "a",
                },
              },
              indexes: {
                farm: {
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
            {client, table: "electro"},
        );

        const prop1 = uuid();
        const prop2 = uuid();
        const prop3 = "abc";

        await entity.create({prop1, prop2, prop3}).go();
        const results = await entity.create({prop1, prop2, prop3}).go()
            .then(() => null)
            .catch((err: ElectroError) => err);

        expect(results).to.not.be.null;
        if (results) {
          expect(results.cause).to.not.be.undefined;
          expect(results.cause?.message).to.equal('The conditional request failed');
        }
      });

      describe(`user interactions with Set types`, () => {
        it("should accept and return arrays for sets when creating new entities", async () => {
          const entity = createEntity(client);
          const prop1 = uuid();
          const prop2 = uuid();
          const prop3 = [uuid()];
          const putRecord = await entity.put({ prop1, prop2, prop3 }).go();
          const getRecord = await entity.get({ prop1, prop2 }).go();
          if (getRecord) {
            expect(getRecord.data?.prop3)
                .to.be.an("array")
                .with.length(1);
            expect(putRecord.data.prop3).to.deep.equal(prop3);
          }
        });

        it("should pass arrays on all attribute callbacks", async () => {
          const prop1 = uuid();
          const prop2 = uuid();
          const prop3 = [uuid()];
          const called = {
            get: false,
            set: false,
            validate: false,
          };
          const entity = new Entity(
              {
                model: {
                  entity: uuid(),
                  service: "client-test",
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
                    get: (val) => {
                      expect(val).to.be.an("array").and.have.length(1);
                      expect(val).to.deep.equal(prop3);
                      called.get = true;
                      return val;
                    },
                    set: (val) => {
                      expect(val).to.be.an("array").and.have.length(1);
                      expect(val).to.deep.equal(prop3);
                      called.set = true;
                      return val;
                    },
                    validate: (val) => {
                      expect(val).to.be.an("array").and.have.length(1);
                      expect(val).to.deep.equal(prop3);
                      called.validate = true;
                      return true;
                    },
                    type: "set",
                    items: "string",
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
          await entity.put({ prop1, prop2, prop3 }).go();
          const results = await entity.get({ prop1, prop2 }).go();
          expect(called.get).to.be.true;
          expect(called.set).to.be.true;
          expect(called.validate).to.be.true;
        });

        it("should add an element to an existing set", async () => {
          const entity = createEntity(client);
          const prop1 = uuid();
          const prop2 = uuid();
          const prop3 = [uuid()];
          const prop3Addition = [uuid()];
          await entity.put({ prop1, prop2, prop3 }).go();
          const updateRecord = await entity
              .update({ prop1, prop2 })
              .add({
                prop3: prop3Addition,
              })
              .go({ response: "all_new" });
          expect(updateRecord.data.prop3).to.be.an("array").with.length(2);
          expect(updateRecord.data.prop3).to.include.members([
            ...prop3Addition,
            ...prop3,
          ]);
        });

        it("should remove an element from an existing set", async () => {
          const entity = createEntity(client);
          const prop1 = uuid();
          const prop2 = uuid();
          const prop3 = [uuid(), uuid()];
          await entity.put({ prop1, prop2, prop3 }).go();
          const updateRecord = await entity
              .update({ prop1, prop2 })
              .delete({
                prop3: [prop3[0]],
              })
              .go({ response: "all_new" });
          expect(updateRecord.data.prop3).to.be.an("array").with.length(1);
          expect(updateRecord.data.prop3).to.deep.equal([prop3[1]]);
        });

        it("should work with sets even when client is given to Service and not the Entity directly", async () => {
          const entity = createEntity();
          const service = new Service({ entity }, { client });
          const prop1 = uuid();
          const prop2 = uuid();
          const prop3 = ["abc", "def"];
          const item = {
            prop1,
            prop2,
            prop3,
          };
          await service.entities.entity.create(item).go();
          const result1 = await service.entities.entity
              .get({ prop1, prop2 })
              .go();
          expect(result1.data).to.deep.equal(item);
          await service.entities.entity
              .patch({ prop1, prop2 })
              .add({ prop3: ["hij"] })
              .go();
          const result2 = await service.entities.entity
              .get({ prop1, prop2 })
              .go();
          expect(result2.data?.prop3?.sort()).to.deep.equal(
              [...prop3, "hij"].sort(),
          );
        });
      });
    });
  }
});
