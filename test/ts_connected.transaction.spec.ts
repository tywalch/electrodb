process.env.AWS_NODEJS_CONNECTION_REUSE_ENABLED = "1";
import { DocumentClient as V2Client } from "aws-sdk/clients/dynamodb";
import { DynamoDBClient as V3Client } from "@aws-sdk/client-dynamodb";
import { expect } from "chai";
import { v4 as uuid } from "uuid";
import { Entity, Service, CreateEntityItem } from "../index";

type CreateServiceOptions = {
  client: V2Client | V3Client;
  table: string;
  serviceName: string;
};

function createUniqueConstraintService(options: CreateServiceOptions) {
  const { serviceName, table, client } = options;
  const agent = new Entity(
    {
      model: {
        entity: "agent",
        version: "1",
        service: serviceName,
      },
      attributes: {
        id: {
          type: "string",
        },
        callSign: {
          type: "string",
          required: true,
        },
        email: {
          type: "string",
          required: true,
        },
        fullName: {
          type: "string",
        },
        phoneNumber: {
          type: "string",
        },
        handler: {
          type: "string",
        },
        isHandler: {
          type: "boolean",
        },
      },
      indexes: {
        projects: {
          pk: {
            field: "pk",
            composite: ["id"],
          },
          sk: {
            field: "sk",
            // create composite keys for partial sort key queries
            composite: [],
          },
        },
      },
    },
    { table, client },
  );

  // entity that owns unique constraints
  const uniqueConstraint = new Entity(
    {
      model: {
        entity: "unique",
        version: "1",
        service: serviceName,
      },
      attributes: {
        name: {
          type: "string",
          required: true,
        },
        value: {
          type: "string",
          required: true,
        },
        entity: {
          type: "string",
          required: true,
        },
        meta: {
          type: "any",
        },
      },
      indexes: {
        value: {
          pk: {
            field: "pk",
            composite: ["value"],
          },
          sk: {
            field: "sk",
            composite: ["name", "entity"],
          },
        },
      },
    },
    { table, client },
  );

  const service = new Service({ uniqueConstraint, agent });

  return {
    uniqueConstraint,
    service,
    agent,
  };
}

function createTeamService(options: CreateServiceOptions) {
  const { client, table, serviceName } = options;
  const task = new Entity(
    {
      model: {
        entity: "task",
        service: serviceName,
        version: "1",
      },
      attributes: {
        title: {
          type: "string",
        },
        description: {
          type: "string",
        },
        taskId: {
          type: "string",
        },
        projectId: {
          type: "string",
        },
        teamId: {
          type: "string",
        },
      },
      indexes: {
        projects: {
          collection: "assigned",
          pk: {
            field: "pk",
            composite: ["teamId"],
          },
          sk: {
            field: "sk",
            composite: ["projectId", "taskId"],
          },
        },
      },
    },
    { client, table },
  );
  const team = new Entity(
    {
      model: {
        entity: "team",
        service: serviceName,
        version: "1",
      },
      attributes: {
        teamName: {
          type: "string",
        },
        teamId: {
          type: "string",
        },
        teamLead: {
          type: "string",
        },
        department: {
          type: "string",
        },
      },
      indexes: {
        team: {
          collection: "assigned",
          pk: {
            field: "pk",
            composite: ["teamId"],
          },
          sk: {
            field: "sk",
            composite: [],
          },
        },
      },
    },
    { client, table },
  );

  const service = new Service({ team, task });

  return {
    service,
    team,
    task,
  };
}

const c = require("../src/client");

const v2Client = new V2Client({
  region: "us-east-1",
  endpoint: process.env.LOCAL_DYNAMO_ENDPOINT,
});

const v3Client = new V3Client({
  region: "us-east-1",
  endpoint: process.env.LOCAL_DYNAMO_ENDPOINT,
});

const clients = [
  { type: c.DocumentClientVersions.v2, client: v2Client } as const,
  { type: c.DocumentClientVersions.v3, client: v3Client } as const,
];

const table = "electro";

describe("service transactions", () => {
  for (const { client, type } of clients) {
    describe(`with ${type} client`, () => {
      describe("transactGet", () => {
        it(`should create parameters`, () => {
          const serviceName = "test-service";
          const taskId = "t-0001";
          const teamId = "started-at-the-bottoms";
          const projectId = "o-0001";

          const { service } = createTeamService({
            table,
            client,
            serviceName,
          });

          const params = service.transaction
            .get(({ team, task }) => [
              team.get({ teamId }).commit(),
              task.get({ taskId, teamId, projectId }).commit(),
            ])
            .params();

          expect(params).to.deep.equal({
            TransactItems: [
              {
                Get: {
                  Key: {
                    pk: "$test-service#teamid_started-at-the-bottoms",
                    sk: "$assigned#team_1",
                  },
                  TableName: "electro",
                },
              },
              {
                Get: {
                  Key: {
                    pk: "$test-service#teamid_started-at-the-bottoms",
                    sk: "$assigned#task_1#projectid_o-0001#taskid_t-0001",
                  },
                  TableName: "electro",
                },
              },
            ],
          });
        });

        it(`should accept a request token on transaction requests`, async () => {
          const serviceName = uuid();
          const taskId = "t-0001";
          const teamId = "started-at-the-bottoms";
          const projectId = "o-0001";
          const teamLead = "patrick.star";
          const teamName = "Started at the Bottoms";
          const department = "back-house";
          const title = "Make Crabby Patty";
          const description = "Create the most delicious burger ever made";
          const token = uuid();
          const { service, team, task } = createTeamService({
            table,
            client,
            serviceName,
          });

          const params = service.transaction
            .get(({ team, task }) => [
              team.get({ teamId }).commit(),
              task.get({ taskId, teamId, projectId }).commit(),
            ])
            .params({ token });

          expect(params).to.deep.equal({
            TransactItems: [
              {
                Get: {
                  Key: {
                    pk: `$${serviceName}#teamid_started-at-the-bottoms`,
                    sk: "$assigned#team_1",
                  },
                  TableName: "electro",
                },
              },
              {
                Get: {
                  Key: {
                    pk: `$${serviceName}#teamid_started-at-the-bottoms`,
                    sk: "$assigned#task_1#projectid_o-0001#taskid_t-0001",
                  },
                  TableName: "electro",
                },
              },
            ],
            ClientRequestToken: token,
          });

          await team.put({ teamLead, teamId, teamName, department }).go();
          await task
            .put({ taskId, teamId, projectId, description, title })
            .go();

          const result1 = await service.transaction
            .get(({ team, task }) => [
              team.get({ teamId }).commit(),
              task.get({ taskId, teamId, projectId }).commit(),
            ])
            .go({ token });

          const result2 = await service.transaction
            .get(({ team, task }) => [
              team.get({ teamId }).commit(),
              task.get({ taskId, teamId, projectId }).commit(),
            ])
            .go({ token });

          expect(result1).to.deep.equal(result2);
        });

        it("should perform transaction operation", async () => {
          const serviceName = uuid();
          const taskId = "t-0001";
          const teamId = "started-at-the-bottoms";
          const projectId = "o-0001";
          const teamLead = "patrick.star";
          const teamName = "Started at the Bottoms";
          const department = "back-house";
          const title = "Make Crabby Patty";
          const description = "Create the most delicious burger ever made";
          const { service, team, task } = createTeamService({
            table,
            client,
            serviceName,
          });

          const getTeamAndTask = async (options: {
            taskId: string;
            teamId: string;
            projectId: string;
          }) => {
            const { taskId, teamId, projectId } = options;
            return service.transaction
              .get(({ task, team }) => [
                task.get({ taskId, teamId, projectId }).commit(),
                team.get({ teamId }).commit(),
              ])
              .go();
          };

          const get1 = await getTeamAndTask({ taskId, teamId, projectId });
          expect(get1).to.deep.equal({
            data: [
              {
                rejected: false,
                item: null,
              },
              {
                rejected: false,
                item: null,
              },
            ],
            canceled: false,
          });

          await task
            .put({ taskId, teamId, projectId, description, title })
            .go();

          const get2 = await getTeamAndTask({ taskId, teamId, projectId });
          expect(get2).to.deep.equal({
            data: [
              {
                rejected: false,
                item: {
                  teamId: "started-at-the-bottoms",
                  description: "Create the most delicious burger ever made",
                  title: "Make Crabby Patty",
                  projectId: "o-0001",
                  taskId: "t-0001",
                },
              },
              {
                rejected: false,
                item: null,
              },
            ],
            canceled: false,
          });

          await team.put({ teamLead, teamId, teamName, department }).go();

          const get3 = await getTeamAndTask({ taskId, teamId, projectId });
          expect(get3).to.deep.equal({
            data: [
              {
                rejected: false,
                item: {
                  teamId: "started-at-the-bottoms",
                  description: "Create the most delicious burger ever made",
                  title: "Make Crabby Patty",
                  projectId: "o-0001",
                  taskId: "t-0001",
                },
              },
              {
                rejected: false,
                item: {
                  teamName: "Started at the Bottoms",
                  teamId: "started-at-the-bottoms",
                  department: "back-house",
                  teamLead: "patrick.star",
                },
              },
            ],
            canceled: false,
          });
        });

        it("should accept an empty array without throwing and simply return an empty array back", async () => {
          const serviceName = uuid();
          const { service } = createTeamService({
            table,
            client,
            serviceName,
          });

          const results = await service.transaction.get(() => []).go();

          expect(results).to.deep.equal({
            canceled: false,
            data: [],
          });
        });
      });

      describe("transactWrite", () => {
        it(`should create parameters`, () => {
          const serviceName = "test-service";
          const taskId = "task0001";
          const title = "Make Crabby Patty";
          const teamId = "started-at-the-bottoms";
          const projectId = "Order#123";
          const description = "Create the most delicious burger ever made";
          const teamLead = "patrick.star";
          const teamName = "Started at the Bottoms";
          const department = "back-house";
          const { service } = createTeamService({
            table,
            client,
            serviceName,
          });
          const params = service.transaction
            .write(({ task, team }) => [
              task
                .put({ taskId, title, teamId, projectId, description })
                .where(
                  (attr, op) => `
                       ${op.notExists(attr.title)}
                   `,
                )
                .commit(),
              task
                .create({ taskId, title, teamId, projectId, description })
                .where(
                  (attr, op) => `
                       ${op.notExists(attr.title)}
                   `,
                )
                .commit(),
              task
                .upsert({ taskId, title, teamId, projectId, description })
                .where(
                  (attr, op) => `
                       ${op.notExists(attr.title)}
                   `,
                )
                .commit(),
              task
                .update({ taskId, teamId, projectId })
                .set({ title })
                .where(
                  (attr, op) => `
                       ${op.notExists(attr.title)}
                   `,
                )
                .commit(),
              task
                .patch({ taskId, teamId, projectId })
                .set({ title })
                .where(
                  (attr, op) => `
                       ${op.notExists(attr.title)}
                   `,
                )
                .commit(),
              task
                .delete({ taskId, teamId, projectId })
                .where(
                  (attr, op) => `
                       ${op.notExists(attr.title)}
                   `,
                )
                .commit(),
              task
                .remove({ taskId, teamId, projectId })
                .where(
                  (attr, op) => `
                       ${op.notExists(attr.title)}
                   `,
                )
                .commit(),
              task
                .check({ taskId, teamId, projectId })
                .where(
                  (attr, op) => `
                       ${op.notExists(attr.title)}
                   `,
                )
                .commit(),

              team
                .put({ teamId, teamLead, teamName, department })
                .where(
                  (attr, op) => `
                       ${op.notExists(attr.teamLead)}
                   `,
                )
                .commit(),
              team
                .create({ teamId, teamLead, teamName, department })
                .where(
                  (attr, op) => `
                       ${op.notExists(attr.teamLead)}
                   `,
                )
                .commit(),
              team
                .upsert({ teamId, teamLead, teamName, department })
                .where(
                  (attr, op) => `
                       ${op.notExists(attr.teamLead)}
                   `,
                )
                .commit(),
              team
                .update({ teamId })
                .set({ teamLead })
                .where(
                  (attr, op) => `
                       ${op.notExists(attr.teamLead)}
                   `,
                )
                .commit(),
              team
                .patch({ teamId })
                .set({ teamLead })
                .where(
                  (attr, op) => `
                       ${op.notExists(attr.teamLead)}
                   `,
                )
                .commit(),
              team
                .delete({ teamId })
                .where(
                  (attr, op) => `
                       ${op.notExists(attr.teamLead)}
                   `,
                )
                .commit(),
              team
                .remove({ teamId })
                .where(
                  (attr, op) => `
                       ${op.notExists(attr.teamLead)}
                   `,
                )
                .commit(),
              team
                .check({ teamId })
                .where(
                  (attr, op) => `
                       ${op.notExists(attr.teamLead)}
                   `,
                )
                .commit(),
            ])
            .params();

          expect(params).to.deep.equal({
            TransactItems: [
              {
                Put: {
                  Item: {
                    title: "Make Crabby Patty",
                    description: "Create the most delicious burger ever made",
                    taskId: "task0001",
                    projectId: "Order#123",
                    teamId: "started-at-the-bottoms",
                    pk: "$test-service#teamid_started-at-the-bottoms",
                    sk: "$assigned#task_1#projectid_order#123#taskid_task0001",
                    __edb_e__: "task",
                    __edb_v__: "1",
                  },
                  TableName: "electro",
                  ConditionExpression: "attribute_not_exists(#title)",
                  ExpressionAttributeNames: { "#title": "title" },
                },
              },
              {
                Put: {
                  Item: {
                    title: "Make Crabby Patty",
                    description: "Create the most delicious burger ever made",
                    taskId: "task0001",
                    projectId: "Order#123",
                    teamId: "started-at-the-bottoms",
                    pk: "$test-service#teamid_started-at-the-bottoms",
                    sk: "$assigned#task_1#projectid_order#123#taskid_task0001",
                    __edb_e__: "task",
                    __edb_v__: "1",
                  },
                  TableName: "electro",
                  ConditionExpression:
                    "attribute_not_exists(#pk) AND attribute_not_exists(#sk) AND attribute_not_exists(#title)",
                  ExpressionAttributeNames: {
                    "#pk": "pk",
                    "#sk": "sk",
                    "#title": "title",
                  },
                },
              },
              {
                Update: {
                  TableName: "electro",
                  UpdateExpression:
                    "SET #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0, #title = :title_u0, #description = :description_u0, #taskId = :taskId_u0, #projectId = :projectId_u0, #teamId = :teamId_u0",
                  ExpressionAttributeNames: {
                    "#title": "title",
                    "#__edb_e__": "__edb_e__",
                    "#__edb_v__": "__edb_v__",
                    "#description": "description",
                    "#taskId": "taskId",
                    "#projectId": "projectId",
                    "#teamId": "teamId",
                  },
                  ExpressionAttributeValues: {
                    ":__edb_e___u0": "task",
                    ":__edb_v___u0": "1",
                    ":title_u0": "Make Crabby Patty",
                    ":description_u0":
                      "Create the most delicious burger ever made",
                    ":taskId_u0": "task0001",
                    ":projectId_u0": "Order#123",
                    ":teamId_u0": "started-at-the-bottoms",
                  },
                  Key: {
                    pk: "$test-service#teamid_started-at-the-bottoms",
                    sk: "$assigned#task_1#projectid_order#123#taskid_task0001",
                  },
                  ConditionExpression: "attribute_not_exists(#title)",
                },
              },
              {
                Update: {
                  UpdateExpression:
                    "SET #title = :title_u0, #teamId = :teamId_u0, #projectId = :projectId_u0, #taskId = :taskId_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0",
                  ExpressionAttributeNames: {
                    "#title": "title",
                    "#teamId": "teamId",
                    "#projectId": "projectId",
                    "#taskId": "taskId",
                    "#__edb_e__": "__edb_e__",
                    "#__edb_v__": "__edb_v__",
                  },
                  ExpressionAttributeValues: {
                    ":title_u0": "Make Crabby Patty",
                    ":teamId_u0": "started-at-the-bottoms",
                    ":projectId_u0": "Order#123",
                    ":taskId_u0": "task0001",
                    ":__edb_e___u0": "task",
                    ":__edb_v___u0": "1",
                  },
                  TableName: "electro",
                  Key: {
                    pk: "$test-service#teamid_started-at-the-bottoms",
                    sk: "$assigned#task_1#projectid_order#123#taskid_task0001",
                  },
                  ConditionExpression: "attribute_not_exists(#title)",
                },
              },
              {
                Update: {
                  UpdateExpression:
                    "SET #title = :title_u0, #teamId = :teamId_u0, #projectId = :projectId_u0, #taskId = :taskId_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0",
                  ExpressionAttributeNames: {
                    "#pk": "pk",
                    "#sk": "sk",
                    "#title": "title",
                    "#teamId": "teamId",
                    "#projectId": "projectId",
                    "#taskId": "taskId",
                    "#__edb_e__": "__edb_e__",
                    "#__edb_v__": "__edb_v__",
                  },
                  ExpressionAttributeValues: {
                    ":title_u0": "Make Crabby Patty",
                    ":teamId_u0": "started-at-the-bottoms",
                    ":projectId_u0": "Order#123",
                    ":taskId_u0": "task0001",
                    ":__edb_e___u0": "task",
                    ":__edb_v___u0": "1",
                  },
                  TableName: "electro",
                  Key: {
                    pk: "$test-service#teamid_started-at-the-bottoms",
                    sk: "$assigned#task_1#projectid_order#123#taskid_task0001",
                  },
                  ConditionExpression:
                    "attribute_exists(#pk) AND attribute_exists(#sk) AND attribute_not_exists(#title)",
                },
              },
              {
                Delete: {
                  Key: {
                    pk: "$test-service#teamid_started-at-the-bottoms",
                    sk: "$assigned#task_1#projectid_order#123#taskid_task0001",
                  },
                  TableName: "electro",
                  ConditionExpression: "attribute_not_exists(#title)",
                  ExpressionAttributeNames: { "#title": "title" },
                },
              },
              {
                Delete: {
                  Key: {
                    pk: "$test-service#teamid_started-at-the-bottoms",
                    sk: "$assigned#task_1#projectid_order#123#taskid_task0001",
                  },
                  TableName: "electro",
                  ConditionExpression:
                    "attribute_exists(#pk) AND attribute_exists(#sk) AND attribute_not_exists(#title)",
                  ExpressionAttributeNames: {
                    "#pk": "pk",
                    "#sk": "sk",
                    "#title": "title",
                  },
                },
              },
              {
                ConditionCheck: {
                  Key: {
                    pk: "$test-service#teamid_started-at-the-bottoms",
                    sk: "$assigned#task_1#projectid_order#123#taskid_task0001",
                  },
                  TableName: "electro",
                  ConditionExpression: "attribute_not_exists(#title)",
                  ExpressionAttributeNames: { "#title": "title" },
                },
              },
              {
                Put: {
                  Item: {
                    teamName: "Started at the Bottoms",
                    teamId: "started-at-the-bottoms",
                    teamLead: "patrick.star",
                    department: "back-house",
                    pk: "$test-service#teamid_started-at-the-bottoms",
                    sk: "$assigned#team_1",
                    __edb_e__: "team",
                    __edb_v__: "1",
                  },
                  TableName: "electro",
                  ConditionExpression: "attribute_not_exists(#teamLead)",
                  ExpressionAttributeNames: { "#teamLead": "teamLead" },
                },
              },
              {
                Put: {
                  Item: {
                    teamName: "Started at the Bottoms",
                    teamId: "started-at-the-bottoms",
                    teamLead: "patrick.star",
                    department: "back-house",
                    pk: "$test-service#teamid_started-at-the-bottoms",
                    sk: "$assigned#team_1",
                    __edb_e__: "team",
                    __edb_v__: "1",
                  },
                  TableName: "electro",
                  ConditionExpression:
                    "attribute_not_exists(#pk) AND attribute_not_exists(#sk) AND attribute_not_exists(#teamLead)",
                  ExpressionAttributeNames: {
                    "#pk": "pk",
                    "#sk": "sk",
                    "#teamLead": "teamLead",
                  },
                },
              },
              {
                Update: {
                  TableName: "electro",
                  UpdateExpression:
                    "SET #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0, #teamName = :teamName_u0, #teamId = :teamId_u0, #teamLead = :teamLead_u0, #department = :department_u0",
                  ExpressionAttributeNames: {
                    "#teamLead": "teamLead",
                    "#__edb_e__": "__edb_e__",
                    "#__edb_v__": "__edb_v__",
                    "#teamName": "teamName",
                    "#teamId": "teamId",
                    "#department": "department",
                  },
                  ExpressionAttributeValues: {
                    ":__edb_e___u0": "team",
                    ":__edb_v___u0": "1",
                    ":teamName_u0": "Started at the Bottoms",
                    ":teamId_u0": "started-at-the-bottoms",
                    ":teamLead_u0": "patrick.star",
                    ":department_u0": "back-house",
                  },
                  Key: {
                    pk: "$test-service#teamid_started-at-the-bottoms",
                    sk: "$assigned#team_1",
                  },
                  ConditionExpression: "attribute_not_exists(#teamLead)",
                },
              },
              {
                Update: {
                  UpdateExpression:
                    "SET #teamLead = :teamLead_u0, #teamId = :teamId_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0",
                  ExpressionAttributeNames: {
                    "#teamLead": "teamLead",
                    "#teamId": "teamId",
                    "#__edb_e__": "__edb_e__",
                    "#__edb_v__": "__edb_v__",
                  },
                  ExpressionAttributeValues: {
                    ":teamLead_u0": "patrick.star",
                    ":teamId_u0": "started-at-the-bottoms",
                    ":__edb_e___u0": "team",
                    ":__edb_v___u0": "1",
                  },
                  TableName: "electro",
                  Key: {
                    pk: "$test-service#teamid_started-at-the-bottoms",
                    sk: "$assigned#team_1",
                  },
                  ConditionExpression: "attribute_not_exists(#teamLead)",
                },
              },
              {
                Update: {
                  UpdateExpression:
                    "SET #teamLead = :teamLead_u0, #teamId = :teamId_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0",
                  ExpressionAttributeNames: {
                    "#pk": "pk",
                    "#sk": "sk",
                    "#teamLead": "teamLead",
                    "#teamId": "teamId",
                    "#__edb_e__": "__edb_e__",
                    "#__edb_v__": "__edb_v__",
                  },
                  ExpressionAttributeValues: {
                    ":teamLead_u0": "patrick.star",
                    ":teamId_u0": "started-at-the-bottoms",
                    ":__edb_e___u0": "team",
                    ":__edb_v___u0": "1",
                  },
                  TableName: "electro",
                  Key: {
                    pk: "$test-service#teamid_started-at-the-bottoms",
                    sk: "$assigned#team_1",
                  },
                  ConditionExpression:
                    "attribute_exists(#pk) AND attribute_exists(#sk) AND attribute_not_exists(#teamLead)",
                },
              },
              {
                Delete: {
                  Key: {
                    pk: "$test-service#teamid_started-at-the-bottoms",
                    sk: "$assigned#team_1",
                  },
                  TableName: "electro",
                  ConditionExpression: "attribute_not_exists(#teamLead)",
                  ExpressionAttributeNames: { "#teamLead": "teamLead" },
                },
              },
              {
                Delete: {
                  Key: {
                    pk: "$test-service#teamid_started-at-the-bottoms",
                    sk: "$assigned#team_1",
                  },
                  TableName: "electro",
                  ConditionExpression:
                    "attribute_exists(#pk) AND attribute_exists(#sk) AND attribute_not_exists(#teamLead)",
                  ExpressionAttributeNames: {
                    "#pk": "pk",
                    "#sk": "sk",
                    "#teamLead": "teamLead",
                  },
                },
              },
              {
                ConditionCheck: {
                  Key: {
                    pk: "$test-service#teamid_started-at-the-bottoms",
                    sk: "$assigned#team_1",
                  },
                  TableName: "electro",
                  ConditionExpression: "attribute_not_exists(#teamLead)",
                  ExpressionAttributeNames: { "#teamLead": "teamLead" },
                },
              },
            ],
          });
        });

        it(`should accept a request token on transaction requests`, async () => {
          const serviceName = uuid();
          const taskId = "task0001";
          const title = "Make Crabby Patty";
          const teamId = "started-at-the-bottoms";
          const projectId = "Order#123";
          const description = "Create the most delicious burger ever made";
          const token = uuid();
          const { service } = createTeamService({
            table,
            client,
            serviceName,
          });

          const params = service.transaction
            .write(({ task, team }) => [
              task
                .put({ taskId, teamId, projectId, description, title })
                .where((attr, op) => op.notExists(attr.title))
                .commit(),
            ])
            .params({ token });

          expect(params).to.deep.equal({
            TransactItems: [
              {
                Put: {
                  Item: {
                    title: "Make Crabby Patty",
                    description: "Create the most delicious burger ever made",
                    taskId: "task0001",
                    projectId: "Order#123",
                    teamId: "started-at-the-bottoms",
                    pk: `$${serviceName}#teamid_started-at-the-bottoms`,
                    sk: "$assigned#task_1#projectid_order#123#taskid_task0001",
                    __edb_e__: "task",
                    __edb_v__: "1",
                  },
                  TableName: "electro",
                  ConditionExpression: "attribute_not_exists(#title)",
                  ExpressionAttributeNames: { "#title": "title" },
                },
              },
            ],
            ClientRequestToken: token,
          });

          const result1 = await service.transaction
            .write(({ task, team }) => [
              task
                .put({ taskId, teamId, projectId, description, title })
                .where((attr, op) => op.notExists(attr.title))
                .commit(),
            ])
            .go({ token });

          const result2 = await service.transaction
            .write(({ task, team }) => [
              task
                .put({ taskId, teamId, projectId, description, title })
                .where((attr, op) => op.notExists(attr.title))
                .commit(),
            ])
            .go({ token });

          expect(result1).to.deep.equal(result2);
        });

        it("should perform transaction operation", async () => {
          const serviceName = uuid();
          const { service, agent } = createUniqueConstraintService({
            serviceName,
            client,
            table,
          });

          const createNewAgent = async (
            newAgent: CreateEntityItem<typeof agent>,
          ) => {
            return service.transaction
              .write(({ agent, uniqueConstraint }) => [
                agent.create(newAgent).commit({ response: "all_old" }),
                uniqueConstraint
                  .create({
                    entity: "agent",
                    name: "callSign",
                    value: newAgent.callSign,
                  })
                  .commit({ response: "all_old" }),
              ])
              .go();
          };

          const updateAgentHandler = async (options: {
            id: string;
            handler: string;
          }) => {
            const { id, handler } = options;
            return service.transaction
              .write(({ agent }) => [
                agent
                  .update({ id })
                  .set({ handler })
                  .commit({ response: "all_old" }),
                agent
                  .check({ id: handler })
                  .where(({ isHandler }, { eq }) => eq(isHandler, true))
                  .commit(),
              ])
              .go();
          };

          const doubleOhSeven: CreateEntityItem<typeof agent> = {
            id: "007",
            email: "james.bond@mi6.co.uk",
            callSign: "eagle",
            fullName: "James Bond",
          };

          const creation1 = await createNewAgent(doubleOhSeven);

          expect(creation1).to.deep.equal({
            data: [
              {
                rejected: false,
                code: "None",
                message: undefined,
                item: null,
              },
              {
                rejected: false,
                code: "None",
                message: undefined,
                item: null,
              },
            ],
            canceled: false,
          });

          // Stuart Thomas
          const doubleOhFive: CreateEntityItem<typeof agent> = {
            id: "005",
            email: "stuart.thomas@mi6.co.uk",
            callSign: "eagle",
            fullName: "Stuart Thomas",
          };

          const creation2 = await createNewAgent(doubleOhFive);

          expect(creation2).to.deep.equal({
            data: [
              {
                rejected: false,
                code: "None",
                message: undefined,
                item: null,
              },
              {
                rejected: true,
                code: "ConditionalCheckFailed",
                message: "The conditional request failed",
                item: {
                  entity: "agent",
                  name: "callSign",
                  value: "eagle",
                },
              },
            ],
            canceled: true,
          });

          // Olivia Mansfield (M)
          const m: CreateEntityItem<typeof agent> = {
            id: "12",
            callSign: "M",
            fullName: "Olivia Mansfield",
            email: "olivia.mansfield@mi6.co.uk",
            isHandler: true,
          };

          const update1 = await updateAgentHandler({
            handler: m.id,
            id: doubleOhSeven.id,
          });

          expect(update1).to.deep.equal({
            data: [
              {
                rejected: false,
                code: "None",
                message: undefined,
                item: null,
              },
              {
                rejected: true,
                code: "ConditionalCheckFailed",
                message: "The conditional request failed.",
                item: null,
              },
            ],
            canceled: true,
          });

          await createNewAgent(m);

          const update2 = await updateAgentHandler({
            handler: m.id,
            id: doubleOhSeven.id,
          });

          expect(update2).to.deep.equal({
            data: [
              {
                rejected: false,
                code: "None",
                message: undefined,
                item: null,
              },
              {
                rejected: false,
                code: "None",
                message: undefined,
                item: null,
              },
            ],
            canceled: false,
          });
        });

        it("should accept an empty array without throwing and simply return an empty array back", async () => {
          const serviceName = uuid();
          const { service } = createTeamService({
            table,
            client,
            serviceName,
          });

          const results = await service.transaction.write(() => []).go();

          expect(results).to.deep.equal({
            canceled: false,
            data: [],
          });
        });
      });
    });
  }
});
