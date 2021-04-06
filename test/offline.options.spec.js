const {expect} = require("chai");
const {Entity} = require("../src/entity");

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
               extract: (params) => Object.keys(params.RequestItems)[0]
           },
           {
               name: "batchDelete",
               query: () => entity.delete([properties]).params({table}),
               extract: (params) => Object.keys(params.RequestItems)[0]
           },
           {
               name: "batchPut",
               query: () => entity.put([properties]).params({table}),
               extract: (params) => Object.keys(params.RequestItems)[0]
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
});