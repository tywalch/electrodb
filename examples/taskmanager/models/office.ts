/* istanbul ignore file */
import { Entity, EntityItem, QueryResponse, CreateEntityItem } from "../../../";
import { table, client } from "../../common";

export const Office = new Entity(
  {
    model: {
      entity: "Office",
      version: "1",
      service: "task-manager",
    },
    attributes: {
      officeName: {
        type: "string",
      },
      country: {
        type: "string",
      },
      state: {
        type: "string",
      },
      city: {
        type: "string",
      },
      zip: {
        type: "string",
      },
      address: {
        type: "string",
      },
    },
    indexes: {
      locations: {
        pk: {
          field: "pk",
          composite: ["country", "state"],
        },
        sk: {
          field: "sk",
          composite: ["city", "zip", "officeName"],
        },
      },
      office: {
        index: "gsi1pk-gsi1sk-index",
        collection: "workplaces",
        pk: {
          field: "gsi1pk",
          composite: ["officeName"],
        },
        sk: {
          field: "gsi1sk",
          composite: [],
        },
      },
    },
  },
  { table, client },
);

export type OfficeItem = EntityItem<typeof Office>;
export type CreateOfficeItem = CreateEntityItem<typeof Office>;
export type OfficeQueryResponse = QueryResponse<typeof Office>;
