/* istanbul ignore file */
const makeTable = require("../examples/taskapp/lib/table");
const definition = require("../examples/taskapp/lib/table/definition.json");
const customKeys = require("./definitions/customkeys.json");
const noSortKeys = require("./definitions/nosortkey.json");
const noStringKeys = require("./definitions/nostringkeys.json");
const keyNamesAttributeNames = require("./definitions/keynamesattributenames.json");
const leadingUnderscoreKeys = require('./definitions/leadingunderscorekeys.json');
const localSecondaryIndexes = require('./definitions/localsecondaryindexes.json');

const endpoint = process.env.LOCAL_DYNAMO_ENDPOINT;
const region = "us-east-1";
if (endpoint) {
    console.log("TESTING LOCALLY!");
}
async function create(endpoint, region, table, definition) {
  try {
    if (endpoint !== undefined) {
      let tablr = makeTable(table, {region, endpoint});
      let exists = await tablr.exists();
      if (exists) {
        await tablr.drop();
      }
      await tablr.create(definition);
    }
  } catch(err) {
    console.log(err);
    process.exit(1);
  }
}
//
create(endpoint, region, "electro", definition);
create(endpoint, region, "electro_customkeys", customKeys);
create(endpoint, region, "electro_nosort", noSortKeys);
create(endpoint, region, "electro_nostringkeys", noStringKeys);
create(endpoint, region, "electro_keynamesattributenames", keyNamesAttributeNames);
create(endpoint, region, "electro_leadingunderscorekeys", leadingUnderscoreKeys);
create(endpoint, region, "electro_localsecondaryindex", localSecondaryIndexes);