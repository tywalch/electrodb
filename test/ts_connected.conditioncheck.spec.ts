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
        expect(result.data).to.deep.equal({ id, sort, val: "hello" });
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
        expect(result.data).to.deep.equal({ id, sort, val: "original" });
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
        expect(result.data).to.deep.equal({ id, sort, val: "updated" });
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
        expect(result.data).to.deep.equal({ id, sort, val: "original" });
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
        expect(result.data).to.deep.equal({ id, sort, val: "original" });
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
        expect(result.data).to.deep.equal({ id, sort, val: "original" });
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
        expect(result.data).to.deep.equal({ id, sort, val: "original" });
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
        expect(result.data).to.deep.equal({ id, sort, val: "original" });
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
        expect(result.data).to.deep.equal({ id, sort, val: "original" });
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

      it("should still throw non-conditional DynamoDB errors when returnOnConditionCheckFailure: true is set", async () => {
        let threw: any = null;
        try {
          await entity
            .create({ id: uuid(), sort: "nonexistent-table", val: "x" })
            .go({ returnOnConditionCheckFailure: true, table: "does_not_exist" });
        } catch (err: any) {
          threw = err;
        }
        expect(threw, "non-conditional error should still throw").to.not.equal(null);
        expect(threw.isElectroError).to.equal(true);
        expect(threw.code).to.equal(4001);
        expect(threw.cause?.name ?? threw.cause?.code).to.match(/ResourceNotFoundException/);
      });

      it("should still throw non-conditional DynamoDB errors when returnOnConditionCheckFailure: 'all_old' is set", async () => {
        let threw: any = null;
        try {
          await entity
            .create({ id: uuid(), sort: "nonexistent-table-allold", val: "x" })
            .go({ returnOnConditionCheckFailure: "all_old", table: "does_not_exist" });
        } catch (err: any) {
          threw = err;
        }
        expect(threw, "non-conditional error should still throw").to.not.equal(null);
        expect(threw.isElectroError).to.equal(true);
        expect(threw.code).to.equal(4001);
        expect(threw.cause?.name ?? threw.cause?.code).to.match(/ResourceNotFoundException/);
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
        expect(result.data).to.deep.equal({ id, sort, val: "updated" });
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
        expect(result.data).to.deep.equal({ id, sort, val: "original" });
      });

      it("should still resolve with rejected when originalErr: true is also set (all_old)", async () => {
        const id = uuid();
        const sort = "original-err";
        await entity.create({ id, sort, val: "original" }).go();

        const result = await entity.create({ id, sort, val: "duplicate" }).go({
          returnOnConditionCheckFailure: "all_old",
          originalErr: true,
        });
        expect(result.rejected).to.equal(true);
        expect(result.data).to.deep.equal({ id, sort, val: "original" });
      });

      it("should still resolve with rejected when originalErr: true is combined with all_old on update", async () => {
        const id = uuid();
        const sort = "original-err-combo-update";
        await entity.put({ id, sort, val: "original" }).go();

        const result = await entity
          .update({ id, sort })
          .set({ val: "updated" })
          .where(({ val }, { eq }) => eq(val, "wrong"))
          .go({
            returnOnConditionCheckFailure: "all_old",
            originalErr: true,
          });
        expect(result.rejected).to.equal(true);
        expect(result.data).to.deep.equal({ id, sort, val: "original" });
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
        expect((result.data as any)?.Item).to.deep.include({ id, sort, val: "original" });
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
        expect(result.data).to.deep.include({ id, sort, val: "original" });
        expect((result.data as any).pk).to.not.be.undefined;
        expect((result.data as any).sk).to.not.be.undefined;
      });
    });

    describe("boolean shortcut", () => {
      it("should return rejected: false on successful create (true)", async () => {
        const id = uuid();
        const sort = "bool-create-success";
        const result = await entity
          .create({ id, sort, val: "hello" })
          .go({ returnOnConditionCheckFailure: true });
        expect(result.rejected).to.equal(false);
        expect(result.data).to.deep.equal({ id, sort, val: "hello" });
      });

      it("should return rejected: true with no data key when create fails (true)", async () => {
        const id = uuid();
        const sort = "bool-create-fail";
        await entity.create({ id, sort, val: "original" }).go();

        const result = await entity
          .create({ id, sort, val: "duplicate" })
          .go({ returnOnConditionCheckFailure: true });
        expect(result.rejected).to.equal(true);
        expect(result).to.not.have.property("data");
      });

      it("should return rejected: true with no data key when update where condition fails (true)", async () => {
        const id = uuid();
        const sort = "bool-update-fail";
        await entity.put({ id, sort, val: "original" }).go();

        const result = await entity
          .update({ id, sort })
          .set({ val: "updated" })
          .where(({ val }, { eq }) => eq(val, "wrong"))
          .go({ returnOnConditionCheckFailure: true });
        expect(result.rejected).to.equal(true);
        expect(result).to.not.have.property("data");
      });

      it("should return rejected: true with no data key when patch target does not exist (true)", async () => {
        const id = uuid();
        const sort = "bool-patch-nonexistent";
        const result = await entity
          .patch({ id, sort })
          .set({ val: "patched" })
          .go({ returnOnConditionCheckFailure: true });
        expect(result.rejected).to.equal(true);
        expect(result).to.not.have.property("data");
      });

      it("should return rejected: true with no data key when remove target does not exist (true)", async () => {
        const id = uuid();
        const sort = "bool-remove-nonexistent";
        const result = await entity
          .remove({ id, sort })
          .go({ returnOnConditionCheckFailure: true });
        expect(result.rejected).to.equal(true);
        expect(result).to.not.have.property("data");
      });

      it("should return rejected: false on successful put (true)", async () => {
        const id = uuid();
        const sort = "bool-put-success";
        await entity.put({ id, sort, val: "original" }).go();

        const result = await entity
          .put({ id, sort, val: "updated" })
          .where(({ val }, { eq }) => eq(val, "original"))
          .go({ returnOnConditionCheckFailure: true });
        expect(result.rejected).to.equal(false);
        expect(result.data).to.deep.equal({ id, sort, val: "updated" });
      });

      it("should return rejected: true with no data key when put where condition fails (true)", async () => {
        const id = uuid();
        const sort = "bool-put-fail";
        await entity.put({ id, sort, val: "original" }).go();

        const result = await entity
          .put({ id, sort, val: "replaced" })
          .where(({ val }, { eq }) => eq(val, "wrong"))
          .go({ returnOnConditionCheckFailure: true });
        expect(result.rejected).to.equal(true);
        expect(result).to.not.have.property("data");
      });

      it("should return rejected: false on successful delete (true)", async () => {
        const id = uuid();
        const sort = "bool-delete-success";
        await entity.put({ id, sort, val: "original" }).go();

        const result = await entity
          .delete({ id, sort })
          .where(({ val }, { eq }) => eq(val, "original"))
          .go({ returnOnConditionCheckFailure: true });
        expect(result.rejected).to.equal(false);
      });

      it("should return rejected: true with no data key when delete where condition fails (true)", async () => {
        const id = uuid();
        const sort = "bool-delete-fail";
        await entity.put({ id, sort, val: "original" }).go();

        const result = await entity
          .delete({ id, sort })
          .where(({ val }, { eq }) => eq(val, "wrong"))
          .go({ returnOnConditionCheckFailure: true });
        expect(result.rejected).to.equal(true);
        expect(result).to.not.have.property("data");
      });

      it("should return rejected: false on successful upsert (true)", async () => {
        const id = uuid();
        const sort = "bool-upsert-success";
        await entity.put({ id, sort, val: "original" }).go();

        const result = await entity
          .upsert({ id, sort, val: "upserted" })
          .where(({ val }, { eq }) => eq(val, "original"))
          .go({ returnOnConditionCheckFailure: true });
        expect(result.rejected).to.equal(false);
      });

      it("should return rejected: true with no data key when upsert where condition fails (true)", async () => {
        const id = uuid();
        const sort = "bool-upsert-fail";
        await entity.put({ id, sort, val: "original" }).go();

        const result = await entity
          .upsert({ id, sort, val: "upserted" })
          .where(({ val }, { eq }) => eq(val, "wrong"))
          .go({ returnOnConditionCheckFailure: true });
        expect(result.rejected).to.equal(true);
        expect(result).to.not.have.property("data");
      });

      it("should NOT set ReturnValuesOnConditionCheckFailure on DDB params when true", () => {
        const params = entity
          .create({ id: uuid(), sort: "params-bool-true", val: "v" })
          .params({ returnOnConditionCheckFailure: true });
        expect(params.ReturnValuesOnConditionCheckFailure).to.be.undefined;
      });

      it("should behave like no option when false (throws on failure)", async () => {
        const id = uuid();
        const sort = "bool-false-throws";
        await entity.create({ id, sort, val: "original" }).go();

        try {
          await entity
            .create({ id, sort, val: "duplicate" })
            .go({ returnOnConditionCheckFailure: false });
          expect.fail("Should have thrown");
        } catch (err: any) {
          expect(err.message).to.include("conditional request failed");
        }
      });

      it("should combine with response option (true) - success uses response format", async () => {
        const id = uuid();
        const sort = "bool-response-combo";
        await entity.put({ id, sort, val: "original" }).go();

        const result = await entity
          .update({ id, sort })
          .set({ val: "updated" })
          .where(({ val }, { eq }) => eq(val, "original"))
          .go({
            response: "all_new",
            returnOnConditionCheckFailure: true,
          });
        expect(result.rejected).to.equal(false);
        expect(result.data).to.deep.equal({ id, sort, val: "updated" });
      });

      it("should still resolve with rejected when originalErr: true is also set (true)", async () => {
        const id = uuid();
        const sort = "bool-original-err";
        await entity.create({ id, sort, val: "original" }).go();

        const result = await entity.create({ id, sort, val: "duplicate" }).go({
          returnOnConditionCheckFailure: true,
          originalErr: true,
        });
        expect(result.rejected).to.equal(true);
        expect(result).to.not.have.property("data");
      });
    });
  });

  describe(`returnOnConditionCheckFailure formatting (${name})`, () => {
    function createMappedEntity() {
      return new Entity(
        {
          model: {
            entity: uuid(),
            service: "condcheck",
            version: "1",
          },
          attributes: {
            accountId: { type: "string" as const, field: "a" },
            recordId: { type: "string" as const, field: "r" },
            displayName: { type: "string" as const, field: "dn" },
            secret: { type: "string" as const, field: "s", hidden: true },
            score: {
              type: "number" as const,
              field: "sc",
              get: (val: number) => val * 2,
            },
          },
          indexes: {
            record: {
              pk: { field: "pk", composite: ["accountId"] },
              sk: { field: "sk", composite: ["recordId"] },
            },
          },
        },
        { table, client },
      );
    }

    it("should return the rejected item with entity-side attribute names, hidden fields stripped, and getters applied", async () => {
      const mapped = createMappedEntity();
      const accountId = uuid();
      const recordId = "rec1";
      await mapped
        .create({
          accountId,
          recordId,
          displayName: "Original",
          secret: "shh",
          score: 10,
        })
        .go();

      const result = await mapped
        .create({
          accountId,
          recordId,
          displayName: "Duplicate",
          secret: "nope",
          score: 1,
        })
        .go({ returnOnConditionCheckFailure: "all_old" });

      expect(result.rejected).to.equal(true);
      expect(result.data).to.deep.equal({
        accountId,
        recordId,
        displayName: "Original",
        score: 20,
      });
    });

    it("should return raw response shape when data: 'raw' is set", async () => {
      const mapped = createMappedEntity();
      const accountId = uuid();
      const recordId = "rec-raw";
      await mapped
        .create({ accountId, recordId, displayName: "Original", secret: "shh", score: 10 })
        .go();

      const result = await mapped
        .create({ accountId, recordId, displayName: "Duplicate", secret: "nope", score: 1 })
        .go({ returnOnConditionCheckFailure: "all_old", data: "raw" });

      expect(result.rejected).to.equal(true);
      const rawItem = (result.data as any)?.Item;
      expect(rawItem).to.deep.include({ dn: "Original", s: "shh", sc: 10 });
      expect(rawItem).to.not.have.property("displayName");
    });
  });
}
