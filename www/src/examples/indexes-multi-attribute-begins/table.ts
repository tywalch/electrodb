export const tableName = "your_table_name";

export const tableDefinition = {
  TableName: tableName,
  KeySchema: [
    { AttributeName: "pk", KeyType: "HASH" },
    { AttributeName: "sk", KeyType: "RANGE" },
  ],
  AttributeDefinitions: [
    { AttributeName: "pk", AttributeType: "S" },
    { AttributeName: "sk", AttributeType: "S" },
    { AttributeName: "attr1", AttributeType: "S" },
    { AttributeName: "attr2", AttributeType: "S" },
    { AttributeName: "attr3", AttributeType: "S" },
    { AttributeName: "attr4", AttributeType: "S" },
    { AttributeName: "attr5", AttributeType: "S" },
    { AttributeName: "attr6", AttributeType: "N" },
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: "gsi1",
      KeySchema: [
        { AttributeName: "attr1", KeyType: "HASH" },
        { AttributeName: "attr2", KeyType: "HASH" },
        { AttributeName: "attr3", KeyType: "RANGE" },
        { AttributeName: "attr4", KeyType: "RANGE" },
        { AttributeName: "attr5", KeyType: "RANGE" },
        { AttributeName: "attr6", KeyType: "RANGE" },
      ],
      Projection: { ProjectionType: "ALL" },
    },
  ],
  BillingMode: "PAY_PER_REQUEST",
};
