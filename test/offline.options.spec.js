const {expect} = require("chai");
const {Entity} = require("../src/entity");
const uuid = require("uuid").v4;
const moment = require("moment");
const c = require('../src/client');
function noOpClientMethods() {
    return c.v2Methods
        .reduce((client, method) => {
            client[method] = () => {}
            return client;
        }, {});
}

describe("Query Options", () => {
   describe("table", () => {
       let schema = {
           model: {
               entity: "queryoptions",
               service: "tests",
               version: "1"
           },
           attributes: {
               prop1: "string",
               prop2: "string",
               prop3: "string",
               prop4: "string",
               prop5: "string"
           },
           indexes: {
               index1: {
                   pk: {
                       field: "pk",
                       facets: ["prop1"]
                   },
                   sk: {
                       field: "sk",
                       facets: ["prop2"]
                   }
               },
               index2: {
                   index: "gsi1",
                   pk: {
                       field: "gsi1pk",
                       facets: ["prop3"]
                   },
                   sk: {
                       field: "gsi1sk",
                       facets: ["prop4"]
                   }
               }
           }
       };
       let entity = new Entity(schema, {table: "should_be_overwritten"});
       let properties = {
           prop1: "prop1Value",
           prop2: "prop2Value",
           prop3: "prop3Value",
           prop4: "prop4Value",
           prop5: "prop5Value"
       };
       let {prop1, prop2, prop3, prop4, prop5} = properties;
       let table = "table_override";
       let tests = [
           // CRUD
           {
               name: "get",
               query: () => entity.get(properties).params({table}),
               extract: (params) => params.TableName
           },
           {
               name: "delete",
               query: () => entity.delete(properties).params({table}),
               extract: (params) => params.TableName
           },
           {
               name: "scan",
               query: () => entity.scan.params({table}),
               extract: (params) => params.TableName
           },
           {
               name: "put",
               query: () => entity.put(properties).params({table}),
               extract: (params) => params.TableName
           },
           {
               name: "create",
               query: () => entity.create(properties).params({table}),
               extract: (params) => params.TableName
           },
           {
               name: "update",
               query: () => entity.update(properties).set({prop5}).params({table}),
               extract: (params) => params.TableName
           },
           {
               name: "patch",
               query: () => entity.patch(properties).set({prop5}).params({table}),
               extract: (params) => params.TableName
           },

           // Batch CRUD
           {
               name: "batchGet",
               query: () => entity.get([properties]).params({table}),
               extract: (params) => Object.keys(params[0].RequestItems)[0]
           },
           {
               name: "batchDelete",
               query: () => entity.delete([properties]).params({table}),
               extract: (params) => Object.keys(params[0].RequestItems)[0]
           },
           {
               name: "batchPut",
               query: () => entity.put([properties]).params({table}),
               extract: (params) => Object.keys(params[0].RequestItems)[0]
           },

           // Queries (index1)
           {
               name: "query",
               query: () => entity.query.index1(properties).params({table}),
               extract: (params) => params.TableName
           },
           {
               name: "begins",
               query: () => entity.query.index1({prop1}).begins({prop2}).params({table}),
               extract: (params) => params.TableName
           },
           {
               name: "between",
               query: () => entity.query.index1({prop1}).between({prop2}, {prop2}).params({table}),
               extract: (params) => params.TableName
           },
           {
               name: "gte",
               query: () => entity.query.index1({prop1}).gte({prop2}).params({table}),
               extract: (params) => params.TableName
           },
           {
               name: "gt",
               query: () => entity.query.index1({prop1}).gt({prop2}).params({table}),
               extract: (params) => params.TableName
           },
           {
               name: "lt",
               query: () => entity.query.index1({prop1}).lt({prop2}).params({table}),
               extract: (params) => params.TableName
           },
           {
               name: "lte",
               query: () => entity.query.index1({prop1}).lte({prop2}).params({table}),
               extract: (params) => params.TableName
           },

           // Queries (index2)
           {
               name: "query",
               query: () => entity.query.index2(properties).params({table}),
               extract: (params) => params.TableName
           },
           {
               name: "begins",
               query: () => entity.query.index2({prop3}).begins({prop4}).params({table}),
               extract: (params) => params.TableName
           },
           {
               name: "between",
               query: () => entity.query.index2({prop3}).between({prop4}, {prop4}).params({table}),
               extract: (params) => params.TableName
           },
           {
               name: "gte",
               query: () => entity.query.index2({prop3}).gte({prop4}).params({table}),
               extract: (params) => params.TableName
           },
           {
               name: "gt",
               query: () => entity.query.index2({prop3}).gt({prop4}).params({table}),
               extract: (params) => params.TableName
           },
           {
               name: "lt",
               query: () => entity.query.index2({prop3}).lt({prop4}).params({table}),
               extract: (params) => params.TableName
           },
           {
               name: "lte",
               query: () => entity.query.index2({prop3}).lte({prop4}).params({table}),
               extract: (params) => params.TableName
           }
       ];
       for (let test of tests) {
           it(`Should overwrite table used for a ${test.name} query/operation`, () => {
                let params = test.query();
                let tableName = test.extract(params);
                expect(table).to.equal(tableName);
           });
       }
   });
   describe("concurrent", async () => {
       function makeRecords(size) {
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
        function makeMockClient(delay = 1000) {
           if (delay < 1000) {
               // see comments below to understand why.
               throw new Error("Whoa boy, this requires at least as second's length of time to work right");
           }
            const sleep = (ms) => {
                return new Promise((resolve) => {
                    setTimeout(() => resolve(), ms)
                });
            }
            const ops = [];
            return {
                ...noOpClientMethods(),
                ops,
                addOp(data) {
                    this.ops.push({data, time: new Date()});
                },
                opDelay: delay, // second delay added to ops
                getOpConcurrency() {
                  //  This is a super clever (see: stupid) way to test the concurrency of the requests.
                  //  I use the second value of time that the operation was made to then group and count requests.
                  //  Assuming a second is enough granularity (enforced at the top) it should count how many operations
                  //  were ran within the same second. This can then be used to determine how many were concurrently
                  //  called at once.
                  let opSecondCount = {};
                  let opOrder = [];
                  for (let i = 0; i < this.ops.length; i++) {
                      let {data, time} = this.ops[i];
                      let second = time.getSeconds();
                      if (opSecondCount[second] === undefined) {
                          opSecondCount[second] = 0;
                          opOrder.push(second);
                      }
                      opSecondCount[second]++;
                  }
                  return opOrder.map(second => opSecondCount[second]);
                },
                batchWrite(params) {
                    let delay = this.opDelay;
                    this.addOp({params, type: "batchWrite", });
                    return {
                        async promise() {
                            await sleep(delay);
                            return {
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
                            };
                        }
                    }
                },
                batchGet(params) {
                    let delay = this.opDelay;
                    this.addOp({params, type: "batchGet"});
                    return {
                        async promise() {
                            await sleep(delay);
                            return {"Responses":{"electro":[{"gsi1sk":"b_buildingz#u_g1#s_lattelarrys","gsi2sk":"l_2020-01-20#s_lattelarrys#b_buildingz#u_g1","mallId":"WashingtonSquare","gsi3sk":"$test_entity_1#category_food/coffee#building_buildingz#unit_g1#store_lattelarrys","gsi1pk":"mall_washingtonsquare","gsi4sk":"$test_entity_1#mall_washingtonsquare#building_buildingz#unit_g1","__edb_e__":"TEST_ENTITY","storeId":"LatteLarrys","rent":"0.00","buildingId":"BuildingZ","sk":"$test_entity_1#id_f41148a7-ff78-45fd-a027-84b2424cac21","gsi2pk":"m_washingtonsquare","unitId":"G1","gsi3pk":"$bugbeater#mall_washingtonsquare","gsi4pk":"$bugbeater#store_lattelarrys","__edb_v__":"1","pk":"$bugbeater#sector_a1","category":"food/coffee","leaseEnd":"2020-01-20","sector":"A1","storeLocationId":"f41148a7-ff78-45fd-a027-84b2424cac21"}]},"UnprocessedKeys":{}};
                        }
                    }
                }
            }
        }
        let schema = {
           model: {
               service: "BugBeater",
               entity: "TEST_ENTITY",
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
        describe("Concurrency option value implementation", () => {

            let tests = [
                {
                    description: "Should not allow values that are not a number",
                    error: true,
                    input: {
                        options: {concurrent: "abc"}
                    },
                    output: {
                        message: "Query option 'concurrency' must be of type 'number' and greater than zero. - For more detail on this error reference: https://github.com/tywalch/electrodb#invalid-concurrency-option"
                    }
                },
                {
                    description: "Should not allow numbers that are less than 1",
                    error: true,
                    input: {
                        options: {concurrent: 0}
                    },
                    output: {
                        message: "Query option 'concurrency' must be of type 'number' and greater than zero. - For more detail on this error reference: https://github.com/tywalch/electrodb#invalid-concurrency-option"
                    }
                },
                {
                    description: "Should not string numbers that are greater than 0",
                    error: false,
                    input: {
                        options: {concurrent: "1"}
                    },
                    output: {
                        executions: 1
                    }
                },
                {
                    description: "Should default to 1 when value is not supplied/undefined",
                    error: false,
                    input: {
                        options: {},
                    },
                    output: {
                        executions: 1
                    }
                },
            ];

            const methods = ["get", "put", "delete"];
            for (let test of tests) {
                for (let method of methods) {
                    it(`${test.description} for batch ${method}.`, async () => {
                        let client = makeMockClient();
                        let MallStores = new Entity(schema, {client});
                        let records = [{
                            id: "abc",
                            mall: "WashingtonSquare",
                            store: "LatteLarrys",
                            sector: "A1",
                            category: "food/coffee",
                            leaseEnd: "2020-01-20",
                            rent: "0.00",
                            building: "BuildingZ",
                            unit: "G1",
                        }];
                        if (test.error) {
                            let result = await MallStores[method](records).go(test.input.options)
                                .then(() => {})
                                .catch(err => err.message);
                            expect(result).to.equal(test.output.message);
                            expect(client.ops).to.be.an("array").with.length(0);
                        } else {
                            await MallStores[method](records).go(test.input.options);
                            expect(client.ops).to.be.an("array").with.length(1);
                        }
                    });
                }
            }
        })
       it("Should execute n number of batch concurrently", async () => {
          async function batchPutConcurrencyTest() {
              // Total batch write size is 25. 160 records are used to ensure an odd number of requests are performed.
              let delay = 1000;
              let size = 160;
              let concurrent = 2;
              let totalBatches = Math.ceil(size / 25);
              let expectedConcurrencyPattern = [2,2,2,1]; // an element represents how many requests executed per second
              let records = makeRecords(size);
              let client = makeMockClient(delay);
              let MallStores = new Entity(schema, {client});
              let result = await MallStores.put(records).go({concurrent});
              expect(result).to.be.an("array").and.to.have.length(totalBatches);
              let concurrencyPattern = client.getOpConcurrency();

              expect(concurrencyPattern).to.be.an("array").with.length(expectedConcurrencyPattern.length);
              expect(concurrencyPattern).to.be.an("array").with.length(Math.ceil(totalBatches / concurrent));
              for (let i = 0; i < concurrencyPattern.length; i++) {
                  let got = concurrencyPattern[i];
                  let expected = expectedConcurrencyPattern[i];
                  expect(got).to.equal(expected);
              }
          }
           async function batchDeleteConcurrencyTest() {
               // Total batch write size is 25. 160 records are used to ensure an odd number of requests are performed.
               let delay = 1000;
               let size = 160;
               let concurrent = 2;
               let totalBatches = Math.ceil(size / 25);
               let expectedConcurrencyPattern = [2,2,2,1];// an element represents how many requests executed per second
               let records = makeRecords(size);
               let client = makeMockClient(delay);
               let MallStores = new Entity(schema, {client});
               let result = await MallStores.delete(records).go({concurrent});
               expect(result).to.be.an("array").and.to.have.length(totalBatches);
               let concurrencyPattern = client.getOpConcurrency();
               expect(concurrencyPattern).to.be.an("array").with.length(expectedConcurrencyPattern.length);
               expect(concurrencyPattern).to.be.an("array").with.length(Math.ceil(totalBatches / concurrent));
               for (let i = 0; i < concurrencyPattern.length; i++) {
                   let got = concurrencyPattern[i];
                   let expected = expectedConcurrencyPattern[i];
                   expect(got).to.equal(expected);
               }
           }
           async function batchGetConcurrencyTest() {
               // Total batch get size is 100. 430 records are used to ensure an odd number of requests are performed.
               let delay = 1000;
               let size = 430;
               let concurrent = 2;
               let totalBatches = Math.ceil(size / 100);
               let expectedConcurrencyPattern = [2, 2, 1];// an element represents how many requests executed per second
               let records = makeRecords(size);
               let client = makeMockClient(delay);
               let MallStores = new Entity(schema, {client});
               let result = await MallStores.get(records).go({concurrent});
               expect(result).to.be.an("array").and.to.have.length(2);
               expect(result[0]).to.be.an("array").and.to.have.length(totalBatches);
               expect(result[1]).to.be.an("array").and.to.have.length(0);
               let concurrencyPattern = client.getOpConcurrency();
               expect(concurrencyPattern).to.be.an("array").with.length(expectedConcurrencyPattern.length);
               expect(concurrencyPattern).to.be.an("array").with.length(Math.ceil(totalBatches / concurrent));
               for (let i = 0; i < concurrencyPattern.length; i++) {
                   let got = concurrencyPattern[i];
                   let expected = expectedConcurrencyPattern[i];
                   expect(got).to.equal(expected);
               }
           }

           let tests = [
               {
                   description: "Should execute n number of batch put concurrently",
                   fn: batchPutConcurrencyTest,
               },
               {
                   description: "Should execute n number of batch delete concurrently",
                   fn: batchDeleteConcurrencyTest,
               },
               {
                   description: "Should execute n number of batch write concurrently",
                   fn: batchGetConcurrencyTest,
               }
           ];

           // Run each test in parallel so as not to add a LOT of time to the overall tests suite
           // Run each, return the error if there is one or undefined if there isnt a failure.
           // map back through and print the description of any failures.
           let results = await Promise.all(tests.map(async ({fn}) => {
              return fn()
                  .then(() => {})
                  .catch(err => err)
           }));
           let errors = results
               .map((result, i) => {
                   // if it was an error, return the corresponding description from the tests array
                   if (result !== undefined) {
                       return tests[i].description;
                   }
               })
               .filter(err => {
                   // remove the empties (successes)
                   if (err !== undefined) {
                       return err;
                   }
               });
           if (errors.length) {
               throw new Error(`Failed the following tests: ${errors.join(", ")}`);
           }
       }).timeout(10000);
       //
       // it("Should execute n number of batch put concurrently", async () => {
       //     let delay = 1000;
       //     let size = 160;
       //     let totalBatches = Math.ceil(size / 25);
       //     let records = makeRecords(size);
       //     let client = makeMockClient(delay);
       //     let MallStores = new Entity(schema, {client});
       //     let result = await MallStores.put(records).go({concurrent: 2});
       //     expect(result).to.be.an("array").and.to.have.length(totalBatches);
       //     let concurrencyPattern = client.getOpConcurrency();
       //     let expectedConcurrencyPattern = [2,2,2,1];
       //     expect(concurrencyPattern).to.be.an("array").with.length(expectedConcurrencyPattern.length);
       //     for (let i = 0; i < concurrencyPattern.length; i++) {
       //         let got = concurrencyPattern[i];
       //         let expected = expectedConcurrencyPattern[i];
       //         expect(got).to.equal(expected);
       //     }
       // }).timeout(10000);
       // it("Should execute n number of batch delete concurrently", async () => {
       //     let delay = 1000;
       //     let size = 160;
       //     let totalBatches = Math.ceil(size / 25);
       //     let records = makeRecords(size);
       //     let client = makeMockClient(delay);
       //     let MallStores = new Entity(schema, {client});
       //     let result = await MallStores.delete(records).go({concurrent: 2});
       //     expect(result).to.be.an("array").and.to.have.length(totalBatches);
       //     let concurrencyPattern = client.getOpConcurrency();
       //     let expectedConcurrencyPattern = [2,2,2,1];
       //     expect(concurrencyPattern).to.be.an("array").with.length(expectedConcurrencyPattern.length);
       //     for (let i = 0; i < concurrencyPattern.length; i++) {
       //         let got = concurrencyPattern[i];
       //         let expected = expectedConcurrencyPattern[i];
       //         expect(got).to.equal(expected);
       //     }
       // }).timeout(10000);
       // it("Should execute n number of batch get concurrently", async () => {
       //     let delay = 1000;
       //     let size = 430;
       //     let totalBatches = Math.ceil(size / 100);
       //     let records = makeRecords(size);
       //     let client = makeMockClient(delay);
       //     let MallStores = new Entity(schema, {client});
       //     let result = await MallStores.get(records).go({concurrent: 2});
       //     expect(result).to.be.an("array").and.to.have.length(2);
       //     expect(result[0]).to.be.an("array").and.to.have.length(totalBatches);
       //     expect(result[1]).to.be.an("array").and.to.have.length(0);
       //     let concurrencyPattern = client.getOpConcurrency();
       //     let expectedConcurrencyPattern = [2, 2, 1];
       //     expect(concurrencyPattern).to.be.an("array").with.length(expectedConcurrencyPattern.length);
       //     for (let i = 0; i < concurrencyPattern.length; i++) {
       //         let got = concurrencyPattern[i];
       //         let expected = expectedConcurrencyPattern[i];
       //         expect(got).to.equal(expected);
       //     }
       // }).timeout(10000);
   });
});