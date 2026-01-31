import { Entity, Service } from "../index";

export const entityWithReadOnlyAttributes = new Entity(
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

export const entityWithComplexShapes = new Entity({
  model: {
    entity: "entityWithComplexShapes",
    service: "s1",
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

export const serivce = new Service({
  entityWithReadOnlyAttributes,
  entityWithComplexShapes,
})