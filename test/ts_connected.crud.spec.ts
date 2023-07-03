process.env.AWS_NODEJS_CONNECTION_REUSE_ENABLED = "1";
import { CreateEntityItem, Entity, EntityItem, QueryResponse } from "../index";
import { expect } from "chai";
import { v4 as uuid } from "uuid";
import moment from "moment";
import DynamoDB from "aws-sdk/clients/dynamodb";

const client = new DynamoDB.DocumentClient({
    region: "us-east-1",
    endpoint: process.env.LOCAL_DYNAMO_ENDPOINT
});

const sleep = async (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const SERVICE = "BugBeater";
const ENTITY = "TEST_ENTITY";
const table = "electro";

describe("Entity", () => {
    before(async () => sleep(1000));
    let MallStores = new Entity({
        model: {
            service: SERVICE,
            entity: ENTITY,
            version: "1",
        },
        attributes: {
            id: {
                type: "string",
                default: () => uuid(),
                field: "storeLocationId",
            },
            sector: {
                type: "string",
            },
            mall: {
                type: "string",
                required: true,
                field: "mallId",
                set: (mall?: string) => {
                    return (mall ?? "") + "abc";
                }
            },
            store: {
                type: "string",
                required: true,
                field: "storeId",
            },
            building: {
                type: "string",
                required: true,
                field: "buildingId",
            },
            unit: {
                type: "string",
                required: true,
                field: "unitId",
            },
            category: {
                type: [
                    "food/coffee",
                    "food/meal",
                    "clothing",
                    "electronics",
                    "department",
                    "misc",
                ],
                required: true,
            },
            leaseEnd: {
                type: "string",
                required: true,
                validate: (date: string) =>
                    moment(date, "YYYY-MM-DD").isValid() ? "" : "Invalid date format",
            },
            rent: {
                type: "string",
                required: false,
                default: "0.00",
            },
            adjustments: {
                type: "string",
                required: false,
            },
        },
        indexes: {
            store: {
                pk: {
                    field: "pk",
                    composite: ["sector"],
                },
                sk: {
                    field: "sk",
                    composite: ["id"],
                },
            },
            units: {
                index: "gsi1pk-gsi1sk-index",
                pk: {
                    field: "gsi1pk",
                    composite: ["mall"],
                },
                sk: {
                    field: "gsi1sk",
                    composite: ["building", "unit", "store"],
                },
            },
            leases: {
                index: "gsi2pk-gsi2sk-index",
                pk: {
                    field: "gsi2pk",
                    composite: ["mall"],
                },
                sk: {
                    field: "gsi2sk",
                    composite: ["leaseEnd", "store", "building", "unit"],
                },
            },
            categories: {
                index: "gsi3pk-gsi3sk-index",
                pk: {
                    field: "gsi3pk",
                    composite: ["mall"],
                },
                sk: {
                    field: "gsi3sk",
                    composite: ["category", "building", "unit", "store"],
                },
            },
            shops: {
                index: "gsi4pk-gsi4sk-index",
                pk: {
                    field: "gsi4pk",
                    composite: ["store"],
                },
                sk: {
                    field: "gsi4sk",
                    composite: ["mall", "building", "unit"],
                },
            },
        }
    }, { client, table });

    describe("Simple crud", () => {
        let mall = "EastPointe";
        let store = "LatteLarrys";
        let sector = "A1";
        let category = "food/coffee";
        let leaseEnd = "2020-01-20";
        let rent = "0.00";
        let letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        let building = "BuildingZ";
        let unit = "G1";
        it("Should return the created item", async () => {
            let putOne = await MallStores.put({
                sector,
                store,
                mall,
                rent,
                category,
                leaseEnd,
                unit,
                building,
            }).go();
            expect(putOne.data).to.deep.equal({
                id: putOne.data.id,
                sector,
                mall: mall + "abc",
                store,
                building,
                unit,
                category,
                leaseEnd,
                rent,
            });
        }).timeout(20000);
        it("Should not collide with other keys", async () => {
            let sector = uuid();
            let malls = [uuid(), uuid()];
            let storeNames = [
                "ABC",
                "DEF",
                "GHI",
                "JKL",
                "MNO",
                "PQR",
                "STU",
                "WXY",
                "ZYX",
                "WUT",
            ];
            let stores = [];
            for (let i = 0; i < storeNames.length; i++) {
                let mall = malls[i % 2];
                stores.push(
                    MallStores.put({
                        sector,
                        mall,
                        rent,
                        category,
                        leaseEnd,
                        store: storeNames[i],
                        unit: `B${i + 1}`,
                        building: `Building${letters[i]}`,
                    }).go().then(res => res.data),
                );
            }
            stores = await Promise.all(stores);
            expect(stores).to.be.an("array").and.have.length(10);

            let mallOne = malls[0] + "abc";
            let mallOneIds = stores
                .filter((store) => store.mall === mallOne)
                .map((store) => store.id);

            let mallOneStores = await MallStores.query
                .units({
                    mall: mallOne,
                })
                .go()
                .then(res => res.data);

            let mallOneMatches = mallOneStores.every((store) =>
                mallOneIds.includes(store.id),
            );

            expect(mallOneMatches).to.be.true;
            expect(mallOneStores).to.be.an("array").and.have.length(5);

            let first = stores[0];
            let firstStore = await MallStores.get({
                sector,
                id: first.id,
            }).go().then(res => res.data);
            expect(firstStore).to.be.deep.equal(first);

            let buildingsAfterB = await MallStores.query
                .categories({ category, mall: mallOne })
                .gt({ building: "BuildingB" })
                .go().then(res => res.data);
            let buildingsAfterBStores = stores.filter(store => {
                return (
                    store.mall === mallOne &&
                    store.building !== "BuildingA" &&
                    store.building !== "BuildingB"
                );
            });
            expect(buildingsAfterB).to.deep.equal(buildingsAfterBStores);

            let buildingsBetweenBH = await MallStores.query
                .categories({ category, mall: mallOne })
                .between({ building: "BuildingB" }, { building: "BuildingH" })
                .go().then(res => res.data);

            let buildingsBetweenBHStores = stores.filter(store => {
                return (
                    store.mall === mallOne &&
                    store.building !== "BuildingA" &&
                    store.building !== "BuildingI"
                );
            });
            expect(buildingsBetweenBH)
                .to.be.an("array")
                .and.have.length(3)
                .and.to.be.deep.equal(buildingsBetweenBHStores);

            let secondStore = { sector, id: stores[1].id };
            let secondStoreBeforeUpdate = await MallStores.get(secondStore).go().then(res => res.data);
            let newRent = "5000.00";
            if (secondStoreBeforeUpdate === null) {
                throw new Error('Expected secondStoreBeforeUpdate value');
            }
            expect(secondStoreBeforeUpdate?.rent)
                .to.equal(rent)
                .and.to.not.equal(newRent);
            let updatedStore = await MallStores.update(secondStore)
                .set({ rent: newRent })
                .go();
            expect(updatedStore.data).to.deep.equal(secondStore);
            let secondStoreAfterUpdate = await MallStores.get(secondStore).go();
            expect(secondStoreAfterUpdate.data?.rent).to.equal(newRent);
        }).timeout(20000);

        it('should overwrite readonly properties if they exist in a key', async () => {
            let createdAt = 1;
            const updatedAt = Date.now();
            const thing = new Entity({
                model: {
                    entity: "transaction",
                    service: "bank",
                    version: "1"
                },
                attributes: {
                    accountNumber: {
                        type: "string"
                    },
                    transactionId: {
                        type: "string"
                    },
                    transactionType: {
                        type: 'string',
                    },
                    description: {
                        type: "string",
                    },
                    source: {
                        type: 'string',
                        readOnly: true,
                    },
                    createdAt: {
                        type: "number",
                        readOnly: true,
                        required: true,
                        default: () => 1,
                        set: () => createdAt++,
                    },
                    updatedAt: {
                        type: "number",
                        watch: "*",
                        required: true,
                        default: () => updatedAt,
                        set: () => updatedAt,
                    }
                },
                indexes: {
                    transactions: {
                        pk: {
                            field: "pk",
                            composite: ["accountNumber"]
                        },
                        sk: {
                            field: "sk",
                            composite: ["transactionId"]
                        }
                    },
                    byCreated: {
                        index: 'gis1pk-gsi1sk-index',
                        pk: {
                            field: 'gsi1pk',
                            composite: ['transactionType']
                        },
                        sk: {
                            field: 'gsi1sk',
                            composite: ['createdAt']
                        }
                    }
                }
            }, { table, client });

            const accountNumber = uuid();
            const transactionId = uuid();
            const description1 = uuid();
            const source1 = uuid();

            const description2 = uuid();
            const source2 = uuid();

            const params = await thing
                .upsert({
                    transactionId,
                    accountNumber,
                    description: description1,
                    source: source1,
                })
                .params();

            expect(params.UpdateExpression).to.equal('SET #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0, #accountNumber = :accountNumber_u0, #transactionId = :transactionId_u0, #description = :description_u0, #source = if_not_exists(#source, :source_u0), #createdAt = :createdAt_u0, #updatedAt = :updatedAt_u0, #gsi1pk = :gsi1pk_u0, #gsi1sk = :gsi1sk_u0');

            const upserted1 = await thing
                .upsert({
                    transactionId,
                    accountNumber,
                    description: description1,
                    source: source1,
                })
                .go({ response: 'all_new' });

            const firstCreatedAt = createdAt - 1;

            expect(upserted1.data).to.deep.equal({
                updatedAt,
                transactionId,
                accountNumber,
                description: description1,
                source: source1,
                createdAt: firstCreatedAt,
            });

            const upserted2 = await thing
                .upsert({
                    transactionId,
                    accountNumber,
                    description: description2,
                    source: source2,
                })
                .go({response: 'all_new'});

            const secondCreatedAt = createdAt - 1;

            expect(upserted2.data).to.deep.equal({
                transactionId,
                accountNumber,
                description: description2,
                source: source1,
                updatedAt,
                createdAt: secondCreatedAt,
            });

            expect(firstCreatedAt).to.not.equal(secondCreatedAt);
            expect(secondCreatedAt - 1).to.equal(firstCreatedAt);
        });

        it("Should not create a overwrite existing record", async () => {
            let id = uuid();
            let mall = "EastPointe";
            let store = "LatteLarrys";
            let sector = "A1";
            let category = "food/coffee";
            let leaseEnd = "2020-01-20";
            let rent = "0.00";
            let building = "BuildingZ";
            let unit = "G1";
            let record = {
                id,
                mall,
                store,
                sector,
                category,
                leaseEnd,
                rent,
                building,
                unit
            };
            let recordOne = await MallStores.create(record).go().then(res => res.data);
            // mall would be changed by the setter;
            expect(recordOne).to.deep.equal({...record, mall: mall + "abc"});
            let recordTwo = null;
            try {
                recordTwo = await MallStores.create(record).go().then(res => res.data);
            } catch(err: any) {
                expect(err.message).to.be.equal('Error thrown by DynamoDB client: "The conditional request failed" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#aws-error');
            }
            expect(recordTwo).to.be.null;
        });

        it("Should only update a record if it already exists", async () => {
            let id = uuid();
            let mall = "EastPointe" + "abc";
            let store = "LatteLarrys";
            let sector = "A1";
            let category = "food/coffee";
            let leaseEnd = "2020-01-20";
            let rent = "0.00";
            let building = "BuildingZ";
            let unit = "G1";
            let record = {
                id,
                mall,
                store,
                sector,
                category,
                leaseEnd,
                rent,
                building,
                unit
            };
            let recordOne = await MallStores.create(record).go().then(res => res.data);
            // mall would be changed by the setter
            expect(recordOne).to.deep.equal({...record, mall: mall + "abc"});
            let patchResultsOne = await MallStores.patch({sector, id})
                .set({ rent: '100.00' })
                .go()
                .then(res => res.data);
            let patchResultsTwo = null;
            try {
                patchResultsTwo = await MallStores.patch({sector, id: `${id}-2`})
                    .set({rent: "200.00"})
                    .go()
                    .then(res => res.data);
            } catch(err: any) {
                expect(err.message).to.be.equal('Error thrown by DynamoDB client: "The conditional request failed" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#aws-error');
            }
            expect(patchResultsTwo).to.be.null;
        });

        it("Should pass back the original dynamodb error when originalErr is set to true", async () => {
            let id = uuid();
            let sector = "A1";

            let [electroSuccess, electroErr] = await MallStores.get({sector, id})
                .go({params: {TableName: "blahblah"}})
                .then(() => [true, null])
                .catch(err => [false, err]);

            let [originalSuccess, originalErr] = await MallStores.get({sector, id})
                .go({originalErr: true, params: {TableName: "blahblah"}})
                .then(() => [true, null])
                .catch(err => [false, err]);

            expect(electroSuccess).to.be.false;
            expect(electroErr.stack.split(/\r?\n/)[1].includes("aws-sdk")).to.be.false;
            expect([
                'Error thrown by DynamoDB client: "Requested resource not found" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#aws-error',
                'Error thrown by DynamoDB client: "Cannot do operations on a non-existent table" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#aws-error'
            ].includes(electroErr.message)).to.be.true;
            expect(originalSuccess).to.be.false;
            expect(originalErr.stack.split(/\r?\n/)[1].includes("aws-sdk")).to.be.true;
        });
    });

    describe("Simple crud without sort key", () => {
        const MallStores = new Entity({
            model: {
                service: SERVICE,
                entity: ENTITY,
                version: "1",
            },
            attributes: {
                id: {
                    type: "string",
                    default: () => uuid(),
                    field: "storeLocationId",
                },
                sector: {
                    type: "string",
                },
                mall: {
                    type: "string",
                    required: true,
                    field: "mallId",
                },
                store: {
                    type: "string",
                    required: true,
                    field: "storeId",
                },
                building: {
                    type: "string",
                    required: true,
                    field: "buildingId",
                },
                unit: {
                    type: "string",
                    required: true,
                    field: "unitId",
                },
                category: {
                    type: [
                        "food/coffee",
                        "food/meal",
                        "clothing",
                        "electronics",
                        "department",
                        "misc",
                    ],
                    required: true,
                },
                leaseEnd: {
                    type: "string",
                    required: true,
                    validate: (date) =>
                        moment(date, "YYYY-MM-DD").isValid() ? "" : "Invalid date format",
                },
                rent: {
                    type: "string",
                    required: false,
                    default: "0.00",
                },
                adjustments: {
                    type: "string",
                    required: false,
                },
            },
            indexes: {
                store: {
                    pk: {
                        field: "partition_key",
                        composite: ["sector", "id"],
                    }
                },
                units: {
                    index: "idx1",
                    pk: {
                        field: "partition_key_idx1",
                        composite: ["mall"],
                    },
                    sk: {
                        field: "sort_key_idx1",
                        composite: ["building", "unit", "store"],
                    },
                },
                leases: {
                    index: "idx2",
                    pk: {
                        field: "partition_key_idx2",
                        composite: ["mall"],
                    }
                },
                categories: {
                    index: "gsi3pk-gsi3sk-index",
                    pk: {
                        field: "gsi3pk",
                        composite: ["mall"],
                    },
                    sk: {
                        field: "gsi3sk",
                        composite: ["category", "building", "unit", "store"],
                    },
                },
                shops: {
                    index: "gsi4pk-gsi4sk-index",
                    pk: {
                        field: "gsi4pk",
                        composite: ["store"],
                    },
                    sk: {
                        field: "gsi4sk",
                        composite: ["mall", "building", "unit"],
                    },
                },
            }
        }, {client, table: "electro_nosort"});
        let mall = "EastPointe";
        let store = "LatteLarrys";
        let sector = "A1";
        let category = "food/coffee";
        let leaseEnd = "2020-01-20";
        let rent = "0.00";
        let letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        let building = "BuildingZ";
        let unit = "G1";
        it("Should return the created item", async () => {
            let putOne = await MallStores.put({
                sector,
                store,
                mall,
                rent,
                category,
                leaseEnd,
                unit,
                building,
            }).go().then(res => res.data);
            expect(putOne).to.deep.equal({
                id: putOne.id,
                sector,
                mall,
                store,
                building,
                unit,
                category,
                leaseEnd,
                rent,
            });
        }).timeout(20000);
        it("Should not collide with other keys", async () => {
            let sector = uuid();
            let malls = [uuid(), uuid()];
            let storeNames = [
                "ABC",
                "DEF",
                "GHI",
                "JKL",
                "MNO",
                "PQR",
                "STU",
                "WXY",
                "ZYX",
                "WUT",
            ];
            let stores = [];
            for (let i = 0; i < storeNames.length; i++) {
                let mall = malls[i % 2];
                stores.push(
                    MallStores.put({
                        sector,
                        mall,
                        rent,
                        category,
                        leaseEnd,
                        store: storeNames[i],
                        unit: `B${i + 1}`,
                        building: `Building${letters[i]}`,
                    }).go().then(res => res.data),
                );
            }
            stores = await Promise.all(stores);
            expect(stores).to.be.an("array").and.have.length(10);

            let mallOne = malls[0];
            let mallOneIds = stores
                .filter((store) => store.mall === mallOne)
                .map((store) => store.id);

            let mallOneStores = await MallStores.query
                .units({
                    mall: mallOne,
                })
                .go().then(res => res.data);

            let mallOneMatches = mallOneStores.every((store) =>
                mallOneIds.includes(store.id),
            );

            expect(mallOneMatches);
            expect(mallOneStores).to.be.an("array").and.have.length(5);

            let first = stores[0];
            let firstStore = await MallStores.get({
                sector,
                id: first.id,
            }).go().then(res => res.data);
            expect(firstStore).to.be.deep.equal(first);

            let buildingsAfterB = await MallStores.query
                .categories({ category, mall: mallOne })
                .gt({ building: "BuildingB" })
                .go().then(res => res.data);
            let buildingsAfterBStores = stores.filter((store) => {
                return (
                    store.mall === mallOne &&
                    store.building !== "BuildingA" &&
                    store.building !== "BuildingB"
                );
            });
            expect(buildingsAfterB).to.deep.equal(buildingsAfterBStores);

            let buildingsBetweenBH = await MallStores.query
                .categories({ category, mall: mallOne })
                .between({ building: "BuildingB" }, { building: "BuildingH" })
                .go().then(res => res.data);

            let buildingsBetweenBHStores = stores.filter((store) => {
                return (
                    store.mall === mallOne &&
                    store.building !== "BuildingA" &&
                    store.building !== "BuildingI"
                );
            });
            expect(buildingsBetweenBH)
                .to.be.an("array")
                .and.have.length(3)
                .and.to.be.deep.equal(buildingsBetweenBHStores);

            let secondStore = { sector, id: stores[1].id };
            let secondStoreBeforeUpdate = await MallStores.get(secondStore).go().then(res => res.data);
            let newRent = "5000.00";
            expect(secondStoreBeforeUpdate?.rent)
                .to.equal(rent)
                .and.to.not.equal(newRent);
            let updatedStore = await MallStores.update(secondStore)
                .set({ rent: newRent })
                .go()
                .then(res => res.data);
            expect(updatedStore).to.deep.equal(secondStore);
            let secondStoreAfterUpdate = await MallStores.get(secondStore).go().then(res => res.data);
            expect(secondStoreAfterUpdate?.rent).to.equal(newRent);
        }).timeout(20000);

        it("Should not create a overwrite existing record", async () => {
            let id = uuid();
            let mall = "EastPointe";
            let store = "LatteLarrys";
            let sector = "A1";
            let category = "food/coffee";
            let leaseEnd = "2020-01-20";
            let rent = "0.00";
            let building = "BuildingZ";
            let unit = "G1";
            let record = {
                id,
                mall,
                store,
                sector,
                category,
                leaseEnd,
                rent,
                building,
                unit
            };
            let recordOne = await MallStores.create(record).go().then(res => res.data);
            expect(recordOne).to.deep.equal(record);
            let recordTwo = null;
            try {
                recordTwo = await MallStores.create(record).go().then(res => res.data);
            } catch(err: any) {
                expect(err.message).to.be.equal('Error thrown by DynamoDB client: "The conditional request failed" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#aws-error');
            }
            expect(recordTwo).to.be.null
        });

        it("Should only update a record if it already exists", async () => {
            let id = uuid();
            let mall = "EastPointe";
            let store = "LatteLarrys";
            let sector = "A1";
            let category = "food/coffee";
            let leaseEnd = "2020-01-20";
            let rent = "0.00";
            let building = "BuildingZ";
            let unit = "G1";
            let record = {
                id,
                mall,
                store,
                sector,
                category,
                leaseEnd,
                rent,
                building,
                unit
            };
            let recordOne = await MallStores.create(record).go().then(res => res.data);
            expect(recordOne).to.deep.equal(record);
            let patchResultsTwo = null;
            try {
                patchResultsTwo = await MallStores.patch({sector, id: `${id}-2`}).set({rent: "200.00"}).go().then(res => res.data);
            } catch(err: any) {
                expect(err.message).to.be.equal('Error thrown by DynamoDB client: "The conditional request failed" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#aws-error');
            }
            expect(patchResultsTwo).to.be.null
        });

        it("Should pass back the original dynamodb error when originalErr is set to true", async () => {
            let id = uuid();
            let sector = "A1";

            let [electroSuccess, electroErr] = await MallStores.get({sector, id})
                .go({params: {TableName: "blahblah"}}).then(res => res.data)
                .then(() => [true, null])
                .catch(err => [false, err]);

            let [originalSuccess, originalErr] = await MallStores.get({sector, id})
                .go({originalErr: true, params: {TableName: "blahblah"}})
                .then(() => [true, null])
                .catch(err => [false, err]);

            expect(electroSuccess).to.be.false;
            expect(electroErr.stack.split(/\r?\n/)[1].includes("aws-sdk")).to.be.false;
            expect([
                'Error thrown by DynamoDB client: "Requested resource not found" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#aws-error',
                'Error thrown by DynamoDB client: "Cannot do operations on a non-existent table" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#aws-error'
            ].includes(electroErr.message)).to.be.true;
            expect(originalSuccess).to.be.false;
            expect(originalErr.stack.split(/\r?\n/)[1].includes("aws-sdk")).to.be.true;
        });
    });

    describe("Tailing labels", async () => {
        it("Should include tailing label if chained query methods are not used", async () => {
            let labeler = new Entity({
                model: {
                    service: "inventory",
                    entity: "items",
                    version: "1",
                },
                attributes: {
                    section: {
                        type: "string",
                    },
                    isle: {
                        type: "string"
                    },
                    name: {
                        type: "string"
                    },
                },
                indexes: {
                    locations: {
                        pk: {
                            field: "pk",
                            composite: ["section"],
                        },
                        sk: {
                            field: "sk",
                            composite: ["isle", "name"]
                        }
                    }
                }
            }, {client, table: "electro"});
            let section = "dairy";
            let item1 = {
                section,
                isle: "A2",
                name: "milk"
            };
            let item2 = {
                section,
                isle: "A23",
                name: "eggs"
            };
            await labeler.put([item1, item2]).go().then(res => res.unprocessed);
            await sleep(500);
            let beginsWithIsle = await labeler.query.locations({section}).begins({isle: "A2"}).go().then(res => res.data);
            let specificIsle = await labeler.query.locations({section, isle: "A2"}).go().then(res => res.data);
            expect(beginsWithIsle).to.be.an("array").with.lengthOf(2);
            expect(beginsWithIsle).to.be.deep.equal([item1, item2]);
            expect(specificIsle).to.be.an("array").with.lengthOf(1);
            expect(specificIsle).to.be.deep.equal([item1]);
        })
    });

    describe("Custom index fields", () => {
        it("Should use the index field names as theyre specified on the model", async () => {
            let schema = {
                model: {
                    service: "MallStoreDirectory",
                    entity: "MallStores",
                    version: "1",
                },
                attributes: {
                    id: {
                        type: "string",
                        field: "id",
                    },
                    mall: {
                        type: "string",
                        required: true,
                        field: "mall",
                    },
                    stores: {
                        type: "number",
                    },
                    value: {
                        type: "string"
                    }
                },
                indexes: {
                    store: {
                        pk: {
                            field: "partition_key",
                            composite: ["id"],
                        },
                        sk: {
                            field: "sort_key",
                            composite: ["mall", "stores"]
                        }
                    },
                    other: {
                        index: "idx1",
                        pk: {
                            field: "partition_key_idx1",
                            composite: ["mall"],
                        },
                        sk: {
                            field: "sort_key_idx1",
                            composite: ["id", "stores"]
                        }
                    }
                }
            };
            let MallStores = new Entity({
                model: {
                    service: "MallStoreDirectory",
                    entity: "MallStores",
                    version: "1",
                },
                attributes: {
                    id: {
                        type: "string",
                        field: "id",
                    },
                    mall: {
                        type: "string",
                        required: true,
                        field: "mall",
                    },
                    stores: {
                        type: "number",
                    },
                    value: {
                        type: "string"
                    }
                },
                indexes: {
                    store: {
                        pk: {
                            field: "partition_key",
                            composite: ["id"],
                        },
                        sk: {
                            field: "sort_key",
                            composite: ["mall", "stores"]
                        }
                    },
                    other: {
                        index: "idx1",
                        pk: {
                            field: "partition_key_idx1",
                            composite: ["mall"],
                        },
                        sk: {
                            field: "sort_key_idx1",
                            composite: ["id", "stores"]
                        }
                    }
                }
            }, {client, table: "electro_customkeys"});
            let id = uuid();
            let mall = "defg";
            let stores = 1;
            let value = "ahssfh";
            await MallStores.get({id, mall, stores}).go();
            await MallStores.delete({id, mall, stores}).go();
            await MallStores.update({id, mall, stores}).set({value}).go();
            await MallStores.patch({id, mall, stores}).set({value}).go();
            await MallStores.create({id: id + 1, mall, stores, value}).go();
            await MallStores.put({id, mall, stores, value}).go();
            await MallStores.query.store({id, mall, stores}).go();
            await MallStores.query.other({id, mall, stores}).go();
            await MallStores.scan.go();
        });
        it("Should use the index field names as theyre specified on the model when sort keys do not exist", async () => {
            const schema = {
                model: {
                    service: "MallStoreDirectory",
                    entity: "MallStores",
                    version: "1",
                },
                attributes: {
                    id: {
                        type: "string",
                        field: "id",
                    },
                    mall: {
                        type: "string",
                        required: true,
                        field: "mall",
                    },
                    stores: {
                        type: "number",
                    },
                    value: {
                        type: "string"
                    }
                },
                indexes: {
                    store: {
                        pk: {
                            field: "partition_key",
                            composite: ["id", "mall", "stores"],
                        },
                    },
                    other: {
                        index: "idx1",
                        pk: {
                            field: "partition_key_idx1",
                            composite: ["mall"],
                        },
                        sk: {
                            field: "sort_key_idx1",
                            composite: ["id", "stores"]
                        }
                    },
                    noSortOther: {
                        index: "idx2",
                        pk: {
                            field: "partition_key_idx2",
                            composite: ["mall"],
                        }
                    },
                }
            } as const;
            let MallStores = new Entity({
                model: {
                    service: "MallStoreDirectory",
                    entity: "MallStores",
                    version: "1",
                },
                attributes: {
                    id: {
                        type: "string",
                        field: "id",
                    },
                    mall: {
                        type: "string",
                        required: true,
                        field: "mall",
                    },
                    stores: {
                        type: "number",
                    },
                    value: {
                        type: "string"
                    }
                },
                indexes: {
                    store: {
                        pk: {
                            field: "partition_key",
                            composite: ["id", "mall", "stores"],
                        },
                    },
                    other: {
                        index: "idx1",
                        pk: {
                            field: "partition_key_idx1",
                            composite: ["mall"],
                        },
                        sk: {
                            field: "sort_key_idx1",
                            composite: ["id", "stores"]
                        }
                    },
                    noSortOther: {
                        index: "idx2",
                        pk: {
                            field: "partition_key_idx2",
                            composite: ["mall"],
                        }
                    },
                }
            }, {client, table: "electro_nosort"});
            let id = uuid();
            let mall = "defg";
            let stores = 1;
            let value = "ahssfh";
            await MallStores.get({id, mall, stores}).go();
            await MallStores.delete({id, mall, stores}).go();
            await MallStores.update({id, mall, stores}).set({value}).go();
            await MallStores.patch({id, mall, stores}).set({value}).go();
            await MallStores.create({id: id + 1, mall, stores, value}).go();
            await MallStores.put({id, mall, stores, value}).go();
            await MallStores.query.store({id, mall, stores}).go();
            await MallStores.query.other({id, mall, stores}).go();
            await MallStores.query.noSortOther({mall}).go();
            await MallStores.scan.go();
        });
    });
    describe("Delete records", () => {
        it("Should create then delete a record", async () => {
            const table = "electro";
            const record = new Entity({
                model: {
                    service: SERVICE,
                    entity: ENTITY,
                    version: "1",
                },
                attributes: {
                    prop1: {
                        type: "string",
                    },
                    prop2: {
                        type: "string",
                    },
                },
                indexes: {
                    main: {
                        pk: {
                            field: "pk",
                            composite: ["prop1"],
                        },
                        sk: {
                            field: "sk",
                            composite: ["prop2"],
                        },
                    },
                },
            },
            { client, table },
            );
            let prop1 = uuid();
            let prop2 = uuid();
            await record.put({ prop1, prop2 }).go();
            let recordExists = await record.get({ prop1, prop2 }).go().then(res => res.data);
            const result = await record.delete({ prop1, prop2 }).go();
            expect(result.data).to.deep.equal({ prop1, prop2 });
            await sleep(150);
            let recordNoLongerExists = await record.get({ prop1, prop2 }).go().then(res => res.data);
            expect(!!Object.keys(recordExists || {}).length).to.be.true;
            expect(recordNoLongerExists).to.be.null;
        });

        it("Should create then remove a record", async () => {
            const table = "electro";
            const record = new Entity({
                    model: {
                        service: SERVICE,
                        entity: ENTITY,
                        version: "1",
                    },
                    attributes: {
                        prop1: {
                            type: "string",
                        },
                        prop2: {
                            type: "string",
                        },
                    },
                    indexes: {
                        main: {
                            pk: {
                                field: "pk",
                                composite: ["prop1"],
                            },
                            sk: {
                                field: "sk",
                                composite: ["prop2"],
                            },
                        },
                    },
                },
                { client, table },
            );
            let prop1 = uuid();
            let prop2 = uuid();
            await record.put({ prop1, prop2 }).go();
            let recordExists = await record.get({ prop1, prop2 }).go().then(res => res.data);
            const result = await record.remove({ prop1, prop2 }).go();
            expect(result.data).to.deep.equal({ prop1, prop2 });
            await sleep(150);
            let recordNoLongerExists = await record.get({ prop1, prop2 }).go().then(res => res.data);
            expect(!!Object.keys(recordExists || {}).length).to.be.true;
            expect(recordNoLongerExists).to.be.null;
        });

        it("Should throw when trying to remove a record that does not exist", async () => {
            const table = "electro";
            const record = new Entity({
                    model: {
                        service: SERVICE,
                        entity: ENTITY,
                        version: "1",
                    },
                    attributes: {
                        prop1: {
                            type: "string",
                        },
                        prop2: {
                            type: "string",
                        },
                    },
                    indexes: {
                        main: {
                            pk: {
                                field: "pk",
                                composite: ["prop1"],
                            },
                            sk: {
                                field: "sk",
                                composite: ["prop2"],
                            },
                        },
                    },
                },
                { client, table },
            );
            let prop1 = uuid();
            let prop2 = uuid();
            let recordNotExists = await record.get({ prop1, prop2 }).go().then(res => res.data);
            expect(recordNotExists).to.equal(null);
            const result = await record.remove({ prop1, prop2 }).go().then(() => true).catch(() => false);
            expect(result).to.equal(false);
        });
    });

    describe("Getters/Setters", () => {
        let db = new Entity(
            {
                model: {
                    service: SERVICE,
                    entity: uuid(),
                    version: "1"
                },
                attributes: {
                    id: {
                        type: "string",
                        default: () => uuid(),
                    },
                    date: {
                        type: "string",
                        default: () => moment.utc().format(),
                    },
                    prop1: {
                        type: "string",
                        field: "prop1Field",
                        set: (prop1, { id }) => {
                            if (id) {
                                return `${prop1} SET ${id}`;
                            } else {
                                return `${prop1} SET`;
                            }
                        },
                        get: (prop1) => `${prop1} GET`,
                    },
                    prop2: {
                        type: "string",
                        field: "prop2Field",
                        get: (prop2, { id }) => `${prop2} GET ${id}`,
                    },
                },
                indexes: {
                    record: {
                        pk: {
                            field: "pk",
                            composite: ["date"],
                        },
                        sk: {
                            field: "sk",
                            composite: ["id"],
                        },
                    },
                },
            },
            { client, table: "electro" },
        );

        it("Should show getter/setter values on put", async () => {
            let date = moment.utc().format();
            let id = uuid();
            let prop1 = "aaa";
            let prop2 = "bbb";
            let record = await db.put({ date, id, prop1, prop2 }).go().then(res => res.data);
            expect(record).to.deep.equal({
                id,
                date,
                prop1: `${prop1} SET ${id} GET`,
                prop2: `${prop2} GET ${id}`,
            });
            let fetchedRecord = await db.get({ date, id }).go().then(res => res.data);
            expect(fetchedRecord).to.deep.equal({
                id,
                date,
                prop1: `${prop1} SET ${id} GET`,
                prop2: `${prop2} GET ${id}`,
            });
            let updatedProp1 = "ZZZ";
            let updatedRecord = await db
                .update({ date, id })
                .set({ prop1: updatedProp1 })
                .go().then(res => res.data);
            expect(updatedRecord).to.deep.equal({ date, id });
            let getUpdatedRecord = await db.get({ date, id }).go().then(res => res.data);
            expect(getUpdatedRecord).to.deep.equal({
                id,
                date,
                prop1: "ZZZ SET GET",
                prop2: "bbb GET " + id,
            });
        }).timeout(20000);
    });
    describe("Query Options", async () => {
        let entity = uuid();
        let db = new Entity(
            {
                model: {
                    service: SERVICE,
                    entity: entity,
                    version: "1",
                },
                attributes: {
                    id: {
                        type: "string",
                    },
                    date: {
                        type: "string",
                    },
                    someValue: {
                        type: "string",
                        required: true,
                        set: (val) => val + " wham",
                        get: (val) => val + " bam",
                    },
                },
                indexes: {
                    record: {
                        pk: {
                            field: "pk",
                            composite: ["date"],
                        },
                        sk: {
                            field: "sk",
                            composite: ["id"],
                        },
                    },
                },
            },
            { client, table: "electro" },
        );
        it("Should return the originally returned results", async () => {
            let id = uuid();
            let date = moment.utc().format();
            let someValue = "ABDEF";
            let putRecord = await db.put({ id, date, someValue }).go({ raw: true })
                .then( res => res.data );
            expect(putRecord).to.deep.equal({});
            let getRecord = await db.get({ id, date }).go({ raw: true }).then(res => res.data);
            expect(getRecord).to.deep.equal({
                Item: {
                    __edb_e__: entity,
                    __edb_v__: "1",
                    id,
                    date,
                    someValue: someValue + " wham",
                    sk: `$${entity}_1#id_${id}`.toLowerCase(),
                    pk: `$${SERVICE}#date_${date}`.toLowerCase(),
                },
            });
            let updateRecord = await db
                .update({ id, date })
                .set({ someValue })
                .go({ raw: true })
                .then(res => res.data);
            expect(updateRecord).to.deep.equal({});
            let queryRecord = await db.query.record({ id, date }).go({ raw: true })
                .then(res => res.data);
            expect(queryRecord).to.deep.equal({
                Items: [
                    {
                        __edb_e__: entity,
                        __edb_v__: "1",
                        id,
                        date,
                        someValue: someValue + " wham",
                        sk: `$${entity}_1#id_${id}`.toLowerCase(),
                        pk: `$${SERVICE}#date_${date}`.toLowerCase(),
                    },
                ],
                Count: 1,
                ScannedCount: 1,
            });
            let recordWithKeys = await db.get({id, date}).go({includeKeys: true}).then(res => res.data);
            expect(recordWithKeys).to.deep.equal({
                id,
                date,
                someValue: "ABDEF wham bam",
                __edb_e__: entity,
                __edb_v__: "1",
                sk: `$${entity}_1#id_${id}`.toLowerCase(),
                pk: `$${SERVICE}#date_${date}`.toLowerCase(),
            })
        }).timeout(10000);
    });
    describe("Filters", () => {
        it("Should filter results with custom user filter", async () => {
            let store = "LatteLarrys";
            let category = "food/coffee";
            let leaseEnd = "2020-01-20";
            let building = "BuildingA";
            let sector = uuid();
            let malls = [uuid(), uuid()];
            let mall = malls[0];
            let rent = "0";
            let storeNames = [
                "ABC",
                "DEF",
                "GHI",
                "JKL",
                "MNO",
                "PQR",
                "STU",
                "WXY",
                "ZYX",
                "WUT",
            ];

            let stores = [];
            for (let i = 0; i < storeNames.length; i++) {
                let mall = malls[i % 2];
                stores.push(
                    MallStores.put({
                        mall,
                        sector,
                        building,
                        category,
                        leaseEnd,
                        rent: i + rent,
                        store: storeNames[i],
                        unit: `B${i + 1}`,
                    }).go().then(res => res.data),
                );
            }

            stores = await Promise.all(stores);
            let max = "50";
            let filteredStores = stores.filter((store) => {
                let matchesMall = store.mall === mall + "abc";
                let lessThanMaxRent = false;
                if (store.rent !== undefined) {
                    lessThanMaxRent = store.rent <= max;
                }
                return matchesMall && lessThanMaxRent;
            });

            let belowMarketUnits = await MallStores.query
                .units({ mall: mall + "abc", building })
                .where(({rent}, {lte}) => lte(rent, max))
                .go().then(res => res.data);

            expect(belowMarketUnits)
                .to.be.an("array")
                .and.have.length(3)
                .and.deep.equal(filteredStores);

        }).timeout(20000);
        it("Should filter with the correct field name", async () => {
            let db = new Entity(
                {
                    model: {
                        service: SERVICE,
                        entity: uuid(),
                        version: "1",
                    },
                    attributes: {
                        id: {
                            type: "string",
                            default: () => uuid(),
                        },
                        date: {
                            type: "string",
                            default: () => moment.utc().format(),
                        },
                        property: {
                            type: "string",
                            field: "propertyVal",
                        },
                    },
                    indexes: {
                        record: {
                            pk: {
                                field: "pk",
                                composite: ["date"],
                            },
                            sk: {
                                field: "sk",
                                composite: ["id"],
                            },
                        },
                    },
                },
                { client, table: "electro" },
            );
            let date = moment.utc().format();
            let property = "ABDEF";
            let record = await db.put({ date, property }).go().then(res => res.data);
            let found = await db.query
                .record({ date })
                .where((attr, {eq}) => eq(attr.property, property))
                .go().then(res => res.data);

            let foundParams = db.query
                .record({ date })
                .where((attr, {eq}) => eq(attr.property, property))
                .params<any>();

            expect(foundParams.ExpressionAttributeNames["#property"]).to.equal(
                "propertyVal",
            );
            expect(found)
                .to.be.an("array")
                .and.have.length(1)
                .and.to.have.deep.members([record]);
        });
        it("Should allow for multiple filters", async () => {
            let entity = uuid();
            let id = uuid();
            let db = new Entity(
                {
                    model: {
                        service: SERVICE,
                        entity: uuid(),
                        version: "1",
                    },
                    attributes: {
                        id: {
                            type: "string",
                        },
                        property: {
                            type: "string",
                            field: "propertyVal",
                        },
                        color: {
                            type: ["red", "green"],
                        },
                    },
                    indexes: {
                        record: {
                            pk: {
                                field: "pk",
                                composite: ["id"],
                            },
                            sk: {
                                field: "sk",
                                composite: ["property"],
                            },
                        },
                    },
                },
                { client, table },
            );
            let colors = ["red", "green"];
            let properties = ["A", "B", "C", "D", "E", "F"];
            let records = await Promise.all(
                properties.map((property, i) => {
                    let color = colors[i % 2];
                    return db.put({ id, property, color }).go().then(res => res.data);
                }),
            );
            let expectedMembers = records.filter(
                (record) => record.color !== "green" && record.property !== "A",
            );
            // sleep gives time for eventual consistency
            let found = await db.query
                .record({ id })
                .where((attr, op) => op.gt(attr.property, "A"))
                .where(({color, id}, {notContains, contains}) => `
                    ${notContains(color, "green")} OR ${contains(id, "weird_value")}
                `)
                .where((attr, op) => op.notContains(attr.property, "Z"))
                .go().then(res => res.data);

            expect(found)
                .to.be.an("array")
                .and.have.length(expectedMembers.length)
                .and.to.have.deep.members(expectedMembers);
        });
    });
    describe("Updating Records", () => {
        const Dummy = new Entity({
            model: {
                entity: "dummy",
                service: "test",
                version: "1"
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
                },
                prop5: {
                    type: "string"
                },
                prop6: {
                    type: "string"
                },
                prop7: {
                    type: "string"
                },
                prop8: {
                    type: "string"
                },
                prop9: {
                    type: "string"
                },
            },
            indexes: {
                index1: {
                    pk: {
                        field: "pk",
                        composite: ["prop1"]
                    },
                    sk: {
                        field: "sk",
                        composite: ["prop2"]
                    }
                },
                index2: {
                    index: "gsi1pk-gsi1sk-index",
                    pk: {
                        field: "gsi1pk",
                        composite: ["prop3"]
                    },
                    sk: {
                        field: "gsi1sk",
                        composite: ["prop4"]
                    }
                },
                index3: {
                    index: "gsi2pk-gsi2sk-index",
                    pk: {
                        field: "gsi2pk",
                        composite: ["prop5"]
                    },
                    sk: {
                        field: "gsi2sk",
                        composite: ["prop6", "prop7", "prop8"]
                    }
                }
            }
        }, {table: "electro", client});

        it("Should not allow the gsis with partially complete PKs or SKs to be updated", async () => {
            try {
                await Dummy.update({prop1: "abc", prop2: "def"})
                    .set({prop9: "propz9", prop6: "propz6"})
                    .go()
                throw null;
            } catch(err: any) {
                expect(err).to.not.be.null;
                expect(err.message).to.equal('Incomplete composite attributes: Without the composite attributes "prop7", "prop8" the following access patterns cannot be updated: "index3"  - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#incomplete-composite-attributes');
            }
        });

        it("Should not allow the gsis with partially complete PKs or SKs to be patched", async () => {
            try {
                await Dummy.patch({prop1: "abc", prop2: "def"})
                    .set({prop9: "propz9", prop6: "propz6"})
                    .go()
                throw null;
            } catch(err: any) {
                expect(err).to.not.be.null;
                expect(err.message).to.equal(`Incomplete composite attributes: Without the composite attributes "prop7", "prop8" the following access patterns cannot be updated: "index3"  - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#incomplete-composite-attributes`);
            }
        });

        it("Should update only completed GSI pk keys", async () => {
            let prop9 = uuid();
            let prop5 = uuid();
            let record = {
                prop1: uuid(),
                prop2: uuid(),
                prop3: uuid(),
                prop4: uuid(),
                prop5: uuid(),
                prop6: uuid(),
                prop7: uuid(),
                prop8: uuid(),
                prop9: uuid(),
            }
            await Dummy.put(record).go();
            await sleep(100);
            let beforeUpdateQueryParams = Dummy.query.index3({prop5: record.prop5, prop6: record.prop6, prop7: record.prop7, prop8: record.prop8}).params();
            expect(beforeUpdateQueryParams).to.deep.equal({
                KeyConditionExpression: '#pk = :pk and #sk1 = :sk1',
                TableName: 'electro',
                ExpressionAttributeNames: { '#pk': 'gsi2pk', '#sk1': 'gsi2sk',
                    "#prop6": "prop6",
                    "#prop7": "prop7",
                    "#prop8": "prop8",
                },
                ExpressionAttributeValues: {
                    ":prop60": record.prop6,
                    ":prop70": record.prop7,
                    ":prop80": record.prop8,
                    ':pk': `$test#prop5_${record.prop5}`,
                    ':sk1': `$dummy_1#prop6_${record.prop6}#prop7_${record.prop7}#prop8_${record.prop8}`
                },
                "FilterExpression": "(#prop6 = :prop60) AND #prop7 = :prop70 AND #prop8 = :prop80",
                IndexName: 'gsi2pk-gsi2sk-index'
            });
            let beforeUpdate = await Dummy.query.index3({prop5: record.prop5, prop6: record.prop6, prop7: record.prop7, prop8: record.prop8}).go().then(res => res.data);
            expect(beforeUpdate).to.be.an("array").with.lengthOf(1).and.to.deep.equal([record]);
            await Dummy.update({prop1: record.prop1, prop2: record.prop2})
                .set({prop9, prop5})
                .go().then(res => res.data);
            await sleep(100);
            let afterUpdateQueryParams = Dummy.query.index3({prop5, prop6: record.prop6, prop7: record.prop7, prop8: record.prop8}).params();
            expect(afterUpdateQueryParams).to.deep.equal({
                KeyConditionExpression: '#pk = :pk and #sk1 = :sk1',
                TableName: 'electro',
                ExpressionAttributeNames: { '#pk': 'gsi2pk', '#sk1': 'gsi2sk',
                    "#prop6": "prop6",
                    "#prop7": "prop7",
                    "#prop8": "prop8",
                },
                ExpressionAttributeValues: {
                    ":prop60": record.prop6,
                    ":prop70": record.prop7,
                    ":prop80": record.prop8,
                    ':pk': `$test#prop5_${prop5}`,
                    ':sk1': `$dummy_1#prop6_${record.prop6}#prop7_${record.prop7}#prop8_${record.prop8}`,

                },
                "FilterExpression": "(#prop6 = :prop60) AND #prop7 = :prop70 AND #prop8 = :prop80",
                IndexName: 'gsi2pk-gsi2sk-index'
            });
            let afterUpdate = await Dummy.query.index3({prop5, prop6: record.prop6, prop7: record.prop7, prop8: record.prop8}).go().then(res => res.data);
            expect(afterUpdate).to.be.an("array").with.lengthOf(1).and.to.deep.equal([{...record, prop9, prop5}]);
        });

        it("Should patch only completed GSI pk keys", async () => {
            let prop9 = uuid();
            let prop5 = uuid();
            let record = {
                prop1: uuid(),
                prop2: uuid(),
                prop3: uuid(),
                prop4: uuid(),
                prop5: uuid(),
                prop6: uuid(),
                prop7: uuid(),
                prop8: uuid(),
                prop9: uuid(),
            }
            await Dummy.put(record).go();
            await sleep(100);
            let beforeUpdateQueryParams = Dummy.query.index3({prop5: record.prop5, prop6: record.prop6, prop7: record.prop7, prop8: record.prop8}).params();
            expect(beforeUpdateQueryParams).to.deep.equal({
                KeyConditionExpression: '#pk = :pk and #sk1 = :sk1',
                TableName: 'electro',
                ExpressionAttributeNames: { '#pk': 'gsi2pk', '#sk1': 'gsi2sk',
                    "#prop6": "prop6",
                    "#prop7": "prop7",
                    "#prop8": "prop8",
                },
                ExpressionAttributeValues: {
                    ':pk': `$test#prop5_${record.prop5}`,
                    ':sk1': `$dummy_1#prop6_${record.prop6}#prop7_${record.prop7}#prop8_${record.prop8}`,
                    ":prop60": record.prop6,
                    ":prop70": record.prop7,
                    ":prop80": record.prop8,
                },
                FilterExpression: "(#prop6 = :prop60) AND #prop7 = :prop70 AND #prop8 = :prop80",
                IndexName: 'gsi2pk-gsi2sk-index'
            });
            let beforeUpdate = await Dummy.query.index3({prop5: record.prop5, prop6: record.prop6, prop7: record.prop7, prop8: record.prop8}).go().then(res => res.data);
            expect(beforeUpdate).to.be.an("array").with.lengthOf(1).and.to.deep.equal([record]);
            await Dummy.patch({prop1: record.prop1, prop2: record.prop2})
                .set({prop9, prop5})
                .go();
            await sleep(100);
            let afterUpdateQueryParams = Dummy.query.index3({prop5, prop6: record.prop6, prop7: record.prop7, prop8: record.prop8}).params();
            expect(afterUpdateQueryParams).to.deep.equal({
                KeyConditionExpression: '#pk = :pk and #sk1 = :sk1',
                TableName: 'electro',
                ExpressionAttributeNames: { '#pk': 'gsi2pk', '#sk1': 'gsi2sk',
                    "#prop6": "prop6",
                    "#prop7": "prop7",
                    "#prop8": "prop8",
                },
                ExpressionAttributeValues: {
                    ':pk': `$test#prop5_${prop5}`,
                    ':sk1': `$dummy_1#prop6_${record.prop6}#prop7_${record.prop7}#prop8_${record.prop8}`,
                    ":prop60": record.prop6,
                    ":prop70": record.prop7,
                    ":prop80": record.prop8,
                },
                FilterExpression: "(#prop6 = :prop60) AND #prop7 = :prop70 AND #prop8 = :prop80",
                IndexName: 'gsi2pk-gsi2sk-index'
            });
            let afterUpdate = await Dummy.query.index3({prop5, prop6: record.prop6, prop7: record.prop7, prop8: record.prop8}).go().then(res => res.data);
            expect(afterUpdate).to.be.an("array").with.lengthOf(1).and.to.deep.equal([{...record, prop9, prop5}]);
        });

        it("Should update only completed GSI sk keys", async () => {
            let prop9 = uuid();
            let prop4 = uuid();
            let record = {
                prop1: uuid(),
                prop2: uuid(),
                prop3: uuid(),
                prop4: uuid(),
                prop5: uuid(),
                prop6: uuid(),
                prop7: uuid(),
                prop8: uuid(),
                prop9: uuid(),
            }
            await Dummy.put(record).go().then(res => res.data);
            await sleep(100);
            let beforeUpdateQueryParams = Dummy.query.index2({prop3: record.prop3, prop4: record.prop4}).params();
            expect(beforeUpdateQueryParams).to.deep.equal({
                KeyConditionExpression: '#pk = :pk and #sk1 = :sk1',
                TableName: 'electro',
                ExpressionAttributeNames: { '#pk': 'gsi1pk', '#sk1': 'gsi1sk' },
                ExpressionAttributeValues: {
                    ':pk': `$test#prop3_${record.prop3}`,
                    ':sk1': `$dummy_1#prop4_${record.prop4}`
                },
                IndexName: 'gsi1pk-gsi1sk-index'
            });
            let beforeUpdate = await Dummy.query.index2({prop3: record.prop3, prop4: record.prop4}).go().then(res => res.data);
            expect(beforeUpdate).to.be.an("array").with.lengthOf(1).and.to.deep.equal([record]);
            await Dummy.update({prop1: record.prop1, prop2: record.prop2})
                .set({prop9, prop4})
                .go();
            await sleep(100);
            let afterUpdateQueryParams = Dummy.query.index2({prop3: record.prop3, prop4}).params();
            expect(afterUpdateQueryParams).to.deep.equal({
                KeyConditionExpression: '#pk = :pk and #sk1 = :sk1',
                TableName: 'electro',
                ExpressionAttributeNames: { '#pk': 'gsi1pk', '#sk1': 'gsi1sk' },
                ExpressionAttributeValues: {
                    ':pk': `$test#prop3_${record.prop3}`,
                    ':sk1': `$dummy_1#prop4_${prop4}`
                },
                IndexName: 'gsi1pk-gsi1sk-index'
            });
            let afterUpdate = await Dummy.query.index2({prop3: record.prop3, prop4}).go().then(res => res.data);
            expect(afterUpdate).to.be.an("array").with.lengthOf(1).and.to.deep.equal([{...record, prop9, prop4}]);
        });

        it("Should patch only completed GSI sk keys", async () => {
            let prop9 = uuid();
            let prop4 = uuid();
            let record = {
                prop1: uuid(),
                prop2: uuid(),
                prop3: uuid(),
                prop4: uuid(),
                prop5: uuid(),
                prop6: uuid(),
                prop7: uuid(),
                prop8: uuid(),
                prop9: uuid(),
            }
            await Dummy.put(record).go();
            await sleep(100);
            let beforeUpdateQueryParams = Dummy.query.index2({prop3: record.prop3, prop4: record.prop4}).params();
            expect(beforeUpdateQueryParams).to.deep.equal({
                KeyConditionExpression: '#pk = :pk and #sk1 = :sk1',
                TableName: 'electro',
                ExpressionAttributeNames: { '#pk': 'gsi1pk', '#sk1': 'gsi1sk' },
                ExpressionAttributeValues: {
                    ':pk': `$test#prop3_${record.prop3}`,
                    ':sk1': `$dummy_1#prop4_${record.prop4}`
                },
                IndexName: 'gsi1pk-gsi1sk-index'
            });
            let beforeUpdate = await Dummy.query.index2({prop3: record.prop3, prop4: record.prop4}).go().then(res => res.data);
            expect(beforeUpdate).to.be.an("array").with.lengthOf(1).and.to.deep.equal([record]);
            await Dummy.patch({prop1: record.prop1, prop2: record.prop2})
                .set({prop9, prop4})
                .go();
            await sleep(100);
            let afterUpdateQueryParams = Dummy.query.index2({prop3: record.prop3, prop4}).params();
            expect(afterUpdateQueryParams).to.deep.equal({
                KeyConditionExpression: '#pk = :pk and #sk1 = :sk1',
                TableName: 'electro',
                ExpressionAttributeNames: { '#pk': 'gsi1pk', '#sk1': 'gsi1sk' },
                ExpressionAttributeValues: {
                    ':pk': `$test#prop3_${record.prop3}`,
                    ':sk1': `$dummy_1#prop4_${prop4}`
                },
                IndexName: 'gsi1pk-gsi1sk-index'
            });
            let afterUpdate = await Dummy.query.index2({prop3: record.prop3, prop4}).go().then(res => res.data);
            expect(afterUpdate).to.be.an("array").with.lengthOf(1).and.to.deep.equal([{...record, prop9, prop4}]);
        });
    });

    describe("ReturnValues", () => {
        let db = new Entity({
            model: {
                service: SERVICE,
                entity: uuid(),
                version: "1"
            },
            attributes: {
                id: {
                    type: "string",
                },
                sub: {
                    type: "string"
                },
                prop1: {
                    type: "string",
                    field: "prop1Field",
                },
                prop2: {
                    type: "string",
                    field: "prop2Field",
                },
                prop3: {
                    type: "list",
                    items: {
                        type: "map",
                        properties: {
                            prop4: {
                                type: "string"
                            },
                            prop5: {
                                type: "number"
                            }
                        }
                    }
                },
                prop6: {
                    type: "set",
                    items: "string"
                },
            },
            indexes: {
                record: {
                    pk: {
                        field: "pk",
                        composite: ["id"],
                    },
                    sk: {
                        field: "sk",
                        composite: ["sub"],
                    },
                },
            },
        },
        { client, table: "electro" });

        for (const method of ["update", "patch"] as const) {
            it(`should return just the new results when using ${method}`, async () => {
                const id = uuid();
                const sub = uuid();
                const prop1 = "aaa";
                const prop2 = "bbb";
                const prop3 = [
                    {
                        prop4: "abc",
                        prop5: 123
                    },
                    {
                        prop4: "def",
                        prop5: 456
                    }
                ];

                const prop6 = ["wvu", "zyx"];

                await db.put({
                    id,
                    sub,
                    prop1,
                    prop2,
                    prop3,
                    prop6
                }).go().then(res => res.data);

                const updateParams1 = db[method]({id, sub})
                    .add({prop6: ['tsr']})
                    .append({prop3: [{prop4: "ghi", prop5: 789}]})
                    .params<{ ReturnValues: string }>({response: "updated_new"});

                expect(updateParams1.ReturnValues).to.equal("UPDATED_NEW");

                const update1 = await db[method]({id, sub})
                    .add({prop6: ['tsr']})
                    .append({prop3: [{prop4: "ghi", prop5: 789}]})
                    .go({response: "updated_new"}).then(res => res.data);

                expect(update1).to.deep.equal({
                    id,
                    sub,
                    prop6: ['tsr', 'wvu', 'zyx'],
                    prop3: [
                        {prop4: 'abc', prop5: 123},
                        {prop4: 'def', prop5: 456},
                        {prop4: 'ghi', prop5: 789}
                    ],
                });
            });

            it(`should return all updated results when using ${method}`, async () => {
                const sub = uuid();
                const id = uuid();
                const prop1 = "aaa";
                const prop2 = "bbb";
                const prop3 = [
                    {
                        prop4: "abc",
                        prop5: 123
                    },
                    {
                        prop4: "def",
                        prop5: 456
                    }
                ];

                const prop6 = ["wvu", "zyx"];

                await db.put({
                    id,
                    sub,
                    prop1,
                    prop2,
                    prop3,
                    prop6
                }).go().then(res => res.data);

                const updateParams1 = db[method]({id, sub})
                    .add({prop6: ['tsr']})
                    .append({prop3: [{prop4: "ghi", prop5: 789}]})
                    .params<{ ReturnValues: string }>({response: "all_new"});

                expect(updateParams1.ReturnValues).to.equal("ALL_NEW");

                const update1 = await db[method]({id, sub})
                    .add({prop6: ['tsr']})
                    .append({prop3: [{prop4: "ghi", prop5: 789}]})
                    .go({response: "all_new"}).then(res => res.data);

                expect(update1).to.deep.equal({
                    id,
                    sub,
                    prop1,
                    prop2,
                    prop6: ['tsr', 'wvu', 'zyx'],
                    prop3: [
                        {prop4: 'abc', prop5: 123},
                        {prop4: 'def', prop5: 456},
                        {prop4: 'ghi', prop5: 789}
                    ]
                });
            });

            it(`should return all old values when using ${method}`, async () => {
                const sub = uuid();
                const id = uuid();
                const prop1 = "aaa";
                const prop2 = "bbb";
                const prop3 = [
                    {
                        prop4: "abc",
                        prop5: 123
                    },
                    {
                        prop4: "def",
                        prop5: 456
                    }
                ];

                const prop6 = ["wvu", "zyx"];

                const initialData = await db.put({
                    id,
                    sub,
                    prop1,
                    prop2,
                    prop3,
                    prop6
                }).go().then(res => res.data);

                const updateParams1 = db[method]({id, sub})
                    .add({prop6: ['tsr']})
                    .append({prop3: [{prop4: "ghi", prop5: 789}]})
                    .params<{ ReturnValues: string }>({response: "all_old"});

                expect(updateParams1.ReturnValues).to.equal("ALL_OLD");

                const update1 = await db[method]({id, sub})
                    .add({prop6: ['tsr']})
                    .append({prop3: [{prop4: "ghi", prop5: 789}]})
                    .go({response: "all_old"}).then(res => res.data);

                expect(update1).to.deep.equal(initialData);
            });

            it(`should return updated old values when using ${method}`, async () => {
                const sub = uuid();
                const id = uuid();
                const prop1 = "aaa";
                const prop2 = "bbb";
                const prop3 = [
                    {
                        prop4: "abc",
                        prop5: 123
                    },
                    {
                        prop4: "def",
                        prop5: 456
                    }
                ];

                const prop6 = ["wvu", "zyx"];

                await db.put({
                    id,
                    sub,
                    prop1,
                    prop2,
                    prop3,
                    prop6
                }).go();

                const updateParams1 = db[method]({id, sub})
                    .add({prop6: ['tsr']})
                    .append({prop3: [{prop4: "ghi", prop5: 789}]})
                    .params<{ ReturnValues: string }>({response: "updated_old"});

                expect(updateParams1.ReturnValues).to.equal("UPDATED_OLD");

                const update1 = await db[method]({id, sub})
                    .add({prop6: ['tsr']})
                    .append({prop3: [{prop4: "ghi", prop5: 789}]})
                    .go({response: "updated_old"}).then(res => res.data);

                expect(update1).to.deep.equal({prop3, prop6, id, sub});
            });

            it(`should return null when using ${method}`, async () => {
                const sub = uuid();
                const id = uuid();
                const prop1 = "aaa";
                const prop2 = "bbb";
                const prop3 = [
                    {
                        prop4: "abc",
                        prop5: 123
                    },
                    {
                        prop4: "def",
                        prop5: 456
                    }
                ];

                const prop6 = ["wvu", "zyx"];

                const initial = await db.put({
                    id,
                    sub,
                    prop1,
                    prop2,
                    prop3,
                    prop6
                }).go().then(res => res.data);

                const updateParams1 = db[method]({id, sub})
                    .add({prop6: ['tsr']})
                    .append({prop3: [{prop4: "ghi", prop5: 789}]})
                    .params<{ ReturnValues: string }>({response: "none"});

                expect(updateParams1.ReturnValues).to.equal("NONE");

                const update1 = await db[method]({id, sub})
                    .add({prop6: ['tsr']})
                    .append({prop3: [{prop4: "ghi", prop5: 789}]})
                    .go({response: "none"}).then(res => res.data);

                expect(update1).to.be.null;
            })
        }
        for (const method of ["delete", "remove"] as const) {
            it(`should return all old values when using ${method}`, async () => {
                const sub = uuid();
                const id = uuid();
                const prop1 = "aaa";
                const prop2 = "bbb";
                const prop3 = [
                    {
                        prop4: "abc",
                        prop5: 123
                    },
                    {
                        prop4: "def",
                        prop5: 456
                    }
                ];

                const prop6 = ["wvu", "zyx"];

                const initial = await db.put({
                    id,
                    sub,
                    prop1,
                    prop2,
                    prop3,
                    prop6
                }).go().then(res => res.data);

                const deleteParams1: any = db[method]({id, sub}).params({response: "all_old"});

                expect(deleteParams1.ReturnValues).to.equal("ALL_OLD");

                const delete1 = await db[method]({id, sub})
                    .go({response: "all_old"}).then(res => res.data);

                expect(delete1).to.deep.equal(initial);
            });


            it(`should return null when using ${method}`, async () => {
                const sub = uuid();
                const id = uuid();
                const prop1 = "aaa";
                const prop2 = "bbb";
                const prop3 = [
                    {
                        prop4: "abc",
                        prop5: 123
                    },
                    {
                        prop4: "def",
                        prop5: 456
                    }
                ];

                const prop6 = ["wvu", "zyx"];

                const initial = await db.put({
                    id,
                    sub,
                    prop1,
                    prop2,
                    prop3,
                    prop6
                }).go().then(res => res.data);

                const deleteParams1: any = db[method]({id, sub}).params({response: "none"});

                expect(deleteParams1.ReturnValues).to.equal("NONE");

                const delete1 = await db[method]({id, sub})
                    .go({response: "none"}).then(res => res.data);

                expect(delete1).to.be.null;
            });
        }

        for (const method of ["put", "create"] as const) {
            it(`should return all old values when using ${method}`, async () => {
                const sub = uuid();
                const id = uuid();
                const prop1 = "aaa";
                const prop2 = "bbb";
                const prop3 = [
                    {
                        prop4: "abc",
                        prop5: 123
                    },
                    {
                        prop4: "def",
                        prop5: 456
                    }
                ];

                const prop6 = ["wvu", "zyx"];

                const result = await db[method]({
                    id,
                    sub,
                    prop1,
                    prop2,
                    prop3,
                    prop6
                }).go({response: "none"}).then(res => res?.data);

                expect(result).to.be.null;
            })
        }
    });
    describe("Item parsing", () => {
        const entity = new Entity({
            model: {
                entity: "parse_test",
                service: "testing",
                version: "1"
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
                    type: "map",
                    properties: {
                        nested: {
                            type: "map",
                            properties: {
                                prop5: {
                                    type: "string"
                                },
                                prop6: {
                                    type: "string"
                                }
                            }
                        }
                    }
                }
            },
            indexes: {
                record: {
                    pk: {
                        field: "pk",
                        composite: ["prop1"],
                    },
                    sk: {
                        field: "sk",
                        composite: ["prop2"],
                    },
                },
            }
        }, {table, client});
        it("should parse the response from an item", async () => {
            const prop1 = uuid();
            const prop2 = uuid();
            const prop3 = uuid();
            await client.put({
                Item: {
                    prop1: prop1,
                    prop2: prop2,
                    prop3: prop3,
                    pk: `$testing#prop1_${prop1}`,
                    sk: `$parse_test_1#prop2_${prop2}`,
                },
                TableName: 'electro'
            }).promise();

            const params = {
                Key: {
                    pk: `$testing#prop1_${prop1}`,
                    sk: `$parse_test_1#prop2_${prop2}`
                },
                TableName: 'electro'
            };

            const itemFromDocClient = await client.get(params).promise();
            const parsed = entity.parse(itemFromDocClient);
            expect(parsed.data).to.deep.equal({prop1, prop2, prop3});
            const parsedTrimmed = entity.parse(itemFromDocClient, {attributes: ['prop1', 'prop3']});
            expect(parsedTrimmed.data).to.deep.equal({prop1, prop3});
        });

        it("should parse the response from an query that lacks identifiers", async () => {
            const prop1 = uuid();
            const prop2 = uuid();
            const prop3 = uuid();
            await client.put({
                Item: {
                    prop1: prop1,
                    prop2: prop2,
                    prop3: prop3,
                    pk: `$testing#prop1_${prop1}`,
                    sk: `$parse_test_1#prop2_${prop2}`,
                },
                TableName: 'electro'
            }).promise();
            const params = {
                KeyConditionExpression: '#pk = :pk and #sk1 = :sk1',
                TableName: 'electro',
                ExpressionAttributeNames: { '#pk': 'pk', '#sk1': 'sk' },
                ExpressionAttributeValues: {
                    ':pk': `$testing#prop1_${prop1}`,
                    ':sk1': `$parse_test_1#prop2_${prop2}`
                }
            }
            const itemFromDocClient = await client.query(params).promise();
            const parsed = entity.parse(itemFromDocClient);
            expect(parsed.data).to.deep.equal([{prop1, prop2, prop3}]);
            const parseTrimmed = entity.parse(itemFromDocClient, {attributes: ['prop1', 'prop3']});
            expect(parseTrimmed.data).to.deep.equal([{prop1, prop3}]);
        });

        it("should parse the response from an update", async () => {
            const prop1 = uuid();
            const prop2 = uuid();
            const prop3 = uuid();
            const prop3b = uuid();
            await client.put({
                Item: {
                    prop1: prop1,
                    prop2: prop2,
                    prop3: prop3,
                    pk: `$testing#prop1_${prop1}`,
                    sk: `$parse_test_1#prop2_${prop2}`,
                },
                TableName: 'electro'
            }).promise();
            const params = {
                UpdateExpression: 'SET #prop3 = :prop3',
                ExpressionAttributeNames: { '#prop3': 'prop3' },
                ExpressionAttributeValues: { ':prop3': prop3b },
                TableName: 'electro',
                Key: {
                    pk: `$testing#prop1_${prop1}`,
                    sk: `$parse_test_1#prop2_${prop2}`
                },
                ReturnValues: 'UPDATED_NEW'
            }
            const results = await client.update(params).promise();
            const parsed = entity.parse(results);
            expect(parsed.data).to.deep.equal({prop3: prop3b});
            const parseTrimmed = entity.parse(results, {attributes: ['prop3']});
            expect(parseTrimmed.data).to.deep.equal({prop3: prop3b});
        });

        it("should parse the response from a complex update", async () => {
            const prop1 = uuid();
            const prop2 = uuid();
            const prop3 = uuid();
            await client.put({
                "Item": {
                    "prop1": prop1,
                    "prop2": prop2,
                    "prop3": prop3,
                    "prop4": {
                        "nested": {
                            "prop5": "def"
                        }
                    },
                    "pk": `$testing#prop1_${prop1}`,
                    "sk": `$parse_test_1#prop2_${prop2}`,
                },
                "TableName": "electro"
            }).promise();

            const params = {
                "UpdateExpression": "REMOVE #prop4.#nested.#prop5",
                "ExpressionAttributeNames": {
                    "#prop4": "prop4",
                    "#nested": "nested",
                    "#prop5": "prop5"
                },
                "TableName": "electro",
                "Key": {
                    "pk": `$testing#prop1_${prop1}`,
                    "sk": `$parse_test_1#prop2_${prop2}`
                },
                "ReturnValues": "UPDATED_NEW"
            }

            const results1 = await client.update(params).promise();
            const parsed1 = entity.parse(results1);
            expect(parsed1.data).to.be.null;
            const params2 = {
                UpdateExpression: 'SET #prop4.#nested.#prop6 = :prop6_u0',
                ExpressionAttributeNames: { '#prop4': 'prop4', '#nested': 'nested', '#prop6': 'prop6' },
                ExpressionAttributeValues: { ':prop6_u0': 'xyz' },
                TableName: 'electro',
                Key: {
                    pk: `$testing#prop1_${prop1}`,
                    sk: `$parse_test_1#prop2_${prop2}`
                },
                ReturnValues: 'UPDATED_NEW'
            }

            const results2 = await client.update(params2).promise();
            const parsed2 = entity.parse(results2);
            expect(parsed2.data).to.deep.equal({
                prop4: {
                    nested: {
                        prop6: 'xyz'
                    }
                }
            });
        });

        it("should parse the response from a delete", async () => {
            const prop1 = uuid();
            const prop2 = uuid();
            const prop3 = uuid();
            await client.put({
                Item: {
                    prop1: prop1,
                    prop2: prop2,
                    prop3: prop3,
                    pk: `$testing#prop1_${prop1}`,
                    sk: `$parse_test_1#prop2_${prop2}`,
                },
                TableName: 'electro'
            }).promise();
            const params = {
                Key: {
                    pk: `$testing#prop1_${prop1}`,
                    sk: `$parse_test_1#prop2_${prop2}`
                },
                TableName: 'electro',
                ReturnValues: 'ALL_OLD'
            };
            const results = await client.delete(params).promise();
            const parsed = entity.parse(results);
            expect(parsed.data).to.deep.equal({prop1, prop2, prop3});
            const parseTrimmed = entity.parse(results, {attributes: ['prop1', 'prop3']});
            expect(parseTrimmed.data).to.deep.equal({prop1, prop3});
        });

        it("should parse the response from a put", async () => {
            const prop1a = uuid();
            const prop2a = uuid();
            const prop3a = uuid();
            const prop1b = uuid();
            const prop2b = uuid();
            const prop3b = uuid();
            await client.put({
                Item: {
                    prop1: prop1a,
                    prop2: prop2a,
                    prop3: prop3a,
                    pk: `$testing#prop1_${prop1a}`,
                    sk: `$parse_test_1#prop2_${prop2a}`,
                },
                TableName: 'electro'
            }).promise();
            const params = {
                Item: {
                    prop1: prop1b,
                    prop2: prop2b,
                    prop3: prop3b,
                    pk: `$testing#prop1_${prop1a}`,
                    sk: `$parse_test_1#prop2_${prop2a}`,
                },
                TableName: 'electro',
                ReturnValues: 'ALL_OLD'
            };
            const results = await client.put(params).promise();
            const parsed = entity.parse(results);
            expect(parsed.data).to.deep.equal({
                prop1: prop1a,
                prop2: prop2a,
                prop3: prop3a,
            });
            const parseTrimmed = entity.parse(results, {attributes: ['prop1', 'prop3']});
            expect(parseTrimmed.data).to.deep.equal({
                prop1: prop1a,
                prop3: prop3a,
            });
        });

        it("should parse the response from a scan", async () => {
            const prop1 = uuid();
            const prop2 = uuid();
            const prop3 = uuid();
            const scanResponse = {
                "Items": [
                    {
                        "prop2": prop2,
                        "sk": `$parse_test_1#prop2_${prop2}`,
                        "prop1": prop1,
                        "pk": `$testing#prop1_${prop1}`,
                        "prop3": prop3
                    }
                ],
                "Count": 1,
                "ScannedCount": 1
            };
            const parsed = entity.parse(scanResponse);
            expect(parsed.data).to.deep.equal([{prop1, prop2, prop3}]);
            const parseTrimmed = entity.parse(scanResponse, {attributes: ['prop1', 'prop3']});
            expect(parseTrimmed.data).to.deep.equal([{prop1, prop3}]);
        }).timeout(10000);
    });
    describe("Key fields that match Attribute fields", () => {
        const table = "electro_keynamesattributenames";
        it("attribute keys can have prefixes and postfixes when defined with a prefix and postfix", async () => {
            const entity = new Entity({
                model: {
                    entity: "accounts",
                    service: "registry",
                    version: "1"
                },
                attributes: {
                    accountId: {
                        type: "string"
                    },
                    organizationId: {
                        type: "string"
                    },
                    name: {
                        type: "string"
                    },
                    type: {
                        type: ["FREE", "PAID", "PLATINUM"] as const
                    },
                    createdAt: {
                        type: "string",
                        default: () => moment().format("YYYY-MM-DD")
                    },
                    projectId: {
                        type: "string"
                    },
                    incrementId: {
                        type: "number",
                        watch: "*",
                        default: 0
                    }
                },
                indexes: {
                    organization: {
                        pk: {
                            field: "organizationId",
                            // field: "pk",
                            composite: ["organizationId"],
                            template: "Prefix_${organizationId}_postfiX",
                            // template: "${organizationId}",
                            casing: "none",
                        },
                        sk: {
                            field: "accountId",
                            // field: "sk",
                            casing: "upper",
                            template: "Prefix_${accountId}_postfiX",
                            // template: "${accountId}",
                            composite: ["accountId"]
                        }
                    },
                    onboarded: {
                        index: "idx1",
                        pk: {
                            field: "type",
                            composite: ["type"],
                            template: "TYPE$$${type}$$type"
                        },
                        sk: {
                            field: "createdAt",
                            template: "pre#${createdAt}#post",
                            composite: ["createdAt"]
                        },
                    },
                    project: {
                        index: "idx2",
                        pk: {
                            field: "projectId",
                            composite: ["projectId"]
                        },
                        sk: {
                            field: "incrementId",
                            composite: ["incrementId"],
                            casing: "upper",
                        }
                    }
                }
            }, {table, client});
            const oldRecord = {
                accountId: uuid() ,
                organizationId: uuid() + "UpPeR_LoWeR",
                createdAt: "1989-07-01",
                type: "FREE" as const,
                projectId: uuid(),
            }
            const newRecord = {
                type: "FREE" as const,
                accountId: uuid(),
                organizationId: uuid() + "UpPeR_LoWeR",
                createdAt: "2021-07-01",
                projectId: uuid(),
            };
            const createdAt = "2022-07-01";
            const oldPutParameters = entity.put(oldRecord).params();
            expect(oldPutParameters).to.deep.equal({
                Item: {
                    accountId: `PREFIX_${oldRecord.accountId.toUpperCase()}_POSTFIX`,
                    organizationId: `Prefix_${oldRecord.organizationId}_postfiX`,
                    type: `type$$${oldRecord.type.toLowerCase()}$$type`,
                    createdAt: `pre#${oldRecord.createdAt}#post`,
                    incrementId: 0,
                    projectId: oldRecord.projectId,
                    __edb_e__: 'accounts',
                    __edb_v__: '1'
                },
                TableName: 'electro_keynamesattributenames'
            });
            const oldPut = await entity.put(oldRecord).go().then(res => res.data);
            expect(oldPut).to.deep.equal({
                accountId: oldRecord.accountId.toUpperCase(),
                organizationId: oldRecord.organizationId,
                type: oldRecord.type.toLowerCase(),
                createdAt: oldRecord.createdAt,
                incrementId: 0,
                projectId: oldRecord.projectId,
            });
            const newPutParameters = entity.put(newRecord).params();
            expect(newPutParameters).to.deep.equal({
                Item: {
                    accountId: `PREFIX_${newRecord.accountId.toUpperCase()}_POSTFIX`,
                    organizationId: `Prefix_${newRecord.organizationId}_postfiX`,
                    type: `type$$${newRecord.type.toLowerCase()}$$type`,
                    createdAt: `pre#${newRecord.createdAt}#post`,
                    incrementId: 0,
                    projectId: newRecord.projectId,
                    __edb_e__: 'accounts',
                    __edb_v__: '1'
                },
                TableName: 'electro_keynamesattributenames'
            });
            const newPut = await entity.put(newRecord).go().then(res => res.data);
            expect(newPut).to.deep.equal({
                accountId: newRecord.accountId.toUpperCase(),
                organizationId: newRecord.organizationId,
                type: newRecord.type.toLowerCase(),
                createdAt: newRecord.createdAt,
                incrementId: 0,
                projectId: newRecord.projectId,
            });

            const newUpdateParameters = entity.update(newRecord)
                .set({createdAt})
                .add({incrementId: 1})
                .params();
            expect(newUpdateParameters).to.deep.equal({
                "UpdateExpression": "SET #createdAt = :createdAt_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0 ADD #incrementId :incrementId_u0",
                ExpressionAttributeNames: { '#createdAt': 'createdAt', '#incrementId': 'incrementId', "#__edb_e__": "__edb_e__", "#__edb_v__": "__edb_v__" },
                ExpressionAttributeValues: { ':createdAt_u0': `pre#${createdAt}#post`, ':incrementId_u0': 1, ":__edb_e___u0": "accounts", ":__edb_v___u0": "1" },
                TableName: 'electro_keynamesattributenames',
                Key: {
                    accountId: `PREFIX_${newRecord.accountId.toUpperCase()}_POSTFIX`,
                    organizationId: `Prefix_${newRecord.organizationId}_postfiX`,
                }
            });

            const newUpdate = await entity.update(newRecord)
                .set({createdAt})
                .add({incrementId: 1})
                .go({response: "all_new"}).then(res => res.data);

            expect(newUpdate).to.deep.equal({
                accountId: newRecord.accountId.toUpperCase(),
                organizationId: newRecord.organizationId,
                type: newRecord.type.toLowerCase(),
                createdAt: createdAt,
                incrementId: 1,
                projectId: newRecord.projectId,
            });

            const newGetParameters = entity.get(newRecord).params();
            expect(newGetParameters).to.deep.equal({
                Key: {
                    accountId: `PREFIX_${newRecord.accountId.toUpperCase()}_POSTFIX`,
                    organizationId: `Prefix_${newRecord.organizationId}_postfiX`,
                },
                TableName: 'electro_keynamesattributenames'
            });
            const newGet = await entity.get(newRecord).go().then(res => res.data);
            expect(newGet).to.deep.equal({
                accountId: newRecord.accountId.toUpperCase(),
                organizationId: newRecord.organizationId,
                type: newRecord.type.toLowerCase(),
                createdAt: createdAt,
                incrementId: 1,
                projectId: newRecord.projectId,
            });
            const query1Parameters = entity.query.organization(newRecord).params();
            expect(query1Parameters).to.deep.equal({
                KeyConditionExpression: '#pk = :pk and #sk1 = :sk1',
                TableName: 'electro_keynamesattributenames',
                ExpressionAttributeNames: { '#pk': 'organizationId', '#sk1': 'accountId' },
                ExpressionAttributeValues: {
                    ':pk': `Prefix_${newRecord.organizationId}_postfiX`,
                    ':sk1': `PREFIX_${newRecord.accountId.toUpperCase()}_POSTFIX`,
                }
            });
            const query1 = await entity.query.organization(newRecord).go().then(res => res.data);
            expect(query1).to.deep.equal([newUpdate]);
            const query2Parameters = entity.query
                .onboarded({type: newRecord.type})
                .where(({accountId}, {eq}) => eq(accountId, newRecord.accountId))
                .params();

            expect(query2Parameters).to.deep.equal({
                KeyConditionExpression: '#pk = :pk and begins_with(#sk1, :sk1)',
                TableName: 'electro_keynamesattributenames',
                ExpressionAttributeNames: { '#pk': 'type', '#sk1': 'createdAt', '#accountId': 'accountId', },
                ExpressionAttributeValues: {
                    ':pk': `type$$${newRecord.type.toLowerCase()}$$type`,
                    ':sk1': `pre#`,
                    ':accountId0': `Prefix_${newRecord.accountId}_postfiX`.toUpperCase()
                },
                FilterExpression: '#accountId = :accountId0',
                IndexName: 'idx1'
            });

            const query2 = await entity.query
                .onboarded({type: newRecord.type})
                .where(({accountId}, {eq}) => eq(accountId, newRecord.accountId.toUpperCase()))
                .go().then(res => res.data);

            expect(query2).to.deep.equal([{...newUpdate, incrementId: 1}]);

            // const newPaginate = await entity.query
            //     .onboarded({type: newRecord.type})
            //     .where(({accountId}, {eq}) => eq(accountId, newRecord.accountId.toUpperCase()))
            //     .page(oldRecord);
            //
            // expect(newPaginate).to.deep.equal([null, [{...newUpdate, incrementId: 1}]]);
        });
        it("Should throw when trying to add a collection to an attribute field index", () => {
            expect(() => {
                new Entity({
                    model: {
                        entity: "accounts",
                        service: "registry",
                        version: "1"
                    },
                    attributes: {
                        accountId: {
                            type: "string"
                        },
                        organizationId: {
                            type: "string"
                        },
                        name: {
                            type: "string"
                        },
                        type: {
                            type: ["FREE", "PAID", "PLATINUM"] as const
                        },
                        createdAt: {
                            type: "string",
                            default: () => moment().format("YYYY-MM-DD")
                        },
                        projectId: {
                            type: "string"
                        },
                        incrementId: {
                            type: "number",
                            watch: "*",
                            default: 0
                        }
                    },
                    indexes: {
                        organization: {
                            collection: "my_collection",
                            pk: {
                                field: "organizationId",
                                composite: ["organizationId"],
                                casing: "none",
                            },
                            sk: {
                                field: "accountId",
                                casing: "upper",
                                composite: ["accountId"]
                            }
                        },
                    }
                })
            }).to.throw('Invalid use of a collection on index "(Primary Index)". The sk field "accountId" shares a field name with an attribute defined on the Entity, and therefore the index is not allowed to participate in a Collection. Please either change the field name of the attribute, or remove all collection(s) from the index. - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#invalid-collection-on-index-with-attribute-field-names');
        });
        it("Should throw when trying to add a prefix or postfix to a number attribute being used as an index field", () => {
            expect(() => {
                new Entity({
                    model: {
                        entity: "accounts",
                        service: "registry",
                        version: "1"
                    },
                    attributes: {
                        accountId: {
                            type: "string"
                        },
                        organizationId: {
                            type: "string"
                        },
                        name: {
                            type: "string"
                        },
                        type: {
                            type: ["FREE", "PAID", "PLATINUM"] as const
                        },
                        createdAt: {
                            type: "string",
                            default: () => moment().format("YYYY-MM-DD")
                        },
                        projectId: {
                            type: "string"
                        },
                        incrementId: {
                            type: "number",
                            watch: "*",
                            default: 0
                        }
                    },
                    indexes: {
                        organization: {
                            pk: {
                                field: "accountId",
                                composite: ["accountId"],
                                casing: "none",
                            },
                            sk: {
                                field: "incrementId",
                                casing: "upper",
                                composite: ["incrementId"],
                                template: "prefix_${incrementId}_postfix"
                            }
                        },
                    }
                })
            }).to.throw('definition for "sk" field on index "(Primary Index)". Index templates may only have prefix or postfix values on "string" or "enum" type attributes. The sk field "incrementId" is type "number", and therefore cannot be used with prefixes or postfixes. Please either remove the prefixed or postfixed values from the template or change the field name of the attribute. - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#invalid-index-with-attribute-name');
        });
    });
});

function shuffle<T>(array: T[]) {
    let currentIndex = array.length;
    let randomIndex: number;

    // While there remain elements to shuffle.
    while (currentIndex != 0) {

      // Pick a remaining element.
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;

      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }

    return array;
}

describe('pagination order', () => {
    it('should return batchGet results in the order their keys were provided regardless of the order returned by DynamoDB', async () => {
        const mockClient = {
            get: () => {},
            put: () => {},
            update: () => {},
            delete: () => {},
            scan: () => {},
            query: () => {},
            createSet: () => {},
            transactWrite: () => {},
            transactGet: () => {},
            batchWrite: (params: any) => {
                return client.batchWrite(params);
            },
            batchGet: (params: any) => {
                return {
                    promise: async (): Promise<any> => {
                        const results = await client.batchGet(params).promise();
                        const items = results.Responses?.[table] ?? [];
                        const before = [...items];
                        const shuffled = shuffle(items);
                        const after = [...shuffled];
                        const outOfOrderItem = after.find((item, i) => {
                            return item.pk !== before[i].pk &&
                                item.sk !== before[i].sk;
                        });
                        expect(outOfOrderItem).to.not.be.undefined;
                        results.Responses = {[table]: shuffled};
                        return results;
                    }
                }
            }
        } as unknown as DynamoDB.DocumentClient;

        const entity = new Entity({
            model: {
                entity: "entity",
                service: "service",
                version: "1"
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
            },
            indexes: {
                record: {
                    pk: {
                      field: "pk",
                        composite: ["prop1"],
                    },
                    sk: {
                        field: "sk",
                        composite: ["prop2"]
                    }
                },
            }
        }, {table, client: mockClient});

        const count = 250;
        const batch: Array<any> = [];
        for (let i = 0; i < count; i++) {
            const prop1 = uuid();
            const prop2 = uuid();
            const prop3 = uuid();
            batch.push({prop1, prop2, prop3});
        }

        await entity.put(batch).go().then(res => res.unprocessed);

        const unOrderedRecords = await entity.get(batch).go()
            .then(res => res.unprocessed);
        expect(batch[0]).to.not.deep.equal(unOrderedRecords[0]);
        
        const res = await entity.get(batch).go({preserveBatchOrder: true});
        const orderedRecords = res.data;
        const orderedUnprocessed = res.unprocessed;
        expect(orderedUnprocessed).to.be.an("array").with.length(0);
        expect(orderedRecords).to.be.an("array").with.length(batch.length);
        for (let i = 0; i < orderedRecords.length; i++) {
            const fromDb = orderedRecords[i];
            const fromBatch = batch[i];
            expect(fromDb).to.deep.equal(fromBatch);
        }
    });


    it('should return batchGet results in the order their keys were provided with null values in the place of unprocessed keys', async () => {
        const countToMakeUnprocessed = 10;
        const mockClient = {
            get: () => {
            },
            put: () => {
            },
            update: () => {
            },
            delete: () => {
            },
            scan: () => {
            },
            query: () => {
            },
            createSet: () => {
            },
            transactWrite: () => {
            },
            transactGet: () => {
            },
            batchWrite: (params: any) => {
                return client.batchWrite(params);
            },
            batchGet: (params: any) => {
                return {
                    promise: async (): Promise<any> => {
                        const results = await client.batchGet(params).promise();
                        const items = results.Responses?.[table] ?? [];
                        const before = [...items];
                        const shuffled = shuffle(items);
                        const after = [...shuffled];
                        const outOfOrderItem = after.find((item, i) => {
                            return item.pk !== before[i].pk &&
                                item.sk !== before[i].sk;
                        });
                        expect(outOfOrderItem).to.not.be.undefined;
                        for (let i = 0; i < countToMakeUnprocessed; i++) {
                            const record = shuffled.pop();
                            results.UnprocessedKeys = results.UnprocessedKeys ?? {};
                            results.UnprocessedKeys[table] = results.UnprocessedKeys?.[table] ?? {
                                Keys: []
                            }
                            if (record) {
                                results.UnprocessedKeys[table].Keys.push(record);
                            }
                        }
                        results.Responses = {[table]: shuffled};
                        return results;
                    }
                }
            }
        } as unknown as DynamoDB.DocumentClient;

        const entity = new Entity({
            model: {
                entity: "entity",
                service: "service",
                version: "1"
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
            },
            indexes: {
                record: {
                    pk: {
                        field: "pk",
                        composite: ["prop1"],
                    },
                    sk: {
                        field: "sk",
                        composite: ["prop2"]
                    }
                },
            }
        }, {table, client: mockClient});

        const batchCount = 250;
        const batch: Array<any> = [];
        for (let i = 0; i < batchCount; i++) {
            const prop1 = uuid();
            const prop2 = uuid();
            const prop3 = uuid();
            batch.push({prop1, prop2, prop3});
        }

        await entity.put(batch).go();
        // countToMakeUnprocessed is for each batch, batchGet is limited to 100 items, 3 batches
        const totalUnprocessed = Math.round(batchCount / 100) * countToMakeUnprocessed;
        const [unOrderedRecords, unOrderedUnprocessed] = await entity.get(batch)
            .go()
            .then(res => [res.data, res.unprocessed] as const);

        expect(batch[0]).to.not.deep.equal(unOrderedRecords[0]);
        expect(unOrderedRecords).to.be.an("array").with.length(batch.length - totalUnprocessed);
        expect(unOrderedUnprocessed).to.be.an("array").with.length(totalUnprocessed);
        // todo: internals now need to care about .data
        const [orderedRecords, orderedUnprocessed] = await entity.get(batch).go({preserveBatchOrder: true, })
            .then(res => [res.data, res.unprocessed] as const);
        expect(orderedUnprocessed).to.be.an("array").with.length(totalUnprocessed);
        expect(orderedRecords).to.be.an("array").with.length(batch.length);
        for (let i = 0; i < orderedRecords.length; i++) {
            const fromDb = orderedRecords[i];
            const fromBatch = batch[i];
            if (fromDb === null) {
                const fromOrderedUnprocessed = orderedUnprocessed.find(unprocessed => {
                    return unprocessed.prop1 === fromBatch.prop1 && unprocessed.prop2 === fromBatch.prop2;
                });
                expect(fromOrderedUnprocessed).to.not.be.undefined;
            } else {
                expect(fromDb).to.deep.equal(fromBatch);
            }
        }
    });
});

describe('attributes query option', () => {
    const entityWithSK = new Entity({
        model: {
            entity: "abc",
            service: "myservice",
            version: "myversion"
        },
        attributes: {
            attr1: {
                type: "string",
                default: "abc",
            },
            attr2: {
                type: "string",
            },
            attr3: {
                type: ["123", "def", "ghi"] as const,
                default: "def"
            },
            attr4: {
                type: ["abc", "ghi"] as const,
                required: true
            },
            attr5: {
                type: "string"
            },
            attr6: {
                type: "number",
            },
            attr7: {
                type: "any",
            },
            attr8: {
                type: "boolean",
                required: true,
            },
            attr9: {
                type: "number",
                field: 'prop9',
            },
            attr10: {
                type: "boolean"
            }
        },
        indexes: {
            myIndex: {
                collection: "mycollection2",
                pk: {
                    field: "pk",
                    composite: ["attr1"]
                },
                sk: {
                    field: "sk",
                    composite: ["attr2"]
                }
            },
            myIndex2: {
                collection: "mycollection1",
                index: "gsi1pk-gsi1sk-index",
                pk: {
                    field: "gsi1pk",
                    composite: ["attr6", "attr9"]
                },
                sk: {
                    field: "gsi1sk",
                    composite: ["attr4", "attr5"]
                }
            }
        }
    }, {table, client});

    it('should return only the attributes specified in query options', async () => {
        const item: EntityItem<typeof entityWithSK> = {
            attr1: uuid(),
            attr2: "attr2",
            attr9: 9,
            attr6: 6,
            attr4: 'abc',
            attr8: true,
            attr5: 'attr5',
            attr3: '123',
            attr7: 'attr7',
            attr10: false,
        };
        await entityWithSK.put(item).go();
        const getItem = await entityWithSK
            .get({
                attr1: item.attr1,
                attr2: item.attr2,
            }).go({
                attributes: ['attr2', 'attr9', 'attr5', 'attr10']
            }).then(res => res.data);

        expect(getItem).to.deep.equal({
            attr2: item.attr2,
            attr9: item.attr9,
            attr5: item.attr5,
            attr10: item.attr10,
        });

        const queryItem = await entityWithSK.query
            .myIndex({
                attr1: item.attr1,
                attr2: item.attr2,
            }).go({
                attributes: ['attr2', 'attr9', 'attr5', 'attr10']
            }).then(res => res.data);

        expect(queryItem).to.deep.equal([{
            attr2: item.attr2,
            attr9: item.attr9,
            attr5: item.attr5,
            attr10: item.attr10,
        }]);
    });

    it('should not add entity identifiers', async () => {
        const item: EntityItem<typeof entityWithSK> = {
            attr1: uuid(),
            attr2: "attr2",
            attr9: 9,
            attr6: 6,
            attr4: 'abc',
            attr8: true,
            attr5: 'attr5',
            attr3: '123',
            attr7: 'attr7',
            attr10: false,
        };
        await entityWithSK.put(item).go();

        // params
        const getParams = entityWithSK.get({
            attr1: item.attr1,
            attr2: item.attr2,
        }).params({attributes: ['attr2', 'attr9', 'attr5', 'attr10']});
        expect(getParams.ExpressionAttributeNames).to.deep.equal({
            "#attr2": "attr2",
            "#prop9": "prop9", // should convert attribute names to field names when specifying attributes
            "#attr5": "attr5",
            "#attr10": "attr10"
        });
        expect(getParams.ProjectionExpression).to.equal("#attr2, #prop9, #attr5, #attr10");
        const queryParams = entityWithSK.query.myIndex({
            attr1: item.attr1,
            attr2: item.attr2,
        }).params({attributes: ['attr2', 'attr9', 'attr5', 'attr10']});
        expect(queryParams.ExpressionAttributeNames).to.deep.equal({
            "#pk": "pk",
            "#sk1": "sk",
            "#attr2": "attr2",
            "#prop9": "prop9", // should convert attribute names to field names when specifying attributes
            "#attr5": "attr5",
            "#attr10": "attr10"
        });
        expect(queryParams.ProjectionExpression).to.equal("#pk, #sk1, #attr2, #prop9, #attr5, #attr10");

        // raw
        const getRaw = await entityWithSK.get({
            attr1: item.attr1,
            attr2: item.attr2,
        }).go({raw: true, attributes: ['attr2', 'attr9', 'attr5', 'attr10']}).then(res => res.data);
        expect(getRaw).to.deep.equal({
            "Item": {
                "attr5": item.attr5,
                "prop9": item.attr9, // should convert attribute names to field names when specifying attributes
                "attr2": item.attr2,
                "attr10": item.attr10,
            }
        });
        const queryRawGo = await entityWithSK.query.myIndex({
            attr1: item.attr1,
            attr2: item.attr2,
        }).go({raw: true, attributes: ['attr2', 'attr9', 'attr5', 'attr10']})
            .then(res => res.data);
        expect(queryRawGo).to.deep.equal({
            "Items": [
                {
                    "sk": `$mycollection2#abc_myversion#attr2_${item.attr2}`,
                    "attr5": item.attr5,
                    "prop9": item.attr9, // should convert attribute names to field names when specifying attributes
                    "pk": `$myservice#attr1_${item.attr1}`,
                    "attr2": item.attr2,
                    "attr10": item.attr10
                }
            ],
            "Count": 1,
            "ScannedCount": 1
        });
        const queryRawPage = await entityWithSK.query.myIndex({
                attr1: item.attr1,
                attr2: item.attr2,
            })
            .go({cursor: null, raw: true, attributes: ['attr2', 'attr9', 'attr5', 'attr10']})

            expect(queryRawPage.data).to.deep.equal({
                "Items": [
                    {
                        "sk": `$mycollection2#abc_myversion#attr2_${item.attr2}`,
                        "attr5": item.attr5,
                        "prop9": item.attr9, // should convert attribute names to field names when specifying attributes
                        "pk": `$myservice#attr1_${item.attr1}`,
                        "attr2": item.attr2,
                        "attr10": item.attr10
                    }
                ],
                "Count": 1,
                "ScannedCount": 1
            });
            expect(queryRawPage.cursor).to.equal(null);

        // pagerRaw
        const queryRawPager = await entityWithSK.query.myIndex({
            attr1: item.attr1,
            attr2: item.attr2,
        }).go({cursor: null, pager: 'raw', attributes: ['attr2', 'attr9', 'attr5', 'attr10']})
            .then(res => [res.cursor, res.data] as const);
        expect(queryRawPager).to.deep.equal([
            null,
            [
                {
                    "attr5": item.attr5,
                    "attr9": item.attr9,
                    "attr2": item.attr2,
                    "attr10": item.attr10,
                }
            ]
        ]);
        // ignoreOwnership
        let getIgnoreOwnershipParams: any;
        const getIgnoreOwnership = await entityWithSK.get({
            attr1: item.attr1,
            attr2: item.attr2,
        }).go({
            logger: (event) => {
                if (event.type === 'query') {
                    getIgnoreOwnershipParams = event.params;
                }
            },
            ignoreOwnership: true,
            attributes: ['attr2', 'attr9', 'attr5', 'attr10']
        }).then(res => res.data);

        expect(getIgnoreOwnershipParams.ExpressionAttributeNames).to.deep.equal({
            "#attr2": "attr2",
            "#prop9": "prop9", // should convert attribute names to field names when specifying attributes
            "#attr5": "attr5",
            "#attr10": "attr10",
        });
        expect(getIgnoreOwnershipParams.ProjectionExpression).to.equal("#attr2, #prop9, #attr5, #attr10");

        expect(getIgnoreOwnership).to.deep.equal({
            "attr5": item.attr5,
            "attr9": item.attr9,
            "attr2": item.attr2,
            "attr10": item.attr10
        });

        const queryIgnoreOwnershipGo = await entityWithSK.query.myIndex({
            attr1: item.attr1,
            attr2: item.attr2,
        }).go({
            ignoreOwnership: true,
            attributes: ['attr2', 'attr9', 'attr5', 'attr10'],
            logger: (event) => {
                if (event.type === 'query') {
                    getIgnoreOwnershipParams = event.params;
                }
            },
        }).then(res => res.data);
        expect(queryIgnoreOwnershipGo).to.deep.equal([
            {
                "attr5": item.attr5,
                "attr9": item.attr9,
                "attr2": item.attr2,
                "attr10": item.attr10,
            }
        ]);
        expect(getIgnoreOwnershipParams.ExpressionAttributeNames).to.deep.equal({
            "#pk": "pk",
            "#sk1": "sk",
            "#attr2": "attr2",
            "#prop9": "prop9", // should convert attribute names to field names when specifying attributes
            "#attr5": "attr5",
            "#attr10": "attr10",
        });
        expect(getIgnoreOwnershipParams.ProjectionExpression).to.equal("#pk, #sk1, #attr2, #prop9, #attr5, #attr10");

        const queryIgnoreOwnershipPage = await entityWithSK.query.myIndex({
            attr1: item.attr1,
            attr2: item.attr2,
        }).go({
            ignoreOwnership: true,
            attributes: ['attr2', 'attr9', 'attr5', 'attr10'],
            logger: (event) => {
                if (event.type === 'query') {
                    getIgnoreOwnershipParams = event.params;
                }
            },
        }).then(res => [res.cursor, res.data] as const);

        expect(queryIgnoreOwnershipPage).to.deep.equal([
            null,
            [
                {
                    "attr5": item.attr5,
                    "attr9": item.attr9,
                    "attr2": item.attr2,
                    "attr10": item.attr10,
                }
            ]
        ])
        expect(getIgnoreOwnershipParams.ExpressionAttributeNames).to.deep.equal({
            "#pk": "pk",
            "#sk1": "sk",
            "#attr2": "attr2",
            "#prop9": "prop9", // should convert attribute names to field names when specifying attributes
            "#attr5": "attr5",
            "#attr10": "attr10",
        });
        expect(getIgnoreOwnershipParams.ProjectionExpression).to.equal("#pk, #sk1, #attr2, #prop9, #attr5, #attr10");
    });

    it('should return all values if attributes is empty array', async () => {
        const item: EntityItem<typeof entityWithSK> = {
            attr1: uuid(),
            attr2: "attr2",
            attr9: 9,
            attr6: 6,
            attr4: 'abc',
            attr8: true,
            attr5: 'attr5',
            attr3: '123',
            attr7: 'attr7',
            attr10: false,
        };
        await entityWithSK.put(item).go();

        // params
        const getParams = await entityWithSK.get({
            attr1: item.attr1,
            attr2: item.attr2,
        }).go({attributes: []}).then(res => res.data);

        expect(getParams).to.deep.equal(item);
    });

    it('should include index composite attributes on automatically but not on the response', async () => {
        const item: EntityItem<typeof entityWithSK> = {
            attr1: uuid(),
            attr2: "attr2",
            attr9: 9,
            attr6: 6,
            attr4: 'abc',
            attr8: true,
            attr5: uuid(),
            attr3: '123',
            attr7: 'attr7',
            attr10: false,
        };
        await entityWithSK.put(item).go();
        let params: any;
        const results = await entityWithSK.query.myIndex2({
            attr5: item.attr5,
            attr4: item.attr4,
            attr6: item.attr6!,
            attr9: item.attr9!,
        }).go({
            cursor: null,
            logger: (event) => {
                if (event.type === 'query') {
                    params = event.params;
                }
            },
            attributes: ['attr2', 'attr9', 'attr5', 'attr10']
        }).then(res => res.data);
        expect(results).to.deep.equal([{
            attr2: item.attr2,
            attr9: item.attr9,
            attr5: item.attr5,
            attr10: item.attr10,
        }]);
        expect(params.ProjectionExpression).to.equal("#attr5, #attr4, #pk, #sk1, #attr2, #prop9, #attr10, #__edb_e__, #__edb_v__");
    });

    it('should not include index composite attributes on automatically when pager is raw', async () => {
        const item: EntityItem<typeof entityWithSK> = {
            attr1: uuid(),
            attr2: "attr2",
            attr9: 9,
            attr6: 6,
            attr4: 'abc',
            attr8: true,
            attr5: uuid(),
            attr3: '123',
            attr7: 'attr7',
            attr10: false,
        };
        await entityWithSK.put(item).go();
        let params: any;
        const results = await entityWithSK.query.myIndex2({
            attr5: item.attr5,
            attr4: item.attr4,
            attr6: item.attr6!,
            attr9: item.attr9!,
        }).go({
            cursor: null,
            logger: (event) => {
                if (event.type === 'query') {
                    params = event.params;
                }
            },
            pager: 'raw',
            attributes: ['attr2', 'attr9', 'attr5', 'attr10']
        }).then(res => res.data);
        expect(results).to.deep.equal([{
            attr2: item.attr2,
            attr9: item.attr9,
            attr5: item.attr5,
            attr10: item.attr10,
        }]);
        expect(params.ProjectionExpression).to.equal("#attr5, #attr4, #pk, #sk1, #attr2, #prop9, #attr10, #__edb_e__, #__edb_v__");
    });

    it('should throw when unknown attribute names are provided', () => {
        const attr1 = 'attr1';
        const attr2 = 'attr2';
        const getParams = () => entityWithSK
            .get({attr1, attr2})
            .params({
                // @ts-ignore
                attributes: ['prop1']
            });
        expect(getParams).to.throw(`Unknown attributes provided in query options: "prop1"`);
    });

    it('should throw when non-string attributes are provided', () => {
        const attr1 = 'attr1';
        const attr2 = 'attr2';
        const getParams = () => entityWithSK
            .get({attr1, attr2})
            // @ts-ignore
            .params({attributes: [123, {abc: 'def'}]});
        expect(getParams).to.throw(`Unknown attributes provided in query options: "123", "[object Object]"`);
    });

    it('should evaluate queries as complete when all sort keys are provided to the access pattern method', async () => {
        const entity = new Entity({
            model: {
                service: 'service',
                entity: 'entity',
                version: '1',
            },
            attributes: {
                prop1: {
                    type: 'string'
                },
                prop2: {
                    type: 'string'
                },
                prop3: {
                    type: 'string'
                },
                prop4: {
                    type: 'string'
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
                        composite: ['prop2', 'prop3']
                    }
                }
            }
        }, {client, table});

        const prop1 = uuid();
        const prop2 = uuid();
        await entity.put({prop1, prop2, prop3: 'test'}).go();
        await entity.put({prop1, prop2, prop3: 'test2'}).go();

        const partial = entity.query.record({
            prop1: 'prop1',
            prop2: 'prop2',
        }).params();

        expect(partial.KeyConditionExpression).to.equal("#pk = :pk and begins_with(#sk1, :sk1)")

        const full = entity.query.record({
            prop1: 'prop1',
            prop2: 'prop2',
            prop3: 'prop3',
        }).params();

        expect(full.KeyConditionExpression).to.equal("#pk = :pk and #sk1 = :sk1")

        const tests = await entity.query.record({prop1, prop2, prop3: 'test'}).go().then(res => res.data);
        expect(tests).to.deep.equal([
            { prop1, prop2, prop3: 'test' }
        ]);
        const testish = await entity.query.record({prop1, prop2}).begins({prop3: 'test'}).go().then(res => res.data);
        expect(testish).to.deep.equal([
            { prop1, prop2, prop3: 'test' },
            { prop1, prop2, prop3: 'test2' }
        ]);
    });

    it('should evaluate queries as complete when all sort keys are provided even when keys are duplicated', () => {
        const entity = new Entity({
            model: {
                service: 'service',
                entity: 'entity',
                version: '1',
            },
            attributes: {
                prop1: {
                    type: 'string'
                },
                prop2: {
                    type: 'string'
                },
                prop3: {
                    type: 'string'
                },
                prop4: {
                    type: 'string'
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
                        template: '${prop2}#${prop3}#${prop4}#${prop2}#${prop3}',
                        composite: ['prop2', 'prop3', 'prop4', 'prop2' , 'prop3'],
                    }
                }
            }
        }, {client, table});

        const partial = entity.query.record({
            prop1: 'prop1',
            prop2: 'prop2',
            prop4: 'prop4',
        }).params();

        expect(partial.KeyConditionExpression).to.equal("#pk = :pk and begins_with(#sk1, :sk1)")

        const full = entity.query.record({
            prop1: 'prop1',
            prop2: 'prop2',
            prop3: 'prop3',
            prop4: 'prop4',
        }).params();

        expect(full.KeyConditionExpression).to.equal("#pk = :pk and #sk1 = :sk1")
    });

    it('should apply sort parameters to queries', async () => {
        const entity = new Entity({
            model: {
                service: 'service',
                entity: 'entity',
                version: '1',
            },
            attributes: {
                prop1: {
                    type: 'string'
                },
                prop2: {
                    type: 'string'
                },
                prop3: {
                    type: 'string'
                },
                prop4: {
                    type: 'string'
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
                        template: '${prop2}#${prop3}#${prop4}#${prop2}#${prop3}',
                        composite: ['prop2', 'prop3', 'prop4', 'prop2' , 'prop3'],
                    }
                }
            }
        }, {client, table});

        const queries = [
            ['query', entity.query.record({
                prop1: 'prop1',
                prop2: 'prop2',
                prop3: 'prop3',
            })],
            ['indexed find', entity.find({prop1: 'prop1'})],
            ['indexed match', entity.match({prop1: 'prop1'})],
        ] as const;

        const options = [
            ['none', undefined, undefined] as const,
            ['empty', {}, undefined] as const,
            ['asc', {order: 'asc'}, true],
            ['desc', {order: 'desc'}, false] as const,
        ] as const;

        await entity.put([
            {
                prop1: 'prop1',
                prop2: 'prop2',
                prop3: 'prop3',
                prop4: 'prop4a',
            },
            {
                prop1: 'prop1',
                prop2: 'prop2',
                prop3: 'prop3',
                prop4: 'prop4b',
            },
            {
                prop1: 'prop1',
                prop2: 'prop2',
                prop3: 'prop3',
                prop4: 'prop4c',
            }
        ]).go();

        for (const [description, operation] of queries) {
            for (const [label, queryOptions, output] of options) {
                try {
                    // @ts-ignore
                    const params = operation.params(queryOptions);
                    expect(params['ScanIndexForward']).to.equal(output);
                
                    // @ts-ignore
                    const results = await operation.go(queryOptions);

                    // @ts-ignore
                    const isDesc = output === false;
                    if (isDesc) {
                        expect(results.data[0]?.prop4).to.equal('prop4c');
                        expect(results.data[1]?.prop4).to.equal('prop4b');
                        expect(results.data[2]?.prop4).to.equal('prop4a');
                    } else {
                        expect(results.data[0]?.prop4).to.equal('prop4a');
                        expect(results.data[1]?.prop4).to.equal('prop4b');
                        expect(results.data[2]?.prop4).to.equal('prop4c');
                    }
                } catch(err: any) {
                    err.message = `when ${description} with ${label}: ${err.message}`;
                    throw err;
                }
            }
        }     
    });
});

describe('attribute padding', () => {
   it('should perform crud operations with padded number attribute', async () => {
       const entity = new Entity({
           model: {
               entity: uuid(),
               service: 'padding',
               version: '0'
           },
           attributes: {
               prop1: {
                   type: 'number',
                   padding: {
                       length: 5,
                       char: '0',
                   }
               },
               prop2: {
                   type: 'string',
               },
               prop3: {
                   type: 'string',
               },
               prop4: {
                   type: 'number',
                   padding: {
                       length: 5,
                       char: '0',
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
                       composite: ['prop2']
                   }
               },
               second: {
                   index: "gsi1pk-gsi1sk-index",
                   pk: {
                       field: "gsi1pk",
                       composite: ['prop3'],
                   },
                   sk: {
                       field: "gsi1sk",
                       composite: ['prop4'],
                   },
               }
           }
       }, {table, client});
       const prop2 = uuid();
       const prop3 = uuid();
       const prop1 = 10;
       const initialProp4 = 500;
       const created = await entity.put({
           prop1,
           prop2,
           prop3,
           prop4: initialProp4,
       }).go();
       expect(created.data).to.deep.equal({prop1, prop2, prop3, prop4: initialProp4});

       const getFromInitial = await entity.get({prop1, prop2}).go();
       expect(getFromInitial.data).to.deep.equal({prop1, prop2, prop3, prop4: initialProp4});

       const queryFromInitialProp1 = await entity.query.record({prop1, prop2}).go();
       expect(queryFromInitialProp1.data[0]).to.deep.equal({prop1, prop2, prop3, prop4: initialProp4});

       const queryFromInitialProp4 = await entity.query.second({prop3, prop4: initialProp4}).go();
       expect(queryFromInitialProp4.data[0]).to.deep.equal({prop1, prop2, prop3, prop4: initialProp4});

       const nextProp4 = 25;
       const updatedProp4 = await entity.update({prop1, prop2}).set({prop4: nextProp4}).go({response: 'all_new'});
       expect(updatedProp4.data).to.deep.equal({prop1, prop2, prop3, prop4: nextProp4});

       const queryFromNextProp4 = await entity.query.second({prop3, prop4: nextProp4}).go();
       expect(queryFromNextProp4.data[0]).to.deep.equal({prop1, prop2, prop3, prop4: nextProp4});
   });

    it('should perform crud operations with padded string attribute', async () => {
        const entity = new Entity({
            model: {
                entity: uuid(),
                service: 'padding',
                version: '0'
            },
            attributes: {
                prop1: {
                    type: 'string',
                    padding: {
                        length: 5,
                        char: '0',
                    }
                },
                prop2: {
                    type: 'string',
                },
                prop3: {
                    type: 'string',
                },
                prop4: {
                    type: 'string',
                    padding: {
                        length: 5,
                        char: '0',
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
                        composite: ['prop2']
                    }
                },
                second: {
                    index: "gsi1pk-gsi1sk-index",
                    pk: {
                        field: "gsi1pk",
                        composite: ['prop3'],
                    },
                    sk: {
                        field: "gsi1sk",
                        composite: ['prop4'],
                    },
                }
            }
        }, {table, client});

        const prop2 = uuid();
        const prop3 = uuid();
        const prop1 = 'abc';
        const knownProp1 = '00abc';
        const initialProp4 = 'def';
        const knownProp4 = '00def';
        const created = await entity.put({
            prop1,
            prop2,
            prop3,
            prop4: initialProp4,
        }).go();
        expect(created.data).to.deep.equal({prop1, prop2, prop3, prop4: initialProp4});

        const getFromInitial = await entity.get({prop1, prop2}).go();
        expect(getFromInitial.data).to.deep.equal({prop1, prop2, prop3, prop4: initialProp4});

        const getFromKnown = await entity.get({prop2, prop1: knownProp1}).go();
        expect(getFromKnown.data).to.be.deep.equal({prop1, prop2, prop3, prop4: initialProp4});

        const queryFromInitialProp1 = await entity.query.record({prop1, prop2}).go();
        expect(queryFromInitialProp1.data[0]).to.deep.equal({prop1, prop2, prop3, prop4: initialProp4});

        const queryFromKnownProp1 = await entity.query.record({prop1: knownProp1, prop2}).go();
        expect(queryFromKnownProp1.data[0]).to.deep.equal({prop1, prop2, prop3, prop4: initialProp4});

        const queryFromInitialProp4 = await entity.query.second({prop3, prop4: initialProp4}).go();
        expect(queryFromInitialProp4.data[0]).to.deep.equal({prop1, prop2, prop3, prop4: initialProp4});

        const queryFromKnownProp4 = await entity.query.second({prop3, prop4: knownProp4}).go();
        expect(queryFromKnownProp4.data[0]).to.deep.equal({prop1, prop2, prop3, prop4: initialProp4});

        const nextProp4 = 'xyz';
        const knownNextProp4 = '00xyz';
        const updatedProp4 = await entity.update({prop1, prop2}).set({prop4: nextProp4}).go({response: 'all_new'});
        expect(updatedProp4.data).to.deep.equal({prop1, prop2, prop3, prop4: nextProp4});

        const queryFromNextProp4 = await entity.query.second({prop3, prop4: nextProp4}).go();
        expect(queryFromNextProp4.data[0]).to.deep.equal({prop1, prop2, prop3, prop4: nextProp4});

        const queryFromKnownNextProp4 = await entity.query.second({prop3, prop4: knownNextProp4}).go();
        expect(queryFromKnownNextProp4.data[0]).to.deep.equal({prop1, prop2, prop3, prop4: nextProp4});
    });

    it('should accept the value zero for sort key number attributes', async () => {
        const transaction = new Entity(
            {
                model: {
                    entity: "transaction",
                    version: "1",
                    service: "bank"
                },
                attributes: {
                    accountNumber: {
                        type: "number",
                        required: true,
                        padding: {
                            length: 8,
                            char: '0',
                        }
                    },
                    transactionId: {
                        type: "number",
                        required: true,
                        padding: {
                            length: 10,
                            char: '0',
                        }
                    },
                    amount: {
                        type: 'number',
                    },
                    datePosted: {
                        type: 'string',
                    },
                },
                indexes: {
                    transactions: {
                        pk: {
                            field: "pk",
                            composite: ["accountNumber"]
                        },
                        sk: {
                            field: "sk",
                            composite: ["transactionId"]
                        }
                    },
                }
            },
            { table }
        );

        const accountNumber = 0;
        const transactionId = 0;

        const params = transaction.query
            .transactions({accountNumber, transactionId})
            .params();

        expect(params).to.deep.equal({
            "KeyConditionExpression": "#pk = :pk and #sk1 = :sk1",
            "TableName": table,
            "ExpressionAttributeNames": {
                "#pk": "pk",
                "#sk1": "sk"
            },
            "ExpressionAttributeValues": {
                ":pk": "$bank#accountnumber_00000000",
                ":sk1": "$transaction_1#transactionid_0000000000"
            }
        });
    });
});

describe('upsert', () => {
    const tasks = new Entity(
        {
            model: {
                entity: "tasks",
                version: "1",
                service: "taskapp"
            },
            attributes: {
                team: {
                    type: "string",
                    required: true
                },
                task: {
                    type: "string",
                    required: true
                },
                project: {
                    type: "string",
                    required: true
                },
                complete: {
                    type: 'boolean',
                    required: true
                },
                title: {
                    type: 'string',
                },
                description: {
                    type: "string"
                },
                flags: {
                    type: 'set',
                    items: 'string',
                },
                integrations: {
                    type: 'map',
                    properties: {
                        twitter: {
                            type: 'string'
                        },
                        asana: {
                            type: 'string'
                        }
                    }
                },
            },
            indexes: {
                tasks: {
                    pk: {
                        field: "pk",
                        composite: ["project"]
                    },
                    sk: {
                        field: "sk",
                        // create composite keys for partial sort key queries
                        composite: ["task"]
                    }
                }
            }
        },
        { table, client }
    );

    it('should not overwrite readonly properties', async () => {
        const thing = new Entity({
            model: {
                entity: 'thing',
                version: '1',
                service: 'thingstore'
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
                value: {
                    type: 'string',
                    readOnly: true,
                }
            },
            indexes: {
                records: {
                    pk: {
                        field: 'pk',
                        composite: ['organizationId']
                    },
                    sk: {
                        field: 'sk',
                        composite: ['accountId']
                    }
                },
                byName: {
                    index: 'gsi1pk-gsi1sk-index',
                    pk: {
                        field: 'gsi1pk',
                        composite: ['name']
                    },
                    sk: {
                        field: 'gsi1sk',
                        composite: ['description']
                    }
                }
            }
        }, { table, client });
        const organizationId = uuid();
        const accountId = uuid();
        const name = uuid();

        const put = await thing.create({
            organizationId,
            accountId,
            name,
            value: 'abc'
        }).go();

        expect(put.data.value).to.equal('abc');

        const upserted = await thing
            .upsert({
                organizationId,
                accountId,
                name,
                value: 'def',
            })
            .go({response: 'all_new'});

        expect(upserted.data.value).to.equal('abc');

        const get = await thing.get({organizationId, accountId}).go();

        expect(get.data?.value).to.equal('abc');
    });

    it('should allow calculated field createdAt/updatedAt pattern with upsert', async () => {
        const entity = new Entity({
            model: {
                entity: "transaction",
                service: "bank",
                version: "1"
            },
            attributes: {
                accountNumber: {
                    type: "string"
                },
                transactionId: {
                    type: "string"
                },
                description: {
                    type: "string",
                },
                createdAt: {
                    type: "number",
                    readOnly: true,
                    required: true,
                    default: () => Date.now(),
                    set: () => Date.now(),
                },
                updatedAt: {
                    type: "number",
                    watch: "*",
                    required: true,
                    default: () => Date.now(),
                    set: () => Date.now(),
                }
            },
            indexes: {
                transactions: {
                    pk: {
                        field: "pk",
                        composite: ["accountNumber"]
                    },
                    sk: {
                        field: "sk",
                        composite: ["transactionId"]
                    }
                }
            }
        }, { table, client });

        const accountNumber = uuid();
        const transactionId = uuid();
        const description = uuid();

        const put = await entity.create({
            accountNumber,
            transactionId,
            description,
        }).go();

        expect(typeof put.data.createdAt).to.equal('number');
        expect(typeof put.data.updatedAt).to.equal('number');

        const upserted = await entity
            .upsert({
                accountNumber,
                transactionId,
                description,
            })
            .go({response: 'all_new'});

        expect(upserted.data.createdAt).to.equal(put.data.createdAt);
        expect(upserted.data.updatedAt).not.to.equal(put.data.updatedAt);

        const get = await entity.get({accountNumber, transactionId}).go();

        expect(get.data?.createdAt).to.equal(put.data.createdAt);
        expect(get.data?.updatedAt).not.to.equal(put.data.updatedAt);
    })

    it('should create an item if one did not exist prior', async () => {
        const project = uuid();
        const task = 'task-001'
        const team = 'my_team';
        const flags = ['performance'];
        const integrations = {
            twitter: '@tywalch',
        }
        const title = 'Bugfix #921';
        const complete = false;
        const initialUpsert = await tasks.upsert({
            project,
            complete,
            task,
            team,
            flags,
            integrations,
            title,
        }).go({response: 'all_new'});
        const expected = {
            project,
            complete,
            task,
            team,
            flags,
            integrations,
            title,
        }
        const record = await tasks.get({task, project}).go();
        expect(initialUpsert.data).to.deep.equal(expected);
        expect(record.data).to.deep.equal(expected);
    });

    it('should update an existing item', async () => {
        const project = uuid();
        const task = 'task-001'
        const team = 'my_team';
        const flags = ['performance'];
        const integrations = {
            twitter: '@tywalch',
        }
        const title = 'Bugfix #921';
        const description = 'Users experience degraded performance';
        const complete = true;

        const initialUpsert = await tasks.upsert({
            project,
            complete,
            task,
            team,
            flags,
            integrations,
            title,
        }).go({response: 'all_new'});

        expect(initialUpsert.data).to.deep.equal({
            complete,
            project,
            task,
            team,
            flags,
            integrations,
            title,
        });

        const record = await tasks.get({task, project}).go();

        expect(record.data).to.deep.equal({
            complete,
            project,
            task,
            team,
            flags,
            integrations,
            title,
        });

        const upsertedOverExisting = await tasks.upsert({
            task,
            project,
            team,
            description,
            flags: ['groomed', 'tech_debt'],
            complete: false,
        }).go({response: 'all_new'});

        expect(upsertedOverExisting.data).to.deep.equal({
            project,
            task,
            team,
            flags: ['groomed', 'tech_debt'],
            complete: false,
            integrations,
            title,
            description,
        })

        const record2 = await tasks.get({task, project}).go();
        expect(record2.data).to.deep.equal({
            project,
            task,
            team,
            flags: ['groomed', 'tech_debt'],
            complete: false,
            integrations,
            title,
            description,
        })
    });

    it('should not allow for partial keys', async () => {
        const tasks = new Entity(
            {
                model: {
                    entity: "tasks",
                    version: "1",
                    service: "taskapp"
                },
                attributes: {
                    team: {
                        type: "string",
                        required: true
                    },
                    task: {
                        type: "string",
                        required: true
                    },
                    project: {
                        type: "string",
                        required: true
                    },
                    title: {
                        type: 'string',
                    },
                    description: {
                        type: "string"
                    },
                    flags: {
                        type: 'set',
                        items: 'string',
                    },
                    createdAt: {
                        type: 'string'
                    },
                    integrations: {
                        type: 'map',
                        properties: {
                            twitter: {
                                type: 'string'
                            },
                            asana: {
                                type: 'string'
                            }
                        }
                    },
                    complete: {
                        type: 'boolean'
                    }
                },
                indexes: {
                    tasks: {
                        pk: {
                            field: "pk",
                            composite: ["project"]
                        },
                        sk: {
                            field: "sk",
                            // create composite keys for partial sort key queries
                            composite: ["task"]
                        }
                    },
                    projects: {
                        index: 'gsi1pk-gsi1sk-index',
                        pk: {
                            field: 'gsi1pk',
                            composite: ['team']
                        },
                        sk: {
                            field: 'gsi1sk',
                            composite: ['createdAt', 'project']
                        }
                    }
                }
            },
            { table, client }
        );

        const project = uuid();
        const task = 'task-001'
        const team = 'my_team';
        const flags = ['performance'];
        const integrations = {
            twitter: '@tywalch',
        }
        const title = 'Bugfix #921';
        const description = 'Users experience degraded performance';
        const complete = true;
        expect(() => {
            const upsert = tasks.upsert({
                project,
                complete,
                task,
                team,
                flags,
                integrations,
                title,
            }).params();
        }).to.throw('Incomplete composite attributes: Without the composite attributes "createdAt" the following access patterns cannot be updated: "projects"  - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#incomplete-composite-attributes')
    });
});

describe('batch operations', () => {
    it('should return batchGet records when "table" is provided as query option', async () => {
        const Segment = new Entity({
            model: {
                entity: "Segment",
                version: "1",
                service: "TourContent",
            },
            attributes: {
                tenantId: {
                    type: "string",
                    required: true,
                },
                siteId: {
                    type: "string",
                    required: true,
                },
                segmentId: {
                    type: "string",
                    required: true,
                    // default: () => uuid(),
                    readOnly: true,
                    validate: /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i,
                },
                name: {
                    type: "string",
                    required: true,
                },
                // createdAt,
                // updatedAt,
                state: {
                    type: ["active", "inactive"] as const,
                    required: true,
                },
                image: {
                    type: "map",
                    required: false,
                    properties: {
                        bucket: {
                            type: "string",
                            required: false,
                        },
                        key: {
                            type: "string",
                            required: false,
                        },
                    },
                },
            },
            indexes: {
                _: {
                    pk: {
                        field: 'pk',
                        composite: ["tenantId", "siteId", "segmentId"],
                    },
                    sk: {
                        field: 'sk',
                        composite: [],
                    },
                },
                site: {
                    collection: "site",
                    index: 'gsi1pk-gsi1pk-index',
                    pk: {
                        field: 'gsi1pk',
                        composite: ["tenantId", "siteId"],
                    },
                    sk: {
                        field: 'gis1sk',
                        composite: ["segmentId"],
                    },
                },
            },
        }, {client});

        type CreateSegment = CreateEntityItem<typeof Segment>;

        const items: CreateSegment[] = [];
        for (let i = 0; i < 10; i++) {
            items.push({
                tenantId: uuid(),
                siteId: uuid(),
                name: uuid(),
                image: {
                    bucket: uuid(),
                    key: uuid(),
                },
                segmentId: uuid(),
                state: 'active'
            });
        }

        await Segment.put(items).go({table});

        const first = await Segment.get({
            segmentId: items[0].segmentId!,
            siteId: items[0].siteId!,
            tenantId: items[0].tenantId!
        }).go({table});

        expect(first.data).to.deep.equal(items[0]);

        const batchGet = await Segment.get(items).go({table});
        expect(batchGet.data).to.have.length.greaterThan(0);
        expect(batchGet.data).to.have.length(items.length);
        expect(
            batchGet.data
                .sort((a, z) => a.segmentId.localeCompare(z.segmentId))
        ).to.deep.equal(
            items
                .sort((a, z) => a.segmentId.localeCompare(z.segmentId))
        );
    });
});

describe('enum set', () => {
    const entity = new Entity({
        model: {
            version: '1',
            service: 'test_service',
            entity: 'includes_enum_set',
        },
        attributes: {
            id: {
                type: 'string'
            },
            tags: {
                type: 'set',
                items: ['ART', 'SCIENCE', 'MUSIC', 'HISTORY'] as const,
            },
            optional: {
                type: 'string'
            }
        },
        indexes: {
            record: {
                pk: {
                    field: 'pk',
                    composite: ['id']
                },
                sk: {
                    field: 'sk',
                    composite: []
                }
            }
        }
    }, { table, client });

    it('should perform full crud on enum set', async () => {
        const id = uuid();

        await entity.create({id, tags: ['ART']}).go();
        const first = await entity.get({id}).go();
        expect(first.data).to.deep.equal({ id, tags: ['ART']});

        await entity.patch({id}).add({tags: ['SCIENCE']}).go();
        const second = await entity.get({id}).go();
        expect(second.data).to.deep.equal({ id, tags: ['ART', 'SCIENCE']});

        await entity.update({id}).data(({tags}, {del}) => del(tags, ['ART'])).go();
        const third = await entity.get({id}).go();
        expect(third.data).to.deep.equal({ id, tags: ['SCIENCE']});

        await entity.upsert({id, optional: 'hi'}).go();
        const fourth = await entity.get({id}).go();
        expect(fourth.data).to.deep.equal({ id, tags: ['SCIENCE'], optional: 'hi'});

        await entity.patch({id}).remove(['tags']).go();
        const fifth = await entity.get({id}).go();
        expect(fifth.data).to.deep.equal({ id, optional: 'hi'});

        await entity.patch({id}).set({tags: ['HISTORY']}).go();
        const sixth = await entity.get({id}).go();
        expect(sixth.data).to.deep.equal({ id, optional: 'hi', tags: ['HISTORY']});
    });

    describe('ignore ownership', () => {
       const BlogEntry = new Entity(
           {
               model: {
                   version: "1",
                   entity: "Entry",
                   service: "blog",
               },
               attributes: {
                   id: {
                       type: "string",
                       required: true,
                       readOnly: true,
                   },
                   userId: {
                       type: "string",
                       required: true,
                       readOnly: true,
                   },
                   title: {
                       type: "string",
                   }
               },
               indexes: {
                   record: {
                       pk: {
                           field: "pk",
                           composite: ["id"],
                           template: "E_${id}",
                           casing: "none"
                       },
                       sk: {
                           field: "sk",
                           composite: [],
                           template: "METADATA",
                           casing: "none"
                       },
                   },
                   userEntries: {
                       index: "gsi1pk-gsi1sk-index",
                       pk: {
                           field: "gsi1pk",
                           composite: ["userId"],
                           template: "U_${userId}",
                           casing: "none"
                       },
                       sk: {
                           field: "gsi1sk",
                           composite: ["id"],
                           template: "E_${id}#",
                           casing: "none"
                       },
                   }
               },
           },
           {table, client}
       );

       const createBlogEntryAttributes = () => {
           return {
               id: uuid(),
               title: uuid(),
               userId: uuid(),
           }
       }

       const createEntry = async () => {
           const withElectro = createBlogEntryAttributes();
           const withoutElectro = {
               ...createBlogEntryAttributes(),
               // use a shared userId for partial queries
               userId: withElectro.userId,
           };
           await BlogEntry.put(withElectro).go();
           await client.put({
               Item: {
                   ...withoutElectro,
                   pk: `E_${withoutElectro.id}`,
                   sk: 'METADATA',
                   gsi1pk: `U_${withoutElectro.userId}`,
                   gsi1sk: `E_${withoutElectro.id}#`
               },
               TableName: table,
           }).promise();

           return {
               withElectro,
               withoutElectro
           };
       }

       it('should get results', async () => {
           const {withElectro, withoutElectro} = await createEntry();

           const withElectroAndOwnership = await BlogEntry.get(withElectro).go();
           const withElectroAndWithoutOwnership = await BlogEntry.get(withElectro).go({ ignoreOwnership: true });

           const withoutElectroAndOwnership = await BlogEntry.get(withoutElectro).go();
           const withoutElectroAndWithoutOwnership = await BlogEntry.get(withoutElectro).go({ ignoreOwnership: true });

           expect(withElectroAndOwnership.data).to.deep.equal(withElectro);
           expect(withElectroAndWithoutOwnership.data).to.deep.equal(withElectro);
           expect(withoutElectroAndOwnership.data).to.be.null;
           expect(withoutElectroAndWithoutOwnership.data).to.deep.equal(withoutElectro);
       });

        it('should batch get results', async () => {
            const {withElectro, withoutElectro} = await createEntry();

            const withElectroAndOwnership = await BlogEntry.get([withElectro, withoutElectro]).go({ preserveBatchOrder: true });
            const withElectroAndWithoutOwnership = await BlogEntry.get([withElectro, withoutElectro]).go({
                ignoreOwnership: true,
                preserveBatchOrder: true,
            });

            expect(withElectroAndOwnership.data).to.deep.equal([withElectro, null])
            expect(withElectroAndWithoutOwnership.data).to.deep.equal([ withElectro, withoutElectro ])
        });

        it('should query results', async () => {
            const {withElectro, withoutElectro} = await createEntry();

            const withElectroAndOwnership = await BlogEntry.query.record(withElectro).go();
            const withElectroAndWithoutOwnership = await BlogEntry.query.record(withElectro).go({ ignoreOwnership: true });
            const withElectroAndOwnershipGSI = await BlogEntry.query.userEntries(withElectro).go();
            const withElectroAndWithoutOwnershipGSI = await BlogEntry.query.userEntries(withElectro).go({ ignoreOwnership: true });

            const withoutElectroAndOwnership = await BlogEntry.query.record(withoutElectro).go();
            const withoutElectroAndWithoutOwnership = await BlogEntry.query.record(withoutElectro).go({ ignoreOwnership: true });
            const withoutElectroAndOwnershipGSI = await BlogEntry.query.userEntries(withoutElectro).go();

            const withoutElectroAndWithoutOwnershipGSI = await BlogEntry.query.userEntries(withoutElectro).go({
                ignoreOwnership: true,
            });

            const partialQueryWithOwnership = await BlogEntry.query.userEntries({userId: withElectro.userId}).go();
            const partialQueryWithoutOwnership = await BlogEntry.query.userEntries({userId: withElectro.userId}).go({ ignoreOwnership: true });

            expect(withElectroAndOwnership.data).to.deep.equal([withElectro]);
            expect(withElectroAndWithoutOwnership.data).to.deep.equal([withElectro]);
            expect(withElectroAndOwnershipGSI.data).to.deep.equal([withElectro]);
            expect(withElectroAndWithoutOwnershipGSI.data).to.deep.equal([withElectro]);

            expect(withoutElectroAndOwnership.data).to.deep.equal([]);
            expect(withoutElectroAndWithoutOwnership.data).to.deep.equal([withoutElectro]);
            expect(withoutElectroAndOwnershipGSI.data).to.deep.equal([]);
            expect(withoutElectroAndWithoutOwnershipGSI.data).to.deep.equal([withoutElectro]);

            expect(withElectro.userId).to.equal(withoutElectro.userId);
            expect(partialQueryWithOwnership.data).to.deep.equal([withElectro]);

            expect(partialQueryWithoutOwnership.data.sort((a, z) => {
                return a.id.localeCompare(z.id);
            })).to.deep.equal([withoutElectro, withElectro].sort((a, z) => {
                return a.id.localeCompare(z.id);
            }));
        });
    });
});

describe('terminal methods', () => {
    it('should allow repeated calls to a terminal method without breaking side effects', async () => {
        const entity = new Entity({
            model: {
                version: '1',
                entity: uuid(),
                service: uuid(),
            },
            attributes: {
                id: {
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
                }
            },
            indexes: {
                records: {
                    pk: {
                        field: 'pk',
                        composite: ['accountId']
                    },
                    sk: {
                        field: 'sk',
                        composite: ['id']
                    }
                }
            }
        }, {
            table,
            client
        });
        const accountId = uuid();
        const createItem = () => {
            return {
                accountId,
                id: uuid(),
                name: uuid(),
                description: uuid(),
            }
        }

        type TestOperationOptions = {
            name: string;
            operation: {
                go: () => Promise<any>;
                params: () => any
            };
            idempotent?: boolean;
        }

        const testOperation = async (name: string, operation: TestOperationOptions['operation'], idempotent: boolean = true) => {
            try {
                const params1 = operation.params();
                const params2 = operation.params();
                await operation.go();
                const params3 = operation.params();
                if (idempotent) {
                    await operation.go();
                }
                expect(params1).to.deep.equal(params2);
                expect(params2).to.deep.equal(params3);
            } catch(err: any) {
                err.message = `${name} operation: ${err.message}`;
                throw err;
            }
        }

        await testOperation('put', entity.put(createItem()));
        await testOperation('batch_put', entity.put([createItem(), createItem()]));
        await testOperation('create', entity.create(createItem()), false);
        await testOperation('upsert', entity.upsert(createItem()));
        await testOperation('get', entity.get(createItem()));
        await testOperation('batch_get', entity.get([createItem(), createItem()]));
        await testOperation('query', entity.query.records(createItem()));
        await testOperation('match', entity.match(createItem()));
        await testOperation('find', entity.find(createItem()));
        await testOperation('scan', entity.scan);
        await testOperation('delete', entity.delete(createItem()));
        await testOperation('update', entity.update(createItem()).set({name: 'update'}));

        const toPatch = createItem();
        await entity.put(toPatch).go();
        await testOperation('patch', entity.patch(toPatch).set({ name: 'update' }));

        const toRemove = createItem();
        await entity.put(toRemove).go();
        await testOperation('remove', entity.remove(toRemove), false);
    })
});

describe('conversion use cases: pagination', () => {
    const entity = new Entity({
        model: {
            version: '1',
            entity: uuid(),
            service: uuid(),
        },
        attributes: {
            id: {
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
            }
        },
        indexes: {
            records: {
                pk: {
                    field: 'pk',
                    composite: ['accountId']
                },
                sk: {
                    field: 'sk',
                    composite: ['id']
                }
            }
        }
    }, {
        table,
        client
    });

    async function loadItems() {
        const accountId = uuid();
        const createItem = () => {
            return {
                accountId,
                id: uuid(),
                name: uuid(),
                description: uuid(),
            }
        }

        const itemCount = 100;

        const items = new Array(itemCount).fill({}).map(createItem);
        await entity.put(items).go();

        return {items, accountId};
    }

    it('adding a limit should not cause dropped items when paginating', async () => {
        const {items, accountId} = await loadItems();
        const limit = 10;
        let iterations = 0;
        let cursor: string | null = null;
        let results: EntityItem<typeof entity>[] = [];
        do {
            const response: QueryResponse<typeof entity> = await entity.query
                .records({accountId})
                .go({ cursor, limit });
            results = results.concat(response.data);
            cursor = response.cursor;
            iterations++;
        } while (cursor);

        expect(
            items.sort((a, z) => a.id.localeCompare(z.id))
        ).to.deep.equal(
            results.sort((a, z) => a.id.localeCompare(z.id))
        );
    });

    it('should let you use a entity level toCursor conversion to create a cursor based on the last item returned', async () => {
        const { items, accountId } = await loadItems();
        const limit = 10;
        let iterations = 0;
        let cursor: string | null = null;
        let results: EntityItem<typeof entity>[] = [];
        do {
            const response: QueryResponse<typeof entity> = await entity.query
                .records({accountId})
                .go({ cursor, limit });
            results = results.concat(response.data);
            if (response.data[response.data.length - 1]) {
                cursor = entity.conversions.fromComposite.toCursor(response.data[response.data.length - 1]);
            } else {
                cursor = null;
            }
            iterations++;
        } while (cursor);

        expect(
            items.sort((a, z) => a.id.localeCompare(z.id))
        ).to.deep.equal(
            results.sort((a, z) => a.id.localeCompare(z.id))
        );
    });

    it('should let you use the index specific toCursor conversion to create a cursor based on the last item returned', async () => {
        const { items, accountId } = await loadItems();
        const limit = 10;
        let iterations = 0;
        let cursor: string | null = null;
        let results: EntityItem<typeof entity>[] = [];
        do {
            const response: QueryResponse<typeof entity> = await entity.query
                .records({accountId})
                .go({ cursor, limit });
            results = results.concat(response.data);
            if (response.data[response.data.length - 1]) {
                cursor = entity.conversions.byAccessPattern.records.fromComposite.toCursor(response.data[response.data.length - 1]);
            } else {
                cursor = null;
            }
            iterations++;
        } while (cursor);

        expect(
            items.sort((a, z) => a.id.localeCompare(z.id))
        ).to.deep.equal(
            results.sort((a, z) => a.id.localeCompare(z.id))
        );
    });
});