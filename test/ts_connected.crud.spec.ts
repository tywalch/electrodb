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
            expect(updatedStore.data).to.be.empty;
            let secondStoreAfterUpdate = await MallStores.get(secondStore).go();
            expect(secondStoreAfterUpdate.data?.rent).to.equal(newRent);
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
            // mall would be changed by the setter;
            expect(recordOne).to.deep.equal({...record, mall: mall + "abc"});
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
                .set({rent: "100.00"})
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
            expect(patchResultsTwo).to.be.null
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
            expect(updatedStore).to.be.empty;
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
            await record.delete({ prop1, prop2 }).go();
            await sleep(150);
            let recordNoLongerExists = await record.get({ prop1, prop2 }).go().then(res => res.data);
            expect(!!Object.keys(recordExists || {}).length).to.be.true;
            expect(recordNoLongerExists).to.be.null;
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
            expect(updatedRecord).to.be.empty;
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
                "attr10": item.attr10
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
        expect(getIgnoreOwnership).to.deep.equal({
            "attr5": item.attr5,
            "attr9": item.attr9,
            "attr2": item.attr2,
            "attr10": item.attr10
        })
        expect(getIgnoreOwnershipParams.ExpressionAttributeNames).to.deep.equal({
            "#attr2": "attr2",
            "#prop9": "prop9", // should convert attribute names to field names when specifying attributes
            "#attr5": "attr5",
            "#attr10": "attr10",
        });
        expect(getIgnoreOwnershipParams.ProjectionExpression).to.equal("#attr2, #prop9, #attr5, #attr10");

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
                }
            }
        },
        { table, client }
    );

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

describe('query limit', () => {
    it('adding a limit should not cause dropped items when paginating', async () => {
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
        // const accountId = uuid();
        // const createItem = () => {
        //     return {
        //         accountId,
        //         id: uuid(),
        //         name: uuid(),
        //         description: uuid(),
        //     }
        // }
        const limit = 10;
        const itemCount = 100;
        const items = [{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"9285ca74-c726-4843-b5ce-c9d8b95c5321","name":"350dd74e-0269-4212-a157-284dd8af3163","description":"9f501f00-176e-45a7-b585-b59ecd4dfb98"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"b71f67c9-af08-4c3a-b1a0-1f365fef3fdf","name":"65197748-af8b-4db6-ad3e-da4618ef08f1","description":"2c848057-3e17-42ae-be20-49b3dc702ea4"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"163f9c9a-2e6f-4250-bce0-249c3ff383ca","name":"21c22079-4267-427a-8b8a-70b41fdb53ee","description":"5b8b20bd-cf12-4082-9c14-c545b2661f79"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"942fea6c-e3d2-4cb0-bdeb-aad8bc9ac90c","name":"e46d67db-22f4-4ba1-9ffc-d939a535822d","description":"cfbc25fb-b231-471c-bb89-7c76b19fcc9c"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"b6781bbb-12b6-4528-9da0-f867c168e89b","name":"fdf65da2-8833-4afc-934c-3c282cfbb080","description":"890558b8-4ed9-4617-9078-1d2d05ad7836"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"ea1d4c70-bf39-4e7c-ba54-0d20d48c9b6d","name":"57938032-c0ad-4565-8b0a-53e95531b256","description":"60c2c2f5-2a3c-43c4-8bda-8b30a293f744"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"25c6cbd5-863d-45be-a237-793a0a48206d","name":"dfd49c67-5554-4605-873f-0d69f8f48ad6","description":"6dc691cf-640e-4c70-8573-ae1789a89c35"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"2a50954f-f2fd-4668-9f02-a074198f70df","name":"9accd38a-557b-4956-98cf-483de6cb1450","description":"0417755f-b1b5-442f-9a57-d15c888e0bf0"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"f20ec780-405c-4b9b-ac2f-7818f0d00712","name":"81d236fd-5ecd-4560-86cc-6743372d66cc","description":"a46c0f02-a547-4526-a053-f4b3e02c74ef"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"f92dda61-855c-4d00-a99e-eadb8b4b1df0","name":"a05113bc-7e32-4524-9dc7-d6d3d029610d","description":"7ec403b4-67eb-4a87-9a26-6169552e3d23"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"05705694-ea52-42d5-a4f6-818fbb727816","name":"ded13657-a9bc-4885-b12c-0c06318f74aa","description":"ced6b30e-c4f1-4f93-8661-51a2e0b1ec3d"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"7624396d-8dea-4a08-8357-02b39aa5eb32","name":"b5e0a922-e76d-4962-8079-bd98ddb8902b","description":"b3713f7e-101c-467d-85d8-1e79d1f56fe7"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"fd5ab144-48b9-431c-819c-814ad5221471","name":"227fdf6b-18f6-4db2-b652-61ee518a6c1f","description":"07c0ca8b-b407-426f-b88f-2fc8939bdfce"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"cc71765e-92cd-44b2-9020-281eca6e1133","name":"586c29d8-0b2b-42d9-9dbc-eb3f992c25fb","description":"a5a474b7-399f-4382-924f-2999584e5b06"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"2a49d1bb-0ade-4578-aed7-c338ed564df2","name":"35dba9e2-3d8b-48b3-8e3c-941747d9bbb6","description":"e1c2b309-62d4-41d9-9b72-c5beec77ed39"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"273f5bb8-892a-451f-9418-cec75bab7bdd","name":"e08c9382-9214-425e-a942-386697eaeabb","description":"088d091e-cd2f-4b0c-9d47-53fc032cc532"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"c58c20e8-506f-4c96-8aa4-f10eadfa8464","name":"9c1ae16f-07b9-4f4b-9546-79bdf64cce87","description":"9147a6f4-5a88-4f6b-bf16-50c4eda8e337"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"ab5e6d14-1704-4699-99ef-f5cdf8d15cae","name":"ef9c9fc9-1761-49cb-b60d-564198e24f3f","description":"c09dfd83-a025-4701-b856-e2e367da1ee3"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"77295160-a2af-480c-b672-7d19452f5f98","name":"ca938fe1-c0a0-46b5-a4c7-c2e68ad87a0b","description":"010939aa-7eb4-485c-ba9b-4ad428ae145b"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"887de7ae-396c-4203-82fa-a13b2a26f61d","name":"6e09a922-faf5-40b5-97a8-ffc7207f9422","description":"84f462b1-80d5-46c7-add7-76a5d77c3f61"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"1c350017-421e-451a-80af-8f5115dbcb8a","name":"56f114bb-e660-4d59-8174-3d4ac28cb97d","description":"d57d5beb-4dfa-4d53-864b-372bca570d38"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"7bd908ec-12bc-4c61-9e01-8c7db8992560","name":"62e5f333-0b8b-4e59-aae7-923414ecb48e","description":"3399cada-d48c-4247-aab1-924c0b6ed723"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"71978d28-022a-45ce-951b-58006356e9af","name":"dae48ac9-cc77-45bc-ab1a-8b68747d101e","description":"63a54f8e-a3cb-499c-8998-c03f18dab50e"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"d1123e7a-a6d9-4583-bbef-8d86741abb53","name":"34c19579-5a64-4014-9a1c-76f051911ae4","description":"695373f3-6a24-41f9-9989-c43f6ceec643"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"054cc007-0ad5-40cb-9c1f-f63c1e27db85","name":"0a81608d-4046-4b75-b256-d8c24e2c7b21","description":"9d4ad35f-ef22-48a4-b2b6-eed7e56d2bca"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"95428a2c-4d8a-4da7-b922-c244fca2e571","name":"1cf80c5b-4e53-4dcd-b760-0297d9e4740b","description":"aec50d8a-f9a7-4736-8cba-498ea1f92ed8"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"42ed2e4f-5152-47f2-9306-9cd8316c2fde","name":"2c134481-e48c-4aa7-987b-fee16b57c8b2","description":"d4520bce-aa2e-4114-a1a3-79afee68b4b5"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"124541e1-619c-49ed-bf30-ce064aa1c85a","name":"2c2445fd-599b-4a90-874b-18840df75ea3","description":"03dbf75f-ab15-4841-9338-e22ccd935eee"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"e31a967c-e139-46f9-abba-48a8f0b46a25","name":"07dd68c5-51f1-475a-a08f-ca738ab4a6ad","description":"6d217d00-d572-4bb7-a7f5-2c8d80076194"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"4486a6b5-a19a-4709-a273-07f1dc9c6f33","name":"056fd004-3fd7-4dd1-9950-bde4d349c8d3","description":"e8d3f2b5-f8ca-43dd-9028-3406eee233b8"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"8f49efe9-6033-4c02-bf73-b702bc91f7d2","name":"bc730646-40f3-4f41-936c-33669c895209","description":"1c929671-9d8c-46e2-8dcd-4205e7a53288"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"18f413e3-e133-492a-99aa-34566f81dc8c","name":"efab6cd6-8894-449d-8444-4da95d288a42","description":"7d96ac9b-882c-4321-b4fd-71ab1e87bcb4"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"6f05e97a-bed2-4a7e-a057-5b836497e0b3","name":"92740971-247a-4fbc-bdd1-3df43a712265","description":"d5022ce6-f80c-45f6-a8f5-6718cf71590d"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"49d1674a-7744-49d2-b26d-a0ddf73ab199","name":"abe66f33-2321-42ee-80af-707da3a57443","description":"2d70b61e-9492-4dd4-a240-8de73c0b9698"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"0cf5c473-bdcb-45df-a53d-3d127e6cada9","name":"6cb5922a-19db-4c4c-a176-2d959bbc7e50","description":"7d5d5924-d29a-460c-9ca9-9ea8915db305"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"db1838cc-f196-498d-8c6e-342f06c0e475","name":"84293b70-dc5a-48f1-bd89-fb0807a7818b","description":"308bf638-fdbd-4782-b164-072f7b23ade0"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"a7827224-7f62-4025-bf19-31b41a7d0711","name":"c12202e7-47ff-498e-890f-332c2e74b85d","description":"6333cf19-70f5-424d-b75b-25edb2304f29"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"e41e97ba-392d-46a3-9cab-5e11c7c28788","name":"833bbad0-f89c-4620-890a-42d7812243df","description":"116406f1-3f15-4380-87c1-9bde7fdd52d7"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"84404876-75dd-4412-9554-0aeb37f6866e","name":"e29eb07d-48ce-463e-bf1d-15d8fc2bd24a","description":"ef6e2a13-a09e-4757-aafe-3036a82b714c"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"c98f5877-5aa2-4261-be5c-ea3503fb4799","name":"6ec5c4e4-a257-437d-ba44-a3f10f49a795","description":"05afddcd-f3e1-4135-9992-d3db653e2ed0"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"aab35584-7716-47c1-b739-427a3a678450","name":"bd7a9197-6382-4001-9b71-bd7e9e36fc8e","description":"d65bdc00-671d-4dbf-8102-3df2568e8a31"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"00a613ac-6664-411c-b134-5a0fb8e34c3e","name":"6433a85f-c0e5-401b-b29f-6045ea4432b7","description":"3488ebe3-c6f7-4545-b1bf-965f5b38c34d"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"fc448a17-954f-42c0-8e6e-d0b1974886c3","name":"8114245f-7eaa-4ea7-a75e-1fd2b52eeeb3","description":"2717d2b9-29f6-490c-a63f-b50185d7eb03"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"68a98739-f79e-48a3-8613-1d0b2508c519","name":"9a395854-5b3f-4546-b304-f4666bacf80b","description":"f762a41d-6dec-4638-ab34-dd114b7ed9a1"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"816f12c8-d7c5-4a39-ba81-c6daac5ea380","name":"623f5823-4077-48ec-b245-84784b46abd3","description":"93b4b37a-c896-4333-bc6a-5ee4109a41cf"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"1047d2b4-b6c6-4413-94c1-adae1a367917","name":"de6bcfdb-a501-498d-8554-cf075ef3f791","description":"02358778-78d0-4155-a236-e836c28aa410"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"b1c7e3dc-ab49-4297-9b71-a07544e5223e","name":"535c6e38-b3e7-49de-bfda-5544a68e40f8","description":"a05861e8-fbea-4e0e-8930-7df9a9dbd6a6"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"3392d3f2-f93c-48be-9a88-4b988c5fd8f2","name":"98780ac7-69ba-4a57-80aa-e9f6b86a95da","description":"32414088-80a8-4582-aefe-ef1051b4cf93"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"d32061b3-b738-4f4c-9ac8-46f6764a1973","name":"e90e6ea9-fa2b-4f8d-8e4d-bb206c0eb79a","description":"75cb76da-bd0b-4783-b8b5-ecf70e7dc8c6"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"4e86be6b-2cb6-49b7-9129-1a4288fd303a","name":"f7c62002-6fdc-481c-87fa-5c4383b60cb8","description":"39da81a3-e844-4f38-8199-efead6787971"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"37e24ea2-e594-41c7-bd62-02eb156ec982","name":"0a3bc46b-3d0a-40bb-a80a-ed6caf3bdcf5","description":"09489f8a-f1d8-4529-a389-88277bea9427"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"5688424d-29bf-433a-8022-cf2c70d6dd37","name":"19cfab03-c223-426f-8c05-f2b1e8ff4e20","description":"40ce7461-848e-4352-a22f-12929d63ac38"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"36904b64-b0dc-4220-bae6-96178d2b02ac","name":"468e68ed-0677-4592-965c-7062d47dbddd","description":"bc70ce95-dca4-44c7-9a6d-e1720b0c830f"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"bee13085-a600-4084-9ba2-5c740b158d8b","name":"67c9ea59-4b8e-427f-8eaa-009a44bde7b9","description":"93c21563-8e70-4a77-a47a-7178a9234eb9"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"1f244c2e-af58-4d3b-a0ce-6ccb0d57ad63","name":"73908a75-ed06-4f17-8267-45a2ab5195a6","description":"a4e78079-cfb3-4e9c-b0f4-83893de0e4dc"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"6cbfe482-a848-4c19-9fae-a987557f0407","name":"bb79fa10-d98c-4ae0-bf38-32c0a5395080","description":"b4289b45-d58f-4472-925b-3b1ecccff932"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"78f6b720-2ad1-4ae3-b905-f324a836b06b","name":"ca130470-5738-4f4d-83ce-f2b1547dd60e","description":"3f24243e-7fec-4046-8b00-00d20a1d6c0f"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"9b9786c3-7b7a-4408-a56a-b8698eeeee16","name":"19089526-8303-413c-9c84-75dc626b6b58","description":"663fceb4-c488-4997-a459-da152a2295b9"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"f39ca98d-f7ea-482b-8cfb-873e197b6ae0","name":"4fd9202c-f491-4f8c-87c7-21daed0fd9ae","description":"6ef8cfb8-4ac2-4e7c-9e17-2b1a30b42a68"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"bc7fc587-c61f-42b8-901e-1f39b746aa55","name":"25847768-3e79-4a01-9445-5e6b66dabf83","description":"4781b8e9-e9ce-4487-b93c-d878880a3fa4"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"e7fae49d-8019-401b-b55b-73218f12db34","name":"4041f4f8-6344-457b-941f-518b9cd2bbce","description":"5e8dc5e2-1e6f-41b1-afff-5d9bcaa522f9"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"60035f6e-54f8-4a5c-b372-3a977eb7a813","name":"70b5a681-d972-413f-8c75-1d770c2edc10","description":"5dd00ea2-6878-498a-871a-e3d7f69ba02a"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"459234ac-6615-4ad7-bd1d-3250efd9d714","name":"13ad7c24-c68f-4bf5-ac41-3edcb150df29","description":"2b6a4014-6833-49e9-b31a-d5eb58bb6563"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"9270ef65-d149-47ce-9dd5-9412db96872e","name":"0c5c9f98-a747-48c6-96ae-68d33d3e64e7","description":"074bddd6-90fa-4e34-b297-bac20ff414cf"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"4feb9c25-7889-4f1d-acc8-debb4afa4bb6","name":"2be4c924-41d0-4a2c-8e91-0ab352731f77","description":"f47bc17f-91d7-4632-a989-ab12a0009c52"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"abe43b04-d00d-4cef-a48b-2b57bd847e4c","name":"87dd51fa-98e0-43b8-9ad7-fb5f1004bda2","description":"c02c48e3-40da-4450-acf5-e21625ea29a3"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"4951ba55-9f2d-4776-9e9c-a5f0b5137998","name":"4132353c-9af6-4ca9-8969-bc594f822704","description":"a5c7c87a-892e-49b2-b33a-00fcc64d7d80"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"107c0ddc-0915-403f-9478-a89619af01b8","name":"43c22112-ca6a-4b84-8822-8b27170dcbdd","description":"3cb7dc1f-d567-49cb-a9a6-fdb035f3c38c"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"1a9f4115-3c35-4de0-83bb-faff7e8905ec","name":"a7d6c166-aaf7-459f-90da-83659657ee89","description":"0f80cd82-6aee-48cd-80c6-684eab22d8e1"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"66bb1e32-5e74-41b5-874b-6cc0bf863bd5","name":"3f2152c0-390e-4373-bc97-8ecccd67cebb","description":"271e6fde-05d9-491d-9f3c-ff24ae6d055d"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"581258ea-1d86-43e7-9590-edc9dc91df8a","name":"e837dadf-06af-4aa6-98d9-02978b1b9ad2","description":"eb1925b2-02c2-4553-b5e0-50c20e424d82"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"82523f11-d06b-486a-acd2-2728a828ec7c","name":"535ac3f3-f36c-4914-b766-5900bf34050c","description":"06bb692f-35c1-4056-9e7f-2907ebd24d90"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"a5f50a60-84ab-4cbf-b4b1-f5c82b3a124d","name":"1db3dc4a-8ef8-4336-9ae5-71a58e83b495","description":"3ee85f15-b2a4-4b7d-ad1c-cece1b21cbc0"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"462029d1-d6ec-40dd-86be-e73a1a5a9372","name":"134a35d1-e231-4f0f-83b4-b752245dad84","description":"1f488d80-5f17-47e4-b9b8-cde5190a5322"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"39377706-732a-47b3-8ada-1dd720caf83e","name":"de99834b-c309-4267-ae60-5a679e271c00","description":"06867b6b-904a-4644-a494-e4b444dc2ec3"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"2c37b0a6-6b8e-4dc3-9472-dcdcdf3e89cd","name":"202c46d1-9e04-42b0-ade5-bf13c10ba853","description":"727d1d22-adf7-4ada-b550-9cebeea0086f"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"22b7b79c-ddb1-463f-8664-4e41e49418ce","name":"3bf6df1c-be03-4848-be60-a868e6721d31","description":"3f431200-4ff3-4ae6-b5a1-f60990f84e4b"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"96b39da9-8077-432f-835e-5af263d8fb37","name":"58bd6080-97d7-40c8-8c7e-202b70608f4a","description":"d84b97b2-49f6-4e2a-a1a3-30bf8a234565"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"c16ce1cb-6098-4981-9567-909de05ef1b8","name":"f74c67b4-73f2-478a-ad5e-886fec6771aa","description":"2567eaf5-a9d9-4e67-8627-f8c392524831"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"58b0bf78-1ca1-4904-a60b-4fb727bb8b19","name":"b08f38eb-0ac8-45b5-b7e8-cb78ce0fc3a6","description":"f72daedd-68c2-483c-8ee5-65f114f99133"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"0f29c54d-ddea-48e6-95a0-58ce8e78b37d","name":"a5baabdc-3e23-4fbd-b2f2-c98531dfbc8e","description":"3716353e-90a3-4b09-b502-ed18f51701ab"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"c1f78f1c-191a-4217-868d-1f78364e2442","name":"e8cbe7eb-7f64-4520-ab6d-8dde2689b874","description":"cae949be-71e6-4c41-8f98-0ce70f7b3a38"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"97006bb1-b179-436b-8589-9d8d3f0fb68f","name":"1b4432fd-87d3-4d8a-a929-7eaa7770991f","description":"b85595f4-c795-41ef-b39f-efe0743aecf5"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"3345b507-c0a0-480f-9a1b-0dc1c123e489","name":"367ed46d-ac1b-4b6f-95b1-07897016a16d","description":"edee985b-9853-4f32-9638-378ed6e14a5a"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"65188feb-c1f6-488e-9f8f-18a0f97c9fc8","name":"f6971a62-c8ae-4d0f-9d3c-924db009fa5b","description":"680e4ea9-e7e5-4d96-8d41-9a035750eb0c"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"e4bbad13-2657-4fab-b0be-7a510ef8eebd","name":"ca7f38a1-7228-4961-bd63-76097148de48","description":"9ff18207-7e2a-4574-afbf-0600d5b35fd4"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"0f34dbe6-5303-47f7-a2e7-3214a206a48f","name":"7eaac3be-0b52-4a28-81fb-c73e259aed20","description":"e4114c41-acf7-4c7f-b062-9dab3c06a9f2"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"ffc86e32-89a0-4594-9a6c-56d75bae6e50","name":"bad9ad70-a7d1-44e2-bbd4-309082ca2f97","description":"eeafbda0-7d15-4aab-a267-1be1be705863"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"06170be7-8644-465b-ae20-339f331e5563","name":"65cdaf62-b5f0-4ab2-8ea6-27df5d6978f3","description":"13bca9cb-2f00-4f21-a02d-8e92cbf76eb5"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"fcfd9857-5f11-4c45-920f-80448deaed8b","name":"13970d97-637a-4867-82af-83887afb1435","description":"d16dd260-25b0-4233-8091-0155dfb7b41d"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"d85cfa7c-9a24-4ca5-856c-29f44e12b6ba","name":"59ca0e43-11bc-40ad-a67d-cc1332131a8d","description":"58563f39-b1c7-4563-913e-05ba75026c61"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"8e7b3c9e-c9cf-4f75-a268-49e87ffc3155","name":"62acb0bc-9c64-4164-980c-d91b666b574d","description":"df56a0ac-29cb-447c-a2eb-18a9b6027ef6"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"6d682821-fece-4842-b2b3-153b78dbce12","name":"4f6755de-7065-49de-9de5-ff7dbaa62fdc","description":"b817b1ff-82f5-4a69-9afc-f2ad0e2e82a9"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"29769801-ca5b-44ee-942e-ae372cc4a466","name":"16734380-df21-4062-b084-ca375f90a48d","description":"81ff9c16-3fc9-446b-8afb-d725e21b8f24"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"be1ee9c0-94a0-49b2-b868-41761cf4fde9","name":"dd95d38d-af02-4771-9dce-e17005849ac2","description":"d718dfff-cc55-4adc-bc8a-394be0d5ae8f"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"6c794b77-04c4-4ba4-818c-078c668727cb","name":"bdcfe2f2-a034-4e90-aa5e-46e86e9567fa","description":"aa630450-aee2-4d7e-88f8-bf121ce5204e"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"b269e1e6-c56c-4872-9c17-d5930dd4d3eb","name":"1da0703b-5200-4b93-bd83-5ee6d5738dbd","description":"61f36f56-3a07-4525-954c-22c2b41567a5"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"f3665aac-44fb-4c88-b031-b0b0d843d37f","name":"4c93da9d-6ff0-4c70-84f7-d56dc37ec5cd","description":"eeb185fb-d07c-47db-9811-f327766a75bd"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"dffb04b3-2adf-4776-9a02-b0bae605c646","name":"971d6019-38a5-452b-9853-fdac05f78953","description":"ce249d3a-7d4d-4ab5-b9da-dc002ab2b245"},{"accountId":"0a14c757-895b-4f6c-95ac-e3343142bd7f","id":"41b2aa59-318d-4b4f-9737-42ed441618fb","name":"fe924026-0521-4081-be6e-16c9af185ef7","description":"2b45b979-9041-4e61-9a74-661311dbd118"}];
        const accountId = items[0].accountId;
        // const items = new Array(itemCount)
        //     .fill({})
        //     .map(createItem);
        //
        await entity.put(items).go();
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
        // console.log(JSON.stringify({
        //     results: results.sort((a, z) => a.id.localeCompare(z.id)),
        //     items: items.sort((a, z) => a.id.localeCompare(z.id))
        // }, null, 4));
        expect(
            items.sort((a, z) => a.id.localeCompare(z.id))
        ).to.deep.equal(
            results.sort((a, z) => a.id.localeCompare(z.id))
        );
    });
});