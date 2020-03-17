// const { ClauseProxy, clauses } = require("../src/clauses");
// const { Entity } = require("../src/entity");
// const { expect } = require("chai");
// const moment = require("moment");
// const uuidV4 = require("uuid/v4");

// let schema = {
// 	service: "MallStoreDirectory",
// 	entity: "MallStores",
// 	table: "StoreDirectory",
// 	version: "1",
// 	attributes: {
// 		id: {
// 			type: "string",
// 			default: () => uuidV4(),
// 			field: "storeLocationId",
// 		},
// 		mall: {
// 			type: "string",
// 			required: true,
// 			field: "mallId",
// 		},
// 		store: {
// 			type: "string",
// 			required: true,
// 			field: "storeId",
// 		},
// 		building: {
// 			type: "string",
// 			required: true,
// 			field: "buildingId",
// 		},
// 		unit: {
// 			type: "string",
// 			required: true,
// 			field: "unitId",
// 		},
// 		category: {
// 			type: [
// 				"food/coffee",
// 				"food/meal",
// 				"clothing",
// 				"electronics",
// 				"department",
// 				"misc",
// 			],
// 			required: true,
// 		},
// 		leaseEnd: {
// 			type: "string",
// 			required: true,
// 			validate: date => moment(date, "YYYY-MM-DD").isValid(),
// 		},
// 		rent: {
// 			type: "string",
// 			required: false,
// 			default: "0.00",
// 		},
// 		adjustments: {
// 			type: "string",
// 			required: false,
// 		},
// 	},
// 	indexes: {
// 		store: {
// 			pk: {
// 				field: "pk",
// 				compose: ["id"],
// 			},
// 		},
// 		units: {
// 			index: "gsi1pk-gsi1sk-index",
// 			pk: {
// 				field: "gsi1pk",
// 				compose: ["mall"],
// 			},
// 			sk: {
// 				field: "gsi1sk",
// 				compose: ["building", "unit", "store"],
// 			},
// 		},
// 		leases: {
// 			index: "gsi2pk-gsi2sk-index",
// 			pk: {
// 				field: "gsi2pk",
// 				compose: ["mall"],
// 			},
// 			sk: {
// 				field: "gsi2sk",
// 				compose: ["leaseEnd", "store", "building", "unit"],
// 			},
// 		},
// 		categories: {
// 			index: "gsi3pk-gsi3sk-index",
// 			pk: {
// 				field: "gsi3pk",
// 				compose: ["mall"],
// 			},
// 			sk: {
// 				field: "gsi3sk",
// 				compose: ["category", "building", "unit", "store"],
// 			},
// 		},
// 		shops: {
// 			index: "gsi4pk-gsi4sk-index",
// 			pk: {
// 				field: "gsi4pk",
// 				compose: ["store"],
// 			},
// 			sk: {
// 				field: "gsi4sk",
// 				compose: ["mall", "building", "unit"],
// 			},
// 		},
// 	},
// };
// let MallStores = new Entity(schema);
// let index = schema.indexes.units.index;
// let facets = MallStores.schema.facets.byIndex[index];
// let cProxy = new ClauseProxy(MallStores, clauses);
// let shops = cProxy.make(index, facets);
// // console.log(shops.query().between().and.gt().lt().or.contains().params());
// console.log(
// 	shops
// 		.query()
// 		.between()
// 		.and.gt()
// 		.or.contains()
// 		.and.lte()
// 		.params(),
// );

const aws = require("aws-sdk");
const DynamoDB = require("aws-sdk/clients/dynamodb");
const client = new DynamoDB.DocumentClient({
	region: "us-east-1",
});

client.query(
	{
		ExpressionAttributeNames: {
			"#pk": "pk",
			"#sk1": "sk",
			"#letters1": "name",
			"#werds1": "type",
			"#werds2": "type",
			"#contactFrequency": "contactFrequency",
		},
		ExpressionAttributeValues: {
			":pk": "$tinkertamper_1#email_5754bfe7-af35-4a74-b9be-301164741aea",
			":sk1": "$emailcontact#user8d02d2c2-4df0-4f00-b3a4-f13032f34b6b#cid_00",
			":sk2": "$emailcontact#user8d02d2c2-4df0-4f00-b3a4-f13032f34b6b#cid_05",
			":letters1": "b",
			":werds1": "corn",
			":werds2": "answer",
			":contactFrequency": 300,
		},
		// IndexName: "gsi1pk-gsi1sk-index",
		KeyConditionExpression: `#pk = :pk and #sk1 between :sk1 and :sk2`,
		FilterExpression: `
    (
      (
        begins_with(#letters1, :letters1) OR not contains(#werds1, :werds1)
      ) 
      OR 
      (
        not contains(#werds2, :werds2) and not contains(#werds3, :werds3)
      )
    ) 
    AND #contactFrequency <= :contactFrequency
    `,
		TableName: "electro",
	},
	(err, data) => {
		console.log(err, data);
	},
);
let email = "5754bfe7-af35-4a74-b9be-301164741aea";
let user = "8d02d2c2-4df0-4f00-b3a4-f13032f34b6b";
let start = { contactId: "00" };
let end = { contactId: "05" };
let name = "b";

contact
	.query({ email })
	.between({ start }, { end })
	.begins({ name: "b" })
	.or.contains({ type: "corn" })
	.or.contains({ name: "a" })
	.and.contains({ name: "b" })
	.and.lt({ contactFrequency: 300 });

(where, { between, begins, lt, gt, contains, and, or }) => {
	return where(
		and(
			or(begins({ name: "b" }), contains({ type: "corn" })),
			or(and(gt({ name: "b" }), begins({ name: "f" }))),
		),
	);
};

function make({ where }, { name, type, startDate }, { employeeName, passion }) {
	return where`
    ( begins(${name} ${employeeName}) or contains(${skill}, ${passion}) )
    and ${startDate} between(${monthStart} ${monthEnd}) 
  `;
}

function make(query, schema, { employeeName, passion, monthStart, monthEnd }) {
	let nameStartsWith = query.begins(schema.name, employeeName);
	let skillSetIncludes = query.contains(schema.skill, passion);
	let hiredWithin = query.between(schema.startDate, monthStart, monthEnd);
	return where`
    ( ${nameStartsWith} or ${skillSetIncludes} ) and ${hiredWithin}  
  `;
}

function make(query, schema, { employeeName, passion, monthStart, monthEnd }) {
	let nameStartsWith = query.begins(schema.name, employeeName);
	let skillSetIncludes = query.contains(schema.skill, passion);
	let hiredWithin = query.between(schema.startDate, monthStart, monthEnd);
	return where`
    ( ${nameStartsWith} or ${skillSetIncludes} ) and ${hiredWithin}  
  `;
}

function make(
	{ name, skills, startDate },
	{ lastName, skill, monthStart, monthEnd } = {},
) {
	return `
    ( ${name.beginsWith(lastName)} or ${skills.notContains(
		skill,
	)} ) and ${startDate.between(monthStart, monthEnd)}  
  `;
}

function make({ lastName, skill, monthStart, monthEnd } = {}) {
	return `
    ( ${this.name.beginsWith(lastName)} or ${this.skills.notContains(
		skill,
	)} ) and ${this.startDate.between(monthStart, monthEnd)}  
  `;
}

function make({ lastName, skill, monthStart, monthEnd } = {}) {
	let { name, skills, startDate } = this;
	return `
    ( ${name.beginsWith(lastName)} or ${skills.notContains(
		skill,
	)} ) and ${startDate.between(monthStart, monthEnd)}  
  `;
}

let a = () => console.log(this);
