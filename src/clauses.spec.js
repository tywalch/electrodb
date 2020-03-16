const { QueryChain, clauses } = require("./clauses");
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
let MallStores = new Entity(schema);
let mall = "mall-value";
let store = "store-value";
let building = "building-value";
let id = "id-value";
let category = "category-value";
let unit = "unit-value";
let leaseEnd = "lease-value";

describe("QueryChain", () => {
	describe("_expectFacets", () => {
		let cProxy = new QueryChain(MallStores, clauses);
		it("Should find all, pk, and sk matches", () => {
			let index = schema.indexes.units.index;
			let facets = MallStores.model.facets.byIndex[index];
			let all = facets.all.map(facet => facet.name);
			let allMatches = cProxy._expectFacets(
				{ store, mall, building, unit },
				all,
			);
			let pkMatches = cProxy._expectFacets(
				{ store, mall, building, unit },
				facets.pk,
			);
			let skMatches = cProxy._expectFacets(
				{ store, mall, building, unit },
				facets.sk,
			);
			expect(allMatches).to.be.deep.equal([mall, building, unit, store]);
			expect(pkMatches).to.be.deep.equal([mall]);
			expect(skMatches).to.be.deep.equal([building, unit, store]);
		});
		it("Should find missing properties from supplied keys", () => {
			let index = schema.indexes.units.index;
			let facets = MallStores.model.facets.byIndex[index];
			let all = facets.all.map(facet => facet.name);
			let allMatches = () => cProxy._expectFacets({ store }, all);
			let pkMatches = () =>
				cProxy._expectFacets(
					{ store, building, unit },
					facets.pk,
					"partition keys",
				);
			let skMatches = () =>
				cProxy._expectFacets({ store, mall, building }, facets.sk, "sort keys");
			expect(allMatches).to.throw(
				"Incomplete or invalid key facets supplied. Missing properties: mall, building, unit",
			);
			expect(pkMatches).to.throw(
				"Incomplete or invalid partition keys supplied. Missing properties: mall",
			);
			expect(skMatches).to.throw(
				"Incomplete or invalid sort keys supplied. Missing properties: unit",
			);
		});
	});
	describe("chaining", () => {
		let index = schema.indexes.units.index;
		let facets = MallStores.model.facets.byIndex[index];
		let cProxy = new QueryChain(MallStores, clauses);
		let shops = cProxy.make(index, facets);
		// console.log(shops.query().between().and.gt().lt().or.contains().params());
	});
});
