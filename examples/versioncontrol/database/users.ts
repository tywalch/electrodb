import {Entity} from "../../..";
import moment from "moment";

export const users = new Entity({
  model: {
    entity: "user",
    service: "versioncontrol",
    version: "1"
  },
  attributes: {
    username: {
      type: "string"
    },
    fullName: {
      type: "string"
    },
    photo: {
      type: "string"
    },
    bio: {
      type: "string"
    },
    location: {
      type: "string"
    },
    pinned: {
      type: "any"
    },
    createdAt: {
      type: "string",
      default: () => moment.utc().format()
    }
  },
  indexes: {
    user: {
      collection: "overview",
      pk: {
        facets: ["username"],
        field: "pk"
      },
      sk: {
        facets: [],
        field: "sk"
      }
    },
    _: {
      collection: "owned",
      index: "gsi1pk-gsi1sk-index",
      pk: {
        facets: ["username"],
        field: "gsi1pk"
      },
      sk: {
        field: "gsi1sk",
        facets: []
      }
    },
    subscriptions: {
      collection: "watching",
      index: "gsi3pk-gsi3sk-index",
      pk: {
        facets: ["username"],
        field: "gsi3pk"
      },
      sk: {
        facets: [],
        field: "gsi3sk"
      }
    }
  }
});
