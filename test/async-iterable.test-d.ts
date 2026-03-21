import { expectType, expectError, expectAssignable } from "tsd";
import { Entity, Service, ElectroQueryResult } from "../index";

const table = "electro";

const entity = new Entity(
  {
    model: {
      entity: "task",
      version: "1",
      service: "taskapp",
    },
    attributes: {
      id: { type: "string" as const, required: true },
      name: { type: "string" as const, required: true },
      description: { type: "string" as const },
      status: { type: ["open", "closed"] as const, required: true },
      count: { type: "number" as const },
    },
    indexes: {
      primary: {
        pk: {
          field: "pk",
          composite: ["id"] as const,
        },
        sk: {
          field: "sk",
          composite: [] as const,
        },
      },
      byName: {
        index: "gsi1pk-gsi1sk-index",
        pk: {
          field: "gsi1pk",
          composite: ["name"] as const,
        },
        sk: {
          field: "gsi1sk",
          composite: ["status"] as const,
        },
      },
    },
  },
  { table },
);

const projectionEntity = new Entity(
  {
    model: {
      entity: "projection",
      version: "1",
      service: "projservice",
    },
    attributes: {
      id: { type: "string" as const, required: true },
      projected1: { type: "string" as const, required: true },
      projected2: { type: "boolean" as const },
      projected3: { type: "number" as const },
      notProjected1: { type: "string" as const },
      notProjected2: { type: "number" as const },
    },
    indexes: {
      primary: {
        pk: {
          field: "pk",
          composite: ["id"] as const,
        },
        sk: {
          field: "sk",
          composite: [] as const,
        },
      },
      includeIndex: {
        index: "gsi1pk-gsi1sk-index",
        projection: ["projected1", "projected2", "projected3"] as const,
        pk: {
          field: "gsi1pk",
          composite: ["id"] as const,
        },
        sk: {
          field: "gsi1sk",
          composite: [] as const,
        },
      },
      keysOnlyIndex: {
        index: "gsi2pk-gsi2sk-index",
        projection: "keys_only" as const,
        pk: {
          field: "gsi2pk",
          composite: ["id"] as const,
        },
        sk: {
          field: "gsi2sk",
          composite: [] as const,
        },
      },
      allIndex: {
        index: "gsi3pk-gsi3sk-index",
        pk: {
          field: "gsi3pk",
          composite: ["id"] as const,
        },
        sk: {
          field: "gsi3sk",
          composite: [] as const,
        },
      },
    },
  },
  { table },
);

const entityA = new Entity(
  {
    model: {
      entity: "entityA",
      version: "1",
      service: "myservice",
    },
    attributes: {
      id: { type: "string" as const, required: true },
      fieldA: { type: "string" as const, required: true },
      shared: { type: "string" as const },
    },
    indexes: {
      primary: {
        collection: "myCollection" as const,
        pk: {
          field: "pk",
          composite: ["id"] as const,
        },
        sk: {
          field: "sk",
          composite: [] as const,
        },
      },
      clustered: {
        index: "gsi1pk-gsi1sk-index",
        collection: "clusteredCollection" as const,
        type: "clustered" as const,
        pk: {
          field: "gsi1pk",
          composite: ["id"] as const,
        },
        sk: {
          field: "gsi1sk",
          composite: ["fieldA"] as const,
        },
      },
    },
  },
  { table },
);

const entityB = new Entity(
  {
    model: {
      entity: "entityB",
      version: "1",
      service: "myservice",
    },
    attributes: {
      id: { type: "string" as const, required: true },
      fieldB: { type: "number" as const, required: true },
      shared: { type: "string" as const },
    },
    indexes: {
      primary: {
        collection: "myCollection" as const,
        pk: {
          field: "pk",
          composite: ["id"] as const,
        },
        sk: {
          field: "sk",
          composite: [] as const,
        },
      },
      clustered: {
        index: "gsi1pk-gsi1sk-index",
        collection: "clusteredCollection" as const,
        type: "clustered" as const,
        pk: {
          field: "gsi1pk",
          composite: ["id"] as const,
        },
        sk: {
          field: "gsi1sk",
          composite: ["fieldB"] as const,
        },
      },
    },
  },
  { table },
);

const service = new Service({ entityA, entityB });

type FullItem = {
  id: string;
  name: string;
  description?: string | undefined;
  status: "open" | "closed";
  count?: number | undefined;
};

type FullProjectionItem = {
  id: string;
  projected1: string;
  projected2?: boolean | undefined;
  projected3?: number | undefined;
  notProjected1?: string | undefined;
  notProjected2?: number | undefined;
};

type ProjectedItem = {
  projected1: string;
  projected2?: boolean | undefined;
  projected3?: number | undefined;
};

type EntityAItem = {
  id: string;
  fieldA: string;
  shared?: string | undefined;
};

type EntityBItem = {
  id: string;
  fieldB: number;
  shared?: string | undefined;
};

// ElectroQueryResult structural tests

type QueryResponse = { data: FullItem[]; cursor: string | null };

const queryResult = entity.query.primary({ id: "1" }).go();
expectAssignable<PromiseLike<QueryResponse>>(queryResult);
expectAssignable<AsyncIterable<QueryResponse>>(queryResult);

const thenResult = entity.query.primary({ id: "1" }).go().then((r) => r.data);
expectType<Promise<FullItem[]>>(thenResult);

const catchResult = entity.query.primary({ id: "1" }).go().catch(() => null);
expectType<Promise<QueryResponse | null>>(catchResult);

const finallyResult = entity.query.primary({ id: "1" }).go().finally(() => {});
expectType<Promise<QueryResponse>>(finallyResult);

// Entity query on primary index

entity.query.primary({ id: "1" }).go().then((result) => {
  expectType<FullItem[]>(result.data);
  expectType<string | null>(result.cursor);
});

async function queryPrimaryIterable() {
  for await (const page of entity.query.primary({ id: "1" }).go()) {
    expectType<FullItem[]>(page.data);
    expectType<string | null>(page.cursor);
  }
}

entity.query.primary({ id: "1" }).go({ attributes: ["id", "name"] }).then((result) => {
  expectType<{ id: string; name: string }[]>(result.data);
  expectType<string | null>(result.cursor);
});

async function queryPrimaryAttributesIterable() {
  for await (const page of entity.query.primary({ id: "1" }).go({ attributes: ["id", "name"] })) {
    expectType<{ id: string; name: string }[]>(page.data);
    expectType<string | null>(page.cursor);
  }
}

// Entity query on GSI

entity.query.byName({ name: "test" }).go().then((result) => {
  expectType<FullItem[]>(result.data);
  expectType<string | null>(result.cursor);
});

async function queryGSIIterable() {
  for await (const page of entity.query.byName({ name: "test" }).go()) {
    expectType<FullItem[]>(page.data);
    expectType<string | null>(page.cursor);
  }
}

entity.query.byName({ name: "test" }).go({ attributes: ["id", "status"] }).then((result) => {
  expectType<{ id: string; status: "open" | "closed" }[]>(result.data);
  expectType<string | null>(result.cursor);
});

async function queryGSIAttributesIterable() {
  for await (const page of entity.query.byName({ name: "test" }).go({ attributes: ["id", "status"] })) {
    expectType<{ id: string; status: "open" | "closed" }[]>(page.data);
    expectType<string | null>(page.cursor);
  }
}

// Scan on primary table

entity.scan.go().then((result) => {
  expectType<FullItem[]>(result.data);
  expectType<string | null>(result.cursor);
});

async function scanIterable() {
  for await (const page of entity.scan.go()) {
    expectType<FullItem[]>(page.data);
    expectType<string | null>(page.cursor);
  }
}

entity.scan.go({ attributes: ["id", "count"] }).then((result) => {
  expectType<{ id: string; count?: number | undefined }[]>(result.data);
  expectType<string | null>(result.cursor);
});

async function scanAttributesIterable() {
  for await (const page of entity.scan.go({ attributes: ["id", "count"] })) {
    expectType<{ id: string; count?: number | undefined }[]>(page.data);
    expectType<string | null>(page.cursor);
  }
}

// Scan on secondary index

entity.scan.byName.go().then((result) => {
  expectType<FullItem[]>(result.data);
  expectType<string | null>(result.cursor);
});

async function indexScanIterable() {
  for await (const page of entity.scan.byName.go()) {
    expectType<FullItem[]>(page.data);
    expectType<string | null>(page.cursor);
  }
}

entity.scan.byName.go({ attributes: ["name", "status"] }).then((result) => {
  expectType<{ name: string; status: "open" | "closed" }[]>(result.data);
  expectType<string | null>(result.cursor);
});

async function indexScanAttributesIterable() {
  for await (const page of entity.scan.byName.go({ attributes: ["name", "status"] })) {
    expectType<{ name: string; status: "open" | "closed" }[]>(page.data);
    expectType<string | null>(page.cursor);
  }
}

// INCLUDE projection index — scan

projectionEntity.scan.includeIndex.go().then((result) => {
  expectType<ProjectedItem[]>(result.data);
  expectType<string | null>(result.cursor);
});

async function scanIncludeIterable() {
  for await (const page of projectionEntity.scan.includeIndex.go()) {
    expectType<ProjectedItem[]>(page.data);
    expectType<string | null>(page.cursor);
  }
}

projectionEntity.scan.includeIndex.go({ hydrate: true }).then((result) => {
  expectType<FullProjectionItem[]>(result.data);
  expectType<string | null>(result.cursor);
});

async function scanIncludeHydrateIterable() {
  for await (const page of projectionEntity.scan.includeIndex.go({ hydrate: true })) {
    expectType<FullProjectionItem[]>(page.data);
    expectType<string | null>(page.cursor);
  }
}

projectionEntity.scan.includeIndex.go({ hydrate: true, attributes: ["id", "projected1"] }).then((result) => {
  expectType<{ id: string; projected1: string }[]>(result.data);
  expectType<string | null>(result.cursor);
});

async function scanIncludeHydrateAttributesIterable() {
  for await (const page of projectionEntity.scan.includeIndex.go({ hydrate: true, attributes: ["id", "projected1"] })) {
    expectType<{ id: string; projected1: string }[]>(page.data);
    expectType<string | null>(page.cursor);
  }
}

expectError(() => projectionEntity.scan.includeIndex.go({ attributes: ["id"] }));

// INCLUDE projection index — query

projectionEntity.query.includeIndex({ id: "1" }).go().then((result) => {
  expectType<ProjectedItem[]>(result.data);
  expectType<string | null>(result.cursor);
});

async function queryIncludeIterable() {
  for await (const page of projectionEntity.query.includeIndex({ id: "1" }).go()) {
    expectType<ProjectedItem[]>(page.data);
    expectType<string | null>(page.cursor);
  }
}

expectError(() => projectionEntity.query.includeIndex({ id: "1" }).go({ attributes: ["id"] }));

projectionEntity.query.includeIndex({ id: "1" }).go({ hydrate: true, attributes: ["id", "projected1"] }).then((result) => {
  expectType<{ id: string; projected1: string }[]>(result.data);
  expectType<string | null>(result.cursor);
});

async function queryIncludeHydrateAttributesIterable() {
  for await (const page of projectionEntity.query.includeIndex({ id: "1" }).go({ hydrate: true, attributes: ["id", "projected1"] })) {
    expectType<{ id: string; projected1: string }[]>(page.data);
    expectType<string | null>(page.cursor);
  }
}

// keys_only projection index

projectionEntity.scan.keysOnlyIndex.go().then((result) => {
  expectType<{}[]>(result.data);
  expectType<string | null>(result.cursor);
});

async function scanKeysOnlyIterable() {
  for await (const page of projectionEntity.scan.keysOnlyIndex.go()) {
    expectType<{}[]>(page.data);
    expectType<string | null>(page.cursor);
  }
}

projectionEntity.scan.keysOnlyIndex.go({ hydrate: true }).then((result) => {
  expectType<FullProjectionItem[]>(result.data);
  expectType<string | null>(result.cursor);
});

async function scanKeysOnlyHydrateIterable() {
  for await (const page of projectionEntity.scan.keysOnlyIndex.go({ hydrate: true })) {
    expectType<FullProjectionItem[]>(page.data);
    expectType<string | null>(page.cursor);
  }
}

// ALL projection index (no restriction)

projectionEntity.scan.allIndex.go().then((result) => {
  expectType<FullProjectionItem[]>(result.data);
  expectType<string | null>(result.cursor);
});

async function scanAllIndexIterable() {
  for await (const page of projectionEntity.scan.allIndex.go()) {
    expectType<FullProjectionItem[]>(page.data);
    expectType<string | null>(page.cursor);
  }
}

async function scanAllIndexAttributesIterable() {
  for await (const page of projectionEntity.scan.allIndex.go({ attributes: ["id", "projected1"] })) {
    expectType<{ id: string; projected1: string }[]>(page.data);
    expectType<string | null>(page.cursor);
  }
}

// Collection query (isolated)

service.collections.myCollection({ id: "1" }).go().then((result) => {
  expectType<EntityAItem[]>(result.data.entityA);
  expectType<EntityBItem[]>(result.data.entityB);
  expectType<string | null>(result.cursor);
});

async function collectionIterable() {
  for await (const page of service.collections.myCollection({ id: "1" }).go()) {
    expectType<EntityAItem[]>(page.data.entityA);
    expectType<EntityBItem[]>(page.data.entityB);
    expectType<string | null>(page.cursor);
  }
}

// Collection query (clustered)

service.collections.clusteredCollection({ id: "1" }).go().then((result) => {
  expectType<EntityAItem[]>(result.data.entityA);
  expectType<EntityBItem[]>(result.data.entityB);
  expectType<string | null>(result.cursor);
});

async function clusteredCollectionIterable() {
  for await (const page of service.collections.clusteredCollection({ id: "1" }).go()) {
    expectType<EntityAItem[]>(page.data.entityA);
    expectType<EntityBItem[]>(page.data.entityB);
    expectType<string | null>(page.cursor);
  }
}

async function clusteredCollectionRangeIterable() {
  for await (const page of service.collections.clusteredCollection({ id: "1" }).gte({ fieldA: "abc" }).go()) {
    expectType<EntityAItem[]>(page.data.entityA);
    expectType<EntityBItem[]>(page.data.entityB);
    expectType<string | null>(page.cursor);
  }
}

// match and find

entity.match({ id: "1" }).go().then((result) => {
  expectType<FullItem[]>(result.data);
  expectType<string | null>(result.cursor);
});

async function matchIterable() {
  for await (const page of entity.match({ id: "1" }).go()) {
    expectType<FullItem[]>(page.data);
    expectType<string | null>(page.cursor);
  }
}

entity.find({ id: "1" }).go().then((result) => {
  expectType<FullItem[]>(result.data);
  expectType<string | null>(result.cursor);
});

async function findIterable() {
  for await (const page of entity.find({ id: "1" }).go()) {
    expectType<FullItem[]>(page.data);
    expectType<string | null>(page.cursor);
  }
}

entity.match({ id: "1" }).go({ attributes: ["id", "name"] }).then((result) => {
  expectType<{ id: string; name: string }[]>(result.data);
  expectType<string | null>(result.cursor);
});

async function matchAttributesIterable() {
  for await (const page of entity.match({ id: "1" }).go({ attributes: ["id", "name"] })) {
    expectType<{ id: string; name: string }[]>(page.data);
    expectType<string | null>(page.cursor);
  }
}

entity.find({ id: "1" }).go({ attributes: ["id", "status"] }).then((result) => {
  expectType<{ id: string; status: "open" | "closed" }[]>(result.data);
  expectType<string | null>(result.cursor);
});

async function findAttributesIterable() {
  for await (const page of entity.find({ id: "1" }).go({ attributes: ["id", "status"] })) {
    expectType<{ id: string; status: "open" | "closed" }[]>(page.data);
    expectType<string | null>(page.cursor);
  }
}

// Promise.all with different query types

async function promiseAllDifferentEntities() {
  const [r1, r2] = await Promise.all([
    entity.query.primary({ id: "1" }).go(),
    entityA.query.primary({ id: "2" }).go(),
  ]);
  expectType<FullItem[]>(r1.data);
  expectType<string | null>(r1.cursor);
  expectType<EntityAItem[]>(r2.data);
  expectType<string | null>(r2.cursor);
}

async function promiseAllQueryAndScan() {
  const [r1, r2] = await Promise.all([
    entity.query.primary({ id: "1" }).go(),
    entity.scan.go(),
  ]);
  expectType<FullItem[]>(r1.data);
  expectType<FullItem[]>(r2.data);
}

async function promiseAllWithAttributes() {
  const [r1, r2] = await Promise.all([
    entity.query.primary({ id: "1" }).go({ attributes: ["id", "name"] }),
    entity.query.byName({ name: "test" }).go({ attributes: ["id", "status"] }),
  ]);
  expectType<{ id: string; name: string }[]>(r1.data);
  expectType<{ id: string; status: "open" | "closed" }[]>(r2.data);
}

async function promiseAllWithCollection() {
  const [r1, r2] = await Promise.all([
    entity.query.primary({ id: "1" }).go(),
    service.collections.myCollection({ id: "1" }).go(),
  ]);
  expectType<FullItem[]>(r1.data);
  expectType<EntityAItem[]>(r2.data.entityA);
  expectType<EntityBItem[]>(r2.data.entityB);
}

async function promiseRace() {
  const result = await Promise.race([
    entity.query.primary({ id: "1" }).go(),
    entity.scan.go(),
  ]);
  expectType<FullItem[]>(result.data);
  expectType<string | null>(result.cursor);
}
