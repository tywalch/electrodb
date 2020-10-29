process.env.AWS_NODEJS_CONNECTION_REUSE_ENABLED = 1;
const { Entity } = require("../src/entity");
const { expect } = require("chai");
const uuidv4 = require("uuid").v4;
const moment = require("moment");
const DynamoDB = require("aws-sdk/clients/dynamodb");
const client = new DynamoDB.DocumentClient({
  region: "us-east-1",
});
const SERVICE = "BugBeater";
const ENTITY = "TEST_ENTITY";
let model = {
  service: SERVICE,
  entity: ENTITY,
  table: "electro",
  version: "1",
  attributes: {
    id: {
      type: "string",
      default: () => uuidv4(),
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
        field: "PK",
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
  },
  filters: {
    maxRent({ rent }, max) {
      return rent.lte(max);
    },
  },
};
let MallStores = new Entity(model, { client });
// console.log(JSON.stringify(MallStores));
let mall = "EastPointe";
let store = "LatteLarrys";
let sector = "A1";
let category = "food/coffee";
let leaseEnd = "2020-01-20";
let rent = "0.00";
let building = "BuildingZ";
let unit = "G1";
console.log(MallStores.query.units({mall: "abc", building: "def", unit: "efg"}).params());
console.log(MallStores.query.leases({mall: "abc", leaseEnd: "def", store: "efg"}).params());
console.log(MallStores.query.shops({mall: "abc", building: "def", store: "efg"}).params());
console.log(MallStores.create({
  sector,
  store,
  mall,
  rent,
  category,
  leaseEnd,
  unit,
  building,
}).params());
// console.log(MallStores.scan.params());
