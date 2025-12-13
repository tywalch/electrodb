import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { v4 as uuid } from "uuid";
import { faker } from "@faker-js/faker";
import { Entity, EntityItem } from "../";

function expectEnv(name: string) {
  const env = process.env[name];
  if (!env) {
    throw new Error(`Environment variable ${name} is not set`);
  }
  return env;
}

function createThingEntity(client: DocumentClient, table: string) {
  return new Entity(
    {
      model: {
        entity: "composite_attributes",
        version: "1",
        service: "test"
      },
      attributes: {
        id: {
          type: "string",
          required: true,
          readOnly: true,
        },
        name: {
          type: "string",
          field: "attr7",
        },
        description: {
          type: "string"
        },
        country: {
          type: "string",
          field: "attr1",
        },
        region: {
          type: "string",
          field: 'attr2',
        },
        city: {
          type: "string",
          field: 'attr3',
        },
        manufacturer: {
          type: "string",
          field: 'attr4',
        },
        model: {
          type: "string",
          field: 'attr5',
        },
        count: {
          type: "number",
          field: 'attr6',
        },
        entityName: {
          type: "string",
          readOnly: true,
          // required: true,
          default: "composite_attributes",
        },
      },
      indexes: {
        thing: {
          pk: {
            field: "pk",
            composite: ["manufacturer"]
          },
          sk: {
            field: "sk",
            composite: ["model", "id"]
          }
        },
        location: {
          index: "gsi1",
          type: "composite",
          pk: {
            field: "gsi1pk",
            composite: ["country", "region", "city"]
          },
          sk: {
            field: "gis1sk",
            composite: ["manufacturer", "model", "count", "name"]
          }
        }
      }
    },
    { table, client }
  );
}

type ThingEntity = ReturnType<typeof createThingEntity>;
type ThingItem = EntityItem<ThingEntity>;

function generateThingItem(overrides?: Partial<ThingItem>): ThingItem {
  return {
    id: uuid(),
    name: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    country: faker.location.countryCode(),
    region: faker.location.state(),
    city: faker.location.city(),
    manufacturer: faker.company.name(),
    model: faker.commerce.product(),
    count: faker.number.int({ min: 1, max: 1000 }),
    ...overrides,
  };
}

function maybeDescribe(condition: boolean, name: string, fn: () => void) {
  if (condition) {
    describe(name, fn);
  } else {
    console.warn(`Skipping tests for "${name}"`);
    describe.skip(name, fn);
  }
}

const ENABLE_AWS_TESTS = process.env.RUN_AWS_CONNECTED_TESTS === "true";

describe("multi-attribute index support", () => {
  describe("parameter building", () => {
    describe("ownership filters", () => {
      // - should always include identifier attributes in ownership filters on multi-attribute indexes: query, begins, gt, gte, lt, lte, between, collection
    })
    describe("key creation", () => {
      // - should not create pk and sk for all query and mutation operations: get, batchGet, scan, query, begins, gt, gte, lt, lte, between, update, patch, upsert, put, create, delete, remove, transactGet, transactWrite, collection, collection-begins, collection-gt, collection-gte, collection-lt, collection-lte
    })

  });

  describe("conversion functions", () => {})
  describe("validations", () => {
    describe("schema", () => {
      // - index field property should only be allowed to be missing on "composite" indexes
      // -
      // ? disallow use of "condition" on composite indexes?
    });
    describe("query-time", () => {
      // - should not validate presence of composite attributes on all query and mutation operations: get, batchGet, scan, query, begins, gt, gte, lt, lte, between, update, patch, upsert, put, create, delete, remove, transactGet, transactWrite, collection, collection-begins, collection-gt, collection-gte, collection-lt, collection-lte
    })
  });

  maybeDescribe(ENABLE_AWS_TESTS, "multi-attribute index aws connected tests", () => {
    const table = expectEnv("MULTI_ATTRIBUTE_INDEX_TABLE");
    const region = expectEnv("MULTI_ATTRIBUTE_INDEX_AWS_REGION");
    const accessKeyId = expectEnv("MULTI_ATTRIBUTE_INDEX_ACCESS_KEY_ID");
    const secretAccessKey = expectEnv("MULTI_ATTRIBUTE_INDEX_SECRET_ACCESS_KEY");
    const client = new DocumentClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      }
    });

    const Thing = createThingEntity(client, table);

    describe("query operations", () => {
      describe("pagination", () => {
        // - should paginate results correctly on multi-attribute indexes with all query and scan operations: query, begins, gt, gte, lt, lte, between, collection, collection-begins, collection-gt, collection-gte, collection-lt, collection-lte
      });
      describe("collections", () => {
        // - should perform collection-begins, collection-gt, collection-gte, collection-lt, collection-lte
        //
      });
    });

    describe("mutation operations", () => {
      // - should perform all mutation operations correctly on multi-attribute indexes: update, patch, upsert, put, create, delete, remove, transactGet, transactWrite
    })
  });
});