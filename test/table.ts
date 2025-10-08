import type { DynamoDB } from "aws-sdk";

export interface TableManager {
  exists(): Promise<boolean>;
  drop(): Promise<void>;
  create(definition: DynamoDB.CreateTableInput): Promise<void>;
}

export function createTableManager(dynamodb: DynamoDB, table: string): TableManager {
  return {
    async exists() {
      let tables = await dynamodb.listTables().promise();
      return (tables.TableNames || []).includes(table);
    },
    async drop() {
      await dynamodb.deleteTable({ TableName: table }).promise();
    },
    async create(definition: DynamoDB.CreateTableInput) {
      await dynamodb
        .createTable({ ...definition, TableName: table })
        .promise();
    },
  };
}

export async function putTable(dynamodb: DynamoDB, definition: DynamoDB.CreateTableInput) {
  const table = createTableManager(dynamodb, definition.TableName);
  if (await table.exists()) {
    await table.drop();
  }
  return await table.create(definition);
}