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
      default: () => uuid(),
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

async function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), ms);
  });
}

describe("BatchWrite", async () => {
  it("should perform a batchPut via array to put method", async () => {
    let created = await MallStores.put([record1, record2, record3]).go();
    // eventually consistent
    await sleep(500);
    // empty array is no unprocessed
    expect(created).to.be.an("array").that.is.empty;
    // verify existance
    let item = await MallStores.get(record1).go();
    expect(item).to.be.deep.equal(record1);
  });

  it("should perform a batchDelete via array to delete method", async () => {
    let created = await MallStores.put([record1, record2, record3]).go();
    // eventually consistent
    await sleep(500);
    // empty array is no unprocessed
    expect(created).to.be.an("array").that.is.empty;
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
})