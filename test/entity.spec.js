const { Entity, clauses } = require("../src/entity");
const { expect } = require("chai");
const moment = require("moment");
const uuidV4 = require("uuid/v4");

/*
	todo: add check for untilized SKs to then be converted to filters  
*/

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
	filters: {
		rentsLeaseEndFilter: function(
			attr,
			{ lowRent, beginning, end, location } = {},
		) {
			return `(${attr.rent.gte(lowRent)} AND ${attr.mall.eq(
				location,
			)}) OR ${attr.leaseEnd.between(beginning, end)}`;
		},
	},
	indexes: {
		store: {
			pk: {
				field: "pk",
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
};

describe("Entity", () => {
	describe("Schema parsing", () => {
		let MallStores = new Entity(schema);
		// console.log(JSON.stringify(MallStores.schema));
	});
	describe("Schema validation", () => {
		let MallStores = new Entity(schema);
		it("Should enforce enum validation on enum type attribute", () => {
			let [
				isValid,
				reason,
			] = MallStores.model.schema.attributes.category.isValid("BAD_CATEGORY");
			expect(!isValid);
			expect(reason).to.eq(
				"Value not found in set of acceptable values: food/coffee, food/meal, clothing, electronics, department, misc",
			);
		});
		it("Should prevent the update of the main partition key without the user needing to define the property as read-only in their schema", () => {
			let id = uuidV4();
			let rent = "0.00";
			let category = "food/coffee";
			let mall = "EastPointe";
			expect(() =>
				MallStores.update({ id }).set({ rent, category, id }),
			).to.throw("Attribute id is Read-Only and cannot be updated");
			expect(() =>
				MallStores.update({ id }).set({ rent, category, mall }),
			).to.not.throw();
		});
		it("Should identify impacted indexes from attributes", () => {
			let id = uuidV4();
			let rent = "0.00";
			let category = "food/coffee";
			let mall = "EastPointe";
			let leaseEnd = "2020/04/27";
			let unit = "B45";
			let building = "BuildingB";
			let store = "LatteLarrys";
			let impact1 = MallStores._getIndexImpact({ rent, category, mall });
			let impact2 = MallStores._getIndexImpact({ leaseEnd });
			let impact3 = MallStores._getIndexImpact({ mall });
			expect(impact1).to.deep.equal([
				true,
				{
					incomplete: ["building", "unit", "store", "building", "unit"],
					complete: {
						facets: { mall, category },
						indexes: ["gsi1pk-gsi1sk-index", "gsi2pk-gsi2sk-index"],
					},
				},
			]);
			expect(impact2).to.deep.equal([
				true,
				{
					incomplete: ["store", "building", "unit"],
					complete: { facets: { leaseEnd }, indexes: [] },
				},
			]);
			expect(impact3).to.deep.equal([
				true,
				{
					incomplete: ["building", "unit"],
					complete: {
						facets: { mall },
						indexes: [
							"gsi1pk-gsi1sk-index",
							"gsi2pk-gsi2sk-index",
							"gsi3pk-gsi3sk-index",
						],
					},
				},
			]);
		});
	});
	describe("navigate query chains", () => {
		let MallStores = new Entity(schema);
		it("Should allow for a multiple combinations given a schema", () => {
			let mall = "EastPointe";
			let store = "LatteLarrys";
			let building = "BuildingA";
			let id = uuidV4();
			let category = "food/coffee";
			let unit = "B54";
			let leaseEnd = "2020-01-20";
			let rent = "0.00";
			buildingOne = "BuildingA";
			buildingTwo = "BuildingF";
			let get = MallStores.get({ id });
			expect(get).to.have.keys("go", "params");
			let del = MallStores.delete({ id });
			expect(del).to.have.keys("go", "params");
			let update = MallStores.update({ id }).set({ rent, category });
			expect(update).to.have.keys("go", "params", "set");
			let put = MallStores.put({
				store,
				mall,
				building,
				rent,
				category,
				leaseEnd,
				unit,
			});
			expect(put).to.have.keys("go", "params");
			let queryUnitsBetween = MallStores.query
				.units({ mall })
				.between({ building: buildingOne }, { building: buildingTwo });
			expect(queryUnitsBetween).to.have.keys(
				"go",
				"params",
				"rentsLeaseEndFilter",
			);
			let queryUnitGt = MallStores.query.units({ mall }).gt({ building });
			expect(queryUnitGt).to.have.keys("go", "params", "rentsLeaseEndFilter");
			let queryUnitsGte = MallStores.query.units({ mall }).gte({ building });
			expect(queryUnitsGte).to.have.keys("go", "params", "rentsLeaseEndFilter");
			let queryUnitsLte = MallStores.query.units({ mall }).lte({ building });
			expect(queryUnitsLte).to.have.keys("go", "params", "rentsLeaseEndFilter");
			let queryUnitsLt = MallStores.query.units({ mall }).lt({ building });
			expect(queryUnitsLt).to.have.keys("go", "params", "rentsLeaseEndFilter");
		});
		it("Should create parameters for a given chain", () => {
			let mall = "EastPointe";
			let store = "LatteLarrys";
			let building = "BuildingA";
			let id = uuidV4();
			let category = "food/coffee";
			let unit = "B54";
			let leaseEnd = "2020-01-20";
			let rent = "0.00";
			let buildingOne = "BuildingA";
			let buildingTwo = "BuildingF";
			let unitOne = "A1";
			let unitTwo = "F6";
			let get = MallStores.get({ id }).params();
			expect(get).to.be.deep.equal({
				TableName: "StoreDirectory",
				Key: { pk: `$MallStoreDirectory_1#id_${id}` },
			});

			let del = MallStores.delete({ id }).params();
			expect(del).to.be.deep.equal({
				TableName: "StoreDirectory",
				Key: { pk: `$MallStoreDirectory_1#id_${id}` },
			});

			let update = MallStores.update({ id })
				.set({ mall, store, building, category, unit, rent, leaseEnd })
				.params();
			expect(update).to.deep.equal({
				UpdateExpression:
					"SET #mall = :mall, #store = :store, #building = :building, #unit = :unit, #category = :category, #leaseEnd = :leaseEnd, #rent = :rent",
				ExpressionAttributeNames: {
					"#mall": "mall",
					"#store": "store",
					"#building": "building",
					"#unit": "unit",
					"#category": "category",
					"#leaseEnd": "leaseEnd",
					"#rent": "rent",
				},
				ExpressionAttributeValues: {
					":mall": mall,
					":store": store,
					":building": building,
					":unit": unit,
					":category": category,
					":leaseEnd": leaseEnd,
					":rent": rent,
				},
				TableName: "StoreDirectory",
				Key: {
					pk: `$MallStoreDirectory_1#id_${id}`,
				},
			});

			let put = MallStores.put({
				store,
				mall,
				building,
				rent,
				category,
				leaseEnd,
				unit,
			}).params();
			expect(put).to.deep.equal({
				Item: {
					id: put.Item.id,
					mall,
					store,
					building,
					unit,
					category,
					leaseEnd,
					rent,
					pk: `$MallStoreDirectory_1#id_${put.Item.id}`,
					gsi1pk: `$MallStoreDirectory_1#mall_${mall}`,
					gsi1sk: `$MallStores#building_${building}#unit_${unit}#store_${store}`,
					gsi2pk: `$MallStoreDirectory_1#mall_${mall}`,
					gsi2sk: `$MallStores#leaseEnd_2020-01-20#store_${store}#building_${building}#unit_${unit}`,
					gsi3pk: `$MallStoreDirectory_1#mall_${mall}`,
					gsi3sk: `$MallStores#category_${category}#building_${building}#unit_${unit}#store_${store}`,
					gsi4pk: `$MallStoreDirectory_1#store_${store}`,
					gsi4sk: `$MallStores#mall_${mall}#building_${building}#unit_${unit}`,
				},
				TableName: "StoreDirectory",
			});
			let beingsWithOne = MallStores.query.units({ mall, building }).params();
			expect(beingsWithOne).to.deep.equal({
				ExpressionAttributeNames: { "#pk": "gsi1pk", "#sk1": "gsi1sk" },
				ExpressionAttributeValues: {
					":pk": `$MallStoreDirectory_1#mall_${mall}`,
					":sk1": `$MallStores#building_${building}#unit_`,
				},
				IndexName: "gsi1pk-gsi1sk-index",
				TableName: "StoreDirectory",
				KeyConditionExpression: "#pk = :pk and begins_with(#sk1, :sk1)",
			});
			let beingsWithTwo = MallStores.query
				.units({ mall, building, store })
				.params();
			expect(beingsWithTwo).to.deep.equal({
				ExpressionAttributeNames: { "#pk": "gsi1pk", "#sk1": "gsi1sk" },
				ExpressionAttributeValues: {
					":pk": `$MallStoreDirectory_1#mall_${mall}`,
					":sk1": `$MallStores#building_${building}#unit_`,
				},
				IndexName: "gsi1pk-gsi1sk-index",
				TableName: "StoreDirectory",
				KeyConditionExpression: "#pk = :pk and begins_with(#sk1, :sk1)",
			});
			let beingsWithThree = MallStores.query
				.units({ mall, building, unit })
				.params();
			expect(beingsWithThree).to.deep.equal({
				ExpressionAttributeNames: { "#pk": "gsi1pk", "#sk1": "gsi1sk" },
				ExpressionAttributeValues: {
					":pk": `$MallStoreDirectory_1#mall_${mall}`,
					":sk1": `$MallStores#building_${building}#unit_${unit}#store_`,
				},
				IndexName: "gsi1pk-gsi1sk-index",
				TableName: "StoreDirectory",
				KeyConditionExpression: "#pk = :pk and begins_with(#sk1, :sk1)",
			});

			let queryUnitsBetweenOne = MallStores.query
				.units({ mall })
				.between(
					{ building: buildingOne, unit },
					{ building: buildingTwo, unit },
				)
				.params();
			expect(queryUnitsBetweenOne).to.deep.equal({
				ExpressionAttributeNames: {
					"#pk": "gsi1pk",
					"#sk1": "gsi1sk",
				},
				ExpressionAttributeValues: {
					":pk": `$MallStoreDirectory_1#mall_${mall}`,
					":sk1": `$MallStores#building_${buildingOne}#unit_B54#store_`,
					":sk2": `$MallStores#building_${buildingTwo}#unit_B54#store_`,
				},
				IndexName: "gsi1pk-gsi1sk-index",
				TableName: "StoreDirectory",
				KeyConditionExpression: "#pk = :pk and #sk1 BETWEEN :sk1 AND :sk2",
			});

			let queryUnitsBetweenTwo = MallStores.query
				.units({ mall, building })
				.between({ unit: unitOne }, { unit: unitTwo })
				.params();
			expect(queryUnitsBetweenTwo).to.deep.equal({
				ExpressionAttributeNames: {
					"#pk": "gsi1pk",
					"#sk1": "gsi1sk",
				},
				ExpressionAttributeValues: {
					":pk": `$MallStoreDirectory_1#mall_${mall}`,
					":sk1": `$MallStores#building_${building}#unit_${unitOne}#store_`,
					":sk2": `$MallStores#building_${building}#unit_${unitTwo}#store_`,
				},
				IndexName: "gsi1pk-gsi1sk-index",
				TableName: "StoreDirectory",
				KeyConditionExpression: "#pk = :pk and #sk1 BETWEEN :sk1 AND :sk2",
			});

			let queryUnitsBetweenThree = MallStores.query
				.units({ mall, building })
				.between({ store }, { store })
				.params();
			expect(queryUnitsBetweenThree).to.deep.equal({
				ExpressionAttributeNames: {
					"#pk": "gsi1pk",
					"#sk1": "gsi1sk",
				},
				ExpressionAttributeValues: {
					":pk": `$MallStoreDirectory_1#mall_${mall}`,
					":sk1": `$MallStores#building_${building}#unit_`,
					":sk2": `$MallStores#building_${building}#unit_`,
				},
				IndexName: "gsi1pk-gsi1sk-index",
				TableName: "StoreDirectory",
				KeyConditionExpression: "#pk = :pk and #sk1 BETWEEN :sk1 AND :sk2",
			});

			let queryUnitGt = MallStores.query
				.units({ mall })
				.gt({ building })
				.params();

			expect(queryUnitGt).to.deep.equal({
				ExpressionAttributeNames: { "#pk": "gsi1pk", "#sk1": "gsi1sk" },
				ExpressionAttributeValues: {
					":pk": `$MallStoreDirectory_1#mall_${mall}`,
					":sk1": `$MallStores#building_${building}#unit_`,
				},
				IndexName: "gsi1pk-gsi1sk-index",
				TableName: "StoreDirectory",
				KeyConditionExpression: "#pk = :pk and #sk1 > :sk1",
			});

			let queryUnitsGte = MallStores.query
				.units({ mall })
				.gte({ building })
				.params();
			expect(queryUnitsGte).to.deep.equal({
				ExpressionAttributeNames: { "#pk": "gsi1pk", "#sk1": "gsi1sk" },
				ExpressionAttributeValues: {
					":pk": `$MallStoreDirectory_1#mall_${mall}`,
					":sk1": `$MallStores#building_${building}#unit_`,
				},
				IndexName: "gsi1pk-gsi1sk-index",
				TableName: "StoreDirectory",
				KeyConditionExpression: "#pk = :pk and #sk1 >= :sk1",
			});

			let queryUnitsLte = MallStores.query
				.units({ mall })
				.lte({ building })
				.params();
			expect(queryUnitsLte).to.deep.equal({
				ExpressionAttributeNames: { "#pk": "gsi1pk", "#sk1": "gsi1sk" },
				ExpressionAttributeValues: {
					":pk": `$MallStoreDirectory_1#mall_${mall}`,
					":sk1": `$MallStores#building_${building}#unit_`,
				},
				IndexName: "gsi1pk-gsi1sk-index",
				TableName: "StoreDirectory",
				KeyConditionExpression: "#pk = :pk and #sk1 <= :sk1",
			});

			let queryUnitsLt = MallStores.query
				.units({ mall })
				.lt({ building })
				.params();
			expect(queryUnitsLt).to.deep.equal({
				ExpressionAttributeNames: { "#pk": "gsi1pk", "#sk1": "gsi1sk" },
				ExpressionAttributeValues: {
					":pk": `$MallStoreDirectory_1#mall_${mall}`,
					":sk1": `$MallStores#building_${building}#unit_`,
				},
				IndexName: "gsi1pk-gsi1sk-index",
				TableName: "StoreDirectory",
				KeyConditionExpression: "#pk = :pk and #sk1 < :sk1",
			});
		});
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
			let { pk, sk } = MallStores._makeIndexKeys(
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
			let { pk, sk } = MallStores._makeIndexKeys(
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
			let { pk, sk } = MallStores._makeIndexKeys(
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
			expect(() => MallStores._makeIndexKeys("bad_index")).to.throw(
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
	describe("_expectFacets", () => {
		let MallStores = new Entity(schema);
		let mall = "mall-value";
		let store = "store-value";
		let building = "building-value";
		let id = "id-value";
		let category = "category-value";
		let unit = "unit-value";
		let leaseEnd = "lease-value";
		it("Should find all, pk, and sk matches", () => {
			let index = schema.indexes.units.index;
			let facets = MallStores.model.facets.byIndex[index];
			let all = facets.all.map(facet => facet.name);
			let allMatches = MallStores._expectFacets(
				{ store, mall, building, unit },
				all,
			);
			let pkMatches = MallStores._expectFacets(
				{ store, mall, building, unit },
				facets.pk,
			);
			let skMatches = MallStores._expectFacets(
				{ store, mall, building, unit },
				facets.sk,
			);
			expect(allMatches).to.be.deep.equal({ mall, building, unit, store });
			expect(pkMatches).to.be.deep.equal({ mall });
			expect(skMatches).to.be.deep.equal({ building, unit, store });
		});
		it("Should find missing properties from supplied keys", () => {
			let index = schema.indexes.units.index;
			let facets = MallStores.model.facets.byIndex[index];
			let all = facets.all.map(facet => facet.name);
			let allMatches = () => MallStores._expectFacets({ store }, all);
			let pkMatches = () =>
				MallStores._expectFacets(
					{ store, building, unit },
					facets.pk,
					"partition keys",
				);
			let skMatches = () =>
				MallStores._expectFacets(
					{ store, mall, building },
					facets.sk,
					"sort keys",
				);
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
	describe("Filters", () => {
		let MallStores = new Entity(schema);
		it("Should inject model filters in clauses without causing side effects on the clauses object", () => {
			function rentsLeaseEndFilter(
				{ rent, leaseEnd, mall } = {},
				{ lowRent, beginning, end, location } = {},
			) {
				return `(${rent.gte(lowRent)} AND ${mall.eq(
					location,
				)}) OR ${leaseEnd.between(beginning, end)}`;
			}
			let injected = MallStores._injectFiltersIntoClauses(clauses, {
				rentsLeaseEndFilter,
			});
			let injectedChildren = Object.values(injected).filter(
				({ children }) =>
					children.includes("rentsLeaseEndFilter") || !children.includes("go"),
			);
			expect(injectedChildren)
				.to.be.an("array")
				.and.have.length(Object.keys(injected).length - 1);
			expect(injected).includes.property("rentsLeaseEndFilter");
			expect(injected.rentsLeaseEndFilter).to.have.keys(["children", "action"]);
			expect(clauses).to.not.deep.equal(injected);
			expect(clauses).to.not.have.key("rentsLeaseEndFilter");
			let noSideEffectsOnClauses = Object.values(clauses).every(
				({ children }) => !children.includes("rentsLeaseEndFilter"),
			);
			expect(noSideEffectsOnClauses).to.be.true;
		});
		it("Should add filtered fields to the begins with params", () => {
			let mall = "EastPointe";
			let building = "BuildingA";
			let lowRent = "50.00";
			let beginning = "20200101";
			let end = "20200401";
			let location = mall;
			let buildingAUinits = MallStores.query
				.units({ mall, building })
				.rentsLeaseEndFilter({ lowRent, beginning, end, location })
				.params();
			expect(buildingAUinits).to.be.deep.equal({
				IndexName: "gsi1pk-gsi1sk-index",
				TableName: "StoreDirectory",
				ExpressionAttributeNames: {
					"#rent": "rent",
					"#mall": "mall",
					"#leaseEnd": "leaseEnd",
					"#pk": "gsi1pk",
					"#sk1": "gsi1sk",
				},
				ExpressionAttributeValues: {
					":rent1": "50.00",
					":mall1": "EastPointe",
					":leaseEnd1": "20200101",
					":leaseEnd2": "20200401",
					":pk": "$MallStoreDirectory_1#mall_EastPointe",
					":sk1": "$MallStores#building_BuildingA#unit_",
				},
				KeyConditionExpression: "#pk = :pk and begins_with(#sk1, :sk1)",
				FilterExpression:
					"((#rent >= :rent1) AND (#mall = :mall1)) OR (#leaseEnd between :leaseEnd1 and :leaseEnd2)",
			});
		});

		it("Should add filtered fields to the begins with params", () => {
			let mall = "EastPointe";
			let building = "BuildingA";
			let lowRent = "50.00";
			let beginning = "20200101";
			let end = "20200401";
			let location = mall;
			let buildingAUinits = MallStores.query
				.units({ mall, building })
				.rentsLeaseEndFilter({ lowRent, beginning, end, location })
				.params();
			expect(buildingAUinits).to.be.deep.equal({
				IndexName: "gsi1pk-gsi1sk-index",
				TableName: "StoreDirectory",
				ExpressionAttributeNames: {
					"#rent": "rent",
					"#mall": "mall",
					"#leaseEnd": "leaseEnd",
					"#pk": "gsi1pk",
					"#sk1": "gsi1sk",
				},
				ExpressionAttributeValues: {
					":rent1": "50.00",
					":mall1": "EastPointe",
					":leaseEnd1": "20200101",
					":leaseEnd2": "20200401",
					":pk": "$MallStoreDirectory_1#mall_EastPointe",
					":sk1": "$MallStores#building_BuildingA#unit_",
				},
				KeyConditionExpression: "#pk = :pk and begins_with(#sk1, :sk1)",
				FilterExpression:
					"((#rent >= :rent1) AND (#mall = :mall1)) OR (#leaseEnd between :leaseEnd1 and :leaseEnd2)",
			});
		});
		it("Should add filtered fields to the between params", () => {
			let mall = "EastPointe";
			let building = "BuildingA";
			let lowRent = "50.00";
			let beginning = "20200101";
			let end = "20200401";
			let location = mall;
			let category = "food/coffee";
			let eastPointeCoffeeShops = MallStores.query
				.categories({ mall, category })
				.between({ building: buildingOne }, { building: buildingTwo })
				.rentsLeaseEndFilter({ lowRent, beginning, end, location })
				.params();
			expect(eastPointeCoffeeShops).to.be.deep.equal({
				IndexName: "gsi3pk-gsi3sk-index",
				TableName: "StoreDirectory",
				ExpressionAttributeNames: {
					"#rent": "rent",
					"#mall": "mall",
					"#leaseEnd": "leaseEnd",
					"#pk": "gsi3pk",
					"#sk1": "gsi3sk",
				},
				ExpressionAttributeValues: {
					":rent1": "50.00",
					":mall1": "EastPointe",
					":leaseEnd1": "20200101",
					":leaseEnd2": "20200401",
					":pk": "$MallStoreDirectory_1#mall_EastPointe",
					":sk1": "$MallStores#category_food/coffee#building_BuildingA#unit_",
					":sk2": "$MallStores#category_food/coffee#building_BuildingF#unit_",
				},
				KeyConditionExpression: "#pk = :pk and #sk1 BETWEEN :sk1 AND :sk2",
				FilterExpression:
					"((#rent >= :rent1) AND (#mall = :mall1)) OR (#leaseEnd between :leaseEnd1 and :leaseEnd2)",
			});
		});
		it("Should add filtered fields to the comparison params", () => {
			let mall = "EastPointe";
			let lowRent = "50.00";
			let beginning = "20200101";
			let end = "20200401";
			let location = mall;
			let leaseEnd = "20201231";
			let leasesAboutToExpire = MallStores.query
				.leases({ mall })
				.lte({ leaseEnd })
				.rentsLeaseEndFilter({ lowRent, beginning, end, location })
				.params();

			expect(leasesAboutToExpire).to.be.deep.equal({
				IndexName: "gsi2pk-gsi2sk-index",
				TableName: "StoreDirectory",
				ExpressionAttributeNames: {
					"#rent": "rent",
					"#mall": "mall",
					"#leaseEnd": "leaseEnd",
					"#pk": "gsi2pk",
					"#sk1": "gsi2sk",
				},
				ExpressionAttributeValues: {
					":rent1": "50.00",
					":mall1": "EastPointe",
					":leaseEnd1": "20200101",
					":leaseEnd2": "20200401",
					":pk": "$MallStoreDirectory_1#mall_EastPointe",
					":sk1": "$MallStores#leaseEnd_20201231#store_",
				},
				KeyConditionExpression: "#pk = :pk and #sk1 <= :sk1",
				FilterExpression:
					"((#rent >= :rent1) AND (#mall = :mall1)) OR (#leaseEnd between :leaseEnd1 and :leaseEnd2)",
			});
		});
	});
});
