export const tableName = "YOUR_TABLE_NAME";

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
    {
      AttributeName: "gsi1pk",
      AttributeType: "S",
    },
    {
      AttributeName: "gsi1sk",
      AttributeType: "S",
    },
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: "my-gsi",
      KeySchema: [
        {
          AttributeName: "gsi1pk",
          KeyType: "HASH",
        },
        {
          AttributeName: "gsi1sk",
          KeyType: "RANGE",
        },
      ],
      Projection: {
        ProjectionType: "ALL",
      },
    },
  ],
  BillingMode: "PAY_PER_REQUEST",
};
