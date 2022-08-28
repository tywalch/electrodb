import { expect } from 'chai';
import {Entity, ElectroEventListener, ElectroEvent, CreateEntityItem, Service } from '../index';
const uuid = require("uuid").v4;
const DynamoDB = require("aws-sdk/clients/dynamodb");
const table = "electro";
const client = new DynamoDB.DocumentClient({
    region: "us-east-1",
    endpoint: process.env.LOCAL_DYNAMO_ENDPOINT
});

type TestLoggerEvents = Map<string, ElectroEvent[]>;

function createLogger(name: string, events: TestLoggerEvents) {
    return (event: ElectroEvent) => {
        const existing = events.get(name) || [];
        existing.push(event);
        events.set(name, existing);
    }
}

function createTestEntity(entity: string = "entity1", logger?: ElectroEventListener, listeners?: ElectroEventListener[]) {
    return new Entity({
        model: {
            entity,
            version: "1",
            service: "test"
        },
        attributes: {
            prop1: {
                type: "string"
            },
            prop2: {
                type: "string"
            },
            prop3: {
                type: "string"
            },
            prop4: {
                type: "string"
            }
        },
        indexes: {
            record: {
                collection: 'testCollection',
                pk: {
                    field: "pk",
                    composite: ["prop1"]
                },
                sk: {
                    field: "sk",
                    composite: ["prop2"]
                }
            }
        }
    }, {client, table, logger, listeners});
}

function createTestService(logger?: ElectroEventListener, listeners?: ElectroEventListener[]) {
    const entity1 = createTestEntity('entity1', logger, listeners);
    const entity2 = createTestEntity('entity1', logger, listeners);
    return new Service({
        entity1,
        entity2,
    }, {client, table, logger, listeners});
}

type TestEntityCreateEntityItem = CreateEntityItem<ReturnType<typeof createTestEntity>>

type TestEventCallback = (events: ElectroEvent[]) => void;

type TestListenerCallbackResponse = {
    test: TestEventCallback;
    success?: boolean;
    page?: boolean;
    query: {
        go: (options: any) => Promise<any>;
        page?: (next: null, options: any) => Promise<any>;
    }
}

type TestEntityInstance = ReturnType<typeof createTestEntity>;
type TestServiceInstance = ReturnType<typeof createTestService>

type TestListenerCallback = (options: {entity: TestEntityInstance, service: TestServiceInstance}) => Promise<TestListenerCallbackResponse>;

type TestEventComparison = {
    calls: number;
    comparison: 'eq' | 'gt' | 'lt';
} | {
    calls: [number, number];
    comparison: 'between'
} | {
    calls: number[],
    comparison: 'in'
}

function applyEventComparisons(options: TestEventComparison, events: ElectroEvent[]) {
    
    switch (options.comparison) {
        case 'eq':
            expect(events).to.have.lengthOf(options.calls);
            break;
        case 'gt':
            expect(events.length).to.be.greaterThan(options.calls);
            break;
        case 'lt':
            expect(events.length).to.be.lessThan(options.calls);
            break;
        case 'between':
            expect(events.length).to.be.greaterThanOrEqual(options.calls[0]).and.lessThanOrEqual(options.calls[1]);
            break;
        case 'in':
            expect(options.calls.includes(events.length)).to.be.true;
            break;
        default:
            throw new Error(`Invalid comparison: '${(options as any).comparison}'`);
    }
}

function equalCallCount(calls: number, events: ElectroEvent[]) {
    const queryEventsListenedTo = events.filter(event => event.type === 'query');
    const resultEventsListenedTo = events.filter(event => event.type === 'results');
    applyEventComparisons({calls, comparison: 'eq'}, queryEventsListenedTo);
    applyEventComparisons({calls, comparison: 'eq'}, resultEventsListenedTo);
}

function inCallCount(calls: number[], events: ElectroEvent[]) {
    const queryEventsListenedTo = events.filter(event => event.type === 'query');
    const resultEventsListenedTo = events.filter(event => event.type === 'results');
    applyEventComparisons({calls, comparison: 'in'}, queryEventsListenedTo);
    applyEventComparisons({calls, comparison: 'in'}, resultEventsListenedTo);
}


type EventProperties = {
    query: Array<keyof Extract<ElectroEvent, {type: 'query'}>>;
    results: Array<keyof Extract<ElectroEvent, {type: 'results'}>>;
}

const eventProperties: EventProperties = {
    query: ['config', 'method', 'params', 'type'],
    results: ['config', 'method', 'results', 'success', 'type']
};

async function testListeners(fn: TestListenerCallback) {
    const events: TestLoggerEvents = new Map();
    const names = {
        modelLogger: 'modelLogger',
        modelListener1: 'modelListener1',
        modelListener2: 'modelListener2',
        optionsLogger: 'optionsLogger',
        optionsListener1: 'optionsListener1',
        optionsListener2: 'optionsListener2',
    };
    const modelLogger = createLogger(names.modelLogger, events);
    const modelListeners = [
        createLogger(names.modelListener1, events),
        createLogger(names.modelListener2, events)
    ];
    const entity = createTestEntity('entity', modelLogger, modelListeners);
    const service = createTestService(modelLogger, modelListeners);
    const optionsLogger = createLogger(names.optionsLogger, events);
    const optionsListeners = [
        createLogger(names.optionsListener1, events),
        createLogger(names.optionsListener2, events)
    ];
    const { test, query, success = true } = await fn({entity, service});
    let error: any;
    try {
        await query.go({
            logger: optionsLogger,
            listeners: optionsListeners,
        });
    } catch(err) {
        error = err;
    }
    if (success && error) {
        throw error;
    } else if (!success && !error) {
        throw new Error('Expected test to fail!');
    }
    for (const name of Object.keys(names)) {
        const listenedTo = events.get(name);
        if (!Array.isArray(listenedTo)) {
            throw new Error('Expected events to be of type array');
        }
        test(listenedTo);
        for (const event of listenedTo) {
            switch (event.type) {
                case 'query':
                    expect(event).to.have.keys(eventProperties.query);
                    break;
                case 'results':
                    expect(event).to.have.keys(eventProperties.results);
                    break;
                default:
                    throw new Error('Unknown event type encountered');
            }
        }
        
    }
}

describe("listener functions", async () => {
    const prop2 = uuid();
    const prop3 = uuid();
    const prop4 = uuid();
    
    it("should notify listeners when put request is made", async () => {
        const prop1 = uuid();
        await testListeners(async ({entity}) => {
            return {
                query: entity.put({ prop1, prop2, prop3, prop4 }),
                test: (events) => equalCallCount(1, events),
            };
        });
    });

    it("should notify listeners when get request is made", async () => {
        const prop1 = uuid();
        await testListeners(async ({entity}) => {
            return {
                query: entity.get({ prop1, prop2 }),
                test: (events) => equalCallCount(1, events)
            };
        });
    });

    it("should notify listeners when an entity query request is made", async () => {
        const prop1 = uuid();
        await testListeners(async ({entity}) => {
            return {
                query: entity.query.record({ prop1 }).gt({ prop2 }),
                test: (events) => equalCallCount(2, events),
            };
        });
    });

    it("should notify listeners when an service entity query request is made", async () => {
        const prop1 = uuid();
        await testListeners(async ({service}) => {
            return {
                query: service.entities.entity1.query.record({ prop1 }).gt({ prop2 }),
                test: (events) => inCallCount([2, 4], events),
            };
        });
    });

    it("should notify listeners when an service query request is made", async () => {
        const prop1 = uuid();
        await testListeners(async ({service}) => {
            return {
                query: service.collections.testCollection({prop1}),
                test: (events) => inCallCount([2, 4], events),
            };
        });
    });

    it("should notify listeners when an entity scan request is made", async () => {
        await testListeners(async ({entity}) => {
            return {
                query: entity.scan,
                test: (events) => equalCallCount(2, events)
            };
        });
    });
    

    it("should notify listeners when update request is made", async () => {
        const prop1 = uuid();
        await testListeners(async ({entity}) => {
            return {
                query: entity.update({prop1, prop2}).set({prop3: uuid()}),
                test: (events) => equalCallCount(1, events)
            };
        });
    });

    it("should notify listeners when delete request is made", async () => {
        await testListeners(async ({entity}) => {
            const prop1 = uuid();
            return {
                query: entity.delete({prop1, prop2}),
                test: (events) => equalCallCount(1, events)
            };
        });
    });

    it("should notify listeners when remove request is made", async () => {
        const prop1 = uuid();
        await testListeners(async ({entity}) => {
            return {
                query: entity.put({ prop1, prop2, prop3, prop4 }),
                test: (events) => equalCallCount(1, events)
            };
        });
        await testListeners(async ({entity}) => {
            return {
                query: entity.remove({prop1, prop2}),
                test: (events) => equalCallCount(1, events)
            };
        });
    });
    
    it("should notify listeners when patch request is made", async () => {
        const prop1 = uuid();
        await testListeners(async ({entity}) => {
            return {
                query: entity.put({ prop1, prop2, prop3, prop4 }),
                test: (events) => equalCallCount(1, events)
            };
        });
        await testListeners(async ({entity}) => {
            return {
                query: entity.patch({prop1, prop2}).set({prop3: uuid()}),
                test: (events) => equalCallCount(1, events)
            };
        });
    });
    it("should notify listeners when create request is made", async () => {
        const prop1 = uuid();
        await testListeners(async ({entity}) => {
            return {
                query: entity.create({prop1, prop2, prop3, prop4}),
                test: (events) => equalCallCount(1, events)
            };
        });
    });
    
    describe("batching methods", () => {
        const maxBatchGet = 100;
        const maxBatchPut = 25;
        const items: TestEntityCreateEntityItem[] = [];
        for (let i = 0; i < maxBatchGet + 1; i++) {
            items.push({
                prop2,
                prop3,
                prop4,
                prop1: uuid(),
            });
        }
        const batchPutTest: TestListenerCallback = async ({entity}) => {
            const callCount = Math.ceil(items.length/maxBatchPut);
            return {
                query: entity.put(items),
                test: (events) => equalCallCount(callCount, events)
            }
        };
        it("should notify listeners when batchGet request is made", async () => {
            const entity = createTestEntity();
            const service = createTestService();
            await batchPutTest({entity, service});
            await testListeners(async ({entity}) => {
                const callCount = Math.ceil(items.length/maxBatchGet);
                const keys = items.map(item => {
                    return {
                        prop1: item.prop1,
                        prop2: item.prop2
                    };
                })
                return {
                    query: {
                        go: async (options) => entity.get(keys).go(options),
                    },
                    test: (events) => equalCallCount(callCount, events)
                };
            });
        });
        it("should notify listeners when batchWrite request is made", async () => {
            await testListeners(batchPutTest);
        });
    });

    describe('listener validation', () => {
        it('should validate that the provided logger is a function', () => {
            const test = () => createTestEntity('entity1', {} as any);
            expect(test).to.throw("Provided listener is not of type 'function' - For more detail on this error reference: https://github.com/tywalch/electrodb#invalid-listener-provided");
        });

        it('should validate that the provided listeners are functions', () => {
            const test = () => createTestEntity('entity', () => {}, [{} as any]);
            expect(test).to.throw("Provided listener is not of type 'function' - For more detail on this error reference: https://github.com/tywalch/electrodb#invalid-listener-provided");
        });
    });

    describe("listener service to entity propagation", () => {
        const table = "electro";
        function createService(options: {logger?: (event: ElectroEvent) => void, listeners?: Array<(event: ElectroEvent) => void>}) {
            const entity1 = new Entity({
                model: {
                    entity: "entity1",
                    service: "service",
                    version: "version"
                },
                attributes: {
                    prop1: {
                        type: "string"
                    },
                    prop2: {
                        type: "string"
                    }
                },
                indexes: {
                    record: {
                        pk: {
                            field: "pk",
                            composite: ["prop1"]
                        },
                        sk: {
                            field: "sk",
                            composite: ["prop2"]
                        }
                    }
                }
            }, {table});

            const entity2 = new Entity({
                model: {
                    entity: "entity2",
                    service: "service",
                    version: "version"
                },
                attributes: {
                    prop1: {
                        type: "string"
                    },
                    prop2: {
                        type: "string"
                    }
                },
                indexes: {
                    record: {
                        pk: {
                            field: "pk",
                            composite: ["prop1"]
                        },
                        sk: {
                            field: "sk",
                            composite: ["prop2"]
                        }
                    }
                }
            }, {table});

            return new Service({entity1, entity2}, {client, ...options});
        }
        it('should pass service provided logger down to entities', async () => {
            const received: ElectroEvent[] = [];
            const logger = (event: ElectroEvent) => {
                received.push(event);
            }
            const service = createService({logger});
            const prop1 = uuid();
            const prop2 = uuid();
            await service.entities.entity1.get({prop1, prop2}).go();
            expect(received.map(item => {
                delete item.config.formatCursor;
                return item;
            })).to.deep.equal([
                {
                    type: 'query',
                    method: 'get',
                    params: { 
                        Key: {
                            pk: `$service#prop1_${prop1}`, 
                            sk: `$entity1_version#prop2_${prop2}`
                        }, 
                        TableName: 'electro' 
                    },
                    config: {
                      terminalOperation: "go",
                      attributes: [],
                      includeKeys: false,
                      originalErr: false,
                      raw: false,
                      params: {},
                      page: {},
                      lastEvaluatedKeyRaw: false,
                      table: undefined,
                      concurrent: undefined,
                      parse: undefined,
                      pager: 'named',
                      unprocessed: 'item',
                      response: 'default',
                      ignoreOwnership: false,
                      _isPagination: false,
                      _isCollectionQuery: false,
                        cursor: null,
                        data: "attributes",
                        pages: 1,
                      listeners: [],
                      preserveBatchOrder: false,
                    }
                },
                {
                    type: 'results',
                    method: 'get',
                    config: {
                      includeKeys: false,
                      originalErr: false,
                      terminalOperation: "go",
                      attributes: [],
                      raw: false,
                      params: {},
                      page: {},
                      lastEvaluatedKeyRaw: false,
                      table: undefined,
                      concurrent: undefined,
                      parse: undefined,
                      pager: 'named',
                      unprocessed: 'item',
                      response: 'default',
                      ignoreOwnership: false,
                      _isPagination: false,
                      _isCollectionQuery: false,
                      cursor: null,
                      data: "attributes",
                      pages: 1,
                      preserveBatchOrder: false,
                      listeners: []
                    },
                    success: true,
                    results: {}
                  }
            ]);
        });

        it('should pass service provided listeners down to entities', async () => {
            const received: ElectroEvent[] = [];
            const listener = (event: ElectroEvent) => {
                received.push(event)
            }
            const service = createService({listeners: [listener]});
            const prop1 = uuid();
            const prop2 = uuid();
            await service.entities.entity1.get({prop1, prop2}).go();

            expect(received.map(item => {
                delete item.config.formatCursor;
                return item;
            })).to.deep.equal([
                {
                    type: 'query',
                    method: 'get',
                    params: { 
                        Key: {
                            pk: `$service#prop1_${prop1}`, 
                            sk: `$entity1_version#prop2_${prop2}`
                        }, 
                        TableName: 'electro' 
                    },
                    config: {
                      includeKeys: false,
                      originalErr: false,
                      terminalOperation: "go",
                      attributes: [],
                      raw: false,
                      params: {},
                      page: {},
                      cursor: null,
                      data: "attributes",
                      pages: 1,
                      lastEvaluatedKeyRaw: false,
                      table: undefined,
                      concurrent: undefined,
                      parse: undefined,
                      pager: 'named',
                      unprocessed: 'item',
                      response: 'default',
                      ignoreOwnership: false,
                      _isPagination: false,
                      _isCollectionQuery: false,
                      preserveBatchOrder: false,

                      listeners: []
                    }
                },
                {
                    type: 'results',
                    method: 'get',
                    config: {
                      terminalOperation: "go",
                      attributes: [],
                      includeKeys: false,
                      originalErr: false,
                      raw: false,
                      params: {},
                      page: {},
                      lastEvaluatedKeyRaw: false,
                      table: undefined,
                      concurrent: undefined,
                      parse: undefined,
                      pager: 'named',
                      unprocessed: 'item',
                      response: 'default',
                      ignoreOwnership: false,
                      _isPagination: false,
                      _isCollectionQuery: false,
                      preserveBatchOrder: false,
                      cursor: null,
                      data: "attributes",
                      pages: 1,
                      listeners: []
                    },
                    success: true,
                    results: {}
                  }
            ]);
        });
    })
});