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
const sleep = async (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const SERVICE = "BugBeater";
const ENTITY = "TEST_ENTITY";
const table = "electro";

describe("Entity", async () => {
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

    describe("Simple crud", async () => {
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
            expect(putOne).to.deep.equal({
                id: putOne.id,
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
                    }).go(),
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
                .go();

            let mallOneMatches = mallOneStores.every((store) =>
                mallOneIds.includes(store.id),
            );

            expect(mallOneMatches);
            expect(mallOneStores).to.be.an("array").and.have.length(5);

            let first = stores[0];
            let firstStore = await MallStores.get({
                sector,
                id: first.id,
            }).go();
            expect(firstStore).to.be.deep.equal(first);

            let buildingsAfterB = await MallStores.query
                .categories({ category, mall: mallOne })
                .gt({ building: "BuildingB" })
                .go();
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
                .go();

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
            let secondStoreBeforeUpdate = await MallStores.get(secondStore).go();
            let newRent = "5000.00";
            expect(secondStoreBeforeUpdate?.rent)
                .to.equal(rent)
                .and.to.not.equal(newRent);
            let updatedStore = await MallStores.update(secondStore)
                .set({ rent: newRent })
                .go();
            expect(updatedStore).to.be.empty;
            let secondStoreAfterUpdate = await MallStores.get(secondStore).go();
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
            let recordOne = await MallStores.create(record).go();
            // mall would be changed by the setter;
            expect(recordOne).to.deep.equal({...record, mall: mall + "abc"});
            let recordTwo = null;
            try {
                recordTwo = await MallStores.create(record).go();
            } catch(err) {
                expect(err.message).to.be.equal("The conditional request failed - For more detail on this error reference: https://github.com/tywalch/electrodb#aws-error");
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
            let recordOne = await MallStores.create(record).go();
            // mall would be changed by the setter
            expect(recordOne).to.deep.equal({...record, mall: mall + "abc"});
            let patchResultsOne = await MallStores.patch({sector, id}).set({rent: "100.00"}).go();
            let patchResultsTwo = null;
            try {
                patchResultsTwo = await MallStores.patch({sector, id: `${id}-2`}).set({rent: "200.00"}).go();
            } catch(err) {
                expect(err.message).to.be.equal("The conditional request failed - For more detail on this error reference: https://github.com/tywalch/electrodb#aws-error");
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
                "Requested resource not found - For more detail on this error reference: https://github.com/tywalch/electrodb#aws-error",
                "Cannot do operations on a non-existent table - For more detail on this error reference: https://github.com/tywalch/electrodb#aws-error"
            ].includes(electroErr.message)).to.be.true;
            expect(originalSuccess).to.be.false;
            expect(originalErr.stack.split(/\r?\n/)[1].includes("aws-sdk")).to.be.true;
        });
    });

    describe("Simple crud without sort key", async () => {
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
            }).go();
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
                    }).go(),
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
                .go();

            let mallOneMatches = mallOneStores.every((store) =>
                mallOneIds.includes(store.id),
            );

            expect(mallOneMatches);
            expect(mallOneStores).to.be.an("array").and.have.length(5);

            let first = stores[0];
            let firstStore = await MallStores.get({
                sector,
                id: first.id,
            }).go();
            expect(firstStore).to.be.deep.equal(first);

            let buildingsAfterB = await MallStores.query
                .categories({ category, mall: mallOne })
                .gt({ building: "BuildingB" })
                .go();
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
                .go();

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
            let secondStoreBeforeUpdate = await MallStores.get(secondStore).go();
            let newRent = "5000.00";
            expect(secondStoreBeforeUpdate?.rent)
                .to.equal(rent)
                .and.to.not.equal(newRent);
            let updatedStore = await MallStores.update(secondStore)
                .set({ rent: newRent })
                .go();
            expect(updatedStore).to.be.empty;
            let secondStoreAfterUpdate = await MallStores.get(secondStore).go();
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
            let recordOne = await MallStores.create(record).go();
            expect(recordOne).to.deep.equal(record);
            let recordTwo = null;
            try {
                recordTwo = await MallStores.create(record).go();
            } catch(err) {
                expect(err.message).to.be.equal("The conditional request failed - For more detail on this error reference: https://github.com/tywalch/electrodb#aws-error");
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
            let recordOne = await MallStores.create(record).go();
            expect(recordOne).to.deep.equal(record);
            let patchResultsTwo = null;
            try {
                patchResultsTwo = await MallStores.patch({sector, id: `${id}-2`}).set({rent: "200.00"}).go();
            } catch(err) {
                expect(err.message).to.be.equal("The conditional request failed - For more detail on this error reference: https://github.com/tywalch/electrodb#aws-error");
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
                "Requested resource not found - For more detail on this error reference: https://github.com/tywalch/electrodb#aws-error",
                "Cannot do operations on a non-existent table - For more detail on this error reference: https://github.com/tywalch/electrodb#aws-error"
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
            await labeler.put([item1, item2]).go();
            await sleep(500);
            let beginsWithIsle = await labeler.query.locations({section}).begins({isle: "A2"}).go();
            let specificIsle = await labeler.query.locations({section, isle: "A2"}).go();
            expect(beginsWithIsle).to.be.an("array").with.lengthOf(2);
            expect(beginsWithIsle).to.be.deep.equal([item1, item2]);
            expect(specificIsle).to.be.an("array").with.lengthOf(1);
            expect(specificIsle).to.be.deep.equal([item1]);
        })
    });

    describe("Custom index fields", async () => {
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
    describe("Delete records", async () => {
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
            let recordExists = await record.get({ prop1, prop2 }).go();
            await record.delete({ prop1, prop2 }).go();
            await sleep(150);
            let recordNoLongerExists = await record.get({ prop1, prop2 }).go();
            expect(!!Object.keys(recordExists || {}).length).to.be.true;
            expect(recordNoLongerExists).to.be.null;
        });
    });

    describe("Getters/Setters", async () => {
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
            let record = await db.put({ date, id, prop1, prop2 }).go();
            expect(record).to.deep.equal({
                id,
                date,
                prop1: `${prop1} SET ${id} GET`,
                prop2: `${prop2} GET ${id}`,
            });
            let fetchedRecord = await db.get({ date, id }).go();
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
                .go();
            expect(updatedRecord).to.be.empty;
            let getUpdatedRecord = await db.get({ date, id }).go();
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
            let putRecord = await db.put({ id, date, someValue }).go({ raw: true });
            expect(putRecord).to.deep.equal({});
            let getRecord = await db.get({ id, date }).go({ raw: true });
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
                .go({ raw: true });
            expect(updateRecord).to.deep.equal({});
            let queryRecord = await db.query.record({ id, date }).go({ raw: true });
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
            let recordWithKeys = await db.get({id, date}).go({includeKeys: true});
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
    describe("Filters", async () => {
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
                    }).go(),
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
                .go();

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
            let record = await db.put({ date, property }).go();
            let found = await db.query
                .record({ date })
                .where((attr, {eq}) => eq(attr.property, property))
                .go();

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
                    return db.put({ id, property, color }).go();
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
                .go();

            expect(found)
                .to.be.an("array")
                .and.have.length(expectedMembers.length)
                .and.to.have.deep.members(expectedMembers);
        });
    });
    describe("Updating Records", async () => {
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
            } catch(err) {
                expect(err).to.not.be.null;
                expect(err.message).to.equal('Incomplete composite attributes: Without the composite attributes "prop7", "prop8" the following access patterns cannot be updated: "index3"  - For more detail on this error reference: https://github.com/tywalch/electrodb#incomplete-composite-attributes');
            }
        });

        it("Should not allow the gsis with partially complete PKs or SKs to be patched", async () => {
            try {
                await Dummy.patch({prop1: "abc", prop2: "def"})
                    .set({prop9: "propz9", prop6: "propz6"})
                    .go()
                throw null;
            } catch(err) {
                expect(err).to.not.be.null;
                expect(err.message).to.equal(`Incomplete composite attributes: Without the composite attributes "prop7", "prop8" the following access patterns cannot be updated: "index3"  - For more detail on this error reference: https://github.com/tywalch/electrodb#incomplete-composite-attributes`);
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
                KeyConditionExpression: '#pk = :pk and begins_with(#sk1, :sk1)',
                TableName: 'electro',
                ExpressionAttributeNames: { '#pk': 'gsi2pk', '#sk1': 'gsi2sk' },
                ExpressionAttributeValues: {
                    ':pk': `$test#prop5_${record.prop5}`,
                    ':sk1': `$dummy_1#prop6_${record.prop6}#prop7_${record.prop7}#prop8_${record.prop8}`
                },
                IndexName: 'gsi2pk-gsi2sk-index'
            });
            let beforeUpdate = await Dummy.query.index3({prop5: record.prop5, prop6: record.prop6, prop7: record.prop7, prop8: record.prop8}).go();
            expect(beforeUpdate).to.be.an("array").with.lengthOf(1).and.to.deep.equal([record]);
            await Dummy.update({prop1: record.prop1, prop2: record.prop2})
                .set({prop9, prop5})
                .go();
            await sleep(100);
            let afterUpdateQueryParams = Dummy.query.index3({prop5, prop6: record.prop6, prop7: record.prop7, prop8: record.prop8}).params();
            expect(afterUpdateQueryParams).to.deep.equal({
                KeyConditionExpression: '#pk = :pk and begins_with(#sk1, :sk1)',
                TableName: 'electro',
                ExpressionAttributeNames: { '#pk': 'gsi2pk', '#sk1': 'gsi2sk' },
                ExpressionAttributeValues: {
                    ':pk': `$test#prop5_${prop5}`,
                    ':sk1': `$dummy_1#prop6_${record.prop6}#prop7_${record.prop7}#prop8_${record.prop8}`
                },
                IndexName: 'gsi2pk-gsi2sk-index'
            });
            let afterUpdate = await Dummy.query.index3({prop5, prop6: record.prop6, prop7: record.prop7, prop8: record.prop8}).go();
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
                KeyConditionExpression: '#pk = :pk and begins_with(#sk1, :sk1)',
                TableName: 'electro',
                ExpressionAttributeNames: { '#pk': 'gsi2pk', '#sk1': 'gsi2sk' },
                ExpressionAttributeValues: {
                    ':pk': `$test#prop5_${record.prop5}`,
                    ':sk1': `$dummy_1#prop6_${record.prop6}#prop7_${record.prop7}#prop8_${record.prop8}`
                },
                IndexName: 'gsi2pk-gsi2sk-index'
            });
            let beforeUpdate = await Dummy.query.index3({prop5: record.prop5, prop6: record.prop6, prop7: record.prop7, prop8: record.prop8}).go();
            expect(beforeUpdate).to.be.an("array").with.lengthOf(1).and.to.deep.equal([record]);
            await Dummy.patch({prop1: record.prop1, prop2: record.prop2})
                .set({prop9, prop5})
                .go();
            await sleep(100);
            let afterUpdateQueryParams = Dummy.query.index3({prop5, prop6: record.prop6, prop7: record.prop7, prop8: record.prop8}).params();
            expect(afterUpdateQueryParams).to.deep.equal({
                KeyConditionExpression: '#pk = :pk and begins_with(#sk1, :sk1)',
                TableName: 'electro',
                ExpressionAttributeNames: { '#pk': 'gsi2pk', '#sk1': 'gsi2sk' },
                ExpressionAttributeValues: {
                    ':pk': `$test#prop5_${prop5}`,
                    ':sk1': `$dummy_1#prop6_${record.prop6}#prop7_${record.prop7}#prop8_${record.prop8}`
                },
                IndexName: 'gsi2pk-gsi2sk-index'
            });
            let afterUpdate = await Dummy.query.index3({prop5, prop6: record.prop6, prop7: record.prop7, prop8: record.prop8}).go();
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
            await Dummy.put(record).go();
            await sleep(100);
            let beforeUpdateQueryParams = Dummy.query.index2({prop3: record.prop3, prop4: record.prop4}).params();
            expect(beforeUpdateQueryParams).to.deep.equal({
                KeyConditionExpression: '#pk = :pk and begins_with(#sk1, :sk1)',
                TableName: 'electro',
                ExpressionAttributeNames: { '#pk': 'gsi1pk', '#sk1': 'gsi1sk' },
                ExpressionAttributeValues: {
                    ':pk': `$test#prop3_${record.prop3}`,
                    ':sk1': `$dummy_1#prop4_${record.prop4}`
                },
                IndexName: 'gsi1pk-gsi1sk-index'
            });
            let beforeUpdate = await Dummy.query.index2({prop3: record.prop3, prop4: record.prop4}).go();
            expect(beforeUpdate).to.be.an("array").with.lengthOf(1).and.to.deep.equal([record]);
            await Dummy.update({prop1: record.prop1, prop2: record.prop2})
                .set({prop9, prop4})
                .go();
            await sleep(100);
            let afterUpdateQueryParams = Dummy.query.index2({prop3: record.prop3, prop4}).params();
            expect(afterUpdateQueryParams).to.deep.equal({
                KeyConditionExpression: '#pk = :pk and begins_with(#sk1, :sk1)',
                TableName: 'electro',
                ExpressionAttributeNames: { '#pk': 'gsi1pk', '#sk1': 'gsi1sk' },
                ExpressionAttributeValues: {
                    ':pk': `$test#prop3_${record.prop3}`,
                    ':sk1': `$dummy_1#prop4_${prop4}`
                },
                IndexName: 'gsi1pk-gsi1sk-index'
            });
            let afterUpdate = await Dummy.query.index2({prop3: record.prop3, prop4}).go();
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
                KeyConditionExpression: '#pk = :pk and begins_with(#sk1, :sk1)',
                TableName: 'electro',
                ExpressionAttributeNames: { '#pk': 'gsi1pk', '#sk1': 'gsi1sk' },
                ExpressionAttributeValues: {
                    ':pk': `$test#prop3_${record.prop3}`,
                    ':sk1': `$dummy_1#prop4_${record.prop4}`
                },
                IndexName: 'gsi1pk-gsi1sk-index'
            });
            let beforeUpdate = await Dummy.query.index2({prop3: record.prop3, prop4: record.prop4}).go();
            expect(beforeUpdate).to.be.an("array").with.lengthOf(1).and.to.deep.equal([record]);
            await Dummy.patch({prop1: record.prop1, prop2: record.prop2})
                .set({prop9, prop4})
                .go();
            await sleep(100);
            let afterUpdateQueryParams = Dummy.query.index2({prop3: record.prop3, prop4}).params();
            expect(afterUpdateQueryParams).to.deep.equal({
                KeyConditionExpression: '#pk = :pk and begins_with(#sk1, :sk1)',
                TableName: 'electro',
                ExpressionAttributeNames: { '#pk': 'gsi1pk', '#sk1': 'gsi1sk' },
                ExpressionAttributeValues: {
                    ':pk': `$test#prop3_${record.prop3}`,
                    ':sk1': `$dummy_1#prop4_${prop4}`
                },
                IndexName: 'gsi1pk-gsi1sk-index'
            });
            let afterUpdate = await Dummy.query.index2({prop3: record.prop3, prop4}).go();
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
                }).go();

                const updateParams1 = db[method]({id, sub})
                    .add({prop6: ['tsr']})
                    .append({prop3: [{prop4: "ghi", prop5: 789}]})
                    .params<{ ReturnValues: string }>({response: "updated_new"});

                expect(updateParams1.ReturnValues).to.equal("UPDATED_NEW");

                const update1 = await db[method]({id, sub})
                    .add({prop6: ['tsr']})
                    .append({prop3: [{prop4: "ghi", prop5: 789}]})
                    .go({response: "updated_new"});

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
                }).go();

                const updateParams1 = db[method]({id, sub})
                    .add({prop6: ['tsr']})
                    .append({prop3: [{prop4: "ghi", prop5: 789}]})
                    .params<{ ReturnValues: string }>({response: "all_new"});

                expect(updateParams1.ReturnValues).to.equal("ALL_NEW");

                const update1 = await db[method]({id, sub})
                    .add({prop6: ['tsr']})
                    .append({prop3: [{prop4: "ghi", prop5: 789}]})
                    .go({response: "all_new"});

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
                }).go();

                const updateParams1 = db[method]({id, sub})
                    .add({prop6: ['tsr']})
                    .append({prop3: [{prop4: "ghi", prop5: 789}]})
                    .params<{ ReturnValues: string }>({response: "all_old"});

                expect(updateParams1.ReturnValues).to.equal("ALL_OLD");

                const update1 = await db[method]({id, sub})
                    .add({prop6: ['tsr']})
                    .append({prop3: [{prop4: "ghi", prop5: 789}]})
                    .go({response: "all_old"});

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
                    .go({response: "updated_old"});

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
                }).go();

                const updateParams1 = db[method]({id, sub})
                    .add({prop6: ['tsr']})
                    .append({prop3: [{prop4: "ghi", prop5: 789}]})
                    .params<{ ReturnValues: string }>({response: "none"});

                expect(updateParams1.ReturnValues).to.equal("NONE");

                const update1 = await db[method]({id, sub})
                    .add({prop6: ['tsr']})
                    .append({prop3: [{prop4: "ghi", prop5: 789}]})
                    .go({response: "none"});

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
                }).go();

                const deleteParams1: any = db[method]({id, sub}).params({response: "all_old"});

                expect(deleteParams1.ReturnValues).to.equal("ALL_OLD");

                const delete1 = await db[method]({id, sub})
                    .go({response: "all_old"});

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
                }).go();

                const deleteParams1: any = db[method]({id, sub}).params({response: "none"});

                expect(deleteParams1.ReturnValues).to.equal("NONE");

                const delete1 = await db[method]({id, sub})
                    .go({response: "none"});

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
                }).go({response: "none"});

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
            expect(parsed).to.deep.equal({prop1, prop2, prop3});
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
                KeyConditionExpression: '#pk = :pk and begins_with(#sk1, :sk1)',
                TableName: 'electro',
                ExpressionAttributeNames: { '#pk': 'pk', '#sk1': 'sk' },
                ExpressionAttributeValues: {
                    ':pk': `$testing#prop1_${prop1}`,
                    ':sk1': `$parse_test_1#prop2_${prop2}`
                }
            }
            const itemFromDocClient = await client.query(params).promise();
            const parsed = entity.parse(itemFromDocClient);
            expect(parsed).to.deep.equal([{prop1, prop2, prop3}]);
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
            expect(parsed).to.deep.equal({prop3: prop3b});
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
            expect(parsed1).to.be.null;
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

            const results2 = await client.update(params).promise();
            const parsed2 = entity.parse(results2);
            expect(parsed2).to.be.null;
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
            expect(parsed).to.deep.equal({prop1, prop2, prop3});
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
            expect(parsed).to.deep.equal({
                prop1: prop1a,
                prop2: prop2a,
                prop3: prop3a,
            });
        });

        it("should parse the response from a scan", async () => {
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
                TableName: 'electro',
                ReturnValues: 'ALL_OLD',
                ExpressionAttributeNames: {
                    '#pk': 'pk',
                    '#sk': 'sk',
                },
                ExpressionAttributeValues: {
                    ':pk': '$testing#prop1_',
                    ':sk': `$parse_test_1#prop2_${prop2}`,
                },
                FilterExpression: 'begins_with(#pk, :pk) AND begins_with(#sk, :sk)'
            }
            const results = await client.scan(params).promise();
            const parsed = entity.parse(results);
            expect(parsed).to.deep.equal([{prop1, prop2, prop3}]);
        });
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
            const oldPut = await entity.put(oldRecord).go();
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
            const newPut = await entity.put(newRecord).go();
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
                UpdateExpression: 'SET #createdAt = :createdAt_u0, #incrementId = #incrementId + :incrementId_u0',
                ExpressionAttributeNames: { '#createdAt': 'createdAt', '#incrementId': 'incrementId' },
                ExpressionAttributeValues: { ':createdAt_u0': `pre#${createdAt}#post`, ':incrementId_u0': 1 },
                TableName: 'electro_keynamesattributenames',
                Key: {
                    accountId: `PREFIX_${newRecord.accountId.toUpperCase()}_POSTFIX`,
                    organizationId: `Prefix_${newRecord.organizationId}_postfiX`,
                }
            });

            const newUpdate = await entity.update(newRecord)
                .set({createdAt})
                .add({incrementId: 1})
                .go({response: "all_new"});

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
            const newGet = await entity.get(newRecord).go();
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
                KeyConditionExpression: '#pk = :pk and begins_with(#sk1, :sk1)',
                TableName: 'electro_keynamesattributenames',
                ExpressionAttributeNames: { '#pk': 'organizationId', '#sk1': 'accountId' },
                ExpressionAttributeValues: {
                    ':pk': `Prefix_${newRecord.organizationId}_postfiX`,
                    ':sk1': `PREFIX_${newRecord.accountId.toUpperCase()}_POSTFIX`,
                }
            });
            const query1 = await entity.query.organization(newRecord).go();
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
                .go();

            expect(query2).to.deep.equal([{...newUpdate, incrementId: 1}]);

            const newPaginate = await entity.query
                .onboarded({type: newRecord.type})
                .where(({accountId}, {eq}) => eq(accountId, newRecord.accountId.toUpperCase()))
                .page(oldRecord);

            expect(newPaginate).to.deep.equal([null, [{...newUpdate, incrementId: 1}]]);
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
            }).to.throw('Invalid use of a collection on index "(Primary Index)". The sk field "accountId" shares a field name with an attribute defined on the Entity, and therefore the index is not allowed to participate in a Collection. Please either change the field name of the attribute, or remove all collection(s) from the index. - For more detail on this error reference: https://github.com/tywalch/electrodb#invalid-collection-on-index-with-attribute-field-names');
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
            }).to.throw('definition for "sk" field on index "(Primary Index)". Index templates may only have prefix or postfix values on "string" or "enum" type attributes. The sk field "incrementId" is type "number", and therefore cannot be used with prefixes or postfixes. Please either remove the prefixed or postfixed values from the template or change the field name of the attribute. - For more detail on this error reference: https://github.com/tywalch/electrodb#invalid-index-with-attribute-name');
        });
    });
});