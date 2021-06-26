const { Entity } = require("../src/entity");
const { expect } = require("chai");
const uuid = require("uuid").v4;
const moment = require("moment");
const SERVICE = "BugBeater";
const ENTITY = "TEST_ENTITY";
const DynamoDB = require("aws-sdk/clients/dynamodb");
const client = new DynamoDB.DocumentClient({
  region: "us-east-1",
  endpoint: process.env.LOCAL_DYNAMO_ENDPOINT
});
let schema = {
  model: {
    service: SERVICE,
    entity: ENTITY,
    version: "1",
  },
  table: "electro",
  attributes: {
    id: {
      type: "string",
      default: () => {
        return uuid()
      },
      field: "storeLocationId",
    },
    sector: {
      type: "string",
    },
    mall: {
      type: "string",
      required: true,
      field: "mallId",
    },
    store: {
      type: "string",
      required: true,
      field: "storeId",
    },
    building: {
      type: "string",
      required: true,
      field: "buildingId",
    },
    unit: {
      type: "string",
      required: true,
      field: "unitId",
    },
    category: {
      type: [
        "food/coffee",
        "food/meal",
        "clothing",
        "electronics",
        "department",
        "misc",
      ],
      required: true,
    },
    leaseEnd: {
      type: "string",
      required: true,
      validate: (date) =>
        moment(date, "YYYY-MM-DD").isValid() ? "" : "Invalid date format",
    },
    rent: {
      type: "string",
      required: false,
      default: "0.00",
    },
    adjustments: {
      type: "string",
      required: false,
    },
  },
  indexes: {
    store: {
      pk: {
        field: "pk",
        facets: ["sector"],
      },
      sk: {
        field: "sk",
        facets: ["id"],
      },
    },
    units: {
      index: "gsi1pk-gsi1sk-index",
      pk: {
        field: "gsi1pk",
        facets: "mall_:mall",
      },
      sk: {
        field: "gsi1sk",
        facets: "b_:building#u_:unit#s_:store",
      },
    },
    leases: {
      index: "gsi2pk-gsi2sk-index",
      pk: {
        field: "gsi2pk",
        facets: "m_:mall",
      },
      sk: {
        field: "gsi2sk",
        facets: "l_:leaseEnd#s_:store#b_:building#u_:unit",
      },
    },
    categories: {
      index: "gsi3pk-gsi3sk-index",
      pk: {
        field: "gsi3pk",
        facets: ["mall"],
      },
      sk: {
        field: "gsi3sk",
        facets: ["category", "building", "unit", "store"],
      },
    },
    shops: {
      index: "gsi4pk-gsi4sk-index",
      pk: {
        field: "gsi4pk",
        facets: ["store"],
      },
      sk: {
        field: "gsi4sk",
        facets: ["mall", "building", "unit"],
      },
    },
  }
};

let MallStores = new Entity(schema, {client});

let record1 = {
  id: uuid(),
  mall: "WashingtonSquare",
  store: "LatteLarrys",
  sector: "A1",
  category: "food/coffee",
  leaseEnd: "2020-01-20",
  rent: "0.00",
  building: "BuildingZ",
  unit: "G1",
};

let record2 = {
  id: uuid(),
  mall: "WashingtonSquare",
  store: "LatteLarrys",
  sector: "A1",
  category: "food/coffee",
  leaseEnd: "2020-01-20",
  rent: "0.00",
  building: "BuildingZ",
  unit: "G1",
};

let record3 = {
  id: uuid(),
  mall: "WashingtonSquare",
  store: "LatteLarrys",
  sector: "A1",
  category: "food/coffee",
  leaseEnd: "2020-01-20",
  rent: "0.00",
  building: "BuildingZ",
  unit: "G1",
};


function generateRecords(size) {
  return new Array(size).fill(0).map(() => {
    return {
      id: uuid(),
      mall: "WashingtonSquare",
      store: "LatteLarrys",
      sector: "A1",
      category: "food/coffee",
      leaseEnd: "2020-01-20",
      rent: "0.00",
      building: "BuildingZ",
      unit: "G1",
    }
  });
}

async function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), ms);
  });
}

describe("BatchWrite", async () => {

  it("should perform a batchPut via array to put method", async () => {
    let unprocessed = await MallStores.put([record1, record2, record3]).go();
    // eventually consistent
    await sleep(500);
    // empty array is no unprocessed
    expect(unprocessed).to.be.an("array").that.is.empty;
    // verify existance
    let item = await MallStores.get(record1).go();
    expect(item).to.be.deep.equal(record1);
  }).timeout(5000);

  it("should perform a batchDelete via array to delete method", async () => {
    let unprocessed = await MallStores.put([record1, record2, record3]).go();
    // eventually consistent
    await sleep(500);
    // empty array is no unprocessed
    expect(unprocessed).to.be.an("array").that.is.empty;
    // verify existance
    let item = await MallStores.get(record1).go();
    expect(item).to.be.deep.equal(record1);
    
    // delete only record1, record2
    let deleted = await MallStores.delete([record1, record3]).go();
    
    // empty array is no unprocessed
    expect(deleted).to.be.an("array").that.is.empty;

    // eventually consistent
    await sleep(500);
    
    // find to verify
    let [
      getRecord1,
      getRecord2,
      getRecord3
    ] = await Promise.all([
      MallStores.get(record1).go(),
      MallStores.get(record2).go(),
      MallStores.get(record3).go(),
    ]);
    expect(getRecord1).to.be.an("object").that.is.empty;
    expect(getRecord2).to.be.deep.equal(record2);
    expect(getRecord3).to.be.an("object").that.is.empty;
  }).timeout(5000);
});

describe("Batch Crud Large Arrays", async () => {
  it("Should batchPut greater than 25 records, should get greater than 100 records, and then batch delete greater than 25 records", async () => {
    // Create 101 unique records
    let records = generateRecords(101);
    let recordIds = {};
    for (let record of records) {
      recordIds[record.id] = record;
    }

    // Create all 101
    let batchPutResults = await MallStores.put(records).go();
    expect(batchPutResults).to.be.an("array").that.is.empty;

    // Do a batch get to find all the records, expect them to all be present
    let [batchGetResults, batchGetUnprocessed] = await MallStores.get(records).go({params: {ConsistentRead: true}});
    expect(batchGetUnprocessed).to.be.an("array").that.is.empty;
    expect(batchGetResults).to.be.an("array").that.has.length(101);
    for (let result of batchGetResults) {
      expect(recordIds[result.id]).to.deep.equal(result);
    }

    // Do a batch delete of all records
    let batchDeleteResults = await MallStores.delete(records).go();
    expect(batchDeleteResults).to.be.an("array").that.is.empty;

    // Do a batch get to verify they were all deleted
    let [batchGetRemovedResults, batchGetRemovedUnprocessed] = await MallStores.get(records).go({params: {ConsistentRead: true}});
    expect(batchGetRemovedResults).to.be.an("array").that.is.empty;
    expect(batchGetRemovedUnprocessed).to.be.an("array").that.has.length(0);
  });
})

describe("BatchGet", async () => {
  it("Should consistently create then get a record in batch", async () => {
    let created = await MallStores.put(record1).go({params: {ConsistentRead: true}});
    expect(created).to.deep.equal(record1);
    let record = await MallStores.get(record1).go({params: {ConsistentRead: true}});
    expect(record).to.deep.equal(record1);
    let records = await MallStores.get([record1]).go({params: {ConsistentRead: true}});
    expect(records).to.be.an("array").with.length(2);
    expect(records[0]).to.be.an("array").with.length(1);
    expect(records[1]).to.be.an("array").with.length(0);
    expect(records[0][0]).to.be.deep.equal(record1);
  });
  it("Should parse returned unprocessed keys", async () => {
    let response = {
      "Responses": {
        "electro": [
          {
            "gsi2sk": "l_2020-01-20#s_lattelarrys#b_buildingz#u_g1",
            "mallId": "WashingtonSquare",
            "leaseEnd": "2020-01-20",
            "gsi3sk": "$test_entity_1#category_food/coffee#building_buildingz#unit_g1#store_lattelarrys",
            "__edb_e__": "TEST_ENTITY",
            "gsi1sk": "b_buildingz#u_g1#s_lattelarrys",
            "sector": "A1",
            "storeId": "LatteLarrys",
            "unitId": "G1",
            "storeLocationId": "9edc03f5-29e2-4a71-b288-8cb0fc389b95",
            "__edb_v__": "1",
            "buildingId":"BuildingZ",
            "category":"food/coffee",
            "rent":"0.00",
            "sk":"$test_entity_1#id_9edc03f5-29e2-4a71-b288-8cb0fc389b95",
            "gsi3pk":"$bugbeater#mall_washingtonsquare",
            "pk":"$bugbeater#sector_a1",
            "gsi4pk":"$bugbeater#store_lattelarrys",
            "gsi1pk":"mall_washingtonsquare",
            "gsi4sk":"$test_entity_1#mall_washingtonsquare#building_buildingz#unit_g1",
            "gsi2pk":"m_washingtonsquare"
          }
        ]
      },
      "UnprocessedKeys": {
        "electro": {
          "Keys": [
            {
              "pk": "$bugbeater#sector_a1",
              "sk": "$test_entity_1#id_868f6d45-d78b-4f7a-94ff-a016c10574d5"
            },
            {
              "pk": "$bugbeater#sector_b1",
              "sk": "$test_entity_1#id_868f6d45-d78b-4f7a-94ff-a016c10574d6"
            }
          ]
        }
      }
    }
    let results = MallStores.formatBulkGetResponse(undefined, response, {});
    expect(results).to.be.an("array").with.length(2);
    expect(results[0]).to.be.an("array").with.length(1);
    expect(results[1]).to.be.an("array").with.length(2);
    expect(results[0][0]).to.be.deep.equal({
      "mall":"WashingtonSquare",
      "leaseEnd":"2020-01-20",
      "sector":"A1",
      "store":"LatteLarrys",
      "unit":"G1",
      "id":"9edc03f5-29e2-4a71-b288-8cb0fc389b95",
      "building":"BuildingZ",
      "category":"food/coffee",
      "rent":"0.00"
    });
    expect(results[1]).to.deep.equal([
      {
        "id":"868f6d45-d78b-4f7a-94ff-a016c10574d5",
        "sector":"a1"
      },
      {
        "id":"868f6d45-d78b-4f7a-94ff-a016c10574d6",
        "sector":"b1"
      }
    ]);
  });
  it("Should allow for config lastEvaluatedKeyRaw with UnprocessedKeys", () => {
    let response = {
      "Responses": {
        "electro": [
          {
            "gsi2sk": "l_2020-01-20#s_lattelarrys#b_buildingz#u_g1",
            "mallId": "WashingtonSquare",
            "leaseEnd": "2020-01-20",
            "gsi3sk": "$test_entity_1#category_food/coffee#building_buildingz#unit_g1#store_lattelarrys",
            "__edb_e__": "TEST_ENTITY",
            "gsi1sk": "b_buildingz#u_g1#s_lattelarrys",
            "sector": "A1",
            "storeId": "LatteLarrys",
            "unitId": "G1",
            "storeLocationId": "9edc03f5-29e2-4a71-b288-8cb0fc389b95",
            "__edb_v__": "1",
            "buildingId":"BuildingZ",
            "category":"food/coffee",
            "rent":"0.00",
            "sk":"$test_entity_1#id_9edc03f5-29e2-4a71-b288-8cb0fc389b95",
            "gsi3pk":"$bugbeater#mall_washingtonsquare",
            "pk":"$bugbeater#sector_a1",
            "gsi4pk":"$bugbeater#store_lattelarrys",
            "gsi1pk":"mall_washingtonsquare",
            "gsi4sk":"$test_entity_1#mall_washingtonsquare#building_buildingz#unit_g1",
            "gsi2pk":"m_washingtonsquare"
          }
        ]
      },
      "UnprocessedKeys": {
        "electro": {
          "Keys": [
            {
              "pk": "$bugbeater#sector_a1",
              "sk": "$test_entity_1#id_868f6d45-d78b-4f7a-94ff-a016c10574d5"
            },
            {
              "pk": "$bugbeater#sector_b1",
              "sk": "$test_entity_1#id_868f6d45-d78b-4f7a-94ff-a016c10574d6"
            }
          ]
        }
      }
    }
    let results = MallStores.formatBulkGetResponse(undefined, response, {lastEvaluatedKeyRaw: true});
    expect(results[1]).to.be.an("array").with.length(2);
    expect(results[1]).to.deep.equal([
      {
        "pk": "$bugbeater#sector_a1",
        "sk": "$test_entity_1#id_868f6d45-d78b-4f7a-94ff-a016c10574d5"
      },
      {
        "pk": "$bugbeater#sector_b1",
        "sk": "$test_entity_1#id_868f6d45-d78b-4f7a-94ff-a016c10574d6"
      }
    ]);
  });
  it("Should allow for includeKeys query option in results", () => {
    let response = {
      "Responses": {
        "electro": [
          {
            "gsi2sk": "l_2020-01-20#s_lattelarrys#b_buildingz#u_g1",
            "mallId": "WashingtonSquare",
            "leaseEnd": "2020-01-20",
            "gsi3sk": "$test_entity_1#category_food/coffee#building_buildingz#unit_g1#store_lattelarrys",
            "__edb_e__": "TEST_ENTITY",
            "gsi1sk": "b_buildingz#u_g1#s_lattelarrys",
            "sector": "A1",
            "storeId": "LatteLarrys",
            "unitId": "G1",
            "storeLocationId": "9edc03f5-29e2-4a71-b288-8cb0fc389b95",
            "__edb_v__": "1",
            "buildingId":"BuildingZ",
            "category":"food/coffee",
            "rent":"0.00",
            "sk":"$test_entity_1#id_9edc03f5-29e2-4a71-b288-8cb0fc389b95",
            "gsi3pk":"$bugbeater#mall_washingtonsquare",
            "pk":"$bugbeater#sector_a1",
            "gsi4pk":"$bugbeater#store_lattelarrys",
            "gsi1pk":"mall_washingtonsquare",
            "gsi4sk":"$test_entity_1#mall_washingtonsquare#building_buildingz#unit_g1",
            "gsi2pk":"m_washingtonsquare"
          }
        ]
      },
      "UnprocessedKeys": {
        "electro": {
          "Keys": [
            {
              "pk": "$bugbeater#sector_a1",
              "sk": "$test_entity_1#id_868f6d45-d78b-4f7a-94ff-a016c10574d5"
            },
            {
              "pk": "$bugbeater#sector_b1",
              "sk": "$test_entity_1#id_868f6d45-d78b-4f7a-94ff-a016c10574d6"
            }
          ]
        }
      }
    }
    let results = MallStores.formatBulkGetResponse(undefined, response, {includeKeys: true});
    expect(results).to.be.an("array").with.length(2);
    expect(results[0]).to.be.an("array").with.length(1);
    expect(results[0][0]).to.be.deep.equal({
      "gsi2sk": "l_2020-01-20#s_lattelarrys#b_buildingz#u_g1",
      "mall": "WashingtonSquare",
      "leaseEnd": "2020-01-20",
      "gsi3sk": "$test_entity_1#category_food/coffee#building_buildingz#unit_g1#store_lattelarrys",
      "__edb_e__": "TEST_ENTITY",
      "gsi1sk": "b_buildingz#u_g1#s_lattelarrys",
      "sector": "A1",
      "store": "LatteLarrys",
      "unit": "G1",
      "id": "9edc03f5-29e2-4a71-b288-8cb0fc389b95",
      "__edb_v__": "1",
      "building":"BuildingZ",
      "category":"food/coffee",
      "rent":"0.00",
      "sk":"$test_entity_1#id_9edc03f5-29e2-4a71-b288-8cb0fc389b95",
      "gsi3pk":"$bugbeater#mall_washingtonsquare",
      "pk":"$bugbeater#sector_a1",
      "gsi4pk":"$bugbeater#store_lattelarrys",
      "gsi1pk":"mall_washingtonsquare",
      "gsi4sk":"$test_entity_1#mall_washingtonsquare#building_buildingz#unit_g1",
      "gsi2pk":"m_washingtonsquare"
    });
  });
  it("Should throw on invalid get composite attributes", () => {
    expect(() => MallStores.get([record1, record2, record3, {}]).params()).to.throw('Incomplete or invalid key composite attributes supplied. Missing properties: "sector" - For more detail on this error reference: https://github.com/tywalch/electrodb#incomplete-composite-attributes');
  });
  it("Should create params", () => {
    let params = MallStores.get([record1, record2, record3]).params();
    expect(params).to.be.deep.equal([{
      "RequestItems": {
        "electro": {
          "Keys": [
            {
              "pk":"$bugbeater#sector_a1",
              "sk":`$test_entity_1#id_${record1.id}`
            },
            {
              "pk":"$bugbeater#sector_a1",
              "sk":`$test_entity_1#id_${record2.id}`
            },
            {
              "pk":"$bugbeater#sector_a1",
              "sk":`$test_entity_1#id_${record3.id}`
            }
          ]
        }
      }
    }]);
  });
  it("Should allow for additional parameters to be specified through the `params` query option", async () => {
    let params = MallStores.get([record1, record2, record3]).params({params: {ConsistentRead: true}});
    expect(params).to.be.deep.equal([{
      "RequestItems": {
        "electro": {
          "ConsistentRead": true,
          "Keys": [
            {
              "pk":"$bugbeater#sector_a1",
              "sk":`$test_entity_1#id_${record1.id}`
            },
            {
              "pk":"$bugbeater#sector_a1",
              "sk":`$test_entity_1#id_${record2.id}`
            },
            {
              "pk":"$bugbeater#sector_a1",
              "sk":`$test_entity_1#id_${record3.id}`
            }
          ]
        }
      }
    }]);
  });
  it("Should allow for custom table name to be specified through the `table` query option", async () => {
    let table = "custom_table_name";
    let params = MallStores.get([record1, record2, record3]).params({table});
    expect(params).to.be.deep.equal([{
      "RequestItems": {
        [table]: {
          "Keys": [
            {
              "pk":"$bugbeater#sector_a1",
              "sk":`$test_entity_1#id_${record1.id}`
            },
            {
              "pk":"$bugbeater#sector_a1",
              "sk":`$test_entity_1#id_${record2.id}`
            },
            {
              "pk":"$bugbeater#sector_a1",
              "sk":`$test_entity_1#id_${record3.id}`
            }
          ]
        }
      }
    }]);
  });
});