import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { Entity } from '../';
import {expect} from "chai";
import {v4 as uuid} from "uuid";

const client = new DocumentClient({
    endpoint: 'http://localhost:8000',
    region: 'us-east-1',
});

describe('conversions', () => {
    const table = 'electro';
    const serviceName = uuid();
    const entity = new Entity({
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
            },
            count: {
                type: 'number'
            },
            kind: {
                type: 'string'
            }
        },
        indexes: {
            defaultKeyStructure: {
                collection: 'defaultKeyCollection',
                pk: {
                    field: 'pk',
                    composite: ['organizationId', 'state']
                },
                sk: {
                    field: 'sk',
                    composite: ['accountId', 'name']
                }
            },
            customKeyStructure: {
                collection: 'customKeyCollection',
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
            },
            pkOnlyDefaultKeyStructure: {
                index: 'gsi2pk-gsi2sk-index',
                pk: {
                    field: 'gsi2pk',
                    composite: ['organizationId', 'state']
                },
            },
            pkOnlyCustomKeyStructure: {
                index: 'gsi3pk-gsi3sk-index',
                pk: {
                    field: 'gsi3pk',
                    composite: ['name'],
                    template: 'location#${name}',
                },
            },
            attributeRefKeyStructure: {
                collection: 'attributeRefKeyStructureCollection',
                index: 'gsi4pk-gsi4sk-index',
                pk: {
                    field: 'gsi4pk',
                    composite: ['kind'],
                    template: '${kind}',
                },
                sk: {
                    field: 'gsi4sk',
                    composite: ['count'],
                    template: '${count}'
                }
            },

            defaultKeyStructureClustered: {
                type: 'clustered',
                index: 'gsi5pk-gsi5sk-index',
                collection: 'defaultKeyClusteredCollection',
                pk: {
                    field: 'gsi5pk',
                    composite: ['organizationId', 'state']
                },
                sk: {
                    field: 'gsi5sk',
                    composite: ['accountId', 'name']
                }
            },
            customKeyStructureClustered: {
                type: 'clustered',
                collection: 'customKeyClusteredCollection',
                index: 'gsi6pk-gsi6sk-index',
                pk: {
                    field: 'gsi6pk',
                    composite: ['name'],
                    template: 'location#${name}',
                },
                sk: {
                    field: 'gsi6sk',
                    composite: ['state', 'county', 'city'],
                    template: "state#${state}#county#${county}#city#${city}e1"
                }
            },
            attributeRefKeyStructureClustered: {
                type: 'clustered',
                collection: 'attributeRefKeyStructureClusteredCollectionClustered',
                index: 'gsi9pk-gsi9sk-index',
                pk: {
                    field: 'gsi9pk',
                    composite: ['kind'],
                    template: '${kind}',
                },
                sk: {
                    field: 'gsi9sk',
                    composite: ['count'],
                    template: '${count}'
                }
            },

            defaultKeyStructureClusteredCaseless: {
                type: 'clustered',
                index: 'gsi10pk-gsi10sk-index',
                collection: 'defaultKeyClusteredCaselessCollection',
                pk: {
                    field: 'gsi10pk',
                    composite: ['organizationId', 'state'],
                    casing: 'none',
                },
                sk: {
                    field: 'gsi10sk',
                    composite: ['accountId', 'name'],
                    casing: 'none',
                }
            },
            customKeyStructureClusteredCaseless: {
                type: 'clustered',
                collection: 'customKeyClusteredCaselessCollection',
                index: 'gsi11pk-gsi11sk-index',
                pk: {
                    field: 'gsi11pk',
                    composite: ['name'],
                    template: 'location#${name}',
                    casing: 'none',
                },
                sk: {
                    field: 'gsi11sk',
                    composite: ['state', 'county', 'city'],
                    casing: 'none',
                    template: "state#${state}#county#${county}#city#${city}e1"
                }
            },
            pkOnlyDefaultKeyStructureClusteredCaseless: {
                index: 'gsi12pk-gsi12sk-index',
                pk: {
                    field: 'gsi12pk',
                    casing: 'none',
                    composite: ['organizationId', 'state']
                },
            },
            pkOnlyCustomKeyStructureClusteredCaseless: {
                index: 'gsi13pk-gsi13sk-index',
                pk: {
                    field: 'gsi13pk',
                    casing: 'none',
                    composite: ['name'],
                    template: 'location#${name}',
                },
            },
            attributeRefKeyStructureClusteredCaseless: {
                type: 'clustered',
                collection: 'attributeRefKeyStructureClusteredCollection',
                index: 'gsi14pk-gsi14sk-index',
                pk: {
                    field: 'gsi14pk',
                    casing: 'none',
                    composite: ['kind'],
                    template: '${kind}',
                },
                sk: {
                    field: 'gsi14sk',
                    casing: 'none',
                    composite: ['count'],
                    template: '${count}'
                }
            }
        }
    }, { table, client });

    const evaluateAccessPattern = (accessPattern: keyof typeof entity.schema.indexes, item: typeof record) => {
        const cursor = entity.conversions.byAccessPattern[accessPattern].fromComposite.toCursor(item);
        expect(cursor).not.to.be.null;

        const keys = entity.conversions.byAccessPattern[accessPattern].fromComposite.toKeys(item);
        expect(keys).not.to.be.null;

        const cursorFromKeys = entity.conversions.byAccessPattern[accessPattern].fromKeys.toCursor(keys!);
        expect(cursorFromKeys).not.to.be.null;
        expect(cursor).to.equal(cursorFromKeys);

        const keysFromCursor = entity.conversions.byAccessPattern[accessPattern].fromCursor.toKeys(cursor!);
        expect(keysFromCursor).not.to.be.null;

        const compositeFromCursor = entity.conversions.byAccessPattern[accessPattern].fromCursor.toComposite(cursor!);
        expect(compositeFromCursor).not.to.be.null;

        const compositeFromKeys = entity.conversions.byAccessPattern[accessPattern].fromKeys.toComposite(keys!);
        expect(compositeFromKeys).not.to.be.null;
        expect(keys).to.deep.equal(keysFromCursor);

        expect(Object.entries(compositeFromCursor!).length).to.be.greaterThan(0);

        for (const [name, value] of Object.entries(compositeFromCursor!)) {
            if (name in item) {
                const itemValue = item[name as keyof typeof item]
                if (typeof itemValue === 'string') {
                    expect(itemValue.toLowerCase()).to.equal(value.toLowerCase());
                } else {
                    expect(itemValue).to.equal(value);
                }
            } else {
                throw new Error('Composite not in item!');
            }
        }

        expect(Object.entries(compositeFromKeys!).length).to.be.greaterThan(0);

        for (const [name, value] of Object.entries(compositeFromKeys!)) {
            if (name in item) {
                const itemValue = item[name as keyof typeof item]
                if (typeof itemValue === 'string') {
                    expect(itemValue.toLowerCase()).to.equal(value.toLowerCase());
                } else {
                    expect(itemValue).to.equal(value);
                }
            } else {
                throw new Error('Composite not in item!');
            }
        }
    }

    const evaluateAccessPatternFromKeys = (accessPattern: keyof typeof entity.schema.indexes, keys: any) => {
        const item = entity.conversions.byAccessPattern[accessPattern].fromKeys.toComposite(keys);
        if (!item) {
            throw new Error('Item not defined!');
        }
        // @ts-ignore
        const cursor = entity.conversions.byAccessPattern[accessPattern].fromComposite.toCursor(item);
        expect(cursor).not.to.be.null;

        const cursorFromKeys = entity.conversions.byAccessPattern[accessPattern].fromKeys.toCursor(keys!);
        expect(cursorFromKeys).not.to.be.null;
        expect(cursor).to.equal(cursorFromKeys);

        const keysFromCursor = entity.conversions.byAccessPattern[accessPattern].fromCursor.toKeys(cursor!);
        expect(keysFromCursor).not.to.be.null;

        const compositeFromCursor = entity.conversions.byAccessPattern[accessPattern].fromCursor.toComposite(cursor!);
        expect(compositeFromCursor).not.to.be.null;

        // @ts-ignore
        const keysFromComposite = entity.conversions.byAccessPattern[accessPattern].fromComposite.toKeys(item);
        expect(keysFromComposite).not.to.be.null;
        expect(keysFromCursor).to.deep.equal(keysFromComposite);

        expect(Object.entries(compositeFromCursor!).length).to.be.greaterThan(0);

        for (const [name, value] of Object.entries(compositeFromCursor!)) {
            if (name in item) {
                const itemValue = item[name as keyof typeof item]
                if (typeof itemValue === 'string') {
                    expect(itemValue.toLowerCase()).to.equal(value.toLowerCase());
                } else {
                    expect(itemValue).to.equal(value);
                }
            } else {
                throw new Error('Composite not in item!');
            }
        }

        expect(Object.entries(keysFromComposite!).length).to.be.greaterThan(0);

        for (const [name, value] of Object.entries(keysFromComposite!)) {
            if (name in keysFromComposite!) {
                const itemValue = keys[name as keyof typeof keys];
                if (typeof itemValue === 'string') {
                    if (typeof value !== 'string') {
                        throw new Error('Value not string!');
                    }
                    expect(itemValue.toLowerCase()).to.equal(value.toLowerCase());
                } else {
                    expect(itemValue).to.equal(value);
                }
            } else {
                throw new Error('Composite not in item!');
            }
        }
    }

    const accessPatterns = [
        ['has default electrodb key structure', 'defaultKeyStructure'],
        ['has custom key structure using template', 'customKeyStructure'],
        ['has default key structure but with only a pk', 'pkOnlyDefaultKeyStructure'],
        ['has custom key structure with template but with only a pk', 'pkOnlyCustomKeyStructure'],
        ['has direct attribute reference key', 'attributeRefKeyStructure'],
        ['has default key structure but on a clustered index', 'defaultKeyStructureClustered'],
        ['has custom key structure but with a clustered index', 'customKeyStructureClustered'],
        ['has direct attribute reference but with index defined as clustered', 'attributeRefKeyStructureClustered'],
        ['has default key structure but on a clustered index and caseless keys', 'defaultKeyStructureClusteredCaseless'],
        ['has custom key structure but with a clustered index and caseless keys', 'customKeyStructureClusteredCaseless'],
        ['has default key structure but with only a pk and caseless keys', 'pkOnlyDefaultKeyStructureClusteredCaseless'],
        ['has custom key structure with template but with only a pk and caseless keys', 'pkOnlyCustomKeyStructureClusteredCaseless'],
        ['has direct attribute reference key and caseless keys', 'attributeRefKeyStructureClusteredCaseless'],
    ] as const;

    const record = {
        name: 'nameProperty',
        accountId: 'accountIdProperty',
        organizationId: 'organizationIdProperty',
        city: 'cityProperty',
        county: 'countyProperty',
        state: 'stateProperty',
        count: 10,
        kind: 'kindProperty',
    }

    for (let i = 0; i < accessPatterns.length; i++) {
        const [description, accessPattern] = accessPatterns[i];
        it(`should perform all conversions without loss starting with an item for an index that ${description}`, () => {
            evaluateAccessPattern(accessPattern, record);
        });

        it(`should perform all conversions without loss starting with keys for an index that ${description}`, () => {
            const params = entity.put(record).params();
            const keys: Record<string, string | number> = {};
            for (const prop in params.Item) {
                if (prop.startsWith('gsi') || prop === 'pk' || prop === 'sk') {
                    keys[prop] = params.Item[prop];
                }
            }

            expect(Object.keys(keys).length).to.equal(22);

            evaluateAccessPatternFromKeys(accessPattern, keys);
        });
    }
});

describe('key formatting', () => {
    describe('pre and post fixing attribute reference keys', () => {
        // it('should always correctly add prefixes and postfixes to keys - issue#225', () => {
            const table = "your_table_name";

            const createEntity = (options: {
                pkTemplate: string;
                skTemplate: string;
                pkCasing: 'upper' | 'lower' | 'none' | 'default';
                skCasing: 'upper' | 'lower' | 'none' | 'default';
            }) => {
                const {skTemplate, pkTemplate, pkCasing, skCasing} = options;
                return new Entity(
                    {
                        model: {
                            entity: 'notification',
                            version: '1',
                            service: 'notifications',
                        },
                        attributes: {
                            userId: {
                                type: 'string',
                            },
                            message: {
                                type: 'string',
                            },
                            time: {
                                type: 'string',
                            },
                        },
                        indexes: {
                            byUserId: {
                                pk: {
                                    field: 'userId',
                                    template: pkTemplate,
                                    composite: ['userId'],
                                    casing: pkCasing,
                                },
                                sk: {
                                    field: 'requestId',
                                    template: skTemplate,
                                    composite: ['time'],
                                    casing: skCasing,
                                },
                            },
                        },
                    },
                    {
                        table,
                    },
                );
            }

            const casings = [
                'none',
                'upper',
                'lower',
                'default',
            ] as const;

            const fixings = [
                ['prefix-', ''],
                ['', '-postfix'],
                ['prefix-', '-postfix'],
                ['', ''],
            ];

            function createTemplates(key: string) {
                const templates: [string, (test: string, val: string) => void][] = [];
                for (const [prefix, postfix] of fixings) {
                    let template = '${' + key + '}';
                    if (prefix) {
                        template = prefix + template;
                    }
                    if (postfix) {
                        template = template + postfix;
                    }
                    const test = (test: string, val: string) => {
                        const prefixIsValid = (!prefix || val.toLowerCase().startsWith(prefix.toLowerCase()));
                        const postfixIsValid = (!postfix || val.toLowerCase().endsWith(postfix.toLowerCase()));
                        const skException = test.startsWith('sk');

                        if (prefixIsValid && (postfixIsValid || skException)) {
                            return;
                        }

                        throw new Error(`${test}. Expected ${test} value "${val}" to have prefix "${prefix || '(NONE)'}" and postfix "${postfix || '(NONE)'}"`);
                    }
                    templates.push([template, test]);
                }
                return templates;
            }

        const pkTemplates = createTemplates('userId');
        const skTemplates = createTemplates('time');
        const pkCasing = 'default' as const;
        const skCasing = 'default' as const;

        for (const pkCasing of casings) {
            for (const skCasing of casings) {
                for (const [pkTemplate, pkTest] of pkTemplates) {
                    for (const [skTemplate, skTest] of skTemplates) {
                        const entity = createEntity({
                            skTemplate: skTemplate,
                            pkTemplate: pkTemplate,
                            pkCasing,
                            skCasing,
                        });

                        describe(`when pk casing is ${pkCasing}, sk casing is ${skCasing}, the pk template is ${pkTemplate}, or the sk template is ${skTemplate}`, () => {
                            it('should perform begins with query', () => {
                                const queryParams1 = entity.query.byUserId({
                                    userId: 'Brad-01',
                                }).params();

                                pkTest('pk', queryParams1['ExpressionAttributeValues'][':pk']);
                                if (skTemplate[0] !== '$') {
                                    skTest('sk', queryParams1['ExpressionAttributeValues'][':sk1']);
                                }
                            });

                            it('should perform a gte query', () => {
                                const queryParamsGte = entity.query.byUserId({
                                    userId: 'Brad-01',
                                }).gte({time: "2022-01-01T00:00:00.000Z"}).params();
                                // queryParamsGte).to.equal('brad-01-no;
                                pkTest('pk', queryParamsGte['ExpressionAttributeValues'][':pk']);
                                if (queryParamsGte['ExpressionAttributeValues'][':sk1']) {
                                    skTest('sk', queryParamsGte['ExpressionAttributeValues'][':sk1']);
                                }
                            });
                            it('should perform a gt query', () => {
                                const queryParamsGt = entity.query.byUserId({
                                    userId: 'Brad-01',
                                }).gt({time: "2022-01-01T00:00:00.000Z"})
                                    .params();
                                // queryParamsGt).to.equal('brad-01-no;
                                pkTest('pk', queryParamsGt['ExpressionAttributeValues'][':pk']);
                                skTest('sk', queryParamsGt['ExpressionAttributeValues'][':sk1']);
                            });

                            it('should perform a lte query', () => {
                                const queryParamsLte = entity.query.byUserId({
                                    userId: 'Brad-01',
                                }).lte({time: "2022-01-01T00:00:00.000Z"})
                                    .params();
                                // queryParamsLte).to.equal(';
                                pkTest('pk', queryParamsLte['ExpressionAttributeValues'][':pk']);
                                skTest('sk', queryParamsLte['ExpressionAttributeValues'][':sk1']);
                            });

                            it('should perform a lt query', () => {
                                const queryParamsLt = entity.query.byUserId({
                                    userId: 'Brad-01',
                                }).lt({time: "2022-01-01T00:00:00.000Z"})
                                    .params();
                                // queryParamsLt).to.equal(';
                                pkTest('pk', queryParamsLt['ExpressionAttributeValues'][':pk']);
                                skTest('sk', queryParamsLt['ExpressionAttributeValues'][':sk1']);
                            });

                            it('should perform a between query', () => {
                                const queryParamsBetween = entity.query.byUserId({
                                    userId: 'Brad-01',
                                }).between(
                                    {time: "2022-01-01T00:00:00.000Z"},
                                    {time: "2023-01-01T00:00:00.000Z"},
                                ).params();

                                // queryParamsBetween).to.equal(';
                                pkTest('pk', queryParamsBetween['ExpressionAttributeValues'][':pk']);
                                skTest('sk1', queryParamsBetween['ExpressionAttributeValues'][':sk1']);
                                skTest('sk2', queryParamsBetween['ExpressionAttributeValues'][':sk2']);
                            });

                            it('should perform a begins with query', () => {
                                const queryParamsBegins = entity.query.byUserId({
                                    userId: 'Brad-01',
                                }).begins({
                                    time: "2022-01-01",
                                }).params();
                                // queryParamsBegins).to.equal(';
                                pkTest('pk', queryParamsBegins['ExpressionAttributeValues'][':pk']);
                                skTest('sk', queryParamsBegins['ExpressionAttributeValues'][':sk1']);
                            });

                            it('should perform a full equality with query', () => {
                                const queryParamsBegins = entity.query.byUserId({
                                    userId: 'Brad-01',
                                    time: "2022-01-01",
                                }).params();
                                // queryParamsBegins).to.equal(';
                                pkTest('pk', queryParamsBegins['ExpressionAttributeValues'][':pk']);
                                skTest('sk', queryParamsBegins['ExpressionAttributeValues'][':sk1']);
                            });

                            it('should perform a create operation', () => {
                                // expected - pk is brad-01-notification
                                const createParams = entity.create({
                                    userId: 'Brad-01',
                                    time: '2020-01-01T00:00:00.000Z',
                                    message: "Hi"
                                }).params();
                                // createParams).to.equal(';
                                pkTest('pk', createParams.Item.userId);
                                skTest('sk', createParams.Item.requestId);
                            });

                            it('should perform a batch put operation', () => {
                                const batchPutParams = entity.put([{
                                    userId: 'Brad-01',
                                    time: '2020-01-01T00:00:00.000Z',
                                    message: "Hi"
                                }]).params();
                            });

                            it('should perform an update', () => {
                                const updateParams = entity.update({
                                    userId: 'Brad-01',
                                    time: '2020-01-01T00:00:00.000Z'
                                }).set({
                                    message: "Hello"
                                }).params();
                                // updateParams).to.equal(';
                                pkTest('pk', updateParams.Key.userId);
                                skTest('sk', updateParams.Key.requestId);
                            });

                            it('should perform a get operation', () => {
                                const getParams = entity.get({
                                    time: "123",
                                    userId: "Brad-01"
                                }).params();
                                // getParams).to.equal(';
                                pkTest('pk', getParams['Key']['userId']);
                                skTest('sk', getParams['Key']['requestId']);
                            });

                            it('should perform a batch get operation', () => {
                                const batchGetParams = entity.get([{
                                    time: "123",
                                    userId: "Brad-01"
                                }]).params();
                            });
                        });
                    }
                }
            }
        }
    });
});