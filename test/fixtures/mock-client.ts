import type { DocumentClient } from "aws-sdk/clients/dynamodb";
import type { V2DocumentClient } from "../../index";

export type StoredItem = Record<string, any>;

export type MockableMethod = keyof V2DocumentClient;

const MockableMethods: Record<MockableMethod, MockableMethod> = {
  get: "get",
  put: "put",
  update: "update",
  delete: "delete",
  batchWrite: "batchWrite",
  batchGet: "batchGet",
  scan: "scan",
  query: "query",
  transactWrite: "transactWrite",
  transactGet: "transactGet",
}

export type CanceledTransactionSimulation = {
  cancellationReasons: Array<{
    Code?: string;
    Item?: StoredItem;
    Message?: string;
  }>;
};

type MethodInput = {
  get: DocumentClient.GetItemInput;
  put: DocumentClient.PutItemInput;
  update: DocumentClient.UpdateItemInput;
  delete: DocumentClient.DeleteItemInput;
  batchWrite: DocumentClient.BatchWriteItemInput;
  batchGet: DocumentClient.BatchGetItemInput;
  scan: DocumentClient.ScanInput;
  query: DocumentClient.QueryInput;
  transactWrite: DocumentClient.TransactWriteItemsInput;
  transactGet: DocumentClient.TransactGetItemsInput;
};

type MethodOutput = {
  get: DocumentClient.GetItemOutput;
  put: DocumentClient.PutItemOutput;
  update: DocumentClient.UpdateItemOutput;
  delete: DocumentClient.DeleteItemOutput;
  batchWrite: DocumentClient.BatchWriteItemOutput;
  batchGet: DocumentClient.BatchGetItemOutput;
  scan: DocumentClient.ScanOutput;
  query: DocumentClient.QueryOutput;
  transactWrite:
    | DocumentClient.TransactWriteItemsOutput
    | CanceledTransactionSimulation;
  transactGet:
    | DocumentClient.TransactGetItemsOutput
    | CanceledTransactionSimulation;
};

export type MockHandler<Method extends MockableMethod = MockableMethod> =
  | MethodOutput[Method]
  | ((params: MethodInput[Method]) => MethodOutput[Method]);

/** method-name-keyed map: unknown method names are compile errors */
export type MockHandlers = {
  [Method in MockableMethod]?: MockHandler<Method>;
};

export type MockClientCall = {
  method: MockableMethod;
  params: Record<string, any>;
};

export type MockedV2DocumentClient = V2DocumentClient & {
  createSet: (value: any) => Set<any>;
};

export type MockV2Client = {
  client: MockedV2DocumentClient;
  calls: MockClientCall[];
};

export function makeMockV2Client(handlers: MockHandlers = {}): MockV2Client {
  const calls: MockClientCall[] = [];
  const transactMethods = new Set<MockableMethod>([
    "transactWrite",
    "transactGet",
  ]);
  const client: any = {
    createSet: (value: any) => new Set([].concat(value)),
  };
  for (const method of Object.values(MockableMethods)) {
    client[method] = (params: Record<string, any>) => {
      calls.push({ method, params });
      const handler = handlers[method];
      const value: any =
        typeof handler === "function"
          ? (handler as (input: Record<string, any>) => unknown)(params)
          : handler;
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

export type MakePagingQueryHandlerOptions = {
  pages: number;
  perPage: number;
  /** produces the i-th stored item (from-DynamoDB shape, including key fields) */
  makeItem: (i: number) => StoredItem;
};

export type PagingQueryResponse = {
  Items: StoredItem[];
  Count: number;
  LastEvaluatedKey?: { pk: any; sk: any };
};

export type MakePagingQueryHandlerResponse = (
  params: Record<string, any>,
) => PagingQueryResponse;

// Builds a `query`/`scan` handler that pages through `pages` responses of
// `perPage` items each, emitting a `LastEvaluatedKey` on every page but the
// last. Sort keys must be unique across items. Like DynamoDB, the handler
// resumes from the params' `ExclusiveStartKey` by locating the item whose
// pk/sk match, so it also honors cursors ElectroDB synthesizes mid-page
// (e.g. when a `count` limit lands inside a page).
export function makePagingQueryHandler(
  options: MakePagingQueryHandlerOptions,
): MakePagingQueryHandlerResponse {
  const { pages, perPage, makeItem } = options;
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
