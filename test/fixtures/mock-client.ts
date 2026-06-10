/**
 * Shared offline client mocks. These fixtures are used by both the offline
 * test suites (test/offline.*.spec.*) and the benchmark scenarios
 * (benchmark/scenarios/*.benchmark.ts); they must stay dependency-free and
 * synchronous so neither consumer needs network or DynamoDB access.
 */

export type StoredItem = Record<string, any>;

export interface MockClientCall {
  method: string;
  params: Record<string, any>;
}

export type MockHandler =
  | ((params: Record<string, any>) => any)
  | Record<string, any>;

export interface MockV2Client {
  /** duck-typed v2 DocumentClient; hand to `.go({ client })` or the Entity config */
  client: any;
  /** every call the entity made, in order */
  calls: MockClientCall[];
}

// A minimal v2-style DocumentClient mock. Non-transaction methods return an
// object with `.promise()`; transaction methods return a request-like object
// (`on`/`abort`/`promise`) so it works both directly (via `_exec`) and through
// the v2 wrapper. `handlers` maps a method name to a canned response (or a
// function of the params). Transaction handlers may return
// `{ cancellationReasons: [...] }` to simulate a canceled transaction.
export function makeMockV2Client(
  handlers: Record<string, MockHandler> = {},
): MockV2Client {
  const calls: MockClientCall[] = [];
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
  const client: Record<string, any> = {
    createSet: (value: any) => new Set([].concat(value)),
  };
  for (const method of methods) {
    client[method] = (params: Record<string, any>) => {
      calls.push({ method, params });
      const handler = handlers[method];
      const value = typeof handler === "function" ? handler(params) : handler;
      if (transactMethods.has(method)) {
        const stored: Record<string, (input: any) => void> = {};
        return {
          on: (event: string, callback: (input: any) => void) => {
            stored[event] = callback;
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

export interface PagingQueryHandlerOptions {
  pages: number;
  perPage: number;
  /** produces the i-th stored item (from-DynamoDB shape, including key fields) */
  makeItem: (i: number) => StoredItem;
}

export interface PagingQueryResponse {
  Items: StoredItem[];
  Count: number;
  LastEvaluatedKey?: { pk: any; sk: any };
}

// Builds a `query`/`scan` handler that pages through `pages` responses of
// `perPage` items each, emitting a `LastEvaluatedKey` on every page but the
// last. Sort keys must be unique across items. Like DynamoDB, the handler
// resumes from the params' `ExclusiveStartKey` by locating the item whose
// pk/sk match, so it also honors cursors ElectroDB synthesizes mid-page
// (e.g. when a `count` limit lands inside a page).
export function makePagingQueryHandler({
  pages,
  perPage,
  makeItem,
}: PagingQueryHandlerOptions): (
  params: Record<string, any>,
) => PagingQueryResponse {
  const items: StoredItem[] = [];
  const indexBySortKey = new Map<string, number>();
  for (let i = 0; i < pages * perPage; i++) {
    const item = makeItem(i);
    items.push(item);
    indexBySortKey.set(`${item.pk}|${item.sk}`, i);
  }
  return (params: Record<string, any>) => {
    let start = 0;
    const exclusiveStartKey = params.ExclusiveStartKey;
    if (exclusiveStartKey !== undefined) {
      const index = indexBySortKey.get(
        `${exclusiveStartKey.pk}|${exclusiveStartKey.sk}`,
      );
      if (index === undefined) {
        throw new Error("Unknown ExclusiveStartKey provided to paging mock");
      }
      start = index + 1;
    }
    const Items = items.slice(start, start + perPage);
    const response: PagingQueryResponse = { Items, Count: Items.length };
    const lastReturned = start + Items.length - 1;
    if (lastReturned < items.length - 1 && Items.length > 0) {
      const lastItem = Items[Items.length - 1];
      response.LastEvaluatedKey = { pk: lastItem.pk, sk: lastItem.sk };
    }
    return response;
  };
}
