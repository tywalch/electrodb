const { Entity } = require("../src/entity");
const { expect } = require("chai");
const moment = require("moment");
const uuidV4 = require("uuid/v4");

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
            field: "dateTime"
        },
        prop1: {
            type: "string",
        },
        prop2: {
            type: "string",
        }
    },
    indexes: {
        record: {
            pk: {
                field: "pk",
                facets: `id_:id#p1_:prop1:prop5`
            },
            sk: {
                field: "sk",
                facets: `:date#p3_:prop3#p4_:prop4`
            }
        }
    }
}

let mallStore = new Entity(schema);
let putParams = mallStore.put({
    id: "IDENTIFIER",
    date: "DATE",
    prop1: "PROPERTY1",
    prop2: "PROPERTY2"
}).params();
console.log(putParams);