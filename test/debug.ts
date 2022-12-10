import DynamoDB from "aws-sdk/clients/dynamodb";
import { v4 as uuid } from 'uuid';
import { Entity } from "../index";

const client = new DynamoDB.DocumentClient({
    region: "us-east-1",
    endpoint: 'http://localhost:8000'
});

const table = "electro";

const tasks = new Entity(
    {
        model: {
            entity: "tasks",
            version: "1",
            service: "taskapp",
        },
        attributes: {
            team: {
                type: "string",
                required: true,
            },
            task: {
                type: "string",
                required: true,
            },
            project: {
                type: "string",
                required: true,
            },
            user: {
                type: "string",
                required: true,
            },
            title: {
                type: "string",
                required: true,
            },
            description: {
                type: "string",
            },
            status: {
                // use an array to type an enum
                type: ["open", "in-progress", "on-hold", "closed"],
                default: "open",
            },
            points: {
                type: "number",
            },
            tags: {
                type: "set",
                items: "string",
            },
            comments: {
                type: "list",
                items: {
                    type: "map",
                    properties: {
                        user: {
                            type: "string",
                        },
                        body: {
                            type: "string",
                        },
                    },
                },
            },
            closed: {
                type: "string",
                validate: /[0-9]{4}-[0-9]{2}-[0-9]{2}/,
            },
            createdAt: {
                type: "number",
                default: () => Date.now(),
                // cannot be modified after created
                readOnly: true,
            },
            updatedAt: {
                type: "number",
                // watch for changes to any attribute
                watch: "*",
                // set current timestamp when updated
                set: () => Date.now(),
                readOnly: true,
            },
        },
        indexes: {
            projects: {
                pk: {
                    field: "pk",
                    composite: ["team"],
                },
                sk: {
                    field: "sk",
                    // create composite keys for partial sort key queries
                    composite: ["project", "task"],
                },
            },
            assigned: {
                // collections allow for queries across multiple entities
                collection: "assignments",
                index: "gsi1pk-gsi1sk-index",
                pk: {
                    // map to your GSI Hash/Partition key
                    field: "gsi1pk",
                    composite: ["user"],
                },
                sk: {
                    // map to your GSI Range/Sort key
                    field: "gsi1sk",
                    composite: ["status"],
                },
            },
            backlog: {
                // map to the GSI name on your DynamoDB table
                index: "gsi2pk-gsi2sk-index",
                pk: {
                    field: "gsi2pk",
                    composite: ["project"],
                },
                sk: {
                    field: "gsi2sk",
                    composite: ["team", "closed"],
                },
            },
        },
    },
    { table }
);





async function main() {
    const team = "green";
    const user = "d.huynh";
    const project = "core";
    const task = "45-6620";

    // this works
    const params1 = tasks
        .update({ task, project, team })
        .remove(["description"])
        .params();
    console.log(params1);

// this does not work
// ElectroError: Incomplete or invalid key composite attributes supplied. Missing properties: "team"
    const params2 = tasks
        .patch({ task, project, team })
        .remove(["description"])
        .params();
    console.log(params2);
}

main().catch(console.log);