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
        collection: "overview",
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
        collection: ["contributions", "assignments"] as const,
        index: "gsi2",
        pk: {
          field: "gsi2pk",
          composite: ["employeeId"],
        },
        sk: {
          field: "gsi2sk",
          composite: ["projectId"],
        },
      },
    },
  },
  { table: tableName },
);

export const projectMembers = new Entity(
  {
    model: {
      entity: "projectMembers",
      version: "1",
      service: "taskapp",
    },
    attributes: {
      employeeId: {
        type: "string",
      },
      projectId: {
        type: "string",
      },
      name: {
        type: "string",
      },
    },
    indexes: {
      members: {
        collection: "overview",
        pk: {
          field: "pk",
          composite: ["projectId"],
        },
        sk: {
          field: "sk",
          composite: ["employeeId"],
        },
      },
      projects: {
        collection: ["contributions", "assignments"] as const,
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
