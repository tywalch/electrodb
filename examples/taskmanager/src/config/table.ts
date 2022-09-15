/* istanbul ignore file */
import tableDefinition from './definition.json';
import { dynamodb } from './client';

export const table = 'electro';

export function createTableManager() {
    return {
        async exists() {
            let tables = await dynamodb.listTables().promise();
            return !!tables.TableNames?.includes(table);
        },
        async drop() {
            return dynamodb.deleteTable({TableName: table}).promise();
        },
        async create() {
            return dynamodb.createTable({...tableDefinition, TableName: table}).promise();
        }
    }
}