/**
 * Shared offline client mocks. These fixtures are used by both the offline
 * test suites (test/offline.*.spec.js) and the benchmark scenarios
 * (benchmark/scenarios/*.bench.js); they must stay dependency-free and
 * synchronous so neither consumer needs network or DynamoDB access.
 */

// A minimal v2-style DocumentClient mock. Non-transaction methods return an
// object with `.promise()`; transaction methods return a request-like object
// (`on`/`abort`/`promise`) so it works both directly (via `_exec`) and through
// the v2 wrapper. `handlers` maps a method name to a canned response (or a
// function of the params). Transaction handlers may return
// `{ cancellationReasons: [...] }` to simulate a canceled transaction.
function makeMockV2Client(handlers = {}) {
  const calls = [];
  const transactMethods = new Set(["transactWrite", "transactGet"]);
  const methods = [
    "get",
    "put",
    "update",
    "delete",
    "batchWrite",
    "batchGet",
    "scan",
    "query",
    "transactWrite",
    "transactGet",
  ];
  const client = {
    createSet: (value) => new Set([].concat(value)),
  };
  for (const method of methods) {
    client[method] = (params) => {
      calls.push({ method, params });
      const handler = handlers[method];
      const value = typeof handler === "function" ? handler(params) : handler;
      if (transactMethods.has(method)) {
        const stored = {};
        return {
          on: (event, cb) => {
            stored[event] = cb;
          },
          abort: () => {},
          promise: () => {
            if (value && value.cancellationReasons) {
              if (stored.extractError) {
                stored.extractError({
                  httpResponse: {
                    body: {
                      toString: () =>
                        JSON.stringify({
                          CancellationReasons: value.cancellationReasons,
                        }),
                    },
                  },
                });
              }
              return Promise.reject(new Error("TransactionCanceledException"));
            }
            return Promise.resolve(value === undefined ? {} : value);
          },
        };
      }
      return {
        promise: () => Promise.resolve(value === undefined ? {} : value),
      };
    };
  }
  return { client, calls };
}

// Builds a `query`/`scan` handler that pages through `pages` responses of
// `perPage` items each, emitting a `LastEvaluatedKey` on every page but the
// last. `makeItem(i)` produces the i-th stored item (from-DynamoDB shape,
// including key fields; sort keys must be unique across items). Like DynamoDB,
// the handler resumes from the params' `ExclusiveStartKey` by locating the
// item whose pk/sk match, so it also honors cursors ElectroDB synthesizes
// mid-page (e.g. when a `count` limit lands inside a page).
function makePagingQueryHandler({ pages, perPage, makeItem }) {
  const items = [];
  const indexBySortKey = new Map();
  for (let i = 0; i < pages * perPage; i++) {
    const item = makeItem(i);
    items.push(item);
    indexBySortKey.set(`${item.pk}|${item.sk}`, i);
  }
  return (params) => {
    let start = 0;
    const esk = params.ExclusiveStartKey;
    if (esk !== undefined) {
      const index = indexBySortKey.get(`${esk.pk}|${esk.sk}`);
      if (index === undefined) {
        throw new Error("Unknown ExclusiveStartKey provided to paging mock");
      }
      start = index + 1;
    }
    const Items = items.slice(start, start + perPage);
    const response = { Items, Count: Items.length };
    const lastReturned = start + Items.length - 1;
    if (lastReturned < items.length - 1 && Items.length > 0) {
      const lastItem = Items[Items.length - 1];
      response.LastEvaluatedKey = { pk: lastItem.pk, sk: lastItem.sk };
    }
    return response;
  };
}

module.exports = {
  makeMockV2Client,
  makePagingQueryHandler,
};
