import {
  Entity,
  Resolve,
  CustomAttributeType,
  EntityRecord,
  EntityItem,
} from "../";
import { expectType } from "tsd";

const troubleshoot = <Params extends any[], Response>(
  fn: (...params: Params) => Response,
  response: Response,
) => {};
const magnify = <T>(value: T): Resolve<T> => {
  return {} as Resolve<T>;
};

const entityWithSK = new Entity({
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
    attr11: {
      type: "list",
      items: {
        type: "string",
      },
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

const requiredMapAttributeEntity = new Entity({
  model: {
    entity: "user",
    service: "versioncontrol",
    version: "1",
  },
  attributes: {
    stringVal: {
      type: "string",
    },
    stringVal2: {
      type: "string",
    },
    map: {
      type: "map",
      required: true,
      properties: {
        test: {
          type: "string",
        },
      },
    },
  },
  indexes: {
    user: {
      collection: "overview",
      pk: {
        composite: ["stringVal"],
        field: "pk",
      },
      sk: {
        composite: ["stringVal2"],
        field: "sk",
      },
    },
  },
});

type UnionType =
  | { prop1: string }
  | { prop1: string; prop2: number }
  | { prop3: string }
  | { prop4: number; prop3: string };

const customAttributeEntity = new Entity({
  model: {
    entity: "user",
    service: "versioncontrol",
    version: "1",
  },
  attributes: {
    union: {
      required: true,
      type: CustomAttributeType<UnionType>("any"),
    },
    stringVal: {
      type: "string",
    },
  },
  indexes: {
    user: {
      collection: "overview",
      pk: {
        composite: ["stringVal"],
        field: "pk",
      },
      sk: {
        composite: ["stringVal2"],
        field: "sk",
      },
    },
  },
});

entityWithSK
  .update({
    attr1: "abc",
    attr2: "def",
  })
  .append({});

type CreateOptions = Parameters<typeof entityWithSK.create>[0];
type UpsertOptions = Parameters<typeof entityWithSK.upsert>[0];

const createOptions = {} as Partial<CreateOptions>;
const upsertOptions = {} as UpsertOptions;

expectType<UpsertOptions>(createOptions);
expectType<{
  attr1?: string | undefined;
  attr2?: string | undefined;
  attr3?: "123" | "def" | "ghi" | undefined;
  attr4?: "abc" | "ghi" | undefined;
  attr5?: string | undefined;
  attr6?: number | undefined;
  attr7?: any;
  attr8?: boolean | undefined;
  attr9?: number | undefined;
  attr10?: boolean | undefined;
  attr11?: string[] | undefined;
}>(magnify(upsertOptions));

const getItem = async () => {
  const item = await requiredMapAttributeEntity
    .get({ stringVal: "abc", stringVal2: "def" })
    .go();
  if (item.data) {
    return item.data;
  }

  throw new Error("Not exists!");
};

type Item = Awaited<ReturnType<typeof getItem>>;
const item = {} as Item;

expectType<{
  stringVal: string;
  stringVal2: string;
  map: {
    test?: string;
  };
}>(magnify(item));

type CustomAttributeEntityRecordType = EntityRecord<
  typeof customAttributeEntity
>;
const unionEntityRecord = {} as CustomAttributeEntityRecordType["union"];

expectType<UnionType>(magnify(unionEntityRecord));

type CustomAttributeEntityItemType = EntityItem<typeof customAttributeEntity>;
const unionEntityItem = {} as CustomAttributeEntityItemType["union"];

expectType<UnionType>(magnify(unionEntityItem));
