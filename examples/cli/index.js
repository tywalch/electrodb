const DynamoDB = require("aws-sdk/clients/dynamodb");
const {Service} = require("../../");
const {EmployeesModel, TasksModel, OfficesModel} = require("../taskapp/models");
const cli = require("./cli");
const client = new DynamoDB.DocumentClient({region: "us-east-1", endpoint: "http://localhost:8000"});

/**
 * This example shows how you might use electrodb to build other
 * useful applications. In this example, ElectroDB is used with
 * Commander to create a simple cli application that can query
 * your models.
 *
 * The CLI makes use of the Taskr example, and will use
 * data that was loaded via that code. If you havent already,
 * use that example first to load data for use in this example.
**/
const taskr = new Service("taskapp", {table: "electro", client});

taskr
  .join(EmployeesModel)
  .join(TasksModel)
  .join(OfficesModel);

cli(taskr);
