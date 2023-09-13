const { DocumentClient } = require("aws-sdk/clients/dynamodb");
// import { v4 as uuid } from 'uuid';
const { expect } = require('chai');
const { removeFixings, removeJSONPath } = require('../src/util');
const { Entity } = require('..');
function print(value, label) {
    const formatted = JSON.stringify(value, null, 4);
    console.log(...[
        label,
        value instanceof Error ? value : formatted,
    ].filter(Boolean));
}

const table = "electro";

const client = new DocumentClient({
    region: "us-east-1",
    endpoint: 'http://localhost:8000',
});

const UrlEntity = new Entity(
    {
        model: {
            entity: "url",
            version: "1",
            service: "app",
        },
        attributes: {
            url: {
                type: "string",
                required: true,
            },
            citation: {
                type: "string",
                required: true,
            },
            description: {
                type: "string",
                required: false,
            },
            count: {
                type: "number"
            },
            nested: {
                type: 'map',
                properties: {
                    count: {
                        type: 'number'
                    }
                }
            },
            listed: {
                type: 'list',
                items: {
                    type: 'number'
                }
            },
            listNested: {
                type: 'list',
                items: {
                    type: 'map',
                    properties: {
                        count: {
                            type: 'number',
                        }
                    }
                }
            },
            createdAt: {
                type: "number",
                default: () => Date.now(),
                // cannot be modified after created
                readOnly: true,
            },
            updatedAt: {
                type: "number",
                // watch for changes to any attribute
                watch: "*",
                // set current timestamp when updated
                set: () => Date.now(),
                readOnly: true,
            },
        },
        indexes: {
            urls: {
                pk: {
                    field: "pk",
                    composite: ["url"],
                },
            },
            byUpdated: {
                index: "gsi1pk-gsi1sk-index",
                pk: {
                    // map to your GSI Hash/Partition key
                    field: "gsi1pk",
                    composite: [],
                },
                sk: {
                    // map to your GSI Range/Sort key
                    field: "gsi1sk",
                    composite: ["updatedAt"],
                },
            },
        },
    },
    { table }
);


async function main2() {
    const cases = [
        {
            description: 'not present',
            input: {
                obj: {},
                path: 'prop1'
            },
            output: undefined,
        },
        {
            description: 'present and is a string',
            input: {
                obj: { prop1: 'abc' },
                path: 'prop1'
            },
            output: {},
        },
        {
            description: 'present and is a falsey number',
            input: {
                obj: { prop1: 0 },
                path: 'prop1'
            },
            output: {},
        },
        {
            description: 'present and is a number',
            input: {
                obj: { prop1: 1 },
                path: 'prop1'
            },
            output: {},
        },
        {
            description: 'present and is a false boolean',
            input: {
                obj: { prop1: false },
                path: 'prop1'
            },
            output: {},
        },
        {
            description: 'present and is a boolean',
            input: {
                obj: { prop1: true },
                path: 'prop1'
            },
            output: {},
        },
        {
            description: 'present and is null',
            input: {
                obj: { prop1: null },
                path: 'prop1'
            },
            output: {},
        },
        {
            description: 'present and is undefined',
            input: {
                obj: { prop1: undefined },
                path: 'prop1'
            },
            output: {},
        },
        {
            description: 'present and is an object',
            input: {
                obj: { prop1: { prop2: 'abc' } },
                path: 'prop1'
            },
            output: {},
        },
        {
            description: 'present and is an array',
            input: {
                obj: { prop1: [{ prop2: 'abc' }] },
                path: 'prop1'
            },
            output: {},
        },
        // {
        //     description: 'present and is an array element',
        //     input: {
        //         obj: [ 'abc' ],
        //         path: '0'
        //     },
        //     output: [],
        // },
        // {
        //     description: 'present and is an array element with alternate syntax',
        //     input: {
        //         obj: [ 'abc' ],
        //         path: '[0]'
        //     },
        //     output: [],
        // },
    ];
    const modifiers = [
        // as is
        {
            description: 'in the root object',
            modify: (test) => test,
        },
        {
            description: 'in an object',
            modify: (test) => {
                return {
                    input: {
                        obj: {
                            container: {
                                ...test.input.obj,
                                prop3: 'abc',
                            }
                        },
                        path: `container.${test.input.path}`,
                    },
                    output: {
                        container: {
                            prop3: 'abc',
                        }
                    }
                }
            }
        },
        {
            description: 'in nested an array object',
            modify: (test) => {
                return {
                    input: {
                        obj: {
                            container: [{...test.input.obj, prop3: 'abc'}],
                        },
                        path: `container[0].${test.input.path}`,
                    },
                    output: {
                        container: [{
                            prop3: 'abc'
                        }]
                    }
                }
            }
        },
        {
            description: 'in an array as the first element',
            modify: (test) => {
                return {
                    input: {
                        obj: [
                            test.input.obj,
                            { prop5: 'def' },
                        ],
                        path: `[1].${test.input.path}`,
                    },
                    output: [ test.input.obj, { prop5: 'def' } ],
                }
            },
        },
        {
            description: 'in an array as the second element',
            modify: (test) => {
                return {
                    input: {
                        obj: [
                            { prop5: 'def' },
                            test.input.obj
                        ],
                        path: `[1].${test.input.path}`,
                    },
                    output: [{ prop5: 'def' } ]
                }
            },
        },
    ];

    const tests = [];
    for (const testCase of cases) {
        // tests.push({
        //     ...testCase
        // });
        for (const modifier of modifiers) {
            const test = {
                description: `when path is ${modifier.description} and the value ${testCase.description}`,
                ...modifier.modify(testCase),
            }
            tests.push(test);
        }
    }

    const it = (description, fn) => {
        let error;
        try {
            fn();
        } catch(err) {
            error = err;
        }

        print({
            description,
            success: !error,
            error: error ? error.message : undefined,
            // actual: error.actual,
            // expected: error.expected,
        });
    }

    for (const { input, output, description } of tests) {
        it(`${description}, it should indicate whether or not it was able to to locate the path provided and remove the value at the provided`, () => {
            let result;
            try {
                result = removeJSONPath(input.obj, input.path);
                expect(result).to.deep.equal(output)
            } catch(err) {
                print({result, output});
                throw err;
            }
        });
    }

    return 'done';
}

async function main() {
    const url = 'url';
    const citation = 'citation';
    const description = 'description';
    const params = UrlEntity.upsert({
        url,
        citation,
        description,
        count: 1,
        nested: {
            count: 2,
        },
        listed: [3, 4],
        listNested: [{
            count: 5,
        }, {
            count: 6
        }]
    })
        .data((attr, op) => op.add(attr.count, 7))
        .data((attr, op) => op.add(attr.nested.count, 8))
        .data((attr, op) => op.add(attr.listed[0], 9))
        .data((attr, op) => op.add(attr.listNested[0].count, 10))
        .params()

    return params;
}

main().then(print).catch(err => print(err, 'MAIN FAILED:'));