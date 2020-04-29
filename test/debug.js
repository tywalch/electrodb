process.env.AWS_NODEJS_CONNECTION_REUSE_ENABLED = 1;
const { Entity } = require("../src/entity");
const DynamoDB = require("aws-sdk/clients/dynamodb");
const client = new DynamoDB.DocumentClient({
	region: "us-east-1",
});
let model = {
	service: "BugBeater",
	entity: "test",
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

let MallStores = new Entity(model, { client });
let count = 0;
async function getAllResults(current = "") {
  let results = await MallStores.scan.page();
  console.log(Array.isArray(results) && results[0])
  // console.log(page, results.length);
  // records = [...records, ...results];
  // if (2 > count++) {
  //   return;
  // }
  
  // return getAllResults(page, records);
}
getAllResults("").catch(console.log)