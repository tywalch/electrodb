import { Entity, Service } from "../index";

export const entityOne = new Entity(
  {
    model: {
      entity: "entity1",
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
      },
      prop6: {
        type: "number",
      },
      prop7: {
        type: "list",
        items: {
          type: "string",
        },
      },
      prop8: {
        type: "set",
        items: "string",
      },
    },
    indexes: {
      index1: {
        collection: "basic",
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
  },
);

export const entityTwo = new Entity(
  {
    model: {
      entity: "entity2",
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
      prop5: {
        type: "string",
      },
    },
    indexes: {
      index1: {
        collection: "basic",
        pk: {
          field: "pk",
          composite: ["prop1", "prop2"],
        },
        sk: {
          field: "sk",
          composite: ["prop5"],
        },
      },
    },
  },
);

export const serviceOne = new Service({ entityOne, entityTwo });