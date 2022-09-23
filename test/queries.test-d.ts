import {
    Entity,
    Schema,
    Resolve,
    ResponseItem,
    GoQueryTerminal,
    // PageQueryTerminal,
    Queries
} from '../';
import { expectType, expectError, expectNotType } from 'tsd';

interface QueryGoOptions<Attributes> {
    raw?: boolean;
    table?: string;
    limit?: number;
    params?: object;
    includeKeys?: boolean;
    originalErr?: boolean;
    ignoreOwnership?: boolean;
    pages?: number;
    attributes?: ReadonlyArray<Attributes>
}

const troubleshoot = <Params extends any[], Response>(fn: (...params: Params) => Response, response: Response) => {};
const magnify = <T>(value: T): Resolve<T> => { return {} as Resolve<T> };
const keys = <T>(value: T): keyof T => { return {} as keyof T };

class MockEntity<A extends string, F extends string, C extends string, S extends Schema<A,F,C>> {
    readonly schema: S;

    constructor(schema: S) {
        this.schema = schema;
    };

    getGoQueryTerminal(): GoQueryTerminal<A,F,C,S, ResponseItem<A,F,C,S>> {
        return {} as GoQueryTerminal<A,F,C,S, ResponseItem<A,F,C,S>>;
    }

    // getPageQueryTerminal(): PageQueryTerminal<A,F,C,S, ResponseItem<A,F,C,S>, {abc: string}> {
    //     return {} as PageQueryTerminal<A,F,C,S, ResponseItem<A,F,C,S>, {abc: string}>;
    // }

    getQueries(): Queries<A,F,C,S> {
        return {} as Queries<A,F,C,S>;
    }

    getKeyofQueries(): keyof Queries<A,F,C,S> {
        return {} as keyof Queries<A,F,C,S>;
    }
}

const entityWithSK = new MockEntity({
    model: {
        entity: "abc",
        service: "myservice",
        version: "myversion"
    },
    attributes: {
        attr1: {
            type: "string",
            default: "abc",
            get: (val) => val + 123,
            set: (val) => (val ?? "") + 456,
            validate: (val) => !!val,
        },
        attr2: {
            type: "string",
            // default: () => "sfg",
            // required: false,
            validate: (val) => val.length > 0
        },
        attr3: {
            type: ["123", "def", "ghi"] as const,
            default: "def"
        },
        attr4: {
            type: ["abc", "ghi"] as const,
            required: true
        },
        attr5: {
            type: "string"
        },
        attr6: {
            type: "number",
            default: () => 100,
            get: (val) => val + 5,
            set: (val) => (val ?? 0) + 5,
            validate: (val) => true,
        },
        attr7: {
            type: "any",
            default: () => false,
            get: (val) => ({key: "value"}),
            set: (val) => (val ?? 0) + 5,
            validate: (val) => true,
        },
        attr8: {
            type: "boolean",
            required: true,
            get: (val) => !!val,
            set: (val) => !!val,
            validate: (val) => !!val,
        },
        attr9: {
            type: "number"
        },
        attr10: {
            type: "boolean"
        }
    },
    indexes: {
        myIndex: {
            collection: "mycollection2",
            pk: {
                field: "pk",
                composite: ["attr1"]
            },
            sk: {
                field: "sk",
                composite: ["attr2"]
            }
        },
        myIndex2: {
            collection: "mycollection1",
            index: "gsi1",
            pk: {
                field: "gsipk1",
                composite: ["attr6", "attr9"]
            },
            sk: {
                field: "gsisk1",
                composite: ["attr4", "attr5"]
            }
        },
        myIndex3: {
            collection: "mycollection",
            index: "gsi2",
            pk: {
                field: "gsipk2",
                composite: ["attr5"]
            },
            sk: {
                field: "gsisk2",
                composite: ["attr4", "attr3", "attr9"]
            }
        }
    }
});

const entityWithoutSK = new MockEntity({
    model: {
        entity: "abc",
        service: "myservice",
        version: "myversion"
    },
    attributes: {
        attr1: {
            type: "string",
            // default: "abc",
            get: (val) => val + 123,
            set: (val) => (val ?? "0") + 456,
            validate: (val) => !!val,
        },
        attr2: {
            type: "string",
            // default: () => "sfg",
            // required: false,
            validate: (val) => val.length > 0
        },
        attr3: {
            type: ["123", "def", "ghi"] as const,
            default: "def"
        },
        attr4: {
            type: ["abc", "def"] as const,
            required: true
        },
        attr5: {
            type: "string"
        },
        attr6: {
            type: "number",
            default: () => 100,
            get: (val) => val + 5,
            set: (val) => (val ?? 0) + 5,
            validate: (val) => true,
        },
        attr7: {
            type: "any",
            default: () => false,
            get: (val) => ({key: "value"}),
            set: (val) => (val ?? 0) + 5,
            validate: (val) => true,
        },
        attr8: {
            type: "boolean",
            required: true,
            default: () => false,
            get: (val) => !!val,
            set: (val) => !!val,
            validate: (val) => !!val,
        },
        attr9: {
            type: "number"
        }
    },
    indexes: {
        myIndex: {
            pk: {
                field: "pk",
                composite: ["attr1"]
            }
        },
        myIndex2: {
            index: "gsi1",
            collection: "mycollection1",
            pk: {
                field: "gsipk1",
                composite: ["attr6", "attr9"]
            },
            sk: {
                field: "gsisk1",
                composite: []
            }
        },
        myIndex3: {
            collection: "mycollection",
            index: "gsi2",
            pk: {
                field: "gsipk2",
                composite: ["attr5"]
            },
            sk: {
                field: "gsisk2",
                composite: []
            }
        }
    }
});

const entityWithSKE = new Entity({
    model: {
        entity: "abc",
        service: "myservice",
        version: "myversion"
    },
    attributes: {
        attr1: {
            type: "string",
            default: "abc",
            get: (val) => val + 123,
            set: (val) => (val ?? "") + 456,
            validate: (val) => !!val,
        },
        attr2: {
            type: "string",
            // default: () => "sfg",
            // required: false,
            validate: (val) => val.length > 0
        },
        attr3: {
            type: ["123", "def", "ghi"] as const,
            default: "def"
        },
        attr4: {
            type: ["abc", "ghi"] as const,
            required: true
        },
        attr5: {
            type: "string"
        },
        attr6: {
            type: "number",
            default: () => 100,
            get: (val) => val + 5,
            set: (val) => (val ?? 0) + 5,
            validate: (val) => true,
        },
        attr7: {
            type: "any",
            default: () => false,
            get: (val) => ({key: "value"}),
            set: (val) => (val ?? 0) + 5,
            validate: (val) => true,
        },
        attr8: {
            type: "boolean",
            required: true,
            get: (val) => !!val,
            set: (val) => !!val,
            validate: (val) => !!val,
        },
        attr9: {
            type: "number"
        },
        attr10: {
            type: "boolean"
        }
    },
    indexes: {
        myIndex: {
            collection: "mycollection2",
            pk: {
                field: "pk",
                composite: ["attr1"]
            },
            sk: {
                field: "sk",
                composite: ["attr2"]
            }
        },
        myIndex2: {
            collection: "mycollection1",
            index: "gsi1",
            pk: {
                field: "gsipk1",
                composite: ["attr6", "attr9"]
            },
            sk: {
                field: "gsisk1",
                composite: ["attr4", "attr5"]
            }
        },
        myIndex3: {
            collection: "mycollection",
            index: "gsi2",
            pk: {
                field: "gsipk2",
                composite: ["attr5"]
            },
            sk: {
                field: "gsisk2",
                composite: ["attr4", "attr3", "attr9"]
            }
        }
    }
});

const entityWithoutSKE = new Entity({
    model: {
        entity: "abc",
        service: "myservice",
        version: "myversion"
    },
    attributes: {
        attr1: {
            type: "string",
            // default: "abc",
            get: (val) => val + 123,
            set: (val) => (val ?? "0") + 456,
            validate: (val) => !!val,
        },
        attr2: {
            type: "string",
            // default: () => "sfg",
            // required: false,
            validate: (val) => val.length > 0
        },
        attr3: {
            type: ["123", "def", "ghi"] as const,
            default: "def"
        },
        attr4: {
            type: ["abc", "def"] as const,
            required: true
        },
        attr5: {
            type: "string"
        },
        attr6: {
            type: "number",
            default: () => 100,
            get: (val) => val + 5,
            set: (val) => (val ?? 0) + 5,
            validate: (val) => true,
        },
        attr7: {
            type: "any",
            default: () => false,
            get: (val) => ({key: "value"}),
            set: (val) => (val ?? 0) + 5,
            validate: (val) => true,
        },
        attr8: {
            type: "boolean",
            required: true,
            default: () => false,
            get: (val) => !!val,
            set: (val) => !!val,
            validate: (val) => !!val,
        },
        attr9: {
            type: "number"
        }
    },
    indexes: {
        myIndex: {
            pk: {
                field: "pk",
                composite: ["attr1"]
            }
        },
        myIndex2: {
            index: "gsi1",
            collection: "mycollection1",
            pk: {
                field: "gsipk1",
                composite: ["attr6", "attr9"]
            },
            sk: {
                field: "gsisk1",
                composite: []
            }
        },
        myIndex3: {
            collection: "mycollection",
            index: "gsi2",
            pk: {
                field: "gsipk2",
                composite: ["attr5"]
            },
            sk: {
                field: "gsisk2",
                composite: []
            }
        }
    }
});

const entityWithSKGo = entityWithSK.getGoQueryTerminal();
entityWithSKGo({attributes: ['attr2', 'attr3', 'attr4', 'attr6', 'attr8']}).then(results => {
    expectType<{
        attr2: string;
        attr3?: '123' | 'def' | 'ghi' | undefined;
        attr4: 'abc' | 'ghi';
        attr6?: number | undefined;
        attr8: boolean;
    }[]>(results.data);
});

// const entityWithSKPage = entityWithSK.getPageQueryTerminal();
// entityWithSKPage(null, {attributes: ['attr2', 'attr3', 'attr4', 'attr6', 'attr8']}).then(data => {
//     const [page, results] = data;
//     expectType<{
//         attr2: string;
//         attr3?: '123' | 'def' | 'ghi' | undefined;
//         attr4: 'abc' | 'ghi';
//         attr6?: number | undefined;
//         attr8: boolean;
//     }[]>(results);
//     expectType<{
//         __edb_e__?: string | undefined;
//         __edb_v__?: string | undefined;
//         abc: string;
//     } | null>(magnify(page));
// });

const entityWithoutSKGo = entityWithoutSK.getGoQueryTerminal();
entityWithoutSKGo({attributes: ['attr2', 'attr3', 'attr4', 'attr6', 'attr8']}).then(results => {
    expectType<{
        attr2?: string | undefined;
        attr3?: '123' | 'def' | 'ghi' | undefined;
        attr4: 'abc' | 'def';
        attr6?: number | undefined;
        attr8: boolean;
    }[]>(magnify(results.data));
});

// const entityWithoutSKPage = entityWithoutSK.getPageQueryTerminal();
// entityWithoutSKPage(null, {attributes: ['attr2', 'attr3', 'attr4', 'attr6', 'attr8']}).then(data => {
//     const [page, results] = data;
//     expectType<{
//         attr2?: string | undefined;
//         attr3?: '123' | 'def' | 'ghi' | undefined;
//         attr4: 'abc' | 'def';
//         attr6?: number | undefined;
//         attr8: boolean;
//     }[]>(magnify(results));
//     expectType<{
//         __edb_e__?: string | undefined;
//         __edb_v__?: string | undefined;
//         abc: string;
//     } | null>(magnify(page));
// });

expectType<'myIndex' | 'myIndex2' | 'myIndex3'>(entityWithSK.getKeyofQueries());
expectType<'myIndex' | 'myIndex2' | 'myIndex3'>(entityWithoutSK.getKeyofQueries());

const entityWithSKQueries = entityWithSK.getQueries();

const entityWithSKMyIndex = entityWithSKQueries.myIndex;
const entityWithSKMyIndexOptions = {} as Parameters<typeof entityWithSKMyIndex>[0];
expectType<{
    attr1: string;
    attr2?: string | undefined;
}>(magnify(entityWithSKMyIndexOptions));

const entityWithSKMyIndexSKOperations = entityWithSKQueries.myIndex2({attr6: 10, attr9: 5, attr4: 'abc'});

type EntityWithSKMyIndexOperationsTerminals = Pick<typeof entityWithSKMyIndexSKOperations, 'go' | 'params' | 'where'>;
const afterWhere = entityWithSKMyIndexSKOperations.where((attr, op) => op.eq(attr.attr4, 'zz'));
expectType<EntityWithSKMyIndexOperationsTerminals>(afterWhere);

const entityWithSKMyIndexSKOperationsKeys = {} as keyof typeof entityWithSKMyIndexSKOperations;
expectType<'go' | 'params' | 'where' | 'begins' | 'between' | 'gt' | 'gte' | 'lt' | 'lte'>(entityWithSKMyIndexSKOperationsKeys);

const entityWithSKMyIndexSKOperationsBegins = {} as Parameters<typeof entityWithSKMyIndexSKOperations.begins>[0];
expectType<{
    attr5?: string | undefined;
}>(magnify(entityWithSKMyIndexSKOperationsBegins));

const entityWithSKMyIndexSKOperationsBetween0 = {} as Parameters<typeof entityWithSKMyIndexSKOperations.between>[0];
const entityWithSKMyIndexSKOperationsBetween1 = {} as Parameters<typeof entityWithSKMyIndexSKOperations.between>[1];
expectType<{
    attr5?: string | undefined;
}>(magnify(entityWithSKMyIndexSKOperationsBetween0));
expectType<{
    attr5?: string | undefined;
}>(magnify(entityWithSKMyIndexSKOperationsBetween1));

const entityWithSKMyIndexSKOperationsGT = {} as Parameters<typeof entityWithSKMyIndexSKOperations.gt>[0];
expectType<{
    attr5?: string | undefined;
}>(magnify(entityWithSKMyIndexSKOperationsGT));

const entityWithSKMyIndexSKOperationsGTE = {} as Parameters<typeof entityWithSKMyIndexSKOperations.gte>[0];
expectType<{
    attr5?: string | undefined;
}>(magnify(entityWithSKMyIndexSKOperationsGTE));

const entityWithSKMyIndexSKOperationsLT = {} as Parameters<typeof entityWithSKMyIndexSKOperations.lt>[0];
expectType<{
    attr5?: string | undefined;
}>(magnify(entityWithSKMyIndexSKOperationsLT));

const entityWithSKMyIndexSKOperationsLTE = {} as Parameters<typeof entityWithSKMyIndexSKOperations.lte>[0];
expectType<{
    attr5?: string | undefined;
}>(magnify(entityWithSKMyIndexSKOperationsLTE));

const entityWithoutSKQueries = entityWithoutSK.getQueries();
const entityWithoutSKMyIndex = entityWithoutSKQueries.myIndex;
const entityWithoutSKMyIndexOptions = {} as Parameters<typeof entityWithoutSKMyIndex>[0];
expectType<{
    attr1: string;
}>(magnify(entityWithoutSKMyIndexOptions));

const entityWithoutSKMyIndex2SKOperations = entityWithoutSKQueries.myIndex2({attr6: 10, attr9: 5});
const entityWithoutSKMyIndex2SKOperationsKeys = {} as keyof typeof entityWithoutSKMyIndex2SKOperations;
expectType<'go' | 'params' | 'where'>(entityWithoutSKMyIndex2SKOperationsKeys);


const afterGetOperations = entityWithSKE.get({attr1: 'abc', attr2: 'def'})
const afterGetFilterOperations = entityWithSKE.get({attr1: 'abc', attr2: 'def'}).where((attr, op) => {
    return op.eq(attr.attr4, 'zzz');
});
expectType<typeof afterGetOperations>(afterGetFilterOperations);


