import { Schema, KeyCastOption } from "../../";

export type NonSpecificSchema = Schema<string, string, string>;
export type NonSpecificEntityIndex = NonSpecificSchema["indexes"][string];

export type IndexKeyType = KeyCastOption;

type IndexKey = {
  field: string;
  type: IndexKeyType;
};

function toIndexKeyType(cast?: IndexKeyType) {
  if (cast === "number") {
    return "number";
  }

  return "string";
}

function toSortKey(
  indexDefinition: NonSpecificEntityIndex["sk"],
): IndexKey | undefined {
  if (indexDefinition === undefined) {
    return undefined;
  }

  return {
    field: indexDefinition.field,
    type: toIndexKeyType(indexDefinition.cast),
  };
}

function toPartitionKey(
  indexDefinition: NonSpecificEntityIndex["pk"],
): IndexKey {
  return {
    field: indexDefinition.field,
    type: toIndexKeyType(indexDefinition.cast),
  };
}

export type TableIndexDefinition = {
  type: "TableIndex";
  partitionKey: IndexKey;
  sortKey?: IndexKey;
};

export type GlobalSecondaryIndexDefinition = {
  type: "GlobalSecondaryIndex";
  indexName: string;
  projection: "all" | "keys_only" | string[];
  partitionKey: IndexKey;
  sortKey?: IndexKey;
};

export type LocalSecondaryIndexDefinition = {
  type: "LocalSecondaryIndex";
  indexName: string;
  projection: "all" | "keys_only" | string[];
  sortKey: IndexKey;
};

export type IndexDefinition =
  | TableIndexDefinition
  | LocalSecondaryIndexDefinition
  | GlobalSecondaryIndexDefinition;

type SecondaryIndexDefinition =
  | LocalSecondaryIndexDefinition
  | GlobalSecondaryIndexDefinition;

export function getTableIndexName(schema: NonSpecificSchema): string {
  let tableIndexName: string | null = null;
  for (let accessPattern in schema.indexes) {
    const indexDefinition = schema.indexes[accessPattern];
    if (indexDefinition.index === undefined) {
      tableIndexName = accessPattern;
      break;
    }
  }

  if (tableIndexName === null) {
    throw new Error("No table index found");
  }

  return tableIndexName;
}

export function createTableIndexDefinition(
  indexDefinition: NonSpecificEntityIndex,
): TableIndexDefinition {
  return {
    type: "TableIndex",
    sortKey: toSortKey(indexDefinition.sk),
    partitionKey: toPartitionKey(indexDefinition.pk),
  };
}

export function createSecondaryIndexDefinition(
  indexDefinition: NonSpecificEntityIndex,
): SecondaryIndexDefinition {
  return {
    type: "GlobalSecondaryIndex",
    indexName: indexDefinition.index!,
    sortKey: toSortKey(indexDefinition.sk),
    partitionKey: toPartitionKey(indexDefinition.pk),
    projection:
      typeof indexDefinition.project === "object"
        ? [...indexDefinition.project, "__edb_e__", "__edb_v__"]
        : indexDefinition.project ?? "all",
  };
}

export function createLocalSecondaryIndexDefinition(
  indexDefinition: NonSpecificEntityIndex,
): LocalSecondaryIndexDefinition {
  const sortKey = toSortKey(indexDefinition.sk);
  if (!sortKey) {
    throw new Error("Local secondary indexes must have a sort key");
  }
  return {
    sortKey,
    type: "LocalSecondaryIndex",
    indexName: indexDefinition.index!,
    projection:
      typeof indexDefinition.project === "object"
        ? [...indexDefinition.project, "__edb_e__", "__edb_v__"]
        : indexDefinition.project ?? "all",
  };
}

export function getIndexes(schema: NonSpecificSchema): IndexDefinition[] {
  const indexes: IndexDefinition[] = [];
  const tableIndexName = getTableIndexName(schema);
  for (const accessPattern in schema.indexes) {
    const indexDefinition = schema.indexes[accessPattern];
    if (
      indexDefinition.index === undefined &&
      accessPattern === tableIndexName
    ) {
      indexes.push(createTableIndexDefinition(indexDefinition));
    } else if (accessPattern === tableIndexName) {
      indexes.push(createLocalSecondaryIndexDefinition(indexDefinition));
    } else {
      indexes.push(createSecondaryIndexDefinition(indexDefinition));
    }
  }
  return indexes;
}

export function getTableIndex(indexDefinitions: IndexDefinition[]) {
  for (const tableDefinition of indexDefinitions) {
    if (tableDefinition.type === "TableIndex") {
      return tableDefinition;
    }
  }

  throw new Error("No table index found");
}

const attributeTypes = ["string", "number", "binary"] as const;

export type AttributeType = (typeof attributeTypes)[number];

export type AttributeDefinitions = Record<string, AttributeType>;
export function isAttributeType(type: any): type is AttributeType {
  return attributeTypes.includes(type as any);
}

export type TableDetails = {
  tableName: string;
  tableIndex: TableIndexDefinition;
  secondaryIndexes: SecondaryIndexDefinition[];
};

type GetTableDetailsOptions = {
  schema: NonSpecificSchema;
  tableName: string;
};

export function getTableDetails(options: GetTableDetailsOptions): TableDetails {
  const { schema, tableName } = options;
  const indexDefinitions = getIndexes(schema);
  const tableIndex = getTableIndex(indexDefinitions);
  const secondaryIndexes: SecondaryIndexDefinition[] = [];
  for (const indexDefinition of indexDefinitions) {
    if (indexDefinition.type !== "TableIndex") {
      secondaryIndexes.push(indexDefinition);
    }
  }

  return {
    tableName,
    tableIndex,
    secondaryIndexes,
  };
}
