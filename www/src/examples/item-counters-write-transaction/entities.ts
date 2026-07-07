import { Entity } from "electrodb";
import { tableName } from "./table";

export const Employee = new Entity(
  {
    model: {
      entity: "employee",
      service: "directory",
      version: "1",
    },
    attributes: {
      organizationId: {
        type: "string",
      },
      employeeId: {
        type: "string",
      },
      name: {
        type: "string",
      },
      teamId: {
        type: "string",
      },
    },
    indexes: {
      employees: {
        collection: "employed",
        pk: {
          field: "pk",
          composite: ["organizationId"],
        },
        sk: {
          field: "sk",
          composite: ["employeeId"],
        },
      },
    },
  },
  { table: tableName },
);

// A counter scoped to the entire "directory" service. This entity has no
// "pk" or "sk" composite attributes, making the item it creates global.
// Be careful when using this pattern, as it can lead to hot partitions.
export const GlobalCounter = new Entity(
  {
    model: {
      entity: "global-counter",
      service: "directory",
      version: "1",
    },
    attributes: {
      count: {
        type: "number",
      },
    },
    indexes: {
      count: {
        pk: {
          field: "pk",
          composite: [],
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

// A counter scoped to a more specific subset of data: "organizationId" and
// "teamId" allow counting the number of items scoped to a specific team.
export const TeamCounter = new Entity(
  {
    model: {
      entity: "team-counter",
      service: "directory",
      version: "1",
    },
    attributes: {
      organizationId: {
        type: "string",
      },
      teamId: {
        type: "string",
      },
      count: {
        type: "number",
      },
    },
    indexes: {
      organization: {
        collection: "employed",
        pk: {
          field: "pk",
          composite: ["organizationId"],
        },
        sk: {
          field: "sk",
          composite: ["teamId"],
        },
      },
    },
  },
  { table: tableName },
);

// A counter dynamically scoped by a "kind" attribute, allowing the
// "organizationId" partition to be further split by the kind of item
// being counted.
export const OrganizationItemCounter = new Entity(
  {
    model: {
      entity: "member-counter",
      service: "directory",
      version: "1",
    },
    attributes: {
      organizationId: {
        type: "string",
      },
      kind: {
        type: ["employee", "team"] as const,
      },
      count: {
        type: "number",
      },
    },
    indexes: {
      organization: {
        collection: "employed",
        pk: {
          field: "pk",
          composite: ["organizationId"],
        },
        sk: {
          field: "sk",
          composite: ["kind"],
        },
      },
    },
  },
  { table: tableName },
);
