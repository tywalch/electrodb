/**
 * Behavioral guard tests for the performance-focused batch of audit fixes
 * ("stage 2"). Each describe block pins user-visible behavior that the
 * corresponding optimization must preserve; none of these rely on timing.
 */
const { expect } = require("chai");
const { Entity } = require("../src/entity");
const { Service } = require("../src/service");
const {
  makeMockV2Client,
  makePagingQueryHandler,
} = require("./fixtures/mock-client");
const {
  table,
  makeFixtureEntity,
  makeStoredItem,
  makeItemData,
} = require("./fixtures/entities");

// ---------------------------------------------------------------------------
// P1: executeQuery accumulated results by rebuilding the whole accumulator on
//     every page (`results = [...results, ...items]`), making auto-paging
//     O(pages²). These tests pin paging semantics: order, count truncation,
//     cursor resumability, and collection demixing.
// ---------------------------------------------------------------------------
describe("P1: executeQuery result accumulation", () => {
  const entity = makeFixtureEntity();

  function makePagingClient({ pages, perPage }) {
    const query = makePagingQueryHandler({
      pages,
      perPage,
      makeItem: (i) => makeStoredItem(entity, i),
    });
    return makeMockV2Client({ query });
  }

  it("returns the in-order union of all pages with pages:'all'", async () => {
    const pages = 5;
    const perPage = 4;
    const { client, calls } = makePagingClient({ pages, perPage });
    const { data, cursor } = await entity.query
      .records({ org: "org1" })
      .go({ client, pages: "all" });
    expect(calls.length).to.equal(pages);
    expect(cursor).to.equal(null);
    expect(data.map((item) => item.id)).to.deep.equal(
      Array.from({ length: pages * perPage }, (_, i) => makeItemData(i).id),
    );
    // items keep full attribute formatting, not just identity
    expect(data[0]).to.deep.equal(makeItemData(0));
    expect(data[data.length - 1]).to.deep.equal(makeItemData(19));
  });

  it("truncates to exactly `count` mid-page and returns a resumable cursor", async () => {
    const pages = 3;
    const perPage = 4;
    const count = 5; // straddles the first page boundary
    const { client } = makePagingClient({ pages, perPage });
    const first = await entity.query
      .records({ org: "org1" })
      .go({ client, count });
    expect(first.data.length).to.equal(count);
    expect(first.data.map((item) => item.count)).to.deep.equal([0, 1, 2, 3, 4]);
    expect(first.cursor).to.be.a("string");

    // resuming from the returned cursor picks up at the very next item
    const rest = await entity.query
      .records({ org: "org1" })
      .go({ client, cursor: first.cursor, pages: "all" });
    expect(rest.data.map((item) => item.count)).to.deep.equal([
      5, 6, 7, 8, 9, 10, 11,
    ]);
    expect(rest.cursor).to.equal(null);
  });

  describe("collection queries", () => {
    function makeCollectionModel(name) {
      return {
        model: { entity: name, service: "perfService", version: "1" },
        table,
        attributes: {
          org: { type: "string" },
          id: { type: "string" },
          label: { type: "string" },
        },
        indexes: {
          records: {
            collection: "shared",
            pk: { field: "pk", composite: ["org"] },
            sk: { field: "sk", composite: ["id"] },
          },
        },
      };
    }
    const alpha = new Entity(makeCollectionModel("alpha"), { table });
    const beta = new Entity(makeCollectionModel("beta"), { table });
    const service = new Service({ alpha, beta });

    it("accumulates per-entity arrays in order across pages", async () => {
      const pages = 4;
      const perPage = 3;
      const query = makePagingQueryHandler({
        pages,
        perPage,
        makeItem: (i) => {
          const owner = i % 2 === 0 ? alpha : beta;
          const { Item } = owner
            .put({
              org: "org1",
              id: `id${String(i).padStart(4, "0")}`,
              label: `label${i}`,
            })
            .params();
          return Item;
        },
      });
      const { client, calls } = makeMockV2Client({ query });
      const { data, cursor } = await service.collections
        .shared({ org: "org1" })
        .go({ client, pages: "all" });
      expect(calls.length).to.equal(pages);
      expect(cursor).to.equal(null);
      const expectedIds = Array.from(
        { length: pages * perPage },
        (_, i) => `id${String(i).padStart(4, "0")}`,
      );
      expect(data.alpha.map((item) => item.id)).to.deep.equal(
        expectedIds.filter((_, i) => i % 2 === 0),
      );
      expect(data.beta.map((item) => item.id)).to.deep.equal(
        expectedIds.filter((_, i) => i % 2 === 1),
      );
      expect(data.alpha[0]).to.deep.equal({
        org: "org1",
        id: "id0000",
        label: "label0",
      });
    });
  });
});
