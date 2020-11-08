const makeTable = require("../examples/taskapp/table.js");
const region = "us-east-1";
const endpoint = process.env.LOCAL_DYNAMO_ENDPOINT;
if (endpoint !== undefined) {
  let tablr = makeTable("electro", {region, endpoint});
  if (!tablr.exists()) {
    tablr.create().then(console.log).catch(err => {
      console.log(err);
      process.exit(1);
    })
  }
}
