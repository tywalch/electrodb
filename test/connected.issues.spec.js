process.env.AWS_NODEJS_CONNECTION_REUSE_ENABLED = 1;
const DynamoDB = require("aws-sdk/clients/dynamodb");
const uuid = require("uuid").v4;
const { expect } = require("chai");
const { Entity } = require("../");
const table = "electro";
const client = new DynamoDB.DocumentClient({
    region: "us-east-1",
    endpoint: process.env.LOCAL_DYNAMO_ENDPOINT
});

it("#85 should upsert and retrieve record with the update method", async () => {
    const txn = new Entity({
        model: {
            version: "1",
            service: "transactions",
            entity: "transaction",
        },
        attributes: {
            accountId: {
                type: "string",
            },
            transactionId: {
                type: "string",
            },
            amount: {
                type: "number",
            },
        },
        indexes: {
            transaction: {
                pk: {
                    field: "pk",
                    facets: ["accountId"],
                },
                sk: {
                    field: "sk",
                    facets: ["transactionId"],
                },
            },
        },
    }, {table, client});

    const transaction = {
        accountId: uuid(),
        transactionId: uuid(),
    };

    const updates = {
        amount: 25
    }

    const item = {
        ...updates,
        ...transaction,
    }

    const updated = await txn.update(transaction).set(updates).go({response: "all_new"});
    expect(updated).to.deep.equal(item);
    const result = await txn.get(transaction).go();
    expect(result).to.deep.equal(item);
});