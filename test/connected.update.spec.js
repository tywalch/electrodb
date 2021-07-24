process.env.AWS_NODEJS_CONNECTION_REUSE_ENABLED = 1;
const { Entity } = require("../src/entity");
const { Service } = require("../src/service");
const { expect } = require("chai");
const uuid = require("uuid").v4;
const moment = require("moment");
const DynamoDB = require("aws-sdk/clients/dynamodb");
const client = new DynamoDB.DocumentClient({
    region: "us-east-1",
    endpoint: process.env.LOCAL_DYNAMO_ENDPOINT
});
const table = "electro";

const users = new Entity({
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

const licenses = [
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
];

const repositories = new Entity({
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
        stars: {
          type: "number",
          default: 0
        },
        createdAt: {
            type: "string",
            default: () => moment.utc().format()
        },
        followers: {
            type: "any"
        },
        custom: {
            type: "any"
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

const service = new Service({users, repositories});

describe("Update Item", () => {
    describe("set operations", () => {

    });
    describe("append operations", () => {
        it("should only allow types", () => {

        });
    });
    describe("remove operations", () => {
        it("should only allow types", () => {

        });
    });
    describe("delete operations", () => {
        it("should only allow types", () => {

        });
    });
    describe("add operations", () => {
        it("should only allow types", () => {

        });
    });
    describe("subtract operations", () => {
        it("should only allow types", () => {

        });
    });
    describe("name operation", () => {
        it("should only allow types", () => {

        });
    });
    describe("value operation", () => {
        it("should only allow types", () => {

        });
    });
    describe("nested operations", () => {
        it("should only allow types", () => {

        });
    });
    // todo: diy format operations?

});