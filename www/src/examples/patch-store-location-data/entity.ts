import { Entity } from "electrodb";
import { tableName } from "./table";

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
      unitId: {
        type: "string",
        required: true,
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
      leaseEndDate: {
        type: "string",
        required: true,
      },
      rent: {
        type: "string",
        required: true,
        validate: /^(\d+\.\d{2})$/,
      },
      discount: {
        type: "string",
        required: false,
        default: "0.00",
        validate: /^(\d+\.\d{2})$/,
      },
      tenants: {
        type: "set",
        items: "string",
      },
      warnings: {
        type: "number",
        default: 0,
      },
      deposit: {
        type: "number",
      },
      contact: {
        type: "set",
        items: "string",
      },
      rentalAgreement: {
        type: "list",
        items: {
          type: "map",
          properties: {
            type: {
              type: "string",
            },
            detail: {
              type: "string",
            },
          },
        },
      },
      petFee: {
        type: "number",
      },
      fees: {
        type: "number",
      },
      tags: {
        type: "set",
        items: "string",
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
      units: {
        index: "gsi1pk-gsi1sk-index",
        pk: {
          field: "gsi1pk",
          composite: ["mallId"],
        },
        sk: {
          field: "gsi1sk",
          composite: ["buildingId", "unitId"],
        },
      },
      leases: {
        index: "gsi2pk-gsi2sk-index",
        pk: {
          field: "gsi2pk",
          composite: ["storeId"],
        },
        sk: {
          field: "gsi2sk",
          composite: ["leaseEndDate"],
        },
      },
    },
  },
  { table: tableName },
);
