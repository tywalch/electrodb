import { Entity } from "electrodb";
import { tableName } from "./table";

export const myEntity = new Entity(
  {
    model: {
      entity: "your_entity_name",
      service: "your_service_name",
      version: "1",
    },
    attributes: {
      accountId: {
        type: "string", // only string types are both supported for this example
      },
      organizationId: {
        type: "string",
      },
      name: {
        type: "string",
      },
    },
    indexes: {
      your_access_pattern_name: {
        pk: {
          field: "accountId",
          composite: ["accountId"],
          template: "prefix_${accountId}_postfix",
        },
        sk: {
          field: "organizationId",
          composite: ["organizationId"],
        },
      },
    },
  },
  { table: tableName },
);
