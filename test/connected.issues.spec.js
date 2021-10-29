process.env.AWS_NODEJS_CONNECTION_REUSE_ENABLED = 1;
const DynamoDB = require("aws-sdk/clients/dynamodb");
const uuid = require("uuid").v4;
const { expect } = require("chai");
const { Entity } = require("../");
const table = "electro";
const client = new DynamoDB.DocumentClient({
    region: "us-east-1",
    endpoint: process.env.LOCAL_DYNAMO_ENDPOINT
});

describe("Issue #85", () => {
    it("should upsert and retrieve record with the update method", async () => {
        const txn = new Entity({
            model: {
                version: "1",
                service: "transactions",
                entity: "transaction",
            },
            attributes: {
                accountId: {
                    type: "string",
                },
                transactionId: {
                    type: "string",
                },
                amount: {
                    type: "number",
                },
            },
            indexes: {
                transaction: {
                    pk: {
                        field: "pk",
                        composite: ["accountId"],
                    },
                    sk: {
                        field: "sk",
                        composite: ["transactionId"],
                    },
                },
            },
        }, {table, client});

        const transaction = {
            accountId: uuid(),
            transactionId: uuid(),
        };

        const updates = {
            amount: 25
        }

        const item = {
            ...updates,
            ...transaction,
        }

        const updated = await txn.update(transaction).set(updates).go({response: "all_new"});
        expect(updated).to.deep.equal(item);
        const result = await txn.get(transaction).go();
        expect(result).to.deep.equal(item);
    });

    it("should add entity instances", () => {
        const tasks = new Entity(
            {
                model: {
                    entity: "tasks",
                    version: "1",
                    service: "taskapp"
                },
                attributes: {
                    team: {
                        type: "string",
                        required: true
                    },
                    task: {
                        type: "string",
                        required: true
                    },
                    project: {
                        type: "string",
                        required: true
                    },
                    user: {
                        type: "string",
                        required: true
                    },
                    title: {
                        type: "string",
                        required: true,
                    },
                    // lowercased version of title for user search
                    titleLowerCase: {
                        type: "string",
                        // trigger when title is put/updated
                        watch: ["title"],
                        // hidden so it is not returned to the user
                        hidden: true,
                        set: (_, {title}) => {
                            if (typeof title === "string") {
                                return title.toLowerCase();
                            }
                            // returning undefined skips value from update
                            return undefined;
                        }
                    },
                    description: {
                        type: "string"
                    },
                    status: {
                        // use an array to type an enum
                        type: ["open", "in-progress", "on-hold", "closed"],
                        default: "open"
                    },
                    points: {
                        type: "number",
                    },
                    tags: {
                        type: "set",
                        items: "string"
                    },
                    comments: {
                        type: "list",
                        items: {
                            type: "map",
                            properties: {
                                user: {
                                    type: "string"
                                },
                                body: {
                                    type: "string"
                                }
                            }
                        }
                    },
                    closed: {
                        type: "string",
                        // watch for changes to status
                        watch: ["status"],
                        readOnly: true,
                        set: (_, {status}) => {
                            // return YYYY-MM-DD if status is closed
                            if (status === "closed") {
                                const d = new Date();
                                return [
                                    d.getFullYear(),
                                    ('0' + (d.getMonth() + 1)).slice(-2),
                                    ('0' + d.getDate()).slice(-2)
                                ].join('-');
                            } else {
                                return "";
                            }
                        },
                    },
                    createdAt: {
                        type: "number",
                        default: () => Date.now(),
                        // cannot be modified after created
                        readOnly: true
                    },
                    updatedAt: {
                        type: "number",
                        // watch for changes to any attribute
                        watch: "*",
                        // set current timestamp when updated
                        set: () => 12345,
                        readOnly: true
                    }
                },
                indexes: {
                    projects: {
                        pk: {
                            field: "pk",
                            composite: ["team"]
                        },
                        sk: {
                            field: "sk",
                            // create composite keys for partial sort key queries
                            composite: ["project", "task"]
                        }
                    },
                    assigned: {
                        // collections allow for queries across multiple entities
                        collection: "assignments",
                        index: "gsi1pk-gsi1sk-index",
                        pk: {
                            // map to your GSI Hash/Partition key
                            field: "gsi1pk",
                            composite: ["user"]
                        },
                        sk: {
                            // map to your GSI Range/Sort key
                            field: "gsi1sk",
                            composite: ["status"]
                        }
                    },
                    backlog: {
                        // map to the GSI name on your DynamoDB table
                        index: "gsi2pk-gsi2sk-index",
                        pk: {
                            field: "gsi2pk",
                            composite: ["project"]
                        },
                        sk: {
                            field: "gsi2sk",
                            composite: ["team", "closed"],
                        }
                    }
                }
            },
            { table }
        );

        const team = "green";
        const user = "d.huynh";
        const project = "core";
        const task = "45-6620";

        const comment = {
            user: "janet",
            body: "This seems half-baked."
        };

        const params = tasks
            .update({ task, project, team })
            .set({ status: "on-hold" })
            .add({ tags: ["half-baked"] })
            .append({ comments: [comment] })
            .where(( {status}, {eq} ) => eq(status, "in-progress"))
            .params();

        expect(JSON.parse(JSON.stringify(params))).to.deep.equal({
            "UpdateExpression": "SET #status = :status_u0, #comments = list_append(#comments, :comments_u0), #closed = :closed_u0, #updatedAt = :updatedAt_u0, #gsi1sk = :gsi1sk_u0, #gsi2sk = :gsi2sk_u0, #team = :team_u0, #project = :project_u0, #task = :task_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0 ADD #tags :tags_u0",
            "ExpressionAttributeNames": {
                "#status": "status",
                "#tags": "tags",
                "#comments": "comments",
                "#closed": "closed",
                "#updatedAt": "updatedAt",
                "#gsi1sk": "gsi1sk",
                "#gsi2sk": "gsi2sk",
                "#team": "team",
                "#project": "project",
                "#task": "task",
                "#__edb_e__": "__edb_e__",
                "#__edb_v__": "__edb_v__"
            },
            "ExpressionAttributeValues": {
                ":status0": "in-progress",
                ":status_u0": "on-hold",
                ":tags_u0": [
                    "half-baked"
                ],
                ":comments_u0": [
                    {
                        "user": "janet",
                        "body": "This seems half-baked."
                    }
                ],
                ":closed_u0": "",
                ":updatedAt_u0": 12345,
                ":gsi1sk_u0": "$assignments#tasks_1#status_on-hold",
                ":gsi2sk_u0": "$tasks_1#team_green#closed_",
                ":team_u0": "green",
                ":project_u0": "core",
                ":task_u0": "45-6620",
                ":__edb_e___u0": "tasks",
                ":__edb_v___u0": "1"
            },
            "TableName": "electro",
            "Key": {
                "pk": "$taskapp#team_green",
                "sk": "$tasks_1#project_core#task_45-6620"
            },
            "ConditionExpression": "#status = :status0"
        });
    })
});