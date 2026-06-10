/**
 * P2 — batchGet response formatting calls formatResponse once per item.
 */
const { makeMockV2Client } = require("../../test/fixtures/mock-client");
const {
  table,
  makeFixtureEntity,
  makeStoredItem,
  makeItemData,
} = require("../../test/fixtures/entities");

const entity = makeFixtureEntity();

function makeBatch(count) {
  const Responses = { [table]: [] };
  const keys = [];
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

module.exports = [
  {
    name: "batch-get-format/100-items",
    fn: async () => {
      batch100.calls.length = 0; // keep the mock's call log from growing
      return entity.get(batch100.keys).go({ client: batch100.client });
    },
  },
];
