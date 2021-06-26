const sleep = async (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
process.env.AWS_NODEJS_CONNECTION_REUSE_ENABLED = "1";
import { Entity, EntityItem } from "../index";
import { expect } from "chai";
import {v4 as uuid} from "uuid"
import DynamoDB from "aws-sdk/clients/dynamodb";
const client = new DynamoDB.DocumentClient({
    region: "us-east-1",
    endpoint: process.env.LOCAL_DYNAMO_ENDPOINT
});

describe("Where Clause Queries", async () => {
    before(async () => sleep(1000));
});


describe("Where Clause Queries", async () => {
    before(async () => sleep(1000));
    let WhereTests = new Entity({
        model: {
            service: "tests",
            entity: "filters",
            version: "1",
        },
        attributes: {
            pen: {
                type: "string",
                default: () => uuid(),
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
                field: "a"
            },
            dangerous: {
                type: "boolean",
                field: "d"
            },
            complex: {
                type: "any",
                field: "c"
            }
        },
        filters: {},
        indexes: {
            farm: {
                pk: {
                    field: "pk",
                    composite: ["pen"],
                },
                sk: {
                    field: "sk",
                    composite: ["row"]
                }
            },
        },
    }, {client, table: "electro"});
    let pen = uuid();
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
    let penRows: EntityItem<typeof WhereTests>[] = [];
    before(async () => {
        let results = await Promise.all(animals.map(animal => {
            let row = uuid();
            penRows.push({pen, row, animal});
            if (animal === "Shark") {
                return WhereTests.put({pen, row, animal, dangerous: true}).go()
            } else {
                return WhereTests.put({pen, row, animal}).go()
            }
        }));
    })
    it("Should filter 'eq' with 'where'", async () => {
        let animals = await WhereTests.query
            .farm({pen})
            .where(({animal}, op) => op.eq(animal, "Cow"))
            .go()
        expect(animals)
            .to.be.an("array")
            .and.have.length(1)
        expect(animals.map(pen => pen.animal)).to.have.members(["Cow"]);
    })
    it("Should filter 'gt' with 'where'", async () => {
        let animals = await WhereTests.query
            .farm({pen})
            .where(({animal}, {gt}) => gt(animal, "Dog"))
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
    it("Should filter 'lt' with 'where'", async () => {
        let animals = await WhereTests.query
            .farm({pen})
            .where(({animal}, {lt}) => lt(animal, "Pig"))
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
    it("Should filter 'gte' with 'where'", async () => {
        let animals = await WhereTests.query
            .farm({pen})
            .where((attr, op) => op.gte(attr.animal, "Dog"))
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
    it("Should filter 'lte' with 'where'", async () => {
        let animals = await WhereTests.query
            .farm({pen})
            .where(({animal}, {lte}) => lte(animal, "Pig"))
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
    it("Should filter 'between' with 'where'", async () => {
        let animals = await WhereTests.query
            .farm({pen})
            .where(({animal}, {between}) => between(animal, "Dog", "Rooster"))
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
    it("Should filter 'begins' with 'where'", async () => {
        let animals = await WhereTests.query
            .farm({pen})
            .where(({animal}, {begins}) => begins(animal, "Sh"))
            .go()
        expect(animals)
            .to.be.an("array")
            .and.have.length(2);
        expect(animals.map(pen => pen.animal)).to.have.members([
            "Shark",
            "Sheep",
        ]);
    })
    it("Should filter 'exists' with 'where'", async () => {
        let animals = await WhereTests.query
            .farm({pen})
            .where(({dangerous}, {exists}) => exists(dangerous))
            .go()
        expect(animals)
            .to.be.an("array")
            .and.have.length(1);
        expect(animals.map(pen => pen.animal)).to.have.members([
            "Shark"
        ]);
    })
    it("Should filter 'notExists' with 'where'", async () => {
        let animals = await WhereTests.query
            .farm({pen})
            .where(({dangerous}, {notExists}) => notExists(dangerous))
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
    it("Should filter 'contains' with 'where'", async () => {
        let animals = await WhereTests.query
            .farm({pen})
            .where(({animal}, op) => op.contains(animal, "Chick"))
            .go()
        expect(animals)
            .to.be.an("array")
            .and.have.length(2);
        expect(animals.map(pen => pen.animal)).to.have.members([
            "Chicken",
            "Chick"
        ]);
    })
    it("Should filter 'notContains' with 'where'", async () => {
        let animals = await WhereTests.query
            .farm({pen})
            .where(({animal}, {notContains}) => notContains(animal, "o"))
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
        let animals = await WhereTests.query
            .farm({pen})
            .where(({animal}, {value, name}) => `
				${name(animal)} = ${value(animal, "Pig")}
			`)
            .go();
        expect(animals)
            .to.be.an("array")
            .and.have.length(1);
        expect(animals.map(pen => pen.animal))
            .to.have.members(["Pig"]);
    })
    it("Should not update an animal which doesnt exist", async () => {
        try {
            await WhereTests.update(penRows[0])
                .set({dangerous: true})
                .where(({animal}, {value, name}) => `
					${name(animal)} = ${value(animal, "Bear")}
				`)
                .go();
            throw new Error("Should have thrown")
        } catch(err) {
            expect(err.message).to.equal("The conditional request failed - For more detail on this error reference: https://github.com/tywalch/electrodb#aws-error");
        }
    });
    it("Should update an animal which does exist", async () => {
        let consistentRead = {params: {ConsistentRead: true}};
        let penRow = penRows[0];
        let before = await WhereTests.get(penRow).go(consistentRead);
        expect(before.dangerous).to.be.undefined;
        let results = await WhereTests.update(penRow)
            .set({dangerous: true})
            .where(({animal, dangerous}, {value, name, notExists}) => `
				${name(animal)} = ${value(animal, penRow.animal)} AND ${notExists(dangerous)}
			`)
            .go({raw: true});
        expect(results).to.be.empty;
        let after = await WhereTests.get(penRow).go(consistentRead);
        expect(after.dangerous).to.be.true;
        let doesExist = await WhereTests.update(penRow)
            .set({dangerous: true})
            .where(({animal, dangerous}, {value, name, notExists}) => `${name(animal)} = ${value(animal, penRow.animal)} AND ${notExists(dangerous)}`)
            .go()
            .then(() => false)
            .catch(() => true);
        expect(doesExist).to.be.true;
    });
    it("Should not patch an animal which does exist", async () => {
        let consistentRead = {params: {ConsistentRead: true}};
        let penRow = penRows[1];
        let before = await WhereTests.get(penRow).go(consistentRead);
        expect(before.dangerous).to.be.undefined;
        let results = await WhereTests.patch(penRow)
            .set({dangerous: true})
            .where(({dangerous}, {notExists}) => notExists(dangerous))
            .go();
        expect(results).to.be.empty;
        let after = await WhereTests.get(penRow).go(consistentRead);
        expect(after.dangerous).to.be.true;
        let doesExist = await WhereTests.patch(penRow)
            .set({dangerous: true})
            .where(({dangerous}, {notExists}) => notExists(dangerous))
            .go({raw: true})
            .then(() => false)
            .catch(() => true);
        expect(doesExist).to.be.true;
    });
    it("Should not delete an animal which does exist", async () => {
        let consistentRead = {params: {ConsistentRead: true}};
        let penRow = penRows[3];
        let existing = await WhereTests.get(penRow).go(consistentRead);
        expect(existing.dangerous).to.be.undefined;
        let wontMatch = await WhereTests.delete(penRow)
            .where(({dangerous}, {exists}) => exists(dangerous))
            .go()
            .then(data => data)
            .catch(err => err);
        expect(wontMatch.message).to.be.equal("The conditional request failed - For more detail on this error reference: https://github.com/tywalch/electrodb#aws-error");
    });
})
