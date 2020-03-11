let Electro = require("../src/stratify");
let { expect } = require("chai");
const uuidv4 = require("uuid/v4");
const DynamoDB = require("aws-sdk/clients/dynamodb");
const DocumentClient = new DynamoDB.DocumentClient({
	region: "us-east-1",
});

let schema = {
	service: "tinkertamper",
	entity: "emailcontact",
	table: "electro",
	version: "1",
	attributes: {
		emailAddress: {
			type: "string",
            required: true,
		},
		contactId: {
			type: "string",
            required: true,
		},
		userId: {
			type: "string",
            required: true,
		},
		name: {
			type: "string",
            required: true,
            attr: "contactname",
            hidden: true
		},
		description: {
			type: "string",
			required: true,
		},
		category: {
			type: "string",
			required: true,
		},
		type: {
			type: ["message", "alert"],
			required: true,
		},
		priority: {
			type: ["high", "medium", "low"],
			required: true,
		},
		contactFrequency: {
			type: "number",
			required: true,
		},
		hasChildren: {
			type: "boolean",
			required: true,
		},
		isFreeWeekdays: {
			type: "boolean",
			required: true,
		},
		isFreeWeekEnds: {
			type: "boolean",
			required: true,
		},
		note: {
			type: "string",
			required: true,
		},
		requiresReminding: {
			type: "boolean",
			required: true,
			attr: "remind",
		},
		notRequired: {
			type: "string",
		},
		notRequiredButMapsToDifferentAttr: {
			type: "string",
			attr: "nrbmtda",
		},
		notRequiredButDefaults: {
			default: () => "DEFAULT_VALUE",
		},
	},
	indexes: {
		contactEmail: {
			pk: {
				attr: "pk",
				compose: "email_:emailAddress",
			},
			sk: {
				attr: "sk",
				compose: "user_:userId#cid_:contactId",
			},
		},
		sharedContact: {
			index: "gsi1pk-gsi1sk-index",
			pk: {
				attr: "gsi1pk",
				compose: "cid_:contactId",
			},
			sk: {
				attr: "gsi1sk",
				compose: "user_:userId#email_:emailAddress",
			},
		},
		userContact: {
			index: "gsi2pk-gsi2sk-index",
			pk: {
				attr: "gsi2pk",
				compose: "user:userId",
			},
			sk: {
				attr: "gsi2sk",
				compose: "cid_:contactId#email_:emailAddress",
			},
		},
	},
};

async function doit() {
	let electro = new Electro(schema, DocumentClient);
	let emailAddress = "myfriend@email.com";
	let userId = uuidv4();
	let contactId = "0001";
	let data = {
		emailAddress,
		contactId,
		userId,
		name: "blah",
		description: "blah",
		category: "blah",
		type: "message",
		priority: "high",
		contactFrequency: 50,
		hasChildren: true,
		isFreeWeekdays: true,
		isFreeWeekEnds: true,
		note: "blah",
		requiresReminding: true,
	};
	electro.userContact(contactId)
	electro.userContact({contactId}).get({userId, contactId, otherId}).go();
	electro.userContact({contactId}).update({userId, contactId}).set({name: "bob"}).go();
	electro.userContact({contactId}).delete({userId, contactId}).go();
	electro.userContact({contactId}).put({userId, contactId, otherId}).data({}).go();

	electro.userContact(contactId).query(userId).go();
	electro.userContact(contactId).between(userId1).and(userId2).go();
	electro.userContact(contactId).query(userId).between(contactId1).and(contactId2, otherId2).go();
	electro.userContact(contactId).query(userId).gte(contactId1).go();

    // electro.userContact(contactId).query(userId).go();

	let putResults = await electro
		.contactEmail(emailAddress)
		.put(userId, contactId)
		.data(data)
		.params();
	// console.log("putResults", putResults);

	let putGo = await electro
		.contactEmail(emailAddress)
		.put(userId, contactId)
		.data(data)
        .go();

    let contact = await electro.userContact(contactId).get(userId, contactId).go();
    console.log(contact)
}

async function create() {
	let electro = new Electro(schema, DocumentClient);
	let emailAddress = "friend@email.com";
	let userId = "9999";
	// let userId = "ce912c2a-5982-40a7-a8da-ce7ca97bfa27";
	let contactId = "0001";
	let ContactID = "0001";
	let data = {
		emailAddress,
		contactId,
		userId,
		name: "blah",
		description: "blah",
		category: "blah",
		type: "message",
		priority: "high",
		contactFrequency: 50,
		hasChildren: true,
		isFreeWeekdays: true,
		isFreeWeekEnds: true,
		note: "blah",
		requiresReminding: true,
	};
	// console.log(await electro.contactEmail(emailAddress).query().go());
	console.log(await electro.get({emailAddress, userId, contactId}).go());
	console.log(await electro.update({emailAddress, userId, contactId}).set({type: "alert"}).go());
	console.log(await electro.get({emailAddress, userId, contactId}).go());
	// console.log(await electro.get({ContactID, emailAddress, contactId, userId}).go());
	// console.log(await electro.create(data).go());

}
create();
// doit()
// 	.then(console.log)
// 	.catch(err => {
// 		console.log(err);
// 	});
