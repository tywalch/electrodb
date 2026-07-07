export const tableName = "zoo_manifest";

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
      IndexName: "gsi1pk-gsi1sk-index",
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
