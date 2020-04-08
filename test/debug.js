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

describe("_getIndexImpact", () => {
	let MallStores = new Entity(schema);
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
		let impact4 = MallStores._getIndexImpact({ rent, mall }, {id, building, unit});
		let impact5 = MallStores._getIndexImpact({ rent, leaseEnd, category }, {store, building, unit, store});
		
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
				  facets: { mall: 'EastPointe' },
				  indexes: [
					'gsi1pk-gsi1sk-index',
					'gsi2pk-gsi2sk-index',
					'gsi3pk-gsi3sk-index'
				  ]
				}
			}
		]);
		expect(impact5).to.deep.equal([
			false,
			{
				incomplete: [],
				complete: {
				  facets: { leaseEnd: '2020/04/27', category: 'food/coffee' },
				  indexes: []
				}
			}
		]);
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
					pk: `$mallstoredirectory_1#id_${id}`,
				},
			});
	});
});