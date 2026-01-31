import { Entity, Service } from "../index";

export const hold = new Entity(
  {
    model: {
      entity: "hold",
      version: "1",
      service: "transactions",
    },
    attributes: {
      prop1: {
        type: "string",
      },
      prop2: {
        type: "string",
      },
      prop3: {
        type: "string",
      },
    },
    indexes: {
      projects: {
        collection: "clusteredAll",
        type: "clustered",
        pk: {
          field: "pk",
          composite: ["prop1"],
        },
        sk: {
          field: "sk",
          composite: ["prop2", "prop3"],
        },
      },
      other: {
        index: "two",
        collection: "emptyAll",
        // type: 'clustered',
        pk: {
          field: "pk2",
          composite: ["prop1"],
        },
        sk: {
          field: "sk2",
          composite: ["prop2", "prop3"],
        },
      },
      last: {
        index: "three",
        collection: "isolatedSome",
        type: "clustered",
        pk: {
          field: "pk3",
          composite: ["prop1"],
        },
        sk: {
          field: "sk3",
          composite: ["prop2", "prop3"],
        },
      },
    },
  },
);

export const deposit = new Entity(
  {
    model: {
      entity: "hold",
      version: "1",
      service: "transactions",
    },
    attributes: {
      prop1: {
        type: "string",
      },
      prop2: {
        type: "string",
      },
      prop3: {
        type: "string",
      },
    },
    indexes: {
      projects: {
        collection: "clusteredAll",
        type: "clustered",
        pk: {
          field: "pk",
          composite: ["prop1"],
        },
        sk: {
          field: "sk",
          composite: ["prop2", "prop3"],
        },
      },
      other: {
        index: "two",
        collection: "emptyAll",
        // type: 'clustered',
        pk: {
          field: "pk2",
          composite: ["prop1"],
        },
        sk: {
          field: "sk2",
          composite: ["prop2", "prop3"],
        },
      },
      last: {
        index: "three",
        type: "clustered",
        collection: "clusteredOne",
        pk: {
          field: "pk3",
          composite: ["prop1"],
        },
        sk: {
          field: "sk3",
          composite: ["prop2", "prop3"],
        },
      },
    },
  },
);

export const debit = new Entity(
  {
    model: {
      entity: "debit",
      version: "1",
      service: "transactions",
    },
    attributes: {
      prop1: {
        type: "string",
      },
      prop2: {
        type: "string",
      },
      prop4: {
        type: "number",
      },
    },
    indexes: {
      projects: {
        collection: "clusteredAll",
        type: "clustered",
        pk: {
          field: "pk",
          composite: ["prop1"],
        },
        sk: {
          field: "sk",
          composite: ["prop2", "prop4"],
        },
      },
      other: {
        index: "two",
        collection: "emptyAll",
        pk: {
          field: "pk2",
          composite: ["prop1"],
        },
        sk: {
          field: "sk2",
          composite: ["prop2", "prop4"],
        },
      },
      last: {
        index: "three",
        collection: "isolatedSome",
        type: "clustered",
        pk: {
          field: "pk3",
          composite: ["prop1"],
        },
        sk: {
          field: "sk3",
          composite: ["prop2", "prop4"],
        },
      },
    },
  },
);

export const transactions = new Service({
  hold,
  deposit,
  debit,
});

export const projectionEntity = new Entity({
  model: {
    entity: "projection",
    version: "1",
    service: "transactions",
  },
  attributes: {
    id: { type: "string", required: true },
    include1: { type: "string", required: true },
    include2: { type: "boolean" },
    include3: { type: "number" },
    exclude1: { type: "string" },
    exclude2: { type: "number" },
    exclude3: { type: "boolean" },
  },
  indexes: {
    primary: {
      pk: {
        field: "pk",
        composite: ["id"],
      },
      sk: {
        field: "sk",
        composite: [],
      },
    },
    includeIndex: {
      index: "gsi1pk-gsi1sk-index",
      projection: ["include1", "include2", "include3"],
      collection: "includeIndexCollection",
      pk: {
        field: "gsi1pk",
        composite: ["id"],
      },
      sk: {
        field: "gsi1sk",
        composite: [],
      },
    },
    collectionAllIndex: {
      index: "gsi2pk-gsi2sk-index",
      collection: "collectionAllIndex",
      type: 'clustered',
      pk: {
        field: "gsi2pk",
        composite: ["id"],
      },
      sk: {
        field: "gsi2sk",
        composite: [],
      },
    },
    thirdIndex: {
      index: "gsi3pk-gsi3sk-index",
      pk: {
        field: "gsi3pk",
        composite: ["id"],
      },
      sk: {
        field: "gsi3sk",
        composite: [],
      },
    },
    excludeIndex: {
      index: "gsi4pk-gsi4sk-index",
      collection: "excludeCollection",
      projection: ["exclude1", "exclude2", "exclude3"],
      pk: {
        field: "gsi4pk",
        composite: ["id"],
      },
      sk: {
        field: "gsi4sk",
        composite: [],
      },
    },
    keysOnly: {
      index: "gsi5pk-gsi5sk-index",
      projection: "keys_only",
      collection: "keysOnlyCollection",
      pk: {
        field: "gsi5pk",
        composite: ["id"],
      },
      sk: {
        field: "gsi5sk",
        composite: [],
      },
    },
  },
});

export const projectionEntity2 = new Entity({
  model: {
    entity: "projection",
    version: "1",
    service: "transactions",
  },
  attributes: {
    id: { type: "string", required: true },
    include1: { type: "boolean", required: true },
    include2: { type: "boolean", required: true },
    include3: { type: "number", required: true },
    some1: { type: "string", required: true },
    some2: { type: "number", required: true },
    some3: { type: "boolean", required: true },
    exclude1: { type: "string", required: true },
    exclude2: { type: "number", required: true },
    exclude3: { type: "boolean", required: true },
  },
  indexes: {
    primary: {
      pk: {
        field: "pk",
        composite: ["id"],
      },
      sk: {
        field: "sk",
        composite: [],
      },
    },
    myIncludeIndex: {
      index: "gsi1pk-gsi1sk-index",
      projection: ["include1", "include2", "include3"],
      collection: "includeIndexCollection",
      pk: {
        field: "gsi1pk",
        composite: ["id"],
      },
      sk: {
        field: "gsi1sk",
        composite: [],
      },
    },
    collectionAllIndex: {
      index: "gsi2pk-gsi2sk-index",
      collection: "collectionAllIndex",
      type: "clustered",
      pk: {
        field: "gsi2pk",
        composite: ["id"],
      },
      sk: {
        field: "gsi2sk",
        composite: [],
      },
    },
    thirdIndex: {
      index: "gsi3pk-gsi3sk-index",
      pk: {
        field: "gsi3pk",
        composite: ["id"],
      },
      sk: {
        field: "gsi3sk",
        composite: [],
      },
    },
    excludeIndex: {
      index: "gsi4pk-gsi4sk-index",
      collection: "excludeCollection",
      projection: ["exclude1", "exclude2", "exclude3"],
      pk: {
        field: "gsi4pk",
        composite: ["id"],
      },
      sk: {
        field: "gsi4sk",
        composite: [],
      },
    },
    myKeysOnly: {
      index: "gsi5pk-gsi5sk-index",
      projection: "keys_only",
      collection: "keysOnlyCollection",
      pk: {
        field: "gsi5pk",
        composite: ["id"],
      },
      sk: {
        field: "gsi5sk",
        composite: [],
      },
    },
  },
});

export const unrelatedEntity = new Entity({
  model: {
    entity: "projection",
    version: "1",
    service: "transactions",
  },
  attributes: {
    id: { type: "string", required: true },
    unrelated: { type: "string", required: true },
  },
  indexes: {
    primary: {
      pk: {
        field: "pk",
        composite: ["id"],
      },
      sk: {
        field: "sk",
        composite: [],
      },
    },
    thirdCollectionIndex: {
      index: "gsi1pk-gsi1sk-index",
      collection: "thirdCollection",
      pk: {
        field: "gsi1pk",
        composite: ["id"],
      },
      sk: {
        field: "gsi1sk",
        composite: [],
      },
    },
  },
});

export const forthEntity = new Entity({
  model: {
    entity: "projection",
    version: "1",
    service: "transactions",
  },
  attributes: {
    id: { type: "string", required: true },
    forth: { type: "string", required: true },
  },
  indexes: {
    primary: {
      pk: {
        field: "pk",
        composite: ["id"],
      },
      sk: {
        field: "sk",
        composite: [],
      },
    },
  },
});

export const service = new Service({
  projectionEntity,
  projectionEntity2,
  unrelatedEntity,
  forthEntity,
});