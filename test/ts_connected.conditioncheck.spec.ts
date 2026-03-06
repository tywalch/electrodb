process.env.AWS_NODEJS_CONNECTION_REUSE_ENABLED = "1";
import { Entity } from "../index";
import { expect } from "chai";
import { v4 as uuid } from "uuid";
import { DocumentClient as V2Client } from "aws-sdk/clients/dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const v2Client = new V2Client({
  region: "us-east-1",
  endpoint: process.env.LOCAL_DYNAMO_ENDPOINT ?? "http://localhost:8000",
  credentials: {
    accessKeyId: "test",
    secretAccessKey: "test",
  },
});

const v3Client = DynamoDBDocumentClient.from(
  new DynamoDBClient({
    region: "us-east-1",
    endpoint: process.env.LOCAL_DYNAMO_ENDPOINT ?? "http://localhost:8000",
    credentials: {
      accessKeyId: "test",
      secretAccessKey: "test",
    },
  }),
);

const table = "electro";

const clients = [
  { name: "v2", client: v2Client },
  { name: "v3", client: v3Client },
];

for (const { name, client } of clients) {
  function createEntity() {
    return new Entity(
      {
        model: {
          entity: uuid(),
          service: "condcheck",
          version: "1",
        },
        attributes: {
          id: {
            type: "string" as const,
          },
          sort: {
            type: "string" as const,
          },
          val: {
            type: "string" as const,
          },
          num: {
            type: "number" as const,
          },
        },
        indexes: {
          record: {
            pk: {
              field: "pk",
              composite: ["id"],
            },
            sk: {
              field: "sk",
              composite: ["sort"],
            },
          },
        },
      },
      { table, client },
    );
  }

  describe(`returnOnConditionCheckFailure (${name})`, () => {
    let entity: ReturnType<typeof createEntity>;
    before(async () => {
      entity = createEntity();
    });

    describe("create", () => {
      it("should return rejected: false on successful create", async () => {
        const id = uuid();
        const sort = "create-success";
        const result = await entity.create({ id, sort, val: "hello" }).go({
          returnOnConditionCheckFailure: "all_old",
        });
        expect(result.rejected).to.equal(false);
        if (!result.rejected) {
          expect(result.data.id).to.equal(id);
          expect(result.data.sort).to.equal(sort);
          expect(result.data.val).to.equal("hello");
        }
      });

      it("should return rejected: true with existing item when create fails (item already exists)", async () => {
        const id = uuid();
        const sort = "create-fail";
        await entity.create({ id, sort, val: "original" }).go();

        const result = await entity
          .create({ id, sort, val: "duplicate" })
          .go({
            returnOnConditionCheckFailure: "all_old",
          });
        expect(result.rejected).to.equal(true);
        if (result.rejected && result.data !== null) {
          expect(result.data.id).to.equal(id);
          expect(result.data.val).to.equal("original");
        }
      });
    });

    describe("put", () => {
      it("should return rejected: false on successful put with where condition", async () => {
        const id = uuid();
        const sort = "put-success";
        await entity.put({ id, sort, val: "original" }).go();

        const result = await entity
          .put({ id, sort, val: "updated" })
          .where(({ val }, { eq }) => eq(val, "original"))
          .go({ returnOnConditionCheckFailure: "all_old" });
        expect(result.rejected).to.equal(false);
        if (!result.rejected) {
          expect(result.data.val).to.equal("updated");
        }
      });

      it("should return rejected: true when put where condition fails", async () => {
        const id = uuid();
        const sort = "put-fail";
        await entity.put({ id, sort, val: "original" }).go();

        const result = await entity
          .put({ id, sort, val: "replaced" })
          .where(({ val }, { eq }) => eq(val, "wrong_value"))
          .go({ returnOnConditionCheckFailure: "all_old" });
        expect(result.rejected).to.equal(true);
        if (result.rejected && result.data !== null) {
          expect(result.data.id).to.equal(id);
          expect(result.data.val).to.equal("original");
        }
      });
    });

    describe("patch", () => {
      it("should return rejected: false on successful patch", async () => {
        const id = uuid();
        const sort = "patch-success";
        await entity.put({ id, sort, val: "original" }).go();

        const result = await entity
          .patch({ id, sort })
          .set({ val: "patched" })
          .go({ returnOnConditionCheckFailure: "all_old" });
        expect(result.rejected).to.equal(false);
      });

      it("should return rejected: true with null when patch target does not exist", async () => {
        const id = uuid();
        const sort = "patch-nonexistent";
        const result = await entity
          .patch({ id, sort })
          .set({ val: "patched" })
          .go({ returnOnConditionCheckFailure: "all_old" });
        expect(result.rejected).to.equal(true);
        expect(result.data).to.be.null;
      });

      it("should return rejected: true with existing item when patch where condition fails", async () => {
        const id = uuid();
        const sort = "patch-where-fail";
        await entity.put({ id, sort, val: "original" }).go();

        const result = await entity
          .patch({ id, sort })
          .set({ val: "patched" })
          .where(({ val }, { eq }) => eq(val, "wrong"))
          .go({ returnOnConditionCheckFailure: "all_old" });
        expect(result.rejected).to.equal(true);
        if (result.rejected && result.data !== null) {
          expect(result.data.val).to.equal("original");
        }
      });
    });

    describe("update", () => {
      it("should return rejected: false on successful update", async () => {
        const id = uuid();
        const sort = "update-success";
        await entity.put({ id, sort, val: "original" }).go();

        const result = await entity
          .update({ id, sort })
          .set({ val: "updated" })
          .where(({ val }, { eq }) => eq(val, "original"))
          .go({ returnOnConditionCheckFailure: "all_old" });
        expect(result.rejected).to.equal(false);
      });

      it("should return rejected: true with existing item when update where condition fails", async () => {
        const id = uuid();
        const sort = "update-fail";
        await entity.put({ id, sort, val: "original" }).go();

        const result = await entity
          .update({ id, sort })
          .set({ val: "updated" })
          .where(({ val }, { eq }) => eq(val, "wrong"))
          .go({ returnOnConditionCheckFailure: "all_old" });
        expect(result.rejected).to.equal(true);
        if (result.rejected && result.data !== null) {
          expect(result.data.val).to.equal("original");
        }
      });
    });

    describe("remove", () => {
      it("should return rejected: false on successful remove", async () => {
        const id = uuid();
        const sort = "remove-success";
        await entity.put({ id, sort, val: "original" }).go();

        const result = await entity.remove({ id, sort }).go({
          returnOnConditionCheckFailure: "all_old",
        });
        expect(result.rejected).to.equal(false);
      });

      it("should return rejected: true with null when remove target does not exist", async () => {
        const id = uuid();
        const sort = "remove-nonexistent";
        const result = await entity.remove({ id, sort }).go({
          returnOnConditionCheckFailure: "all_old",
        });
        expect(result.rejected).to.equal(true);
        expect(result.data).to.be.null;
      });

      it("should return rejected: true with existing item when remove where condition fails", async () => {
        const id = uuid();
        const sort = "remove-where-fail";
        await entity.put({ id, sort, val: "original" }).go();

        const result = await entity
          .remove({ id, sort })
          .where(({ val }, { eq }) => eq(val, "wrong"))
          .go({ returnOnConditionCheckFailure: "all_old" });
        expect(result.rejected).to.equal(true);
        if (result.rejected && result.data !== null) {
          expect(result.data.val).to.equal("original");
        }
      });
    });

    describe("delete", () => {
      it("should return rejected: false on successful delete with where condition", async () => {
        const id = uuid();
        const sort = "delete-success";
        await entity.put({ id, sort, val: "original" }).go();

        const result = await entity
          .delete({ id, sort })
          .where(({ val }, { eq }) => eq(val, "original"))
          .go({ returnOnConditionCheckFailure: "all_old" });
        expect(result.rejected).to.equal(false);
      });

      it("should return rejected: true with existing item when delete where condition fails", async () => {
        const id = uuid();
        const sort = "delete-fail";
        await entity.put({ id, sort, val: "original" }).go();

        const result = await entity
          .delete({ id, sort })
          .where(({ val }, { eq }) => eq(val, "wrong"))
          .go({ returnOnConditionCheckFailure: "all_old" });
        expect(result.rejected).to.equal(true);
        if (result.rejected && result.data !== null) {
          expect(result.data.val).to.equal("original");
        }
      });
    });

    describe("upsert", () => {
      it("should return rejected: false on successful upsert with where condition", async () => {
        const id = uuid();
        const sort = "upsert-success";
        await entity.put({ id, sort, val: "original" }).go();

        const result = await entity
          .upsert({ id, sort, val: "upserted" })
          .where(({ val }, { eq }) => eq(val, "original"))
          .go({ returnOnConditionCheckFailure: "all_old" });
        expect(result.rejected).to.equal(false);
      });

      it("should return rejected: true with existing item when upsert where condition fails", async () => {
        const id = uuid();
        const sort = "upsert-fail";
        await entity.put({ id, sort, val: "original" }).go();

        const result = await entity
          .upsert({ id, sort, val: "upserted" })
          .where(({ val }, { eq }) => eq(val, "wrong"))
          .go({ returnOnConditionCheckFailure: "all_old" });
        expect(result.rejected).to.equal(true);
        if (result.rejected && result.data !== null) {
          expect(result.data.val).to.equal("original");
        }
      });
    });

    describe("cross-cutting", () => {
      it("should still throw error when condition fails without the option", async () => {
        const id = uuid();
        const sort = "backward-compat";
        await entity.create({ id, sort, val: "original" }).go();

        try {
          await entity.create({ id, sort, val: "duplicate" }).go();
          expect.fail("Should have thrown");
        } catch (err: any) {
          expect(err.message).to.include("conditional request failed");
        }
      });

      it("should combine with response option - success uses response format", async () => {
        const id = uuid();
        const sort = "response-combo";
        await entity.put({ id, sort, val: "original" }).go();

        const result = await entity
          .update({ id, sort })
          .set({ val: "updated" })
          .where(({ val }, { eq }) => eq(val, "original"))
          .go({
            response: "all_new",
            returnOnConditionCheckFailure: "all_old",
          });
        expect(result.rejected).to.equal(false);
        if (!result.rejected) {
          expect(result.data.val).to.equal("updated");
        }
      });

      it("should combine with response option - failure returns old item", async () => {
        const id = uuid();
        const sort = "response-combo-fail";
        await entity.put({ id, sort, val: "original" }).go();

        const result = await entity
          .update({ id, sort })
          .set({ val: "updated" })
          .where(({ val }, { eq }) => eq(val, "wrong"))
          .go({
            response: "all_new",
            returnOnConditionCheckFailure: "all_old",
          });
        expect(result.rejected).to.equal(true);
        if (result.rejected && result.data !== null) {
          expect(result.data.val).to.equal("original");
        }
      });

      it("should still throw with originalErr: true even when option is set", async () => {
        const id = uuid();
        const sort = "original-err";
        await entity.create({ id, sort, val: "original" }).go();

        try {
          await entity.create({ id, sort, val: "duplicate" }).go({
            returnOnConditionCheckFailure: "all_old",
            originalErr: true,
          });
          expect.fail("Should have thrown");
        } catch (err: any) {
          expect(
            err.name === "ConditionalCheckFailedException" ||
              err.code === "ConditionalCheckFailedException",
          ).to.be.true;
        }
      });

      it("should work with data: 'raw' - rejected item returned in raw format", async () => {
        const id = uuid();
        const sort = "raw-data";
        await entity.create({ id, sort, val: "original" }).go();

        const result = await entity
          .create({ id, sort, val: "duplicate" })
          .go({
            returnOnConditionCheckFailure: "all_old",
            data: "raw",
          });
        expect(result.rejected).to.equal(true);
        expect(result.data).to.not.be.null;
      });

      it("should work with data: 'includeKeys' - rejected item includes key attributes", async () => {
        const id = uuid();
        const sort = "include-keys";
        await entity.create({ id, sort, val: "original" }).go();

        const result = await entity
          .create({ id, sort, val: "duplicate" })
          .go({
            returnOnConditionCheckFailure: "all_old",
            data: "includeKeys",
          });
        expect(result.rejected).to.equal(true);
        if (result.rejected && result.data !== null) {
          expect(result.data.id).to.equal(id);
          expect((result.data as any).pk).to.not.be.undefined;
          expect((result.data as any).sk).to.not.be.undefined;
        }
      });
    });
  });
}
