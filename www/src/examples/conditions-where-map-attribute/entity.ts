import { Entity } from "electrodb";
import { tableName } from "./table";

export const animals = new Entity(
  {
    model: {
      service: "zoo",
      entity: "animals",
      version: "1",
    },
    attributes: {
      animal: {
        type: "string",
        required: true,
      },
      name: {
        type: "string",
        required: true,
      },
      habitat: {
        type: "string",
        required: true,
      },
      enclosure: {
        type: "string",
        required: true,
      },
      keeper: {
        type: "string",
      },
      dangerous: {
        type: "boolean",
      },
      diet: {
        type: "list",
        items: {
          type: "string",
        },
      },
      lastFed: {
        type: "string",
      },
      lastFedBy: {
        type: "string",
      },
      birthday: {
        type: "string",
      },
      isPregnant: {
        type: "boolean",
      },
      lastEvaluation: {
        type: "string",
      },
      lastEvaluationBy: {
        type: "string",
      },
      veterinarian: {
        type: "map",
        properties: {
          name: {
            type: "string",
          },
        },
      },
      offspring: {
        type: "list",
        items: {
          type: "map",
          properties: {
            name: {
              type: "string",
            },
            birthday: {
              type: "string",
            },
            note: {
              type: "string",
            },
          },
        },
      },
    },
    indexes: {
      byAnimal: {
        pk: {
          field: "pk",
          composite: ["animal"],
        },
        sk: {
          field: "sk",
          composite: ["name"],
        },
      },
      exhibit: {
        index: "gsi1pk-gsi1sk-index",
        pk: {
          field: "gsi1pk",
          composite: ["habitat"],
        },
        sk: {
          field: "gsi1sk",
          composite: ["enclosure"],
        },
      },
    },
  },
  { table: tableName },
);
