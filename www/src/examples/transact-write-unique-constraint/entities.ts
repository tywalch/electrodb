import { Entity } from "electrodb";
import { tableName } from "./table";

export const agent = new Entity(
  {
    model: {
      entity: "agent",
      version: "1",
      service: "MI6",
    },
    attributes: {
      id: {
        type: "string",
      },
      designation: {
        type: "string",
      },
      email: {
        type: "string",
        required: true,
      },
      firstName: {
        type: "string",
      },
      lastName: {
        type: "string",
      },
      alive: {
        type: "boolean",
        required: true,
      },
      kills: {
        type: "number",
        default: 0,
      },
    },
    indexes: {
      operatives: {
        pk: {
          field: "pk",
          composite: ["designation"],
        },
        sk: {
          field: "sk",
          composite: ["id"],
        },
      },
    },
  },
  { table: tableName },
);

// entity that owns unique constraints
export const constraint = new Entity(
  {
    model: {
      entity: "constraint",
      version: "1",
      service: "MI6",
    },
    attributes: {
      name: {
        type: "string",
        required: true,
      },
      value: {
        type: "string",
        required: true,
      },
      entity: {
        type: "string",
        required: true,
      },
    },
    indexes: {
      value: {
        pk: {
          field: "pk",
          composite: ["value"],
        },
        sk: {
          field: "sk",
          composite: ["name", "entity"],
        },
      },
      name: {
        index: "gsi1pk-gsi2sk-index",
        pk: {
          field: "gsi1pk",
          composite: ["name", "entity"],
        },
        sk: {
          field: "gsi1sk",
          composite: ["value"],
        },
      },
    },
  },
  { table: tableName },
);
