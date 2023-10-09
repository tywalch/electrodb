/* istanbul ignore file */
import moment from "moment";
import { v4 as uuid } from "uuid";
import { faker } from "@faker-js/faker";
import { Entity, CreateEntityItem, EntityItem } from "../../../";
import {
  NotYetViewed,
  TicketTypes,
  PullRequestTicket,
  StatusTypes,
  toStatusString,
  toStatusCode,
} from "./types";
import { table, client } from "../../common";

export const PullRequest = new Entity(
  {
    model: {
      entity: "pull-request",
      service: "version-control",
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
              default: () => moment.utc().format(),
              readOnly: true,
            },
          },
        },
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
  },
  { table, client },
);

export const PullRequestComment = new Entity(
  {
    model: {
      entity: "pull-request-comment",
      service: "version-control",
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
      body: {
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
          composite: ["createdAt", "replyViewed"],
          field: "gsi2sk",
        },
      },
    },
  },
  { table, client },
);

export type CreatePullRequestItem = CreateEntityItem<typeof PullRequest>;

export type PullRequestItem = EntityItem<typeof PullRequest>;

export function createMockPullRequest(
  overrides?: Partial<CreatePullRequestItem>,
): CreatePullRequestItem {
  return {
    pullRequestNumber: faker.number
      .int({ min: 1, max: 9000 })
      .toString()
      .padStart(4, "0"),
    repoName: `${faker.hacker.verb()}${faker.hacker.noun()}`,
    repoOwner: faker.internet.userName(),
    status: faker.helpers.arrayElement(["Open", "Closed"]),
    ticketType: faker.helpers.arrayElement(["Issue", "PullRequest"]),
    username: faker.internet.userName(),
    reviewers: [
      {
        username: faker.internet.userName(),
        createdAt: faker.date.recent().toDateString(),
        approved: faker.helpers.arrayElement([true, false]),
      },
    ],
    ...overrides,
  };
}

export type CreatePullRequestCommentItem = CreateEntityItem<
  typeof PullRequestComment
>;

export type PullRequestCommentItem = EntityItem<typeof PullRequestComment>;

export function createMockPullRequestComment(
  overrides?: Partial<CreatePullRequestCommentItem>,
): CreatePullRequestCommentItem {
  return {
    commentId: uuid(),
    replyTo: faker.internet.userName(),
    username: faker.internet.userName(),
    repoOwner: faker.internet.userName(),
    repoName: `${faker.hacker.verb()}${faker.hacker.noun()}`,
    body: faker.lorem.sentences({ min: 1, max: 3 }),
    pullRequestNumber: faker.number
      .int({ min: 1, max: 9000 })
      .toString()
      .padStart(4, "0"),
    ...overrides,
  };
}
