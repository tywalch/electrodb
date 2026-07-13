import type { ScenarioEntry } from "../run";
import type { StoredItem } from "../../test/fixtures/mock-client";
import {
  makeFixtureEntity,
  makeStoredItem,
} from "../../test/fixtures/entities";

const entity = makeFixtureEntity();
const watcherEntity = makeFixtureEntity({ withWatchers: true });

function makeItems(owner: any, count: number): StoredItem[] {
  const Items: StoredItem[] = [];
  for (let i = 0; i < count; i++) {
    Items.push(makeStoredItem(owner, i));
  }
  return Items;
}

const items100 = makeItems(entity, 100);
const items1000 = makeItems(entity, 1000);
const watcherItems1000 = makeItems(watcherEntity, 1000);

const scenarios: ScenarioEntry[] = [
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

export default scenarios;
