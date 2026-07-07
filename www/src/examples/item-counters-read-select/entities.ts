import { Entity } from "electrodb";
import { tableName } from "./table";

export const User = new Entity(
  {
    model: {
      entity: "user",
      service: "accounts",
      version: "1",
    },
    attributes: {
      accountId: {
        type: "string",
      },
      userId: {
        type: "string",
      },
      name: {
        type: "string",
      },
    },
    indexes: {
      account: {
        collection: "members",
        pk: {
          field: "pk",
          composite: ["accountId"],
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

export const Account = new Entity(
  {
    model: {
      entity: "account",
      service: "accounts",
      version: "1",
    },
    attributes: {
      accountId: {
        type: "string",
      },
      name: {
        type: "string",
      },
    },
    indexes: {
      account: {
        collection: "members",
        pk: {
          field: "pk",
          composite: ["accountId"],
        },
        sk: {
          field: "sk",
          composite: [],
        },
      },
    },
  },
  { table: tableName },
);
