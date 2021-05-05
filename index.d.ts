declare const WhereSymbol: unique symbol;

type BooleanAttribute = {
    readonly type: "boolean";
    readonly required?: boolean;
    readonly get?: (val: boolean, schema: any) => boolean | undefined;
    readonly set?: (val: boolean, schema: any) => boolean | undefined;
    readonly default?: boolean | (() => boolean);
    readonly validate?: ((val: boolean) => boolean) | ((val: boolean) => number);
    readonly field?: string;
    readonly label?: string;
}

type NumberAttribute = {
    readonly type: "number";
    readonly required?: boolean;
    readonly get?: (val: number, schema: any) => number | undefined;
    readonly set?: (val: number, schema: any) => number | undefined;
    readonly default?: number | (() => number);
    readonly validate?: ((val: number) => boolean) | ((val: number) => number);
    readonly field?: string;
    readonly label?: string;
}

type StringAttribute = {
    readonly type: "string";
    readonly required?: boolean;
    readonly get?: (val: string, schema: any) => string | undefined;
    readonly set?: (val: string, schema: any) => string | undefined;
    readonly default?: string | (() => string);
    readonly validate?: ((val: string) => boolean) | ((val: string) => string);
    readonly field?: string;
    readonly label?: string;
}

type EnumAttribute = {
    readonly type: Array<string>;
    readonly required?: boolean;
    readonly get?: (val: string, schema: any) => string | undefined;
    readonly set?: (val: string, schema: any) => string | undefined;
    readonly default?: string | (() => string);
    readonly validate?: ((val: string) => boolean) | ((val: string) => string);
    readonly field?: string;
    readonly label?: string;
}

type AnyAttribute = {
    readonly type: "any";
    readonly required?: boolean;
    readonly get?: (val: any, schema: any) => any | undefined;
    readonly set?: (val: any, schema: any) => any | undefined;
    readonly default?: () => any;
    readonly validate?: ((val: any) => boolean) | ((val: any) => string);
    readonly field?: string;
    readonly label?: string;
}

type Attribute = BooleanAttribute | NumberAttribute | StringAttribute | EnumAttribute | AnyAttribute;

type SecondaryIndex = {
    readonly index: string;
    readonly collection?: string;
    readonly pk: {
        readonly field: string;
        readonly facets: string[];
    }
    readonly sk?: {
        readonly field: string;
        readonly facets: string[];
    }
}

type IndexWithSortKey = {
    readonly sk: {
        readonly field: string;
        readonly facets: string[];
    }
}

type IndexWithCollection = {
    collection: string;
}

type Schema<A extends string, F extends A, C extends string> = {
    readonly model: {
        readonly entity: string;
        readonly service: string;
        readonly version: string;
    }
    readonly attributes: {
        readonly [a in A]: Attribute
    };
    readonly indexes: {
        [accessPattern: string]: {
            readonly index?: string;
            readonly collection?: C;
            readonly pk: {
                readonly field: string;
                readonly facets: F[];
            }
            readonly sk?: {
                readonly field: string;
                readonly facets: F[];
            }
        }
    }
};

type Item<A extends string, F extends A, C extends string, S extends Schema<A,F,C>> = {
    [a in keyof S["attributes"]]: S["attributes"][a]["type"] extends infer R
        ? R extends "string" ? string
            : R extends "number" ? number
                : R extends "boolean" ? boolean
                    : R extends Array<infer E> ? E
                        : R extends "any" ? any
                            : never
        : never
}

type RequiredAttributes<A extends string, F extends A, C extends string, S extends Schema<A,F,C>> = ExtractKeysOfValueType<{
    [a in keyof S["attributes"]]: S["attributes"][a]["required"] extends infer R
        ? R extends true ? true
            : false
        : never;
}, true>

type ExtractKeysOfValueType<T, K> = {
    [I in keyof T]: T[I] extends K ? I : never
}[keyof T];

type TableIndexes<A extends string, F extends A, C extends string, S extends Schema<A,F,C>> = {
    [i in keyof S["indexes"]]: S["indexes"][i] extends infer I
        ? I extends SecondaryIndex
            ? "secondary"
            : "table"
        : never;
};

type IndexCollections<A extends string, F extends A, C extends string, S extends Schema<A,F,C>> = {
    [i in keyof S["indexes"]]: S["indexes"][i] extends infer I
        ? I extends IndexWithCollection
            ? S["indexes"][i]["collection"] extends infer Name ? Name : never
            : never
        : never;
}[keyof S["indexes"]];

type EntityCollections<A extends string, F extends A, C extends string, S extends Schema<A,F,C>> = {
    [N in IndexCollections<A,F,C,S>]: {
        [i in keyof S["indexes"]]: S["indexes"][i] extends infer I
            ? I extends IndexWithCollection
                ? S["indexes"][i]["collection"] extends infer Name
                        ? Name extends N
                            ? i
                        : never
                    : never
                : never
            : never
    }[keyof S["indexes"]];
}

type TableIndexName<A extends string, F extends A, C extends string, S extends Schema<A,F,C>> = ExtractKeysOfValueType<TableIndexes<A,F,C,S>, "table">;

type PKFacets<A extends string, F extends A, C extends string, S extends Schema<A,F,C>> = {
    [i in keyof S["indexes"]]: S["indexes"][i]["pk"]["facets"][number];
}

type SKFacets<A extends string, F extends A, C extends string, S extends Schema<A,F,C>> = {
    [i in keyof S["indexes"]]: S["indexes"][i] extends IndexWithSortKey
        ? S["indexes"][i]["sk"]["facets"][number]
        : never;
}

type TableIndexPKFacets<A extends string, F extends A, C extends string, S extends Schema<A,F,C>> = Pick<PKFacets<A,F,C,S>, TableIndexName<A,F,C,S>>;

type TableIndexSKFacets<A extends string, F extends A, C extends string, S extends Schema<A,F,C>> = Pick<SKFacets<A,F,C,S>, TableIndexName<A,F,C,S>>;

type IndexPKFacets<A extends string, F extends A, C extends string, S extends Schema<A,F,C>, I extends keyof S["indexes"]> = Pick<PKFacets<A,F,C,S>, I>;

type IndexSKFacets<A extends string, F extends A, C extends string, S extends Schema<A,F,C>, I extends keyof S["indexes"]> = Pick<SKFacets<A,F,C,S>, I>;

type TableIndexPKAttributes<A extends string, F extends A, C extends string, S extends Schema<A,F,C>> = Pick<Item<A,F,C,S>, TableIndexPKFacets<A,F,C,S>[TableIndexName<A,F,C,S>]>;

type TableIndexSKAttributes<A extends string, F extends A, C extends string, S extends Schema<A,F,C>> = TableIndexSKFacets<A,F,C,S>[TableIndexName<A,F,C,S>] extends keyof S["attributes"]
    ? Pick<Item<A,F,C,S>, TableIndexSKFacets<A,F,C,S>[TableIndexName<A,F,C,S>]>
    : Item<A,F,C,S>;

type IndexPKAttributes<A extends string, F extends A, C extends string, S extends Schema<A,F,C>, I extends keyof S["indexes"]> = Pick<Item<A,F,C,S>, IndexPKFacets<A,F,C,S,I>[I]>;

type IndexSKAttributes<A extends string, F extends A, C extends string, S extends Schema<A,F,C>, I extends keyof S["indexes"]> = IndexSKFacets<A,F,C,S,I>[I] extends keyof S["attributes"]
    ? Pick<Item<A,F,C,S>, IndexSKFacets<A,F,C,S,I>[I]>
    : Item<A,F,C,S>;

type TableIndexFacets<A extends string, F extends A, C extends string, S extends Schema<A,F,C>> = TableIndexPKAttributes<A,F,C,S> & Partial<TableIndexSKAttributes<A,F,C,S>>;

type AllTableIndexFacets<A extends string, F extends A, C extends string, S extends Schema<A,F,C>> = TableIndexPKAttributes<A,F,C,S> & TableIndexSKAttributes<A,F,C,S>;

type IndexFacets<A extends string, F extends A, C extends string, S extends Schema<A,F,C>, I extends keyof S["indexes"]> = IndexPKAttributes<A,F,C,S,I> & Partial<IndexSKAttributes<A,F,C,S,I>>;

type TableItem<A extends string, F extends A, C extends string, S extends Schema<A,F,C>> =
    AllTableIndexFacets<A,F,C,S> &
    Pick<Item<A,F,C,S>, RequiredAttributes<A,F,C,S>> &
    Partial<Omit<Item<A,F,C,S>, RequiredAttributes<A,F,C,S>>>

type PutItem<A extends string, F extends A, C extends string, S extends Schema<A,F,C>> =
    AllTableIndexFacets<A,F,C,S> &
    Pick<Item<A,F,C,S>, RequiredAttributes<A,F,C,S>> &
    Partial<Omit<Item<A,F,C,S>, RequiredAttributes<A,F,C,S>>>

type SetItem<A extends string, F extends A, C extends string, S extends Schema<A,F,C>> =
    Omit<Partial<TableItem<A,F,C,S>>, keyof AllTableIndexFacets<A,F,C,S>>

interface WhereAttributeSymbol<T> {
    [WhereSymbol]: void;
    _: T;
}

type WhereAttributes<A extends string, F extends A, C extends string, S extends Schema<A,F,C>, I extends Item<A,F,C,S>> = {
    [Attr in keyof I]: WhereAttributeSymbol<I[Attr]>
}

type WhereOperations<A extends string, F extends A, C extends string, S extends Schema<A,F,C>, I extends Item<A,F,C,S>> = {
    eq: <T, A extends WhereAttributeSymbol<T>>(attr: A, value: A["_"] extends infer V ? V: never) => string;
    gt: <T, A extends WhereAttributeSymbol<T>>(attr: A, value: A["_"] extends infer V ? V: never) => string;
    lt: <T, A extends WhereAttributeSymbol<T>>(attr: A, value: A["_"] extends infer V ? V: never) => string;
    gte: <T, A extends WhereAttributeSymbol<T>>(attr: A, value: A["_"] extends infer V ? V: never) => string;
    lte: <T, A extends WhereAttributeSymbol<T>>(attr: A, value: A["_"] extends infer V ? V: never) => string;
    between: <T, A extends WhereAttributeSymbol<T>>(attr: A, value: A["_"] extends infer V ? V: never, value2: A["_"] extends infer V ? V: never) => string;
    begins: <T, A extends WhereAttributeSymbol<T>>(attr: A, value: A["_"] extends infer V ? V: never) => string;
    exists: <T, A extends WhereAttributeSymbol<T>>(attr: A) => string;
    notExists: <T, A extends WhereAttributeSymbol<T>>(attr: A) => string;
    contains: <T, A extends WhereAttributeSymbol<T>>(attr: A, value: A["_"] extends infer V ? V: never) => string;
    notContains: <T, A extends WhereAttributeSymbol<T>>(attr: A, value: A["_"] extends infer V ? V: never) => string;
    value: <T, A extends WhereAttributeSymbol<T>>(attr: A) => string;
    name: <T, A extends WhereAttributeSymbol<T>>(attr: A) => string;
};

type WhereCallback<A extends string, F extends A, C extends string, S extends Schema<A,F,C>, I extends Item<A,F,C,S>> =
    <W extends WhereAttributes<A,F,C,S,I>>(attributes: W, operations: WhereOperations<A,F,C,S,I>) => string;

interface QueryOptions {
    params?: object;
    raw?: boolean;
    includeKeys?: boolean;
    originalErr?: boolean;
    table?: string;
}

interface PaginationOptions extends QueryOptions {
    lastEvaluatedKeyRaw?: boolean;
}

interface BulkOptions extends QueryOptions {
    lastEvaluatedKeyRaw?: boolean;
    concurrency?: number;
}

type GoRecord<ResponseType, Options = QueryOptions> = (options?: Options) => Promise<ResponseType>;

type PageRecord<ResponseType, Facets> = (page?: Facets | null, options?: PaginationOptions) => Promise<[Facets | null, ResponseType]>;

type ParamRecord<Options = QueryOptions> = <P>(options?: Options) => P;

type RecordsActionOptions<A extends string, F extends A, C extends string, S extends Schema<A,F,C>, Items, IndexFacets> = {
    go: GoRecord<Items>;
    params: ParamRecord;
    page: PageRecord<Items,IndexFacets>;
    where: WhereClause<A,F,C,S,RecordsActionOptions<A,F,C,S,Items,IndexFacets>>;
}

type SingleRecordOperationOptions<A extends string, F extends A, C extends string, S extends Schema<A,F,C>, ResponseType> = {
    go: GoRecord<ResponseType, QueryOptions>;
    params: ParamRecord<QueryOptions>;
    where: WhereClause<A,F,C,S, SingleRecordOperationOptions<A,F,C,S,ResponseType>>;
};

type BulkRecordOperationOptions<A extends string, F extends A, C extends string, S extends Schema<A,F,C>, ResponseType> = {
    go: GoRecord<ResponseType, BulkOptions>;
    params: ParamRecord<BulkOptions>;
};

type SetRecordActionOptions<A extends string, F extends A, C extends string, S extends Schema<A,F,C>, SetAttr,IndexFacets,TableItem> = {
    go: GoRecord<TableItem>;
    params: ParamRecord;
    set: SetRecord<A,F,C,S, SetAttr,IndexFacets,TableItem>;
    where: WhereClause<A,F,C,S,RecordsActionOptions<A,F,C,S,TableItem,IndexFacets>>;
}

type SetRecord<A extends string, F extends A, C extends string, S extends Schema<A,F,C>, SetAttr,IndexFacets,TableItem> = (properties: SetAttr) => SetRecordActionOptions<A,F,C,S, SetAttr,IndexFacets,TableItem>;

type WhereClause<A extends string, F extends A, C extends string, S extends Schema<A,F,C>, T> = (where: WhereCallback<A,F,C,S,Item<A,F,C,S>>) => T;

type QueryOperations<A extends string, F extends A, C extends string, S extends Schema<A,F,C>, Facets, TableItem, IndexFacets> = {
    between: (skFacetsStart: Facets, skFacetsEnd: Facets) => RecordsActionOptions<A,F,C,S, Array<TableItem>,IndexFacets>;
    gt: (skFacets: Facets) => RecordsActionOptions<A,F,C,S, Array<TableItem>,IndexFacets>;
    gte: (skFacets: Facets) => RecordsActionOptions<A,F,C,S, Array<TableItem>,IndexFacets>;
    lt: (skFacets: Facets) => RecordsActionOptions<A,F,C,S, Array<TableItem>,IndexFacets>;
    lte: (skFacets: Facets) => RecordsActionOptions<A,F,C,S, Array<TableItem>,IndexFacets>;
    begins: (skFacets: Facets) => RecordsActionOptions<A,F,C,S, Array<TableItem>,IndexFacets>;
    go: GoRecord<Array<TableItem>>;
    params: ParamRecord;
    page: PageRecord<Array<TableItem>,IndexFacets>;
    where: WhereClause<A,F,C,S,RecordsActionOptions<A,F,C,S,Array<TableItem>,IndexFacets>>
}

type Queries<A extends string, F extends A, C extends string, S extends Schema<A,F,C>> = {
    [I in keyof S["indexes"]]: <Facets extends IndexFacets<A,F,C,S,I>>(facets: Facets) =>
        IndexSKAttributes<A,F,C,S,I> extends infer SK
            // If there is no SK, dont show query operations (when an empty array is provided)
            ? [keyof SK] extends [never]
            ? RecordsActionOptions<A,F,C,S, TableItem<A,F,C,S>[], AllTableIndexFacets<A,F,C,S>>
            // If there is no SK, dont show query operations (When no PK is specified)
            : S["indexes"][I] extends IndexWithSortKey
                ? QueryOperations<
                    A,F,C,S,
                    // Omit the facets already provided
                    Omit<Partial<IndexSKAttributes<A,F,C,S,I>>, keyof Facets>,
                    TableItem<A,F,C,S>,
                    AllTableIndexFacets<A,F,C,S>
                    >
                : RecordsActionOptions<A,F,C,S, TableItem<A,F,C,S>[], AllTableIndexFacets<A,F,C,S>>
            : never
}

type DocumentClientMethod = (parameters: any) => {promise: () => Promise<any>};

type DocumentClient = {
    get: DocumentClientMethod;
    put: DocumentClientMethod;
    delete: DocumentClientMethod;
    update: DocumentClientMethod;
    batchWrite: DocumentClientMethod;
    batchGet: DocumentClientMethod;
    scan: DocumentClientMethod;
}

type EntityConfiguration = {
    table?: string;
    client?: DocumentClient
};

export class Entity<A extends string, F extends A, C extends string, S extends Schema<A,F,C>> {
    readonly schema: S;
    constructor(schema: S, config?: EntityConfiguration);
    get(key: AllTableIndexFacets<A,F,C,S>): SingleRecordOperationOptions<A,F,C,S, TableItem<A,F,C,S>>;
    get(key: AllTableIndexFacets<A,F,C,S>[]): BulkRecordOperationOptions<A,F,C,S, [Required<TableIndexFacets<A,F,C,S>>, TableItem<A,F,C,S>[]]>;
    delete(key: AllTableIndexFacets<A,F,C,S>): SingleRecordOperationOptions<A,F,C,S, TableItem<A,F,C,S>>;
    delete(key: AllTableIndexFacets<A,F,C,S>[]): BulkRecordOperationOptions<A,F,C,S, Required<TableIndexFacets<A,F,C,S>>[]>;
    update(key: AllTableIndexFacets<A,F,C,S>): {
        set: SetRecord<A,F,C,S, SetItem<A,F,C,S>, TableIndexFacets<A,F,C,S>, TableItem<A,F,C,S>>
    };
    patch(key: AllTableIndexFacets<A,F,C,S>): {
        set: SetRecord<A,F,C,S, SetItem<A,F,C,S>, TableIndexFacets<A,F,C,S>, TableItem<A,F,C,S>>
    };
    put(record: PutItem<A,F,C,S>): SingleRecordOperationOptions<A,F,C,S, TableItem<A,F,C,S>>;
    put(record: PutItem<A,F,C,S>[]): BulkRecordOperationOptions<A,F,C,S, Required<TableIndexFacets<A,F,C,S>>[]>;
    create(record: PutItem<A,F,C,S>): SingleRecordOperationOptions<A,F,C,S, TableItem<A,F,C,S>>;
    find(record: Partial<Item<A,F,C,S>>): RecordsActionOptions<A,F,C,S, TableItem<A,F,C,S>[], Required<TableIndexFacets<A,F,C,S>>>;
    setIdentifier(type: "model" | "version", value: string): void;
    scan: RecordsActionOptions<A,F,C,S, Item<A,F,C,S>[], TableIndexFacets<A,F,C,S>>
    query: Queries<A,F,C,S>;
    get _collections(): EntityCollections<A,F,C,S>;
}

type CollectionEntities<N extends string, E extends {[name: N]: Entity<any, any, any, any>}> = {
    [C in keyof (
        {
            [Name in keyof E]: E[Name]["_collections"];
        }[keyof E]
    )]: C;
}
//
// type CollectionEntities<N extends string, E extends {[name: N]: Entity<any, any, any, any>}> = {
//     [C in keyof (
//         {[Name in keyof E]: E[Name]["_collections"]}[keyof E]
//     )]: {
//         [Name in keyof E]: E[Name]["_collections"][C] extends string
//             ? "abc"
//             : "none";
//     }
// }
//
// type ServiceCollections<N extends string, E extends {[name: N]: Entity<any, any, any, any>}> = {
//     [I in ServiceCollectionIndexes<N, E>]: {
//         [Name in keyof E]: E[Name]["query"][I]
//     }[keyof E];
// }

type EntityCollections<E extends {[name: string]: Entity<any, any, any, any>}> = {
    [Name in keyof E]: E[Name];
}

type ServiceCollections<N extends string, E extends {[name: N]: Entity<any, any, any, any>}> = {
    [
        EC in keyof EntityCollections<N,E>
    ]: {
        [Name in keyof E]: {
               [n: Name]: keyof E[Name]["_collections"] extends EC
                   ? E[Name][EC]
                   : never;
                // extends Entity<infer A, infer F, infer C, infer S>
                //    ? Item<A,F,C,S>
                //    : never;
        }[keyof E];
    };
}

export class Service<E extends {[name: string]: Entity<any, any, any, any>}> {
    entities: E;
    // collections: {
    //     [Name in keyof E]: {
    //         [CN in keyof E[Name]["_collections"]]: {
    //             [EName in keyof E]: keyof E[EName]["_collections"] extends infer CNames
    //                 ? CNames extends CN
    //                     ? (facets: Parameters<E[EName]["query"][E[Name]["_collections"][CNames]]>["0"]) => "test"
    //                     : never
    //                 : never
    //         };
    //     };
    // };

    // collections: {
    //     [EntityName in keyof E]: {
    //         [Collection in keyof E[EntityName]["_collections"]]:
    //         keyof E[EntityName]["_collections"] extends infer CollectionNames
    //             ? CollectionNames extends Collection
    //             ? (facets: Parameters<E[EntityName]["query"][E[EntityName]["_collections"][CollectionNames]]>["0"]) => "test"
    //             : never
    //             : never
    //     }
    // }[keyof {
    //     [EntityName in keyof E]:
    //     [keyof E[EntityName]["_collections"]] extends [never]
    //         ? "abc"
    //         : "def"
    // }]

    // collections: {
    //     [EntityName in keyof E]: {
    //         [Collection in keyof E[EntityName]["_collections"]]:
    //             keyof E[EntityName]["_collections"] extends infer CollectionNames
    //                 ? CollectionNames extends Collection
    //                     ? (facets: Parameters<E[EntityName]["query"][E[EntityName]["_collections"][CollectionNames]]>["0"]) => "test"
    //                     : never
    //                 : never
    //     };
    // };


    // SO CLOSE!!
    // collections: {
    //     [EntityName in keyof E]:
    //         [keyof E[EntityName]["_collections"]] extends [never]
    //             ? never
    //             : E[EntityName]["_collections"] extends infer C
    //                 ? {
    //                     [Collection in keyof C]: (facets: Parameters<E[EntityName]["query"][C[Collection]]>["0"]) => Promise<{
    //                         [EName in keyof E]: E[EName] extends Entity<infer A, infer F, infer C, infer S>
    //                             ? TableItem<A,F,C,S>[]
    //                             : never
    //                     }>
    //                 }
    //                 : never
    // }[keyof E];

    // Closer!
    // collections: {
    //     [EntityName in keyof E]:
    //     [keyof E[EntityName]["_collections"]] extends [never]
    //         ? never
    //         : E[EntityName]["_collections"] extends infer Collections
    //         ? {
    //             [Collection in keyof Collections]: (facets: Parameters<E[EntityName]["query"][C[Collection]]>["0"]) => Promise<{
    //                 [EName in keyof E]: E[EName] extends Entity<infer A, infer F, infer C, infer S>
    //                     ? Collection extends keyof E[EName]["_collections"]
    //                         ? TableItem<A,F,C,S>[]
    //                         : never
    //                     : never
    //             }>
    //         }
    //         : never
    // }[keyof E];

    collections: {
        [EntityName in keyof E]:
            [keyof E[EntityName]["_collections"]] extends [never]
                ? never
                : E[EntityName]["_collections"] extends infer Collections
                ? {
                    [Collection in keyof Collections]: (facets: Parameters<E[EntityName]["query"][C[Collection]]>["0"]) => Promise<Pick<{
                        [EName in keyof E]: E[EName] extends Entity<infer A, infer F, infer C, infer S>
                            ? Collection extends keyof E[EName]["_collections"]
                                ? TableItem<A,F,C,S>[]
                                : never
                            : never
                    }, ExtractKeysOfValueType<{
                        [EName in keyof E]: E[EName] extends Entity<infer A, infer F, infer C, infer S>
                            ? Collection extends keyof E[EName]["_collections"]
                                ? true
                                : false
                            : false
                    }, true>>>
                }
                : never
    }[keyof E];

    constructor(entities: E);
}

