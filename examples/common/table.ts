/* istanbul ignore file */
import createTableDefinition from "./definition.json";
import { DynamoDB, CreateTableInput } from "./client";

export const table = "electro";

export const tableDefinition = {
  TableName: table,
  ...createTableDefinition,
};

type CreateTableManagerOptions = {
  dynamodb: DynamoDB;
  definition: CreateTableInput;
};

export function createTableManager(options: CreateTableManagerOptions) {
  const { dynamodb, definition } = options;
  const { TableName } = definition;
  return {
    async exists() {
      let tables = await dynamodb.listTables().promise();
      return !!tables.TableNames?.includes(TableName);
    },
    async drop() {
      return dynamodb.deleteTable({ TableName }).promise();
    },
    async create() {
      return dynamodb.createTable(definition).promise();
    },
  };
}

type InitializeTableOptions = {
  dynamodb: DynamoDB;
  dropOnExists: boolean;
  definition: CreateTableInput;
};

export async function initializeTable(options: InitializeTableOptions) {
  const { definition, dynamodb, dropOnExists } = options;
  const tableManager = createTableManager({ definition, dynamodb });
  const exists = await tableManager.exists();
  if (exists) {
    if (!dropOnExists) {
      return;
    }
    await tableManager.drop();
  }

  await tableManager.create();
}
