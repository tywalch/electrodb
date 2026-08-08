import { Entity } from "electrodb";
import { tableName } from "./table";

export const employee = new Entity(
  {
    model: {
      entity: "employee",
      version: "1",
      service: "Workforce",
    },
    attributes: {
      employeeId: {
        type: "string",
        required: true,
      },
      officeId: {
        type: "string",
        required: true,
      },
      firstName: {
        type: "string",
        required: true,
      },
      lastName: {
        type: "string",
        required: true,
      },
      title: {
        type: "string",
      },
    },
    indexes: {
      staff: {
        pk: {
          field: "pk",
          composite: ["employeeId"],
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

export const office = new Entity(
  {
    model: {
      entity: "office",
      version: "1",
      service: "Workforce",
    },
    attributes: {
      officeId: {
        type: "string",
        required: true,
      },
      name: {
        type: "string",
        required: true,
      },
      city: {
        type: "string",
        required: true,
      },
    },
    indexes: {
      locations: {
        pk: {
          field: "pk",
          composite: ["officeId"],
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
