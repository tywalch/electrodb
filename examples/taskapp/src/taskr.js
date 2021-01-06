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
const taskr = new Service("taskapp", { client, table });

/**
 * Join in the Employees, Tasks, and Offices models
 **/

taskr
  .join(employees)
  .join(tasks)
  .join(offices);

/**
 * Made typedef file using `electrocli`
 */
module.exports = taskr;
