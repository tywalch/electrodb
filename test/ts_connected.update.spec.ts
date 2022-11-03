process.env.AWS_NODEJS_CONNECTION_REUSE_ENABLED = "1";
import {createCustomAttribute, Entity} from "../index";
import { expect } from "chai";
import {v4 as uuid} from "uuid";
import moment from "moment";
import DynamoDB from "aws-sdk/clients/dynamodb";
const client = new DynamoDB.DocumentClient({
    region: "us-east-1",
    endpoint: process.env.LOCAL_DYNAMO_ENDPOINT
});

const table = "electro";

const users = new Entity({
    model: {
        entity: "user",
        service: "versioncontrol",
        version: "1"
    },
    attributes: {
        username: {
            type: "string"
        },
        fullName: {
            type: "string"
        },
        photo: {
            type: "string"
        },
        bio: {
            type: "string"
        },
        location: {
            type: "string"
        },
        pinned: {
            type: "any"
        },
    },
    indexes: {
        user: {
            collection: "overview",
            pk: {
                composite: ["username"],
                field: "pk"
            },
            sk: {
                composite: [],
                field: "sk"
            }
        },
        _: {
            collection: "owned",
            index: "gsi1pk-gsi1sk-index",
            pk: {
                composite: ["username"],
                field: "gsi1pk"
            },
            sk: {
                field: "gsi1sk",
                composite: []
            }
        },
        geographics: {
            index: "gsi2pk-gsi2sk-index",
            pk: {
                composite: ["location"],
                field: "gsi2pk"
            },
            sk: {
                composite: [],
                field: "gsi2sk"
            }
        },
    }
}, {table, client});

const licenses = [
    "afl-3.0",
    "apache-2.0",
    "artistic-2.0",
    "bsl-1.0",
    "bsd-2-clause",
    "bsd-3-clause",
    "bsd-3-clause-clear",
    "cc",
    "cc0-1.0",
    "cc-by-4.0",
    "cc-by-sa-4.0",
    "wtfpl",
    "ecl-2.0",
    "epl-1.0",
    "epl-2.0",
    "eupl-1.1",
    "agpl-3.0",
    "gpl",
    "gpl-2.0",
    "gpl-3.0",
    "lgpl",
    "lgpl-2.1",
    "lgpl-3.0",
    "isc",
    "lppl-1.3c",
    "ms-pl",
    "mit",
    "mpl-2.0",
    "osl-3.0",
    "postgresql",
    "ofl-1.1",
    "ncsa",
    "unlicense",
    "zlib"
] as const;

const repositories = new Entity({
    model: {
        entity: "repositories",
        service: "versioncontrol",
        version: "1"
    },
    attributes: {
        repoName: {
            type: "string"
        },
        repoOwner: {
            type: "string"
        },
        about: {
            type: "string"
        },
        username: {
            type: "string",
            readOnly: true,
            watch: ["repoOwner"],
            set: (_, {repoOwner}) => repoOwner
        },
        description: {
            type: "string"
        },
        isPrivate: {
            type: "boolean"
        },
        license: {
            type: licenses
        },
        defaultBranch: {
            type: "string",
            default: "main"
        },
        stars: {
            type: "number",
            default: 0
        },
        createdAt: {
            type: "string",
            default: () => moment.utc().format(),
            readOnly: true
        },
        recentCommits: {
            type: "list",
            items: {
                type: "map",
                properties: {
                    sha: {
                        type: "string"
                    },
                    data: {
                        type: "string"
                    },
                    message: {
                        type: "string"
                    },
                    views: {
                        type: "number"
                    },
                    timestamp: {
                        type: "number"
                    }
                }

            }
        },
        custom: {
            type: "any"
        },
        views: {
            type: "number"
        },
        tags: {
            type: "set",
            items: "string",
        },
        followers: {
            type: "set",
            items: "string",
        },
        files: {
            type: "list",
            items: {
                type: "string"
            }
        },
    }
    ,
    indexes: {
        repositories: {
            collection: "alerts",
            pk: {
                composite: ["repoOwner"],
                field: "pk"
            },
            sk: {
                composite: ["repoName"],
                field: "sk"
            }
        },
        created: {
            collection: "owned",
            index: "gsi1pk-gsi1sk-index",
            pk: {
                composite: ["username"],
                field: "gsi1pk"
            },
            sk: {
                composite: ["isPrivate", "createdAt"],
                field: "gsi1sk"
            }
        },
    }
}, {table, client});

const StoreLocations = new Entity({
    model: {
        service: "MallStoreDirectory",
        entity: "MallStore",
        version: "1",
    },
    attributes: {
        cityId: {
            type: "string",
            required: true,
        },
        mallId: {
            type: "string",
            required: true,
        },
        storeId: {
            type: "string",
            required: true,
        },
        buildingId: {
            type: "string",
            required: true,
        },
        unitId: {
            type: "string",
            required: true,
        },
        category: {
            type: [
                "spite store",
                "food/coffee",
                "food/meal",
                "clothing",
                "electronics",
                "department",
                "misc"
            ],
            required: true
        },
        leaseEndDate: {
            type: "string",
            required: true
        },
        rent: {
            type: "number",
            required: true,
        },
        discount: {
            type: "number",
            required: false,
            default: 0,
        },
        tenant: {
            type: "set",
            items: "string"
        },
        deposit: {
            type: "number"
        },
        rentalAgreement: {
            type: "list",
            items: {
                type: "map",
                properties: {
                    type: {
                        type: "string",
                        required: true
                    },
                    detail: {
                        type: "string",
                        required: true
                    }
                }
            }
        },
        tags: {
            type: "set",
            items: "string"
        },
        contact: {
            type: "set",
            items: "string"
        },
        leaseHolders: {
            type: "set",
            items: "string",
        },
        petFee: {
            type: "number"
        },
        totalFees: {
            type: "number"
        },
        listAttribute: {
            type: "list",
            items: {
                type: "map",
                properties: {
                    setAttribute: {
                        type: "set",
                        items: "string"
                    }
                }
            }
        },
        mapAttribute: {
            type: "map",
            properties: {
                mapProperty: {
                    type: "string"
                }
            }
        }
    },
    indexes: {
        stores: {
            pk: {
                field: "pk",
                composite: ["cityId", "mallId"]
            },
            sk: {
                field: "sk",
                composite: ["buildingId", "storeId"]
            }
        },
        units: {
            index: "gis1pk-gsi1sk-index",
            pk: {
                field: "gis1pk",
                composite: ["mallId"]
            },
            sk: {
                field: "gsi1sk",
                composite: ["buildingId", "unitId"]
            }
        },
        leases: {
            index: "gis2pk-gsi2sk-index",
            pk: {
                field: "gis2pk",
                composite: ["storeId"]
            },
            sk: {
                field: "gsi2sk",
                composite: ["leaseEndDate"]
            }
        }
    }
}, {table, client});

describe("Update Item", () => {
    describe('updating deeply nested attributes', () => {
        it('should apply nested defaults on creation', () => {
            const customers = new Entity(
                {
                    model: {
                        entity: "customer",
                        service: "company",
                        version: "1"
                    },
                    attributes: {
                        id: { type: "string"},
                        email: {type: "string" },
                        name: {
                            type: "map",
                            properties: {
                                legal: {
                                    type: "map",
                                    properties: {
                                        first: { type: "string" },
                                        middle: { type: "string" },
                                    }
                                }
                            }
                        },
                        name2: {
                            type: "map",
                            properties: {
                                legal: {
                                    type: "map",
                                    properties: {
                                        first: { type: "string" },
                                        middle: { type: "string", default: 'jorge' },
                                    }
                                }
                            }
                        },
                        name3: {
                            type: "map",
                            properties: {
                                legal: {
                                    type: "map",
                                    properties: {
                                        first: { type: "string" },
                                        middle: { type: "string", default: 'jorge' },
                                    },
                                    default: {}
                                }
                            }
                        },
                        name4: {
                            type: "map",
                            properties: {
                                legal: {
                                    type: "map",
                                    properties: {
                                        first: { type: "string" },
                                        middle: { type: "string", default: 'jorge', required: true },
                                    }
                                }
                            }
                        },
                        name5: {
                            type: "map",
                            properties: {
                                legal: {
                                    type: "map",
                                    properties: {
                                        first: { type: "string" },
                                        middle: { type: "string", default: 'jorge', required: true },
                                    },
                                }
                            }
                        },
                        name6: {
                            type: "map",
                            properties: {
                                legal: {
                                    type: "map",
                                    properties: {
                                        first: { type: "string" },
                                        middle: { type: "string", default: 'jorge', required: true },
                                    },
                                    default: {},
                                }
                            }
                        },
                        name7: {
                            type: "map",
                            properties: {
                                legal: {
                                    type: "map",
                                    properties: {
                                        first: { type: "string" },
                                        middle: { type: "string", default: 'jorge', required: true },
                                    },
                                    default: {},
                                }
                            },
                            required: true,
                            default: () => ({})
                        },
                        name8: {
                            type: "map",
                            properties: {
                                legal: {
                                    type: "map",
                                    properties: {
                                        first: { type: "string" },
                                        middle: { type: "string", required: true },
                                    },
                                    default: {},
                                }
                            }
                        }
                    },
                    indexes: {
                        primary: {
                            pk: {
                                field: "pk",
                                composite: ["id"]
                            },
                            sk: {
                                field: "sk",
                                composite: []
                            }
                        }
                    }
                },
                { table }
            );

            const p1 = customers.create({
                id: "test",
                email: "user@example.com",
                name: { // should save as is
                    legal: {}
                },
                name2: {}, // should save as is
                name3: {}, // should walk up defaults
                name4: {}, // should stop when defaults stop
                name5: {legal: {}}, // should be fine with nested required flag on 'middle' because 'middle' has default
                name6: {}, // no typing issue with default missing because it
                // name:7  does not need to be included despite being 'required', will be set by defaults
            }).params();

            expect(p1).to.deep.equal({
                "Item": {
                    "id": "test",
                    "email": "user@example.com",
                    "name": {
                        "legal": {}
                    },
                    "name2": {},
                    "name3": {
                        "legal": {
                            "middle": "jorge"
                        }
                    },
                    "name4": {},
                    "name5": {
                        "legal": {
                            "middle": "jorge"
                        }
                    },
                    "name6": {
                        "legal": {
                            "middle": "jorge"
                        }
                    },
                    "name7": {
                        "legal": {
                            "middle": "jorge"
                        }
                    },
                    // "name8": {}, // should not exist
                    "pk": "$company#id_test",
                    "sk": "$customer_1",
                    "__edb_e__": "customer",
                    "__edb_v__": "1"
                },
                "TableName": "electro",
                "ConditionExpression": "attribute_not_exists(#pk) AND attribute_not_exists(#sk)",
                "ExpressionAttributeNames": {
                    "#pk": "pk",
                    "#sk": "sk"
                }
            });

            expect(() => customers.create({
                id: "test",
                email: "user@example.com",
                name8: {}, // unfortunate combination, user defined illogical defaults that resulted in non-typed validation error
            }).params()).to.throw('Invalid value type at entity path: "name8.legal.middle". Value is required. - For more detail on this error reference: https://github.com/tywalch/electrodb#invalid-attribute');
        });
        it('should not clobber a deeply nested attribute when updating', async () => {
            const customers = new Entity(
                {
                    model: {
                        entity: "customer",
                        service: "company",
                        version: "1"
                    },
                    attributes: {
                        id: { type: "string"},
                        email: {type: "string" },
                        name: {
                            type: "map",
                            properties: {
                                legal: {
                                    type: "map",
                                    properties: {
                                        first: { type: "string" },
                                        middle: { type: "string" },
                                        last: { type: "string" },
                                    }
                                }
                            }
                        }
                    },
                    indexes: {
                        primary: {
                            pk: {
                                field: "pk",
                                composite: ["id"]
                            },
                            sk: {
                                field: "sk",
                                composite: [],
                            }
                        }
                    }
                },
                { table, client }
            );

            const id1 = uuid();
            const id2 = uuid();
            const email = "user@example.com";

            await customers.create({ id: id1, email }).go();
            await customers.create({ id: id2, email, name: { legal: {} } }).go();

            const retrieved1 = await customers.get({id: id1}).go().then(res => res.data);
            const retrieved2 = await customers.get({id: id2}).go().then(res => res.data);

            expect(retrieved1).to.deep.equal({
                email,
                id: id1,
                // name: {} should not exist (wasn't put)
            });

            expect(retrieved2).to.deep.equal({
                email,
                id: id2,
                name: {
                    legal: {}
                }
            });

            const updated1 = await customers.patch({id: id1})
                .data((attr, op) => {
                    op.set(attr.name.legal.first, 'joe');
                    op.set(attr.name.legal.last, 'exotic');
                })
                .go({response: 'all_new'})
                .then(res => res.data)
                .then((data) => ({success: true, result: data}))
                .catch(err => ({success: false, result: err}));

            expect(updated1.success).to.be.false;
            expect(updated1.result.message).to.equal('The document path provided in the update expression is invalid for update - For more detail on this error reference: https://github.com/tywalch/electrodb#aws-error');

            const updated2 = await customers.patch({id: id2})
                .data((attr, op) => {
                    op.set(attr.name.legal.first, 'joe');
                    op.set(attr.name.legal.last, 'exotic');
                }).go({response: 'all_new'}).then(res => res.data);

            expect(updated2).to.deep.equal({
                id: id2,
                email,
                name: {
                    legal: {
                        first: 'joe',
                        last: 'exotic',
                    }
                }
            });
        });

        describe('Map Attributes and empty objects', () => {
            it('should return an empty object with a Map Attribute when one is set via a static default', async () => {
                const entityWithDefault = new Entity({
                    model: {
                        entity: 'emptyObjects',
                        service: 'mapAttributeTests',
                        version: '1'
                    },
                    attributes: {
                        prop1: {
                            type: 'string'
                        },
                        prop2: {
                            type: 'map',
                            properties: {
                                prop3: {
                                    type: 'string'
                                }
                            },
                            default: {}
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
                                composite: []
                            }
                        }
                    }
                }, {table, client});
                const prop1 = uuid();

                const created = await entityWithDefault.put({prop1}).go();
                const item = await entityWithDefault.get({prop1}).go();
                const expected = {
                    prop1,
                    prop2: {}
                }
                expect(created.data).to.deep.equal(expected);
                expect(item.data).to.deep.equal(expected);
            });

            it('should return an empty object with a Map Attribute when one is set via a default function', async () => {
                const entityWithDefault = new Entity({
                    model: {
                        entity: 'emptyObjects',
                        service: 'mapAttributeTests',
                        version: '1'
                    },
                    attributes: {
                        prop1: {
                            type: 'string'
                        },
                        prop2: {
                            type: 'map',
                            properties: {
                                prop3: {
                                    type: 'string'
                                }
                            },
                            default: () => {
                                return {}
                            }
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
                                composite: []
                            }
                        }
                    }
                }, {table, client});
                const prop1 = uuid();
                const created = await entityWithDefault.put({prop1}).go();
                const item = await entityWithDefault.get({prop1}).go();
                const expected = {
                    prop1,
                    prop2: {}
                }
                expect(created.data).to.deep.equal(expected);
                expect(item.data).to.deep.equal(expected);
            });

            it('should return an empty object with a Map Attribute when one is set via the setter', async () => {
                const entityWithObjSetter = new Entity({
                    model: {
                        entity: 'emptyObjects',
                        service: 'mapAttributeTests',
                        version: '1'
                    },
                    attributes: {
                        prop1: {
                            type: 'string'
                        },
                        prop2: {
                            type: 'map',
                            properties: {
                                prop3: {
                                    type: 'string'
                                }
                            },
                            set: () => {
                                return {};
                            }
                        },
                    },
                    indexes: {
                        record: {
                            pk: {
                                field: 'pk',
                                composite: ['prop1']
                            },
                            sk: {
                                field: 'sk',
                                composite: []
                            }
                        }
                    }
                }, {table, client});
                const prop1 = uuid();
                const created = await entityWithObjSetter.put({prop1}).go();
                const item = await entityWithObjSetter.get({prop1}).go();
                const expected = {
                    prop1,
                    prop2: {}
                }
                expect(created.data).to.deep.equal(expected);
                expect(item.data).to.deep.equal(expected);
            });

            it('should return an empty object with a Map Attribute when one is put on the item directly', async () => {
                const entityWithoutDefaultOrSetter = new Entity({
                    model: {
                        entity: 'emptyObject',
                        service: 'mapAttributeTests',
                        version: '1'
                    },
                    attributes: {
                        prop1: {
                            type: 'string'
                        },
                        prop2: {
                            type: 'map',
                            properties: {
                                prop3: {
                                    type: 'string'
                                }
                            }
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
                                composite: []
                            }
                        }
                    }
                }, {table, client});
                const prop1 = uuid();
                const prop2 = {};
                const created = await entityWithoutDefaultOrSetter.put({prop1, prop2}).go();
                const item = await entityWithoutDefaultOrSetter.get({prop1}).go();
                const expected = {
                    prop1,
                    prop2,
                }
                expect(created.data).to.deep.equal(expected);
                expect(item.data).to.deep.equal(expected);
            });

            it('should not return an empty object with a Map Attribute when one is not put on the item directly', async () => {
                const entityWithoutDefaultOrSetter = new Entity({
                    model: {
                        entity: 'emptyObjects',
                        service: 'mapAttributeTests',
                        version: '1'
                    },
                    attributes: {
                        prop1: {
                            type: 'string'
                        },
                        prop2: {
                            type: 'map',
                            properties: {
                                prop3: {
                                    type: 'string'
                                }
                            }
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
                                composite: []
                            }
                        }
                    }
                }, {table, client});
                const prop1 = uuid();
                const created = await entityWithoutDefaultOrSetter.put({prop1}).go();
                const item = await entityWithoutDefaultOrSetter.get({prop1}).go();
                const expected = {
                    prop1,
                }
                expect(created.data).to.deep.equal(expected);
                expect(item.data).to.deep.equal(expected);
            });

            it('should return an empty object with a Map Attribute when one is updated on the item directly', async () => {
                const entityWithoutDefaultOrSetter = new Entity({
                    model: {
                        entity: 'emptyObjects',
                        service: 'mapAttributeTests',
                        version: '1'
                    },
                    attributes: {
                        prop1: {
                            type: 'string'
                        },
                        prop2: {
                            type: 'map',
                            properties: {
                                prop3: {
                                    type: 'string'
                                }
                            }
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
                                composite: []
                            }
                        }
                    }
                }, {table, client});
                const prop1 = uuid();
                const expected = {
                    prop1,
                    prop2: {}   
                }
                const updated = await entityWithoutDefaultOrSetter
                    .update({prop1})
                    .data((attr, op) => {
                        op.set(attr.prop2, {});
                    })
                    .go({response: 'all_new'});

                expect(updated.data).to.deep.equal(expected);
                const updatedItem = await entityWithoutDefaultOrSetter.get({prop1}).go();
                expect(updatedItem.data).to.deep.equal(expected);
            });
            
        });
    })
    describe("conditions and updates", () => {
        let cityId = uuid();
        const mallId = "EastPointe";
        const storeId = "LatteLarrys";
        const buildingId = "A34";
        beforeEach(async () => {
            cityId = uuid();
            await StoreLocations
                .put({
                    cityId,
                    storeId,
                    mallId,
                    buildingId,
                    unitId: "B47",
                    category: "food/coffee",
                    leaseEndDate: "2020-03-22",
                    rent: 4500,
                    tenant: ["tom"],
                    deposit: 1000,
                    rentalAgreement: [
                        {
                            type: "ammendment",
                            detail: "dont wear puffy shirt"
                        }
                    ],
                    tags: ["family_friendly"],
                    contact: ["555-555-5555"],
                    mapAttribute: {
                        mapProperty: "before"
                    },
                    listAttribute: [
                        {
                            setAttribute: ["555-555-5555"]
                        },
                        {
                            setAttribute: ["666-666-6666"]
                        }
                    ]
                })
                .go();
        });

        it("should conditionally update a map attribute", async () => {
            const composite = {cityId, mallId, storeId, buildingId};
            const results1 = await StoreLocations.get(composite).go().then(res => res.data);

            await StoreLocations.update(composite)
                .data(({mapAttribute}, {set}) => set(mapAttribute.mapProperty, "after1"))
                .where(({mapAttribute}, {eq}) => {
                    return results1?.mapAttribute?.mapProperty
                        ? eq(mapAttribute.mapProperty, results1.mapAttribute.mapProperty)
                        : ""
                })
                .go().then(res => res.data);

            const results2 = await StoreLocations.get(composite).go().then(res => res.data);

            expect(results2).to.deep.equal({
                cityId,
                storeId,
                mallId,
                buildingId,
                unitId: "B47",
                category: "food/coffee",
                leaseEndDate: "2020-03-22",
                rent: 4500,
                tenant: ["tom"],
                deposit: 1000,
                rentalAgreement: [
                    {
                        type: "ammendment",
                        detail: "dont wear puffy shirt"
                    }
                ],
                tags: ["family_friendly"],
                contact: ["555-555-5555"],
                mapAttribute: {
                    mapProperty: "after1"
                },
                listAttribute: [
                    {
                        setAttribute: ["555-555-5555"]
                    },
                    {
                        setAttribute: ["666-666-6666"]
                    }
                ],
                discount: 0
            });

            let update = await StoreLocations.update(composite)
                .data(({mapAttribute}, {set}) => set(mapAttribute.mapProperty, "after1"))
                .where(({mapAttribute}, {eq}) => {
                    return results1?.mapAttribute?.mapProperty
                        ? eq(mapAttribute.mapProperty, results1.mapAttribute.mapProperty)
                        : ""
                })
                .go()
                .then(() => {})
                .catch(err => err);

            expect(update.message).to.equal("The conditional request failed - For more detail on this error reference: https://github.com/tywalch/electrodb#aws-error")
        });

        it("should conditionally update a list attribute", async () => {
            const composite = {cityId, mallId, storeId, buildingId};
            const results1 = await StoreLocations.get(composite).go().then(res => res.data);

            await StoreLocations.update(composite)
                .data(({rentalAgreement}, {set}) => set(rentalAgreement[0].detail, "no soup for you"))
                .where(({rentalAgreement}, {eq}) => {
                    return results1?.rentalAgreement?.[0]?.detail
                        ? eq(rentalAgreement[0].detail, results1.rentalAgreement[0].detail)
                        : ""
                })
                .go().then(res => res.data);

            const results2 = await StoreLocations.get(composite).go().then(res => res.data);

            expect(results2).to.deep.equal({
                cityId,
                storeId,
                mallId,
                buildingId,
                unitId: "B47",
                category: "food/coffee",
                leaseEndDate: "2020-03-22",
                rent: 4500,
                tenant: ["tom"],
                deposit: 1000,
                rentalAgreement: [
                    {
                        type: "ammendment",
                        detail: "no soup for you"
                    }
                ],
                tags: ["family_friendly"],
                contact: ["555-555-5555"],
                mapAttribute: {
                    mapProperty: "before"
                },
                listAttribute: [
                    {
                        setAttribute: ["555-555-5555"]
                    },
                    {
                        setAttribute: ["666-666-6666"]
                    }
                ],
                discount: 0
            });

            let update = await StoreLocations.update(composite)
                .data(({rentalAgreement}, {set}) => set(rentalAgreement[0].detail, "no soup for you"))
                .where(({rentalAgreement}, {eq}) => {
                    return results1?.rentalAgreement?.[0]?.detail
                        ? eq(rentalAgreement[0].detail, results1.rentalAgreement[0].detail)
                        : "";
                })
                .go()
                .then(() => {})
                .catch(err => err);

            expect(update.message).to.equal("The conditional request failed - For more detail on this error reference: https://github.com/tywalch/electrodb#aws-error")
        });
    });

    describe("readme examples", () => {
        let cityId = uuid();
        const mallId = "EastPointe";
        const storeId = "LatteLarrys";
        const buildingId= "A34";
        beforeEach(async () => {
            cityId = uuid();
            await StoreLocations
                .put({
                    cityId,
                    storeId,
                    mallId,
                    buildingId,
                    unitId: "B47",
                    category: "food/coffee",
                    leaseEndDate: "2020-03-22",
                    rent: 4500,
                    tenant: ["tom"],
                    deposit: 1000,
                    rentalAgreement: [
                        {
                            type: "ammendment",
                            detail: "dont wear puffy shirt"
                        }
                    ],
                    tags: ["family_friendly"],
                    contact: ["555-555-5555"],
                    mapAttribute: {
                        mapProperty: "before"
                    },
                    listAttribute: [
                        {
                            setAttribute: ["555-555-5555"]
                        },
                        {
                            setAttribute: ["666-666-6666"]
                        }
                    ]
                })
                .go();
        });

        it("should perform complex data type update example 1", async () => {
            await StoreLocations
                .update({cityId, mallId, storeId, buildingId})
                // @ts-ignore
                .set({'mapAttribute.mapProperty': "value1"})
                .go();

            let item1 = await StoreLocations
                .get({cityId, mallId, storeId, buildingId})
                .go().then(res => res.data);

            expect(item1).to.deep.equal({
                cityId,
                "mallId": "EastPointe",
                "mapAttribute": {
                    "mapProperty": "value1"
                },
                "rentalAgreement": [
                    {
                        "type": "ammendment",
                        "detail": "dont wear puffy shirt"
                    }
                ],
                "discount": 0,
                "rent": 4500,
                "storeId": "LatteLarrys",
                "buildingId": "A34",
                "tags": ["family_friendly"],
                "leaseEndDate": "2020-03-22",
                "contact": ["555-555-5555"],
                "deposit": 1000,
                "unitId": "B47",
                "category": "food/coffee",
                "listAttribute": [
                    {
                        "setAttribute": ["555-555-5555"]
                    },
                    {
                        "setAttribute": ["666-666-6666"]
                    }
                ],
                "tenant": ["tom"]
            });

            await StoreLocations
                .update({cityId, mallId, storeId, buildingId})
                .data(({mapAttribute}, {set}) => set(mapAttribute.mapProperty, "value2"))
                .go()

            let item2 = await StoreLocations
                .get({cityId, mallId, storeId, buildingId})
                .go().then(res => res.data);

            expect(item2).to.deep.equal({
                cityId,
                "mallId": "EastPointe",
                "mapAttribute": {
                    "mapProperty": "value2"
                },
                "rentalAgreement": [{
                    "type": "ammendment",
                    "detail": "dont wear puffy shirt"
                }
                ],
                "discount": 0,
                "rent": 4500,
                "storeId": "LatteLarrys",
                "buildingId": "A34",
                "tags": [
                    "family_friendly"
                ],
                "leaseEndDate": "2020-03-22",
                "contact": [
                    "555-555-5555"
                ],
                "deposit": 1000,
                "unitId": "B47",
                "category": "food/coffee",
                "listAttribute": [
                    {
                        "setAttribute": ["555-555-5555"]
                    },
                    {
                        "setAttribute": ["666-666-6666"]
                    }
                ],
                "tenant": [
                    "tom"
                ]
            });
        });

        it("should perform complex data type update example 2", async () => {
            await StoreLocations
                .update({cityId, mallId, storeId, buildingId})
                // @ts-ignore
                .remove(['listAttribute[0]'])
                .go().then(res => res.data);

            let item1 = await StoreLocations
                .get({cityId, mallId, storeId, buildingId})
                .go().then(res => res.data);

            expect(item1).to.deep.equal({
                cityId,
                "mallId": "EastPointe",
                "mapAttribute": {
                    "mapProperty": "before"
                },
                "rentalAgreement": [
                    {
                        "type": "ammendment",
                        "detail": "dont wear puffy shirt"
                    }
                ],
                "discount": 0,
                "rent": 4500,
                "storeId": "LatteLarrys",
                "buildingId": "A34",
                "tags": [
                    "family_friendly"
                ],
                "leaseEndDate": "2020-03-22",
                "contact": [
                    "555-555-5555"
                ],
                "deposit": 1000,
                "unitId": "B47",
                "category": "food/coffee",
                "listAttribute": [
                    {
                        "setAttribute": ["666-666-6666"]
                    }
                ],
                "tenant": [
                    "tom"
                ]
            });

            await StoreLocations
                .update({cityId, mallId, storeId, buildingId})
                .data(({listAttribute}, {remove}) => remove(listAttribute[0]))
                .go();

            let item2 = await StoreLocations
                .get({cityId, mallId, storeId, buildingId})
                .go().then(res => res.data);

            expect(item2).to.deep.equal({
                cityId,
                "mallId": "EastPointe",
                "mapAttribute": {
                    "mapProperty": "before"
                },
                "rentalAgreement": [
                    {
                        "type": "ammendment",
                        "detail": "dont wear puffy shirt"
                    }
                ],
                "discount": 0,
                "rent": 4500,
                "storeId": "LatteLarrys",
                "buildingId": "A34",
                "tags": [
                    "family_friendly"
                ],
                "leaseEndDate": "2020-03-22",
                "contact": [
                    "555-555-5555"
                ],
                "deposit": 1000,
                "unitId": "B47",
                "category": "food/coffee",
                "listAttribute": [],
                "tenant": [
                    "tom"
                ]
            });
        });

        it("should perform complex data type update example 3", async () => {
            const newSetValue1 = ["setItemValue1"];
            const newSetValue2 = ["setItemValue2"];

            await StoreLocations
                .update({cityId, mallId, storeId, buildingId})
                // @ts-ignore
                .add({'listAttribute[1].setAttribute': newSetValue1})
                .go().then(res => res.data);

            let item1 = await StoreLocations
                .get({cityId, mallId, storeId, buildingId})
                .go().then(res => res.data);

            expect(item1).to.deep.equal({
                cityId,
                "mallId": "EastPointe",
                "mapAttribute": {
                    "mapProperty": "before"
                },
                "rentalAgreement": [
                    {
                        "type": "ammendment",
                        "detail": "dont wear puffy shirt"
                    }
                ],
                "discount": 0,
                "rent": 4500,
                "storeId": "LatteLarrys",
                "buildingId": "A34",
                "tags": [
                    "family_friendly"
                ],
                "leaseEndDate": "2020-03-22",
                "contact": [
                    "555-555-5555"
                ],
                "deposit": 1000,
                "unitId": "B47",
                "category": "food/coffee",
                "listAttribute": [
                    {
                        "setAttribute": ["555-555-5555"]
                    },
                    {
                        "setAttribute": ["666-666-6666", "setItemValue1"]
                    }
                ],
                "tenant": [
                    "tom"
                ]
            });

            await StoreLocations
                .update({cityId, mallId, storeId, buildingId})
                .data(({listAttribute}, {add}) => {
                    add(listAttribute[1].setAttribute, newSetValue2)
                })
                .go().then(res => res.data);

            let item2 = await StoreLocations
                .get({cityId, mallId, storeId, buildingId})
                .go().then(res => res.data);

            expect(item2).to.deep.equal({
                cityId,
                "mallId": "EastPointe",
                "mapAttribute": {
                    "mapProperty": "before"
                },
                "rentalAgreement": [
                    {
                        "type": "ammendment",
                        "detail": "dont wear puffy shirt"
                    }
                ],
                "discount": 0,
                "rent": 4500,
                "storeId": "LatteLarrys",
                "buildingId": "A34",
                "tags": [
                    "family_friendly"
                ],
                "leaseEndDate": "2020-03-22",
                "contact": [
                    "555-555-5555"
                ],
                "deposit": 1000,
                "unitId": "B47",
                "category": "food/coffee",
                "listAttribute": [
                    {
                        "setAttribute": ["555-555-5555"]
                    },
                    {
                        "setAttribute": ["666-666-6666", "setItemValue1", "setItemValue2"]
                    }
                ],
                "tenant": ["tom"]
            });
        });

        it("should generate the same parameters as shown in the readme examples", () => {
            const cityId = uuid();
            const mallId = "EastPointe";
            const storeId = "LatteLarrys";
            const buildingId= "A34";
            const setParameters = StoreLocations
                .update({cityId, mallId, storeId, buildingId})
                .set({category: "food/meal"})
                .where((attr, op) => op.eq(attr.category, "food/coffee"))
                .params()

            expect(setParameters).to.deep.equal({
                UpdateExpression: "SET #category = :category_u0, #cityId = :cityId_u0, #mallId = :mallId_u0, #buildingId = :buildingId_u0, #storeId = :storeId_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0",
                ExpressionAttributeNames: {
                    '#category': 'category',
                    "#buildingId": "buildingId",
                    "#cityId": "cityId",
                    "#mallId": "mallId",
                    "#storeId": "storeId",
                    "#__edb_e__": "__edb_e__", "#__edb_v__": "__edb_v__"
                },
                ExpressionAttributeValues: {
                    ':category0': 'food/coffee',
                    ':category_u0': 'food/meal',
                    ":buildingId_u0": "A34",
                    ":cityId_u0": cityId,
                    ":mallId_u0": mallId,
                    ":storeId_u0": storeId,
                    ":__edb_e___u0": "MallStore", ":__edb_v___u0": "1"
                },
                TableName: 'electro',
                Key: {
                    pk: `$mallstoredirectory#cityid_${cityId}#mallid_eastpointe`,
                    sk: '$mallstore_1#buildingid_a34#storeid_lattelarrys'
                },
                ConditionExpression: '#category = :category0'
            });

            const removeParameters = StoreLocations
                .update({cityId, mallId, storeId, buildingId})
                .remove(["discount"])
                .where((attr, op) => op.eq(attr.discount, 10))
                .params();

            expect(removeParameters).to.deep.equal({
                "UpdateExpression": "SET #cityId = :cityId_u0, #mallId = :mallId_u0, #buildingId = :buildingId_u0, #storeId = :storeId_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0 REMOVE #discount",
                "ExpressionAttributeNames": {
                    "#discount": "discount",
                    "#buildingId": "buildingId",
                    "#cityId": "cityId",
                    "#mallId": "mallId",
                    "#storeId": "storeId",
                    "#__edb_e__": "__edb_e__", "#__edb_v__": "__edb_v__"
                },
                "ExpressionAttributeValues": {
                    ":discount0": 10,
                    ":buildingId_u0": "A34",
                    ":cityId_u0": cityId,
                    ":mallId_u0": mallId,
                    ":storeId_u0": storeId,
                    ":__edb_e___u0": "MallStore", ":__edb_v___u0": "1"
                },
                "TableName": "electro",
                "Key": {
                    "pk": `$mallstoredirectory#cityid_${cityId}#mallid_eastpointe`,
                    "sk": "$mallstore_1#buildingid_a34#storeid_lattelarrys"
                },
                "ConditionExpression": "#discount = :discount0"
            });

            const addParameters = StoreLocations
                .update({cityId, mallId, storeId, buildingId})
                .add({
                    rent: 100, // "number" attribute
                    tenant: ["larry"] // "set" attribute
                })
                .where((attr, op) => op.eq(attr.category, "food/coffee"))
                .params()

            expect(JSON.parse(JSON.stringify(addParameters))).to.deep.equal({
                "UpdateExpression": "SET #cityId = :cityId_u0, #mallId = :mallId_u0, #buildingId = :buildingId_u0, #storeId = :storeId_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0 ADD #rent :rent_u0, #tenant :tenant_u0",
                "ExpressionAttributeNames": {
                    "#category": "category",
                    "#rent": "rent",
                    "#tenant": "tenant",
                    "#buildingId": "buildingId",
                    "#cityId": "cityId",
                    "#mallId": "mallId",
                    "#storeId": "storeId",
                    "#__edb_e__": "__edb_e__", "#__edb_v__": "__edb_v__"
                },
                "ExpressionAttributeValues": {
                    ":category0": "food/coffee",
                    ":rent_u0": 100,
                    ":tenant_u0": ["larry"],
                    ":buildingId_u0": "A34",
                    ":cityId_u0": cityId,
                    ":mallId_u0": mallId,
                    ":storeId_u0": storeId,
                    ":__edb_e___u0": "MallStore", ":__edb_v___u0": "1"
                },
                "TableName": "electro",
                "Key": {
                    "pk": `$mallstoredirectory#cityid_${cityId}#mallid_eastpointe`,
                    "sk": "$mallstore_1#buildingid_a34#storeid_lattelarrys"
                },
                "ConditionExpression": "#category = :category0"
            })

            const subtractParameters = StoreLocations
                .update({cityId, mallId, storeId, buildingId})
                .subtract({deposit: 500})
                .where((attr, op) => op.eq(attr.category, "food/coffee"))
                .params()

            expect(subtractParameters).to.deep.equal({
                "UpdateExpression": "SET #deposit = #deposit - :deposit_u0, #cityId = :cityId_u0, #mallId = :mallId_u0, #buildingId = :buildingId_u0, #storeId = :storeId_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0",
                "ExpressionAttributeNames": {
                    "#category": "category",
                    "#deposit": "deposit",
                    "#buildingId": "buildingId",
                    "#cityId": "cityId",
                    "#mallId": "mallId",
                    "#storeId": "storeId",
                    "#__edb_e__": "__edb_e__", "#__edb_v__": "__edb_v__"
                },
                "ExpressionAttributeValues": {
                    ":category0": "food/coffee",
                    ":deposit_u0": 500,
                    ":buildingId_u0": "A34",
                    ":cityId_u0": cityId,
                    ":mallId_u0": mallId,
                    ":storeId_u0": storeId,
                    ":__edb_e___u0": "MallStore", ":__edb_v___u0": "1"
                },
                "TableName": "electro",
                "Key": {
                    "pk": `$mallstoredirectory#cityid_${cityId}#mallid_eastpointe`,
                    "sk": "$mallstore_1#buildingid_a34#storeid_lattelarrys"
                },
                "ConditionExpression": "#category = :category0"
            });

            const appendParameters = StoreLocations
                .update({cityId, mallId, storeId, buildingId})
                .append({
                    rentalAgreement: [{
                        type: "ammendment",
                        detail: "no soup for you"
                    }]
                })
                .where((attr, op) => op.eq(attr.category, "food/coffee"))
                .params()

            expect(appendParameters).to.deep.equal({
                "UpdateExpression": "SET #rentalAgreement = list_append(#rentalAgreement, :rentalAgreement_u0), #cityId = :cityId_u0, #mallId = :mallId_u0, #buildingId = :buildingId_u0, #storeId = :storeId_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0",
                "ExpressionAttributeNames": {
                    "#category": "category",
                    "#rentalAgreement": "rentalAgreement",
                    "#buildingId": "buildingId",
                    "#cityId": "cityId",
                    "#mallId": "mallId",
                    "#storeId": "storeId",
                    "#__edb_e__": "__edb_e__", "#__edb_v__": "__edb_v__"
                },
                "ExpressionAttributeValues": {
                    ":category0": "food/coffee",
                    ":rentalAgreement_u0": [{
                        "type": "ammendment",
                        "detail": "no soup for you"
                    }],
                    ":buildingId_u0": "A34",
                    ":cityId_u0": cityId,
                    ":mallId_u0": mallId,
                    ":storeId_u0": storeId,
                    ":__edb_e___u0": "MallStore", ":__edb_v___u0": "1"
                },
                "TableName": "electro",
                "Key": {
                    "pk": `$mallstoredirectory#cityid_${cityId}#mallid_eastpointe`,
                    "sk": "$mallstore_1#buildingid_a34#storeid_lattelarrys"
                },
                "ConditionExpression": "#category = :category0"
            });

            const deleteParameters = StoreLocations
                .update({cityId, mallId, storeId, buildingId})
                .delete({contact: ['555-345-2222']})
                .where((attr, op) => op.eq(attr.category, "food/coffee"))
                .params()


            expect(JSON.parse(JSON.stringify(deleteParameters))).to.deep.equal({
                "UpdateExpression": "SET #cityId = :cityId_u0, #mallId = :mallId_u0, #buildingId = :buildingId_u0, #storeId = :storeId_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0 DELETE #contact :contact_u0",
                "ExpressionAttributeNames": {
                    "#category": "category",
                    "#contact": "contact",
                    "#buildingId": "buildingId",
                    "#cityId": "cityId",
                    "#mallId": "mallId",
                    "#storeId": "storeId",
                    "#__edb_e__": "__edb_e__", "#__edb_v__": "__edb_v__"
                },
                "ExpressionAttributeValues": {
                    ":category0": "food/coffee",
                    ":contact_u0": ["555-345-2222"],
                    ":buildingId_u0": "A34",
                    ":cityId_u0": cityId,
                    ":mallId_u0": mallId,
                    ":storeId_u0": storeId,
                    ":__edb_e___u0": "MallStore", ":__edb_v___u0": "1"
                },
                "TableName": "electro",
                "Key": {
                    "pk": `$mallstoredirectory#cityid_${cityId}#mallid_eastpointe`,
                    "sk": "$mallstore_1#buildingid_a34#storeid_lattelarrys"
                },
                "ConditionExpression": "#category = :category0"
            });

            const allParameters = StoreLocations
                .update({cityId, mallId, storeId, buildingId})
                .data((attr, op) => {
                    const newTenant = op.value(attr.tenant, ["larry"]);
                    op.set(attr.category, "food/meal");
                    op.add(attr.tenant, newTenant);
                    op.add(attr.rent, 100);
                    op.subtract(attr.deposit, 200);
                    op.remove(attr.discount);
                    op.append(attr.rentalAgreement, [{type: "ammendment", detail: "no soup for you"}]);
                    op.delete(attr.tags, ['coffee']);
                    op.del(attr.contact, ['555-345-2222']);
                    op.add(attr.totalFees, op.name(attr.petFee));
                    op.add(attr.leaseHolders, newTenant);
                })
                .where((attr, op) => op.eq(attr.category, "food/coffee"))
                .params()

            expect(JSON.parse(JSON.stringify(allParameters))).to.deep.equal({
                "UpdateExpression": "SET #category = :category_u0, #deposit = #deposit - :deposit_u0, #rentalAgreement = list_append(#rentalAgreement, :rentalAgreement_u0), #totalFees = #totalFees + #petFee, #cityId = :cityId_u0, #mallId = :mallId_u0, #buildingId = :buildingId_u0, #storeId = :storeId_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0 REMOVE #discount ADD #tenant :tenant_u0, #rent :rent_u0, #leaseHolders :tenant_u0 DELETE #tags :tags_u0, #contact :contact_u0",
                "ExpressionAttributeNames": {
                    "#category": "category",
                    "#tenant": "tenant",
                    "#rent": "rent",
                    "#deposit": "deposit",
                    "#discount": "discount",
                    "#rentalAgreement": "rentalAgreement",
                    "#tags": "tags",
                    "#contact": "contact",
                    "#totalFees": "totalFees",
                    "#petFee": "petFee",
                    "#leaseHolders": "leaseHolders",
                    "#buildingId": "buildingId",
                    "#cityId": "cityId",
                    "#mallId": "mallId",
                    "#storeId": "storeId",
                    "#__edb_e__": "__edb_e__", "#__edb_v__": "__edb_v__"
                },
                "ExpressionAttributeValues": {
                    ":category0": "food/coffee",
                    ":category_u0": "food/meal",
                    ":rent_u0": 100,
                    ":deposit_u0": 200,
                    ":rentalAgreement_u0": [{
                        "type": "ammendment",
                        "detail": "no soup for you"
                    }],
                    ":contact_u0": ["555-345-2222"],
                    ":tags_u0": ["coffee"],
                    ":tenant_u0": ["larry"],
                    ":buildingId_u0": "A34",
                    ":cityId_u0": cityId,
                    ":mallId_u0": mallId,
                    ":storeId_u0": storeId,
                    ":__edb_e___u0": "MallStore", ":__edb_v___u0": "1"
                },
                "TableName": "electro",
                "Key": {
                    "pk": `$mallstoredirectory#cityid_${cityId}#mallid_eastpointe`,
                    "sk": "$mallstore_1#buildingid_a34#storeid_lattelarrys"
                },
                "ConditionExpression": "#category = :category0"
            });
        });
    });

    it("should allow operations to be all chained together", async () => {
        const repoName = uuid();
        const repoOwner = uuid();
        const createdAt = "2021-07-01";

        const recentCommits = [
            {
                sha: "8ca4d4b2",
                data: "1627158426",
                message: "fixing bug",
                views: 50
            },
            {
                sha: "25d68f54",
                data: "1627158100",
                message: "adding bug",
                views: 25
            }
        ];

        const created = await repositories
            .put({
                repoName,
                repoOwner,
                createdAt,
                recentCommits,
                about: "my about details",
                isPrivate: false,
                license: "apache-2.0",
                description: "my description",
                stars: 10,
                defaultBranch: "main",
                tags: ["tag1", "tag2"],
                custom: {
                    prop1: "abc",
                    prop2: 100,
                    prop3: 200,
                    prop4: "xyz"
                },
                followers: ["tywalch"],
                views: 99,
                files: ["index.ts", "package.json"]
            })
            .go().then(res => res.data);

        const updates = {
            prop2: 15,
            tags: "tag1",
            stars: 8,
            description: "updated description",
            files: ["README.md"],
            about: "about",
            license: "cc",
            followers: "tinkertamper",
            prop1: "def",
            recentCommitsViews: 3,
        }

        const params: any = repositories.update({repoName, repoOwner})
            .add({followers: ["tinkertamper"]})
            .subtract({stars: updates.stars})
            .append({files: updates.files})
            .set({description: updates.description})
            .remove(["about"])
            .delete({tags: [updates.tags]})
            .data((attr, op) => {
                op.set(attr.custom.prop1, updates.prop1);
                op.add(attr.views, op.name(attr.custom.prop3));
                op.add(attr.recentCommits[0].views, updates.recentCommitsViews);
                op.remove(attr.recentCommits[1].message)
            })
            .params();

        expect(params).to.deep.equal({
            "UpdateExpression": "SET #stars = #stars - :stars_u0, #files = list_append(#files, :files_u0), #description = :description_u0, #custom.#prop1 = :custom_u0, #views = #views + #custom.#prop3, #repoOwner = :repoOwner_u0, #repoName = :repoName_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0 REMOVE #about, #recentCommits[1].#message ADD #followers :followers_u0, #recentCommits[0].#views :views_u0 DELETE #tags :tags_u0",
            "ExpressionAttributeNames": {
                "#followers": "followers",
                "#stars": "stars",
                "#files": "files",
                "#description": "description",
                "#about": "about",
                "#tags": "tags",
                "#custom": "custom",
                "#prop1": "prop1",
                "#views": "views",
                "#prop3": "prop3",
                "#recentCommits": "recentCommits",
                "#message": "message",
                "#repoName": "repoName",
                "#repoOwner": "repoOwner",
                "#__edb_e__": "__edb_e__", "#__edb_v__": "__edb_v__"
            },
            "ExpressionAttributeValues": {
                ":followers_u0": params.ExpressionAttributeValues[":followers_u0"],
                ":stars_u0": 8,
                ":files_u0": [
                    "README.md"
                ],
                ":description_u0": "updated description",
                ":tags_u0": params.ExpressionAttributeValues[":tags_u0"],
                ":custom_u0": "def",
                ":views_u0": 3,
                ":repoName_u0": repoName,
                ":repoOwner_u0": repoOwner,
                ":__edb_e___u0": "repositories", ":__edb_v___u0": "1"
            },
            "TableName": "electro",
            "Key": {
                "pk": `$versioncontrol#repoowner_${repoOwner}`,
                "sk": `$alerts#repositories_1#reponame_${repoName}`
            }
        });

        await repositories.update({repoName, repoOwner})
            .add({followers: [updates.followers]})
            .subtract({stars: updates.stars})
            .append({files: updates.files})
            .set({description: updates.description})
            .remove(["about"])
            .delete({tags: [updates.tags]})
            .data((attr, op) => {
                op.set(attr.custom.prop1, updates.prop1);
                op.add(attr.views, op.name(attr.custom.prop3));
                op.add(attr.recentCommits[0].views, updates.recentCommitsViews);
                op.remove(attr.recentCommits[1].message)
            })
            .go().then(res => res.data)

        const item = await repositories.get({repoName, repoOwner}).go().then(res => res.data);

        const expected = {
            "repoOwner": repoOwner,
            "repoName": repoName,
            "custom": {
                "prop2": 100,
                "prop1": "def",
                "prop4": "xyz",
                "prop3": 200
            },
            "defaultBranch": "main",
            "description": updates.description,
            "recentCommits": [
                {
                    "data": "1627158426",
                    "message": "fixing bug",
                    "sha": "8ca4d4b2",
                    "views": (created?.recentCommits?.[0]?.views || 0) + updates.recentCommitsViews
                },
                {
                    "data": "1627158100",
                    "sha": "25d68f54",
                    "views": 25
                }
            ],
            "isPrivate": false,
            "stars": (created.stars || 0) - (updates.stars || 0),
            "tags": [
                "tag2"
            ],
            "createdAt": createdAt,
            "license": "apache-2.0",
            "followers": [
                updates.followers,
                ...(created.followers ?? []),
            ],
            "files": [
                ...(created.files ?? []),
                ...updates.files,
            ],
            "views": created.views + created.custom.prop3,
            "username": repoOwner,
        }

        expect(item).to.deep.equal(expected);
    });

    describe("append operations", () => {
        it("should only allow attributes with type 'list', or 'any'", async () => {
            const repoName = uuid();
            const repoOwner = uuid();
            const append = {description: "my description"} as any
            const err = await repositories
                .update({repoName, repoOwner})
                .append(append)
                .go()
                .catch(err => err);

            expect(err.message).to.equal(`Invalid Update Attribute Operation: "APPEND" Operation can only be performed on attributes with type "list" or "any".`);
        });

        it("should append items to a list", async () => {
            const repoName = uuid();
            const repoOwner = uuid();
            const createdAt = "2021-07-01";
            const recentCommits = [{
                sha: "8ca4d4b2",
                data: "1627158426",
                message: "fixing bug"
            }];

            const additionalCommit = [{
                sha: "25d68f54",
                data: "1627158100",
                message: "adding bug"
            }];

            const created = await repositories
                .put({
                    repoName,
                    repoOwner,
                    createdAt,
                    recentCommits,
                    isPrivate: false,
                    license: "apache-2.0",
                    description: "my description",
                    stars: 10,
                    defaultBranch: "main",
                    tags: ["tag1", "tag2"]
                })
                .go().then(res => res.data);

            await repositories
                .update({repoName, repoOwner})
                .append({
                    recentCommits: additionalCommit
                })
                .go();

            const item = await repositories
                .get({repoName, repoOwner})
                .go().then(res => res.data);

            expect(item).to.deep.equal({
                ...created,
                recentCommits: [...recentCommits, ...additionalCommit]
            });
        });

        it("should support append being called twice in a chain", async () => {
            const repoName = uuid();
            const repoOwner = uuid();
            const createdAt = "2021-07-01";
            const firstCommit = [{
                sha: "8ca4d4b2",
                message: "fixing bug",
                timestamp: 1627158426
            }];

            const secondCommit = [{
                sha: "25d68f54",
                message: "adding bug",
                timestamp: 1627158100
            }];

            const custom = [{
                status: "started",
                timestamp: 1627158100
            }]

            const customUpdate = [{
                status: "working",
                timestamp: 1627198100
            }]

            const created = await repositories
                .put({
                    repoName,
                    repoOwner,
                    createdAt,
                    recentCommits: firstCommit,
                    custom: custom,
                    isPrivate: false,
                    license: "apache-2.0",
                    description: "my description",
                    stars: 10,
                    defaultBranch: "main",
                    tags: ["tag1", "tag2"]
                })
                .go().then(res => res.data);

            await repositories
                .update({repoName, repoOwner})
                .append({
                    recentCommits: secondCommit
                })
                .append({
                    custom: customUpdate
                })
                .go();

            const item = await repositories
                .get({repoName, repoOwner})
                .go().then(res => res.data);

            expect(item).to.deep.equal({
                ...created,
                recentCommits: [...firstCommit, ...secondCommit],
                custom: [...custom, ...customUpdate]
            });
        });

        it("should append items to a list with data method", async () => {
            const repoName = uuid();
            const repoOwner = uuid();
            const createdAt = "2021-07-01";
            const recentCommits = [{
                sha: "8ca4d4b2",
                data: "1627158426",
                message: "fixing bug"
            }];
            const additionalCommit = [{
                sha: "25d68f54",
                data: "1627158100",
                message: "adding bug",
                views: 10,
                timestamp: Date.now(),
                // abc: "def"
            }];
            const created = await repositories
                .put({
                    repoName,
                    repoOwner,
                    createdAt,
                    recentCommits,
                    isPrivate: false,
                    license: "apache-2.0",
                    description: "my description",
                    stars: 10,
                    defaultBranch: "main",
                    tags: ["tag1", "tag2"]
                })
                .go().then(res => res.data);

            await repositories
                .update({repoName, repoOwner})
                .data(({recentCommits}, {append}) => append(recentCommits, additionalCommit))
                .go();

            const item = await repositories
                .get({repoName, repoOwner})
                .go().then(res => res.data);

            expect(item).to.deep.equal({
                ...created,
                recentCommits: [...recentCommits, ...additionalCommit]
            });
        });
    });
    describe("remove operations", () => {
        it("should allow for deleting all PK elements on a gsi to create a sparse index", async () => {
            const username = uuid();
            const location = uuid();

            await users.create({
                username,
                location,
                bio: "I make things.",
                fullName: "tyler walch"
            }).go();

            const itemBefore = await users.get({username}).go({raw: true})
                .then(res => res.data);

            expect(itemBefore).to.deep.equal({
                "Item": {
                    "pk": `$versioncontrol#username_${username}`,
                    "sk": "$overview#user_1",

                    "gsi1pk": `$versioncontrol#username_${username}`,
                    "gsi1sk": "$owned#user_1",

                    "gsi2pk": `$versioncontrol#location_${location}`,
                    "gsi2sk": "$user_1",

                    "location": location,
                    "username": username,

                    "bio": "I make things.",
                    "fullName": "tyler walch",

                    "__edb_e__": "user",
                    "__edb_v__": "1"
                }
            });

            const params = users
                .update({username})
                .remove([
                    "location"
                ])
                .params();

            expect(params).to.deep.equal({
                "UpdateExpression": "SET #username = :username_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0 REMOVE #location, #gsi2pk",
                "ExpressionAttributeNames": {
                    "#location": "location",
                    "#gsi2pk": "gsi2pk",
                    "#username": "username",
                    "#__edb_e__": "__edb_e__", "#__edb_v__": "__edb_v__"
                },
                "ExpressionAttributeValues": {
                    ":username_u0": username,
                    ":__edb_e___u0": "user", ":__edb_v___u0": "1"
                },
                "TableName": "electro",
                "Key": {
                    "pk": `$versioncontrol#username_${username}`,
                    "sk": "$overview#user_1"
                }
            });

            await users
                .update({username})
                .remove([
                    "location"
                ])
                .go();

            const itemAfter = await users
                .get({username})
                .go({raw: true})
                .then(res => res.data);

            expect(itemAfter).to.deep.equal({
                "Item": {
                    "pk": `$versioncontrol#username_${username}`,
                    "sk": "$overview#user_1",

                    "gsi1pk": `$versioncontrol#username_${username}`,
                    "gsi1sk": "$owned#user_1",

                    "gsi2sk": "$user_1",

                    "username": username,
                    "bio": "I make things.",
                    "fullName": "tyler walch",
                    "__edb_v__": "1",
                    "__edb_e__": "user"
                }
            });
        });

        it("should allow for deleting all SK elements on a gsi to create a sparse index", async () => {
            const users = new Entity({
                model: {
                    entity: "user",
                    service: "versioncontrol",
                    version: "1"
                },
                attributes: {
                    username: {
                        type: "string"
                    },
                    email: {
                        type: "string"
                    },
                    device: {
                        type: "string"
                    },
                    bio: {
                        type: "string"
                    },
                    location: {
                        type: "string"
                    },
                    fullName: {
                        type: "string"
                    },
                },
                indexes: {
                    user: {
                        pk: {
                            composite: ["username"],
                            field: "pk"
                        },
                        sk: {
                            composite: [],
                            field: "sk"
                        }
                    },
                    approved: {
                        index: "gsi1pk-gsi1sk-index",
                        pk: {
                            composite: ["email"],
                            field: "gsi1pk"
                        },
                        sk: {
                            field: "gsi1sk",
                            composite: ["device"]
                        }
                    }
                }
            }, {table, client});
            const username = uuid();
            const location = uuid();
            const device = uuid();
            const email = uuid();

            await users.create({
                email,
                device,
                username,
                location,
                bio: "I make things.",
                fullName: "tyler walch"
            }).go();

            const itemBefore = await users.get({username}).go({raw: true}).then(res => res.data);

            expect(itemBefore).to.deep.equal({
                "Item": {
                    "pk": `$versioncontrol#username_${username}`,
                    "sk": "$user_1",

                    "gsi1pk": `$versioncontrol#email_${email}`,
                    "gsi1sk": `$user_1#device_${device}`,

                    "email": email,
                    "device": device,
                    "location": location,
                    "username": username,

                    "bio": "I make things.",
                    "fullName": "tyler walch",

                    "__edb_e__": "user",
                    "__edb_v__": "1"
                }
            });

            const params = users
                .update({username})
                .remove([
                    "device"
                ])
                .params();

            expect(params).to.deep.equal({
                "UpdateExpression": "SET #username = :username_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0 REMOVE #device, #gsi1sk",
                "ExpressionAttributeNames": {
                    "#device": "device",
                    "#gsi1sk": "gsi1sk",
                    "#username": "username",
                    "#__edb_e__": "__edb_e__", "#__edb_v__": "__edb_v__"
                },
                "ExpressionAttributeValues": {
                    ":username_u0": username,
                    ":__edb_e___u0": "user", ":__edb_v___u0": "1"
                },
                "TableName": "electro",
                "Key": {
                    "pk": `$versioncontrol#username_${username}`,
                    "sk": "$user_1"
                }
            });

            await users
                .update({username})
                .remove([
                    "device"
                ])
                .go();

            const itemAfter = await users
                .get({username})
                .go({raw: true})
                .then(res => res.data);

            expect(itemAfter).to.deep.equal({
                "Item": {
                    "pk": `$versioncontrol#username_${username}`,
                    "sk": "$user_1",

                    "gsi1pk": `$versioncontrol#email_${email}`,

                    "username": username,
                    "location": location,
                    "email": email,

                    "bio": "I make things.",
                    "fullName": "tyler walch",

                    "__edb_v__": "1",
                    "__edb_e__": "user"
                }
            });
        });

        it("should not allow for partial deletion of a gsi composite index", async () => {
            const users = new Entity({
                model: {
                    entity: "user",
                    service: "versioncontrol",
                    version: "1"
                },
                attributes: {
                    username: {
                        type: "string"
                    },
                    email: {
                        type: "string"
                    },
                    device: {
                        type: "string"
                    },
                    bio: {
                        type: "string"
                    },
                    location: {
                        type: "string"
                    },
                    fullName: {
                        type: "string"
                    },
                },
                indexes: {
                    user: {
                        pk: {
                            composite: ["username"],
                            field: "pk"
                        },
                        sk: {
                            composite: [],
                            field: "sk"
                        }
                    },
                    approved: {
                        index: "gsi1pk-gsi1sk-index",
                        pk: {
                            composite: ["email"],
                            field: "gsi1pk"
                        },
                        sk: {
                            field: "gsi1sk",
                            composite: ["location", "device"]
                        }
                    }
                }
            }, {table, client});
            const username = uuid();
            const location = uuid();
            const device = uuid();
            const email = uuid();

            await users.create({
                email,
                device,
                username,
                location,
                bio: "I make things.",
                fullName: "tyler walch"
            }).go();

            const itemBefore = await users.get({username}).go({raw: true})
                .then(res => res.data);

            expect(itemBefore).to.deep.equal({
                "Item": {
                    "pk": `$versioncontrol#username_${username}`,
                    "sk": "$user_1",

                    "gsi1pk": `$versioncontrol#email_${email}`,
                    "gsi1sk": `$user_1#location_${location}#device_${device}`,

                    "email": email,
                    "device": device,
                    "location": location,
                    "username": username,

                    "bio": "I make things.",
                    "fullName": "tyler walch",

                    "__edb_e__": "user",
                    "__edb_v__": "1"
                }
            });

            const error = () => users
                .update({username})
                .remove([
                    "device"
                ])
                .params();

            expect(error).to.throw(`Incomplete composite attributes: Without the composite attributes "location" the following access patterns cannot be updated: "approved"  - For more detail on this error reference: https://github.com/tywalch/electrodb#incomplete-composite-attributes`)

            const error2 = await users
                .update({username})
                .remove([
                    "location"
                ])
                .go()
                .catch(err => err);
            expect(error2.message).to.equal(`Incomplete composite attributes: Without the composite attributes "device" the following access patterns cannot be updated: "approved"  - For more detail on this error reference: https://github.com/tywalch/electrodb#incomplete-composite-attributes`);
        });

        it("should respect readOnly", async () => {
            const repoName = uuid();
            const repoOwner = uuid();

            await repositories
                .put({
                    repoName,
                    repoOwner,
                    isPrivate: false,
                })
                .go();

            const removal = ["createdAt"] as any;

            const removeError = await repositories
                .update({repoName, repoOwner})
                .remove(removal)
                .go()
                .catch(err => err);

            expect(removeError.message).to.equal(`Attribute "createdAt" is Read-Only and cannot be removed - For more detail on this error reference: https://github.com/tywalch/electrodb#invalid-attribute`);

            const dataRemoveError = await repositories
                .update({repoName, repoOwner})
                .data((attr, op) =>
                    // @ts-ignore
                    op.remove(attr.createdAt)
                )
                .go()
                .catch(err => err);

            expect(dataRemoveError.message).to.equal(`Attribute "createdAt" is Read-Only and cannot be updated - For more detail on this error reference: https://github.com/tywalch/electrodb#invalid-attribute`);
        });

        it("should remove properties from an item", async () => {
            const repoName = uuid();
            const repoOwner = uuid();
            const createdAt = "2021-07-01";
            await repositories
                .put({
                    repoName,
                    repoOwner,
                    createdAt,
                    isPrivate: false,
                    license: "apache-2.0",
                    description: "my description",
                    recentCommits: [
                        {
                            sha: "8ca4d4b2",
                            data: "1627158426",
                            message: "fixing bug"
                        },
                        {
                            sha: "25d68f54",
                            data: "1627158100",
                            message: "adding bug"
                        }
                    ],
                    stars: 10,
                    defaultBranch: "main",
                    tags: ["tag1", "tag2"]
                })
                .go();

            await repositories
                .update({repoName, repoOwner})
                .remove([
                    "license",
                    "description",
                    "recentCommits",
                    "stars",
                    "defaultBranch",
                    "tags",
                ])
                .go();

            const item = await repositories
                .get({repoName, repoOwner})
                .go().then(res => res.data);

            expect(item).to.deep.equal({
                createdAt,
                repoOwner,
                repoName,
                username: repoOwner,
                isPrivate: false,
            });
        });

        it("should remove properties from an item with data method", async () => {
            const repoName = uuid();
            const repoOwner = uuid();
            const createdAt = "2021-07-01";

            await repositories
                .put({
                    repoName,
                    repoOwner,
                    createdAt,
                    isPrivate: false,
                    license: "apache-2.0",
                    description: "my description",
                    recentCommits: [
                        {
                            sha: "8ca4d4b2",
                            data: "1627158426",
                            message: "fixing bug"
                        },
                        {
                            sha: "25d68f54",
                            data: "1627158100",
                            message: "adding bug"
                        }
                    ],
                    stars: 10,
                    defaultBranch: "main",
                    tags: ["tag1", "tag2"]
                })
                .go();

            await repositories
                .update({repoName, repoOwner})
                .data((a, {remove}) => {
                    remove(a.license);
                    remove(a.description);
                    remove(a.recentCommits);
                    remove(a.stars);
                    remove(a.defaultBranch);
                    remove(a.tags);
                })
                .go();

            const item = await repositories
                .get({repoName, repoOwner})
                .go().then(res => res.data);

            expect(item).to.deep.equal({
                createdAt,
                repoOwner,
                repoName,
                username: repoOwner,
                isPrivate: false,
            });
        });
    });
    describe("delete operations", () => {
        it("should delete a value from the Set type attribute", async () => {
            const repoName = uuid();
            const repoOwner = uuid();

            await repositories
                .create({
                    repoName,
                    repoOwner,
                    stars: 10,
                    isPrivate: false,
                    defaultBranch: "main",
                    tags: ["tag1", "tag2"]
                })
                .go();

            await repositories
                .update({repoName, repoOwner})
                .delete({tags: ["tag1"]})
                .go();

            const results = await repositories
                .get({repoName, repoOwner})
                .go().then(res => res.data);

            expect(results?.tags).to.deep.equal(["tag2"]);
        });
        it("should delete a value from the Set type attribute with data method", async () => {
            const repoName = uuid();
            const repoOwner = uuid();

            await repositories
                .create({
                    repoName,
                    repoOwner,
                    stars: 10,
                    isPrivate: false,
                    defaultBranch: "main",
                    tags: ["tag1", "tag2"]
                })
                .go().then(res => res.data);

            await repositories
                .update({repoName, repoOwner})
                .data(({tags}, {del}) => del(tags, ["tag1"]))
                .go();

            const results = await repositories
                .get({repoName, repoOwner})
                .go().then(res => res.data);

            expect(results?.tags).to.deep.equal(["tag2"]);
        });

        it("should only allow attributes with type 'set', or 'any'", async () => {
            const repoName = uuid();
            const repoOwner = uuid();

            const deletion = {description: "my description"} as any;

            const err = await repositories
                .update({repoName, repoOwner})
                .delete(deletion)
                .go()
                .catch(err => err);

            expect(err.message).to.equal(`Invalid Update Attribute Operation: "DELETE" Operation can only be performed on attributes with type "set" or "any".`);
        });
    });

    describe("add operations", () => {
        it("should increment the 'stars' property", async () => {
            const repoName = uuid();
            const repoOwner = uuid();
            const repo = await repositories
                .create({
                    repoName,
                    repoOwner,
                    isPrivate: false,
                    defaultBranch: "main",
                })
                .go().then(res => res.data);
            expect(repo.stars).to.equal(0);

            await repositories
                .update({repoName, repoOwner})
                .add({stars: 1})
                .go();

            const results = await repositories
                .get({repoName, repoOwner})
                .go().then(res => res.data);

            expect(results?.stars).to.equal(1);
        });

        it("should only update attribute when it doesnt yet exist", async () => {
            const repoName = uuid();
            const repoOwner = uuid();

            const description1 = uuid();
            const description2 = uuid();

            await repositories
                .put({
                    repoName,
                    repoOwner,
                    isPrivate: true,
                })
                .go();

            await repositories.update({repoName, repoOwner})
                .data(({description}, {ifNotExists}) => {
                    ifNotExists(description, description1);
                })
                .go();

            const value1 = await repositories.get({repoName, repoOwner}).go().then(res => res.data);
            if (!value1) {
                throw new Error("expected value1");
            }
            await repositories.update({repoName, repoOwner})
                .data(({description}, {ifNotExists}) => {
                    ifNotExists(description, description2);
                })
                .go();

            const value2 = await repositories.get({repoName, repoOwner}).go().then(res => res.data);
            if (!value2) {
                throw new Error("expected value1");
            }

            expect(value1.description).to.equal(value2.description);
            expect(value1.description).to.equal(description1);
        });

        it("should add 5 'stars' to the repository", async () => {
            const repoName = uuid();
            const repoOwner = uuid();

            const repo = await repositories
                .create({
                    repoName,
                    repoOwner,
                    stars: 10,
                    isPrivate: false,
                    defaultBranch: "main",
                })
                .go().then(res => res.data);

            expect(repo.stars).to.equal(10);

            await repositories
                .update({repoName, repoOwner})
                .add({stars: 5})
                .go();

            const results = await repositories
                .get({repoName, repoOwner})
                .go().then(res => res.data);

            expect(results?.stars).to.equal(15);
        });

        it("should add 5 'stars' to the repository with the data method", async () => {
            const repoName = uuid();
            const repoOwner = uuid();
            const repo = await repositories
                .create({
                    repoName,
                    repoOwner,
                    stars: 10,
                    isPrivate: false,
                    defaultBranch: "main",
                })
                .go().then(res => res.data);

            expect(repo.stars).to.equal(10);

            await repositories
                .update({repoName, repoOwner})
                .data(({stars}, {add}) => add(stars, 5))
                .go().then(res => res.data);

            const results = await repositories
                .get({repoName, repoOwner})
                .go().then(res => res.data);

            expect(results?.stars).to.equal(15);
        });

        it("should add an item to the tags property Set", async () => {
            const repoName = uuid();
            const repoOwner = uuid();

            await repositories
                .create({
                    repoName,
                    repoOwner,
                    stars: 10,
                    isPrivate: false,
                    defaultBranch: "main",
                    tags: ["tag1", "tag2"]
                })
                .go();

            await repositories
                .update({repoName, repoOwner})
                .add({tags: ["tag3"]})
                .go();

            const results = await repositories
                .get({repoName, repoOwner})
                .go().then(res => res.data);

            expect(results?.tags).to.deep.equal(["tag1", "tag2", "tag3"]);
        });

        it("should only allow attributes with type 'number', 'set' or 'any'", async () => {
            const repoName = uuid();
            const repoOwner = uuid();

            const addition = {description: "my description"} as any;

            const err = await repositories
                .update({repoName, repoOwner})
                .add(addition)
                .go()
                .catch(err => err);

            expect(err.message).to.equal(`Invalid Update Attribute Operation: "ADD" Operation can only be performed on attributes with type "number", "set", or "any".`);
        });
    });
    describe("subtract operations", () => {
        it("should decrement the 'stars' property", async () => {
            const repoName = uuid();
            const repoOwner = uuid();

            const repo = await repositories
                .create({
                    repoName,
                    repoOwner,
                    stars: 5,
                    isPrivate: false,
                    defaultBranch: "main",
                })
                .go().then(res => res.data);

            expect(repo.stars).to.equal(5);

            await repositories
                .update({repoName, repoOwner})
                .subtract({stars: 1})
                .go();

            const results = await repositories
                .get({repoName, repoOwner})
                .go().then(res => res.data);

            expect(results?.stars).to.equal(4);
        });

        it("should remove 3 'stars' from the repository", async () => {
            const repoName = uuid();
            const repoOwner = uuid();

            const repo = await repositories
                .create({
                    repoName,
                    repoOwner,
                    stars: 5,
                    isPrivate: false,
                    defaultBranch: "main",
                })
                .go().then(res => res.data);

            expect(repo.stars).to.equal(5);

            await repositories
                .update({repoName, repoOwner})
                .subtract({stars: 3})
                .go();

            const results = await repositories
                .get({repoName, repoOwner})
                .go().then(res => res.data);

            expect(results?.stars).to.equal(2);
        });

        it("should remove 3 'stars' from the repository with the data method", async () => {
            const repoName = uuid();
            const repoOwner = uuid();

            const repo = await repositories
                .create({
                    repoName,
                    repoOwner,
                    stars: 5,
                    isPrivate: false,
                    defaultBranch: "main",
                })
                .go().then(res => res.data);

            expect(repo.stars).to.equal(5);

            await repositories
                .update({repoName, repoOwner})
                .data(({stars}, {subtract}) => subtract(stars, 3))
                .go();

            const results = await repositories
                .get({repoName, repoOwner})
                .go().then(res => res.data);

            expect(results?.stars).to.equal(2);
        });
    });
    describe("name operation", () => {
        it("should allow name to be passed to other operation", async () => {
            const repoName = uuid();
            const repoOwner = uuid();

            const repo = await repositories
                .create({
                    repoName,
                    repoOwner,
                    stars: 5,
                    isPrivate: false,
                    defaultBranch: "main",
                    views: 10
                })
                .go().then(res => res.data);

            expect(repo.stars).to.equal(5);

            await repositories
                .update({repoName, repoOwner})
                .data(({stars, views}, {name, add}) => add(views, name(stars)))
                .go();

            const results = await repositories
                .get({repoName, repoOwner})
                .go().then(res => res.data);

            expect(results?.views).to.equal(15);
        });

        it("should only allow types", async () => {

        });
    });
    describe("value operation", () => {
        it("should only allow types", async () => {
            const repoName = uuid();
            const repoOwner = uuid();

            const repo = await repositories
                .create({
                    repoName,
                    repoOwner,
                    stars: 5,
                    isPrivate: false,
                    views: 10,
                })
                .go().then(res => res.data);

            expect(repo.stars).to.equal(5);
            expect(repo.views).to.equal(10);

            const updateParams = repositories
                .update({repoName, repoOwner})
                .data(({stars, views}, {value, add}) => {
                    const newStars = value(stars, 20);
                    add(views, newStars);
                    add(stars, newStars);
                })
                .params();

            expect(updateParams).to.deep.equal({
                UpdateExpression: "SET #views = #views + :stars_u0, #stars = #stars + :stars_u0, #repoOwner = :repoOwner_u0, #repoName = :repoName_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0",
                ExpressionAttributeNames: {
                    '#stars': 'stars',
                    '#views': 'views',
                    "#repoName": "repoName",
                    "#repoOwner": "repoOwner",
                    "#__edb_e__": "__edb_e__", "#__edb_v__": "__edb_v__"
                },
                ExpressionAttributeValues: {
                    ':stars_u0': 20,
                    ":repoName_u0": repoName,
                    ":repoOwner_u0": repoOwner,
                    ":__edb_e___u0": "repositories", ":__edb_v___u0": "1"
                },
                TableName: 'electro',
                Key: {
                    pk: `$versioncontrol#repoowner_${repoOwner}`,
                    sk: `$alerts#repositories_1#reponame_${repoName}`
                }
            });

            const value = await repositories
                .update({repoName, repoOwner})
                .data(({stars, views}, {value, add}) => {
                    const newStars = value(stars, 20);
                    add(views, newStars);
                    add(stars, newStars);
                })
                .go();

            const results = await repositories
                .get({repoName, repoOwner})
                .go().then(res => res.data);

            expect(results?.views).to.equal(30);
            expect(results?.stars).to.equal(25);
        });
    });
    describe("string regex validation", () => {
        const entity = new Entity({
            model: {
                entity: "regex_test",
                service: "testing",
                version: "1"
            },
            attributes: {
                stringVal: {
                    type: "string",
                    validate: /^abc.*/gi
                },
                map: {
                    type: "map",
                    properties: {
                        nestedString: {
                            type: "string",
                            validate: /^abc/gi
                        },
                        nestedSet: {
                            type: "set",
                            items: "string",
                            validate: /^abc/gi
                        },
                        nestedList: {
                            type: "list",
                            items: {
                                type: "string",
                                validate: /^abc/gi
                            }
                        }
                    }
                },
                list: {
                    type: "list",
                    items: {
                        type: "string",
                        validate: /^abc/gi
                    }
                },
                set: {
                    type: "set",
                    items: "string",
                    validate: /^abc/gi
                }
            },
            indexes: {
                record: {
                    pk: {
                        field: "pk",
                        composite: ["stringVal"]
                    },
                    sk: {
                        field: "sk",
                        composite: []
                    }
                }
            }
        }, {client, table});
        it("should validate strings", async () => {
            const stringVal = uuid();
            const error = await entity.put({stringVal}).go().then(() => false).catch(err => err.message);
            expect(error).to.be.string('Invalid value for attribute "stringVal": Failed model defined regex');
        });
        it("should validate string sets", async () => {
            const stringVal = `abc${uuid()}`;
            const setValue = ["def"];
            const error = await entity.update({stringVal}).set({set: setValue}).go().then(() => false).catch(err => err.message);
            expect(error).to.be.string('Invalid value for attribute "set": Failed model defined regex');
        });
        it("should validate string lists", async () => {
            const stringVal = `abc${uuid()}`;
            const listValue = ["def"];
            const error = await entity.update({stringVal}).set({list: listValue}).go().then(() => false).catch(err => err.message);
            expect(error).to.be.string('Invalid value for attribute "list[*]": Failed model defined regex');
        });
        it("should validate string map properties", async () => {
            const stringVal = `abc${uuid()}`;
            const nestedString = "def";
            const error = await entity.update({stringVal}).set({map: {nestedString}}).go().then(() => false).catch(err => err.message);
            expect(error).to.be.string('Invalid value for attribute "map.nestedString": Failed model defined regex');
        });
        it("should validate string set map properties", async () => {
            const stringVal = `abc${uuid()}`;
            const nestedSet = ["def"];
            const error = await entity.update({stringVal}).set({map: {nestedSet}}).go().then(() => false).catch(err => err.message);
            expect(error).to.be.string('Invalid value for attribute "map.nestedSet": Failed model defined regex');
        });
        it("should validate string list map properties", async () => {
            const stringVal = `abc${uuid()}`;
            const nestedList = ["def"];
            const error = await entity.update({stringVal}).set({map: {nestedList}}).go({originalErr: true}).then(() => false).catch(err => err.message);
            expect(error).to.be.string('Invalid value for attribute "map.nestedList[*]"');
        });
    });

    it('should perform crud on custom attribute', async () => {
        const entity = new Entity({
            model: {
                service: 'any_service',
                entity: uuid(),
                version: '1'
            },
            attributes: {
                prop1: {
                    type: 'string'
                },
                prop2: createCustomAttribute<{strProp: string; numProp: number; maybeProp?: string}>(),
            },
            indexes: {
                record: {
                    pk: {
                        field: 'pk',
                        composite: ['prop1'],
                    },
                    sk: {
                        field: 'sk',
                        composite: [],
                    }
                }
            }
        }, {table, client});

        const prop1 = uuid();
        const numProp = 10;
        const strProp = 'value1';
        await entity.put({prop1, prop2: {numProp, strProp}}).go();
        const getVal = await entity.get({prop1}).go();
        expect(getVal.data).to.deep.equal({prop1, prop2: {numProp, strProp}});
        const updated = await entity.update({prop1}).data((attr, op) => {
            op.add(attr.prop2.numProp, numProp);
            op.set(attr.prop2.strProp, 'value2');
        }).go({response: 'all_new'});
        expect(updated.data.prop2).to.deep.equal({
            numProp: 20,
            strProp: 'value2',
        });
    });
    
    describe('enum sets', () => {
        const prop1 = uuid();
        const STRING_SET = ['ONE', 'TWO', 'THREE'] as const;
        const STRING_VAL = 'ONE';
        const NUM_SET = [1, 2, 3] as const;
        const NUM_VAL = 1;

        it('should allow for enum string set attributes', async () => {
            const entity = new Entity({
                model: {
                    service: 'any_service',
                    entity: uuid(),
                    version: '1'
                },
                attributes: {
                    prop1: {
                        type: 'string'
                    },
                    prop2: {
                        type: 'set',
                        items: STRING_SET,
                    }
                },
                indexes: {
                    record: {
                        pk: {
                            field: 'pk',
                            composite: ['prop1'],
                        },
                        sk: {
                            field: 'sk',
                            composite: [],
                        }
                    }
                }
            }, {table, client});
            await entity.put({
                prop1,
                prop2: [STRING_VAL],
            }).go();
            const result = await entity.get({prop1}).go();
            expect(result.data).to.deep.equal({
                prop1,
                prop2: [STRING_VAL],
            });
        });

        it('should allow for enum number set attributes', async () => {
            const entity = new Entity({
                model: {
                    service: 'any_service',
                    entity: uuid(),
                    version: '1'
                },
                attributes: {
                    prop1: {
                        type: 'string'
                    },
                    prop2: {
                        type: 'set',
                        items: NUM_SET,
                    }
                },
                indexes: {
                    record: {
                        pk: {
                            field: 'pk',
                            composite: ['prop1'],
                        },
                        sk: {
                            field: 'sk',
                            composite: [],
                        }
                    }
                }
            }, {table, client});
            await entity.put({
                prop1,
                prop2: [NUM_VAL],
            }).go();
            const result = await entity.get({prop1}).go();
            expect(result.data).to.deep.equal({
                prop1,
                prop2: [NUM_VAL],
            });
        });

        it('should allow for nested enum string set attributes', async () => {
            const entity = new Entity({
                model: {
                    service: 'any_service',
                    entity: uuid(),
                    version: '1'
                },
                attributes: {
                    prop1: {
                        type: 'string'
                    },
                    prop2: {
                        type: 'map',
                        properties: {
                            nested: {
                                type: 'set',
                                items: STRING_SET,
                            }
                        }
                    }
                },
                indexes: {
                    record: {
                        pk: {
                            field: 'pk',
                            composite: ['prop1'],
                        },
                        sk: {
                            field: 'sk',
                            composite: [],
                        }
                    }
                }
            }, {table, client});
            await entity.put({
                prop1,
                prop2: {
                    nested: [STRING_VAL]
                },
            }).go();
            const result = await entity.get({prop1}).go();
            expect(result.data).to.deep.equal({
                prop1,
                prop2: {
                    nested: [STRING_VAL],
                },
            });   
        });

        it('should allow for enum string set attributes', async () => {
            const entity = new Entity({
                model: {
                    service: 'any_service',
                    entity: uuid(),
                    version: '1'
                },
                attributes: {
                    prop1: {
                        type: 'string'
                    },
                    prop2: {
                        type: 'map',
                        properties: {
                            nested: {
                                type: 'set',
                                items: NUM_SET,
                            }
                        }
                    }
                },
                indexes: {
                    record: {
                        pk: {
                            field: 'pk',
                            composite: ['prop1'],
                        },
                        sk: {
                            field: 'sk',
                            composite: [],
                        }
                    }
                }
            }, {table, client});
            await entity.put({
                prop1,
                prop2: {
                    nested: [NUM_VAL]
                },
            }).go();
            const result = await entity.get({prop1}).go();
            expect(result.data).to.deep.equal({
                prop1,
                prop2: {
                    nested: [NUM_VAL],
                },
            });   
        });
    });
});