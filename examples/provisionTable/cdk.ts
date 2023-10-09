import {
  AttributeType,
  TableProps,
  Table,
  ProjectionType,
} from "aws-cdk-lib/aws-dynamodb";
import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { getTableDetails, IndexKeyType, NonSpecificSchema } from "./util";

function toAttributeType(cast?: IndexKeyType) {
  if (cast === "number") {
    return AttributeType.NUMBER;
  }

  return AttributeType.STRING;
}

type ElectroDBStackProps = StackProps & {
  tableName: string;
  schema: NonSpecificSchema;
  overrides?: Partial<Omit<TableProps, "tableName">>;
};

export class ElectroDBStack extends Stack {
  constructor(scope: Construct, id: string, props: ElectroDBStackProps) {
    super(scope, id, props);

    const { tableIndex, tableName, secondaryIndexes } = getTableDetails(props);

    const table = new Table(this, tableName, {
      partitionKey: {
        name: tableIndex.partitionKey.field,
        type: toAttributeType(tableIndex.partitionKey.type),
      },
      sortKey: tableIndex.sortKey
        ? {
            name: tableIndex.sortKey.field,
            type: toAttributeType(tableIndex.sortKey.type),
          }
        : undefined,
      ...props.overrides,
    });

    for (let secondaryIndex of secondaryIndexes) {
      if (secondaryIndex.type === "GlobalSecondaryIndex") {
        table.addGlobalSecondaryIndex({
          indexName: secondaryIndex.indexName,
          partitionKey: {
            name: secondaryIndex.partitionKey.field,
            type: toAttributeType(secondaryIndex.partitionKey.type),
          },
          sortKey: secondaryIndex.sortKey
            ? {
                name: secondaryIndex.sortKey.field,
                type: toAttributeType(secondaryIndex.sortKey.type),
              }
            : undefined,
          projectionType: secondaryIndex.keysOnly
            ? ProjectionType.KEYS_ONLY
            : ProjectionType.ALL,
        });
      } else if (secondaryIndex.type === "LocalSecondaryIndex") {
        table.addLocalSecondaryIndex({
          indexName: secondaryIndex.indexName,
          sortKey: {
            name: secondaryIndex.sortKey.field,
            type: toAttributeType(secondaryIndex.sortKey.type),
          },
          projectionType: secondaryIndex.keysOnly
            ? ProjectionType.KEYS_ONLY
            : ProjectionType.ALL,
        });
      }
    }
  }
}
