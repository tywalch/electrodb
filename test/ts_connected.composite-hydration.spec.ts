process.env.AWS_NODEJS_CONNECTION_REUSE_ENABLED = "1";

import { Entity } from "../index";
import { v4 as uuid } from "uuid";
import { expect } from "chai";
import DynamoDB from "aws-sdk/clients/dynamodb";

const client = new DynamoDB.DocumentClient({
  region: "us-east-1",
  endpoint: process.env.LOCAL_DYNAMO_ENDPOINT ?? "http://localhost:8000",
  credentials: {
    accessKeyId: "test",
    secretAccessKey: "test",
  },
});

function sortBy<T>(arr: T[], key: keyof T): T[] {
  return [...arr].sort((a, z) => (a[key] > z[key] ? 1 : -1));
}

describe("composite index hydration", () => {
  const table = "multi-attribute-projections";

  function createEntity() {
    return new Entity(
      {
        model: {
          entity: uuid(),
          version: "1",
          service: uuid(),
        },
        attributes: {
          id: {
            type: "string",
          },
          organizationId: {
            type: "string",
            field: "attr1",
          },
          teamId: {
            type: "string",
            field: "attr2",
          },
          city: {
            type: "string",
            field: "attr3",
          },
          state: {
            type: "string",
            field: "attr4",
          },
          zip: {
            type: "string",
            field: "attr5",
          },
          description: {
            type: "string",
          },
        },
        indexes: {
          primary: {
            pk: {
              field: "pk",
              composite: ["organizationId"],
            },
            sk: {
              field: "sk",
              composite: ["id"],
            },
          },
          locationAll: {
            index: "gsi1",
            type: "composite",
            pk: {
              composite: ["organizationId", "teamId", "city"],
            },
            sk: {
              composite: ["state", "zip"],
            },
          },
          locationKeysOnly: {
            index: "gsi2",
            type: "composite",
            projection: "keys_only",
            pk: {
              composite: ["organizationId", "teamId"],
            },
            sk: {
              composite: ["city"],
            },
          },
          locationInclude: {
            index: "gsi3",
            type: "composite",
            projection: ["city"],
            pk: {
              composite: ["organizationId"],
            },
            sk: {
              composite: ["state", "zip"],
            },
          },
        },
      },
      { table, client },
    );
  }

  function makeItems(count: number, overrides: Partial<Record<string, string>>) {
    return Array.from({ length: count }, () => ({
      id: uuid(),
      organizationId: uuid(),
      teamId: uuid(),
      city: uuid(),
      state: uuid(),
      zip: uuid(),
      description: uuid(),
      ...overrides,
    }));
  }

  it("should hydrate composite index with ALL projection", async () => {
    const entity = createEntity();
    const organizationId = uuid();
    const teamId = uuid();
    const city = uuid();
    const items = makeItems(10, { organizationId, teamId, city });

    await entity.put(items).go();
    const { data } = await entity.query
      .locationAll({ organizationId, teamId, city })
      .go({ hydrate: true });

    expect(sortBy(data, "id")).to.deep.equal(sortBy(items, "id"));
  });

  it("should hydrate composite index with KEYS_ONLY projection", async () => {
    const entity = createEntity();
    const organizationId = uuid();
    const teamId = uuid();
    const items = makeItems(10, { organizationId, teamId });

    await entity.put(items).go();
    const { data } = await entity.query
      .locationKeysOnly({ organizationId, teamId })
      .go({ hydrate: true });

    expect(sortBy(data, "id")).to.deep.equal(sortBy(items, "id"));
  });

  it("should hydrate composite index with INCLUDE projection and return non-projected attributes", async () => {
    const entity = createEntity();
    const organizationId = uuid();
    const items = makeItems(10, { organizationId });

    await entity.put(items).go();
    const { data } = await entity.query
      .locationInclude({ organizationId })
      .go({ hydrate: true, attributes: ["city", "description"] });

    // "description" is not in the GSI projection, so it should only appear via hydration
    const expected = sortBy(items, "city").map((item) => ({
      city: item.city,
      description: item.description,
    }));
    const actual = sortBy(data, "city").map((item) => ({
      city: item.city,
      description: item.description,
    }));
    expect(actual).to.deep.equal(expected);
  });
});
