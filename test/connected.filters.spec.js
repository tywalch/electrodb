const sleep = async (ms) => new Promise((resolve) => setTimeout(resolve, ms));
process.env.AWS_NODEJS_CONNECTION_REUSE_ENABLED = 1;
const { Entity, clauses } = require("../src/entity");
const { expect } = require("chai");
const moment = require("moment");
const uuidV4 = require("uuid").v4;
const DynamoDB = require("aws-sdk/clients/dynamodb");
const client = new DynamoDB.DocumentClient({
	region: "us-east-1",
	endpoint: process.env.LOCAL_DYNAMO_ENDPOINT
});

describe("General", async () => {
	before(async () => sleep(1000));
	let FilterTests = new Entity({
		service: "tests",
		entity: "filters",
		table: "electro",
		version: "1",
		attributes: {
			pen: {
				type: "string",
				default: () => uuidV4(),
				field: "storeLocationId",
			},
			row: {
				type: "string",
				required: true,
				field: "mall",
			},
			animal: {
				type: "string",
				required: true
			},
			dangerous: {
				type: "boolean"
			}
		},
		filters: {},
		indexes: {
			farm: {
				pk: {
					field: "pk",
					facets: ["pen"],
				},
				sk: {
					field: "sk",
					facets: ["row"]
				}
			},
		},
	}, {client});
	let pen = uuidV4();
	let animals = [
		"Chicken",
		"Chick",
		"Cow",
		"Dog",
		"Pig",
		"Rooster",
		"Shark",
		"Sheep",
	];
	before(async () => {
		let results = await Promise.all(animals.map(animal => {
			let row = uuidV4();
			if (animal === "Shark") {
				return FilterTests.put({pen, row, animal, dangerous: true}).go()
			} else {
				return FilterTests.put({pen, row, animal}).go()
			}
		}));
	})
	it("Should filter 'eq'", async () => {
		let animals = await FilterTests.query
			.farm({pen})
			.filter(({animal}) => animal.eq("Cow"))
			.go()
		expect(animals)
			.to.be.an("array")
			.and.have.length(1)
		expect(animals.map(pen => pen.animal)).to.have.members(["Cow"]);
	})
	it("Should filter 'gt'", async () => {
		let animals = await FilterTests.query
			.farm({pen})
			.filter(({animal}) => animal.gt("Dog"))
			.go()
		expect(animals)
			.to.be.an("array")
			.and.have.length(4);
		expect(animals.map(pen => pen.animal)).to.have.members([
			"Pig",
			"Rooster",
			"Shark",
			"Sheep"
		]);
	})
	it("Should filter 'lt'", async () => {
		let animals = await FilterTests.query
			.farm({pen})
			.filter(({animal}) => animal.lt("Pig"))
			.go()
		expect(animals)
			.to.be.an("array")
			.and.have.length(4);
		expect(animals.map(pen => pen.animal)).to.have.members([
			"Chicken",
			"Chick",
			"Cow",
			"Dog",
		]);
	})
	it("Should filter 'gte'", async () => {
		let animals = await FilterTests.query
			.farm({pen})
			.filter(({animal}) => animal.gte("Dog"))
			.go()
		expect(animals)
			.to.be.an("array")
			.and.have.length(5);
		expect(animals.map(pen => pen.animal)).to.have.members([
			"Dog",
			"Pig",
			"Rooster",
			"Shark",
			"Sheep",
		]);
	})
	it("Should filter 'lte'", async () => {
		let animals = await FilterTests.query
			.farm({pen})
			.filter(({animal}) => animal.lte("Pig"))
			.go()
		expect(animals)
			.to.be.an("array")
			.and.have.length(5);
		expect(animals.map(pen => pen.animal)).to.have.members([
			"Chicken",
			"Chick",
			"Cow",
			"Dog",
			"Pig",
		]);
	})
	it("Should filter 'between'", async () => {
		let animals = await FilterTests.query
			.farm({pen})
			.filter(({animal}) => animal.between("Dog", "Rooster"))
			.go()
		expect(animals)
			.to.be.an("array")
			.and.have.length(3);
		expect(animals.map(pen => pen.animal)).to.have.members([
			"Dog",
			"Pig",
			"Rooster"
		]);
	})
	it("Should filter 'begins'", async () => {
		let animals = await FilterTests.query
			.farm({pen})
			.filter(({animal}) => animal.begins("Sh"))
			.go()
		expect(animals)
			.to.be.an("array")
			.and.have.length(2);
		expect(animals.map(pen => pen.animal)).to.have.members([
			"Shark",
			"Sheep",
		]);
	})
	it("Should filter 'exists'", async () => {
		let animals = await FilterTests.query
			.farm({pen})
			.filter(({dangerous}) => dangerous.exists())
			.go()
		expect(animals)
			.to.be.an("array")
			.and.have.length(1);
		expect(animals.map(pen => pen.animal)).to.have.members([
			"Shark"
		]);
	})
	it("Should filter 'notExists'", async () => {
		let animals = await FilterTests.query
			.farm({pen})
			.filter(({dangerous}) => dangerous.notExists())
			.go()
		expect(animals)
			.to.be.an("array")
			.and.have.length(7);
		expect(animals.map(pen => pen.animal)).to.have.members([
			"Chicken",
			"Chick",
			"Cow",
			"Dog",
			"Pig",
			"Rooster",
			"Sheep",
		]);
	})
	it("Should filter 'contains'", async () => {
		let animals = await FilterTests.query
			.farm({pen})
			.filter(({animal}) => animal.contains("Chick"))
			.go()
		expect(animals)
			.to.be.an("array")
			.and.have.length(2);
		expect(animals.map(pen => pen.animal)).to.have.members([
			"Chicken",
			"Chick"
		]);
	})
	it("Should filter 'notContains'", async () => {
		let animals = await FilterTests.query
			.farm({pen})
			.filter(({animal}) => animal.notContains("o"))
			.go()
		expect(animals)
			.to.be.an("array")
			.and.have.length(5);
		expect(animals.map(pen => pen.animal)).to.have.members([
			"Chicken",
			"Chick",
			"Pig",
			"Shark",
			"Sheep",
		]);
	})
	it("Should allow for name and value filter values", async () => {
		let animals = await FilterTests.query
			.farm({pen})
			.filter(({animal}) => `
				${animal.name()} = ${animal.value("Pig")}
			`)
			.go();
			expect(animals)
				.to.be.an("array")
				.and.have.length(1);
			expect(animals.map(pen => pen.animal))
				.to.have.members(["Pig"]);
	})
})
