export const SITE = {
  title: "ElectroDB",
  description:
    "ElectroDB is a DynamoDB library to ease the use of having multiple entities and complex hierarchical relationships in a single DynamoDB table.",
  defaultLanguage: "en_US",
};

export const OPEN_GRAPH = {
  image: {
    src: "/social.jpg",
    alt:
      "ElectroDB logo" +
      "The word electro, with a lightning bolt, and the word DB",
  },
  twitter: "tinkertamper",
};

// This is the type of the frontmatter you put in the docs markdown files.
export type Frontmatter = {
  title: string;
  description: string;
  layout: string;
  image?: { src: string; alt: string };
  dir?: "ltr" | "rtl";
  ogLocale?: string;
  lang?: string;
};

export const KNOWN_LANGUAGES = {
  English: "en",
} as const;
export const KNOWN_LANGUAGE_CODES = Object.values(KNOWN_LANGUAGES);

export const GITHUB_EDIT_URL = `https://github.com/tywalch/electrodb/www`;

export const COMMUNITY_INVITE_URL = `https://github.com/tywalch/electrodb/discussions`;

// See "Algolia" section of the README for more information.
export const ALGOLIA = {
  indexName: "XXXXXXXXXX",
  appId: "XXXXXXXXXX",
  apiKey: "XXXXXXXXXX",
};

export type Sidebar = Record<
  typeof KNOWN_LANGUAGE_CODES[number],
  Record<string, { text: string; link: string }[]>
>;
export const SIDEBAR: Sidebar = {
  en: {
    'Core Concepts': [
      { text: 'Introduction', link: 'en/core-concepts/introduction' },
      { text: 'Quick Start', link: 'en/core-concepts/quick-start' },
      { text: 'Executing Queries', link: 'en/core-concepts/executing-queries' },
      { text: 'Single-Table Relationships', link: 'en/core-concepts/single-table-relationships' },
      { text: 'Use with Existing Tables', link: 'en/core-concepts/use-electrodb-with-existing-table' },
    ],
    'Data Modeling': [
      { text: 'Entities', link: 'en/modeling/entities' },
      { text: 'Services', link: 'en/modeling/services' },
      { text: 'Schema', link: 'en/modeling/schema' },
      { text: 'Attributes', link: 'en/modeling/attributes' },
      { text: 'Indexes', link: 'en/modeling/indexes' },
      { text: 'Collections', link: 'en/modeling/collections' },
    ],
    Queries: [
      { text: 'Get', link: 'en/queries/get' },
      { text: 'Batch Get', link: 'en/queries/batch-get' },
      { text: 'Query', link: 'en/queries/query' },
      { text: 'Collections', link: 'en/queries/collection' },
      { text: 'Find', link: 'en/queries/find' },
      { text: 'Match', link: 'en/queries/match' },
      { text: 'Scan', link: 'en/queries/scan' },
      { text: 'Pagination', link: 'en/queries/pagination' },
      { text: 'Filter Expressions', link: 'en/queries/filters' },
    ],
    Mutations: [
      { text: 'Put', link: 'en/mutations/put' },
      { text: 'Batch Put', link: 'en/mutations/batch-put' },
      { text: 'Create', link: 'en/mutations/create' },
      { text: 'Upsert', link: 'en/mutations/upsert' },
      { text: 'Update', link: 'en/mutations/update' },
      { text: 'Patch', link: 'en/mutations/patch' },
      { text: 'Delete', link: 'en/mutations/delete' },
      { text: 'Batch Delete', link: 'en/mutations/batch-delete' },
      { text: 'Remove', link: 'en/mutations/remove' },
      { text: 'Conditions Expressions', link: 'en/mutations/conditions' },
    ],
    Reference: [
      { text: 'Errors', link: 'en/reference/errors' },
      { text: 'TypeScript', link: 'en/reference/typscript' },
      { text: 'DynamoDB Client', link: 'en/reference/dynamodb-client' },
      { text: 'Events & Logging', link: 'en/reference/events-logging' },
    ],
    Examples: [
      { text: 'Human resources database', link: 'en/examples/human-resources' },
      { text: 'Shopping Mall directory', link: 'en/examples/shopping-mall-directory' },
      { text: 'Library system', link: 'en/examples/library-system' },
      { text: 'Version control', link: 'en/examples/version-control' },
      { text: 'Task manager', link: 'en/examples/task-manager' },
    ],
    Recipes: [
      { text: 'Creating calculated attributes', link: 'en/recipes/calculated-attribute' },
      { text: 'Creating virtual attributes', link: 'en/recipes/virtual-attribute' },
      { text: 'Adding meta timestamps', link: 'en/recipes/created-at-updated-at' },
      { text: 'Using opaque types', link: 'en/recipes/opaque-types' },
    ],
  },
};
