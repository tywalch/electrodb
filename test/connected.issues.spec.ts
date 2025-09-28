// @ts-nocheck
process.env.AWS_NODEJS_CONNECTION_REUSE_ENABLED = 1;
import DynamoDB from "aws-sdk/clients/dynamodb";
import { v4 as uuid } from "uuid";
import { expect } from "chai";
import { Entity } from "../";
const table = "electro";
const client = new DynamoDB.DocumentClient({
  region: "us-east-1",
  endpoint: process.env.LOCAL_DYNAMO_ENDPOINT ?? "http://localhost:8000",
  credentials: {
    accessKeyId: "test",
    secretAccessKey: "test",
  },
});

describe("Issue #343", () => {
  function createEntity() {
    return new Entity({
      model: {
        service: uuid(),
        entity: uuid(),
        version: "1",
      },
      attributes: {
        accountId: { type: "string", required: true },
        transactionId: { type: "string", required: true },
        date: { type: "string" },
        value: { type: "string" },
      },
      indexes: {
        byId: {
          index: "gsi1pk-index",
          pk: {
            field: "gsi1pk",
            composite: ["transactionId"],
          },
          sk: {
              field: "gsi1sk",
              composite: [],
          }
        },
        byAccount: {
          pk: {
            field: "pk",
            composite: ["accountId"],
          },
          sk: {
            field: "sk",
            composite: ["date", "transactionId"],
          },
        },
        byAccountDate: {
          index: "accountId-date-index",
          pk: {
            field: "accountId",
            composite: ["accountId"],
    
          },
          sk: {
            field: "value",
            composite: ["value"],
          },
        },
      }
    }, {table, client});
  }

  it(`should upsert item without duplicating attribute reference for value`, async () => {
    const inventory = createEntity();
    const accountId = uuid();
    const transactionId = uuid();
    const date = "2024-03-14";
    const value = "123";

    const item = {
      accountId: accountId,
      transactionId: transactionId,
      date: date,
      value: value,
    };

    const params = inventory.upsert(item).params();

    expect(params).to.deep.equal({
      "TableName": table,
      "UpdateExpression": "SET #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0, #accountId = :accountId_u0, #transactionId = :transactionId_u0, #date = :date_u0, #value = :value_u0, #gsi1pk = :gsi1pk_u0, #gsi1sk = :gsi1sk_u0",
      "ExpressionAttributeNames": {
          "#__edb_e__": "__edb_e__",
          "#__edb_v__": "__edb_v__",
          "#accountId": "accountId",
          "#transactionId": "transactionId",
          "#date": "date",
          "#value": "value",
          "#gsi1pk": "gsi1pk",
          "#gsi1sk": "gsi1sk",
      },
      "ExpressionAttributeValues": {
          ":__edb_e___u0": inventory.model.entity,
          ":__edb_v___u0": inventory.model.version,
          ":accountId_u0": accountId,
          ":transactionId_u0": transactionId,
          ":date_u0": date,
          ":value_u0": value,
          ":gsi1pk_u0": `$${inventory.model.service}#transactionid_${transactionId}`,
          ":gsi1sk_u0": `$${inventory.model.entity}_${inventory.model.version}`
      },
      "Key": {
          "pk": `$${inventory.model.service}#accountid_${accountId}`,
          "sk": `$${inventory.model.entity}_${inventory.model.version}#date_${date}#transactionid_${transactionId}`
      }   
    });
    
    await inventory.upsert(item).go();
  });

  it(`should update item without duplicating attribute reference for value`, async () => {
    const inventory = createEntity();
    const accountId = uuid();
    const transactionId = uuid();
    const date = "2024-03-14";
    const value = "123";

    await inventory.update({ transactionId, date, accountId }).set({ value }).go();
    const params = inventory.update({ transactionId, date, accountId }).set({ value }).params();
    expect(params).to.deep.equal({
      "TableName": table,
      "UpdateExpression": "SET #value = :value_u0, #accountId = :accountId_u0, #date = :date_u0, #transactionId = :transactionId_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0",
      "ExpressionAttributeNames": {
        "#__edb_e__": "__edb_e__",
        "#__edb_v__": "__edb_v__",
        "#accountId": "accountId",
        "#transactionId": "transactionId",
        "#date": "date",
        "#value": "value",
      },
      "ExpressionAttributeValues": {
        ":__edb_e___u0": inventory.model.entity,
        ":__edb_v___u0": inventory.model.version,
        ":accountId_u0": accountId,
        ":transactionId_u0": transactionId,
        ":date_u0": date,
        ":value_u0": value,
      },
      "Key": {
        "pk": `$${inventory.model.service}#accountid_${accountId}`,
        "sk": `$${inventory.model.entity}_${inventory.model.version}#date_${date}#transactionid_${transactionId}`
      }
    });
  });

  it(`should patch item without duplicating attribute reference for value`, async () => {
    const inventory = createEntity();
    const accountId = uuid();
    const transactionId = uuid();
    const date = "2024-03-14";
    const value = "123";

    const item = {
      accountId: accountId,
      transactionId: transactionId,
      date: date,
    };
    await inventory.put(item).go();
    await inventory.patch({ transactionId, date, accountId }).set({ value }).go();
    const params = inventory.patch({ transactionId, date, accountId }).set({ value }).params();
    expect(params).to.deep.equal({
      "TableName": table,
      "UpdateExpression": "SET #value = :value_u0, #accountId = :accountId_u0, #date = :date_u0, #transactionId = :transactionId_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0",
      "ExpressionAttributeNames": {
        "#__edb_e__": "__edb_e__",
        "#__edb_v__": "__edb_v__",
        "#accountId": "accountId",
        "#transactionId": "transactionId",
        "#date": "date",
        "#value": "value",
        "#pk": "pk",
        "#sk": "sk",
      },
      "ExpressionAttributeValues": {
        ":__edb_e___u0": inventory.model.entity,
        ":__edb_v___u0": inventory.model.version,
        ":accountId_u0": accountId,
        ":transactionId_u0": transactionId,
        ":date_u0": date,
        ":value_u0": value,
      },
      "ConditionExpression": "attribute_exists(#pk) AND attribute_exists(#sk)",
      "Key": {
        "pk": `$${inventory.model.service}#accountid_${accountId}`,
        "sk": `$${inventory.model.entity}_${inventory.model.version}#date_${date}#transactionid_${transactionId}`
      }
    });
  });
});