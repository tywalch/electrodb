const { Entity } = require("../src/entity");
const { expect } = require("chai");
const uuidv4 = require("uuid").v4;
const moment = require("moment");
const DynamoDB = require("aws-sdk/clients/dynamodb");
const client = new DynamoDB.DocumentClient({
	region: "us-east-1",
});

let model = {
	service: "MallStoreDirectory",
	entity: "MallStores",
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
			validate: date =>
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
			expect(stores)
				.to.be.an("array")
				.and.have.length(10);

			let mallOne = malls[0];
			let mallOneIds = stores
				.filter(store => store.mall === mallOne)
				.map(store => store.id);

			let mallOneStores = await MallStores.query
				.units({
					mall: mallOne,
				})
				.go();

			let mallOneMatches = mallOneStores.every(store =>
				mallOneIds.includes(store.id),
			);

			expect(mallOneMatches);
			expect(mallOneStores)
				.to.be.an("array")
				.and.have.length(5);

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
				.go();

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
			let filteredStores = stores.filter(store => {
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
			// console.log(belowMarketUnits);
		}).timeout(20000);
	});
});
