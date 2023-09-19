/* istanbul ignore file */
import { faker } from "@faker-js/faker";
import { Entity, CreateEntityItem, EntityItem } from "../../../";
import { table, client } from "../../common";

// the "author" entity holds information about each author
// that has a book at the library
export const Author = new Entity(
  {
    model: {
      entity: "author",
      version: "1",
      service: "library",
    },
    attributes: {
      authorFirstName: {
        type: "string",
        required: true,
      },
      authorLastName: {
        type: "string",
        required: true,
      },
      birthday: {
        type: "string",
      },
      bio: {
        type: "string",
        required: true,
      },
      genres: {
        type: "set",
        items: "string",
      },
    },
    indexes: {
      writer: {
        pk: {
          field: "pk",
          composite: ["authorLastName"],
        },
        sk: {
          field: "sk",
          composite: ["authorFirstName", "birthday"],
        },
      },
      info: {
        collection: ["works"],
        index: "gsi2pk-gsi2sk-index",
        pk: {
          field: "gsi2pk",
          composite: ["authorLastName", "authorFirstName"],
        },
        sk: {
          field: "gsi2sk",
          composite: [],
        },
      },
    },
  },
  { table, client },
);

export type CreateAuthorItem = CreateEntityItem<typeof Author>;
export type AuthorItem = EntityItem<typeof Author>;

export function createMockAuthor(
  overrides?: Partial<CreateAuthorItem>,
): CreateAuthorItem {
  return {
    bio: faker.person.bio(),
    birthday: faker.date.birthdate().toDateString(),
    authorLastName: faker.person.lastName(),
    authorFirstName: faker.person.firstName(),
    ...overrides,
  };
}
