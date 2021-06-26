import {Entity} from "../../../";
import moment from "moment";
import {NotYetViewed, TicketTypes, PullRequestTicket, StatusTypes, toStatusString, toStatusCode} from "./types";

export const pullRequests = new Entity({
  model: {
    entity: "pullRequest",
    service: "versioncontrol",
    version: "1"
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
      readOnly: true
    },
    ticketNumber: {
      type: "string",
      readOnly: true,
      watch: ["pullRequestNumber"],
      set: (_, {issueNumber}) => issueNumber
    },
    status: {
      type: StatusTypes,
      default: "Open",
      set: (val) => toStatusCode(val),
      get: (val) => toStatusString(val)
    },
    createdAt: {
      type: "string",
      default: () => moment.utc().format()
    },
  },
  indexes: {
    pullRequest: {
      collection: "PRReview",
      pk: {
        facets: ["repoOwner", "repoName", "pullRequestNumber"],
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
        facets: ["status", "repoOwner", "repoName"]
      }
    },
    enhancements: {
      collection: "activity",
      index: "gsi2pk-gsi2sk-index",
      pk: {
        field: "gsi2pk",
        facets: ["repoOwner", "repoName"],
      },
      sk: {
        field: "gsi2sk",
        facets: ["status", "createdAt"],
        
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

export const pullRequestComments = new Entity({
  model: {
    entity: "pullRequestComment",
    service: "versioncontrol",
    version: "1"
  },
  attributes: {
    repoName: {
      type: "string"
    },
    username: {
      type: "string"
    },
    repoOwner: {
      type: "string"
    },
    pullRequestNumber: {
      type: "string"
    },
    commentId: {
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
    createdAt: {
      type: "string",
      default: () => moment.utc().format()
    }
  },
  indexes: {
    comments: {
      collection: "PRReview",
      pk: {
        facets: ["repoOwner", "repoName", "pullRequestNumber"],
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
        facets: ["repoOwner", "repoName"]
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
    },
  }
});