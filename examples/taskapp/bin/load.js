#!/usr/bin/env node
const path = require("path");
const taskr = require("../src/taskr");
const Loader = require("../lib/loader");

const loader = new Loader(taskr);
const stdin = process.openStdin();
const config = {employees: 500, tasks: 600};
const isLocalEndpoint = taskr.client.service.endpoint.hostname === "localhost";
const table = taskr.config.table;

if (isLocalEndpoint) {
  process.stdout.write(`Your configuration is pointed to a local instance of dynamodb. This operation will create a table named '${table}' and then load ${config.employees} Employees and ${config.tasks} Tasks records. Are you sure you want to proceed? y/N`);
} else {
  process.stdout.write(`Your configuration is not pointed to a local instance of dynamodb. This operation will create a table named '${table}' and then load ${config.employees} Employees and ${config.tasks} Tasks records. Are you sure you want to proceed? y/N`);
}

stdin.setRawMode(true);
stdin.resume();
stdin.setEncoding('utf8');

stdin.on('data', async function (choice) {
  try {
    console.log("");
    if (choice.toLowerCase() === 'y') {
      console.log("Creating table...");
      await loader.makeTable();
      console.log("Loading table...");
      await loader.loadTable(config);
      console.log(`Loaded ${config.employees} Employees and ${config.tasks} Tasks into the table '${table}'`);
      process.exit(0);
    } else if (choice === "\x03") {
      process.exit(1);
    } else {
      console.log(`Canceling load operation. If you would like to change the dynamodb client configuration you can modify the the file '${path.resolve(__dirname, "../src/client/index.js")}'`);
      process.exit(1);
    }
  } catch(err) {
    console.error(err);
    process.exit(1);
  }
});