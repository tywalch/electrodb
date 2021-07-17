const moment = require("moment");
const uuidV4 = require("uuid/v4");
const { expect } = require("chai");
let { Entity } = require("../src/entity");
let { FilterFactory } = require("../src/filters");
const {FilterOperations} = require("../src/operations");
const {ChainState} = require("../src/clauses");


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

describe("Filter", () => {
	it("Should allow for a filter to return an empty string with Match method", () => {
		let MallStores = new Entity(model);

		let params = MallStores.match({id: "abc"})
			.filter(() => "")
			.filter(() => "")
			.filter(() => "")
			.params()

		expect(params).to.deep.equal({
			KeyConditionExpression: '#pk = :pk',
			TableName: 'StoreDirectory',
			ExpressionAttributeNames: { '#id': 'storeLocationId', '#pk': 'pk' },
			ExpressionAttributeValues: { ':id1': 'abc', ':pk': '$mallstoredirectory_1$mallstores#id_abc' },
			FilterExpression: '#id = :id1'
		});
	})
	it("Should allow for a filter to return an empty string with Find method", () => {
		let MallStores = new Entity(model);

		let params = MallStores.find({id: "abc"})
			.filter(() => "")
			.filter(() => "")
			.filter(() => "")
			.params()

		expect(params).to.deep.equal({
			KeyConditionExpression: '#pk = :pk',
			TableName: 'StoreDirectory',
			ExpressionAttributeNames: { '#pk': 'pk' },
			ExpressionAttributeValues: { ':pk': '$mallstoredirectory_1$mallstores#id_abc' }
		});
	})
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
				FilterOperations,
			);
			let clause = filter.buildClause(rentsLeaseEndFilter);
			let lowRent = "20.00";
			let beginning = "20200101";
			let end = "20200401";
			let location = "EastPointe";
			let state = clause(
				MallStores,
				new ChainState(),
				{ lowRent, beginning, end, location },
			);
			const filterExpression = state.query.filter["FilterExpression"];
			expect(filterExpression.getNames()).to.deep.equal({
				"#rent": "rent",
				"#mall": "mallId",
				"#leaseEnd": "leaseEnd",
			});
			expect(filterExpression.getValues()).to.deep.equal({
				":rent1": "20.00",
				":mall1": "EastPointe",
				":leaseEnd1": "20200101",
				":leaseEnd2": "20200401",
			});
			expect(filterExpression.getExpression()).to.equal("(#rent >= :rent1 AND #mall = :mall1) OR (#leaseEnd between :leaseEnd1 and :leaseEnd2)");
		});
		it("Shouldnt validate the attributes passed when not strict", () => {
			function byCategory(attr, { category }) {
				return attr.category.contains(category);
			}
			let filter = new FilterFactory(
				MallStores.model.schema.attributes,
				FilterOperations,
			);
			let clause = filter.buildClause(byCategory);
			let category = "food";

			let state = clause(MallStores, new ChainState(), { category });
			const filterExpression = state.query.filter["FilterExpression"];
			expect(filterExpression.getNames()).to.deep.equal({ '#category': 'category' });
			expect(filterExpression.getValues()).to.deep.equal({ ':category1': 'food' });
			expect(filterExpression.getExpression()).to.equal('contains(#category, :category1)');
		});
		it("Should not allow filters named 'go', 'params', or 'filter'", () => {
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
				},
				indexes: {
					record: {
						pk: {
							field: "pk",
							facets: ["id"],
						},
					},
				},
				filters: {},
			};
			schema.filters = { go: () => "" };
			expect(() => new Entity(schema)).to.throw(
				`Invalid filter name: go. Filter cannot be named "go", "params", "filter", "where", "set" - For more detail on this error reference: https://github.com/tywalch/electrodb#filters`,
			);
			schema.filters = { params: () => "" };
			expect(() => new Entity(schema)).to.throw(
				`Invalid filter name: params. Filter cannot be named "go", "params", "filter", "where", "set" - For more detail on this error reference: https://github.com/tywalch/electrodb#filters`,
			);
			schema.filters = { filter: () => "" };
			expect(() => new Entity(schema)).to.throw(
				`Invalid filter name: filter. Filter cannot be named "go", "params", "filter", "where", "set" - For more detail on this error reference: https://github.com/tywalch/electrodb#filters`,
			);
		});
	});
});
