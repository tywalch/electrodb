import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { Entity, EntityItem, Service } from "../";
import { expect } from "chai";
import { v4 as uuid } from "uuid";
const c = require("../src/client");

const client = new DocumentClient({
  region: "us-east-1",
  endpoint: process.env.LOCAL_DYNAMO_ENDPOINT ?? "http://localhost:8000",
  credentials: {
    accessKeyId: "test",
    secretAccessKey: "test",
  },
});

const table = "electro";

type MockResponse = {
  Items: Record<string, unknown>[];
  LastEvaluatedKey?: Record<string, unknown>;
};

function noOpClientMethods() {
  return c.v2Methods.reduce(
    (client: Record<string, () => void>, method: string) => {
      client[method] = () => {};
      return client;
    },
    {},
  );
}

function createClient({ mockResponses }: { mockResponses?: MockResponse[] } = {}) {
  const calls: (DocumentClient.QueryInput | DocumentClient.ScanInput)[] = [];
  let count = 0;
  return {
    calls,
    client: {
      ...noOpClientMethods(),
      query(params: DocumentClient.QueryInput) {
        calls.push(params);
        return {
          async promise() {
            if (Array.isArray(mockResponses)) {
              return mockResponses[count++];
            } else {
              return client.query(params).promise();
            }
          },
        };
      },
      scan(params: DocumentClient.ScanInput) {
        calls.push(params);
        return {
          async promise() {
            if (Array.isArray(mockResponses)) {
              return mockResponses[count++];
            } else {
              return client.scan(params).promise();
            }
          },
        };
      },
    },
  };
}

function makeTasksModel() {
  return {
    model: {
      entity: uuid(),
      version: "1",
      service: "taskapp",
    },
    attributes: {
      task: {
        type: "string" as const,
      },
      project: {
        type: "string" as const,
        required: true,
      },
      employee: {
        type: "string" as const,
      },
      description: {
        type: "string" as const,
      },
      points: {
        type: "number" as const,
      },
    },
    indexes: {
      task: {
        pk: {
          field: "pk",
          composite: ["task"] as const,
        },
        sk: {
          field: "sk",
          composite: ["project", "employee"] as const,
        },
      },
      projects: {
        index: "gsi1pk-gsi1sk-index",
        pk: {
          field: "gsi1pk",
          composite: ["project"] as const,
        },
        sk: {
          field: "gsi1sk",
          composite: ["employee", "task"] as const,
        },
      },
      assigned: {
        collection: "assignments" as const,
        index: "gsi2pk-gsi2sk-index",
        pk: {
          field: "gsi2pk",
          composite: ["employee"] as const,
        },
        sk: {
          field: "gsi2sk",
          composite: ["project", "points"] as const,
        },
      },
    },
  };
}

const employees = [
  "Jack",
  "Tyler",
  "David",
  "Stephanie",
  "Shane",
  "Zack",
  "Georgina",
  "Michele",
  "Ronda",
  "Paula",
  "Fred",
];

const projects = ["135-53", "460-63", "372-55", "552-77", "636-33", "360-56"];

describe("Async Iterable Pagination", () => {
  const TasksModel = makeTasksModel();
  const tasks = new Entity(TasksModel, { client, table });
  const tasks2Model = makeTasksModel();
  const tasks2 = new Entity(tasks2Model, { client, table });
  const service = new Service({ tasks, tasks2 });

  type TaskItem = EntityItem<typeof tasks>;

  const loadedTasks: TaskItem[] = [];
  const loadedTasks2: TaskItem[] = [];
  const taskData: Record<string, unknown>[] = [];
  const task2Data: Record<string, unknown>[] = [];
  const total = 500;

  function getRandomNumber(min: number, max: number) {
    return Math.floor(Math.random() * (max - min)) + min;
  }

  function generateRandomRecord() {
    return {
      task: uuid(),
      employee: employees[getRandomNumber(0, employees.length)],
      project: projects[getRandomNumber(0, projects.length)],
      points: [1, 2, 3, 5, 8, 13, 21, 50, 100][getRandomNumber(0, 9)],
      description: "test record",
    };
  }

  before(async function () {
    this.timeout(20000);
    const inserts: Promise<void>[] = [];
    for (let i = 0; i < total; i++) {
      const record = generateRandomRecord();
      const params = tasks.put(record).params<{ Item: Record<string, unknown> }>();
      taskData.push(params.Item);
      inserts.push(
        tasks
          .put(record)
          .go()
          .then((res) => {
            loadedTasks.push(res.data);
          }),
      );
    }
    for (let i = 0; i < total; i++) {
      const record = generateRandomRecord();
      const params = tasks2.put(record).params<{ Item: Record<string, unknown> }>();
      task2Data.push(params.Item);
      inserts.push(
        tasks2
          .put(record)
          .go()
          .then((res) => {
            loadedTasks2.push(res.data);
          }),
      );
    }
    await Promise.all(inserts);
  });

  describe("entity queries via async iteration should match promise-based results", () => {
    it("should iterate all pages for an entity query and match go() results", async () => {
      const employee = employees[0];
      const promiseResult = await tasks.query
        .assigned({ employee })
        .go({ pages: "all" });

      const iteratedItems: TaskItem[] = [];
      for await (const page of tasks.query.assigned({ employee }).go({
        pages: "all",
      })) {
        iteratedItems.push(...page.data);
      }

      expect(iteratedItems).to.have.length(promiseResult.data.length);
    });

    it("should iterate all pages for a project query and match go() results", async () => {
      const project = projects[0];
      const promiseResult = await tasks.query
        .projects({ project })
        .go({ pages: "all" });

      const iteratedItems: TaskItem[] = [];
      for await (const page of tasks.query.projects({ project }).go({
        pages: "all",
      })) {
        iteratedItems.push(...page.data);
      }

      expect(iteratedItems).to.have.length(promiseResult.data.length);
    });

    it("should iterate pages with a limit option", async () => {
      const employee = employees[0];
      const limit = 2;
      const iteratedItems: TaskItem[] = [];
      for await (const page of tasks.query.assigned({ employee }).go({
        pages: "all",
        limit,
      })) {
        expect(page.data.length).to.be.at.most(limit);
        iteratedItems.push(...page.data);
      }

      const promiseResult = await tasks.query
        .assigned({ employee })
        .go({ pages: "all", limit });

      expect(iteratedItems).to.have.length(promiseResult.data.length);
    });

    it("should iterate pages with a count option", async () => {
      const employee = employees[0];
      const count = 5;

      const iteratedItems: TaskItem[] = [];
      for await (const page of tasks.query.assigned({ employee }).go({
        count,
      })) {
        iteratedItems.push(...page.data);
      }

      const promiseResult = await tasks.query
        .assigned({ employee })
        .go({ count });

      expect(iteratedItems).to.have.length(promiseResult.data.length);
      expect(iteratedItems).to.have.length(count);
    });

    it("should iterate without overlapping values", async () => {
      const employee = employees[0];
      const limit = 5;
      const keys = new Set<string>();
      const allItems: TaskItem[] = [];

      for await (const page of tasks.query.assigned({ employee }).go({
        pages: "all",
        limit,
      })) {
        for (const item of page.data) {
          const key = item.task + item.project + item.employee;
          keys.add(key);
          allItems.push(item);
        }
      }

      expect(allItems).to.have.length(keys.size);
    });

    it("should provide a cursor on each page", async () => {
      const employee = employees[0];
      const limit = 3;
      let pageCount = 0;

      for await (const page of tasks.query.assigned({ employee }).go({
        pages: "all",
        limit,
      })) {
        pageCount++;
        expect(page).to.have.property("cursor");
        expect(page).to.have.property("data");
        if (page.cursor !== null) {
          expect(typeof page.cursor).to.equal("string");
        }
      }

      expect(pageCount).to.be.greaterThan(0);
    });

    it("should respect the pages option to limit number of pages iterated", async () => {
      const employee = employees[0];
      const limit = 3;
      const maxPages = 2;
      let pageCount = 0;

      for await (const _page of tasks.query.assigned({ employee }).go({
        pages: maxPages,
        params: { Limit: limit },
      })) {
        pageCount++;
      }

      expect(pageCount).to.be.at.most(maxPages);
    });
  });

  describe("scan via async iteration should match promise-based results", () => {
    it("should iterate all pages for a scan and match go() results", async () => {
      const promiseResult = await tasks.scan.go({ pages: "all" });

      const iteratedItems: TaskItem[] = [];
      for await (const page of tasks.scan.go({ pages: "all" })) {
        iteratedItems.push(...page.data);
      }

      expect(iteratedItems).to.have.length(promiseResult.data.length);
    });

    it("should iterate scan pages with a limit option", async () => {
      const limit = 10;
      const iteratedItems: TaskItem[] = [];
      let pageCount = 0;

      for await (const page of tasks.scan.go({ pages: "all", limit })) {
        expect(page.data.length).to.be.at.most(limit);
        iteratedItems.push(...page.data);
        pageCount++;
      }

      expect(pageCount).to.be.greaterThan(1);
      expect(iteratedItems.length).to.be.greaterThan(0);
    });
  });

  describe("collection queries via async iteration should match promise-based results", () => {
    it("should iterate all pages for a collection query and match go() results", async () => {
      const employee = employees[0];
      const promiseResult = await service.collections
        .assignments({ employee })
        .go({ pages: "all" });

      const iteratedTasks: TaskItem[] = [];
      const iteratedTasks2: TaskItem[] = [];

      for await (const page of service.collections
        .assignments({ employee })
        .go({ pages: "all" })) {
        if (page.data.tasks) {
          iteratedTasks.push(...page.data.tasks);
        }
        if (page.data.tasks2) {
          iteratedTasks2.push(...page.data.tasks2);
        }
      }

      expect(iteratedTasks).to.have.length(promiseResult.data.tasks.length);
      expect(iteratedTasks2).to.have.length(promiseResult.data.tasks2.length);
    });

    it("should iterate collection pages with a limit option", async () => {
      const employee = employees[0];
      const limit = 5;

      const iteratedTasks: TaskItem[] = [];
      const iteratedTasks2: TaskItem[] = [];
      let pageCount = 0;

      for await (const page of service.collections
        .assignments({ employee })
        .go({ pages: "all", limit })) {
        if (page.data.tasks) {
          iteratedTasks.push(...page.data.tasks);
        }
        if (page.data.tasks2) {
          iteratedTasks2.push(...page.data.tasks2);
        }
        pageCount++;
      }

      const promiseResult = await service.collections
        .assignments({ employee })
        .go({ pages: "all", limit });

      const totalIterated = iteratedTasks.length + iteratedTasks2.length;
      const totalPromise =
        promiseResult.data.tasks.length + promiseResult.data.tasks2.length;
      expect(totalIterated).to.equal(totalPromise);
      expect(pageCount).to.be.greaterThan(0);
    });

    it("should respect the pages option for collection queries", async () => {
      const employee = employees[0];
      const maxPages = 2;
      let pageCount = 0;

      for await (const _page of service.collections
        .assignments({ employee })
        .go({ pages: maxPages, params: { Limit: 3 } })) {
        pageCount++;
      }

      expect(pageCount).to.be.at.most(maxPages);
    });
  });

  describe("mock-based async iteration tests", () => {
    it("should return exact 'count' specified via async iteration", async () => {
      const ExclusiveStartKey = { key: "hi" };
      const [one, two, three, four, five, six] = taskData;
      const { client: mockClient, calls } = createClient({
        mockResponses: [
          { Items: [one, two], LastEvaluatedKey: ExclusiveStartKey },
          { Items: [three], LastEvaluatedKey: ExclusiveStartKey },
          { Items: [], LastEvaluatedKey: ExclusiveStartKey },
          { Items: [four, five, six] },
          { Items: [], LastEvaluatedKey: ExclusiveStartKey },
        ],
      });
      const count = 5;
      const entity = new Entity(TasksModel, { client: mockClient, table });
      const iteratedItems: TaskItem[] = [];
      for await (const page of entity.query.task({ task: "my_task" }).go({
        count,
      })) {
        iteratedItems.push(...page.data);
      }
      expect(iteratedItems).to.be.an("array").with.length(5);
      expect(calls).to.have.length(4);
    });

    it("should stop paginating when LastEvaluatedKey is no longer returned via async iteration", async () => {
      const ExclusiveStartKey = { key: "hi" };
      const [one, two, three, four] = taskData;
      const { client: mockClient, calls } = createClient({
        mockResponses: [
          { Items: [one, two], LastEvaluatedKey: ExclusiveStartKey },
          { Items: [three], LastEvaluatedKey: ExclusiveStartKey },
          { Items: [], LastEvaluatedKey: ExclusiveStartKey },
          { Items: [four] },
          { Items: [], LastEvaluatedKey: ExclusiveStartKey },
        ],
      });
      const count = 5;
      const entity = new Entity(TasksModel, { client: mockClient, table });
      const iteratedItems: TaskItem[] = [];
      for await (const page of entity.query.task({ task: "my_task" }).go({
        count,
      })) {
        iteratedItems.push(...page.data);
      }
      expect(iteratedItems).to.be.an("array").with.length(4);
      expect(calls).to.have.length(4);
    });

    it("entity query should continue to iterate until LastEvaluatedKey is not returned", async () => {
      const ExclusiveStartKey = { key: "hi" };
      const { client: mockClient, calls } = createClient({
        mockResponses: [
          { Items: [], LastEvaluatedKey: ExclusiveStartKey },
          { Items: [], LastEvaluatedKey: ExclusiveStartKey },
          { Items: [], LastEvaluatedKey: ExclusiveStartKey },
          { Items: [] },
          { Items: [], LastEvaluatedKey: ExclusiveStartKey },
        ],
      });
      const entity = new Entity(TasksModel, { client: mockClient, table });
      const allItems: TaskItem[] = [];
      let pageCount = 0;
      for await (const page of entity.query
        .task({ task: "my_task" })
        .go({ pages: "all" })) {
        allItems.push(...page.data);
        pageCount++;
      }
      expect(allItems).to.be.an("array").with.length(0);
      expect(calls).to.have.length(4);
      expect(pageCount).to.equal(4);
    });

    it("entity query should stop iterating when pages limit is reached", async () => {
      const ExclusiveStartKey = { key: "hi" };
      const { client: mockClient, calls } = createClient({
        mockResponses: [
          { Items: [], LastEvaluatedKey: ExclusiveStartKey },
          { Items: [], LastEvaluatedKey: ExclusiveStartKey },
          { Items: [], LastEvaluatedKey: ExclusiveStartKey },
          { Items: [] },
          { Items: [], LastEvaluatedKey: ExclusiveStartKey },
        ],
      });
      const pages = 2;
      const entity = new Entity(TasksModel, { client: mockClient, table });
      const allItems: TaskItem[] = [];
      let pageCount = 0;
      for await (const page of entity.query
        .task({ task: "my_task" })
        .go({ pages })) {
        allItems.push(...page.data);
        pageCount++;
      }
      expect(allItems).to.be.an("array").with.length(0);
      expect(calls).to.have.length(pages);
      expect(pageCount).to.equal(pages);
    });

    it("collection query should continue to iterate until LastEvaluatedKey is not returned", async () => {
      const ExclusiveStartKey = { key: "hi" };
      const { client: mockClient, calls } = createClient({
        mockResponses: [
          { Items: [], LastEvaluatedKey: ExclusiveStartKey },
          { Items: [], LastEvaluatedKey: ExclusiveStartKey },
          { Items: [], LastEvaluatedKey: ExclusiveStartKey },
          { Items: [] },
          { Items: [], LastEvaluatedKey: ExclusiveStartKey },
        ],
      });
      const mockTasks = new Entity(TasksModel, { client: mockClient, table });
      const mockTasks2 = new Entity(makeTasksModel(), {
        client: mockClient,
        table,
      });
      const mockService = new Service({ mockTasks, mockTasks2 });
      const employee = "my_employee";
      let pageCount = 0;
      for await (const _page of mockService.collections
        .assignments({ employee })
        .go({ pages: "all" })) {
        pageCount++;
      }
      expect(calls).to.have.length(4);
      expect(pageCount).to.equal(4);
    });

    it("collection query should stop iterating when pages limit is reached", async () => {
      const ExclusiveStartKey = { key: "hi" };
      const { client: mockClient, calls } = createClient({
        mockResponses: [
          { Items: [], LastEvaluatedKey: ExclusiveStartKey },
          { Items: [], LastEvaluatedKey: ExclusiveStartKey },
          { Items: [], LastEvaluatedKey: ExclusiveStartKey },
          { Items: [] },
          { Items: [], LastEvaluatedKey: ExclusiveStartKey },
        ],
      });
      const pages = 2;
      const mockTasks = new Entity(TasksModel, { client: mockClient, table });
      const mockTasks2 = new Entity(makeTasksModel(), {
        client: mockClient,
        table,
      });
      const mockService = new Service({ mockTasks, mockTasks2 });
      const employee = "my_employee";
      let pageCount = 0;
      for await (const _page of mockService.collections
        .assignments({ employee })
        .go({ pages })) {
        pageCount++;
      }
      expect(calls).to.have.length(pages);
      expect(pageCount).to.equal(pages);
    });

    it("entity query should only count owned entities to fulfill limit via async iteration", async () => {
      const ExclusiveStartKey = { key: "hi" };
      const [one, two, three, four, five, six] = taskData;
      const { client: mockClient, calls } = createClient({
        mockResponses: [
          {
            Items: [{}, {}, one, two, three, {}, {}],
            LastEvaluatedKey: ExclusiveStartKey,
          },
          {
            Items: [four, five, six, {}],
            LastEvaluatedKey: ExclusiveStartKey,
          },
          { Items: [], LastEvaluatedKey: ExclusiveStartKey },
          { Items: [] },
          { Items: [], LastEvaluatedKey: ExclusiveStartKey },
        ],
      });
      const pages = "all";
      const limit = 5;
      const entity = new Entity(TasksModel, { client: mockClient, table });
      const allItems: TaskItem[] = [];
      for await (const page of entity.query
        .task({ task: "my_task" })
        .go({ pages, limit })) {
        allItems.push(...page.data);
      }
      expect(allItems).to.be.an("array").with.length(6);
      expect(calls).to.have.length(4);
    });

    it("collection query should only count owned entities to fulfill limit via async iteration", async () => {
      const ExclusiveStartKey = { key: "hi" };
      const collectionTasks = new Entity(makeTasksModel(), {
        client,
        table,
      });
      const collectionTasks2 = new Entity(makeTasksModel(), {
        client,
        table,
      });

      type CollectionTaskItem = EntityItem<typeof collectionTasks>;

      const collectionTaskData: Record<string, unknown>[] = [];
      const collectionTask2Data: Record<string, unknown>[] = [];
      for (let i = 0; i < 10; i++) {
        const record = generateRandomRecord();
        const params = collectionTasks.put(record).params<{ Item: Record<string, unknown> }>();
        collectionTaskData.push(params.Item);
        await collectionTasks.put(record).go();
      }
      for (let i = 0; i < 10; i++) {
        const record = generateRandomRecord();
        const params = collectionTasks2.put(record).params<{ Item: Record<string, unknown> }>();
        collectionTask2Data.push(params.Item);
        await collectionTasks2.put(record).go();
      }
      const [three, four, five, six] = collectionTaskData;
      const [seven, eight, nine] = collectionTask2Data;
      const created = createClient({
        mockResponses: [
          {
            Items: [{}, {}, three, seven, eight, nine, {}, {}],
            LastEvaluatedKey: ExclusiveStartKey,
          },
          {
            Items: [four, five, six, {}],
            LastEvaluatedKey: ExclusiveStartKey,
          },
          { Items: [], LastEvaluatedKey: ExclusiveStartKey },
          { Items: [] },
          { Items: [], LastEvaluatedKey: ExclusiveStartKey },
        ],
      });
      const mockService = new Service(
        { collectionTasks, collectionTasks2 },
        { client: created.client, table },
      );
      const pages = "all";
      const limit = 6;
      const employee = "my_employee";
      const iteratedTasks: CollectionTaskItem[] = [];
      const iteratedTasks2: CollectionTaskItem[] = [];
      for await (const page of mockService.collections
        .assignments({ employee })
        .go({ pages, limit })) {
        if (page.data.collectionTasks) {
          iteratedTasks.push(...page.data.collectionTasks);
        }
        if (page.data.collectionTasks2) {
          iteratedTasks2.push(...page.data.collectionTasks2);
        }
      }
      expect(iteratedTasks).to.be.an("array").with.length(4);
      expect(iteratedTasks2).to.be.an("array").with.length(3);
      expect(created.calls).to.have.length(4);
    });
  });

  describe("null cursors via async iteration", () => {
    const entity1 = new Entity(
      {
        model: {
          entity: uuid(),
          version: "1",
          service: "null-cursor",
        },
        attributes: {
          id: {
            type: "string" as const,
          },
        },
        indexes: {
          record: {
            collection: "test" as const,
            pk: {
              field: "pk",
              composite: ["id"] as const,
            },
            sk: {
              field: "sk",
              composite: [] as const,
            },
          },
        },
      },
      { table, client },
    );
    const entity2 = new Entity(
      {
        model: {
          entity: uuid(),
          version: "1",
          service: "null-cursor",
        },
        attributes: {
          id: {
            type: "string" as const,
          },
        },
        indexes: {
          record: {
            collection: "test" as const,
            pk: {
              field: "pk",
              composite: ["id"] as const,
            },
            sk: {
              field: "sk",
              composite: [] as const,
            },
          },
        },
      },
      { table, client },
    );

    const nullCursorService = new Service({ entity1, entity2 });

    const id = uuid();

    const queries = [
      ["query operation using default execution options", () => entity1.query.record({ id }).go()],
      ["query operation with includeKeys flag", () => entity1.query.record({ id }).go({ data: "includeKeys" })],
      ["query operation with ignoreOwnership flag", () => entity1.query.record({ id }).go({ ignoreOwnership: true })],
      ["match query using default execution options", () => entity1.match({ id }).go()],
      ["match query with includeKeys flag", () => entity1.match({ id }).go({ data: "includeKeys" })],
      ["match query with ignoreOwnership flag", () => entity1.match({ id }).go({ ignoreOwnership: true })],
      ["find query using default execution options", () => entity1.find({ id }).go()],
      ["find query with includeKeys flag", () => entity1.find({ id }).go({ data: "includeKeys" })],
      ["find query with ignoreOwnership flag", () => entity1.find({ id }).go({ ignoreOwnership: true })],
      ["collection query using default execution options", () => nullCursorService.collections.test({ id }).go()],
      ["collection query with includeKeys flag", () => nullCursorService.collections.test({ id }).go({ data: "includeKeys" })],
      ["collection query with ignoreOwnership flag", () => nullCursorService.collections.test({ id }).go({ ignoreOwnership: true })],
    ] as const;

    for (const [variation, query] of queries) {
      it(`should return a null cursor on each page when async iterating ${variation}`, async () => {
        for await (const page of query()) {
          expect(page.cursor).to.be.null;
        }
      });
    }
  });

  describe("cursor type consistency via async iteration", () => {
    it("cursor should always be string or null on each iterated page", async () => {
      const entity1 = new Entity(TasksModel, { table });
      const createParams = entity1
        .create({
          task: uuid(),
          project: uuid(),
          employee: uuid(),
          points: 5,
        })
        .params<{ Item: { pk: string; sk: string } }>();

      const ExclusiveStartKey = {
        pk: createParams.Item.pk,
        sk: createParams.Item.sk,
      };
      const { client: mockClient } = createClient({
        mockResponses: [
          { Items: [], LastEvaluatedKey: ExclusiveStartKey },
          { Items: [], LastEvaluatedKey: ExclusiveStartKey },
          { Items: [], LastEvaluatedKey: ExclusiveStartKey },
          { Items: [] },
          { Items: [], LastEvaluatedKey: ExclusiveStartKey },
        ],
      });
      const entity = new Entity(TasksModel, { client: mockClient, table });
      let pageCount = 0;
      for await (const page of entity.query
        .task({ task: "my_task" })
        .go({ pages: "all" })) {
        pageCount++;
        if (page.cursor !== null) {
          expect(typeof page.cursor).to.equal("string");
        } else {
          expect(page.cursor).to.equal(null);
        }
      }
      expect(pageCount).to.be.greaterThan(1);
    });
  });

  describe("async iteration error handling", () => {
    it("should require a dynamodb client to iterate", async () => {
      const noClientEntity = new Entity(makeTasksModel());
      let errorMessage: string | undefined;
      try {
        for await (const _page of noClientEntity.query
          .task({ task: "abc" })
          .go()) {
          // should not reach here
        }
      } catch (err) {
        errorMessage = err instanceof Error ? err.message : String(err);
      }
      expect(errorMessage).to.equal(
        "No client defined on model or provided in query options - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#no-client-defined-on-model",
      );
    });

    it("should throw if 'pages' option is invalid when iterating", async () => {
      const employee = "employee";
      const message =
        "Query option 'pages' must be of type 'number' and greater than zero or the string value 'all' - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#invalid-pages-option";

      for (const invalidPages of [-1, 0, "weasel"] as const) {
        let errorMessage: string | undefined;
        try {
          for await (const _page of tasks.query
            .assigned({ employee })
            // @ts-expect-error testing invalid pages values
            .go({ pages: invalidPages })) {
            // should not reach here
          }
        } catch (err) {
          errorMessage = err instanceof Error ? err.message : String(err);
        }
        expect(errorMessage).to.equal(message);
      }
    });

    it("should throw if 'pages' option is invalid on collection queries when iterating", async () => {
      const employee = "employee";
      const message =
        "Query option 'pages' must be of type 'number' and greater than zero or the string value 'all' - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#invalid-pages-option";

      for (const invalidPages of [-1, 0, "weasel"] as const) {
        let errorMessage: string | undefined;
        try {
          for await (const _page of service.collections
            .assignments({ employee })
            // @ts-expect-error testing invalid pages values
            .go({ pages: invalidPages })) {
            // should not reach here
          }
        } catch (err) {
          errorMessage = err instanceof Error ? err.message : String(err);
        }
        expect(errorMessage).to.equal(message);
      }
    });
  });

  describe("ElectroQueryResult dual consumption", () => {
    it("should be consumable as a promise via await", async () => {
      const employee = employees[0];
      const result = await tasks.query.assigned({ employee }).go({ pages: "all" });
      expect(result).to.have.property("data");
      expect(result).to.have.property("cursor");
      expect(result.data).to.be.an("array");
    });

    it("should be consumable as a promise via .then()", async () => {
      const employee = employees[0];
      const data = await tasks.query
        .assigned({ employee })
        .go({ pages: "all" })
        .then((res) => res.data);
      expect(data).to.be.an("array");
    });

    it("should be consumable as a promise via .catch()", async () => {
      const noClientEntity = new Entity(makeTasksModel());
      const result = await noClientEntity.query
        .task({ task: "abc" })
        .go()
        .then(() => ({ success: true, message: "" }))
        .catch((err: Error) => ({ success: false, message: err.message }));
      expect(result.success).to.be.false;
      expect(result.message).to.include("No client defined on model");
    });

    it("should be consumable as a promise via .finally()", async () => {
      const employee = employees[0];
      let finallyCalled = false;
      await tasks.query
        .assigned({ employee })
        .go({ pages: "all" })
        .finally(() => {
          finallyCalled = true;
        });
      expect(finallyCalled).to.be.true;
    });

    it("should be consumable as an async iterable via for-await-of", async () => {
      const employee = employees[0];
      let pageCount = 0;
      for await (const page of tasks.query.assigned({ employee }).go({
        pages: "all",
      })) {
        pageCount++;
        expect(page).to.have.property("data");
        expect(page).to.have.property("cursor");
      }
      expect(pageCount).to.be.greaterThan(0);
    });

    it("promise consumption and async iteration should return equivalent data", async () => {
      const employee = employees[0];
      const query = () =>
        tasks.query.assigned({ employee }).go({ pages: "all" });

      const promiseResult = await query();

      const iteratedItems: TaskItem[] = [];
      for await (const page of query()) {
        iteratedItems.push(...page.data);
      }

      expect(iteratedItems).to.have.length(promiseResult.data.length);
    });

    it("should handle .then() chaining correctly", async () => {
      const employee = employees[0];
      const length = await tasks.query
        .assigned({ employee })
        .go({ pages: "all" })
        .then((res) => res.data)
        .then((data) => data.length);
      expect(length).to.be.a("number");
      expect(length).to.be.greaterThan(0);
    });

    it("should handle .catch() on error in .then() chain", async () => {
      const employee = employees[0];
      const result = await tasks.query
        .assigned({ employee })
        .go({ pages: "all" })
        .then((): string => {
          throw new Error("intentional error");
        })
        .catch((err: Error) => err.message);
      expect(result).to.equal("intentional error");
    });
  });

  describe("raw data mode via async iteration", () => {
    it("should return raw DynamoDB response when iterating with data: 'raw'", async () => {
      const employee = employees[0];
      const pages: Record<string, unknown>[] = [];
      for await (const page of tasks.query.assigned({ employee }).go({
        data: "raw",
      })) {
        pages.push(page as Record<string, unknown>);
      }
      expect(pages).to.have.length(1);
      const raw = pages[0];
      expect(raw).to.have.property("cursor");
      const data = raw.data as Record<string, unknown>;
      expect(data).to.have.property("Items");
      expect(data).to.have.property("Count");
      expect(data).to.have.property("ScannedCount");
    });

    it("should return raw DynamoDB response when scanning with data: 'raw'", async () => {
      const pages: Record<string, unknown>[] = [];
      for await (const page of tasks.scan.go({
        data: "raw",
      })) {
        pages.push(page as Record<string, unknown>);
      }
      expect(pages).to.have.length(1);
      const raw = pages[0];
      expect(raw).to.have.property("cursor");
      const data = raw.data as Record<string, unknown>;
      expect(data).to.have.property("Items");
      expect(data).to.have.property("Count");
      expect(data).to.have.property("ScannedCount");
    });

    it("should return raw DynamoDB response when iterating a collection with data: 'raw'", async () => {
      const employee = employees[0];
      const pages: Record<string, unknown>[] = [];
      for await (const page of service.collections
        .assignments({ employee })
        .go({ data: "raw" })) {
        pages.push(page as Record<string, unknown>);
      }
      expect(pages).to.have.length(1);
      const raw = pages[0];
      expect(raw).to.have.property("cursor");
      const data = raw.data as Record<string, unknown>;
      expect(data).to.have.property("Items");
      expect(data).to.have.property("Count");
      expect(data).to.have.property("ScannedCount");
    });

    it("raw data via iteration should match raw data via promise", async () => {
      const employee = employees[0];
      const promiseResult = await tasks.query
        .assigned({ employee })
        .go({ data: "raw" });

      const pages: Record<string, unknown>[] = [];
      for await (const page of tasks.query.assigned({ employee }).go({
        data: "raw",
      })) {
        pages.push(page as Record<string, unknown>);
      }

      expect(pages).to.have.length(1);
      const rawPromise = promiseResult as unknown as { data: { Items: unknown[] } };
      const rawIterated = pages[0] as { data: { Items: unknown[] } };
      expect(rawIterated.data.Items).to.have.length(
        rawPromise.data.Items.length,
      );
    });
  });

  describe("AWS error enrichment during async iteration", () => {
    it("should enrich AWS errors thrown during iteration", async () => {
      const awsError = new Error("Simulated DynamoDB throttle");
      const { client: mockClient } = createClient();
      (mockClient as Record<string, unknown>).query = () => ({
        promise: () => Promise.reject(awsError),
      });

      const entity = new Entity(TasksModel, { client: mockClient, table });
      let caughtError: Error | undefined;
      try {
        for await (const _page of entity.query
          .task({ task: "my_task" })
          .go()) {
          // should not reach here
        }
      } catch (err) {
        caughtError = err instanceof Error ? err : undefined;
      }
      expect(caughtError).to.be.instanceOf(Error);
      expect(caughtError!.message).to.include("Error thrown by DynamoDB client");
      expect(caughtError!.message).to.include("Simulated DynamoDB throttle");
    });

    it("should enrich AWS errors thrown during scan iteration", async () => {
      const awsError = new Error("Service unavailable");
      const { client: mockClient } = createClient();
      (mockClient as Record<string, unknown>).scan = () => ({
        promise: () => Promise.reject(awsError),
      });

      const entity = new Entity(TasksModel, { client: mockClient, table });
      let caughtError: Error | undefined;
      try {
        for await (const _page of entity.scan.go()) {
          // should not reach here
        }
      } catch (err) {
        caughtError = err instanceof Error ? err : undefined;
      }
      expect(caughtError).to.be.instanceOf(Error);
      expect(caughtError!.message).to.include("Error thrown by DynamoDB client");
      expect(caughtError!.message).to.include("Service unavailable");
    });

    it("should enrich AWS errors thrown mid-pagination during iteration", async () => {
      const ExclusiveStartKey = { key: "hi" };
      const [one, two] = taskData;
      const awsError = new Error("Provisioned throughput exceeded");

      let callCount = 0;
      const { client: mockClient } = createClient();
      (mockClient as Record<string, unknown>).query = (_params: DocumentClient.QueryInput) => ({
        promise: async () => {
          callCount++;
          if (callCount === 1) {
            return { Items: [one, two], LastEvaluatedKey: ExclusiveStartKey };
          }
          throw awsError;
        },
      });

      const entity = new Entity(TasksModel, { client: mockClient, table });
      const collectedItems: TaskItem[] = [];
      let caughtError: Error | undefined;
      try {
        for await (const page of entity.query
          .task({ task: "my_task" })
          .go({ pages: "all" })) {
          collectedItems.push(...page.data);
        }
      } catch (err) {
        caughtError = err instanceof Error ? err : undefined;
      }
      expect(collectedItems).to.have.length(2);
      expect(caughtError).to.be.instanceOf(Error);
      expect(caughtError!.message).to.include("Error thrown by DynamoDB client");
      expect(caughtError!.message).to.include(
        "Provisioned throughput exceeded",
      );
    });

    it("should enrich AWS errors when consuming as promise", async () => {
      const awsError = new Error("Access denied");
      const { client: mockClient } = createClient();
      (mockClient as Record<string, unknown>).query = () => ({
        promise: () => Promise.reject(awsError),
      });

      const entity = new Entity(TasksModel, { client: mockClient, table });
      let caughtError: Error | undefined;
      try {
        await entity.query.task({ task: "my_task" }).go();
      } catch (err) {
        caughtError = err instanceof Error ? err : undefined;
      }
      expect(caughtError).to.be.instanceOf(Error);
      expect(caughtError!.message).to.include("Error thrown by DynamoDB client");
      expect(caughtError!.message).to.include("Access denied");
    });
  });

  describe("early break from async iteration", () => {
    it("should allow breaking out of async iteration early", async () => {
      const employee = employees[0];
      let pageCount = 0;
      for await (const _page of tasks.query.assigned({ employee }).go({
        pages: "all",
        limit: 2,
      })) {
        pageCount++;
        if (pageCount >= 2) {
          break;
        }
      }
      expect(pageCount).to.equal(2);
    });

    it("should allow breaking out of scan iteration early", async () => {
      let pageCount = 0;
      for await (const _page of tasks.scan.go({ pages: "all", limit: 5 })) {
        pageCount++;
        if (pageCount >= 1) {
          break;
        }
      }
      expect(pageCount).to.equal(1);
    });
  });
});
