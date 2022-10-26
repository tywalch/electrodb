import {Entity, Service} from "../index";
const table = 'electro';
const hold = new Entity(
    {
        model: {
            entity: "hold",
            version: "1",
            service: "transactions"
        },
        attributes: {
            prop1: {
                type: 'string'
            },
            prop2: {
                type: 'string'
            },
            prop3: {
                type: 'string'
            }
        },
        indexes: {
            projects: {
                collection: 'clusteredAll',
                type: 'clustered',
                pk: {
                    field: "pk",
                    composite: ["prop1"]
                },
                sk: {
                    field: "sk",
                    composite: ["prop2", "prop3"]
                }
            },
            other: {
                index: 'two',
                collection: 'emptyAll',
                // type: 'clustered',
                pk: {
                    field: "pk2",
                    composite: ["prop1"]
                },
                sk: {
                    field: "sk2",
                    composite: ["prop2", "prop3"]
                }
            },
            last: {
                index: 'three',
                collection: 'isolatedSome',
                type: 'clustered',
                pk: {
                    field: "pk3",
                    composite: ["prop1"]
                },
                sk: {
                    field: "sk3",
                    composite: ["prop2", "prop3"]
                }
            }
        }
    },
    { table }
);

const deposit = new Entity(
    {
        model: {
            entity: "hold",
            version: "1",
            service: "transactions"
        },
        attributes: {
            prop1: {
                type: 'string'
            },
            prop2: {
                type: 'string'
            },
            prop3: {
                type: 'string'
            }
        },
        indexes: {
            projects: {
                collection: 'clusteredAll',
                type: 'clustered',
                pk: {
                    field: "pk",
                    composite: ["prop1"]
                },
                sk: {
                    field: "sk",
                    composite: ["prop2", "prop3"]
                }
            },
            other: {
                index: 'two',
                collection: 'emptyAll',
                // type: 'clustered',
                pk: {
                    field: "pk2",
                    composite: ["prop1"]
                },
                sk: {
                    field: "sk2",
                    composite: ["prop2", "prop3"]
                }
            },
            last: {
                index: 'three',
                type: 'clustered',
                collection: 'clusteredOne',
                pk: {
                    field: "pk3",
                    composite: ["prop1"]
                },
                sk: {
                    field: "sk3",
                    composite: ["prop2", "prop3"]
                }
            }
        }
    },
    { table }
);

const debit = new Entity(
    {
        model: {
            entity: "debit",
            version: "1",
            service: "transactions"
        },
        attributes: {
            prop1: {
                type: 'string'
            },
            prop2: {
                type: 'string'
            },
            prop4: {
                type: 'number'
            }
        },
        indexes: {
            projects: {
                collection: 'clusteredAll',
                type: 'clustered',
                pk: {
                    field: "pk",
                    composite: ["prop1"]
                },
                sk: {
                    field: "sk",
                    composite: ["prop2", "prop4"]
                }
            },
            other: {
                index: 'two',
                collection: 'emptyAll',
                pk: {
                    field: "pk2",
                    composite: ["prop1"]
                },
                sk: {
                    field: "sk2",
                    composite: ["prop2", "prop4"]
                }
            },
            last: {
                index: 'three',
                collection: 'isolatedSome',
                type: 'clustered',
                pk: {
                    field: "pk3",
                    composite: ["prop1"]
                },
                sk: {
                    field: "sk3",
                    composite: ["prop2", "prop4"]
                }
            }
        }
    },
    { table }
);

const transactions = new Service({
    hold,
    deposit,
    debit
});

async function main() {
    const prop1 = 'abc';
    const prop2 = 'def';
    const prop3 = 'hgi';

    // todo: collections should never finish an index
    const params = transactions.collections
        .isolatedSome({prop1, prop2, prop3})
        .where((attr, op) => {
            op.eq(attr.prop4, '10');
            return op.eq(attr.prop4, 10);
        })
        .go()
        .then(resp => resp.data)
        .then(({debit, hold}) => {
            debit[0].prop2
            debit[0].prop3
        });

    // transactions
    //     .collections.all({prop1});
    //
    //
    //
    transactions.collections
        .clusteredAll({prop1})
        .gte({prop2})
        .where((attr, op) => `
            ${op.eq(attr.prop3, 5)} and
            ${op.eq(attr.prop3, 'abc')}
        `)
        .go()
        .then(resp => resp.data)
        .then(({deposit, hold, debit}) => {
            return {
                deposits: deposit[0].prop3,
                holds: hold,
                debits: debit[0].prop3
            }
        })

    transactions.collections
        .clusteredOne({prop1})
        .gte({prop2})
        .where((attr, op) => `
            ${op.eq(attr.prop3, 5)} and
            ${op.eq(attr.prop3, 'abc')}
        `)
        .go()
        .then(resp => resp.data)
        .then(({deposit, hold, debit}) => {
            return {
                prop4: deposit[0].prop4,
                prop3: deposit[0].prop3,
            }
        })

    transactions.collections
        .emptyAll({prop1})
        .where((attr, op) => `
            ${op.eq(attr.prop3, 5)} and
            ${op.eq(attr.prop3, 'abc')}
        `)
        .go()
        .then(resp => resp.data)
        .then(({deposit, hold, debit}) => {
            return {
                prop4: deposit[0].prop4,
                prop3: deposit[0].prop3,
            }
        })

}