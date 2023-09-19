import { expectType, expectError, expectNotType } from "tsd";
import { Entity } from "..";

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

let entityWithReadOnlyAttributes = new Entity(
  {
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
      },
      prop3ReadOnly: {
        type: "string",
        readOnly: true,
      },
      prop4: {
        type: "number",
      },
      prop4ReadOnly: {
        type: "number",
        readOnly: true,
      },
      prop5: {
        type: "any",
      },
      prop5ReadOnly: {
        type: "any",
        readOnly: true,
      },
      prop6: {
        type: "list",
        items: {
          type: "string",
        },
      },
      prop6ReadOnly: {
        type: "list",
        items: {
          type: "string",
        },
        readOnly: true,
      },
      prop7: {
        type: "set",
        items: "string",
      },
      prop7ReadOnly: {
        type: "set",
        readOnly: true,
        items: "string",
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
  },
  { table: "table" },
);

const entityWithComplexShapes = new Entity({
  model: {
    entity: "entityWithComplexShapes",
    service: "service",
    version: "1",
  },
  attributes: {
    prop1: {
      type: "string",
    },
    prop2: {
      type: "number",
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

    requiredProp1: {
      required: true,
      type: "string",
    },
    requiredProp2: {
      required: true,
      type: "number",
    },
    requiredProp3: {
      required: true,
      type: "map",
      properties: {
        val1: {
          type: "string",
        },
      },
    },
    requiredProp4: {
      required: true,
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
    requiredProp5: {
      required: true,
      type: "set",
      items: "string",
    },

    requiredWithDefaultProp1: {
      default: "default_value",
      required: true,
      type: "string",
    },
    requiredWithDefaultProp2: {
      default: 10,
      required: true,
      type: "number",
    },
    requiredWithDefaultProp3: {
      default: {
        val1: "default_value",
      },
      required: true,
      type: "map",
      properties: {
        val1: {
          type: "string",
        },
      },
    },
    requiredWithDefaultProp4: {
      default: [],
      required: true,
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
    requiredWithDefaultProp5: {
      default: [],
      required: true,
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

const prop1 = "prop1";
const prop2 = 5;
const prop3 = { val1: "val1" };
const prop4 = [
  {
    val2: 2,
    val3: ["val3"],
    val4: [1],
  },
];
const prop5 = ["prop5"];
const requiredProp1 = "prop1";
const requiredProp2 = 5;
const requiredProp3 = { val1: "val1" };
const requiredProp4 = [
  {
    val2: 2,
    val3: ["val3"],
    val4: [1],
  },
];
const requiredProp5 = ["prop5"];
const requiredWithDefaultProp1 = "prop1";
const requiredWithDefaultProp2 = 5;
const requiredWithDefaultProp3 = { val1: "val1" };
const requiredWithDefaultProp4 = [
  {
    val2: 2,
    val3: ["val3"],
    val4: [1],
  },
];
const requiredWithDefaultProp5 = ["prop5"];

// upsert allows all values to be passed in
entityWithComplexShapes
  .upsert({
    prop1,
    prop2,
    prop3,
    prop4,
    prop5,
    requiredProp1,
    requiredProp2,
    requiredProp3,
    requiredProp4,
    requiredProp5,
    requiredWithDefaultProp1,
    requiredWithDefaultProp2,
    requiredWithDefaultProp3,
    requiredWithDefaultProp4,
    requiredWithDefaultProp5,
  })
  .go();

// upsert allows all values to be passed in over multiple set operations
entityWithComplexShapes
  .upsert({ prop1 })
  .set({ prop2 })
  .set({ prop3 })
  .set({ prop4 })
  .set({ prop5 })
  .set({ requiredProp1 })
  .set({ requiredProp2 })
  .set({ requiredProp3 })
  .set({ requiredProp4 })
  .set({ requiredProp5 })
  .set({ requiredWithDefaultProp1 })
  .set({ requiredWithDefaultProp2 })
  .set({ requiredWithDefaultProp3 })
  .set({ requiredWithDefaultProp4 })
  .set({ requiredWithDefaultProp5 })
  .go();

// upsert allows all values to be passed in over multiple mixed mutation operations
entityWithComplexShapes
  .upsert({ prop1, prop2 })
  .set({ prop3 })
  .append({ prop4 })
  .add({ prop5 })
  .set({ requiredProp1 })
  .add({ requiredProp2 })
  .set({ requiredProp3 })
  .append({ requiredProp4 })
  .add({ requiredProp5 })
  .set({ requiredWithDefaultProp1 })
  .add({ requiredWithDefaultProp2 })
  .set({ requiredWithDefaultProp3 })
  .append({ requiredWithDefaultProp4 })
  .add({ requiredWithDefaultProp5 })
  .go();

// go is available if minimum required attributes are supplied
entityWithComplexShapes
  .upsert({
    // table index keys
    prop1,
    prop2,

    prop5,
    requiredProp1,
    requiredProp2,
    requiredProp3,
    requiredProp4,
    requiredProp5,
  })
  .go();

// params is available if minimum required attributes are supplied
entityWithComplexShapes
  .upsert({
    // table index keys
    prop1,
    prop2,

    prop5,
    requiredProp1,
    requiredProp2,
    requiredProp3,
    requiredProp4,
    requiredProp5,
  })
  .params();

expectType<
  "Missing required attributes to perform upsert" | "Required: requiredProp5"
>(
  entityWithComplexShapes.upsert({
    // table index keys
    prop1,
    prop2,

    prop5,
    requiredProp1,
    requiredProp2,
    requiredProp3,
    requiredProp4,
    // requiredProp5,
  }).go,
);

expectType<
  "Missing required attributes to perform upsert" | "Required: requiredProp5"
>(
  entityWithComplexShapes.upsert({
    // table index keys
    prop1,
    prop2,

    prop5,
    requiredProp1,
    requiredProp2,
    requiredProp3,
    requiredProp4,

    // requiredProp5,
  }).params,
);

expectType<"Missing required attributes to perform upsert" | "Required: prop1">(
  entityWithComplexShapes.upsert({
    // table index keys
    // implicit required attribute missing
    // prop1,
    prop2,

    prop5,
    requiredProp1,
    requiredProp2,
    requiredProp3,
    requiredProp4,
    requiredProp5,
  }).go,
);

expectType<"Missing required attributes to perform upsert" | "Required: prop1">(
  entityWithComplexShapes.upsert({
    // table index keys
    // implicit required attribute missing
    // prop1,
    prop2,

    prop5,
    requiredProp1,
    requiredProp2,
    requiredProp3,
    requiredProp4,

    requiredProp5,
  }).params,
);

expectType<
  | "Missing required attributes to perform upsert"
  | "Required: prop1"
  | "Required: requiredProp5"
>(
  entityWithComplexShapes.upsert({
    // table index keys
    // implicit required attribute missing
    // prop1,
    prop2,

    prop5,
    requiredProp1,
    requiredProp2,
    requiredProp3,
    requiredProp4,
    // requiredProp5,
  }).go,
);

expectType<
  | "Missing required attributes to perform upsert"
  | "Required: prop1"
  | "Required: requiredProp5"
>(
  entityWithComplexShapes.upsert({
    // table index keys
    // implicit required attribute missing
    // prop1,
    prop2,

    prop5,
    requiredProp1,
    requiredProp2,
    requiredProp3,
    requiredProp4,

    // requiredProp5,
  }).params,
);

// go is available if minimum required attributes are supplied across multiple mutations
entityWithComplexShapes
  .upsert({ prop1 })
  .set({ prop2 })
  .set({ prop5 })
  .set({ requiredProp1 })
  .set({ requiredProp2 })
  .set({ requiredProp3 })
  .set({ requiredProp4 })
  .set({ requiredProp5 })
  .go();

// go is available if minimum required attributes are supplied across different types of mutations
entityWithComplexShapes
  .upsert({ prop1 })
  .set({ prop2 })
  .add({ prop5 })
  .set({ requiredProp1 })
  .add({ requiredProp2 })
  .set({ requiredProp3 })
  .append({ requiredProp4 })
  .add({ requiredProp5 })
  .go();

// go is not available if minimum required attributes are supplied across different types of mutations is not met
expectType<
  | "Missing required attributes to perform upsert"
  | "Required: requiredProp1"
  | "Required: requiredProp5"
>(
  // .add({ requiredProp5 })
  entityWithComplexShapes
    .upsert({ prop2 })
    .set({ prop1 })
    .add({ prop5 })
    // .set({ requiredProp1 })
    .add({ requiredProp2 })
    .set({ requiredProp3 })
    .append({ requiredProp4 }).go,
);

// go is not available if minimum required attributes are supplied across different types of mutations is not met
expectType<
  | "Missing required attributes to perform upsert"
  | "Required: requiredProp5"
  | "Required: prop1"
  | "Required: requiredProp1"
  | "Required: prop2"
  | "Required: requiredProp2"
  | "Required: requiredProp3"
  | "Required: requiredProp4"
>(entityWithComplexShapes.upsert({}).go);
// do not allow add, subtract, and append on readOnly attributes
function readOnlyTests() {
  const prop1 = "value1";
  const prop2 = "value2";
  const prop3 = "value3";
  const prop3ReadOnly = prop3;
  const prop4 = 100;
  const prop4ReadOnly = prop4;
  const prop5 = { any: "value" };
  const prop5ReadOnly = prop5;
  const prop6 = ["list", "value"];
  const prop6ReadOnly = prop6;
  const prop7 = ["set", "value"];
  const prop7ReadOnly = prop7;

  // values can be added to upsert
  entityWithReadOnlyAttributes
    .upsert({
      prop1,
      prop2,
      prop3,
      prop3ReadOnly,
      prop4,
      prop4ReadOnly,
      prop5,
      prop5ReadOnly,
      prop6,
      prop6ReadOnly,
      prop7,
      prop7ReadOnly,
    })
    .go();

  // all values can be added to "set"
  entityWithReadOnlyAttributes
    .upsert({})
    .set({
      prop1,
      prop2,
      prop3,
      prop3ReadOnly,
      prop4,
      prop4ReadOnly,
      prop5,
      prop5ReadOnly,
      prop6,
      prop6ReadOnly,
      prop7,
      prop7ReadOnly,
    })
    .go();

  entityWithReadOnlyAttributes.upsert({}).add({
    prop4,
    prop5,
    prop7,
  });

  expectError(() => {
    entityWithReadOnlyAttributes.upsert({}).add({
      prop4ReadOnly,
      prop5ReadOnly,
      prop7ReadOnly,
    });
  });

  entityWithReadOnlyAttributes.upsert({}).subtract({
    prop4,
  });

  expectError(() => {
    entityWithReadOnlyAttributes.upsert({}).subtract({
      prop4ReadOnly,
    });
  });

  entityWithReadOnlyAttributes.upsert({}).append({
    prop6,
  });

  expectError(() => {
    entityWithReadOnlyAttributes.upsert({}).append({
      prop6ReadOnly,
    });
  });
}
