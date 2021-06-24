import {Entity} from "../../../";
import moment from "moment";
import {NotYetViewed, TicketTypes, IssueTicket, StatusTypes, toStatusString, toStatusCode} from "./types";

export const issues = new Entity({
  model: {
    entity: "issues",
    service: "versioncontrol",
    version: "1"
  },
  attributes: {
    issueNumber: {
      type: "string",
    },
    repoName: {
      type: "string"
    },
    repoOwner: {
      type: "string"
    },
    username: {
      type: "string",
    },
    ticketType: {
      type: TicketTypes,
      default: () => IssueTicket,
      set: () => IssueTicket,
      readOnly: true
    },
    ticketNumber: {
      type: "string",
      readOnly: true,
      watch: ["issueNumber"],
      set: (_, {issueNumber}) => issueNumber
    },
    status: {
      type: StatusTypes,
      default: "Open",
      set: (val) => toStatusCode(val),
      get: (val) => toStatusString(val),
    },
    subject: {
      type: "string"
    },
    body: {
      type: "string"
    },
    createdAt: {
      type: "string",
      default: () => moment.utc().format()
    },
    updatedAt: {
      type: "string",
      watch: ["status"],
      set: () => moment.utc().format()
    },
  },
  indexes: {
    issue: {
      collection: "issueReview",
      pk: {
        facets: ["repoOwner", "repoName", "issueNumber"],
        field: "pk"
      },
      sk: {
        facets: [],
        field: "sk"
      }
    },
    created: {
      collection: "owned",
      index: "gsi1pk-gsi1sk-index",
      pk: {
        field: "gsi1pk",
        facets: ["username"]
      },
      sk: {
        field: "gsi1sk",
        facets: ["status", "repoOwner", "repoName",]
      }
    }, 
    todos: {
      collection: "activity",
      index: "gsi2pk-gsi2sk-index",
      pk: {
        facets: ["repoOwner", "repoName"],
        field: "gsi2pk"
      },
      sk: {
        facets: ["status", "createdAt"],
        field: "gsi2sk"
      }
    },
    _: {
      collection: "subscribers",
      index: "gsi4pk-gsi4sk-index",
      pk: {
        facets: ["repoOwner", "repoName", "ticketNumber"],
        field: "gsi4pk"
      },
      sk: {
        facets: [],
        field: "gsi4sk"
      }
    }
  }
});

export const issueComments = new Entity({
  model: {
    entity: "issueComment",
    service: "versioncontrol",
    version: "1"
  },
  attributes: {
    issueNumber: {
      type: "string",
    },
    commentId: {
      type: "string"
    },
    username: {
      type: "string"
    },
    replyTo: {
      type: "string"
    },
    replyViewed: {
      type: "string",
      default: NotYetViewed,
      get: (replyViewed) => {
        if (replyViewed !== NotYetViewed) {
          return replyViewed
        }
      },
      set: (replyViewed) => {
        if (replyViewed === undefined) {
          return NotYetViewed;
        }
        return replyViewed;
      }
    },
    repoName: {
      type: "string"
    },
    repoOwner: {
      type: "string"
    },
    body: {
      type: "string"
    },
    createdAt: {
      type: "string",
      default: () => moment.utc().format()
    },
  },
  indexes: {
    comments: {
      collection: "issueReview",
      pk: {
        facets: ["repoOwner", "repoName", "issueNumber"],
        field: "pk"
      },
      sk: {
        facets: ["commentId"],
        field: "sk"
      }
    },
    created: {
      collection: "conversations",
      index: "gsi1pk-gsi1sk-index",
      pk: {
        field: "gsi1pk",
        facets: ["username"]
      },
      sk: {
        field: "gsi1sk",
        facets: ["repoOwner", "repoName", "issueNumber"]
      }
    },
    replies: {
      collection: "inbox",
      index: "gsi2pk-gsi2sk-index",
      pk: {
        facets: ["replyTo"],
        field: "gsi2pk"
      },
      sk: {
        facets: ["createdAt", "replyViewed"],
        field: "gsi2sk"
      }
    }
  }
});