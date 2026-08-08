import { Entity } from "electrodb";
import { tableName } from "./table";

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
      projectId: {
        type: "string",
      },
      name: {
        type: "string",
      },
      description: {
        type: "string",
      },
      status: {
        type: ["open", "in-progress", "closed"] as const,
        default: "open",
      },
      priority: {
        type: "number",
      },
      createdAt: {
        type: "number",
        default: () => Date.now(),
      },
      updatedAt: {
        type: "number",
        watch: "*",
        set: () => Date.now(),
      },
    },
    indexes: {
      tasks: {
        pk: {
          field: "pk",
          composite: ["projectId"],
        },
        sk: {
          field: "sk",
          composite: ["taskId"],
        },
      },
      statusIndex: {
        index: "gsi1pk-gsi1sk-index",
        projection: ["name", "status", "createdAt"],
        pk: {
          field: "gsi1pk",
          composite: ["status"],
        },
        sk: {
          field: "gsi1sk",
          composite: ["createdAt"],
        },
      },
    },
  },
  { table: tableName },
);
