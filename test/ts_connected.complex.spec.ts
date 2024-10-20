process.env.AWS_NODEJS_CONNECTION_REUSE_ENABLED = "1";
import { expect } from "chai";
import { Entity, CustomAttributeType } from "../index";
import DynamoDB from "aws-sdk/clients/dynamodb";
import { v4 as uuid } from "uuid";
const client = new DynamoDB.DocumentClient({
  region: "us-east-1",
  endpoint: process.env.LOCAL_DYNAMO_ENDPOINT,
});

const table = "electro";

interface Helper {
  triggerGetter(...values: any[]): void;
  triggerSetter(...values: any[]): void;
  triggerValidate(...values: any[]): void;
  triggerDefault(...values: any[]): void;
  getHistory(): any[];
}

function getEntity(helper: Helper) {
  return new Entity(
    {
      model: {
        entity: "user",
        service: "versioncontrol",
        version: "1",
      },
      attributes: {
        emptyNestedMap: {
          default: {},
          type: "map",
          properties: {
            nestedMap: {
              default: {},
              type: "map",
              properties: {
                deeplyNestedMap: {
                  default: {},
                  type: "map",
                  properties: {
                    deeplyNestedString: {
                      type: "string",
                    },
                  },
                },
              },
            },
          },
        },
        stringVal: {
          type: "string",
          default: () => "abc",
          validate: (value) => {
            helper.triggerValidate(value);
            return true;
          },
          get: (value) => {
            helper.triggerGetter("stringVal", value);
            return value;
          },
          set: (value) => {
            helper.triggerSetter("stringVal", value);
            return value;
          },
        },
        stringVal2: {
          type: "string",
          default: () => "abc",
          validate: (value) => {
            helper.triggerValidate(value);
            return true;
          },
          get: (value) => {
            helper.triggerGetter("stringVal2", value);
            return value;
          },
          set: (value) => {
            helper.triggerSetter("stringVal2", value);
            return value;
          },
        },
        enumVal: {
          type: ["abc", "def"] as const,
          validate: (value: "abc" | "def") => true,
          default: () => "abc",
          get: (value: "abc" | "def") => {
            helper.triggerGetter("enumVal", value);
            return value;
          },
          set: (value?: "abc" | "def") => {
            helper.triggerSetter("enumVal", value);
            return value;
          },
        },
        numVal: {
          type: "number",
          validate: (value) => {
            helper.triggerValidate(value);
            return true;
          },
          default: () => 123,
          get: (value) => {
            helper.triggerGetter("numVal", value);
            return value;
          },
          set: (value) => {
            helper.triggerSetter("numVal", value);
            return value;
          },
        },
        boolValue: {
          type: "boolean",
          validate: (value) => {
            helper.triggerValidate(value);
            return true;
          },
          default: () => true,
          get: (value) => {
            helper.triggerGetter("boolValue", value);
            return value;
          },
          set: (value) => {
            helper.triggerSetter("boolValue", value);
            return value;
          },
        },
        stringSetAttribute: {
          type: "set",
          items: "string",
          validate: (value) => {
            helper.triggerValidate(value);
            return true;
          },
          get: (value) => {
            helper.triggerGetter("stringSetValue", "items", value);
            return value;
          },
          set: (value) => {
            helper.triggerSetter("stringSetValue", "items", value);
            return value;
          },
        },
        stringListValue: {
          type: "list",
          items: {
            type: "string",
            default: "def",
            validate: (value) => {
              helper.triggerValidate(value);
              return true;
            },
            get: (value) => {
              helper.triggerGetter("stringListValue", "items", value);
              return value;
            },
            set: (value) => {
              helper.triggerSetter("stringListValue", "items", value);
              return value;
            },
          },
          default: () => {
            return [];
          },
          validate: (value: string[]) => true,
          get: (value: string[]) => {
            helper.triggerGetter("stringListValue", value);
            return value;
          },
          set: (value?: string[]) => {
            helper.triggerSetter("stringListValue", value);
            return value;
          },
        },
        numberListValue: {
          type: "list",
          items: {
            type: "number",
            validate: (value) => {
              helper.triggerValidate(value);
              return true;
            },
            default: 0,
            get: (value) => {
              helper.triggerGetter("numberListValue", value);
              return value;
            },
            set: (value) => {
              helper.triggerSetter(value);
              return value;
            },
          },
          default: [],
          validate: (value: number[]) => true,
          get: (value: number[]) => {
            helper.triggerGetter("numberListValue", value);
            return value;
          },
          set: (value?: number[]) => {
            helper.triggerSetter("numberListValue", value);
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
                validate: (value) => {
                  helper.triggerValidate(value);
                  return true;
                },
                get: (value) => {
                  helper.triggerGetter("stringVal", value);
                  return value;
                },
                set: (value) => {
                  helper.triggerSetter("stringVal", value);
                  return value;
                },
              },
              numVal: {
                type: "number",
                default: 5,
                validate: (value) => {
                  helper.triggerValidate(value);
                  return true;
                },
                get: (value) => {
                  helper.triggerGetter("numVal", value);
                  return value;
                },
                set: (value) => {
                  helper.triggerSetter("numVal", value);
                  return value;
                },
              },
              boolValue: {
                type: "boolean",
                default: false,
                validate: (value) => {
                  helper.triggerValidate(value);
                  return true;
                },
                get: (value) => {
                  helper.triggerGetter("boolValue", value);
                  return value;
                },
                set: (value) => {
                  helper.triggerSetter("boolValue", value);
                  return value;
                },
              },
              enumVal: {
                type: ["abc", "def"] as const,
                validate: (value: "abc" | "def") => true,
                default: () => "abc",
                get: (value: "abc" | "def") => {
                  helper.triggerGetter("enumVal", value);
                  return value;
                },
                set: (value?: "abc" | "def") => {
                  helper.triggerSetter("enumVal", value);
                  return value;
                },
              },
            },
            validate: (value) => {
              helper.triggerValidate(value);
              return true;
            },
            default: {
              numVal: 123,
              boolValue: false,
            },
            get: (value) => {
              helper.triggerGetter("mapListValue", "map", value);
              return value;
            },
            set: (value) => {
              helper.triggerSetter("mapListValue", "map", value);
              return value;
            },
          },
          get: (value: any) => {
            helper.triggerGetter("mapListValue", value);
            return value;
          },
          set: (value: any) => {
            helper.triggerSetter("mapListValue", value);
            return value;
          },
        },
        mapValue: {
          type: "map",
          properties: {
            stringVal: {
              type: "string",
              default: () => "abc",
              validate: (value) => {
                helper.triggerValidate(value);
                return true;
              },
              get: (value) => {
                helper.triggerGetter("stringVal", value);
                return value;
              },
              set: (value) => {
                helper.triggerSetter("stringVal", value);
                return value;
              },
            },
            numVal: {
              type: "number",
              default: () => 10,
              validate: (value) => {
                helper.triggerValidate(value);
                return true;
              },
              get: (value) => {
                helper.triggerGetter("numVal", value);
                return value;
              },
              set: (value) => {
                helper.triggerSetter("numVal", value);
                return value;
              },
            },
            boolValue: {
              type: "boolean",
              default: () => false,
              validate: (value) => {
                helper.triggerValidate(value);
                return true;
              },
              get: (value) => {
                helper.triggerGetter("boolValue", value);
                return value;
              },
              set: (value) => {
                helper.triggerSetter("boolValue", value);
                return value;
              },
            },
            enumVal: {
              type: ["abc", "def"] as const,
              validate: (value: "abc" | "def") => true,
              default: () => "abc",
              get: (value: "abc" | "def") => {
                helper.triggerGetter("enumVal", value);
                return value;
              },
              set: (value?: "abc" | "def") => {
                helper.triggerSetter("enumVal", value);
                return value;
              },
            },
            stringListValue: {
              type: "list",
              items: {
                type: "string",
                default: "abc",
                validate: (value) => {
                  helper.triggerValidate(value);
                  return true;
                },
                get: (value) => {
                  helper.triggerGetter("stringListValue", "string", value);
                  return value;
                },
                set: (value) => {
                  helper.triggerSetter("stringListValue", "string", value);
                  return value;
                },
              },
              default: ["xyz"],
              validate: (value: string[]) => true,
              get: (value: string[]) => {
                helper.triggerGetter("stringListValue", value);
                return value;
              },
              set: (value?: string[]) => {
                helper.triggerSetter("stringListValue", value);
                return value;
              },
            },
            numberListValue: {
              type: "list",
              items: {
                type: "number",
                default: () => 100,
                validate: (value) => {
                  helper.triggerValidate(value);
                  return true;
                },
                get: (value) => {
                  helper.triggerGetter("numberListValue", "items", value);
                  return value;
                },
                set: (value) => {
                  helper.triggerSetter("numberListValue", "items", value);
                  return value;
                },
              },
              default: [123, 123],
              validate: (value: number[]) => true,
              get: (value: number[]) => {
                helper.triggerGetter("mapValue", value);
                return value;
              },
              set: (value?: number[]) => {
                helper.triggerSetter("mapValue", value);
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
                    validate: (value) => {
                      helper.triggerValidate(value);
                      return true;
                    },
                    get: (value) => {
                      helper.triggerGetter("stringVal", value);
                      return value;
                    },
                    set: (value) => {
                      helper.triggerSetter("stringVal", value);
                      return value;
                    },
                  },
                  numVal: {
                    type: "number",
                    default: 100,
                    validate: (value) => {
                      helper.triggerValidate(value);
                      return true;
                    },
                    get: (value) => {
                      helper.triggerGetter("numVal", value);
                      return value;
                    },
                    set: (value) => {
                      helper.triggerSetter("numVal", value);
                      return value;
                    },
                  },
                  boolValue: {
                    type: "boolean",
                    default: () => false,
                    validate: (value) => {
                      helper.triggerValidate(value);
                      return true;
                    },
                    get: (value) => {
                      helper.triggerGetter("boolValue", value);
                      return value;
                    },
                    set: (value) => {
                      helper.triggerSetter("boolValue", value);
                      return value;
                    },
                  },
                  enumVal: {
                    type: ["abc", "def"] as const,
                    validate: (value: "abc" | "def") => true,
                    default: () => "abc",
                    get: (value: "abc" | "def") => {
                      helper.triggerGetter("enumVal", value);
                      return value;
                    },
                    set: (value?: "abc" | "def") => {
                      helper.triggerSetter("enumVal", value);
                      return value;
                    },
                  },
                },
                default: {},
                validate: (value) => {
                  helper.triggerValidate(value);
                  return true;
                },
                get: (value) => {
                  helper.triggerGetter("map", "mapListValue", "map", value);
                  return value;
                },
                set: (value) => {
                  helper.triggerSetter("map", "mapListValue", "map", value);
                  return value;
                },
              },
              default: [{ stringVal: "xyz" }, {}],
              validate: (value: Record<string, any>[]) => true,
              get: (value: Record<string, any>[]) => {
                helper.triggerGetter("map", "mapListValue", value);
                return value;
              },
              set: (value?: Record<string, any>[]) => {
                helper.triggerSetter("map", "mapListValue", value);
                return value;
              },
            },
          },
          default: {},
          validate: (value) => {
            helper.triggerValidate(value);
            return true;
          },
          get: (value) => {
            helper.triggerGetter("map", value);
            return value;
          },
          set: (value) => {
            helper.triggerSetter("map", value);
            return value;
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
    },
    { table, client },
  );
}

class EntityHelper implements Helper {
  private store: any[] = [];

  triggerSetter(...values: any[]) {
    this.store.push({ trigger: "setter", values });
  }

  triggerGetter(...values: any[]) {
    this.store.push({ trigger: "getter", values });
  }

  triggerValidate(...values: any) {
    this.store.push({ trigger: "validate", values });
  }

  triggerDefault(...values: any) {
    this.store.push({ trigger: "default", values });
  }

  getHistory() {
    return this.store;
  }
}

describe("Simple Crud On Complex Entity", () => {
  it("should add and retrieve a record as specified", async () => {
    const helper = new EntityHelper();
    const entity = getEntity(helper);
    const stringVal = uuid();
    const stringVal2 = uuid();
    const data = {
      stringVal,
      stringVal2,
      boolValue: true,
      enumVal: "abc" as const,
      stringSetAttribute: ["abc"],
      numberSetAttribute: [123, 456],
      mapListValue: [
        {
          boolValue: true,
          numVal: 123,
          stringVal: "abc",
          enumVal: "abc" as const,
        },
      ],
      mapValue: {
        boolValue: false,
        mapListValue: [
          {
            boolValue: true,
            numVal: 456,
            stringVal: "def",
            enumVal: "def" as const,
          },
        ],
        numberListValue: [1234, 567],
        numVal: 364,
        stringListValue: ["item1", "item2", "item2"],
        stringVal: "mystring",
        enumVal: "def" as const,
      },
      numberListValue: [1234, 56742],
      numVal: 246446,
      stringListValue: ["losst1", "liost2"],
    };
    const putItem = await entity.put(data).go();
    const item = await entity.get({ stringVal, stringVal2 }).go();
    expect(item).to.deep.equal(putItem);
  });

  it("should apply all defaults", async () => {
    const helper = new EntityHelper();
    const entity = getEntity(helper);
    const created = await entity
      .put({})
      .go()
      .then((res) => res.data);
    expect(created).to.deep.equal({
      emptyNestedMap: {
        nestedMap: {
          deeplyNestedMap: {},
        },
      },
      stringVal: "abc",
      stringVal2: "abc",
      enumVal: "abc",
      numVal: 123,
      boolValue: true,
      numberListValue: [],
      stringListValue: [],
      mapValue: {
        boolValue: false,
        enumVal: "abc",
        mapListValue: [
          {
            boolValue: false,
            enumVal: "abc",
            numVal: 100,
            stringVal: "xyz",
          },
          {
            boolValue: false,
            enumVal: "abc",
            numVal: 100,
            stringVal: "def",
          },
        ],
        numVal: 10,
        numberListValue: [123, 123],
        stringListValue: ["xyz"],
        stringVal: "abc",
      },
    });
  });

  it("should apply defaults only to a list and not the items in a list if a list is not supplied", async () => {
    const stringVal = uuid();
    const stringVal2 = uuid();
    const entity = new Entity(
      {
        model: {
          entity: "user",
          service: "versioncontrol",
          version: "1",
        },
        attributes: {
          stringVal: {
            type: "string",
            default: () => stringVal,
          },
          stringVal2: {
            type: "string",
            default: () => stringVal2,
          },
          mapListValue: {
            type: "list",
            items: {
              type: "map",
              properties: {
                stringVal: {
                  type: "string",
                  default: "def",
                  validate: (value) => {
                    return true;
                  },
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
                  validate: (value) => {
                    return true;
                  },
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
                  validate: (value) => {
                    return true;
                  },
                  get: (value) => {
                    return value;
                  },
                  set: (value) => {
                    return value;
                  },
                },
                enumVal: {
                  type: ["abc", "def"] as const,
                  validate: (value: "abc" | "def") => true,
                  default: () => "abc",
                  get: (value: "abc" | "def") => {
                    return value;
                  },
                  set: (value?: "abc" | "def") => {
                    return value;
                  },
                },
              },
              validate: (value) => {
                return true;
              },
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
      },
      { table, client },
    );
    const created = await entity
      .put({})
      .go()
      .then((res) => res.data);
    expect(created).to.deep.equal({ stringVal, stringVal2 });
  });

  it("show allow for empty lists to be added by the user", async () => {
    const entity = new Entity(
      {
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
          list: {
            type: "list",
            items: {
              type: "string",
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
      },
      { table, client },
    );
    const stringVal = uuid();
    const stringVal2 = uuid();
    const params = entity.put({ stringVal, stringVal2, list: [] }).params();
    expect(params).to.deep.equal({
      Item: {
        stringVal,
        stringVal2,
        list: [],
        pk: `$versioncontrol#stringval_${stringVal}`,
        sk: `$overview#user_1#stringval2_${stringVal2}`,
        __edb_e__: "user",
        __edb_v__: "1",
      },
      TableName: "electro",
    });
    const putItem = await entity
      .put({ stringVal, stringVal2, list: [] })
      .go()
      .then((res) => res.data);
    const getItem = await entity
      .get({ stringVal, stringVal2 })
      .go()
      .then((res) => res.data);
    expect(putItem).to.deep.equal(getItem);
    expect(putItem).to.deep.equal({ stringVal, stringVal2, list: [] });
  });

  it("show allow for empty lists to be added via default", async () => {
    const entity = new Entity(
      {
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
          list: {
            type: "list",
            items: {
              type: "string",
            },
            default: [],
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
      },
      { table, client },
    );
    const stringVal = uuid();
    const stringVal2 = uuid();
    const params = entity.put({ stringVal, stringVal2, list: [] }).params();
    expect(params).to.deep.equal({
      Item: {
        stringVal,
        stringVal2,
        list: [],
        pk: `$versioncontrol#stringval_${stringVal}`,
        sk: `$overview#user_1#stringval2_${stringVal2}`,
        __edb_e__: "user",
        __edb_v__: "1",
      },
      TableName: "electro",
    });
    const putItem = await entity
      .put({ stringVal, stringVal2 })
      .go()
      .then((res) => res.data);
    const getItem = await entity
      .get({ stringVal, stringVal2 })
      .go()
      .then((res) => res.data);
    expect(putItem).to.deep.equal(getItem);
    expect(putItem).to.deep.equal({ stringVal, stringVal2, list: [] });
  });

  it("show allow for empty lists to be added via setter", async () => {
    const entity = new Entity(
      {
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
          list: {
            type: "list",
            items: {
              type: "string",
            },
            set: (value?: string[]) => {
              if (value) {
                return value;
              } else {
                return [];
              }
            },
          },
          otherString: {
            type: "string",
            set: (value) => {
              return value;
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
      },
      { table, client },
    );
    const stringVal = uuid();
    const stringVal2 = uuid();
    const params = entity.put({ stringVal, stringVal2 }).params();
    expect(params).to.deep.equal({
      Item: {
        stringVal,
        stringVal2,
        list: [],
        pk: `$versioncontrol#stringval_${stringVal}`,
        sk: `$overview#user_1#stringval2_${stringVal2}`,
        __edb_e__: "user",
        __edb_v__: "1",
      },
      TableName: "electro",
    });
    const putItem = await entity
      .put({ stringVal, stringVal2 })
      .go()
      .then((res) => res.data);
    const getItem = await entity
      .get({ stringVal, stringVal2 })
      .go()
      .then((res) => res.data);
    expect(putItem).to.deep.equal(getItem);
    expect(putItem).to.deep.equal({ stringVal, stringVal2, list: [] });
  });

  it("show allow for empty maps to be added by the user", async () => {
    const entity = new Entity(
      {
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
      },
      { table, client },
    );
    const stringVal = uuid();
    const stringVal2 = uuid();
    const params = entity.put({ stringVal, stringVal2, map: {} }).params();
    expect(params).to.deep.equal({
      Item: {
        stringVal,
        stringVal2,
        map: {},
        pk: `$versioncontrol#stringval_${stringVal}`,
        sk: `$overview#user_1#stringval2_${stringVal2}`,
        __edb_e__: "user",
        __edb_v__: "1",
      },
      TableName: "electro",
    });
    const putItem = await entity
      .put({ stringVal, stringVal2, map: {} })
      .go()
      .then((res) => res.data);
    const getItem = await entity
      .get({ stringVal, stringVal2 })
      .go()
      .then((res) => res.data);
    expect(putItem).to.deep.equal(getItem);
    expect(putItem).to.deep.equal({ stringVal, stringVal2, map: {} });
  });

  it("show allow for empty required maps to be added by the user", async () => {
    const entity = new Entity(
      {
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
      },
      { table, client },
    );
    const stringVal = uuid();
    const stringVal2 = uuid();
    const params = entity.put({ stringVal, stringVal2, map: {} }).params();
    expect(params).to.deep.equal({
      Item: {
        stringVal,
        stringVal2,
        map: {},
        pk: `$versioncontrol#stringval_${stringVal}`,
        sk: `$overview#user_1#stringval2_${stringVal2}`,
        __edb_e__: "user",
        __edb_v__: "1",
      },
      TableName: "electro",
    });
    const putItem = await entity
      .put({
        stringVal,
        stringVal2,
        map: {},
      })
      .go()
      .then((res) => res.data);
    const getItem = await entity
      .get({ stringVal, stringVal2 })
      .go()
      .then((res) => res.data);
    expect(putItem).to.deep.equal(getItem);
    expect(putItem).to.deep.equal({ stringVal, stringVal2, map: {} });
  });

  it("show allow for empty maps to be added via default", async () => {
    const entity = new Entity(
      {
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
            properties: {
              test: {
                type: "string",
              },
            },
            default: {},
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
      },
      { table, client },
    );
    const stringVal = uuid();
    const stringVal2 = uuid();
    const params = entity.put({ stringVal, stringVal2 }).params();
    expect(params).to.deep.equal({
      Item: {
        stringVal,
        stringVal2,
        map: {},
        pk: `$versioncontrol#stringval_${stringVal}`,
        sk: `$overview#user_1#stringval2_${stringVal2}`,
        __edb_e__: "user",
        __edb_v__: "1",
      },
      TableName: "electro",
    });
    const putItem = await entity
      .put({ stringVal, stringVal2 })
      .go()
      .then((res) => res.data);
    const getItem = await entity
      .get({ stringVal, stringVal2 })
      .go()
      .then((res) => res.data);
    expect(putItem).to.deep.equal(getItem);
    expect(putItem).to.deep.equal({ stringVal, stringVal2, map: {} });
  });

  it("show allow for empty maps to be added via set", async () => {
    const entity = new Entity(
      {
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
            properties: {
              test: {
                type: "string",
              },
            },
            set: (value) => {
              if (value) {
                return value;
              } else {
                return {};
              }
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
      },
      { table, client },
    );
    const stringVal = uuid();
    const stringVal2 = uuid();
    const params = entity.put({ stringVal, stringVal2 }).params();
    expect(params).to.deep.equal({
      Item: {
        stringVal,
        stringVal2,
        map: {},
        pk: `$versioncontrol#stringval_${stringVal}`,
        sk: `$overview#user_1#stringval2_${stringVal2}`,
        __edb_e__: "user",
        __edb_v__: "1",
      },
      TableName: "electro",
    });
    const putItem = await entity
      .put({ stringVal, stringVal2 })
      .go()
      .then((res) => res.data);
    const getItem = await entity
      .get({ stringVal, stringVal2 })
      .go()
      .then((res) => res.data);
    expect(putItem).to.deep.equal(getItem);
    expect(putItem).to.deep.equal({ stringVal, stringVal2, map: {} });
  });

  it("should apply readOnly constraints to nested attributes", () => {
    const entity = new Entity(
      {
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
            properties: {
              test: {
                type: "string",
                readOnly: true,
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
      },
      { table, client },
    );
    const stringVal = uuid();
    const stringVal2 = uuid();
    expect(() => {
      try {
        entity
          .update({ stringVal, stringVal2 })
          // @ts-ignore
          .set({ "map.test": "abc" })
          .params();
      } catch (err) {
        throw err;
      }
    }).to.throw(`Attribute "map.test" is Read-Only and cannot be updated`);
    expect(() => {
      try {
        entity
          .update({ stringVal, stringVal2 })
          .data((attr, op) =>
            // @ts-ignore
            op.set(attr.map.test, "abc"),
          )
          .params();
      } catch (err) {
        throw err;
      }
    }).to.throw(`Attribute "map.test" is Read-Only and cannot be updated`);
  });

  it("should apply readOnly constraints to nested attributes under a list", () => {
    const entity = new Entity(
      {
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
          list: {
            type: "list",
            items: {
              type: "map",
              properties: {
                test: {
                  type: "string",
                  readOnly: true,
                },
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
      },
      { table, client },
    );
    const stringVal = uuid();
    const stringVal2 = uuid();
    expect(() => {
      try {
        entity
          .update({ stringVal, stringVal2 })
          // @ts-ignore
          .set({ "list[3].test": "def" })
          .params();
      } catch (err) {
        throw err;
      }
    }).to.throw(`Attribute "list[*].test" is Read-Only and cannot be updated`);
    expect(() => {
      try {
        entity
          .update({ stringVal, stringVal2 })

          .data((attr, op) =>
            // @ts-ignore
            op.set(attr.list[3].test, "def"),
          )
          .params();
      } catch (err) {
        throw err;
      }
    }).to.throw(`Attribute "list[*].test" is Read-Only and cannot be updated`);
  });

  it("should apply not null style removal constraints to required nested attributes", () => {
    const entity = new Entity(
      {
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
            properties: {
              test: {
                type: "string",
                required: true,
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
      },
      { table, client },
    );
    const stringVal = uuid();
    const stringVal2 = uuid();
    expect(() =>
      entity
        .update({ stringVal, stringVal2 })
        // @ts-ignore
        .remove(["map.test"])
        .params(),
    ).to.throw(`Attribute "map.test" is Required and cannot be removed`);
    expect(() =>
      entity
        .update({ stringVal, stringVal2 })
        .data((attr, op) => op.remove(attr.map.test))
        .params(),
    ).to.throw(`Attribute "map.test" is Required and cannot be removed`);
  });

  it("should apply not null style removal constraints to required nested attributes under a list", () => {
    const entity = new Entity(
      {
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
          list: {
            type: "list",
            items: {
              type: "map",
              properties: {
                test: {
                  type: "string",
                  required: true,
                },
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
      },
      { table, client },
    );
    const stringVal = uuid();
    const stringVal2 = uuid();
    expect(() => {
      try {
        entity
          .update({ stringVal, stringVal2 })
          // @ts-ignore
          .remove(["list[3].test"])
          .params();
      } catch (err) {
        throw err;
      }
    }).to.throw(`Attribute "list[*].test" is Required and cannot be removed`);
    expect(() => {
      try {
        entity
          .update({ stringVal, stringVal2 })
          // @ts-ignore
          .data((attr, op) => op.remove(attr.list[3].test))
          .params();
      } catch (err) {
        throw err;
      }
    }).to.throw(`Attribute "list[*].test" is Required and cannot be removed`);
  });

  it("should be able to create DynamoDB compatible Set objects without the client", async () => {
    const entity = new Entity(
      {
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
          stringSet: {
            type: "set",
            items: "string",
          },
          numberSet: {
            type: "set",
            items: "number",
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
      },
      { table },
    );
    const stringVal = uuid();
    const stringVal2 = uuid();
    const putParams: any = entity
      .put({
        stringVal,
        stringVal2,
        numberSet: [123, 456, 789],
        stringSet: ["abc", "def", "ghi"],
      })
      .params();
    expect(putParams.Item.stringSet.values).to.deep.equal([
      "abc",
      "def",
      "ghi",
    ]);
    expect(putParams.Item.stringSet.wrapperName).to.equal("Set");
    expect(putParams.Item.stringSet.type).to.equal("String");
    expect(putParams.Item.numberSet.values).to.deep.equal([123, 456, 789]);
    expect(putParams.Item.numberSet.wrapperName).to.equal("Set");
    expect(putParams.Item.numberSet.type).to.equal("Number");
    expect(JSON.parse(JSON.stringify(putParams))).to.deep.equal({
      Item: {
        stringVal,
        stringVal2,
        stringSet: ["abc", "def", "ghi"],
        numberSet: [123, 456, 789],
        pk: `$versioncontrol#stringval_${stringVal}`,
        sk: `$overview#user_1#stringval2_${stringVal2}`,
        __edb_e__: "user",
        __edb_v__: "1",
      },
      TableName: "electro",
    });
    await client.put(putParams).promise();
    const getParams: any = entity
      .get({
        stringVal,
        stringVal2,
      })
      .params();
    const results: any = await client.get(getParams).promise();
    expect(results.Item.stringSet.values).to.deep.equal(["abc", "def", "ghi"]);
    expect(results.Item.stringSet.wrapperName).to.equal("Set");
    expect(results.Item.stringSet.type).to.equal("String");
    expect(results.Item.numberSet.values.sort()).to.deep.equal(
      [123, 456, 789].sort(),
    );
    expect(results.Item.numberSet.wrapperName).to.equal("Set");
    expect(results.Item.numberSet.type).to.equal("Number");
    expect(JSON.parse(JSON.stringify(results))).to.deep.equal({
      Item: {
        stringVal,
        stringVal2,
        pk: `$versioncontrol#stringval_${stringVal}`,
        sk: `$overview#user_1#stringval2_${stringVal2}`,
        stringSet: ["abc", "def", "ghi"],
        numberSet: [123, 456, 789],
        __edb_e__: "user",
        __edb_v__: "1",
      },
    });
  });

  it("should apply field names when saving the record to the database", async () => {
    const entity = new Entity(
      {
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
          stringSet: {
            type: "set",
            items: "string",
            field: "ss1",
          },
          numberSet: {
            type: "set",
            items: "number",
            field: "ns1",
          },
          mapVal: {
            type: "map",
            properties: {
              nestedList1: {
                type: "list",
                items: {
                  type: "string",
                },
                field: "nl1",
              },
              nestedStringVal1: {
                type: "string",
                field: "nsv1",
              },
              nestedNumberVal1: {
                type: "number",
                field: "nnv1",
              },
              nestedStringSetVal1: {
                type: "set",
                items: "string",
                field: "nssv1",
              },
            },
            field: "mv1",
          },
          listVal: {
            type: "list",
            items: {
              type: "map",
              properties: {
                nestedList2: {
                  type: "list",
                  items: {
                    type: "string",
                  },
                  field: "nl2",
                },
                nestedStringVal2: {
                  type: "string",
                  field: "nsv2",
                },
                nestedNumberVal2: {
                  type: "number",
                  field: "nnv2",
                },
                nestedStringSetVal2: {
                  type: "set",
                  items: "string",
                  field: "nssv2",
                },
              },
            },
            field: "lv1",
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
      },
      { table, client },
    );
    const stringVal = uuid();
    const stringVal2 = uuid();
    const item = {
      stringVal,
      stringVal2,
      numberSet: [123, 456, 789],
      stringSet: ["abc", "def", "ghi"],
      mapVal: {
        nestedNumberVal1: 123,
        nestedStringVal1: "def",
        nestedList1: ["ghi"],
        nestedStringSetVal1: ["xyz"],
      },
      listVal: [
        {
          nestedList2: ["wxyz"],
          nestedNumberVal2: 98014,
          nestedStringSetVal2: ["item1", "item2"],
          nestedStringVal2: "def",
        },
      ],
    };

    const putParams: any = entity.put(item).params();
    expect(JSON.parse(JSON.stringify(putParams))).to.deep.equal({
      Item: {
        stringVal: stringVal,
        stringVal2: stringVal2,
        ss1: ["abc", "def", "ghi"],
        ns1: [123, 456, 789],
        mv1: {
          nl1: ["ghi"],
          nsv1: "def",
          nnv1: 123,
          nssv1: ["xyz"],
        },
        lv1: [
          {
            nl2: ["wxyz"],
            nsv2: "def",
            nnv2: 98014,
            nssv2: ["item1", "item2"],
          },
        ],
        pk: `$versioncontrol#stringval_${stringVal}`,
        sk: `$overview#user_1#stringval2_${stringVal2}`,
        __edb_e__: "user",
        __edb_v__: "1",
      },
      TableName: "electro",
    });

    const putRecord = await entity
      .put(item)
      .go()
      .then((res) => res.data);
    const getRecord = await entity
      .get(item)
      .go()
      .then((res) => res.data);
    expect(JSON.parse(JSON.stringify(putRecord))).to.deep.equal(item);
    expect(JSON.parse(JSON.stringify(getRecord))).to.deep.equal(item);
  });

  it("should validate the type of a complex/nested attribute", () => {
    const entity = new Entity(
      {
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
          stringSet: {
            type: "set",
            items: "string",
            field: "ss1",
          },
          numberSet: {
            type: "set",
            items: "number",
            field: "ns1",
          },
          mapVal: {
            type: "map",
            properties: {
              nestedList1: {
                type: "list",
                items: {
                  type: "string",
                },
                field: "nl1",
              },
              nestedStringVal1: {
                type: "string",
                field: "nsv1",
              },
              nestedNumberVal1: {
                type: "number",
                field: "nnv1",
              },
              nestedStringSetVal1: {
                type: "set",
                items: "string",
                field: "nssv1",
              },
            },
            field: "mv1",
          },
          listVal: {
            type: "list",
            items: {
              type: "map",
              properties: {
                nestedList2: {
                  type: "list",
                  items: {
                    type: "string",
                  },
                  field: "nl2",
                },
                nestedStringVal2: {
                  type: "string",
                  field: "nsv2",
                },
                nestedNumberVal2: {
                  type: "number",
                  field: "nnv2",
                },
                nestedStringSetVal2: {
                  type: "set",
                  items: "string",
                  field: "nssv2",
                },
              },
            },
            field: "lv1",
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
      },
      { table },
    );

    const tests: { input: any; error: string; t: number }[] = [
      {
        input: {
          stringSet: [3456],
        },
        error:
          'Invalid value type at entity path: "stringSet[*]". Received value of type "number", expected value of type "string" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#invalid-attribute',
        t: 1,
      },
      {
        input: {
          numberSet: ["123"],
        },
        error:
          'Invalid value type at entity path: "numberSet[*]". Received value of type "string", expected value of type "number" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#invalid-attribute',
        t: 2,
      },
      {
        input: {
          numberSet: {},
        },
        error:
          'Invalid attribute value supplied to "set" attribute "numberSet". Received value of type "object". Set values must be supplied as either Arrays, native JavaScript Set objects, DocumentClient Set objects, strings, or numbers. - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#invalid-attribute',
        t: 3,
      },
      {
        input: {
          mapVal: {
            nestedList1: {},
          },
        },
        error:
          'Invalid value type at entity path "mapVal.nestedList1. Received value of type "object", expected value of type "array" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#invalid-attribute',
        t: 4,
      },
      {
        input: {
          mapVal: {
            nestedList1: "abc",
          },
        },
        error:
          'Invalid value type at entity path "mapVal.nestedList1. Received value of type "string", expected value of type "array" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#invalid-attribute',
        t: 5,
      },
      {
        input: {
          mapVal: {
            nestedStringVal1: 234,
          },
        },
        error:
          'Invalid value type at entity path: "mapVal.nestedStringVal1". Received value of type "number", expected value of type "string" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#invalid-attribute',
        t: 6,
      },
      {
        input: {
          mapVal: {
            nestedNumberVal1: "234",
          },
        },
        error:
          'Invalid value type at entity path: "mapVal.nestedNumberVal1". Received value of type "string", expected value of type "number" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#invalid-attribute',
        t: 7,
      },
      {
        input: {
          mapVal: {
            nestedStringSetVal1: {},
          },
        },
        error:
          'Invalid attribute value supplied to "set" attribute "mapVal.nestedStringSetVal1". Received value of type "object". Set values must be supplied as either Arrays, native JavaScript Set objects, DocumentClient Set objects, strings, or numbers. - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#invalid-attribute',
        t: 8,
      },
      {
        input: {
          mapVal: {
            nestedStringSetVal1: [123, 456],
          },
        },
        error:
          'Invalid value type at entity path: "mapVal.nestedStringSetVal1[*]". Received value of type "number", expected value of type "string", Invalid value type at entity path: "mapVal.nestedStringSetVal1[*]". Received value of type "number", expected value of type "string" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#invalid-attribute',
        t: 9,
      },
      {
        input: {
          listVal: ["def"],
        },
        error: `Invalid value type at entity path: "listVal[*]". Expected value to be an object to fulfill attribute type "map" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#invalid-attribute`,
        t: 10,
      },
      {
        input: {
          listVal: [
            {
              nestedList2: "",
            },
          ],
        },
        error:
          'Invalid value type at entity path "listVal[*].nestedList2. Received value of type "string", expected value of type "array" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#invalid-attribute',
        t: 11,
      },
      {
        input: {
          listVal: [
            {
              nestedList2: new Set(),
            },
          ],
        },
        error:
          'Invalid value type at entity path "listVal[*].nestedList2. Received value of type "set", expected value of type "array" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#invalid-attribute',
        t: 12,
      },
      {
        input: {
          listVal: [
            {
              nestedStringVal2: [],
            },
          ],
        },
        error:
          'Invalid value type at entity path: "listVal[*].nestedStringVal2". Received value of type "object", expected value of type "string" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#invalid-attribute',
        t: 13,
      },
      {
        input: {
          listVal: [
            {
              nestedNumberVal2: "def",
            },
          ],
        },
        error:
          'Invalid value type at entity path: "listVal[*].nestedNumberVal2". Received value of type "string", expected value of type "number" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#invalid-attribute',
        t: 14,
      },
      {
        input: {
          listVal: [
            {
              nestedStringSetVal2: [123, 356],
            },
          ],
        },
        error:
          'Invalid value type at entity path: "listVal[*].nestedStringSetVal2[*]". Received value of type "number", expected value of type "string", Invalid value type at entity path: "listVal[*].nestedStringSetVal2[*]". Received value of type "number", expected value of type "string" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#invalid-attribute',
        t: 15,
      },
    ];

    const stringVal = uuid();
    const stringVal2 = uuid();
    const putErrors: string[] = [];
    const updateErrors: string[] = [];
    const invalidErrors: string[] = [];
    const invalid = Symbol();

    for (const t in tests) {
      const test = tests[t];
      try {
        entity.put({ stringVal, stringVal2, ...test.input }).params();
        throw invalid;
      } catch (err: any) {
        if (err === invalid) {
          invalidErrors.push(
            `Expected test #${t} to throw error "${test.error}" when using "put" method.`,
          );
        } else {
          putErrors.push(err.message);
        }
      }
      try {
        entity
          .update({ stringVal, stringVal2 })
          .set({ ...test.input })
          .params();
        throw invalid;
      } catch (err: any) {
        if (err === invalid) {
          invalidErrors.push(
            `Expected test #${t} to throw error "${test.error}" when using "update" method.`,
          );
        } else {
          updateErrors.push(err.message);
        }
      }
    }

    const errors = tests.map((test) => test.error);

    if (invalidErrors.length) {
      console.log(invalidErrors);
    }
    if (errors.length !== putErrors.length) {
      console.log("expected errors", errors);
      console.log("expected put errors", putErrors);
    } else {
      for (let i = 0; i < errors.length; i++) {
        if (errors[i] !== putErrors[i]) {
          console.log("expected", tests[i].t, errors[i]);
          console.log("received", tests[i].t, putErrors[i]);
        }
      }
    }

    expect(invalidErrors).to.be.an("array").with.length(0);
    expect(putErrors).to.deep.equal(updateErrors);
    expect(putErrors).to.have.length(tests.length);
    expect(updateErrors).to.have.length(tests.length);
    expect(putErrors).to.deep.equal(tests.map((test) => test.error));
  });

  describe('nested any and custom attributes', () => {

    it("should allow any values when attribute is typed as any within a map", async () => {
      const entity = new Entity({
        model: {
          service: "any_service",
          entity: uuid(),
          version: "1",
        },
        attributes: {
          prop1: {
            type: "string",
          },
          prop2: {
            type: "map",
            properties: {
              any1: {
                type: "any",
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
            sk: {
              field: "sk",
              composite: [],
            },
          },
        },
      }, { table, client });

      const prop1 = uuid();
      await entity.create({
        prop1,
        prop2: {
          any1: {
            str: 'abc',
            num: 123,
            bool: true,
            list: ['abc', 'def']
          }
        }
      }).go();

      const patched = await entity.patch({prop1})
        .data((attr, op) => {
          op.add(attr.prop2.any1.num, 5);
          op.set(attr.prop2.any1.bool, false);
          op.remove(attr.prop2.any1.list[0]);
          op.set(attr.prop2.any1.str2, op.name(attr.prop2.any1.str));
        })
        .where((attr, op) => `${op.size(attr.prop2.any1.list)} = ${op.escape(2)} AND ${op.eq(attr.prop2.any1.num, 123)}`)
        .go({response: 'all_new'});

      expect(patched.data).to.deep.equal({
        prop1,
        prop2: {
          any1: {
            str: 'abc',
            str2: 'abc',
            num: 128,
            bool: false,
            list: ['def'],
          }
        }
      });
    });

    it("should allow any values when attribute is typed as any within map list", async () => {
      const entity = new Entity({
        model: {
          service: "any_service",
          entity: uuid(),
          version: "1",
        },
        attributes: {
          prop1: {
            type: "string",
          },
          prop2: {
            type: "list",
            items: {
              // @ts-ignore
              type: "any",
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
              composite: [],
            },
          },
        },
      }, { table, client });

      const prop1 = uuid();
      await entity.create({
        prop1,
        prop2: [{
          any1: {
            str: 'abc',
            num: 123,
            bool: true,
            list: ['abc', 'def']
          }
        }]
      }).go();

      const patched = await entity.patch({prop1})
          .data((attr, op) => {
            op.add(attr.prop2[0].any1.num, 5);
            op.set(attr.prop2[0].any1.bool, false);
            op.remove(attr.prop2[0].any1.list[0]);
            op.set(attr.prop2[0].any1.str2, op.name(attr.prop2[0].any1.str));
          })
          .where((attr, op) => `${op.size(attr.prop2[0].any1.list)} = ${op.escape(2)} AND ${op.eq(attr.prop2[0].any1.num, 123)}`)
          .go({response: 'all_new'});

      expect(patched.data).to.deep.equal({
        prop1,
        prop2: [{
          any1: {
            str: 'abc',
            str2: 'abc',
            num: 128,
            bool: false,
            list: ['def'],
          }
        }]
      });
    });

    it("should allow any attributes when attribute is typed as custom within map properties", async () => {
      type CustomAttribute = {
        str: string;
        str2?: string;
        num: number;
        bool: boolean;
        list?: string[];
      }

      const entity = new Entity({
        model: {
          service: "any_service",
          entity: uuid(),
          version: "1",
        },
        attributes: {
          prop1: {
            type: "string",
          },
          prop2: {
            type: "map",
            properties: {
              any1: {
                type: CustomAttributeType<CustomAttribute>('any'),
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
            sk: {
              field: "sk",
              composite: [],
            },
          },
        },
      }, { table, client });

      const prop1 = uuid();
      await entity.create({
        prop1,
        prop2: {
          any1: {
            str: 'abc',
            num: 123,
            bool: true,
            list: ['abc', 'def']
          }
        }
      }).go();

      const patched = await entity.patch({prop1})
          .data((attr, op) => {
            op.add(attr.prop2.any1.num, 5);
            op.set(attr.prop2.any1.bool, false);
            op.remove(attr.prop2.any1.list?.[0]);
            op.set(attr.prop2.any1.str2, op.name(attr.prop2.any1.str));
          })
          .where((attr, op) => `${op.size(attr.prop2.any1.list)} = ${op.escape(2)} AND ${op.eq(attr.prop2.any1.num, 123)}`)
          .go({response: 'all_new'});

      expect(patched.data).to.deep.equal({
        prop1,
        prop2: {
          any1: {
            str: 'abc',
            str2: 'abc',
            num: 128,
            bool: false,
            list: ['def'],
          }
        }
      });
    });

    it("should allow any values when attribute is typed as custom within map list", async () => {
      type CustomAttribute = {
        str: string;
        str2?: string;
        num: number;
        bool: boolean;
        list: string[];
      }

      const entity = new Entity({
        model: {
          service: "any_service",
          entity: uuid(),
          version: "1",
        },
        attributes: {
          prop1: {
            type: "string",
          },
          prop2: {
            type: "list",
            items: {
              type: CustomAttributeType<{ any1: CustomAttribute }>('any')
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
              composite: [],
            },
          },
        },
      },
      { table, client });

      const prop1 = uuid();
      await entity.create({
        prop1,
        prop2: [{
          any1: {
            str: 'abc',
            num: 123,
            bool: true,
            list: ['abc', 'def']
          }
        }]
      }).go();

      const patched = await entity.patch({prop1})
          .data((attr, op) => {
            op.add(attr.prop2[0].any1.num, 5);
            op.set(attr.prop2[0].any1.bool, false);
            op.remove(attr.prop2[0].any1.list[0]);
            op.set(attr.prop2[0].any1.str2, op.name(attr.prop2[0].any1.str));
          })
          .where((attr, op) => `${op.size(attr.prop2[0].any1.list)} = ${op.escape(2)} AND ${op.eq(attr.prop2[0].any1.num, 123)}`)
          .go({response: 'all_new'});

      expect(patched.data).to.deep.equal({
        prop1,
        prop2: [{
          any1: {
            str: 'abc',
            str2: 'abc',
            num: 128,
            bool: false,
            list: ['def'],
          }
        }]
      });
    });

  });
});
