// @ts-expect-error
process.env.AWS_NODEJS_CONNECTION_REUSE_ENABLED = 1;
import DynamoDB from "aws-sdk/clients/dynamodb";
import { v4 as uuid } from "uuid";
import { expect } from "chai";
import { Entity } from "../";
import { putTable } from "./table";
const table = "electro";
const client = new DynamoDB.DocumentClient({
  region: "us-east-1",
  endpoint: process.env.LOCAL_DYNAMO_ENDPOINT ?? "http://localhost:8000",
  credentials: {
    accessKeyId: "test",
    secretAccessKey: "test",
  },
});

const dynamodb = new DynamoDB({
  region: "us-east-1",
  endpoint: "http://localhost:8000",
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
          ":__edb_e___u0": inventory.schema.model.entity,
          ":__edb_v___u0": inventory.schema.model.version,
          ":accountId_u0": accountId,
          ":transactionId_u0": transactionId,
          ":date_u0": date,
          ":value_u0": value,
          ":gsi1pk_u0": `$${inventory.schema.model.service}#transactionid_${transactionId}`,
          ":gsi1sk_u0": `$${inventory.schema.model.entity}_${inventory.schema.model.version}`
      },
      "Key": {
          "pk": `$${inventory.schema.model.service}#accountid_${accountId}`,
          "sk": `$${inventory.schema.model.entity}_${inventory.schema.model.version}#date_${date}#transactionid_${transactionId}`
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
        ":__edb_e___u0": inventory.schema.model.entity,
        ":__edb_v___u0": inventory.schema.model.version,
        ":accountId_u0": accountId,
        ":transactionId_u0": transactionId,
        ":date_u0": date,
        ":value_u0": value,
      },
      "Key": {
        "pk": `$${inventory.schema.model.service}#accountid_${accountId}`,
        "sk": `$${inventory.schema.model.entity}_${inventory.schema.model.version}#date_${date}#transactionid_${transactionId}`
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
        ":__edb_e___u0": inventory.schema.model.entity,
        ":__edb_v___u0": inventory.schema.model.version,
        ":accountId_u0": accountId,
        ":transactionId_u0": transactionId,
        ":date_u0": date,
        ":value_u0": value,
      },
      "ConditionExpression": "attribute_exists(#pk) AND attribute_exists(#sk)",
      "Key": {
        "pk": `$${inventory.schema.model.service}#accountid_${accountId}`,
        "sk": `$${inventory.schema.model.entity}_${inventory.schema.model.version}#date_${date}#transactionid_${transactionId}`
      }
    });
  });
});

describe("Issue #530", () => {
  const table = `issue_530_${uuid()}`

  before(async () => {
    await putTable(dynamodb, {
      "TableName": table,
      "KeySchema": [
        {
          "AttributeName": "ip_addr",
          "KeyType": "HASH"
        },
      ],
      "AttributeDefinitions": [
        {
          "AttributeName": "ip_addr",
          "AttributeType": "S"
        },
      ],
      "BillingMode": "PAY_PER_REQUEST"
    });
  });

  it("should upsert item without apply set to attribute key name", async () => {
    const Log = new Entity(
      {
        model: {
          entity: "log_record",
          version: "1",
          service: "log",
        },
        attributes: {
          ip_addr: {
            type: "string",
            required: true,
            readOnly: true,
          },
          expires_ttl: {
            type: "number",
          },
          app: {
            type: "string",
          },
          click_id: {
            type: "string",
          },
          timestamp: {
            type: "string",
          },
        },
        indexes: {
          byIpAddr: {
            pk: {
              field: "ip_addr",
              composite: ["ip_addr"],
            },
          },
        },
      },
      { table, client }
    );

    const record = {
      ip_addr: "127.0.0.1",
      app: "something",
    }

    const params = Log.upsert(record).params({});
    expect(params).to.deep.equal({
      TableName: table,
      UpdateExpression: 'SET #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0, #app = :app_u0',
      ExpressionAttributeNames: {
        '#__edb_e__': '__edb_e__',
        '#__edb_v__': '__edb_v__',
        '#app': 'app'
      },
      ExpressionAttributeValues: {
        ':__edb_e___u0': 'log_record',
        ':__edb_v___u0': '1',
        ':app_u0': 'something'
      },
      Key: {
        ip_addr: '127.0.0.1'
      },
    });

    await Log.upsert(record).go()
    const result = await Log.get({ ip_addr: record.ip_addr }).go();
    expect(result.data).to.deep.equal(record);
  })
})