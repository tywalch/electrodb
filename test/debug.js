const moment = require("moment");
const uuidv4 = require("uuid/v4");
const DynamoDB = require("aws-sdk/clients/dynamodb");
const client = new DynamoDB.DocumentClient({
	region: "us-east-1",
});
const { Entity } = require("../src/entity");
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

let entity = uuidv4();
let db = new Entity(
	{
		service: "testing",
		entity: entity,
		table: "electro",
		version: "1",
		attributes: {
			id: {
				type: "string",
				default: () => uuidv4(),
			},
			property: {
				type: "string",
				field: "propertyVal",
			},
			color: {
				type: ["red", "green"],
			},
		},
		indexes: {
			record: {
				pk: {
					field: "pk",
					facets: ["id"],
				},
				sk: {
					field: "sk",
					facets: ["property"],
				},
			},
		},
	},
	{ client },
);
async function doIt() {
	console.log("ENTITYzz", entity);
	let date = moment.utc().format();
	let colors = ["red", "green"];
	let properties = ["A", "B", "C", "D", "E", "F"];
	let records = await Promise.all(
		properties.map((property, i) => {
			let color = colors[i % 2];
			return db.put({ property, color }).go();
		}),
	);
	let expectedMembers = records.filter(
		record => record.color !== "green" && record.property !== "A",
	);
	// console.log(records);
	let found = await db.scan
		.filter(({ property }) => property.gt("A"))
		.filter(
			({ color, id }) => `
			(${color.notContains("green")} OR ${id.contains("weird_value")})
		`,
		)
		.filter(({ property }) => property.notContains("Z"))
		.go();
	console.log("FOUND++++++++++++", found);
}
// doIt()
// 	.then(console.log)
// 	.catch(console.log);
