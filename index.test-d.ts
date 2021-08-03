import {Entity, Service, WhereAttributeSymbol, UpdateEntityItem, UpdateDataSymbol} from ".";
import {expectType, expectError, expectAssignable, expectNotAssignable, expectNotType} from 'tsd';
import {complex} from "./test/complex.test-d";
let entityWithSK = new Entity({
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

let entityWithoutSK = new Entity({
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

let standAloneEntity = new Entity({
    model: {
        entity: "standalone",
        service: "myservice",
        version: "1"
    },
    attributes: {
        prop1: {
            type: "string",
            default: "abc"
        },
        prop2: {
            type: "string"
        },
        prop3: {
            type: "string"
        }
    },
    indexes: {
        index1: {
            pk: {
                field: "pk",
                composite: ["prop1", "prop2"]
            },
            sk: {
                field: "sk",
                composite: ["prop3"]
            }
        }
    }
});

let normalEntity1 = new Entity({
    model: {
        entity: "normalEntity1",
        service: "myservice",
        version: "1"
    },
    attributes: {
        prop1: {
            type: "string",
            default: "abc"
        },
        prop2: {
            type: "string"
        },
        prop3: {
            type: "string",
            required: true
        },
        prop4: {
            type: "number"
        },
        prop10: {
            type: "boolean"
        }
    },
    indexes: {
        tableIndex: {
            collection: "normalcollection",
            pk: {
                field: "pk",
                composite: ["prop1", "prop2"]
            },
            sk: {
                field: "sk",
                composite: ["prop4"]
            }
        }
    }
});

let normalEntity2 = new Entity({
    model: {
        entity: "normalEntity2",
        service: "myservice",
        version: "1"
    },
    attributes: {
        prop1: {
            type: "string"
        },
        prop2: {
            type: "string"
        },
        prop3: {
            type: "string",
            required: true
        },
        prop5: {
            type: "number"
        },
        attr6: {
            type: "number",
            default: () => 100,
            get: (val) => val + 5,
            set: (val) => (val ?? 0) + 5,
            validate: (val) => true,
        },
        attr9: {
            type: "number"
        },
    },
    indexes: {
        indexTable: {
            collection: "normalcollection",
            pk: {
                field: "pk",
                composite: ["prop1", "prop2"]
            },
            sk: {
                field: "sk",
                composite: ["prop5"]
            }
        },
        anotherIndex: {
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
        }
    }
});

type Item = {
    attr1?: string;
    attr2: string;
    attr3?: "123" | "def" | "ghi" | undefined;
    attr4: string;
    attr5?: string;
    attr6?: number;
    attr7?: any;
    attr8: boolean;
    attr9?: number;
    attr10?: boolean;
}

type ItemWithoutSK = {
    attr1?: string;
    attr2?: string;
    attr3?: "123" | "def" | "ghi" | undefined;
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
    attr3: "def",
    attr4: "attr4",
    attr5: "attr5",
    attr6: 123,
    attr7: "attr7",
    attr8: true,
    attr9: 456
} as const

type AttributeNames = "attr1" | "attr2" | "attr3" | "attr4" | "attr5" | "attr6" | "attr7" | "attr8" | "attr9";
const AttributeName = "" as AttributeNames;
type OperationNames = "eq" | "ne" | "gt" | "lt" | "gte" | "lte" | "between" | "begins" | "exists" | "notExists" | "contains" | "notContains" | "value" | "name";


type WithSKMyIndexCompositeAttributes = {
    attr1: string;
    attr2: string;
}

type WithSKMyIndex2CompositeAttributes = {
    attr6: string;
    attr4?: string;
    attr5?: string;
}

type WithSKMyIndex3CompositeAttributes = {
    attr5: string;
    attr3?: "123" | "def" | "ghi";
    attr4?: string;
    attr9?: number;
}

type WithoutSKMyIndexCompositeAttributes = {
    attr1: string;
}

type WithoutSKMyIndex2CompositeAttributes = {
    attr6: number;
    attr9: number;
}

type WithoutSKMyIndex3CompositeAttributes = {
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
    type GetBatchGoParamsWithoutSK = Parameter<typeof getBatchGoWithoutSK>;

    type GetBatchParamsParamsWithSK = Parameter<typeof getBatchParamsWithSK>;
    type GetBatchParamsParamsWithoutSK = Parameter<typeof getBatchParamsWithoutSK>;

    expectAssignable<GetSingleGoParamsWithSK>({includeKeys: true, originalErr: true, params: {}, raw: true, table: "abc"});
    expectAssignable<GetSingleGoParamsWithoutSK>({includeKeys: true, originalErr: true, params: {}, raw: true, table: "abc"});

    expectAssignable<GetSingleParamsParamsWithSK>({includeKeys: true, originalErr: true, params: {}, raw: true, table: "abc"});
    expectAssignable<GetSingleParamsParamsWithoutSK>({includeKeys: true, originalErr: true, params: {}, raw: true, table: "abc"});

    expectError<GetSingleGoParamsWithSK>({concurrency: 10, unprocessed: "raw"});
    expectError<GetSingleGoParamsWithoutSK>({concurrency: 10, unprocessed: "raw"});

    expectError<GetSingleParamsParamsWithSK>({concurrency: 10, unprocessed: "raw"});
    expectError<GetSingleParamsParamsWithoutSK>({concurrency: 10, unprocessed: "raw"});

    expectAssignable<GetBatchGoParamsWithSK>({includeKeys: true, originalErr: true, params: {}, raw: true, table: "abc", concurrency: 10, unprocessed: "raw"});
    expectAssignable<GetBatchGoParamsWithoutSK>({includeKeys: true, originalErr: true, params: {}, raw: true, table: "abc", concurrency: 10, unprocessed: "raw"});

    expectAssignable<GetBatchParamsParamsWithSK>({includeKeys: true, originalErr: true, params: {}, raw: true, table: "abc", concurrency: 10, unprocessed: "raw"});
    expectAssignable<GetBatchParamsParamsWithoutSK>({includeKeys: true, originalErr: true, params: {}, raw: true, table: "abc", concurrency: 10, unprocessed: "raw"});

    // Results
    expectAssignable<Promise<Item>>(entityWithSK.get({attr1: "abc", attr2: "def"}).go());
    expectAssignable<Promise<ItemWithoutSK>>(entityWithoutSK.get({attr1: "abc"}).go());
    expectAssignable<"paramtest">(entityWithSK.get({attr1: "abc", attr2: "def"}).params<"paramtest">());
    expectAssignable<"paramtest">(entityWithoutSK.get({attr1: "abc"}).params<"paramtest">());

    expectAssignable<Promise<[WithSKMyIndexCompositeAttributes[], Item[]]>>(entityWithSK.get([{attr1: "abc", attr2: "def"}]).go());
    expectAssignable<Promise<[WithoutSKMyIndexCompositeAttributes[], ItemWithoutSK[]]>>(entityWithoutSK.get([{attr1: "abc"}]).go());

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

    expectError<DeleteSingleGoParams>({concurrency: 10, unprocessed: "raw"});
    expectError<DeleteSingleGoParamsWithoutSK>({concurrency: 10, unprocessed: "raw"});

    expectError<DeleteSingleParamsParams>({concurrency: 10, unprocessed: "raw"});
    expectError<DeleteSingleParamsParamsWithoutSK>({concurrency: 10, unprocessed: "raw"});

    expectAssignable<DeleteBatchGoParams>({includeKeys: true, originalErr: true, params: {}, raw: true, table: "abc", concurrency: 10, unprocessed: "raw"});
    expectAssignable<DeleteBatchGoParamsWithoutSK>({includeKeys: true, originalErr: true, params: {}, raw: true, table: "abc", concurrency: 10, unprocessed: "raw"});

    expectAssignable<DeleteBatchParamsParams>({includeKeys: true, originalErr: true, params: {}, raw: true, table: "abc", concurrency: 10, unprocessed: "raw"});
    expectAssignable<DeleteBatchParamsParamsWithoutSK>({includeKeys: true, originalErr: true, params: {}, raw: true, table: "abc", concurrency: 10, unprocessed: "raw"});

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

    expectAssignable<Promise<WithoutSKMyIndexCompositeAttributes[]>>(entityWithoutSK.delete([{attr1: "abc"}]).go());

// Put
    let putItemFull = {attr1: "abnc", attr2: "dsg", attr3: "def", attr4: "abc", attr5: "dbs", attr6: 13, attr7: {abc: "2345"}, attr8: true, attr9: 24, attr10: true} as const;
    let putItemPartial = {attr1: "abnc", attr2: "dsg", attr4: "abc", attr8: true} as const;
    let putItemWithoutSK = {attr1: "abnc", attr4: "abc", attr8: true, attr3: "def", attr5: "dbs", attr6: 13, attr9: 24, attr7: {abc: "2345"}} as const;
    let putItemWithoutPK = {attr4: "abc", attr2: "def", attr8: true, attr3: "def", attr5: "dbs", attr6: 13, attr9: 24, attr7: {abc: "2345"}} as const;
    // Single
    entityWithSK.put(putItemFull);
    entityWithoutSK.put({attr1: "abnc", attr2: "dsg", attr3: "def", attr4: "def", attr5: "dbs", attr6: 13, attr7: {abc: "2345"}, attr8: true, attr9: 24});

    entityWithSK.put({attr1: "abnc", attr2: "dsg", attr3: "def", attr4: "abc", attr5: "dbs", attr6: 13, attr7: {abc: "2345"}, attr8: true, attr9: undefined, attr10: undefined});
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

    // Assignable because attr1 has a default
    expectAssignable<PutParametersWithSK>([putItemWithoutPK]);

    expectError<PutParametersWithoutSK>([putItemWithoutPK]);

    expectError<PutParametersWithSK>([{attr1: "abnc", attr2: "dsg", attr4: "abc", attr8: "adef"}]);
    expectError<PutParametersWithoutSK>([{attr1: "abnc", attr2: "dsg", attr4: "abc", attr8: "adef"}]);

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

    expectError<PutSingleGoParams>({concurrency: 10, unprocessed: "raw"});
    expectError<PutSingleGoParamsWithoutSK>({concurrency: 10, unprocessed: "raw"});

    expectError<PutSingleParamsParams>({concurrency: 10, unprocessed: "raw"});
    expectError<PutSingleParamsParamsWithoutSK>({concurrency: 10, unprocessed: "raw"});

    expectAssignable<PutBatchGoParams>({includeKeys: true, originalErr: true, params: {}, raw: true, table: "abc", concurrency: 10, unprocessed: "raw"});
    expectAssignable<PutBatchGoParamsWithoutSK>({includeKeys: true, originalErr: true, params: {}, raw: true, table: "abc", concurrency: 10, unprocessed: "raw"});

    expectAssignable<PutBatchParamsParams>({includeKeys: true, originalErr: true, params: {}, raw: true, table: "abc", concurrency: 10, unprocessed: "raw"});
    expectAssignable<PutBatchParamsParamsWithoutSK>({includeKeys: true, originalErr: true, params: {}, raw: true, table: "abc", concurrency: 10, unprocessed: "raw"});

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

    expectAssignable<Promise<WithSKMyIndexCompositeAttributes[]>>(entityWithSK.put([putItemFull]).go());
    expectAssignable<Promise<WithoutSKMyIndexCompositeAttributes[]>>(entityWithoutSK.put([putItemFull]).go());

// Create
    let createItemFull = {attr1: "abnc", attr2: "dsg", attr4: "abc", attr8: true, attr3: "def", attr5: "dbs", attr6: 13, attr9: 24, attr7: {abc: "2345"}} as const;
    let createItemPartial = {attr1: "abnc", attr2: "dsg", attr4: "abc", attr8: true} as const;
    let createItemFullWithoutSK = {attr4: "abc", attr8: true, attr3: "def", attr5: "dbs", attr6: 13, attr9: 24, attr7: {abc: "2345"}} as const;
    let createItemFullWithoutPK = {attr2: "dsg", attr4: "abc", attr8: true, attr3: "def", attr5: "dbs", attr6: 13, attr9: 24, attr7: {abc: "2345"}} as const;

    // Single
    entityWithSK.create(createItemFull);
    entityWithSK.create(createItemFullWithoutPK);
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

    // Assignable because attr1 has a default value
    expectAssignable<CreateParametersWithSK>(createItemFullWithoutPK);

    expectError<CreateParametersWithoutSK>(createItemFullWithoutPK);

    // Missing required properties
    expectError<CreateParametersWithSK>([{attr1: "abnc", attr2: "dsg", attr4: "abc", attr8: "adef"}]);
    expectError<CreateParametersWithoutSK>([{attr1: "abnc", attr2: "dsg", attr4: "abc", attr8: "adef"}]);

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

    expectError<CreateGoParams>({concurrency: 10, unprocessed: "raw"});
    expectError<CreateGoParamsWithoutSK>({concurrency: 10, unprocessed: "raw"});

    expectError<CreateParamsParams>({concurrency: 10, unprocessed: "raw"});
    expectError<CreateParamsParamsWithoutSK>({concurrency: 10, unprocessed: "raw"});

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
    let setItemFull = {attr4: "abc", attr8: true, attr3: "def", attr5: "dbs", attr6: 13, attr9: 24, attr7: {abc: "2345"}} as const;

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
    type UpdateParametersFinishers = "set" | "delete" | "remove" | "go" | "params" | "where" | "add" | "subtract" | "append" | "data";

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

    expectAssignable<UpdateParamsParams>({params: {}, table: "abc"});
    expectAssignable<UpdateParamsParamsWithoutSK>({params: {}, table: "abc"});

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
    let patchItemFull = {attr4: "abc", attr8: true, attr3: "def", attr5: "dbs", attr6: 13, attr9: 24, attr7: {abc: "2345"}} as const;

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
    type PatchParametersFinishers = "set" | "delete" | "remove" | "go" | "params" | "where" | "add" | "subtract" | "append" | "data";

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

    expectAssignable<PatchParamsParams>({params: {}, table: "abc"});
    expectAssignable<PatchParamsParamsWithoutSK>({params: {}, table: "abc"});

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
    let matchFinishers = entityWithSK.find({});
    let matchFinishersWithoutSK = entityWithoutSK.find({});

    let findFinisherKeys = getKeys(findFinishers);
    let findFinisherKeysWithoutSK = getKeys(findFinishersWithoutSK);
    let matchFinisherKeys = getKeys(matchFinishers);
    let matchFinisherKeysWithoutSK = getKeys(matchFinishersWithoutSK);

    expectAssignable<FindParametersFinishers>(findFinisherKeys);
    expectAssignable<FindParametersFinishers>(findFinisherKeysWithoutSK);
    expectAssignable<FindParametersFinishers>(matchFinisherKeys);
    expectAssignable<FindParametersFinishers>(matchFinisherKeysWithoutSK);

    let findGo = findFinishers.go;
    let findGoWithoutSK = findFinishersWithoutSK.go;
    let matchGo = matchFinishers.go;
    let matchGoWithoutSK = matchFinishersWithoutSK.go;

    let findParams = findFinishers.params;
    let findParamsWithoutSK = findFinishersWithoutSK.params;
    let matchParams = matchFinishers.params;
    let matchParamsWithoutSK = matchFinishersWithoutSK.params;

    type FindGoParams = Parameter<typeof findGo>;
    type FindGoParamsWithoutSK = Parameter<typeof findGoWithoutSK>;
    type MatchGoParams = Parameter<typeof matchGo>;
    type MatchGoParamsWithoutSK = Parameter<typeof matchGoWithoutSK>;

    type FindParamsParams = Parameter<typeof findParams>;
    type FindParamsParamsWithoutSK = Parameter<typeof findParamsWithoutSK>;
    type MatchParamsParams = Parameter<typeof findParams>;
    type MatchParamsParamsWithoutSK = Parameter<typeof findParamsWithoutSK>;

    expectAssignable<FindGoParams>({includeKeys: true, originalErr: true, params: {}, raw: true, table: "abc"});
    expectAssignable<FindGoParamsWithoutSK>({includeKeys: true, originalErr: true, params: {}, raw: true, table: "abc"});
    expectAssignable<MatchGoParams>({includeKeys: true, originalErr: true, params: {}, raw: true, table: "abc"});
    expectAssignable<MatchGoParamsWithoutSK>({includeKeys: true, originalErr: true, params: {}, raw: true, table: "abc"});

    expectAssignable<FindParamsParams>({params: {}, table: "abc"});
    expectAssignable<FindParamsParamsWithoutSK>({params: {}, table: "abc"});
    expectAssignable<MatchParamsParams>({params: {}, table: "abc"});
    expectAssignable<MatchParamsParamsWithoutSK>({params: {}, table: "abc"});


    // Page
    let findPageFn = findFinishers.page;
    let findPageFnWithoutSK = findFinishersWithoutSK.page;
    let matchPageFn = matchFinishers.page;
    let matchPageFnWithoutSK = matchFinishersWithoutSK.page;

    type FindPageParams = Parameters<typeof findPageFn>;
    type FindPageParamsWithoutSK = Parameters<typeof findPageFnWithoutSK>;
    type MatchPageParams = Parameters<typeof matchPageFn>;
    type MatchPageParamsWithoutSK = Parameters<typeof matchPageFnWithoutSK>;

    type FindPageReturn = Promise<[WithSKMyIndexCompositeAttributes | null, Item[]]>;
    type FindPageReturnWithoutSK = Promise<[WithoutSKMyIndexCompositeAttributes | null, ItemWithoutSK[]]>;
    type MatchPageReturn = Promise<[WithSKMyIndexCompositeAttributes | null, Item[]]>;
    type MatchPageReturnWithoutSK = Promise<[WithoutSKMyIndexCompositeAttributes | null, ItemWithoutSK[]]>;

    expectAssignable<FindPageParams>([{attr1: "abc", attr2: "def"}, {includeKeys: true, pager: "item", originalErr: true, params: {}, raw: true, table: "abc"}]);
    expectAssignable<FindPageParamsWithoutSK>([{attr1: "abc"}, {includeKeys: true, pager: "raw", originalErr: true, params: {}, raw: true, table: "abc"}]);
    expectAssignable<MatchPageParams>([{attr1: "abc", attr2: "def"}, {includeKeys: true, pager: "item", originalErr: true, params: {}, raw: true, table: "abc"}]);
    expectAssignable<MatchPageParamsWithoutSK>([{attr1: "abc"}, {includeKeys: true, pager: "raw", originalErr: true, params: {}, raw: true, table: "abc"}]);

    expectAssignable<FindPageParams>([null]);
    expectAssignable<FindPageParamsWithoutSK>([null]);
    expectAssignable<MatchPageParams>([null]);
    expectAssignable<MatchPageParamsWithoutSK>([null]);

    expectAssignable<FindPageParams>([]);
    expectAssignable<FindPageParamsWithoutSK>([]);
    expectAssignable<MatchPageParams>([]);
    expectAssignable<MatchPageParamsWithoutSK>([]);

    expectAssignable<FindPageReturn>(findPageFn());
    expectAssignable<FindPageReturnWithoutSK>(findPageFnWithoutSK());
    expectAssignable<MatchPageReturn>(findPageFn());
    expectAssignable<MatchPageReturnWithoutSK>(findPageFnWithoutSK());

// Queries
    type AccessPatternNames = "myIndex" | "myIndex2" | "myIndex3";

    let accessPatternNames = getKeys(entityWithSK.query);
    let accessPatternNamesWithoutSK = getKeys(entityWithoutSK.query);

    expectType<AccessPatternNames>(accessPatternNames);
    expectType<AccessPatternNames>(accessPatternNamesWithoutSK);

    type MyIndexCompositeAttributes = Parameter<typeof entityWithSK.query.myIndex>;
    type MyIndexCompositeAttributesWithoutSK = Parameter<typeof entityWithoutSK.query.myIndex>;

    let myIndexBegins = entityWithSK.query.myIndex({attr1: "abc"}).begins;
    // Begins does not exist on Find because the user has tossed out knowledge of order/indexes
    expectError(entityWithoutSK.query.myIndex({attr1: "abc"}).begins);

    type MyIndexRemaining = Parameter<typeof myIndexBegins>;

    expectAssignable<MyIndexCompositeAttributes>({attr1: "abd"});
    expectAssignable<MyIndexCompositeAttributesWithoutSK>({attr1: "abd"});

    expectAssignable<MyIndexCompositeAttributes>({attr1: "abd", attr2: "def"});
    expectAssignable<MyIndexCompositeAttributesWithoutSK>({attr1: "abd"});

    expectAssignable<MyIndexRemaining>({});
    expectAssignable<MyIndexRemaining>({attr2: "abc"});

    // attr1 not supplied
    expectError<MyIndexCompositeAttributes>({attr2: "abc"});
    expectError<MyIndexCompositeAttributesWithoutSK>({attr2: "abc"});

    // attr2 is a strin, not number
    expectError<MyIndexCompositeAttributes>({attr1: "abd", attr2: 133});
    expectError<MyIndexCompositeAttributesWithoutSK>({attr1: 243});

    // attr3 is not a pk or sk
    expectError<MyIndexCompositeAttributes>({attr1: "abd", attr2: "def", attr3: "should_not_work"});
    expectError<MyIndexCompositeAttributesWithoutSK>({attr1: "abd", attr2: "def", attr3: "should_not_work"});

    // attr1 was already used in the query method
    expectError<MyIndexRemaining>({attr1: "abd"});

    // attr2 is a string not number (this tests the 'remaining' composite attributes which should also enforce type)
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
        .myIndex2({attr6: 45, attr9: 454, attr4: "abc", attr5: "def"})
        .go({params: {}})
        .then(a => a.map(val => val.attr4))

    entityWithSK.query
        .myIndex2({attr6: 45, attr9: 24})
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
        .myIndex2({attr6: 45, attr9: 34, attr4: "abc"})
        .begins({attr5: "db"})
        .go({params: {}})
        .then(a => a.map(val => val.attr4))

    entityWithSK.query
        .myIndex3({attr5: "dgdagad"})
        .between({attr4: "abc", attr9: 3, attr3: "def"}, {attr4: "abc", attr9: 4, attr3: "def"})
        .go({params: {}})
        .then(a => a.map(val => val.attr4))

    entityWithSK.query
        .myIndex({attr1: "abc"})
        .gte({attr2: "asf"})
        .go({params: {}})
        .then(a => a.map(val => val.attr4))

    entityWithSK.query
        .myIndex2({attr6: 45, attr9: 33, attr4: "abc"})
        .gt({attr5: "abd"})
        .go({params: {}})
        .then(a => a.map(val => val.attr4))

    entityWithSK.query
        .myIndex3({attr5: "dgdagad"})
        .lte({attr4: "abc", attr9: 3})
        .go({params: {}})
        .then(a => a.map(val => val.attr4))

    entityWithSK.query
        .myIndex3({attr5: "dgdagad"})
        .lt({attr4: "abc", attr9: 3})
        .go({params: {}})
        .then(a => a.map(val => val.attr4))

    entityWithSK.query
        .myIndex({attr1: "abc", attr2: "db"})
        .where(({attr6}, {value, name, exists, begins, between, contains, eq, gt, gte, lt, lte, notContains, notExists}) => `
        ${name(attr6)} = ${value(attr6, 12)}
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
        .between({attr4: "abc", attr9: "3", attr3: "def"}, {attr4: "abc", attr9: "4", attr3: "def"})
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
        .lte({attr4: "abc", attr9: "3"})
        .go({params: {}})
        .then(a => a.map(val => val.attr4)))

    expectError(entityWithSK.query
        .myIndex3({attr5: "dgdagad"})
        .lt({attr4: "abc", attr9: "3"})
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



    // Invalid cases
    expectError(() => new Service({abc: "123"}));


    // Service with no Entities
    let nullCaseService = new Service({});
    type nullCollections = typeof nullCaseService.collections;
    type nullEntities = typeof nullCaseService.collections;
    expectType<nullCollections>({});
    expectType<nullEntities>({});

    // Service with no Collections
    let serviceNoCollections = new Service({standAloneEntity});
    type noEntityCollections = typeof serviceNoCollections.collections;
    expectType<noEntityCollections>({});

    // Service no shared entity collections
    let serviceNoShared = new Service({
        entityWithoutSK,
        standAloneEntity,
        normalEntity1,
    });

    let expectNoSharedCollections = "" as "normalcollection" | "mycollection" | "mycollection1"
    type NoSharedCollectionsList = keyof typeof serviceNoShared.collections;
    expectType<NoSharedCollectionsList>(expectNoSharedCollections);
    type NoSharedCollectionParameter1 = Parameter<typeof serviceNoShared.collections.mycollection>;
    expectType<NoSharedCollectionParameter1>({attr5: "string"});
    expectError<NoSharedCollectionParameter1>({});
    expectError<NoSharedCollectionParameter1>({attr5: 123});
    expectError<NoSharedCollectionParameter1>({attr1: "123"});

    type NoSharedCollectionParameter2 = Parameter<typeof serviceNoShared.collections.normalcollection>;
    expectType<NoSharedCollectionParameter2>({prop2: "abc", prop1: "def"});
    expectError<NoSharedCollectionParameter2>({});
    expectError<NoSharedCollectionParameter2>({prop2: "abc"});
    expectError<NoSharedCollectionParameter2>({prop1: "abc"});
    expectError<NoSharedCollectionParameter2>({prop1: 35});
    expectError<NoSharedCollectionParameter2>({prop2: 35});
    expectError<NoSharedCollectionParameter2>({prop3: "35"});

    // Service with complex collections
    let complexService = new Service({
        entityWithoutSK,
        entityWithSK,
        standAloneEntity,
        normalEntity1,
        normalEntity2
    });

    let expectSharedCollections = "" as "normalcollection" | "mycollection" | "mycollection1" | "mycollection2"
    type SharedCollectionsList = keyof typeof complexService.collections;
    expectType<SharedCollectionsList>(expectSharedCollections);
    type SharedCollectionParameter1 = Parameter<typeof complexService.collections.mycollection>;
    // success
    complexService.collections.mycollection({attr5: "abc"});
    // failure - no collection composite attributes
    expectError<SharedCollectionParameter1>({});
    // failure - incorrect entity composite attribute types
    expectError<SharedCollectionParameter1>({attr5: 123});
    // failure - incorrect entity composite attribute properties
    expectError<SharedCollectionParameter1>({attr1: "123"});

    type SharedCollectionParameter2 = Parameter<typeof complexService.collections.normalcollection>;
    // success
    complexService.collections.normalcollection({prop2: "abc", prop1: "def"});
    // failure - no collection composite attributes
    expectError<SharedCollectionParameter2>({});
    // failure - incomplete composite attributes
    expectError<SharedCollectionParameter2>({prop2: "abc"});
    // failure - incomplete composite attributes
    expectError<SharedCollectionParameter2>({prop1: "abc"});
    // failure - incorrect entity composite attribute types
    expectError<SharedCollectionParameter2>({prop1: 35});
    // failure - incorrect entity composite attribute types
    expectError<SharedCollectionParameter2>({prop2: 35});
    // failure - incorrect entity composite attribute properties
    expectError<SharedCollectionParameter2>({prop3: "35"});

    let chainMethods = complexService.collections.normalcollection({prop2: "abc", prop1: "def"});
    type AfterQueryChainMethods = keyof typeof chainMethods;
    let expectedAfterQueryChainMethods = "" as "where" | "go" | "params" | "page"
    expectType<AfterQueryChainMethods>(expectedAfterQueryChainMethods);

    // .go params
    type GoParams = Parameter<typeof chainMethods.go>;
    expectAssignable<GoParams>({table: "df", raw: true, params: {}, originalErr: true, includeKeys: true});
    complexService.collections
        .normalcollection({prop2: "abc", prop1: "def"})
        .go()
        .then(values => {
            // .go response includes only related entities
            type NormalCollectionRelatedEntities = keyof typeof values;
            let expectedEntities = "" as "normalEntity1" | "normalEntity2";
            expectType<NormalCollectionRelatedEntities>(expectedEntities);
            values.normalEntity1.map(item => {
                expectError(item.attr1);
                expectError(item.attr2);
                expectError(item.attr3);
                expectError(item.attr4);
                expectError(item.attr5);
                expectError(item.attr6);
                expectError(item.attr7);
                expectError(item.attr8);
                expectError(item.attr9);
                expectError(item.attr10);
                expectType<string>(item.prop1);
                expectType<string>(item.prop2);
                expectType<string>(item.prop3);
                expectType<number>(item.prop4);
                expectType<boolean|undefined>(item.prop10);
                let itemKeys = "" as "prop1" | "prop2" | "prop3" | "prop4" | "prop10";
                expectType<keyof typeof item>(itemKeys);
            });
            values.normalEntity2.map(item => {
                expectType<string>(item.prop1);
                expectType<string>(item.prop2);
                expectType<string>(item.prop3);
                expectType<number>(item.prop5);
                expectType<number|undefined>(item.attr9);
                expectType<number|undefined>(item.attr6);
                expectNotAssignable<{attr1: any}>(item);
                expectNotAssignable<{attr2: any}>(item);
                expectNotAssignable<{attr3: any}>(item);
                expectNotAssignable<{attr4: any}>(item);
                expectNotAssignable<{attr5: any}>(item);
                expectNotAssignable<{attr6: any}>(item);
                expectNotAssignable<{attr7: any}>(item);
                expectNotAssignable<{attr8: any}>(item);
                expectNotAssignable<{attr9: any}>(item);
                expectNotAssignable<{attr10: any}>(item);
                expectNotAssignable<{prop10: any}>(item);
                let itemKeys = "" as "prop1" | "prop2" | "prop3" | "prop5" | "attr9" | "attr6";
                expectType<keyof typeof item>(itemKeys);
            });
        });
    complexService.collections
        .mycollection({attr5: "sgad"})
        .go()
        .then(values => {
            // .go response includes only related entities
            type NormalCollectionRelatedEntities = keyof typeof values;
            let expectedEntities = "" as "entityWithSK" | "entityWithoutSK";
            expectType<NormalCollectionRelatedEntities>(expectedEntities);
            values.entityWithSK.map(item => {
                expectType<string>(item.attr1);
                expectType<string>(item.attr2);
                expectType<"123" | "def" | "ghi"|undefined>(item.attr3);
                expectType<"abc" | "ghi">(item.attr4);
                expectType<string|undefined>(item.attr5);
                expectType<number|undefined>(item.attr6);
                expectType<any>(item.attr7);
                expectType<boolean>(item.attr8);
                expectType<number|undefined>(item.attr9);
                expectType<boolean|undefined>(item.attr10);
                // .go response related entities correct items
                let itemKeys = "" as  "attr1" |"attr2" |"attr3" |"attr4" |"attr5" |"attr6" |"attr7" |"attr8" |"attr9" | "attr10";
                expectType<keyof typeof item>(itemKeys);
            });
            values.entityWithoutSK.map(item => {
                item.attr2
                expectType<string>(item.attr1);
                expectType<string | undefined>(item.attr2);
                expectType<"123" | "def" | "ghi" | undefined>(item.attr3);
                expectType<"abc" | "def">(item.attr4);
                expectType<string|undefined>(item.attr5);
                expectType<number|undefined>(item.attr6);
                expectType<any>(item.attr7);
                expectType<boolean>(item.attr8);
                expectType<number|undefined>(item.attr9);
                // .go response related entities correct items
                let itemKeys = "" as "attr1" |"attr2" |"attr3" |"attr4" |"attr5" |"attr6" |"attr7" |"attr8" |"attr9";
                expectType<keyof typeof item>(itemKeys);
            });
        });

    let serviceWhere = complexService.collections
        .mycollection1({attr6: 13, attr9: 54})
        .where((attr, op) => {
            let opKeys = getKeys(op);
            expectType<OperationNames>(opKeys);
            op.eq(attr.attr9, 455);
            op.eq(attr.prop5, 455);
            expectAssignable<{attr1: WhereAttributeSymbol<string>}>(attr);
            expectAssignable<{attr2: WhereAttributeSymbol<string>}>(attr);
            expectAssignable<{attr3: WhereAttributeSymbol<"123" | "def" | "ghi">}>(attr);
            expectAssignable<{attr4: WhereAttributeSymbol<"abc" | "def" | "ghi">}>(attr);
            expectAssignable<{attr5: WhereAttributeSymbol<string>}>(attr);
            expectAssignable<{attr6: WhereAttributeSymbol<number>}>(attr);
            expectAssignable<{attr7: WhereAttributeSymbol<any>}>(attr);
            expectAssignable<{attr8: WhereAttributeSymbol<boolean>}>(attr);
            expectAssignable<{attr9: WhereAttributeSymbol<number>}>(attr);
            expectAssignable<{attr10: WhereAttributeSymbol<boolean>}>(attr);
            expectAssignable<{prop1: WhereAttributeSymbol<string>}>(attr);
            expectAssignable<{prop2: WhereAttributeSymbol<string>}>(attr);
            expectAssignable<{prop3: WhereAttributeSymbol<string>}>(attr);
            expectNotAssignable<{prop4: WhereAttributeSymbol<number>}>(attr);
            expectAssignable<{prop5: WhereAttributeSymbol<number>}>(attr);
            expectNotAssignable<{prop10: WhereAttributeSymbol<boolean>}>(attr);
            return "";
        })
        .go()
        .then((items) => {
            items.normalEntity2.map(item => {
                let keys = "" as keyof typeof item;
                expectType<"prop1" | "prop2" | "prop3" | "prop5" | "attr6" | "attr9">(keys);
                expectType<string>(item.prop1);
                expectType<string>(item.prop2);
                expectType<string>(item.prop3);
                expectType<number>(item.prop5);
                expectType<number|undefined>(item.attr6);
                expectType<number|undefined>(item.attr9);
            });
            items.entityWithSK.map((item) => {
                let keys = "" as keyof typeof item;
                expectType<"attr1" | "attr2" | "attr3" | "attr4" | "attr5" | "attr6" | "attr7" | "attr8" | "attr9" | "attr10">(keys);
                expectType<string>(item.attr1);
                expectType<string>(item.attr2);
                expectType<"123" | "def" | "ghi" | undefined>(item.attr3);
                expectType<"abc" | "ghi">(item.attr4);
                expectType<string | undefined>(item.attr5);
                expectType<number | undefined>(item.attr6);
                expectType<any>(item.attr7);
                expectType<boolean>(item.attr8);
                expectType<number | undefined>(item.attr9);
                expectType<boolean | undefined>(item.attr10);
            });
            items.entityWithoutSK.map((item) => {
                let keys = "" as keyof typeof item;
                expectType<"attr1" | "attr2" | "attr3" | "attr4" | "attr5" | "attr6" | "attr7" | "attr8" | "attr9">(keys);
                expectType<string>(item.attr1);
                expectType<string | undefined>(item.attr2);
                expectType<"123" | "def" | "ghi" | undefined>(item.attr3);
                expectType<"abc" | "def">(item.attr4);
                expectType<string | undefined>(item.attr5);
                expectType<number | undefined>(item.attr6);
                expectType<any>(item.attr7);
                expectType<boolean>(item.attr8);
                expectType<number | undefined>(item.attr9);
            });
        });

    complexService.collections.normalcollection({prop1: "abc", prop2: "def"})
        .where((attr, op) => {
            let opKeys = getKeys(op);
            expectType<OperationNames>(opKeys);
            expectNotAssignable<{attr1: WhereAttributeSymbol<string>}>(attr);
            expectNotAssignable<{attr2: WhereAttributeSymbol<string>}>(attr);
            expectNotAssignable<{attr3: WhereAttributeSymbol<"123" | "def" | "ghi">}>(attr);
            expectNotAssignable<{attr4: WhereAttributeSymbol<"abc" | "def" | "ghi">}>(attr);
            expectNotAssignable<{attr5: WhereAttributeSymbol<string>}>(attr);
            expectAssignable<{attr6: WhereAttributeSymbol<number>}>(attr);
            expectNotAssignable<{attr7: WhereAttributeSymbol<any>}>(attr);
            expectNotAssignable<{attr8: WhereAttributeSymbol<boolean>}>(attr);
            expectAssignable<{attr9: WhereAttributeSymbol<number>}>(attr);
            expectNotAssignable<{attr10: WhereAttributeSymbol<boolean>}>(attr);
            expectAssignable<{prop1: WhereAttributeSymbol<string>}>(attr);
            expectAssignable<{prop2: WhereAttributeSymbol<string>}>(attr);
            expectAssignable<{prop3: WhereAttributeSymbol<string>}>(attr);
            expectAssignable<{prop4: WhereAttributeSymbol<number>}>(attr);
            expectAssignable<{prop5: WhereAttributeSymbol<number>}>(attr);
            expectAssignable<{prop10: WhereAttributeSymbol<boolean>}>(attr);;
            return op.eq(attr.prop1, "db");
        })
        .go()
        .then((items) => {
            items.normalEntity1.map(item => {
                let keys = "" as keyof typeof item;
                expectType<"prop1" | "prop2" | "prop3" | "prop4" | "prop10">(keys);
                expectType<string>(item.prop1);
                expectType<string>(item.prop2);
                expectType<string>(item.prop3);
                expectType<number>(item.prop4);
                expectType<boolean | undefined>(item.prop10);
            });
            items.normalEntity2.map(item => {
                let keys = "" as keyof typeof item;
                expectType<"prop1" | "prop2" | "prop3" | "prop5" | "attr6" | "attr9">(keys);
                expectType<string>(item.prop1);
                expectType<string>(item.prop2);
                expectType<string>(item.prop3);
                expectType<number>(item.prop5);
                expectType<number|undefined>(item.attr6);
                expectType<number|undefined>(item.attr9);
            });
        });

    complexService.collections.mycollection2({attr1: "abc"})
        .where((attr, op) => {
            let opKeys = getKeys(op);
            expectType<OperationNames>(opKeys);
            expectAssignable<{attr1: WhereAttributeSymbol<string>}>(attr);
            expectAssignable<{attr2: WhereAttributeSymbol<string>}>(attr);
            expectAssignable<{attr3: WhereAttributeSymbol<"123" | "def" | "ghi">}>(attr);
            expectAssignable<{attr4: WhereAttributeSymbol<"abc" | "def" | "ghi">}>(attr);
            expectAssignable<{attr5: WhereAttributeSymbol<string>}>(attr);
            expectAssignable<{attr6: WhereAttributeSymbol<number>}>(attr);
            expectAssignable<{attr7: WhereAttributeSymbol<any>}>(attr);
            expectAssignable<{attr8: WhereAttributeSymbol<boolean>}>(attr);
            expectAssignable<{attr9: WhereAttributeSymbol<number>}>(attr);
            expectAssignable<{attr10: WhereAttributeSymbol<boolean>}>(attr);
            expectNotAssignable<{prop1: WhereAttributeSymbol<string>}>(attr);
            expectNotAssignable<{prop2: WhereAttributeSymbol<string>}>(attr);
            expectNotAssignable<{prop3: WhereAttributeSymbol<string>}>(attr);
            expectNotAssignable<{prop4: WhereAttributeSymbol<number>}>(attr);
            expectNotAssignable<{prop5: WhereAttributeSymbol<number>}>(attr);
            expectNotAssignable<{prop10: WhereAttributeSymbol<boolean>}>(attr);
            return op.eq(attr.attr9, 768);
        })
        .go()
        .then(results => {
            results.entityWithSK.map((item) => {
                let keys = "" as keyof typeof item;
                expectType<"attr1" | "attr2" | "attr3" | "attr4" | "attr5" | "attr6" | "attr7" | "attr8" | "attr9" | "attr10">(keys);
                expectType<string>(item.attr1);
                expectType<string>(item.attr2);
                expectType<"123" | "def" | "ghi" | undefined>(item.attr3);
                expectType<"abc" | "ghi">(item.attr4);
                expectType<string | undefined>(item.attr5);
                expectType<number | undefined>(item.attr6);
                expectType<any>(item.attr7);
                expectType<boolean>(item.attr8);
                expectType<number | undefined>(item.attr9);
                expectType<boolean | undefined>(item.attr10);
            });
        });

    let entityWithHiddenAttributes1 = new Entity({
        model: {
            entity: "e1",
            service: "s1",
            version: "1"
        },
        attributes: {
            prop1: {
                type: "string"
            },
            prop2: {
                type: "string"
            },
            prop3: {
                type: "string",
                hidden: true
            }
        },
        indexes: {
            record: {
                collection: "collection1",
                pk: {
                    field: "pk",
                    composite: ["prop1"]
                },
                sk: {
                    field: "sk",
                    composite: ["prop2"]
                }
            }
        }
    });

    let entityWithHiddenAttributes2 = new Entity({
        model: {
            entity: "e2",
            service: "s1",
            version: "1"
        },
        attributes: {
            prop1: {
                type: "string"
            },
            prop2: {
                type: "string"
            },
            prop4: {
                type: "string",
                hidden: true
            },
            prop5: {
                type: "string",
            }
        },
        indexes: {
            record: {
                collection: "collection1",
                pk: {
                    field: "pk",
                    composite: ["prop1"]
                },
                sk: {
                    field: "sk",
                    composite: ["prop2"]
                }
            }
        }
    });

    const serviceWithHiddenAttributes = new Service({
        e1: entityWithHiddenAttributes1,
        e2: entityWithHiddenAttributes2
    });

    type Entity1WithHiddenAttribute = {
        prop1: string;
        prop2: string;
    };

    let entity1WithHiddenAttributeKey = "" as keyof Entity1WithHiddenAttribute;

    type Entity2WithHiddenAttribute = {
        prop1: string;
        prop2: string;
        prop5: string | undefined;
    };

    let entity2WithHiddenAttributeKey = "" as keyof Entity2WithHiddenAttribute;

    entityWithHiddenAttributes1
        .get({prop1: "abc", prop2: "def"})
        .where((attr, op) => {
            expectAssignable<{prop3: WhereAttributeSymbol<string>}>(attr);
            return op.eq(attr.prop3, "abc");
        })
        .go()
        .then(value => {
            expectType<keyof typeof value>(entity1WithHiddenAttributeKey);
            expectType<Entity1WithHiddenAttribute>(value);
        });

    entityWithHiddenAttributes1
        .query.record({prop1: "abc"})
        .where((attr, op) => {
            expectAssignable<{prop3: WhereAttributeSymbol<string>}>(attr);
            return op.eq(attr.prop3, "abc");
        })
        .go()
        .then(values => {
            return values.map(value => {
                expectType<keyof typeof value>(entity1WithHiddenAttributeKey);
                expectType<Entity1WithHiddenAttribute>(value);
            });
        });

    serviceWithHiddenAttributes.collections
        .collection1({prop1: "abc"})
        .where((attr, op) => {
            expectAssignable<{prop3: WhereAttributeSymbol<string>}>(attr);
            expectAssignable<{prop4: WhereAttributeSymbol<string>}>(attr);
            return `${op.eq(attr.prop3, "abc")} AND ${op.eq(attr.prop4, "def")}`
        })
        .go()
        .then(results => {
            results.e1.map(value => {
                expectType<keyof typeof value>(entity1WithHiddenAttributeKey);
                expectType<Entity1WithHiddenAttribute>(value);
            });
            results.e2.map(value => {
                expectType<keyof typeof value>(entity2WithHiddenAttributeKey);
                expectType<string>(value.prop1);
                expectType<string>(value.prop2);
                expectType<string | undefined>(value.prop5);
            });
        })

    let entityWithReadOnlyAttribute = new Entity({
        model: {
            entity: "e1",
            service: "s1",
            version: "1"
        },
        attributes: {
            prop1: {
                type: "string"
            },
            prop2: {
                type: "string"
            },
            prop3: {
                type: "string",
                readOnly: true
            },
            prop4: {
                type: "string"
            },
            prop5: {
                type: "number"
            },
            prop6: {
                type: "any"
            },
            prop7: {
                type: "string"
            },
            prop8: {
                type: ["abc", "def"] as const
            },
            prop9: {
                type: "number",
                readOnly: true,
            },
            prop10: {
                type: "any",
                readOnly: true
            }
        },
        indexes: {
            record: {
                collection: "collection1",
                pk: {
                    field: "pk",
                    composite: ["prop1"]
                },
                sk: {
                    field: "sk",
                    composite: ["prop2"]
                }
            }
        }
    });

    entityWithReadOnlyAttribute.put({prop1: "abc", prop2: "def", prop3: "ghi"}).params();
    entityWithReadOnlyAttribute.create({prop1: "abc", prop2: "def", prop3: "ghi"}).params();

    // readonly
    expectError(() => {
        entityWithReadOnlyAttribute
            .update({prop1: "abc", prop2: "def"})
            .set({prop3: "abc"})
            .params();
    });

    // readonly
    expectError(() => {
        entityWithReadOnlyAttribute
            .update({prop1: "abc", prop2: "def"})
            .add({prop9: 13})
            .params();
    });

    // readonly
    expectError(() => {
        entityWithReadOnlyAttribute
            .update({prop1: "abc", prop2: "def"})
            .subtract({prop9: 13})
            .params();
    });

    // readonly
    expectError(() => {
        entityWithReadOnlyAttribute
            .update({prop1: "abc", prop2: "def"})
            .delete({prop10: "13"})
            .params();
    });

    // readonly
    expectError(() => {
        entityWithReadOnlyAttribute
            .update({prop1: "abc", prop2: "def"})
            .append({prop10: ["abc"]})
            .params();
    });

    // bad type - not number
    expectError(() => {
        entityWithReadOnlyAttribute
            .update({prop1: "abc", prop2: "def"})
            .add({prop7: 13})
            .params();
    });

    // bad type - not number
    expectError(() => {
        entityWithReadOnlyAttribute
            .update({prop1: "abc", prop2: "def"})
            .subtract({prop7: 13})
            .params();
    });

    // bad type - not string
    expectError(() => {
        entityWithReadOnlyAttribute
            .update({prop1: "abc", prop2: "def"})
            // prop7 is string not number
            .data(({prop7}, {set}) => set(prop7, 5))
            .params();
    });

    // bad type - incorrect enum
    expectError(() => {
        entityWithReadOnlyAttribute
            .update({prop1: "abc", prop2: "def"})
            // prop8 is enum with values ["abc", "def"]
            .data(({prop8}, {set}) => set(prop8, "ghi"))
            .params();
    });

    // bad type - not number
    expectError(() => {
        entityWithReadOnlyAttribute
            .update({prop1: "abc", prop2: "def"})
            .data(({prop7}, {subtract}) => subtract(prop7, 5))
            .params();
    });

    // bad type - not number
    expectError(() => {
        entityWithReadOnlyAttribute
            .update({prop1: "abc", prop2: "def"})
            .data(({prop7}, {add}) => add(prop7, 5))
            .params();
    });

    // bad type - not any
    expectError(() => {
        entityWithReadOnlyAttribute
            .update({prop1: "abc", prop2: "def"})
            .data(({prop7}, {del}) => del(prop7, 5))
            .params();
    });

    // bad type - not any
    expectError(() => {
        entityWithReadOnlyAttribute
            .update({prop1: "abc", prop2: "def"})
            .data(({prop7}, op) => op.delete(prop7, 5))
            .params();
    });

    // bad type - not any
    expectError(() => {
        entityWithReadOnlyAttribute
            .update({prop1: "abc", prop2: "def"})
            .delete({prop7: "13", prop5: 24})
            .params();
    });

    // bad type - not any
    expectError(() => {
        entityWithReadOnlyAttribute
            .update({prop1: "abc", prop2: "def"})
            .delete({prop5: 24})
            .params();
    });


    expectError(() => {
        entityWithReadOnlyAttribute
            .update({prop1: "abc", prop2: "def"})
            .append({prop7: "13", prop5: 24})
            .params();
    });

    expectError(() => {
        entityWithReadOnlyAttribute
            .update({prop1: "abc", prop2: "def"})
            .append({prop5: 24})
            .params();
    });

    // readonly
    expectError(() => {
        entityWithReadOnlyAttribute
            .update({prop1: "abc", prop2: "def"})
            .remove(["prop3"])
            .params();
    });

    // readonly
    expectError(() => {
        entityWithReadOnlyAttribute
            .update({prop1: "abc", prop2: "def"})
            .data(({prop3}, {remove}) => {
                remove(prop3)
            })
            .params();
    });

    expectError(() => {
        entityWithReadOnlyAttribute
            .update({prop1: "abc", prop2: "def"})
            .data(({prop5}, {append}) => {
                append(prop5, 25)
            })
            .params();
    });

    // patch
    expectError(() => {
        entityWithReadOnlyAttribute
            .patch({prop1: "abc", prop2: "def"})
            .set({prop3: "abc"})
            .params();
    });

    expectError(() => {
        entityWithReadOnlyAttribute
            .patch({prop1: "abc", prop2: "def"})
            .add({prop7: 13})
            .params();
    });

    expectError(() => {
        entityWithReadOnlyAttribute
            .patch({prop1: "abc", prop2: "def"})
            .subtract({prop7: 13})
            .params();
    });

    expectError(() => {
        entityWithReadOnlyAttribute
            .patch({prop1: "abc", prop2: "def"})
            .delete({prop7: "13", prop5: 24})
            .params();
    });

    expectError(() => {
        entityWithReadOnlyAttribute
            .patch({prop1: "abc", prop2: "def"})
            .delete({prop5: 24})
            .params();
    });

    expectError(() => {
        entityWithReadOnlyAttribute
            .patch({prop1: "abc", prop2: "def"})
            .append({prop7: "13", prop5: 24})
            .params();
    });

    expectError(() => {
        entityWithReadOnlyAttribute
            .patch({prop1: "abc", prop2: "def"})
            .append({prop5: 24})
            .params();
    });

    expectError(() => {
        entityWithReadOnlyAttribute
            .patch({prop1: "abc", prop2: "def"})
            .remove(["prop3"])
            .params();
    });

    expectError(() => {
        entityWithReadOnlyAttribute
            .patch({prop1: "abc", prop2: "def"})
            .remove(["prop3"])
            .params();
    });

    let setItemValue = {} as UpdateEntityItem<typeof entityWithReadOnlyAttribute>
    entityWithReadOnlyAttribute
        .update({prop1: "abc", prop2: "def"})
        .set(setItemValue)
        .params();

    entityWithReadOnlyAttribute
        .update({prop1: "abc", prop2: "def"})
        .remove([
            "prop4"
        ])
        .params();

    entityWithReadOnlyAttribute
        .update({prop1: "abc", prop2: "def"})
        .add({
            prop5: 13,
        })
        .params();

    entityWithReadOnlyAttribute
        .update({prop1: "abc", prop2: "def"})
        .subtract({
            prop5: 13,
        })
        .params();

    entityWithReadOnlyAttribute
        .update({prop1: "abc", prop2: "def"})
        .append({
            prop6: ["value"]
        })
        .params();

    entityWithReadOnlyAttribute
        .update({prop1: "abc", prop2: "def"})
        .delete({
            prop6: ["value"]
        })
        .params();

    // full chain with duplicates
    entityWithReadOnlyAttribute
        .update({prop1: "abc", prop2: "def"})
        .set(setItemValue)
        .remove([
            "prop4"
        ])
        .add({
            prop5: 13,
        })
        .subtract({
            prop5: 13,
        })
        .append({
            prop6: ["value"]
        })
        .delete({
            prop6: ["value"]
        })
        .set(setItemValue)
        .remove([
            "prop4"
        ])
        .data((attr, op) => {
            op.set(attr.prop4, "abc");
            op.set(attr.prop5, 134);
            op.set(attr.prop6, "def")
            op.set(attr.prop6, 123)
            op.set(attr.prop6, true)
            op.set(attr.prop6[1], true)
            op.set(attr.prop6.prop1, true)
            op.set(attr.prop8, "def")

            op.remove(attr.prop4);
            op.remove(attr.prop5);
            op.remove(attr.prop6);
            op.remove(attr.prop6);
            op.remove(attr.prop6);
            op.remove(attr.prop6[1]);
            op.remove(attr.prop6.prop1);
            op.remove(attr.prop8)

            op.append(attr.prop6, ["abc"]);
            op.append(attr.prop6, ["abc"]);
            op.append(attr.prop6, ["abc"]);
            op.append(attr.prop6[1], ["abc"]);
            op.append(attr.prop6.prop1, ["abc"]);

            op.delete(attr.prop6, ["abc"]);
            op.delete(attr.prop6, ["abc"]);
            op.delete(attr.prop6, ["abc"]);
            op.delete(attr.prop6[1], ["abc"]);
            op.delete(attr.prop6.prop1, ["abc"]);

            op.del(attr.prop6, ["abc"]);
            op.del(attr.prop6, ["abc"]);
            op.del(attr.prop6, ["abc"]);
            op.del(attr.prop6[1], ["abc"]);
            op.del(attr.prop6.prop1, ["abc"]);

            op.name(attr.prop4);
            op.name(attr.prop5);
            op.name(attr.prop6);
            op.name(attr.prop6);
            op.name(attr.prop6);
            op.name(attr.prop6[1]);
            op.name(attr.prop6.prop1);
            op.name(attr.prop8);

            op.value(attr.prop4, "abc");
            op.value(attr.prop5, 134);
            op.value(attr.prop6, "abc");
            op.value(attr.prop6, "abc");
            op.value(attr.prop6, "abc");
            op.value(attr.prop6[1], "abc");
            op.value(attr.prop6.prop1, "abc");
            op.value(attr.prop8, "abc");
        })
        .add({
            prop5: 13,
        })
        .subtract({
            prop5: 13,
        })
        .append({
            prop6: ["value"]
        })
        .delete({
            prop6: ["value"]
        })
        .params();


    type MyCollection1Pager = {
        attr5?: string | undefined;
        attr9?: number | undefined;
        attr6?: number | undefined;
        attr1?: string | undefined;
        attr2?: string | undefined;
        prop1?: string | undefined;
        prop2?: string | undefined;
        prop5?: number | undefined;
        __edb_e__?: string | undefined;
        __edb_v__?: string | undefined;
        attr4?: "abc" | "def" |  "ghi" | undefined;
    }

    type Collection1EntityNames = "entityWithSK" | "normalEntity2" | "entityWithoutSK";
    const names = "" as Collection1EntityNames;
    complexService.collections
        .mycollection1({attr9: 123, attr6: 245})
        .page()
        .then(([next, results]) => {
            expectType<string | undefined>(next?.attr1);
            expectType<string | undefined>(next?.attr2);
            expectType<number | undefined>(next?.attr6);
            expectType<number | undefined>(next?.attr9);
            expectType<"abc" | "def" |  "ghi" | undefined>(next?.attr4);
            expectType<string | undefined>(next?.attr5);
            expectType<number | undefined>(next?.prop5);
            expectType<string | undefined>(next?.prop1);
            expectType<string | undefined>(next?.prop2);
            expectType<string | undefined>(next?.__edb_e__);
            expectType<string | undefined>(next?.__edb_v__);
            expectAssignable<typeof next>({
                attr1: "abc",
                attr2: "abc",
                attr6: 27,
                attr9: 89,
                attr4: "abc",
                attr5: "abc",
                __edb_e__: "entityWithSK",
                __edb_v__: "1"
            });
            expectAssignable<typeof next>({
                prop1: "abc",
                prop2: "abc",
                attr6: 27,
                attr9: 89,
                prop5: 12,
                __edb_e__: "normalEntity2",
                __edb_v__: "1"
            });
            expectAssignable<typeof next>({
                attr1: "abc",
                attr6: 27,
                attr9: 89,
                __edb_e__: "entityWithoutSK",
                __edb_v__: "1"
            });
            expectType<keyof typeof results>(names);
            expectNotType<any>(next);
        })

    complexService.collections
        .mycollection1({attr9: 123, attr6: 245})
        .page(null)

    const nextPage = {} as MyCollection1Pager;
    complexService.collections
        .mycollection1({attr9: 123, attr6: 245})
        .page(nextPage, {})

    complexService.entities
        .entityWithSK.remove({attr1: "abc", attr2: "def"})
        .where((attr, op) => op.eq(attr.attr9, 14))
        .go();


const entityWithMultipleCollections1 = new Entity({
    model: {
        entity: "entity1",
        service: "myservice",
        version: "myversion"
    },
    attributes: {
        attr1: {
            type: "string",
        },
        attr2: {
            type: "string",
        }
    },
    indexes: {
        myIndex: {
            collection: ["outercollection", "innercollection"] as const,
            pk: {
                field: "pk",
                composite: ["attr1"]
            },
            sk: {
                field: "sk",
                composite: ["attr2"]
            }
        },
    }
})

const entityWithMultipleCollections2 = new Entity({
    model: {
        entity: "entity2",
        service: "myservice",
        version: "myversion"
    },
    attributes: {
        attr1: {
            type: "string",
        },
        attr2: {
            type: "string",
        }
    },
    indexes: {
        myIndex: {
            collection: ["outercollection", "innercollection"] as const,
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
            index: "index2",
            collection: ["extracollection"] as const,
            pk: {
                field: "index2pk",
                composite: ["attr1"]
            },
            sk: {
                field: "index2sk",
                composite: ["attr2"]
            }
        },
    }
});

const entityWithMultipleCollections3 = new Entity({
    model: {
        entity: "entity3",
        service: "myservice",
        version: "myversion"
    },
    attributes: {
        attr1: {
            type: "string",
        },
        attr2: {
            type: "string",
        }
    },
    indexes: {
        myIndex: {
            collection: "outercollection" as const,
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
            index: "index2",
            collection: "extracollection" as const,
            pk: {
                field: "index2pk",
                composite: ["attr1"]
            },
            sk: {
                field: "index2sk",
                composite: ["attr2"]
            }
        },
    }
});

const serviceWithMultipleCollections = new Service({entityWithMultipleCollections3, entityWithMultipleCollections1, entityWithMultipleCollections2});

type OuterCollectionEntities = "entityWithMultipleCollections2" | "entityWithMultipleCollections3" | "entityWithMultipleCollections1";
type InnerCollectionEntities = "entityWithMultipleCollections1" | "entityWithMultipleCollections2";
type ExtraCollectionEntities = "entityWithMultipleCollections2" | "entityWithMultipleCollections3";

serviceWithMultipleCollections.collections
    .outercollection({attr1: "abc"})
    .go()
    .then(values => {
        const keys = "" as keyof typeof values;
        expectType<OuterCollectionEntities>(keys);
    })

serviceWithMultipleCollections.collections
    .innercollection({attr1: "abc"})
    .go()
    .then(values => {
        const keys = "" as keyof typeof values;
        expectType<InnerCollectionEntities>(keys);
    })

serviceWithMultipleCollections.collections
    .extracollection({attr1: "abc"})
    .go()
    .then(values => {
        const keys = "" as keyof typeof values;
        expectType<ExtraCollectionEntities>(keys);
    })

const entityWithWatchAll = new Entity({
    model: {
        entity: "withwatchall",
        service: "service",
        version: "1"
    },
    attributes: {
        prop1: {
            type: "string"
        },
        prop2: {
            type: "string"
        },
        prop3: {
            type: "string",
            watch: "*",
            set: (value) => {
                return value;
            }
        },
    },
    indexes: {
        record: {
            pk: {
                field: "pk",
                composite: ["prop1"]
            },
            sk: {
                field: "sk",
                composite: ["prop2"]
            }
        }
    }
});

const entityWithComplexShapes = new Entity({
    model: {
        entity: "entity",
        service: "service",
        version: "1"
    },
    attributes: {
        prop1: {
            type: "string",
            label: "props"
        },
        prop2: {
            type: "string",
        },
        prop3: {
            type: "map",
            properties: {
                val1: {
                    type: "string"
                }
            }
        },
        prop4: {
            type: "list",
            items: {
                type: "map",
                properties: {
                    val2: {
                        type: "number",
                    },
                    val3: {
                        type: "list",
                        items: {
                            type: "string"
                        }
                    },
                    val4: {
                        type: "set",
                        items: "number"
                    }
                }
            }
        },
        prop5: {
            type: "set",
            items: "string"
        },
        prop6: {
            type: "set",
            items: "string"
        }
    },
    indexes: {
        record: {
            collection: "mops",
            pk: {
                field: "pk",
                composite: ["prop1"]
            },
            sk: {
                field: "sk",
                composite: ["prop2"]
            }
        }
    }
});

const entityWithComplexShapesRequired = new Entity({
    model: {
        entity: "entity",
        service: "service",
        version: "1"
    },
    attributes: {
        prop1: {
            type: "string",
            label: "props"
        },
        prop2: {
            type: "string",
        },
        attr3: {
            type: "map",
            properties: {
                val1: {
                    type: "string",
                    required: true
                }
            },
            required: true
        },
        attr4: {
            type: "list",
            items: {
                type: "map",
                properties: {
                    val2: {
                        type: "number",
                        required: true
                    },
                    val3: {
                        type: "list",
                        items: {
                            type: "string",
                            required: true
                        },
                        required: true
                    },
                    val4: {
                        type: "set",
                        items: "number",
                        required: true
                    }
                }
            },
            required: true
        },
        attr5: {
            type: "set",
            items: "string",
            required: true
        },
        attr6: {
            type: "set",
            items: "string",
            required: true
        }
    },
    indexes: {
        record: {
            collection: "mops",
            pk: {
                field: "pk",
                composite: ["prop1"]
            },
            sk: {
                field: "sk",
                composite: ["prop2"]
            }
        }
    }
});

const entityWithComplexShapesRequiredOnEdge = new Entity({
    model: {
        entity: "entity",
        service: "service",
        version: "1"
    },
    attributes: {
        prop1: {
            type: "string",
            label: "props"
        },
        prop2: {
            type: "string",
        },
        attrz3: {
            type: "map",
            properties: {
                val1: {
                    type: "string",
                    required: true
                }
            }
        },
        attrz4: {
            type: "list",
            items: {
                type: "map",
                properties: {
                    val2: {
                        type: "number",
                        required: true,
                    },
                    val3: {
                        type: "list",
                        items: {
                            type: "string",
                            required: true
                        },
                    },
                    val4: {
                        type: "set",
                        items: "number",
                    },
                    val5: {
                        type: "map",
                        properties: {
                            val6: {
                                type: "string",
                                required: true
                            }
                        }
                    }
                }
            },
        },
        attrz5: {
            type: "set",
            items: "string",
        },
        attrz6: {
            type: "set",
            items: "string",
        }
    },
    indexes: {
        record: {
            collection: "mops",
            pk: {
                field: "pk",
                composite: ["prop1"]
            },
            sk: {
                field: "sk",
                composite: ["prop2"]
            }
        }
    }
});

const complexShapeService = new Service({
    ent1: entityWithComplexShapesRequiredOnEdge,
    ent2: entityWithComplexShapes,
    ent3: entityWithComplexShapesRequired
});

entityWithComplexShapes.get({prop1: "abc", prop2: "def"}).go().then(data => {
    data.prop3?.val1;
    let int = 0;
    if (Array.isArray(data.prop4)) {
        for (let value of data.prop4) {
            if (typeof value === "string") {
                if (isNaN(parseInt(value))) {
                    int += 0;
                } else {
                    int += parseInt(value);
                }
            } else if (typeof value === "number") {
                int += value;
            } else if (Array.isArray(value)) {
                for (let val of value) {
                    int += val.val2
                }
            } else {
                expectType<number|undefined>(value.val2);
                int += value?.val2 ?? 0;
            }
        }
    }
    return data.prop3?.val1
});

entityWithComplexShapes
    .get({prop1: "abc", prop2: "def"})
    .go()
    .then(data => {
        data.prop5?.map(values => values)
        data.prop6?.map(values => values)
    })

entityWithComplexShapes
    .update({prop1: "abc", prop2: "def"})
    .set({
        prop4: [{
            val2: 789,
            val3: ["123"],
            val4: [123, 456]
        }],
        prop5: ["abc"]
    })
    .go()

entityWithComplexShapes
    .put({
        prop1: "abc",
        prop2: "def",
        prop4: [{
            val2: 789,
            val3: ["123"],
            val4: [123, 456]
        }],
        prop5: ["abc"]
    })
    .go()

entityWithComplexShapes
    .update({prop1: "abc", prop2: "def"})
    .set({
        prop4: [{
            val2: 789,
            val3: ["123"],
            // val4: [1, 2, 3]
        }],
        prop5: ["abc"]
    })
    .where(({prop5}, {eq}) => eq(prop5, ["abc"]))
    .where(({prop1}, {eq}) => eq(prop1, "abc"))
    .go();


entityWithComplexShapes
    .update({prop1: "abc", prop2: "def"})
    .append({
        prop4: [{
            val2: 789,
            val3: ["123"],
            val4: [1, 2, 3]
        }],
    })
    .data(({prop5, prop4}, {add, append, remove}) => {
        add(prop5, ["abc"]);
        append(prop4[0].val3, ["123"]);
        append(prop4, [{
            val2: 789, 
            val3: ["123"],
            val4: [1, 2, 3]
        }]);
        add(prop4[0].val2, 789);
        add(prop4[0].val4, [1]);
        remove(prop4[0].val4);
        remove(prop4[0].val3);
        remove(prop4[0].val2);

    })
    .go()


expectError(() => {    
    entityWithComplexShapes
        .update({prop1: "abc", prop2: "def"})
        .append({
            prop4: [{
                val2: 789,
                val3: ["123"],
                val4: [1, 2, 3]
            }],
            prop5: ["abc"]
        })
        .go()
});

expectError(() => {    
    entityWithComplexShapes
        .update({prop1: "abc", prop2: "def"})
        .data(({prop1}, {remove}) => {
            remove(prop1);
        })
        .go()
    });

entityWithComplexShapes
    .update({prop1: "abc", prop2: "def"})
    .set({
        prop4: [{
            val2: 789,
            val3: ["123"],
            val4: [1, 2, 3]
        }],
        prop5: ["abc"]
    })
    .go()

entityWithComplexShapesRequired.put({
    prop1: "abc",
    prop2: "def",
    attr3: {
        val1: "abc",
    },
    attr4: [{
        val2: 789,
        val3: ["123"],
        val4: [1, 2, 3]
    }],
    attr5: ["abc"],
    attr6: ["abdbdb"],
});

expectError(() => {
    entityWithComplexShapesRequired.put({});
})

expectError(() => {
    entityWithComplexShapesRequired.put({prop1: "abc", prop2: "def"});
});

complexShapeService.collections
    .mops({prop1: "abc"})
    .where((a, op) => {
        op.eq(a.attr3.val1, "abd");
            expectError(() => op.eq(a.attr3, "abc"));
            expectError(() => op.eq(a.attr3.val2, "abc"));
            expectError(() => op.eq(a.attr3.val1, 123));
        op.between(a.attr4[0].val2, 789, 888);
            expectError(() => op.eq(a.attr4, "abc"));
            expectError(() => op.eq(a.attr4.val2, "abc"));
            expectError(() => op.eq(a.attr4[0].val2, "456"));
        op.between(a.attr4[0].val3[1], "xyz", "123");
            // expectNotAssignable<"abc">(a.attr4[1].val3[1]);
            // expectNotAssignable<typeof (a.attr4[1].val3)>(["abc"]);
            // expectError(() => op.eq(a.attr4[1].val3["def"], "xyz"));
        op.gte(a.attr5, ["abc"]);

        op.eq(a.attrz3.val1, "abd");
            expectError(() => op.eq(a.attrz3, "abc"))
            expectError(() => op.eq(a.attrz3.val2, "abc"))
            expectError(() => op.eq(a.attrz3.val1, 123));
        op.between(a.attrz4[0].val2, 789, 888);
            // expectNotAssignable<"abc">(a.attrz4[1].val3[1]);
            // expectNotAssignable<["abc"]>(a.attrz4[1].val3);
            expectError(() => op.eq(a.attrz4[0].val2, "456"));
        op.between(a.attrz4[0].val3[1], "xyz", "123");
            // expectError(() => op.eq(a.attr4[1].val3[1], "abc"));
            // expectError(() => op.eq(a.attr4[1].val3["def"], "xyz"));
        op.gte(a.attrz5, ["abc"]);

        op.eq(a.prop3.val1, "abd");
            expectError(() => op.eq(a.attrz3, "abc"))
            expectError(() => op.eq(a.attrz3.val2, "abc"))
            expectError(() => op.eq(a.attrz3.val1, 123))
        op.between(a.prop4[0].val2, 789, 888);
        op.between(a.prop4[0].val3[1], "xyz", "123");
        op.gte(a.prop5, ["abc"])
        op.eq(a.prop2, "def");
        op.contains(a.prop4[1].val3[2], "123");

        return "";
    })