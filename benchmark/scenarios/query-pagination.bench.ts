/**
 * P1 — auto-paging accumulation across many pages (`pages: "all"`). The
 * O(pages²) → O(pages) change shows up most at high page counts.
 */
import type { ScenarioEntry } from "../run";
import {
  makeMockV2Client,
  makePagingQueryHandler,
  MockV2Client,
} from "../../test/fixtures/mock-client";
import {
  makeFixtureEntity,
  makeStoredItem,
} from "../../test/fixtures/entities";

const entity = makeFixtureEntity();

function makePagingClient({
  pages,
  perPage,
}: {
  pages: number;
  perPage: number;
}): MockV2Client {
  const query = makePagingQueryHandler({
    pages,
    perPage,
    makeItem: (i) => makeStoredItem(entity, i),
  });
  return makeMockV2Client({ query });
}

const mock10 = makePagingClient({ pages: 10, perPage: 100 });
const mock100 = makePagingClient({ pages: 100, perPage: 100 });

function runAllPages(mock: MockV2Client) {
  mock.calls.length = 0; // keep the mock's call log from growing
  return entity.query
    .records({ org: "org1" })
    .go({ client: mock.client, pages: "all" });
}

const scenarios: ScenarioEntry[] = [
  {
    name: "query-pagination/10-pages-x100",
    fn: async () => runAllPages(mock10),
  },
  {
    name: "query-pagination/100-pages-x100",
    fn: async () => runAllPages(mock100),
  },
];

export default scenarios;
