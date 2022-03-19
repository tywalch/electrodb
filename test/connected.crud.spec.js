const sleep = async (ms) => new Promise((resolve) => setTimeout(resolve, ms));

process.env.AWS_NODEJS_CONNECTION_REUSE_ENABLED = 1;
const { Entity } = require("../src/entity");
const { Service } = require("../src/service");
const c = require('../src/client');
const { expect } = require("chai");
const uuid = require("uuid").v4;
const moment = require("moment");
const DynamoDB = require("aws-sdk/clients/dynamodb");
const v3DynamoDB = require('@aws-sdk/client-dynamodb');
const v2Client = new DynamoDB.DocumentClient({
	region: "us-east-1",
	endpoint: process.env.LOCAL_DYNAMO_ENDPOINT
});
const v3Client = new v3DynamoDB.DynamoDBClient({
	region: "us-east-1",
	endpoint: process.env.LOCAL_DYNAMO_ENDPOINT
});

const table = "electro";
const SERVICE = "BugBeater";
// const ENTITY = "TEST_ENTITY";
const createModel = (entityName) => {
	return {
		entity: entityName,
		service: SERVICE,
		table,
		version: "1",
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
				set: (mall) => {
					return mall + "abc";
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
					field: "pk",
					facets: ["sector"],
				},
				sk: {
					field: "sk",
					facets: ["id"],
				},
			},
			units: {
				index: "gsi1pk-gsi1sk-index",
				pk: {
					field: "gsi1pk",
					facets: ["mall"],
				},
				sk: {
					field: "gsi1sk",
					facets: ["building", "unit", "store"],
				},
			},
			leases: {
				index: "gsi2pk-gsi2sk-index",
				pk: {
					field: "gsi2pk",
					facets: ["mall"],
				},
				sk: {
					field: "gsi2sk",
					facets: ["leaseEnd", "store", "building", "unit"],
				},
			},
			categories: {
				index: "gsi3pk-gsi3sk-index",
				pk: {
					field: "gsi3pk",
					facets: ["mall"],
				},
				sk: {
					field: "gsi3sk",
					facets: ["category", "building", "unit", "store"],
				},
			},
			shops: {
				index: "gsi4pk-gsi4sk-index",
				pk: {
					field: "gsi4pk",
					facets: ["store"],
				},
				sk: {
					field: "gsi4sk",
					facets: ["mall", "building", "unit"],
				},
			},
		},
		filters: {
			maxRent({ rent }, max) {
				return rent.lte(max);
			},
		},
	}
}

for (const [clientVersion, client] of [[c.DocumentClientVersions.v2, v2Client], [c.DocumentClientVersions.v3, v3Client]]) {
	const entityName = uuid();
	const model = createModel(entityName);
	describe(`Running tests with ${clientVersion} client`, () => {
		describe("Entity", async () => {
			before(async () => sleep(1000));
			let MallStores = new Entity(model, { client });
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
				it("Should return null when item retrieved does not exist", async () => {
					let data = await MallStores.get({sector: "does_not_exist", id: "also_does_not_exist"}).go();
					expect(data).to.be.null;
				})
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
					expect(secondStoreBeforeUpdate.rent)
						.to.equal(rent)
						.and.to.not.equal(newRent);
					let updatedStore = await MallStores.update(secondStore)
						.set({ rent: newRent })
						.go();
					expect(updatedStore).to.be.empty;
					let secondStoreAfterUpdate = await MallStores.get(secondStore).go();
					expect(secondStoreAfterUpdate.rent).to.equal(newRent);
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
				const entity = uuid();
				const MallStores = new Entity({
					model: {
						entity,
						service: SERVICE,
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
								facets: ["sector", "id"],
							}
						},
						units: {
							index: "idx1",
							pk: {
								field: "partition_key_idx1",
								facets: ["mall"],
							},
							sk: {
								field: "sort_key_idx1",
								facets: ["building", "unit", "store"],
							},
						},
						leases: {
							index: "idx2",
							pk: {
								field: "partition_key_idx2",
								facets: ["mall"],
							}
						},
						categories: {
							index: "gsi3pk-gsi3sk-index",
							pk: {
								field: "gsi3pk",
								facets: ["mall"],
							},
							sk: {
								field: "gsi3sk",
								facets: ["category", "building", "unit", "store"],
							},
						},
						shops: {
							index: "gsi4pk-gsi4sk-index",
							pk: {
								field: "gsi4pk",
								facets: ["store"],
							},
							sk: {
								field: "gsi4sk",
								facets: ["mall", "building", "unit"],
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
					expect(secondStoreBeforeUpdate.rent)
						.to.equal(rent)
						.and.to.not.equal(newRent);
					let updatedStore = await MallStores.update(secondStore)
						.set({ rent: newRent })
						.go();
					expect(updatedStore).to.be.empty;
					let secondStoreAfterUpdate = await MallStores.get(secondStore).go();
					expect(secondStoreAfterUpdate.rent).to.equal(newRent);
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

			describe("Tailing labels", async () => {
				it("Should include tailing label if chained query methods are not used", async () => {
					let labeler = new Entity({
						model: {
							service: "inventory",
							entity: uuid(),
							version: "1",
						},
						attributes: {
							section: "string",
							isle: "string",
							name: "string",
						},
						indexes: {
							locations: {
								pk: {
									field: "pk",
									facets: ["section"],
								},
								sk: {
									field: "sk",
									facets: ["isle", "name"]
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
				});

				it("Should update 'empty' composite sort keys when a GSI Partition Key is updated", async () => {
					const entityName = uuid();
					const entity = new Entity({
						model: {
							service: "inventory",
							entity: entityName,
							version: "1",
						},
						attributes: {
							section: {
								type: "string"
							},
							isle: {
								type: "string"
							},
							name: {
								type: "string"
							},
						},
						indexes: {
							isles: {
								pk: {
									field: "pk",
									composite: ["section"]
								},
								sk: {
									field: "sk",
									composite: ["isle"]
								}
							},
							location: {
								index: "gsi1pk-gsi1sk-index",
								pk: {
									field: "gsi1pk",
									composite: ["name"],
								},
								sk: {
									field: "gsi1sk",
									composite: [],
								},
							}
						}
					}, {table, client});
					const section = uuid();
					const isle = "14";
					const name = "cookies";
					const putParamsWithSparseSK = entity.put({section, isle}).params();
					const updateParamsWithSparseSK = entity.update({section, isle}).set({name}).params();
					const queryParamsWithSparseSK = entity.query.location({name}).params();
					expect(putParamsWithSparseSK).to.deep.equal({
						"Item": {
							"section": section,
							"isle": "14",
							"pk": `$inventory#section_${section}`,
							"sk": `$${entityName}_1#isle_14`,
							"__edb_e__": entityName,
							"__edb_v__": "1"
						},
						"TableName": "electro"
					});
					expect(updateParamsWithSparseSK).to.deep.equal({
						"UpdateExpression": "SET #name = :name_u0, #gsi1pk = :gsi1pk_u0, #gsi1sk = :gsi1sk_u0, #section = :section_u0, #isle = :isle_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0",
						"ExpressionAttributeNames": {
							"#name": "name",
							"#gsi1pk": "gsi1pk",
							"#gsi1sk": "gsi1sk",
							"#isle": "isle",
							"#section": "section", "#__edb_e__": "__edb_e__", "#__edb_v__": "__edb_v__"
						},
						"ExpressionAttributeValues": {
							":name_u0": "cookies",
							":gsi1pk_u0": "$inventory#name_cookies",
							":gsi1sk_u0": `$${entityName}_1`,
							":isle_u0": "14",
							":section_u0": section, ":__edb_e___u0": entityName, ":__edb_v___u0": "1"
						},
						"TableName": "electro",
						"Key": {
							"pk": `$inventory#section_${section}`,
							"sk": `$${entityName}_1#isle_14`
						}
					});
					expect(queryParamsWithSparseSK).to.deep.equal({
						"KeyConditionExpression": "#pk = :pk and begins_with(#sk1, :sk1)",
						"TableName": "electro",
						"ExpressionAttributeNames": {
							"#pk": "gsi1pk",
							"#sk1": "gsi1sk"
						},
						"ExpressionAttributeValues": {
							":pk": "$inventory#name_cookies",
							":sk1": `$${entityName}_1`
						},
						"IndexName": "gsi1pk-gsi1sk-index"
					});

					await entity.put({section, isle}).go();
					const queryRecordWithSparseSK = await entity.query.location({name}).go();
					expect(queryRecordWithSparseSK).to.deep.equal([]);
					await entity.update({section, isle}).set({name}).go();
					const queryRecordWithSK = await entity.query.location({name}).go();
					expect(queryRecordWithSK).to.deep.equal([{section, isle, name}]);
				});

				it("Should not update sort keys when a GSI Partition Key is updated on an index without an sk", async () => {
					const entityName = uuid();
					const table = "electro_nosort";
					const entity = new Entity({
						model: {
							service: "inventory",
							entity: entityName,
							version: "1",
						},
						attributes: {
							section: {
								type: "string"
							},
							isle: {
								type: "string"
							},
							name: {
								type: "string"
							},
						},
						indexes: {
							isles: {
								pk: {
									field: "partition_key",
									composite: ["section", "isle"]
								}
							},
							location: {
								index: "idx2",
								pk: {
									field: "partition_key_idx2",
									composite: ["name"],
								}
							}
						}
					}, {table, client});
					const section = uuid();
					const isle = "14";
					const name = "cookies";
					const putParamsWithSparseSK = entity.put({section, isle}).params();
					const updateParamsWithSparseSK = entity.update({section, isle}).set({name}).params();
					const queryParamsWithSparseSK = entity.query.location({name}).params();
					expect(putParamsWithSparseSK).to.deep.equal({
						"Item": {
							"section": section,
							"isle": "14",
							"partition_key": `$inventory$${entityName}_1#section_${section}#isle_14`,
							"__edb_e__": entityName,
							"__edb_v__": "1"
						},
						"TableName": table
					});
					expect(updateParamsWithSparseSK).to.deep.equal({
						"UpdateExpression": "SET #name = :name_u0, #partition_key_idx2 = :partition_key_idx2_u0, #section = :section_u0, #isle = :isle_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0",
						"ExpressionAttributeNames": {
							"#name": "name",
							"#partition_key_idx2": "partition_key_idx2",
							"#isle": "isle",
							"#section": "section", "#__edb_e__": "__edb_e__", "#__edb_v__": "__edb_v__"
						},
						"ExpressionAttributeValues": {
							":name_u0": "cookies",
							":partition_key_idx2_u0": `$inventory$${entityName}_1#name_cookies`,
							":isle_u0": "14",
							":section_u0": section, ":__edb_e___u0": entityName, ":__edb_v___u0": "1"
						},
						"TableName": table,
						"Key": {
							"partition_key": `$inventory$${entityName}_1#section_${section}#isle_14`,
						}
					});
					expect(queryParamsWithSparseSK).to.deep.equal({
						"KeyConditionExpression": "#pk = :pk",
						"TableName": table,
						"ExpressionAttributeNames": {
							"#pk": "partition_key_idx2"
						},
						"ExpressionAttributeValues": {
							":pk": `$inventory$${entityName}_1#name_cookies`
						},
						"IndexName": "idx2"
					});

					await entity.put({section, isle}).go();
					const queryRecordWithSparseSK = await entity.query.location({name}).go();
					expect(queryRecordWithSparseSK).to.deep.equal([]);
					await entity.update({section, isle}).set({name}).go();
					const queryRecordWithSK = await entity.query.location({name}).go();
					expect(queryRecordWithSK).to.deep.equal([{section, isle, name}]);
				})
			});

			describe("Custom index fields", async () => {
				it("Should use the index field names as theyre specified on the model", async () => {
					const entityName = uuid();
					let schema = {
						model: {
							service: "MallStoreDirectory",
							entity: entityName,
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
									facets: ["id"],
								},
								sk: {
									field: "sort_key",
									facets: ["mall", "stores"]
								}
							},
							other: {
								index: "idx1",
								pk: {
									field: "partition_key_idx1",
									facets: ["mall"],
								},
								sk: {
									field: "sort_key_idx1",
									facets: ["id", "stores"]
								}
							}
						}
					};
					let MallStores = new Entity(schema, {client, table: "electro_customkeys"});
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
					let schema = {
						model: {
							service: "MallStoreDirectory",
							entity: uuid(),
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
									facets: ["id", "mall", "stores"],
								},
							},
							other: {
								index: "idx1",
								pk: {
									field: "partition_key_idx1",
									facets: ["mall"],
								},
								sk: {
									field: "sort_key_idx1",
									facets: ["id", "stores"]
								}
							},
							noSortOther: {
								index: "idx2",
								pk: {
									field: "partition_key_idx2",
									facets: ["mall"],
								}
							},
						}
					};
					let MallStores = new Entity(schema, {client, table: "electro_nosort"});
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
					let record = new Entity(
						{
							entity: uuid(),
							service: SERVICE,
							table: "electro",
							version: "1",
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
										facets: ["prop1"],
									},
									sk: {
										field: "sk",
										facets: ["prop2"],
									},
								},
							},
						},
						{ client },
					);
					let prop1 = uuid();
					let prop2 = uuid();
					await record.put({ prop1, prop2 }).go();
					let recordExists = await record.get({ prop1, prop2 }).go();
					await record.delete({ prop1, prop2 }).go();
					await sleep(150);
					let recordNoLongerExists = await record.get({ prop1, prop2 }).go();
					expect(!!Object.keys(recordExists).length).to.be.true;
					expect(recordNoLongerExists).to.be.null;
				});
			});

			describe("Getters/Setters", async () => {
				let db = new Entity(
					{
						service: SERVICE,
						entity: uuid(),
						table: "electro",
						version: "1",
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
									facets: ["date"],
								},
								sk: {
									field: "sk",
									facets: ["id"],
								},
							},
						},
					},
					{ client },
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
			describe("Watchers", async () => {
				// PUT
					// Watching an attribute should trigger the setter of an attribute without that attribute being supplied
					// Watching an attribute should trigger the setter of an attribute without that attribute being supplied AFTER the other attribute's setter as been applied
					// Not setting an attribute or the watcher should result in neither setter being called
					// Setting the attribute should still pass the value
					// Key Values don't count as updates
				// CREATE
					// Watching an attribute should trigger the setter of an attribute without that attribute being supplied
					// Watching an attribute should trigger the setter of an attribute without that attribute being supplied AFTER the other attribute's setter as been applied
					// Not setting an attribute or the watcher should result in neither setter being called
					// Setting the attribute should still pass the value
					// Key Values don't count as updates
				// UPDATE
					// Watching an attribute should trigger the setter of an attribute without that attribute being supplied
					// Watching an attribute should trigger the setter of an attribute without that attribute being supplied AFTER the other attribute's setter as been applied
					// Not setting an attribute or the watcher should result in neither setter being called
					// Setting the attribute should still pass the value
					// Key Values don't count as updates
				// PATCH
					// Watching an attribute should trigger the setter of an attribute without that attribute being supplied
					// Watching an attribute should trigger the setter of an attribute without that attribute being supplied AFTER the other attribute's setter as been applied
					// Not setting an attribute or the watcher should result in neither setter being called
					// Setting the attribute should still pass the value
					// Key Values don't count as updates
				// GET
					// Watching an attribute should trigger the getter of an attribute without that attribute on the item
					// Watching an attribute should trigger the getter of an attribute without that attribute on the table and only when that other attribute exists in the item and AFTER the other attribute's getter as been applied
					// Not getting an attribute or the watcher should result in neither getter being called
					// Getting the attribute should still pass the value
					// Key Values don't count as updates
				// QUERY
					// Watching an attribute should trigger the getter of an attribute without that attribute on the item
					// Watching an attribute should trigger the getter of an attribute without that attribute on the table and only when that other attribute exists in the item and AFTER the other attribute's getter as been applied
					// Not getting an attribute or the watcher should result in neither getter being called
					// Getting the attribute should still pass the value
					// Key Values don't count as updates
				// COLLECTION
					// Watching an attribute should trigger the getter of an attribute without that attribute on the item
					// Watching an attribute should trigger the getter of an attribute without that attribute on the table and only when that other attribute exists in the item and AFTER the other attribute's getter as been applied
					// Not getting an attribute or the watcher should result in neither getter being called
					// Getting the attribute should still pass the value
					// Key Values don't count as updates
				// A watcher can be an index
				// A watcher can be in the same index as the attribute it's watching
				// A watcher cannot watch another watcher
				class TriggerListener {
					constructor() {
						this.fresh();
					}

					fresh() {
						this.store = {};
						this.events = [];
						this.current = undefined;
					}

					stop() {
						if (this.current !== undefined) {
							this.store[this.current] = this.events;
						}
						this.events = [];
						this.current = undefined;
					}

					list(name) {
						return this.store[name];
					}

					start(name) {
						this.stop();
						this.current = name;
					}

					trigger(value) {
						this.events.push(value);
					}

					end() {
						this.stop();
						let store = this.store;
						this.fresh();
						return store;
					}
				}
				describe("Readme examples", async () => {
					it("Should test Attribute Watching 'Example 1' from the readme", async () => {
						let entity = new Entity({
							model: {
								entity: uuid(),
								service: "costEstimator",
								version: "1"
							},
							attributes: {
								service: {
									type: "string"
								},
								price: {
									type: "number",
									required: true
								},
								fee: {
									type: "number",
									watch: ["price"],
									set: (_, {price}) => {
										return price * .2;
									}
								}
							},
							indexes: {
								pricing: {
									pk: {
										field: "pk",
										facets: ["service"]
									},
									sk: {
										field: "sk",
										facets: []
									}
								}
							}
						}, {table, client});

						let service = uuid();

						let input1 = {
							service,
							price: 100
						};

						let output1 = {
							service,
							price: input1.price,
							fee: input1.price * .2
						};

						let input2 = {
							price: 200
						};

						let output2 = {
							service,
							price: input2.price,
							fee: input2.price * .2
						};

						let putRecord = await entity.put(input1).go();
						let getRecord1 = await entity.get({service}).go();
						await entity.update({service}).set(input2).go();
						let getRecord2 = await entity.get({service}).go();
						expect(putRecord).to.deep.equal(putRecord);
						expect(getRecord1).to.deep.equal(output1);
						expect(getRecord2).to.deep.equal(output2);
					});
					it("Should test Attribute Watching 'Example 2' from the readme", async () => {
						let entity = new Entity({
							model: {
								entity: uuid(),
								service: "costEstimator",
								version: "1"
							},
							attributes: {
								service: {
									type: "string"
								},
								price: {
									type: "number",
									required: true
								},
								displayPrice: {
									type: "string",
									watch: ["price"],
									get: (_, {price}) => {
										return "$" + price;
									},
									set: () => undefined
								}
							},
							indexes: {
								pricing: {
									pk: {
										field: "pk",
										facets: ["service"]
									},
									sk: {
										field: "sk",
										facets: []
									}
								}
							}
						}, {table, client});

						let service = uuid();

						let input1 = {
							service,
							price: 100,
							displayPrice: "shouldnt_take_value"
						};

						let output1 = {
							service,
							price: input1.price,
							displayPrice: "$" + input1.price
						};

						let input2 = {
							price: 200,
							displayPrice: "shouldnt_take_value"
						};

						let output2 = {
							service,
							price: input2.price,
							displayPrice: "$" + input2.price
						};

						let putRecord = await entity.put(input1).go();
						let getRecord1 = await entity.get({service}).go();
						await entity.update({service}).set(input2).go();
						let getRecord2 = await entity.get({service}).go();
						expect(putRecord).to.deep.equal(putRecord);
						expect(getRecord1).to.deep.equal(output1);
						expect(getRecord2).to.deep.equal(output2);
					});
					it("Should test Attribute Watching 'Example 3' from the readme", async () => {
						let entity = new Entity({
							model: {
								entity: uuid(),
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
								amount: {
									type: "number",
								},
								description: {
									type: "string",
								},
								descriptionSearch: {
									type: "string",
									hidden: true,
									watch: ["description"],
									set: (_, {description}) => {
										if (typeof description === "string") {
											return description.toLowerCase();
										}
									}
								}
							},
							indexes: {
								transactions: {
									pk: {
										field: "pk",
										facets: ["accountNumber"]
									},
									sk: {
										field: "sk",
										facets: ["transactionId"]
									}
								}
							}
						}, {table, client});

						let accountNumber = uuid();
						let transactionId = uuid();

						let transaction = {
							accountNumber,
							transactionId,
							amount: 100,
							description: "MiXeD CaSe DeScRiPtIoN"
						};

						let putRecord = await entity.put(transaction).go();

						let queryRecord1 = await entity.query
							.transactions({accountNumber})
							.where(({descriptionSearch}, {contains}) => contains(descriptionSearch, "mixed case"))
							.go();

						expect(putRecord).to.deep.equal(transaction);
						expect(queryRecord1).to.deep.equal([transaction]);
					});

					it("Should test Attribute Watching 'Example 4' from the readme", async () => {
						let createdAtCount = 0;
						let updatedAtCount = 0;
						let createdAt;
						let updatedAt;
						let entity = new Entity({
							model: {
								entity: uuid(),
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
									default: () => {
										createdAtCount++;
										createdAt = Date.now();
										return createdAt;
									},
									readOnly: true,
								},
								updatedAt: {
									type: "number",
									watch: "*",
									set: () => {
										updatedAtCount++;
										updatedAt = Date.now();
										return updatedAt;
									},
									readOnly: true
								}
							},
							indexes: {
								transactions: {
									pk: {
										field: "pk",
										facets: ["accountNumber"]
									},
									sk: {
										field: "sk",
										facets: ["transactionId"]
									}
								}
							}
						}, {table, client});

						let accountNumber = uuid();
						let transactionId = uuid();
						let initialDescription = "My Initial Description";
						let updatedDescription = "My Updated Description";

						let initialTransaction = {
							accountNumber,
							transactionId,
							description: initialDescription
						}
						let putRecord = await entity.put(initialTransaction).go();
						expect(createdAtCount).to.equal(1, "createdAt not updated");
						expect(updatedAtCount).to.equal(1, "updatedAt not updated");
						let queryRecord1 = await entity.query
							.transactions({accountNumber, transactionId})
							.go();

						// createdAt and updatedAt should have changed
						let afterPutTransaction = {
							...initialTransaction,
							createdAt,
							updatedAt
						}

						expect(putRecord).to.deep.equal(afterPutTransaction);
						expect(queryRecord1).to.deep.equal([afterPutTransaction]);
						await entity.update({accountNumber, transactionId}).set({description: updatedDescription}).go();
						expect(createdAtCount).to.equal(1, "createdAt shouldnt update");
						expect(updatedAtCount).to.equal(2, "updatedAt not updated");
						// createdAt should have remained the same
						let afterUpdateTransaction = {
							...afterPutTransaction,
							updatedAt,
							description: updatedDescription
						};

						let queryRecord2 = await entity.query.transactions({accountNumber, transactionId}).go();
						expect(queryRecord2).to.deep.equal([afterUpdateTransaction]);
					});

					it("Should be able to use watch property to bypass readOnly", async () => {
						const entityName = uuid();
						let updatedAtCount = 0;
						let updatedAt;
						let entity = new Entity({
							model: {
								entity: entityName,
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
								updatedAt: {
									type: "number",
									watch: "*",
									set: () => {
										updatedAtCount++;
										updatedAt = Date.now();
										return updatedAt;
									},
									readOnly: true
								}
							},
							indexes: {
								transactions: {
									pk: {
										field: "pk",
										facets: ["accountNumber"]
									},
									sk: {
										field: "sk",
										facets: ["transactionId"]
									}
								}
							}
						}, {table, client});

						let accountNumber = uuid();
						let transactionId = uuid();
						let description = "My Description";

						let updateParams = entity.update({accountNumber, transactionId}).set({description}).params();
						expect(updatedAtCount).to.equal(1, "updatedAt was not called the expected amount");
						expect(updateParams).to.deep.equal({
							"UpdateExpression": "SET #description = :description_u0, #updatedAt = :updatedAt_u0, #accountNumber = :accountNumber_u0, #transactionId = :transactionId_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0",
							"ExpressionAttributeNames": {
								"#description": "description",
								"#updatedAt": "updatedAt",
								"#accountNumber": "accountNumber",
								"#transactionId": "transactionId",
								"#__edb_e__": "__edb_e__", "#__edb_v__": "__edb_v__"
							},
							"ExpressionAttributeValues": {
								":accountNumber_u0": accountNumber,
								":transactionId_u0": transactionId,
								":description_u0": "My Description",
								":updatedAt_u0": updatedAt,
								":__edb_e___u0": entityName,
								":__edb_v___u0": "1"
							},
							"TableName": table,
							"Key": {
								"pk": `$bank#accountnumber_${accountNumber}`,
								"sk": `$${entityName}_1#transactionid_${transactionId}`
							}
						});

						const readOnlyUpdate = () => entity.update({accountNumber, transactionId}).set({updatedAt: Date.now()}).params();
						expect(readOnlyUpdate).to.throw(`Attribute "updatedAt" is Read-Only and cannot be updated`);
						const [success, result] = await entity.update({accountNumber, transactionId}).set({updatedAt: Date.now()}).go()
							.then((res) => [true, res])
							.catch(err => [false, err])
						expect(success).to.be.false;
						expect(result.message).to.equal(`Attribute "updatedAt" is Read-Only and cannot be updated - For more detail on this error reference: https://github.com/tywalch/electrodb#invalid-attribute`);
					});
				});
				describe("Setter Triggers", async () => {
					const entityName = uuid();
					const counter = new TriggerListener();
					const entity = new Entity({
						model: {
							entity: entityName,
							service: "service",
							version: "1"
						},
						attributes: {
							prop3: {
								type: "string",
								get: (value) => {
									counter.trigger({value, attr: "prop3", method: "get"});
									return value + "_fromgetter";
								},
								set: (value) => {
									counter.trigger({value, attr: "prop3", method: "set"});
									return value + "_fromsetter";
								}
							},
							prop4: {
								type: "string",
								watch: ["prop3"],
								get: (value, {prop3}) => {
									counter.trigger({value, attr: "prop4", method: "get", watched: prop3});
									return "prop4_fromgetter";
								},
								set: (value, {prop3}) => {
									counter.trigger({value, attr: "prop4", method: "set", watched: prop3});
									return value === undefined ? "prop4_fromsetter" : value + "_fromvaluefromsetter";
								}
							},
							prop5: {
								type: "string",
								watch: ["prop2"],
								get: (value, {prop2}) => {
									counter.trigger({value, attr: "prop5", method: "get", watched: prop2});
									return "prop5_fromgetter";
								},
								set: (value, {prop2}) => {
									counter.trigger({value, attr: "prop5", method: "set", watched: prop2});
									return "prop5_fromsetter";
								}
							},
							prop6: {
								type: "string",
								get: (value) => {
									counter.trigger({value, attr: "prop6", method: "get"});
									return value + "_fromgetter";
								},
								set: (value) => {
									counter.trigger({value, attr: "prop6", method: "set"});
									return value === undefined ? "prop6_fromsetter" : value + "_fromsetter";
								}
							},
							prop1: {
								type: "string",
								get: (value) => {
									counter.trigger({value, attr: "prop1", method: "get"});
									return value + "_after_getter";
								},
								set: (value) => {
									counter.trigger({value, attr: "prop1", method: "set"});
									return value + "_after_setter";
								}
							},
							prop2: {
								type: "string",
								get: (value) => {
									counter.trigger({value, attr: "prop2", method: "get"});
									return value + "_after_getter";
								},
								set: (value) => {
									counter.trigger({value, attr: "prop2", method: "set"});
									return value + "_after_setter";
								}
							},
						}, indexes: {
							record: {
								pk: {
									field: "pk",
									facets: ["prop1"]
								},
								sk: {
									field: "sk",
									facets: ["prop2"]
								}
							}
						}
					}, {table});
					it("Should trigger the setter of a watcher because the attribute being watched is supplied regardless if the watcher was supplied after the attribute's setter has been applied", () => {
						let prop1 = uuid();
						let prop2 = "prop2";
						let prop3 = "prop3";
						let prop4 = "prop4";
						let keys = {
							put: "put",
							create: "create",
							update: "update",
							patch: "patch"
						}
						counter.start(keys.put);
						let putParams = entity.put({prop1, prop2, prop3}).params();
						counter.start(keys.create);
						let createParams = entity.create({prop1, prop2, prop3}).params();
						counter.start(keys.update);
						let updateParams = entity.update({prop1, prop2}).set({prop3}).params();
						counter.start(keys.patch);
						let patchParams = entity.patch({prop1, prop2}).set({prop3}).params();
						counter.stop();
						expect(putParams).to.deep.equal({
							Item: {
								prop1: prop1 + "_after_setter",
								prop2: 'prop2_after_setter',
								prop3: 'prop3_fromsetter',
								prop4: 'prop4_fromsetter',
								prop5: "prop5_fromsetter",
								prop6: "prop6_fromsetter",
								pk: `$service#prop1_${prop1}_after_setter`,
								sk: `$${entityName}_1#prop2_prop2_after_setter`,
								__edb_e__: entityName,
								__edb_v__: '1'
							},
							TableName: 'electro'
						});
						expect(counter.list(keys.put)).to.deep.equal([
							{ value: 'prop3', attr: 'prop3', method: 'set' },
							{
								"attr": "prop6",
								"method": "set",
								"value": undefined
							},
							{
								attr: "prop1",
								method: "set",
								value: prop1,
							},
							{
								attr: "prop2",
								method: "set",
								value: "prop2",
							},
							{
								value: undefined,
								attr: 'prop4',
								method: 'set',
								watched: 'prop3_fromsetter'
							},
							{
								attr: "prop5",
								method: "set",
								value: undefined,
								watched: "prop2_after_setter",
							},
						]);
						expect(createParams).to.deep.equal({
							Item: {
								prop1: prop1 + "_after_setter",
								prop2: 'prop2_after_setter',
								prop3: 'prop3_fromsetter',
								prop4: 'prop4_fromsetter',
								prop5: "prop5_fromsetter",
								prop6: "prop6_fromsetter",
								pk: `$service#prop1_${prop1}_after_setter`,
								sk: `$${entityName}_1#prop2_prop2_after_setter`,
								__edb_e__: entityName,
								__edb_v__: '1'
							},
							TableName: 'electro',
							ConditionExpression: 'attribute_not_exists(#pk) AND attribute_not_exists(#sk)',
							ExpressionAttributeNames: {"#pk": "pk", "#sk": "sk"}
						});
						expect(counter.list(keys.create)).to.deep.equal([
							{ value: 'prop3', attr: 'prop3', method: 'set' },
							{
								"attr": "prop6",
								"method": "set",
								"value": undefined
							},
							{
								attr: "prop1",
								method: "set",
								value: prop1,
							},
							{
								attr: "prop2",
								method: "set",
								value: "prop2",
							},
							{
								value: undefined,
								attr: 'prop4',
								method: 'set',
								watched: 'prop3_fromsetter'
							},
							{
								attr: "prop5",
								method: "set",
								value: undefined,
								watched: "prop2_after_setter",
							}
						]);
						expect(updateParams).to.deep.equal({
							"UpdateExpression": "SET #prop3 = :prop3_u0, #prop4 = :prop4_u0, #prop1 = :prop1_u0, #prop2 = :prop2_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0",
							ExpressionAttributeNames: {
								"#prop1": "prop1",
								"#prop2": "prop2",
								'#prop3': 'prop3',
								'#prop4': 'prop4', "#__edb_e__": "__edb_e__", "#__edb_v__": "__edb_v__"
							},
							ExpressionAttributeValues: {
								":prop1_u0": prop1,
								":prop2_u0": "prop2",
								':prop3_u0': 'prop3_fromsetter',
								':prop4_u0': 'prop4_fromsetter', ":__edb_e___u0": entityName, ":__edb_v___u0": "1"
							},
							TableName: 'electro',
							Key: {
								pk: `$service#prop1_${prop1}`,
								sk: `$${entityName}_1#prop2_prop2`
							}
						});
						expect(counter.list(keys.update)).to.deep.equal([
							{ value: 'prop3', attr: 'prop3', method: 'set' },
							{
								value: undefined,
								attr: 'prop4',
								method: 'set',
								watched: 'prop3_fromsetter'
							}
						]);
						expect(patchParams).to.deep.equal({
							UpdateExpression: "SET #prop3 = :prop3_u0, #prop4 = :prop4_u0, #prop1 = :prop1_u0, #prop2 = :prop2_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0",
							ExpressionAttributeNames: {
								'#prop3': 'prop3',
								'#prop4': 'prop4',
								"#prop1": "prop1",
								"#prop2": "prop2",
								"#__edb_e__": "__edb_e__", "#__edb_v__": "__edb_v__",
								"#pk": "pk", "#sk": "sk",
							},
							ExpressionAttributeValues: { ':prop3_u0': 'prop3_fromsetter', ':prop4_u0': 'prop4_fromsetter', ":prop1_u0": prop1, ":prop2_u0": "prop2", ":__edb_e___u0": entityName, ":__edb_v___u0": "1" },
							TableName: 'electro',
							Key: {
								pk: `$service#prop1_${prop1}`,
								sk: `$${entityName}_1#prop2_prop2`,
							},
							ConditionExpression: 'attribute_exists(#pk) AND attribute_exists(#sk)',
						});
						expect(counter.list(keys.patch)).to.deep.equal([
							{ value: 'prop3', attr: 'prop3', method: 'set' },
							{
								value: undefined,
								attr: 'prop4',
								method: 'set',
								watched: 'prop3_fromsetter'
							}
						]);
					});
					it("Should not trigger either setter if neither attribute is supplied", () => {
						let prop1 = uuid();
						let prop2 = "prop2";
						let prop6 = "prop6";
						let keys = {
							put: "put",
							create: "create",
							update: "update",
							patch: "patch"
						}
						counter.start(keys.put);
						let putParams = entity.put({prop1, prop2, prop6}).params();
						counter.start(keys.create);
						let createParams = entity.create({prop1, prop2, prop6}).params();
						counter.start(keys.update);
						let updateParams = entity.update({prop1, prop2}).set({prop6}).params();
						counter.start(keys.patch);
						let patchParams = entity.patch({prop1, prop2}).set({prop6}).params();
						counter.stop();
						expect(putParams).to.deep.equal({
							Item: {
								prop1: prop1 + "_after_setter",
								prop2: 'prop2_after_setter',
								prop3: 'undefined_fromsetter',
								prop4: 'prop4_fromsetter',
								prop5: "prop5_fromsetter",
								prop6: "prop6_fromsetter",
								pk: `$service#prop1_${prop1}_after_setter`,
								sk: `$${entityName}_1#prop2_prop2_after_setter`,
								__edb_e__: entityName,
								__edb_v__: '1'
							},
							TableName: 'electro'
						});
						expect(counter.list(keys.put)).to.deep.equal([
							{ value: undefined, attr: 'prop3', method: 'set' },
							{ value: "prop6", attr: 'prop6', method: 'set' },
							{
								attr: "prop1",
								method: "set",
								value: prop1,
							},
							{
								attr: "prop2",
								method: "set",
								value: "prop2",
							},
							{
								value: undefined,
								attr: 'prop4',
								method: 'set',
								watched: 'undefined_fromsetter'
							},
							{
								attr: "prop5",
								method: "set",
								value: undefined,
								watched: "prop2_after_setter",
							}
						]);
						expect(createParams).to.deep.equal({
							Item: {
								prop1: prop1 + "_after_setter",
								prop2: 'prop2_after_setter',
								prop3: 'undefined_fromsetter',
								prop4: 'prop4_fromsetter',
								prop5: "prop5_fromsetter",
								prop6: "prop6_fromsetter",
								pk: `$service#prop1_${prop1}_after_setter`,
								sk: `$${entityName}_1#prop2_prop2_after_setter`,
								__edb_e__: entityName,
								__edb_v__: '1'
							},
							TableName: 'electro',
							ConditionExpression: 'attribute_not_exists(#pk) AND attribute_not_exists(#sk)',
							ExpressionAttributeNames: {"#pk": "pk", "#sk": "sk"}
						});
						expect(counter.list(keys.create)).to.deep.equal([
							{ value: undefined, attr: 'prop3', method: 'set' },
							{ value: "prop6", attr: "prop6", method: "set" },
							{
								attr: "prop1",
								method: "set",
								value: prop1,
							},
							{
								attr: "prop2",
								method: "set",
								value: "prop2",
							},
							{
								value: undefined,
								attr: 'prop4',
								method: 'set',
								watched: 'undefined_fromsetter'
							},
							{
								attr: "prop5",
								method: "set",
								value: undefined,
								watched: "prop2_after_setter",
							}
						]);
						expect(updateParams).to.deep.equal({
							UpdateExpression: "SET #prop6 = :prop6_u0, #prop1 = :prop1_u0, #prop2 = :prop2_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0",
							ExpressionAttributeNames: { '#prop6': 'prop6', "#prop1": "prop1", "#prop2": "prop2", "#__edb_e__": "__edb_e__", "#__edb_v__": "__edb_v__" },
							ExpressionAttributeValues: { ':prop6_u0': 'prop6_fromsetter', ":prop1_u0": prop1, ":prop2_u0": "prop2", ":__edb_e___u0": entityName, ":__edb_v___u0": "1"},
							TableName: 'electro',
							Key: {
								pk: `$service#prop1_${prop1}`,
								sk: `$${entityName}_1#prop2_prop2`
							}
						});
						expect(counter.list(keys.update)).to.deep.equal([
							{ value: "prop6", attr: "prop6", method: "set" },
						]);
						expect(patchParams).to.deep.equal({
							UpdateExpression: "SET #prop6 = :prop6_u0, #prop1 = :prop1_u0, #prop2 = :prop2_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0",
							ExpressionAttributeNames: { '#prop6': 'prop6', "#prop1": "prop1", "#prop2": "prop2", "#__edb_e__": "__edb_e__", "#__edb_v__": "__edb_v__", "#pk": "pk", "#sk": "sk"},
							ExpressionAttributeValues: {
								':prop6_u0': 'prop6_fromsetter',
								":prop2_u0": "prop2",
								":prop1_u0": prop1,
								":__edb_e___u0": entityName, ":__edb_v___u0": "1"
							},
							TableName: 'electro',
							Key: {
								pk: `$service#prop1_${prop1}`,
								sk: `$${entityName}_1#prop2_prop2`
							},
							ConditionExpression: 'attribute_exists(#pk) AND attribute_exists(#sk)',
						});
						expect(counter.list(keys.patch)).to.deep.equal([
							{ value: "prop6", attr: "prop6", method: "set" },
						]);
					});
					it("Should still trigger setter if the attribute is set manually and include it's value, but will do so after the attribute it's watching", () => {
						let prop1 = uuid();
						let prop2 = "prop2";
						let prop6 = "prop6";
						let prop4 = "prop4"
						let keys = {
							put: "put",
							create: "create",
							update: "update",
							patch: "patch"
						}
						counter.start(keys.put);
						let putParams = entity.put({prop1, prop2, prop6, prop4}).params();
						counter.start(keys.create);
						let createParams = entity.create({prop1, prop2, prop6, prop4}).params();
						counter.start(keys.update);
						let updateParams = entity.update({prop1, prop2}).set({prop6, prop4}).params();

						counter.start(keys.patch);
						let patchParams = entity.patch({prop1, prop2}).set({prop6, prop4}).params();
						counter.stop();
						expect(putParams).to.deep.equal({
							Item: {
								prop1: prop1 + "_after_setter",
								prop2: 'prop2_after_setter',
								prop3: 'undefined_fromsetter',
								prop4: 'prop4_fromvaluefromsetter',
								prop5: "prop5_fromsetter",
								prop6: "prop6_fromsetter",
								pk: `$service#prop1_${prop1}_after_setter`,
								sk: `$${entityName}_1#prop2_prop2_after_setter`,
								__edb_e__: entityName,
								__edb_v__: '1'
							},
							TableName: 'electro'
						});
						expect(counter.list(keys.put)).to.deep.equal([
							{ value: undefined, attr: 'prop3', method: 'set' },
							{ value: "prop6", attr: 'prop6', method: 'set' },
							{
								attr: "prop1",
								method: "set",
								value: prop1,
							},
							{
								attr: "prop2",
								method: "set",
								value: "prop2",
							},
							{
								value: "prop4",
								attr: 'prop4',
								method: 'set',
								watched: 'undefined_fromsetter'
							},
							{
								attr: "prop5",
								method: "set",
								value: undefined,
								watched: "prop2_after_setter",
							},
						]);
						expect(createParams).to.deep.equal({
							Item: {
								prop1: prop1 + "_after_setter",
								prop2: 'prop2_after_setter',
								prop3: 'undefined_fromsetter',
								prop4: 'prop4_fromvaluefromsetter',
								prop5: "prop5_fromsetter",
								prop6: "prop6_fromsetter",
								pk: `$service#prop1_${prop1}_after_setter`,
								sk: `$${entityName}_1#prop2_prop2_after_setter`,
								__edb_e__: entityName,
								__edb_v__: '1'
							},
							TableName: 'electro',
							ConditionExpression: 'attribute_not_exists(#pk) AND attribute_not_exists(#sk)',
							ExpressionAttributeNames: {"#pk": "pk", "#sk": "sk"}
						});
						expect(counter.list(keys.create)).to.deep.equal([
							{ value: undefined, attr: 'prop3', method: 'set' },
							{ value: "prop6", attr: "prop6", method: "set" },
							{
								attr: "prop1",
								method: "set",
								value: prop1,
							},
							{
								attr: "prop2",
								method: "set",
								value: "prop2",
							},
							{
								value: "prop4",
								attr: 'prop4',
								method: 'set',
								watched: 'undefined_fromsetter'
							},
							{
								attr: "prop5",
								method: "set",
								value: undefined,
								watched: "prop2_after_setter",
							},
						]);
						expect(updateParams).to.deep.equal({
							UpdateExpression: "SET #prop6 = :prop6_u0, #prop4 = :prop4_u0, #prop1 = :prop1_u0, #prop2 = :prop2_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0",
							ExpressionAttributeNames: { '#prop6': 'prop6', '#prop4': 'prop4', "#prop1": "prop1", "#prop2": "prop2", "#__edb_e__": "__edb_e__", "#__edb_v__": "__edb_v__" },
							ExpressionAttributeValues: { ':prop6_u0': 'prop6_fromsetter', ':prop4_u0': 'prop4_fromvaluefromsetter', ":prop2_u0": "prop2", ":prop1_u0": prop1, ":__edb_e___u0": entityName, ":__edb_v___u0": "1"},
							TableName: 'electro',
							Key: {
								pk: `$service#prop1_${prop1}`,
								sk: `$${entityName}_1#prop2_prop2`
							}
						});
						expect(counter.list(keys.update)).to.deep.equal([
							{ value: "prop6", attr: "prop6", method: "set" },
							{ value: "prop4", attr: "prop4", method: "set", watched: undefined },
						]);
						expect(patchParams).to.deep.equal({
							UpdateExpression: "SET #prop6 = :prop6_u0, #prop4 = :prop4_u0, #prop1 = :prop1_u0, #prop2 = :prop2_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0",
							ExpressionAttributeNames: { '#prop6': 'prop6', '#prop4': 'prop4', "#prop1": "prop1", "#prop2": "prop2", "#__edb_e__": "__edb_e__", "#__edb_v__": "__edb_v__", "#pk": "pk", "#sk": "sk" },
							ExpressionAttributeValues: { ':prop6_u0': 'prop6_fromsetter', ':prop4_u0': 'prop4_fromvaluefromsetter', ":prop1_u0": prop1, ":prop2_u0": "prop2", ":__edb_e___u0": entityName, ":__edb_v___u0": "1" },
							TableName: 'electro',
							Key: {
								pk: `$service#prop1_${prop1}`,
								sk: `$${entityName}_1#prop2_prop2`
							},
							ConditionExpression: 'attribute_exists(#pk) AND attribute_exists(#sk)',
						});
						expect(counter.list(keys.patch)).to.deep.equal([
							{ value: "prop6", attr: "prop6", method: "set" },
							{ value: "prop4", attr: "prop4", method: "set", watched: undefined },
						]);
					});
					it("Should be possible to use a watcher as a composite attribute", () => {
						const entityName = uuid();
						const counter = new TriggerListener();
						let entity = new Entity({
							model: {
								entity: entityName,
								service: "service",
								version: "1"
							},
							attributes: {
								prop5: {
									type: "string",
									watch: ["prop2"],
									get: (value, {prop2}) => {
										counter.trigger({value, attr: "prop5", method: "get", watched: prop2});
										return "prop5_fromgetter";
									},
									set: (value, {prop2}) => {
										counter.trigger({value, attr: "prop5", method: "set", watched: prop2});
										return "prop5_fromsetter";
									}
								},
								prop1: {
									type: "string",
									get: (value) => {
										counter.trigger({value, attr: "prop1", method: "get"});
										return value + "_after_getter";
									},
									set: (value) => {
										counter.trigger({value, attr: "prop1", method: "set"});
										return value + "_after_setter";
									}
								},
								prop2: {
									type: "string",
									get: (value) => {
										counter.trigger({value, attr: "prop2", method: "get"});
										return value + "_after_getter";
									},
									set: (value) => {
										counter.trigger({value, attr: "prop2", method: "set"});
										return value + "_after_setter";
									}
								},
							},
							indexes: {
								record: {
									pk: {
										field: "pk",
										facets: ["prop1"]
									},
									sk: {
										field: "sk",
										facets: ["prop2"]
									}
								},
								index2: {
									index: "gsi1",
									pk: {
										field: "gsi1pk",
										facets: ["prop5"]
									},
									sk: {
										field: "gsi1sk",
										facets: []
									}
								}
							}
						}, {table});
						let prop1 = "prop1";
						let prop2 = "prop2";
						let prop5 = "prop5";
						let keys = {
							put: "put",
							create: "create",
						}
						counter.start(keys.put);
						let putParams = entity.put({prop1, prop2, prop5}).params();
						counter.start(keys.create);
						let createParams = entity.create({prop1, prop2, prop5}).params();
						counter.start(keys.update);
						counter.stop();
						expect(putParams).to.deep.equal({
							Item: {
								prop1: 'prop1_after_setter',
								prop2: 'prop2_after_setter',
								prop5: 'prop5_fromsetter',
								pk: '$service#prop1_prop1_after_setter',
								sk: `$${entityName}_1#prop2_prop2_after_setter`,
								gsi1pk: '$service#prop5_prop5_fromsetter',
								gsi1sk: `$${entityName}_1`,
								__edb_e__: entityName,
								__edb_v__: '1'
							},
							TableName: 'electro'
						});
						expect(counter.list(keys.put)).to.deep.equal([
							{ value: 'prop1', attr: 'prop1', method: 'set' },
							{ value: 'prop2', attr: 'prop2', method: 'set' },
							{ value: 'prop5', attr: 'prop5', method: 'set', watched: 'prop2_after_setter' }
						]);
						expect(createParams).to.deep.equal({
							Item: {
								prop1: 'prop1_after_setter',
								prop2: 'prop2_after_setter',
								prop5: 'prop5_fromsetter',
								pk: '$service#prop1_prop1_after_setter',
								sk: `$${entityName}_1#prop2_prop2_after_setter`,
								gsi1pk: '$service#prop5_prop5_fromsetter',
								gsi1sk: `$${entityName}_1`,
								__edb_e__: entityName,
								__edb_v__: '1'
							},
							TableName: 'electro',
							ConditionExpression: "attribute_not_exists(#pk) AND attribute_not_exists(#sk)",
							ExpressionAttributeNames: {"#pk": "pk", "#sk": "sk"}
						});
						expect(counter.list(keys.create)).to.deep.equal([
							{ value: 'prop1', attr: 'prop1', method: 'set' },
							{ value: 'prop2', attr: 'prop2', method: 'set' },
							{ value: 'prop5', attr: 'prop5', method: 'set', watched: 'prop2_after_setter' }
						]);
					});

					it("Should be possible to use a watcher as a composite attribute in the same index as another composite attribute it is watching", () => {
						const entityName = uuid();
						const counter = new TriggerListener();
						let entity = new Entity({
							model: {
								entity: entityName,
								service: "service",
								version: "1"
							},
							attributes: {
								prop5: {
									type: "string",
									watch: ["prop2"],
									get: (value, {prop2}) => {
										counter.trigger({value, attr: "prop5", method: "get", watched: prop2});
										return "prop5_fromgetter";
									},
									set: (value, {prop2}) => {
										counter.trigger({value, attr: "prop5", method: "set", watched: prop2});
										return "prop5_fromsetter";
									}
								},
								prop1: {
									type: "string",
									get: (value) => {
										counter.trigger({value, attr: "prop1", method: "get"});
										return value + "_after_getter";
									},
									set: (value) => {
										counter.trigger({value, attr: "prop1", method: "set"});
										return value + "_after_setter";
									}
								},
								prop2: {
									type: "string",
									get: (value) => {
										counter.trigger({value, attr: "prop2", method: "get"});
										return value + "_after_getter";
									},
									set: (value) => {
										counter.trigger({value, attr: "prop2", method: "set"});
										return value + "_after_setter";
									}
								},

							},
							indexes: {
								record: {
									pk: {
										field: "pk",
										facets: ["prop1"]
									},
									sk: {
										field: "sk",
										facets: []
									}
								},
								index2: {
									index: "gsi1",
									pk: {
										field: "gsi1pk",
										facets: ["prop5"]
									},
									sk: {
										field: "gsi1sk",
										facets: ["prop2"]
									}
								}
							}
						}, {table});
						let prop1 = "prop1";
						let prop2 = "prop2";
						let prop5 = "prop5";
						let keys = {
							put: "put",
							create: "create",
						}
						counter.start(keys.put);
						let putParams = entity.put({prop1, prop2, prop5}).params();
						counter.start(keys.create);
						let createParams = entity.create({prop1, prop2, prop5}).params();
						counter.stop();
						expect(putParams).to.deep.equal({
							Item: {
								prop1: 'prop1_after_setter',
								prop2: 'prop2_after_setter',
								prop5: 'prop5_fromsetter',
								pk: '$service#prop1_prop1_after_setter',
								sk: `$${entityName}_1`,
								gsi1pk: '$service#prop5_prop5_fromsetter',
								gsi1sk: `$${entityName}_1#prop2_prop2_after_setter`,
								__edb_e__: entityName,
								__edb_v__: '1'
							},
							TableName: 'electro'
						});
						expect(counter.list(keys.put)).to.deep.equal([
							{ value: 'prop1', attr: 'prop1', method: 'set' },
							{ value: 'prop2', attr: 'prop2', method: 'set' },
							{ value: 'prop5', attr: 'prop5', method: 'set', watched: 'prop2_after_setter' }
						]);
						expect(createParams).to.deep.equal({
							Item: {
								prop1: 'prop1_after_setter',
								prop2: 'prop2_after_setter',
								prop5: 'prop5_fromsetter',
								pk: '$service#prop1_prop1_after_setter',
								sk: `$${entityName}_1`,
								gsi1pk: '$service#prop5_prop5_fromsetter',
								gsi1sk: `$${entityName}_1#prop2_prop2_after_setter`,
								__edb_e__: entityName,
								__edb_v__: '1'
							},
							TableName: 'electro',
							ConditionExpression: "attribute_not_exists(#pk) AND attribute_not_exists(#sk)",
							ExpressionAttributeNames: {"#pk": "pk", "#sk": "sk"}
						});
						expect(counter.list(keys.create)).to.deep.equal([
							{ value: 'prop1', attr: 'prop1', method: 'set' },
							{ value: 'prop2', attr: 'prop2', method: 'set' },
							{ value: 'prop5', attr: 'prop5', method: 'set', watched: 'prop2_after_setter' }
						]);
					});
				});
				describe("Getter Triggers", () => {
					const counter = new TriggerListener();
					let entity1 = new Entity({
						model: {
							entity: "entity1",
							service: "service",
							version: "1"
						},
						attributes: {
							prop3: {
								type: "string",
								get: (value) => {
									counter.trigger({value, attr: "prop3", method: "get", entity: "entity1"});
									return value + "_fromgetter";
								},
								set: (value) => {
									counter.trigger({value, attr: "prop3", method: "set", entity: "entity1"});
									return value;
								}
							},
							prop4: {
								type: "string",
								watch: ["prop3"],
								get: (value, {prop3}) => {
									counter.trigger({value, attr: "prop4", method: "get", watched: prop3, entity: "entity1"});
									return "prop4_fromgetter";
								},
								set: (value, {prop3}) => {
									counter.trigger({value, attr: "prop4", method: "set", watched: prop3, entity: "entity1"});
									return value === undefined ? "prop4_fromsetter" : value + "_fromvaluefromsetter";
								}
							},
							prop5: {
								type: "string",
								watch: ["prop2"],
								get: (value, {prop2}) => {
									counter.trigger({value, attr: "prop5", method: "get", watched: prop2, entity: "entity1"});
									return "prop5_fromgetter";
								},
								set: (value, {prop2}) => {
									counter.trigger({value, attr: "prop5", method: "set", watched: prop2, entity: "entity1"});
									return "prop5_fromsetter";
								}
							},
							prop6: {
								type: "string",
								get: (value) => {
									counter.trigger({value, attr: "prop6", method: "get", entity: "entity1"});
									return value + "_fromgetter";
								},
								set: (value) => {
									counter.trigger({value, attr: "prop6", method: "set", entity: "entity1"});
									return value;
								}
							},
							prop7: {
								type: "string",
								get: (value) => {
									counter.trigger({value, attr: "prop7", method: "get", entity: "entity1"});
									return value + "_fromgetter";
								},
								set: (value) => {
									counter.trigger({value, attr: "prop7", method: "set", entity: "entity1"});
									return value;
								}
							},
							prop1: {
								type: "string",
								get: (value) => {
									counter.trigger({value, attr: "prop1", method: "get", entity: "entity1"});
									return value + "_after_getter";
								},
								set: (value) => {
									counter.trigger({value, attr: "prop1", method: "set", entity: "entity1"});
									return value;
								}
							},
							prop2: {
								type: "string",
								get: (value) => {
									counter.trigger({value, attr: "prop2", method: "get", entity: "entity1"});
									return value + "_after_getter";
								},
								set: (value) => {
									counter.trigger({value, attr: "prop2", method: "set", entity: "entity1"});
									return value;
								}
							},
							prop8: {
								type: "string",
								watch: ["prop6"],
								set: (value) => {
									counter.trigger({value, attr: "prop8", method: "set", entity: "entity2"});
									return undefined;
								},
								get: (value, {prop6}) => {
									counter.trigger({value, attr: "prop8", method: "get", watched: prop6, entity: "entity2"});
									return prop6 + "_fromprop8_entity1"
								}
							},
							prop9: {
								type: "string",
								watch: ["prop2"],
								set: (value) => {
									counter.trigger({value, attr: "prop9", method: "set", entity: "entity2"});
									return undefined;
								},
								get: (value, {prop2}) => {
									counter.trigger({value, attr: "prop9", method: "get", watched: prop2, entity: "entity2"});
									return prop2 + "_fromprop9_entity1";
								}
							}
						},
						indexes: {
							record: {
								collection: "collection1",
								pk: {
									field: "pk",
									facets: ["prop1"]
								},
								sk: {
									field: "sk",
									facets: ["prop2"]
								}
							},
							index1: {
								collection: "collection2",
								index: "gsi1pk-gsi1sk-index",
								pk: {
									field: "gsi1pk",
									facets: ["prop3"]
								},
								sk: {
									field: "gsi1sk",
									facets: []
								}
							},
							index2: {
								collection: "collection3",
								index: "gsi2pk-gsi2sk-index",
								pk: {
									field: "gsi2pk",
									facets: ["prop6"]
								},
								sk: {
									field: "gsi2sk",
									facets: ["prop7"]
								}
							}
						}
					}, {table});

					let entity2 = new Entity({
						model: {
							entity: "entity2",
							service: "service",
							version: "1"
						},
						attributes: {
							prop3: {
								type: "string",
								get: (value) => {
									counter.trigger({value, attr: "prop3", method: "get", entity: "entity2"});
									return value + "_fromgetter";
								},
								set: (value) => {
									counter.trigger({value, attr: "prop3", method: "set", entity: "entity2"});
									return value;
								}
							},
							prop4: {
								type: "string",
								watch: ["prop3"],
								get: (value, {prop3}) => {
									counter.trigger({value, attr: "prop4", method: "get", watched: prop3, entity: "entity2"});
									return "prop4_fromgetter";
								},
								set: (value, {prop3}) => {
									counter.trigger({value, attr: "prop4", method: "set", watched: prop3, entity: "entity2"});
									return value === undefined ? "prop4_fromsetter" : value + "_fromvaluefromsetter";
								}
							},
							prop5: {
								type: "string",
								watch: ["prop2"],
								get: (value, {prop2}) => {
									counter.trigger({value, attr: "prop5", method: "get", watched: prop2, entity: "entity2"});
									return "prop5_fromgetter";
								},
								set: (value, {prop2}) => {
									counter.trigger({value, attr: "prop5", method: "set", watched: prop2, entity: "entity2"});
									return "prop5_fromsetter";
								}
							},
							prop6: {
								type: "string",
								get: (value) => {
									counter.trigger({value, attr: "prop6", method: "get", entity: "entity2"});
									return value + "_fromgetter";
								},
								set: (value) => {
									counter.trigger({value, attr: "prop6", method: "set", entity: "entity2"});
									return value;
								}
							},
							prop1: {
								type: "string",
								get: (value) => {
									counter.trigger({value, attr: "prop1", method: "get", entity: "entity2"});
									return value + "_after_getter";
								},
								set: (value) => {
									counter.trigger({value, attr: "prop1", method: "set", entity: "entity2"});
									return value;
								}
							},
							prop2: {
								type: "string",
								get: (value) => {
									counter.trigger({value, attr: "prop2", method: "get", entity: "entity2"});
									return value + "_after_getter";
								},
								set: (value) => {
									counter.trigger({value, attr: "prop2", method: "set", entity: "entity2"});
									return value;
								}
							},
							prop7: {
								type: "string",
								get: (value) => {
									counter.trigger({value, attr: "prop7", method: "get", entity: "entity2"});
									return value + "_fromgetter_entity2";
								},
								set: (value) => {
									counter.trigger({value, attr: "prop7", method: "set", entity: "entity2"});
									return value;
								}
							},
							prop8: {
								type: "string",
								watch: ["prop6"],
								set: (value) => {
									counter.trigger({value, attr: "prop8", method: "set", entity: "entity2"});
									return undefined;
								},
								get: (value, {prop6}) => {
									counter.trigger({value, attr: "prop8", method: "get", watched: prop6, entity: "entity2"});
									return prop6 + "_fromprop8_entity2"
								}
							},
							prop9: {
								type: "string",
								watch: ["prop2"],
								set: (value) => {
									counter.trigger({value, attr: "prop9", method: "set", entity: "entity2"});
									return undefined;
								},
								get: (value, {prop2}) => {
									counter.trigger({value, attr: "prop9", method: "get", watched: prop2, entity: "entity2"});
									return prop2 + "_fromprop9_entity2";
								}
							}
						},
						indexes: {
							record: {
								collection: "collection1",
								pk: {
									field: "pk",
									facets: ["prop1"]
								},
								sk: {
									field: "sk",
									facets: ["prop2"]
								}
							},
							index1: {
								collection: "collection2",
								index: "gsi1pk-gsi1sk-index",
								pk: {
									field: "gsi1pk",
									facets: ["prop3"]
								},
								sk: {
									field: "gsi1sk",
									facets: []
								}
							},
							index2: {
								collection: "collection3",
								index: "gsi2pk-gsi2sk-index",
								pk: {
									field: "gsi2pk",
									facets: ["prop6"]
								},
								sk: {
									field: "gsi2sk",
									facets: ["prop7"]
								}
							}
						}
					}, {table});
					let service = new Service({entity1, entity2}, {table, client});
					it("Should trigger the setter of a watcher because the attribute being watched is supplied regardless if the watcher was supplied after the attribute's setter has been applied", async () => {
						let prop1 = uuid();
						let prop2 = "prop2";
						let prop3 = uuid();
						let prop4 = "prop4";
						let prop5 = "prop5";
						let prop6 = uuid();
						let prop7 = "prop7";
						let keys = {
							get: "get",
							query: "query",
							collection: "collection",
							puts: "puts"
						}
						prop1 = prop1;
						prop2 = prop2;
						counter.start(keys.puts);
						let e1 = await service.entities.entity1.put({prop1, prop2, prop3}).go();
						let e2 = await service.entities.entity2.put({prop1, prop2, prop3}).go();
						counter.start("get1");
						let get1 = await service.entities.entity1.get({prop1, prop2}).go();
						counter.start("get2");
						let get2 = await service.entities.entity2.get({prop1, prop2}).go();
						counter.start("query1");
						let query1 = await entity1.query.record({prop1}).go();
						counter.start("query2");
						let query2 = await entity2.query.record({prop1}).go();
						counter.start("collection");
						let collection = await service.collections.collection2({prop3}).go();
						counter.stop();
						expect(e1).to.deep.equal({
							prop3: `${prop3}_fromgetter`,
							prop4: 'prop4_fromgetter',
							prop5: 'prop5_fromgetter',
							prop1: `${prop1}_after_getter`,
							prop2: 'prop2_after_getter',
							prop9: 'prop2_after_getter_fromprop9_entity1'
						});
						expect(e2).to.deep.equal({
							prop3: `${prop3}_fromgetter`,
							prop4: 'prop4_fromgetter',
							prop5: 'prop5_fromgetter',
							prop1: `${prop1}_after_getter`,
							prop2: 'prop2_after_getter',
							prop9: 'prop2_after_getter_fromprop9_entity2'
						});
						expect(get1).to.deep.equal(e1);
						expect(get2).to.deep.equal(e2);
						expect(query1).to.be.an("array").with.length(1);
						expect(query1[0]).to.deep.equal(e1);
						expect(query2).to.be.an("array").with.length(1);
						expect(query2[0]).to.deep.equal(e2);
						expect(collection).to.be.an("object").with.keys("entity1", "entity2");
						expect(collection.entity1).to.be.an("array").with.length(1);
						expect(collection.entity1[0]).to.deep.equal(e1);
						expect(collection.entity2).to.be.an("array").with.length(1);
						expect(collection.entity2[0]).to.deep.equal(e2);
						expect(counter.list("get1")).to.deep.equal([
							{ value: 'prop2', attr: 'prop2', method: 'get', entity: 'entity1' },
							{
								value: prop1,
								attr: 'prop1',
								method: 'get',
								entity: 'entity1'
							},
							{
								value: prop3,
								attr: 'prop3',
								method: 'get',
								entity: 'entity1'
							},
							{
								value: 'prop5_fromsetter',
								attr: 'prop5',
								method: 'get',
								watched: 'prop2_after_getter',
								entity: 'entity1'
							},
							{
								value: 'prop4_fromsetter',
								attr: 'prop4',
								method: 'get',
								watched: `${prop3}_fromgetter`,
								entity: 'entity1'
							},
							{
								value: undefined,
								attr: 'prop9',
								method: 'get',
								watched: 'prop2_after_getter',
								entity: 'entity2'
							}
						]);
						expect(counter.list("get2")).to.deep.equal([
							{ value: 'prop2', attr: 'prop2', method: 'get', entity: 'entity2' },
							{
								value: prop1,
								attr: 'prop1',
								method: 'get',
								entity: 'entity2'
							},
							{
								value: prop3,
								attr: 'prop3',
								method: 'get',
								entity: 'entity2'
							},
							{
								value: 'prop5_fromsetter',
								attr: 'prop5',
								method: 'get',
								watched: 'prop2_after_getter',
								entity: 'entity2'
							},
							{
								value: 'prop4_fromsetter',
								attr: 'prop4',
								method: 'get',
								watched: `${prop3}_fromgetter`,
								entity: 'entity2'
							},
							{
								value: undefined,
								attr: 'prop9',
								method: 'get',
								watched: 'prop2_after_getter',
								entity: 'entity2'
							}
						]);
						expect(counter.list("query1")).to.deep.equal([
							{ value: 'prop2', attr: 'prop2', method: 'get', entity: 'entity1' },
							{
								value: prop1,
								attr: 'prop1',
								method: 'get',
								entity: 'entity1'
							},
							{
								value: prop3,
								attr: 'prop3',
								method: 'get',
								entity: 'entity1'
							},
							{
								value: 'prop5_fromsetter',
								attr: 'prop5',
								method: 'get',
								watched: 'prop2_after_getter',
								entity: 'entity1'
							},
							{
								value: 'prop4_fromsetter',
								attr: 'prop4',
								method: 'get',
								watched: `${prop3}_fromgetter`,
								entity: 'entity1'
							},
							{
								value: undefined,
								attr: 'prop9',
								method: 'get',
								watched: 'prop2_after_getter',
								entity: 'entity2'
							}
						]);
						expect(counter.list("query2")).to.deep.equal([
							{ value: 'prop2', attr: 'prop2', method: 'get', entity: 'entity2' },
							{
								value: prop1,
								attr: 'prop1',
								method: 'get',
								entity: 'entity2'
							},
							{
								value: prop3,
								attr: 'prop3',
								method: 'get',
								entity: 'entity2'
							},
							{
								value: 'prop5_fromsetter',
								attr: 'prop5',
								method: 'get',
								watched: 'prop2_after_getter',
								entity: 'entity2'
							},
							{
								value: 'prop4_fromsetter',
								attr: 'prop4',
								method: 'get',
								watched: `${prop3}_fromgetter`,
								entity: 'entity2'
							},
							{
								value: undefined,
								attr: 'prop9',
								method: 'get',
								watched: 'prop2_after_getter',
								entity: 'entity2'
							}
						]);
						expect(counter.list("collection")).to.deep.equal([
							{ value: 'prop2', attr: 'prop2', method: 'get', entity: 'entity1' },
							{
								value: prop1,
								attr: 'prop1',
								method: 'get',
								entity: 'entity1'
							},
							{
								value: prop3,
								attr: 'prop3',
								method: 'get',
								entity: 'entity1'
							},
							{
								value: 'prop5_fromsetter',
								attr: 'prop5',
								method: 'get',
								watched: 'prop2_after_getter',
								entity: 'entity1'
							},
							{
								value: 'prop4_fromsetter',
								attr: 'prop4',
								method: 'get',
								watched: `${prop3}_fromgetter`,
								entity: 'entity1'
							},
							{
								value: undefined,
								attr: 'prop9',
								method: 'get',
								watched: 'prop2_after_getter',
								entity: 'entity2'
							},
							{ value: 'prop2', attr: 'prop2', method: 'get', entity: 'entity2' },
							{
								value: prop1,
								attr: 'prop1',
								method: 'get',
								entity: 'entity2'
							},
							{
								value: prop3,
								attr: 'prop3',
								method: 'get',
								entity: 'entity2'
							},
							{
								value: 'prop5_fromsetter',
								attr: 'prop5',
								method: 'get',
								watched: 'prop2_after_getter',
								entity: 'entity2'
							},
							{
								value: 'prop4_fromsetter',
								attr: 'prop4',
								method: 'get',
								watched: `${prop3}_fromgetter`,
								entity: 'entity2'
							},
							{
								value: undefined,
								attr: 'prop9',
								method: 'get',
								watched: 'prop2_after_getter',
								entity: 'entity2'
							}
						]);
					});
				});
				it("Should not allow a watcher to watch another watcher", () => {
					let schema = {
						model: {
							entity: "entity",
							service: "service",
							version: "version"
						},
						attributes: {
							prop1: {
								type: "string"
							},
							prop2: {
								type: "string",
								watch: ["prop1"]
							},
							prop3: {
								type: "string",
								watch: ["prop2", "prop1"]
							},
							prop4: {
								type: "string",
								watch: ["prop3"]
							},
							prop5: {
								type: "string",
								watch: ["prop1", "prop2", "prop3", "prop4"]
							},
							prop6: {
								type: "string",
								watch: ["prop1"]
							},
							prop7: {
								type: "string"
							}
						},
						indexes: {
							record: {
								pk: {
									field: "pk",
									facets: ["prop1"]
								}
							}
						}
					}

					expect(() => new Entity(schema)).to.throw(`Attribute Validation Error. Attributes may only "watch" other attributes also watch attributes. The following attributes are defined with ineligible attributes to watch: "prop3"->"prop2", "prop5"->"prop2", "prop4"->"prop3", "prop5"->"prop3", "prop5"->"prop4". - For more detail on this error reference: https://github.com/tywalch/electrodb#invalid-attribute-watch-definition`);
				});
				it("Should not allow a watcher to watch an unknown property", () => {
					let schema = {
						model: {
							entity: "entity",
							service: "service",
							version: "version"
						},
						attributes: {
							prop1: {
								type: "string"
							},
							prop2: {
								type: "string",
								watch: ["prop1"]
							},
							prop3: {
								type: "string",
								watch: ["unknown"]
							},
						},
						indexes: {
							record: {
								pk: {
									field: "pk",
									facets: ["prop1"]
								}
							}
						}
					}

					expect(() => new Entity(schema)).to.throw(`Attribute Validation Error. The following attributes are defined to "watch" invalid/unknown attributes: "prop3"->"unknown". - For more detail on this error reference: https://github.com/tywalch/electrodb#invalid-attribute-watch-definition`);
				});
			});
			describe("Query Options", async () => {
				let entity = uuid();
				let db = new Entity(
					{
						service: SERVICE,
						entity: entity,
						table: "electro",
						version: "1",
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
									facets: ["date"],
								},
								sk: {
									field: "sk",
									facets: ["id"],
								},
							},
						},
					},
					{ client },
				);
				it("Should return the originally returned results", async () => {
					let id = uuid();
					let date = moment.utc().format();
					let someValue = "ABDEF";
					let putRecord = await db.put({ id, date, someValue }).go({ raw: true });
					expect(putRecord).to.deep.equal({});
					let getRecord = await db.get({ id, date }).go({ raw: true });
					if (clientVersion === c.DocumentClientVersions.v2) {
						expect(getRecord).to.deep.equal({
							Item: {
								__edb_e__: entity,
								__edb_v__: "1",
								id,
								date,
								someValue: someValue + " wham",
								sk: `$${entity}#id_${id}`.toLowerCase(),
								pk: `$${SERVICE}_1#date_${date}`.toLowerCase(),
							}
						});
					} else {
						expect(getRecord).to.have.keys(['$metadata', 'ConsumedCapacity', 'Item']);
					}
					let updateRecord = await db
						.update({ id, date })
						.set({ someValue })
						.go({ raw: true });
					if (clientVersion === c.DocumentClientVersions.v2) {
						expect(updateRecord).to.deep.equal({});
					} else {
						expect(updateRecord).to.have.keys(['$metadata', 'Attributes', 'ConsumedCapacity', 'ItemCollectionMetrics']);
					}

					let queryRecord = await db.query.record({ id, date }).go({ raw: true });
					if (clientVersion === c.DocumentClientVersions.v2) {
						expect(queryRecord).to.deep.equal({
							Items: [
								{
									__edb_e__: entity,
									__edb_v__: "1",
									id,
									date,
									someValue: someValue + " wham",
									sk: `$${entity}#id_${id}`.toLowerCase(),
									pk: `$${SERVICE}_1#date_${date}`.toLowerCase(),
								},
							],
							Count: 1,
							ScannedCount: 1,
						});
					} else {
						expect(queryRecord).to.have.keys(['Items', 'Count', 'ScannedCount', 'LastEvaluatedKey', 'ConsumedCapacity', '$metadata']);
					}
					let recordWithKeys = await db.get({id, date}).go({includeKeys: true});
					expect(recordWithKeys).to.deep.equal({
						id,
						date,
						someValue: "ABDEF wham bam",
						__edb_e__: entity,
						__edb_v__: "1",
						sk: `$${entity}#id_${id}`.toLowerCase(),
						pk: `$${SERVICE}_1#date_${date}`.toLowerCase(),
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
						return store.mall === mall + "abc" && store.rent <= max;
					});

					let belowMarketUnits = await MallStores.query
						.units({ mall: mall + "abc", building })
						.maxRent(max)
						.go();

					expect(belowMarketUnits)
						.to.be.an("array")
						.and.have.length(3)
						.and.deep.have.members(filteredStores);
				}).timeout(20000);
				it("Should filter with the correct field name", async () => {
					let db = new Entity(
						{
							service: SERVICE,
							entity: uuid(),
							table: "electro",
							version: "1",
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
										facets: ["date"],
									},
									sk: {
										field: "sk",
										facets: ["id"],
									},
								},
							},
						},
						{ client },
					);
					let date = moment.utc().format();
					let property = "ABDEF";
					let recordParams = db.put({ date, property }).params();
					expect(recordParams.Item.propertyVal).to.equal(property);
					let record = await db.put({ date, property }).go();
					let found = await db.query
						.record({ date })
						.filter((attr) => attr.property.eq(property))
						.go();
					let foundParams = db.query
						.record({ date })
						.filter((attr) => attr.property.eq(property))
						.params();
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
							service: SERVICE,
							entity: entity,
							table: "electro",
							version: "1",
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
										facets: ["id"],
									},
									sk: {
										field: "sk",
										facets: ["property"],
									},
								},
							},
						},
						{ client },
					);
					let date = moment.utc().format();
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
						.filter(({ property }) => property.gt("A"))
						.filter(
							({ color, id }) => `
							(${color.notContains("green")} OR ${id.contains("weird_value")})
						`,
						)
						.filter(({ property }) => property.notContains("Z"))
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
								facets: ["prop1"]
							},
							sk: {
								field: "sk",
								facets: ["prop2"]
							}
						},
						index2: {
							index: "gsi1pk-gsi1sk-index",
							pk: {
								field: "gsi1pk",
								facets: ["prop3"]
							},
							sk: {
								field: "gsi1sk",
								facets: ["prop4"]
							}
						},
						index3: {
							index: "gsi2pk-gsi2sk-index",
							pk: {
								field: "gsi2pk",
								facets: ["prop5"]
							},
							sk: {
								field: "gsi2sk",
								facets: ["prop6", "prop7", "prop8"]
							}
						}
					}
				}, {table: "electro", client});

				it("Should not allow the table PKs or SKs to be updated", async () => {
					try {
						await Dummy.update({prop1: "abc", prop2: "def"})
							.set({prop9: "propz9", prop2: "propz6"})
							.go()
						throw null;
					} catch(err) {
						expect(err).to.not.be.null;
						expect(err.message).to.equal(`Attribute "prop2" is Read-Only and cannot be updated - For more detail on this error reference: https://github.com/tywalch/electrodb#invalid-attribute`);
					}
				});

				it("Should not allow the table PKs or SKs to be patched", async () => {
					try {
						await Dummy.patch({prop1: "abc", prop2: "def"})
							.set({prop9: "propz9", prop2: "propz6"})
							.go()
						throw null;
					} catch(err) {
						expect(err).to.not.be.null;
						expect(err.message).to.equal(`Attribute "prop2" is Read-Only and cannot be updated - For more detail on this error reference: https://github.com/tywalch/electrodb#invalid-attribute`);
					}
				});

				it("Should not allow the gsis with partially complete PKs or SKs to be updated", async () => {
					try {
						await Dummy.update({prop1: "abc", prop2: "def"})
							.set({prop9: "propz9", prop6: "propz6"})
							.go()
						throw null;
					} catch(err) {
						expect(err).to.not.be.null;
						expect(err.message).to.equal(`Incomplete composite attributes: Without the composite attributes "prop7", "prop8" the following access patterns cannot be updated: "index3"  - For more detail on this error reference: https://github.com/tywalch/electrodb#incomplete-composite-attributes`);
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
			})
			describe("Pagination", async () => {
				it("Should return a pk and sk that match the last record in the result set, and should be able to be passed in for more results", async () => {
					// THIS IS A FOOLISH TEST: IT ONLY FULLY WORKS WHEN THE TABLE USED FOR TESTING IS FULL OF RECORDS. THIS WILL HAVE TO DO UNTIL I HAVE TIME TO FIGURE OUT A PROPER WAY MOCK DDB.
					let MallStores = new Entity(model, { client });
					let results = await MallStores.scan.page(null, {raw: true});
					expect(results).to.be.an("array").and.have.length(2);
					// Scan may not return records, dont force a bad test then
					let [index, stores] = results;
					if (index && stores && stores.Items.length) {
						expect(index).to.have.a.property('pk');
						expect(index).to.have.a.property('sk');
						expect(stores.Items).to.be.an("array");
						expect(stores.Items[0]).to.have.a.property('pk');
						expect(stores.Items[0]).to.have.a.property('sk');
						let [nextIndex, nextStores] = await MallStores.scan.page(index, {raw: true});
						expect(nextIndex).to.not.deep.equal(index);
						expect(nextStores.Items).to.be.an("array");
						if (nextStores.Items.length) {
							expect(nextStores.Items[0]).to.have.a.property('pk');
							expect(nextStores.Items[0]).to.have.a.property('sk');
						}
					}
				}).timeout(10000);
			});
			describe("Template and composite attribute arrays", async () => {
				it("Should resolve composite attribute labels at an index level", async () => {
					const SERVICE = "facettest";
					const ENTITY = uuid();
					let model = {
						service: SERVICE,
						entity: ENTITY,
						table: "electro",
						version: "1",
						attributes: {
							id: {
								type: "string",
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
								validate: (date) => moment(date, "YYYY-MM-DD").isValid() ? "" : "Invalid date format",
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
									facets: ["sector"],
								},
								sk: {
									field: "sk",
									facets: ["id"],
								},
							},
							units: {
								index: "gsi1pk-gsi1sk-index",
								pk: {
									field: "gsi1pk",
									facets: "mallz_${mall}",
								},
								sk: {
									field: "gsi1sk",
									facets: "b_${building}#u_${unit}#s_${store}",
								},
							},
							leases: {
								index: "gsi2pk-gsi2sk-index",
								pk: {
									field: "gsi2pk",
									facets: "m_${mall}",
								},
								sk: {
									field: "gsi2sk",
									facets: "l_${leaseEnd}#s_${store}#b_${building}#u_${unit}",
								},
							},
							categories: {
								index: "gsi3pk-gsi3sk-index",
								pk: {
									field: "gsi3pk",
									facets: ["mall"],
								},
								sk: {
									field: "gsi3sk",
									facets: ["category", "building", "unit", "store"],
								},
							},
							shops: {
								index: "gsi4pk-gsi4sk-index",
								pk: {
									field: "gsi4pk",
									facets: ["store"],
								},
								sk: {
									field: "gsi4sk",
									facets: ["mall", "building", "unit"],
								},
							},
						},
						filters: {
							maxRent({ rent }, max) {
								return rent.lte(max);
							},
						},
					};
					let MallStores = new Entity(model, { client });
					let id = uuid();
					let mall = "EastPointe";
					let store = "LatteLarrys";
					let sector = "A1";
					let category = "food/coffee";
					let leaseEnd = "2020-01-20";
					let rent = "0.00";
					let building = "BuildingZ";
					let unit = "G1";
					let getParams = MallStores.get({sector, id}).params();
					let unitParams = MallStores.query.units({mall, building, unit}).params();
					let leasesParams = MallStores.query.leases({mall, leaseEnd, store}).params();
					let shopParams = MallStores.query.shops({mall, building, store}).params();
					let createParams = MallStores.create({sector, store, mall, rent, category, leaseEnd, unit, building, id}).params();
					expect(getParams).to.deep.equal({
						Key: {
							pk: '$facettest_1#sector_a1',
							sk: `$${ENTITY}#id_${id}`
						},
						TableName: 'electro'
					});
					expect(unitParams).to.deep.equal({
						KeyConditionExpression: '#pk = :pk and begins_with(#sk1, :sk1)',
						TableName: 'electro',
						ExpressionAttributeNames: { '#pk': 'gsi1pk', '#sk1': 'gsi1sk' },
						ExpressionAttributeValues: { ':pk': 'mallz_eastpointe', ':sk1': 'b_buildingz#u_g1#s_' },
						IndexName: 'gsi1pk-gsi1sk-index'
					});
					expect(leasesParams).to.deep.equal({
						KeyConditionExpression: '#pk = :pk and begins_with(#sk1, :sk1)',
						TableName: 'electro',
						ExpressionAttributeNames: { '#pk': 'gsi2pk', '#sk1': 'gsi2sk' },
						ExpressionAttributeValues: { ':pk': 'm_eastpointe', ':sk1': 'l_2020-01-20#s_lattelarrys#b_' },
						IndexName: 'gsi2pk-gsi2sk-index'
					});
					expect(shopParams).to.deep.equal({
						KeyConditionExpression: '#pk = :pk and begins_with(#sk1, :sk1)',
						TableName: 'electro',
						ExpressionAttributeNames: { '#pk': 'gsi4pk', '#sk1': 'gsi4sk' },
						ExpressionAttributeValues: {
							':pk': '$facettest_1#store_lattelarrys',
							':sk1': `$${ENTITY}#mall_eastpointe#building_buildingz#unit_`
						},
						IndexName: 'gsi4pk-gsi4sk-index'
					});
					expect(createParams).to.deep.equal({
						Item: {
							storeLocationId: id,
							sector: 'A1',
							mallId: 'EastPointe',
							storeId: 'LatteLarrys',
							buildingId: 'BuildingZ',
							unitId: 'G1',
							category: 'food/coffee',
							leaseEnd: '2020-01-20',
							rent: '0.00',
							pk: '$facettest_1#sector_a1',
							sk: `$${ENTITY}#id_${id}`,
							gsi1pk: 'mallz_eastpointe',
							gsi1sk: 'b_buildingz#u_g1#s_lattelarrys',
							gsi2pk: 'm_eastpointe',
							gsi2sk: 'l_2020-01-20#s_lattelarrys#b_buildingz#u_g1',
							gsi3pk: '$facettest_1#mall_eastpointe',
							gsi3sk: `$${ENTITY}#category_food/coffee#building_buildingz#unit_g1#store_lattelarrys`,
							gsi4pk: '$facettest_1#store_lattelarrys',
							gsi4sk: `$${ENTITY}#mall_eastpointe#building_buildingz#unit_g1`,
							__edb_e__: ENTITY,
							__edb_v__: '1'
						},
						TableName: 'electro',
						ConditionExpression: 'attribute_not_exists(#pk) AND attribute_not_exists(#sk)',
						ExpressionAttributeNames: {"#pk": "pk", "#sk": "sk"}
					});
					let createRecord = await MallStores.create({sector, store, mall, rent, category, leaseEnd, unit, building, id}).go();
					expect(createRecord).to.deep.equal({
						id,
						sector: 'A1',
						mall: 'EastPointe',
						store: 'LatteLarrys',
						building: 'BuildingZ',
						unit: 'G1',
						category: 'food/coffee',
						leaseEnd: '2020-01-20',
						rent: '0.00'
					});
					await sleep(1500);

					let unitRecord = await MallStores.query.units({mall, building, unit}).go();
					let leasesRecord = await MallStores.query.leases({mall, leaseEnd, store}).go();
					let shopRecord = await MallStores.query.shops({mall, building, store}).go();
					expect(unitRecord.find(record => record.id === id)).to.not.be.undefined;
					expect(leasesRecord.find(record => record.id === id)).to.not.be.undefined;
					expect(shopRecord.find(record => record.id === id)).to.not.be.undefined;
				})
			});
			describe("Hidden Attributes", () => {
				it("Should remove an attribute upon retrieval before returning it back to the user", async () => {
					const entity = new Entity({
						model: {
							entity: "e2",
							service: "s1",
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
								type: "string",
								hidden: true
							},
							prop4: {
								type: "string",
							}
						},
						indexes: {
							record: {
								collection: "collection1",
								pk: {
									field: "pk",
									facets: ["prop1"]
								},
								sk: {
									field: "sk",
									facets: ["prop2"]
								}
							}
						}
					}, {table, client});

					let item = {
						prop1: uuid(),
						prop2: "abc",
						prop3: "should_not_be_returned",
						prop4: "def"
					};

					let data = {
						prop1: item.prop1,
						prop2: item.prop2,
						prop4: item.prop4
					};

					let putResult = await entity.put(item).go();

					let getResponse = await entity
						.get(item)
						.go();

					let queryResponse = await entity.query
						.record(item)
						.where(({prop3}, {eq}) => `${eq(prop3, item.prop3)}`)
						.go();

					expect(putResult).to.deep.equal(data);
					expect(getResponse).to.deep.equal(data);
					expect(queryResponse).to.deep.equal([data]);
				});

				it("Should should be technically possible to make all fields hidden, but not recommended", async () => {
					const entity = new Entity({
						model: {
							entity: "e2",
							service: "s1",
							version: "1"
						},
						attributes: {
							prop1: {
								type: "string",
								hidden: true,
							},
							prop2: {
								type: "string",
								hidden: true,
							},
							prop3: {
								type: "string",
								hidden: true
							},
							prop4: {
								type: "string",
								hidden: true,
							}
						},
						indexes: {
							record: {
								collection: "collection1",
								pk: {
									field: "pk",
									facets: ["prop1"]
								},
								sk: {
									field: "sk",
									facets: ["prop2"]
								}
							}
						}
					}, {table, client});

					let item = {
						prop1: uuid(),
						prop2: "abc",
						prop3: "should_not_be_returned",
						prop4: "def"
					};

					let data = null;

					let putResult = await entity.put(item).go();

					let getResponse = await entity
						.get(item)
						.go();

					let queryResponse = await entity.query
						.record(item)
						.where(({prop3}, {eq}) => `${eq(prop3, item.prop3)}`)
						.go();

					expect(putResult).to.deep.equal(data);
					expect(getResponse).to.deep.equal(data);
					expect(queryResponse).to.deep.equal([]);
				});
			});
			describe("Numeric and boolean keys", () => {
				it("Should create keys with primitive types other than strings if specified as a template without prefix", async () => {
					const entity = new Entity({
						model: {
							entity: "nonstring_indexes",
							service: "tests",
							version: "1"
						},
						attributes: {
							number1: {
								type: "number"
							},
							number2: {
								type: "number"
							},
							number3: {
								type: "number"
							}
						},
						indexes: {
							record: {
								pk: {
									field: "pk",
									template: "${number1}",
								},
								sk: {
									field: "sk",
									template: "${number2}"
								}
							},
							anotherRecord: {
								index: "gsi1",
								pk: {
									field: "gsi1pk",
									template: "${number2}"
								},
								sk: {
									field: "gsi1sk",
									template: "${number1}"
								}
							},
							yetAnotherRecord: {
								index: "gsi2",
								pk: {
									field: "gsi2pk",
									template: "${number1}"
								}
							},
							andAnotherOne: {
								index: "gsi3",
								pk: {
									field: "gsi3pk",
									template: "${number2}"
								}
							}
						}
					}, {table: "electro_nostringkeys", client});
					let putRecord = await entity.put({number1: 55, number2: 66}).go();
					let getRecord = await entity.get({number1: 55, number2: 66}).go();
					let updateRecord = await entity.update({number1: 55, number2: 66}).set({number3: 77}).go();
					let queryRecord = await entity.query.record({number1: 55}).go();
					let deleteRecord = await entity.delete({number1: 55, number2: 66}).go();
					expect(putRecord).to.deep.equal({ number1: 55, number2: 66 });
					expect(getRecord).to.deep.equal({ number1: 55, number2: 66 });
					expect(queryRecord).to.deep.equal([{ number1: 55, number2: 66, number3: 77 }]);
					expect(updateRecord).to.be.empty;
					expect(deleteRecord).to.be.empty;
				});
			});
			describe("Illegal key names", () => {
				const table = "electro_leadingunderscorekeys";
				const entity = new Entity({
					model: {
						entity: "illegalkeynames",
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
					},
					indexes: {
						record: {
							pk: {
								field: "_pk",
								composite: ["prop1"]
							},
							sk: {
								field: "_sk",
								composite: ["prop2"]
							}
						}
					}
				}, {table, client});
				it("should successfully perform a create, patch, and remove with illegal characters in key names", async () => {
					const prop1 = "value1";
					const prop2 = "value2";
					const prop3 = "value3";
					const prop3Patched = "value4";
					const item = await entity.create({prop1, prop2, prop3}).go({response: ""});
					expect(item).to.deep.equal({prop1, prop2, prop3});
					const patched = await entity.patch({prop1, prop2}).set({prop3: prop3Patched}).go({response: "all_new"});
					expect(patched).to.deep.equal({prop1, prop2, prop3: prop3Patched});
					const removed = await entity.remove({prop1, prop2}).go({response: "all_old"});
					expect(removed).to.deep.equal({prop1, prop2, prop3: prop3Patched});
				});
			})
		});
	});
}