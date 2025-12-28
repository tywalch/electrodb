import {
  DynamoDBClient as DocumentClient,
  GetItemInput,
  QueryInput,
  ScanInput,
  BatchGetItemInput,
  PutItemInput,
  UpdateItemInput,
  DeleteItemInput,
  TransactGetItemsInput,
  TransactWriteItemsInput,
  BatchWriteItemInput,
} from "@aws-sdk/client-dynamodb";
import { v4 as uuid } from "uuid";
import { faker } from "@faker-js/faker";
import { expect } from 'chai';
import { Service, Entity, EntityItem, EntityRecord } from "../";

function createSafeName() {
  return uuid().replace(/-/g, "_");
}

const localClient = new DocumentClient({
  region: "us-east-1",
  endpoint: process.env.LOCAL_DYNAMO_ENDPOINT ?? "http://localhost:8000",
  credentials: {
    accessKeyId: "test",
    secretAccessKey: "test",
  },
});

function expectSubset(label: string, received: any, expected: any) {
  try {
    if (!received === undefined) {
      throw new Error(`Invalid test: Received value for ${label} is undefined
      received: ${JSON.stringify(received, null, 4)}
      expected: ${JSON.stringify(expected, null, 4)}`);
    }
    if (expected === undefined) {
      throw new Error(`Invalid test: Expected value for ${label} is undefined
      received: ${JSON.stringify(received, null, 4)}
      expected: ${JSON.stringify(expected, null, 4)}`);
    }
    for (const key of Object.keys(expected)) {
      expect(received).to.have.property(key);
      if (typeof expected[key] === 'object' && expected[key] !== null) {
        expectSubset(`${label}.${key}`, received[key], expected[key]);
      } else {
        expect(received[key]).to.equal(expected[key]);
      }
    }
  } catch(e: any) {
    console.log(JSON.stringify({label, received, expected}, null, 4));
    throw e;
  }
}

function expectNotSubset(label: string, received: any, expected: any) {
  if (!received === undefined) {
    throw new Error(`Invalid test: Received value for ${label} is undefined`);
  }
  if (expected === undefined) {
    throw new Error(`Invalid test: Expected value for ${label} is undefined`);
  }
  try {
    expectSubset(label, received, expected);
  } catch {
    // if we catch an error, it means received is not a subset of expected
    return;
  }

  throw new Error(`Expected ${label} to not be a subset, but it was.`);
}

const localTable = "TestMultiAttributeIndexesTable";

function expectEnv(name: string) {
  const env = process.env[name];
  if (!env) {
    throw new Error(`Environment variable ${name} is not set`);
  }
  return env;
}

type CreateThingEntityOptions = {
  client: DocumentClient;
  service: string;
  table: string;
  name: string;
}

function createThingEntity(options: CreateThingEntityOptions) {
  const { client, table, name, service } = options;
  return new Entity(
    {
      model: {
        entity: name,
        version: "1",
        service: service
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
          // readOnly: true,
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
          collection: 'inventory',
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
type ThingRecord = EntityRecord<ThingEntity>;

function createThingService(thing: ThingEntity, gizmo: ThingEntity) {
  return new Service({ thing, gizmo });
}

type ThingService = ReturnType<typeof createThingService>;

function generateThingRecord(overrides?: Partial<ThingRecord>): ThingRecord {
  return {
    id: uuid(),
    entityName: "composite_attributes",
    name: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    country: faker.location.countryCode(),
    region: faker.location.state(),
    city: faker.location.city(),
    manufacturer: faker.company.name(),
    model: faker.commerce.product(),
    count: faker.number.int({ min: 1, max: 1000 }),
    ...overrides,
  }
}

function maybeDescribeAWSTest(name: string, fn: (client: DocumentClient, table: string) => void) {
  const condition = process.env.MULTI_ATTRIBUTE_DYNANODB_TABLE_NAME !== undefined &&
    process.env.MULTI_ATTRIBUTE_DYNANODB_REGION !== undefined &&
    process.env.MULTI_ATTRIBUTE_DYNANODB_ACCESS_KEY_ID !== undefined &&
    process.env.MULTI_ATTRIBUTE_DYNANODB_SECRET_ACCESS_KEY !== undefined;

  console.log({
    MULTI_ATTRIBUTE_DYNANODB_TABLE_NAME: process.env.MULTI_ATTRIBUTE_DYNANODB_TABLE_NAME,
    MULTI_ATTRIBUTE_DYNANODB_REGION: process.env.MULTI_ATTRIBUTE_DYNANODB_REGION,
    MULTI_ATTRIBUTE_DYNANODB_ACCESS_KEY_ID: process.env.MULTI_ATTRIBUTE_DYNANODB_ACCESS_KEY_ID,
    MULTI_ATTRIBUTE_DYNANODB_SECRET_ACCESS_KEY: process.env.MULTI_ATTRIBUTE_DYNANODB_SECRET_ACCESS_KEY,
  });
  if (condition) {
    describe(name, () => {
        const table = expectEnv("MULTI_ATTRIBUTE_DYNANODB_TABLE_NAME");
        const client = new DocumentClient({
          region: expectEnv("MULTI_ATTRIBUTE_DYNANODB_REGION"),
          credentials: {
            accessKeyId: expectEnv("MULTI_ATTRIBUTE_DYNANODB_ACCESS_KEY_ID"),
            secretAccessKey: expectEnv("MULTI_ATTRIBUTE_DYNANODB_SECRET_ACCESS_KEY"),
          }
        });

        fn(client, table);
    });
  } else {
    console.warn(`Skipping tests for "${name}"`);
    describe.skip(name, () => {});
  }
}

const ENABLE_AWS_TESTS = process.env.RUN_AWS_CONNECTED_TESTS === "true";

const ServiceQueryOperations = {
  collection: 'collection',
  collectionBegins: 'collectionBegins',
  collectionGt: 'collectionGt',
  collectionGte: 'collectionGte',
  collectionLt: 'collectionLt',
  collectionLte: 'collectionLte',
  collectionBetween: 'collectionBetween',
  transactGet: 'transactGet',
} as const;

const EntityQueryOperations = {
  query: 'query',
  begins: 'begins',
  gt: 'gt',
  gte: 'gte',
  lt: 'lt',
  lte: 'lte',
  between: 'between',
  scan: 'scan',
  get: 'get',
  batchGet: 'batchGet',
} as const;

const EntityMutationOperations = {
  update: 'update',
  patch: 'patch',
  upsert: 'upsert',
  put: 'put',
  create: 'create',
  delete: 'delete',
  remove: 'remove',
  batchPut: 'batchPut',
  batchDelete: 'batchDelete',
} as const;

const ServiceMutationOperations = {
  transactWrite: 'transactWrite',
} as const;

const EntityPaginationOperations = {
  [EntityQueryOperations.between]: EntityQueryOperations.between,
  [EntityQueryOperations.begins]: EntityQueryOperations.begins,
  [EntityQueryOperations.query]: EntityQueryOperations.query,
  [EntityQueryOperations.gt]: EntityQueryOperations.gt,
  [EntityQueryOperations.gte]: EntityQueryOperations.gte,
  [EntityQueryOperations.lt]: EntityQueryOperations.lt,
  [EntityQueryOperations.lte]: EntityQueryOperations.lte,
  [EntityQueryOperations.scan]: EntityQueryOperations.scan,
} as const;

const ServicePaginationOperations = {
  [ServiceQueryOperations.collectionBetween]: ServiceQueryOperations.collectionBetween,
  [ServiceQueryOperations.collectionBegins]: ServiceQueryOperations.collectionBegins,
  [ServiceQueryOperations.collection]: ServiceQueryOperations.collection,
  [ServiceQueryOperations.collectionGt]: ServiceQueryOperations.collectionGt,
  [ServiceQueryOperations.collectionGte]: ServiceQueryOperations.collectionGte,
  [ServiceQueryOperations.collectionLt]: ServiceQueryOperations.collectionLt,
  [ServiceQueryOperations.collectionLte]: ServiceQueryOperations.collectionLte,
} as const;

type EntityMutationOperation = keyof typeof EntityMutationOperations;
type EntityQueryOperation = keyof typeof EntityQueryOperations;
type ServiceQueryOperation = keyof typeof ServiceQueryOperations;
type ServiceMutationOperation = keyof typeof ServiceMutationOperations;
type EntityOperations = EntityQueryOperation | EntityMutationOperation;
type ServiceOperation = ServiceQueryOperation | ServiceMutationOperation;
type QueryOperation = EntityQueryOperation | ServiceQueryOperation;
type MutationOperation = EntityMutationOperation | ServiceMutationOperation;
type Operation = EntityOperations | ServiceOperation;

type EntityPaginationOperation = keyof typeof EntityPaginationOperations;
type ServicePaginationOperation = keyof typeof ServicePaginationOperations;
type PaginationOperation = EntityPaginationOperation | ServicePaginationOperation;

function isEntityMutationOperation(val: string): val is EntityMutationOperation {
  return val in EntityMutationOperations;
}

function isEntityQueryOperation(val: string): val is EntityQueryOperation {
  return val in EntityQueryOperations;
}

function isServiceQueryOperation(val: string): val is ServiceQueryOperation {
  return val in ServiceQueryOperations;
}

function isServiceMutationOperation(val: string): val is ServiceMutationOperation {
  return val in ServiceMutationOperations;
}

function isEntityOperations(val: string): val is EntityOperations {
  return isEntityMutationOperation(val) || isEntityQueryOperation(val);
}

function isServiceOperation(val: string): val is ServiceOperation {
  return isServiceMutationOperation(val) || isServiceQueryOperation(val);
}

function isQueryOperation(val: string): val is QueryOperation {
  return isEntityQueryOperation(val) || isServiceQueryOperation(val);
}

function isMutationOperation(val: string): val is MutationOperation {
  return isEntityMutationOperation(val) || isServiceMutationOperation(val);
}

function isOperation(val: string): val is Operation {
  return isEntityOperations(val) || isServiceOperation(val);
}

function isEntityPaginationOperation(val: string): val is EntityPaginationOperation {
  return val in EntityPaginationOperations;
}

function isServicePaginationOperation(val: string): val is ServicePaginationOperation {
  return val in ServicePaginationOperations;
}

function isPaginationOperation(val: string): val is PaginationOperation {
  return isEntityPaginationOperation(val) || isServicePaginationOperation(val);
}

type OperationParameters = {
  collection: QueryInput;
  collectionBegins: QueryInput;
  collectionGt: QueryInput;
  collectionGte: QueryInput;
  collectionLt: QueryInput;
  collectionLte: QueryInput;
  collectionBetween: QueryInput;
  transactGet: TransactGetItemsInput;
  query: QueryInput;
  begins: QueryInput;
  gt: QueryInput;
  gte: QueryInput;
  lt: QueryInput;
  lte: QueryInput;
  between: QueryInput;
  scan: ScanInput;
  get: GetItemInput;
  batchGet: BatchGetItemInput;
  update: UpdateItemInput;
  patch: UpdateItemInput;
  upsert: UpdateItemInput;
  put: PutItemInput;
  create: PutItemInput;
  delete: DeleteItemInput;
  remove: DeleteItemInput;
  transactWrite: TransactWriteItemsInput;
  batchPut: BatchWriteItemInput[];
  batchDelete: BatchWriteItemInput[];
};

type ParameterBuilders<Op extends Operation, P> = {
  [O in Op]: (item: P, item2?: P) => O extends keyof OperationParameters
    ? { params: OperationParameters[O], type: O }
    : never;
}

function expectExhaustive(_: never): never {
  throw new Error(`Unhandled case in exhaustive check`);
}

describe("multi-attribute index support", () => {
  describe("parameter building", () => {
    const serviceName = createSafeName(); // important test namespacing
    const thing = createThingEntity({
      name: createSafeName(), // important test namespacing
      service: serviceName,
      client: localClient,
      table: localTable,
    });

    const gizmo = createThingEntity({
      name: createSafeName(), // important test namespacing
      service: serviceName,
      client: localClient,
      table: localTable,
    });

    const service = new Service({ thing, gizmo }, { client: localClient, table: localTable });

    // - should always include identifier attributes in ownership filters on multi-attribute indexes: query, begins, gt, gte, lt, lte, between, collection
    const operations: ParameterBuilders<Operation, ThingRecord> = {
      query: (item) => {
        const params = thing.query.location(item).params();
        return { type: 'query', params };
      },
      begins: (item) => {
        const { country, region, city, manufacturer, model } = item;
        const params = thing.query.location({ country, region, city }).begins({ manufacturer, model }).params();
        return { type: 'begins', params };
      },
      gt: (item) => {
        const { country, region, city, manufacturer, model, count } = item;
        const params = thing.query.location({ country, region, city }).gt({ manufacturer, model, count }).params();
        return { type: 'gt', params };
      },
      gte: (item) => {
        const { country, region, city, manufacturer, model, count } = item;
        const params = thing.query.location({ country, region, city }).gte({ manufacturer, model, count }).params();
        return { type: 'gte', params };
      },
      lt: (item) => {
        const { country, region, city, manufacturer, model, count } = item;
        const params = thing.query.location({ country, region, city }).lt({ manufacturer, model, count }).params();
        return { type: 'lt', params };
      },
      lte: (item) => {
        const { country, region, city, manufacturer, model, count } = item;
        const params = thing.query.location({ country, region, city }).lte({ manufacturer, model, count }).params();
        return { type: 'lte', params };
      },
      between: (item1, item2) => {
        if (!item2) {
          throw new Error("item2 is required for between operation");
        }
        const { country, region, city } = item1;
        const params = thing.query.location({ country, region, city })
          .between(
            { manufacturer: item1.manufacturer, model: item1.model, count: item1.count },
            { manufacturer: item2.manufacturer, model: item2.model, count: item2.count }
          ).params();
        return { type: 'between', params };
      },
      get: (item) => {
        const params = thing.get(item).params();
        return { type: 'get', params };
      },
      batchGet: (item) => {
        const params = thing.get([item]).params();
        return { type: 'batchGet', params };
      },
      scan: () => {
        const params = thing.scan.params<ScanInput>();
        return { type: 'scan', params };
      },
      batchPut: (item) => {
        const params = thing.put([item]).params<BatchWriteItemInput[]>();
        return { type: 'batchPut', params };
      },
      batchDelete: (item) => {
        const params = thing.delete([item]).params<BatchWriteItemInput[]>();
        return { type: 'batchDelete', params };
      },
      update: (item) => {
        const {manufacturer, model, id, ...rest} = item;
        const params = thing.update({manufacturer, model, id}).set(rest).params<UpdateItemInput>();
        return { type: 'update', params };
      },
      patch: (item) => {
        const {manufacturer, model, id, ...rest} = item;
        const params = thing.patch({manufacturer, model, id}).set(rest).params<UpdateItemInput>();
        return { type: 'patch', params };
      },
      upsert: (item) => {
        const params = thing.upsert(item).params<UpdateItemInput>();
        return { type: 'upsert', params };
      },
      put: (item) => {
        const params = thing.put(item).params<PutItemInput>();
        return { type: 'put', params };
      },
      create: (item) => {
        const params = thing.create(item).params<PutItemInput>();
        return { type: 'create', params };
      },
      delete: (item) => {
        const params = thing.delete(item).params<DeleteItemInput>();
        return { type: 'delete', params };
      },
      remove: (item) => {
        const params = thing.remove(item).params<DeleteItemInput>();
        return { type: 'remove', params };
      },
      transactWrite: (item) => {
        const params = service.transaction.write(({ thing }) => [
          thing.put(item).commit(),
        ]).params();
        return { type: 'transactWrite', params: params as TransactWriteItemsInput };
      },
      transactGet: (item) => {
        const params = service.transaction.get(({ thing }) => [
          thing.get(item).commit(),
        ]).params();
        return { type: 'transactGet', params: params as TransactGetItemsInput };
      },
      collection: (item) => {
        const params = service.collections.inventory(item).params<QueryInput>();
        return { type: 'collection', params };
      },
      collectionBegins: (item) => {
        const { country, region, city, manufacturer, model } = item;
        const params = service.collections.inventory({country, region, city}).begins({ manufacturer, model }).params<QueryInput>();
        return { type: 'collectionBegins', params };
      },
      collectionLt: (item) => {
        const { country, region, city, manufacturer, model, count } = item;
        const params = service.collections.inventory({country, region, city}).lt({ manufacturer, model, count }).params<QueryInput>();
        return { type: 'collectionLt', params };
      },
      collectionLte: (item) => {
        const { country, region, city, manufacturer, model, count } = item;
        const params = service.collections.inventory({country, region, city}).lte({ manufacturer, model, count }).params<QueryInput>();
        return { type: 'collectionLte', params };
      },
      collectionGt: (item) => {
        const { country, region, city, manufacturer, model, count } = item;
        const params = service.collections.inventory({country, region, city}).gt({ manufacturer, model, count }).params<QueryInput>();
        return { type: 'collectionGt', params };
      },
      collectionGte: (item) => {
        const { country, region, city, manufacturer, model, count } = item;
        const params = service.collections.inventory({country, region, city}).gte({ manufacturer, model, count }).params<QueryInput>();
        return { type: 'collectionGte', params };
      },
      collectionBetween: (item1, item2) => {
        if (!item2) {
          throw new Error("item2 is required for between operation");
        }
        const { country, region, city } = item1;
        const params = service.collections.inventory({ country, region, city })
          .between(
            { manufacturer: item1.manufacturer, model: item1.model, count: item1.count },
            { manufacturer: item2.manufacturer, model: item2.model, count: item2.count }
          ).params<QueryInput>();
        return { type: 'collectionBetween', params };
      },
    }

    describe("ownership filters", () => {
      for (const [operationName, buildParams] of Object.entries(operations)) {
        it(`should include all composite attributes in ownership filter for ${operationName} operation`, () => {
          const item1 = generateThingRecord({ count: 1 });
          const item2 = generateThingRecord({ ...item1, count: 2 });
          const received = buildParams(item1, item2);
          switch (received.type) {
            // these operations are not relevant for ownership filters
            case "batchDelete":
            case "delete":
            case "remove":
            case "batchGet":
            case "get":
              break;
            case "put":
              expectSubset(received.type, received.params.Item, {
                "__edb_e__": thing.schema.model.entity,
                "__edb_v__": "1"
              });
              break;
            case "create":
              expectSubset(received.type, received.params.Item, {
                "__edb_e__": thing.schema.model.entity,
                "__edb_v__": "1"
              });
              break;
            case "upsert":
              expectSubset(received.type, received.params.ExpressionAttributeValues, {
                ":__edb_e___u0": thing.schema.model.entity,
                ":__edb_v___u0": "1"
              });
              break;
            case "scan":
              expectSubset(received.type, received.params.ExpressionAttributeValues, {
                ":__edb_e__0": thing.schema.model.entity,
                ":__edb_v__0": "1",
              });
              break;
            case "batchPut":
              expectSubset(received.type, received.params[0]?.RequestItems?.[localTable][0].PutRequest?.Item, {
                "__edb_e__": thing.schema.model.entity,
                "__edb_v__": "1"
              })
              break;
            case "update":
              expectSubset(received.type, received.params.ExpressionAttributeValues, {
                ":__edb_e___u0": thing.schema.model.entity,
                ":__edb_v___u0": "1"
              });
              break;
            case "patch":
              expectSubset(received.type, received.params.ExpressionAttributeValues, {
                ":__edb_e___u0": thing.schema.model.entity,
                ":__edb_v___u0": "1"
              });
              break;
            case "query":
              expectSubset(received.type, received.params.ExpressionAttributeValues, {
                [`:__edb_e___${thing.schema.model.entity}`]: thing.schema.model.entity,
                [`:__edb_v___${thing.schema.model.entity}`]: "1"
              });
              break;
            case "begins":
              expectSubset(received.type, received.params.ExpressionAttributeValues, {
                [`:__edb_e___${thing.schema.model.entity}`]: thing.schema.model.entity,
                [`:__edb_v___${thing.schema.model.entity}`]: "1"
              });
              break;
            case "gt":
              expectSubset(received.type, received.params.ExpressionAttributeValues, {
                [`:__edb_e___${thing.schema.model.entity}`]: thing.schema.model.entity,
                [`:__edb_v___${thing.schema.model.entity}`]: "1"
              });
              break;
            case "gte":
              expectSubset(received.type, received.params.ExpressionAttributeValues, {
                [`:__edb_e___${thing.schema.model.entity}`]: thing.schema.model.entity,
                [`:__edb_v___${thing.schema.model.entity}`]: "1"
              });
              break;
            case "lt":
              expectSubset(received.type, received.params.ExpressionAttributeValues, {
                [`:__edb_e___${thing.schema.model.entity}`]: thing.schema.model.entity,
                [`:__edb_v___${thing.schema.model.entity}`]: "1"
              });
              break;
            case "lte":
              expectSubset(received.type, received.params.ExpressionAttributeValues, {
                [`:__edb_e___${thing.schema.model.entity}`]: thing.schema.model.entity,
                [`:__edb_v___${thing.schema.model.entity}`]: "1"
              });
              break;
            case "between":
              expectSubset(received.type, received.params.ExpressionAttributeValues, {
                [`:__edb_e___${thing.schema.model.entity}`]: thing.schema.model.entity,
                [`:__edb_v___${thing.schema.model.entity}`]: "1"
              });
              break;
            case "collection":
              expectSubset(received.type, received.params.ExpressionAttributeValues, {
                ":__edb_e___thing": thing.schema.model.entity,
                ":__edb_v___thing": "1",
                ":__edb_e___gizmo": gizmo.schema.model.entity,
                ":__edb_v___gizmo": "1",
              });
              break;
            case "collectionBegins":
              expectSubset(received.type, received.params.ExpressionAttributeValues, {
                ":__edb_e___thing": thing.schema.model.entity,
                ":__edb_v___thing": "1",
                ":__edb_e___gizmo": gizmo.schema.model.entity,
                ":__edb_v___gizmo": "1",
              });
              break;
            case "collectionLt":
              expectSubset(received.type, received.params.ExpressionAttributeValues, {
                ":__edb_e___thing": thing.schema.model.entity,
                ":__edb_v___thing": "1",
                ":__edb_e___gizmo": gizmo.schema.model.entity,
                ":__edb_v___gizmo": "1",
              });
              break;
            case "collectionLte":
              expectSubset(received.type, received.params.ExpressionAttributeValues, {
                ":__edb_e___thing": thing.schema.model.entity,
                ":__edb_v___thing": "1",
                ":__edb_e___gizmo": gizmo.schema.model.entity,
                ":__edb_v___gizmo": "1",
              });
              break;
            case "collectionGt":
              expectSubset(received.type, received.params.ExpressionAttributeValues, {
                ":__edb_e___thing": thing.schema.model.entity,
                ":__edb_v___thing": "1",
                ":__edb_e___gizmo": gizmo.schema.model.entity,
                ":__edb_v___gizmo": "1",
              });
              break;
            case "collectionGte":
              expectSubset(received.type, received.params.ExpressionAttributeValues, {
                ":__edb_e___thing": thing.schema.model.entity,
                ":__edb_v___thing": "1",
                ":__edb_e___gizmo": gizmo.schema.model.entity,
                ":__edb_v___gizmo": "1",
              });
              break;
            case "collectionBetween":
              expectSubset(received.type, received.params.ExpressionAttributeValues, {
                ":__edb_e___thing": thing.schema.model.entity,
                ":__edb_v___thing": "1",
                ":__edb_e___gizmo": gizmo.schema.model.entity,
                ":__edb_v___gizmo": "1",
              });
              break;
            case "transactWrite":
              expectSubset(received.type, received.params?.TransactItems?.[0]?.Put?.Item, {
                "__edb_e__": thing.schema.model.entity,
                "__edb_v__": "1"
              });
            case "transactGet":
              break;
            // make sure we handle all cases
            default: {
              expectExhaustive(received);
            }
          }
        })
      }
    });

    describe("key creation", () => {
      for (const [operationName, buildParams] of Object.entries(operations)) {
        it(`should not format partition and sort keys for muti-attribute indexes on ${operationName} operation`, () => {
          const item1 = generateThingRecord({ count: 1 });
          const item2 = generateThingRecord({ ...item1, count: 2 });
          const received = buildParams(item1, item2);
          switch (received.type) {
            // these operations are not relevant for ownership filters
            case "batchDelete":
            case "delete":
            case "remove":
            case "batchGet":
            case "get":
            case "scan":
              break;
            case "put":
              expect(received.params.Item).to.not.have.keys(['gsi1pk', 'gsi1sk']);
              break;
            case "create":
              expect(received.params.Item).to.not.have.keys(['gsi1pk', 'gsi1sk']);
              break;
            case "upsert":
              expect(received.params.ExpressionAttributeValues).to.not.have.keys(['gsi1pk', 'gsi1sk']);
              break;
            case "batchPut":
              expect(received.params[0]?.RequestItems?.[localTable][0].PutRequest?.Item).to.not.have.keys(['gsi1pk', 'gsi1sk']);
              break;
            case "update":
              expect(received.params.ExpressionAttributeValues).to.not.have.keys(['gsi1pk', 'gsi1sk']);
              break;
            case "patch":
              expect(received.params.ExpressionAttributeValues).to.not.have.keys(['gsi1pk', 'gsi1sk']);
              break;
            case "collection":
            case "query":
              expect(received.params.ExpressionAttributeValues).to.not.have.keys(['gsi1pk', 'gsi1sk']);
              expect(received.params.KeyConditionExpression).to.equal("#country = :countryk_0 AND #region = :regionk_0 AND #city = :cityk_0 AND #manufacturer = :manufacturerk_0 AND #model = :modelk_0 AND #count = :countk_0 AND #name = :namek_0");
              break;
            case "collectionBegins":
            case "begins":
              expect(received.params.ExpressionAttributeValues).to.not.have.keys(['gsi1pk', 'gsi1sk']);
              expect(received.params.KeyConditionExpression).to.equal("#country = :countryk_0 AND #region = :regionk_0 AND #city = :cityk_0 AND #manufacturer = :manufacturerk_0 AND begins_with(#model, :modelk_0)");
              break;
            case "collectionGt":
            case "gt":
              expect(received.params.ExpressionAttributeValues).to.not.have.keys(['gsi1pk', 'gsi1sk']);
              expect(received.params.KeyConditionExpression).to.equal("#country = :countryk_0 AND #region = :regionk_0 AND #city = :cityk_0 AND #manufacturer = :manufacturerk_0 AND #model = :modelk_0 AND #count > :countk_0");
              break;
            case "collectionGte":
            case "gte":
              expect(received.params.ExpressionAttributeValues).to.not.have.keys(['gsi1pk', 'gsi1sk']);
              expect(received.params.KeyConditionExpression).to.equal("#country = :countryk_0 AND #region = :regionk_0 AND #city = :cityk_0 AND #manufacturer = :manufacturerk_0 AND #model = :modelk_0 AND #count >= :countk_0");
              break;
            case "collectionLt":
            case "lt":
              expect(received.params.ExpressionAttributeValues).to.not.have.keys(['gsi1pk', 'gsi1sk']);
              expect(received.params.KeyConditionExpression).to.equal("#country = :countryk_0 AND #region = :regionk_0 AND #city = :cityk_0 AND #manufacturer = :manufacturerk_0 AND #model = :modelk_0 AND #count < :countk_0");
              break;
            case "collectionLte":
            case "lte":
              expect(received.params.ExpressionAttributeValues).to.not.have.keys(['gsi1pk', 'gsi1sk']);
              expect(received.params.KeyConditionExpression).to.equal("#country = :countryk_0 AND #region = :regionk_0 AND #city = :cityk_0 AND #manufacturer = :manufacturerk_0 AND #model = :modelk_0 AND #count <= :countk_0");
              break;
            case "collectionBetween":
            case "between":
              expect(received.params.ExpressionAttributeValues).to.not.have.keys(['gsi1pk', 'gsi1sk']);
              expect(received.params.KeyConditionExpression).to.equal("#country = :countryk_0 AND #region = :regionk_0 AND #city = :cityk_0 AND #manufacturer = :manufacturerk_0 AND #model = :modelk_0 AND #count BETWEEN :countk_0 AND :countk_1");
              break;
            case "transactWrite":
            case "transactGet":
              break;
            // make sure we handle all cases
            default: {
              expectExhaustive(received);
            }
          }
        });
      }
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

  maybeDescribeAWSTest("multi-attribute index aws connected tests", (client, table) => {
    const serviceName = createSafeName(); // important test namespacing
    const thing = createThingEntity({
      name: createSafeName(), // important test namespacing
      service: serviceName,
      client,
      table,
    });

    const gizmo = createThingEntity({
      name: createSafeName(), // important test namespacing
      service: serviceName,
      client,
      table,
    });

    const service = createThingService(thing, gizmo)

    describe("query operations", () => {
      const paginationOperations = {
        query: (item: ThingRecord) => {
          const { country, region, city, manufacturer, model } = item;
          return {
            type: 'query' as const,
            op: () => service.entities.thing.query.location({ country, region, city, manufacturer, model }).go(),
          };
        },
        begins: (item: ThingRecord) => {
          const { country, region, city, manufacturer, model } = item;
          return {
            type: 'begins' as const,
            op: () => service.entities.thing.query.location({ country, region, city }).begins({ manufacturer, model }).go(),
          }
        },
        gt: (item: ThingRecord) => {
          const { country, region, city, manufacturer, model, count } = item;
          return {
            type: 'gt' as const,
            op: () => service.entities.thing.query.location({ country, region, city }).gt({ manufacturer, model, count }).go(),
          };
        },
        gte: (item: ThingRecord) => {
          const { country, region, city, manufacturer, model, count } = item;
          return {
            type: 'gte' as const,
            op: () => service.entities.thing.query.location({ country, region, city }).gte({ manufacturer, model, count }).go(),
          };
        },
        lt: (item: ThingRecord) => {
          const { country, region, city, manufacturer, model, count } = item;
          return {
            type: 'lt' as const,
            op: () => service.entities.thing.query.location({ country, region, city }).lt({ manufacturer, model, count }).go(),
          };
        },
        lte: (item: ThingRecord) => {
          const { country, region, city, manufacturer, model, count } = item;
          return {
            type: 'lte' as const,
            op: () => service.entities.thing.query.location({ country, region, city }).lte({ manufacturer, model, count }).go(),
          };
        },
        between: (item1: ThingRecord, item2?: ThingRecord) => {
          if (!item2) {
            throw new Error("item2 is required for between operation");
          }
          const { country, region, city } = item1;
          return {
            type: 'between' as const,
            op: () => service.entities.thing.query.location({ country, region, city })
              .between(
                { manufacturer: item1.manufacturer, model: item1.model, count: item1.count },
                { manufacturer: item2.manufacturer, model: item2.model, count: item2.count }
              ).go(),
          };
        },
        // get: (item: ThingRecord) => {
        //   return {
        //     type: 'get' as const,
        //     op: service.entities.thing.get(item),
        //   };
        // },
        // batchGet: (item: ThingRecord) => {
        //   return {
        //     type: 'batchGet' as const,
        //     op: service.entities.thing.get([item]),
        //   };
        // },
        scan: () => {
          return {
            type: 'scan' as const,
            op: () => service.entities.thing.scan.go(),
          };
        },
        // batchPut: (item: ThingRecord) => {
        //   return { type: 'batchPut' as const,
        //     op: service.entities.thing.put([item])
        //   };
        // },
        // batchDelete: (item: ThingRecord) => {
        //   return { type: 'batchDelete' as const,
        //     op: service.entities.thing.delete([item])
        //   };
        // },
        // update: (item: ThingRecord) => {
        //   const {manufacturer, model, id, ...rest} = item;
        //   return {
        //     type: 'update' as const,
        //     op: service.entities.thing.update({manufacturer, model, id}).set(rest)
        //   }
        // },
        // patch: (item: ThingRecord) => {
        //   const {manufacturer, model, id, ...rest} = item;
        //   return {
        //     type: 'patch' as const,
        //     op: service.entities.thing.patch({manufacturer, model, id}).set(rest)
        //   }
        // },
        // upsert: (item: ThingRecord) => {
        //   return {
        //     type: 'upsert' as const,
        //     op: service.entities.thing.upsert(item)
        //   };
        // },
        // put: (item: ThingRecord) => {
        //   return {
        //     type: 'put' as const,
        //     op: service.entities.thing.put(item)
        //   };
        // },
        // create: (item: ThingRecord) => {
        //   return {
        //     type: 'create' as const,
        //     op: service.entities.thing.create(item)
        //   };
        // },
        // delete: (item: ThingRecord) => {
        //   return {
        //     type: 'delete' as const,
        //     op: service.entities.thing.delete(item)
        //   };
        // },
        // remove: (item: ThingRecord) => {
        //   return {
        //     type: 'remove' as const,
        //     op: service.entities.thing.remove(item)
        //   };
        // },
        // transactWrite: (item: ThingRecord) => {
        //   return {
        //     type: 'transactWrite' as const,
        //     op: service.transaction.write(({ thing }) => [
        //       thing.put(item).commit(),
        //     ])
        //   };
        // },
        // transactGet: (item: ThingRecord) => {
        //   return {
        //     type: 'transactGet' as const,
        //     op: service.transaction.get(({ thing }) => [
        //       thing.get(item).commit(),
        //     ]),
        //   };
        // },
        collection: (item: ThingRecord) => {
          const { country, region, city, manufacturer, model } = item;

          return {
            type: 'collection' as const,
            op: () => service.collections.inventory({country, region, city, manufacturer, model}).go()
          };
        },
        collectionBegins: (item: ThingRecord) => {
          const { country, region, city, manufacturer, model } = item;

          return {
            type: 'collectionBegins' as const,
            op: () => service.collections.inventory({country, region, city}).begins({ manufacturer, model }).go()
          };
        },
        collectionLt: (item: ThingRecord) => {
          const { country, region, city, manufacturer, model, count } = item;

          return {
            type: 'collectionLt' as const,
            op: () => service.collections.inventory({country, region, city}).lt({ manufacturer, model, count }).go()
          };
        },
        collectionLte: (item: ThingRecord) => {
          const { country, region, city, manufacturer, model, count } = item;

          return {
            type: 'collectionLte' as const,
            op: () => service.collections.inventory({country, region, city}).lte({ manufacturer, model, count }).go()
          };
        },
        collectionGt: (item: ThingRecord) => {
          const { country, region, city, manufacturer, model, count } = item;

          return {
            type: 'collectionGt' as const,
            op: () => service.collections.inventory({country, region, city}).gt({ manufacturer, model, count }).go()
          };
        },
        collectionGte: (item: ThingRecord) => {
          const { country, region, city, manufacturer, model, count } = item;

          return {
            type: 'collectionGte' as const,
            op: () => service.collections.inventory({country, region, city}).gte({ manufacturer, model, count }).go()
          };
        },
        collectionBetween: (item1: ThingRecord, item2?: ThingRecord) => {
          if (!item2) {
            throw new Error("item2 is required for between operation");
          }
          const { country, region, city } = item1;
          return {
            type: 'collectionBetween' as const,
            op: () => service.collections.inventory({ country, region, city }).between(
              { manufacturer: item1.manufacturer, model: item1.model, count: item1.count },
              { manufacturer: item2.manufacturer, model: item2.model, count: item2.count }
            ).go(),
          };
        },
      } as const satisfies Record<PaginationOperation, any>;

      describe('when paginating on a multi-attribute index', async () => {
        const country = uuid();
        const region = faker.location.state();
        const city = faker.location.city();
        const manufacturer = faker.company.name()
        const model = faker.commerce.productName();
        const allThings: ThingRecord[] = [];
        const thingItems: ThingRecord[] = [];
        const gizmoItems: ThingRecord[] = [];
        for (let i = 0; i < 100; i++) {
          const item = generateThingRecord({
            count: i + 1,
            manufacturer,
            country,
            region,
            model,
            city,
          });
          allThings.push(item);
          if (i % 2 === 0) {
            thingItems.push(item);
          } else {
            gizmoItems.push(item);
          }
        }

        before(async () => {
          await Promise.all([
            thing.put(thingItems).go(),
            gizmo.put(gizmoItems).go(),
          ]);
        });

        for (const [operationName, genQuery] of Object.entries(paginationOperations)) {
          it(`should paginate results correctly on multi-attribute indexes with ${operationName} operation`, async () => {
            const item1 = allThings.find(item => item.count === 50);
            const item2 = allThings.find(item => item.count === 70);
            const thingItem = thingItems[0];
            const gizmoItem = gizmoItems[0];
            if (item1 === undefined || item2 === undefined || thingItem === undefined || gizmoItem === undefined) {
              throw new Error('Invalid test setup');
            }
            const query = genQuery(item1, item2);

            let cursor: string | null = null;
            let thingCount = 0;
            let gizmoCount = 0;

            if (isEntityPaginationOperation(query.type)) {
              do {
                const results = await query.op();
                cursor = results.cursor;
                if (Array.isArray(results.data)) {
                  thingCount += results.data.length;
                }
              } while (cursor !== null);
            } else if (isServicePaginationOperation(query.type)) {
              do {
                const results = await query.op();
                cursor = results.cursor;
                if ('thing' in results.data && Array.isArray(results.data.thing)) {
                  thingCount += results.data.thing.length;
                }
                if ('gizmo' in results.data && Array.isArray(results.data.gizmo)) {
                  gizmoCount += results.data.gizmo.length;
                }
              } while (cursor !== null);
            }

            switch (query.type) {
              case ServiceQueryOperations.collectionBetween: {
                const expectedThingCount = thingItems.filter(item => item.count >= item1.count && item.count <= item2.count).length;
                const expectedGizmoCount = gizmoItems.filter(item => item.count >= item1.count && item.count <= item2.count).length;
                expect(thingCount).to.equal(expectedThingCount);
                expect(gizmoCount).to.equal(expectedGizmoCount);
                break;
              }
              case EntityQueryOperations.between: {
                const expectedThingCount = thingItems.filter(item => item.count >= item1.count && item.count <= item2.count).length;
                expect(thingCount).to.equal(expectedThingCount);
                break;
              }
              case ServiceQueryOperations.collectionBegins: {
                const expectedThingCount = thingItems.filter(item => item.model.startsWith(model)).length;
                const expectedGizmoCount = gizmoItems.filter(item => item.model.startsWith(model)).length;
                expect(thingCount).to.equal(expectedThingCount);
                expect(gizmoCount).to.equal(expectedGizmoCount);
                break;
              }
              case EntityQueryOperations.begins: {
                const expectedThingCount = thingItems.filter(item => item.model.startsWith(model)).length;
                expect(thingCount).to.equal(expectedThingCount);
                break;
              }
              case ServiceQueryOperations.collection: {
                expect(thingCount).to.equal(thingItems.length);
                expect(gizmoCount).to.equal(gizmoItems.length);
                break;
              }
              case EntityQueryOperations.query: {
                expect(thingCount).to.equal(thingItems.length);
                break;
              }
              case ServiceQueryOperations.collectionGt: {
                const expectedThingCount = thingItems.filter(item => item.count > item1.count).length;
                const expectedGizmoCount = gizmoItems.filter(item => item.count > item1.count).length;
                expect(thingCount).to.equal(expectedThingCount);
                expect(gizmoCount).to.equal(expectedGizmoCount);
                break;
              }
              case ServiceQueryOperations.collectionGte: {
                const expectedThingCount = thingItems.filter(item => item.count >= item1.count).length;
                const expectedGizmoCount = gizmoItems.filter(item => item.count >= item1.count).length;
                expect(thingCount).to.equal(expectedThingCount);
                expect(gizmoCount).to.equal(expectedGizmoCount);
                break;
              }
              case ServiceQueryOperations.collectionLt: {
                const expectedThingCount = thingItems.filter(item => item.count < item1.count).length;
                const expectedGizmoCount = gizmoItems.filter(item => item.count < item1.count).length;
                expect(thingCount).to.equal(expectedThingCount);
                expect(gizmoCount).to.equal(expectedGizmoCount);
                break;
              }
              case ServiceQueryOperations.collectionLte: {
                const expectedThingCount = thingItems.filter(item => item.count <= item1.count).length;
                const expectedGizmoCount = gizmoItems.filter(item => item.count <= item1.count).length;
                expect(thingCount).to.equal(expectedThingCount);
                expect(gizmoCount).to.equal(expectedGizmoCount);
                break;
              }
              case EntityQueryOperations.gt: {
                const expectedThingCount = thingItems.filter(item => item.count > item1.count).length;
                expect(thingCount).to.equal(expectedThingCount);
                break;
              }
              case EntityQueryOperations.gte: {
                const expectedThingCount = thingItems.filter(item => item.count >= item1.count).length;
                expect(thingCount).to.equal(expectedThingCount);
                break;
              }
              case EntityQueryOperations.lt: {
                const expectedThingCount = thingItems.filter(item => item.count < item1.count).length;
                expect(thingCount).to.equal(expectedThingCount);
                break;
              }
              case EntityQueryOperations.lte: {
                const expectedThingCount = thingItems.filter(item => item.count <= item1.count).length;
                expect(thingCount).to.equal(expectedThingCount);
                break;
              }
              case EntityQueryOperations.scan: {
                expect(thingCount).to.equal(thingItems.length);
                break;
              }
            }
          });
        }
      });
    });

    describe("mutation operations", () => {
      // - should perform all mutation operations correctly on multi-attribute indexes: update, patch, upsert, put, create, delete, remove, transactGet, transactWrite
    })
  });
});