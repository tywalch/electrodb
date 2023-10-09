/* istanbul ignore file */
import { Entity, EntityItem, QueryResponse, CreateEntityItem } from "../../../";
import { table, client } from "../../common";

export const Task = new Entity(
  {
    model: {
      entity: "task",
      version: "1",
      service: "task-manager",
    },
    attributes: {
      taskName: {
        type: "string",
        required: true,
      },
      project: {
        type: "string",
        required: true,
      },
      employee: {
        type: "string",
        required: true,
      },
      description: {
        type: "string",
      },
      status: {
        type: ["open", "in-progress", "closed"] as const,
        default: "open",
      },
      points: {
        type: "number",
        required: true,
      },
      comments: {
        type: "any",
      },
    },
    indexes: {
      task: {
        pk: {
          field: "pk",
          composite: ["taskName"],
        },
        sk: {
          field: "sk",
          composite: ["project", "employee"],
        },
      },
      project: {
        index: "gsi1pk-gsi1sk-index",
        pk: {
          field: "gsi1pk",
          composite: ["project"],
        },
        sk: {
          field: "gsi1sk",
          composite: ["employee", "status"],
        },
      },
      assigned: {
        collection: "assignments",
        index: "gsi3pk-gsi3sk-index",
        pk: {
          field: "gsi3pk",
          composite: ["employee"],
        },
        sk: {
          field: "gsi3sk",
          composite: ["project", "status"],
        },
      },
      statuses: {
        index: "gsi4pk-gsi4sk-index",
        pk: {
          field: "gsi4pk",
          composite: ["status"],
        },
        sk: {
          field: "gsi4sk",
          composite: ["project", "employee"],
        },
      },
    },
  },
  { table, client },
);

export type TaskItem = EntityItem<typeof Task>;
export type CreateTaskItem = CreateEntityItem<typeof Task>;
export type TaskQueryResponse = QueryResponse<typeof Task>;
