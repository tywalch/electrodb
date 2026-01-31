import {
  createSchema,
  Schema,
  IndexCollections,
  EntityCollections,
  ItemTypeDescription,
  RequiredAttributes,
  HiddenAttributes,
  ReadOnlyAttributes,
  TableIndexes,
  TableIndexName,
  PKCompositeAttributes,
  SKCompositeAttributes,
  TableIndexPKCompositeAttributes,
  TableIndexSKCompositeAttributes,
  TableIndexPKAttributes,
  TableIndexSKAttributes,
  TableIndexCompositeAttributes,
  AllTableIndexCompositeAttributes,
  IndexPKAttributes,
  IndexSKAttributes,
  TableItem,
  ResponseItem,
  RequiredPutItems,
  PutItem,
  CreatedItem,
  UpdateData,
  RemoveItem,
  AppendItem,
  SetItem,
  AddItem,
  SubtractItem,
  DeleteItem,
  createCustomAttribute,
  CustomAttributeType,
  Resolve,
} from "../";
import { expectType } from "tsd";

class MockEntity<
  A extends string,
  F extends string,
  C extends string,
  S extends Schema<A, F, C>,
> {
  readonly schema: S;
  constructor(schema: S) {
    this.schema = createSchema(schema);
  }

  // done
  getIndexCollections(): IndexCollections<A, F, C, S> {
    return {} as IndexCollections<A, F, C, S>;
  }

  // done
  getEntityCollections(): EntityCollections<A, F, C, S> {
    return {} as EntityCollections<A, F, C, S>;
  }

  // done
  getItemTypeDescription(): ItemTypeDescription<A, F, C, S> {
    return {} as ItemTypeDescription<A, F, C, S>;
  }

  // done
  getRequiredAttributes(): RequiredAttributes<A, F, C, S> {
    return {} as RequiredAttributes<A, F, C, S>;
  }

  // done
  getHiddenAttributes(): HiddenAttributes<A, F, C, S> {
    return {} as HiddenAttributes<A, F, C, S>;
  }

  // done
  getReadOnlyAttributes(): ReadOnlyAttributes<A, F, C, S> {
    return {} as ReadOnlyAttributes<A, F, C, S>;
  }

  // done
  getTableIndexes(): TableIndexes<A, F, C, S> {
    return {} as TableIndexes<A, F, C, S>;
  }

  // done
  getTableIndexName(): TableIndexName<A, F, C, S> {
    return {} as TableIndexName<A, F, C, S>;
  }

  // done
  getPKCompositeAttributes(): PKCompositeAttributes<A, F, C, S> {
    return {} as PKCompositeAttributes<A, F, C, S>;
  }

  // done
  getSKCompositeAttributes(): SKCompositeAttributes<A, F, C, S> {
    return {} as SKCompositeAttributes<A, F, C, S>;
  }

  // done
  getTableIndexPKCompositeAttributes(): TableIndexPKCompositeAttributes<
    A,
    F,
    C,
    S
  > {
    return {} as TableIndexPKCompositeAttributes<A, F, C, S>;
  }

  // done
  getTableIndexSKCompositeAttributes(): TableIndexSKCompositeAttributes<
    A,
    F,
    C,
    S
  > {
    return {} as TableIndexSKCompositeAttributes<A, F, C, S>;
  }

  getTableIndexPKAttributes(): TableIndexPKAttributes<A, F, C, S> {
    return {} as TableIndexPKAttributes<A, F, C, S>;
  }

  getTableIndexSKAttributes(): TableIndexSKAttributes<A, F, C, S> {
    return {} as TableIndexSKAttributes<A, F, C, S>;
  }

  getTableIndexCompositeAttributes(): Resolve<
    TableIndexCompositeAttributes<A, F, C, S>
  > {
    return {} as Resolve<TableIndexCompositeAttributes<A, F, C, S>>;
  }

  getIndexPKAttributes<I extends keyof S["indexes"]>(
    index: I,
  ): Resolve<IndexPKAttributes<A, F, C, S, I>> {
    return {} as Resolve<IndexPKAttributes<A, F, C, S, I>>;
  }

  getIndexSKAttributes<I extends keyof S["indexes"]>(
    index: I,
  ): IndexSKAttributes<A, F, C, S, I> {
    return {} as IndexSKAttributes<A, F, C, S, I>;
  }

  getAllTableIndexCompositeAttributes(): Resolve<
    AllTableIndexCompositeAttributes<A, F, C, S>
  > {
    return {} as Resolve<AllTableIndexCompositeAttributes<A, F, C, S>>;
  }

  getTableItem(): Resolve<TableItem<A, F, C, S>> {
    return {} as Resolve<TableItem<A, F, C, S>>;
  }

  getResponseItem(): ResponseItem<A, F, C, S> {
    return {} as ResponseItem<A, F, C, S>;
  }

  getRequiredPutItems(): RequiredPutItems<A, F, C, S> {
    return {} as RequiredPutItems<A, F, C, S>;
  }

  getCreatedItem(): CreatedItem<A, F, C, S, S["attributes"]> {
    return {} as CreatedItem<A, F, C, S, S["attributes"]>;
  }

  getPutItem(): Resolve<PutItem<A, F, C, S>> {
    return {} as Resolve<PutItem<A, F, C, S>>;
  }

  getUpdateData(): Resolve<UpdateData<A, F, C, S>> {
    return {} as Resolve<UpdateData<A, F, C, S>>;
  }

  getRemoveItem(): Resolve<RemoveItem<A, F, C, S>> {
    return {} as Resolve<RemoveItem<A, F, C, S>>;
  }

  getAppendItem(): AppendItem<A, F, C, S> {
    return {} as AppendItem<A, F, C, S>;
  }

  getSetItem(): Resolve<SetItem<A, F, C, S>> {
    return {} as Resolve<SetItem<A, F, C, S>>;
  }

  getAddItem(): Resolve<AddItem<A, F, C, S>> {
    return {} as Resolve<AddItem<A, F, C, S>>;
  }

  getSubtractItem(): Resolve<SubtractItem<A, F, C, S>> {
    return {} as Resolve<SubtractItem<A, F, C, S>>;
  }

  getDeleteItem(): Resolve<DeleteItem<A, F, C, S>> {
    return {} as Resolve<DeleteItem<A, F, C, S>>;
  }
}

export type MyCustomAttributeType = {
  strAttr: string;
  numAttr: number;
  boolAttr: boolean;
  mapAttr: {
    nestedAttr: string;
    maybeNestedAttr?: string;
  };
  maybeMapAttr: {
    nestedAttr: string;
    maybeNestedAttr?: string;
  };
  listAttr: {
    mapAttr: {
      nestedAttr: string;
      maybeNestedAttr?: string;
    };
  }[];
  maybeListAttr?: {
    maybeMapAttr?: {
      nestedAttr: string;
      maybeNestedAttr?: string;
    };
  }[];
  maybeStrAttr?: string;
  maybeNumAttr?: number;
  maybeBoolAttr?: boolean;
};

export type MyBasicCustomAttribute = {
  type: "pizza" | "flatbread";
  toppings: Array<"pep" | "mush" | "garlic">;
  count: number;
}

export const schemaWithCustomAttribute = createSchema({
  model: {
    entity: "withcustomattribute",
    service: "myservice",
    version: "myversion",
  },
  attributes: {
    attr1: {
      type: "string",
    },
    attr2: createCustomAttribute<MyCustomAttributeType>({
      get: (attr) => {
        expectType<MyCustomAttributeType>(attr);
        return attr;
      },
      set: (attr) => {
        expectType<MyCustomAttributeType | undefined>(attr);
        return attr;
      },
      validate: (attr) => {
        expectType<MyCustomAttributeType>(attr);
        return true;
      },
    }),
  },
  indexes: {
    myIndex: {
      pk: {
        field: "pk",
        composite: ["attr1"],
      },
      sk: {
        field: "sk",
        composite: [],
      },
    },
  },
});

export const entityWithCustomAttribute = new MockEntity(schemaWithCustomAttribute);

export type OpaqueAttr1 = string & { cheese: "cheddar" };
export type OpaqueAttr2 = number & { cheese: "bacon" };
export type PizzaSize = number & { isPizzaSize: true };

export const schemaWithCustomAttribute2 = createSchema({
  model: {
    entity: "withcustomattribute2",
    service: "myservice",
    version: "myversion",
  },
  attributes: {
    attr1: {
      type: CustomAttributeType<OpaqueAttr1>("string"),
    },
    attr2: {
      type: CustomAttributeType<OpaqueAttr2>("number"),
      default: () => 1234 as OpaqueAttr2,
    },
    attr3: {
      type: CustomAttributeType<MyBasicCustomAttribute>("any"),
      required: true,
    },
    attr4: {
      type: CustomAttributeType<MyBasicCustomAttribute>("any"),
      required: true,
      default: {
        type: "pizza",
        toppings: ["mush"],
        count: 10,
      },
    },
    attr5: {
      type: CustomAttributeType<MyBasicCustomAttribute>("any"),
      readOnly: true,
    },
    attr6: {
      type: CustomAttributeType<PizzaSize>("number"),
    },
  },
  indexes: {
    myIndex: {
      pk: {
        field: "pk",
        composite: ["attr1"],
      },
      sk: {
        field: "sk",
        composite: ["attr2"],
      },
    },
  },
});

export const entityWithCustomAttribute2 = new MockEntity(schemaWithCustomAttribute2);

export const schemaWithNestedCustomAttribute = createSchema({
  model: {
    entity: "withnestedcustomattribute",
    service: "myservice",
    version: "myversion",
  },
  attributes: {
    attr1: {
      type: CustomAttributeType<OpaqueAttr1>("string"),
    },
    attr2: {
      type: CustomAttributeType<OpaqueAttr2>("number"),
      default: () => 1234 as OpaqueAttr2,
    },
    map: {
      type: "map",
      required: true,
      properties: {
        attr3: {
          type: CustomAttributeType<MyBasicCustomAttribute>("any"),
          required: true,
        },
        attr4: {
          type: CustomAttributeType<MyBasicCustomAttribute>("any"),
          required: true,
          default: {
            type: "pizza",
            toppings: ["mush"],
            count: 10,
          },
        },
        attr5: {
          type: CustomAttributeType<MyBasicCustomAttribute>("any"),
          readOnly: true,
        },
        attr6: {
          type: CustomAttributeType<PizzaSize>("number"),
        },
      }
    },
    list: {
      type: 'list',
      required: true,
      items: {
        type: "map",
        required: true,
        properties: {
          attr3: {
            type: CustomAttributeType<MyBasicCustomAttribute>("any"),
            required: true,
          },
          attr4: {
            type: CustomAttributeType<MyBasicCustomAttribute>("any"),
            required: true,
            default: {
              type: "pizza",
              toppings: ["mush"],
              count: 10,
            },
          },
          attr5: {
            type: CustomAttributeType<MyBasicCustomAttribute>("any"),
            readOnly: true,
          },
          attr6: {
            type: CustomAttributeType<PizzaSize>("number"),
          },
        }
      }
    }
  },
  indexes: {
    myIndex: {
      pk: {
        field: "pk",
        composite: ["attr1"],
      },
      sk: {
        field: "sk",
        composite: ["attr2"],
      },
    },
  },
});

export const entityWithNestedCustomAttribute = new MockEntity(schemaWithNestedCustomAttribute);

export const schemaWithEnumSets = createSchema({
  model: {
    entity: "withcustomattribute",
    service: "myservice",
    version: "myversion",
  },
  attributes: {
    attr1: {
      type: "string",
    },
    strEnumSet: {
      type: "set",
      items: ["ONE", "TWO", "THREE"] as const,
    },
    numEnumSet: {
      type: "set",
      items: [1, 2, 3] as const,
    },
    mapAttr: {
      type: "map",
      properties: {
        nestedStrEnumSet: {
          type: "set",
          items: ["ONE", "TWO", "THREE"] as const,
        },
        nestedNumEnumSet: {
          type: "set",
          items: [1, 2, 3] as const,
        },
      },
    },
  },
  indexes: {
    myIndex: {
      pk: {
        field: "pk",
        composite: ["attr1"],
      },
      sk: {
        field: "sk",
        composite: [],
      },
    },
  },
});
export const entityWithEnumSets = new MockEntity(schemaWithEnumSets);

export const schemaWithoutCollection = createSchema({
  model: {
    entity: "entity2",
    service: "myservice",
    version: "myversion",
  },
  attributes: {
    attr1: {
      type: "string",
    },
    attr2: {
      type: "string",
    },
  },
  indexes: {
    myIndex: {
      pk: {
        field: "pk",
        composite: ["attr1"],
      },
      sk: {
        field: "sk",
        composite: ["attr2"],
      },
    },
    myIndex2: {
      index: "index2",
      pk: {
        field: "index2pk",
        composite: ["attr1"],
      },
      sk: {
        field: "index2sk",
        composite: ["attr2"],
      },
    },
  },
});

export const entityWithoutCollection = new MockEntity(schemaWithoutCollection);

export const schemaWithSK = createSchema({
  model: {
    entity: "abc",
    service: "myservice",
    version: "myversion",
  },
  attributes: {
    attr1: {
      type: "string",
      default: "abc",
      get: (val) => val + 123,
      set: (val) => (val ?? "") + 456,
      validate: (val) => !!val,
    },
    attr2: {
      type: "string",
      // default: () => "sfg",
      // required: false,
      validate: (val) => val.length > 0,
    },
    attr3: {
      type: ["123", "def", "ghi"] as const,
      default: "def",
    },
    attr4: {
      type: ["abc", "ghi"] as const,
      required: true,
    },
    attr5: {
      type: "string",
    },
    attr6: {
      type: "number",
      default: () => 100,
      get: (val) => val + 5,
      set: (val) => (val ?? 0) + 5,
      validate: (val) => true,
    },
    attr7: {
      type: "any",
      default: () => false,
      get: (val) => ({ key: "value" }),
      set: (val) => (val ?? 0) + 5,
      validate: (val) => true,
    },
    attr8: {
      type: "boolean",
      required: true,
      get: (val) => !!val,
      set: (val) => !!val,
      validate: (val) => !!val,
    },
    attr9: {
      type: "number",
    },
    attr10: {
      type: "boolean",
    },
  },
  indexes: {
    myIndex: {
      collection: "mycollection2",
      pk: {
        field: "pk",
        composite: ["attr1"],
      },
      sk: {
        field: "sk",
        composite: ["attr2"],
      },
    },
    myIndex2: {
      collection: "mycollection1",
      index: "gsi1",
      pk: {
        field: "gsipk1",
        composite: ["attr6", "attr9"],
      },
      sk: {
        field: "gsisk1",
        composite: ["attr4", "attr5"],
      },
    },
    myIndex3: {
      collection: "mycollection",
      index: "gsi2",
      pk: {
        field: "gsipk2",
        composite: ["attr5"],
      },
      sk: {
        field: "gsisk2",
        composite: ["attr4", "attr3", "attr9"],
      },
    },
  },
});
export const entityWithSK = new MockEntity(schemaWithSK);

export const schemaWithoutSK = createSchema({
  model: {
    entity: "abc",
    service: "myservice",
    version: "myversion",
  },
  attributes: {
    attr1: {
      type: "string",
      // default: "abc",
      get: (val) => val + 123,
      set: (val) => (val ?? "0") + 456,
      validate: (val) => !!val,
    },
    attr2: {
      type: "string",
      // default: () => "sfg",
      // required: false,
      validate: (val) => val.length > 0,
    },
    attr3: {
      type: ["123", "def", "ghi"] as const,
      default: "def",
    },
    attr4: {
      type: ["abc", "def"] as const,
      required: true,
    },
    attr5: {
      type: "string",
    },
    attr6: {
      type: "number",
      default: () => 100,
      get: (val) => val + 5,
      set: (val) => (val ?? 0) + 5,
      validate: (val) => true,
    },
    attr7: {
      type: "any",
      default: () => false,
      get: (val) => ({ key: "value" }),
      set: (val) => (val ?? 0) + 5,
      validate: (val) => true,
    },
    attr8: {
      type: "boolean",
      required: true,
      default: () => false,
      get: (val) => !!val,
      set: (val) => !!val,
      validate: (val) => !!val,
    },
    attr9: {
      type: "number",
    },
  },
  indexes: {
    myIndex: {
      pk: {
        field: "pk",
        composite: ["attr1"],
      },
    },
    myIndex2: {
      index: "gsi1",
      collection: "mycollection1",
      pk: {
        field: "gsipk1",
        composite: ["attr6", "attr9"],
      },
      sk: {
        field: "gsisk1",
        composite: [],
      },
    },
    myIndex3: {
      collection: "mycollection",
      index: "gsi2",
      pk: {
        field: "gsipk2",
        composite: ["attr5"],
      },
      sk: {
        field: "gsisk2",
        composite: [],
      },
    },
  },
});

export const entityWithoutSK = new MockEntity(schemaWithoutSK);

export const standAloneSchema = createSchema({
  model: {
    entity: "standalone",
    service: "myservice",
    version: "1",
  },
  attributes: {
    prop1: {
      type: "string",
      default: "abc",
    },
    prop2: {
      type: "string",
    },
    prop3: {
      type: "string",
    },
  },
  indexes: {
    index1: {
      pk: {
        field: "pk",
        composite: ["prop1", "prop2"],
      },
      sk: {
        field: "sk",
        composite: ["prop3"],
      },
    },
  },
});
export const standAloneEntity = new MockEntity(standAloneSchema);

export const standAloneSchemaWithDefault = createSchema({
  model: {
    entity: "standalone",
    service: "myservice",
    version: "1",
  },
  attributes: {
    prop1: {
      type: "string",
      default: "abc",
    },
    prop2: {
      type: "string",
    },
    prop3: {
      type: "string",
    },
    prop4: {
      type: "string",
      default: "abc",
    },
    prop5: {
      type: "string",
      default: "abc",
      required: true,
    },
  },
  indexes: {
    index1: {
      pk: {
        field: "pk",
        composite: ["prop1", "prop2"],
      },
      sk: {
        field: "sk",
        composite: ["prop3"],
      },
    },
  },
});
export const standAloneEntityWithDefault = new MockEntity(standAloneSchemaWithDefault);

export const standAloneEntity2 = new MockEntity({
  model: {
    entity: "standalone2",
    service: "myservice",
    version: "1",
  },
  attributes: {
    prop1: {
      type: "string",
      default: "abc",
    },
    prop2: {
      type: "string",
    },
    prop3: {
      type: "string",
      default: "abc",
    },
    prop4: {
      type: "map",
      required: true,
      properties: {
        prop1: {
          type: "string",
        },
        prop2: {
          type: "string",
          required: true,
        },
        prop3: {
          type: "string",
          required: true,
          default: "abc",
        },
      },
    },
    prop5: {
      type: "map",
      required: true,
      default: {
        prop2: "abc",
        prop3: "abc",
      },
      properties: {
        prop1: {
          type: "string",
        },
        prop2: {
          type: "string",
          required: true,
        },
        prop3: {
          type: "string",
          required: true,
          default: "abc",
        },
      },
    },
  },
  indexes: {
    index1: {
      pk: {
        field: "pk",
        composite: ["prop1", "prop2"],
      },
      sk: {
        field: "sk",
        composite: ["prop3"],
      },
    },
  },
});

export const normalEntity1 = new MockEntity({
  model: {
    entity: "normalEntity1",
    service: "myservice",
    version: "1",
  },
  attributes: {
    prop1: {
      type: "string",
      default: "abc",
    },
    prop2: {
      type: "string",
    },
    prop3: {
      type: "string",
      required: true,
    },
    prop4: {
      type: "number",
    },
    prop10: {
      type: "boolean",
    },
  },
  indexes: {
    tableIndex: {
      collection: "normalcollection",
      pk: {
        field: "pk",
        composite: ["prop1", "prop2"],
      },
      sk: {
        field: "sk",
        composite: ["prop4"],
      },
    },
  },
});

export const normalEntity2 = new MockEntity({
  model: {
    entity: "normalEntity2",
    service: "myservice",
    version: "1",
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
      required: true,
    },
    prop5: {
      type: "number",
    },
    attr6: {
      type: "number",
      default: () => 100,
      get: (val) => val + 5,
      set: (val) => (val ?? 0) + 5,
      validate: (val) => true,
    },
    attr9: {
      type: "number",
    },
  },
  indexes: {
    indexTable: {
      collection: "normalcollection",
      pk: {
        field: "pk",
        composite: ["prop1", "prop2"],
      },
      sk: {
        field: "sk",
        composite: ["prop5"],
      },
    },
    anotherIndex: {
      index: "gsi1",
      collection: "mycollection1",
      pk: {
        field: "gsipk1",
        composite: ["attr6", "attr9"],
      },
      sk: {
        field: "gsisk1",
        composite: [],
      },
    },
  },
});

export const entityWithHiddenAttributes1 = new MockEntity({
  model: {
    entity: "e1",
    service: "s1",
    version: "1",
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
      required: true,
      hidden: true,
    },
  },
  indexes: {
    record: {
      collection: "collection1",
      pk: {
        field: "pk",
        composite: ["prop1"],
      },
      sk: {
        field: "sk",
        composite: ["prop2"],
      },
    },
  },
});

export const entityWithHiddenAttributes2 = new MockEntity({
  model: {
    entity: "e2",
    service: "s1",
    version: "1",
  },
  attributes: {
    prop1: {
      type: "string",
    },
    prop2: {
      type: "string",
    },
    prop4: {
      type: "string",
      hidden: true,
    },
    prop5: {
      type: "string",
    },
  },
  indexes: {
    record: {
      collection: "collection1",
      pk: {
        field: "pk",
        composite: ["prop1"],
      },
      sk: {
        field: "sk",
        composite: ["prop2"],
      },
    },
  },
});

export const entityWithMultipleCollections2 = new MockEntity({
  model: {
    entity: "entity2",
    service: "myservice",
    version: "myversion",
  },
  attributes: {
    attr1: {
      type: "string",
    },
    attr2: {
      type: "string",
    },
  },
  indexes: {
    myIndex: {
      collection: ["outercollection", "innercollection"] as const,
      pk: {
        field: "pk",
        composite: ["attr1"],
      },
      sk: {
        field: "sk",
        composite: ["attr2"],
      },
    },
    myIndex2: {
      index: "index2",
      collection: ["extracollection"] as const,
      pk: {
        field: "index2pk",
        composite: ["attr1"],
      },
      sk: {
        field: "index2sk",
        composite: ["attr2"],
      },
    },
  },
});

export const entityWithMultipleCollections3 = new MockEntity({
  model: {
    entity: "entity3",
    service: "myservice",
    version: "myversion",
  },
  attributes: {
    attr1: {
      type: "string",
    },
    attr2: {
      type: "string",
    },
  },
  indexes: {
    myIndex: {
      collection: "outercollection" as const,
      pk: {
        field: "pk",
        composite: ["attr1"],
      },
      sk: {
        field: "sk",
        composite: ["attr2"],
      },
    },
    myIndex2: {
      index: "index2",
      collection: "extracollection" as const,
      pk: {
        field: "index2pk",
        composite: ["attr1"],
      },
      sk: {
        field: "index2sk",
        composite: ["attr2"],
      },
    },
  },
});

export const entityWithWatchAll = new MockEntity({
  model: {
    entity: "withwatchall",
    service: "service",
    version: "1",
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
      watch: "*",
      set: (value) => {
        return value;
      },
    },
  },
  indexes: {
    record: {
      pk: {
        field: "pk",
        composite: ["prop1"],
      },
      sk: {
        field: "sk",
        composite: ["prop2"],
      },
    },
  },
});

export const entityWithComplexShapes = new MockEntity({
  model: {
    entity: "entity",
    service: "service",
    version: "1",
  },
  attributes: {
    prop1: {
      type: "string",
      label: "props",
    },
    prop2: {
      type: "string",
    },
    prop3: {
      type: "map",
      properties: {
        val1: {
          type: "string",
        },
      },
    },
    prop4: {
      type: "list",
      items: {
        type: "map",
        properties: {
          val2: {
            type: "number",
          },
          val3: {
            type: "list",
            items: {
              type: "string",
            },
          },
          val4: {
            type: "set",
            items: "number",
          },
        },
      },
    },
    prop5: {
      type: "set",
      items: "string",
    },
    prop6: {
      type: "set",
      items: "string",
    },
  },
  indexes: {
    record: {
      collection: "mops",
      pk: {
        field: "pk",
        composite: ["prop1"],
      },
      sk: {
        field: "sk",
        composite: ["prop2"],
      },
    },
  },
});

export const entityWithComplexShapesRequired = new MockEntity({
  model: {
    entity: "entity",
    service: "service",
    version: "1",
  },
  attributes: {
    prop1: {
      type: "string",
      label: "props",
    },
    prop2: {
      type: "string",
    },
    attr3: {
      type: "map",
      properties: {
        val1: {
          type: "string",
          required: true,
        },
      },
      required: true,
    },
    attr4: {
      type: "list",
      items: {
        type: "map",
        properties: {
          val2: {
            type: "number",
            required: true,
          },
          val3: {
            type: "list",
            items: {
              type: "string",
              required: true,
            },
            required: true,
          },
          val4: {
            type: "set",
            items: "number",
            required: true,
          },
        },
      },
      required: true,
    },
    attr5: {
      type: "set",
      items: "string",
      required: true,
    },
    attr6: {
      type: "set",
      items: "string",
      required: true,
    },
  },
  indexes: {
    record: {
      collection: "mops",
      pk: {
        field: "pk",
        composite: ["prop1"],
      },
      sk: {
        field: "sk",
        composite: ["prop2"],
      },
    },
  },
});

export const entityWithComplexShapesRequiredOnEdge = new MockEntity({
  model: {
    entity: "entity",
    service: "service",
    version: "1",
  },
  attributes: {
    prop1: {
      type: "string",
      label: "props",
    },
    prop2: {
      type: "string",
    },
    attrz3: {
      type: "map",
      properties: {
        val1: {
          type: "string",
          required: true,
          validate: /./gi,
        },
      },
    },
    attrz4: {
      type: "list",
      items: {
        type: "map",
        properties: {
          val2: {
            type: "number",
            required: true,
          },
          val3: {
            type: "list",
            items: {
              type: "string",
              required: true,
            },
          },
          val4: {
            type: "set",
            items: "number",
          },
          val5: {
            type: "map",
            properties: {
              val6: {
                type: "string",
                required: true,
              },
            },
          },
        },
      },
    },
    attrz5: {
      type: "set",
      items: "string",
    },
    attrz6: {
      type: "set",
      items: "string",
    },
  },
  indexes: {
    record: {
      collection: "mops",
      pk: {
        field: "pk",
        composite: ["prop1"],
      },
      sk: {
        field: "sk",
        composite: ["prop2"],
      },
    },
  },
});

export const entityWithComplexShapesRequiredOnEdgeWithDefault = new MockEntity({
  model: {
    entity: "entity",
    service: "service",
    version: "1",
  },
  attributes: {
    prop1: {
      type: "string",
      label: "props",
    },
    prop2: {
      type: "string",
      default: "42",
    },
    attrz3: {
      type: "map",
      properties: {
        val1: {
          type: "string",
          required: true,
          validate: /./gi,
        },
      },
    },
    attrz4: {
      type: "list",
      items: {
        type: "map",
        properties: {
          val2: {
            type: "number",
            required: true,
            default: 42,
          },
          val3: {
            type: "list",
            items: {
              type: "string",
              required: true,
            },
          },
          val4: {
            type: "set",
            items: "number",
          },
          val5: {
            type: "map",
            properties: {
              val6: {
                type: "string",
                required: true,
                default: "42",
              },
            },
          },
          val6: {
            type: "boolean",
          },
        },
      },
    },
    attrz5: {
      type: "set",
      items: "string",
    },
    attrz6: {
      type: "set",
      items: "string",
    },
  },
  indexes: {
    record: {
      collection: "mops",
      pk: {
        field: "pk",
        composite: ["prop1"],
      },
      sk: {
        field: "sk",
        composite: ["prop2"],
      },
    },
  },
});

export const deepMap = new MockEntity({
  model: {
    entity: "deepmap",
    service: "versioncontrol",
    version: "1",
  },
  attributes: {
    prop1: {
      type: "string",
    },
    prop2: {
      type: "map",
      properties: {
        prop3: {
          type: "map",
          properties: {
            prop4: {
              type: "map",
              properties: {
                type5: {
                  type: "string",
                },
              },
            },
          },
        },
      },
    },
  },
  indexes: {
    record: {
      pk: {
        field: "pk",
        composite: ["prop1"],
      },
    },
  },
});

export const complex = new MockEntity({
  model: {
    entity: "user",
    service: "versioncontrol",
    version: "1",
  },
  attributes: {
    stringVal: {
      type: "string",
      default: () => "abc",
      validate: (value) => value !== undefined,
      get: (value) => {
        return value;
      },
      set: (value) => {
        return value;
      },
    },
    enumVal: {
      type: ["abc", "def"] as const,
      validate: (value: "abc" | "def") => value !== undefined,
      default: () => "abc",
      get: (value: "abc" | "def") => {
        return value;
      },
      set: (value?: "abc" | "def") => {
        return value;
      },
    },
    numVal: {
      type: "number",
      validate: (value) => value !== undefined,
      default: () => 123,
      get: (value) => {
        return value;
      },
      set: (value) => {
        return value;
      },
    },
    boolValue: {
      type: "boolean",
      validate: (value) => value !== undefined,
      default: () => true,
      get: (value) => {
        return value;
      },
      set: (value) => {
        return value;
      },
    },
    stringSetValue: {
      type: "set",
      items: "string",
      validate: (value) => value !== undefined,
      default: () => ["abc"],
      get: (value) => {
        return value;
      },
      set: (value) => {
        return value;
      },
    },
    numberSetValue: {
      type: "set",
      items: "number",
      validate: (value) => value !== undefined,
      default: () => [1],
      get: (value) => {
        return value;
      },
      set: (value) => {
        return value;
      },
    },
    stringListValue: {
      type: "list",
      items: {
        type: "string",
        default: "abc",
        validate: (value) => value !== undefined,
        get: (value) => {
          return value;
        },
        set: (value) => {
          return value;
        },
      },
      default: ["abc"],
      validate: (value: string[]) => value !== undefined,
      get: (value: string[]) => {
        return value;
      },
      set: (value?: string[]) => {
        return value;
      },
    },
    numberListValue: {
      type: "list",
      items: {
        type: "number",
        validate: (value) => value !== undefined,
        default: 0,
        get: (value) => {
          return value;
        },
        set: (value) => {
          return value;
        },
      },
      default: [],
      validate: (value: number[]) => value !== undefined,
      get: (value: number[]) => {
        return value;
      },
      set: (value?: number[]) => {
        return value;
      },
    },
    mapListValue: {
      type: "list",
      items: {
        type: "map",
        properties: {
          stringVal: {
            type: "string",
            default: "def",
            validate: (value) => value !== undefined,
            get: (value) => {
              return value;
            },
            set: (value) => {
              return value;
            },
          },
          numVal: {
            type: "number",
            default: 5,
            validate: (value) => value !== undefined,
            get: (value) => {
              return value;
            },
            set: (value) => {
              return value;
            },
          },
          boolValue: {
            type: "boolean",
            default: false,
            validate: (value) => value !== undefined,
            get: (value) => {
              return value;
            },
            set: (value) => {
              return value;
            },
          },
          enumVal: {
            type: ["abc", "def"] as const,
            validate: (value: "abc" | "def") => value !== undefined,
            default: () => "abc",
            get: (value: "abc" | "def") => {
              return value;
            },
            set: (value?: "abc" | "def") => {
              return value;
            },
          },
        },
        validate: (value) => value !== undefined,
        default: {
          stringVal: "abc",
          numVal: 123,
          boolValue: false,
        },
        get: (value) => {
          return value;
        },
        set: (value) => {
          return value;
        },
      },
      get: (value: any) => {
        return value;
      },
      set: (value: any) => {
        return value;
      },
    },
    mapValue: {
      type: "map",
      properties: {
        stringVal: {
          type: "string",
          default: () => "abc",
          validate: (value) => value !== undefined,
          get: (value) => {
            return value;
          },
          set: (value) => {
            return value;
          },
        },
        numVal: {
          type: "number",
          default: () => 10,
          validate: (value) => value !== undefined,
          get: (value) => {
            return value;
          },
          set: (value) => {
            return value;
          },
        },
        boolValue: {
          type: "boolean",
          default: () => false,
          validate: (value) => value !== undefined,
          get: (value) => {
            return value;
          },
          set: (value) => {
            return value;
          },
        },
        enumVal: {
          type: ["abc", "def"] as const,
          validate: (value: "abc" | "def") => value !== undefined,
          default: () => "abc",
          get: (value: "abc" | "def") => {
            return value;
          },
          set: (value?: "abc" | "def") => {
            return value;
          },
        },
        stringListValue: {
          type: "list",
          items: {
            type: "string",
            default: "abc",
            validate: (value) => value !== undefined,
            get: (value) => {
              return value;
            },
            set: (value) => {
              return value;
            },
          },
          default: [],
          validate: (value: string[]) => value !== undefined,
          get: (value: string[]) => {
            return value;
          },
          set: (value?: string[]) => {
            return value;
          },
        },
        numberListValue: {
          type: "list",
          items: {
            type: "number",
            default: () => 100,
            validate: (value) => value !== undefined,
            get: (value) => {
              return value;
            },
            set: (value) => {
              return value;
            },
          },
          default: [123, 123],
          validate: (value: number[]) => value !== undefined,
          get: (value: number[]) => {
            return value;
          },
          set: (value?: number[]) => {
            return value;
          },
        },
        mapListValue: {
          type: "list",
          items: {
            type: "map",
            properties: {
              stringVal: {
                type: "string",
                default: "def",
                validate: (value) => value !== undefined,
                get: (value) => {
                  return value;
                },
                set: (value) => {
                  return value;
                },
              },
              numVal: {
                type: "number",
                default: 100,
                validate: (value) => value !== undefined,
                get: (value) => {
                  return value;
                },
                set: (value) => {
                  return value;
                },
              },
              boolValue: {
                type: "boolean",
                default: () => false,
                validate: (value) => value !== undefined,
                get: (value) => {
                  return value;
                },
                set: (value) => {
                  return value;
                },
              },
              stringSetValue: {
                type: "set",
                items: "string",
                default: ["abc"],
                validate: (value) => value !== undefined,
                get: (value) => {
                  return value;
                },
                set: (value) => {
                  return value;
                },
              },
              numberSetValue: {
                type: "set",
                items: "number",
                default: [5],
                validate: (value) => value !== undefined,
                get: (value) => {
                  return value;
                },
                set: (value) => {
                  return value;
                },
              },
              enumVal: {
                type: ["abc", "def"] as const,
                validate: (value: "abc" | "def") => value !== undefined,
                default: () => "abc",
                get: (value: "abc" | "def") => {
                  return value;
                },
                set: (value?: "abc" | "def") => {
                  return value;
                },
              },
            },
            default: () => ({
              stringVal: "anx",
              numVal: 13,
              boolValue: true,
              emumValue: "abc",
              stringSetValue: ["def"],
              numberSetValue: [10],
            }),
            validate: (value) => value !== undefined,
            get: (value) => {
              return value;
            },
            set: (value) => {
              return value;
            },
          },
          default: [],
          validate: (value: Record<string, any>[]) => value !== undefined,
          get: (value: Record<string, any>[]) => {
            return value;
          },
          set: (value?: Record<string, any>[]) => {
            return value;
          },
        },
      },
      default: () => undefined,
      validate: (value) => value !== undefined,
      get: (value) => {
        return value;
      },
      set: (value) => {
        return value;
      },
    },
  },
  indexes: {
    user: {
      collection: "complexShapes",
      pk: {
        composite: ["username"],
        field: "pk",
      },
      sk: {
        composite: [],
        field: "sk",
      },
    },
    _: {
      collection: "owned",
      index: "gsi1pk-gsi1sk-index",
      pk: {
        composite: ["username"],
        field: "gsi1pk",
      },
      sk: {
        field: "gsi1sk",
        composite: [],
      },
    },
  },
});

export const mapTests = new MockEntity({
  model: {
    entity: "mapTests",
    service: "tests",
    version: "1",
  },
  attributes: {
    username: {
      type: "string",
    },
    mapObject: {
      type: "map",
      properties: {
        minimal: {
          type: "string",
        },
        required: {
          type: "string",
          required: true,
        },
        hidden: {
          type: "string",
          hidden: true,
        },
        readOnly: {
          type: "string",
          readOnly: true,
        },
        anotherMap: {
          type: "map",
          properties: {
            minimal: {
              type: "string",
            },
            required: {
              type: "string",
              required: true,
            },
            hidden: {
              type: "string",
              hidden: true,
            },
            readOnly: {
              type: "string",
              readOnly: true,
            },
          },
        },
      },
    },
  },
  indexes: {
    user: {
      collection: "complexShapes",
      pk: {
        composite: ["username"],
        field: "pk",
      },
      sk: {
        composite: [],
        field: "sk",
      },
    },
  },
});

// casing property on schema
export const casingEntity = new MockEntity({
  model: {
    service: "MallStoreDirectory",
    entity: "MallStores",
    version: "1",
  },
  attributes: {
    id: {
      type: "string",
      field: "id",
    },
    mall: {
      type: "string",
      required: true,
      field: "mall",
    },
    stores: {
      type: "number",
    },
    value: {
      type: "string",
    },
  },
  indexes: {
    store: {
      collection: ["myCollection"],
      pk: {
        field: "parition_key",
        composite: ["id"],
        casing: "lower",
      },
      sk: {
        field: "sort_key",
        composite: ["mall", "stores"],
        casing: "upper",
      },
    },
    other: {
      index: "idx1",
      collection: "otherCollection",
      pk: {
        field: "parition_key_idx1",
        composite: ["mall"],
        casing: "upper",
      },
      sk: {
        field: "sort_key_idx1",
        composite: ["id", "stores"],
        casing: "default",
      },
    },
  },
});

export const readOnlyEntity = new MockEntity({
  model: {
    entity: "readOnlyEntity",
    service: "tests",
    version: "1",
  },
  attributes: {
    prop1: {
      type: "string",
      readOnly: true,
    },
    prop2: {
      type: "number",
      readOnly: false,
    },
    prop3: {
      type: "boolean",
      readOnly: false,
    },
    prop4: {
      type: ["abc"] as const,
      readOnly: true,
    },
    prop5: {
      type: "map",
      readOnly: true,
      properties: {
        mapProperty: {
          type: "string",
        },
      },
    },
    prop6: {
      type: "list",
      readOnly: true,
      items: {
        type: "string",
      },
    },
    prop7: {
      type: "set",
      readOnly: true,
      items: "string",
    },
  },
  indexes: {
    record: {
      collection: "complexShapes",
      pk: {
        composite: ["prop1"],
        field: "pk",
      },
      sk: {
        composite: ["prop2"],
        field: "sk",
      },
    },
  },
});

export const diverseTableKeyTypes = new MockEntity({
  model: {
    service: "test",
    entity: "diverseTableKeyTypes",
    version: "1",
  },
  attributes: {
    prop1: {
      type: "string",
      readOnly: true,
    },
    prop2: {
      type: "number",
      readOnly: false,
    },
    prop3: {
      type: "boolean",
      readOnly: false,
    },
    prop4: {
      type: ["abc"] as const,
      readOnly: true,
    },
    prop5: {
      type: "string",
      readOnly: true,
    },
    prop6: {
      type: "number",
      readOnly: false,
    },
    prop7: {
      type: "boolean",
      readOnly: false,
    },
    prop8: {
      type: ["abc"] as const,
      readOnly: true,
    },
  },
  indexes: {
    record: {
      pk: {
        field: "pk",
        composite: ["prop1", "prop2", "prop3", "prop4"],
      },
      sk: {
        field: "sk",
        composite: ["prop5", "prop6", "prop7", "prop8"],
      },
    },
  },
});