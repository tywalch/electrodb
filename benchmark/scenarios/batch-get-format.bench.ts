/**
 * P2 — batchGet response formatting calls formatResponse once per item.
 */
import type { ScenarioEntry } from "../run";
import { makeMockV2Client, StoredItem } from "../../test/fixtures/mock-client";
import {
  table,
  makeFixtureEntity,
  makeStoredItem,
  makeItemData,
} from "../../test/fixtures/entities";

const entity = makeFixtureEntity();

function makeBatch(count: number) {
  const Responses: Record<string, StoredItem[]> = { [table]: [] };
  const keys: { org: string; id: string }[] = [];
  for (let i = 0; i < count; i++) {
    Responses[table].push(makeStoredItem(entity, i));
    const { org, id } = makeItemData(i);
    keys.push({ org, id });
  }
  const { client, calls } = makeMockV2Client({
    batchGet: { Responses, UnprocessedKeys: {} },
  });
  return { client, calls, keys };
}

const batch100 = makeBatch(100);

const scenarios: ScenarioEntry[] = [
  {
    name: "batch-get-format/100-items",
    fn: async () => {
      batch100.calls.length = 0; // keep the mock's call log from growing
      return entity.get(batch100.keys).go({ client: batch100.client });
    },
  },
];

export default scenarios;
