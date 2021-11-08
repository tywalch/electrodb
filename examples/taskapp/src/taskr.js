process.env.AWS_NODEJS_CONNECTION_REUSE_ENABLED = 1;
const { Service } = require("../../..");
const client = require("../lib/client");
const tasks = require("../lib/models/tasks");
const offices = require("../lib/models/offices");
const employees = require("../lib/models/employees");

const table = "electro";

/**
 * Create a new Service instance
 **/
const taskr = new Service({employees, tasks, offices}, { client, table });

module.exports = taskr;
