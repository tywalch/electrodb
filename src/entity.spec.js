const { Entity } = require("./entity");
const { expect } = require("chai");
const moment = require("moment");
const uuidV4 = require("uuid/v4");

let schema = {
	service: "MallStoreDirectory",
	entity: "MallStores",
	table: "StoreDirectory",
	version: "1",
	attributes: {
		id: {
			type: "string",
			default: () => uuidV4(),
			field: "storeLocationId",
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
			validate: date => moment(date, "YYYY-MM-DD").isValid(),
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
				compose: ["id"],
			},
		},
		units: {
			index: "gsi1pk-gsi1sk-index",
			pk: {
				field: "gsi1pk",
				compose: ["mall"],
			},
			sk: {
				field: "gsi1sk",
				compose: ["building", "unit", "store"],
			},
		},
		leases: {
			index: "gsi2pk-gsi2sk-index",
			pk: {
				field: "gsi2pk",
				compose: ["mall"],
			},
			sk: {
				field: "gsi2sk",
				compose: ["leaseEnd", "store", "building", "unit"],
			},
		},
		categories: {
			index: "gsi3pk-gsi3sk-index",
			pk: {
				field: "gsi3pk",
				compose: ["mall"],
			},
			sk: {
				field: "gsi3sk",
				compose: ["category", "building", "unit", "store"],
			},
		},
		shops: {
			index: "gsi4pk-gsi4sk-index",
			pk: {
				field: "gsi4pk",
				compose: ["store"],
			},
			sk: {
				field: "gsi4sk",
				compose: ["mall", "building", "unit"],
			},
		},
	},
};

describe("Entity", () => {
	describe("Schema parsing", () => {
		let MallStores = new Entity(schema);
		// console.log(JSON.stringify(MallStores.schema));
	});
	describe("Making keys", () => {
		let MallStores = new Entity(schema);
		let mall = "EastPointe";
		let store = "LatteLarrys";
		let building = "BuildingA";
		let id = uuidV4();
		let category = "coffee";
		let unit = "B54";
		let leaseEnd = "2020-01-20";
		it("Should return the approprate pk and sk for a given index", () => {
			let index = schema.indexes.categories.index;
			let { pk, sk } = MallStores.makeIndexKeys(
				index,
				{ mall },
				{ category, building, unit, store },
			);
			expect(pk).to.equal("$MallStoreDirectory_1#mall_EastPointe");
			expect(sk)
				.to.be.an("array")
				.and.have.length(1)
				.and.include(
					"$MallStores#category_coffee#building_BuildingA#unit_B54#store_LatteLarrys",
				);
		});
		it("Should stop making a key early when there is a gap in the supplied facets", () => {
			let index = schema.indexes.categories.index;
			let { pk, sk } = MallStores.makeIndexKeys(
				index,
				{ mall },
				{ category, building, store },
			);
			expect(pk).to.equal("$MallStoreDirectory_1#mall_EastPointe");
			expect(sk)
				.to.be.an("array")
				.and.have.length(1)
				.and.include("$MallStores#category_coffee#building_BuildingA#unit_");
		});
		it("Should return the approprate pk and multiple sks when given multiple", () => {
			let index = schema.indexes.shops.index;
			let { pk, sk } = MallStores.makeIndexKeys(
				index,
				{ store },
				{ mall, building: "building1" },
				{ mall, building: "building5" },
			);
			expect(pk).to.equal("$MallStoreDirectory_1#store_LatteLarrys");
			expect(sk)
				.to.be.an("array")
				.and.have.length(2)
				.and.to.have.members([
					"$MallStores#mall_EastPointe#building_building1#unit_",
					"$MallStores#mall_EastPointe#building_building5#unit_",
				]);
		});
		it("Should throw on bad index", () => {
			expect(() => MallStores.makeIndexKeys("bad_index")).to.throw(
				"Invalid index: bad_index",
			);
		});
	});
	describe("Identifying indexes by facets", () => {
		let MallStores = new Entity(schema);
		let mall = "123";
		let store = "123";
		let building = "123";
		let id = "123";
		let category = "123";
		let unit = "123";
		let leaseEnd = "123";
		it("Should match on the primary index", () => {
			let { index, keys } = MallStores._findBestIndexKeyMatch({ id });
			expect(keys).to.be.deep.equal([{ name: "id", type: "pk" }]);
			expect(index).to.be.equal("");
		});
		it("Should match on gsi1pk-gsi1sk-index", () => {
			let { index, keys } = MallStores._findBestIndexKeyMatch({
				mall,
				building,
				unit,
			});
			expect(keys).to.be.deep.equal([
				{ name: "mall", type: "pk" },
				{ name: "building", type: "sk" },
				{ name: "unit", type: "sk" },
			]);
			expect(index).to.be.deep.equal(schema.indexes.units.index);
		});
		it("Should match on gsi2pk-gsi2sk-index", () => {
			let { index, keys } = MallStores._findBestIndexKeyMatch({
				mall,
				leaseEnd,
			});
			expect(keys).to.be.deep.equal([
				{ name: "mall", type: "pk" },
				{ name: "leaseEnd", type: "sk" },
			]);
			expect(index).to.be.deep.equal(schema.indexes.leases.index);
		});
		it("Should match on gsi3pk-gsi3sk-index", () => {
			let { index, keys } = MallStores._findBestIndexKeyMatch({
				mall,
				category,
			});
			expect(keys).to.be.deep.equal([
				{ name: "mall", type: "pk" },
				{ name: "category", type: "sk" },
			]);
			expect(index).to.be.deep.equal(schema.indexes.categories.index);
		});
		it("Should match on gsi4pk-gsi4sk-index", () => {
			let { index, keys } = MallStores._findBestIndexKeyMatch({ mall, store });
			expect(keys).to.be.deep.equal([
				{ name: "store", type: "pk" },
				{ name: "mall", type: "sk" },
			]);
			expect(index).to.be.deep.equal(schema.indexes.shops.index);
		});
		it("Should pick either gsi4pk-gsi4sk-index or gsi1pk-gsi1sk-index because both are viable indexes", () => {
			let { index, keys } = MallStores._findBestIndexKeyMatch({
				mall,
				store,
				building,
				category,
			});
			expect(keys).to.be.deep.equal([
				{ name: "mall", type: "pk" },
				{ name: "category", type: "sk" },
				{ name: "building", type: "sk" },
			]);
			expect(index).to.be.deep.equal(schema.indexes.categories.index);
		});
		it("Should match not match any index", () => {
			let { index, keys } = MallStores._findBestIndexKeyMatch({ unit });
			expect(keys).to.be.deep.equal([]);
			expect(index).to.be.deep.equal("");
		});
	});
});
