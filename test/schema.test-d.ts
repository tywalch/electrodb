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
} from "../";
import { expectType, expectError, expectNotType } from "tsd";

type Resolve<T> = T extends Function | string | number | boolean
  ? T
  : { [Key in keyof T]: Resolve<T[Key]> };

const troubleshoot = <Params extends any[], Response>(
  fn: (...params: Params) => Response,
  response: Response,
) => {};
const magnify = <T>(value: T): Resolve<T> => {
  return {} as Resolve<T>;
};

class MockEntity<
  A extends string,
  F extends string,
  C extends string,
  S extends Schema<A, F, C>,
> {
  readonly schema: S;
  constructor(schema: S) {
    this.schema = schema;
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

type MyBasicCustomAttribute = {
  type: "pizza" | "flatbread";
  toppings: Array<"pep" | "mush" | "garlic">;
  count: number;
};

type MyCustomAttributeType = {
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

const schemaWithCustomAttribute = createSchema({
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

const entityWithCustomAttribute = new MockEntity(schemaWithCustomAttribute);

type OpaqueAttr1 = string & { cheese: "cheddar" };
type OpaqueAttr2 = number & { cheese: "bacon" };
type PizzaSize = number & { isPizzaSize: true };

const schemaWithCustomAttribute2 = createSchema({
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

const entityWithCustomAttribute2 = new MockEntity(schemaWithCustomAttribute2);

const schemaWithNestedCustomAttribute = createSchema({
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

const entityWithNestedCustomAttribute = new MockEntity(schemaWithNestedCustomAttribute);

const schemaWithEnumSets = createSchema({
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
const entityWithEnumSets = new MockEntity(schemaWithEnumSets);

const schemaWithoutCollection = createSchema({
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

const entityWithoutCollection = new MockEntity(schemaWithoutCollection);

const schemaWithSK = createSchema({
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
const entityWithSK = new MockEntity(schemaWithSK);

const schemaWithoutSK = createSchema({
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

const entityWithoutSK = new MockEntity(schemaWithoutSK);

const standAloneSchema = createSchema({
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
const standAloneEntity = new MockEntity(standAloneSchema);

const standAloneSchemaWithDefault = createSchema({
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
const standAloneEntityWithDefault = new MockEntity(standAloneSchemaWithDefault);

const standAloneEntity2 = new MockEntity({
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

const normalEntity1 = new MockEntity({
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

const normalEntity2 = new MockEntity({
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

const entityWithHiddenAttributes1 = new MockEntity({
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

let entityWithHiddenAttributes2 = new MockEntity({
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

const entityWithMultipleCollections2 = new MockEntity({
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

const entityWithMultipleCollections3 = new MockEntity({
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

const entityWithWatchAll = new MockEntity({
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

const entityWithComplexShapes = new MockEntity({
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

const entityWithComplexShapesRequired = new MockEntity({
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

const entityWithComplexShapesRequiredOnEdge = new MockEntity({
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

const entityWithComplexShapesRequiredOnEdgeWithDefault = new MockEntity({
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

const deepMap = new MockEntity({
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

const complex = new MockEntity({
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

const mapTests = new MockEntity({
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
const casingEntity = new MockEntity({
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

const readOnlyEntity = new MockEntity({
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

const diverseTableKeyTypes = new MockEntity({
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

expectError(() => {
  CustomAttributeType<string>("any");
});

expectError(() => {
  CustomAttributeType<{ complex: "shape" }>("string");
});

expectError(() => {
  CustomAttributeType<boolean>("number");
});

CustomAttributeType<string>("string");
CustomAttributeType<number>("number");
CustomAttributeType<boolean>("boolean");
CustomAttributeType<{ complex: string }>("any");

// getEntityCollections
expectType<{ normalcollection: "tableIndex" }>(
  normalEntity1.getEntityCollections(),
);

expectType<{
  normalcollection: "indexTable";
  mycollection1: "anotherIndex";
}>(normalEntity2.getEntityCollections());

expectType<{}>(entityWithoutCollection.getEntityCollections());

expectType<{
  outercollection: "myIndex";
  innercollection: "myIndex";
  extracollection: "myIndex2";
}>(entityWithMultipleCollections2.getEntityCollections());

expectType<{
  outercollection: "myIndex";
  extracollection: "myIndex2";
}>(entityWithMultipleCollections3.getEntityCollections());

// getIndexCollections
expectType<"normalcollection">(normalEntity1.getIndexCollections());
expectType<"normalcollection" | "mycollection1">(
  normalEntity2.getIndexCollections(),
);
expectType<never>(entityWithoutCollection.getIndexCollections());
expectType<"outercollection" | "innercollection" | "extracollection">(
  entityWithMultipleCollections2.getIndexCollections(),
);
expectType<"outercollection" | "extracollection">(
  entityWithMultipleCollections3.getIndexCollections(),
);

// ItemTypeDescription
// todo: current implementation is shallow, is that a problem?
expectType<{ attr1: "string"; attr2: "string" }>(
  entityWithMultipleCollections2.getItemTypeDescription(),
);
expectType<{
  attr1: "string";
  attr2: "string";
  attr3: Readonly<["123", "def", "ghi"]>;
  attr4: Readonly<["abc", "def"]>;
  attr5: "string";
  attr6: "number";
  attr7: "any";
  attr8: "boolean";
  attr9: "number";
}>(entityWithoutSK.getItemTypeDescription());

expectType<{
  username: "string";
  mapObject: "map";
}>(mapTests.getItemTypeDescription());

// getRequiredAttributes
expectType<"attr4" | "attr8">(entityWithoutSK.getRequiredAttributes());
expectType<"prop3">(normalEntity2.getRequiredAttributes());
expectType<"attr3" | "attr4" | "attr5" | "attr6">(
  entityWithComplexShapesRequired.getRequiredAttributes(),
);

// getHiddenAttributes
expectType<"prop4">(entityWithHiddenAttributes2.getHiddenAttributes());

// getReadOnlyAttributes
expectType<"prop1" | "prop4" | "prop5" | "prop6" | "prop7">(
  readOnlyEntity.getReadOnlyAttributes(),
);

// getTableIndexes
expectType<{
  store: "table";
  other: "secondary";
}>(casingEntity.getTableIndexes());

expectType<{
  myIndex: "table";
  myIndex2: "secondary";
  myIndex3: "secondary";
}>(entityWithSK.getTableIndexes());

expectType<{
  myIndex: "table";
  myIndex2: "secondary";
  myIndex3: "secondary";
}>(entityWithoutSK.getTableIndexes());

// getTableIndexName
expectType<"store">(casingEntity.getTableIndexName());
expectType<"myIndex">(entityWithSK.getTableIndexName());
expectType<"myIndex">(entityWithoutSK.getTableIndexName());

// getPKCompositeAttributes
expectType<{
  tableIndex: "prop1" | "prop2";
}>(normalEntity1.getPKCompositeAttributes());

expectType<{
  myIndex: "attr1";
}>(entityWithCustomAttribute2.getPKCompositeAttributes());

expectType<{
  myIndex: "attr1";
}>(entityWithNestedCustomAttribute.getPKCompositeAttributes());

expectType<{
  myIndex: "attr1";
  myIndex2: "attr6" | "attr9";
  myIndex3: "attr5";
}>(entityWithSK.getPKCompositeAttributes());

expectType<{
  myIndex: "attr1";
  myIndex2: "attr6" | "attr9";
  myIndex3: "attr5";
}>(entityWithoutSK.getPKCompositeAttributes());

// getSKCompositeAttributes
expectType<{
  tableIndex: "prop4";
}>(normalEntity1.getSKCompositeAttributes());

expectType<{
  myIndex: "attr2";
  myIndex2: "attr4" | "attr5";
  myIndex3: "attr4" | "attr3" | "attr9";
}>(entityWithSK.getSKCompositeAttributes());

expectType<{
  myIndex: never;
  myIndex2: never;
  myIndex3: never;
}>(entityWithoutSK.getSKCompositeAttributes());

// getTableIndexPKCompositeAttributes
expectType<{
  tableIndex: "prop1" | "prop2";
}>(normalEntity1.getTableIndexPKCompositeAttributes());

expectType<{
  myIndex: "attr1";
}>(entityWithSK.getTableIndexPKCompositeAttributes());

expectType<{
  myIndex: "attr1";
}>(entityWithoutSK.getTableIndexPKCompositeAttributes());

// getTableIndexSKCompositeAttributes
expectType<{
  tableIndex: "prop4";
}>(normalEntity1.getTableIndexSKCompositeAttributes());

expectType<{
  myIndex: "attr2";
}>(entityWithSK.getTableIndexSKCompositeAttributes());

expectType<{
  myIndex: never;
}>(entityWithoutSK.getTableIndexSKCompositeAttributes());

// getTableIndexPKAttributes
expectType<{ attr1: string }>(entityWithSK.getTableIndexPKAttributes());
expectType<{ prop1: string; prop2: string }>(
  normalEntity2.getTableIndexPKAttributes(),
);
expectType<{
  prop1: string;
  prop2: number;
  prop3: boolean;
  prop4: "abc";
}>(diverseTableKeyTypes.getTableIndexPKAttributes());

expectType<{
  attr1: OpaqueAttr1;
}>(entityWithCustomAttribute2.getTableIndexPKAttributes());

expectType<{
  attr1: OpaqueAttr1;
}>(entityWithNestedCustomAttribute.getTableIndexPKAttributes());

// getTableIndexSKAttributes
expectType<{ attr2: string }>(entityWithSK.getTableIndexSKAttributes());
expectType<{}>(entityWithoutSK.getTableIndexSKAttributes());
expectType<{ prop5: number }>(normalEntity2.getTableIndexSKAttributes());
expectType<{
  prop5: string;
  prop6: number;
  prop7: boolean;
  prop8: "abc";
}>(diverseTableKeyTypes.getTableIndexSKAttributes());

expectType<{
  attr2: OpaqueAttr2;
}>(entityWithCustomAttribute2.getTableIndexSKAttributes());

expectType<{
  attr2: OpaqueAttr2;
}>(entityWithNestedCustomAttribute.getTableIndexSKAttributes());

// getTableIndexCompositeAttributes
expectType<{
  attr1: string;
  attr2?: string | undefined;
}>(entityWithSK.getTableIndexCompositeAttributes());

expectType<{
  attr1: string;
}>(entityWithoutSK.getTableIndexCompositeAttributes());

expectType<{
  prop1: string;
  prop2: string;
  prop5?: number | undefined;
}>(normalEntity2.getTableIndexCompositeAttributes());

expectType<{
  prop1: string;
  prop2: number;
  prop3: boolean;
  prop4: "abc";
  prop5?: string | undefined;
  prop6?: number | undefined;
  prop7?: boolean | undefined;
  prop8?: "abc" | undefined;
}>(diverseTableKeyTypes.getTableIndexCompositeAttributes());

// getIndexPKAttributes
expectType<{
  attr1: string;
}>(entityWithSK.getIndexPKAttributes("myIndex"));

expectType<{
  attr6: number;
  attr9: number;
}>(entityWithSK.getIndexPKAttributes("myIndex2"));

expectType<{
  attr5: string;
}>(entityWithSK.getIndexPKAttributes("myIndex3"));

expectType<{
  attr1: string;
}>(entityWithoutSK.getIndexPKAttributes("myIndex"));

expectType<{
  attr6: number;
  attr9: number;
}>(entityWithoutSK.getIndexPKAttributes("myIndex2"));

expectType<{
  attr5: string;
}>(entityWithoutSK.getIndexPKAttributes("myIndex3"));

expectType<{
  prop1: string;
  prop2: string;
}>(normalEntity2.getIndexPKAttributes("indexTable"));

expectType<{
  attr6: number;
  attr9: number;
}>(normalEntity2.getIndexPKAttributes("anotherIndex"));

expectType<{
  prop1: string;
  prop2: number;
  prop3: boolean;
  prop4: "abc";
}>(diverseTableKeyTypes.getIndexPKAttributes("record"));

// getIndexSKAttributes
expectType<{
  attr2: string;
}>(entityWithSK.getIndexSKAttributes("myIndex"));

expectType<{
  attr4: "abc" | "ghi";
  attr5: string;
}>(entityWithSK.getIndexSKAttributes("myIndex2"));

expectType<{
  attr4: "abc" | "ghi";
  attr3: "123" | "def" | "ghi";
  attr9: number;
}>(entityWithSK.getIndexSKAttributes("myIndex3"));

expectType<{}>(entityWithoutSK.getIndexSKAttributes("myIndex"));
expectType<{}>(entityWithoutSK.getIndexSKAttributes("myIndex2"));
expectType<{}>(entityWithoutSK.getIndexSKAttributes("myIndex3"));

expectType<{
  prop5: number;
}>(normalEntity2.getIndexSKAttributes("indexTable"));

expectType<{}>(normalEntity2.getIndexSKAttributes("anotherIndex"));

expectType<{
  prop5: string;
  prop6: number;
  prop7: boolean;
  prop8: "abc";
}>(diverseTableKeyTypes.getIndexSKAttributes("record"));

// getAllTableIndexCompositeAttributes
expectType<{
  attr1: string;
  attr2: string;
}>(entityWithSK.getAllTableIndexCompositeAttributes());

expectType<{
  attr1: string;
}>(entityWithoutSK.getAllTableIndexCompositeAttributes());

expectType<{
  prop1: string;
  prop2: string;
  prop5: number;
}>(normalEntity2.getAllTableIndexCompositeAttributes());

expectType<{
  attr1: OpaqueAttr1;
  attr2: OpaqueAttr2;
}>(entityWithCustomAttribute2.getAllTableIndexCompositeAttributes());

expectType<{
  attr1: OpaqueAttr1;
  attr2: OpaqueAttr2;
}>(entityWithNestedCustomAttribute.getAllTableIndexCompositeAttributes());

expectType<{
  prop1: string;
  prop2: number;
  prop3: boolean;
  prop4: "abc";
  prop5: string;
  prop6: number;
  prop7: boolean;
  prop8: "abc";
}>(diverseTableKeyTypes.getAllTableIndexCompositeAttributes());

// getTableItem

expectType<{
  prop1: string;
  prop2: string;
  prop3?:
    | {
        val1?: string | undefined;
      }
    | undefined;
  prop4?: {
    val2?: number | undefined;
    val3?: string[] | undefined;
    val4?: number[] | undefined;
  }[];
  prop5?: string[] | undefined;
  prop6?: string[] | undefined;
}>(entityWithComplexShapes.getTableItem());

expectType<{
  attr1: OpaqueAttr1;
  attr2: OpaqueAttr2;
  attr3: MyBasicCustomAttribute;
  attr4: MyBasicCustomAttribute;
  attr5?: MyBasicCustomAttribute;
  attr6?: PizzaSize;
}>(entityWithCustomAttribute2.getTableItem());

expectType<{
  attr1: OpaqueAttr1;
  attr2: OpaqueAttr2;
  map: {
    attr3: MyBasicCustomAttribute;
    attr4: MyBasicCustomAttribute;
    attr5?: MyBasicCustomAttribute;
    attr6?: PizzaSize;
  };
  list: Array<{
    attr3: MyBasicCustomAttribute;
    attr4: MyBasicCustomAttribute;
    attr5?: MyBasicCustomAttribute;
    attr6?: PizzaSize;
  }>;
}>(entityWithNestedCustomAttribute.getTableItem());

expectType<{
  id: string;
  mall: string;
  stores: number;
  value?: string | undefined;
}>(casingEntity.getTableItem());

expectType<{
  prop1: string;
  prop2: string;
  prop3?: string | undefined;
}>(entityWithWatchAll.getTableItem());

expectType<{
  prop1: string;
  prop2: string;
  attr3: {
    val1: string;
  };
  attr4: Array<{
    val2: number;
    val3: string[];
    val4: number[];
  }>;
  attr5: string[];
  attr6: string[];
}>(entityWithComplexShapesRequired.getTableItem());

expectType<{
  prop1: string;
  prop2: string;
  attrz3?:
    | {
        val1: string;
      }
    | undefined;
  attrz4?:
    | {
        val2: number;
        val3?: string[] | undefined;
        val4?: number[] | undefined;
        val5?:
          | {
              val6: string;
            }
          | undefined;
      }[]
    | undefined;
  attrz5?: string[] | undefined;
  attrz6?: string[] | undefined;
}>(entityWithComplexShapesRequiredOnEdge.getTableItem());

expectType<{
  prop1: string;
  prop2: string;
  prop3?:
    | {
        val1?: string | undefined;
      }
    | undefined;
  prop4?:
    | {
        val2?: number | undefined;
        val3?: string[] | undefined;
        val4?: number[] | undefined;
      }[]
    | undefined;
  prop5?: string[] | undefined;
  prop6?: string[] | undefined;
}>(entityWithComplexShapes.getTableItem());

expectNotType<{
  prop1: string;
  prop2: string;
  attrz3: {
    val1?: string | undefined;
  };
  attrz4: Array<{
    val2: number | undefined;
    val3: string[];
    val4: number[];
    val5: {
      val6?: string | undefined;
    };
  }>;
  attr5: string[];
  attr6: string[];
}>(entityWithComplexShapesRequiredOnEdge.getTableItem());

expectType<{
  prop1: string;
  prop2: string;
  prop3: string;
}>(entityWithHiddenAttributes1.getTableItem());

// getResponseItem
expectType<{
  prop1: string;
  prop2: string;
}>(entityWithHiddenAttributes1.getResponseItem());

expectType<{
  attr1: OpaqueAttr1;
  attr2: OpaqueAttr2;
  attr3: MyBasicCustomAttribute;
  attr4: MyBasicCustomAttribute;
  attr5?: MyBasicCustomAttribute;
  attr6?: PizzaSize;
}>(entityWithCustomAttribute2.getResponseItem());

expectType<{
  attr1: OpaqueAttr1;
  attr2: OpaqueAttr2;
  map: {
    attr3: MyBasicCustomAttribute;
    attr4: MyBasicCustomAttribute;
    attr5?: MyBasicCustomAttribute;
    attr6?: PizzaSize;
  },
  list: Array<{
    attr3: MyBasicCustomAttribute;
    attr4: MyBasicCustomAttribute;
    attr5?: MyBasicCustomAttribute;
    attr6?: PizzaSize;
  }>;
}>(magnify(entityWithNestedCustomAttribute.getResponseItem()));

function hiddenKeysOnRoot() {
  const item = entityWithHiddenAttributes1.getResponseItem();
  if (item) {
    const keys = "" as keyof typeof item;
    expectType<"prop1" | "prop2">(keys);
    expectNotType<"hidden">(keys);
  }
}

expectType<{
  username: string;
  mapObject?:
    | {
        minimal?: string | undefined;
        readOnly?: string | undefined;
        required: string;
        anotherMap?:
          | {
              minimal?: string | undefined;
              readOnly?: string | undefined;
              required: string;
            }
          | undefined;
      }
    | undefined;
}>(magnify(mapTests.getResponseItem()));

function hiddenKeysInMap() {
  const item = mapTests.getResponseItem();
  if (item.mapObject) {
    const keys = "" as keyof typeof item.mapObject;
    expectType<"required" | "readOnly" | "minimal" | "anotherMap">(keys);
    expectNotType<"hidden">(keys);
  }
}

expectType<{
  prop1: string;
  prop2: string;
  prop3: string;
  prop4?: string | undefined;
  prop5: string;
}>(standAloneEntityWithDefault.getResponseItem());

expectType<{
  attr1: string;
  strEnumSet?: ("ONE" | "TWO" | "THREE")[] | undefined;
  numEnumSet?: (1 | 2 | 3)[] | undefined;
  mapAttr?:
    | {
        nestedStrEnumSet?: ("ONE" | "TWO" | "THREE")[] | undefined;
        nestedNumEnumSet?: (1 | 2 | 3)[] | undefined;
      }
    | undefined;
}>(magnify(entityWithEnumSets.getResponseItem()));

// RequiredPutItems
expectType<{
  username: true;
  mapObject: false;
}>(mapTests.getRequiredPutItems());

expectType<{
  attr1: true;
  attr2: false;
  attr3: true;
  attr4: false;
  attr5: false;
  attr6: false;
}>(entityWithCustomAttribute2.getRequiredPutItems());

expectType<{
  attr1: true;
  attr2: false;
  map: true;
  list: true;
}>(entityWithNestedCustomAttribute.getRequiredPutItems());

expectType<{
  prop1: false; // is pk, but has default
  prop2: true; // is pk
  prop3: true; // is required
  prop4: true; // is sk
  prop10: false; // optional default
}>(normalEntity1.getRequiredPutItems());

expectType<{
  prop1: false; // is pk, but has default
  prop2: true; // is pk
  prop3: false; // is sk, but has default
  prop4: true; // is required
  prop5: false; // is required, but has default
}>(standAloneEntity2.getRequiredPutItems());

// PutItem
expectType<{
  username: string;
  mapObject?:
    | {
        minimal?: string | undefined;
        required: string;
        readOnly?: string | undefined;
        anotherMap?:
          | {
              minimal?: string | undefined;
              required: string;
              readOnly?: string | undefined;
            }
          | undefined;
      }
    | undefined;
}>(mapTests.getPutItem());

expectType<{
  attr1: OpaqueAttr1;
  attr2?: OpaqueAttr2;
  attr3: MyBasicCustomAttribute;
  attr4?: MyBasicCustomAttribute;
  attr5?: MyBasicCustomAttribute;
  attr6?: PizzaSize;
}>(entityWithCustomAttribute2.getPutItem());

expectType<{
  attr1: OpaqueAttr1;
  attr2?: OpaqueAttr2;
  map: {
    attr3: MyBasicCustomAttribute;
    attr4?: MyBasicCustomAttribute;
    attr5?: MyBasicCustomAttribute;
    attr6?: PizzaSize;
  };
  list: {
    attr3: MyBasicCustomAttribute;
    attr4?: MyBasicCustomAttribute;
    attr5?: MyBasicCustomAttribute | undefined;
    attr6?: PizzaSize | undefined;
  }[];
}>(magnify(entityWithNestedCustomAttribute.getPutItem()));

expectType<{
  prop1?: string | undefined;
  prop2: string;
  prop3: string;
  prop4?: string | undefined;
  prop5?: string | undefined;
}>(standAloneEntityWithDefault.getPutItem());

expectType<{
  prop1: string;
  prop2?: string | undefined;
  attrz3?:
    | {
        val1: string;
      }
    | undefined;
  attrz4?:
    | {
        val2?: number | undefined;
        val3?: string[] | undefined;
        val4?: number[] | undefined;
        val6?: boolean | undefined;
        val5?:
          | {
              val6?: string | undefined;
            }
          | undefined;
      }[]
    | undefined;
  attrz5?: string[] | undefined;
  attrz6?: string[] | undefined;
}>(entityWithComplexShapesRequiredOnEdgeWithDefault.getPutItem());

expectType<{
  prop1?: string | undefined; // is pk, but has default
  prop2: string; // is pk
  prop3: string; // is required
  prop4: number; // is sk
  prop10?: boolean | undefined; // optional default
}>(normalEntity1.getPutItem());

expectType<{
  prop1?: string | undefined; // is pk, but has default
  prop2: string; // is pk
  prop3?: string | undefined; // is sk, but has default
  prop4: {
    prop1?: string | undefined;
    prop2: string;
    prop3?: string | undefined;
  }; // is required
  prop5?:
    | {
        prop1?: string | undefined;
        prop2: string;
        prop3?: string | undefined;
      }
    | undefined; // is required, but has default
}>(standAloneEntity2.getPutItem());

// UpdateData
expectType<{
  mapObject: {
    minimal: string;
    required: string;
    hidden: string;
    anotherMap: {
      minimal: string;
      required: string;
      hidden: string;
    };
  };
}>(mapTests.getUpdateData());

expectType<{ prop3: boolean }>(readOnlyEntity.getUpdateData());

// RemoveItem
expectType<Array<"mapObject">>(mapTests.getRemoveItem());

expectType<Array<"attr6">>(entityWithCustomAttribute2.getRemoveItem());

expectType<Array<never>>(entityWithNestedCustomAttribute.getRemoveItem());

expectType<Array<"prop3">>(readOnlyEntity.getRemoveItem());

expectType<Array<"prop10">>(normalEntity1.getRemoveItem());

expectType<Array<"attr3" | "attr5" | "attr6" | "attr7" | "attr9" | "attr10">>(
  entityWithSK.getRemoveItem(),
);

// AppendItem
expectType<{}>(magnify(readOnlyEntity.getAppendItem)());

expectType<{
  prop4?:
    | {
        val2?: number | undefined;
        val3?: string[] | undefined;
        val4?: number[] | undefined;
      }[]
    | undefined;
}>(magnify(entityWithComplexShapes.getAppendItem()));

expectType<{
  attr3?: MyBasicCustomAttribute | undefined;
  attr4?: MyBasicCustomAttribute | undefined;
  attr5?: undefined;
}>(magnify(entityWithCustomAttribute2.getAppendItem()));

expectType<{
  list?: Array<{
    attr3: MyBasicCustomAttribute;
    attr4: MyBasicCustomAttribute;
    attr6?: PizzaSize;
  }> | undefined;
}>(magnify(entityWithNestedCustomAttribute.getAppendItem()));

expectType<{
  attr4?:
    | {
        val2: number;
        val3: string[];
        val4: number[];
      }[]
    | undefined;
}>(magnify(entityWithComplexShapesRequired.getAppendItem()));

expectType<{
  attrz4?:
    | {
        val2: number;
        val3?: string[] | undefined;
        val4?: number[] | undefined;
        val5?:
          | {
              val6: string;
            }
          | undefined;
      }[]
    | undefined;
}>(magnify(entityWithComplexShapesRequiredOnEdge.getAppendItem()));

// AddItem
expectType<{
  strEnumSet?: ("ONE" | "TWO" | "THREE")[];
  numEnumSet?: (1 | 2 | 3)[];
}>(entityWithEnumSets.getAddItem());

expectType<{}>(complex.getAppendItem());

expectType<{
  attr5?: string[] | undefined;
  attr6?: string[] | undefined;
}>(entityWithComplexShapesRequired.getAddItem());

expectType<{
  attr2?: undefined;
  attr3?: MyBasicCustomAttribute | undefined;
  attr4?: MyBasicCustomAttribute | undefined;
  attr5?: undefined;
  attr6?: PizzaSize | undefined;
}>(magnify(entityWithCustomAttribute2.getAddItem()));

expectType<{
  attrz5?: string[] | undefined;
  attrz6?: string[] | undefined;
}>(entityWithComplexShapesRequiredOnEdge.getAddItem());

expectType<{
  // todo: would be great for these not to show up at all
  prop4?: undefined;
}>(normalEntity1.getAddItem());

expectType<{
  attr6?: number | undefined;
  attr7?: any;
  attr9?: number | undefined;
}>(entityWithSK.getAddItem());

expectType<{
  // todo: would be great for these not to show up at all
  prop2?: undefined;
  prop7?: undefined;
}>(readOnlyEntity.getAddItem());

// SubtractItem
expectType<{
  attr6?: number | undefined;
  attr7?: any;
  attr9?: number | undefined;
}>(entityWithSK.getSubtractItem());

expectType<{
  attr2?: undefined;
  attr6?: PizzaSize | undefined;
}>(magnify(entityWithCustomAttribute2.getSubtractItem()));

expectType<{}>(entityWithCustomAttribute.getSubtractItem());

expectType<{
  // todo: would be great for these not to show up at all
  prop4?: undefined;
}>(normalEntity1.getSubtractItem());

// DeleteItem
expectType<{
  attr5?: string[] | undefined;
  attr6?: string[] | undefined;
}>(entityWithComplexShapesRequired.getDeleteItem());

expectType<{
  attr2?: MyCustomAttributeType;
}>(entityWithCustomAttribute.getDeleteItem());

expectType<{
  attrz5?: string[] | undefined;
  attrz6?: string[] | undefined;
}>(entityWithComplexShapesRequiredOnEdge.getDeleteItem());

expectType<{
  attr3?: MyBasicCustomAttribute | undefined;
  attr4?: MyBasicCustomAttribute | undefined;
  attr5?: undefined;
}>(magnify(entityWithCustomAttribute2.getDeleteItem()));

expectType<{
  // todo: would be great for these not to show up at all
  prop2?: undefined;
}>(readOnlyEntity.getSubtractItem());

expectType<{}>(normalEntity1.getDeleteItem());

expectType<{
  strEnumSet?: ("ONE" | "TWO" | "THREE")[];
  numEnumSet?: (1 | 2 | 3)[];
}>(entityWithEnumSets.getDeleteItem());

expectType<{
  attr7?: any;
}>(entityWithSK.getDeleteItem());

expectType<{
  // todo: would be great for these not to show up at all
  prop7?: undefined;
}>(readOnlyEntity.getDeleteItem());
