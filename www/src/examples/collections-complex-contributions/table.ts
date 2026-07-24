export const tableName = "projectmanagement";

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
      AttributeName: "gsi2pk",
      AttributeType: "S",
    },
    {
      AttributeName: "gsi2sk",
      AttributeType: "S",
    },
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: "gsi2",
      KeySchema: [
        {
          AttributeName: "gsi2pk",
          KeyType: "HASH",
        },
        {
          AttributeName: "gsi2sk",
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
