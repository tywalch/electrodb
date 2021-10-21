process.env.AWS_NODEJS_CONNECTION_REUSE_ENABLED = "1";
import { Entity } from "../index";
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
            const results1 = await StoreLocations.get(composite).go();

            await StoreLocations.update(composite)
                .data(({mapAttribute}, {set}) => set(mapAttribute.mapProperty, "after1"))
                .where(({mapAttribute}, {eq}) => {
                    return results1?.mapAttribute?.mapProperty
                        ? eq(mapAttribute.mapProperty, results1.mapAttribute.mapProperty)
                        : ""
                })
                .go();

            const results2 = await StoreLocations.get(composite).go();

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
            const results1 = await StoreLocations.get(composite).go();

            await StoreLocations.update(composite)
                .data(({rentalAgreement}, {set}) => set(rentalAgreement[0].detail, "no soup for you"))
                .where(({rentalAgreement}, {eq}) => {
                    return results1?.rentalAgreement?.[0]?.detail
                        ? eq(rentalAgreement[0].detail, results1.rentalAgreement[0].detail)
                        : ""
                })
                .go();

            const results2 = await StoreLocations.get(composite).go();

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
                .go();

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
                .go();

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
                .go();

            let item1 = await StoreLocations
                .get({cityId, mallId, storeId, buildingId})
                .go();

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
                .go();

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
                .go();

            let item1 = await StoreLocations
                .get({cityId, mallId, storeId, buildingId})
                .go();

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
                .go();

            let item2 = await StoreLocations
                .get({cityId, mallId, storeId, buildingId})
                .go();

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
                    op.remove(attr.leaseEndDate);
                    op.append(attr.rentalAgreement, [{type: "ammendment", detail: "no soup for you"}]);
                    op.delete(attr.tags, ['coffee']);
                    op.del(attr.contact, ['555-345-2222']);
                    op.add(attr.totalFees, op.name(attr.petFee));
                    op.add(attr.leaseHolders, newTenant);
                })
                .where((attr, op) => op.eq(attr.category, "food/coffee"))
                .params()

            expect(JSON.parse(JSON.stringify(allParameters))).to.deep.equal({
                "UpdateExpression": "SET #category = :category_u0, #deposit = #deposit - :deposit_u0, #rentalAgreement = list_append(#rentalAgreement, :rentalAgreement_u0), #cityId = :cityId_u0, #mallId = :mallId_u0, #buildingId = :buildingId_u0, #storeId = :storeId_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0 REMOVE #leaseEndDate, #gsi2sk ADD #tenant :tenant_u0, #rent :rent_u0, #totalFees #petFee, #leaseHolders :tenant_u0 DELETE #tags :tags_u0, #contact :contact_u0",
                "ExpressionAttributeNames": {
                    "#category": "category",
                    "#tenant": "tenant",
                    "#rent": "rent",
                    "#deposit": "deposit",
                    "#leaseEndDate": "leaseEndDate",
                    "#rentalAgreement": "rentalAgreement",
                    "#tags": "tags",
                    "#contact": "contact",
                    "#totalFees": "totalFees",
                    "#petFee": "petFee",
                    "#leaseHolders": "leaseHolders",
                    "#gsi2sk": "gsi2sk",
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
            .go();

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
                op.add(attr.views, created.custom.prop3);
                op.set(attr.license, op.name(attr.files[0]));
                op.add(attr.recentCommits[0].views, updates.recentCommitsViews);
                op.remove(attr.recentCommits[1].message);
            })
            .params();

        expect(params).to.deep.equal({
            "UpdateExpression": "SET #stars = #stars - :stars_u0, #files = list_append(#files, :files_u0), #description = :description_u0, #custom.#prop1 = :custom_u0, #license = #files[0], #repoOwner = :repoOwner_u0, #repoName = :repoName_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0 REMOVE #about, #recentCommits[1].#message ADD #followers :followers_u0, #views :views_u0, #recentCommits[0].#views :views_u1 DELETE #tags :tags_u0",
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
                "#recentCommits": "recentCommits",
                "#message": "message",
                "#repoName": "repoName",
                "#repoOwner": "repoOwner",
                "#license": "license",
                "#__edb_e__": "__edb_e__",
                "#__edb_v__": "__edb_v__",
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
                ":views_u0": 200,
                ":views_u1": 3,
                ":repoName_u0": repoName,
                ":repoOwner_u0": repoOwner,
                ":__edb_e___u0": "repositories",
                ":__edb_v___u0": "1",
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
                op.add(attr.views, created.custom.prop3);
                op.set(attr.license, op.name(attr.files[0]));
                op.add(attr.recentCommits[0].views, updates.recentCommitsViews);
                op.remove(attr.recentCommits[1].message);
            })
            .go()

        const item = await repositories.get({repoName, repoOwner}).go();

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
            "license": "index.ts",
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
                .go();

            await repositories
                .update({repoName, repoOwner})
                .append({
                    recentCommits: additionalCommit
                })
                .go();

            const item = await repositories
                .get({repoName, repoOwner})
                .go();

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
                .go();

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
                .go();

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
                .go();

            await repositories
                .update({repoName, repoOwner})
                .data(({recentCommits}, {append}) => append(recentCommits, additionalCommit))
                .go();

            const item = await repositories
                .get({repoName, repoOwner})
                .go();

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

            const itemBefore = await users.get({username}).go({raw: true});

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
                .go({raw: true});

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

            const itemBefore = await users.get({username}).go({raw: true});

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
                .go({raw: true});

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

            const itemBefore = await users.get({username}).go({raw: true});

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

            const error = await repositories
                .update({repoName, repoOwner})
                .remove(removal)
                .go()
                .catch(err => err);

            expect(error.message).to.equal(`Attribute "createdAt" is Read-Only and cannot be removed`);
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
                .go();

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
                .go();

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
                .go();

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
                .go();

            await repositories
                .update({repoName, repoOwner})
                .data(({tags}, {del}) => del(tags, ["tag1"]))
                .go();

            const results = await repositories
                .get({repoName, repoOwner})
                .go();

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
                .go();
            expect(repo.stars).to.equal(0);

            await repositories
                .update({repoName, repoOwner})
                .add({stars: 1})
                .go();

            const results = await repositories
                .get({repoName, repoOwner})
                .go();

            expect(results?.stars).to.equal(1);
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
                .go();

            expect(repo.stars).to.equal(10);

            await repositories
                .update({repoName, repoOwner})
                .add({stars: 5})
                .go();

            const results = await repositories
                .get({repoName, repoOwner})
                .go();

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
                .go();

            expect(repo.stars).to.equal(10);

            await repositories
                .update({repoName, repoOwner})
                .data(({stars}, {add}) => add(stars, 5))
                .go();

            const results = await repositories
                .get({repoName, repoOwner})
                .go();

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
                .go();

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
                .go();

            expect(repo.stars).to.equal(5);

            await repositories
                .update({repoName, repoOwner})
                .subtract({stars: 1})
                .go();

            const results = await repositories
                .get({repoName, repoOwner})
                .go();

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
                .go();

            expect(repo.stars).to.equal(5);

            await repositories
                .update({repoName, repoOwner})
                .subtract({stars: 3})
                .go();

            const results = await repositories
                .get({repoName, repoOwner})
                .go();

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
                .go();

            expect(repo.stars).to.equal(5);

            await repositories
                .update({repoName, repoOwner})
                .data(({stars}, {subtract}) => subtract(stars, 3))
                .go();

            const results = await repositories
                .get({repoName, repoOwner})
                .go();

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
                .go();

            expect(repo.stars).to.equal(5);

            await repositories
                .update({repoName, repoOwner})
                .data(({stars, views}, {name, set}) => set(views, name(stars)))
                .go();

            const results = await repositories
                .get({repoName, repoOwner})
                .go();

            expect(results?.views).to.equal(5);
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
                .go();

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
                "UpdateExpression": "SET #repoOwner = :repoOwner_u0, #repoName = :repoName_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0 ADD #views :stars_u0, #stars :stars_u0",
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
                .go();

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
            console.log(stringVal)
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
            console.log(error)
            expect(error).to.be.string('Invalid value for attribute "map.nestedList[*]": Failed model defined regex at index "0"');
        });
    });
});