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
import { Service, Entity, EntityItem, EntityRecord, QueryResponse, createConversions, CollectionResponse } from "../";

function createSafeName() {
  return uuid().replace(/-/g, "_");
}

const client = new DocumentClient({
  region: "us-east-1",
  endpoint: process.env.LOCAL_DYNAMO_ENDPOINT ?? "http://localhost:8000",
  credentials: {
    accessKeyId: "test",
    secretAccessKey: "test",
  },
});

const table = "multi-attribute";

function expectSubset(label: string, received: any, expected: any) {
  try {
    if (received === undefined || received === null) {
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
  } catch (e: any) {
    console.log(JSON.stringify({ label, received, expected }, null, 4));
    throw e;
  }
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
          required: true,
        },
        region: {
          type: "string",
          field: 'attr2',
          required: true,
        },
        city: {
          type: "string",
          field: 'attr3',
          required: true,
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
        ttl: {
          type: "number",
          default: () => Date.now() + (1000 * 60 * 60), // 1 hour from now
        }
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
            composite: ["country", "region", "city"]
          },
          sk: {
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
type ThingQueryResponse = QueryResponse<ThingEntity>;

function createThingService(thing: ThingEntity, gizmo: ThingEntity) {
  return new Service({ thing, gizmo });
}

type ThingService = ReturnType<typeof createThingService>;
type InventoryCollectionResponse = CollectionResponse<ThingService, 'inventory'>;

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
    ttl: Date.now() + (1000 * 60 * 60), // 1 hour from now
    ...overrides,
  }
}

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

function expectExhaustiveSwitch(_: never): never {
  throw new Error(`Unhandled case in exhaustive check`);
}

describe("multi-attribute index support", () => {
  describe("parameter building", () => {
    const serviceName = createSafeName(); // important test namespacing
    const thing = createThingEntity({
      name: createSafeName(), // important test namespacing
      service: serviceName,
      client: client,
      table: table,
    });

    const gizmo = createThingEntity({
      name: createSafeName(), // important test namespacing
      service: serviceName,
      client: client,
      table: table,
    });

    const service = new Service({ thing, gizmo }, { client: client, table: table });

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
        const { manufacturer, model, id, ...rest } = item;
        const params = thing.update({ manufacturer, model, id }).set(rest).params<UpdateItemInput>();
        return { type: 'update', params };
      },
      patch: (item) => {
        const { manufacturer, model, id, ...rest } = item;
        const params = thing.patch({ manufacturer, model, id }).set(rest).params<UpdateItemInput>();
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
        const params = service.collections.inventory({ country, region, city }).begins({ manufacturer, model }).params<QueryInput>();
        return { type: 'collectionBegins', params };
      },
      collectionLt: (item) => {
        const { country, region, city, manufacturer, model, count } = item;
        const params = service.collections.inventory({ country, region, city }).lt({ manufacturer, model, count }).params<QueryInput>();
        return { type: 'collectionLt', params };
      },
      collectionLte: (item) => {
        const { country, region, city, manufacturer, model, count } = item;
        const params = service.collections.inventory({ country, region, city }).lte({ manufacturer, model, count }).params<QueryInput>();
        return { type: 'collectionLte', params };
      },
      collectionGt: (item) => {
        const { country, region, city, manufacturer, model, count } = item;
        const params = service.collections.inventory({ country, region, city }).gt({ manufacturer, model, count }).params<QueryInput>();
        return { type: 'collectionGt', params };
      },
      collectionGte: (item) => {
        const { country, region, city, manufacturer, model, count } = item;
        const params = service.collections.inventory({ country, region, city }).gte({ manufacturer, model, count }).params<QueryInput>();
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
              expectSubset(received.type, received.params[0]?.RequestItems?.[table][0].PutRequest?.Item, {
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
                [`:__edb_e___${thing.schema.model.entity}k_0`]: thing.schema.model.entity,
                [`:__edb_v___${thing.schema.model.entity}k_0`]: "1"
              });
              break;
            case "begins":
              expectSubset(received.type, received.params.ExpressionAttributeValues, {
                [`:__edb_e___${thing.schema.model.entity}k_0`]: thing.schema.model.entity,
                [`:__edb_v___${thing.schema.model.entity}k_0`]: "1"
              });
              break;
            case "gt":
              expectSubset(received.type, received.params.ExpressionAttributeValues, {
                [`:__edb_e___${thing.schema.model.entity}k_0`]: thing.schema.model.entity,
                [`:__edb_v___${thing.schema.model.entity}k_0`]: "1"
              });
              break;
            case "gte":
              expectSubset(received.type, received.params.ExpressionAttributeValues, {
                [`:__edb_e___${thing.schema.model.entity}k_0`]: thing.schema.model.entity,
                [`:__edb_v___${thing.schema.model.entity}k_0`]: "1"
              });
              break;
            case "lt":
              expectSubset(received.type, received.params.ExpressionAttributeValues, {
                [`:__edb_e___${thing.schema.model.entity}k_0`]: thing.schema.model.entity,
                [`:__edb_v___${thing.schema.model.entity}k_0`]: "1"
              });
              break;
            case "lte":
              expectSubset(received.type, received.params.ExpressionAttributeValues, {
                [`:__edb_e___${thing.schema.model.entity}k_0`]: thing.schema.model.entity,
                [`:__edb_v___${thing.schema.model.entity}k_0`]: "1"
              });
              break;
            case "between":
              expectSubset(received.type, received.params.ExpressionAttributeValues, {
                [`:__edb_e___${thing.schema.model.entity}k_0`]: thing.schema.model.entity,
                [`:__edb_v___${thing.schema.model.entity}k_0`]: "1"
              });
              break;
            case "collection":
              expectSubset(received.type, received.params.ExpressionAttributeValues, {
                ":__edb_e___thing_c0": thing.schema.model.entity,
                ":__edb_v___thing_c0": "1",
                ":__edb_e___gizmo_c0": gizmo.schema.model.entity,
                ":__edb_v___gizmo_c0": "1",
              });
              break;
            case "collectionBegins":
              expectSubset(received.type, received.params.ExpressionAttributeValues, {
                ":__edb_e___thing_c0": thing.schema.model.entity,
                ":__edb_v___thing_c0": "1",
                ":__edb_e___gizmo_c0": gizmo.schema.model.entity,
                ":__edb_v___gizmo_c0": "1",
              });
              break;
            case "collectionLt":
              expectSubset(received.type, received.params.ExpressionAttributeValues, {
                ":__edb_e___thing_c0": thing.schema.model.entity,
                ":__edb_v___thing_c0": "1",
                ":__edb_e___gizmo_c0": gizmo.schema.model.entity,
                ":__edb_v___gizmo_c0": "1",
              });
              break;
            case "collectionLte":
              expectSubset(received.type, received.params.ExpressionAttributeValues, {
                ":__edb_e___thing_c0": thing.schema.model.entity,
                ":__edb_v___thing_c0": "1",
                ":__edb_e___gizmo_c0": gizmo.schema.model.entity,
                ":__edb_v___gizmo_c0": "1",
              });
              break;
            case "collectionGt":
              expectSubset(received.type, received.params.ExpressionAttributeValues, {
                ":__edb_e___thing_c0": thing.schema.model.entity,
                ":__edb_v___thing_c0": "1",
                ":__edb_e___gizmo_c0": gizmo.schema.model.entity,
                ":__edb_v___gizmo_c0": "1",
              });
              break;
            case "collectionGte":
              expectSubset(received.type, received.params.ExpressionAttributeValues, {
                ":__edb_e___thing_c0": thing.schema.model.entity,
                ":__edb_v___thing_c0": "1",
                ":__edb_e___gizmo_c0": gizmo.schema.model.entity,
                ":__edb_v___gizmo_c0": "1",
              });
              break;
            case "collectionBetween":
              expectSubset(received.type, received.params.ExpressionAttributeValues, {
                ":__edb_e___thing_c0": thing.schema.model.entity,
                ":__edb_v___thing_c0": "1",
                ":__edb_e___gizmo_c0": gizmo.schema.model.entity,
                ":__edb_v___gizmo_c0": "1",
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
              expectExhaustiveSwitch(received);
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
              expect(received.params[0]?.RequestItems?.[table][0].PutRequest?.Item).to.not.have.keys(['gsi1pk', 'gsi1sk']);
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
              expectExhaustiveSwitch(received);
            }
          }
        });
      }
    })
  });

  describe("multi-attribute index validations", () => {
    describe("schema", () => {
      it('should allow a missing index field only on composite indexes', () => {
        expect(() => new Entity({
          model: {
            entity: 'test',
            version: '1',
            service: 'test',
          },
          attributes: {
            id: {
              type: 'string',
            },
            type: {
              type: 'string',
            }
          },
          indexes: {
            record: {
              pk: {
                composite: ['type'],
              },
              sk: {
                composite: ['id'],
              },
            },
          },
        })).to.throw(`The Access Pattern "record" is defined as a "isolated" index, but the Partition Key or Sort Key is defined without a field property. Unless using composite attributes, indexes must be defined with a field property that maps to the field name on the DynamoDB table KeySchema. - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#invalid-index-definition`);

        expect(() => new Entity({
          model: {
            entity: 'test',
            version: '1',
            service: 'test',
          },
          attributes: {
            id: {
              type: 'string',
            },
            type: {
              type: 'string',
            }
          },
          indexes: {
            record: {
              pk: {
                field: 'pk',
                composite: ['type'],
              },
              sk: {
                field: 'sk',
                composite: ['id'],
              },
            },
          },
        })).not.to.throw();

        expect(() => new Entity({
          model: {
            entity: 'test',
            version: '1',
            service: 'test',
          },
          attributes: {
            id: {
              type: 'string',
            },
            type: {
              type: 'string',
            }
          },
          indexes: {
            record: {
              pk: {
                field: 'pk',
                composite: ['type'],
              },
              sk: {
                field: 'sk',
                composite: ['id'],
              },
            },
            secondary: {
              index: 'gsi1pk-gsi1sk-index',
              pk: {
                composite: ['type'],
              },
              sk: {
                composite: ['id'],
              },
            }
          },
        })).to.throw(`The Access Pattern "secondary" is defined as a "isolated" index, but the Partition Key or Sort Key is defined without a field property. Unless using composite attributes, indexes must be defined with a field property that maps to the field name on the DynamoDB table KeySchema. - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#invalid-index-definition`);

        expect(() => new Entity({
          model: {
            entity: 'test',
            version: '1',
            service: 'test',
          },
          attributes: {
            id: {
              type: 'string',
            },
            type: {
              type: 'string',
            }
          },
          indexes: {
            record: {
              pk: {
                field: 'pk',
                composite: ['type'],
              },
              sk: {
                field: 'sk',
                composite: ['id'],
              },
            },
            secondary: {
              index: 'gsi1pk-gsi1sk-index',
              type: 'isolated',
              pk: {
                composite: ['type'],
              },
              sk: {
                composite: ['id'],
              },
            }
          },
        })).to.throw(`The Access Pattern "secondary" is defined as a "isolated" index, but the Partition Key or Sort Key is defined without a field property. Unless using composite attributes, indexes must be defined with a field property that maps to the field name on the DynamoDB table KeySchema. - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#invalid-index-definition`);

        expect(() => new Entity({
          model: {
            entity: 'test',
            version: '1',
            service: 'test',
          },
          attributes: {
            id: {
              type: 'string',
            },
            type: {
              type: 'string',
            }
          },
          indexes: {
            record: {
              pk: {
                field: 'pk',
                composite: ['type'],
              },
              sk: {
                field: 'sk',
                composite: ['id'],
              },
            },
            secondary: {
              index: 'gsi1pk-gsi1sk-index',
              type: 'clustered',
              pk: {
                composite: ['type'],
              },
              sk: {
                composite: ['id'],
              },
            }
          },
        })).to.throw(`The Access Pattern "secondary" is defined as a "clustered" index, but the Partition Key or Sort Key is defined without a field property. Unless using composite attributes, indexes must be defined with a field property that maps to the field name on the DynamoDB table KeySchema. - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#invalid-index-definition`);

        expect(() => new Entity({
          model: {
            entity: 'test',
            version: '1',
            service: 'test',
          },
          attributes: {
            id: {
              type: 'string',
            },
            type: {
              type: 'string',
            }
          },
          indexes: {
            record: {
              pk: {
                field: 'pk',
                composite: ['type'],
              },
              sk: {
                field: 'sk',
                composite: ['id'],
              },
            },
            secondary: {
              index: 'gsi1pk-gsi1sk-index',
              pk: {
                field: 'gsi1pk',
                composite: ['type'],
              },
              sk: {
                composite: ['id'],
              },
            }
          },
        })).to.throw(`The Access Pattern "secondary" is defined as a "isolated" index, but the Partition Key or Sort Key is defined without a field property. Unless using composite attributes, indexes must be defined with a field property that maps to the field name on the DynamoDB table KeySchema. - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#invalid-index-definition`);

        expect(() => new Entity({
          model: {
            entity: 'test',
            version: '1',
            service: 'test',
          },
          attributes: {
            id: {
              type: 'string',
            },
            type: {
              type: 'string',
            }
          },
          indexes: {
            record: {
              pk: {
                field: 'pk',
                composite: ['type'],
              },
              sk: {
                field: 'sk',
                composite: ['id'],
              },
            },
            secondary: {
              index: 'gsi1pk-gsi1sk-index',
              pk: {
                composite: ['type'],
              },
              sk: {
                field: 'gsi1sk',
                composite: ['id'],
              },
            }
          },
        })).to.throw(`The Access Pattern "secondary" is defined as a "isolated" index, but the Partition Key or Sort Key is defined without a field property. Unless using composite attributes, indexes must be defined with a field property that maps to the field name on the DynamoDB table KeySchema. - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#invalid-index-definition`);

        expect(() => new Entity({
          model: {
            entity: 'test',
            version: '1',
            service: 'test',
          },
          attributes: {
            id: {
              type: 'string',
            },
            type: {
              type: 'string',
            }
          },
          indexes: {
            record: {
              pk: {
                field: 'pk',
                composite: ['type'],
              },
              sk: {
                field: 'sk',
                composite: ['id'],
              },
            },
            secondary: {
              index: 'gsi1pk-gsi1sk-index',
              pk: {
                field: 'gsi1pk',
                composite: ['type'],
              },
              sk: {
                field: 'gsi1sk',
                composite: ['id'],
              },
            }
          },
        })).not.to.throw();

        expect(() => new Entity({
          model: {
            entity: 'test',
            version: '1',
            service: 'test',
          },
          attributes: {
            id: {
              type: 'string',
            },
            type: {
              type: 'string',
            }
          },
          indexes: {
            record: {
              pk: {
                field: 'pk',
                composite: ['type'],
              },
              sk: {
                field: 'sk',
                composite: ['id'],
              },
            },
            secondary: {
              index: 'gsi1pk-gsi1sk-index',
              type: 'clustered',
              pk: {
                field: 'gsi1pk',
                composite: ['type'],
              },
              sk: {
                composite: ['id'],
              },
            }
          },
        })).to.throw(`The Access Pattern "secondary" is defined as a "clustered" index, but the Partition Key or Sort Key is defined without a field property. Unless using composite attributes, indexes must be defined with a field property that maps to the field name on the DynamoDB table KeySchema. - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#invalid-index-definition`);

        expect(() => new Entity({
          model: {
            entity: 'test',
            version: '1',
            service: 'test',
          },
          attributes: {
            id: {
              type: 'string',
            },
            type: {
              type: 'string',
            }
          },
          indexes: {
            record: {
              pk: {
                field: 'pk',
                composite: ['type'],
              },
              sk: {
                field: 'sk',
                composite: ['id'],
              },
            },
            secondary: {
              index: 'gsi1pk-gsi1sk-index',
              type: 'clustered',
              pk: {
                composite: ['type'],
              },
              sk: {
                field: 'gsi1sk',
                composite: ['id'],
              },
            }
          },
        })).to.throw(`The Access Pattern "secondary" is defined as a "clustered" index, but the Partition Key or Sort Key is defined without a field property. Unless using composite attributes, indexes must be defined with a field property that maps to the field name on the DynamoDB table KeySchema. - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#invalid-index-definition`);

        expect(() => new Entity({
          model: {
            entity: 'test',
            version: '1',
            service: 'test',
          },
          attributes: {
            id: {
              type: 'string',
            },
            type: {
              type: 'string',
            }
          },
          indexes: {
            record: {
              pk: {
                field: 'pk',
                composite: ['type'],
              },
              sk: {
                field: 'sk',
                composite: ['id'],
              },
            },
            secondary: {
              index: 'gsi1pk-gsi1sk-index',
              type: 'clustered',
              pk: {
                field: 'gsi1pk',
                composite: ['type'],
              },
              sk: {
                field: 'gsi1sk',
                composite: ['id'],
              },
            }
          },
        })).not.to.throw();

        expect(() => new Entity({
          model: {
            entity: 'test',
            version: '1',
            service: 'test',
          },
          attributes: {
            id: {
              type: 'string',
            },
            type: {
              type: 'string',
            }
          },
          indexes: {
            record: {
              pk: {
                field: 'pk',
                composite: ['type'],
              },
              sk: {
                field: 'sk',
                composite: ['id'],
              },
            },
            secondary: {
              index: 'gsi1pk-gsi1sk-index',
              type: 'composite',
              pk: {
                composite: ['type'],
              },
              sk: {
                composite: ['id'],
              },
            }
          },
        })).not.to.throw();

        expect(() => new Entity({
          model: {
            entity: 'test',
            version: '1',
            service: 'test',
          },
          attributes: {
            id: {
              type: 'string',
            },
            type: {
              type: 'string',
            }
          },
          indexes: {
            record: {
              pk: {
                field: 'pk',
                composite: ['type'],
              },
              sk: {
                field: 'sk',
                composite: ['id'],
              },
            },
            secondary: {
              index: 'gsi1pk-gsi1sk-index',
              type: 'composite',
              pk: {
                field: 'gsi1pk',
                composite: ['type'],
              },
              sk: {
                composite: ['id'],
              },
            }
          },
        })).to.throw(`The Access Pattern "secondary" is defined as a "composite" index, but the Partition Key or Sort Key is defined with a field property. Composite indexes do not support the use of a field property, their attributes defined in the composite array define the indexes member attributes. - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#invalid-index-definition`);

        expect(() => new Entity({
          model: {
            entity: 'test',
            version: '1',
            service: 'test',
          },
          attributes: {
            id: {
              type: 'string',
            },
            type: {
              type: 'string',
            }
          },
          indexes: {
            record: {
              pk: {
                field: 'pk',
                composite: ['type'],
              },
              sk: {
                field: 'sk',
                composite: ['id'],
              },
            },
            secondary: {
              index: 'gsi1pk-gsi1sk-index',
              type: 'composite',
              pk: {
                composite: ['type'],
              },
              sk: {
                field: 'gsi1sk',
                composite: ['id'],
              },
            }
          },
        })).to.throw(`The Access Pattern "secondary" is defined as a "composite" index, but the Partition Key or Sort Key is defined with a field property. Composite indexes do not support the use of a field property, their attributes defined in the composite array define the indexes member attributes. - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#invalid-index-definition`);
      });

      it('should only allow secondary indexes to be composite indexes', () => {
        expect(() => new Entity({
          model: {
            entity: 'test',
            version: '1',
            service: 'test',
          },
          attributes: {
            id: {
              type: 'string',
            },
            type: {
              type: 'string',
            }
          },
          indexes: {
            record: {
              type: 'composite',
              pk: {
                field: 'pk',
                composite: ['type'],
              },
              sk: {
                field: 'sk',
                composite: ['id'],
              },
            },
          },
        })).to.throw(`The Access Pattern "record" cannot be defined as a composite index. AWS DynamoDB does not allow for composite indexes on the main table index. - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#invalid-index-definition`);
      });

      it('should not accept a `condition` callback on composite indexes', () => {
        expect(() => new Entity({
          model: {
            entity: 'test',
            version: '1',
            service: 'test',
          },
          attributes: {
            id: {
              type: 'string',
            },
            type: {
              type: 'string',
            }
          },
          indexes: {
            record: {
              pk: {
                field: 'pk',
                composite: ['type'],
              },
              sk: {
                field: 'sk',
                composite: ['id'],
              },
            },
            secondary: {
              index: 'gsi1pk-gsi1sk-index',
              condition: () => true,
              type: 'composite',
              pk: {
                composite: ['type'],
              },
              sk: {
                composite: ['id'],
              },
            }
          },
        })).to.throw(`The Access Pattern "secondary" is defined as a "composite" index, but a condition callback is defined. Composite indexes do not support the use of a condition callback. - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#invalid-index-option`);
      });

      it("should not accept a 'scope' value on composite indexes", () => {
        expect(() => new Entity({
          model: {
            entity: 'test',
            version: '1',
            service: 'test',
          },
          attributes: {
            id: {
              type: 'string',
            },
            type: {
              type: 'string',
            }
          },
          indexes: {
            record: {
              pk: {
                field: 'pk',
                composite: ['type'],
              },
              sk: {
                field: 'sk',
                composite: ['id'],
              },
            },
            secondary: {
              index: 'gsi1pk-gsi1sk-index',
              scope: 'abc',
              type: 'composite',
              pk: {
                composite: ['type'],
              },
              sk: {
                composite: ['id'],
              },
            }
          },
        })).to.throw(`The Access Pattern "secondary" is defined as a "composite" index, but a "scope" value was defined. Composite indexes do not support the use of scope. - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#invalid-index-option`);
      });
    });
  });

  describe("multi-attribute index aws connected tests", () => {
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

    const service = createThingService(thing, gizmo);

    describe("conversion use cases: pagination", () => {
      const entityName = createSafeName();
      const serviceName = createSafeName();
      const thing = createThingEntity({
        service: serviceName,
        name: entityName,
        client,
        table,
      });

      async function loadItems(country: string, region: string, city: string) {
        const itemCount = 100;
        const items = new Array(itemCount).fill({}).map(() => generateThingRecord({
          country,
          region,
          city,
        }));
        await thing.put(items).go();
        return items;
      }

      it("adding a limit should not cause dropped items when paginating", async () => {
        const country = uuid();
        const region = uuid();
        const city = uuid();
        const items = await loadItems(country, region, city);
        const limit = 10;
        let iterations = 0;
        let cursor: string | null = null;
        let results: ThingItem[] = [];
        do {
          const response: ThingQueryResponse = await thing.query
            .location({ country, region, city })
            .go({ cursor, limit });
          results = results.concat(response.data);
          cursor = response.cursor;
          iterations++;
        } while (cursor);

        expect(items.sort((a, z) => a.id.localeCompare(z.id))).to.deep.equal(
          results.sort((a, z) => a.id.localeCompare(z.id)),
        );
      });

      it("should let you use a entity level toCursor conversion to create a cursor based on the last item returned", async () => {
        const conversions = createConversions(thing);

        const country = uuid();
        const region = uuid();
        const city = uuid();
        const items = await loadItems(country, region, city);
        const limit = 10;
        let iterations = 0;
        let cursor: string | null = null;
        let results: ThingItem[] = [];
        do {
          const response: ThingQueryResponse = await thing.query
            .location({ country, region, city })
            .go({ cursor, limit });
          results = results.concat(response.data);
          const lastItem = response.data[response.data.length - 1];
          if (lastItem) {
            cursor = conversions.fromComposite.toCursor(
              lastItem,
            );
          } else {
            cursor = null;
          }
          iterations++;
        } while (cursor);

        expect(items.sort((a, z) => a.id.localeCompare(z.id))).to.deep.equal(
          results.sort((a, z) => a.id.localeCompare(z.id)),
        );
      });

      it("should let you use the index specific toCursor conversion to create a cursor based on the last item returned", async () => {
        const conversions = createConversions(thing);
        const country = uuid();
        const region = uuid();
        const city = uuid();
        const items = await loadItems(country, region, city);
        const limit = 10;
        let iterations = 0;
        let cursor: string | null = null;
        let results: ThingItem[] = [];
        do {
          const response: ThingQueryResponse = await thing.query
            .location({ country, region, city })
            .go({ cursor, limit });
          results = results.concat(response.data);
          const lastItem = response.data[response.data.length - 1];
          if (lastItem) {
            cursor = conversions.byAccessPattern.location.fromComposite.toCursor(lastItem);
          } else {
            cursor = null;
          }
          iterations++;
        } while (cursor);

        expect(items.sort((a, z) => a.id.localeCompare(z.id))).to.deep.equal(
          results.sort((a, z) => a.id.localeCompare(z.id)),
        );
      });
    });

    type PaginationOptions = {
      cursor: string | null;
      limit?: number;
    }

    describe("query operations", () => {
      const paginationOperations = {
        query: (item: ThingRecord) => {
          const { country, region, city, manufacturer, model } = item;
          return {
            type: "query" as const,
            op: ({ cursor, limit }: PaginationOptions) =>
              thing.query
                .location({ country, region, city, manufacturer, model })
                .go({ cursor, limit }),

          };
        },
        begins: (item: ThingRecord) => {
          const { country, region, city, manufacturer, model } = item;
          return {
            type: "begins" as const,
            op: ({ cursor, limit }: PaginationOptions) =>
              thing.query
                .location({ country, region, city })
                .begins({ manufacturer, model })
                .go({ cursor, limit }),
          };
        },
        gt: (item: ThingRecord) => {
          const { country, region, city, manufacturer, model, count } = item;
          return {
            type: "gt" as const,
            op: ({ cursor, limit }: PaginationOptions) =>
              thing.query
                .location({ country, region, city })
                .gt({ manufacturer, model, count })
                .go({ cursor, limit }),
          };
        },
        gte: (item: ThingRecord) => {
          const { country, region, city, manufacturer, model, count } = item;
          return {
            type: "gte" as const,
            op: ({ cursor, limit }: PaginationOptions) =>
              thing.query
                .location({ country, region, city })
                .gte({ manufacturer, model, count })
                .go({ cursor, limit }),
          };
        },
        lt: (item: ThingRecord) => {
          const { country, region, city, manufacturer, model, count } = item;
          return {
            type: "lt" as const,
            op: ({ cursor, limit }: PaginationOptions) =>
              thing.query
                .location({ country, region, city })
                .lt({ manufacturer, model, count })
                .go({ cursor, limit }),
          };
        },
        lte: (item: ThingRecord) => {
          const { country, region, city, manufacturer, model, count } = item;
          return {
            type: "lte" as const,
            op: ({ cursor, limit }: PaginationOptions) =>
              thing.query
                .location({ country, region, city })
                .lte({ manufacturer, model, count })
                .go({ cursor, limit }),
          };
        },
        between: (item1: ThingRecord, item2?: ThingRecord) => {
          if (!item2) {
            throw new Error("item2 is required for between operation");
          }
          const { country, region, city } = item1;
          return {
            type: "between" as const,
            op: ({ cursor, limit }: PaginationOptions) =>
              thing.query
                .location({ country, region, city })
                .between(
                  {
                    manufacturer: item1.manufacturer,
                    model: item1.model,
                    count: item1.count,
                  },
                  {
                    manufacturer: item2.manufacturer,
                    model: item2.model,
                    count: item2.count,
                  },
                )
                .go({ cursor, limit }),
          };
        },
        scan: () => {
          return {
            type: "scan" as const,
            op: ({ cursor, limit }: PaginationOptions) => thing.scan.go({ cursor, limit }),
          };
        },
        collection: (item: ThingRecord) => {
          const { country, region, city, manufacturer, model } = item;

          return {
            type: "collection" as const,
            op: ({ cursor, limit }: PaginationOptions) =>
              service.collections
                .inventory({ country, region, city, manufacturer, model })
                .go({ cursor, limit }),
          };
        },
        collectionBegins: (item: ThingRecord) => {
          const { country, region, city, manufacturer, model } = item;

          return {
            type: "collectionBegins" as const,
            op: ({ cursor, limit }: PaginationOptions) =>
              service.collections
                .inventory({ country, region, city })
                .begins({ manufacturer, model })
                .go({ cursor, limit }),
          };
        },
        collectionLt: (item: ThingRecord) => {
          const { country, region, city, manufacturer, model, count } = item;

          return {
            type: "collectionLt" as const,
            op: ({ cursor, limit }: PaginationOptions) =>
              service.collections
                .inventory({ country, region, city })
                .lt({ manufacturer, model, count })
                .go({ cursor, limit }),
          };
        },
        collectionLte: (item: ThingRecord) => {
          const { country, region, city, manufacturer, model, count } = item;

          return {
            type: "collectionLte" as const,
            op: ({ cursor, limit }: PaginationOptions) =>
              service.collections
                .inventory({ country, region, city })
                .lte({ manufacturer, model, count })
                .go({ cursor, limit }),
          };
        },
        collectionGt: (item: ThingRecord) => {
          const { country, region, city, manufacturer, model, count } = item;

          return {
            type: "collectionGt" as const,
            op: ({ cursor, limit }: PaginationOptions) =>
              service.collections
                .inventory({ country, region, city })
                .gt({ manufacturer, model, count })
                .go({ cursor, limit }),
          };
        },
        collectionGte: (item: ThingRecord) => {
          const { country, region, city, manufacturer, model, count } = item;

          return {
            type: "collectionGte" as const,
            op: ({ cursor, limit }: PaginationOptions) =>
              service.collections
                .inventory({ country, region, city })
                .gte({ manufacturer, model, count })
                .go({ cursor, limit }),
          };
        },
        collectionBetween: (item1: ThingRecord, item2?: ThingRecord) => {
          if (!item2) {
            throw new Error("item2 is required for between operation");
          }
          const { country, region, city } = item1;
          return {
            type: "collectionBetween" as const,
            op: ({ cursor, limit }: PaginationOptions) =>
              service.collections
                .inventory({ country, region, city })
                .between(
                  {
                    manufacturer: item1.manufacturer,
                    model: item1.model,
                    count: item1.count,
                  },
                  {
                    manufacturer: item2.manufacturer,
                    model: item2.model,
                    count: item2.count,
                  },
                )
                .go({ cursor, limit }),
          };
        },
      } as const satisfies Record<PaginationOperation, any>;

      describe("when paginating on a multi-attribute index", async () => {
        const country = uuid();
        const region = faker.location.state();
        const city = faker.location.city();
        const manufacturer = faker.company.name();
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

        for (const [operationName, genQuery] of Object.entries(
          paginationOperations,
        )) {
          it(`should paginate results correctly on multi-attribute indexes with ${operationName} operation`, async () => {
            const item1 = allThings.find((item) => item.count === 50);
            const item2 = allThings.find((item) => item.count === 70);
            const thingItem = thingItems[0];
            const gizmoItem = gizmoItems[0];
            if (
              item1 === undefined ||
              item2 === undefined ||
              thingItem === undefined ||
              gizmoItem === undefined
            ) {
              throw new Error("Invalid test setup");
            }
            const query = genQuery(item1, item2);
            // if this is as scan, don't limit (we aint got time for that)
            const limit = operationName === "scan" ? undefined : 2;

            let cursor: string | null = null;
            let thingCount = 0;
            let gizmoCount = 0;
            let iterations = 0;
            if (isEntityPaginationOperation(query.type)) {
              do {
                iterations++;
                const results = await query.op({ cursor, limit }) as ThingQueryResponse;
                cursor = results.cursor;
                if (Array.isArray(results.data)) {
                  thingCount += results.data.length;
                }
              } while (cursor !== null);
            } else if (isServicePaginationOperation(query.type)) {
              do {
                iterations++;
                const results = await query.op({ cursor, limit }) as InventoryCollectionResponse;
                cursor = results.cursor;
                if (
                  "thing" in results.data &&
                  Array.isArray(results.data.thing)
                ) {
                  thingCount += results.data.thing.length;
                }
                if (
                  "gizmo" in results.data &&
                  Array.isArray(results.data.gizmo)
                ) {
                  gizmoCount += results.data.gizmo.length;
                }
              } while (cursor !== null);
            }
            if (limit) {
              expect(iterations).to.be.greaterThan(1);
            }
            switch (query.type) {
              case ServiceQueryOperations.collectionBetween: {
                const expectedThingCount = thingItems.filter(
                  (item) =>
                    item.count >= item1.count && item.count <= item2.count,
                ).length;
                const expectedGizmoCount = gizmoItems.filter(
                  (item) =>
                    item.count >= item1.count && item.count <= item2.count,
                ).length;
                expect(thingCount).to.equal(expectedThingCount);
                expect(gizmoCount).to.equal(expectedGizmoCount);
                break;
              }
              case EntityQueryOperations.between: {
                const expectedThingCount = thingItems.filter(
                  (item) =>
                    item.count >= item1.count && item.count <= item2.count,
                ).length;
                expect(thingCount).to.equal(expectedThingCount);
                break;
              }
              case ServiceQueryOperations.collectionBegins: {
                const expectedThingCount = thingItems.filter((item) =>
                  item.model.startsWith(model),
                ).length;
                const expectedGizmoCount = gizmoItems.filter((item) =>
                  item.model.startsWith(model),
                ).length;
                expect(thingCount).to.equal(expectedThingCount);
                expect(gizmoCount).to.equal(expectedGizmoCount);
                break;
              }
              case EntityQueryOperations.begins: {
                const expectedThingCount = thingItems.filter((item) =>
                  item.model.startsWith(model),
                ).length;
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
                const expectedThingCount = thingItems.filter(
                  (item) => item.count > item1.count,
                ).length;
                const expectedGizmoCount = gizmoItems.filter(
                  (item) => item.count > item1.count,
                ).length;
                expect(thingCount).to.equal(expectedThingCount);
                expect(gizmoCount).to.equal(expectedGizmoCount);
                break;
              }
              case ServiceQueryOperations.collectionGte: {
                const expectedThingCount = thingItems.filter(
                  (item) => item.count >= item1.count,
                ).length;
                const expectedGizmoCount = gizmoItems.filter(
                  (item) => item.count >= item1.count,
                ).length;
                expect(thingCount).to.equal(expectedThingCount);
                expect(gizmoCount).to.equal(expectedGizmoCount);
                break;
              }
              case ServiceQueryOperations.collectionLt: {
                const expectedThingCount = thingItems.filter(
                  (item) => item.count < item1.count,
                ).length;
                const expectedGizmoCount = gizmoItems.filter(
                  (item) => item.count < item1.count,
                ).length;
                expect(thingCount).to.equal(expectedThingCount);
                expect(gizmoCount).to.equal(expectedGizmoCount);
                break;
              }
              case ServiceQueryOperations.collectionLte: {
                const expectedThingCount = thingItems.filter(
                  (item) => item.count <= item1.count,
                ).length;
                const expectedGizmoCount = gizmoItems.filter(
                  (item) => item.count <= item1.count,
                ).length;
                expect(thingCount).to.equal(expectedThingCount);
                expect(gizmoCount).to.equal(expectedGizmoCount);
                break;
              }
              case EntityQueryOperations.gt: {
                const expectedThingCount = thingItems.filter(
                  (item) => item.count > item1.count,
                ).length;
                expect(thingCount).to.equal(expectedThingCount);
                break;
              }
              case EntityQueryOperations.gte: {
                const expectedThingCount = thingItems.filter(
                  (item) => item.count >= item1.count,
                ).length;
                expect(thingCount).to.equal(expectedThingCount);
                break;
              }
              case EntityQueryOperations.lt: {
                const expectedThingCount = thingItems.filter(
                  (item) => item.count < item1.count,
                ).length;
                expect(thingCount).to.equal(expectedThingCount);
                break;
              }
              case EntityQueryOperations.lte: {
                const expectedThingCount = thingItems.filter(
                  (item) => item.count <= item1.count,
                ).length;
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

    describe("multi-attribute conversions", () => {
      it("should perform all conversions without loss starting with an item", () => {
        const conversions = createConversions(thing).byAccessPattern.location;
        const item = generateThingRecord({
          manufacturer: uuid(),
          model: uuid(),
          count: 99,
          city: uuid(),
          region: uuid(),
          country: uuid(),
          name: uuid(),
          description: uuid(),
          id: uuid(),
          entityName: uuid(),
          ttl: Date.now() + (1000 * 60 * 60),
        });

        const compositeOnlyItem = Object.fromEntries([
          ...thing.schema.indexes.thing.pk.composite,
          ...thing.schema.indexes.thing.sk.composite,
          ...thing.schema.indexes.location.pk.composite,
          ...thing.schema.indexes.location.sk.composite,
        ].map((attribute) => [attribute, item[attribute]]));

        const cursor = conversions.fromComposite.toCursor(item);
        expect(cursor).not.to.be.null;

        const keys = conversions.fromComposite.toKeys(item);
        expect(keys).not.to.be.null;

        const cursorFromKeys = conversions.fromKeys.toCursor(keys);
        expect(cursorFromKeys).not.to.be.null;
        expect(cursor).to.equal(cursorFromKeys);

        const keysFromCursor = conversions.fromCursor.toKeys(cursor);
        expect(keysFromCursor).not.to.be.null;
        expect(keys).to.deep.equal(keysFromCursor);

        const compositeFromCursor = conversions.fromCursor.toComposite(cursor);
        expect(compositeFromCursor).not.to.be.null;
        expect(compositeFromCursor).to.deep.equal(compositeOnlyItem);

        const compositeFromKeys = conversions.fromKeys.toComposite(keys);
        expect(compositeFromKeys).not.to.be.null;
        expect(compositeFromKeys).to.deep.equal(compositeOnlyItem);

        expect(Object.entries(compositeFromCursor).length).to.be.greaterThan(0);
        expect(!!compositeFromKeys).to.be.true;
        expect(Object.entries(compositeFromKeys).length).to.be.greaterThan(0);
        expect(Object.entries(compositeFromCursor).length).to.equal(Object.entries(compositeFromKeys).length);
      });
    });

    function compare(provided: string | number, expected: string | number, operation: PaginationOperation): boolean {
      switch (operation) {
        case EntityQueryOperations.begins:
        case ServiceQueryOperations.collectionBegins:
          if (typeof provided === "string" && typeof expected === "string") {
            return provided.startsWith(expected);
          }
          return false; // If not both strings, begins doesn't match
        case EntityQueryOperations.gt:
        case ServiceQueryOperations.collectionGt:
          return provided > expected;
        case EntityQueryOperations.gte:
        case ServiceQueryOperations.collectionGte:
          return provided >= expected;
        case EntityQueryOperations.lt:
        case ServiceQueryOperations.collectionLt:
          return provided < expected;
        case EntityQueryOperations.lte:
        case ServiceQueryOperations.collectionLte:
          return provided <= expected;
        default:
          return provided === expected;
      }
    }

    type FilterObj = { manufacturer?: string, model?: string, count?: number, name?: string };
    const order = [undefined, "manufacturer", "model", "count", "name"] as const;

    function getLastProvided(filter: FilterObj): keyof FilterObj | undefined {
      let lastProvided: keyof FilterObj | undefined = undefined;
      for (let i = 0; i < order.length; i++) {
        const curr = order[i];
        if (curr !== undefined && filter[curr] !== undefined) {
          lastProvided = curr;
          // Don't break - continue to find the LAST provided key
        }
      }
      return lastProvided;
    }

    function filterItemsByPartialSortKey(items: ThingItem[], operation: PaginationOperation, filters: FilterObj): ThingItem[] {
      const lastProvided = getLastProvided(filters);
      if (!lastProvided) {
        return items;
      }

      return items.filter((item) => {
        return order.every((key) => {
          if (key === undefined) {
            return true; // skip keys beyond what the filter specifies
          }
          const expected = filters[key];
          const provided = item[key];
          if (expected === undefined) {
            return true; // skip keys beyond what the filter specifies
          }
          if (provided === undefined) {
            return false;
          }
          if (key === lastProvided) {
            return compare(provided, expected, operation);
          }
          return compare(provided, expected, EntityQueryOperations.query);
        })
      })
    }

    function filterItemsByPartialBetweenKey(items: ThingItem[], start: FilterObj, end: FilterObj): ThingItem[] {
      const left = filterItemsByPartialSortKey(items, EntityQueryOperations.gte, start);
      const right = filterItemsByPartialSortKey(items, EntityQueryOperations.lte, end);
      return left.filter((bottom) => right.find((top) => top.id === bottom.id));
    }

    function toFilterObject(thing: ThingItem, lastProvided: keyof FilterObj): FilterObj {
      const filterObj: FilterObj = {};
      for (const key of order) {
        if (key === undefined) {
          continue;
        }
        const value = thing[key];
        filterObj[key] = value as any;
        if (key === lastProvided) {
          break;
        }
      }
      return filterObj;
    }

    describe("partially provided sort keys with multi-attribute index", () => {
      const serviceName = createSafeName();
      const thing = createThingEntity({
        name: createSafeName(),
        service: serviceName,
        client,
        table,
      });

      const gizmo = createThingEntity({
        name: createSafeName(),
        service: serviceName,
        client,
        table,
      });

      const service = createThingService(thing, gizmo);

      const country = uuid();
      const region = uuid();
      const city = uuid();

      const allThings: ThingRecord[] = [];
      const thingItems: ThingRecord[] = [];
      const gizmoItems: ThingRecord[] = [];
      for (let i = 0; i < 100; i++) {
        const item = generateThingRecord({
          count: i + 1,
          country,
          region,
          city,
        });
        allThings.push(item);
        if (i % 2 === 0) {
          thingItems.push(item);
        } else {
          gizmoItems.push(item);
        }
      }

      let sortedThingItems: ThingItem[] = [];
      let sortedGizmoItems: ThingItem[] = [];
      let middleThing: ThingItem | null = null;
      let middleGizmo: ThingItem | null = null;

      describe("partially provided entity sort keys", () => {
        before(async () => {
          await Promise.all([
            thing.put(thingItems).go(),
            gizmo.put(gizmoItems).go(),
          ]);

          const items = await service.collections.inventory({ country, region, city }).go({ pages: 'all' });
          for (const item of items.data.gizmo) {
            sortedGizmoItems.push(item);
          }
          for (const item of items.data.thing) {
            sortedThingItems.push(item);
          }
          expect(sortedGizmoItems.length + sortedThingItems.length).to.equal(allThings.length);
          middleThing = sortedThingItems[Math.floor(sortedThingItems.length / 2)];
          middleGizmo = sortedGizmoItems[Math.floor(sortedGizmoItems.length / 2)];
          expect(middleThing).to.not.be.null;
          expect(middleGizmo).to.not.be.null;
        });

        for (const lastProvided of thing.schema.indexes.location.sk.composite) {
          const entityComparisonMethods = [
            EntityQueryOperations.query,
            EntityQueryOperations.between,
            EntityQueryOperations.gt,
            EntityQueryOperations.gte,
            EntityQueryOperations.lt,
            EntityQueryOperations.lte,
          ];

          for (const method of entityComparisonMethods) {
            it(`should correctly filter entity items based on partially provided sort key values using ${method} on the last provided key ${lastProvided}`, async () => {
              if (!middleThing) {
                throw new Error("middleThing is null");
              }

              const filter = toFilterObject(middleThing, lastProvided);

              if (method === EntityQueryOperations.query) {
                const results = await thing.query.location({ country, region, city, ...filter }).go({ pages: 'all' });
                expect(results.data).to.deep.equal(filterItemsByPartialSortKey(sortedThingItems, method, filter));
                return;
              }

              if (method === EntityQueryOperations.between) {
                const lastItem = sortedThingItems[sortedThingItems.length - 1];

                // Avoid the error "The BETWEEN operator requires upper bound to be greater than or equal to lower bound"
                const filter1 = toFilterObject({ ...middleThing }, lastProvided);
                const filter2 = toFilterObject({ ...middleThing, [lastProvided]: lastItem[lastProvided] }, lastProvided);
                const [startFilter, endFilter] = [filter1, filter2].sort((a, b) => a[lastProvided]! < b[lastProvided]! ? -1 : 1);

                const results = await thing.query.location({ country, region, city }).between(startFilter, endFilter).go({ pages: 'all' });
                expect(results.data).to.deep.equal(filterItemsByPartialBetweenKey(sortedThingItems, startFilter, endFilter));
                return;
              }

              const results = await thing.query.location({ country, region, city })[method](filter).go({ pages: 'all' });
              expect(results.data).to.deep.equal(filterItemsByPartialSortKey(sortedThingItems, method, filter));

            });
          }

          const serviceComparisonMethods = [
            EntityQueryOperations.gt,
            EntityQueryOperations.gte,
            EntityQueryOperations.lt,
            EntityQueryOperations.lte,
            EntityQueryOperations.between,
            ServiceQueryOperations.collection,
          ] as const;

          for (const method of serviceComparisonMethods) {
            it(`should correctly filter collection items based on partially provided sort key values using ${method} on the last provided key ${lastProvided}`, async () => {
              if (!middleThing) {
                throw new Error("middleThing is null");
              }

              const filter = toFilterObject(middleThing, lastProvided);

              if (method === ServiceQueryOperations.collection) {
                const results = await service.collections.inventory({ country, region, city, ...filter }).go({ pages: 'all' });
                expect(results.data.gizmo).to.deep.equal(filterItemsByPartialSortKey(sortedGizmoItems, method, filter));
                expect(results.data.thing).to.deep.equal(filterItemsByPartialSortKey(sortedThingItems, method, filter));
                return;
              }

              if (method === EntityQueryOperations.between) {
                const lastItem = sortedGizmoItems[sortedGizmoItems.length - 1];
                const filter1 = toFilterObject({ ...middleThing }, lastProvided);
                const filter2 = toFilterObject({ ...middleThing, [lastProvided]: lastItem[lastProvided] }, lastProvided);
                const [startFilter, endFilter] = [filter1, filter2].sort((a, b) => a[lastProvided]! < b[lastProvided]! ? -1 : 1);
                const results = await service.collections.inventory({ country, region, city }).between(startFilter, endFilter).go({ pages: 'all' });
                expect(results.data.gizmo).to.deep.equal(filterItemsByPartialBetweenKey(sortedGizmoItems, startFilter, endFilter));
                expect(results.data.thing).to.deep.equal(filterItemsByPartialBetweenKey(sortedThingItems, startFilter, endFilter));
                return;
              }

              const results = await service.collections.inventory({ country, region, city })[method](filter).go({ pages: 'all' });
              expect(results.data.gizmo).to.deep.equal(filterItemsByPartialSortKey(sortedGizmoItems, method, filter));
              expect(results.data.thing).to.deep.equal(filterItemsByPartialSortKey(sortedThingItems, method, filter));

            });
          }
        }
      });
    });

    describe("edge cases", () => {
      describe("when entity names have special characters", () => {
        // Entity names/aliases and version values are the values used to
        // uniquely identify an Entity within a service. These values are
        // stored on DynamoDB items using "identifier" attributes. When
        // building filter expressions for these identifier attributes we
        // must also make the ExpressionAttributeNames and
        // ExpressionAttributeValues unique within the context of the query
        // operation. There are also character restrictions on these values
        // imposed by DynamoDB. We use the name/alias of the Entity to help
        // create these unique values. Howevery, if the Entity name/alias
        // contains special characters that are not allowed in DynamoDB
        // ExpressionAttributeNames/Values we must remove them. This can lead
        // to potential collisions between different Entity names/aliases
        // that when stripped of special characters become identical.
        //
        // These tests ensure that at a minimum queries can be performed
        // successfully even when special characters are present in the
        // Entity name/alias.
        it("should perform entity queries without failure", async () => {
          const thing = createThingEntity({
            name: "0*(illegal-characters.arebad!!",
            service: uuid(),
            client,
            table,
          });

          const params = thing.query
            .location({
              country: "usa",
              region: "ga",
              city: "atlanta",
            }).params({});

          expect(params).to.deep.equal({
            "IndexName": "gsi1",
            "KeyConditionExpression": "#country = :countryk_0 AND #region = :regionk_0 AND #city = :cityk_0",
            "TableName": "multi-attribute",
            "ExpressionAttributeNames": {
              "#country": "attr1",
              "#region": "attr2",
              "#city": "attr3",
              "#__edb_e__": "__edb_e__",
              "#__edb_v__": "__edb_v__"
            },
            "ExpressionAttributeValues": {
              ":countryk_0": "usa",
              ":regionk_0": "ga",
              ":cityk_0": "atlanta",
              ":__edb_e___0illegalcharactersarebadk_0": "0*(illegal-characters.arebad!!",
              ":__edb_v___0illegalcharactersarebadk_0": "1"
            },
            "FilterExpression": "(#__edb_e__ = :__edb_e___0illegalcharactersarebadk_0 AND #__edb_v__ = :__edb_v___0illegalcharactersarebadk_0)"
          });

          await thing.query
            .location({
              country: "usa",
              region: "ga",
              city: "atlanta",
            })
            .go();
        });

        it("should perform collection queries without failure", async () => {
          const thingName = "0*(illegal-characters.arebad!!";
          const thing = createThingEntity({
            name: thingName,
            service: uuid(),
            client,
            table,
          });

          const gizmoName = "1*(illegal-characters.superbad!!";
          const gizmo = createThingEntity({
            name: gizmoName,
            service: thing.schema.model.service,
            client,
            table,
          });

          const service = new Service({
            [thingName]: thing,
            [gizmoName]: gizmo
          });

          const params = (service.collections.inventory({
            country: "usa",
            region: "ga",
            city: "atlanta",
          })).params();

          expect(params).to.deep.equal({
            "IndexName": "gsi1",
            "KeyConditionExpression": "#country = :countryk_0 AND #region = :regionk_0 AND #city = :cityk_0",
            "TableName": "multi-attribute",
            "ExpressionAttributeNames": {
              "#country": "attr1",
              "#region": "attr2",
              "#city": "attr3",
              "#__edb_e__": "__edb_e__",
              "#__edb_v__": "__edb_v__"
            },
            "ExpressionAttributeValues": {
              ":countryk_0": "usa",
              ":regionk_0": "ga",
              ":cityk_0": "atlanta",
              ":__edb_e___0illegalcharactersarebad_c0": "0*(illegal-characters.arebad!!",
              ":__edb_v___0illegalcharactersarebad_c0": "1",
              ":__edb_e___1illegalcharacterssuperbad_c0": "1*(illegal-characters.superbad!!",
              ":__edb_v___1illegalcharacterssuperbad_c0": "1"
            },
            "FilterExpression": "((#__edb_e__ = :__edb_e___0illegalcharactersarebad_c0 AND #__edb_v__ = :__edb_v___0illegalcharactersarebad_c0) OR (#__edb_e__ = :__edb_e___1illegalcharacterssuperbad_c0 AND #__edb_v__ = :__edb_v___1illegalcharacterssuperbad_c0))"
          });

          await service.collections.inventory({
            country: "usa",
            region: "ga",
            city: "atlanta",
          }).go();
        });

        it('should handle case where removing special characters can result in lack of uniqueness between names', async () => {
          const thingName = "0*(illegal-characters.arebad!!";
          const gizmoName = "0*(illegal-characters!!arebad.";
          // These names must be unique but
          expect(thingName).to.not.equal(gizmoName);

          const thing = createThingEntity({
            name: thingName,
            service: uuid(),
            client,
            table,
          });

          const gizmo = createThingEntity({
            name: gizmoName,
            service: thing.schema.model.service,
            client,
            table,
          });

          const service = new Service({
            [thingName]: thing,
            [gizmoName]: gizmo
          });

          const params = (service.collections.inventory({
            country: "usa",
            region: "ga",
            city: "atlanta",
          })).params();

          expect(params).to.deep.equal({
            "IndexName": "gsi1",
            "KeyConditionExpression": "#country = :countryk_0 AND #region = :regionk_0 AND #city = :cityk_0",
            "TableName": "multi-attribute",
            "ExpressionAttributeNames": {
              "#country": "attr1",
              "#region": "attr2",
              "#city": "attr3",
              "#__edb_e__": "__edb_e__",
              "#__edb_v__": "__edb_v__"
            },
            "ExpressionAttributeValues": {
              ":countryk_0": "usa",
              ":regionk_0": "ga",
              ":cityk_0": "atlanta",
              ":__edb_e___0illegalcharactersarebad_c0": "0*(illegal-characters.arebad!!",
              ":__edb_v___0illegalcharactersarebad_c0": "1",
              // we can see in these params that the collision was handled by
              // appending a _2 to the second occurrence
              ":__edb_e___0illegalcharactersarebad_2_c0": "0*(illegal-characters!!arebad.",
              ":__edb_v___0illegalcharactersarebad_2_c0": "1"
            },
            "FilterExpression": "((#__edb_e__ = :__edb_e___0illegalcharactersarebad_c0 AND #__edb_v__ = :__edb_v___0illegalcharactersarebad_c0) OR (#__edb_e__ = :__edb_e___0illegalcharactersarebad_2_c0 AND #__edb_v__ = :__edb_v___0illegalcharactersarebad_2_c0))"
          });

          await service.collections.inventory({
            country: "usa",
            region: "ga",
            city: "atlanta",
          }).go();
        })
      });
    });
  },
  );

  describe("multi-attribute index documentation examples", () => {
    function createInventoryItemEntity() {
      return new Entity({
        model: {
          entity: "inventoryitem",
          version: "1",
          service: "warehouse",
        },
        attributes: {
          id: {
            type: "string",
            required: true,
          },
          country: {
            type: "string",
            field: "attr1",
            required: true,
          },
          region: {
            type: "string",
            field: "attr2",
            required: true,
          },
          city: {
            type: "string",
            field: "attr3",
            required: true,
          },
          manufacturer: {
            type: "string",
            field: "attr4",
          },
          model: {
            type: "string",
          },
          count: {
            type: "number",
            field: "attr5",
          },
          productName: {
            type: "string",
            field: "attr6",
          },
        },
        indexes: {
          record: {
            pk: {
              field: "pk",
              composite: ["manufacturer"],
            },
            sk: {
              field: "sk",
              composite: ["model", "id"],
            },
          },
          location: {
            index: "gsi1",
            type: "composite",
            collection: "inventory", // shared collection name
            pk: {
              composite: ["country", "region"],
            },
            sk: {
              composite: ["city", "manufacturer", "count", "productName"],
            },
          },
        },
      },
        { table: "your_table_name", client },
      );
    }

    function createWarehouseEntity() {
      return new Entity(
        {
          model: {
            entity: "warehouse",
            version: "1",
            service: "warehouse",
          },
          attributes: {
            warehouseId: {
              type: "string",
              required: true,
              field: "attr4",
            },
            country: {
              type: "string",
              field: "attr1",
              required: true,
            },
            region: {
              type: "string",
              field: "attr2",
              required: true,
            },
            city: {
              type: "string",
              field: "attr3",
              required: true,
            },
            streetAddress: {
              type: "string",
            },
          },
          indexes: {
            record: {
              pk: {
                field: "pk",
                composite: ["warehouseId"],
              },
              sk: {
                field: "sk",
                composite: [],
              },
            },
            location: {
              index: "gsi1",
              type: "composite",
              collection: "inventory",
              pk: {
                composite: ["country", "region"],
              },
              sk: {
                composite: ["city", "warehouseId"],
              },
            },
          },
        },
        { table: "your_table_name", client },
      );
    }

    it("entities should pass schema validation", () => {
      // shouldn't throw
      const InventoryItem = createInventoryItemEntity();
      const Warehouse = createWarehouseEntity();
      new Service({ InventoryItem, Warehouse });
    })

    it("should perform queries without failure", () => {
      const InventoryItem = createInventoryItemEntity();
      const Warehouse = createWarehouseEntity();
      const service = new Service({ InventoryItem, Warehouse });

      InventoryItem.query
        .location({ country: "US", region: "Georgia", })
        .begins({ city: "Atlanta", manufacturer: "A" })
        .params();

      InventoryItem.query
        .location({ country: "US", region: "Georgia" })
        .gt({ city: "Atlanta", manufacturer: "Acme", count: 100 })
        .params();

      InventoryItem.query
        .location({ country: "US", region: "Georgia" })
        .between(
          { city: "Atlanta", manufacturer: "Acme", count: 50 },
          { city: "Atlanta", manufacturer: "Acme", count: 200 },
        )
        .params();

      service.collections
        .inventory({ country: "US", region: "Georgia", city: "Atlanta" })
        .params();
        
      service.collections
        .inventory({ country: "US", region: "Georgia" })
        .begins({ city: "A" })
        .params();
    });
  })
});