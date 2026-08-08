import { Entity } from "electrodb";
import { tableName } from "./table";

// This entity models data that already exists in DynamoDB and was not
// originally created by ElectroDB. Use the `ignoreOwnership` execution
// option (shown in example.ts) so ElectroDB does not filter out records
// that lack its own entity/version metadata.
export const StoreLocations = new Entity(
  {
    model: {
      service: "MallStoreDirectory",
      entity: "MallStore",
      version: "1",
    },
    attributes: {
      cityId: {
        type: "string",
        required: true,
      },
      mallId: {
        type: "string",
        required: true,
      },
      storeId: {
        type: "string",
        required: true,
      },
      buildingId: {
        type: "string",
        required: true,
      },
      rent: {
        type: "string",
        required: true,
      },
    },
    indexes: {
      stores: {
        pk: {
          field: "pk",
          composite: ["cityId", "mallId"],
        },
        sk: {
          field: "sk",
          composite: ["buildingId", "storeId"],
        },
      },
    },
  },
  { table: tableName },
);
