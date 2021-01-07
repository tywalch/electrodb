/* istanbul ignore file */
const DynamoDB = require("aws-sdk/clients/dynamodb");

module.exports = (TableName, awsConfig = {}) => {
  let dynamo = new DynamoDB(awsConfig);
  return {
    exists: async () => {
      let tables = await dynamo.listTables().promise();
      return tables.TableNames.includes(TableName);
    },
    drop: async () => dynamo.deleteTable({TableName}).promise(),
    create: async (definition) => dynamo.createTable({...definition, TableName}).promise()
  }
}