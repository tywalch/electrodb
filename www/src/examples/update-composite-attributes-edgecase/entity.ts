import { Entity } from "electrodb";
import { tableName } from "./table";

export const entity = new Entity(
  {
    model: {
      entity: "update-edgecases",
      service: "service",
      version: "1",
    },
    attributes: {
      attr1: {
        type: "string",
        required: true,
      },
      attr2: {
        type: "string",
        required: true,
      },
      attr3: {
        type: "string",
        required: true,
      },
      attr4: {
        type: "string",
        required: true,
      },
    },
    indexes: {
      accessPattern1: {
        pk: {
          field: "pk",
          composite: ["attr1"],
        },
        sk: {
          field: "sk",
          composite: ["attr2"],
        },
      },
      accessPattern2: {
        index: "my-gsi",
        pk: {
          field: "gsi1pk",
          composite: ["attr3"],
        },
        sk: {
          field: "gsi1sk",
          composite: ["attr2", "attr4"],
        },
      },
    },
  },
  { table: tableName },
);
