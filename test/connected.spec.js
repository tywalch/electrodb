const {Entity} = require("../src/electro");
const { expect } = require("chai");
const uuidv4 = require("uuid").v4;
const DynamoDB = require("aws-sdk/clients/dynamodb");
const DocumentClient = new DynamoDB.DocumentClient({
	region: "us-east-1",
});

function makeContact({ email, user, contact } = {}) {
	let emailAddress = email || uuidv4();
	let userId = user || uuidv4();
	let contactId = contact || uuidv4();
	let data = {
		emailAddress,
		contactId,
		userId,
		name: "blah",
		description: "blah",
		category: "blah",
		type: "message",
		priority: "low",
		contactFrequency: 50,
		hasChildren: true,
		isFreeWeekdays: true,
		isFreeWeekEnds: true,
		note: "blah",
		requiresReminding: true,
	};
	return {
		emailAddress,
		contactId,
		userId,
		data,
	};
}

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
				compose: "user:userId#cid_:contactId",
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
				compose: "user:userId#email_:emailAddress",
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

describe("database interactions", async () => {
	it("Should create a new record", async () => {
		let electro = new Entity(schema, DocumentClient);
		let emailAddress = "friend@email.com";
		let userId = "9999";
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
		let results = await electro
			.contactEmail(emailAddress)
			.put(userId, contactId)
			.data(data)
			.go();
		expect(results).to.be.deep.equal({
			emailAddress: "friend@email.com",
			contactId: "0001",
			userId: "9999",
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
			notRequiredButDefaults: "DEFAULT_VALUE",
		});
	}).timeout(10000);
	it("Should perform an entire record crud lifecycle", async () => {
		let electro = new Entity(schema, DocumentClient);
		let contact1 = makeContact();

		await electro
			.contactEmail(contact1.emailAddress)
			.put(contact1.userId, contact1.contactId)
			.data(contact1.data)
			.go();

		await electro
			.userContact(contact1.userId)
			.update(contact1.contactId, contact1.emailAddress)
			.set({
				requiresReminding: false,
				hasChildren: false,
				priority: "high",
			})
			.go();

		let getResults = await electro
			.sharedContact(contact1.contactId)
			.get(contact1.userId, contact1.emailAddress)
			.go();

		expect(getResults).to.be.deep.equal({
			userId: contact1.userId,
			contactId: contact1.contactId,
			emailAddress: contact1.emailAddress,
			hasChildren: false,
			priority: "high",
			name: "blah",
			isFreeWeekEnds: true,
			note: "blah",
			contactFrequency: 50,
			requiresReminding: false,
			category: "blah",
			isFreeWeekdays: true,
			notRequiredButDefaults: "DEFAULT_VALUE",
			description: "blah",
			type: "message",
		});

		let deleteResults = await electro
			.sharedContact(contact1.contactId)
			.delete(contact1.userId, contact1.emailAddress)
			.go();
		expect(deleteResults).to.be.an("object").that.is.empty;

		let noResults = await electro
			.sharedContact(contact1.contactId)
			.get(contact1.userId, contact1.emailAddress)
			.go();

		expect(noResults).to.be.an("object").that.is.empty;
		// console.log("NO RESULTS", noResults);
	}).timeout(20000);

	it("Should perform an entire record crud lifecycle with root method syntax", async () => {
		let electro = new Entity(schema, DocumentClient);
		let contact1 = makeContact();
		let keys = {
			userId: contact1.userId,
			contactId: contact1.contactId,
			emailAddress: contact1.emailAddress
		};
		let data = {
			...contact1.data,
			...keys
		};
		await electro.put(data).go();

		await electro.update(keys)
			.set({
				requiresReminding: false,
				hasChildren: false,
				priority: "high",
			})
			.go();

		let getResults = await electro.get(keys).go();

		expect(getResults).to.be.deep.equal({
			userId: contact1.userId,
			contactId: contact1.contactId,
			emailAddress: contact1.emailAddress,
			hasChildren: false,
			priority: "high",
			name: "blah",
			isFreeWeekEnds: true,
			note: "blah",
			contactFrequency: 50,
			requiresReminding: false,
			category: "blah",
			isFreeWeekdays: true,
			notRequiredButDefaults: "DEFAULT_VALUE",
			description: "blah",
			type: "message",
		});

		let deleteResults = await electro.delete(keys).go();
		expect(deleteResults).to.be.an("object").that.is.empty;

		let noResults = await electro.get(keys).go();

		expect(noResults).to.be.an("object").that.is.empty;
		// console.log("NO RESULTS", noResults);
	}).timeout(20000);

	it("Should perform an entire record crud lifecycle", async () => {
		let electro = new Entity(schema, DocumentClient);
		let user = uuidv4();
		let contact1 = makeContact({ user });
		let contact2 = makeContact({ user });
		let contact3 = makeContact();

		await Promise.all([
			electro
				.contactEmail(contact1.emailAddress)
				.put(contact1.userId, contact1.contactId)
				.data(contact1.data)
				.go(),
			electro
				.contactEmail(contact2.emailAddress)
				.put(contact2.userId, contact2.contactId)
				.data(contact2.data)
				.go(),
			electro
				.contactEmail(contact3.emailAddress)
				.put(contact3.userId, contact3.contactId)
				.data(contact3.data)
				.go(),
		]);

		let userContacts = await electro
			.userContact(user)
			.find()
			.go();
		expect(userContacts)
			.to.be.an("array")
			.and.to.have.lengthOf(2)
			.and.to.deep.include({
				hasChildren: true,
				priority: "low",
				name: "blah",
				isFreeWeekEnds: true,
				note: "blah",
				contactId: contact1.contactId,
				contactFrequency: 50,
				emailAddress: contact1.emailAddress,
				userId: contact1.userId,
				requiresReminding: true,
				category: "blah",
				isFreeWeekdays: true,
				notRequiredButDefaults: "DEFAULT_VALUE",
				description: "blah",
				type: "message",
			})
			.and.to.deep.include({
				hasChildren: true,
				priority: "low",
				name: "blah",
				isFreeWeekEnds: true,
				note: "blah",
				contactId: contact2.contactId,
				contactFrequency: 50,
				emailAddress: contact2.emailAddress,
				userId: contact2.userId,
				requiresReminding: true,
				category: "blah",
				isFreeWeekdays: true,
				notRequiredButDefaults: "DEFAULT_VALUE",
				description: "blah",
				type: "message",
			});
	}).timeout(20000);
	it("Should return raw dynamo results", async () => {
		let electro = new Entity(schema, DocumentClient);
		let { emailAddress, contactId, userId, data } = makeContact();

		await electro
			.contactEmail(emailAddress)
			.put(userId, contactId)
			.data(data)
			.go();

		let results = await electro
			.contactEmail(emailAddress)
			.get(userId, contactId)
			.go({ raw: true });
		expect(results).to.deep.equal({
			Item: {
				hasChildren: true,
				priority: "low",
				name: "blah",
				isFreeWeekEnds: true,
				note: "blah",
				contactId,
				contactFrequency: 50,
				emailAddress,
				userId,
				requiresReminding: true,
				category: "blah",
				isFreeWeekdays: true,
				notRequiredButDefaults: "DEFAULT_VALUE",
				description: "blah",
				type: "message",
			},
		});
	});
	it("Should pull back records using the comparison operators", async () => {
		let electro = new Entity(schema, DocumentClient);
		let emailAddress = uuidv4();
		let userId = uuidv4();

		for (let i = 0; i < 10; i++) {
			let contactId = "0" + i;
			await electro
				.contactEmail(emailAddress)
				.put(userId, contactId)
				.data({
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
				})
				.go();
		}

		let queryGTE = electro
			.contactEmail(emailAddress)
			.query(userId)
			.gte("06")
			.go();
		let queryGT = electro
			.contactEmail(emailAddress)
			.query(userId)
			.gt("01")
			.go();
		let queryLTE = electro
			.contactEmail(emailAddress)
			.query(userId)
			.lte("04")
			.go();
		let queryLT = electro
			.contactEmail(emailAddress)
			.query(userId)
			.lt("08")
			.go();

		let [gte, gt, lte, lt] = await Promise.all([
			queryGTE,
			queryGT,
			queryLTE,
			queryLT,
		]);
		expect(gte)
			.to.be.an("array")
			.and.to.have.lengthOf(4);
		expect(gt)
			.to.be.an("array")
			.and.to.have.lengthOf(8);
		expect(lte)
			.to.be.an("array")
			.and.to.have.lengthOf(5);
		expect(lt)
			.to.be.an("array")
			.and.to.have.lengthOf(8);
	}).timeout(10000);
});
