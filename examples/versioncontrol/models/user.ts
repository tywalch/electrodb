/* istanbul ignore file */
import moment from "moment";
import { faker } from "@faker-js/faker";
import { Entity, CreateEntityItem, EntityItem } from "../../../";
import { table, client } from "../../common";

export const User = new Entity(
  {
    model: {
      entity: "user",
      service: "version-control",
      version: "1",
    },
    attributes: {
      username: {
        type: "string",
      },
      fullName: {
        type: "string",
      },
      photo: {
        type: "string",
      },
      bio: {
        type: "string",
      },
      location: {
        type: "string",
      },
      following: {
        type: "set",
        items: "string",
      },
      followers: {
        type: "set",
        items: "string",
      },
      createdAt: {
        type: "string",
        set: () => moment.utc().format(),
        default: () => moment.utc().format(),
        readOnly: true,
      },
      updatedAt: {
        type: "string",
        watch: "*",
        set: () => moment.utc().format(),
        readOnly: true,
      },
    },
    indexes: {
      user: {
        collection: "overview",
        pk: {
          composite: ["username"],
          field: "pk",
        },
        sk: {
          composite: [],
          field: "sk",
        },
      },
      _: {
        collection: "owned",
        index: "gsi1pk-gsi1sk-index",
        pk: {
          composite: ["username"],
          field: "gsi1pk",
        },
        sk: {
          field: "gsi1sk",
          composite: [],
        },
      },
      subscriptions: {
        collection: "watching",
        index: "gsi3pk-gsi3sk-index",
        pk: {
          composite: ["username"],
          field: "gsi3pk",
        },
        sk: {
          composite: [],
          field: "gsi3sk",
        },
      },
    },
  },
  { table, client },
);

export type CreateUserItem = CreateEntityItem<typeof User>;

export type UserItem = EntityItem<typeof User>;

export function createMockUser(
  overrides?: Partial<CreateUserItem>,
): CreateUserItem {
  return {
    username: faker.internet.userName(),
    bio: faker.lorem.paragraph(),
    followers: new Array(faker.number.int({ min: 1, max: 10 }))
      .fill({})
      .map(() => faker.internet.userName()),
    following: new Array(faker.number.int({ min: 1, max: 10 }))
      .fill({})
      .map(() => faker.internet.userName()),
    fullName: faker.person.fullName(),
    photo: `${faker.internet.url()}/${faker.string.alphanumeric({
      length: 10,
    })}.jpg`,
    ...overrides,
  };
}
