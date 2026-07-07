import { Entity } from "electrodb";
import { tableName } from "./table";

export const assets = new Entity(
  {
    model: {
      entity: "assets",
      version: "1",
      service: "inventory",
    },
    attributes: {
      assetId: {
        type: "string",
      },
      accountId: {
        type: "string",
      },
      name: {
        type: "string",
      },
      description: {
        type: "string",
      },
      city: {
        type: "string",
      },
      county: {
        type: "string",
      },
      state: {
        type: "string",
      },
      zip: {
        type: "string",
      },
    },
    indexes: {
      assets: {
        pk: {
          field: "pk",
          composite: ["accountId"],
        },
        sk: {
          field: "sk",
          composite: ["assetId"],
        },
      },
      locations: {
        collection: "geographics",
        index: "gsi1pk-gsi1sk-index",
        pk: {
          field: "gsi1pk",
          composite: ["state"],
        },
        sk: {
          field: "gsi1sk",
          composite: ["county", "city", "zip"],
        },
      },
    },
  },
  { table: tableName },
);
