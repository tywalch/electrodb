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
      default: () => moment.utc().format(),
      readOnly: true,
    },
    updatedAt: {
      type: "string",
      watch: ["*"],
      set: () => moment.utc().format(),
      readOnly: true,
    },
    following: {
      type: "set",
      items: "string"
    },
    followers: {
      type: "set",
      items: "string"
    }
  },
  indexes: {
    user: {
      collection: "overview",
      pk: {
        composite: ["username"],
        field: "pk"
      },
      sk: {
        composite: [],
        field: "sk"
      }
    },
    _: {
      collection: "owned",
      index: "gsi1pk-gsi1sk-index",
      pk: {
        composite: ["username"],
        field: "gsi1pk"
      },
      sk: {
        field: "gsi1sk",
        composite: []
      }
    },
    subscriptions: {
      collection: "watching",
      index: "gsi3pk-gsi3sk-index",
      pk: {
        composite: ["username"],
        field: "gsi3pk"
      },
      sk: {
        composite: [],
        field: "gsi3sk"
      }
    }
  }
});
