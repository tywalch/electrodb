/**
 * P5 — Entity construction cost (model validation dominates).
 */
const { Entity } = require("../../src/entity");
const { table, makeFixtureModel } = require("../../test/fixtures/entities");

const model = makeFixtureModel();
const watcherModel = makeFixtureModel({ withWatchers: true });

module.exports = [
  {
    name: "entity-construction/new-entity",
    fn: () => new Entity(model, { table }),
  },
  {
    name: "entity-construction/new-entity-watchers",
    fn: () => new Entity(watcherModel, { table }),
  },
];
