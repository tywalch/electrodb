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
      },
      count: {
        type: "number",
        field: "attr5",
      },
      productName: {
        type: "string",
        field: "attr6",
      },
    },
    indexes: {
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
      location: {
        index: "gsi1",
        type: "composite",
        collection: "inventory",
        pk: {
          composite: ["country", "region"],
        },
        sk: {
          composite: ["city", "manufacturer", "count"],
        },
      },
    },
  },
  { table: tableName },
);

export const Warehouse = new Entity(
  {
    model: {
      entity: "warehouse",
      version: "1",
      service: "warehouse",
    },
    attributes: {
      warehouseId: {
        type: "string",
        required: true,
        field: "attr4",
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
      streetAddress: {
        type: "string",
      },
    },
    indexes: {
      record: {
        pk: {
          field: "pk",
          composite: ["warehouseId"],
        },
        sk: {
          field: "sk",
          composite: [],
        },
      },
      location: {
        index: "gsi1",
        type: "composite",
        collection: "inventory",
        pk: {
          composite: ["country", "region"],
        },
        sk: {
          composite: ["city", "warehouseId"],
        },
      },
    },
  },
  { table: tableName },
);
