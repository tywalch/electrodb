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

type Schema<A extends string, F extends A> = {
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
            readonly collection?: string;
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

type Item<A extends string, F extends A, S extends Schema<A,F>> = {
    [a in keyof S["attributes"]]: S["attributes"][a]["type"] extends infer R
        ? R extends "string" ? string
            : R extends "number" ? number
                : R extends "boolean" ? boolean
                    : R extends Array<infer E> ? E
                        : R extends "any" ? any
                            : never
        : never
}

type RequiredAttributes<A extends string, F extends A, S extends Schema<A,F>> = ExtractKeysOfValueType<{
    [a in keyof S["attributes"]]: S["attributes"][a]["required"] extends infer R
        ? R extends true ? true
            : false
        : never;
}, true>

type ExtractKeysOfValueType<T, K> = { [I in keyof T]: T[I] extends K ? I : never }[keyof T];

type TableIndexes<A extends string, F extends A, S extends Schema<A,F>> = {
    [i in keyof S["indexes"]]: S["indexes"][i] extends infer I
        ? I extends SecondaryIndex
            ? "secondary"
            : "table"
        : never;
};

type TableIndexName<A extends string, F extends A, S extends Schema<A,F>> = ExtractKeysOfValueType<TableIndexes<A,F,S>, "table">;

type PKFacets<A extends string, F extends A, S extends Schema<A,F>> = {
    [i in keyof S["indexes"]]: S["indexes"][i]["pk"]["facets"][number];
}

type SKFacets<A extends string, F extends A, S extends Schema<A,F>> = {
    [i in keyof S["indexes"]]: S["indexes"][i] extends IndexWithSortKey
        ? S["indexes"][i]["sk"]["facets"][number]
        : never;
}

type TableIndexPKFacets<A extends string, F extends A, S extends Schema<A,F>> = Pick<PKFacets<A,F,S>, TableIndexName<A,F,S>>;

type TableIndexSKFacets<A extends string, F extends A, S extends Schema<A,F>> = Pick<SKFacets<A,F,S>, TableIndexName<A,F,S>>;

type IndexPKFacets<A extends string, F extends A, S extends Schema<A,F>, I extends keyof S["indexes"]> = Pick<PKFacets<A,F,S>, I>;

type IndexSKFacets<A extends string, F extends A, S extends Schema<A,F>, I extends keyof S["indexes"]> = Pick<SKFacets<A,F,S>, I>;

type TableIndexPKAttributes<A extends string, F extends A, S extends Schema<A,F>> = Pick<Item<A,F,S>, TableIndexPKFacets<A,F,S>[TableIndexName<A,F,S>]>;

type TableIndexSKAttributes<A extends string, F extends A, S extends Schema<A,F>> = TableIndexSKFacets<A,F,S>[TableIndexName<A,F,S>] extends keyof S["attributes"]
    ? Pick<Item<A,F,S>, TableIndexSKFacets<A,F,S>[TableIndexName<A,F,S>]>
    : Item<A,F,S>;

type IndexPKAttributes<A extends string, F extends A, S extends Schema<A,F>, I extends keyof S["indexes"]> = Pick<Item<A,F,S>, IndexPKFacets<A,F,S,I>[I]>;

type IndexSKAttributes<A extends string, F extends A, S extends Schema<A,F>, I extends keyof S["indexes"]> = IndexSKFacets<A,F,S,I>[I] extends keyof S["attributes"]
    ? Pick<Item<A,F,S>, IndexSKFacets<A,F,S,I>[I]>
    : Item<A,F,S>;

type TableIndexFacets<A extends string, F extends A, S extends Schema<A,F>> = TableIndexPKAttributes<A,F,S> & Partial<TableIndexSKAttributes<A,F,S>>;

type AllTableIndexFacets<A extends string, F extends A, S extends Schema<A,F>> = TableIndexPKAttributes<A,F,S> & TableIndexSKAttributes<A,F,S>;

type IndexFacets<A extends string, F extends A, S extends Schema<A,F>, I extends keyof S["indexes"]> = IndexPKAttributes<A,F,S,I> & Partial<IndexSKAttributes<A,F,S,I>>;

type TableItem<A extends string, F extends A, S extends Schema<A,F>> =
    AllTableIndexFacets<A,F,S> &
    Pick<Item<A,F,S>, RequiredAttributes<A,F,S>> &
    Partial<Omit<Item<A,F,S>, RequiredAttributes<A,F,S>>>

type PutItem<A extends string, F extends A, S extends Schema<A,F>> =
    AllTableIndexFacets<A,F,S> &
    Pick<Item<A,F,S>, RequiredAttributes<A,F,S>> &
    Partial<Omit<Item<A,F,S>, RequiredAttributes<A,F,S>>>

type SetItem<A extends string, F extends A, S extends Schema<A,F>> =
    Omit<Partial<TableItem<A,F,S>>, keyof AllTableIndexFacets<A,F,S>>

interface WhereAttributeSymbol<T> {
    [WhereSymbol]: void;
    _: T;
}

type WhereAttributes<A extends string, F extends A, S extends Schema<A,F>, I extends Item<A,F,S>> = {
    [Attr in keyof I]: WhereAttributeSymbol<I[Attr]>
}

type WhereOperations<A extends string, F extends A, S extends Schema<A,F>, I extends Item<A,F,S>> = {
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

type WhereCallback<A extends string, F extends A, S extends Schema<A,F>, I extends Item<A,F,S>> =
    <W extends WhereAttributes<A,F,S,I>>(attributes: W, operations: WhereOperations<A,F,S,I>) => string;

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

type RecordsActionOptions<A extends string, F extends A, S extends Schema<A,F>, Items, IndexFacets> = {
    go: GoRecord<Items>;
    params: ParamRecord;
    page: PageRecord<Items,IndexFacets>;
    where: WhereClause<A,F,S,RecordsActionOptions<A,F,S,Items,IndexFacets>>;
}

type SingleRecordOperationOptions<A extends string, F extends A, S extends Schema<A,F>, ResponseType> = {
    go: GoRecord<ResponseType, QueryOptions>;
    params: ParamRecord<QueryOptions>;
    where: WhereClause<A,F,S, SingleRecordOperationOptions<A,F,S,ResponseType>>;
};

type BulkRecordOperationOptions<A extends string, F extends A, S extends Schema<A,F>, ResponseType> = {
    go: GoRecord<ResponseType, BulkOptions>;
    params: ParamRecord<BulkOptions>;
};

type SetRecordActionOptions<A extends string, F extends A, S extends Schema<A,F>, SetAttr,IndexFacets,TableItem> = {
    go: GoRecord<TableItem>;
    params: ParamRecord;
    set: SetRecord<A,F,S, SetAttr,IndexFacets,TableItem>;
    where: WhereClause<A,F,S,RecordsActionOptions<A,F,S,TableItem,IndexFacets>>;
}

type SetRecord<A extends string, F extends A, S extends Schema<A,F>, SetAttr,IndexFacets,TableItem> = (properties: SetAttr) => SetRecordActionOptions<A,F,S, SetAttr,IndexFacets,TableItem>;

type WhereClause<A extends string, F extends A, S extends Schema<A,F>, T> = (where: WhereCallback<A,F,S,Item<A,F,S>>) => T;

type QueryOperations<A extends string, F extends A, S extends Schema<A,F>, Facets, TableItem, IndexFacets> = {
    between: (skFacetsStart: Facets, skFacetsEnd: Facets) => RecordsActionOptions<A,F,S, Array<TableItem>,IndexFacets>;
    gt: (skFacets: Facets) => RecordsActionOptions<A,F,S, Array<TableItem>,IndexFacets>;
    gte: (skFacets: Facets) => RecordsActionOptions<A,F,S, Array<TableItem>,IndexFacets>;
    lt: (skFacets: Facets) => RecordsActionOptions<A,F,S, Array<TableItem>,IndexFacets>;
    lte: (skFacets: Facets) => RecordsActionOptions<A,F,S, Array<TableItem>,IndexFacets>;
    begins: (skFacets: Facets) => RecordsActionOptions<A,F,S, Array<TableItem>,IndexFacets>;
    go: GoRecord<Array<TableItem>>;
    params: ParamRecord;
    page: PageRecord<Array<TableItem>,IndexFacets>;
    where: WhereClause<A,F,S,RecordsActionOptions<A,F,S,Array<TableItem>,IndexFacets>>
}

type Queries<A extends string, F extends A, S extends Schema<A,F>> = {
    [I in keyof S["indexes"]]: <Facets extends IndexFacets<A,F,S,I>>(facets: Facets) =>
        IndexSKAttributes<A,F,S,I> extends infer SK
            // If there is no SK, dont show query operations (when an empty array is provided)
            ? [keyof SK] extends [never]
            ? RecordsActionOptions<A,F,S, TableItem<A,F,S>[], AllTableIndexFacets<A,F,S>>
            // If there is no SK, dont show query operations (When no PK is specified)
            : S["indexes"][I] extends IndexWithSortKey
                ? QueryOperations<
                    A,F,S,
                    // Omit the facets already provided
                    Omit<Partial<IndexSKAttributes<A,F,S,I>>, keyof Facets>,
                    TableItem<A,F,S>,
                    AllTableIndexFacets<A,F,S>
                    >
                : RecordsActionOptions<A,F,S, TableItem<A,F,S>[], AllTableIndexFacets<A,F,S>>
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

export class Entity<A extends string, F extends A, S extends Schema<A,F>> {
    readonly schema: S;
    constructor(schema: S, config?: EntityConfiguration);
    get(key: AllTableIndexFacets<A,F,S>): SingleRecordOperationOptions<A,F,S, TableItem<A,F,S>>;
    get(key: AllTableIndexFacets<A,F,S>[]): BulkRecordOperationOptions<A,F,S, [Required<TableIndexFacets<A,F,S>>, TableItem<A,F,S>[]]>;
    delete(key: AllTableIndexFacets<A,F,S>): SingleRecordOperationOptions<A,F,S, TableItem<A,F,S>>;
    delete(key: AllTableIndexFacets<A,F,S>[]): BulkRecordOperationOptions<A,F,S, Required<TableIndexFacets<A,F,S>>[]>;
    update(key: AllTableIndexFacets<A,F,S>): {
        set: SetRecord<A,F,S, SetItem<A,F,S>, TableIndexFacets<A,F,S>, TableItem<A,F,S>>
    };
    patch(key: AllTableIndexFacets<A,F,S>): {
        set: SetRecord<A,F,S, SetItem<A,F,S>, TableIndexFacets<A,F,S>, TableItem<A,F,S>>
    };
    put(record: PutItem<A,F,S>): SingleRecordOperationOptions<A,F,S, TableItem<A,F,S>>;
    put(record: PutItem<A,F,S>[]): BulkRecordOperationOptions<A,F,S, Required<TableIndexFacets<A,F,S>>[]>;
    create(record: PutItem<A,F,S>): SingleRecordOperationOptions<A,F,S, TableItem<A,F,S>>;
    find(record: Partial<Item<A,F,S>>): RecordsActionOptions<A,F,S, TableItem<A,F,S>[], Required<TableIndexFacets<A,F,S>>>;
    setIdentifier(type: "model" | "version", value: string): void;
    scan: RecordsActionOptions<A,F,S, Item<A,F,S>[], TableIndexFacets<A,F,S>>
    query: Queries<A,F,S>;
}