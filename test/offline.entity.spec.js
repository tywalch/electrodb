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
			field: "mall",
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
	filters: {
		rentsLeaseEndFilter: function (
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
	describe("'client' validation", () => {
		let mall = "EastPointe";
		let store = "LatteLarrys";
		let building = "BuildingA";
		let category = "food/coffee";
		let unit = "B54";
		let leaseEnd = "2020-01-20";
		let rent = "0.00";
		let MallStores = new Entity(schema);
		expect(() =>
			MallStores.put({
				store,
				mall,
				building,
				rent,
				category,
				leaseEnd,
				unit,
			}).go(),
		).to.throw("No client defined on model");
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
		it("Should identify a missing definiton for the table's main index", () => {
			expect(() => new Entity({
				service: "test",
				entity: "entityOne",
				table: "test",
				version: "1",
				attributes: {
					prop1: {
						type: "string",
					},
					prop4: {
						type: "string"
					},
					prop5: {
						type: "string"
					}
				},
				indexes: {
					index1: {
						pk: {
							field: "pk",
							facets: ["prop1"],
						},
						sk: {
							field: "sk",
							facets: ["prop4", "prop5"],
						},
						collection: "collectionA",
						index: "different-index-than-entity-one",
					}
				}
			})).to.throw("Schema is missing an index definition for the table's main index. Please update the schema to include an index without a specified name to define the table's natural index")
		});
		it("should recognize when an attribute's field property is duplicated", () => {
			let schema = {
				service: "MallStoreDirectory",
				entity: "MallStores",
				table: "StoreDirectory",
				version: "1",
				attributes: {
					id: {
						type: "string",
						field: "id",
					},
					duplicateFieldName: {
						type: "string",
						field: "id",
					},
				},
				indexes: {
					main: {
						pk: {
							field: "pk",
							facets: ["id"],
						},
					},
				},
			};
			expect(() => new Entity(schema)).to.throw(
				`Schema Validation Error: Attribute "duplicateFieldName" property "field". Received: "id", Expected: "Unique field property, already used by attribute id"`,
			);
		});
		it("Should validate regex", () => {
			let Test = new Entity({
				service: "MallStoreDirectory",
				entity: "MallStores",
				table: "StoreDirectory",
				version: "1",
				attributes: {
					regexp: {
						type: "string",
						validate: /^\d{4}-\d{2}-\d{2}$/gi,
					},
				},
				indexes: {
					test: {
						pk: {
							field: "test",
							facets: ["regexp"],
						},
					},
				},
			});
			expect(() => Test.put({ regexp: "1533-15-44" }).params()).to.not.throw();
			expect(() => Test.put({ regexp: "1533-1a-44" }).params()).to.throw(
				`Invalid value for attribute "regexp": Failed user defined regex.`,
			);
		});
		it("Should not allow for an invalid schema type", () => {
			expect(
				() =>
					new Entity({
						service: "MallStoreDirectory",
						entity: "MallStores",
						table: "StoreDirectory",
						version: "1",
						attributes: {
							regexp: {
								type: "raccoon",
							},
						},
						indexes: {
							test: {
								pk: {
									field: "test",
									facets: ["regexp"],
								},
							},
						},
					}),
			).to.throw(
				`Invalid "type" property for attribute: "regexp". Acceptable types include string, number, boolean, enum`,
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
		it("Should prevent an index without an SK to have a `collection` property defined", () => {
			let schema = {
				service: "MallStoreDirectory",
				entity: "MallStores",
				table: "StoreDirectory",
				version: "1",
				attributes: {
					id: {
						type: "string",
						field: "id",
					},
					mall: {
						type: "string",
						required: true,
						field: "mall",
					}
				},
				filters: {},
				indexes: {
					store: {
						collection: "abcdef",
						pk: {
							field: "pk",
							facets: ["id"],
						}
					}
				}
			};
			
			let error = "Invalid index definition: Access pattern, store (PRIMARY INDEX), contains a collection definition without a defined SK. Collections can only be defined on indexes with a defined SK.";
			expect(() => new Entity(schema)).to.throw(error);
		})
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
			let impact4 = MallStores._getIndexImpact(
				{ rent, mall },
				{ id, building, unit },
			);
			let impact5 = MallStores._getIndexImpact(
				{ rent, leaseEnd, category },
				{ store, building, unit, store },
			);
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
			expect(impact4).to.deep.equal([
				false,
				{
					incomplete: [],
					complete: {
						facets: { mall: "EastPointe" },
						indexes: [
							"gsi1pk-gsi1sk-index",
							"gsi2pk-gsi2sk-index",
							"gsi3pk-gsi3sk-index",
						],
					},
				},
			]);
			expect(impact5).to.deep.equal([
				false,
				{
					incomplete: [],
					complete: {
						facets: { leaseEnd: "2020/04/27", category: "food/coffee" },
						indexes: [],
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
				"filter",
				"go",
				"params",
				"page",
				"rentsLeaseEndFilter",
			);
			let queryUnitGt = MallStores.query.units({ mall }).gt({ building });
			expect(queryUnitGt).to.have.keys(
				"filter",
				"go",
				"params",
				"page",
				"rentsLeaseEndFilter",
			);
			let queryUnitsGte = MallStores.query.units({ mall }).gte({ building });
			expect(queryUnitsGte).to.have.keys(
				"filter",
				"go",
				"params",
				"page",
				"rentsLeaseEndFilter",
			);
			let queryUnitsLte = MallStores.query.units({ mall }).lte({ building });
			expect(queryUnitsLte).to.have.keys(
				"filter",
				"go",
				"params",
				"page",
				"rentsLeaseEndFilter",
			);
			let queryUnitsLt = MallStores.query.units({ mall }).lt({ building });
			expect(queryUnitsLt).to.have.keys(
				"filter",
				"go",
				"params",
				"page",
				"rentsLeaseEndFilter",
			);
		});
		it("Should make scan parameters", () => {
			let scan = MallStores.scan.filter(({store}) => store.eq("Starblix")).params();
			expect(scan).to.deep.equal({
				"ExpressionAttributeNames": {
					"#pk": "pk",
					"#store": "storeId"
				},
				"ExpressionAttributeValues": {
					":pk": "$mallstoredirectory_1$mallstores#id_",
					":store1": "Starblix"
				},
				"FilterExpression": "(begins_with(#pk, :pk) AND #store = :store1",
				"TableName": "StoreDirectory"
			})
		})
		it("Should check if filter returns string", () => {
			expect(() => MallStores.scan.filter(() => 1234)).to.throw("Invalid filter response. Expected result to be of type string");
		})
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
				Key: { pk: `$mallstoredirectory_1$mallstores#id_${id}` },
			});

			let del = MallStores.delete({ id }).params();
			expect(del).to.be.deep.equal({
				TableName: "StoreDirectory",
				Key: { pk: `$mallstoredirectory_1$mallstores#id_${id}` },
			});

			let update = MallStores.update({ id })
				.set({ mall, store, building, category, unit, rent, leaseEnd })
				.params();
			expect(update).to.deep.equal({
				UpdateExpression:
					"SET #mall = :mall, #storeId = :storeId, #buildingId = :buildingId, #unitId = :unitId, #category = :category, #leaseEnd = :leaseEnd, #rent = :rent",
				ExpressionAttributeNames: {
					"#mall": "mall",
					"#storeId": "storeId",
					"#buildingId": "buildingId",
					"#unitId": "unitId",
					"#category": "category",
					"#leaseEnd": "leaseEnd",
					"#rent": "rent",
				},
				ExpressionAttributeValues: {
					":mall": mall,
					":storeId": store,
					":buildingId": building,
					":unitId": unit,
					":category": category,
					":leaseEnd": leaseEnd,
					":rent": rent,
				},
				TableName: "StoreDirectory",
				Key: {
					pk: `$mallstoredirectory_1$mallstores#id_${id}`,
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
					__edb_e__: "MallStores",
					storeLocationId: put.Item.storeLocationId,
					mall,
					storeId: store,
					buildingId: building,
					unitId: unit,
					category,
					leaseEnd,
					rent,
					pk: `$mallstoredirectory_1$mallstores#id_${put.Item.storeLocationId}`,
					gsi1pk: `$MallStoreDirectory_1#mall_${mall}`.toLowerCase(),
					gsi1sk: `$MallStores#building_${building}#unit_${unit}#store_${store}`.toLowerCase(),
					gsi2pk: `$MallStoreDirectory_1#mall_${mall}`.toLowerCase(),
					gsi2sk: `$MallStores#leaseEnd_2020-01-20#store_${store}#building_${building}#unit_${unit}`.toLowerCase(),
					gsi3pk: `$MallStoreDirectory_1#mall_${mall}`.toLowerCase(),
					gsi3sk: `$MallStores#category_${category}#building_${building}#unit_${unit}#store_${store}`.toLowerCase(),
					gsi4pk: `$MallStoreDirectory_1#store_${store}`.toLowerCase(),
					gsi4sk: `$MallStores#mall_${mall}#building_${building}#unit_${unit}`.toLowerCase(),
				},
				TableName: "StoreDirectory",
			});
			let beingsWithOne = MallStores.query.units({ mall, building }).params();
			expect(beingsWithOne).to.deep.equal({
				ExpressionAttributeNames: { "#pk": "gsi1pk", "#sk1": "gsi1sk" },
				ExpressionAttributeValues: {
					":pk": `$MallStoreDirectory_1#mall_${mall}`.toLowerCase(),
					":sk1": `$MallStores#building_${building}#unit_`.toLowerCase(),
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
					":pk": `$MallStoreDirectory_1#mall_${mall}`.toLowerCase(),
					":sk1": `$MallStores#building_${building}#unit_`.toLowerCase(),
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
					":pk": `$MallStoreDirectory_1#mall_${mall}`.toLowerCase(),
					":sk1": `$MallStores#building_${building}#unit_${unit}#store_`.toLowerCase(),
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
					":pk": `$MallStoreDirectory_1#mall_${mall}`.toLowerCase(),
					":sk1": `$MallStores#building_${buildingOne}#unit_B54#store_`.toLowerCase(),
					":sk2": `$MallStores#building_${buildingTwo}#unit_B54#store_`.toLowerCase(),
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
					":pk": `$MallStoreDirectory_1#mall_${mall}`.toLowerCase(),
					":sk1": `$MallStores#building_${building}#unit_${unitOne}#store_`.toLowerCase(),
					":sk2": `$MallStores#building_${building}#unit_${unitTwo}#store_`.toLowerCase(),
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
					":pk": `$MallStoreDirectory_1#mall_${mall}`.toLowerCase(),
					":sk1": `$MallStores#building_${building}#unit_`.toLowerCase(),
					":sk2": `$MallStores#building_${building}#unit_`.toLowerCase(),
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
					":pk": `$MallStoreDirectory_1#mall_${mall}`.toLowerCase(),
					":sk1": `$MallStores#building_${building}#unit_`.toLowerCase(),
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
					":pk": `$MallStoreDirectory_1#mall_${mall}`.toLowerCase(),
					":sk1": `$MallStores#building_${building}#unit_`.toLowerCase(),
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
					":pk": `$MallStoreDirectory_1#mall_${mall}`.toLowerCase(),
					":sk1": `$MallStores#building_${building}#unit_`.toLowerCase(),
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
					":pk": `$MallStoreDirectory_1#mall_${mall}`.toLowerCase(),
					":sk1": `$MallStores#building_${building}#unit_`.toLowerCase(),
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
			expect(pk).to.equal(
				"$MallStoreDirectory_1#mall_EastPointe".toLowerCase(),
			);
			expect(sk)
				.to.be.an("array")
				.and.have.length(1)
				.and.include(
					"$MallStores#category_coffee#building_BuildingA#unit_B54#store_LatteLarrys".toLowerCase(),
				);
		});
		it("Should stop making a key early when there is a gap in the supplied facets", () => {
			let index = schema.indexes.categories.index;
			let { pk, sk } = MallStores._makeIndexKeys(
				index,
				{ mall },
				{ category, building, store },
			);
			expect(pk).to.equal(
				"$MallStoreDirectory_1#mall_EastPointe".toLowerCase(),
			);
			expect(sk)
				.to.be.an("array")
				.and.have.length(1)
				.and.include(
					"$MallStores#category_coffee#building_BuildingA#unit_".toLowerCase(),
				);
		});
		it("Should overload a PK with Entity details for entity scoping when an index lacks an SK", () => {
			let MallStores = new Entity(schema);
			let id = "12345"
			let mall = "EastPointe";
			let store = "LatteLarrys";
			let building = "BuildingA";
			let category = "food/coffee";
			let unit = "B54";
			let leaseEnd = "2020-01-20";
			let rent = "0.00";
			let getParams = MallStores.get({id}).params();
			let updateParams = MallStores.update({id}).set({rent}).params();
			let patchParams = MallStores.patch({id}).set({rent}).params();
			let putParams = MallStores.put({id, mall, store, building, unit, category, leaseEnd, rent}).params();
			let createParams = MallStores.create({id, mall, store, building, unit, category, leaseEnd, rent}).params();
			let scanParams = MallStores.scan.filter(attr => attr.id.eq(id)).params();
			let queryParams = MallStores.query.store({id}).params();
			let findParams = MallStores.find({id}).params();
			const PK = "$mallstoredirectory_1$mallstores#id_12345";
			expect(getParams.Key.pk).to.equal(PK);
			expect(getParams.Key.sk).to.be.undefined;
			expect(updateParams.Key.pk).to.equal(PK);
			expect(updateParams.Key.sk).to.be.undefined;
			expect(patchParams.Key.pk).to.equal(PK);
			expect(patchParams.Key.sk).to.be.undefined;
			expect(putParams.Item.pk).to.equal(PK);
			expect(putParams.Item.sk).to.be.undefined;
			expect(createParams.Item.pk).to.equal(PK);
			expect(createParams.Item.sk).to.be.undefined;
			expect(queryParams.ExpressionAttributeValues[":pk"]).to.equal(PK);
			expect(queryParams.ExpressionAttributeValues[":sk"]).to.be.undefined;
			expect(scanParams.ExpressionAttributeValues[":pk"]).to.equal(PK.replace(id, ""));
			expect(scanParams.ExpressionAttributeValues[":sk"]).to.be.undefined;
			expect(findParams.ExpressionAttributeValues[":pk"]).to.equal(PK);
			expect(findParams.ExpressionAttributeValues[":sk"]).to.be.undefined;
		});
		it("Should create the correct key structure when a table has a PK and an SK", () => {
			let schema = {
				service: "MallStoreDirectory",
				entity: "MallStores",
				table: "StoreDirectory",
				version: "1",
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
				filters: {},
				indexes: {
					store: {
						pk: {
							field: "pk",
							facets: ["id"],
						},
						sk: {
							field: "sk",
							facets: ["mall"]
						}
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
					}
				},
			};
			
			let MallStores = new Entity(schema);
			let id = "12345"
			let mall = "EastPointe";
			let store = "LatteLarrys";
			let building = "BuildingA";
			let category = "food/coffee";
			let unit = "B54";
			let leaseEnd = "2020-01-20";
			let rent = "0.00";
			let getParams = MallStores.get({id, mall}).params();
			let updateParams = MallStores.update({id, mall}).set({rent}).params();
			let patchParams = MallStores.patch({id, mall}).set({rent}).params();
			let putParams = MallStores.put({id, mall, store, building, unit, category, leaseEnd, rent}).params();
			let createParams = MallStores.create({id, mall, store, building, unit, category, leaseEnd, rent}).params();
			let scanParams = MallStores.scan.filter(attr => attr.id.eq(id)).params();
			let queryParams = MallStores.query.store({id, mall}).params();
			let findParams = MallStores.find({id, mall}).params();
			let partialQueryParams = MallStores.query.store({id}).params();
			let partialFindParams = MallStores.find({id}).params();
			const PK = "$mallstoredirectory_1#id_12345";
			const SK = "$mallstores#mall_eastpointe";
			expect(getParams.Key.pk).to.equal(PK);
			expect(getParams.Key.sk).to.equal(SK);
			expect(updateParams.Key.pk).to.equal(PK);
			expect(updateParams.Key.sk).to.equal(SK);
			expect(patchParams.Key.pk).to.equal(PK);
			expect(patchParams.Key.sk).to.equal(SK);
			expect(putParams.Item.pk).to.equal(PK);
			expect(putParams.Item.sk).to.equal(SK);
			expect(createParams.Item.pk).to.equal(PK);
			expect(createParams.Item.sk).to.equal(SK);
			expect(queryParams.ExpressionAttributeValues[":pk"]).to.equal(PK);
			expect(queryParams.ExpressionAttributeValues[":sk1"]).to.equal(SK);
			expect(scanParams.ExpressionAttributeValues[":pk"]).to.equal(PK.replace(id.toLowerCase(), ""));
			expect(scanParams.ExpressionAttributeValues[":sk"]).to.equal(SK.replace(mall.toLowerCase(), ""))
			expect(findParams.ExpressionAttributeValues[":pk"]).to.equal(PK);
			expect(findParams.ExpressionAttributeValues[":sk1"]).to.equal(SK);
			expect(partialQueryParams.ExpressionAttributeValues[":pk"]).to.equal(PK);
			expect(partialQueryParams.ExpressionAttributeValues[":sk1"]).to.equal(SK.replace(mall.toLowerCase(), ""));
			expect(partialFindParams.ExpressionAttributeValues[":pk"]).to.equal(PK);
			expect(partialFindParams.ExpressionAttributeValues[":sk1"]).to.equal(SK.replace(mall.toLowerCase(), ""));
		});
		it("Should return the approprate pk and multiple sks when given multiple", () => {
			let index = schema.indexes.shops.index;
			let { pk, sk } = MallStores._makeIndexKeys(
				index,
				{ store },
				{ mall, building: "building1" },
				{ mall, building: "building5" },
			);
			expect(pk).to.equal(
				"$MallStoreDirectory_1#store_LatteLarrys".toLowerCase(),
			);
			expect(sk)
				.to.be.an("array")
				.and.have.length(2)
				.and.to.have.members([
					"$MallStores#mall_EastPointe#building_building1#unit_".toLowerCase(),
					"$MallStores#mall_EastPointe#building_building5#unit_".toLowerCase(),
				]);
		});
		it("Should throw on bad index", () => {
			expect(() => MallStores._makeIndexKeys("bad_index")).to.throw(
				"Invalid index: bad_index",
			);
		});

		it("Should allow facets to be a facet template (string)", () => {
			const schema = {
				service: "MallStoreDirectory",
				entity: "MallStores",
				table: "StoreDirectory",
				version: "1",
				attributes: {
					id: {
						type: "string",
						field: "storeLocationId",
					},
					date: {
						type: "string",
						field: "dateTime",
					},
					prop1: {
						type: "string",
					},
					prop2: {
						type: "string",
					},
				},
				indexes: {
					record: {
						pk: {
							field: "pk",
							facets: `id_:id#p1_:prop1`,
						},
						sk: {
							field: "sk",
							facets: `d_:date#p2_:prop2`,
						},
					},
				},
			};
			let mallStore = new Entity(schema);
			let putParams = mallStore
				.put({
					id: "IDENTIFIER",
					date: "DATE",
					prop1: "PROPERTY1",
					prop2: "PROPERTY2",
				})
				.params();
			expect(putParams).to.deep.equal({
				Item: {
					__edb_e__: "MallStores",
					storeLocationId: "IDENTIFIER",
					dateTime: "DATE",
					prop1: "PROPERTY1",
					prop2: "PROPERTY2",
					pk: "id_identifier#p1_property1",
					sk: "d_date#p2_property2",
				},
				TableName: "StoreDirectory",
			});
		});
		it("Create operation should include correct conditions to prevent overwriting existing record", () => {
			let schema = {
				service: "MallStoreDirectory",
				entity: "MallStores",
				table: "StoreDirectory",
				version: "1",
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
				filters: {},
				indexes: {
					store: {
						pk: {
							field: "pk",
							facets: ["id"],
						},
						sk: {
							field: "sk",
							facets: ["mall"]
						}
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
					}
				},
			};
			let MallStores = new Entity(schema);
			let id = "12345";
			let mall = "EastPointe";
			let store = "LatteLarrys";
			let building = "BuildingA";
			let category = "food/coffee";
			let unit = "B54";
			let leaseEnd = "2020-01-20";
			let rent = "0.00";
			let createParams = MallStores.create({id, mall, store, building, unit, category, leaseEnd, rent}).params();
			expect(createParams).to.deep.equal({
				Item: {
					id: '12345',
					mall: 'EastPointe',
					storeId: 'LatteLarrys',
					buildingId: 'BuildingA',
					unitId: 'B54',
					category: 'food/coffee',
					leaseEnd: '2020-01-20',
					rent: '0.00',
					pk: '$mallstoredirectory_1#id_12345',
					sk: '$mallstores#mall_eastpointe',
					gsi1pk: '$mallstoredirectory_1#mall_eastpointe',
					gsi1sk: '$mallstores#building_buildinga#unit_b54#store_lattelarrys',
					__edb_e__: 'MallStores'
				},
				TableName: 'StoreDirectory',
				ConditionExpression: 'attribute_not_exists(pk) AND attribute_not_exists(sk)'
			});
		})
		it("Patch operation should include correct conditions to prevent insert record when trying to update existing", () => {
			let schema = {
				service: "MallStoreDirectory",
				entity: "MallStores",
				table: "StoreDirectory",
				version: "1",
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
				filters: {},
				indexes: {
					store: {
						pk: {
							field: "pk",
							facets: ["id"],
						},
						sk: {
							field: "sk",
							facets: ["mall"]
						}
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
					}
				},
			};
			let MallStores = new Entity(schema);
			let id = "12345";
			let mall = "EastPointe";
			let store = "LatteLarrys";
			let building = "BuildingA";
			let category = "food/coffee";
			let unit = "B54";
			let leaseEnd = "2020-01-20";
			let rent = "0.00";
			let patchParams = MallStores.patch({id, mall}).set({rent}).params();
			expect(patchParams).to.deep.equal({
				UpdateExpression: 'SET #rent = :rent',
				ExpressionAttributeNames: { '#rent': 'rent' },
				ExpressionAttributeValues: { ':rent': '0.00' },
				TableName: 'StoreDirectory',
				Key: {
					pk: '$mallstoredirectory_1#id_12345',
					sk: '$mallstores#mall_eastpointe'
				},
				ConditionExpression: 'attribute_exists(pk) AND attribute_exists(sk)'
			})
		})

		/* This test was removed because facet templates was refactored to remove all electrodb opinions. */
		//
		// it("Should throw on invalid characters in facet template (string)", () => {
		// 	const schema = {
		// 		service: "MallStoreDirectory",
		// 		entity: "MallStores",
		// 		table: "StoreDirectory",
		// 		version: "1",
		// 		attributes: {
		// 			id: {
		// 				type: "string",
		// 				field: "storeLocationId",
		// 			},
		// 			date: {
		// 				type: "string",
		// 				field: "dateTime",
		// 			},
		// 			prop1: {
		// 				type: "string",
		// 			},
		// 			prop2: {
		// 				type: "string",
		// 			},
		// 		},
		// 		indexes: {
		// 			record: {
		// 				pk: {
		// 					field: "pk",
		// 					facets: `id_:id#p1_:prop1`,
		// 				},
		// 				sk: {
		// 					field: "sk",
		// 					facets: `d_:date|p2_:prop2`,
		// 				},
		// 			},
		// 		},
		// 	};
		// 	expect(() => new Entity(schema)).to.throw(
		// 		`Invalid key facet template. Allowed characters include only "A-Z", "a-z", "1-9", ":", "_", "#". Received: d_:date|p2_:prop2`,
		// 	);
		// });

		it("Should default labels to facet attribute names in facet template (string)", () => {
			const schema = {
				service: "MallStoreDirectory",
				entity: "MallStores",
				table: "StoreDirectory",
				version: "1",
				attributes: {
					id: {
						type: "string",
						field: "storeLocationId",
					},
					date: {
						type: "string",
						field: "dateTime",
					},
					prop1: {
						type: "string",
					},
					prop2: {
						type: "string",
					},
				},
				indexes: {
					record: {
						pk: {
							field: "pk",
							facets: `id_:id#:prop1`,
						},
						sk: {
							field: "sk",
							facets: `:date#p2_:prop2`,
						},
					},
				},
			};
			let mallStore = new Entity(schema);
			let putParams = mallStore
				.put({
					id: "IDENTIFIER",
					date: "DATE",
					prop1: "PROPERTY1",
					prop2: "PROPERTY2",
				})
				.params();
			expect(putParams).to.deep.equal({
				Item: {
					__edb_e__: "MallStores",
					storeLocationId: "IDENTIFIER",
					dateTime: "DATE",
					prop1: "PROPERTY1",
					prop2: "PROPERTY2",
					pk: "id_identifier#property1",
					sk: "date#p2_property2",
				},
				TableName: "StoreDirectory",
			});
		});
		it("Should allow for mixed custom/composed facets, and adding collection prefixes when defined", () => {
			const schema = {
				service: "MallStoreDirectory",
				entity: "MallStores",
				table: "StoreDirectory",
				version: "1",
				attributes: {
					id: {
						type: "string",
						field: "storeLocationId",
					},
					date: {
						type: "string",
						field: "dateTime",
					},
					prop1: {
						type: "string",
					},
					prop2: {
						type: "string",
					},
					prop3: {
						type: "string",
					},
				},
				indexes: {
					record: {
						pk: {
							field: "pk",
							facets: `id_:id#:prop1#wubba_:prop3`,
						},
						sk: {
							field: "sk",
							facets: ["date", "prop2"],
						},
						collection: "testing",
					},
				},
			};
			let mallStore = new Entity(schema);
			let putParams = mallStore
				.put({
					id: "IDENTIFIER",
					date: "DATE",
					prop1: "PROPERTY1",
					prop2: "PROPERTY2",
					prop3: "PROPERTY3",
				})
				.params();
			expect(putParams).to.deep.equal({
				Item: {
					__edb_e__: "MallStores",
					storeLocationId: "IDENTIFIER",
					dateTime: "DATE",
					prop1: "PROPERTY1",
					prop2: "PROPERTY2",
					prop3: "PROPERTY3",
					pk: "id_identifier#property1#wubba_property3",
					sk: "$testing#mallstores#date_date#prop2_property2",
				},
				TableName: "StoreDirectory",
			});
		});
		it("Should throw on invalid characters in facet template (string)", () => {
			const schema = {
				service: "MallStoreDirectory",
				entity: "MallStores",
				table: "StoreDirectory",
				version: "1",
				attributes: {
					id: {
						type: "string",
						field: "storeLocationId",
					},
					date: {
						type: "string",
						field: "dateTime",
					},
					prop1: {
						type: "string",
					},
					prop2: {
						type: "string",
					},
				},
				indexes: {
					record: {
						pk: {
							field: "pk",
							facets: `id_:id#p1_:prop1`,
						},
						sk: {
							field: "sk",
							facets: `dbsfhdfhsdshfshf`,
						},
					},
				},
			};
			expect(() => new Entity(schema)).to.throw(
				`Invalid key facet template. No facets provided, expected at least one facet with the format ":attributeName". Received: dbsfhdfhsdshfshf`,
			);
		});
		it("Should throw when defined facets are not in attributes: facet template and facet array", () => {
			const schema = {
				service: "MallStoreDirectory",
				entity: "MallStores",
				table: "StoreDirectory",
				version: "1",
				attributes: {
					id: {
						type: "string",
						field: "storeLocationId",
					},
					date: {
						type: "string",
						field: "dateTime",
					},
					prop1: {
						type: "string",
					},
					prop2: {
						type: "string",
					},
				},
				indexes: {
					record: {
						pk: {
							field: "pk",
							facets: ["id", "prop5"],
						},
						sk: {
							field: "sk",
							facets: `:date#p3_:prop3#p4_:prop4`,
						},
					},
				},
			};
			expect(() => new Entity(schema)).to.throw(
				`Invalid key facet template. The following facet attributes were described in the key facet template but were not included model's attributes: "pk: prop5", "sk: prop3", "sk: prop4"`,
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
			let params = MallStores.find({id}).params();
			expect(params).to.be.deep.equal({
				TableName: 'StoreDirectory',
				ExpressionAttributeNames: { '#id': 'storeLocationId', '#pk': 'pk'},
				ExpressionAttributeValues: {
					':id1': '123',
					':pk': '$mallstoredirectory_1$mallstores#id_123',
				},
				KeyConditionExpression: '#pk = :pk',
				FilterExpression: '#id = :id1'
			});
			expect(keys).to.be.deep.equal([{ name: "id", type: "pk" }]);
			expect(index).to.be.equal("");
		});
		it("Should match on gsi1pk-gsi1sk-index", () => {
			let { index, keys } = MallStores._findBestIndexKeyMatch({
				mall,
				building,
				unit,
			});
			let params = MallStores.find({mall, building, unit}).params();
			expect(params).to.be.deep.equal({
				KeyConditionExpression: '#pk = :pk and begins_with(#sk1, :sk1)',
				TableName: 'StoreDirectory',
				ExpressionAttributeNames: {
					'#mall': 'mall',
					'#building': 'buildingId',
					'#unit': 'unitId',
					'#pk': 'gsi1pk',
					'#sk1': 'gsi1sk'
				},
				ExpressionAttributeValues: {
					':mall1': '123',
					':building1': '123',
					':unit1': '123',
					':pk': '$mallstoredirectory_1#mall_123',
					':sk1': '$mallstores#building_123#unit_123#store_'
				},
				IndexName: 'gsi1pk-gsi1sk-index',
				FilterExpression: '#mall = :mall1 AND#building = :building1 AND#unit = :unit1'
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
			let all = facets.all.map((facet) => facet.name);
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
			let all = facets.all.map((facet) => facet.name);
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
			let injected = MallStores._filterBuilder.injectFilterClauses(clauses, {
				rentsLeaseEndFilter,
			});
			let injectedChildren = Object.values(injected).filter(
				({ children }) =>
					children.includes("rentsLeaseEndFilter") || !children.includes("go"),
			);

			// Inject children to include the model filter AND a "filter" for inline filters.
			expect(injectedChildren)
				.to.be.an("array")
				.and.have.length(Object.keys(injected).length);

			expect(injected).includes.property("rentsLeaseEndFilter");
			expect(injected).includes.property("filter");
			expect(injected.rentsLeaseEndFilter).to.have.keys(["children", "action"]);
			expect(injected.filter).to.have.keys(["children", "action"]);
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
					":pk": "$MallStoreDirectory_1#mall_EastPointe".toLowerCase(),
					":sk1": "$MallStores#building_BuildingA#unit_".toLowerCase(),
				},
				KeyConditionExpression: "#pk = :pk and begins_with(#sk1, :sk1)",
				FilterExpression:
					"(#rent >= :rent1 AND #mall = :mall1) OR (#leaseEnd between :leaseEnd1 and :leaseEnd2)",
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
					":pk": "$MallStoreDirectory_1#mall_EastPointe".toLowerCase(),
					":sk1": "$MallStores#building_BuildingA#unit_".toLowerCase(),
				},
				KeyConditionExpression: "#pk = :pk and begins_with(#sk1, :sk1)",
				FilterExpression:
					"(#rent >= :rent1 AND #mall = :mall1) OR (#leaseEnd between :leaseEnd1 and :leaseEnd2)",
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
					":pk": "$MallStoreDirectory_1#mall_EastPointe".toLowerCase(),
					":sk1": "$MallStores#category_food/coffee#building_BuildingA#unit_".toLowerCase(),
					":sk2": "$MallStores#category_food/coffee#building_BuildingF#unit_".toLowerCase(),
				},
				KeyConditionExpression: "#pk = :pk and #sk1 BETWEEN :sk1 AND :sk2",
				FilterExpression:
					"(#rent >= :rent1 AND #mall = :mall1) OR (#leaseEnd between :leaseEnd1 and :leaseEnd2)",
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
					":pk": "$MallStoreDirectory_1#mall_EastPointe".toLowerCase(),
					":sk1": "$MallStores#leaseEnd_20201231#store_".toLowerCase(),
				},
				KeyConditionExpression: "#pk = :pk and #sk1 <= :sk1",
				FilterExpression:
					"(#rent >= :rent1 AND #mall = :mall1) OR (#leaseEnd between :leaseEnd1 and :leaseEnd2)",
			});
		});
	});
});
