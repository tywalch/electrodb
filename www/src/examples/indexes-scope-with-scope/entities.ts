import { Entity } from "electrodb";
import { tableName } from "./table";

export const organization = new Entity(
  {
    model: {
      entity: "organization",
      service: "taskapp",
      version: "1",
    },
    attributes: {
      organizationId: {
        type: "string",
      },
    },
    indexes: {
      myIndex: {
        scope: "org", // <--- Scope is set to unique value "org"
        pk: {
          field: "pk",
          composite: [],
        },
        sk: {
          field: "sk",
          composite: ["organizationId"],
        },
      },
    },
  },
  { table: tableName },
);

export const user = new Entity(
  {
    model: {
      entity: "user",
      service: "taskapp",
      version: "1",
    },
    attributes: {
      userId: {
        type: "string",
      },
    },
    indexes: {
      myIndex: {
        scope: "user", // <--- Scope is set to unique value "user"
        pk: {
          field: "pk",
          composite: [],
        },
        sk: {
          field: "sk",
          composite: ["userId"],
        },
      },
    },
  },
  { table: tableName },
);
