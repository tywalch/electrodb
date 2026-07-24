export const tableName = "your_table_name";

export const tableDefinition = {
  TableName: tableName,
  KeySchema: [
    {
      AttributeName: "pk",
      KeyType: "HASH",
    },
    {
      AttributeName: "sk",
      KeyType: "RANGE",
    },
  ],
  AttributeDefinitions: [
    {
      AttributeName: "pk",
      AttributeType: "S",
    },
    {
      AttributeName: "sk",
      AttributeType: "S",
    },
  ],
  BillingMode: "PAY_PER_REQUEST",
};
