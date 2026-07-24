export const tableName = "your_table_name";

export const tableDefinition = {
  TableName: tableName,
  KeySchema: [
    {
      AttributeName: "accountId",
      KeyType: "HASH",
    },
    {
      AttributeName: "organizationId",
      KeyType: "RANGE",
    },
  ],
  AttributeDefinitions: [
    {
      AttributeName: "accountId",
      AttributeType: "S",
    },
    {
      AttributeName: "organizationId",
      AttributeType: "S",
    },
  ],
  BillingMode: "PAY_PER_REQUEST",
};
