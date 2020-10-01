process.env.AWS_NODEJS_CONNECTION_REUSE_ENABLED = 1;
const { Service } = require("../../");
const DynamoDB = require("aws-sdk/clients/dynamodb");
const {EmployeesModel, TasksModel, OfficesModel} = require("./models");

module.exports = (table = "electro", awsConfig = {}) => {
  const client = new DynamoDB.DocumentClient(awsConfig);
  const EmployeeApp = new Service({
    version: "1",
    service: "EmployeeApp",
    table,
  }, {client});
  
  EmployeeApp
    .join(EmployeesModel)
    .join(TasksModel)
    .join(OfficesModel);
  
    return EmployeeApp;
};