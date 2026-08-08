import { Entity } from "electrodb";
import { tableName } from "./table";

export const InventoryItem = new Entity(
  {
    model: {
      entity: "inventoryitem",
      version: "1",
      service: "warehouse",
    },
    attributes: {
      id: {
        type: "string",
        required: true,
      },
      country: {
        type: "string",
        field: "attr1",
        required: true,
      },
      region: {
        type: "string",
        field: "attr2",
        required: true,
      },
      city: {
        type: "string",
        field: "attr3",
        required: true,
      },
      manufacturer: {
        type: "string",
        field: "attr4",
      },
      model: {
        type: "string",
        field: "attr5",
      },
      count: {
        type: "number",
        field: "attr6",
      },
      name: {
        type: "string",
        field: "attr7",
      },
    },
    indexes: {
      // The main table index still uses traditional pk/sk fields
      record: {
        pk: {
          field: "pk",
          composite: ["manufacturer"],
        },
        sk: {
          field: "sk",
          composite: ["model", "id"],
        },
      },
      // A multi-attribute GSI — note: no 'field' on pk or sk
      location: {
        index: "gsi1",
        type: "composite",
        pk: {
          composite: ["country", "region", "city"],
        },
        sk: {
          composite: ["manufacturer", "model", "count"],
        },
      },
    },
  },
  { table: tableName },
);
