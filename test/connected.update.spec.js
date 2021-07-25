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
}, {table, client});

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
        recentCommits: {
            type: "any"
        },
        custom: {
            type: "any"
        },
        tags: {
            type: "any",
            get: (value) => {
                if (value) {
                    return value.values;
                }
                return [];
            },
            set: (value) => {
                if (value) {
                    return client.createSet(value);
                }
            }
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
}, {table, client});

const service = new Service({users, repositories});

describe("Update Item", () => {
    describe("set operations", () => {

    });
    describe("append operations", () => {
        it("should only allow attributes with type 'list', or 'any'", async () => {
            const repoName = uuid();
            const repoOwner = uuid();
            let err = await repositories
                .update({repoName, repoOwner})
                .append({description: "my description"})
                .go()
                .catch(err => err)
            expect(err.message).to.equal(`Invalid Update Attribute Operation: "APPEND" Operation can only be performed on attributes with type "list" or "any".`);
        });
    });
    describe("remove operations", () => {
        it("should allow for deleting elements to create a sparse index", async () => {
            const repoName = uuid();
            const repoOwner = uuid();
            const createdAt = "2021-07-01";
            await repositories
                .create({
                    repoName,
                    repoOwner,
                    createdAt,
                    license: "apache-2.0",
                    description: "my description",
                    recentCommits: [
                        {
                            sha: "8ca4d4b2",
                            data: "1627158426",
                            message: "fixing bug"
                        },
                        {
                            sha: "25d68f54",
                            data: "1627158100",
                            message: "adding bug"
                        }
                    ],
                    stars: 10,
                    isPrivate: false,
                    defaultBranch: "main",
                    tags: ["tag1", "tag2"]
                })
                .go();

            const params = repositories
                .update({repoName, repoOwner})
                .remove([
                    "description",
                    "recentCommits",
                    "stars",
                    "defaultBranch",
                    "tags",
                    "isPrivate",
                    "createdAt"
                ])
                .params();

            await repositories
                .update({repoName, repoOwner})
                .remove([
                    "recentCommits",
                    "stars",
                    "defaultBranch",
                    "tags",
                    "isPrivate",
                    "createdAt",
                    "license"
                ])
                .go();

            const item = await repositories
                .get({repoName, repoOwner})
                .go();

            expect(item).to.deep.equal({
                repoOwner: repoOwner,
                repoName: repoName,
                username: repoOwner,
                description: "my description"
            });

            let error = await repositories
                .update({repoName, repoOwner})
                .remove([
                    "license",
                    "description",
                    "recentCommits",
                    "stars",
                    "defaultBranch",
                    "tags",
                    "isPrivate",
                    "createdAt"
                ])
                .go()
                .catch(err => err);
            expect(error.message).to.not.be.undefined;
            expect(error.message).to.equal("cannot partially impact key");
        });
        it("should respect readOnly", () => {

        });
        it("should remove properties from an item", async () => {
            const repoName = uuid();
            const repoOwner = uuid();
            const createdAt = "2021-07-01";
            await repositories
                .put({
                    repoName,
                    repoOwner,
                    createdAt,
                    license: "apache-2.0",
                    description: "my description",
                    recentCommits: [
                        {
                            sha: "8ca4d4b2",
                            data: "1627158426",
                            message: "fixing bug"
                        },
                        {
                            sha: "25d68f54",
                            data: "1627158100",
                            message: "adding bug"
                        }
                    ],
                    stars: 10,
                    isPrivate: false,
                    defaultBranch: "main",
                    tags: ["tag1", "tag2"]
                })
                .go();

            await repositories
                .update({repoName, repoOwner})
                .remove([
                    "license",
                    "description",
                    "recentCommits",
                    "stars",
                    "defaultBranch",
                    "tags",
                ])
                .go();

            const item = await repositories
                .get({repoName, repoOwner})
                .go();

            expect(item).to.deep.equal({
                createdAt,
                repoOwner,
                repoName,
                username: repoOwner,
                isPrivate: false,
            });
        });
    });
    describe("delete operations", () => {
        it("should delete a value from the Set type attribute", async () => {
            const repoName = uuid();
            const repoOwner = uuid();
            await repositories
                .create({
                    repoName,
                    repoOwner,
                    stars: 10,
                    isPrivate: false,
                    defaultBranch: "main",
                    tags: ["tag1", "tag2"]
                })
                .go();
            await repositories
                .update({repoName, repoOwner})
                .delete({tags: "tag1"})
                .go();
            const {tags} = await repositories
                .get({repoName, repoOwner})
                .go();
            expect(tags).to.deep.equal(["tag2"]);
        });
        it("should only allow attributes with type 'set', or 'any'", async () => {
            const repoName = uuid();
            const repoOwner = uuid();
            let err = await repositories
                .update({repoName, repoOwner})
                .delete({description: "my description"})
                .go()
                .catch(err => err)
            expect(err.message).to.equal(`Invalid Update Attribute Operation: "DELETE" Operation can only be performed on attributes with type "set" or "any".`);
        });
    });
    describe("add operations", () => {
        it("should increment the 'stars' property", async () => {
            const repoName = uuid();
            const repoOwner = uuid();
            const repo = await repositories
                .create({
                    repoName,
                    repoOwner,
                    isPrivate: false,
                    defaultBranch: "main",
                })
                .go();
            expect(repo.stars).to.equal(0);
            await repositories
                .update({repoName, repoOwner})
                .add({stars: 1})
                .go();
            const {stars} = await repositories
                .get({repoName, repoOwner})
                .go();
            expect(stars).to.equal(1);
        });
        it("should add 5 'stars' to the repository", async () => {
            const repoName = uuid();
            const repoOwner = uuid();
            const repo = await repositories
                .create({
                    repoName,
                    repoOwner,
                    stars: 10,
                    isPrivate: false,
                    defaultBranch: "main",
                })
                .go();
            expect(repo.stars).to.equal(10);
            await repositories
                .update({repoName, repoOwner})
                .add({stars: 5})
                .go();
            const {stars} = await repositories
                .get({repoName, repoOwner})
                .go();
            expect(stars).to.equal(15);
        });

        it("should add an item to the tags property Set", async () => {
            const repoName = uuid();
            const repoOwner = uuid();
            await repositories
                .create({
                    repoName,
                    repoOwner,
                    stars: 10,
                    isPrivate: false,
                    defaultBranch: "main",
                    tags: ["tag1", "tag2"]
                })
                .go();
            await repositories
                .update({repoName, repoOwner})
                .add({tags: "tag3"})
                .go();
            const {tags} = await repositories
                .get({repoName, repoOwner})
                .go();
            expect(tags).to.deep.equal(["tag1", "tag2", "tag3"]);
        });

        it("should only allow attributes with type 'number', 'set' or 'any'", async () => {
            const repoName = uuid();
            const repoOwner = uuid();
            let err = await repositories
                .update({repoName, repoOwner})
                .add({description: "my description"})
                .go()
                .catch(err => err)
            expect(err.message).to.equal(`Invalid Update Attribute Operation: "ADD" Operation can only be performed on attributes with type "number", "set", or "any".`);
        });
    });
    describe("subtract operations", () => {
        it("should decrement the 'stars' property", async () => {
            const repoName = uuid();
            const repoOwner = uuid();
            const repo = await repositories
                .create({
                    repoName,
                    repoOwner,
                    stars: 5,
                    isPrivate: false,
                    defaultBranch: "main",
                })
                .go();
            expect(repo.stars).to.equal(5);
            await repositories
                .update({repoName, repoOwner})
                .subtract({stars: 1})
                .go();
            const {stars} = await repositories
                .get({repoName, repoOwner})
                .go();
            expect(stars).to.equal(4);
        });

        it("should remove 3 'stars' from the repository", async () => {
            const repoName = uuid();
            const repoOwner = uuid();
            const repo = await repositories
                .create({
                    repoName,
                    repoOwner,
                    stars: 5,
                    isPrivate: false,
                    defaultBranch: "main",
                })
                .go();
            expect(repo.stars).to.equal(5);
            await repositories
                .update({repoName, repoOwner})
                .subtract({stars: 3})
                .go();
            const {stars} = await repositories
                .get({repoName, repoOwner})
                .go();
            expect(stars).to.equal(2);
        });
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