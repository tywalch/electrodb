import { expectType, expectError, expectNotType } from "tsd";
import { Entity, Service } from "../index";
const table = "electro";
const hold = new Entity(
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
  { table },
);

const deposit = new Entity(
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
  { table },
);

const debit = new Entity(
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
  { table },
);

const transactions = new Service({
  hold,
  deposit,
  debit,
});

async function main() {
  const prop1 = "abc";
  const prop2 = "def";
  const prop3 = "hgi";

  transactions.collections
    .isolatedSome({ prop1, prop2, prop3 })
    .where((attr, op) => {
      expectError<Partial<typeof attr>>({ prop4: "10" });
      expectError(() => op.eq(attr.prop4, "10"));
      return op.eq(attr.prop4, 10);
    })
    .go()
    .then((resp) => resp.data)
    .then(({ debit, hold }) => {
      expectError<Partial<(typeof debit)[number]>>({ prop3: "abc" });
      return hold[0].prop3;
    });

  transactions.collections
    .clusteredAll({ prop1 })
    .gte({ prop2 })
    .where((attr, op) => {
      expectError(() => op.eq(attr.prop3, 5));
      return op.eq(attr.prop3, "abc");
    })
    .go()
    .then((resp) => resp.data)
    .then(({ deposit, hold, debit }) => {
      expectError<Partial<(typeof debit)[number]>>({ prop3: "abc" });
      return {
        deposits: deposit[0].prop3,
        holds: hold,
      };
    });

  transactions.collections
    .clusteredOne({ prop1 })
    .gte({ prop2 })
    .where((attr, op) => {
      expectError(() => op.eq(attr.prop3, 5));
      return op.eq(attr.prop3, "abc");
    })
    .go()
    .then((resp) => resp.data)
    .then(({ deposit }) => {
      expectError<Partial<(typeof deposit)[number]>>({ prop4: 123 });
      return {
        prop3: deposit[0].prop3,
      };
    });

  transactions.collections
    .emptyAll({ prop1 })
    .where((attr, op) => {
      expectError(() => op.eq(attr.prop3, 5));
      return op.eq(attr.prop3, "abc");
    })
    .go()
    .then((resp) => resp.data)
    .then(({ deposit, hold, debit }) => {
      expectError<Partial<(typeof deposit)[number]>>({ prop4: 123 });
      return {
        prop3: debit[0].prop4,
      };
    });
}

const projectionEntity = new Entity({
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
      project: ["include1", "include2", "include3"],
      pk: {
        field: "gsi1pk",
        composite: ["id"],
      },
      sk: {
        field: "gsi1sk",
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
      project: ["exclude1", "exclude2", "exclude3"],
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
      index: "gsi1pk-gsi1sk-index",
      project: "keys_only",
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

// scanning index with projected attributes should only return the projected attributes
projectionEntity.scan.includeIndex.go().then((resp) => {
  expectType<
    {
      include1: string;
      include2?: boolean | undefined;
      include3?: number | undefined;
    }[]
  >(resp.data);
});

// scanning index with projected attributes should only allow filtering on projected attributes
projectionEntity.scan.includeIndex
  .where((attrs, ops) => {
    expectError(() => ops.eq(attrs.id, "1"));
    return ops.eq(attrs.include1, "abc");
  })
  .go()
  .then((resp) => {
    expectType<
      {
        include1: string;
        include2?: boolean | undefined;
        include3?: number | undefined;
      }[]
    >(resp.data);
  });

// scanning index with projected attributes with hydrate should only allow filtering on projected attributes
projectionEntity.scan.includeIndex
  .where((attrs, ops) => {
    expectError(() => ops.eq(attrs.id, "1"));
    return ops.eq(attrs.include1, "abc");
  })
  .where((attrs, ops) => ops.eq(attrs.include2, true))
  .go({ hydrate: true })
  .then((resp) => {
    expectType<
      {
        id: string;
        include1: string;
        include2?: boolean | undefined;
        include3?: number | undefined;
        exclude1?: string | undefined;
        exclude2?: number | undefined;
        exclude3?: boolean | undefined;
      }[]
    >(resp.data);
  });

// scanning index with projected attributes with hydrate should return user-provided attributes but not allow filtering on non-projected attributes
projectionEntity.scan.includeIndex
  .where((attrs, ops) => {
    expectError(() => ops.eq(attrs.id, "1"));
    return ops.eq(attrs.include1, "abc");
  })
  .where((attrs, ops) => ops.eq(attrs.include2, true))
  .go({ hydrate: true, attributes: ["id"] })
  .then((resp) => {
    expectType<
      {
        id: string;
      }[]
    >(resp.data);
  });

// scanning index with projected items should not allow to specify non-projected attributes
expectError(() =>
  projectionEntity.scan.includeIndex.go({ attributes: ["id"] }),
);

// scanning index with projected items and hydrate should allow to specify non-projected attributes
projectionEntity.scan.includeIndex
  .where((attrs, ops) => ops.eq(attrs.include2, true))
  .go({ hydrate: true, attributes: ["id", "include1"] })
  .then((resp) => {
    expectType<
      {
        id: string;
        include1: string;
      }[]
    >(resp.data);
  });

// ==== QUERYING ====

// querying index with projected attributes should only return the projected attributes
projectionEntity.query
  .includeIndex({ id: "1" })
  .go()
  .then((resp) => {
    expectType<
      {
        include1: string;
        include2?: boolean | undefined;
        include3?: number | undefined;
      }[]
    >(resp.data);
  });

// querying index with projected attributes should only allow filtering on projected attributes
projectionEntity.query
  .includeIndex({ id: "1" })
  .where((attrs, ops) => {
    expectError(() => ops.eq(attrs.id, "1"));
    return ops.eq(attrs.include1, "abc");
  })
  .where((attrs, ops) => ops.eq(attrs.include2, true))
  .go({ hydrate: true, attributes: ["id"] })
  .then((resp) => {
    expectType<
      {
        id: string;
      }[]
    >(resp.data);
  });

// querying index with projected items should not allow to specify non-projected attributes
expectError(() =>
  projectionEntity.query.includeIndex({ id: "1" }).go({ attributes: ["id"] }),
);

// querying index with projected items and hydrate should allow to specify non-projected attributes
projectionEntity.query
  .includeIndex({ id: "1" })
  .where((attrs, ops) => ops.eq(attrs.include2, true))
  .go({ hydrate: true, attributes: ["id", "include1"] })
  .then((resp) => {
    expectType<
      {
        id: string;
        include1: string;
      }[]
    >(resp.data);
  });

// quering index with projected attributes should only return the projected attributes
projectionEntity.query
  .includeIndex({ id: "1" })
  .go()
  .then((resp) => {
    expectType<
      {
        include1: string;
        include2?: boolean | undefined;
        include3?: number | undefined;
      }[]
    >(resp.data);
  });

// scanning index with all projected attributes should return all attributes
projectionEntity.scan.thirdIndex.go().then((resp) => {
  expectType<
    {
      id: string;
      include1: string;
      include2?: boolean | undefined;
      include3?: number | undefined;
      exclude1?: string | undefined;
      exclude2?: number | undefined;
      exclude3?: boolean | undefined;
    }[]
  >(resp.data);
});

// scanning index with keys_only will return empty objects
projectionEntity.scan.keysOnly.go().then((resp) => {
  expectType<{}[]>(resp.data);
});

// scanning index with keys_only and hydrate will return all attributes
projectionEntity.scan.keysOnly.go({ hydrate: true }).then((resp) => {
  expectType<
    {
      id: string;
      include1: string;
      include2?: boolean | undefined;
      include3?: number | undefined;
      exclude1?: string | undefined;
      exclude2?: number | undefined;
      exclude3?: boolean | undefined;
    }[]
  >(resp.data);
});

// scanning index with keys_only does not allow filtering on any attributes
expectError(() =>
  projectionEntity.scan.keysOnly
    .where((attrs, ops) => ops.eq(attrs.id, "1"))
    .go(),
);
