const {Entity, Service} = require("../index");
const {v2Methods} = require('../src/client');
const {data} = require("./pagination.data");
const taskr = require("../examples/taskapp/src/taskr");
const {expect} = require("chai");

function makeClient(lastEvaluatedKey) {
    let queries = [];
    let response = {
        ...data,
        LastEvaluatedKey: lastEvaluatedKey
            ? lastEvaluatedKey
            : data.LastEvaluatedKey
    };
    let client = {};
    for (const method of v2Methods) {
        // these methods are not necessary to test
        client[method] = () => {};
    }
    // this method is necessary to test
    client.query = (params) => {
        queries.push(params);
        return {
            promise: async () => response
        }
    }
    return {
        queries,
        client
    }
}

describe("Offline Pagination", () => {
   describe("Services", () => {
       it("Should return the lastEvaluatedKey as it came back from dynamo", async () => {
           const {client, queries} = makeClient();
           taskr._setClient(client);
           let [page, results] = await taskr.collections.workplaces({office: "Mobile Branch"}).page(null, {pager: "raw"});
           expect(page).to.be.deep.equal({
               sk: '$employees_1',
               pk: '$taskapp#employee_3712bb53-7386-4431-9c5c-036d93694456',
               gsi1sk: '$workplaces#employees_1#team_marketing#title_software engineer i#employee_3712bb53-7386-4431-9c5c-036d93694456',
               gsi1pk: '$taskapp#office_mobile branch'
           });
       });

       it("Should return the lastEvaluatedKey as an item with the entity's identifiers", async () => {
           const {client, queries} = makeClient({
               pk: '$taskapp#country_united states of america#state_oregon',
               sk: '$offices_1#city_power#zip_34706#office_mobile branch',
               gsi1pk: '$taskapp#office_mobile branch',
               gsi1sk: '$workplaces#offices_1'
           });
           taskr._setClient(client);
           let [page, results] = await taskr.collections.workplaces({office: "Mobile Branch"}).page(null, {pager: "named"});
           expect(page).to.be.deep.equal({
               "city": "power",
               "country": "united states of america",
               "state": "oregon",
               "zip": "34706",
               "office": "mobile branch",
               "__edb_e__": "offices",
               "__edb_v__": "1"
           });
       });

       it("Should return the lastEvaluatedKey as an item with the entity's identifiers by default", async () => {
           const {client, queries} = makeClient();
           taskr._setClient(client);
           let [page, results] = await taskr.collections.workplaces({office: "Mobile Branch"}).page();
           expect(page).to.be.deep.equal({
               "team": "marketing",
               "title": "software engineer i",
               "employee": "3712bb53-7386-4431-9c5c-036d93694456",
               "office": "mobile branch",
               "__edb_e__": "employees",
               "__edb_v__": "1"
           });
       });

       it("Should return the lastEvaluatedKey as just an item", async () => {
           const {client, queries} = makeClient();
           taskr._setClient(client);
           let [page, results] = await taskr.collections.workplaces({office: "Mobile Branch"}).page(null, {pager: "item"});
           expect(page).to.be.deep.equal({
               "team": "marketing",
               "title": "software engineer i",
               "employee": "3712bb53-7386-4431-9c5c-036d93694456",
               "office": "mobile branch",
           });
       });

       it("Should reformat a raw pager correctly back into a ExclusiveStartKey", async () => {
           const {client, queries} = makeClient();
           taskr._setClient(client);
           const pager = {
               sk: '$employees_1',
               pk: '$taskapp#employee_3712bb53-7386-4431-9c5c-036d93694456',
               gsi1sk: '$workplaces#employees_1#team_marketing#title_software engineer i#employee_3712bb53-7386-4431-9c5c-036d93694456',
               gsi1pk: '$taskapp#office_mobile branch'
           }
           await taskr.collections.workplaces({office: "Mobile Branch"}).page(pager, {pager: "raw"});
           expect(queries).to.be.an("array").with.length(1);
           expect(queries[0].ExclusiveStartKey).to.be.deep.equal(pager);
       });

       it("Should reformat a named pager correctly back into a ExclusiveStartKey", async () => {
           const {client, queries} = makeClient();
           taskr._setClient(client);
           const pager = {
               "team": "marketing",
               "title": "software engineer i",
               "employee": "3712bb53-7386-4431-9c5c-036d93694456",
               "office": "mobile branch",
               "__edb_e__": "employees",
               "__edb_v__": "1"
           };
           await taskr.collections.workplaces({office: "Mobile Branch"}).page(pager, {pager: "named"});
           expect(queries).to.be.an("array").with.length(1);
           expect(queries[0].ExclusiveStartKey).to.be.deep.equal({
               sk: '$employees_1',
               pk: '$taskapp#employee_3712bb53-7386-4431-9c5c-036d93694456',
               gsi1sk: '$workplaces#employees_1#team_marketing#title_software engineer i#employee_3712bb53-7386-4431-9c5c-036d93694456',
               gsi1pk: '$taskapp#office_mobile branch'
           });
       });

       it("Should throw when named pager does not map to any known entities -- pager option 'named'", async () => {
           const {client, queries} = makeClient();
           taskr._setClient(client);
           const pager = {
               "team": "marketing",
               "title": "software engineer i",
               "employee": "3712bb53-7386-4431-9c5c-036d93694456",
               "office": "mobile branch",
               "__edb_e__": "employees",
               "__edb_v__": "12"
           };
           let result = await taskr.collections.workplaces({office: "Mobile Branch"}).page(pager, {pager: "named"}).then(() => ({success: true})).catch((err) => ({success: false, err}));
           expect(result.success).to.be.false;
           expect(result.err.message).to.equal("Supplied Pager does not resolve to Entity within Service - For more detail on this error reference: https://github.com/tywalch/electrodb#no-owner-for-pager");
       });

       it("Should throw when named pager does not map to any known entities -- pager option 'item'", async () => {
           const {client, queries} = makeClient();
           taskr._setClient(client);
           const pager = {
               "team": "marketing"
           };
           let result = await taskr.collections.workplaces({office: "Mobile Branch"}).page(pager, {pager: "item"}).then(() => ({success: true})).catch((err) => ({success: false, err}));
           expect(result.success).to.be.false;
           expect(result.err.message).to.equal("Supplied Pager did not resolve to single Entity - For more detail on this error reference: https://github.com/tywalch/electrodb#pager-not-unique");
       });

       it("Should reformat a item pager correctly back into a ExclusiveStartKey", async () => {
           const {client, queries} = makeClient();
           taskr._setClient(client);
           const pager = {
               "team": "marketing",
               "title": "software engineer i",
               "employee": "3712bb53-7386-4431-9c5c-036d93694456",
               "office": "mobile branch",
           };
           await taskr.collections.workplaces({office: "Mobile Branch"}).page(pager, {pager: "item"});
           expect(queries).to.be.an("array").with.length(1);
           expect(queries[0].ExclusiveStartKey).to.be.deep.equal({
               sk: '$employees_1',
               pk: '$taskapp#employee_3712bb53-7386-4431-9c5c-036d93694456',
               gsi1sk: '$workplaces#employees_1#team_marketing#title_software engineer i#employee_3712bb53-7386-4431-9c5c-036d93694456',
               gsi1pk: '$taskapp#office_mobile branch'
           });
       });

       it("An Entity's identifiers should be used when utilizing a ExclusiveStartKey or parsing a LastEvaluatedSortKey", async () => {
           try {
               const {client, queries} = makeClient();
               taskr._setClient(client);
               taskr.entities.employees.setIdentifier("entity", "__e");
               taskr.entities.employees.setIdentifier("version", "__v");
               let [page] = await taskr.collections.workplaces({office: "Mobile Branch"}).page(null, {pager: "named"});
               expect(page).to.be.deep.equal({
                   "team": "marketing",
                   "title": "software engineer i",
                   "employee": "3712bb53-7386-4431-9c5c-036d93694456",
                   "office": "mobile branch",
                   "__e": "employees",
                   "__v": "1"
               });
               await taskr.collections.workplaces({office: "Mobile Branch"}).page(page, {pager: "named"});
               expect(queries).to.be.an("array").with.length(2);
               expect(queries[1].ExclusiveStartKey).to.be.deep.equal({
                   sk: '$employees_1',
                   pk: '$taskapp#employee_3712bb53-7386-4431-9c5c-036d93694456',
                   gsi1sk: '$workplaces#employees_1#team_marketing#title_software engineer i#employee_3712bb53-7386-4431-9c5c-036d93694456',
                   gsi1pk: '$taskapp#office_mobile branch'
               });
           } catch(err) {
               // reset the entity
               taskr.entities.employees.setIdentifier("entity", "__edb_e__");
               taskr.entities.employees.setIdentifier("version", "__edb_v__");
               throw err;
           }
           taskr.entities.employees.setIdentifier("entity", "__edb_e__");
           taskr.entities.employees.setIdentifier("version", "__edb_v__");
       });
   });

   describe("Entities", () => {
       it("Should return the lastEvaluatedKey as it came back from dynamo", async () => {
           const {client, queries} = makeClient({
               sk: '$employees_1',
               pk: '$taskapp#employee_3712bb53-7386-4431-9c5c-036d93694456',
               gsi1sk: '$workplaces#employees_1#team_cool cats and kittens#title_junior software engineer#employee_25e754f4-a4e5-496f-9c43-63de512cf460',
               gsi1pk: '$taskapp#office_mobile branch'
           });
           taskr._setClient(client);
           let [page, results] = await taskr.entities.employees.query.coworkers({office: "Mobile Branch"}).page(null, {pager: "raw"});
           expect(page).to.be.deep.equal({
               sk: '$employees_1',
               pk: '$taskapp#employee_3712bb53-7386-4431-9c5c-036d93694456',
               gsi1sk: '$workplaces#employees_1#team_cool cats and kittens#title_junior software engineer#employee_25e754f4-a4e5-496f-9c43-63de512cf460',
               gsi1pk: '$taskapp#office_mobile branch'
           });
       });

       it("Should return the lastEvaluatedKey as an item with the entity's identifiers", async () => {
           const {client, queries} = makeClient({
               sk: '$employees_1',
               pk: '$taskapp#employee_3712bb53-7386-4431-9c5c-036d93694456',
               gsi1sk: '$workplaces#employees_1#team_cool cats and kittens#title_junior software engineer#employee_25e754f4-a4e5-496f-9c43-63de512cf460',
               gsi1pk: '$taskapp#office_mobile branch'
           });
           taskr._setClient(client);
           let [page, results] = await taskr.entities.employees.query.coworkers({office: "Mobile Branch"}).page(null, {pager: "named"});
           expect(page).to.be.deep.equal({
               "team": "cool cats and kittens",
               "title": "junior software engineer",
               "employee": "3712bb53-7386-4431-9c5c-036d93694456",
               "office": "mobile branch",
               "__edb_e__": "employees",
               "__edb_v__": "1"
           });
       });

       it("Should return the lastEvaluatedKey as an item with the entity's identifiers by default", async () => {
           const {client, queries} = makeClient({
               sk: '$employees_1',
               pk: '$taskapp#employee_3712bb53-7386-4431-9c5c-036d93694456',
               gsi1sk: '$workplaces#employees_1#team_cool cats and kittens#title_junior software engineer#employee_25e754f4-a4e5-496f-9c43-63de512cf460',
               gsi1pk: '$taskapp#office_mobile branch'
           });
           taskr._setClient(client);
           let [page, results] = await taskr.entities.employees.query.coworkers({office: "Mobile Branch"}).page();
           expect(page).to.be.deep.equal({
               "team": "cool cats and kittens",
               "title": "junior software engineer",
               "employee": "3712bb53-7386-4431-9c5c-036d93694456",
               "office": "mobile branch",
               "__edb_e__": "employees",
               "__edb_v__": "1"
           });
       });

       it("Should return the lastEvaluatedKey as just an item", async () => {
           const {client, queries} = makeClient({
               sk: '$employees_1',
               pk: '$taskapp#employee_3712bb53-7386-4431-9c5c-036d93694456',
               gsi1sk: '$workplaces#employees_1#team_cool cats and kittens#title_junior software engineer#employee_25e754f4-a4e5-496f-9c43-63de512cf460',
               gsi1pk: '$taskapp#office_mobile branch'
           });
           taskr._setClient(client);
           let [page, results] = await taskr.entities.employees.query.coworkers({office: "Mobile Branch"}).page(null, {pager: "item"});
           expect(page).to.be.deep.equal({
               "team": "cool cats and kittens",
               "title": "junior software engineer",
               "employee": "3712bb53-7386-4431-9c5c-036d93694456",
               "office": "mobile branch",
           });
       });

       it("Should reformat a raw pager correctly back into a ExclusiveStartKey", async () => {
           const {client, queries} = makeClient();
           taskr._setClient(client);
           const pager = {
               sk: '$employees_1',
               pk: '$taskapp#employee_3712bb53-7386-4431-9c5c-036d93694456',
               gsi1sk: '$workplaces#employees_1#team_cool cats and kittens#title_junior software engineer#employee_25e754f4-a4e5-496f-9c43-63de512cf460',
               gsi1pk: '$taskapp#office_mobile branch'
           };
           await taskr.entities.employees.query.coworkers({office: "Mobile Branch"}).page(pager, {pager: "raw"});
           expect(queries).to.be.an("array").with.length(1);
           expect(queries[0].ExclusiveStartKey).to.be.deep.equal({
               sk: '$employees_1',
               pk: '$taskapp#employee_3712bb53-7386-4431-9c5c-036d93694456',
               gsi1sk: '$workplaces#employees_1#team_cool cats and kittens#title_junior software engineer#employee_25e754f4-a4e5-496f-9c43-63de512cf460',
               gsi1pk: '$taskapp#office_mobile branch'
           });
       });

       it("Should reformat a named pager correctly back into a ExclusiveStartKey", async () => {
           const {client, queries} = makeClient();
           taskr._setClient(client);
           const pager = {
               "team": "marketing",
               "title": "software engineer i",
               "employee": "3712bb53-7386-4431-9c5c-036d93694456",
               "office": "mobile branch",
               "__edb_e__": "employees",
               "__edb_v__": "1"
           };
           await taskr.entities.employees.query.coworkers({office: "Mobile Branch"}).page(pager, {pager: "named"});
           expect(queries).to.be.an("array").with.length(1);
           expect(queries[0].ExclusiveStartKey).to.be.deep.equal({
               sk: '$employees_1',
               pk: '$taskapp#employee_3712bb53-7386-4431-9c5c-036d93694456',
               gsi1sk: '$workplaces#employees_1#team_marketing#title_software engineer i#employee_3712bb53-7386-4431-9c5c-036d93694456',
               gsi1pk: '$taskapp#office_mobile branch'
           });
       });

       it("Should reformat a item pager correctly back into a ExclusiveStartKey", async () => {
           const {client, queries} = makeClient({
               sk: '$employees_1',
               pk: '$taskapp#employee_3712bb53-7386-4431-9c5c-036d93694456',
               gsi1sk: '$workplaces#employees_1#team_cool cats and kittens#title_junior software engineer#employee_25e754f4-a4e5-496f-9c43-63de512cf460',
               gsi1pk: '$taskapp#office_mobile branch'
           });
           taskr._setClient(client);
           const pager = {
               "team": "marketing",
               "title": "software engineer i",
               "employee": "3712bb53-7386-4431-9c5c-036d93694456",
               "office": "mobile branch",
           };
           await taskr.entities.employees.query.coworkers({office: "Mobile Branch"}).page(pager, {pager: "item"});
           expect(queries).to.be.an("array").with.length(1);
           expect(queries[0].ExclusiveStartKey).to.be.deep.equal({
               sk: '$employees_1',
               pk: '$taskapp#employee_3712bb53-7386-4431-9c5c-036d93694456',
               gsi1sk: '$workplaces#employees_1#team_marketing#title_software engineer i#employee_3712bb53-7386-4431-9c5c-036d93694456',
               gsi1pk: '$taskapp#office_mobile branch'
           });
       });

       it("An Entity's identifiers should be used when utilizing a ExclusiveStartKey or parsing a LastEvaluatedSortKey", async () => {
           try {
               const {client, queries} = makeClient();
               taskr._setClient(client);
               taskr.entities.employees.setIdentifier("entity", "__e");
               taskr.entities.employees.setIdentifier("version", "__v");
               let [page] = await taskr.entities.employees.query.coworkers({office: "Mobile Branch"}).page(null, {pager: "named"});
               expect(page).to.be.deep.equal({
                   "team": "marketing",
                   "title": "software engineer i",
                   "employee": "3712bb53-7386-4431-9c5c-036d93694456",
                   "office": "mobile branch",
                   "__e": "employees",
                   "__v": "1"
               });
               await taskr.entities.employees.query.coworkers({office: "Mobile Branch"}).page(page, {pager: "named"});
               expect(queries).to.be.an("array").with.length(2);
               expect(queries[1].ExclusiveStartKey).to.be.deep.equal({
                   sk: '$employees_1',
                   pk: '$taskapp#employee_3712bb53-7386-4431-9c5c-036d93694456',
                   gsi1sk: "$workplaces#employees_1#team_marketing#title_software engineer i#employee_3712bb53-7386-4431-9c5c-036d93694456",
                   gsi1pk: '$taskapp#office_mobile branch'
               });
           } catch(err) {
               // reset the entity
               taskr.entities.employees.setIdentifier("entity", "__edb_e__");
               taskr.entities.employees.setIdentifier("version", "__edb_v__");
               throw err;
           }
           taskr.entities.employees.setIdentifier("entity", "__edb_e__");
           taskr.entities.employees.setIdentifier("version", "__edb_v__");
       });
   });

   describe("Last Evaluated Key Parsing", () => {
       const {client} = makeClient({
           pk: '$testing#attr2_32#attr3_true',
           sk: '$mixedtype#test_1#attr1_abc#attr4_1.1',
       });
       const entity = new Entity({
           model: {
               entity: "test",
               service: "testing",
               version: "1"
           },
           attributes: {
               attr1: {
                   type: "string"
               },
               attr2: {
                   type: "number"
               },
               attr3: {
                   type: "boolean"
               },
               attr4: {
                   type: "number"
               }
           },
           indexes: {
               record: {
                   collection: "mixedtype",
                   pk: {
                       field: "pk",
                       facets: ["attr2", "attr3"]
                   },
                   sk: {
                       field: "sk",
                       facets: ["attr1", "attr4"]
                   }
               }
           }
       }, {table: "testing", client});

       const service = new Service({entity});
       it("Should parse the individual pager composite attributes into their original type", async () => {
           let [next] = await entity.query
               .record({attr2: 13, attr3: true})
               .page();
           expect(next).to.deep.equal({
               attr1: 'abc',
               attr2: 32,
               attr3: true,
               attr4: 1.1,
               __edb_e__: 'test',
               __edb_v__: '1'
           });
       });
       it("Should parse the individual pager composite attributes into their original type", async () => {
           let [next] = await service.collections
               .mixedtype({attr2: 32, attr3: true})
               .page()
           expect(next).to.deep.equal({
               attr1: 'abc',
               attr2: 32,
               attr3: true,
               attr4: 1.1,
               __edb_e__: 'test',
               __edb_v__: '1'
           });
       });
   });
   describe("Identical item pagers", () => {
       const {client, queries} = makeClient({
           pk: '$testing#attr1_abc',
           sk: '$mixedtype#test_1#attr2_def',
       });
       const entity1 = new Entity({
           model: {
               entity: "test",
               service: "testing",
               version: "1"
           },
           attributes: {
               attr1: {
                   type: "string"
               },
               attr2: {
                   type: "string"
               },
           },
           indexes: {
               record: {
                   collection: "mixedtype",
                   pk: {
                       field: "pk",
                       facets: ["attr1"]
                   },
                   sk: {
                       field: "sk",
                       facets: ["attr2"]
                   }
               }
           }
       }, {table: "testing", client});
       const entity2 = new Entity({
           model: {
               entity: "test",
               service: "testing",
               version: "2"
           },
           attributes: {
               attr1: {
                   type: "string"
               },
               attr2: {
                   type: "string"
               },
           },
           indexes: {
               record: {
                   collection: "mixedtype",
                   pk: {
                       field: "pk",
                       facets: ["attr1"]
                   },
                   sk: {
                       field: "sk",
                       facets: ["attr2"]
                   }
               }
           }
       }, {table: "testing", client});
       const service = new Service({entity1, entity2});

       it("Should is allow an ambiguous 'item' pager", async() => {
          let results = await service.collections
              .mixedtype({attr1: "abc", attr2: "def"})
              .page({attr1: "ghi", attr2: "jkl"}, {pager: "item"})
              .then(() => ({success: true}))
              .catch(err => ({success: false, err}))
           expect(results.success).to.be.false;
           expect(results.err.message).to.equal("Supplied Pager did not resolve to single Entity - For more detail on this error reference: https://github.com/tywalch/electrodb#pager-not-unique");
       });
   })
});