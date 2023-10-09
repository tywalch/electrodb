process.env.AWS_NODEJS_CONNECTION_REUSE_ENABLED = "1";
import DynamoDB, { DocumentClient } from "aws-sdk/clients/dynamodb";
import { v4 as uuid } from 'uuid';
import { Entity } from '../../';
import { createTable } from './createTable';

const configuration = {
    endpoint: "http://localhost:8000",
    region: "us-east-1",
};

const client = new DocumentClient(configuration);
const dynamodb = new DynamoDB(configuration);

// random table name
const table = uuid();

const User = new Entity(
    {
        model: {
            entity: "user",
            service: "app",
            version: "1"
        },
        attributes: {
            team: {
                type: "string"
            },
            user: {
                type: "string"
            },
            firstName: {
                type: "string"
            },
            lastName: {
                type: "string"
            }
        },
        indexes: {
            members: {
                collection: "organization",
                pk: {
                    composite: ["team"],
                    field: "pk"
                },
                sk: {
                    composite: ["user"],
                    field: "sk"
                }
            },
            user: {
                collection: "assignments",
                index: "gsi1pk-gsi1sk-index",
                pk: {
                    composite: ["user"],
                    field: "gsi1pk"
                },
                sk: {
                    field: "gsi1sk",
                    composite: []
                }
            }
        }
    },
    { table, client }
);

async function main() {
    console.log("Creating table: '%s'", table);

    await createTable({
        dynamodb,
        tableName: table,
        dropOnExists: false,
        schema: User.schema,
    });

    await User.create({
        team: "team-1",
        user: "user-1",
        firstName: "John",
        lastName: "Doe",
    }).go();

    const user = await User.get({
        team: "team-1",
        user: "user-1",
    }).go();

    console.log('%o', { user });
}

main().catch(err => console.error(err));