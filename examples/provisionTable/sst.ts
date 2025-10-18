import {
  StackContext,
  Table,
  TableProps,
  TableGlobalIndexProps,
  TableLocalIndexProps,
} from "sst/constructs";
import { getTableDetails, NonSpecificSchema } from "./util";

export type ElectroDBTableProps = {
  schema: NonSpecificSchema;
  tableName: string;
  overrides?: Partial<TableProps>;
};

export function ElectroDbTable(
  context: StackContext,
  options: ElectroDBTableProps,
) {
  const { tableName, tableIndex, secondaryIndexes } = getTableDetails(options);

  const primaryIndex: TableProps["primaryIndex"] = {
    partitionKey: tableIndex.partitionKey.field,
  };

  const fields: TableProps["fields"] = {
    [tableIndex.partitionKey.field]: tableIndex.partitionKey.type,
  };

  if (tableIndex.sortKey) {
    fields[tableIndex.sortKey.field] = tableIndex.sortKey.type;
    primaryIndex.sortKey = tableIndex.sortKey.field;
  }

  const globalIndexes: Record<string, TableGlobalIndexProps> = {};
  const localIndexes: Record<string, TableLocalIndexProps> = {};
  for (const secondaryIndex of secondaryIndexes) {
    if (secondaryIndex.type === "GlobalSecondaryIndex") {
      fields[secondaryIndex.partitionKey.field] =
        secondaryIndex.partitionKey.type;

      if (secondaryIndex.sortKey) {
        fields[secondaryIndex.sortKey.field] = secondaryIndex.sortKey.type;
      }

      globalIndexes[secondaryIndex.indexName] = {
        partitionKey: secondaryIndex.partitionKey.field,
        sortKey: secondaryIndex.sortKey?.field,
        projection: secondaryIndex.projection,
      };
    } else if (secondaryIndex.type === "LocalSecondaryIndex") {
      fields[secondaryIndex.sortKey.field] = "string";

      localIndexes[secondaryIndex.indexName] = {
        sortKey: secondaryIndex.sortKey?.field,
        projection: secondaryIndex.projection,
      };
    }
  }

  // Create the table
  return new Table(context.stack, tableName, {
    fields,
    primaryIndex,
    localIndexes,
    globalIndexes,
    ...options.overrides,
  });
}
