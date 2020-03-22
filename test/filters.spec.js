const moment = require("moment");
const uuidV4 = require("uuid/v4");
const { expect } = require("chai");
let { Entity } = require("../src/entity");
let { FilterFactory, FilterTypes } = require("../src/filters");

let model = {
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

describe("Filter", () => {
	describe("Clause Building", () => {
		let MallStores = new Entity(model);
		it("Should build a clause", () => {
			function rentsLeaseEndFilter(
				{ rent, leaseEnd, mall } = {},
				{ lowRent, beginning, end, location } = {},
			) {
				return `(${rent.gte(lowRent)} AND ${mall.eq(
					location,
				)}) OR ${leaseEnd.between(beginning, end)}`;
			}
			let filter = new FilterFactory(
				MallStores.model.schema.attributes,
				FilterTypes,
			);
			let clause = filter.buildClause(rentsLeaseEndFilter);
			let lowRent = "20.00";
			let beginning = "20200101";
			let end = "20200401";
			let location = "EastPointe";
			let results = clause(
				MallStores,
				{ query: { filter: {} } },
				{ lowRent, beginning, end, location },
			);
			expect(results).to.deep.equal({
				query: {
					filter: {
						ExpressionAttributeNames: {
							"#rent": "rent",
							"#mall": "mall",
							"#leaseEnd": "leaseEnd",
						},
						ExpressionAttributeValues: {
							":rent1": "20.00",
							":mall1": "EastPointe",
							":leaseEnd1": "20200101",
							":leaseEnd2": "20200401",
						},
						valueCount: { rent: 2, mall: 2, leaseEnd: 3 },
						FilterExpression:
							"((#rent >= :rent1) AND (#mall = :mall1)) OR (#leaseEnd between :leaseEnd1 and :leaseEnd2)",
					},
				},
			});
		});
		it("Should validate the attributes passed", () => {
			function byCategory(attr, { category }) {
				return attr.category.eq(category);
			}
			let filter = new FilterFactory(
				MallStores.model.schema.attributes,
				FilterTypes,
			);
			let clause = filter.buildClause(byCategory);
			let category = "BAD_CATEGORY";
			let results = () =>
				clause(MallStores, { query: { filter: {} } }, { category });
			expect(results).to.throw(
				"Value not found in set of acceptable values: food/coffee, food/meal, clothing, electronics, department, misc",
			);
		});
	});
});
