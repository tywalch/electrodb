const { Entity } = require("../src/entity");
const { expect } = require("chai");
const uuid = require("uuid").v4;
const moment = require("moment");
const SERVICE = "BugBeater";
const ENTITY = "TEST_ENTITY";
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
        facets: "mall_${mall}",
      },
      sk: {
        field: "gsi1sk",
        facets: "b_${building}#u_${unit}#s_${store}",
      },
    },
    leases: {
      index: "gsi2pk-gsi2sk-index",
      pk: {
        field: "gsi2pk",
        facets: "m_${mall}",
      },
      sk: {
        field: "gsi2sk",
        facets: "l_${leaseEnd}#s_${store}#b_${building}#u_${unit}",
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

let MallStores = new Entity(schema, {});
let records = [
  {
    id: "abc",
    mall: "WashingtonSquare",
    store: "LatteLarrys",
    sector: "A1",
    category: "food/coffee",
    leaseEnd: "2020-01-20",
    rent: "0.00",
    building: "BuildingZ",
    unit: "G1",
  }, {
    id: "def",
    mall: "WashingtonSquare",
    store: "LatteLarrys",
    sector: "A1",
    category: "food/coffee",
    leaseEnd: "2020-01-20",
    rent: "0.00",
    building: "BuildingZ",
    unit: "G1",
  }, {
    id: "hij",
    mall: "WashingtonSquare",
    store: "LatteLarrys",
    sector: "A1",
    category: "food/coffee",
    leaseEnd: "2020-01-20",
    rent: "0.00",
    building: "BuildingZ",
    unit: "G1",
  }
]

describe("BatchWrite", () => {
  describe("batchPut", () => {
    it("Should create params", () => {
      let params = MallStores.put(records).params();
      expect(params).to.deep.equal([{
        "RequestItems":{
           "electro":[
              {
                 "PutRequest":{
                    "Item":{
                       "storeLocationId":"abc",
                       "sector":"A1",
                       "mallId":"WashingtonSquare",
                       "storeId":"LatteLarrys",
                       "buildingId":"BuildingZ",
                       "unitId":"G1",
                       "category":"food/coffee",
                       "leaseEnd":"2020-01-20",
                       "rent":"0.00",
                       "pk":"$bugbeater#sector_a1",
                       "sk":"$test_entity_1#id_abc",
                       "gsi1pk":"mall_washingtonsquare",
                       "gsi1sk":"b_buildingz#u_g1#s_lattelarrys",
                       "gsi2pk":"m_washingtonsquare",
                       "gsi2sk":"l_2020-01-20#s_lattelarrys#b_buildingz#u_g1",
                       "gsi3pk":"$bugbeater#mall_washingtonsquare",
                       "gsi3sk":"$test_entity_1#category_food/coffee#building_buildingz#unit_g1#store_lattelarrys",
                       "gsi4pk":"$bugbeater#store_lattelarrys",
                       "gsi4sk":"$test_entity_1#mall_washingtonsquare#building_buildingz#unit_g1",
                       "__edb_e__":"TEST_ENTITY",
                       "__edb_v__":"1"
                    }
                 }
              },
              {
                 "PutRequest":{
                    "Item":{
                       "storeLocationId":"def",
                       "sector":"A1",
                       "mallId":"WashingtonSquare",
                       "storeId":"LatteLarrys",
                       "buildingId":"BuildingZ",
                       "unitId":"G1",
                       "category":"food/coffee",
                       "leaseEnd":"2020-01-20",
                       "rent":"0.00",
                       "pk":"$bugbeater#sector_a1",
                       "sk":"$test_entity_1#id_def",
                       "gsi1pk":"mall_washingtonsquare",
                       "gsi1sk":"b_buildingz#u_g1#s_lattelarrys",
                       "gsi2pk":"m_washingtonsquare",
                       "gsi2sk":"l_2020-01-20#s_lattelarrys#b_buildingz#u_g1",
                       "gsi3pk":"$bugbeater#mall_washingtonsquare",
                       "gsi3sk":"$test_entity_1#category_food/coffee#building_buildingz#unit_g1#store_lattelarrys",
                       "gsi4pk":"$bugbeater#store_lattelarrys",
                       "gsi4sk":"$test_entity_1#mall_washingtonsquare#building_buildingz#unit_g1",
                       "__edb_e__":"TEST_ENTITY",
                       "__edb_v__":"1"
                    }
                 }
              },
              {
                 "PutRequest":{
                    "Item":{
                       "storeLocationId":"hij",
                       "sector":"A1",
                       "mallId":"WashingtonSquare",
                       "storeId":"LatteLarrys",
                       "buildingId":"BuildingZ",
                       "unitId":"G1",
                       "category":"food/coffee",
                       "leaseEnd":"2020-01-20",
                       "rent":"0.00",
                       "pk":"$bugbeater#sector_a1",
                       "sk":"$test_entity_1#id_hij",
                       "gsi1pk":"mall_washingtonsquare",
                       "gsi1sk":"b_buildingz#u_g1#s_lattelarrys",
                       "gsi2pk":"m_washingtonsquare",
                       "gsi2sk":"l_2020-01-20#s_lattelarrys#b_buildingz#u_g1",
                       "gsi3pk":"$bugbeater#mall_washingtonsquare",
                       "gsi3sk":"$test_entity_1#category_food/coffee#building_buildingz#unit_g1#store_lattelarrys",
                       "gsi4pk":"$bugbeater#store_lattelarrys",
                       "gsi4sk":"$test_entity_1#mall_washingtonsquare#building_buildingz#unit_g1",
                       "__edb_e__":"TEST_ENTITY",
                       "__edb_v__":"1"
                    }
                 }
              }
           ]
        }
     }]);
    });

    it("Should return unprocessed items and only their attributes by default", () => {
      let UnprocessedPut = {
        "UnprocessedItems": {
          "electro": [
            {
              "PutRequest": {
                "Item": {
                  "storeLocationId":"abc",
                  "sector":"A1",
                  "mallId":"WashingtonSquare",
                  "storeId":"LatteLarrys",
                  "buildingId":"BuildingZ",
                  "unitId":"G1",
                  "category":"food/coffee",
                  "leaseEnd":"2020-01-20",
                  "rent":"0.00",
                  "pk":"$bugbeater_1#sector_a1",
                  "sk":"$test_entity#id_abc",
                  "gsi1pk":"mall_washingtonsquare",
                  "gsi1sk":"b_buildingz#u_g1#s_lattelarrys",
                  "gsi2pk":"m_washingtonsquare",
                  "gsi2sk":"l_2020-01-20#s_lattelarrys#b_buildingz#u_g1",
                  "gsi3pk":"$bugbeater_1#mall_washingtonsquare",
                  "gsi3sk":"$test_entity#category_food/coffee#building_buildingz#unit_g1#store_lattelarrys",
                  "gsi4pk":"$bugbeater_1#store_lattelarrys",
                  "gsi4sk":"$test_entity#mall_washingtonsquare#building_buildingz#unit_g1",
                  "__edb_e__":"TEST_ENTITY",
                  "__edb_v__":"1"
                }
              }
            }
          ]
        },
        "ConsumedCapacity": [
          {
            "TableName": "electro",
            "CapacityUnits": 3
          }
        ]
      }
      let unprocessed = MallStores.formatBulkWriteResponse("", UnprocessedPut, {});
      expect(unprocessed).to.deep.equal([records[0]])
    });
  });

  describe("batchDelete", () => {
    it("Should create params for batch delete", () => {
      let params = MallStores.delete(records).params();
      expect(params).to.deep.equal([{
        "RequestItems":{
           "electro":[
              {
                 "DeleteRequest":{
                    "Key":{
                       "pk":"$bugbeater#sector_a1",
                       "sk":"$test_entity_1#id_abc"
                    }
                 }
              },
              {
                 "DeleteRequest":{
                    "Key":{
                       "pk":"$bugbeater#sector_a1",
                       "sk":"$test_entity_1#id_def"
                    }
                 }
              },
              {
                 "DeleteRequest":{
                    "Key":{
                       "pk":"$bugbeater#sector_a1",
                       "sk":"$test_entity_1#id_hij"
                    }
                 }
              }
           ]
        }
     }])
    });

    it("Should return unprocessed items and their composite attributes by default batch delete", () => {
      let UnprocessedDelete = {
        "UnprocessedItems": {
          "electro": [
            {
              "DeleteRequest": {
                "Key": {
                  "pk":"$bugbeater#sector_a1",
                  "sk":"$test_entity_1#id_abc",
                }
              }
            }
          ]
        },
        "ConsumedCapacity": [
          {
            "TableName": "electro",
            "CapacityUnits": 3
          }
        ]
      }
      let unprocessed = MallStores.formatBulkWriteResponse("", UnprocessedDelete, {});
      expect(unprocessed).to.deep.equal([{
        id: "abc",
        sector: "a1"
      }]);
    });
  });
    it("Should separate batch get records into batches with a max size of 100 (per dynamodb spec)", () => {
        let records = new Array(201).fill(0).map((record, i) => {
            return {
                sector: `sector${i}`,
                id: `id${i}`
            }
        });
        let params = MallStores.get(records).params();
        expect(params).to.be.an("array").with.length(3);
        expect(params[0].RequestItems.electro.Keys).to.be.an("array").with.length(100);
        expect(params[0]).to.be.deep.equal({
            "RequestItems": {
                "electro": {
                    "Keys": new Array(100).fill(0).map((record, i) => {
                        return {
                            "pk":`$bugbeater#sector_sector${i}`,
                            "sk":`$test_entity_1#id_id${i}`
                        }
                    })
                }
            }
        });
        expect(params[1].RequestItems.electro.Keys).to.be.an("array").with.length(100);
        expect(params[1]).to.be.deep.equal({
            "RequestItems": {
                "electro": {
                    "Keys": new Array(100).fill(0).map((record, i) => {
                        return {
                            "pk":`$bugbeater#sector_sector${i + 100}`,
                            "sk":`$test_entity_1#id_id${i + 100}`
                        }
                    })
                }
            }
        });
        expect(params[2].RequestItems.electro.Keys).to.be.an("array").with.length(1);
        expect(params[2]).to.be.deep.equal({
            "RequestItems": {
                "electro": {
                    "Keys": [
                        {
                            "pk":`$bugbeater#sector_sector200`,
                            "sk":`$test_entity_1#id_id200`
                        }
                    ]
                }
            }
        });
    });
    it("Should separate batch delete records into batches with a max size of 25 (per dynamodb spec)", () => {
        let records = new Array(51).fill(0).map((record, i) => {
            return {
                sector: `sector${i}`,
                id: `id${i}`
            }
        });
        let params = MallStores.delete(records).params();
        expect(params).to.be.an("array").with.length(3);
        expect(params[0].RequestItems.electro).to.be.an("array").with.length(25);
        expect(params[0]).to.be.deep.equal({
            "RequestItems": {
                "electro": new Array(25).fill(0).map((record, i) => {
                    return {
                        "DeleteRequest": {
                            "Key": {
                                "pk":`$bugbeater#sector_sector${i}`,
                                "sk":`$test_entity_1#id_id${i}`
                            }
                        }
                    }
                })
            }
        });
        expect(params[1].RequestItems.electro).to.be.an("array").with.length(25);
        expect(params[1]).to.be.deep.equal({
            "RequestItems": {
                "electro": new Array(25).fill(0).map((record, i) => {
                    return {
                        "DeleteRequest": {
                            "Key": {
                                "pk":`$bugbeater#sector_sector${i + 25}`,
                                "sk":`$test_entity_1#id_id${i + 25}`
                            }
                        }
                    }
                })
            }
        });
        expect(params[2].RequestItems.electro).to.be.an("array").with.length(1);
        expect(params[2]).to.be.deep.equal({
            "RequestItems": {
                "electro": [{
                    "DeleteRequest": {
                        "Key": {
                            "pk":`$bugbeater#sector_sector50`,
                            "sk":`$test_entity_1#id_id50`
                        }
                    }
                }]
            }
        });
    });
    it("Should separate batch put records into batches with a max size of 25 (per dynamodb spec)", () => {
        let records = new Array(51).fill(0).map((record, i) => {
            return {
                "id": `id${i}`,
                "mall":"WashingtonSquare",
                "store":"LatteLarrys",
                "sector": `sector${i}`,
                "category":"food/coffee",
                "leaseEnd":"2020-01-20",
                "rent":"0.00",
                "building":"BuildingZ",
                "unit":"G1",
            }
        });
        let params = MallStores.put(records).params();
        expect(params).to.be.an("array").with.length(3);
        expect(params[0].RequestItems.electro).to.be.an("array").with.length(25);
        expect(params[0]).to.be.deep.equal({
            "RequestItems": {
                "electro": new Array(25).fill(0).map((record, i) => {
                    return {
                        "PutRequest": {
                            "Item": {
                                "storeLocationId":`id${i}`,
                                "sector":`sector${i}`,
                                "mallId":"WashingtonSquare",
                                "storeId":"LatteLarrys",
                                "buildingId":"BuildingZ",
                                "unitId":"G1",
                                "category":"food/coffee",
                                "leaseEnd":"2020-01-20",
                                "rent":"0.00",
                                "pk":`$bugbeater#sector_sector${i}`,
                                "sk":`$test_entity_1#id_id${i}`,
                                "gsi1pk":"mall_washingtonsquare",
                                "gsi1sk":"b_buildingz#u_g1#s_lattelarrys",
                                "gsi2pk":"m_washingtonsquare",
                                "gsi2sk":"l_2020-01-20#s_lattelarrys#b_buildingz#u_g1",
                                "gsi3pk":"$bugbeater#mall_washingtonsquare",
                                "gsi3sk":"$test_entity_1#category_food/coffee#building_buildingz#unit_g1#store_lattelarrys",
                                "gsi4pk":"$bugbeater#store_lattelarrys",
                                "gsi4sk":"$test_entity_1#mall_washingtonsquare#building_buildingz#unit_g1",
                                "__edb_e__":"TEST_ENTITY",
                                "__edb_v__":"1"
                            }
                        }
                    }
                })
            }
        });
        expect(params[1].RequestItems.electro).to.be.an("array").with.length(25);
        expect(params[1]).to.be.deep.equal({
            "RequestItems": {
                "electro": new Array(25).fill(0).map((record, i) => {
                    return {
                        "PutRequest": {
                            "Item": {
                                "storeLocationId":`id${i + 25}`,
                                "sector":`sector${i + 25}`,
                                "mallId":"WashingtonSquare",
                                "storeId":"LatteLarrys",
                                "buildingId":"BuildingZ",
                                "unitId":"G1",
                                "category":"food/coffee",
                                "leaseEnd":"2020-01-20",
                                "rent":"0.00",
                                "pk":`$bugbeater#sector_sector${i + 25}`,
                                "sk":`$test_entity_1#id_id${i + 25}`,
                                "gsi1pk":"mall_washingtonsquare",
                                "gsi1sk":"b_buildingz#u_g1#s_lattelarrys",
                                "gsi2pk":"m_washingtonsquare",
                                "gsi2sk":"l_2020-01-20#s_lattelarrys#b_buildingz#u_g1",
                                "gsi3pk":"$bugbeater#mall_washingtonsquare",
                                "gsi3sk":"$test_entity_1#category_food/coffee#building_buildingz#unit_g1#store_lattelarrys",
                                "gsi4pk":"$bugbeater#store_lattelarrys",
                                "gsi4sk":"$test_entity_1#mall_washingtonsquare#building_buildingz#unit_g1",
                                "__edb_e__":"TEST_ENTITY",
                                "__edb_v__":"1"
                            }
                        }
                    }
                })
            }
        });
        expect(params[2].RequestItems.electro).to.be.an("array").with.length(1);
        expect(params[2]).to.be.deep.equal({
            "RequestItems": {
                "electro": [{
                    "PutRequest": {
                        "Item": {
                            "storeLocationId":`id50`,
                            "sector":`sector50`,
                            "mallId":"WashingtonSquare",
                            "storeId":"LatteLarrys",
                            "buildingId":"BuildingZ",
                            "unitId":"G1",
                            "category":"food/coffee",
                            "leaseEnd":"2020-01-20",
                            "rent":"0.00",
                            "pk":`$bugbeater#sector_sector50`,
                            "sk":`$test_entity_1#id_id50`,
                            "gsi1pk":"mall_washingtonsquare",
                            "gsi1sk":"b_buildingz#u_g1#s_lattelarrys",
                            "gsi2pk":"m_washingtonsquare",
                            "gsi2sk":"l_2020-01-20#s_lattelarrys#b_buildingz#u_g1",
                            "gsi3pk":"$bugbeater#mall_washingtonsquare",
                            "gsi3sk":"$test_entity_1#category_food/coffee#building_buildingz#unit_g1#store_lattelarrys",
                            "gsi4pk":"$bugbeater#store_lattelarrys",
                            "gsi4sk":"$test_entity_1#mall_washingtonsquare#building_buildingz#unit_g1",
                            "__edb_e__":"TEST_ENTITY",
                            "__edb_v__":"1"
                        }
                    }
                }]
            }
        });
    });
});