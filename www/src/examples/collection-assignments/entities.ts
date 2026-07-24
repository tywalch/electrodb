import { Entity } from "electrodb";
import { tableName } from "./table";

export const employees = new Entity(
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
        type: ["jupiter", "mercury", "saturn"],
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
        collection: "assignments",
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

export const tasks = new Entity(
  {
    model: {
      entity: "tasks",
      version: "1",
      service: "taskapp",
    },
    attributes: {
      taskId: {
        type: "string",
      },
      employeeId: {
        type: "string",
      },
      projectId: {
        type: "string",
      },
      title: {
        type: "string",
      },
      body: {
        type: "string",
      },
    },
    indexes: {
      project: {
        pk: {
          field: "pk",
          composite: ["projectId"],
        },
        sk: {
          field: "sk",
          composite: ["taskId"],
        },
      },
      assigned: {
        collection: "assignments",
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
