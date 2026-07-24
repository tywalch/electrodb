import { Entity } from "electrodb";
import { tableName } from "./table";

export const users = new Entity(
  {
    model: {
      service: "TeamDirectory",
      entity: "User",
      version: "1",
    },
    attributes: {
      username: {
        type: "string",
        required: true,
      },
      team: {
        type: "string",
        required: true,
      },
      email: {
        type: "string",
        required: true,
      },
    },
    indexes: {
      user: {
        pk: {
          field: "pk",
          composite: ["username"],
        },
        sk: {
          field: "sk",
          composite: [],
        },
      },
      members: {
        index: "gsi1pk-gsi1sk-index",
        pk: {
          field: "gsi1pk",
          composite: ["team"],
        },
        sk: {
          field: "gsi1sk",
          composite: ["username"],
        },
      },
    },
  },
  { table: tableName },
);
