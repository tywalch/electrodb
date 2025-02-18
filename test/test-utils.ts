import {
  DocumentClient,
  DocumentClientMethod,
  ElectroEventListener,
  ElectroDBMethodTypes,
  ElectroQueryEvent,
  ElectroResultsEvent,
  ElectroEvent,
} from "../index";

import {
  ScanOutput,
  QueryOutput,
  PutItemOutput,
  GetItemOutput,
  UpdateItemOutput,
  DeleteItemOutput,
  BatchGetItemOutput,
  BatchWriteItemOutput,
  TransactGetItemsOutput,
  TransactWriteItemsOutput,
  DocumentClient as V2Client
} from "aws-sdk/clients/dynamodb";

import {
  DynamoDBClient as V3Client
} from "@aws-sdk/client-dynamodb";

export const DYNAMODB_ENDPOINT = process.env.LOCAL_DYNAMO_ENDPOINT || 'http://loalhost:8000';

export const v2Client = new V2Client({
  region: "us-east-1",
  endpoint: DYNAMODB_ENDPOINT,
});

export const v3Client = new V3Client({
  region: "us-east-1",
  endpoint: DYNAMODB_ENDPOINT,
});

export type V2DocumentClient = Extract<DocumentClient, { get: any }>;

export function createObjectOfSize(kb: number): object {
  const sizeInBytes = kb * 1024;
  const obj: { [key: string]: string } = {};
  let currentSize = 0;

  while (currentSize < sizeInBytes) {
    const key = `key${currentSize}`;
    const value = "a".repeat(1024); // 1 KB string
    obj[key] = value;
    currentSize += key.length + value.length;
  }

  return obj;
}

export type V2DocumentClientMethodName = keyof V2DocumentClient;

export type V2DocumentClientSpyCall = {
  type: V2DocumentClientMethodName;
  result: any;
  params: any;
}

export type V2DocumentClientSpy = V2DocumentClient & {
  calls: V2DocumentClientSpyCall[];
}

export function createV2DocumentClientSpy(client: V2DocumentClient): V2DocumentClientSpy {
  if ('send' in client) {
    throw new Error('v2 client only for now');
  }

  const calls: V2DocumentClientSpyCall[] = [];

  function createSpyFn(method: V2DocumentClientMethodName) : DocumentClientMethod {
    return (params: any) => {
      return {
        promise: async () => {
          if (method in client) {
            const result = await client[method](params).promise();
            calls.push({ type: method, params, result });
            return result;
          }

          throw new Error(`Method ${method} not found in client`);
        }
      }
    }
  }

  return {
    get calls() {
      return calls;
    },
    get: createSpyFn('get'),
    put: createSpyFn('put'),
    delete: createSpyFn('delete'),
    update: createSpyFn('update'),
    batchWrite: createSpyFn('batchWrite'),
    batchGet: createSpyFn('batchGet'),
    scan: createSpyFn('scan'),
    transactGet: createSpyFn('transactGet'),
    transactWrite: createSpyFn('transactWrite'),
    query: createSpyFn('query'),
    createSet: (...options: any[]) => client.createSet(...options),
  }
}

export type CreateDataFnOptions = {
  index: number;
  data: object;
}

export type CreateDataFn<T> = (options: CreateDataFnOptions) => T;

export function createData<T>(count: number, size: number, fn: CreateDataFn<T>): T[] {
  return Array.from({ length: count }, () => createObjectOfSize(size))
    .map((data, index) => fn({ index, data }));
}

export type CreateV2DocumentClientStubOptions = {
  get?: GetItemOutput[];
  put?: PutItemOutput[];
  delete?: DeleteItemOutput[];
  update?: UpdateItemOutput[];
  batchWrite?: BatchWriteItemOutput[];
  batchGet?: BatchGetItemOutput[];
  scan?: ScanOutput[];
  transactGet?: TransactGetItemsOutput[];
  transactWrite?: TransactWriteItemsOutput[];
  query?: QueryOutput[];
  createSet?: any[];
}

export function createV2DocumentClientStub(options: CreateV2DocumentClientStubOptions): V2DocumentClient {
  function createStubFn(method: V2DocumentClientMethodName, stubbed: any[] = []) : DocumentClientMethod {
    return () => {
      return {
        promise: async () => {
          if (stubbed.length === 0) {
            throw new Error(`No stub found for method '${method}'`);
          }

          return [...stubbed].shift();
        }
      }
    }
  }

  return {
    get: createStubFn('get', options.get),
    put: createStubFn('put', options.put),
    delete: createStubFn('delete', options.delete),
    update: createStubFn('update', options.update),
    batchWrite: createStubFn('batchWrite', options.batchWrite),
    batchGet: createStubFn('batchGet', options.batchGet),
    scan: createStubFn('scan', options.scan),
    transactGet: createStubFn('transactGet', options.transactGet),
    transactWrite: createStubFn('transactWrite', options.transactWrite),
    query: createStubFn('query', options.query),
    createSet: () => [],
  }
}

export function createDebugLogger(label: string, filters: ElectroDBMethodTypes[] = []): ElectroEventListener {
  return (event) => {
    if (filters.length > 0 && !filters.includes(event.method)) {
      return;
    } else if (event.type === 'query') {
      console.log(label, JSON.stringify(event.params, null, 4));
    } else {
      console.log(label, JSON.stringify(event.results, null, 4));
    }
  }
}

export type EventCollectorCall = {
  request: ElectroQueryEvent;
  response: ElectroResultsEvent;
}

export type EventCollector = ElectroEventListener & {
  queries: ElectroQueryEvent[],
  results: ElectroResultsEvent[],
  calls: EventCollectorCall[];
}

export function createEventCollector(): EventCollector {
  const calls: EventCollectorCall[] = [];
  const queries: ElectroQueryEvent[] = []
  const results: ElectroResultsEvent[] = [];
  let current = {} as EventCollectorCall;
  const collector = (event: ElectroEvent) => {
    if (event.type === 'query') {
      queries.push(event);
      current.request = event;
    } else {
      current.response = event;
      results.push(event);
      calls.push({...current});
    }
  }

  collector.queries = queries;
  collector.results = results;
  collector.calls = calls;

  return collector;
}