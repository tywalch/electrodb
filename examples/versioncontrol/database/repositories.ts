import {Entity} from "../../..";
import moment from "moment";

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

export const repositories = new Entity({
  model: {
    entity: "repositories",
    service: "versioncontrol",
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
      set: (_, {repoOwner}) => repoOwner
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
    createdAt: {
      type: "string",
      default: () => moment.utc().format()
    },
    followers: {
      type: "set",
      items: "string"
    },
    stars: {
      type: "set",
      items: "string"
    }
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
});