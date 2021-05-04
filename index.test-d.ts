import {Entity} from ".";
import {expectType, expectError, expectAssignable} from 'tsd';

let entityWithSK = new Entity({
    model: {
        entity: "abc",
        service: "myservice",
        version: "myversion"
    },
    attributes: {
        attr1: {
            type: "string",
            // static default
            default: "abc",
            get: (val) => val + 123,
            set: (val) => val + 456,
            validate: (val) => !!val,
        },
        attr2: {
            type: "string",
            default: () => "sfg",
            validate: (val) => val.length > 0
        },
        attr3: {
            type: ["123", "def", "ghi"],
            default: "abc"
        },
        attr4: {
            type: "string",
            required: true
        },
        attr5: {
            type: "string"
        },
        attr6: {
            type: "number",
            default: () => 100,
            get: (val) => val + 5,
            set: (val) => val + 5,
            validate: (val) => true,
        },
        attr7: {
            type: "any",
            default: () => false,
            get: (val) => ({key: "value"}),
            set: (val) => val + 5,
            validate: (val) => true,
        },
        attr8: {
            type: "boolean",
            required: true,
            default: false,
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
            collection: "mycollection2",
            pk: {
                field: "pk",
                facets: ["attr1"]
            },
            sk: {
                field: "sk",
                facets: ["attr2"]
            }
        },
        myIndex2: {
            index: "gsi1",
            pk: {
                field: "gsipk1",
                facets: ["attr6"]
            },
            sk: {
                field: "gsisk1",
                facets: ["attr4", "attr5"]
            }
        },
        myIndex3: {
            collection: "mycollection",
            index: "gsi1",
            pk: {
                field: "gsipk1",
                facets: ["attr5"]
            },
            sk: {
                field: "gsisk1",
                facets: ["attr4", "attr3", "attr9"]
            }
        }
    }
});


let entityWithoutSK = new Entity({
    model: {
        entity: "abc",
        service: "myservice",
        version: "myversion"
    },
    attributes: {
        attr1: {
            type: "string",
            // static default
            default: "abc",
            get: (val) => val + 123,
            set: (val) => val + 456,
            validate: (val) => !!val,
        },
        attr2: {
            type: "string",
            default: () => "sfg",
            validate: (val) => val.length > 0
        },
        attr3: {
            type: ["123", "def", "ghi"],
            default: "abc"
        },
        attr4: {
            type: "string",
            required: true
        },
        attr5: {
            type: "string"
        },
        attr6: {
            type: "number",
            default: () => 100,
            get: (val) => val + 5,
            set: (val) => val + 5,
            validate: (val) => true,
        },
        attr7: {
            type: "any",
            default: () => false,
            get: (val) => ({key: "value"}),
            set: (val) => val + 5,
            validate: (val) => true,
        },
        attr8: {
            type: "boolean",
            required: true,
            default: false,
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
                facets: ["attr1"]
            }
        },
        myIndex2: {
            index: "gsi1",
            pk: {
                field: "gsipk1",
                facets: ["attr6", "attr9"]
            }
        },
        myIndex3: {
            collection: "mycollection",
            index: "gsi1",
            pk: {
                field: "gsipk1",
                facets: ["attr5"]
            },
            sk: {
                field: "gsisk1",
                facets: []
            }
        }
    }
});

type Item = {
    attr1: string;
    attr2: string;
    attr3?: string,
    attr4: string;
    attr5?: string;
    attr6?: number;
    attr7?: any;
    attr8: boolean;
    attr9?: number;
}

type ItemWithoutSK = {
    attr1: string;
    attr2?: string;
    attr3?: string,
    attr4: string;
    attr5?: string;
    attr6?: number;
    attr7?: any;
    attr8: boolean;
    attr9?: number;
}

const item: Item = {
    attr1: "attr1",
    attr2: "attr2",
    attr3: "attr3",
    attr4: "attr4",
    attr5: "attr5",
    attr6: 123,
    attr7: "attr7",
    attr8: true,
    attr9: 456
} as const

type AttributeNames = "attr1" | "attr2" | "attr3" | "attr4" | "attr5" | "attr6" | "attr7" | "attr8" | "attr9";
const AttributeName = "" as AttributeNames;
type OperationNames = "eq" | "gt" | "lt" | "gte" | "lte" | "between" | "begins" | "exists" | "notExists" | "contains" | "notContains" | "value" | "name";


type WithSKMyIndexFacets = {
    attr1: string;
    attr2: string;
}

type WithSKMyIndex2Facets = {
    attr6: string;
    attr4?: string;
    attr5?: string;
}

type WithSKMyIndex3Facets = {
    attr5: string;
    attr3?: string;
    attr4?: string;
    attr9?: number;
}

type WithoutSKMyIndexFacets = {
    attr1: string;
}

type WithoutSKMyIndex2Facets = {
    attr6: number;
    attr9: number;
}

type WithoutSKMyIndex3Facets = {
    attr5: string;
}

type Parameter<T extends (arg: any) => any> = T extends (arg: infer P) => any ? P : never;

type GetKeys = <T extends {[key: string]: any}>(obj: T) => keyof T;
let getKeys = ((val) => {}) as GetKeys;

/** Schema With SK **/
// Get
    // Single
    entityWithSK.get({attr1: "adg", attr2: "ada"});
    entityWithoutSK.get({attr1: "abc"});

    // Batch
    type GetBatchParametersWithSK = Parameter<typeof entityWithSK.get>;
    type GetBatchParametersWithoutSK = Parameter<typeof entityWithoutSK.get>;
    expectAssignable<GetBatchParametersWithSK>([{attr1: "abc", attr2: "abd"}]);
    expectAssignable<GetBatchParametersWithoutSK>([{attr1: "abc"}]);

    // Invalid Get
    expectError<GetBatchParametersWithSK>([{}]);
    expectError<GetBatchParametersWithSK>([{attr1: "sdggd"}]);
    expectError<GetBatchParametersWithSK>([{attr2: "sdggd"}]);
    expectError<GetBatchParametersWithSK>({attr1: 1324, attr2: "adsga"});
    expectError<GetBatchParametersWithoutSK>([{}]);
    expectError<GetBatchParametersWithoutSK>([{attr2: "adsga"}]);
    expectError<GetBatchParametersWithoutSK>({attr2: "adsga"});
    expectError<GetBatchParametersWithoutSK>({attr1: 1324, attr2: "adsga"});

    // Finishers
    type GetParametersFinishers = "go" | "params" | "where";
    let getSingleFinishersWithSK = getKeys(entityWithSK.get({attr1:"abc", attr2: "24"}));
    let getBatchFinishersWithSK = getKeys(entityWithSK.get([{attr1:"abc", attr2: "24"}]));
    let getSingleFinishersWithoutSK = getKeys(entityWithoutSK.get({attr1:"abc"}));
    let getBatchFinishersWithoutSK = getKeys(entityWithoutSK.get([{attr1:"abc"}]));
    expectAssignable<GetParametersFinishers>(getSingleFinishersWithSK);
    expectAssignable<GetParametersFinishers>(getBatchFinishersWithSK);
    expectAssignable<GetParametersFinishers>(getSingleFinishersWithoutSK);
    expectAssignable<GetParametersFinishers>(getBatchFinishersWithoutSK);
    entityWithSK.get([{attr1: "adg", attr2: "ada"}]).go({concurrency: 24});
    entityWithSK.get([{attr1: "adg", attr2: "ada"}]).params({concurrency: 24});
    entityWithoutSK.get([{attr1: "adg"}]).go({concurrency: 24});
    entityWithoutSK.get([{attr1: "adg"}]).params({concurrency: 24});

    let getSingleGoWithSK = entityWithSK.get({attr1: "adg", attr2: "ada"}).go;
    let getSingleGoWithoutSK = entityWithoutSK.get({attr1: "adg"}).go;

    let getSingleParamsWithSK = entityWithSK.get({attr1: "adg", attr2: "ada"}).params;
    let getSingleParamsWithoutSK = entityWithoutSK.get({attr1: "adg"}).params;

    let getBatchGoWithSK = entityWithSK.get([{attr1: "adg", attr2: "ada"}]).go;
    let getBatchGoWithoutSK = entityWithoutSK.get([{attr1: "adg"}]).go;

    let getBatchParamsWithSK = entityWithSK.get([{attr1: "adg", attr2: "ada"}]).params;
    let getBatchParamsWithoutSK = entityWithoutSK.get([{attr1: "adg"}]).params;

    type GetSingleGoParamsWithSK = Parameter<typeof getSingleGoWithSK>;
    type GetSingleGoParamsWithoutSK = Parameter<typeof getSingleGoWithoutSK>;

    type GetSingleParamsParamsWithSK = Parameter<typeof getSingleParamsWithSK>;
    type GetSingleParamsParamsWithoutSK = Parameter<typeof getSingleParamsWithoutSK>;

    type GetBatchGoParamsWithSK = Parameter<typeof getBatchGoWithSK>;
    type GetBatchGoParamsWithoutSK = Parameter<typeof getBatchGoWithSK>;

    type GetBatchParamsParamsWithSK = Parameter<typeof getBatchParamsWithSK>;
    type GetBatchParamsParamsWithoutSK = Parameter<typeof getBatchParamsWithSK>;

    expectAssignable<GetSingleGoParamsWithSK>({includeKeys: true, originalErr: true, params: {}, raw: true, table: "abc"});
    expectAssignable<GetSingleGoParamsWithoutSK>({includeKeys: true, originalErr: true, params: {}, raw: true, table: "abc"});

    expectAssignable<GetSingleParamsParamsWithSK>({includeKeys: true, originalErr: true, params: {}, raw: true, table: "abc"});
    expectAssignable<GetSingleParamsParamsWithoutSK>({includeKeys: true, originalErr: true, params: {}, raw: true, table: "abc"});

    expectError<GetSingleGoParamsWithSK>({concurrency: 10, lastEvaluatedKeyRaw: true});
    expectError<GetSingleGoParamsWithoutSK>({concurrency: 10, lastEvaluatedKeyRaw: true});

    expectError<GetSingleParamsParamsWithSK>({concurrency: 10, lastEvaluatedKeyRaw: true});
    expectError<GetSingleParamsParamsWithoutSK>({concurrency: 10, lastEvaluatedKeyRaw: true});

    expectAssignable<GetBatchGoParamsWithSK>({includeKeys: true, originalErr: true, params: {}, raw: true, table: "abc", concurrency: 10, lastEvaluatedKeyRaw: true});
    expectAssignable<GetBatchGoParamsWithoutSK>({includeKeys: true, originalErr: true, params: {}, raw: true, table: "abc", concurrency: 10, lastEvaluatedKeyRaw: true});

    expectAssignable<GetBatchParamsParamsWithSK>({includeKeys: true, originalErr: true, params: {}, raw: true, table: "abc", concurrency: 10, lastEvaluatedKeyRaw: true});
    expectAssignable<GetBatchParamsParamsWithoutSK>({includeKeys: true, originalErr: true, params: {}, raw: true, table: "abc", concurrency: 10, lastEvaluatedKeyRaw: true});

    // Results
    expectAssignable<Promise<Item>>(entityWithSK.get({attr1: "abc", attr2: "def"}).go());
    expectAssignable<Promise<ItemWithoutSK>>(entityWithoutSK.get({attr1: "abc"}).go());
    expectAssignable<"paramtest">(entityWithSK.get({attr1: "abc", attr2: "def"}).params<"paramtest">());
    expectAssignable<"paramtest">(entityWithoutSK.get({attr1: "abc"}).params<"paramtest">());

    expectAssignable<Promise<[WithSKMyIndexFacets, Item[]]>>(entityWithSK.get([{attr1: "abc", attr2: "def"}]).go());
    expectAssignable<Promise<[WithoutSKMyIndexFacets, ItemWithoutSK[]]>>(entityWithoutSK.get([{attr1: "abc"}]).go());

// Delete
    // Single
    entityWithSK.delete({attr1: "adg", attr2: "ada"});
    entityWithoutSK.delete({attr1: "adg"});

    // Batch
    type DeleteBatchParametersWithSK = Parameter<typeof entityWithSK.delete>;
    type DeleteBatchParametersWithoutSK = Parameter<typeof entityWithoutSK.delete>;

    expectError(entityWithSK.delete({}));
    expectError(entityWithSK.delete({attr2: "abc"}));
    expectError(entityWithoutSK.delete({}));
    expectError(entityWithoutSK.delete({attr1: "13", attr2: "abc"}));

    expectAssignable<DeleteBatchParametersWithSK>([{attr1: "abc", attr2: "abd"}]);
    expectAssignable<DeleteBatchParametersWithoutSK>([{attr1: "abc"}]);

    // Invalid Query
    expectError<DeleteBatchParametersWithSK>({attr1: "sdggd"});
    expectError<DeleteBatchParametersWithoutSK>([{}]);

    expectError<DeleteBatchParametersWithSK>({attr1: 1324, attr2: "adsga"});
    expectError<DeleteBatchParametersWithoutSK>({attr1: 1324, attr2: "adsga"});

    // Finishers
    type DeleteParametersFinishers = "go" | "params" | "where";

    let deleteSingleFinishers = getKeys(entityWithSK.delete({attr1:"abc", attr2: "24"}));
    let deleteSingleFinishersWithoutSK = getKeys(entityWithoutSK.delete({attr1:"abc"}));

    let deleteBatchFinishers = getKeys(entityWithSK.delete([{attr1:"abc", attr2: "24"}]));
    let deleteBatchFinishersWithoutSK = getKeys(entityWithoutSK.delete([{attr1:"abc"}]));

    expectAssignable<DeleteParametersFinishers>(deleteSingleFinishers);
    expectAssignable<DeleteParametersFinishers>(deleteSingleFinishersWithoutSK);

    expectAssignable<DeleteParametersFinishers>(deleteBatchFinishers);
    expectAssignable<DeleteParametersFinishers>(deleteBatchFinishersWithoutSK);

    entityWithSK.delete([{attr1: "adg", attr2: "ada"}]).go({concurrency: 24});
    entityWithoutSK.delete([{attr1: "adg"}]).go({concurrency: 24});

    entityWithSK.delete([{attr1: "adg", attr2: "ada"}]).params({concurrency: 24});
    entityWithoutSK.delete([{attr1: "adg"}]).params({concurrency: 24});

    let deleteSingleGo = entityWithSK.delete({attr1: "adg", attr2: "ada"}).go;
    let deleteSingleGoWithoutSK = entityWithoutSK.delete({attr1: "adg"}).go;

    let deleteSingleParams = entityWithSK.delete({attr1: "adg", attr2: "ada"}).params;
    let deleteSingleParamsWithoutSK = entityWithoutSK.delete({attr1: "adg"}).params;

    let deleteBatchGo = entityWithSK.delete([{attr1: "adg", attr2: "ada"}]).go;
    let deleteBatchGoWithoutSK = entityWithoutSK.delete([{attr1: "adg"}]).go;

    let deleteBatchParams = entityWithSK.delete([{attr1: "adg", attr2: "ada"}]).params;
    let deleteBatchParamsWithoutSK = entityWithoutSK.delete([{attr1: "adg"}]).params;

    type DeleteSingleGoParams = Parameter<typeof deleteSingleGo>;
    type DeleteSingleGoParamsWithoutSK = Parameter<typeof deleteSingleGoWithoutSK>;

    type DeleteSingleParamsParams = Parameter<typeof deleteSingleParams>;
    type DeleteSingleParamsParamsWithoutSK = Parameter<typeof deleteSingleParamsWithoutSK>;

    type DeleteBatchGoParams = Parameter<typeof deleteBatchGo>;
    type DeleteBatchGoParamsWithoutSK = Parameter<typeof deleteBatchGoWithoutSK>;

    type DeleteBatchParamsParams = Parameter<typeof deleteBatchParams>;
    type DeleteBatchParamsParamsWithoutSK = Parameter<typeof deleteBatchParamsWithoutSK>;

    expectAssignable<DeleteSingleGoParams>({includeKeys: true, originalErr: true, params: {}, raw: true, table: "abc"});
    expectAssignable<DeleteSingleGoParamsWithoutSK>({includeKeys: true, originalErr: true, params: {}, raw: true, table: "abc"});

    expectAssignable<DeleteSingleGoParams>({includeKeys: true, originalErr: true, params: {}, raw: true, table: "abc"});
    expectAssignable<DeleteSingleGoParamsWithoutSK>({includeKeys: true, originalErr: true, params: {}, raw: true, table: "abc"});

    expectAssignable<DeleteSingleParamsParams>({includeKeys: true, originalErr: true, params: {}, raw: true, table: "abc"});
    expectAssignable<DeleteSingleParamsParamsWithoutSK>({includeKeys: true, originalErr: true, params: {}, raw: true, table: "abc"});

    expectError<DeleteSingleGoParams>({concurrency: 10, lastEvaluatedKeyRaw: true});
    expectError<DeleteSingleGoParamsWithoutSK>({concurrency: 10, lastEvaluatedKeyRaw: true});

    expectError<DeleteSingleParamsParams>({concurrency: 10, lastEvaluatedKeyRaw: true});
    expectError<DeleteSingleParamsParamsWithoutSK>({concurrency: 10, lastEvaluatedKeyRaw: true});

    expectAssignable<DeleteBatchGoParams>({includeKeys: true, originalErr: true, params: {}, raw: true, table: "abc", concurrency: 10, lastEvaluatedKeyRaw: true});
    expectAssignable<DeleteBatchGoParamsWithoutSK>({includeKeys: true, originalErr: true, params: {}, raw: true, table: "abc", concurrency: 10, lastEvaluatedKeyRaw: true});

    expectAssignable<DeleteBatchParamsParams>({includeKeys: true, originalErr: true, params: {}, raw: true, table: "abc", concurrency: 10, lastEvaluatedKeyRaw: true});
    expectAssignable<DeleteBatchParamsParamsWithoutSK>({includeKeys: true, originalErr: true, params: {}, raw: true, table: "abc", concurrency: 10, lastEvaluatedKeyRaw: true});

    // Where
    entityWithSK.delete({attr1: "asbc", attr2: "gdd"}).where((attr, op) => {
        let opKeys = getKeys(op);
        expectAssignable<keyof typeof attr>(AttributeName);
        expectAssignable<OperationNames>(opKeys);
        return "";
    });

    entityWithoutSK.delete({attr1: "asbc"}).where((attr, op) => {
        let opKeys = getKeys(op);
        expectAssignable<keyof typeof attr>(AttributeName);
        expectAssignable<OperationNames>(opKeys);
        return "";
    });

    // Results
    expectAssignable<Promise<Item>>(entityWithSK.delete({attr1: "abc", attr2: "def"}).go());
    expectAssignable<Promise<ItemWithoutSK>>(entityWithoutSK.delete({attr1: "abc"}).go());

    expectAssignable<"paramtest">(entityWithSK.delete({attr1: "abc", attr2: "def"}).params<"paramtest">());
    expectAssignable<"paramtest">(entityWithoutSK.delete({attr1: "abc"}).params<"paramtest">());

    expectAssignable<Promise<WithoutSKMyIndexFacets[]>>(entityWithoutSK.delete([{attr1: "abc"}]).go());

// Put
    let putItemFull: Item = {attr1: "abnc", attr2: "dsg", attr4: "24", attr8: true, attr3: "abc", attr5: "dbs", attr6: 13, attr9: 24, attr7: {abc: "2345"}};
    let putItemPartial: Item = {attr1: "abnc", attr2: "dsg", attr4: "24", attr8: true};
    let putItemWithoutSK = {attr1: "abnc", attr4: "24", attr8: true, attr3: "abc", attr5: "dbs", attr6: 13, attr9: 24, attr7: {abc: "2345"}};
    let putItemWithoutPK = {attr4: "24", attr2: "dsg", attr8: true, attr3: "abc", attr5: "dbs", attr6: 13, attr9: 24, attr7: {abc: "2345"}};

    // Single
    entityWithSK.put(putItemFull);
    entityWithoutSK.put(putItemFull);

    entityWithSK.put(putItemPartial);
    entityWithoutSK.put(putItemPartial);

    // Batch
    type PutParametersWithSK = Parameter<typeof entityWithSK.put>;
    type PutParametersWithoutSK = Parameter<typeof entityWithoutSK.put>;

    expectAssignable<PutParametersWithSK>([putItemFull]);
    expectAssignable<PutParametersWithoutSK>([putItemFull]);

    expectAssignable<PutParametersWithSK>([putItemPartial]);
    expectAssignable<PutParametersWithoutSK>([putItemPartial]);

    // Invalid Query
    expectError<PutParametersWithSK>([{}]);
    expectError<PutParametersWithoutSK>([{}]);

    expectError<PutParametersWithSK>([putItemWithoutSK]);

    expectError<PutParametersWithSK>(putItemWithoutSK);

    expectError<PutParametersWithSK>(putItemWithoutPK);
    expectError<PutParametersWithoutSK>(putItemWithoutPK);

    expectError<PutParametersWithSK>([putItemWithoutPK]);
    expectError<PutParametersWithoutSK>([putItemWithoutPK]);

    expectError<PutParametersWithSK>([{attr1: "abnc", attr2: "dsg", attr4: "24", attr8: "adef"}]);
    expectError<PutParametersWithoutSK>([{attr1: "abnc", attr2: "dsg", attr4: "24", attr8: "adef"}]);

    // Finishers
    type PutSingleFinishers = "go" | "params" | "where";
    type PutBatchFinishers = "go" | "params" | "where" | "page";

    let putSingleFinishers = getKeys(entityWithSK.put(putItemFull));
    let putSingleFinishersWithoutSK = getKeys(entityWithoutSK.put(putItemFull));

    let putBatchFinishers = getKeys(entityWithSK.put(putItemFull));
    let putBatchFinishersWithoutSK = getKeys(entityWithoutSK.put(putItemFull));

    let putSingleItem = entityWithSK.put(putItemFull);
    let putSingleItemWithoutSK = entityWithoutSK.put(putItemFull);

    let putBulkItem = entityWithSK.put([putItemFull]);
    let putBulkItemWithoutSK = entityWithoutSK.put([putItemFull]);

    expectAssignable<PutSingleFinishers>(putSingleFinishers);
    expectAssignable<PutSingleFinishers>(putSingleFinishersWithoutSK);

    expectAssignable<PutBatchFinishers>(putBatchFinishers);
    expectAssignable<PutBatchFinishers>(putBatchFinishersWithoutSK);

    type PutSingleGoParams = Parameter<typeof putSingleItem.go>;
    type PutSingleGoParamsWithoutSK = Parameter<typeof putSingleItemWithoutSK.go>;

    type PutSingleParamsParams = Parameter<typeof putSingleItem.params>;
    type PutSingleParamsParamsWithoutSK = Parameter<typeof putSingleItemWithoutSK.params>;

    type PutBatchGoParams = Parameter<typeof putBulkItem.go>;
    type PutBatchGoParamsWithoutSK = Parameter<typeof putBulkItemWithoutSK.go>;

    type PutBatchParamsParams = Parameter<typeof putBulkItem.params>;
    type PutBatchParamsParamsWithoutSK = Parameter<typeof putBulkItemWithoutSK.params>;

    expectAssignable<PutSingleGoParams>({includeKeys: true, originalErr: true, params: {}, raw: true, table: "abc"});
    expectAssignable<PutSingleGoParamsWithoutSK>({includeKeys: true, originalErr: true, params: {}, raw: true, table: "abc"});

    expectAssignable<PutSingleParamsParams>({includeKeys: true, originalErr: true, params: {}, raw: true, table: "abc"});
    expectAssignable<PutSingleParamsParamsWithoutSK>({includeKeys: true, originalErr: true, params: {}, raw: true, table: "abc"});

    expectError<PutSingleGoParams>({concurrency: 10, lastEvaluatedKeyRaw: true});
    expectError<PutSingleGoParamsWithoutSK>({concurrency: 10, lastEvaluatedKeyRaw: true});

    expectError<PutSingleParamsParams>({concurrency: 10, lastEvaluatedKeyRaw: true});
    expectError<PutSingleParamsParamsWithoutSK>({concurrency: 10, lastEvaluatedKeyRaw: true});

    expectAssignable<PutBatchGoParams>({includeKeys: true, originalErr: true, params: {}, raw: true, table: "abc", concurrency: 10, lastEvaluatedKeyRaw: true});
    expectAssignable<PutBatchGoParamsWithoutSK>({includeKeys: true, originalErr: true, params: {}, raw: true, table: "abc", concurrency: 10, lastEvaluatedKeyRaw: true});

    expectAssignable<PutBatchParamsParams>({includeKeys: true, originalErr: true, params: {}, raw: true, table: "abc", concurrency: 10, lastEvaluatedKeyRaw: true});
    expectAssignable<PutBatchParamsParamsWithoutSK>({includeKeys: true, originalErr: true, params: {}, raw: true, table: "abc", concurrency: 10, lastEvaluatedKeyRaw: true});

    // Where
    entityWithSK.put(putItemFull).where((attr, op) => {
        let opKeys = getKeys(op);
        expectAssignable<keyof typeof attr>(AttributeName);
        expectAssignable<OperationNames>(opKeys);
        return "";
    });

    entityWithoutSK.put(putItemFull).where((attr, op) => {
        let opKeys = getKeys(op);
        expectAssignable<keyof typeof attr>(AttributeName);
        expectAssignable<OperationNames>(opKeys);
        return "";
    });

    // Results
    expectAssignable<Promise<Item>>(entityWithSK.put(putItemFull).go());
    expectAssignable<Promise<ItemWithoutSK>>(entityWithoutSK.put(putItemFull).go());

    expectAssignable<"paramtest">(entityWithSK.put(putItemFull).params<"paramtest">());
    expectAssignable<"paramtest">(entityWithoutSK.put(putItemFull).params<"paramtest">());

    expectAssignable<Promise<WithSKMyIndexFacets[]>>(entityWithSK.put([putItemFull]).go());
    expectAssignable<Promise<WithoutSKMyIndexFacets[]>>(entityWithoutSK.put([putItemFull]).go());

// Create
    let createItemFull: Item = {attr1: "abnc", attr2: "dsg", attr4: "24", attr8: true, attr3: "abc", attr5: "dbs", attr6: 13, attr9: 24, attr7: {abc: "2345"}};
    let createItemPartial: Item = {attr1: "abnc", attr2: "dsg", attr4: "24", attr8: true};
    let createItemFullWithoutSK = {attr2: "dsg", attr4: "24", attr8: true, attr3: "abc", attr5: "dbs", attr6: 13, attr9: 24, attr7: {abc: "2345"}};
    let createItemFullWithoutPK = {attr2: "dsg", attr4: "24", attr8: true, attr3: "abc", attr5: "dbs", attr6: 13, attr9: 24, attr7: {abc: "2345"}};

    // Single
    entityWithSK.create(createItemFull);
    entityWithoutSK.create(createItemFull);

    entityWithSK.create(createItemPartial);
    entityWithoutSK.create(createItemPartial);

    // Batch
    type CreateParametersWithSK = Parameter<typeof entityWithSK.create>;
    type CreateParametersWithoutSK = Parameter<typeof entityWithoutSK.create>;

    // batch not supported with create
    expectError<CreateParametersWithSK>([createItemFull]);
    expectError<CreateParametersWithoutSK>([createItemFull]);

    // batch not supported with create
    expectError<CreateParametersWithSK>([createItemPartial]);
    expectError<CreateParametersWithoutSK>([createItemPartial]);

    // Invalid Query
    expectError<CreateParametersWithSK>({});
    expectError<CreateParametersWithoutSK>({});

    expectError<CreateParametersWithSK>(createItemFullWithoutSK);

    expectError<CreateParametersWithSK>(createItemFullWithoutPK);
    expectError<CreateParametersWithoutSK>(createItemFullWithoutPK);

    // Missing required properties
    expectError<CreateParametersWithSK>([{attr1: "abnc", attr2: "dsg", attr4: "24", attr8: "adef"}]);
    expectError<CreateParametersWithoutSK>([{attr1: "abnc", attr2: "dsg", attr4: "24", attr8: "adef"}]);

    // Finishers
    type CreateSingleFinishers = "go" | "params" | "where";

    let createSingleFinishers = getKeys(entityWithSK.create(putItemFull));
    let createSingleFinishersWithoutSK = getKeys(entityWithoutSK.create(putItemFull));

    let createItem = entityWithSK.put(createItemFull);
    let createItemWithoutSK = entityWithoutSK.put(createItemFull);

    expectAssignable<CreateSingleFinishers>(createSingleFinishers);
    expectAssignable<CreateSingleFinishers>(createSingleFinishersWithoutSK);

    type CreateGoParams = Parameter<typeof createItem.go>;
    type CreateGoParamsWithoutSK = Parameter<typeof createItemWithoutSK.go>;

    type CreateParamsParams = Parameter<typeof createItem.params>;
    type CreateParamsParamsWithoutSK = Parameter<typeof createItemWithoutSK.params>;

    expectAssignable<CreateGoParams>({includeKeys: true, originalErr: true, params: {}, raw: true, table: "abc"});
    expectAssignable<CreateGoParamsWithoutSK>({includeKeys: true, originalErr: true, params: {}, raw: true, table: "abc"});

    expectAssignable<CreateParamsParams>({includeKeys: true, originalErr: true, params: {}, raw: true, table: "abc"});
    expectAssignable<CreateParamsParamsWithoutSK>({includeKeys: true, originalErr: true, params: {}, raw: true, table: "abc"});

    expectError<CreateGoParams>({concurrency: 10, lastEvaluatedKeyRaw: true});
    expectError<CreateGoParamsWithoutSK>({concurrency: 10, lastEvaluatedKeyRaw: true});

    expectError<CreateParamsParams>({concurrency: 10, lastEvaluatedKeyRaw: true});
    expectError<CreateParamsParamsWithoutSK>({concurrency: 10, lastEvaluatedKeyRaw: true});

    // Where
    entityWithSK.create(putItemFull).where((attr, op) => {
        let opKeys = getKeys(op);
        expectAssignable<keyof typeof attr>(AttributeName);
        expectAssignable<OperationNames>(opKeys);
        return "";
    });
    entityWithoutSK.create(putItemFull).where((attr, op) => {
        let opKeys = getKeys(op);
        expectAssignable<keyof typeof attr>(AttributeName);
        expectAssignable<OperationNames>(opKeys);
        return "";
    });

    // Results
    expectAssignable<Promise<Item>>(entityWithSK.create(putItemFull).go());
    expectAssignable<Promise<ItemWithoutSK>>(entityWithoutSK.create(putItemFull).go());

    expectAssignable<"paramtest">(entityWithSK.create(putItemFull).params<"paramtest">());
    expectAssignable<"paramtest">(entityWithoutSK.create(putItemFull).params<"paramtest">());

// Update
    let setItemFull = {attr4: "24", attr8: true, attr3: "abc", attr5: "dbs", attr6: 13, attr9: 24, attr7: {abc: "2345"}};

    let setFn = entityWithSK.update({attr1: "abc", attr2: "def"}).set;
    let setFnWithoutSK = entityWithoutSK.update({attr1: "abc"}).set;

    type SetParameters = Parameter<typeof setFn>;
    type SetParametersWithoutSK = Parameter<typeof setFnWithoutSK>;

    expectAssignable<SetParameters>(setItemFull);
    expectAssignable<SetParametersWithoutSK>(setItemFull);

    expectAssignable<SetParameters>({});
    expectAssignable<SetParametersWithoutSK>({});

    // Invalid Set
    expectError<SetParameters>({attr1: "ff"});
    expectError<SetParametersWithoutSK>({attr1: "ff"});

    expectError<SetParameters>({attr6: "1234"});
    expectError<SetParametersWithoutSK>({attr6: "1234"});

    // Finishers
    type UpdateParametersFinishers = "go" | "set" | "params" | "where";

    let updateItem = entityWithSK.update({attr1: "abc", attr2: "def"}).set({});
    let updateItemWithoutSK = entityWithoutSK.update({attr1: "abc"}).set({});

    let updateFinishers = getKeys(updateItem);
    let updateFinishersWithoutSK = getKeys(updateItemWithoutSK);

    expectAssignable<UpdateParametersFinishers>(updateFinishers);
    expectAssignable<UpdateParametersFinishers>(updateFinishersWithoutSK);

    let updateGo = updateItem.go;
    let updateGoWithoutSK = updateItemWithoutSK.go;

    let updateParams = updateItem.params;
    let updateParamsWithoutSK = updateItemWithoutSK.params;

    type UpdateGoParams = Parameter<typeof updateGo>;
    type UpdateGoParamsWithoutSK = Parameter<typeof updateGoWithoutSK>;

    type UpdateParamsParams = Parameter<typeof updateParams>;
    type UpdateParamsParamsWithoutSK = Parameter<typeof updateParamsWithoutSK>;


    expectAssignable<UpdateGoParams>({includeKeys: true, originalErr: true, params: {}, raw: true, table: "abc"});
    expectAssignable<UpdateGoParamsWithoutSK>({includeKeys: true, originalErr: true, params: {}, raw: true, table: "abc"});

    expectAssignable<UpdateParamsParams>({includeKeys: true, originalErr: true, params: {}, raw: true, table: "abc"});
    expectAssignable<UpdateParamsParamsWithoutSK>({includeKeys: true, originalErr: true, params: {}, raw: true, table: "abc"});

    // Where
    updateItem.where((attr, op) => {
        let opKeys = getKeys(op);
        expectAssignable<keyof typeof attr>(AttributeName);
        expectAssignable<OperationNames>(opKeys);
        return "";
    });
    updateItemWithoutSK.where((attr, op) => {
        let opKeys = getKeys(op);
        expectAssignable<keyof typeof attr>(AttributeName);
        expectAssignable<OperationNames>(opKeys);
        return "";
    });

// Patch
    let patchItemFull = {attr4: "24", attr8: true, attr3: "abc", attr5: "dbs", attr6: 13, attr9: 24, attr7: {abc: "2345"}};

    let patchFn = entityWithSK.patch({attr1: "abc", attr2: "def"}).set;
    let patchFnWithoutSK = entityWithoutSK.patch({attr1: "abc"}).set;

    type PatchParameters = Parameter<typeof patchFn>;
    type PatchParametersWithoutSK = Parameter<typeof patchFnWithoutSK>;

    expectAssignable<PatchParameters>(patchItemFull);
    expectAssignable<PatchParametersWithoutSK>(patchItemFull);

    expectAssignable<PatchParameters>({});
    expectAssignable<PatchParametersWithoutSK>({});

    // Invalid Set
    expectError<PatchParameters>({attr1: "ff"});
    expectError<PatchParametersWithoutSK>({attr1: "ff"});

    expectError<PatchParameters>({attr6: "1234"});
    expectError<PatchParametersWithoutSK>({attr6: "1234"});

    // Finishers
    type PatchParametersFinishers = "go" | "set" | "params" | "where";

    let patchItem = entityWithSK.patch({attr1: "abc", attr2: "def"}).set({});
    let patchItemWithoutSK = entityWithoutSK.patch({attr1: "abc"}).set({});

    let patchFinishers = getKeys(patchItem);
    let patchFinishersWithoutSK = getKeys(patchItemWithoutSK);

    expectAssignable<PatchParametersFinishers>(patchFinishers);
    expectAssignable<PatchParametersFinishers>(patchFinishersWithoutSK);

    let patchGo = patchItem.go;
    let patchGoWithoutSK = patchItemWithoutSK.go;

    let patchParams = patchItem.params;
    let patchParamsWithoutSK = patchItemWithoutSK.params;

    type PatchGoParams = Parameter<typeof patchGo>;
    type PatchGoParamsWithoutSK = Parameter<typeof patchGoWithoutSK>;

    type PatchParamsParams = Parameter<typeof patchParams>;
    type PatchParamsParamsWithoutSK = Parameter<typeof patchParamsWithoutSK>;

    expectAssignable<PatchGoParams>({includeKeys: true, originalErr: true, params: {}, raw: true, table: "abc"});
    expectAssignable<PatchGoParamsWithoutSK>({includeKeys: true, originalErr: true, params: {}, raw: true, table: "abc"});

    expectAssignable<PatchParamsParams>({includeKeys: true, originalErr: true, params: {}, raw: true, table: "abc"});
    expectAssignable<PatchParamsParamsWithoutSK>({includeKeys: true, originalErr: true, params: {}, raw: true, table: "abc"});

    // Where
    patchItem.where((attr, op) => {
        let opKeys = getKeys(op);
        expectAssignable<keyof typeof attr>(AttributeName);
        expectAssignable<OperationNames>(opKeys);
        return "";
    });
    patchItemWithoutSK.where((attr, op) => {
        let opKeys = getKeys(op);
        expectAssignable<keyof typeof attr>(AttributeName);
        expectAssignable<OperationNames>(opKeys);
        return "";
    });

// Find
    // Query
    let findFn = entityWithSK.find;
    let findFnWithoutSK = entityWithoutSK.find;

    type FindParameters = Parameter<typeof findFn>;
    type FindParametersWithoutSK = Parameter<typeof findFnWithoutSK>;

    expectAssignable<keyof FindParameters>(AttributeName);
    expectAssignable<keyof FindParametersWithoutSK>(AttributeName);

    expectAssignable<FindParameters>({attr6: 13});
    expectAssignable<FindParametersWithoutSK>({attr6: 13});


    //  Invalid query
    expectError<FindParameters>({attr6: "ff"});
    expectError<FindParametersWithoutSK>({attr6: "ff"});

    expectError<FindParameters>({noexist: "ff"});
    expectError<FindParametersWithoutSK>({noexist: "ff"});


    // Where
    findFn({}).where((attr, op) => {
        let opKeys = getKeys(op);
        expectAssignable<keyof typeof attr>(AttributeName);
        expectAssignable<OperationNames>(opKeys);
        return "";
    });
    findFnWithoutSK({}).where((attr, op) => {
        let opKeys = getKeys(op);
        expectAssignable<keyof typeof attr>(AttributeName);
        expectAssignable<OperationNames>(opKeys);
        return "";
    });

    // Finishers
    type FindParametersFinishers = "go" | "params" | "where" | "page";

    let findFinishers = entityWithSK.find({});
    let findFinishersWithoutSK = entityWithoutSK.find({});

    let findFinisherKeys = getKeys(findFinishers);
    let findFinisherKeysWithoutSK = getKeys(findFinishersWithoutSK);

    expectAssignable<FindParametersFinishers>(findFinisherKeys);
    expectAssignable<FindParametersFinishers>(findFinisherKeysWithoutSK);

    let findGo = findFinishers.go;
    let findGoWithoutSK = findFinishersWithoutSK.go;

    let findParams = findFinishers.params;
    let findParamsWithoutSK = findFinishersWithoutSK.params;

    type FindGoParams = Parameter<typeof findGo>;
    type FindGoParamsWithoutSK = Parameter<typeof findGoWithoutSK>;

    type FindParamsParams = Parameter<typeof findParams>;
    type FindParamsParamsWithoutSK = Parameter<typeof findParamsWithoutSK>;

    expectAssignable<FindGoParams>({includeKeys: true, originalErr: true, params: {}, raw: true, table: "abc"});
    expectAssignable<FindGoParamsWithoutSK>({includeKeys: true, originalErr: true, params: {}, raw: true, table: "abc"});

    expectAssignable<FindParamsParams>({includeKeys: true, originalErr: true, params: {}, raw: true, table: "abc"});
    expectAssignable<FindParamsParamsWithoutSK>({includeKeys: true, originalErr: true, params: {}, raw: true, table: "abc"});


    // Page
    let findPageFn = findFinishers.page;
    let findPageFnWithoutSK = findFinishersWithoutSK.page;

    type FindPageParams = Parameters<typeof findPageFn>;
    type FindPageParamsWithoutSK = Parameters<typeof findPageFnWithoutSK>;

    type FindPageReturn = Promise<[WithSKMyIndexFacets | null, Item[]]>;
    type FindPageReturnWithoutSK = Promise<[WithoutSKMyIndexFacets | null, ItemWithoutSK[]]>;

    expectAssignable<FindPageParams>([{attr1: "abc", attr2: "def"}, {includeKeys: true, lastEvaluatedKeyRaw: true, originalErr: true, params: {}, raw: true, table: "abc"}]);
    expectAssignable<FindPageParamsWithoutSK>([{attr1: "abc"}, {includeKeys: true, lastEvaluatedKeyRaw: true, originalErr: true, params: {}, raw: true, table: "abc"}]);

    expectAssignable<FindPageParams>([null]);
    expectAssignable<FindPageParamsWithoutSK>([null]);

    expectAssignable<FindPageParams>([]);
    expectAssignable<FindPageParamsWithoutSK>([]);

    expectAssignable<FindPageReturn>(findPageFn());
    expectAssignable<FindPageReturnWithoutSK>(findPageFnWithoutSK());


// Queries
    type AccessPatternNames = "myIndex" | "myIndex2" | "myIndex3";

    let accessPatternNames = getKeys(entityWithSK.query);
    let accessPatternNamesWithoutSK = getKeys(entityWithoutSK.query);

    expectType<AccessPatternNames>(accessPatternNames);
    expectType<AccessPatternNames>(accessPatternNamesWithoutSK);

    type MyIndexFacets = Parameter<typeof entityWithSK.query.myIndex>;
    type MyIndexFacetsWithoutSK = Parameter<typeof entityWithoutSK.query.myIndex>;

    let myIndexBegins = entityWithSK.query.myIndex({attr1: "abc"}).begins;
    // Begins does not exist on Find because the user has tossed out knowledge of order/indexes
    expectError(entityWithoutSK.query.myIndex({attr1: "abc"}).begins);

    type MyIndexRemaining = Parameter<typeof myIndexBegins>;

    expectAssignable<MyIndexFacets>({attr1: "abd"});
    expectAssignable<MyIndexFacetsWithoutSK>({attr1: "abd"});

    expectAssignable<MyIndexFacets>({attr1: "abd", attr2: "def"});
    expectAssignable<MyIndexFacetsWithoutSK>({attr1: "abd"});

    expectAssignable<MyIndexRemaining>({});
    expectAssignable<MyIndexRemaining>({attr2: "abc"});

    // attr1 not supplied
    expectError<MyIndexFacets>({attr2: "abc"});
    expectError<MyIndexFacetsWithoutSK>({attr2: "abc"});

    // attr2 is a strin, not number
    expectError<MyIndexFacets>({attr1: "abd", attr2: 133});
    expectError<MyIndexFacetsWithoutSK>({attr1: 243});

    // attr3 is not a pk or sk
    expectError<MyIndexFacets>({attr1: "abd", attr2: "def", attr3: "should_not_work"});
    expectError<MyIndexFacetsWithoutSK>({attr1: "abd", attr2: "def", attr3: "should_not_work"});

    // attr1 was already used in the query method
    expectError<MyIndexRemaining>({attr1: "abd"});

    // attr2 is a string not number (this tests the 'remaining' facets which should also enforce type)
    expectError<MyIndexRemaining>({attr2: 1243});

    // require at least PK
    expectError(entityWithSK.query.myIndex({}));
    expectError(entityWithoutSK.query.myIndex({}));

    // attr6 should be number
    expectError(entityWithSK.query.myIndex2({attr6: "45"}));
    expectError(entityWithoutSK.query.myIndex2({attr6: "45"}));

    entityWithSK.query
        .myIndex({attr1: "abc", attr2: "def"})
        .go({params: {}})
        .then(a => a.map(val => val.attr4))

    entityWithSK.query
        .myIndex({attr1: "abc"})
        .go({params: {}})
        .then(a => a.map(val => val.attr4))

    entityWithSK.query
        .myIndex2({attr6: 45, attr4: "abc", attr5: "def"})
        .go({params: {}})
        .then(a => a.map(val => val.attr4))

    entityWithSK.query
        .myIndex2({attr6: 45})
        .go({params: {}})
        .then(a => a.map(val => val.attr4))

    entityWithSK.query
        .myIndex3({attr5: "dgdagad"})
        .go({params: {}})
        .then(a => a.map(val => val.attr4))

    entityWithoutSK.query
        .myIndex({attr1: "abc"})
        .go({params: {}})
        .then(a => a.map(val => val.attr4))

    entityWithoutSK.query
        .myIndex2({attr6: 53, attr9: 35})
        .go({params: {}})
        .then(a => a.map(val => val.attr4))

    entityWithoutSK.query
        .myIndex3({attr5: "dgdagad"})
        .go({params: {}})
        .then(a => a.map(val => val.attr4))



    // Query Operations
    entityWithSK.query
        .myIndex({attr1: "abc"})
        .begins({attr2: "asf"})
        .go({params: {}})
        .then(a => a.map(val => val.attr4))

    entityWithSK.query
        .myIndex2({attr6: 45, attr4: "abc"})
        .begins({attr5: "db"})
        .go({params: {}})
        .then(a => a.map(val => val.attr4))

    entityWithSK.query
        .myIndex3({attr5: "dgdagad"})
        .between({attr4: "a", attr9: 3, attr3: "d"}, {attr4: "d", attr9: 4, attr3: "a"})
        .go({params: {}})
        .then(a => a.map(val => val.attr4))

    entityWithSK.query
        .myIndex({attr1: "abc"})
        .gte({attr2: "asf"})
        .go({params: {}})
        .then(a => a.map(val => val.attr4))

    entityWithSK.query
        .myIndex2({attr6: 45, attr4: "abc"})
        .gt({attr5: "abd"})
        .go({params: {}})
        .then(a => a.map(val => val.attr4))

    entityWithSK.query
        .myIndex3({attr5: "dgdagad"})
        .lte({attr4: "a", attr9: 3})
        .go({params: {}})
        .then(a => a.map(val => val.attr4))

    entityWithSK.query
        .myIndex3({attr5: "dgdagad"})
        .lt({attr4: "a", attr9: 3})
        .go({params: {}})
        .then(a => a.map(val => val.attr4))

    entityWithSK.query
        .myIndex({attr1: "abc", attr2: "db"})
        .where(({attr6}, {value, name, exists, begins, between, contains, eq, gt, gte, lt, lte, notContains, notExists}) => `
        ${name(attr6)} = ${value(attr6)}
        AND ${exists(attr6)}
        AND ${notExists(attr6)}
        AND ${begins(attr6, 35)}
        AND ${between(attr6, 1, 10)}
        AND ${contains(attr6, 14)}
        AND ${eq(attr6, 14)}
        AND ${gt(attr6, 14)}
        AND ${gte(attr6, 14)}
        AND ${lt(attr6, 14)}
        AND ${lte(attr6, 14)}
        AND ${notContains(attr6, 14)}
      `)

    // Query Operations (Except with Type Errors)

    // This one ensures that an SK value in the index method still is type checked
    expectError(entityWithSK.query
        .myIndex({attr1: "452", attr2: 245})
        .go({params: {}})
        .then(a => a.map(val => val.attr4)))

    expectError(entityWithSK.query
        .myIndex2({attr6: "45"})
        .go({params: {}})
        .then(a => a.map(val => val.attr4)))

    expectError(entityWithSK.query
        .myIndex3({attr5: 426})
        .go({params: {}})
        .then(a => a.map(val => val.attr4)))

    expectError(entityWithoutSK.query
        .myIndex({attr1: 246})
        .go({params: {}})
        .then(a => a.map(val => val.attr4)))

    expectError(entityWithoutSK.query
        .myIndex2({attr6: 24, attr9: "1"})
        .go({params: {}})
        .then(a => a.map(val => val.attr4)))

    expectError(entityWithoutSK.query
        .myIndex3({attr5: 346})
        .go({params: {}})
        .then(a => a.map(val => val.attr4)))

    // Query Operations
    expectError(entityWithSK.query
        .myIndex({attr1: "abc"})
        .begins({attr2: 42})
        .go({params: {}})
        .then(a => a.map(val => val.attr4)))

    expectError(entityWithSK.query
        .myIndex2({attr6: 45, attr4: "abc"})
        .begins({attr5: 462})
        .go({params: {}})
        .then(a => a.map(val => val.attr4)))

    expectError(entityWithSK.query
        .myIndex3({attr5: "dgdagad"})
        .between({attr4: "a", attr9: "3", attr3: "d"}, {attr4: "d", attr9: "4", attr3: "a"})
        .go({params: {}})
        .then(a => a.map(val => val.attr4)))

    expectError(entityWithSK.query
        .myIndex({attr1: "abc"})
        .gte({attr2: 462})
        .go({params: {}})
        .then(a => a.map(val => val.attr4)))

    expectError(entityWithSK.query
        .myIndex2({attr6: 45, attr4: "abc"})
        .gt({attr5: 246})
        .go({params: {}})
        .then(a => a.map(val => val.attr4)))

    expectError(entityWithSK.query
        .myIndex3({attr5: "dgdagad"})
        .lte({attr4: "a", attr9: "3"})
        .go({params: {}})
        .then(a => a.map(val => val.attr4)))

    expectError(entityWithSK.query
        .myIndex3({attr5: "dgdagad"})
        .lt({attr4: "a", attr9: "3"})
        .go({params: {}})
        .then(a => a.map(val => val.attr4)))

    expectError(entityWithSK.query
        .myIndex({attr1: "abc", attr2: "db"})
        .where(({attr6}, {value, name, exists, begins, between, contains, eq, gt, gte, lt, lte, notContains, notExists}) => `
            ${name(attr6)} = ${value()}
          `));

    expectError(entityWithSK.query
        .myIndex({attr1: "abc", attr2: "db"})
        .where(({attr6}, {value, name, exists, begins, between, contains, eq, gt, gte, lt, lte, notContains, notExists}) => `
            ${exists()}
        `));

    expectError(entityWithSK.query
        .myIndex({attr1: "abc", attr2: "db"})
        .where(({attr6}, {value, name, exists, begins, between, contains, eq, gt, gte, lt, lte, notContains, notExists}) => `
            ${notExists()}
        `));

    expectError(entityWithSK.query
        .myIndex({attr1: "abc", attr2: "db"})
        .where(({attr6}, {value, name, exists, begins, between, contains, eq, gt, gte, lt, lte, notContains, notExists}) => `
            ${begins(attr6, "35")}
        `));

    expectError(entityWithSK.query
        .myIndex({attr1: "abc", attr2: "db"})
        .where(({attr6}, {value, name, exists, begins, between, contains, eq, gt, gte, lt, lte, notContains, notExists}) => `
            ${between(attr6, "1", 10)}
        `));

    expectError(entityWithSK.query
        .myIndex({attr1: "abc", attr2: "db"})
        .where(({attr6}, {value, name, exists, begins, between, contains, eq, gt, gte, lt, lte, notContains, notExists}) => `
            ${between(attr6, 1, "10")}
        `));

    expectError(entityWithSK.query
        .myIndex({attr1: "abc", attr2: "db"})
        .where(({attr6}, {value, name, exists, begins, between, contains, eq, gt, gte, lt, lte, notContains, notExists}) => `
            ${contains(attr6, "14")}
        `));

    expectError(entityWithSK.query
        .myIndex({attr1: "abc", attr2: "db"})
        .where(({attr6}, {value, name, exists, begins, between, contains, eq, gt, gte, lt, lte, notContains, notExists}) => `
            ${eq(attr6, "14")}
        `));

    expectError(entityWithSK.query
        .myIndex({attr1: "abc", attr2: "db"})
        .where(({attr6}, {value, name, exists, begins, between, contains, eq, gt, gte, lt, lte, notContains, notExists}) => `
            ${gt(attr6, "14")}
        `));

    expectError(entityWithSK.query
        .myIndex({attr1: "abc", attr2: "db"})
        .where(({attr6}, {value, name, exists, begins, between, contains, eq, gt, gte, lt, lte, notContains, notExists}) => `
            ${gte(attr6, "14")}
        `));

    expectError(entityWithSK.query
        .myIndex({attr1: "abc", attr2: "db"})
        .where(({attr6}, {value, name, exists, begins, between, contains, eq, gt, gte, lt, lte, notContains, notExists}) => `
            ${lt(attr6, "14")}
        `));

    expectError(entityWithSK.query
        .myIndex({attr1: "abc", attr2: "db"})
        .where(({attr6}, {value, name, exists, begins, between, contains, eq, gt, gte, lt, lte, notContains, notExists}) => `
            ${lte(attr6, "14")}
        `));

    expectError(entityWithSK.query
        .myIndex({attr1: "abc", attr2: "db"})
        .where(({attr6}, {value, name, exists, begins, between, contains, eq, gt, gte, lt, lte, notContains, notExists}) => `
            ${notContains(attr6, "14")}
        `));

    entityWithSK._collections.mycollection;