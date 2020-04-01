const moment = require("moment");
const uuidv4 = require("uuid/v4");
const DynamoDB = require("aws-sdk/clients/dynamodb");
const { Entity } = require("../index.js");
const client = new DynamoDB.DocumentClient({
	region: "us-east-1",
});

let db = new Entity(
	{
		service: "testing",
		entity: "tester",
		table: "TransactionsTestCreditOrg",
		version: "1",
		attributes: {
			id: {
				type: "string",
				get: (id, model) => {
					return id + "GETTT!";
				},
				set: (id, model) => {
					console.log("SETTING", id);
					console.log("DATE", model.date);
					model.date + "abd";
					console.log(model.date);
					return id + "SET!";
				},
				default: () => uuidv4(),
			},
			date: {
				type: "string",
				default: () => moment.utc().format(),
			},
		},
		indexes: {
			record: {
				pk: {
					field: "AccountID",
					facets: ["date"],
				},
				sk: {
					field: "Clnsd#Date#IsChk#ChkN#Merch#Cat#SubCat#TranID",
					facets: ["id"],
				},
			},
		},
	},
	{ client },
);

// // db.put().go().then(console.log).catch(console.log);
// db.get({
//     id: '19b343d5-a4fd-4dd9-8f10-0008eeed4a1eSET!',
//     date: '2020-03-31T16:59:22Z'
//   }).go().then(console.log)
