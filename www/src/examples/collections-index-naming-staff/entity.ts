import { Entity } from "electrodb";
import { tableName } from "./table";

export const employee = new Entity(
  {
    model: {
      entity: "employees",
      version: "1",
      service: "taskapp",
    },
    attributes: {
      employeeId: {
        type: "string",
      },
      organizationId: {
        type: "string",
      },
      name: {
        type: "string",
      },
      team: {
        type: ["jupiter", "mercury", "saturn"] as const,
      },
    },
    indexes: {
      staff: {
        pk: {
          field: "pk",
          composite: ["organizationId"],
        },
        sk: {
          field: "sk",
          composite: ["employeeId"],
        },
      },
      employee: {
        collection: "contributions",
        index: "gsi2",
        pk: {
          field: "gsi2pk",
          composite: ["employeeId"],
        },
        sk: {
          field: "gsi2sk",
          composite: [],
        },
      },
    },
  },
  { table: tableName },
);
