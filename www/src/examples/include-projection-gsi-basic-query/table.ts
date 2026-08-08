export const tableName = "electro";

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
        ProjectionType: "INCLUDE",
        NonKeyAttributes: ["name", "status", "createdAt", "__edb_e__", "__edb_v__"],
      },
    },
  ],
  BillingMode: "PAY_PER_REQUEST",
};
