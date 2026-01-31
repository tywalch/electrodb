import { expectType, expectError } from "tsd";
import {
  transactions,
  projectionEntity,
  service
} from "./indexes-entities.test-d";

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

// scanning index with INCLUDE index should only return the projected attributes
projectionEntity.scan.includeIndex.go().then((resp) => {
  expectType<
    {
      include1: string;
      include2?: boolean | undefined;
      include3?: number | undefined;
    }[]
  >(resp.data);
});

// scanning index with INCLUDE index should only allow filtering on projected attributes
projectionEntity.scan.includeIndex
  .where((attrs, ops) => {
    expectError(() => ops.eq(attrs.id, "1"));
    expectError(() => ops.eq(attrs.include1, 123));
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

// scanning index with INCLUDE index with hydrate should only allow filtering on projected attributes
projectionEntity.scan.includeIndex
  .where((attrs, ops) => {
    expectError(() => ops.eq(attrs.id, "1"));
    expectError(() => ops.eq(attrs.include1, 123));
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

// scanning index with INCLUDE index with hydrate should return user-provided attributes but not allow filtering on non-projected attributes
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

// querying index with INCLUDE index should only return the projected attributes
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

// querying index with INCLUDE index should only allow filtering on projected attributes
projectionEntity.query
  .includeIndex({ id: "1" })
  .where((attrs, ops) => {
    expectError(() => ops.eq(attrs.id, "1"));
    expectError(() => ops.eq(attrs.include1, 123));
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
  .where((attrs, ops) => {
    expectError(() => ops.eq(attrs.include1, 123));
    return ops.eq(attrs.include2, true);
  })
  .go({ hydrate: true, attributes: ["id", "include1"] })
  .then((resp) => {
    expectType<
      {
        id: string;
        include1: string;
      }[]
    >(resp.data);
  });

// quering index with INCLUDE index should only return the projected attributes
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

type AllIndexCollectionWhereAttrs = {
  id: string;
  include1: string | boolean;
  include2: boolean;
  include3: number;
  exclude1: string;
  exclude2: number;
  exclude3: boolean;
  some1: string;
  some2: number;
  some3: boolean;
};

type ExcludeCollectionWhereAttrs = {
  exclude1: string;
  exclude2: number;
  exclude3: boolean;
};

type AllIndexCollectionResponse = {
  data: {
    projectionEntity: {
      id: string;
      include1: string;
      include2?: boolean | undefined;
      include3?: number | undefined;
      exclude1?: string | undefined;
      exclude2?: number | undefined;
      exclude3?: boolean | undefined;
    }[];
    projectionEntity2: {
      id: string;
      some1: string;
      some2: number;
      some3: boolean;
      exclude1: string;
      exclude2: number;
      exclude3: boolean;
      include1: boolean;
      include2: boolean;
      include3: number;
    }[];
  };
  cursor: string | null;
};

type ExcludeCollectionResponse = {
  data: {
    projectionEntity: {
      exclude1?: string | undefined;
      exclude2?: number | undefined;
      exclude3?: boolean | undefined;
    }[];
    projectionEntity2: {
      exclude1: string;
      exclude2: number;
      exclude3: boolean;
    }[];
  };
  cursor: string | null;
};

// ============ ALL INDEX COLLECTION ============
const allIndexCollectionQuery = service.collections.collectionAllIndex({
  id: "",
});

const excludeCollectionQuery = service.collections.excludeCollection({
  id: "",
});

// calling go() without a parameter
allIndexCollectionQuery.go().then((res) => {
  expectType<AllIndexCollectionResponse>(res);
});

excludeCollectionQuery.go().then((res) => {
  expectType<ExcludeCollectionResponse>(res);
});

allIndexCollectionQuery
  .where((attrs, ops) => {
    expectType<AllIndexCollectionWhereAttrs>(attrs);
    return "";
  })
  .go()
  .then((res) => {
    expectType<AllIndexCollectionResponse>(res);
  });

excludeCollectionQuery
  .where((attrs, ops) => {
    expectType<ExcludeCollectionWhereAttrs>(attrs);
    return "";
  })
  .go()
  .then((res) => {
    expectType<ExcludeCollectionResponse>(res);
  });

allIndexCollectionQuery
  .where((attrs, ops) => {
    expectType<AllIndexCollectionWhereAttrs>(attrs);
    return "";
  })
  .where((attrs, ops) => {
    expectType<AllIndexCollectionWhereAttrs>(attrs);
    return "";
  })
  .go()
  .then((res) => {
    expectType<AllIndexCollectionResponse>(res);
  });

excludeCollectionQuery
  .where((attrs, ops) => {
    expectType<ExcludeCollectionWhereAttrs>(attrs);
    return "";
  })
  .where((attrs, ops) => {
    expectType<ExcludeCollectionWhereAttrs>(attrs);
    return "";
  })
  .go()
  .then((res) => {
    expectType<ExcludeCollectionResponse>(res);
  });

// calling go() with empty object
allIndexCollectionQuery.go({}).then((res) => {
  expectType<AllIndexCollectionResponse>(res);
});

allIndexCollectionQuery
  .where((attrs, ops) => {
    expectType<AllIndexCollectionWhereAttrs>(attrs);
    return "";
  })
  .go({})
  .then((res) => {
    expectType<AllIndexCollectionResponse>(res);
  });

allIndexCollectionQuery
  .where((attrs, ops) => {
    expectType<AllIndexCollectionWhereAttrs>(attrs);
    return "";
  })
  .where((attrs, ops) => {
    expectType<AllIndexCollectionWhereAttrs>(attrs);
    return "";
  })
  .go({})
  .then((res) => {
    expectType<AllIndexCollectionResponse>(res);
  });

// calling go() with provided attributes
const AllIndexCollectionProvidedAttrs = [
  "include1",
  "include2",
  "some1",
  "some2",
] as const;

type AllIndexCollectionProvidedAttrsResponse = {
  data: {
    projectionEntity: {
      include1: string;
      include2?: boolean;
    }[];
    projectionEntity2: {
      include1: boolean;
      include2: boolean;
      some1: string;
      some2: number;
    }[];
  };
  cursor: string | null;
};

allIndexCollectionQuery
  .go({ attributes: AllIndexCollectionProvidedAttrs })
  .then((res) => {
    expectType<AllIndexCollectionProvidedAttrsResponse>(res);
  });

excludeCollectionQuery
  .go({ attributes: ['exclude1', 'exclude2', 'exclude3'] as const })
  .then((res) => {
    expectType<ExcludeCollectionResponse>(res);
  });

allIndexCollectionQuery
  .where((attrs, ops) => {
    expectType<AllIndexCollectionWhereAttrs>(attrs);
    return "";
  })
  .go({ attributes: AllIndexCollectionProvidedAttrs })
  .then((res) => {
    expectType<AllIndexCollectionProvidedAttrsResponse>(res);
  });

excludeCollectionQuery
  .where((attrs, ops) => {
    expectType<ExcludeCollectionWhereAttrs>(attrs);
    return "";
  })
  .go({ attributes: ["exclude1", "exclude2", "exclude3"] })
  .then((res) => {
    expectType<ExcludeCollectionResponse>(res);
  });

allIndexCollectionQuery
  .where((attrs, ops) => {
    expectType<AllIndexCollectionWhereAttrs>(attrs);
    return "";
  })
  .where((attrs, ops) => {
    expectType<AllIndexCollectionWhereAttrs>(attrs);
    return "";
  })
  .go({ attributes: AllIndexCollectionProvidedAttrs })
  .then((res) => {
    expectType<AllIndexCollectionProvidedAttrsResponse>(res);
  });

excludeCollectionQuery
  .where((attrs, ops) => {
    expectType<ExcludeCollectionWhereAttrs>(attrs);
    return "";
  })
  .where((attrs, ops) => {
    expectType<ExcludeCollectionWhereAttrs>(attrs);
    return "";
  })
  .go({ attributes: ["exclude1", "exclude2", "exclude3"] })
  .then((res) => {
    expectType<ExcludeCollectionResponse>(res);
  });

// should not be able to pass attributes from other collections
expectError(() => allIndexCollectionQuery.go({ attributes: ["unrelated"] }));

expectError(() => excludeCollectionQuery.go({ attributes: ["include1"] as const }));

expectError(() =>
  allIndexCollectionQuery
    .where((attrs, ops) => {
      expectType<AllIndexCollectionWhereAttrs>(attrs);
      return "";
    })
    .go({ attributes: ["unrelated"] }),
);

expectError(() =>
  excludeCollectionQuery
    .where((attrs, ops) => {
      expectType<ExcludeCollectionWhereAttrs>(attrs);
      return "";
    })
    .go({ attributes: ["include1"] as const }),
);


expectError(() =>
  allIndexCollectionQuery
    .where((attrs, ops) => {
      expectType<AllIndexCollectionWhereAttrs>(attrs);
      return "";
    })
    .where((attrs, ops) => {
      expectType<AllIndexCollectionWhereAttrs>(attrs);
      return "";
    })
    .go({ attributes: ["unrelated"] }),
);

// should not be able to pass completely non-existent attributes
expectError(() => allIndexCollectionQuery.go({ attributes: ["invalid"] }));
expectError(() => excludeCollectionQuery.go({ attributes: ["invalid"] }));

expectError(() =>
  allIndexCollectionQuery
    .where((attrs, ops) => {
      expectType<AllIndexCollectionWhereAttrs>(attrs);
      return "";
    })
    .go({ attributes: ["invalid"] }),
);

expectError(() =>
  excludeCollectionQuery
    .where((attrs, ops) => {
      expectType<ExcludeCollectionWhereAttrs>(attrs);
      return "";
    })
    .go({ attributes: ["invalid"] }),
);

expectError(() =>
  allIndexCollectionQuery
    .where((attrs, ops) => {
      expectType<AllIndexCollectionWhereAttrs>(attrs);
      return "";
    })
    .where((attrs, ops) => {
      expectType<AllIndexCollectionWhereAttrs>(attrs);
      return "";
    })
    .go({ attributes: ["invalid"] }),
);

expectError(() =>
  allIndexCollectionQuery
    .where((attrs, ops) => {
      expectType<AllIndexCollectionWhereAttrs>(attrs);
      return "";
    })
    .where((attrs, ops) => {
      expectType<AllIndexCollectionWhereAttrs>(attrs);
      return "";
    })
    .go({ attributes: ["invalid"] }),
);

// ============== KEYS ONLY INDEX COLLECTION ==============
const keysOnlyIndexCollectionQuery = service.collections.keysOnlyCollection({
  id: "",
});

type KeysOnlyIndexCollectionWhereAttrs = {};
type KeysOnlyIndexCollectionResponse = {
  data: {
    projectionEntity: {}[];
    projectionEntity2: {}[];
  };
  cursor: string | null;
};

// calling go() without a parameter
keysOnlyIndexCollectionQuery.go().then((res) => {
  expectType<KeysOnlyIndexCollectionResponse>(res);
});

keysOnlyIndexCollectionQuery
  .where((attrs, ops) => {
    expectType<KeysOnlyIndexCollectionWhereAttrs>(attrs);
    return "";
  })
  .go()
  .then((res) => {
    expectType<KeysOnlyIndexCollectionResponse>(res);
  });

keysOnlyIndexCollectionQuery
  .where((attrs, ops) => {
    expectType<KeysOnlyIndexCollectionWhereAttrs>(attrs);
    return "";
  })
  .where((attrs, ops) => {
    expectType<KeysOnlyIndexCollectionWhereAttrs>(attrs);
    return "";
  })
  .go()
  .then((res) => {
    expectType<KeysOnlyIndexCollectionResponse>(res);
  });

// calling go() with empty object
keysOnlyIndexCollectionQuery.go({}).then((res) => {
  expectType<KeysOnlyIndexCollectionResponse>(res);
});

keysOnlyIndexCollectionQuery
  .where((attrs, ops) => {
    expectType<KeysOnlyIndexCollectionWhereAttrs>(attrs);
    return "";
  })
  .go({})
  .then((res) => {
    expectType<KeysOnlyIndexCollectionResponse>(res);
  });

keysOnlyIndexCollectionQuery
  .where((attrs, ops) => {
    expectType<KeysOnlyIndexCollectionWhereAttrs>(attrs);
    return "";
  })
  .where((attrs, ops) => {
    expectType<KeysOnlyIndexCollectionWhereAttrs>(attrs);
    return "";
  })
  .go({})
  .then((res) => {
    expectType<KeysOnlyIndexCollectionResponse>(res);
  });

const KeysOnlyIndexCollectionProvidedAttrs = [
  "include1",
  "include2",
  "some1",
  "some2",
] as const;

type KeysOnlyIndexCollectionProvidedAttrsResponse = {
  data: {
    projectionEntity: {
      include1: string;
      include2?: boolean;
    }[];
    projectionEntity2: {
      include1: boolean;
      include2: boolean;
      some1: string;
      some2: number;
    }[];
  };
  cursor: string | null;
};

// calling go() with non-projected attributes should not be allowed
expectError(() =>
  keysOnlyIndexCollectionQuery.go({
    attributes: KeysOnlyIndexCollectionProvidedAttrs,
  }),
);

expectError(() =>
  keysOnlyIndexCollectionQuery
    .where((attrs, ops) => {
      expectType<KeysOnlyIndexCollectionWhereAttrs>(attrs);
      return "";
    })
    .go({ attributes: KeysOnlyIndexCollectionProvidedAttrs }),
);

expectError(() =>
  keysOnlyIndexCollectionQuery
    .where((attrs, ops) => {
      expectType<KeysOnlyIndexCollectionWhereAttrs>(attrs);
      return "";
    })
    .where((attrs, ops) => {
      expectType<KeysOnlyIndexCollectionWhereAttrs>(attrs);
      return "";
    })
    .go({ attributes: KeysOnlyIndexCollectionProvidedAttrs }),
);

// calling go() with hydration should return all attributes
keysOnlyIndexCollectionQuery.go({ hydrate: true }).then((res) => {
  expectType<AllIndexCollectionResponse>(res);
});

keysOnlyIndexCollectionQuery
  .where((attrs, ops) => {
    expectType<KeysOnlyIndexCollectionWhereAttrs>(attrs);
    return "";
  })
  .go({ hydrate: true })
  .then((res) => {
    expectType<AllIndexCollectionResponse>(res);
  });

keysOnlyIndexCollectionQuery
  .where((attrs, ops) => {
    expectType<KeysOnlyIndexCollectionWhereAttrs>(attrs);
    return "";
  })
  .where((attrs, ops) => {
    expectType<KeysOnlyIndexCollectionWhereAttrs>(attrs);
    return "";
  })
  .go({ hydrate: true })
  .then((res) => {
    expectType<AllIndexCollectionResponse>(res);
  });

// calling go() with provided attributes and hydration

keysOnlyIndexCollectionQuery
  .go({ attributes: KeysOnlyIndexCollectionProvidedAttrs, hydrate: true })
  .then((res) => {
    expectType<KeysOnlyIndexCollectionProvidedAttrsResponse>(res);
  });

keysOnlyIndexCollectionQuery
  .where((attrs, ops) => {
    expectType<KeysOnlyIndexCollectionWhereAttrs>(attrs);
    return "";
  })
  .go({ attributes: KeysOnlyIndexCollectionProvidedAttrs, hydrate: true })
  .then((res) => {
    expectType<KeysOnlyIndexCollectionProvidedAttrsResponse>(res);
  });

keysOnlyIndexCollectionQuery
  .where((attrs, ops) => {
    expectType<KeysOnlyIndexCollectionWhereAttrs>(attrs);
    return "";
  })
  .where((attrs, ops) => {
    expectType<KeysOnlyIndexCollectionWhereAttrs>(attrs);
    return "";
  })
  .go({ attributes: KeysOnlyIndexCollectionProvidedAttrs, hydrate: true })
  .then((res) => {
    expectType<KeysOnlyIndexCollectionProvidedAttrsResponse>(res);
  });

// should not be able to pass attributes from other collections
expectError(() =>
  keysOnlyIndexCollectionQuery.go({ attributes: ["unrelated"] }),
);

expectError(() =>
  keysOnlyIndexCollectionQuery
    .where((attrs, ops) => {
      expectType<KeysOnlyIndexCollectionWhereAttrs>(attrs);
      return "";
    })
    .go({ attributes: ["unrelated"] }),
);

expectError(() =>
  keysOnlyIndexCollectionQuery
    .where((attrs, ops) => {
      expectType<KeysOnlyIndexCollectionWhereAttrs>(attrs);
      return "";
    })
    .where((attrs, ops) => {
      expectType<KeysOnlyIndexCollectionWhereAttrs>(attrs);
      return "";
    })
    .go({ attributes: ["unrelated"] }),
);

// should not be able to pass completely non-existent attributes
expectError(() => keysOnlyIndexCollectionQuery.go({ attributes: ["invalid"] }));

expectError(() =>
  keysOnlyIndexCollectionQuery
    .where((attrs, ops) => {
      expectType<KeysOnlyIndexCollectionWhereAttrs>(attrs);
      return "";
    })
    .go({ attributes: ["invalid"] }),
);

expectError(() =>
  keysOnlyIndexCollectionQuery
    .where((attrs, ops) => {
      expectType<KeysOnlyIndexCollectionWhereAttrs>(attrs);
      return "";
    })
    .where((attrs, ops) => {
      expectType<KeysOnlyIndexCollectionWhereAttrs>(attrs);
      return "";
    })
    .go({ attributes: ["invalid"] }),
);

// ============== INCLUDE INDEX COLLECTION ==============
const includeIndexCollectionQuery = service.collections.includeIndexCollection({
  id: "",
});

type IncludeIndexCollectionWhereAttrs = {
  include1: string | boolean;
  include2: boolean;
  include3: number;
};
type IncludeIndexCollectionResponse = {
  data: {
    projectionEntity: {
      include1: string;
      include2?: boolean;
      include3?: number;
    }[];
    projectionEntity2: {
      include1: boolean;
      include2: boolean;
      include3: number;
    }[];
  };
  cursor: string | null;
};

// calling go() without a parameter
includeIndexCollectionQuery.go().then((res) => {
  expectType<IncludeIndexCollectionResponse>(res);
});

includeIndexCollectionQuery
  .where((attrs, ops) => {
    expectType<IncludeIndexCollectionWhereAttrs>(attrs);
    return "";
  })
  .go()
  .then((res) => {
    expectType<IncludeIndexCollectionResponse>(res);
  });

includeIndexCollectionQuery
  .where((attrs, ops) => {
    expectType<IncludeIndexCollectionWhereAttrs>(attrs);
    return "";
  })
  .where((attrs, ops) => {
    expectType<IncludeIndexCollectionWhereAttrs>(attrs);
    return "";
  })
  .go()
  .then((res) => {
    expectType<IncludeIndexCollectionResponse>(res);
  });

// calling go() with empty object
includeIndexCollectionQuery.go({}).then((res) => {
  expectType<IncludeIndexCollectionResponse>(res);
});

includeIndexCollectionQuery
  .where((attrs, ops) => {
    expectType<IncludeIndexCollectionWhereAttrs>(attrs);
    return "";
  })
  .go({})
  .then((res) => {
    expectType<IncludeIndexCollectionResponse>(res);
  });

includeIndexCollectionQuery
  .where((attrs, ops) => {
    expectType<IncludeIndexCollectionWhereAttrs>(attrs);
    return "";
  })
  .where((attrs, ops) => {
    expectType<IncludeIndexCollectionWhereAttrs>(attrs);
    return "";
  })
  .go({})
  .then((res) => {
    expectType<IncludeIndexCollectionResponse>(res);
  });

const IncludeIndexCollectionProvidedAttrs = [
  "include1",
  "include2",
  "some1",
  "some2",
] as const;

type IncludeIndexCollectionProvidedAttrsResponse = {
  data: {
    projectionEntity: {
      include1: string;
      include2?: boolean;
    }[];
    projectionEntity2: {
      include1: boolean;
      include2: boolean;
      some1: string;
      some2: number;
    }[];
  };
  cursor: string | null;
};

// calling go() with non-projected attributes should not be allowed
expectError(() =>
  includeIndexCollectionQuery.go({
    attributes: IncludeIndexCollectionProvidedAttrs,
  }),
);

expectError(() =>
  includeIndexCollectionQuery
    .where((attrs, ops) => {
      expectType<IncludeIndexCollectionWhereAttrs>(attrs);
      return "";
    })
    .go({ attributes: IncludeIndexCollectionProvidedAttrs }),
);

expectError(() =>
  includeIndexCollectionQuery
    .where((attrs, ops) => {
      expectType<IncludeIndexCollectionWhereAttrs>(attrs);
      return "";
    })
    .where((attrs, ops) => {
      expectType<IncludeIndexCollectionWhereAttrs>(attrs);
      return "";
    })
    .go({ attributes: IncludeIndexCollectionProvidedAttrs }),
);

// calling go() with hydration should return all attributes
includeIndexCollectionQuery.go({ hydrate: true }).then((res) => {
  expectType<AllIndexCollectionResponse>(res);
});

includeIndexCollectionQuery
  .where((attrs, ops) => {
    expectType<IncludeIndexCollectionWhereAttrs>(attrs);
    return "";
  })
  .go({ hydrate: true })
  .then((res) => {
    expectType<AllIndexCollectionResponse>(res);
  });

includeIndexCollectionQuery
  .where((attrs, ops) => {
    expectType<IncludeIndexCollectionWhereAttrs>(attrs);
    return "";
  })
  .where((attrs, ops) => {
    expectType<IncludeIndexCollectionWhereAttrs>(attrs);
    return "";
  })
  .go({ hydrate: true })
  .then((res) => {
    expectType<AllIndexCollectionResponse>(res);
  });

// calling go() with provided attributes and hydration

includeIndexCollectionQuery
  .go({ attributes: IncludeIndexCollectionProvidedAttrs, hydrate: true })
  .then((res) => {
    expectType<IncludeIndexCollectionProvidedAttrsResponse>(res);
  });

includeIndexCollectionQuery
  .where((attrs, ops) => {
    expectType<IncludeIndexCollectionWhereAttrs>(attrs);
    return "";
  })
  .go({ attributes: IncludeIndexCollectionProvidedAttrs, hydrate: true })
  .then((res) => {
    expectType<IncludeIndexCollectionProvidedAttrsResponse>(res);
  });

includeIndexCollectionQuery
  .where((attrs, ops) => {
    expectType<IncludeIndexCollectionWhereAttrs>(attrs);
    return "";
  })
  .where((attrs, ops) => {
    expectType<IncludeIndexCollectionWhereAttrs>(attrs);
    return "";
  })
  .go({ attributes: IncludeIndexCollectionProvidedAttrs, hydrate: true })
  .then((res) => {
    expectType<IncludeIndexCollectionProvidedAttrsResponse>(res);
  });

// should not be able to pass attributes from other collections
expectError(() =>
  includeIndexCollectionQuery.go({ attributes: ["unrelated"] }),
);

expectError(() =>
  includeIndexCollectionQuery
    .where((attrs, ops) => {
      expectType<IncludeIndexCollectionWhereAttrs>(attrs);
      return "";
    })
    .go({ attributes: ["unrelated"] }),
);

expectError(() =>
  includeIndexCollectionQuery
    .where((attrs, ops) => {
      expectType<IncludeIndexCollectionWhereAttrs>(attrs);
      return "";
    })
    .where((attrs, ops) => {
      expectType<IncludeIndexCollectionWhereAttrs>(attrs);
      return "";
    })
    .go({ attributes: ["unrelated"] }),
);

// should not be able to pass completely non-existent attributes
expectError(() => includeIndexCollectionQuery.go({ attributes: ["invalid"] }));

expectError(() =>
  includeIndexCollectionQuery
    .where((attrs, ops) => {
      expectType<IncludeIndexCollectionWhereAttrs>(attrs);
      return "";
    })
    .go({ attributes: ["invalid"] }),
);

expectError(() =>
  includeIndexCollectionQuery
    .where((attrs, ops) => {
      expectType<IncludeIndexCollectionWhereAttrs>(attrs);
      return "";
    })
    .where((attrs, ops) => {
      expectType<IncludeIndexCollectionWhereAttrs>(attrs);
      return "";
    })
    .go({ attributes: ["invalid"] }),
);


