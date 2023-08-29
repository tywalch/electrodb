/* istanbul ignore file */
import tableDefinition from './definition.json';
import { dynamodb } from './client';

export const table = 'electro';

type CreateTableManagerOptions = {
    tableName: string;
}

export function createTableManager(options: CreateTableManagerOptions) {
    const { tableName } = options;
    return {
        async exists() {
            let tables = await dynamodb.listTables().promise();
            return !!tables.TableNames?.includes(tableName);
        },
        async drop() {
            return dynamodb.deleteTable({TableName: tableName}).promise();
        },
        async create() {
            return dynamodb.createTable({...tableDefinition, TableName: tableName}).promise();
        }
    }
}

type InitializeTableOptions = {
    tableName: string;
}

export async function initializeTable(options: InitializeTableOptions) {
    const { tableName } = options;
    const tableManager = createTableManager({tableName});
    const exists = await tableManager.exists();
    if (exists) {
        return;
    }
    await tableManager.create();
}