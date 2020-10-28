const sleep = async (ms) => new Promise((resolve) => setTimeout(resolve, ms));

process.env.AWS_NODEJS_CONNECTION_REUSE_ENABLED = 1;
const { Entity } = require("../src/entity");
const { expect } = require("chai");
const uuidv4 = require("uuid").v4;
const moment = require("moment");
const DynamoDB = require("aws-sdk/clients/dynamodb");
const client = new DynamoDB.DocumentClient({
	region: "us-east-1",
});
const SERVICE = "BugBeater";
const ENTITY = "TEST_ENTITY";
let model = {
	service: SERVICE,
	entity: ENTITY,
	table: "electro",
	version: "1",
	attributes: {
		id: {
			type: "string",
			default: () => uuidv4(),
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
};

describe("Entity", async () => {
	before(async () => sleep(1000))
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
			let sector = uuidv4();
			let malls = [uuidv4(), uuidv4()];
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
			expect(updatedStore).to.deep.equal({});
			let secondStoreAfterUpdate = await MallStores.get(secondStore).go();
			expect(secondStoreAfterUpdate.rent).to.equal(newRent);
		}).timeout(20000);

		it("Should not create a overwrite existing record", async () => {
			let id = uuidv4();
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
			let id = uuidv4();
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
			let id = uuidv4();
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
			expect(electroErr.message).to.be.equal("Requested resource not found - For more detail on this error reference: https://github.com/tywalch/electrodb#aws-error")
			expect(originalSuccess).to.be.false;
			expect(originalErr.stack.split(/\r?\n/)[1].includes("aws-sdk")).to.be.true;
		});
	});


	describe("Delete records", async () => {
		it("Should create then delete a record", async () => {
			let record = new Entity(
				{
					service: SERVICE,
					entity: ENTITY,
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
			let prop1 = uuidv4();
			let prop2 = uuidv4();
			await record.put({ prop1, prop2 }).go();
			let recordExists = await record.get({ prop1, prop2 }).go();
			await record.delete({ prop1, prop2 }).go();
			await sleep(150);
			let recordNoLongerExists = await record.get({ prop1, prop2 }).go();
			expect(!!Object.keys(recordExists).length).to.be.true;
			expect(!!Object.keys(recordNoLongerExists).length).to.be.false;
		});
	});

	describe("Getters/Setters", async () => {
		let db = new Entity(
			{
				service: SERVICE,
				entity: uuidv4(),
				table: "electro",
				version: "1",
				attributes: {
					id: {
						type: "string",
						default: () => uuidv4(),
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
			let id = uuidv4();
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
			expect(updatedRecord).to.deep.equal({});
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
		let entity = uuidv4();
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
			let id = uuidv4();
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
					sk: `$${entity}#id_${id}`.toLowerCase(),
					pk: `$${SERVICE}_1#date_${date}`.toLowerCase(),
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
						sk: `$${entity}#id_${id}`.toLowerCase(),
						pk: `$${SERVICE}_1#date_${date}`.toLowerCase(),
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
			let sector = uuidv4();
			let malls = [uuidv4(), uuidv4()];
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
				return store.mall === mall && store.rent <= max;
			});

			let belowMarketUnits = await MallStores.query
				.units({ mall, building })
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
					entity: uuidv4(),
					table: "electro",
					version: "1",
					attributes: {
						id: {
							type: "string",
							default: () => uuidv4(),
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
			let entity = uuidv4();
			let id = uuidv4();
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
	describe("Pagination", async () => {
		it("Should return a pk and sk that match the last record in the result set, and should be able to be passed in for more results", async () => {
			// THIS IS A FOOLISH TEST: IT ONLY FULLY WORKS WHEN THE TABLE USED FOR TESTING IS FULL OF RECORDS. THIS WILL HAVE TO DO UNTIL I HAVE TIME TO FIGURE OUT A PROPER WAY MOCK DDB.
			let MallStores = new Entity(model, { client });
			let results = await MallStores.scan.page(null, {raw: true});
			expect(results).to.be.an("array").and.have.length(2);
			// Scan may not return records, dont force a bad test then
			let [index, stores] = results;
			if (stores && stores.Items.length) {
				expect(index).to.have.a.property('pk');
				expect(index).to.have.a.property('sk')
				expect(stores.Items).to.be.an("array")
				expect(stores.Items[0]).to.have.a.property('pk')
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
	})
});
