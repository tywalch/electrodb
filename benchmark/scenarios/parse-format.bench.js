/**
 * P2 + P4 — response formatting: per-item getter passes, sibling snapshots,
 * path lookups, and (formerly) per-call error allocation.
 */
const {
  makeFixtureEntity,
  makeStoredItem,
} = require("../../test/fixtures/entities");

const entity = makeFixtureEntity();
const watcherEntity = makeFixtureEntity({ withWatchers: true });

function makeItems(owner, count) {
  const Items = [];
  for (let i = 0; i < count; i++) {
    Items.push(makeStoredItem(owner, i));
  }
  return Items;
}

const items100 = makeItems(entity, 100);
const items1000 = makeItems(entity, 1000);
const watcherItems1000 = makeItems(watcherEntity, 1000);

module.exports = [
  {
    name: "parse-format/100-items",
    fn: () => entity.parse({ Items: items100 }),
  },
  {
    name: "parse-format/1000-items",
    fn: () => entity.parse({ Items: items1000 }),
  },
  {
    name: "parse-format/1000-items-watchers",
    fn: () => watcherEntity.parse({ Items: watcherItems1000 }),
  },
];
