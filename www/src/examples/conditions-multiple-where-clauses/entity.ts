import { Entity } from "electrodb";
import { tableName } from "./table";

export const model = {
  model: {
    service: "MallStoreDirectory",
    entity: "MallStore",
    version: "1",
  },
  attributes: {
    mallId: {
      type: "string",
      required: true,
    },
    storeId: {
      type: "string",
      required: true,
    },
    leaseEndDate: {
      type: "string",
      required: true,
    },
    rent: {
      type: "string",
      required: true,
    },
    discount: {
      type: "string",
      required: false,
      default: "0.00",
    },
    category: {
      type: [
        "spite store",
        "food/coffee",
        "food/meal",
        "clothing",
        "electronics",
        "department",
        "misc",
      ],
      required: true,
    },
  },
  indexes: {
    stores: {
      pk: {
        field: "pk",
        composite: ["mallId"],
      },
      sk: {
        field: "sk",
        composite: ["storeId"],
      },
    },
    leases: {
      index: "idx2",
      pk: {
        field: "idx2pk",
        composite: ["mallId"],
      },
      sk: {
        field: "idx2sk",
        composite: ["leaseEndDate", "storeId"],
      },
    },
  },
} as const;

export const MallStores = new Entity(model, { table: tableName });
