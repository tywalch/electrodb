process.env.AWS_NODEJS_CONNECTION_REUSE_ENABLED = 1;
const { Service } = require("../../");
const DynamoDB = require("aws-sdk/clients/dynamodb");
const {EmployeesModel, TasksModel, OfficesModel} = require("./models");

/**
 * It is recomended that you use the dynamodb-local docker image for this example. For more
 * information on how to download visit: https://hub.docker.com/r/amazon/dynamodb-local
 *
 * If you intend on running this example against your own aws account, modify the config
 * to match your account. This includes *removing* the `endpoint` property, which is used
 * when connecting to the local docker dynamo instance described above.
 **/
const client = new DynamoDB.DocumentClient({endpoint: "http://localhost:8000", region: "us-east-1"});
const table = "electro";

/**
 * Create a new Service instance
 **/
const EmployeeApp = new Service("EmployeeApp", { client, table });

/**
 * Join in the Employees, Tasks, and Offices models
 **/
EmployeeApp
  .join(EmployeesModel)
  .join(TasksModel)
  .join(OfficesModel);

/**
 * Made typedef file using `electrocli`
 */
module.exports = EmployeeApp;
