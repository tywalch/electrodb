export const SITE = {
  title: "ElectroDB",
  description:
    "ElectroDB is a DynamoDB library to ease the use of having multiple entities and complex hierarchical relationships in a single DynamoDB table.",
  defaultLanguage: "en_US",
};

export const OPEN_GRAPH = {
  image: {
    src: "https://github.com/tywalch/electrodb/blob/master/assets/electrodb-drk-compressed.png?raw=true",
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
    About: [
      { text: "Introduction", link: "en/introduction" }, //
      { text: "Entities and Services", link: "en/entities" }, //
      { text: "Joins", link: "en/joins" }, //
      { text: "Models", link: "en/models" }, //
      { text: "Indexes", link: "en/indexes" }, //
      { text: "Composite Attributes", link: "en/composite-attributes" }, //
      { text: "Collections", link: "en/collections" }, //
      { text: "Where", link: "en/where" },
      { text: "Executing Queries", link: "en/executing-queries" },
      { text: "Errata", link: "en/errata" }, //
    ],
    Operations: [
      { text: "Queries", link: "en/queries" },
      { text: "Delete", link: "en/delete" },
      { text: "Put", link: "en/put" },
      { text: "Update", link: "en/update" },
      { text: "Scan", link: "en/scan" },
      { text: "Find", link: "en/find" },
    ], //
    Examples: [{ text: "Examples", link: "en/examples" }], //
    Tutorial: [{ text: "Tutorial", link: "en/tutorial" }],
  },
};
