process.env.AWS_NODEJS_CONNECTION_REUSE_ENABLED = "1";
import DynamoDB from "aws-sdk/clients/dynamodb";
import { expect } from "chai";
import { v4 as uuid } from "uuid";
import { Entity, DocumentClient, EntityItem } from "../index";

const table = 'electro';

const client = new DynamoDB.DocumentClient({
  region: "us-east-1",
  endpoint: process.env.LOCAL_DYNAMO_ENDPOINT || 'http://localhost:8000',
});

type DocumentClientMethod = keyof Extract<DocumentClient, { get: any }>;

type DocumentClientSpyCall = {
  type: DocumentClientMethod;
  params: any;
}

type DocumentClientSpy = DocumentClient & {
  calls: DocumentClientSpyCall[];
}

function createDocumentClientSpy(client: DocumentClient): DocumentClientSpy {
  if ('send' in client) {
    throw new Error('v2 client only for now');
  }

  const calls: DocumentClientSpyCall[] = [];
  return {
    get calls() {
      return calls;
    },
    get: (params: any) => (calls.push({type: 'get', params}), client.get(params)),
    put: (params: any) => (calls.push({type: 'put', params}), client.put(params)),
    delete: (params: any) => (calls.push({type: 'delete', params}), client.delete(params)),
    update: (params: any) => (calls.push({type: 'update', params}), client.update(params)),
    batchWrite: (params: any) => (calls.push({type: 'batchWrite', params}), client.batchWrite(params)),
    batchGet: (params: any) => (calls.push({type: 'batchGet', params}), client.batchGet(params)),
    scan: (params: any) => (calls.push({type: 'scan', params}), client.scan(params)),
    transactGet: (params: any) => (calls.push({type: 'transactGet', params}), client.transactGet(params)),
    transactWrite: (params: any) => (calls.push({type: 'transactWrite', params}), client.transactWrite(params)),
    query: (params: any) => (calls.push({type: 'query', params}), client.query(params)),
    createSet: (params: any) => (calls.push({type: 'createSet', params}), client.createSet(params)),
  }
}

function createObjectOfSize(kb: number): object {
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

function createEntity(table: string, client: DocumentClient) {
  return new Entity({
    model: {
      entity: 'paginator',
      version: '0',
      service: 'pagination-test'
    },
    attributes: {
      id: {
        type: 'string'
      },
      index: {
        type: 'number',
        required: true,
      },
      data: {
        type: 'any'
      },
    },
    indexes: {
      record: {
        pk: {
          field: 'pk',
          composite: ['id'],
        },
        sk: {
          field: 'sk',
          composite: ['index'],
        },
      }
    },
  }, { client, table });
}

type PaginatorEntity = ReturnType<typeof createEntity>;

type PaginatorItem = EntityItem<PaginatorEntity>;

function createItems(count: number, size: number, id: string = uuid()): PaginatorItem[] {
  let index = 0;
  return Array.from({ length: count }, () => ({
    id: id,
    index: index++,
    data: createObjectOfSize(size),
  }));
}

describe('entity pagination', () => {
  const id = uuid();
  // 100 items of 100 KB each
  const items = createItems(100, 100, id)

  before(async () => {
    const entity = createEntity(table, client);
    await entity.put(items).go();
  });

  describe('when using seek', () => {
    it('should only paginate once if there are no results', async () => {
      const clientSpy = createDocumentClientSpy(client);
      const entity = createEntity(table, clientSpy);

      // use an id that doesn't exist
      const result = await entity.query
        .record({ id: 'unknown' })
        .go({ seek: true });

      // nothing should be returned
      expect(result).to.deep.equal({ data: [], cursor: null });
      // only one call should have been made (didn't try to paginate)
      expect(clientSpy.calls.length).to.equal(1);
    });

    it('should only paginate once if there is only one page of results', async () => {
      const id = uuid();
      const clientSpy = createDocumentClientSpy(client);
      const entity = createEntity(table, clientSpy);
      // 20 items of 1 KB each
      const items = createItems(20, 1, id);
      await entity.put(items).go();

      const result = await entity.query
        .record({ id })
        .go({ seek: true });

      // all items should be returned in one request
      expect(result.data).to.have.length(items.length);
      // only one "query" call should have been made (didn't try to paginate)
      expect(clientSpy.calls.filter(({ type }) => type === 'query')).to.have.length(1);
    });

    it('should paginate multiple times if a cursor is returned but results are not', async () => {
      const clientSpy = createDocumentClientSpy(client);
      const entity = createEntity(table, clientSpy);

      // the items actually returned from DynamoDB
      const returned: any[][] = [];
      const result = await entity.query
        .record({ id })
        .where(({ index }, { gt }) => gt(index, 60))
        .go({
          seek: true,
          params: { Limit: 5 },
          logger: (event) => {
            if (event.type === 'results') {
              returned.push(event.results.Items);
            }
          }
        });

      // it should return items (the amount doesn't matter)
      expect(result.data.length).to.be.greaterThan(0);
      // it should have made more than one call to get results
      expect(clientSpy.calls.length).to.be.greaterThan(1);
      // the first call should have returned 0 items (the user need behind 'seek')
      expect(returned[0]).to.have.length(0);
    });
  });

  describe('when using atleast', () => {
    it('should throw if the atleast option cannot be parsed as a number', async () => {
      const entity = createEntity(table, client);
      const result = await entity.query
        .record({ id: 'unknown', run: 'unknown' })
        // @ts-expect-error
        .go({ atleast: 'abc' })
        .then(() => null)
        .catch((err: any) => err);

      expect(result.message).to.equal('Invalid value for query option "atleast" provided. Unable to parse integer value. - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#invalid-options');
    });

    it('should continue to paginate until at least the number of request items are returned', async () => {
      const clientSpy = createDocumentClientSpy(client);
      const entity = createEntity(table, clientSpy);

      const result = await entity.query
        .record({ id })
        .go({
          atleast: 11,
          params: { Limit: 5 },
        });

      expect(result.data.length).to.be.greaterThan(10);
      expect(clientSpy.calls.length).to.be.greaterThan(2);
    });
  });

  describe('when using count', () => {
    it('should only return 10 items to the user', async () => {
      const clientSpy = createDocumentClientSpy(client);
      const entity = createEntity(table, clientSpy);
      let returned: any = null;
      const result = await entity.query
        .record({ id })
        .go({
          count: 10,
          logger: (event) => {
            if (event.type === 'results') {
              returned = event.results.Items;
            }
          }
        });

      expect(result.data).to.have.length(10);
      expect(returned).to.not.be.null;
      expect(returned.length).to.be.greaterThan(10);
    });
  });

  describe('when using pages', () => {
    it('should query all items when using pages all', async () => {
      const clientSpy = createDocumentClientSpy(client);
      const entity = createEntity(table, clientSpy);

      const result = await entity.query
        .record({ id })
        .go({ pages: 'all' });

      expect(result.data.sort((a, z) => a.index - z.index)).to.deep.equal(items.sort((a, z) => a.index - z.index));
      expect(clientSpy.calls).to.have.length(10);
    });
  })
});