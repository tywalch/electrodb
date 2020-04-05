// const moment = require("moment");
// const uuidv4 = require("uuid/v4");
// const DynamoDB = require("aws-sdk/clients/dynamodb");
// const client = new DynamoDB.DocumentClient({
// 	region: "us-east-1",
// });
// const { Entity } = require("../src/entity");
// let WeatherSill = new Entity(
// 	{
// 		service: "WeatherSill",
// 		entity: "video",
// 		table: "weathersill",
// 		version: "1",
// 		attributes: {
// 			fileName: {
// 				type: "string",
// 				required: true,
// 				label: "id",
// 			},
// 			dateTime: {
// 				type: "string",
// 				default: () => moment.utc().format("YYYY-MM-DDTHH:mm:ss.SSS"),
// 				label: "dt",
// 			},
// 			phase: {
// 				type: "string",
// 				required: true,
// 				label: "ph",
// 			},
// 			main: {
// 				type: "string",
// 				required: true,
// 			},
// 			city: {
// 				type: "string",
// 				required: true,
// 			},
// 			description: {
// 				type: "string",
// 				label: "de",
// 			},
// 			year: {
// 				type: "string",
// 				default: () => moment.utc().format("YYYY"),
// 			},
// 			month: {
// 				type: "string",
// 				default: () => moment.utc().format("MM"),
// 				label: "mo",
// 			},
// 			day: {
// 				type: "string",
// 				default: () => moment.utc().format("DD"),
// 			},
// 			hour: {
// 				type: "string",
// 				default: () => moment.utc().format("HH"),
// 			},
// 			minutes: {
// 				type: "string",
// 				default: () => moment.utc().format("mm"),
// 			},
// 			temp: {
// 				type: "number",
// 			},
// 			pressure: {
// 				type: "number",
// 			},
// 			humidity: {
// 				type: "number",
// 			},
// 			temp_min: {
// 				type: "number",
// 			},
// 			temp_max: {
// 				type: "number",
// 			},
// 			wind: {
// 				type: "number",
// 			},
// 			clouds: {
// 				type: "number",
// 				default: () => -1,
// 				label: "cl",
// 			},
// 			rain: {
// 				type: "number",
// 			},
// 			snow: {
// 				type: "number",
// 			},
// 			sunrise: {
// 				type: "number",
// 			},
// 			sunset: {
// 				type: "number",
// 			},
// 			visibility: {
// 				type: "number",
// 				default: () => -1,
// 			},
// 		},
// 		indexes: {
// 			video: {
// 				pk: {
// 					field: "pk",
// 					facets: ["fileName"],
// 				},
// 				sk: {
// 					field: "sk",
// 					facets: ["city", "dateTime"],
// 				},
// 			},
// 			weather: {
// 				index: "gsi1pk-gsi1sk-Index",
// 				pk: {
// 					field: "gsi1pk",
// 					facets: ["phase", "main", "city"],
// 				},
// 				sk: {
// 					field: "gsi1sk",
// 					facets: ["month", "description", "clouds", "fileName"],
// 				},
// 			},
// 		},
// 		filters: {},
// 	},
// 	{ client },
// );

// WeatherSill.scan
// 	.filter(({ year }) => year.eq("2020"))
// 	.filter(
// 		({ temp, minutes }) => `
// 		${temp.lte(70)} OR ${minutes.eq("19")}
// 	`,
// 	)
// 	.go()
// 	.then(console.log)
// 	.catch(console.log);

// console.log(
// 	WeatherSill.scan
// 		.filter(({ year }) => year.eq("2020"))
// 		.filter(({ temp }) => temp.lte(70))
// 		.params(),
// );

// let entity = uuidv4();
// let db = new Entity(
// 	{
// 		service: "testing",
// 		entity: entity,
// 		table: "electro",
// 		version: "1",
// 		attributes: {
// 			id: {
// 				type: "string",
// 				default: () => uuidv4(),
// 			},
// 			property: {
// 				type: "string",
// 				field: "propertyVal",
// 			},
// 			color: {
// 				type: ["red", "green"],
// 			},
// 		},
// 		indexes: {
// 			record: {
// 				pk: {
// 					field: "pk",
// 					facets: ["id"],
// 				},
// 				sk: {
// 					field: "sk",
// 					facets: ["property"],
// 				},
// 			},
// 		},
// 	},
// 	{ client },
// );
// async function doIt() {
// 	console.log("ENTITYzz", entity);
// 	let date = moment.utc().format();
// 	let colors = ["red", "green"];
// 	let properties = ["A", "B", "C", "D", "E", "F"];
// 	let records = await Promise.all(
// 		properties.map((property, i) => {
// 			let color = colors[i % 2];
// 			return db.put({ property, color }).go();
// 		}),
// 	);
// 	let expectedMembers = records.filter(
// 		record => record.color !== "green" && record.property !== "A",
// 	);
// 	// console.log(records);
// 	let found = await db.scan
// 		.filter(({ property }) => property.gt("A"))
// 		.filter(
// 			({ color, id }) => `
// 			(${color.notContains("green")} OR ${id.contains("weird_value")})
// 		`,
// 		)
// 		.filter(({ property }) => property.notContains("Z"))
// 		.go();
// 	console.log("FOUND++++++++++++", found);
// }
// doIt()
// 	.then(console.log)
// 	.catch(console.log);
const DynamoDB = require("aws-sdk/clients/dynamodb");
const { Entity } = require("../src/entity");
const client = new DynamoDB.DocumentClient();

let model = {
	service: "MallStoreDirectory",
	entity: "MallStore",
	table: "StoreDirectory",
	version: "1",
	attributes: {
		mallId: {
			type: "string",
			required: true,
		},
		storeId: {
			type: "string",
			required: true,
		},
		buildingId: {
			type: "string",
			required: true,
		},
		unitId: {
			type: "string",
			required: true,
		},
		category: {
			type: [
				"spite store",
				"food/coffee",
				"food/meal",
				"clothing",
				"electronics",
				"department",
				"misc",
			],
			required: true,
		},
		leaseEndDate: {
			type: "string",
			required: true,
		},
		rent: {
			type: "string",
			required: true,
			validate: /^(\d+\.\d{2})$/,
		},
		discount: {
			type: "string",
			required: false,
			default: "0.00",
			validate: /^(\d+\.\d{2})$/,
		},
	},
	indexes: {
		stores: {
			pk: {
				field: "pk",
				facets: ["storeId"],
			},
			sk: {
				field: "sk",
				facets: ["mallId", "buildingId", "unitId"],
			},
		},
		malls: {
			index: "gsi1pk-gsi1sk-index",
			pk: {
				field: "gsi1pk",
				facets: ["mallId"],
			},
			sk: {
				field: "gsi1sk",
				facets: ["buildingId", "unitId", "storeId"],
			},
		},
		leases: {
			index: "gsi2pk-gsi2sk-index",
			pk: {
				field: "gsi3pk",
				facets: ["mallId"],
			},
			sk: {
				field: "gsi3sk",
				facets: ["leaseEndDate", "storeId", "buildingId", "unitId"],
			},
		},
	},
	filters: {
		byCategory: ({ category }, name) => category.eq(name),
		rentDiscount: (attributes, discount, max, min) => {
			return `${attributes.discount.lte(
				discount,
			)} AND ${attributes.rent.between(max, min)}`;
		},
	},
};

let MallStores = new Entity(model, client);
let mallId = "EastPointe";
let stateDate = "2020-04-01";
let endDate = "2020-07-01";
let maxRent = "5000.00";
let minRent = "2000.00";
let promotion = "1000.00";
let stores = MallStores.query
	.leases({ mallId })
	.between({ leaseEndDate: stateDate }, { leaseEndDate: endDate })
	.filter(
		({ rent, discount }) => `
		${rent.between(minRent, maxRent)} AND ${discount.eq(promotion)}
	`,
	)
	.filter(
		({ category }) => `
		${category.eq("food/coffee")}
	`,
	)
	.params();
console.log(stores);
