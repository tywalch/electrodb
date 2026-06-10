/**
 * P5 — Entity construction cost (model validation dominates).
 */
import type { ScenarioEntry } from "../run";
import { table, makeFixtureModel } from "../../test/fixtures/entities";

const { Entity } = require("../../src/entity");

const model = makeFixtureModel();
const watcherModel = makeFixtureModel({ withWatchers: true });

const scenarios: ScenarioEntry[] = [
  {
    name: "entity-construction/new-entity",
    fn: () => new Entity(model, { table }),
  },
  {
    name: "entity-construction/new-entity-watchers",
    fn: () => new Entity(watcherModel, { table }),
  },
];

export default scenarios;
