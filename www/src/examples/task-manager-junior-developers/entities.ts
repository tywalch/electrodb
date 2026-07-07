import { Entity } from "electrodb";
import { tableName } from "./table";

function randomId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function isValidDate(date: string): boolean {
  return !Number.isNaN(Date.parse(date));
}

export const employee = new Entity(
  {
    model: {
      entity: "employee",
      version: "1",
      service: "taskmanager",
    },
    attributes: {
      employee: {
        type: "string",
        default: () => randomId(),
      },
      firstName: {
        type: "string",
        required: true,
      },
      lastName: {
        type: "string",
        required: true,
      },
      office: {
        type: "string",
        required: true,
      },
      title: {
        type: "string",
        required: true,
      },
      team: {
        type: [
          "development",
          "marketing",
          "finance",
          "product",
          "cool cats and kittens",
        ] as const,
        required: true,
      },
      salary: {
        type: "string",
        required: true,
      },
      manager: {
        type: "string",
      },
      dateHired: {
        type: "string",
        validate: (date: string) => {
          if (!isValidDate(date)) {
            throw new Error("Invalid date format");
          }
          return true;
        },
      },
      birthday: {
        type: "string",
        validate: (date: string) => {
          if (!isValidDate(date)) {
            throw new Error("Invalid date format");
          }
          return true;
        },
      },
    },
    indexes: {
      employee: {
        pk: {
          field: "pk",
          composite: ["employee"],
        },
        sk: {
          field: "sk",
          composite: [],
        },
      },
      coworkers: {
        index: "gsi1pk-gsi1sk-index",
        collection: "workplaces",
        pk: {
          field: "gsi1pk",
          composite: ["office"],
        },
        sk: {
          field: "gsi1sk",
          composite: ["team", "title", "employee"],
        },
      },
      teams: {
        index: "gsi2pk-gsi2sk-index",
        pk: {
          field: "gsi2pk",
          composite: ["team"],
        },
        sk: {
          field: "gsi2sk",
          composite: ["dateHired", "title"],
        },
      },
      employeeLookup: {
        collection: "assignments",
        index: "gsi3pk-gsi3sk-index",
        pk: {
          field: "gsi3pk",
          composite: ["employee"],
        },
        sk: {
          field: "gsi3sk",
          composite: [],
        },
      },
      roles: {
        index: "gsi4pk-gsi4sk-index",
        pk: {
          field: "gsi4pk",
          composite: ["title"],
        },
        sk: {
          field: "gsi4sk",
          composite: ["salary"],
        },
      },
      directReports: {
        index: "gsi5pk-gsi5sk-index",
        pk: {
          field: "gsi5pk",
          composite: ["manager"],
        },
        sk: {
          field: "gsi5sk",
          composite: ["team", "office"],
        },
      },
    },
  },
  { table: tableName },
);

export const office = new Entity(
  {
    model: {
      entity: "office",
      version: "1",
      service: "taskmanager",
    },
    attributes: {
      office: {
        type: "string",
      },
      country: {
        type: "string",
      },
      state: {
        type: "string",
      },
      city: {
        type: "string",
      },
      zip: {
        type: "string",
      },
      address: {
        type: "string",
      },
    },
    indexes: {
      locations: {
        pk: {
          field: "pk",
          composite: ["country", "state"],
        },
        sk: {
          field: "sk",
          composite: ["city", "zip", "office"],
        },
      },
      office: {
        index: "gsi1pk-gsi1sk-index",
        collection: "workplaces",
        pk: {
          field: "gsi1pk",
          composite: ["office"],
        },
        sk: {
          field: "gsi1sk",
          composite: [],
        },
      },
    },
  },
  { table: tableName },
);

export const task = new Entity(
  {
    model: {
      entity: "task",
      version: "1",
      service: "taskmanager",
    },
    attributes: {
      task: {
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
          composite: ["task"],
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
  { table: tableName },
);
