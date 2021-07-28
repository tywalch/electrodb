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
        geographics: {
            index: "gsi2pk-gsi2sk-index",
            pk: {
                composite: ["location"],
                field: "gsi2pk"
            },
            sk: {
                composite: [],
                field: "gsi2sk"
            }
        },
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
            default: () => moment.utc().format(),
            readOnly: true
        },
        recentCommits: {
            type: "any"
        },
        custom: {
            type: "any"
        },
        views: {
            type: "number"
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
        },
        followers: {
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
        },
        files: {
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
}, {table, client});

const service = new Service({users, repositories});

describe("Update Item", () => {
    it("should allow operations to be all chained together", async () => {
        const repoName = uuid();
        const repoOwner = uuid();
        const createdAt = "2021-07-01";

        const recentCommits = [
            {
                sha: "8ca4d4b2",
                data: "1627158426",
                message: "fixing bug",
                views: 50
            },
            {
                sha: "25d68f54",
                data: "1627158100",
                message: "adding bug",
                views: 25
            }
        ];

        const created = await repositories
            .put({
                repoName,
                repoOwner,
                createdAt,
                recentCommits,
                about: "my about details",
                isPrivate: false,
                license: "apache-2.0",
                description: "my description",
                stars: 10,
                defaultBranch: "main",
                tags: ["tag1", "tag2"],
                custom: {
                    prop1: "abc",
                    prop2: 100,
                    prop3: 200,
                    prop4: "xyz"
                },
                followers: ["tywalch"],
                views: 99,
                files: ["index.ts", "package.json"]
            })
            .go();

        const updates = {
            prop2: 15,
            tags: "tag1",
            stars: 8,
            description: "updated description",
            files: ["README.md"],
            about: "about",
            license: "cc",
            followers: "tinkertamper",
            prop1: "def",
            recentCommitsViews: 1,
        }

        const params = repositories.update({repoName, repoOwner})
            .add({views: updates.views, followers: updates.followers})
            .subtract({stars: updates.stars})
            .append({files: updates.files})
            .set({description: updates.description})
            .remove([updates.about])
            .delete({tags: updates.tags})
            .data((attr, op) => {
                op.set(attr.custom.prop1, updates.prop1);
                op.add(attr.views, op.name(attr.custom.prop3));
                op.add(attr.recentCommits[0].views, updates.recentCommitsViews);
                op.remove(attr.recentCommits[1].message)
            })
            .params();

        expect(params).to.deep.equal({
            "UpdateExpression": "SET #stars = #stars - :stars0, #files = list_append(#files, :files0), #description = :description0, #custom.#prop1 = :custom0, #views = #views + #custom.#prop3 REMOVE #about, #recentCommits[1].#message ADD #followers :followers0, #recentCommits[0].#views :recentCommits0 DELETE #tags :tags0",
            "ExpressionAttributeNames": {
                "#followers": "followers",
                "#stars": "stars",
                "#files": "files",
                "#description": "description",
                "#about": "about",
                "#tags": "tags",
                "#custom": "custom",
                "#prop1": "prop1",
                "#views": "views",
                "#prop3": "prop3",
                "#recentCommits": "recentCommits",
                "#message": "message"
            },
            "ExpressionAttributeValues": {
                ":followers0": params.ExpressionAttributeValues[":followers0"],
                ":stars0": 8,
                ":files0": [
                    "README.md"
                ],
                ":description0": "updated description",
                ":tags0": params.ExpressionAttributeValues[":tags0"],
                ":custom0": "def",
                ":recentCommits0": 1
            },
            "TableName": "electro",
            "Key": {
                "pk": `$versioncontrol#repoowner_${repoOwner}`,
                "sk": `$alerts#repositories_1#reponame_${repoName}`
            }
        });

        await repositories.update({repoName, repoOwner})
            .add({views: updates.views, followers: updates.followers})
            .subtract({stars: updates.stars})
            .append({files: updates.files})
            .set({description: updates.description})
            .remove([updates.about])
            .delete({tags: updates.tags})
            .data((attr, op) => {
                op.set(attr.custom.prop1, updates.prop1);
                op.add(attr.views, op.name(attr.custom.prop3));
                op.add(attr.recentCommits[0].views, updates.recentCommitsViews);
                op.remove(attr.recentCommits[1].message)
            })
            .go()

        const item = await repositories.get({repoName, repoOwner}).go();

        const expected = {
            "repoOwner": repoOwner,
            "repoName": repoName,
            "custom": {
                "prop2": 100,
                "prop1": "def",
                "prop4": "xyz",
                "prop3": 200
            },
            "defaultBranch": "main",
            "description": updates.description,
            "recentCommits": [
                {
                    "data": "1627158426",
                    "message": "fixing bug",
                    "sha": "8ca4d4b2",
                    "views": created.recentCommits[0].views + updates.recentCommitsViews
                },
                {
                    "data": "1627158100",
                    "sha": "25d68f54",
                    "views": 25
                }
            ],
            "isPrivate": false,
            "stars": created.stars - updates.stars,
            "tags": [
                "tag2"
            ],
            "createdAt": createdAt,
            "license": "apache-2.0",
            "followers": [
                updates.followers,
                ...created.followers,
            ],
            "files": [
                ...created.files,
                ...updates.files,
            ],
            "views": created.views + created.custom.prop3,
            "username": repoOwner,
        }

        expect(item).to.deep.equal(expected);
    });

    describe("append operations", () => {
        it("should only allow attributes with type 'list', or 'any'", async () => {
            const repoName = uuid();
            const repoOwner = uuid();
            const err = await repositories
                .update({repoName, repoOwner})
                .append({description: "my description"})
                .go()
                .catch(err => err);

            expect(err.message).to.equal(`Invalid Update Attribute Operation: "APPEND" Operation can only be performed on attributes with type "list" or "any".`);
        });

        it("should append items to a list", async () => {
            const repoName = uuid();
            const repoOwner = uuid();
            const createdAt = "2021-07-01";
            const recentCommits = [{
                sha: "8ca4d4b2",
                data: "1627158426",
                message: "fixing bug"
            }];

            const additionalCommit = [{
                sha: "25d68f54",
                data: "1627158100",
                message: "adding bug"
            }];

            const created = await repositories
                .put({
                    repoName,
                    repoOwner,
                    createdAt,
                    recentCommits,
                    isPrivate: false,
                    license: "apache-2.0",
                    description: "my description",
                    stars: 10,
                    defaultBranch: "main",
                    tags: ["tag1", "tag2"]
                })
                .go();

            await repositories
                .update({repoName, repoOwner})
                .append({
                    recentCommits: additionalCommit
                })
                .go();

            const item = await repositories
                .get({repoName, repoOwner})
                .go();

            expect(item).to.deep.equal({
                ...created,
                recentCommits: [...recentCommits, ...additionalCommit]
            });
        });

        it("should support append being called twice in a chain", async () => {
            const repoName = uuid();
            const repoOwner = uuid();
            const createdAt = "2021-07-01";
            const firstCommit = [{
                sha: "8ca4d4b2",
                message: "fixing bug",
                timestamp: 1627158426
            }];

            const secondCommit = [{
                sha: "25d68f54",
                message: "adding bug",
                timestamp: 1627158100
            }];

            const custom = [{
                status: "started",
                timestamp: 1627158100
            }]

            const customUpdate = [{
                status: "working",
                timestamp: 1627198100
            }]

            const created = await repositories
                .put({
                    repoName,
                    repoOwner,
                    createdAt,
                    recentCommits: firstCommit,
                    custom: custom,
                    isPrivate: false,
                    license: "apache-2.0",
                    description: "my description",
                    stars: 10,
                    defaultBranch: "main",
                    tags: ["tag1", "tag2"]
                })
                .go();

            await repositories
                .update({repoName, repoOwner})
                .append({
                    recentCommits: secondCommit
                })
                .append({
                    custom: customUpdate
                })
                .go();

            const item = await repositories
                .get({repoName, repoOwner})
                .go();

            expect(item).to.deep.equal({
                ...created,
                recentCommits: [...firstCommit, ...secondCommit],
                custom: [...custom, ...customUpdate]
            });
        });

        it("should append items to a list with data method", async () => {
            const repoName = uuid();
            const repoOwner = uuid();
            const createdAt = "2021-07-01";
            const recentCommits = [{
                sha: "8ca4d4b2",
                data: "1627158426",
                message: "fixing bug"
            }];
            const additionalCommit = [{
                sha: "25d68f54",
                data: "1627158100",
                message: "adding bug"
            }];
            const created = await repositories
                .put({
                    repoName,
                    repoOwner,
                    createdAt,
                    recentCommits,
                    isPrivate: false,
                    license: "apache-2.0",
                    description: "my description",
                    stars: 10,
                    defaultBranch: "main",
                    tags: ["tag1", "tag2"]
                })
                .go();

            await repositories
                .update({repoName, repoOwner})
                .data(({recentCommits}, {append}) => append(recentCommits, additionalCommit))
                .go();

            const item = await repositories
                .get({repoName, repoOwner})
                .go();

            expect(item).to.deep.equal({
                ...created,
                recentCommits: [...recentCommits, ...additionalCommit]
            });
        });
    });
    describe("remove operations", () => {
        it("should allow for deleting all PK elements on a gsi to create a sparse index", async () => {
            const username = uuid();
            const location = uuid();

            await users.create({
                username,
                location,
                bio: "I make things.",
                fullName: "tyler walch"
            }).go();

            const itemBefore = await users.get({username}).go({raw: true});

            expect(itemBefore).to.deep.equal({
                "Item": {
                    "pk": `$versioncontrol#username_${username}`,
                    "sk": "$overview#user_1",

                    "gsi1pk": `$versioncontrol#username_${username}`,
                    "gsi1sk": "$owned#user_1",

                    "gsi2pk": `$versioncontrol#location_${location}`,
                    "gsi2sk": "$user_1",

                    "location": location,
                    "username": username,

                    "bio": "I make things.",
                    "fullName": "tyler walch",

                    "__edb_e__": "user",
                    "__edb_v__": "1"
                }
            });

            const params = users
                .update({username})
                .remove([
                    "location"
                ])
                .params();

            expect(params).to.deep.equal({
                "UpdateExpression": "REMOVE #location, #gsi2pk",
                "ExpressionAttributeNames": {
                    "#location": "location",
                    "#gsi2pk": "gsi2pk"
                },
                "TableName": "electro",
                "Key": {
                    "pk": `$versioncontrol#username_${username}`,
                    "sk": "$overview#user_1"
                }
            });

            await users
                .update({username})
                .remove([
                    "location"
                ])
                .go();

            const itemAfter = await users
                .get({username})
                .go({raw: true});

            expect(itemAfter).to.deep.equal({
                "Item": {
                    "pk": `$versioncontrol#username_${username}`,
                    "sk": "$overview#user_1",

                    "gsi1pk": `$versioncontrol#username_${username}`,
                    "gsi1sk": "$owned#user_1",

                    "gsi2sk": "$user_1",

                    "username": username,
                    "bio": "I make things.",
                    "fullName": "tyler walch",
                    "__edb_v__": "1",
                    "__edb_e__": "user"
                }
            });
        });

        it("should allow for deleting all SK elements on a gsi to create a sparse index", async () => {
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
                    email: {
                        type: "string"
                    },
                    device: {
                        type: "string"
                    },
                    bio: {
                        type: "string"
                    },
                    location: {
                        type: "string"
                    },
                    fullName: {
                        type: "string"
                    },
                },
                indexes: {
                    user: {
                        pk: {
                            composite: ["username"],
                            field: "pk"
                        },
                        sk: {
                            composite: [],
                            field: "sk"
                        }
                    },
                    approved: {
                        index: "gsi1pk-gsi1sk-index",
                        pk: {
                            composite: ["email"],
                            field: "gsi1pk"
                        },
                        sk: {
                            field: "gsi1sk",
                            composite: ["device"]
                        }
                    }
                }
            }, {table, client});
            const username = uuid();
            const location = uuid();
            const device = uuid();
            const email = uuid();

            await users.create({
                email,
                device,
                username,
                location,
                bio: "I make things.",
                fullName: "tyler walch"
            }).go();

            const itemBefore = await users.get({username}).go({raw: true});

            expect(itemBefore).to.deep.equal({
                "Item": {
                    "pk": `$versioncontrol#username_${username}`,
                    "sk": "$user_1",

                    "gsi1pk": `$versioncontrol#email_${email}`,
                    "gsi1sk": `$user_1#device_${device}`,

                    "email": email,
                    "device": device,
                    "location": location,
                    "username": username,

                    "bio": "I make things.",
                    "fullName": "tyler walch",

                    "__edb_e__": "user",
                    "__edb_v__": "1"
                }
            });

            const params = users
                .update({username})
                .remove([
                    "device"
                ])
                .params();

            expect(params).to.deep.equal({
                "UpdateExpression": "REMOVE #device, #gsi1sk",
                "ExpressionAttributeNames": {
                    "#device": "device",
                    "#gsi1sk": "gsi1sk"
                },
                "TableName": "electro",
                "Key": {
                    "pk": `$versioncontrol#username_${username}`,
                    "sk": "$user_1"
                }
            });

            await users
                .update({username})
                .remove([
                    "device"
                ])
                .go();

            const itemAfter = await users
                .get({username})
                .go({raw: true});

            expect(itemAfter).to.deep.equal({
                "Item": {
                    "pk": `$versioncontrol#username_${username}`,
                    "sk": "$user_1",

                    "gsi1pk": `$versioncontrol#email_${email}`,

                    "username": username,
                    "location": location,
                    "email": email,

                    "bio": "I make things.",
                    "fullName": "tyler walch",

                    "__edb_v__": "1",
                    "__edb_e__": "user"
                }
            });
        });

        it("should not allow for partial deletion of a gsi composite index", async () => {
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
                    email: {
                        type: "string"
                    },
                    device: {
                        type: "string"
                    },
                    bio: {
                        type: "string"
                    },
                    location: {
                        type: "string"
                    },
                    fullName: {
                        type: "string"
                    },
                },
                indexes: {
                    user: {
                        pk: {
                            composite: ["username"],
                            field: "pk"
                        },
                        sk: {
                            composite: [],
                            field: "sk"
                        }
                    },
                    approved: {
                        index: "gsi1pk-gsi1sk-index",
                        pk: {
                            composite: ["email"],
                            field: "gsi1pk"
                        },
                        sk: {
                            field: "gsi1sk",
                            composite: ["location", "device"]
                        }
                    }
                }
            }, {table, client});
            const username = uuid();
            const location = uuid();
            const device = uuid();
            const email = uuid();

            await users.create({
                email,
                device,
                username,
                location,
                bio: "I make things.",
                fullName: "tyler walch"
            }).go();

            const itemBefore = await users.get({username}).go({raw: true});

            expect(itemBefore).to.deep.equal({
                "Item": {
                    "pk": `$versioncontrol#username_${username}`,
                    "sk": "$user_1",

                    "gsi1pk": `$versioncontrol#email_${email}`,
                    "gsi1sk": `$user_1#location_${location}#device_${device}`,

                    "email": email,
                    "device": device,
                    "location": location,
                    "username": username,

                    "bio": "I make things.",
                    "fullName": "tyler walch",

                    "__edb_e__": "user",
                    "__edb_v__": "1"
                }
            });

            const error = () => users
                .update({username})
                .remove([
                    "device"
                ])
                .params();

            expect(error).to.throw(`Incomplete composite attributes: Without the composite attributes "location" the following access patterns cannot be updated: "approved"  - For more detail on this error reference: https://github.com/tywalch/electrodb#incomplete-composite-attributes`)

            const error2 = await users
                .update({username})
                .remove([
                    "location"
                ])
                .go()
                .catch(err => err);
            expect(error2.message).to.equal(`Incomplete composite attributes: Without the composite attributes "device" the following access patterns cannot be updated: "approved"  - For more detail on this error reference: https://github.com/tywalch/electrodb#incomplete-composite-attributes`);
        });

        it("should respect readOnly", async () => {
            const repoName = uuid();
            const repoOwner = uuid();

            await repositories
                .put({
                    repoName,
                    repoOwner,
                    isPrivate: false,
                })
                .go();

            const error = await repositories
                .update({repoName, repoOwner})
                .remove([ "createdAt" ])
                .go()
                .catch(err => err);
            expect(error.message).to.equal(`Attribute "createdAt" is Read-Only and cannot be updated`);
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
                    isPrivate: false,
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

        it("should remove properties from an item with data method", async () => {
            const repoName = uuid();
            const repoOwner = uuid();
            const createdAt = "2021-07-01";

            await repositories
                .put({
                    repoName,
                    repoOwner,
                    createdAt,
                    isPrivate: false,
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
                    defaultBranch: "main",
                    tags: ["tag1", "tag2"]
                })
                .go();

            await repositories
                .update({repoName, repoOwner})
                .data((a, {remove}) => {
                    remove(a.license);
                    remove(a.description);
                    remove(a.recentCommits);
                    remove(a.stars);
                    remove(a.defaultBranch);
                    remove(a.tags);
                })
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
        it("should delete a value from the Set type attribute with data method", async () => {
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
                .data(({tags}, {del}) => del(tags, "tag1"))
                .go();

            const {tags} = await repositories
                .get({repoName, repoOwner})
                .go();

            expect(tags).to.deep.equal(["tag2"]);
        });

        it("should only allow attributes with type 'set', or 'any'", async () => {
            const repoName = uuid();
            const repoOwner = uuid();

            const err = await repositories
                .update({repoName, repoOwner})
                .delete({description: "my description"})
                .go()
                .catch(err => err);

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

        it("should add 5 'stars' to the repository with the data method", async () => {
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
                .data(({stars}, {add}) => add(stars, 5))
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

            const err = await repositories
                .update({repoName, repoOwner})
                .add({description: "my description"})
                .go()
                .catch(err => err);

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

        it("should remove 3 'stars' from the repository with the data method", async () => {
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
                .data(({stars}, {subtract}) => subtract(stars, 3))
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
        it("should allow name to be passed to other operation", async () => {
            const repoName = uuid();
            const repoOwner = uuid();

            const repo = await repositories
                .create({
                    repoName,
                    repoOwner,
                    stars: 5,
                    isPrivate: false,
                    defaultBranch: "main",
                    views: 10
                })
                .go();

            expect(repo.stars).to.equal(5);

            await repositories
                .update({repoName, repoOwner})
                .data(({stars, views}, {name, add}) => add(views, name(stars)))
                .go();

            const {views} = await repositories
                .get({repoName, repoOwner})
                .go();

            expect(views).to.equal(15);
        });

        it("should only allow types", async () => {

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