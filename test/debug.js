const { Entity, clauses } = require("../src/entity");
const { expect } = require("chai");
const moment = require("moment");
const uuidV4 = require("uuid").v4;
const DynamoDB = require("aws-sdk/clients/dynamodb");
const client = new DynamoDB.DocumentClient({
	region: "us-east-1",
});

describe("Custom keys", () => {
    it("Should default labels to facet attribute names in facet template (string)", () => {
        const schema = {
            service: "MallStoreDirectory",
            entity: "MallStores",
            table: "StoreDirectory",
            version: "1",
            attributes: {
                id: {
                    type: "string",
                    field: "storeLocationId",
                },
                date: {
                    type: "string",
                    field: "dateTime",
                },
                prop1: {
                    type: "string",
                },
                prop2: {
                    type: "string",
                },
            },
            indexes: {
                record: {
                    pk: {
                        field: "pk",
                        facets: `id_:id:prop1`,
                    },
                    sk: {
                        field: "sk",
                        facets: `:date:prop2:id:prop2`,
                    },
                },
            },
        };
        let mallStore = new Entity(schema);
        let putParams = mallStore
            .put({
                id: "IDENTIFIER",
                date: "DATE",
                prop1: "PROPERTY1",
                prop2: "PROPERTY2",
            })
            .params();
        expect(putParams).to.deep.equal({
            Item: {
                storeLocationId: "IDENTIFIER",
                dateTime: "DATE",
                prop1: "PROPERTY1",
                prop2: "PROPERTY2",
                pk: "$mallstoredirectory_1#id_identifier#prop1_property1",
                sk: "$mallstores#date_date#p2_property2",
            },
            TableName: "StoreDirectory",
        });
    });
})