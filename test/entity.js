const {Entity} = require("../src/entity");
const {ClauseProxy, clauses} = require("../src/clauses");
const moment = require("moment");
const uuidV4 = require("uuid/v4");

let schema = {
  service: "MallStoreDirectory",
  entity: "MallStores",
  table: "StoreDirectory",
  version: "1",
  attributes: {
    id: {
      type: "string",
      default: () => uuidV4(),
      field: "storeLocationId"
    },
    mall: {
      type: "string",
      required: true,
      field: "mallId"
    },
    store: {
      type: "string",
      required: true,
      field: "storeId"
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
      type: ["food/coffee", "food/meal", "clothing", "electronics", "department", "misc"],
      required: true
    },
    leaseEnd: {
      type: "string",
      required: true,
      validate: (date) => moment(date,'YYYY-MM-DD').isValid(),
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
        compose: ["id"]
      }
    },
    units: {
      index: "gsi1pk-gsi1sk-index",
      pk: {
        field: "gsi1pk",
        compose: ["mall"]
      },
      sk: {
        field: "gsi1sk",
        compose: ["building", "unit", "store"],
      }
    },
    leases: {
      index: "gsi2pk-gsi2sk-index",
      pk: {
        field: "gsi2pk",
        compose: ["mall"]
      },
      sk: {
        field: "gsi2sk",
        compose: ["leaseEnd", "store", "building", "unit"],
      }
    },
    categories: {
      index: "gsi3pk-gsi3sk-index",
      pk: {
        field: "gsi3pk",
        compose: ["mall"]
      },
      sk: {
        field: "gsi3sk",
        compose: ["category", "building", "unit", "store"]
      }
    },
    shops: {
      index: "gsi4pk-gsi4sk-index",
      pk: {
        field: "gsi4pk",
        compose: ["store"]
      },
      sk: {
        field: "gsi4sk",
        compose: ["mall", "building", "unit",]
      }
    },
  }
};

let MallStores = new Entity(schema);
// console.log(JSON.stringify(MallStores.schema));
let clause = new ClauseProxy(clauses);
let shops = clause.make(MallStores, "shops");
// console.log(shops().query().between().and().gt().params());
let mall = "123";
let store = "123";
let building = "123";
let id = "123";
let category = "123";
let unit = "123";
console.log("hello", MallStores._findBestIndexMatch({mall, category, building, unit}));
