import { expectType, expectError, expectNotType } from 'tsd';
import { Schema, Item, UpdateData } from './schema';
import {
  WhereAttributes,
  DataUpdateAttributes,
  WhereCallback,
  DataUpdateCallback,
} from './where';


type Resolve<T> = T extends Function | string | number | boolean
  ? T : {[Key in keyof T]: Resolve<T[Key]>}

const troubleshoot = <Params extends any[], Response>(fn: (...params: Params) => Response, response: Response) => {};
const magnify = <T>(value: T): Resolve<T> => { return {} as Resolve<T> };
const keys = <T>(value: T): keyof T => { return {} as keyof T };

class MockEntity<A extends string, F extends string, C extends string, S extends Schema<A,F,C>> {
  readonly schema: S;
  constructor(schema: S) {
    this.schema = schema;
  };

  getWhereAttributes(): Resolve<WhereAttributes<A,F,C,S, Item<A,F,C,S,S["attributes"]>>>  {
    return {} as Resolve<WhereAttributes<A,F,C,S, Item<A,F,C,S,S["attributes"]>>>;
  }

  getDataUpdateAttributes(): Resolve<DataUpdateAttributes<A,F,C,S, UpdateData<A,F,C,S>>> {
    return {} as Resolve<DataUpdateAttributes<A,F,C,S, UpdateData<A,F,C,S>>>;
  }

  getWhereCallback(fn: Resolve<WhereCallback<A,F,C,S, Item<A,F,C,S, S['attributes']>>>)  {
    return fn;
  }

  getDataUpdateCallback(fn: Resolve<DataUpdateCallback<A,F,C,S, UpdateData<A,F,C,S>>>)  {
    return fn;
  }
}

const entityWithoutCollection = new MockEntity({
  model: {
    entity: "entity2",
    service: "myservice",
    version: "myversion"
  },
  attributes: {
      attr1: {
          type: "string",
      },
      attr2: {
          type: "string",
      }
  },
  indexes: {
    myIndex: {
      pk: {
        field: "pk",
        composite: ["attr1"]
      },
      sk: {
        field: "sk",
        composite: ["attr2"]
      }
    },
    myIndex2: {
      index: "index2",
      pk: {
          field: "index2pk",
          composite: ["attr1"]
      },
      sk: {
          field: "index2sk",
          composite: ["attr2"]
      }
    },
  }
});

const entityWithSK = new MockEntity({
  model: {
      entity: "abc",
      service: "myservice",
      version: "myversion"
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
          validate: (val) => val.length > 0
      },
      attr3: {
          type: ["123", "def", "ghi"] as const,
          default: "def"
      },
      attr4: {
          type: ["abc", "ghi"] as const,
          required: true
      },
      attr5: {
          type: "string"
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
          get: (val) => ({key: "value"}),
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
          type: "number"
      },
      attr10: {
          type: "boolean"
      }
  },
  indexes: {
      myIndex: {
          collection: "mycollection2",
          pk: {
              field: "pk",
              composite: ["attr1"]
          },
          sk: {
              field: "sk",
              composite: ["attr2"]
          }
      },
      myIndex2: {
          collection: "mycollection1",
          index: "gsi1",
          pk: {
              field: "gsipk1",
              composite: ["attr6", "attr9"]
          },
          sk: {
              field: "gsisk1",
              composite: ["attr4", "attr5"]
          }
      },
      myIndex3: {
          collection: "mycollection",
          index: "gsi2",
          pk: {
              field: "gsipk2",
              composite: ["attr5"]
          },
          sk: {
              field: "gsisk2",
              composite: ["attr4", "attr3", "attr9"]
          }
      }
  }
});

const entityWithoutSK = new MockEntity({
  model: {
      entity: "abc",
      service: "myservice",
      version: "myversion"
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
          validate: (val) => val.length > 0
      },
      attr3: {
          type: ["123", "def", "ghi"] as const,
          default: "def"
      },
      attr4: {
          type: ["abc", "def"] as const,
          required: true
      },
      attr5: {
          type: "string"
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
          get: (val) => ({key: "value"}),
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
          type: "number"
      }
  },
  indexes: {
      myIndex: {
          pk: {
              field: "pk",
              composite: ["attr1"]
          }
      },
      myIndex2: {
          index: "gsi1",
          collection: "mycollection1",
          pk: {
              field: "gsipk1",
              composite: ["attr6", "attr9"]
          },
          sk: {
              field: "gsisk1",
              composite: []
          }
      },
      myIndex3: {
          collection: "mycollection",
          index: "gsi2",
          pk: {
              field: "gsipk2",
              composite: ["attr5"]
          },
          sk: {
              field: "gsisk2",
              composite: []
          }
      }
  }
});

const standAloneEntity = new MockEntity({
  model: {
      entity: "standalone",
      service: "myservice",
      version: "1"
  },
  attributes: {
      prop1: {
          type: "string",
          default: "abc"
      },
      prop2: {
          type: "string"
      },
      prop3: {
          type: "string"
      }
  },
  indexes: {
      index1: {
          pk: {
              field: "pk",
              composite: ["prop1", "prop2"]
          },
          sk: {
              field: "sk",
              composite: ["prop3"]
          }
      }
  }
});

const standAloneEntityWithDefault = new MockEntity({
  model: {
      entity: "standalone",
      service: "myservice",
      version: "1"
  },
  attributes: {
      prop1: {
        type: "string",
        default: "abc"
      },
      prop2: {
          type: "string"
      },
      prop3: {
          type: "string"
      },
      prop4: {
        type: "string",
        default: "abc"
      },
      prop5: {
        type: 'string',
        default: 'abc',
        required: true,
      }
  },
  indexes: {
      index1: {
          pk: {
              field: "pk",
              composite: ["prop1", "prop2"]
          },
          sk: {
              field: "sk",
              composite: ["prop3"]
          }
      }
  }
});

const standAloneEntity2 = new MockEntity({
  model: {
      entity: "standalone2",
      service: "myservice",
      version: "1"
  },
  attributes: {
      prop1: {
          type: "string",
          default: "abc"
      },
      prop2: {
          type: "string"
      },
      prop3: {
          type: "string",
          default: 'abc'
      },
      prop4: {
        type: 'map',
        required: true,
        properties: {
          prop1: {
            type: 'string',
          },
          prop2: {
            type: 'string',
            required: true,
          },
          prop3: {
            type: 'string',
            required: true,
            default: 'abc'
          }
        }
      },
      prop5: {
        type: 'map',
        required: true,
        default: {
          prop2: 'abc',
          prop3: 'abc',
        },
        properties: {
          prop1: {
            type: 'string',
          },
          prop2: {
            type: 'string',
            required: true,
          },
          prop3: {
            type: 'string',
            required: true,
            default: 'abc'
          }
        }
      }
  },
  indexes: {
      index1: {
          pk: {
              field: "pk",
              composite: ["prop1", "prop2"]
          },
          sk: {
              field: "sk",
              composite: ["prop3"]
          }
      }
  }
});

const normalEntity1 = new MockEntity({
  model: {
      entity: "normalEntity1",
      service: "myservice",
      version: "1"
  },
  attributes: {
      prop1: {
          type: "string",
          default: "abc"
      },
      prop2: {
          type: "string"
      },
      prop3: {
          type: "string",
          required: true
      },
      prop4: {
          type: "number"
      },
      prop10: {
          type: "boolean"
      }
  },
  indexes: {
      tableIndex: {
          collection: "normalcollection",
          pk: {
              field: "pk",
              composite: ["prop1", "prop2"]
          },
          sk: {
              field: "sk",
              composite: ["prop4"]
          }
      }
  }
});

const normalEntity2 = new MockEntity({
  model: {
      entity: "normalEntity2",
      service: "myservice",
      version: "1"
  },
  attributes: {
      prop1: {
          type: "string"
      },
      prop2: {
          type: "string"
      },
      prop3: {
          type: "string",
          required: true
      },
      prop5: {
          type: "number"
      },
      attr6: {
          type: "number",
          default: () => 100,
          get: (val) => val + 5,
          set: (val) => (val ?? 0) + 5,
          validate: (val) => true,
      },
      attr9: {
          type: "number"
      },
  },
  indexes: {
      indexTable: {
          collection: "normalcollection",
          pk: {
              field: "pk",
              composite: ["prop1", "prop2"]
          },
          sk: {
              field: "sk",
              composite: ["prop5"]
          }
      },
      anotherIndex: {
          index: "gsi1",
          collection: "mycollection1",
          pk: {
              field: "gsipk1",
              composite: ["attr6", "attr9"]
          },
          sk: {
              field: "gsisk1",
              composite: []
          }
      }
  }
});

const entityWithHiddenAttributes1 = new MockEntity({
  model: {
      entity: "e1",
      service: "s1",
      version: "1"
  },
  attributes: {
      prop1: {
          type: "string"
      },
      prop2: {
          type: "string"
      },
      prop3: {
          type: "string",
          required: true,
          hidden: true
      }
  },
  indexes: {
      record: {
          collection: "collection1",
          pk: {
              field: "pk",
              composite: ["prop1"]
          },
          sk: {
              field: "sk",
              composite: ["prop2"]
          }
      }
  }
});

let entityWithHiddenAttributes2 = new MockEntity({
  model: {
      entity: "e2",
      service: "s1",
      version: "1"
  },
  attributes: {
      prop1: {
          type: "string"
      },
      prop2: {
          type: "string"
      },
      prop4: {
          type: "string",
          hidden: true
      },
      prop5: {
          type: "string",
      }
  },
  indexes: {
      record: {
          collection: "collection1",
          pk: {
              field: "pk",
              composite: ["prop1"]
          },
          sk: {
              field: "sk",
              composite: ["prop2"]
          }
      }
  }
});

const entityWithMultipleCollections2 = new MockEntity({
  model: {
      entity: "entity2",
      service: "myservice",
      version: "myversion"
  },
  attributes: {
      attr1: {
          type: "string",
      },
      attr2: {
          type: "string",
      }
  },
  indexes: {
      myIndex: {
          collection: ["outercollection", "innercollection"] as const,
          pk: {
              field: "pk",
              composite: ["attr1"]
          },
          sk: {
              field: "sk",
              composite: ["attr2"]
          }
      },
      myIndex2: {
          index: "index2",
          collection: ["extracollection"] as const,
          pk: {
              field: "index2pk",
              composite: ["attr1"]
          },
          sk: {
              field: "index2sk",
              composite: ["attr2"]
          }
      },
  }
});

const entityWithMultipleCollections3 = new MockEntity({
  model: {
      entity: "entity3",
      service: "myservice",
      version: "myversion"
  },
  attributes: {
      attr1: {
          type: "string",
      },
      attr2: {
          type: "string",
      }
  },
  indexes: {
      myIndex: {
          collection: "outercollection" as const,
          pk: {
              field: "pk",
              composite: ["attr1"]
          },
          sk: {
              field: "sk",
              composite: ["attr2"]
          }
      },
      myIndex2: {
          index: "index2",
          collection: "extracollection" as const,
          pk: {
              field: "index2pk",
              composite: ["attr1"]
          },
          sk: {
              field: "index2sk",
              composite: ["attr2"]
          }
      },
  }
});

const entityWithWatchAll = new MockEntity({
  model: {
      entity: "withwatchall",
      service: "service",
      version: "1"
  },
  attributes: {
      prop1: {
          type: "string"
      },
      prop2: {
          type: "string"
      },
      prop3: {
          type: "string",
          watch: "*",
          set: (value) => {
              return value;
          }
      },
  },
  indexes: {
      record: {
          pk: {
              field: "pk",
              composite: ["prop1"]
          },
          sk: {
              field: "sk",
              composite: ["prop2"]
          }
      }
  }
});

const entityWithComplexShapes = new MockEntity({
  model: {
      entity: "entity",
      service: "service",
      version: "1"
  },
  attributes: {
      prop1: {
          type: "string",
          label: "props"
      },
      prop2: {
          type: "string",
      },
      prop3: {
          type: "map",
          properties: {
              val1: {
                  type: "string"
              }
          }
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
                          type: "string"
                      }
                  },
                  val4: {
                      type: "set",
                      items: "number"
                  }
              }
          }
      },
      prop5: {
          type: "set",
          items: "string"
      },
      prop6: {
          type: "set",
          items: "string"
      }
  },
  indexes: {
      record: {
          collection: "mops",
          pk: {
              field: "pk",
              composite: ["prop1"]
          },
          sk: {
              field: "sk",
              composite: ["prop2"]
          }
      }
  }
});

const entityWithComplexShapesRequired = new MockEntity({
  model: {
      entity: "entity",
      service: "service",
      version: "1"
  },
  attributes: {
      prop1: {
          type: "string",
          label: "props"
      },
      prop2: {
          type: "string",
      },
      attr3: {
          type: "map",
          properties: {
              val1: {
                  type: "string",
                  required: true
              }
          },
          required: true
      },
      attr4: {
          type: "list",
          items: {
              type: "map",
              properties: {
                  val2: {
                      type: "number",
                      required: true
                  },
                  val3: {
                      type: "list",
                      items: {
                          type: "string",
                          required: true
                      },
                      required: true
                  },
                  val4: {
                      type: "set",
                      items: "number",
                      required: true
                  }
              }
          },
          required: true
      },
      attr5: {
          type: "set",
          items: "string",
          required: true
      },
      attr6: {
          type: "set",
          items: "string",
          required: true
      }
  },
  indexes: {
      record: {
          collection: "mops",
          pk: {
              field: "pk",
              composite: ["prop1"]
          },
          sk: {
              field: "sk",
              composite: ["prop2"]
          }
      }
  }
});

const entityWithComplexShapesRequiredOnEdge = new MockEntity({
  model: {
      entity: "entity",
      service: "service",
      version: "1"
  },
  attributes: {
      prop1: {
          type: "string",
          label: "props"
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
                  validate: /./gi
              }
          }
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
                          required: true
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
                              required: true
                          }
                      }
                  }
              }
          },
      },
      attrz5: {
          type: "set",
          items: "string",
      },
      attrz6: {
          type: "set",
          items: "string",
      }
  },
  indexes: {
      record: {
          collection: "mops",
          pk: {
              field: "pk",
              composite: ["prop1"]
          },
          sk: {
              field: "sk",
              composite: ["prop2"]
          }
      }
  }
});

const entityWithComplexShapesRequiredOnEdgeWithDefault = new MockEntity({
  model: {
      entity: "entity",
      service: "service",
      version: "1"
  },
  attributes: {
      prop1: {
          type: "string",
          label: "props"
      },
      prop2: {
          type: "string",
          default: '42',
      },
      attrz3: {
          type: "map",
          properties: {
              val1: {
                  type: "string",
                  required: true,
                  validate: /./gi
              }
          }
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
                          required: true
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
                              default: '42'
                          }
                      },
                  },
                  val6: {
                    type: 'boolean'
                  }
              }
          },
      },
      attrz5: {
          type: "set",
          items: "string",
      },
      attrz6: {
          type: "set",
          items: "string",
      }
  },
  indexes: {
      record: {
          collection: "mops",
          pk: {
              field: "pk",
              composite: ["prop1"]
          },
          sk: {
              field: "sk",
              composite: ["prop2"]
          }
      }
  }
});

const deepMap = new MockEntity({
  model: {
    entity: "deepmap",
    service: "versioncontrol",
    version: "1"
  },
  attributes: {
    prop1: {
      type: 'string'
    },
    prop2: {
      type: 'map',
      properties: {
        prop3: {
          type: 'map',
          properties: {
            prop4: {
              type: 'map',
              properties: {
                type5: {
                  type: 'string'
                }
              }
            }
          }
        }
      }
    }
  },
  indexes: {
    record: {
      pk: {
        field: 'pk',
        composite: ['prop1']
      }
    }
  }
})

const complex = new MockEntity({
  model: {
      entity: "user",
      service: "versioncontrol",
      version: "1"
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
          }
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
          }
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
          }
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
          }
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
          }
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
          }
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
              }
          },
          default: ["abc"],
          validate: (value: string[]) => value !== undefined,
          get: (value: string[]) => {
              return value;
          },
          set: (value?: string[]) => {
              return value;
          }
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
              }
          },
          default: [],
          validate: (value: number[]) => value !== undefined,
          get: (value: number[]) => {
              return value;
          },
          set: (value?: number[]) => {
              return value;
          }
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
                      }
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
                      }
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
                      }
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
                      }
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
              }
          },
          get: (value: any) => {
              return value;
          },
          set: (value: any) => {
              return value;
          }
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
                  }
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
                  }
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
                  }
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
                  }
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
                      }
                  },
                  default: [],
                  validate: (value: string[]) => value !== undefined,
                  get: (value: string[]) => {
                      return value;
                  },
                  set: (value?: string[]) => {
                      return value;
                  }
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
                      }
                  },
                  default: [123, 123],
                  validate: (value: number[]) => value !== undefined,
                  get: (value: number[]) => {
                      return value;
                  },
                  set: (value?: number[]) => {
                      return value;
                  }
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
                              }
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
                              }
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
                              }
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
                              }
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
                              }
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
                              }
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
                      }
                  },
                  default: [],
                  validate: (value: Record<string, any>[]) => value !== undefined,
                  get: (value: Record<string, any>[]) => {
                      return value;
                  },
                  set: (value?: Record<string, any>[]) => {
                      return value;
                  }
              },
          },
          default: () => undefined,
          validate: (value) => value !== undefined,
          get: (value) => {
              return value;
          },
          set: (value) => {
              return value;
          }
      }
  },
  indexes: {
      user: {
          collection: "complexShapes",
          pk: {
              composite: ["username"],
              field: "pk"
          },
          sk: {
              composite: [],
              field: "sk"
          }
      },
      _: {
          collection: "owned",
          index: "gsi1pk-gsi1sk-index",
          pk: {
              composite: ["username"],
              field: "gsi1pk"
          },
          sk: {
              field: "gsi1sk",
              composite: []
          }
      }
  }
});

const mapTests = new MockEntity({
  model: {
      entity: "mapTests",
      service: "tests",
      version: "1"
  },
  attributes: {
      username: {
          type: "string"
      },
      mapObject: {
          type: "map",
          properties: {
              minimal: {
                  type: "string"
              },
              required: {
                  type: "string",
                  required: true
              },
              hidden: {
                  type: "string",
                  hidden: true
              },
              readOnly: {
                  type: "string",
                  readOnly: true
              },
              anotherMap: {
                  type: "map",
                  properties: {
                      minimal: {
                          type: "string"
                      },
                      required: {
                          type: "string",
                          required: true
                      },
                      hidden: {
                          type: "string",
                          hidden: true
                      },
                      readOnly: {
                          type: "string",
                          readOnly: true
                      }
                  }
              }
          }
      }
  },
  indexes: {
      user: {
          collection: "complexShapes",
          pk: {
              composite: ["username"],
              field: "pk"
          },
          sk: {
              composite: [],
              field: "sk"
          }
      }
  }
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
          type: "string"
      }
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
          }
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
          }
      }
  }
});

const readOnlyEntity = new MockEntity({
  model: {
    entity: "readOnlyEntity",
    service: "tests",
    version: "1"
  },
  attributes: {
    prop1: {
      type: 'string',
      readOnly: true,
    },
    prop2: {
      type: 'number',
      readOnly: false,
    },
    prop3: {
      type: 'boolean',
      readOnly: false,
    },
    prop4: {
      type: ['abc'] as const,
      readOnly: true,
    },
    prop5: {
      type: 'map',
      readOnly: true,
      properties: {
        mapProperty: {
          type: 'string'
        }
      }
    },
    prop6: {
      type: 'list',
      readOnly: true,
      items: {
        type: 'string'
      }
    },
    prop7: {
      type: 'set',
      readOnly: true,
      items: 'string'
    },
  },
  indexes: {
    record: {
      collection: "complexShapes",
      pk: {
          composite: ["prop1"],
          field: "pk"
      },
      sk: {
          composite: ["prop2"],
          field: "sk"
      }
    }
  }
});

const diverseTableKeyTypes = new MockEntity({
  model: {
    service: "test",
    entity: "diverseTableKeyTypes",
    version: "1",
  },
  attributes: {
    prop1: {
      type: 'string',
      readOnly: true,
    },
    prop2: {
      type: 'number',
      readOnly: false,
    },
    prop3: {
      type: 'boolean',
      readOnly: false,
    },
    prop4: {
      type: ['abc'] as const,
      readOnly: true,
    },
    prop5: {
      type: 'string',
      readOnly: true,
    },
    prop6: {
      type: 'number',
      readOnly: false,
    },
    prop7: {
      type: 'boolean',
      readOnly: false,
    },
    prop8: {
      type: ['abc'] as const,
      readOnly: true,
    },
  },
  indexes: {
    record: {
      pk: {
        field: 'pk',
        composite: ['prop1', 'prop2', 'prop3', 'prop4']
      },
      sk: {
        field: 'sk',
        composite: ['prop5', 'prop6', 'prop7', 'prop8']
      }
    }
  }
});

// WhereAttributes
expectType<{
  attr1: string; 
  attr2: string; 
  attr3: "123" | "def" | "ghi"; 
  attr4: "abc" | "ghi"; 
  attr5: string; 
  attr6: number; 
  attr7: any; 
  attr8: boolean; 
  attr9: number; 
  attr10: boolean;
}>(entityWithSK.getWhereAttributes())

expectType<{ 
  prop1: string; 
  prop2: string; 
  prop3: { 
    val1: string; 
  }; 
  prop4: { 
    val2: number; 
    val3: string[]; 
    val4: number[]; 
  }[]; 
  prop5: string[]; 
  prop6: string[]; 
}>(entityWithComplexShapes.getWhereAttributes());

// DataUpdateAttributes

expectType<{ 
  attr3: "123" | "def" | "ghi"; 
  attr4: "abc" | "ghi"; 
  attr5: string; 
  attr6: number; 
  attr7: any; 
  attr8: boolean; 
  attr9: number; 
  attr10: boolean; 
}>(entityWithSK.getDataUpdateAttributes())

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
}>(mapTests.getDataUpdateAttributes());

expectType<{ 
  prop3: { 
    val1: string; 
  }; 
  prop4: { 
    val2: number; 
    val3: string[]; 
    val4: number[]; 
  }[]; 
  prop5: string[]; 
  prop6: string[]; 
}>(entityWithComplexShapes.getDataUpdateAttributes());

expectType<{
  prop3: boolean;
}>(readOnlyEntity.getDataUpdateAttributes());

// WhereCallback
entityWithSK.getWhereCallback((a, o) => {
  const attr = magnify(a);
  const op = magnify(o);
  expectType<string>(a.attr1);
  expectType<string>(attr.attr2)
  expectType<"123" | "def" | "ghi">(attr.attr3)
  expectType<"abc" | "ghi">(attr.attr4)
  expectType<string>(attr.attr5)
  expectType<number>(attr.attr6)
  expectType<any>(attr.attr7)
  expectType<boolean>(attr.attr8)
  expectType<number>(attr.attr9)
  expectType<boolean>(attr.attr10)
  expectType<
    'eq'
    | 'ne'
    | 'gt'
    | 'lt'
    | 'gte'
    | 'lte'
    | 'between'
    | 'begins'
    | 'exists'
    | 'notExists'
    | 'contains'
    | 'notContains'
    | 'value'
    | 'name'
  >(keys(op));

  expectType<string>(o.eq(a.attr1, ''));
  expectType<string>(o.ne(a.attr1, ''));
  expectType<string>(o.gt(a.attr1, ''));
  expectType<string>(o.lt(a.attr1, ''));
  expectType<string>(o.gte(a.attr1, ''));
  expectType<string>(o.lte(a.attr1, ''));
  expectType<string>(o.between(a.attr1, '', ''));
  expectType<string>(o.begins(a.attr1, ''));
  expectType<string>(o.exists(a.attr1));
  expectType<string>(o.notExists(a.attr1));
  expectType<string>(o.contains(a.attr1, ''));
  expectType<string>(o.notContains(a.attr1, ''));
  expectType<string>(o.value(a.attr1, ''));
  expectType<string>(o.name(a.attr1));

  expectError(() => o.eq(a.attr1, 1));
  expectError(() => o.ne(a.attr1, 1));
  expectError(() => o.gt(a.attr1, 1));
  expectError(() => o.lt(a.attr1, 1));
  expectError(() => o.gte(a.attr1, 1));
  expectError(() => o.lte(a.attr1, 1));
  expectError(() => o.between(a.attr1, 1, 1));
  expectError(() => o.begins(a.attr1, 1));
  expectError(() => o.exists());
  expectError(() => o.notExists());
  expectError(() => o.contains(a.attr1, 1));
  expectError(() => o.notContains(a.attr1, 1));
  expectError(() => o.value(a.attr1, 1));
  expectError(() => o.name());

  expectError(() => {
    o.between(a.attr1, '')
  });
  
  expectError(() => {
    o.exists(a.attr1, '')
  });
  
  expectError(() => {
    o.notExists(a.attr1, '')
  });

  troubleshoot(() => keys(op), 'gte')
  return '';
});

entityWithComplexShapes.getWhereCallback((a, o) => {
  expectType<string>(a.prop1);
  expectType<string>(a.prop2);
  expectType<{ 
    val1: string; 
  }>(a.prop3);
  expectType<{ 
    val2: number; 
    val3: string[]; 
    val4: number[]; 
  }[]>(a.prop4);
  expectType<string[]>(a.prop5);
  expectType<string[]>(a.prop6);

  expectError(() => o.eq(a.prop4, 1));
  expectError(() => o.ne(a.prop4, 1));
  expectError(() => o.gt(a.prop4, 1));
  expectError(() => o.lt(a.prop4, 1));
  expectError(() => o.gte(a.prop4, 1));
  expectError(() => o.lte(a.prop4, 1));
  expectError(() => o.between(a.prop4, 1, 1));
  expectError(() => o.begins(a.prop4, 1));
  expectError(() => o.contains(a.prop4, 1));
  expectError(() => o.notContains(a.prop4, 1));
  expectError(() => o.value(a.prop4, 1));

  o.eq(a.prop4[0].val2, 1);
  o.ne(a.prop4[0].val2, 1);
  o.gt(a.prop4[0].val2, 1);
  o.lt(a.prop4[0].val2, 1);
  o.gte(a.prop4[0].val2, 1);
  o.lte(a.prop4[0].val2, 1);
  o.between(a.prop4[0].val2, 1, 1);
  o.begins(a.prop4[0].val2, 1);
  o.contains(a.prop4[0].val2, 1);
  o.notContains(a.prop4[0].val2, 1);
  o.value(a.prop4[0].val2, 1);

  return '';
});

// DataUpdateCallback
mapTests.getDataUpdateCallback((a, o) => {
  expectError(() => a.username);
  expectError(() => a.mapObject.readOnly);
});

entityWithSK.getDataUpdateCallback((a, o) => {
  o.add(a.attr6, 5);
  o.subtract(a.attr6, 5);
  o.set(a.attr6, 5);
  o.value(a.attr6, 5);
  o.name(a.attr6);
  o.ifNotExists(a.attr6, 5);

  expectError(() => o.add(a.attr6, "5"));
  expectError(() => o.subtract(a.attr6, "5"));
  expectError(() => o.set(a.attr6, "5"));
  expectError(() => o.value(a.attr6, "5"));
  expectError(() => o.ifNotExists(a.attr6, "5"));
  expectError(() => o.del(a.attr6));
  expectError(() => o.delete(a.attr6));
  expectError(() => o.append(a.attr6));
  expectError(() => o.name());
  expectError(() => o.ifNotExists());
  expectError(() => o.ifNotExists(a.attr6));
  expectError(() => o.value());
  expectError(() => o.value(a.attr6));
});

entityWithComplexShapes.getDataUpdateCallback((a, o) => {
  o.add(a.prop5, ['abc']);
  o.del(a.prop5, ['abc']);
  o.delete(a.prop5, ['abc']);
  o.append(a.prop4, [{
    val2: 5,
    val3: ['abc'],
    val4: [5]
  }]);

  expectError(() => o.add(a.prop5, [4]));
  expectError(() => o.add(a.prop5, 'abc'));
  expectError(() => o.del(a.prop5, [4]));
  expectError(() => o.del(a.prop5, 'abc'));
  expectError(() => o.delete(a.prop5, [4]));
  expectError(() => o.delete(a.prop5, 'abc'));
  expectError(() => {
    o.append(a.prop4, [{ val2: '5', val3: 34, val4: ['5'] }]);
  });
});

