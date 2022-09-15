#!/usr/bin/env node
/* istanbul ignore file */
const path = require("path");
const taskr = require("../src/taskr");
const Loader = require("../lib/loader");

const loader = new Loader(taskr);
const config = {employees: 500, tasks: 600};
const data = loader.loadTable(config);
console.log(JSON.stringify(data, null, 4));