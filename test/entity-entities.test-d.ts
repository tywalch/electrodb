import { Entity, CustomAttributeType } from "../index";

export const entityWithSK = new Entity({
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

export const requiredMapAttributeEntity = new Entity({
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

export type UnionType =
  | { prop1: string }
  | { prop1: string; prop2: number }
  | { prop3: string }
  | { prop4: number; prop3: string };

export const customAttributeEntity = new Entity({
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
        composite: [],
        field: "sk",
      },
    },
  },
});