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
    {
      AttributeName: "gsi1pk",
      AttributeType: "S",
    },
    {
      AttributeName: "gsi1sk",
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
    {
      IndexName: "gsi2pk-gsi2sk-index",
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
