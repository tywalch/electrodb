const { expect } = require("chai");
const moment = require("moment");
const uuidV4 = require("uuid/v4");
const { Entity } = require("../src/entity");

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
			type: "list",
			required: false,
    },
    custom: {
      type: "map",
      required: false,
    },
    scones: {
      type: "set",
      required: false
    }
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

const paths = [
  "rent",
  "category",
  "custom.key2",
  "mall",
  "adjustments[3]",
  "custom.obj.key4",
  "custom.arr[3].key1"
]

let entity = new Entity(schema);
// console.log(entity.model.schema);
console.log(paths.map(path => entity.model.schema.parseAttributePath(path)))