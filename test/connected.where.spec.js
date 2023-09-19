const sleep = async (ms) => new Promise((resolve) => setTimeout(resolve, ms));
process.env.AWS_NODEJS_CONNECTION_REUSE_ENABLED = 1;
const { Entity, clauses } = require("../src/entity");
const { expect } = require("chai");
const moment = require("moment");
const uuidV4 = require("uuid").v4;
const DynamoDB = require("aws-sdk/clients/dynamodb");
const client = new DynamoDB.DocumentClient({
  region: "us-east-1",
  endpoint: process.env.LOCAL_DYNAMO_ENDPOINT,
});

describe("Where Clause Queries", () => {
  before(async () => sleep(1000));
  let WhereTests = new Entity(
    {
      service: "tests",
      entity: "filters",
      table: "electro",
      version: "1",
      attributes: {
        pen: {
          type: "string",
          default: () => uuidV4(),
          field: "p",
        },
        row: {
          type: "string",
          required: true,
          field: "r",
        },
        animal: {
          type: "string",
          required: true,
          field: "a",
        },
        dangerous: {
          type: "boolean",
          field: "d",
        },
        complex: {
          type: "any",
          field: "c",
        },
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
            facets: ["row"],
          },
        },
      },
    },
    { client },
  );
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
  let penRows = [];
  before(async () => {
    let results = await Promise.all(
      animals.map((animal) => {
        let row = uuidV4();
        penRows.push({ pen, row, animal });
        if (animal === "Shark") {
          return WhereTests.put({ pen, row, animal, dangerous: true })
            .go()
            .then((res) => res.data);
        } else {
          return WhereTests.put({ pen, row, animal })
            .go()
            .then((res) => res.data);
        }
      }),
    );
  });
  it("Should filter 'eq' with 'where'", async () => {
    let animals = await WhereTests.query
      .farm({ pen })
      .where(({ animal }, op) => op.eq(animal, "Cow"))
      .go()
      .then((res) => res.data);
    expect(animals).to.be.an("array").and.have.length(1);
    expect(animals.map((pen) => pen.animal)).to.have.members(["Cow"]);
  });
  it("Should filter 'gt' with 'where'", async () => {
    let animals = await WhereTests.query
      .farm({ pen })
      .where(({ animal }, { gt }) => gt(animal, "Dog"))
      .go()
      .then((res) => res.data);
    expect(animals).to.be.an("array").and.have.length(4);
    expect(animals.map((pen) => pen.animal)).to.have.members([
      "Pig",
      "Rooster",
      "Shark",
      "Sheep",
    ]);
  });
  it("Should filter 'lt' with 'where'", async () => {
    let animals = await WhereTests.query
      .farm({ pen })
      .where(({ animal }, { lt }) => lt(animal, "Pig"))
      .go()
      .then((res) => res.data);
    expect(animals).to.be.an("array").and.have.length(4);
    expect(animals.map((pen) => pen.animal)).to.have.members([
      "Chicken",
      "Chick",
      "Cow",
      "Dog",
    ]);
  });
  it("Should filter 'gte' with 'where'", async () => {
    let animals = await WhereTests.query
      .farm({ pen })
      .where((attr, op) => op.gte(attr.animal, "Dog"))
      .go()
      .then((res) => res.data);
    expect(animals).to.be.an("array").and.have.length(5);
    expect(animals.map((pen) => pen.animal)).to.have.members([
      "Dog",
      "Pig",
      "Rooster",
      "Shark",
      "Sheep",
    ]);
  });
  it("Should filter 'lte' with 'where'", async () => {
    let animals = await WhereTests.query
      .farm({ pen })
      .where(({ animal }, { lte }) => lte(animal, "Pig"))
      .go()
      .then((res) => res.data);
    expect(animals).to.be.an("array").and.have.length(5);
    expect(animals.map((pen) => pen.animal)).to.have.members([
      "Chicken",
      "Chick",
      "Cow",
      "Dog",
      "Pig",
    ]);
  });
  it("Should filter 'between' with 'where'", async () => {
    let animals = await WhereTests.query
      .farm({ pen })
      .where(({ animal }, { between }) => between(animal, "Dog", "Rooster"))
      .go()
      .then((res) => res.data);
    expect(animals).to.be.an("array").and.have.length(3);
    expect(animals.map((pen) => pen.animal)).to.have.members([
      "Dog",
      "Pig",
      "Rooster",
    ]);
  });
  it("Should filter 'begins' with 'where'", async () => {
    let animals = await WhereTests.query
      .farm({ pen })
      .where(({ animal }, { begins }) => begins(animal, "Sh"))
      .go()
      .then((res) => res.data);
    expect(animals).to.be.an("array").and.have.length(2);
    expect(animals.map((pen) => pen.animal)).to.have.members([
      "Shark",
      "Sheep",
    ]);
  });
  it("Should filter 'exists' with 'where'", async () => {
    let animals = await WhereTests.query
      .farm({ pen })
      .where(({ dangerous }, { exists }) => exists(dangerous))
      .go()
      .then((res) => res.data);
    expect(animals).to.be.an("array").and.have.length(1);
    expect(animals.map((pen) => pen.animal)).to.have.members(["Shark"]);
  });
  it("Should filter 'notExists' with 'where'", async () => {
    let animals = await WhereTests.query
      .farm({ pen })
      .where(({ dangerous }, { notExists }) => notExists(dangerous))
      .go()
      .then((res) => res.data);
    expect(animals).to.be.an("array").and.have.length(7);
    expect(animals.map((pen) => pen.animal)).to.have.members([
      "Chicken",
      "Chick",
      "Cow",
      "Dog",
      "Pig",
      "Rooster",
      "Sheep",
    ]);
  });
  it("Should filter 'contains' with 'where'", async () => {
    let animals = await WhereTests.query
      .farm({ pen })
      .where(({ animal }, op) => op.contains(animal, "Chick"))
      .go()
      .then((res) => res.data);
    expect(animals).to.be.an("array").and.have.length(2);
    expect(animals.map((pen) => pen.animal)).to.have.members([
      "Chicken",
      "Chick",
    ]);
  });
  it("Should filter 'notContains' with 'where'", async () => {
    let animals = await WhereTests.query
      .farm({ pen })
      .where(({ animal }, { notContains }) => notContains(animal, "o"))
      .go()
      .then((res) => res.data);
    expect(animals).to.be.an("array").and.have.length(5);
    expect(animals.map((pen) => pen.animal)).to.have.members([
      "Chicken",
      "Chick",
      "Pig",
      "Shark",
      "Sheep",
    ]);
  });
  it("Should allow for name and value filter values", async () => {
    let animals = await WhereTests.query
      .farm({ pen })
      .where(
        ({ animal }, { value, name }) => `
				${name(animal)} = ${value(animal, "Pig")}
			`,
      )
      .go()
      .then((res) => res.data);
    expect(animals).to.be.an("array").and.have.length(1);
    expect(animals.map((pen) => pen.animal)).to.have.members(["Pig"]);
  });
  it("Should not update an animal which doesnt exist", async () => {
    try {
      await WhereTests.update(penRows[0])
        .set({ dangerous: true })
        .where(
          ({ animal }, { value, name }) => `
					${name(animal)} = ${value(animal, "Bear")}
				`,
        )
        .go()
        .then((res) => res.data);
      throw new Error("Should have thrown");
    } catch (err) {
      expect(err.message).to.equal(
        'Error thrown by DynamoDB client: "The conditional request failed" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#aws-error',
      );
    }
  });
  it("Should update an animal which does exist", async () => {
    let consistentRead = { params: { ConsistentRead: true } };
    let penRow = penRows[0];
    let before = await WhereTests.get(penRow)
      .go(consistentRead)
      .then((res) => res.data);
    expect(before.dangerous).to.be.undefined;
    let results = await WhereTests.update(penRow)
      .set({ dangerous: true })
      .where(
        ({ animal, dangerous }, { value, name, notExists }) => `
				${name(animal)} = ${value(animal, penRow.animal)} AND ${notExists(dangerous)}
			`,
      )
      .go({ raw: true })
      .then((res) => res.data);
    expect(results).to.be.empty;
    let after = await WhereTests.get(penRow)
      .go(consistentRead)
      .then((res) => res.data);
    expect(after.dangerous).to.be.true;
    let doesExist = await WhereTests.update(penRow)
      .set({ dangerous: true })
      .where(
        ({ animal, dangerous }, { value, name, notExists }) =>
          `${name(animal)} = ${value(animal, penRow.animal)} AND ${notExists(
            dangerous,
          )}`,
      )
      .go()
      .then(() => false)
      .catch(() => true);
    expect(doesExist).to.be.true;
  });
  it("Should not patch an animal which does exist", async () => {
    let consistentRead = { params: { ConsistentRead: true } };
    let penRow = penRows[1];
    let before = await WhereTests.get(penRow)
      .go(consistentRead)
      .then((res) => res.data);
    expect(before.dangerous).to.be.undefined;
    let results = await WhereTests.patch(penRow)
      .set({ dangerous: true })
      .where(({ dangerous }, { notExists }) => notExists(dangerous))
      .go()
      .then((res) => res.data);
    expect(results).to.deep.equal({
      pen: penRow.pen,
      row: penRow.row,
    });
    let after = await WhereTests.get(penRow)
      .go(consistentRead)
      .then((res) => res.data);
    expect(after.dangerous).to.be.true;
    let doesExist = await WhereTests.patch(penRow)
      .set({ dangerous: true })
      .where(({ dangerous }, { notExists }) => notExists(dangerous))
      .go({ raw: true })
      .then(() => false)
      .catch(() => true);
    expect(doesExist).to.be.true;
  });
  it("Should not delete an animal which does exist", async () => {
    let consistentRead = { params: { ConsistentRead: true } };
    let penRow = penRows[3];
    let existing = await WhereTests.get(penRow)
      .go(consistentRead)
      .then((res) => res.data);
    expect(existing.dangerous).to.be.undefined;
    let wontMatch = await WhereTests.delete(penRow)
      .where(({ dangerous }, { exists }) => exists(dangerous))
      .go()
      .then((res) => res.data)
      .then((data) => data)
      .catch((err) => err);
    expect(wontMatch.message).to.be.equal(
      'Error thrown by DynamoDB client: "The conditional request failed" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#aws-error',
    );
  });
  it("Should not allow unknown values from being used in a where clause", () => {
    let penRow = penRows[2];
    expect(() =>
      WhereTests.update(penRow)
        .set({ dangerous: true })
        .where(
          ({ notReal }, { exists }) => `
				${exists(notReal)}
			`,
        )
        .params(),
    ).to.throw(
      "Invalid/Unknown property passed in where clause passed to operation: 'exists'",
    );
  });
  it("Should not allow blank values from being used in a where clause", () => {
    let penRow = penRows[2];
    expect(() =>
      WhereTests.update(penRow)
        .set({ dangerous: true })
        .where(
          ({ notReal }, { exists }) => `
				${exists()}
			`,
        )
        .params(),
    ).to.throw(
      "Invalid/Unknown property passed in where clause passed to operation: 'exists'",
    );
  });
  it("Should not allow unknown operations from being used in a where clause", () => {
    let penRow = penRows[2];
    expect(() =>
      WhereTests.update(penRow)
        .set({ dangerous: true })
        .where(
          ({ dangerous }, { notReal }) => `
				${notReal(dangerous)}
			`,
        )
        .params(),
    ).to.throw("notReal is not a function");
  });
});
