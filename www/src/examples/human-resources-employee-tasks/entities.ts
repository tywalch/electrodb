import { Entity } from "electrodb";
import { tableName } from "./table";

export const Employee = new Entity(
  {
    model: {
      entity: "employee",
      version: "1",
      service: "taskapp",
    },
    attributes: {
      employee: {
        type: "string",
      },
      firstName: {
        type: "string",
      },
      lastName: {
        type: "string",
      },
      office: {
        type: "string",
      },
      title: {
        type: "string",
      },
      team: {
        type: ["development", "marketing", "finance", "product"] as const,
      },
      salary: {
        type: "string",
      },
      manager: {
        type: "string",
      },
      dateHired: {
        type: "string",
      },
      birthday: {
        type: "string",
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
          composite: ["title", "salary", "employee"],
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
          composite: ["salary", "employee"],
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
          composite: ["team", "office", "employee"],
        },
      },
    },
  },
  { table: tableName },
);

export const Task = new Entity(
  {
    model: {
      entity: "task",
      version: "1",
      service: "taskapp",
    },
    attributes: {
      task: {
        type: "string",
      },
      project: {
        type: "string",
      },
      employee: {
        type: "string",
      },
      description: {
        type: "string",
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
          composite: ["employee", "task"],
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
          composite: ["project", "task"],
        },
      },
    },
  },
  { table: tableName },
);

export const Office = new Entity(
  {
    model: {
      entity: "office",
      version: "1",
      service: "taskapp",
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
