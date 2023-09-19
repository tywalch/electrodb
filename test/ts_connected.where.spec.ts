const sleep = async (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
process.env.AWS_NODEJS_CONNECTION_REUSE_ENABLED = "1";
import { Entity, EntityItem, CreateEntityItem, ElectroEvent} from "../index";
import { createStringEntity, createAnyEntity, createNumberEntity } from './mocks.test';
import { expect } from "chai";
import {v4 as uuid} from "uuid"
import DynamoDB from "aws-sdk/clients/dynamodb";
const client = new DynamoDB.DocumentClient({
    region: "us-east-1",
    endpoint: process.env.LOCAL_DYNAMO_ENDPOINT
});

const table = 'electro';

function getParams(event?: ElectroEvent) {
    if (event?.type === 'query') {
        return JSON.parse(JSON.stringify(event.params));
    }
}

describe("Where Clause Queries", () => {
    before(async () => sleep(1000));
});

describe("Where Clause Queries", () => {
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
            },
            tags: {
                type: 'set',
                items: 'string',
            },
            codes: {
                type: 'set',
                items: 'number',
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
        "Sheep",
        "Shark",
    ];
    const animalTags: Record<string, string[]> = {
        "Chicken": ["feet", "edible", "beak"],
        "Chick": ["feet", "edible", "beak"],
        "Cow": ["hooves", "edible", "snoot"],
        "Dog": ["paws", "snoot"],
        "Pig": ["hooves", "edible", "snout"],
        "Rooster": ["feet", "beak"],
        "Sheep": ["hooves", "snoot"],
        "Shark": ["swims", "nose"],
    }
    let penRows: EntityItem<typeof WhereTests>[] = [];
    before(async () => {
        await Promise.all(animals.map(animal => {
            const tags = animalTags[animal];
            const codes = tags.map(tag => tag.length);
            let row = uuid();
            penRows.push({pen, row, animal});
            if (animal === "Shark") {
                return WhereTests.put({pen, row, animal, dangerous: true, tags, codes}).go().then(res => res.data)
            } else {
                return WhereTests.put({pen, row, animal, tags, codes}).go().then(res => res.data)
            }
        }));
    });

    it("should filter 'field' with 'where'", async () => {
        //
        const unfiltered = await WhereTests.query.farm({ pen }).go();
        expect(unfiltered.data).to.be.an('array').and.have.length(animals.length);

        const unknownFieldFiltered = await WhereTests.query.farm({ pen }).where((_, {field, escape}) => `
            ${field('unknown_field')} = ${escape('value')}
        `).go();
        expect(unknownFieldFiltered.data).to.be.an('array').and.have.length(0);

        const knownFieldFiltered = await WhereTests.query.farm({ pen }).where((_, {field, escape}) => {
            // "animal" attribute is actually stored under the field name "a"
            return `${field("a")} = ${escape('Cow')}`
        }).go();
        expect(knownFieldFiltered.data).to.be.an('array').and.have.length(1);
        expect(knownFieldFiltered.data.map(pen => pen.animal)).to.have.members(["Cow"]);
    });

    it("Should filter 'eq' with 'where'", async () => {
        let animals = await WhereTests.query
            .farm({pen})
            .where(({animal}, op) => op.eq(animal, "Cow"))
            .go().then(res => res.data)
        expect(animals)
            .to.be.an("array")
            .and.have.length(1)
        expect(animals.map(pen => pen.animal)).to.have.members(["Cow"]);
    })
    it("Should filter 'gt' with 'where'", async () => {
        let animals = await WhereTests.query
            .farm({pen})
            .where(({animal}, {gt}) => gt(animal, "Dog"))
            .go().then(res => res.data)
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
            .go().then(res => res.data)
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
            .go().then(res => res.data)
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
            .go().then(res => res.data)
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
            .go().then(res => res.data)
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
            .go().then(res => res.data);

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
            .go().then(res => res.data)
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
            .then(res => res.data)
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

    it("Should filter 'contains' with 'where' on string attribute", async () => {
        let animals = await WhereTests.query
            .farm({pen})
            .where(({animal}, op) => op.contains(animal, "Chick"))
            .go()
            .then(res => res.data)
        expect(animals)
            .to.be.an("array")
            .and.have.length(2);
        expect(animals.map(pen => pen.animal)).to.have.members([
            "Chicken",
            "Chick"
        ]);
    });

    it("Should filter 'contains' with 'where' on string set attribute", async () => {
        let animals = await WhereTests.query
            .farm({ pen })
            .where(({ tags }, op) => op.contains(tags, 'hooves'))
            .go()
            .then(res => res.data)
        expect(animals)
            .to.be.an("array")
            .and.have.length(3);
        expect(animals.map(pen => pen.animal)).to.have.members([
            "Cow",
            "Pig",
            "Sheep",
        ]);
    });

    it("Should filter 'notContains' with 'where' on string set attribute", async () => {
        let animals = await WhereTests.query
            .farm({ pen })
            .where(({ tags }, op) => `${op.contains(tags, 'hooves')} and ${op.notContains(tags, 'edible')}`)
            .go()
            .then(res => res.data)
        expect(animals)
            .to.be.an("array")
            .and.have.length(1);
        expect(animals.map(pen => pen.animal)).to.have.members([
            "Sheep",
        ]);
    });

    it("Should filter 'contains' with 'where' on numeric set attribute", async () => {
        let animals = await WhereTests.query
            .farm({ pen })
            .where(({ codes }, op) => op.contains(codes, 5))
            .go()
            .then(res => res.data)
        expect(animals)
            .to.be.an("array")
            .and.have.length(5);
        expect(animals.map(pen => pen.animal)).to.have.members([
            "Cow",
            "Dog",
            "Pig",
            "Sheep",
            "Shark"
        ]);
    });

    it("Should filter 'notContains' with 'where' on numeric set attribute", async () => {
        let animals = await WhereTests.query
            .farm({ pen })
            .where(({ codes }, op) => `${op.contains(codes, 5)} and ${op.notContains(codes, 4)}`)
            .go()
            .then(res => res.data)
        expect(animals)
            .to.be.an("array")
            .and.have.length(3);
        expect(animals.map(pen => pen.animal)).to.have.members([
            "Cow",
            "Pig",
            "Sheep",
        ]);
    });

    it("Should filter 'notContains' with 'where' on string attribute", async () => {
        let animals = await WhereTests.query
            .farm({pen})
            .where(({animal}, {notContains}) => notContains(animal, "o"))
            .go()
            .then(res => res.data)
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
            .go().then(res => res.data);
        expect(animals)
            .to.be.an("array")
            .and.have.length(1);
        expect(animals.map(pen => pen.animal))
            .to.have.members(["Pig"]);
    });
    it("Should allow for value operations to be used more than once", async () => {
        let animals = await WhereTests.query
            .farm({pen})
            .where(({animal, dangerous}, {value, gt, eq}) => {
                const piggy = value(animal, "Pig");
                return `
                    ${eq(animal, "Pig")} 
                    OR (${gt(animal, piggy)} AND ${eq(dangerous, true)})`;
            })
            .go().then(res => res.data);
        expect(animals)
            .to.be.an("array")
            .and.have.length(2);
        expect(animals.map(pen => pen.animal))
            .to.have.members(["Pig", "Shark"]);
    });
    it("Should not update an animal which doesnt exist", async () => {
        try {
            await WhereTests.update(penRows[0])
                .set({dangerous: true})
                .where(({animal}, {value, name}) => `
					${name(animal)} = ${value(animal, "Bear")}
				`)
                .go().then(res => res.data);
            throw new Error("Should have thrown")
        } catch(err: any) {
            expect(err.message).to.equal('Error thrown by DynamoDB client: "The conditional request failed" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#aws-error');
        }
    });
    it("Should update an animal which does exist", async () => {
        let consistentRead = {params: {ConsistentRead: true}};
        let penRow = penRows[0];
        let before = await WhereTests.get(penRow).go(consistentRead).then(res => res.data);
        expect(before?.dangerous).to.be.undefined;
        let results = await WhereTests.update(penRow)
            .set({dangerous: true})
            .where(({animal, dangerous}, {value, name, notExists}) => `
				${name(animal)} = ${value(animal, penRow.animal)} AND ${notExists(dangerous)}
			`)
            .go({raw: true}).then(res => res.data);
        expect(results).to.be.empty;
        let after = await WhereTests.get(penRow).go(consistentRead).then(res => res.data);
        expect(after?.dangerous).to.be.true;
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
        let before = await WhereTests.get(penRow).go(consistentRead).then(res => res.data);
        expect(before?.dangerous).to.be.undefined;
        let results = await WhereTests.patch(penRow)
            .set({dangerous: true})
            .where(({dangerous}, {notExists}) => notExists(dangerous))
            .go().then(res => res.data);
        expect(results).to.deep.equal({
            pen: penRow.pen,
            row: penRow.row,
        });
        let after = await WhereTests.get(penRow).go(consistentRead).then(res => res.data);
        expect(after?.dangerous).to.be.true;
        let doesExist = await WhereTests.patch(penRow)
            .set({dangerous: true})
            .where(({dangerous}, {notExists}) => notExists(dangerous))
            .go({raw: true}).then(res => res.data)
            .then(() => false)
            .catch(() => true);
        expect(doesExist).to.be.true;
    });
    it("Should not delete an animal which does exist", async () => {
        let consistentRead = {params: {ConsistentRead: true}};
        let penRow = penRows[3];
        let existing = await WhereTests.get(penRow).go(consistentRead).then(res => res.data);
        expect(existing?.dangerous).to.be.undefined;
        let wontMatch = await WhereTests.delete(penRow)
            .where(({dangerous}, {exists}) => exists(dangerous))
            .go()
            .then(res => res.data)
            .then(data => data)
            .catch(err => err);
        expect(wontMatch.message).to.be.equal('Error thrown by DynamoDB client: "The conditional request failed" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#aws-error');
    });
    it('should properly handle nested properties being used more than once', () => {
        const table = "your_table_name";

        const tasks = new Entity(
            {
                model: {
                    entity: "tasks",
                    version: "1",
                    service: "taskapp"
                },
                attributes: {
                    team: {
                        type: "string",
                        required: true
                    },
                    task: {
                        type: "string",
                        required: true
                    },
                    project: {
                        type: "string",
                        required: true
                    },
                    example: {
                        type: 'map',
                        properties: {
                            from: {
                                type: 'number',
                            },
                            to: {
                                type: 'number',
                            },
                        },
                    }
                },
                indexes: {
                    projects: {
                        pk: {
                            field: "pk",
                            composite: ["team"]
                        },
                        sk: {
                            field: "sk",
                            // create composite keys for partial sort key queries
                            composite: ["project", "task"]
                        }
                    }
                }
            },
            { table }
        );


        const team = "my_team";
        const epoch = Date.now();

        const params = tasks.query
            .projects({team})
            .where(({ example: { from, to } }, { lte, gte, notExists }) => {
                return `${lte(from, epoch)} AND (${gte(to, epoch)} OR ${notExists(to)})`
            })
            .params();

        expect(params).to.be.deep.equal({
            "KeyConditionExpression": "#pk = :pk and begins_with(#sk1, :sk1)",
            "TableName": "your_table_name",
            "ExpressionAttributeNames": {
                "#example": "example",
                "#from": "from",
                "#to": "to",
                "#pk": "pk",
                "#sk1": "sk"
            },
            "ExpressionAttributeValues": {
                ":from0": epoch,
                ":to0": epoch,
                ":pk": "$taskapp#team_my_team",
                ":sk1": "$tasks_1#project_"
            },
            "FilterExpression": "#example.#from <= :from0 AND (#example.#to >= :to0 OR attribute_not_exists(#example.#to))"
        });
    });

    it('scan should start a new chain with each use', () => {
        const table = "your_table_name";

        const MyEntity = new Entity(
            {
                model: {
                    entity: "tasks",
                    version: "1",
                    service: "taskapp"
                },
                attributes: {
                    team: {
                        type: "string",
                        required: true
                    },
                    task: {
                        type: "string",
                        required: true
                    },
                    project: {
                        type: "string",
                        required: true
                    },
                    complete: {
                        type: 'boolean'
                    },
                    example: {
                        type: 'map',
                        properties: {
                            from: {
                                type: 'number',
                            },
                            to: {
                                type: 'number',
                            },
                        },
                    }
                },
                indexes: {
                    projects: {
                        pk: {
                            field: "pk",
                            composite: ["team"]
                        },
                        sk: {
                            field: "sk",
                            // create composite keys for partial sort key queries
                            composite: ["project", "task"]
                        }
                    }
                }
            },
            { table }
        );

        const where1 = MyEntity.scan.where(({ complete }, { eq }) => eq(complete, false))
        expect(where1.params()).to.deep.equal({
            TableName: 'your_table_name',
            ExpressionAttributeNames: {
                '#complete': 'complete',
                '#pk': 'pk',
                '#sk': 'sk',
                '#__edb_e__': '__edb_e__',
                '#__edb_v__': '__edb_v__'
            },
            ExpressionAttributeValues: {
                ':complete0': false,
                ':pk': '$taskapp#team_',
                ':sk': '$tasks_1#project_',
                ':__edb_e__0': 'tasks',
                ':__edb_v__0': '1'
            },
            FilterExpression: 'begins_with(#pk, :pk) AND begins_with(#sk, :sk) AND (#complete = :complete0) AND #__edb_e__ = :__edb_e__0 AND #__edb_v__ = :__edb_v__0'
        });

        const where2 = MyEntity.scan.where(({ complete }, { eq }) => eq(complete, true))
        expect(where2.params()).to.deep.equal({
            TableName: 'your_table_name',
            ExpressionAttributeNames: {
                '#complete': 'complete',
                '#pk': 'pk',
                '#sk': 'sk',
                '#__edb_e__': '__edb_e__',
                '#__edb_v__': '__edb_v__'
            },
            ExpressionAttributeValues: {
                ':complete0': true,
                ':pk': '$taskapp#team_',
                ':sk': '$tasks_1#project_',
                ':__edb_e__0': 'tasks',
                ':__edb_v__0': '1'
            },
            FilterExpression: 'begins_with(#pk, :pk) AND begins_with(#sk, :sk) AND (#complete = :complete0) AND #__edb_e__ = :__edb_e__0 AND #__edb_v__ = :__edb_v__0'
        });

        const where3 = MyEntity.scan.where(({ complete }, { eq }) => eq(complete, true))
        expect(where3.params()).to.deep.equal({
            TableName: 'your_table_name',
            ExpressionAttributeNames: {
                '#complete': 'complete',
                '#pk': 'pk',
                '#sk': 'sk',
                '#__edb_e__': '__edb_e__',
                '#__edb_v__': '__edb_v__'
            },
            ExpressionAttributeValues: {
                ':complete0': true,
                ':pk': '$taskapp#team_',
                ':sk': '$tasks_1#project_',
                ':__edb_e__0': 'tasks',
                ':__edb_v__0': '1'
            },
            FilterExpression: 'begins_with(#pk, :pk) AND begins_with(#sk, :sk) AND (#complete = :complete0) AND #__edb_e__ = :__edb_e__0 AND #__edb_v__ = :__edb_v__0'
        });
    });

    it('should upsert with a condition', () => {
        const actors = new Entity(
            {
                model: {
                    entity: "actors",
                    version: "1",
                    service: "taskapp"
                },
                attributes: {
                    studio: {
                        type: "string",
                        required: true
                    },
                    productionHouse: {
                        type: "string",
                        required: true
                    },
                    project: {
                        type: "string",
                        required: true,
                    },
                    genre: {
                        type: 'string'
                    },
                    movie: {
                        type: 'string'
                    },
                    actor: {
                        type: 'string'
                    }
                },
                indexes: {
                    byStudio: {
                        pk: {
                            field: "pk",
                            composite: ["studio"]
                        },
                        sk: {
                            field: "sk",
                            // create composite keys for partial sort key queries
                            composite: ["productionHouse", "actor"]
                        }
                    },
                    byActor: {
                        index: 'gsi2pk-gsi2sk-index',
                        pk: {
                            field: 'gsi2pk',
                            composite: ['actor']
                        },
                        sk: {
                            field: 'gsi2sk',
                            composite: ['genre', 'movie']
                        }
                    }
                }
            },
            { table, client }
        );
        const params = actors.upsert({productionHouse: 'productionHouse1', studio: 'studio1', project: 'project2', actor: 'actor1'})
            .where((attr, op) => op.eq(attr.project, 'project1'))
            .params();

        expect(params).to.deep.equal({
            TableName: 'electro',
            UpdateExpression: 'SET #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0, #studio = :studio_u0, #productionHouse = :productionHouse_u0, #project = :project_u0, #actor = :actor_u0, #gsi2pk = :gsi2pk_u0, #gsi2sk = :gsi2sk_u0',
            ExpressionAttributeNames: {
                '#project': 'project',
                '#__edb_e__': '__edb_e__',
                '#__edb_v__': '__edb_v__',
                '#studio': 'studio',
                '#productionHouse': 'productionHouse',
                '#actor': 'actor',
                '#gsi2pk': 'gsi2pk',
                '#gsi2sk': 'gsi2sk'
            },
            ExpressionAttributeValues: {
                ':project0': 'project1',
                ':__edb_e___u0': 'actors',
                ':__edb_v___u0': '1',
                ':studio_u0': 'studio1',
                ':productionHouse_u0': 'productionHouse1',
                ':project_u0': 'project2',
                ':actor_u0': 'actor1',
                ':gsi2pk_u0': '$taskapp#actor_actor1',
                ':gsi2sk_u0': '$actors_1#genre_'
            },
            Key: {
                pk: '$taskapp#studio_studio1',
                sk: '$actors_1#productionhouse_productionhouse1#actor_actor1'
            },
            ConditionExpression: '#project = :project0'
        });
    });

    it('should apply a size filter on query', async () => {
        const { entity, logCollector } = createStringEntity({table, client});
        const type = uuid();
        const items: CreateEntityItem<typeof entity>[] = [
            {
                name: uuid(),
                type: type,
                prop: 'a'
            },
            {
                name: uuid(),
                type: type,
                prop: 'ab'
            },
            {
                name: uuid(),
                type: type,
                prop: 'abc'
            },
            {
                name: uuid(),
                type: type,
                prop: 'abcd'
            },
            {
                name: uuid(),
                type: type,
                prop: 'abcde'
            },
            {
                name: uuid(),
                type: type,
                prop: 'abcdef'
            },
            {
                name: uuid(),
                type: type,
                prop: 'abcdefg'
            },
        ];

        await entity.put(items).go();
        logCollector.reset();

        const minSize = 3;
        const maxSize = 5;
        const exception = 'a'
        const { data } = await entity.query
            .records({type})
            .where(({prop}, {size, escape, eq}) => `
                ${size(prop)} >= ${escape(minSize)} OR ${eq(prop, escape(exception))} OR ${size(prop)} <= ${escape(maxSize)}
            `)
            .go();

        const log = logCollector.get().find(event => event.type === 'query');

        expect(
            data.sort((a, z) => a.name.localeCompare(z.name))
        ).to.deep.equal(items
            .sort((a, z) => a.name.localeCompare(z.name))
            .filter(item => {
                return (item.prop && item.prop.length >= minSize) ||
                    (item.prop && item.prop.length <= maxSize) ||
                    item.prop === exception;
            })
        );

        expect(getParams(log)).to.deep.equal({
            "KeyConditionExpression": "#pk = :pk and begins_with(#sk1, :sk1)",
            "TableName": "electro",
            "ExpressionAttributeNames": {
                "#prop": "prop",
                "#pk": "pk",
                "#sk1": "sk"
            },
            "ExpressionAttributeValues": {
                ":30": minSize,
                ":a0": exception,
                ":50": maxSize,
                ":pk": `$taskapp#type_${type}`,
                ":sk1": "$tasks_1#name_"
            },
            "FilterExpression": "size(#prop) >= :30 OR #prop = :a0 OR size(#prop) <= :50"
        });
    });

    it('should apply an attribute type filter on query', async () => {
        const { entity, logCollector } = createAnyEntity({table, client});
        const type = uuid();
        const items: CreateEntityItem<typeof entity>[] = [
            {
                name: uuid(),
                type: type,
                prop: ['list', 'attribute']
            },
            {
                name: uuid(),
                type: type,
                prop: { map: 'attribute' }
            },
            {
                name: uuid(),
                type: type,
                prop: 'string'
            },
            {
                name: uuid(),
                type: type,
                prop: 123
            },
            {
                name: uuid(),
                type: type,
                prop: true
            },
        ];

        await entity.put(items).go();
        logCollector.reset();

        const { data } = await entity.query
            .records({type})
            .where(({prop}, {type}) => `
                ${type(prop, 'L')} OR ${type(prop, 'BOOL')}
            `)
            .go();

        const log = logCollector.get().find(event => event.type === 'query');
        const results = data.sort((a, z) => a.name.localeCompare(z.name));
        const expected = items.sort((a, z) => a.name.localeCompare(z.name))
            .filter(item => Array.isArray(item.prop) || typeof item.prop === 'boolean')

        expect(results).to.deep.equal(expected);
        expect(getParams(log)).to.deep.equal({
            KeyConditionExpression: '#pk = :pk and begins_with(#sk1, :sk1)',
            TableName: 'electro',
            ExpressionAttributeNames: { '#prop': 'prop', '#pk': 'pk', '#sk1': 'sk' },
            ExpressionAttributeValues: {
                ':prop0': 'L',
                ':prop1': 'BOOL',
                ':pk': `$taskapp#type_${type}`,
                ':sk1': '$tasks_1#name_'
            },
            FilterExpression: 'attribute_type(#prop, :prop0) OR attribute_type(#prop, :prop1)',
        });

        it('should accept number literals via "escape"', async () => {
            const { entity, logCollector } = createNumberEntity({table, client});
            const type = uuid();
            const items: CreateEntityItem<typeof entity>[] = [
                {
                    name: uuid(),
                    type: type,
                    prop: 1
                },
                {
                    name: uuid(),
                    type: type,
                    prop: 2
                },
                {
                    name: uuid(),
                    type: type,
                    prop: 3
                },
                {
                    name: uuid(),
                    type: type,
                    prop: 4
                },
                {
                    name: uuid(),
                    type: type,
                    prop: 5
                },
                {
                    name: uuid(),
                    type: type,
                    prop: 6
                },
                {
                    name: uuid(),
                    type: type,
                    prop: 7
                },
            ];

            await entity.put(items).go();
            logCollector.reset();

            const minSize = 3;
            const maxSize = 5;
            const exception = 1
            const { data } = await entity.query
                .records({type})
                .where(({prop}, { escape, eq, name }) => `
                    ${name(prop)} >= ${escape(minSize)} OR ${eq(prop, escape(exception))} OR ${name(prop)} <= ${escape(maxSize)}
                `)
                .go();

            const log = logCollector.get().find(event => event.type === 'query');

            expect(
                data.sort((a, z) => a.name.localeCompare(z.name))
            ).to.deep.equal(items
                .sort((a, z) => a.name.localeCompare(z.name))
                .filter(item => {
                    return (item.prop && item.prop >= minSize) ||
                        (item.prop && item.prop <= maxSize) ||
                        item.prop === exception;
                })
            );

            expect(getParams(log)).to.deep.equal({
                "KeyConditionExpression": "#pk = :pk and begins_with(#sk1, :sk1)",
                "TableName": "electro",
                "ExpressionAttributeNames": {
                    "#prop": "prop",
                    "#pk": "pk",
                    "#sk1": "sk"
                },
                "ExpressionAttributeValues": {
                    ":30": minSize,
                    ":a0": exception,
                    ":50": maxSize,
                    ":pk": `$taskapp#type_${type}`,
                    ":sk1": "$tasks_1#name_"
                },
                "FilterExpression": "#prop >= :30 OR #prop = :a0 OR #prop <= :50"
            });
        });
    });
});
