let {Entity} = require("../src/electro");
let { expect } = require("chai");

let schema = {
	service: "tinkertamper",
	entity: "emailcontact",
	table: "stratifytable",
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
		canContactWeekends: {
			type: "boolean",
			required: true,
		},
		deviceDelivery: {
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
				compose: "em_:emailAddress",
			},
			sk: {
				attr: "sk",
				compose: "usr_:userId#cid_:contactId",
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
				compose: "usr_:userId#em_:emailAddress",
			},
		},
		userContact: {
			index: "gsi2pk-gsi2sk-index",
			pk: {
				attr: "gsi2pk",
				compose: "usr_:userId",
			},
			sk: {
				attr: "gsi2sk",
				compose: "cid_:contactId#em_:emailAddress",
			},
		},
	},
};
describe("Entity", () => {
	describe("Key building", () => {
		it("should build key parts correctly", () => {
			let stratify = new Entity(schema);
			expect(stratify.schema.enum.keys).to.include.members([
				"pk",
				"sk",
				"gsi1pk",
				"gsi1sk",
				"gsi2pk",
				"gsi2sk",
			]);
			expect(stratify.schema.translations.keys.parts).to.be.deep.equal([
				{
					name: "emailAddress",
					label: "em_",
					type: "pk",
					attr: "pk",
					index: "__main__",
					accessPattern: "contactEmail",
				},
				{
					name: "userId",
					label: "usr_",
					type: "sk",
					attr: "sk",
					index: "__main__",
					accessPattern: "contactEmail",
				},
				{
					name: "contactId",
					label: "#cid_",
					type: "sk",
					attr: "sk",
					index: "__main__",
					accessPattern: "contactEmail",
				},
				{
					name: "contactId",
					label: "cid_",
					type: "pk",
					attr: "gsi1pk",
					index: "gsi1pk-gsi1sk-index",
					accessPattern: "sharedContact",
				},
				{
					name: "userId",
					label: "usr_",
					type: "sk",
					attr: "gsi1sk",
					index: "gsi1pk-gsi1sk-index",
					accessPattern: "sharedContact",
				},
				{
					name: "emailAddress",
					label: "#em_",
					type: "sk",
					attr: "gsi1sk",
					index: "gsi1pk-gsi1sk-index",
					accessPattern: "sharedContact",
				},
				{
					name: "userId",
					label: "usr_",
					type: "pk",
					attr: "gsi2pk",
					index: "gsi2pk-gsi2sk-index",
					accessPattern: "userContact",
				},
				{
					name: "contactId",
					label: "cid_",
					type: "sk",
					attr: "gsi2sk",
					index: "gsi2pk-gsi2sk-index",
					accessPattern: "userContact",
				},
				{
					name: "emailAddress",
					label: "#em_",
					type: "sk",
					attr: "gsi2sk",
					index: "gsi2pk-gsi2sk-index",
					accessPattern: "userContact",
				},
			]);
		});
	});

	describe("Schema validation", () => {
		it("should no cause side effects on the user's config schema", () => {
			let schema = {
				service: "tinkertamper",
				entity: "emailcontact",
				table: "stratifytable",
				attributes: {
					attr1: {
						type: "string",
						required: true,
						attr: "newValue",
					},
					attr2: {
						type: "string",
						required: true,
						default: () => "defaultstring1",
					},
					attr3: {
						type: "string",
						required: true,
						default: "defaultstring2",
					},
				},
			};
			let stratify = new Entity(schema);
			expect(stratify.schema.original).to.equal(schema);
		});
		it("Should not allow for types that dont match the defined types", () => {
			try {
				let schema = {
					service: "tinkertamper",
					entity: "emailcontact",
					table: "stratifytable",
					attributes: {
						attr1: {
							type: "custom",
							required: true,
							attr: "newValue",
						},
					},
				};
				let stratify = new Entity(schema);
				throw new Error("Validation did not catch bad type");
			} catch (err) {
				expect(err.message).to.equal(
					`Schema Validation Error: Attribute "attr1" property "type". Received: "custom", Expected: "string, number, boolean, enum"`,
				);
			}
		});
		it("Should build enums", () => {
			let enum1 = ["abc", "def", "ghi"];
			let enum2 = ["abc2", "def2", "ghi2"];
			let enum3 = ["abc3", "def3", "ghi3"];
			let schema = {
				service: "tinkertamper",
				entity: "emailcontact",
				table: "stratifytable",
				attributes: {
					attr1: {
						type: enum1,
						required: true,
					},
					attr2: {
						type: enum2,
						required: true,
					},
					attr3: {
						type: enum3,
						required: true,
					},
				},
			};
			let stratify = new Entity(schema);
			expect(stratify.schema.enum.attributes.attr1).to.have.members(enum1);
			expect(stratify.schema.enum.attributes.attr2).to.have.members(enum2);
			expect(stratify.schema.enum.attributes.attr3).to.have.members(enum3);
		});
	});

	describe("validate incoming data", () => {
		it("Should return back the same object, plus any absent values with defaults", () => {
			let stratify = new Entity(schema);
			let data = {
				emailAddress: "blah",
				contactId: "blah",
				userId: "blah",
				name: "blah",
				description: "blah",
				category: "blah",
				type: "message",
				priority: "high",
				contactFrequency: 50,
				hasChildren: true,
				isFreeWeekdays: true,
				canContactWeekends: true,
				deviceDelivery: "blah",
				requiresReminding: true,
			};
			let result = stratify._checkAttributes(data);
			let returnData = Object.assign({}, data, {
				notRequiredButDefaults: "DEFAULT_VALUE",
			});
			expect(result).to.deep.equal(returnData);
			// } catch(err) {
			// console.log(err);
			// }
		});
		it("should map use default values when supplied", () => {
			let schema = {
				service: "tinkertamper",
				entity: "emailcontact",
				table: "stratifytable",
				attributes: {
					attr1: {
						type: "string",
						required: true,
						attr: "newValue",
					},
					attr2: {
						type: "string",
						required: true,
						default: () => "defaultstring1",
					},
					attr3: {
						type: "string",
						required: true,
						default: "defaultstring2",
					},
				},
			};
			let stratify = new Entity(schema);
			let data = {
				attr1: "blah1",
			};
			let result = stratify._checkAttributes(data);
			expect(result).to.deep.equal({
				attr1: "blah1",
				attr2: "defaultstring1",
				attr3: "defaultstring2",
			});
		});
		it("should not allow duplicate attrs on attributes", () => {
			try {
				let schema = {
					service: "tinkertamper",
					entity: "emailcontact",
					table: "stratifytable",
					attributes: {
						attr1: {
							type: "string",
							attr: "newAttr1",
						},
						attr2: {
							required: true,
							default: "defaultstring1",
							attr: "newAttr2",
						},
						attr3: {
							type: "string",
							required: true,
							attr: "newAttr1",
						},
						attr4: {
							type: ["one", "two", "three"],
							required: true,
							attr: "newAttr4",
						},
					},
				};
				let stratify = new Entity(schema);
				throw new Error("Validation allowed for duplicate attrs");
			} catch (err) {
				expect(err.message).to.equal(
					`Schema Validation Error: Attribute "attr3" property "attr". Received: "newAttr1", Expected: "Unique attr property, already used by attribute attr1"`,
				);
			}
		});
		it("should create normalize attributes for easier api consumption", () => {
			let schema = {
				service: "tinkertamper",
				entity: "emailcontact",
				table: "stratifytable",
				attributes: {
					attr1: {
						type: "string",
						attr: "newAttr1",
					},
					attr2: {
						required: true,
						default: "defaultstring1",
						attr: "newAttr2",
					},
					attr3: {
						type: "string",
						required: true,
						attr: "newAttr3",
					},
					attr4: {
						type: ["one", "two", "three"],
						required: true,
						attr: "newAttr4",
					},
				},
			};
			let stratify = new Entity(schema);
			expect(stratify.schema.attributes).to.be.deep.equal({
				attr1: {
					name: "attr1",
					type: "string",
					attr: "newAttr1",
					required: false,
					hide: false,
					validate: undefined,
					default: undefined,
				},
				attr2: {
					name: "attr2",
					type: "string",
					required: true,
					default: "defaultstring1",
					attr: "newAttr2",
					hide: false,
					validate: undefined,
				},
				attr3: {
					name: "attr3",
					type: "string",
					required: true,
					attr: "newAttr3",
					hide: false,
					validate: undefined,
					default: undefined,
				},
				attr4: {
					name: "attr4",
					type: "enum",
					required: true,
					attr: "newAttr4",
					hide: false,
					enumArray: ["one", "two", "three"],
					validate: undefined,
					default: undefined,
				},
			});
		});
		it("should create translation dictionaries for attr conversion", () => {
			let schema = {
				service: "tinkertamper",
				entity: "emailcontact",
				table: "stratifytable",
				attributes: {
					attr1: {
						type: "string",
						required: true,
						attr: "newAttr1",
					},
					attr2: {
						type: "string",
						required: true,
						default: () => "defaultstring1",
						attr: "newAttr2",
					},
					attr3: {
						type: "string",
						required: true,
						default: "defaultstring2",
						attr: "newAttr3",
					},
				},
			};
			let stratify = new Entity(schema);
			expect(stratify.schema.translations.attr.fromNameToTable).to.deep.equal({
				attr1: "newAttr1",
				attr2: "newAttr2",
				attr3: "newAttr3",
			});
			expect(stratify.schema.translations.attr.fromTableToName).to.deep.equal({
				newAttr1: "attr1",
				newAttr2: "attr2",
				newAttr3: "attr3",
			});
		});
		it("should enforce value types", () => {
			let schema = {
				service: "tinkertamper",
				entity: "emailcontact",
				table: "stratifytable",
				attributes: {
					attr1: {
						type: "string",
						required: true,
						attr: "newValue",
					},
					attr2: {
						type: "string",
						required: true,
						validate: val => val !== "blah",
					},
					attr3: {
						type: "string",
						required: true,
						validate: /^[a-z]*$/,
					},
					attr4: {
						type: ["one", "three"],
					},
					attr5: {
						required: true,
					},
				},
			};
			let stratify = new Entity(schema);
			let data = {
				attr1: 4,
				attr2: "blah",
				attr3: "blah3",
				attr4: "two",
			};
			try {
				let result = stratify._checkAttributes(data);
				throw new Error("Validation allowed missing required attribute");
			} catch (err) {
				expect(err.message).to.equal(
					`Validation Error: The attribute "attr1" is not of the correct type string, Validation Error: The attribute "attr2" did not pass custom validation, Validation Error: The attribute "attr3" did not pass custom validation, Validation Error: The attribute "attr4" is not of the correct type enum, Validation Error: The attribute "attr5" is required to have a value but recieved "undefined"`,
				);
			}
		});
	});

	describe("Expression builders", () => {
		describe("query expression attribute builder", () => {
			let stratify1 = new Entity(schema);
			let contactEmail = stratify1._queryKeyExpressionAttributeBuilder(
				"contactEmail",
				"pkvalue",
				"skvalue1",
				"skvalue2",
			);
			expect(contactEmail).to.deep.equal({
				ExpressionAttributeNames: { "#pk": "pk", "#sk1": "sk1", "#sk2": "sk2" },
				ExpressionAttributeValues: {
					":pk": "pkvalue",
					":sk1": "skvalue1",
					":sk2": "skvalue2",
				},
			});
			let stratify2 = new Entity(schema);
			let sharedContact = stratify2._queryKeyExpressionAttributeBuilder(
				"sharedContact",
				"pkvalue",
				"sk2value1",
				"sk2value2",
			);
			expect(sharedContact).to.deep.equal({
				ExpressionAttributeNames: { "#pk": "pk", "#sk1": "sk1", "#sk2": "sk2" },
				ExpressionAttributeValues: {
					":pk": "pkvalue",
					":sk1": "sk2value1",
					":sk2": "sk2value2",
				},
			});
		});
	});

	describe("Param building", () => {
		it("should make params for a get method", () => {
			let stratify1 = new Entity(schema);
			let contactEmail = stratify1._makeGetParams(
				"pkvalue",
				"skvalue1",
			);
			expect(contactEmail).to.deep.equal({
				Key: {
					[schema.indexes.contactEmail.pk.attr]: "pkvalue",
					[schema.indexes.contactEmail.sk.attr]: "skvalue1",
				},
				TableName: schema.table,
			});
		});
		it("should make params for a delete method", () => {
			let stratify1 = new Entity(schema);
			let contactEmail = stratify1._makeDeleteParams(
				"pkvalue",
				"skvalue1",
			);
			expect(contactEmail).to.deep.equal({
				Key: {
					[schema.indexes.contactEmail.pk.attr]: "pkvalue",
					[schema.indexes.contactEmail.sk.attr]: "skvalue1",
				},
				TableName: schema.table,
			});
			let stratify2 = new Entity(schema);
			let sharedContact = stratify2._makeDeleteParams(
				"pkvalue",
				"skvalue",
			);
			expect(sharedContact).to.deep.equal({
				Key: {
					[schema.indexes.contactEmail.pk.attr]: "pkvalue",
					[schema.indexes.contactEmail.sk.attr]: "skvalue",
				},
				TableName: schema.table,
			});
		});
		it("should make params for a query method with begins", () => {
			let stratify1 = new Entity(schema);
			let contactEmail = stratify1._makeBeginsWithQueryParams(
				"contactEmail",
				"pkvalue",
				"skvalue",
			);
			expect(contactEmail).to.deep.equal({
				ExpressionAttributeNames: {
					"#pk": "pk",
					"#sk1": "sk",
				},
				ExpressionAttributeValues: {
					":pk": "pkvalue",
					":sk1": "skvalue",
				},
				IndexName: "__main__",
				KeyConditionExpression: "#pk = :pk and begins_with(#sk1, :sk1)",
				TableName: "stratifytable",
			});

			let stratify2 = new Entity(schema);
			let sharedContact = stratify2._makeBeginsWithQueryParams(
				"sharedContact",
				"pkvalue",
				"skvalue",
			);
			expect(sharedContact).to.deep.equal({
				ExpressionAttributeNames: {
					"#pk": "gsi1pk",
					"#sk1": "gsi1sk",
				},
				ExpressionAttributeValues: {
					":pk": "pkvalue",
					":sk1": "skvalue",
				},
				IndexName: "gsi1pk-gsi1sk-index",
				KeyConditionExpression: "#pk = :pk and begins_with(#sk1, :sk1)",
				TableName: "stratifytable",
			});
		});

		it("should make params for a query method with between", () => {
			let stratify1 = new Entity(schema);
			let contactEmail = stratify1._makeBetweenQueryParams(
				"contactEmail",
				"pkvalue",
				"skvalue1",
				"skvalue2",
			);
			expect(contactEmail).to.deep.equal({
				ExpressionAttributeNames: {
					"#pk": "pk",
					"#sk1": "sk",
					"#sk2": "sk",
				},
				ExpressionAttributeValues: {
					":pk": "pkvalue",
					":sk1": "skvalue1",
					":sk2": "skvalue2",
				},
				IndexName: "__main__",
				KeyConditionExpression: "#pk = :pk and #sk1 BETWEEN :sk1 AND :sk2",
				TableName: "stratifytable",
			});

			let stratify2 = new Entity(schema);
			let sharedContact = stratify2._makeBetweenQueryParams(
				"sharedContact",
				"pkvalue",
				"skvalue1",
				"skvalue2",
			);
			expect(sharedContact).to.deep.equal({
				ExpressionAttributeNames: {
					"#pk": "gsi1pk",
					"#sk1": "gsi1sk",
					"#sk2": "gsi1sk",
				},
				ExpressionAttributeValues: {
					":pk": "pkvalue",
					":sk1": "skvalue1",
					":sk2": "skvalue2",
				},
				IndexName: "gsi1pk-gsi1sk-index",
				KeyConditionExpression: "#pk = :pk and #sk1 BETWEEN :sk1 AND :sk2",
				TableName: "stratifytable",
			});
		});
		it("Should make proper key values", () => {
			let stratify = new Entity(schema);
			let data = {
				emailAddress: "123-456-789",
				contactId: "000-000-001",
				userId: "999-999-999",
				name: "blah",
				description: "blah",
				category: "blah",
				type: "message",
				priority: "high",
				contactFrequency: 50,
				hasChildren: true,
				isFreeWeekdays: true,
				canContactWeekends: true,
				deviceDelivery: "blah",
				requiresReminding: true,
			};
			let result = stratify._makeKeysFromAttributes(data);
			expect(result).to.deep.equal({
				gsi1pk: "$tinkertamper_1#cid_000-000-001",
				gsi1sk: "$emailcontact#usr_999-999-999#em_123-456-789",
				gsi2pk: "$tinkertamper_1#usr_999-999-999",
				gsi2sk: "$emailcontact#cid_000-000-001#em_123-456-789",
				pk: "$tinkertamper_1#em_123-456-789",
				sk: "$emailcontact#usr_999-999-999#cid_000-000-001",
			});
		});
		it("Should make params for a create method", () => {
			let stratify = new Entity(schema);
			let data = {
				emailAddress: "123-456-789",
				contactId: "000-000-001",
				userId: "999-999-999",
				name: "blah",
				description: "blah",
				category: "blah",
				type: "message",
				priority: "high",
				contactFrequency: 50,
				hasChildren: true,
				isFreeWeekdays: true,
				canContactWeekends: true,
				deviceDelivery: "blah",
				requiresReminding: true,
			};
			let facets = [
				{
					name: "emailAddress",
					value: "123-456-789"
				},{
					name: "contactId",
					value: "000-000-001"
				},{
					name: "userId",
					value: "999-999-999"
				}
			]
			let result = stratify._makeCreateParams(facets, data);
			expect(result).to.deep.equal({
				Item: {
					gsi1pk: "$tinkertamper_1#cid_000-000-001",
					gsi1sk: "$emailcontact#usr_999-999-999#em_123-456-789",
					gsi2pk: "$tinkertamper_1#usr_999-999-999",
					gsi2sk: "$emailcontact#cid_000-000-001#em_123-456-789",
					pk: "$tinkertamper_1#em_123-456-789",
					sk: "$emailcontact#usr_999-999-999#cid_000-000-001",
					hasChildren: true,
					canContactWeekends: true,
					isFreeWeekdays: true,
					category: "blah",
					description: "blah",
					deviceDelivery: "blah",
					contactFrequency: 50,
					name: "blah",
					notRequiredButDefaults: "DEFAULT_VALUE",
					emailAddress: "123-456-789",
					userId: "999-999-999",
					priority: "high",
					remind: true,
					contactId: "000-000-001",
					type: "message",
				},
				TableName: "stratifytable",
			});
		});
		it("Should make params for a update method", () => {
			let stratify = new Entity(schema);
			let data = {
				emailAddress: "123-456-780",
				contactId: "000-000-002",
				userId: "999-999-990",
				name: "blah",
				description: "blah",
				category: "blah",
				type: "message",
				priority: "high",
				contactFrequency: 50,
				hasChildren: true,
				isFreeWeekdays: true,
				canContactWeekends: true,
				deviceDelivery: "blah",
				requiresReminding: true,
			};
			let result = stratify._makeUpdateParams(
				"$tinkertamper_1#em_123-456-789",
				"$emailcontact#usr_999-999-999#cid_000-000-001",
				data,
			);
			expect(result).to.deep.equal({
				UpdateExpression:
					"SET #emailAddress = :emailAddress, #contactId = :contactId, #userId = :userId, #name = :name, #description = :description, #category = :category, #type = :type, #priority = :priority, #contactFrequency = :contactFrequency, #hasChildren = :hasChildren, #isFreeWeekdays = :isFreeWeekdays, #canContactWeekends = :canContactWeekends, #deviceDelivery = :deviceDelivery, #remind = :remind, #gsi1pk = :gsi1pk, #gsi1sk = :gsi1sk, #gsi2pk = :gsi2pk, #gsi2sk = :gsi2sk",
				ExpressionAttributeNames: {
					"#emailAddress": "emailAddress",
					"#contactId": "contactId",
					"#userId": "userId",
					"#name": "name",
					"#description": "description",
					"#category": "category",
					"#type": "type",
					"#priority": "priority",
					"#contactFrequency": "contactFrequency",
					"#hasChildren": "hasChildren",
					"#isFreeWeekdays": "isFreeWeekdays",
					"#canContactWeekends": "canContactWeekends",
					"#deviceDelivery": "deviceDelivery",
					"#remind": "remind",
					"#gsi1pk": "gsi1pk",
					"#gsi1sk": "gsi1sk",
					"#gsi2pk": "gsi2pk",
					"#gsi2sk": "gsi2sk",
				},
				ExpressionAttributeValues: {
					":emailAddress": "123-456-780",
					":contactId": "000-000-002",
					":userId": "999-999-990",
					":name": "blah",
					":description": "blah",
					":category": "blah",
					":type": "message",
					":priority": "high",
					":contactFrequency": 50,
					":hasChildren": true,
					":isFreeWeekdays": true,
					":canContactWeekends": true,
					":deviceDelivery": "blah",
					":remind": true,
					":gsi1pk": "$tinkertamper_1#cid_000-000-002",
					":gsi1sk": "$emailcontact#usr_999-999-990#em_123-456-780",
					":gsi2pk": "$tinkertamper_1#usr_999-999-990",
					":gsi2sk": "$emailcontact#cid_000-000-002#em_123-456-780",
				},
				TableName: "stratifytable",
				Key: {
					pk: "$tinkertamper_1#em_123-456-789",
					sk: "$emailcontact#usr_999-999-999#cid_000-000-001",
				},
			});
		});
	});
});

describe("Query Building", () => {
	// it("Should have no remaining parts", () => {
	//     let stratify = makeDebugClause(schema);
	//     let value = stratify.sharedContact("serviceProvider1")
	//         .find("organization1", "emailAddress")
	//         .debug();
	//     expect(value.parts.remaining).to.be.lengthOf(0);
	// });
	// it("Should have one remaing part with branched values", () => {
	//     let stratify = makeDebugClause(schema);
	//     let value = stratify.sharedContact("serviceProvider1")
	//         .find("organization1")
	//         .between("emailAddress1")
	//         .and("emailAddress2")
	//         .debug();
	//     expect(value.parts.remaining).to.be.lengthOf(1);
	//     expect(value.parts.branched).to.be.lengthOf(2);
	// });
	it("Should make simple get params for a specific record", () => {
		let stratify = new Entity(schema);
		let emailAddress = "123-456-789";
		let userId = "9999";
		let serviceProvider = "0001";
		let params = stratify
			.contactEmail(emailAddress)
			.get(userId, serviceProvider)
			.params();
		expect(params).to.deep.equal({
			Key: {
				pk: "$tinkertamper_1#em_123-456-789",
				sk: "$emailcontact#usr_9999#cid_0001",
			},
			TableName: "stratifytable",
		});
	});
	it("Should make simple delete params for a specific record", () => {
		let stratify = new Entity(schema);
		let emailAddress = "123-456-789";
		let userId = "9999";
		let serviceProvider = "0001";
		let params = stratify
			.contactEmail(emailAddress)
			.delete(userId, serviceProvider)
			.params();
		expect(params).to.deep.equal({
			Key: {
				pk: "$tinkertamper_1#em_123-456-789",
				sk: "$emailcontact#usr_9999#cid_0001",
			},
			TableName: "stratifytable",
		});
	});
	it("Should make a between query params", () => {
		let stratify = new Entity(schema);
		let emailAddress = "123-456-789";
		let userId1 = "0001";
		let userId2 = "9999";
		let serviceProvider1 = "ABCDE";
		let params1 = stratify
			.contactEmail(emailAddress)
			.find()
			.between(userId1)
			.and(userId2)
			.params();
		expect(params1).to.be.deep.equal({
			ExpressionAttributeNames: {
				"#pk": "pk",
				"#sk1": "sk",
				"#sk2": "sk",
			},
			ExpressionAttributeValues: {
				":pk": "$tinkertamper_1#em_123-456-789",
				":sk1": "$emailcontact#usr_0001#cid_",
				":sk2": "$emailcontact#usr_9999#cid_",
			},
			TableName: "stratifytable",
			KeyConditionExpression: "#pk = :pk and #sk1 BETWEEN :sk1 AND :sk2",
		});
		let params2 = stratify
			.sharedContact(serviceProvider1)
			.find()
			.between(userId1)
			.and(userId2)
			.params();
		expect(params2).to.be.deep.equal({
			ExpressionAttributeNames: {
				"#pk": "gsi1pk",
				"#sk1": "gsi1sk",
				"#sk2": "gsi1sk",
			},
			ExpressionAttributeValues: {
				":pk": "$tinkertamper_1#cid_ABCDE",
				":sk1": "$emailcontact#usr_0001#em_",
				":sk2": "$emailcontact#usr_9999#em_",
			},
			IndexName: "gsi1pk-gsi1sk-index",
			TableName: "stratifytable",
			KeyConditionExpression: "#pk = :pk and #sk1 BETWEEN :sk1 AND :sk2",
		});
	});
	it("Should make a contains query params", () => {
		let stratify = new Entity(schema);
		let emailAddress = "123-456-789";
		let userId1 = "0001";
		let params1 = stratify
			.contactEmail(emailAddress)
			.find(userId1)
			.params();
		expect(params1).to.be.deep.equal({
			ExpressionAttributeNames: { "#pk": "pk", "#sk1": "sk" },
			ExpressionAttributeValues: {
				":pk": "$tinkertamper_1#em_123-456-789",
				":sk1": "$emailcontact#usr_0001#cid_",
			},
			TableName: "stratifytable",
			KeyConditionExpression: "#pk = :pk and begins_with(#sk1, :sk1)",
		});
		// let params2 = stratify.sharedContact(serviceProvider1).params();
		// expect(params2).to.be.deep.equal({
		//     ExpressionAttributeNames: { '#pk': 'gsi1pk', '#sk1': 'gsi1sk', '#sk2': 'gsi1sk' },
		//     ExpressionAttributeValues: {
		//         ':pk': '$tinkertamper_1#cid_ABCDE',
		//         ':sk1': '$emailcontact#usr_0001#em_',
		//         ':sk2': '$emailcontact#usr_9999#em_'
		//     },
		//     "IndexName": "gsi1pk-gsi1sk-index",
		//     TableName: 'TableName',
		//     KeyConditionExpression: '#pk = :pk and #sk1 BETWEEN :sk1 AND :sk2'
		// });
	});
	it("Should make update params", () => {
		let stratify = new Entity(schema);
		let emailAddress = "123-456-789";
		let userId = "9999";
		let serviceProvider = "0001";
		let params = stratify
			.contactEmail(emailAddress)
			.update(userId, serviceProvider)
			.set({
				requiresReminding: false,
				hasChildren: false,
				priority: "high",
			})
			.params();
		expect(params).to.deep.equal({
			ExpressionAttributeNames: {
				"#remind": "remind",
				"#hasChildren": "hasChildren",
				"#priority": "priority",
			},
			ExpressionAttributeValues: {
				":remind": false,
				":hasChildren": false,
				":priority": "high",
			},
			TableName: "stratifytable",
			Key: {
				pk: "$tinkertamper_1#em_123-456-789",
				sk: "$emailcontact#usr_9999#cid_0001",
			},
			UpdateExpression:
				"SET #remind = :remind, #hasChildren = :hasChildren, #priority = :priority",
		});
	});
	it("Should make put params", () => {
		let stratify = new Entity(schema);
		let emailAddress = "123-456-780";
		let contactId = "000-000-002";
		let userId = "999-999-990";
		let data = {
			name: "blah",
			description: "blah",
			category: "blah",
			type: "message",
			priority: "high",
			contactFrequency: 8686,
			hasChildren: true,
			isFreeWeekdays: true,
			canContactWeekends: true,
			deviceDelivery: "blah",
			requiresReminding: true,
		};
		let params = stratify
			.contactEmail(emailAddress)
			.put(userId, contactId)
			.data(data)
			.params();
		expect(params).to.deep.equal({
			Item: {
				emailAddress: "123-456-780",
				contactId: "000-000-002",
				userId: "999-999-990",
				name: "blah",
				description: "blah",
				category: "blah",
				type: "message",
				priority: "high",
				contactFrequency: 8686,
				hasChildren: true,
				isFreeWeekdays: true,
				canContactWeekends: true,
				deviceDelivery: "blah",
				remind: true,
				notRequiredButDefaults: "DEFAULT_VALUE",
				pk: "$tinkertamper_1#em_123-456-780",
				sk: "$emailcontact#usr_999-999-990#cid_000-000-002",
				gsi1pk: "$tinkertamper_1#cid_000-000-002",
				gsi1sk: "$emailcontact#usr_999-999-990#em_123-456-780",
				gsi2pk: "$tinkertamper_1#usr_999-999-990",
				gsi2sk: "$emailcontact#cid_000-000-002#em_123-456-780",
			},
			TableName: "stratifytable",
		});
	});
});

describe("todos", () => {
	it("Should include an option to include the schema meta data on each record as well", () => {});

	it("notes", () => {
		// future uses:entity(...pks).update(...sks).set(data).add();
	});

	it("Should error on schema if at least one index is not included", () => {});
});
