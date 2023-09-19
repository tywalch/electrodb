/* istanbul ignore file */
import moment from "moment";
import { v4 as uuid } from "uuid";
import { faker } from "@faker-js/faker";
import { Entity, CreateEntityItem, EntityItem } from "../../../";
import {
  NotYetViewed,
  TicketTypes,
  IssueTicket,
  StatusTypes,
  toStatusString,
  toStatusCode,
} from "./types";
import { table, client } from "../../common";

export const Issue = new Entity(
  {
    model: {
      entity: "issue",
      service: "version-control",
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
  },
  { table, client },
);

export const IssueComment = new Entity(
  {
    model: {
      entity: "issue-comment",
      service: "version-control",
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
          composite: ["createdAt", "replyViewed"],
          field: "gsi2sk",
        },
      },
    },
  },
  { table, client },
);

export type CreateIssueItem = CreateEntityItem<typeof Issue>;

export type IssueItem = EntityItem<typeof Issue>;

export function createMockIssue(
  overrides?: Partial<CreateIssueItem>,
): CreateIssueItem {
  return {
    body: faker.lorem.paragraph(),
    issueNumber: faker.number
      .int({ min: 1, max: 9000 })
      .toString()
      .padStart(4, "0"),
    repoName: `${faker.hacker.verb()}${faker.hacker.noun()}`,
    repoOwner: faker.internet.userName(),
    status: faker.helpers.arrayElement(["Open", "Closed"]),
    subject: `${faker.hacker.noun()} is not ${faker.hacker.ingverb()}`,
    username: faker.internet.userName(),
    ticketType: faker.helpers.arrayElement(["Issue", "PullRequest"]),
    ...overrides,
  };
}

export type CreateIssueCommentItem = CreateEntityItem<typeof IssueComment>;

export type IssueCommentItem = EntityItem<typeof IssueComment>;

export function createMockIssueComment(
  overrides?: Partial<CreateIssueCommentItem>,
): CreateIssueCommentItem {
  return {
    commentId: uuid(),
    body: faker.lorem.sentences({ min: 1, max: 3 }),
    username: faker.internet.userName(),
    repoOwner: faker.internet.userName(),
    issueNumber: faker.number
      .int({ min: 1, max: 9000 })
      .toString()
      .padStart(4, "0"),
    repoName: `${faker.hacker.verb()}${faker.hacker.noun()}`,
    replyTo: faker.internet.userName(),
    ...overrides,
  };
}
