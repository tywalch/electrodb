process.env.AWS_NODEJS_CONNECTION_REUSE_ENABLED = "1";
import { Entity, Service } from "../index";
import { expect } from "chai";
import {v3, v4 as uuid} from "uuid";
import { DocumentClient as V2Client } from "aws-sdk/clients/dynamodb";
import { DynamoDBClient as V3Client  } from '@aws-sdk/client-dynamodb';

const c = require('../src/client');

const table = "electro";

const v2Client = new V2Client({
    region: "us-east-1",
    endpoint: process.env.LOCAL_DYNAMO_ENDPOINT
});

const v3Client = new V3Client({
    region: "us-east-1",
    endpoint: process.env.LOCAL_DYNAMO_ENDPOINT
});

const clients = [
    [c.DocumentClientVersions.v2, v2Client],
    [c.DocumentClientVersions.v3, v3Client]
];

function createEntity(client: (typeof v2Client | typeof v3Client)) {
    return new Entity({
        model: {
            entity: uuid(),
            service: 'client-test',
            version: '1'
        },
        attributes: {
            prop1: {
                type: 'string'
            },
            prop2: {
                type: 'string'
            },
            prop3: {
                type: 'set',
                items: 'string',
            }
        },
        indexes: {
            record: {
                pk: {
                    field: 'pk',
                    composite: ['prop1']
                },
                sk: {
                    field: 'sk',
                    composite: ['prop2']
                }
            }
        }
    }, {table, client});
}

describe('dynamodb sdk client compatibility', () => {
    for (const [version, client] of clients) {
        describe(`${version} client`, () => {
            const entity = createEntity(client);

            it('should create valid params for the get method', async () => {
                const prop1 = uuid();
                const prop2 = uuid();
                const results = await entity.get({
                    prop1,
                    prop2,
                }).go();

                expect(results).to.be.null;
            });

            it('should create valid params for the put method', async () => {
                const prop1 = uuid();
                const prop2 = uuid();
                const prop3 = [uuid()];
                const results = await entity.put({
                    prop1,
                    prop2,
                    prop3,
                }).go({response: 'all_old'});

                expect(results).to.be.null;
            });

            it('should create valid params for the update method', async () => {
                const prop1 = uuid();
                const prop2 = uuid();
                const prop3 = [uuid()];
                const results = await entity.update({prop1, prop2})
                    .set({
                        prop3,
                    })
                    .go({response: 'all_new'});

                expect(results).to.deep.equal({
                    prop1,
                    prop2,
                    prop3,
                });
            });

            it('should create valid params for the delete method', async () => {
                const prop1 = uuid();
                const prop2 = uuid();
                const results = await entity.delete({
                    prop1,
                    prop2,
                }).go({response: 'all_old'});

                expect(results).to.be.null;
            });

            it('should create valid params for the batchWrite (put) method', async () => {
                const prop1 = uuid();
                const prop2 = uuid();
                const prop3 = [uuid()];
                const results = await entity.put([{
                    prop1,
                    prop2,
                    prop3,
                }]).go({});
            });

            it('should create valid params for the batchWrite (delete) method', async () => {
                const prop1 = uuid();
                const prop2 = uuid();
                const results = await entity.delete([{
                    prop1,
                    prop2,
                }]).go({});
            });

            it('should create valid params for the batchGet method', async () => {
                const prop1 = uuid();
                const prop2 = uuid();
                const results = await entity.get([{
                    prop1,
                    prop2,
                }]).go();
            });

            it('should create valid params for the scan method', async () => {
                const results = await entity.scan.go();
                expect(results).to.be.an('array');
                expect(results.length).to.be.greaterThan(0);
            });

            it('should create valid params for the query method', async () => {
                const prop1 = uuid();
                const prop2 = uuid();
                const results = await entity.query.record({prop1, prop2}).go();
                expect(results).to.be.an('array');
            });
        });

        describe(`user interactions with Set types with ${version} client`, () => {
            it('should accept and return arrays for sets when creating new entities', async () => {
                const entity = createEntity(client);
                const prop1 = uuid();
                const prop2 = uuid();
                const prop3 = [uuid()];
                const putRecord = await entity.put({prop1, prop2, prop3}).go();
                const getRecord = await entity.get({prop1, prop2}).go();
                if (getRecord) {
                    expect(getRecord.prop3).to.be.an('array').with.length(1);
                    expect(putRecord.prop3).to.deep.equal(prop3);
                }
            });

            it('should pass arrays on all attribute callbacks', async () => {
                const prop1 = uuid();
                const prop2 = uuid();
                const prop3 = [uuid()];
                const called = {
                    get: false,
                    set: false,
                    validate: false
                };
                const entity = new Entity({
                    model: {
                        entity: uuid(),
                        service: 'client-test',
                        version: '1'
                    },
                    attributes: {
                        prop1: {
                            type: 'string'
                        },
                        prop2: {
                            type: 'string'
                        },
                        prop3: {
                            get: (val) => {
                                expect(val).to.be.an('array').and.have.length(1);
                                expect(val).to.deep.equal(prop3);
                                called.get = true;
                                return val;
                            },
                            set: (val) => {
                                expect(val).to.be.an('array').and.have.length(1);
                                expect(val).to.deep.equal(prop3);
                                called.set = true;
                                return val;
                            },
                            validate: (val) => {
                                expect(val).to.be.an('array').and.have.length(1);
                                expect(val).to.deep.equal(prop3);
                                called.validate = true;
                            },
                            type: 'set',
                            items: 'string',
                        }
                    },
                    indexes: {
                        record: {
                            pk: {
                                field: 'pk',
                                composite: ['prop1']
                            },
                            sk: {
                                field: 'sk',
                                composite: ['prop2']
                            }
                        }
                    }
                }, {table, client});
                await entity.put({prop1, prop2, prop3}).go();
                const results = await entity.get({prop1, prop2}).go();
                expect(called.get).to.be.true;
                expect(called.set).to.be.true;
                expect(called.validate).to.be.true;
            });

            it('should add an element to an existing set', async () => {
                const entity = createEntity(client);
                const prop1 = uuid();
                const prop2 = uuid();
                const prop3 = [uuid()];
                const prop3Addition = [uuid()];
                await entity.put({prop1, prop2, prop3}).go();
                const updateRecord = await entity.update({prop1, prop2}).add({
                    prop3: prop3Addition
                }).go({response: 'all_new'});
                expect(updateRecord.prop3).to.be.an('array').with.length(2);
                expect(updateRecord.prop3).to.deep.equal([...prop3Addition, ...prop3]);
            });

            it('should remove an element from an existing set', async () => {
                const entity = createEntity(client);
                const prop1 = uuid();
                const prop2 = uuid();
                const prop3 = [uuid(), uuid()];
                await entity.put({prop1, prop2, prop3}).go();
                const updateRecord = await entity.update({prop1, prop2}).delete({
                    prop3: [prop3[0]]
                }).go({response: 'all_new'});
                expect(updateRecord.prop3).to.be.an('array').with.length(1);
                expect(updateRecord.prop3).to.deep.equal([prop3[1]]);
            });
        });
    }
})