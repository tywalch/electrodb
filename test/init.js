const makeTable = require("../examples/taskapp/table.js");
const region = "us-east-1";
const endpoint = process.env.LOCAL_DYNAMO_ENDPOINT;
if (endpoint !== undefined) {
  let tablr = makeTable("electro", {region, endpoint});
  tablr.exists().then(exists => {
    if (!exists) {
      console.log("Making Table");
      tablr.create().then(console.log).catch(err => {
        console.log(err);
        process.exit(1);
      })
    } else {
      console.log("Using Existing Table");
    }
  });
}
