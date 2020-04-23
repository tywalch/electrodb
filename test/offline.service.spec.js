const { Service } = require("../src/service");
const { expect } = require("chai");

let modelOne = {
	entity: "entityOne",
	attributes: {
		prop1: {
			type: "string",
		},
		prop2: {
			type: "string",
		},
		prop3: {
			type: "string",
		},
		prop4: {
			type: "string",
		},
		prop5: {
			type: "string",
		},
		prop6: {
			type: "string",
		},
		prop7: {
			type: "string",
		},
		prop8: {
			type: "string",
		},
		prop9: {
			type: "string",
		},
	},
	indexes: {
		index1: {
			pk: {
				field: "pk",
				facets: ["prop1"],
			},
			sk: {
				field: "sk",
				facets: ["prop2", "prop3"],
			},
			collection: "collectionA",
		},
		index2: {
			pk: {
				field: "gsi1pk",
				facets: ["prop3"],
			},
			sk: {
				field: "gsi1sk",
				facets: ["prop4", "prop5"],
			},
			collection: "collectionB",
			index: "gsi1pk-gsi1sk-index",
		},
		index3: {
			pk: {
				field: "gsi2pk",
				facets: ["prop5"],
			},
			sk: {
				field: "gsi2sk",
				facets: ["prop6", "prop7"],
			},
			collection: "collectionC",
			index: "gsi2pk-gsi2sk-index",
		},
		index4: {
			pk: {
				field: "gsi3pk",
				facets: ["prop7"],
			},
			sk: {
				field: "gsi3sk",
				facets: ["prop8", "prop9"],
			},
			collection: "collectionD",
			index: "gsi3pk-gsi3sk-index",
		},
	},
};

let modelTwo = {
	entity: "entityTwo",
	attributes: {
		prop1: {
			type: "string",
		},
		prop2: {
			type: "string",
		},
		prop3: {
			type: "string",
		},
		prop4: {
			type: "string",
		},
		prop5: {
			type: "string",
		},
		prop6: {
			type: "string",
		},
		prop7: {
			type: "string",
		},
		prop8: {
			type: "string",
		},
		prop9: {
			type: "string",
		},
	},
	indexes: {
		index1: {
			pk: {
				field: "pk",
				facets: ["prop1"],
			},
			sk: {
				field: "sk",
				facets: ["prop2", "prop3"],
			},
			collection: "collectionE",
		},
		index2: {
			pk: {
				field: "gsi1pk",
				facets: ["prop3"],
			},
			sk: {
				field: "gsi1sk",
				facets: ["prop4", "prop5"],
			},
			collection: "collectionB",
			index: "gsi1pk-gsi1sk-index",
		},
		index3: {
			pk: {
				field: "gsi2pk",
				facets: ["prop5"],
			},
			sk: {
				field: "gsi2sk",
				facets: ["prop6", "prop7"],
			},
			collection: "collectionF",
			index: "gsi2pk-gsi2sk-index",
		},
		index4: {
			pk: {
				field: "gsi3pk",
				facets: ["prop7"],
			},
			sk: {
				field: "gsi3sk",
				facets: ["prop8", "prop9"],
			},
			collection: "collectionG",
			index: "gsi3pk-gsi3sk-index",
		},
	},
};

let modelThree = {
	entity: "entityThree",
	attributes: {
		prop1: {
			type: "string",
		},
		prop2: {
			type: "string",
		},
		prop3: {
			type: "string",
		},
		prop4: {
			type: "string",
		},
		prop5: {
			type: "string",
		},
		prop6: {
			type: "string",
		},
		prop7: {
			type: "string",
		},
		prop8: {
			type: "string",
		},
		prop9: {
			type: "string",
		},
	},
	indexes: {
		index1: {
			pk: {
				field: "pk",
				facets: ["prop1"],
			},
			sk: {
				field: "sk",
				facets: ["prop2", "prop3"],
			},
			collection: "collectionE",
		},
		index2: {
			pk: {
				field: "gsi1pk",
				facets: ["prop3"],
			},
			sk: {
				field: "gsi1sk",
				facets: ["prop4", "prop5"],
			},
			collection: "collectionB",
			index: "gsi1pk-gsi1sk-index",
		},
		index3: {
			pk: {
				field: "gsi2pk",
				facets: ["prop5"],
			},
			sk: {
				field: "gsi2sk",
				facets: ["prop6", "prop7"],
			},
			collection: "collectionF",
			index: "gsi2pk-gsi2sk-index",
		},
		index4: {
			pk: {
				field: "gsi3pk",
				facets: ["prop7"],
			},
			sk: {
				field: "gsi3sk",
				facets: ["prop8", "prop9"],
			},
			collection: "collectionD",
			index: "gsi3pk-gsi3sk-index",
		},
	},
};

let database = new Service({
	version: "1",
	table: "electro",
	service: "electrotest",
});

database.join(modelOne);
database.join(modelTwo);
database.join(modelThree);

describe("Put and query", async () => {
	it("Should add three records and retrieve correct records based on collections", async () => {
		let recordOne = {
			prop1: "prop1",
			prop2: "prop2-one",
			prop3: "prop3",
			prop4: "prop4-one",
			prop5: "prop5",
			prop6: "prop6-one",
			prop7: "prop7",
			prop8: "prop8-one",
			prop9: "prop9-one",
		};
		let paramsOne = database.entities.entityOne.put(recordOne).params();
		expect(paramsOne).to.deep.equal({
			Item: {
				prop1: "prop1",
				prop2: "prop2-one",
				prop3: "prop3",
				prop4: "prop4-one",
				prop5: "prop5",
				prop6: "prop6-one",
				prop7: "prop7",
				prop8: "prop8-one",
				prop9: "prop9-one",
				pk: "$electrotest_1#prop1_prop1",
				sk: "$collectiona#entityone#prop2_prop2-one#prop3_prop3",
				gsi1pk: "$electrotest_1#prop3_prop3",
				gsi1sk: "$collectionb#entityone#prop4_prop4-one#prop5_prop5",
				gsi2pk: "$electrotest_1#prop5_prop5",
				gsi2sk: "$collectionc#entityone#prop6_prop6-one#prop7_prop7",
				gsi3pk: "$electrotest_1#prop7_prop7",
				gsi3sk: "$collectiond#entityone#prop8_prop8-one#prop9_prop9-one",
				__edb_e__: "entityOne",
			},
			TableName: "electro",
		});
		let recordTwo = {
			prop1: "prop1",
			prop2: "prop2-two",
			prop3: "prop3",
			prop4: "prop4-two",
			prop5: "prop5",
			prop6: "prop6-two",
			prop7: "prop7",
			prop8: "prop8-two",
			prop9: "prop9-two",
		};
		let paramsTwo = database.entities.entityTwo.put(recordTwo).params();
		expect(paramsTwo).to.deep.equal({
			Item: {
				prop1: "prop1",
				prop2: "prop2-two",
				prop3: "prop3",
				prop4: "prop4-two",
				prop5: "prop5",
				prop6: "prop6-two",
				prop7: "prop7",
				prop8: "prop8-two",
				prop9: "prop9-two",
				pk: "$electrotest_1#prop1_prop1",
				sk: "$collectione#entitytwo#prop2_prop2-two#prop3_prop3",
				gsi1pk: "$electrotest_1#prop3_prop3",
				gsi1sk: "$collectionb#entitytwo#prop4_prop4-two#prop5_prop5",
				gsi2pk: "$electrotest_1#prop5_prop5",
				gsi2sk: "$collectionf#entitytwo#prop6_prop6-two#prop7_prop7",
				gsi3pk: "$electrotest_1#prop7_prop7",
				gsi3sk: "$collectiong#entitytwo#prop8_prop8-two#prop9_prop9-two",
				__edb_e__: "entityTwo",
			},
			TableName: "electro",
		});
		let recordThree = {
			prop1: "prop1",
			prop2: "prop2-three",
			prop3: "prop3",
			prop4: "prop4-three",
			prop5: "prop5",
			prop6: "prop6-three",
			prop7: "prop7",
			prop8: "prop8-three",
			prop9: "prop9-three",
		};
		let paramsThree = database.entities.entityThree.put(recordThree).params();
		expect(paramsThree).to.deep.equal({
			Item: {
				prop1: "prop1",
				prop2: "prop2-three",
				prop3: "prop3",
				prop4: "prop4-three",
				prop5: "prop5",
				prop6: "prop6-three",
				prop7: "prop7",
				prop8: "prop8-three",
				prop9: "prop9-three",
				pk: "$electrotest_1#prop1_prop1",
				sk: "$collectione#entitythree#prop2_prop2-three#prop3_prop3",
				gsi1pk: "$electrotest_1#prop3_prop3",
				gsi1sk: "$collectionb#entitythree#prop4_prop4-three#prop5_prop5",
				gsi2pk: "$electrotest_1#prop5_prop5",
				gsi2sk: "$collectionf#entitythree#prop6_prop6-three#prop7_prop7",
				gsi3pk: "$electrotest_1#prop7_prop7",
				gsi3sk: "$collectiond#entitythree#prop8_prop8-three#prop9_prop9-three",
				__edb_e__: "entityThree",
			},
			TableName: "electro",
		});
	}).timeout(10000);
});

// database.find.collectionA({}).go();
