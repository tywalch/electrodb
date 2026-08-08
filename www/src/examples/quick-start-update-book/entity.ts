import { Entity } from "electrodb";
import { tableName } from "./table";

export const Book = new Entity(
  {
    model: {
      entity: "book",
      version: "1",
      service: "store",
    },
    attributes: {
      storeId: {
        type: "string",
      },
      bookId: {
        type: "string",
      },
      price: {
        type: "number",
        required: true,
      },
      title: {
        type: "string",
      },
      author: {
        type: "string",
      },
      condition: {
        type: ["EXCELLENT", "GOOD", "FAIR", "POOR"] as const,
        required: true,
      },
      genre: {
        type: "set",
        items: "string",
      },
      published: {
        type: "string",
      },
    },
    indexes: {
      byLocation: {
        pk: {
          field: "pk",
          composite: ["storeId"],
        },
        sk: {
          field: "sk",
          composite: ["bookId"],
        },
      },
      byAuthor: {
        index: "gsi1pk-gsi1sk-index",
        pk: {
          field: "gsi1pk",
          composite: ["author"],
        },
        sk: {
          field: "gsi1sk",
          composite: ["title"],
        },
      },
    },
  },
  { table: tableName },
);
