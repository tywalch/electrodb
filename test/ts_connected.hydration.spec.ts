process.env.AWS_NODEJS_CONNECTION_REUSE_ENABLED = "1";

import {Entity, Service} from "../index";
import {v4 as uuid} from "uuid";
import {expect} from "chai";
import DynamoDB from "aws-sdk/clients/dynamodb";

const client = new DynamoDB.DocumentClient({
    region: "us-east-1",
    endpoint: process.env.LOCAL_DYNAMO_ENDPOINT
});

const createItems = <T>(count: number, generator: (index: number) => T): T[] => {
    return new Array<any>(count).fill({}).map((_, i) => generator(i));
}

type CompareArrayItem = {
    [key: string]: any;
}

const expectEqualArrays = <Left extends CompareArrayItem, Right extends CompareArrayItem, KeyOn extends keyof Left & keyof Right>(keyOn: KeyOn, left: Left[], right: Right[]) => {
    const sortedLeft = [...left].sort((a, z) => JSON.stringify(a[keyOn]) > JSON.stringify(z[keyOn]) ? 1 : -1);
    const sortedRight = [...right].sort((a, z) => JSON.stringify(a[keyOn]) > JSON.stringify(z[keyOn]) ? 1 : -1);
    expect(sortedLeft).to.deep.equal(sortedRight);
}

describe('query hydration', () => {
    const table = 'electro_keysonly';

    // --------------------------- START DEFAULT KEYS --------------------------- //
    describe('default keys', () => {
        it('default keys: should hydrate keys only query index', async () => {
            const entity = new Entity({
                model: {
                    entity: uuid(),
                    version: '1',
                    service: uuid(),
                },
                attributes: {
                    organizationId: {
                        type: 'string'
                    },
                    accountId: {
                        type: 'string'
                    },
                    name: {
                        type: 'string'
                    },
                    description: {
                        type: 'string'
                    },
                    city: {
                        type: 'string'
                    },
                    county: {
                        type: 'string'
                    },
                    state: {
                        type: 'string'
                    }
                },
                indexes: {
                    account: {
                        pk: {
                            field: 'pk',
                            composite: ['organizationId']
                        },
                        sk: {
                            field: 'sk',
                            composite: ['accountId']
                        }
                    },
                    location: {
                        index: 'gsi1pk-gsi1sk-index',
                        pk: {
                            field: 'gsi1pk',
                            composite: ['name']
                        },
                        sk: {
                            field: 'gsi1sk',
                            composite: ['state', 'county', 'city']
                        }
                    }
                }
            }, { table, client });

            const name = uuid();
            const organizationId = uuid();
            const items = createItems(10, () => {
                return {
                    name,
                    organizationId,
                    state: uuid(),
                    county: uuid(),
                    city: uuid(),
                    accountId: uuid(),
                    description: uuid(),
                }
            });

            await entity.put(items).go();
            const results = await entity.query.location({ name }).go({ hydrate: true });
            expectEqualArrays('state', results.data, items);
        });

        it('default keys: should hydrate keys only clustered index', async () => {
            const service = uuid();
            const entityName = uuid();
            const entity = new Entity({
                model: {
                    entity: `normal_${entityName}`,
                    version: '1',
                    service,
                },
                attributes: {
                    organizationId: {
                        type: 'string'
                    },
                    accountId: {
                        type: 'string'
                    },
                    name: {
                        type: 'string'
                    },
                    description: {
                        type: 'string'
                    },
                    city: {
                        type: 'string'
                    },
                    county: {
                        type: 'string'
                    },
                    state: {
                        type: 'string'
                    },
                    kind: {
                        type: 'string'
                    }
                },
                indexes: {
                    account: {
                        pk: {
                            field: 'pk',
                            composite: ['organizationId']
                        },
                        sk: {
                            field: 'sk',
                            composite: ['accountId']
                        }
                    },
                    location: {
                        type: 'clustered',
                        index: 'gsi1pk-gsi1sk-index',
                        pk: {
                            field: 'gsi1pk',
                            composite: ['name']
                        },
                        sk: {
                            field: 'gsi1sk',
                            composite: ['state', 'county', 'city']
                        }
                    }
                }
            }, { table, client });

            const similarEntity = new Entity({
                model: {
                    entity: `similar_${entityName}`,
                    version: '1',
                    service,
                },
                attributes: {
                    organizationId: {
                        type: 'string'
                    },
                    accountId: {
                        type: 'string'
                    },
                    name: {
                        type: 'string'
                    },
                    description: {
                        type: 'string'
                    },
                    city: {
                        type: 'string'
                    },
                    county: {
                        type: 'string'
                    },
                    state: {
                        type: 'string'
                    },
                    kind: {
                        type: 'string'
                    }
                },
                indexes: {
                    account: {
                        pk: {
                            field: 'pk',
                            composite: ['organizationId']
                        },
                        sk: {
                            field: 'sk',
                            composite: ['accountId']
                        }
                    },
                    location: {
                        type: 'clustered',
                        index: 'gsi1pk-gsi1sk-index',
                        pk: {
                            field: 'gsi1pk',
                            composite: ['name']
                        },
                        sk: {
                            field: 'gsi1sk',
                            composite: ['state', 'county', 'city']
                        }
                    }
                }
            }, { table, client });

            const name = uuid();
            const organizationId = uuid();
            const items = createItems(10, () => {
                return {
                    name,
                    organizationId,
                    state: uuid(),
                    county: uuid(),
                    city: uuid(),
                    accountId: uuid(),
                    description: uuid(),
                    kind: 'normal',
                }
            });

            const similarItems = items.map((item) => {
                return {
                    ...item,
                    description: uuid(),
                    kind: 'similar'
                }
            });

            // items and similar items are identical from a keys perspective
            await entity.put(items).go();
            await similarEntity.put(similarItems).go();

            // the fact that these indexes are clustered means that to retrieve these items, and only
            // the items for that entity, electrodb would have had to filter out any items not of that
            // entity to match

            const params = entity.query.location({name}).params();
            delete params.ExpressionAttributeNames['#__edb_e__'];
            delete params.ExpressionAttributeNames['#__edb_v__'];
            delete params.ExpressionAttributeValues[':__edb_e__0'];
            delete params.ExpressionAttributeValues[':__edb_v__0'];
            delete params.FilterExpression;
            const raw = await client.query(params).promise();
            expect(raw.Items).not.to.be.undefined;

            // records should be clustered
            let lastKind: string | undefined;
            raw.Items?.forEach(item => {
                if (lastKind) {
                    expect(lastKind.replace(entityName, '')).not.to.equal(item.sk.replace(entityName, ''));
                }
                lastKind = item.kind;
            });

            const results = await entity.query.location({name}).go({ hydrate: true });
            expectEqualArrays('state', results.data, items);

            const similarResults = await similarEntity.query.location({name}).go({ hydrate: true });
            expectEqualArrays('state', similarResults.data, similarItems);
        });

        it('default keys: should hydrate normal query index without failure', async () => {
            const entity = new Entity({
                model: {
                    entity: uuid(),
                    version: '1',
                    service: uuid(),
                },
                attributes: {
                    organizationId: {
                        type: 'string'
                    },
                    accountId: {
                        type: 'string'
                    },
                    name: {
                        type: 'string'
                    },
                    description: {
                        type: 'string'
                    },
                    city: {
                        type: 'string'
                    },
                    county: {
                        type: 'string'
                    },
                    state: {
                        type: 'string'
                    }
                },
                indexes: {
                    account: {
                        pk: {
                            field: 'pk',
                            composite: ['organizationId']
                        },
                        sk: {
                            field: 'sk',
                            composite: ['accountId']
                        }
                    },
                    location: {
                        type: 'clustered',
                        index: 'gsi1pk-gsi1sk-index',
                        pk: {
                            field: 'gsi1pk',
                            composite: ['name']
                        },
                        sk: {
                            field: 'gsi1sk',
                            composite: ['state', 'county', 'city']
                        }
                    }
                }
            }, { table, client });

            const name = uuid();
            const organizationId = uuid();
            const items = createItems(10, () => {
                return {
                    name,
                    organizationId,
                    state: uuid(),
                    county: uuid(),
                    city: uuid(),
                    accountId: uuid(),
                    description: uuid(),
                }
            });

            await entity.put(items).go();
            const results = await entity.query.account({organizationId}).go({ hydrate: true });
            expectEqualArrays('state', results.data, items);
        });

        it('default keys: should hydrate collection query', async () => {
            const serviceName = uuid();
            const entity1 = new Entity({
                model: {
                    entity: uuid(),
                    version: '1',
                    service: serviceName
                },
                attributes: {
                    organizationId: {
                        type: 'string'
                    },
                    accountId: {
                        type: 'string'
                    },
                    name: {
                        type: 'string'
                    },
                    description: {
                        type: 'string'
                    },
                    city: {
                        type: 'string'
                    },
                    county: {
                        type: 'string'
                    },
                    state: {
                        type: 'string'
                    }
                },
                indexes: {
                    account: {
                        pk: {
                            field: 'pk',
                            composite: ['organizationId']
                        },
                        sk: {
                            field: 'sk',
                            composite: ['accountId']
                        }
                    },
                    location: {
                        collection: 'geographics',
                        index: 'gsi1pk-gsi1sk-index',
                        pk: {
                            field: 'gsi1pk',
                            composite: ['name']
                        },
                        sk: {
                            field: 'gsi1sk',
                            composite: ['state', 'county', 'city']
                        }
                    }
                }
            }, { table, client });

            const entity2 = new Entity({
                model: {
                    entity: uuid(),
                    version: '1',
                    service: serviceName
                },
                attributes: {
                    organizationId: {
                        type: 'string'
                    },
                    accountId: {
                        type: 'string'
                    },
                    name: {
                        type: 'string'
                    },
                    description: {
                        type: 'string'
                    },
                    city: {
                        type: 'string'
                    },
                    county: {
                        type: 'string'
                    },
                    state: {
                        type: 'string'
                    }
                },
                indexes: {
                    account: {
                        pk: {
                            field: 'pk',
                            composite: ['organizationId']
                        },
                        sk: {
                            field: 'sk',
                            composite: ['accountId']
                        }
                    },
                    location: {
                        collection: 'geographics',
                        index: 'gsi1pk-gsi1sk-index',
                        pk: {
                            field: 'gsi1pk',
                            composite: ['name']
                        },
                        sk: {
                            field: 'gsi1sk',
                            composite: ['state', 'county', 'city']
                        }
                    }
                }
            }, { table, client });

            const service = new Service({
                entity1,
                entity2,
            })

            const createItem = () => {
                return {
                    name,
                    organizationId,
                    state: uuid(),
                    county: uuid(),
                    city: uuid(),
                    accountId: uuid(),
                    description: uuid(),
                }
            }

            const name = uuid();
            const organizationId = uuid();
            const entity1Items = createItems(8, createItem);
            const entity2Items = createItems(12, createItem);

            await entity1.put(entity1Items).go();
            await entity2.put(entity2Items).go();
            const results = await service.collections.geographics({name}).go({ hydrate: true });
            expectEqualArrays('state', results.data.entity1, entity1Items);
            expectEqualArrays('state', results.data.entity2, entity2Items);
        });

        it('default keys: should hydrate clustered collection query', async () => {
            const serviceName = uuid();
            const entity1 = new Entity({
                model: {
                    entity: uuid(),
                    version: '1',
                    service: serviceName,
                },
                attributes: {
                    organizationId: {
                        type: 'string'
                    },
                    accountId: {
                        type: 'string'
                    },
                    name: {
                        type: 'string'
                    },
                    description: {
                        type: 'string'
                    },
                    city: {
                        type: 'string'
                    },
                    county: {
                        type: 'string'
                    },
                    state: {
                        type: 'string'
                    }
                },
                indexes: {
                    account: {
                        pk: {
                            field: 'pk',
                            composite: ['organizationId']
                        },
                        sk: {
                            field: 'sk',
                            composite: ['accountId']
                        }
                    },
                    location: {
                        collection: 'geographics',
                        type: 'clustered',
                        index: 'gsi1pk-gsi1sk-index',
                        pk: {
                            field: 'gsi1pk',
                            composite: ['name']
                        },
                        sk: {
                            field: 'gsi1sk',
                            composite: ['state', 'county', 'city']
                        }
                    }
                }
            }, { table, client });

            const entity2 = new Entity({
                model: {
                    entity: uuid(),
                    version: '1',
                    service: serviceName,
                },
                attributes: {
                    organizationId: {
                        type: 'string'
                    },
                    accountId: {
                        type: 'string'
                    },
                    name: {
                        type: 'string'
                    },
                    description: {
                        type: 'string'
                    },
                    city: {
                        type: 'string'
                    },
                    county: {
                        type: 'string'
                    },
                    state: {
                        type: 'string'
                    }
                },
                indexes: {
                    account: {
                        pk: {
                            field: 'pk',
                            composite: ['organizationId']
                        },
                        sk: {
                            field: 'sk',
                            composite: ['accountId']
                        }
                    },
                    location: {
                        collection: 'geographics',
                        type: 'clustered',
                        index: 'gsi1pk-gsi1sk-index',
                        pk: {
                            field: 'gsi1pk',
                            composite: ['name']
                        },
                        sk: {
                            field: 'gsi1sk',
                            composite: ['state', 'county', 'city']
                        }
                    }
                }
            }, { table, client });

            const service = new Service({
                entity1,
                entity2,
            })

            const createItem = () => {
                return {
                    name,
                    organizationId,
                    state: uuid(),
                    county: uuid(),
                    city: uuid(),
                    accountId: uuid(),
                    description: uuid(),
                }
            }

            const name = uuid();
            const organizationId = uuid();
            const entity1Items = createItems(8, createItem);
            const entity2Items = createItems(12, createItem);

            await entity1.put(entity1Items).go();
            await entity2.put(entity2Items).go();
            const results = await service.collections.geographics({name}).go({ hydrate: true });
            expectEqualArrays('state', results.data.entity1, entity1Items);
            expectEqualArrays('state', results.data.entity2, entity2Items);
        });

        it('default keys: should weed out items that do not belong to entity', async () => {
            const serviceName = uuid();
            const entity1 = new Entity({
                model: {
                    entity: uuid(),
                    version: '1',
                    service: serviceName,
                },
                attributes: {
                    organizationId: {
                        type: 'string'
                    },
                    accountId: {
                        type: 'string'
                    },
                    name: {
                        type: 'string'
                    },
                    description: {
                        type: 'string'
                    },
                    city: {
                        type: 'string'
                    },
                    county: {
                        type: 'string'
                    },
                    state: {
                        type: 'string'
                    }
                },
                indexes: {
                    account: {
                        pk: {
                            field: 'pk',
                            composite: ['organizationId']
                        },
                        sk: {
                            field: 'sk',
                            composite: ['accountId']
                        }
                    },
                    location: {
                        collection: 'geographics',
                        type: 'clustered',
                        index: 'gsi1pk-gsi1sk-index',
                        pk: {
                            field: 'gsi1pk',
                            composite: ['name']
                        },
                        sk: {
                            field: 'gsi1sk',
                            composite: ['state', 'county', 'city']
                        }
                    }
                }
            }, { table, client });

            const entity2 = new Entity({
                model: {
                    entity: uuid(),
                    version: '1',
                    service: serviceName,
                },
                attributes: {
                    organizationId: {
                        type: 'string'
                    },
                    accountId: {
                        type: 'string'
                    },
                    name: {
                        type: 'string'
                    },
                    description: {
                        type: 'string'
                    },
                    city: {
                        type: 'string'
                    },
                    county: {
                        type: 'string'
                    },
                    state: {
                        type: 'string'
                    }
                },
                indexes: {
                    account: {
                        pk: {
                            field: 'pk',
                            composite: ['organizationId']
                        },
                        sk: {
                            field: 'sk',
                            composite: ['accountId']
                        }
                    },
                    location: {
                        collection: 'geographics',
                        type: 'clustered',
                        index: 'gsi1pk-gsi1sk-index',
                        pk: {
                            field: 'gsi1pk',
                            composite: ['name']
                        },
                        sk: {
                            field: 'gsi1sk',
                            composite: ['state', 'county', 'city']
                        }
                    }
                }
            }, { table, client });

            const createItem = () => {
                return {
                    name,
                    organizationId,
                    state: uuid(),
                    county: uuid(),
                    city: uuid(),
                    accountId: uuid(),
                    description: uuid(),
                }
            }

            const name = uuid();
            const organizationId = uuid();
            const items = createItems(20, createItem);

            await entity1.put(items).go();
            await entity2.put(items).go();
            const results = await entity1.query.location({ name }).go({ hydrate: true });
            expectEqualArrays('state', results.data, items);
        });

        it('default keys: should hydrate table index query without failure', async () => {
            const entity = new Entity({
                model: {
                    entity: uuid(),
                    version: '1',
                    service: uuid(),
                },
                attributes: {
                    organizationId: {
                        type: 'string'
                    },
                    accountId: {
                        type: 'string'
                    },
                    name: {
                        type: 'string'
                    },
                    description: {
                        type: 'string'
                    },
                    city: {
                        type: 'string'
                    },
                    county: {
                        type: 'string'
                    },
                    state: {
                        type: 'string'
                    }
                },
                indexes: {
                    account: {
                        pk: {
                            field: 'pk',
                            composite: ['organizationId']
                        },
                        sk: {
                            field: 'sk',
                            composite: ['accountId']
                        }
                    },
                    location: {
                        index: 'gsi1pk-gsi1sk-index',
                        pk: {
                            field: 'gsi1pk',
                            composite: ['name']
                        },
                        sk: {
                            field: 'gsi1sk',
                            composite: ['state', 'county', 'city']
                        }
                    }
                }
            }, { table, client });

            const name = uuid();
            const organizationId = uuid();
            const items = createItems(10, () => {
                return {
                    name,
                    organizationId,
                    state: uuid(),
                    county: uuid(),
                    city: uuid(),
                    accountId: uuid(),
                    description: uuid(),
                }
            });

            await entity.put(items).go();
            const results = await entity.query.account({organizationId}).go({hydrate: true});
            expectEqualArrays('state', results.data, items);
        });
    });
    // ---------------------------- END DEFAULT KEYS ---------------------------- //


    // --------------------------- START CUSTOM KEYS --------------------------- //
    describe('custom keys', () => {
        it('custom keys: should hydrate keys only query index', async () => {
            const entity = new Entity({
                model: {
                    entity: uuid(),
                    version: '1',
                    service: uuid(),
                },
                attributes: {
                    organizationId: {
                        type: 'string'
                    },
                    accountId: {
                        type: 'string'
                    },
                    name: {
                        type: 'string'
                    },
                    description: {
                        type: 'string'
                    },
                    city: {
                        type: 'string'
                    },
                    county: {
                        type: 'string'
                    },
                    state: {
                        type: 'string'
                    }
                },
                indexes: {
                    account: {
                        pk: {
                            field: 'pk',
                            composite: ['organizationId']
                        },
                        sk: {
                            field: 'sk',
                            composite: ['accountId']
                        }
                    },
                    location: {
                        index: 'gsi1pk-gsi1sk-index',
                        pk: {
                            field: 'gsi1pk',
                            composite: ['name'],
                            template: 'location#${name}',
                        },
                        sk: {
                            field: 'gsi1sk',
                            composite: ['state', 'county', 'city'],
                            template: "state#${state}#county#${county}#city#${city}"
                        }
                    }
                }
            }, { table, client });

            const name = uuid();
            const organizationId = uuid();
            const items = createItems(10, () => {
                return {
                    name,
                    organizationId,
                    state: uuid(),
                    county: uuid(),
                    city: uuid(),
                    accountId: uuid(),
                    description: uuid(),
                }
            });

            await entity.put(items).go();
            const results = await entity.query.location({ name }).go({ hydrate: true });
            expectEqualArrays('state', results.data, items);
        });

        it('custom keys: should hydrate keys only clustered index', async () => {
            const service = uuid();
            const entityName = uuid();
            const entity = new Entity({
                model: {
                    entity: `normal_${entityName}`,
                    version: '1',
                    service,
                },
                attributes: {
                    organizationId: {
                        type: 'string'
                    },
                    accountId: {
                        type: 'string'
                    },
                    name: {
                        type: 'string'
                    },
                    description: {
                        type: 'string'
                    },
                    city: {
                        type: 'string'
                    },
                    county: {
                        type: 'string'
                    },
                    state: {
                        type: 'string'
                    },
                    kind: {
                        type: 'string'
                    }
                },
                indexes: {
                    account: {
                        pk: {
                            field: 'pk',
                            composite: ['organizationId']
                        },
                        sk: {
                            field: 'sk',
                            composite: ['accountId']
                        }
                    },
                    location: {
                        type: 'clustered',
                        index: 'gsi1pk-gsi1sk-index',
                        pk: {
                            field: 'gsi1pk',
                            composite: ['name'],
                            template: 'location#${name}',
                        },
                        sk: {
                            field: 'gsi1sk',
                            composite: ['state', 'county', 'city'],
                            template: "state#${state}#county#${county}#city#${city}"
                        }
                    }
                }
            }, { table, client });

            const similarEntity = new Entity({
                model: {
                    entity: `similar_${entityName}`,
                    version: '1',
                    service,
                },
                attributes: {
                    organizationId: {
                        type: 'string'
                    },
                    accountId: {
                        type: 'string'
                    },
                    name: {
                        type: 'string'
                    },
                    description: {
                        type: 'string'
                    },
                    city: {
                        type: 'string'
                    },
                    county: {
                        type: 'string'
                    },
                    state: {
                        type: 'string'
                    },
                    kind: {
                        type: 'string'
                    }
                },
                indexes: {
                    account: {
                        pk: {
                            field: 'pk',
                            composite: ['organizationId']
                        },
                        sk: {
                            field: 'sk',
                            composite: ['accountId']
                        }
                    },
                    location: {
                        type: 'clustered',
                        index: 'gsi1pk-gsi1sk-index',
                        pk: {
                            field: 'gsi1pk',
                            composite: ['name'],
                            template: 'location#${name}',
                        },
                        sk: {
                            field: 'gsi1sk',
                            composite: ['state', 'county', 'city'],
                            template: "state#${state}#county#${county}#city#${city}"
                        }
                    }
                }
            }, { table, client });

            const name = uuid();
            const organizationId = uuid();
            const items = createItems(10, () => {
                return {
                    name,
                    organizationId,
                    state: uuid(),
                    county: uuid(),
                    city: uuid(),
                    accountId: uuid(),
                    description: uuid(),
                    kind: 'normal',
                }
            });

            const similarItems = items.map((item) => {
                return {
                    ...item,
                    description: uuid(),
                    kind: 'similar'
                }
            });

            // items and similar items are identical from a keys perspective
            await entity.put(items).go();
            await similarEntity.put(similarItems).go();

            // the fact that these indexes are clustered means that to retrieve these items, and only
            // the items for that entity, electrodb would have had to filter out any items not of that
            // entity to match

            const params = entity.query.location({name}).params();
            delete params.ExpressionAttributeNames['#__edb_e__'];
            delete params.ExpressionAttributeNames['#__edb_v__'];
            delete params.ExpressionAttributeValues[':__edb_e__0'];
            delete params.ExpressionAttributeValues[':__edb_v__0'];
            delete params.FilterExpression;
            const raw = await client.query(params).promise();
            expect(raw.Items).not.to.be.undefined;

            // records should be clustered
            let lastKind: string | undefined;
            raw.Items?.forEach(item => {
                if (lastKind) {
                    expect(lastKind.replace(entityName, '')).not.to.equal(item.sk.replace(entityName, ''));
                }
                lastKind = item.kind;
            });

            const results = await entity.query.location({name}).go({ hydrate: true });
            expectEqualArrays('state', results.data, items);

            const similarResults = await similarEntity.query.location({name}).go({ hydrate: true });
            expectEqualArrays('state', similarResults.data, similarItems);
        });

        it('custom keys: should hydrate normal query index without failure', async () => {
            const entity = new Entity({
                model: {
                    entity: uuid(),
                    version: '1',
                    service: uuid(),
                },
                attributes: {
                    organizationId: {
                        type: 'string'
                    },
                    accountId: {
                        type: 'string'
                    },
                    name: {
                        type: 'string'
                    },
                    description: {
                        type: 'string'
                    },
                    city: {
                        type: 'string'
                    },
                    county: {
                        type: 'string'
                    },
                    state: {
                        type: 'string'
                    }
                },
                indexes: {
                    account: {
                        pk: {
                            field: 'pk',
                            composite: ['organizationId']
                        },
                        sk: {
                            field: 'sk',
                            composite: ['accountId']
                        }
                    },
                    location: {
                        type: 'clustered',
                        index: 'gsi1pk-gsi1sk-index',
                        pk: {
                            field: 'gsi1pk',
                            composite: ['name'],
                            template: 'location#${name}',
                        },
                        sk: {
                            field: 'gsi1sk',
                            composite: ['state', 'county', 'city'],
                            template: "state#${state}#county#${county}#city#${city}"
                        }
                    }
                }
            }, { table, client });

            const name = uuid();
            const organizationId = uuid();
            const items = createItems(10, () => {
                return {
                    name,
                    organizationId,
                    state: uuid(),
                    county: uuid(),
                    city: uuid(),
                    accountId: uuid(),
                    description: uuid(),
                }
            });

            await entity.put(items).go();
            const results = await entity.query.account({organizationId}).go({ hydrate: true });
            expectEqualArrays('state', results.data, items);
        });

        it('custom keys: should hydrate collection query', async () => {
            const serviceName = uuid();
            const entity1 = new Entity({
                model: {
                    entity: uuid(),
                    version: '1',
                    service: serviceName
                },
                attributes: {
                    organizationId: {
                        type: 'string'
                    },
                    accountId: {
                        type: 'string'
                    },
                    name: {
                        type: 'string'
                    },
                    description: {
                        type: 'string'
                    },
                    city: {
                        type: 'string'
                    },
                    county: {
                        type: 'string'
                    },
                    state: {
                        type: 'string'
                    }
                },
                indexes: {
                    account: {
                        pk: {
                            field: 'pk',
                            composite: ['organizationId']
                        },
                        sk: {
                            field: 'sk',
                            composite: ['accountId']
                        }
                    },
                    location: {
                        collection: 'geographics',
                        index: 'gsi1pk-gsi1sk-index',
                        pk: {
                            field: 'gsi1pk',
                            composite: ['name'],
                            template: 'location#${name}',
                        },
                        sk: {
                            field: 'gsi1sk',
                            composite: ['state', 'county', 'city'],
                            template: "state#${state}#county#${county}#city#${city}e1"
                        }
                    }
                }
            }, { table, client });

            const entity2 = new Entity({
                model: {
                    entity: uuid(),
                    version: '1',
                    service: serviceName
                },
                attributes: {
                    organizationId: {
                        type: 'string'
                    },
                    accountId: {
                        type: 'string'
                    },
                    name: {
                        type: 'string'
                    },
                    description: {
                        type: 'string'
                    },
                    city: {
                        type: 'string'
                    },
                    county: {
                        type: 'string'
                    },
                    state: {
                        type: 'string'
                    }
                },
                indexes: {
                    account: {
                        pk: {
                            field: 'pk',
                            composite: ['organizationId']
                        },
                        sk: {
                            field: 'sk',
                            composite: ['accountId']
                        }
                    },
                    location: {
                        collection: 'geographics',
                        index: 'gsi1pk-gsi1sk-index',
                        pk: {
                            field: 'gsi1pk',
                            composite: ['name'],
                            template: 'location#${name}',
                        },
                        sk: {
                            field: 'gsi1sk',
                            composite: ['state', 'county', 'city'],
                            template: "state#${state}#county#${county}#city#${city}e2"
                        }
                    }
                }
            }, { table, client });

            const service = new Service({
                entity1,
                entity2,
            })

            const createItem = () => {
                return {
                    name,
                    organizationId,
                    state: uuid(),
                    county: uuid(),
                    city: uuid(),
                    accountId: uuid(),
                    description: uuid(),
                }
            }

            const name = uuid();
            const organizationId = uuid();
            const entity1Items = createItems(8, createItem);
            const entity2Items = createItems(12, createItem);

            await entity1.put(entity1Items).go();
            await entity2.put(entity2Items).go();
            const results = await service.collections.geographics({name}).go({ hydrate: true });
            expectEqualArrays('state', results.data.entity1, entity1Items);
            expectEqualArrays('state', results.data.entity2, entity2Items);
        });

        it('custom keys: should hydrate clustered collection query', async () => {
            const serviceName = uuid();
            const entity1 = new Entity({
                model: {
                    entity: uuid(),
                    version: '1',
                    service: serviceName,
                },
                attributes: {
                    organizationId: {
                        type: 'string'
                    },
                    accountId: {
                        type: 'string'
                    },
                    name: {
                        type: 'string'
                    },
                    description: {
                        type: 'string'
                    },
                    city: {
                        type: 'string'
                    },
                    county: {
                        type: 'string'
                    },
                    state: {
                        type: 'string'
                    }
                },
                indexes: {
                    account: {
                        pk: {
                            field: 'pk',
                            composite: ['organizationId'],
                        },
                        sk: {
                            field: 'sk',
                            composite: ['accountId'],
                        }
                    },
                    location: {
                        collection: 'geographics',
                        type: 'clustered',
                        index: 'gsi1pk-gsi1sk-index',
                        pk: {
                            field: 'gsi1pk',
                            composite: ['name'],
                            template: 'location#${name}',
                        },
                        sk: {
                            field: 'gsi1sk',
                            composite: ['state', 'county', 'city'],
                            template: "state#${state}#county#${county}#city#${city}"
                        }
                    }
                }
            }, { table, client });

            const entity2 = new Entity({
                model: {
                    entity: uuid(),
                    version: '1',
                    service: serviceName,
                },
                attributes: {
                    organizationId: {
                        type: 'string'
                    },
                    accountId: {
                        type: 'string'
                    },
                    name: {
                        type: 'string'
                    },
                    description: {
                        type: 'string'
                    },
                    city: {
                        type: 'string'
                    },
                    county: {
                        type: 'string'
                    },
                    state: {
                        type: 'string'
                    }
                },
                indexes: {
                    account: {
                        pk: {
                            field: 'pk',
                            composite: ['organizationId']
                        },
                        sk: {
                            field: 'sk',
                            composite: ['accountId']
                        }
                    },
                    location: {
                        collection: 'geographics',
                        type: 'clustered',
                        index: 'gsi1pk-gsi1sk-index',
                        pk: {
                            field: 'gsi1pk',
                            composite: ['name'],
                            template: 'location#${name}',
                        },
                        sk: {
                            field: 'gsi1sk',
                            composite: ['state', 'county', 'city'],
                            template: "state#${state}#county#${county}#city#${city}"
                        }
                    }
                }
            }, { table, client });

            const service = new Service({
                entity1,
                entity2,
            })

            const createItem = () => {
                return {
                    name,
                    organizationId,
                    state: uuid(),
                    county: uuid(),
                    city: uuid(),
                    accountId: uuid(),
                    description: uuid(),
                }
            }

            const name = uuid();
            const organizationId = uuid();
            const entity1Items = createItems(8, createItem);
            const entity2Items = createItems(12, createItem);

            await entity1.put(entity1Items).go();
            await entity2.put(entity2Items).go();
            const results = await service.collections.geographics({name}).go({ hydrate: true });
            expectEqualArrays('state', results.data.entity1, entity1Items);
            expectEqualArrays('state', results.data.entity2, entity2Items);
        });

        it('custom keys: should weed out items that do not belong to entity', async () => {
            const serviceName = uuid();
            const entity1 = new Entity({
                model: {
                    entity: uuid(),
                    version: '1',
                    service: serviceName,
                },
                attributes: {
                    organizationId: {
                        type: 'string'
                    },
                    accountId: {
                        type: 'string'
                    },
                    name: {
                        type: 'string'
                    },
                    description: {
                        type: 'string'
                    },
                    city: {
                        type: 'string'
                    },
                    county: {
                        type: 'string'
                    },
                    state: {
                        type: 'string'
                    }
                },
                indexes: {
                    account: {
                        pk: {
                            field: 'pk',
                            composite: ['organizationId']
                        },
                        sk: {
                            field: 'sk',
                            composite: ['accountId']
                        }
                    },
                    location: {
                        collection: 'geographics',
                        type: 'clustered',
                        index: 'gsi1pk-gsi1sk-index',
                        pk: {
                            field: 'gsi1pk',
                            composite: ['name'],
                            template: 'location#${name}',
                        },
                        sk: {
                            field: 'gsi1sk',
                            composite: ['state', 'county', 'city'],
                            template: "state#${state}#county#${county}#city#${city}"
                        }
                    }
                }
            }, { table, client });

            const entity2 = new Entity({
                model: {
                    entity: uuid(),
                    version: '1',
                    service: serviceName,
                },
                attributes: {
                    organizationId: {
                        type: 'string'
                    },
                    accountId: {
                        type: 'string'
                    },
                    name: {
                        type: 'string'
                    },
                    description: {
                        type: 'string'
                    },
                    city: {
                        type: 'string'
                    },
                    county: {
                        type: 'string'
                    },
                    state: {
                        type: 'string'
                    }
                },
                indexes: {
                    account: {
                        pk: {
                            field: 'pk',
                            composite: ['organizationId']
                        },
                        sk: {
                            field: 'sk',
                            composite: ['accountId']
                        }
                    },
                    location: {
                        collection: 'geographics',
                        type: 'clustered',
                        index: 'gsi1pk-gsi1sk-index',
                        pk: {
                            field: 'gsi1pk',
                            composite: ['name'],
                            template: 'location#${name}',
                        },
                        sk: {
                            field: 'gsi1sk',
                            composite: ['state', 'county', 'city'],
                            template: "state#${state}#county#${county}#city#${city}"
                        }
                    }
                }
            }, { table, client });

            const createItem = () => {
                return {
                    name,
                    organizationId,
                    state: uuid(),
                    county: uuid(),
                    city: uuid(),
                    accountId: uuid(),
                    description: uuid(),
                }
            }

            const name = uuid();
            const organizationId = uuid();
            const items = createItems(20, createItem);

            await entity1.put(items).go();
            await entity2.put(items).go();
            const results = await entity1.query.location({ name }).go({ hydrate: true });
            expectEqualArrays('state', results.data, items);
        });

        it('custom keys: should hydrate table index query without failure', async () => {
            const entity = new Entity({
                model: {
                    entity: uuid(),
                    version: '1',
                    service: uuid(),
                },
                attributes: {
                    organizationId: {
                        type: 'string'
                    },
                    accountId: {
                        type: 'string'
                    },
                    name: {
                        type: 'string'
                    },
                    description: {
                        type: 'string'
                    },
                    city: {
                        type: 'string'
                    },
                    county: {
                        type: 'string'
                    },
                    state: {
                        type: 'string'
                    }
                },
                indexes: {
                    account: {
                        pk: {
                            field: 'pk',
                            composite: ['organizationId']
                        },
                        sk: {
                            field: 'sk',
                            composite: ['accountId']
                        }
                    },
                    location: {
                        index: 'gsi1pk-gsi1sk-index',
                        pk: {
                            field: 'gsi1pk',
                            composite: ['name'],
                            template: 'location#${name}',
                        },
                        sk: {
                            field: 'gsi1sk',
                            composite: ['state', 'county', 'city'],
                            template: "state#${state}#county#${county}#city#${city}"
                        }
                    }
                }
            }, { table, client });

            const name = uuid();
            const organizationId = uuid();
            const items = createItems(10, () => {
                return {
                    name,
                    organizationId,
                    state: uuid(),
                    county: uuid(),
                    city: uuid(),
                    accountId: uuid(),
                    description: uuid(),
                }
            });

            await entity.put(items).go();
            const results = await entity.query.account({organizationId}).go({hydrate: true});
            expectEqualArrays('state', results.data, items);
        });
    });
    // ---------------------------- END CUSTOM KEYS ---------------------------- /


    // -------------------------- START NO IDENTIFIERS -------------------------- //
    describe('no identifiers', () => {
        it('no identifiers: should hydrate keys only query index', async () => {
            const entity = new Entity({
                model: {
                    entity: uuid(),
                    version: '1',
                    service: uuid(),
                },
                attributes: {
                    organizationId: {
                        type: 'string'
                    },
                    accountId: {
                        type: 'string'
                    },
                    name: {
                        type: 'string'
                    },
                    description: {
                        type: 'string'
                    },
                    city: {
                        type: 'string'
                    },
                    county: {
                        type: 'string'
                    },
                    state: {
                        type: 'string'
                    }
                },
                indexes: {
                    account: {
                        pk: {
                            field: 'pk',
                            composite: ['organizationId']
                        },
                        sk: {
                            field: 'sk',
                            composite: ['accountId']
                        }
                    },
                    location: {
                        index: 'gsi1pk-gsi1sk-index',
                        pk: {
                            field: 'gsi1pk',
                            composite: ['name'],
                            template: 'location#${name}',
                        },
                        sk: {
                            field: 'gsi1sk',
                            composite: ['state', 'county', 'city'],
                            template: "state#${state}#county#${county}#city#${city}"
                        }
                    }
                }
            }, { table, client });

            const name = uuid();
            const organizationId = uuid();
            const items = createItems(10, () => {
                return {
                    name,
                    organizationId,
                    state: uuid(),
                    county: uuid(),
                    city: uuid(),
                    accountId: uuid(),
                    description: uuid(),
                }
            })

            await Promise.all(items
                .map(item => entity.put(item).params())
                .map((params: any) => {
                    expect(typeof params.Item['__edb_e__']).to.equal('string');
                    delete params.Item['__edb_e__'];
                    expect(typeof params.Item['__edb_v__']).to.equal('string');
                    delete params.Item['__edb_v__'];
                    return params;
                })
                .map(params => client.put(params).promise())
            );

            const results = await entity.query.location({ name }).go({ hydrate: true, ignoreOwnership: true });
            expectEqualArrays('state', results.data, items);
        });

        it('no identifiers: should hydrate keys only clustered index', async () => {
            const service = uuid();
            const entityName = uuid();
            const entity = new Entity({
                model: {
                    entity: `normal_${entityName}`,
                    version: '1',
                    service,
                },
                attributes: {
                    organizationId: {
                        type: 'string'
                    },
                    accountId: {
                        type: 'string'
                    },
                    name: {
                        type: 'string'
                    },
                    description: {
                        type: 'string'
                    },
                    city: {
                        type: 'string'
                    },
                    county: {
                        type: 'string'
                    },
                    state: {
                        type: 'string'
                    },
                    kind: {
                        type: 'string'
                    }
                },
                indexes: {
                    account: {
                        pk: {
                            field: 'pk',
                            composite: ['organizationId']
                        },
                        sk: {
                            field: 'sk',
                            composite: ['accountId']
                        }
                    },
                    location: {
                        type: 'clustered',
                        index: 'gsi1pk-gsi1sk-index',
                        pk: {
                            field: 'gsi1pk',
                            composite: ['name'],
                            template: 'location#${name}',
                        },
                        sk: {
                            field: 'gsi1sk',
                            composite: ['state', 'county', 'city'],
                            template: "state#${state}#county#${county}#city#${city}e1"
                        }
                    }
                }
            }, { table, client });

            const similarEntity = new Entity({
                model: {
                    entity: `similar_${entityName}`,
                    version: '1',
                    service,
                },
                attributes: {
                    organizationId: {
                        type: 'string'
                    },
                    accountId: {
                        type: 'string'
                    },
                    name: {
                        type: 'string'
                    },
                    description: {
                        type: 'string'
                    },
                    city: {
                        type: 'string'
                    },
                    county: {
                        type: 'string'
                    },
                    state: {
                        type: 'string'
                    },
                    kind: {
                        type: 'string'
                    }
                },
                indexes: {
                    account: {
                        pk: {
                            field: 'pk',
                            composite: ['organizationId']
                        },
                        sk: {
                            field: 'sk',
                            composite: ['accountId']
                        }
                    },
                    location: {
                        type: 'clustered',
                        index: 'gsi1pk-gsi1sk-index',
                        pk: {
                            field: 'gsi1pk',
                            composite: ['name'],
                            template: 'location#${name}',
                        },
                        sk: {
                            field: 'gsi1sk',
                            composite: ['state', 'county', 'city'],
                            template: "state#${state}#county#${county}#city#${city}e2"
                        }
                    }
                }
            }, { table, client });

            const name = uuid();
            const organizationId = uuid();
            const items = createItems(10, () => {
                return {
                    name,
                    organizationId,
                    state: uuid(),
                    county: uuid(),
                    city: uuid(),
                    accountId: uuid(),
                    description: uuid(),
                    kind: 'normal',
                }
            });

            await Promise.all(items
                .map(item => entity.put(item).params())
                .map((params: any) => {
                    expect(typeof params.Item['__edb_e__']).to.equal('string');
                    delete params.Item['__edb_e__'];
                    expect(typeof params.Item['__edb_v__']).to.equal('string');
                    delete params.Item['__edb_v__'];
                    return params;
                })
                .map(params => client.put(params).promise())
            );

            const similarItems = items.map((item) => {
                return {
                    ...item,
                    description: uuid(),
                    kind: 'similar'
                }
            });

            await Promise.all(similarItems
                .map(item => similarEntity.put(item).params())
                .map((params: any) => {
                    expect(typeof params.Item['__edb_e__']).to.equal('string');
                    delete params.Item['__edb_e__'];
                    expect(typeof params.Item['__edb_v__']).to.equal('string');
                    delete params.Item['__edb_v__'];
                    return params;
                })
                .map(params => client.put(params).promise())
            );

            // items and similar items are identical from a keys perspective

            // the fact that these indexes are clustered means that to retrieve these items, and only
            // the items for that entity, electrodb would have had to filter out any items not of that
            // entity to match
            const params = entity.query.location({ name }).params();
            delete params.ExpressionAttributeNames['#__edb_e__'];
            delete params.ExpressionAttributeNames['#__edb_v__'];
            delete params.ExpressionAttributeValues[':__edb_e__0'];
            delete params.ExpressionAttributeValues[':__edb_v__0'];
            delete params.FilterExpression;
            const raw = await client.query(params).promise();
            expect(raw.Items).not.to.be.undefined;

            // records should be clustered
            let lastKind: string | undefined;
            raw.Items?.forEach(item => {
                if (lastKind) {
                    expect(lastKind.replace(entityName, '')).not.to.equal(item.sk.replace(entityName, ''));
                }
                lastKind = item.kind;
            });

            const results = await entity.query.location({ name }).go({ hydrate: true });
            expectEqualArrays('state', results.data, items);

            const similarResults = await similarEntity.query.location({name}).go({ hydrate: true });
            expectEqualArrays('state', similarResults.data, similarItems);
        });

        it('no identifiers: should hydrate normal query index without failure', async () => {
            const entity = new Entity({
                model: {
                    entity: uuid(),
                    version: '1',
                    service: uuid(),
                },
                attributes: {
                    organizationId: {
                        type: 'string'
                    },
                    accountId: {
                        type: 'string'
                    },
                    name: {
                        type: 'string'
                    },
                    description: {
                        type: 'string'
                    },
                    city: {
                        type: 'string'
                    },
                    county: {
                        type: 'string'
                    },
                    state: {
                        type: 'string'
                    }
                },
                indexes: {
                    account: {
                        pk: {
                            field: 'pk',
                            composite: ['organizationId']
                        },
                        sk: {
                            field: 'sk',
                            composite: ['accountId']
                        }
                    },
                    location: {
                        type: 'clustered',
                        index: 'gsi1pk-gsi1sk-index',
                        pk: {
                            field: 'gsi1pk',
                            composite: ['name'],
                            template: 'location#${name}',
                        },
                        sk: {
                            field: 'gsi1sk',
                            composite: ['state', 'county', 'city'],
                            template: "state#${state}#county#${county}#city#${city}"
                        }
                    }
                }
            }, { table, client });

            const name = uuid();
            const organizationId = uuid();
            const items = createItems(10, () => {
                return {
                    name,
                    organizationId,
                    state: uuid(),
                    county: uuid(),
                    city: uuid(),
                    accountId: uuid(),
                    description: uuid(),
                }
            });

            await Promise.all(items
                .map(item => entity.put(item).params())
                .map((params: any) => {
                    expect(typeof params.Item['__edb_e__']).to.equal('string');
                    delete params.Item['__edb_e__'];
                    expect(typeof params.Item['__edb_v__']).to.equal('string');
                    delete params.Item['__edb_v__'];
                    return params;
                })
                .map(params => client.put(params).promise())
            );

            const results = await entity.query.account({organizationId}).go({ hydrate: true });
            expectEqualArrays('state', results.data, items);
        });

        it('no identifiers: should weed out items that do not belong to entity', async () => {
            const serviceName = uuid();
            const entity1 = new Entity({
                model: {
                    entity: uuid(),
                    version: '1',
                    service: serviceName,
                },
                attributes: {
                    organizationId: {
                        type: 'string'
                    },
                    accountId: {
                        type: 'string'
                    },
                    name: {
                        type: 'string'
                    },
                    description: {
                        type: 'string'
                    },
                    city: {
                        type: 'string'
                    },
                    county: {
                        type: 'string'
                    },
                    state: {
                        type: 'string'
                    }
                },
                indexes: {
                    account: {
                        pk: {
                            field: 'pk',
                            composite: ['organizationId']
                        },
                        sk: {
                            field: 'sk',
                            composite: ['accountId']
                        }
                    },
                    location: {
                        collection: 'geographics',
                        type: 'clustered',
                        index: 'gsi1pk-gsi1sk-index',
                        pk: {
                            field: 'gsi1pk',
                            composite: ['name'],
                            template: 'location#${name}',
                        },
                        sk: {
                            field: 'gsi1sk',
                            composite: ['state', 'county', 'city'],
                            template: "state#${state}#county#${county}#city#${city}e1"
                        }
                    }
                }
            }, { table, client });

            const entity2 = new Entity({
                model: {
                    entity: uuid(),
                    version: '1',
                    service: serviceName,
                },
                attributes: {
                    organizationId: {
                        type: 'string'
                    },
                    accountId: {
                        type: 'string'
                    },
                    name: {
                        type: 'string'
                    },
                    description: {
                        type: 'string'
                    },
                    city: {
                        type: 'string'
                    },
                    county: {
                        type: 'string'
                    },
                    state: {
                        type: 'string'
                    }
                },
                indexes: {
                    account: {
                        pk: {
                            field: 'pk',
                            composite: ['organizationId']
                        },
                        sk: {
                            field: 'sk',
                            composite: ['accountId']
                        }
                    },
                    location: {
                        collection: 'geographics',
                        type: 'clustered',
                        index: 'gsi1pk-gsi1sk-index',
                        pk: {
                            field: 'gsi1pk',
                            composite: ['name'],
                            template: 'location#${name}',
                        },
                        sk: {
                            field: 'gsi1sk',
                            composite: ['state', 'county', 'city'],
                            template: "state#${state}#county#${county}#city#${city}e2"
                        }
                    }
                }
            }, { table, client });

            const createItem = () => {
                return {
                    name,
                    organizationId,
                    state: uuid(),
                    county: uuid(),
                    city: uuid(),
                    accountId: uuid(),
                    description: uuid(),
                }
            }

            const name = uuid();
            const organizationId = uuid();
            const items = createItems(20, createItem);

            await Promise.all(items
                .map(item => entity1.put(item).params())
                .map((params: any) => {
                    expect(typeof params.Item['__edb_e__']).to.equal('string');
                    delete params.Item['__edb_e__'];
                    expect(typeof params.Item['__edb_v__']).to.equal('string');
                    delete params.Item['__edb_v__'];
                    return params;
                })
                .map(params => client.put(params).promise())
            );

            await Promise.all(items
                .map(item => entity2.put(item).params())
                .map((params: any) => {
                    expect(typeof params.Item['__edb_e__']).to.equal('string');
                    delete params.Item['__edb_e__'];
                    expect(typeof params.Item['__edb_v__']).to.equal('string');
                    delete params.Item['__edb_v__'];
                    return params;
                })
                .map(params => client.put(params).promise())
            );

            const results = await entity1.query.location({ name }).go({ hydrate: true });
            expectEqualArrays('state', results.data, items);
        });

        it('no identifiers: should hydrate table index query without failure', async () => {
            const entity = new Entity({
                model: {
                    entity: uuid(),
                    version: '1',
                    service: uuid(),
                },
                attributes: {
                    organizationId: {
                        type: 'string'
                    },
                    accountId: {
                        type: 'string'
                    },
                    name: {
                        type: 'string'
                    },
                    description: {
                        type: 'string'
                    },
                    city: {
                        type: 'string'
                    },
                    county: {
                        type: 'string'
                    },
                    state: {
                        type: 'string'
                    }
                },
                indexes: {
                    account: {
                        pk: {
                            field: 'pk',
                            composite: ['organizationId']
                        },
                        sk: {
                            field: 'sk',
                            composite: ['accountId']
                        }
                    },
                    location: {
                        index: 'gsi1pk-gsi1sk-index',
                        pk: {
                            field: 'gsi1pk',
                            composite: ['name'],
                            template: 'location#${name}',
                        },
                        sk: {
                            field: 'gsi1sk',
                            composite: ['state', 'county', 'city'],
                            template: "state#${state}#county#${county}#city#${city}"
                        }
                    }
                }
            }, { table, client });

            const name = uuid();
            const organizationId = uuid();
            const items = createItems(10, () => {
                return {
                    name,
                    organizationId,
                    state: uuid(),
                    county: uuid(),
                    city: uuid(),
                    accountId: uuid(),
                    description: uuid(),
                }
            });

            await Promise.all(items
                .map(item => entity.put(item).params())
                .map((params: any) => {
                    expect(typeof params.Item['__edb_e__']).to.equal('string');
                    delete params.Item['__edb_e__'];
                    expect(typeof params.Item['__edb_v__']).to.equal('string');
                    delete params.Item['__edb_v__'];
                    return params;
                })
                .map(params => client.put(params).promise())
            );

            await entity.put(items).go();
            const results = await entity.query.account({organizationId}).go({hydrate: true});
            expectEqualArrays('state', results.data, items);
        });
    });
    // --------------------------- END NO IDENTIFIERS --------------------------- //

    it('should return keys for a given query without error', async () => {
        const entity = new Entity({
            model: {
                entity: uuid(),
                version: '1',
                service: uuid(),
            },
            attributes: {
                organizationId: {
                    type: 'string'
                },
                accountId: {
                    type: 'string'
                },
                name: {
                    type: 'string'
                },
                description: {
                    type: 'string'
                },
                city: {
                    type: 'string'
                },
                county: {
                    type: 'string'
                },
                state: {
                    type: 'string'
                }
            },
            indexes: {
                account: {
                    pk: {
                        field: 'pk',
                        composite: ['organizationId']
                    },
                    sk: {
                        field: 'sk',
                        composite: ['accountId']
                    }
                },
                location: {
                    index: 'gsi1pk-gsi1sk-index',
                    pk: {
                        field: 'gsi1pk',
                        composite: ['name'],
                    },
                    sk: {
                        field: 'gsi1sk',
                        composite: ['state', 'county', 'city'],
                    }
                }
            }
        }, { table, client });

        const name = uuid();
        const organizationId = uuid();
        const items = createItems(10, () => {
            return {
                name,
                organizationId,
                state: uuid(),
                county: uuid(),
                city: uuid(),
                accountId: uuid(),
                description: uuid(),
            }
        });

        const keys = items
            .map(item => entity.put(item).params())
            .map((params: any) => {
                expect(typeof params.Item.pk).to.equal('string');
                expect(typeof params.Item.sk).to.equal('string');
                expect(typeof params.Item.gsi1pk).to.equal('string');
                expect(typeof params.Item.gsi1sk).to.equal('string');
                return {
                    pk: params.Item.pk,
                    sk: params.Item.sk,
                    gsi1pk: params.Item.gsi1pk,
                    gsi1sk: params.Item.gsi1sk,
                }
            });

        await entity.put(items).go();

        const { data } = await entity.query
            .location({name})
            .go({ ignoreOwnership: true, data: 'includeKeys' });

        expect(
            data.sort((a: any, z: any) => a.gsi1sk.localeCompare(z.gsi1sk))
        ).to.deep.equal(
            keys.sort((a, z) => a.gsi1sk.localeCompare(z.gsi1sk))
        );
    })
});