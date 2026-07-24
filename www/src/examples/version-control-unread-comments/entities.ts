import { Entity } from "electrodb";
import {
  TicketTypes,
  IssueTicket,
  PullRequestTicket,
  IsNotTicket,
  StatusTypes,
  NotYetViewed,
  toStatusString,
  toStatusCode,
} from "./types";

export const issues = new Entity({
  model: {
    entity: "issues",
    service: "versioncontrol",
    version: "1",
  },
  attributes: {
    issueNumber: {
      type: "string",
    },
    repoName: {
      type: "string",
    },
    repoOwner: {
      type: "string",
    },
    username: {
      type: "string",
    },
    ticketType: {
      type: TicketTypes,
      set: () => IssueTicket,
      readOnly: true,
    },
    ticketNumber: {
      type: "string",
      readOnly: true,
      watch: ["issueNumber"],
      set: (_, { issueNumber }) => issueNumber,
    },
    status: {
      type: StatusTypes,
      default: "Open",
      set: (val) => toStatusCode(val),
      get: (val) => toStatusString(val),
    },
    subject: {
      type: "string",
    },
    body: {
      type: "string",
    },
    createdAt: {
      type: "string",
      set: () => new Date().toISOString(),
      readOnly: true,
    },
    updatedAt: {
      type: "string",
      watch: "*",
      set: () => new Date().toISOString(),
      readOnly: true,
    },
  },
  indexes: {
    issue: {
      collection: "issueReview",
      pk: {
        composite: ["repoOwner", "repoName", "issueNumber"],
        field: "pk",
      },
      sk: {
        composite: [],
        field: "sk",
      },
    },
    created: {
      collection: ["owned", "managed"],
      index: "gsi1pk-gsi1sk-index",
      pk: {
        field: "gsi1pk",
        composite: ["username"],
      },
      sk: {
        field: "gsi1sk",
        composite: ["status", "createdAt"],
      },
    },
    todos: {
      collection: "activity",
      index: "gsi2pk-gsi2sk-index",
      pk: {
        composite: ["repoOwner", "repoName"],
        field: "gsi2pk",
      },
      sk: {
        composite: ["status", "createdAt"],
        field: "gsi2sk",
      },
    },
    _: {
      collection: "subscribers",
      index: "gsi4pk-gsi4sk-index",
      pk: {
        composite: ["repoOwner", "repoName", "ticketNumber"],
        field: "gsi4pk",
      },
      sk: {
        composite: [],
        field: "gsi4sk",
      },
    },
  },
});

export const issueComments = new Entity({
  model: {
    entity: "issueComment",
    service: "versioncontrol",
    version: "1",
  },
  attributes: {
    issueNumber: {
      type: "string",
    },
    commentId: {
      type: "string",
    },
    username: {
      type: "string",
    },
    replyTo: {
      type: "string",
    },
    replyViewed: {
      type: "string",
      default: NotYetViewed,
      get: (replyViewed) => {
        if (replyViewed !== NotYetViewed) {
          return replyViewed;
        }
      },
      set: (replyViewed) => {
        if (replyViewed === undefined) {
          return NotYetViewed;
        }
        return replyViewed;
      },
    },
    repoName: {
      type: "string",
    },
    repoOwner: {
      type: "string",
    },
    body: {
      type: "string",
    },
    createdAt: {
      type: "string",
      set: () => new Date().toISOString(),
      readOnly: true,
    },
    updatedAt: {
      type: "string",
      watch: "*",
      set: () => new Date().toISOString(),
      readOnly: true,
    },
  },
  indexes: {
    comments: {
      collection: "issueReview",
      pk: {
        composite: ["repoOwner", "repoName", "issueNumber"],
        field: "pk",
      },
      sk: {
        composite: ["commentId"],
        field: "sk",
      },
    },
    created: {
      collection: "conversations",
      index: "gsi1pk-gsi1sk-index",
      pk: {
        field: "gsi1pk",
        composite: ["username"],
      },
      sk: {
        field: "gsi1sk",
        composite: ["repoOwner", "repoName", "issueNumber"],
      },
    },
    replies: {
      collection: "inbox",
      index: "gsi2pk-gsi2sk-index",
      pk: {
        composite: ["replyTo"],
        field: "gsi2pk",
      },
      sk: {
        composite: ["updatedAt", "replyViewed"],
        field: "gsi2sk",
      },
    },
  },
});

export const pullRequests = new Entity({
  model: {
    entity: "pullRequest",
    service: "versioncontrol",
    version: "1",
  },
  attributes: {
    pullRequestNumber: {
      type: "string",
      required: true,
    },
    repoName: {
      type: "string",
      required: true,
    },
    repoOwner: {
      type: "string",
      required: true,
    },
    username: {
      type: "string",
      required: true,
    },
    ticketType: {
      type: TicketTypes,
      default: () => PullRequestTicket,
      set: () => PullRequestTicket,
      readOnly: true,
    },
    ticketNumber: {
      type: "string",
      readOnly: true,
      watch: ["pullRequestNumber"],
      set: (_, { pullRequestNumber }) => pullRequestNumber,
    },
    status: {
      type: StatusTypes,
      default: "Open",
      set: (val) => toStatusCode(val),
      get: (val) => toStatusString(val),
    },
    reviewers: {
      type: "list",
      items: {
        type: "map",
        properties: {
          username: {
            type: "string",
            required: true,
          },
          approved: {
            type: "boolean",
            required: true,
          },
          createdAt: {
            type: "string",
            default: () => new Date().toISOString(),
            readOnly: true,
          },
        },
      },
    },
    createdAt: {
      type: "string",
      set: () => new Date().toISOString(),
      readOnly: true,
    },
    updatedAt: {
      type: "string",
      watch: "*",
      set: () => new Date().toISOString(),
      readOnly: true,
    },
  },
  indexes: {
    pullRequest: {
      collection: "PRReview",
      pk: {
        composite: ["repoOwner", "repoName", "pullRequestNumber"],
        field: "pk",
      },
      sk: {
        composite: [],
        field: "sk",
      },
    },
    created: {
      collection: ["owned", "managed"],
      index: "gsi1pk-gsi1sk-index",
      pk: {
        field: "gsi1pk",
        composite: ["username"],
      },
      sk: {
        field: "gsi1sk",
        composite: ["status", "createdAt"],
      },
    },
    enhancements: {
      collection: "activity",
      index: "gsi2pk-gsi2sk-index",
      pk: {
        field: "gsi2pk",
        composite: ["repoOwner", "repoName"],
      },
      sk: {
        field: "gsi2sk",
        composite: ["status", "createdAt"],
      },
    },
    _: {
      collection: "subscribers",
      index: "gsi4pk-gsi4sk-index",
      pk: {
        composite: ["repoOwner", "repoName", "ticketNumber"],
        field: "gsi4pk",
      },
      sk: {
        composite: [],
        field: "gsi4sk",
      },
    },
  },
});

export const pullRequestComments = new Entity({
  model: {
    entity: "pullRequestComment",
    service: "versioncontrol",
    version: "1",
  },
  attributes: {
    repoName: {
      type: "string",
    },
    username: {
      type: "string",
    },
    repoOwner: {
      type: "string",
    },
    pullRequestNumber: {
      type: "string",
    },
    commentId: {
      type: "string",
    },
    replyTo: {
      type: "string",
    },
    replyViewed: {
      type: "string",
      default: NotYetViewed,
      get: (replyViewed) => {
        if (replyViewed !== NotYetViewed) {
          return replyViewed;
        }
      },
      set: (replyViewed) => {
        if (replyViewed === undefined) {
          return NotYetViewed;
        }
        return replyViewed;
      },
    },
    createdAt: {
      type: "string",
      set: () => new Date().toISOString(),
      readOnly: true,
    },
    updatedAt: {
      type: "string",
      watch: "*",
      set: () => new Date().toISOString(),
      readOnly: true,
    },
  },
  indexes: {
    comments: {
      collection: "PRReview",
      pk: {
        composite: ["repoOwner", "repoName", "pullRequestNumber"],
        field: "pk",
      },
      sk: {
        composite: ["commentId"],
        field: "sk",
      },
    },
    created: {
      collection: "conversations",
      index: "gsi1pk-gsi1sk-index",
      pk: {
        field: "gsi1pk",
        composite: ["username"],
      },
      sk: {
        field: "gsi1sk",
        composite: ["repoOwner", "repoName"],
      },
    },
    replies: {
      collection: "inbox",
      index: "gsi2pk-gsi2sk-index",
      pk: {
        composite: ["replyTo"],
        field: "gsi2pk",
      },
      sk: {
        composite: ["updatedAt", "replyViewed"],
        field: "gsi2sk",
      },
    },
  },
});

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
  "zlib",
] as const;

export const repositories = new Entity({
  model: {
    entity: "repositories",
    service: "versioncontrol",
    version: "1",
  },
  attributes: {
    repoName: {
      type: "string",
    },
    repoOwner: {
      type: "string",
    },
    about: {
      type: "string",
    },
    username: {
      type: "string",
      readOnly: true,
      watch: ["repoOwner"],
      set: (_, { repoOwner }) => repoOwner,
    },
    description: {
      type: "string",
    },
    isPrivate: {
      type: "boolean",
    },
    license: {
      type: licenses,
    },
    defaultBranch: {
      type: "string",
      default: "main",
    },
    topics: {
      type: "set",
      items: "string",
    },
    followers: {
      type: "set",
      items: "string",
    },
    stars: {
      type: "set",
      items: "string",
    },
    createdAt: {
      type: "string",
      set: () => new Date().toISOString(),
      readOnly: true,
    },
    updatedAt: {
      type: "string",
      watch: "*",
      set: () => new Date().toISOString(),
      readOnly: true,
    },
  },
  indexes: {
    repositories: {
      collection: "alerts",
      pk: {
        composite: ["repoOwner"],
        field: "pk",
      },
      sk: {
        composite: ["repoName"],
        field: "sk",
      },
    },
    created: {
      collection: "owned",
      index: "gsi1pk-gsi1sk-index",
      pk: {
        composite: ["username"],
        field: "gsi1pk",
      },
      sk: {
        composite: ["isPrivate", "createdAt"],
        field: "gsi1sk",
      },
    },
  },
});

const RepositorySubscription = "#";

export const subscriptions = new Entity({
  model: {
    entity: "subscription",
    service: "versioncontrol",
    version: "1",
  },
  attributes: {
    repoName: {
      type: "string",
      required: true,
    },
    repoOwner: {
      type: "string",
      required: true,
    },
    username: {
      type: "string",
      required: true,
    },
    ticketNumber: {
      type: "string",
      default: () => IsNotTicket,
      set: (ticketNumber) => {
        if (ticketNumber === IsNotTicket) {
          return RepositorySubscription;
        } else {
          return ticketNumber;
        }
      },
      get: (ticketNumber) => {
        if (ticketNumber === RepositorySubscription) {
          return IsNotTicket;
        } else {
          return ticketNumber;
        }
      },
    },
    ticketType: {
      type: TicketTypes,
      default: () => IsNotTicket,
      set: (ticketType) => {
        if (ticketType === IsNotTicket) {
          return RepositorySubscription;
        } else {
          return ticketType;
        }
      },
      get: (ticketType) => {
        if (ticketType === RepositorySubscription) {
          return IsNotTicket;
        } else {
          return ticketType;
        }
      },
    },
    createdAt: {
      type: "string",
      set: () => new Date().toISOString(),
      readOnly: true,
    },
    updatedAt: {
      type: "string",
      watch: "*",
      set: () => new Date().toISOString(),
      readOnly: true,
    },
  },
  indexes: {
    repository: {
      pk: {
        composite: ["repoOwner", "repoName"],
        field: "pk",
      },
      sk: {
        composite: ["username", "ticketType", "ticketNumber"],
        field: "sk",
      },
    },
    user: {
      collection: "watching",
      index: "gsi3pk-gsi3sk-index",
      pk: {
        composite: ["username"],
        field: "gsi3pk",
      },
      sk: {
        composite: ["ticketType", "ticketNumber"],
        field: "gsi3sk",
      },
    },
    tickets: {
      collection: "subscribers",
      index: "gsi4pk-gsi4sk-index",
      pk: {
        composite: ["repoOwner", "repoName", "ticketNumber"],
        field: "gsi4pk",
      },
      sk: {
        composite: ["ticketType", "username"],
        field: "gsi4sk",
      },
    },
  },
});

export const users = new Entity({
  model: {
    entity: "user",
    service: "versioncontrol",
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
    pinned: {
      type: "any",
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
      set: () => new Date().toISOString(),
      readOnly: true,
    },
    updatedAt: {
      type: "string",
      watch: "*",
      set: () => new Date().toISOString(),
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
});
