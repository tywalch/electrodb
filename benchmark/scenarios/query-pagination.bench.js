/**
 * P1 — auto-paging accumulation across many pages (`pages: "all"`). The
 * O(pages²) → O(pages) change shows up most at high page counts.
 */
const {
  makeMockV2Client,
  makePagingQueryHandler,
} = require("../../test/fixtures/mock-client");
const {
  makeFixtureEntity,
  makeStoredItem,
} = require("../../test/fixtures/entities");

const entity = makeFixtureEntity();

function makePagingClient({ pages, perPage }) {
  const query = makePagingQueryHandler({
    pages,
    perPage,
    makeItem: (i) => makeStoredItem(entity, i),
  });
  return makeMockV2Client({ query });
}

const mock10 = makePagingClient({ pages: 10, perPage: 100 });
const mock100 = makePagingClient({ pages: 100, perPage: 100 });

function runAllPages(mock) {
  mock.calls.length = 0; // keep the mock's call log from growing
  return entity.query
    .records({ org: "org1" })
    .go({ client: mock.client, pages: "all" });
}

module.exports = [
  {
    name: "query-pagination/10-pages-x100",
    fn: async () => runAllPages(mock10),
  },
  {
    name: "query-pagination/100-pages-x100",
    fn: async () => runAllPages(mock100),
  },
];
