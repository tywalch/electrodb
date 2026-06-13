/**
 * Shared entity fixtures for offline tests and benchmarks. A representative
 * single-index entity exercising the common attribute types, plus helpers to
 * produce from-DynamoDB-shaped stored items for feeding `parse`/
 * `formatResponse` without a database.
 */
import type { StoredItem } from "./mock-client";

// internals are untyped; required (not imported) per repo test convention
const { Entity } = require("../../src/entity");

export const table = "electro";

export interface FixtureModelOptions {
  entity?: string;
  service?: string;
  withWatchers?: boolean;
}

export interface FixtureItemData {
  org: string;
  id: string;
  name: string;
  count: number;
  active: boolean;
  tags: string[];
  profile: { nickname: string; age: number };
  notes: { body: string }[];
}

export function makeFixtureModel({
  entity = "perfFixture",
  service = "perfService",
  withWatchers = false,
}: FixtureModelOptions = {}): Record<string, any> {
  const attributes: Record<string, any> = {
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
      set: (_: unknown, item: Record<string, any>) =>
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

export function makeFixtureEntity(options: FixtureModelOptions = {}): any {
  return new Entity(makeFixtureModel(options), { table });
}

export function makeItemData(i: number): FixtureItemData {
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
export function makeStoredItem(entity: any, i: number): StoredItem {
  const { Item } = entity.put(makeItemData(i)).params();
  if (Item.tags && Array.isArray(Item.tags.values)) {
    Item.tags = [...Item.tags.values];
  }
  return Item;
}
