import DynamoDB, {
  LocalSecondaryIndex,
  GlobalSecondaryIndex,
  CreateTableInput,
  ScalarAttributeType,
  KeySchema,
  GlobalSecondaryIndexList,
  LocalSecondaryIndexList,
  AttributeDefinitions,
} from "aws-sdk/clients/dynamodb";
import { NonSpecificSchema, getTableDetails, AttributeType } from "./util";
import { initializeTable } from "../common";
function toScalarAttributeType(type: AttributeType): ScalarAttributeType {
  switch (type) {
    case "string":
      return "S";
    case "number":
      return "N";
    case "binary":
      return "BOOL";
  }
}

export type MakeCreateTableInputOptions = {
  schema: NonSpecificSchema;
  tableName: string;
  overrides?: Partial<CreateTableInput>;
};

export function makeCreateTableInput(
  options: MakeCreateTableInputOptions,
): CreateTableInput {
  const { tableName, tableIndex, secondaryIndexes } = getTableDetails(options);

  const keySchema: KeySchema = [];
  const attributeDefinitions: AttributeDefinitions = [];
  const globalSecondaryIndexes: GlobalSecondaryIndexList = [];
  const localSecondaryIndexes: LocalSecondaryIndexList = [];

  keySchema.push({
    AttributeName: tableIndex.partitionKey.field,
    KeyType: "HASH",
  });

  attributeDefinitions.push({
    AttributeName: tableIndex.partitionKey.field,
    AttributeType: toScalarAttributeType(tableIndex.partitionKey.type),
  });

  if (tableIndex.sortKey) {
    keySchema.push({
      AttributeName: tableIndex.sortKey.field,
      KeyType: "RANGE",
    });

    attributeDefinitions.push({
      AttributeName: tableIndex.sortKey.field,
      AttributeType: toScalarAttributeType(tableIndex.sortKey.type),
    });
  }

  for (const secondaryIndex of secondaryIndexes) {
    if (secondaryIndex.type === "GlobalSecondaryIndex") {
      const definition: GlobalSecondaryIndex = {
        IndexName: secondaryIndex.indexName,
        KeySchema: [
          {
            AttributeName: secondaryIndex.partitionKey.field,
            KeyType: "HASH",
          },
        ],
        Projection: {
          ProjectionType: secondaryIndex.keysOnly ? "KEYS_ONLY" : "ALL",
        },
      };

      attributeDefinitions.push({
        AttributeName: secondaryIndex.partitionKey.field,
        AttributeType: toScalarAttributeType(secondaryIndex.partitionKey.type),
      });

      if (secondaryIndex.sortKey) {
        definition.KeySchema.push({
          AttributeName: secondaryIndex.sortKey.field,
          KeyType: "RANGE",
        });

        attributeDefinitions.push({
          AttributeName: secondaryIndex.sortKey.field,
          AttributeType: toScalarAttributeType(secondaryIndex.sortKey.type),
        });
      }

      globalSecondaryIndexes.push(definition);
    } else if (secondaryIndex.type === "LocalSecondaryIndex") {
      const definition: LocalSecondaryIndex = {
        IndexName: secondaryIndex.indexName,
        KeySchema: [
          {
            AttributeName: tableIndex.partitionKey.field,
            KeyType: "HASH",
          },
          {
            AttributeName: secondaryIndex.sortKey.field,
            KeyType: "RANGE",
          },
        ],
        Projection: {
          ProjectionType: secondaryIndex.keysOnly ? "KEYS_ONLY" : "ALL",
        },
      };

      attributeDefinitions.push({
        AttributeName: secondaryIndex.sortKey.field,
        AttributeType: toScalarAttributeType(secondaryIndex.sortKey.type),
      });

      localSecondaryIndexes.push(definition);
    }
  }

  const definition: CreateTableInput = {
    TableName: tableName,
    KeySchema: keySchema,
    AttributeDefinitions: attributeDefinitions,
    LocalSecondaryIndexes: localSecondaryIndexes,
    GlobalSecondaryIndexes: globalSecondaryIndexes,
    BillingMode: "PAY_PER_REQUEST",
    ...options.overrides,
  };

  if (definition.GlobalSecondaryIndexes?.length === 0) {
    delete definition.GlobalSecondaryIndexes;
  }

  if (definition.LocalSecondaryIndexes?.length === 0) {
    delete definition.LocalSecondaryIndexes;
  }

  return definition;
}

export type CreateTableOptions = {
  tableName: string;
  dynamodb: DynamoDB;
  dropOnExists: boolean;
  schema: NonSpecificSchema;
  overrides?: Partial<CreateTableInput>;
};

export async function createTable(options: CreateTableOptions) {
  const { dynamodb } = options;
  const definition = makeCreateTableInput(options);
  await initializeTable({ dynamodb, definition, dropOnExists: false });
}
