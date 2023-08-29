/* istanbul ignore file */
import moment from "moment";
import { faker } from '@faker-js/faker';
import { Entity, CreateEntityItem, EntityItem } from '../../../';
import { table, client } from '../../common';

export const licenses = [
  "afl-3.0",
  "apache-2.0",
  "artistic-2.0",
  "bsl-1.0",
  "bsd-2-clause",
  "bsd-3-clause",
  "bsd-3-clause-clear",
  "cc",
  "cc0-1.0",
  "cc-by-4.0",
  "cc-by-sa-4.0",
  "wtfpl",
  "ecl-2.0",
  "epl-1.0",
  "epl-2.0",
  "eupl-1.1",
  "agpl-3.0",
  "gpl",
  "gpl-2.0",
  "gpl-3.0",
  "lgpl",
  "lgpl-2.1",
  "lgpl-3.0",
  "isc",
  "lppl-1.3c",
  "ms-pl",
  "mit",
  "mpl-2.0",
  "osl-3.0",
  "postgresql",
  "ofl-1.1",
  "ncsa",
  "unlicense",
  "zlib"
] as const;

export const Repository = new Entity({
  model: {
    entity: "Repository",
    service: "version-control",
    version: "1"
  },
  attributes: {
    repoName: {
      type: "string"
    },
    repoOwner: {
      type: "string"
    },
    about: {
      type: "string"
    },
    username: {
      type: "string",
      readOnly: true,
      watch: ["repoOwner"],
      set: (_, { repoOwner }) => repoOwner
    },
    description: {
      type: "string"
    },
    isPrivate: {
      type: "boolean"
    },
    license: {
      type: licenses
    },
    defaultBranch: {
      type: "string",
      default: "main"
    },
    topics: {
      type: "set",
      items: "string"
    },
    followers: {
      type: "set",
      items: "string"
    },
    stars: {
      type: "set",
      items: "string"
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
    repositories: {
      collection: "alerts",
      pk: {
        composite: ["repoOwner"],
        field: "pk"
      },
      sk: {
        composite: ["repoName"],
        field: "sk"
      }
    },
    created: {
      collection: "owned",
      index: "gsi1pk-gsi1sk-index",
      pk: {
        composite: ["username"],
        field: "gsi1pk"
      },
      sk: {
        composite: ["isPrivate", "createdAt"],
        field: "gsi1sk"
      }
    },
  }
}, { table, client });

export type CreateRepositoryItem = CreateEntityItem<typeof Repository>;

export type RepositoryItem = EntityItem<typeof Repository>;

export function createMockRepository(overrides?: Partial<CreateRepositoryItem>): CreateRepositoryItem {
  return {
    about: faker.lorem.sentences({min: 1, max: 3}),
    username: faker.internet.userName(),
    repoOwner: faker.internet.userName(),
    defaultBranch: 'main',
    description: faker.lorem.paragraph(),
    followers: new Array(faker.number.int({min: 1, max: 10}))
        .fill({})
        .map(() => faker.internet.userName()),
    stars: new Array(faker.number.int({min: 1, max: 10}))
        .fill({})
        .map(() => faker.internet.userName()),
    topics: new Array(faker.number.int({min: 1, max: 3})).fill({}).map(() => faker.hacker.adjective()),
    license: faker.helpers.arrayElement(licenses),
    repoName: `${faker.hacker.verb()}${faker.hacker.noun()}`,
    isPrivate: faker.helpers.arrayElement([true, false]),
    ...overrides
  };
}