const { Entity, clauses } = require("../src/entity");
const { Electro } = require("../src/electro");
const { expect } = require("chai");
const moment = require("moment");
const uuidV4 = require("uuid").v4;
const DynamoDB = require("aws-sdk/clients/dynamodb");
const client = new DynamoDB.DocumentClient({
	region: "us-east-1",
});

let modelOne = {
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

let database = new Electro({
	client,
	version: "1",
	table: "electro",
	service: "electrotest",
});

database.import("entityOne", modelOne);
database.import("entityTwo", modelTwo);
database.import("entityThree", modelThree);

async function test() {
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
	let addOne = database.entities.entityOne.put(recordOne).go();
	let paramsOne = database.entities.entityOne.put(recordOne).params();

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
	let addTwo = database.entities.entityTwo.put(recordTwo).go();
	let paramsTwo = database.entities.entityTwo.put(recordTwo).params();

	let recordThree = {
		prop1: "prop1",
		prop2: "prop2-three",
		prop3: "prop3",
		prop4: "prop4-three",
		prop5: "prop5ee",
		prop6: "prop6-three",
		prop7: "prop7",
		prop8: "prop8-three",
		prop9: "prop9-three",
	};
	let addThree = database.entities.entityThree.put(recordThree).go();
	let paramsThree = database.entities.entityThree.put(recordThree).params();
	let [one, two, three] = await Promise.all([addOne, addTwo, addThree]);
	console.log({ one, two, three });
	console.log({ paramsOne, paramsTwo, paramsThree });
	return { one, two, three };
}

async function read({ one, two, three } = {}) {
	// let { prop1, prop3, prop5, prop7 } = one;
	let prop1 = "prop1";
	let prop3 = "prop3";
	let prop5 = "prop5";
	let prop7 = "prop7";
	let collectionA = await database.collections.collectionA({ prop1 }).go();
	let collectionB = await database.collections.collectionB({ prop3 }).go();
	let collectionC = await database.collections.collectionC({ prop5 }).go();
	let collectionD = await database.collections.collectionD({ prop7 }).go();
	let collectionE = await database.collections.collectionE({ prop1 }).go();
	let collectionF = await database.collections.collectionF({ prop5 }).go();
	let collectionG = await database.collections.collectionG({ prop7 }).go();
	console.log({ collectionA }); // ONE
	console.log({ collectionB }); // ONE, TWO, THREE
	console.log({ collectionC }); // ONE
	console.log({ collectionD }); // ONE, THREE
	console.log({ collectionE }); // TWO, THREE
	console.log({ collectionF }); // TWO, THREE
	console.log({ collectionG }); // ONE
	// console.log({
	// 	paramsA,
	// 	collectionA,
	// 	// collectionB,
	// 	// collectionC,
	// 	// collectionD,
	// 	// collectionE,
	// 	// collectionF,
	// 	// collectionG,
	// });
}

test()
	.then(read)
	.catch((err) => console.log("ERR", err));
