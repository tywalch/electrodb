/**
 * Shared entity fixtures for offline tests and benchmarks. A representative
 * single-index entity exercising the common attribute types, plus helpers to
 * produce from-DynamoDB-shaped stored items for feeding `parse`/
 * `formatResponse` without a database.
 */
const { Entity } = require("../../src/entity");

const table = "electro";

function makeFixtureModel({
  entity = "perfFixture",
  service = "perfService",
  withWatchers = false,
} = {}) {
  const attributes = {
    org: { type: "string" },
    id: { type: "string" },
    name: { type: "string" },
    count: { type: "number" },
    active: { type: "boolean" },
    tags: { type: "set", items: "string" },
    profile: {
      type: "map",
      properties: {
        nickname: { type: "string" },
        age: { type: "number" },
      },
    },
    notes: {
      type: "list",
      items: {
        type: "map",
        properties: {
          body: { type: "string" },
        },
      },
    },
  };
  if (withWatchers) {
    attributes.displayName = {
      type: "string",
      watch: ["name"],
      set: (_, item) =>
        typeof item.name === "string" ? item.name.toUpperCase() : undefined,
    };
  }
  return {
    model: { entity, service, version: "1" },
    table,
    attributes,
    indexes: {
      records: {
        pk: { field: "pk", composite: ["org"] },
        sk: { field: "sk", composite: ["id"] },
      },
    },
  };
}

function makeFixtureEntity(options = {}) {
  return new Entity(makeFixtureModel(options), { table });
}

function makeItemData(i) {
  return {
    org: "org1",
    id: `id${String(i).padStart(8, "0")}`,
    name: `name${i}`,
    count: i,
    active: i % 2 === 0,
    tags: [`tag${i % 5}`, "common"],
    profile: { nickname: `nick${i}`, age: 20 + (i % 50) },
    notes: [{ body: `note${i}` }],
  };
}

// Builds the i-th item exactly as it would be stored in DynamoDB (keys,
// `__edb_e__`/`__edb_v__` identifiers, field names) by reusing the entity's
// own put-params formatting, then normalizing set attributes to plain arrays
// (the shape a v3 DocumentClient unmarshalls to).
function makeStoredItem(entity, i) {
  const { Item } = entity.put(makeItemData(i)).params();
  if (Item.tags && Array.isArray(Item.tags.values)) {
    Item.tags = [...Item.tags.values];
  }
  return Item;
}

module.exports = {
  table,
  makeFixtureModel,
  makeFixtureEntity,
  makeItemData,
  makeStoredItem,
};
