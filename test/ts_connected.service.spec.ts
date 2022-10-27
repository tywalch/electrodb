process.env.AWS_NODEJS_CONNECTION_REUSE_ENABLED = "1";
import { Entity, Service } from '../';
import {expect} from "chai";
import DynamoDB from "aws-sdk/clients/dynamodb";
import {v4 as uuid} from 'uuid';

const client = new DynamoDB.DocumentClient({
    region: "us-east-1",
    endpoint: process.env.LOCAL_DYNAMO_ENDPOINT
});

type DocClient = typeof client;

const table = "electro";

export function getPaddingEntities(options: {
    client?: DocClient;
    serviceName: string;
    table: string;
}) {
    const { client, serviceName, table } = options;
    const baseEntity = new Entity({
        model: {
            service: serviceName,
            entity: 'baseentity',
            version: '1'
        },
        attributes: {
            padded: {
                type: 'string',
                padding: {
                    char: '0',
                    length: 5,
                }
            },
            padded2: {
                type: 'string',
                padding: {
                    char: '#',
                    length: 10,
                }
            },
            notPadded: {
                type: 'string'
            }
        },
        indexes: {
            pkOnly: {
                collection: 'sharedPKOnly',
                pk: {
                    field: 'pk',
                    composite: ['padded']
                },
                sk: {
                    field: 'sk',
                    composite: ['notPadded']
                },
            },
            skOnly: {
                index: 'gsi1',
                collection: 'sharedSKOnly',
                pk: {
                    field: 'gsi1pk',
                    composite: ['notPadded']
                },
                sk: {
                    field: 'gsi1sk',
                    composite: ['padded']
                },
            },
            both: {
                index: 'gsi2',
                collection: 'sharedBoth',
                pk: {
                    field: 'gsi2pk',
                    composite: ['padded']
                },
                sk: {
                    field: 'gsi2sk',
                    composite: ['padded2']
                },
            },
        }
    }, {table, client});

    const baseEntity2 = new Entity({
        model: {
            service: serviceName,
            entity: 'baseentity2',
            version: '1'
        },
        attributes: {
            padded: {
                type: 'string',
                padding: {
                    char: '0',
                    length: 5,
                }
            },
            padded2: {
                type: 'string',
                padding: {
                    char: '#',
                    length: 10,
                }
            },
            notPadded: {
                type: 'string'
            }
        },
        indexes: {
            pkOnly: {
                collection: 'sharedPKOnly',
                pk: {
                    field: 'pk',
                    composite: ['padded']
                },
                sk: {
                    field: 'sk',
                    composite: ['notPadded']
                },
            },
            skOnly: {
                index: 'gsi1',
                collection: 'sharedSKOnly',
                pk: {
                    field: 'gsi1pk',
                    composite: ['notPadded']
                },
                sk: {
                    field: 'gsi1sk',
                    composite: ['padded']
                },
            },
            both: {
                index: 'gsi2',
                collection: 'sharedBoth',
                pk: {
                    field: 'gsi2pk',
                    composite: ['padded']
                },
                sk: {
                    field: 'gsi2sk',
                    composite: ['padded2']
                },
            },
        }
    }, {table, client});

    const actuallyHasPadding = new Entity({
        model: {
            service: serviceName,
            entity: 'actuallyHasPadding',
            version: '1'
        },
        attributes: {
            padded: {
                type: 'string',
                padding: {
                    char: '0',
                    length: 5,
                }
            },
            padded2: {
                type: 'string',
                padding: {
                    char: '#',
                    length: 10,
                }
            },
            notPadded: {
                type: 'string',
                padding: {
                    char: '0',
                    length: 5,
                }
            }
        },
        indexes: {
            pkOnly: {
                collection: 'sharedPKOnly',
                pk: {
                    field: 'pk',
                    composite: ['padded']
                },
                sk: {
                    field: 'sk',
                    composite: ['notPadded']
                },
            },
            skOnly: {
                index: 'gsi1',
                collection: 'sharedSKOnly',
                pk: {
                    field: 'gsi1pk',
                    composite: ['notPadded']
                },
                sk: {
                    field: 'gsi1sk',
                    composite: ['padded']
                },
            },
            both: {
                index: 'gsi2',
                collection: 'sharedBoth',
                pk: {
                    field: 'gsi2pk',
                    composite: ['padded']
                },
                sk: {
                    field: 'gsi2sk',
                    composite: ['padded2']
                },
            },
        }
    }, {table, client});

    const incorrectPk = new Entity({
        model: {
            service: serviceName,
            entity: 'incorrectpk',
            version: '1'
        },
        attributes: {
            padded: {
                type: 'string',
                padding: {
                    char: 'z',
                    length: 5,
                }
            },
            padded2: {
                type: 'string',
                padding: {
                    char: '#',
                    length: 10,
                }
            },
            notPadded: {
                type: 'string'
            }
        },
        indexes: {
            pkOnly: {
                collection: 'sharedPKOnly',
                pk: {
                    field: 'pk',
                    composite: ['padded']
                },
                sk: {
                    field: 'sk',
                    composite: ['notPadded']
                },
            },
        }
    }, {table, client});

    const incorrectSk = new Entity({
        model: {
            service: serviceName,
            entity: 'incorrectsk',
            version: '1'
        },
        attributes: {
            padded: {
                type: 'string',
                padding: {
                    char: '0',
                    length: 5,
                }
            },
            padded2: {
                type: 'string',
                padding: {
                    char: 'z',
                    length: 10,
                }
            },
            notPadded: {
                type: 'string'
            }
        },
        indexes: {
            pkOnly: {
                collection: 'sharedPKOnly',
                pk: {
                    field: 'pk',
                    composite: ['padded']
                },
                sk: {
                    field: 'sk',
                    composite: ['notPadded']
                },
            },
            both: {
                index: 'gsi2',
                collection: 'sharedBoth',
                pk: {
                    field: 'gsi2pk',
                    composite: ['padded']
                },
                sk: {
                    field: 'gsi2sk',
                    composite: ['padded2']
                },
            },
        }
    }, {table, client});
    const incorrectNonCollection = new Entity({
        model: {
            service: serviceName,
            entity: 'incorrectNonCollection',
            version: '1'
        },
        attributes: {
            padded: {
                type: 'string',
                padding: {
                    char: 'z',
                    length: 5,
                }
            },
            padded2: {
                type: 'string',
                padding: {
                    char: 'z',
                    length: 10,
                }
            },
            notPadded: {
                type: 'string'
            }
        },
        indexes: {
            pkOnly: {
                collection: 'sharedPKOnly2',
                pk: {
                    field: 'pk',
                    composite: ['padded']
                },
                sk: {
                    field: 'sk',
                    composite: ['notPadded']
                },
            },
            skOnly: {
                index: 'gsi1pk-gsi1sk',
                collection: 'sharedSKOnly2',
                pk: {
                    field: 'gsi1pk',
                    composite: ['notPadded']
                },
                sk: {
                    field: 'gsi1sk',
                    composite: ['padded']
                },
            },
            both: {
                index: 'gsi2',
                pk: {
                    field: 'gsi2pk',
                    composite: ['padded2']
                },
                sk: {
                    field: 'gsi2sk',
                    composite: ['padded']
                },
            },
        }
    }, {table, client});

    return {
        baseEntity,
        baseEntity2,
        incorrectPk,
        incorrectSk,
        actuallyHasPadding,
        incorrectNonCollection,
    }
}

describe('padding validations', () => {
    const serviceName = 'paddingTest';
    const {
        baseEntity,
        baseEntity2,
        incorrectPk,
        incorrectSk,
        actuallyHasPadding,
        incorrectNonCollection
    } = getPaddingEntities({
        serviceName,
        table
    });

    it('should not throw when attributes used in a shared collection pk are defined with the same padding configurations', () => {
        expect(() => {
            new Service({
                baseEntity,
                baseEntity2,
            });
        }).to.not.throw();
    })

    it('should throw when attributes used in a shared collection pk are defined with differing padding configurations', () => {
        expect(() => {
            new Service({
                baseEntity,
                incorrectPk,
            });
        }).to.throw('Inconsistent attribute(s) on the entity "incorrectPk". The following attribute(s) are defined with incompatible or conflicting definitions across participating entities: The attribute "padded" contains inconsistent padding definitions that impact how keys are formed. These attribute definitions must match among all members of the collection. - For more detail on this error reference: https://github.com/tywalch/electrodb#join');
    });

    it('should throw when attributes used in a shared collection pk are defined with missing padding configurations', () => {
        expect(() => {
            new Service({
                baseEntity,
                actuallyHasPadding,
            });
        }).to.throw('Inconsistent attribute(s) on the entity "actuallyHasPadding". The following attribute(s) are defined with incompatible or conflicting definitions across participating entities: The attribute "notPadded" contains inconsistent padding definitions that impact how keys are formed. These attribute definitions must match among all members of the collection. - For more detail on this error reference: https://github.com/tywalch/electrodb#join');
    });

    it('should not throw when attributes used in a shared collection sk are defined with differing padding configurations', () => {
        expect(() => {
            new Service({
                baseEntity,
                incorrectSk,
            });
        }).not.to.throw();
    });

    it('should not throw when pk attributes of the same name and index are defined with differing padding configurations but do not belong to the same collections', () => {
        expect(() => {
            new Service({
                baseEntity,
                incorrectNonCollection,
            });
        }).not.to.throw();
    });
});

const createClusteredEntity = (serviceName: string, entityName: string) => {
    return new Entity({
        model: {
            service: serviceName,
            entity: entityName,
            version: '1'
        },
        attributes: {
            prop1: {
                type: 'string',
            },
            prop2: {
                type: 'number',
                padding: {
                    char: '0',
                    length: 2,
                }
            },
            prop3: {
                type: 'string'
            },
            prop4: {
                type: 'string'
            },
            prop5: {
                type: 'number',
                padding: {
                    char: '0',
                    length: 2,
                }
            },
            prop6: {
                type: 'string'
            },
            prop7: {
                type: 'string'
            }
        },
        indexes: {
            primary: {
                collection: 'primaryCollection',
                type: 'clustered',
                pk: {
                    field: 'pk',
                    composite: ['prop1']
                },
                sk: {
                    field: 'sk',
                    composite: ['prop2', 'prop3']
                },
            },
            secondary: {
                index: 'gsi1pk-gsi1sk-index',
                type: 'clustered',
                collection: 'secondaryCollection',
                pk: {
                    field: 'gsi1pk',
                    composite: ['prop4']
                },
                sk: {
                    field: 'gsi1sk',
                    composite: ['prop5', 'prop6']
                },
            },
        }
    }, {table, client});
}

const createIsolatedEntity = (serviceName: string, entityName: string) => {
    return new Entity({
        model: {
            service: serviceName,
            entity: entityName,
            version: '1'
        },
        attributes: {
            prop1: {
                type: 'string',
            },
            prop2: {
                type: 'number',
                padding: {
                    char: '0',
                    length: 2,
                }
            },
            prop3: {
                type: 'string'
            },
            prop4: {
                type: 'string'
            },
            prop5: {
                type: 'number',
                padding: {
                    char: '0',
                    length: 2,
                }
            },
            prop6: {
                type: 'string'
            },
            prop7: {
                type: 'string'
            }
        },
        indexes: {
            primary: {
                collection: 'primaryCollection',
                type: 'isolated',
                pk: {
                    field: 'pk',
                    composite: ['prop1']
                },
                sk: {
                    field: 'sk',
                    composite: ['prop2', 'prop3']
                },
            },
            secondary: {
                index: 'gsi1pk-gsi1sk-index',
                type: 'isolated',
                collection: 'secondaryCollection',
                pk: {
                    field: 'gsi1pk',
                    composite: ['prop4']
                },
                sk: {
                    field: 'gsi1sk',
                    composite: ['prop5', 'prop6']
                },
            },
        }
    }, {table, client});
}

type IndexTypeTestItem = {
    prop1: string;
    prop2: number;
    prop3: string;
    prop4: string;
    prop5: number;
    prop6: string;
    prop7: string;
}

type IndexTypeTestItemCompositeKey = Pick<IndexTypeTestItem, 'prop1' | 'prop2' | 'prop3'>;

const createItem = (primaryIndexPk: string, secondaryIndexPk: string, index: number) => {
    return {
        prop1: primaryIndexPk,
        prop2: index,
        prop3: uuid(),
        prop4: secondaryIndexPk,
        prop5: index,
        prop6: uuid(),
        prop7: uuid(),
    }
}

type CreateServiceOptions = {
    serviceName: string;
    entity1Name?: string;
    entity2Name?: string;
}

const createClusteredService = (options: CreateServiceOptions) => {
    const {entity1Name, entity2Name, serviceName} = options;
    const entity1 = createClusteredEntity(serviceName, entity1Name ?? uuid());
    const entity2 = createClusteredEntity(serviceName, entity2Name ?? uuid());
    return new Service({
        entity1,
        entity2,
    });
}

const createIsolatedService = (options: CreateServiceOptions) => {
    const {entity1Name, entity2Name, serviceName} = options;
    const entity1 = createIsolatedEntity(serviceName, entity1Name ?? uuid());
    const entity2 = createIsolatedEntity(serviceName, entity2Name ?? uuid());
    return new Service({
        entity1,
        entity2,
    });
}

const createCompositeKey = (item: IndexTypeTestItemCompositeKey) => {
    return item.prop1 + item.prop2 + item.prop3;
}

describe('index types', () => {
   it('should iterate through only the specified entities regardless of type', async () => {
       const serviceName = uuid();
       const entity1Name = 'entity1';
       const entity2Name = 'entity2';
       const clusteredService = createClusteredService({
           serviceName,
           entity1Name: `clustered+${entity1Name}`,
           entity2Name: `clustered+${entity2Name}`
       });
       const isolatedService = createIsolatedService({
           serviceName,
           entity1Name: `isolated+${entity1Name}`,
           entity2Name: `isolated+${entity2Name}`
       });
       const clusteredPrimaryPkKey = `cluz|${uuid()}`;
       const clusteredSecondaryPkKey = `cluz|${uuid()}`;
       const isolatedPrimaryPkKey = `iso|${uuid()}`;
       const isolatedSecondaryPkKey = `iso|${uuid()}`;
       const clusteredEntity1Items: IndexTypeTestItem[] = [];
       const clusteredEntity2Items: IndexTypeTestItem[] = [];
       const isolatedEntity1Items: IndexTypeTestItem[] = [];
       const isolatedEntity2Items: IndexTypeTestItem[] = [];
       const print = (val: any) => console.log(JSON.stringify(val, null, 4));

       const compareItems = (items: IndexTypeTestItemCompositeKey[], expected: IndexTypeTestItemCompositeKey[]) => {
           expect(items.length).to.be.greaterThan(0);
           expect(items.length).to.equal(expected.length);
           const allMatch = expected.every(item => items.find(found => createCompositeKey(item) === createCompositeKey(found)));
           expect(allMatch).to.be.true;
       }

       for (let i = 0; i < 10; i++) {
           clusteredEntity1Items.push(createItem(clusteredPrimaryPkKey, clusteredSecondaryPkKey, i));
           clusteredEntity2Items.push(createItem(clusteredPrimaryPkKey, clusteredSecondaryPkKey, i));
           isolatedEntity1Items.push(createItem(isolatedPrimaryPkKey, isolatedSecondaryPkKey, i));
           isolatedEntity2Items.push(createItem(isolatedPrimaryPkKey, isolatedSecondaryPkKey, i));
       }

       await Promise.all([
           clusteredService.entities.entity1.put(clusteredEntity1Items).go(),
           clusteredService.entities.entity2.put(clusteredEntity2Items).go(),
           isolatedService.entities.entity1.put(isolatedEntity1Items).go(),
           isolatedService.entities.entity2.put(isolatedEntity2Items).go(),
       ]);

       const isolatedPrimaryCollectionData = await isolatedService.collections.primaryCollection({
           prop1: isolatedPrimaryPkKey,
       }).go();

       expect(isolatedPrimaryCollectionData.cursor).to.be.null;
       compareItems(isolatedPrimaryCollectionData.data.entity1, isolatedEntity1Items);
       compareItems(isolatedPrimaryCollectionData.data.entity2, isolatedEntity2Items);

       const isolatedSecondaryCollectionData = await isolatedService.collections.secondaryCollection({
           prop4: isolatedSecondaryPkKey,
       }).go();

       expect(isolatedSecondaryCollectionData.cursor).to.be.null;
       compareItems(isolatedSecondaryCollectionData.data.entity1, isolatedEntity1Items);
       compareItems(isolatedSecondaryCollectionData.data.entity2, isolatedEntity2Items);

       const clusteredPrimaryCollectionData = await clusteredService.collections.primaryCollection({
           prop1: clusteredPrimaryPkKey,
       }).go();

       expect(clusteredPrimaryCollectionData.cursor).to.be.null;
       compareItems(clusteredPrimaryCollectionData.data.entity1, clusteredEntity1Items);
       compareItems(clusteredPrimaryCollectionData.data.entity2, clusteredEntity2Items);

       const clusteredSecondaryCollectionData = await clusteredService.collections.secondaryCollection({
           prop4: clusteredSecondaryPkKey,
       }).go();

       expect(clusteredSecondaryCollectionData.cursor).to.be.null;
       compareItems(clusteredSecondaryCollectionData.data.entity1, clusteredEntity1Items);
       compareItems(clusteredSecondaryCollectionData.data.entity2, clusteredEntity2Items);

       // sort keys with collection

       const isolatedPrimaryCollectionPartialSKData = await isolatedService.collections.primaryCollection({
           prop1: isolatedPrimaryPkKey,
           prop2: 5,
       }).go({logger: print});

       expect(isolatedPrimaryCollectionPartialSKData.cursor).to.be.null;
       compareItems(isolatedPrimaryCollectionPartialSKData.data.entity1, [isolatedEntity1Items[5]]);
       compareItems(isolatedPrimaryCollectionPartialSKData.data.entity2, [isolatedEntity2Items[5]]);

       const isolatedSecondaryCollectionPartialSKData = await isolatedService.collections.secondaryCollection({
           prop4: isolatedSecondaryPkKey,
           prop5: 5,
       }).go();

       expect(isolatedSecondaryCollectionPartialSKData.cursor).to.be.null;
       compareItems(isolatedSecondaryCollectionPartialSKData.data.entity1, [isolatedEntity1Items[5]]);
       compareItems(isolatedSecondaryCollectionPartialSKData.data.entity2, [isolatedEntity2Items[5]]);

       const clusteredPrimaryCollectionPartialSKData = await clusteredService.collections.primaryCollection({
           prop1: clusteredPrimaryPkKey,
           prop2: 5,
       }).go();

       expect(clusteredPrimaryCollectionPartialSKData.cursor).to.be.null;
       compareItems(clusteredPrimaryCollectionPartialSKData.data.entity1, [clusteredEntity1Items[5]]);
       compareItems(clusteredPrimaryCollectionPartialSKData.data.entity2, [clusteredEntity2Items[5]]);

       const clusteredSecondaryCollectionPartialSKData = await clusteredService.collections.secondaryCollection({
           prop4: clusteredSecondaryPkKey,
           prop5: 5,
       }).go();

       expect(clusteredSecondaryCollectionPartialSKData.cursor).to.be.null;
       compareItems(clusteredSecondaryCollectionPartialSKData.data.entity1, [clusteredEntity1Items[5]]);
       compareItems(clusteredSecondaryCollectionPartialSKData.data.entity2, [clusteredEntity2Items[5]]);
   });
});