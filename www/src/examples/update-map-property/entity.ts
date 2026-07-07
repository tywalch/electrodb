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
      mapAttribute: {
        type: "map",
        properties: {
          mapProperty: {
            type: "string",
          },
        },
      },
      listAttribute: {
        type: "list",
        items: {
          type: "map",
          properties: {
            setAttribute: {
              type: "set",
              items: "string",
            },
          },
        },
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
