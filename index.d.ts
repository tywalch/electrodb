declare const WhereSymbol: unique symbol;

type BooleanAttribute = {
    readonly type: "boolean";
    readonly required?: boolean;
    readonly hidden?: boolean;
    readonly readOnly?: boolean;
    readonly get?: (val: boolean, item: any) => boolean | undefined;
    readonly set?: (val: boolean | undefined, item: any) => boolean | undefined;
    readonly default?: boolean | (() => boolean);
    readonly validate?: ((val: boolean) => boolean) | ((val: boolean) => void) | ((val: boolean) => string | void);
    readonly field?: string;
    readonly label?: string;
    readonly watch?: ReadonlyArray<string>;
}

type NumberAttribute = {
    readonly type: "number";
    readonly required?: boolean;
    readonly hidden?: boolean;
    readonly readOnly?: boolean;
    readonly get?: (val: number, item: any) => number | undefined;
    readonly set?: (val: number | undefined, item: any) => number | undefined;
    readonly default?: number | (() => number);
    readonly validate?: ((val: number) => boolean) | ((val: number) => void) | ((val: number) => string | void);
    readonly field?: string;
    readonly label?: string;
    readonly watch?: ReadonlyArray<string>;
}

type StringAttribute = {
    readonly type: "string";
    readonly required?: boolean;
    readonly hidden?: boolean;
    readonly readOnly?: boolean;
    readonly get?: (val: string, item: any) => string | undefined;
    readonly set?: (val: string | undefined, item: any) => string | undefined;
    readonly default?: string | (() => string);
    readonly validate?: ((val: string) => boolean) | ((val: string) => void) | ((val: string) => string | void);
    readonly field?: string;
    readonly label?: string;
    readonly watch?: ReadonlyArray<string>;
}

type EnumAttribute = {
    readonly type: ReadonlyArray<string>;
    readonly required?: boolean;
    readonly hidden?: boolean;
    readonly readOnly?: boolean;
    readonly get?: (val: string, item: any) => string | undefined;
    readonly set?: (val: string | undefined, item: any) => string | undefined;
    readonly default?: string | (() => string);
    readonly validate?: ((val: string) => boolean) | ((val: string) => void) | ((val: string) => string | void);
    readonly field?: string;
    readonly label?: string;
    readonly watch?: ReadonlyArray<string>;
}

type AnyAttribute = {
    readonly type: "any";
    readonly required?: boolean;
    readonly hidden?: boolean;
    readonly readOnly?: boolean;
    readonly get?: (val: any, item: any) => any | undefined;
    readonly set?: (val: any | undefined, item: any) => any | undefined;
    readonly default?: () => any;
    readonly validate?: ((val: any) => boolean) | ((val: any) => void) | ((val: any) => string | void);
    readonly field?: string;
    readonly label?: string;
    readonly watch?: ReadonlyArray<string>;
}

type Attribute = BooleanAttribute | NumberAttribute | StringAttribute | EnumAttribute | AnyAttribute;

type SecondaryIndex = {
    readonly index: string;
    readonly collection?: string;
    readonly pk: {
        readonly field: string;
        readonly composite: ReadonlyArray<string>;
        readonly template?: string;
    }
    readonly sk?: {
        readonly field: string;
        readonly composite: ReadonlyArray<string>;
        readonly template?: string;
    }
}

type IndexWithSortKey = {
    readonly sk: {
        readonly field: string;
        readonly composite: ReadonlyArray<string>;
        readonly template?: string;
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
                readonly composite: ReadonlyArray<F>;
                readonly template?: string;
            }
            readonly sk?: {
                readonly field: string;
                readonly composite: ReadonlyArray<F>;
                readonly template?: string;
            }
        }
    }
};

// type SchemaIdentifiers = {
//     readonly identifiers: {
//         readonly name: string;
//         readonly version: string;
//     }
// }
//
// type DefaultIdentifiers = {
//     readonly name: "__edb_e__"
//     readonly version: "__edb_v__"
// }
//
// type Identifiers<A extends string, F extends A, C extends string, S extends Schema<A,F,C>> =
//     S extends SchemaIdentifiers
//         ? S["identifiers"]
//         : DefaultIdentifiers;
//
// type EntityIdentifiers<E extends Entity<any, any, any, any>> =
//     E["schema"] extends SchemaIdentifiers
//         ? E["schema"]["identifiers"]
//         : DefaultIdentifiers;
//
// type EntityIdentifierItem<E extends Entity<any, any, any, any>> = {
//     [key in keyof EntityIdentifiers<E>]: {
//         [name in EntityIdentifiers<E>[key]]: string;
//     };
// }
//
// type IdentifierItem<A extends string, F extends A, C extends string, S extends Schema<A,F,C>> = {
//     [key in Identifiers<A,F,C,S>["name"] | Identifiers<A,F,C,S>["version"]]: string;
// }

type Item<A extends string, F extends A, C extends string, S extends Schema<A,F,C>> = {
    [a in keyof S["attributes"]]: S["attributes"][a]["type"] extends infer R
        ? R extends "string" ? string
            : R extends "number" ? number
                : R extends "boolean" ? boolean
                    : R extends ReadonlyArray<infer E> ? E
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

type HiddenAttributes<A extends string, F extends A, C extends string, S extends Schema<A,F,C>> = ExtractKeysOfValueType<{
    [a in keyof S["attributes"]]: S["attributes"][a]["hidden"] extends infer R
        ? R extends true
            ? true
            : false
        : never;
}, true>

type ReadOnlyAttributes<A extends string, F extends A, C extends string, S extends Schema<A,F,C>> = ExtractKeysOfValueType<{
    [a in keyof S["attributes"]]: S["attributes"][a]["readOnly"] extends infer R
        ? R extends true
            ? true
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

type PKCompositeAttributes<A extends string, F extends A, C extends string, S extends Schema<A,F,C>> = {
    [i in keyof S["indexes"]]: S["indexes"][i]["pk"]["composite"][number];
}

type SKCompositeAttributes<A extends string, F extends A, C extends string, S extends Schema<A,F,C>> = {
    [i in keyof S["indexes"]]: S["indexes"][i] extends IndexWithSortKey
        ? S["indexes"][i]["sk"]["composite"][number]
        : never;
}

type TableIndexPKCompositeAttributes<A extends string, F extends A, C extends string, S extends Schema<A,F,C>> = Pick<PKCompositeAttributes<A,F,C,S>, TableIndexName<A,F,C,S>>;

type TableIndexSKCompositeAttributes<A extends string, F extends A, C extends string, S extends Schema<A,F,C>> = Pick<SKCompositeAttributes<A,F,C,S>, TableIndexName<A,F,C,S>>;

type IndexPKCompositeAttributes<A extends string, F extends A, C extends string, S extends Schema<A,F,C>, I extends keyof S["indexes"]> = Pick<PKCompositeAttributes<A,F,C,S>, I>;

type IndexSKCompositeAttributes<A extends string, F extends A, C extends string, S extends Schema<A,F,C>, I extends keyof S["indexes"]> = Pick<SKCompositeAttributes<A,F,C,S>, I>;

type TableIndexPKAttributes<A extends string, F extends A, C extends string, S extends Schema<A,F,C>> = Pick<Item<A,F,C,S>, TableIndexPKCompositeAttributes<A,F,C,S>[TableIndexName<A,F,C,S>]>;

type TableIndexSKAttributes<A extends string, F extends A, C extends string, S extends Schema<A,F,C>> = TableIndexSKCompositeAttributes<A,F,C,S>[TableIndexName<A,F,C,S>] extends keyof S["attributes"]
    ? Pick<Item<A,F,C,S>, TableIndexSKCompositeAttributes<A,F,C,S>[TableIndexName<A,F,C,S>]>
    : Item<A,F,C,S>;

type IndexPKAttributes<A extends string, F extends A, C extends string, S extends Schema<A,F,C>, I extends keyof S["indexes"]> = Pick<Item<A,F,C,S>, IndexPKCompositeAttributes<A,F,C,S,I>[I]>;

type IndexSKAttributes<A extends string, F extends A, C extends string, S extends Schema<A,F,C>, I extends keyof S["indexes"]> = IndexSKCompositeAttributes<A,F,C,S,I>[I] extends keyof S["attributes"]
    ? Pick<Item<A,F,C,S>, IndexSKCompositeAttributes<A,F,C,S,I>[I]>
    : Item<A,F,C,S>;

type TableIndexCompositeAttributes<A extends string, F extends A, C extends string, S extends Schema<A,F,C>> = TableIndexPKAttributes<A,F,C,S> & Partial<TableIndexSKAttributes<A,F,C,S>>;

type AllTableIndexCompositeAttributes<A extends string, F extends A, C extends string, S extends Schema<A,F,C>> = TableIndexPKAttributes<A,F,C,S> & TableIndexSKAttributes<A,F,C,S>;

type IndexCompositeAttributes<A extends string, F extends A, C extends string, S extends Schema<A,F,C>, I extends keyof S["indexes"]> = IndexPKAttributes<A,F,C,S,I> & Partial<IndexSKAttributes<A,F,C,S,I>>;

type TableItem<A extends string, F extends A, C extends string, S extends Schema<A,F,C>> =
    AllTableIndexCompositeAttributes<A,F,C,S> &
    Pick<Item<A,F,C,S>, RequiredAttributes<A,F,C,S>> &
    Partial<Omit<Item<A,F,C,S>, RequiredAttributes<A,F,C,S>>>

type ResponseItem<A extends string, F extends A, C extends string, S extends Schema<A,F,C>> =
    Omit<TableItem<A,F,C,S>, HiddenAttributes<A,F,C,S>>

/* Seems to be a TypeScript defect? Can't add this type onto an Entity without it breaking Services */
// type PutItem<A extends string, F extends A, C extends string, S extends Schema<A,F,C>> =
//     (Pick<AllTableIndexCompositeAttributes<A,F,C,S>, RequiredPutCompositeAttributes<A,F,C,S>> & Partial<Omit<AllTableIndexCompositeAttributes<A,F,C,S>, RequiredPutCompositeAttributes<A,F,C,S>>>)
//     & (Pick<Item<A,F,C,S>, RequiredAttributes<A,F,C,S>> & Partial<Omit<Item<A,F,C,S>, RequiredAttributes<A,F,C,S>>>)

type RequiredPutItems<A extends string, F extends A, C extends string, S extends Schema<A,F,C>> = {
    [Attribute in keyof S["attributes"]]:
    "required" extends keyof S["attributes"][Attribute]
        ? true extends S["attributes"][Attribute]["required"]
            ? true
            : "default" extends keyof S["attributes"][Attribute]
                ? false
                : Attribute extends keyof TableIndexCompositeAttributes<A,F,C,S>
                    ? true
                    : false
    : "default" extends keyof S["attributes"][Attribute]
        ? false
        : Attribute extends keyof TableIndexCompositeAttributes<A,F,C,S>
            ? true
            : false
}

type PutItem<A extends string, F extends A, C extends string, S extends Schema<A,F,C>> =
    Pick<Item<A,F,C,S>, ExtractKeysOfValueType<RequiredPutItems<A,F,C,S>,true>>
    & Partial<Item<A,F,C,S>>

type SetItem<A extends string, F extends A, C extends string, S extends Schema<A,F,C>> =
    Omit<
        Omit<Partial<TableItem<A,F,C,S>>, keyof AllTableIndexCompositeAttributes<A,F,C,S>>,
        ReadOnlyAttributes<A,F,C,S>
    >

export interface WhereAttributeSymbol<T> {
    [WhereSymbol]: void;
    _: T;
}

type WhereAttributes<A extends string, F extends A, C extends string, S extends Schema<A,F,C>, I extends Item<A,F,C,S>> = {
    [Attr in keyof I]: WhereAttributeSymbol<I[Attr]>
}

type WhereOperations<A extends string, F extends A, C extends string, S extends Schema<A,F,C>, I extends Item<A,F,C,S>> = {
    eq: <T, A extends WhereAttributeSymbol<T>>(attr: A, value: A["_"] extends infer V ? V: never) => string;
    ne: <T, A extends WhereAttributeSymbol<T>>(attr: A, value: A["_"] extends infer V ? V: never) => string;
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
    value: <T, A extends WhereAttributeSymbol<T>>(attr: A, value: A["_"] extends infer V ? V: never) => string;
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
    limit?: number;
}

interface ParamOptions {
    params?: object;
    table?: string;
}

interface PaginationOptions extends QueryOptions {
    pager?: "raw" | "item" | "named";
    limit?: number;
}

interface BulkOptions extends QueryOptions {
    lastEvaluatedKeyRaw?: boolean;
    concurrency?: number;
}

type OptionalDefaultEntityIdentifiers = {
    __edb_e__?: string;
    __edb_v__?: string;
}

type GoRecord<ResponseType, Options = QueryOptions> = (options?: Options) => Promise<ResponseType>;

type PageRecord<ResponseType, CompositeAttributes> = (page?: (CompositeAttributes & OptionalDefaultEntityIdentifiers) | null, options?: PaginationOptions) => Promise<[
    (CompositeAttributes & OptionalDefaultEntityIdentifiers) | null,
    ResponseType
]>;

type ParamRecord<Options = ParamOptions> = <P>(options?: Options) => P;

type RecordsActionOptions<A extends string, F extends A, C extends string, S extends Schema<A,F,C>, Items, IndexCompositeAttributes> = {
    go: GoRecord<Items>;
    params: ParamRecord;
    page: PageRecord<Items,IndexCompositeAttributes>;
    where: WhereClause<A,F,C,S,Item<A,F,C,S>,RecordsActionOptions<A,F,C,S,Items,IndexCompositeAttributes>>;
}

type SingleRecordOperationOptions<A extends string, F extends A, C extends string, S extends Schema<A,F,C>, ResponseType> = {
    go: GoRecord<ResponseType, QueryOptions>;
    params: ParamRecord<QueryOptions>;
    where: WhereClause<A,F,C,S,Item<A,F,C,S>,SingleRecordOperationOptions<A,F,C,S,ResponseType>>;
};

type BulkRecordOperationOptions<A extends string, F extends A, C extends string, S extends Schema<A,F,C>, ResponseType> = {
    go: GoRecord<ResponseType, BulkOptions>;
    params: ParamRecord<BulkOptions>;
};

type SetRecordActionOptions<A extends string, F extends A, C extends string, S extends Schema<A,F,C>, SetAttr,IndexCompositeAttributes,TableItem> = {
    go: GoRecord<TableItem>;
    params: ParamRecord;
    set: SetRecord<A,F,C,S, SetAttr,IndexCompositeAttributes,TableItem>;
    where: WhereClause<A,F,C,S,Item<A,F,C,S>,RecordsActionOptions<A,F,C,S,TableItem,IndexCompositeAttributes>>;
}

type SetRecord<A extends string, F extends A, C extends string, S extends Schema<A,F,C>, SetAttr,IndexCompositeAttributes,TableItem> = (properties: SetAttr) => SetRecordActionOptions<A,F,C,S, SetAttr,IndexCompositeAttributes,TableItem>;

type WhereClause<A extends string, F extends A, C extends string, S extends Schema<A,F,C>, I extends Item<A,F,C,S>, T> = (where: WhereCallback<A,F,C,S,I>) => T;

type QueryOperations<A extends string, F extends A, C extends string, S extends Schema<A,F,C>, CompositeAttributes, TableItem, IndexCompositeAttributes> = {
    between: (skCompositeAttributesStart: CompositeAttributes, skCompositeAttributesEnd: CompositeAttributes) => RecordsActionOptions<A,F,C,S, Array<TableItem>,IndexCompositeAttributes>;
    gt: (skCompositeAttributes: CompositeAttributes) => RecordsActionOptions<A,F,C,S, Array<TableItem>,IndexCompositeAttributes>;
    gte: (skCompositeAttributes: CompositeAttributes) => RecordsActionOptions<A,F,C,S, Array<TableItem>,IndexCompositeAttributes>;
    lt: (skCompositeAttributes: CompositeAttributes) => RecordsActionOptions<A,F,C,S, Array<TableItem>,IndexCompositeAttributes>;
    lte: (skCompositeAttributes: CompositeAttributes) => RecordsActionOptions<A,F,C,S, Array<TableItem>,IndexCompositeAttributes>;
    begins: (skCompositeAttributes: CompositeAttributes) => RecordsActionOptions<A,F,C,S, Array<TableItem>,IndexCompositeAttributes>;
    go: GoRecord<Array<TableItem>>;
    params: ParamRecord;
    page: PageRecord<Array<TableItem>,IndexCompositeAttributes>;
    where: WhereClause<A,F,C,S,Item<A,F,C,S>,RecordsActionOptions<A,F,C,S,Array<TableItem>,IndexCompositeAttributes>>
}

type Queries<A extends string, F extends A, C extends string, S extends Schema<A,F,C>> = {
    [I in keyof S["indexes"]]: <CompositeAttributes extends IndexCompositeAttributes<A,F,C,S,I>>(composite: CompositeAttributes) =>
        IndexSKAttributes<A,F,C,S,I> extends infer SK
            // If there is no SK, dont show query operations (when an empty array is provided)
            ? [keyof SK] extends [never]
                ? RecordsActionOptions<A,F,C,S, ResponseItem<A,F,C,S>[], AllTableIndexCompositeAttributes<A,F,C,S>>
                // If there is no SK, dont show query operations (When no PK is specified)
                : S["indexes"][I] extends IndexWithSortKey
                    ? QueryOperations<
                        A,F,C,S,
                        // Omit the composite attributes already provided
                        Omit<Partial<IndexSKAttributes<A,F,C,S,I>>, keyof CompositeAttributes>,
                        ResponseItem<A,F,C,S>,
                        AllTableIndexCompositeAttributes<A,F,C,S>
                        >
                    : RecordsActionOptions<A,F,C,S, ResponseItem<A,F,C,S>[], AllTableIndexCompositeAttributes<A,F,C,S>>
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

type ServiceConfiguration = {
    table?: string;
    client?: DocumentClient
};

export class Entity<A extends string, F extends A, C extends string, S extends Schema<A,F,C>> {
    readonly schema: S;
    constructor(schema: S, config?: EntityConfiguration);
    get(key: AllTableIndexCompositeAttributes<A,F,C,S>): SingleRecordOperationOptions<A,F,C,S, ResponseItem<A,F,C,S>>;
    get(key: AllTableIndexCompositeAttributes<A,F,C,S>[]): BulkRecordOperationOptions<A,F,C,S, [AllTableIndexCompositeAttributes<A,F,C,S>[], ResponseItem<A,F,C,S>[]]>;
    delete(key: AllTableIndexCompositeAttributes<A,F,C,S>): SingleRecordOperationOptions<A,F,C,S, ResponseItem<A,F,C,S>>;
    delete(key: AllTableIndexCompositeAttributes<A,F,C,S>[]): BulkRecordOperationOptions<A,F,C,S, AllTableIndexCompositeAttributes<A,F,C,S>[]>;
    update(key: AllTableIndexCompositeAttributes<A,F,C,S>): {
        set: SetRecord<A,F,C,S, SetItem<A,F,C,S>, TableIndexCompositeAttributes<A,F,C,S>, ResponseItem<A,F,C,S>>
    };
    patch(key: AllTableIndexCompositeAttributes<A,F,C,S>): {
        set: SetRecord<A,F,C,S, SetItem<A,F,C,S>, TableIndexCompositeAttributes<A,F,C,S>, ResponseItem<A,F,C,S>>
    };
    put(record: PutItem<A,F,C,S>): SingleRecordOperationOptions<A,F,C,S, ResponseItem<A,F,C,S>>;
    put(record: PutItem<A,F,C,S>[]): BulkRecordOperationOptions<A,F,C,S, AllTableIndexCompositeAttributes<A,F,C,S>[]>;
    create(record: PutItem<A,F,C,S>): SingleRecordOperationOptions<A,F,C,S, ResponseItem<A,F,C,S>>;
    find(record: Partial<Item<A,F,C,S>>): RecordsActionOptions<A,F,C,S, ResponseItem<A,F,C,S>[], AllTableIndexCompositeAttributes<A,F,C,S>>;
    setIdentifier(type: "entity" | "version", value: string): void;
    scan: RecordsActionOptions<A,F,C,S, ResponseItem<A,F,C,S>[], TableIndexCompositeAttributes<A,F,C,S>>
    query: Queries<A,F,C,S>;
}

type AllCollectionNames<E extends {[name: string]: Entity<any, any, any, any>}> = {
    [Name in keyof E]:
    E[Name] extends Entity<infer A, infer F, infer C, infer S>
        ? {
            [Collection in keyof EntityCollections<A,F,C,S>]: Collection
        }[keyof EntityCollections<A,F,C,S>]
        : never
}[keyof E];

type AttributeType<T extends "string" | "number" | "boolean" | "any" | ReadonlyArray<any>> =
    T extends "string" ? string
        : T extends "number" ? number
        : T extends "boolean" ? boolean
        : T extends ReadonlyArray<infer E> ? E
        : T extends "any" ? any
        : never;

type AllEntityAttributeNames<E extends {[name: string]: Entity<any, any, any, any>}> = {
    [Name in keyof E]: {
        [A in keyof E[Name]["schema"]["attributes"]]: A
    }[keyof E[Name]["schema"]["attributes"]]
}[keyof E];

type AllEntityAttributes<E extends {[name: string]: Entity<any, any, any, any>}> = {
    [Attr in AllEntityAttributeNames<E>]: {
        [Name in keyof E]: Attr extends keyof E[Name]["schema"]["attributes"]
            ? AttributeType<E[Name]["schema"]["attributes"][Attr]["type"]>
            : never
    }[keyof E];
};

type CollectionAssociations<E extends {[name: string]: Entity<any, any, any, any>}> = {
    [Collection in AllCollectionNames<E>]: {
        [Name in keyof E]: E[Name] extends Entity<infer A, infer F, infer C, infer S>
            ? Collection extends keyof EntityCollections<A,F,C,S>
                ? Name
                : never
            : never
    }[keyof E];
}

type CollectionAttributes<E extends {[name: string]: Entity<any, any, any, any>}, Collections extends CollectionAssociations<E>> = {
    [Collection in keyof Collections]: {
        [EntityName in keyof E]: E[EntityName] extends Entity<infer A, infer F, infer C, infer S>
            ? EntityName extends Collections[Collection]
                ? keyof S["attributes"]
                : never
            : never
    }[keyof E]
}

type CollectionWhereOperations = {
    eq: <T, A extends WhereAttributeSymbol<T>>(attr: A, value: A["_"] extends infer V ? V: never) => string;
    ne: <T, A extends WhereAttributeSymbol<T>>(attr: A, value: A["_"] extends infer V ? V: never) => string;
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
    value: <T, A extends WhereAttributeSymbol<T>>(attr: A, value: A["_"] extends infer V ? V: never) => string;
    name: <T, A extends WhereAttributeSymbol<T>>(attr: A) => string;
}

type CollectionWhereCallback<E extends {[name: string]: Entity<any, any, any, any>}, I extends Partial<AllEntityAttributes<E>>> =
    <W extends {[A in keyof I]: WhereAttributeSymbol<I[A]>}>(attributes: W, operations: CollectionWhereOperations) => string;

type CollectionWhereClause<E extends {[name: string]: Entity<any, any, any, any>}, A extends string, F extends A, C extends string, S extends Schema<A,F,C>, I extends Partial<AllEntityAttributes<E>>, T> = (where: CollectionWhereCallback<E, I>) => T;

type WhereRecordsActionOptions<E extends {[name: string]: Entity<any, any, any, any>}, A extends string, F extends A, C extends string, S extends Schema<A,F,C>, I extends Partial<AllEntityAttributes<E>>, Items, IndexCompositeAttributes> = {
    go: GoRecord<Items>;
    params: ParamRecord;
    page: PageRecord<Items,IndexCompositeAttributes>;
    where: CollectionWhereClause<E,A,F,C,S,I, WhereRecordsActionOptions<E,A,F,C,S,I,Items,IndexCompositeAttributes>>;
}

type CollectionIndexKeys<Entities extends {[name: string]: Entity<any, any, any, any>}, Collections extends CollectionAssociations<Entities>> = {
    [Collection in keyof Collections]: {
        [EntityResultName in Collections[Collection]]:
            EntityResultName extends keyof Entities
                ? Entities[EntityResultName] extends Entity<infer A, infer F, infer C, infer S>
                    ? keyof TableIndexCompositeAttributes<A, F, C, S>
                    : never
                : never
    }[Collections[Collection]]
}

type CollectionPageKeys<Entities extends {[name: string]: Entity<any, any, any, any>}, Collections extends CollectionAssociations<Entities>> = {
    [Collection in keyof Collections]: {
        [EntityResultName in Collections[Collection]]:
            EntityResultName extends keyof Entities
                ? Entities[EntityResultName] extends Entity<infer A, infer F, infer C, infer S>
                    ? keyof Parameters<Entities[EntityResultName]["query"][
                        Collection extends keyof EntityCollections<A,F,C,S>
                            ? EntityCollections<A,F,C,S>[Collection]
                            : never
                    ]>[0]
                    : never
                : never
    }[Collections[Collection]]
}

type CollectionIndexAttributes<Entities extends {[name: string]: Entity<any, any, any, any>}, Collections extends CollectionAssociations<Entities>> = {
    [Collection in keyof CollectionIndexKeys<Entities, Collections>]: {
        [key in CollectionIndexKeys<Entities, Collections>[Collection]]:
            key extends keyof AllEntityAttributes<Entities>
                ? AllEntityAttributes<Entities>[key]
                : never
    }
}

type CollectionPageAttributes<Entities extends {[name: string]: Entity<any, any, any, any>}, Collections extends CollectionAssociations<Entities>> = {
    [Collection in keyof CollectionPageKeys<Entities, Collections>]: {
        [key in CollectionPageKeys<Entities, Collections>[Collection]]:
            key extends keyof AllEntityAttributes<Entities>
                ? AllEntityAttributes<Entities>[key]
                : never
    }
}

type OptionalPropertyNames<T> =
    { [K in keyof T]: undefined extends T[K] ? K : never }[keyof T];

// Common properties from L and R with undefined in R[K] replaced by type in L[K]
type SpreadProperties<L, R, K extends keyof L & keyof R> =
    { [P in K]: L[P] | Exclude<R[P], undefined> };

type Id<T> = {[K in keyof T]: T[K]} // see note at bottom*

// Type of { ...L, ...R }
type Spread<L, R> = Id<
    // Properties in L that don't exist in R
    & Pick<L, Exclude<keyof L, keyof R>>
    // Properties in R with types that exclude undefined
    & Pick<R, Exclude<keyof R, OptionalPropertyNames<R>>>
    // Properties in R, with types that include undefined, that don't exist in L
    & Pick<R, Exclude<OptionalPropertyNames<R>, keyof L>>
    // Properties in R, with types that include undefined, that exist in L
    & SpreadProperties<L, R, OptionalPropertyNames<R> & keyof L>
    >;

type CollectionQueries<E extends {[name: string]: Entity<any, any, any, any>}, Collections extends CollectionAssociations<E>> = {
    [Collection in keyof Collections]: {
        [EntityName in keyof E]:
            EntityName extends Collections[Collection]
                ? (params:
                       RequiredProperties<
                           Parameters<
                               E[EntityName]["query"][
                                   E[EntityName] extends Entity<infer A, infer F, infer C, infer S>
                                       ? Collection extends keyof EntityCollections<A,F,C,S>
                                        ? EntityCollections<A,F,C,S>[Collection]
                                        : never
                                       : never
                               ]
                           >[0]
                       >) => {
                    go: GoRecord<{
                        [EntityResultName in Collections[Collection]]:
                            EntityResultName extends keyof E
                                ? E[EntityResultName] extends Entity<infer A, infer F, infer C, infer S>
                                    ? ResponseItem<A,F,C,S>[]
                                    : never
                                : never
                    }>;
                    params: ParamRecord;
                    page: {
                        [EntityResultName in Collections[Collection]]: EntityResultName extends keyof E
                            ? Pick<AllEntityAttributes<E>, Extract<AllEntityAttributeNames<E>, CollectionAttributes<E,Collections>[Collection]>> extends Partial<AllEntityAttributes<E>>
                                ?
                                    PageRecord<
                                        {
                                            [EntityResultName in Collections[Collection]]:
                                            EntityResultName extends keyof E
                                                ? E[EntityResultName] extends Entity<infer A, infer F, infer C, infer S>
                                                    ? ResponseItem<A,F,C,S>[]
                                                    : never
                                                : never
                                        },
                                        Partial<
                                            Spread<
                                                Collection extends keyof CollectionPageAttributes<E, Collections>
                                                    ? CollectionPageAttributes<E, Collections>[Collection]
                                                    : {},
                                                Collection extends keyof CollectionIndexAttributes<E, Collections>
                                                    ? CollectionIndexAttributes<E, Collections>[Collection]
                                                    : {}
                                            >
                                        >
                                    >
                                : never
                            : never
                    }[Collections[Collection]];
                    where: {
                        [EntityResultName in Collections[Collection]]: EntityResultName extends keyof E
                                ? E[EntityResultName] extends Entity<infer A, infer F, infer C, infer S>
                                    ? Pick<AllEntityAttributes<E>, Extract<AllEntityAttributeNames<E>, CollectionAttributes<E,Collections>[Collection]>> extends Partial<AllEntityAttributes<E>>
                                        ? CollectionWhereClause<E,A,F,C,S,
                                            Pick<AllEntityAttributes<E>, Extract<AllEntityAttributeNames<E>, CollectionAttributes<E,Collections>[Collection]>>,
                                            WhereRecordsActionOptions<E,A,F,C,S,
                                                Pick<AllEntityAttributes<E>, Extract<AllEntityAttributeNames<E>, CollectionAttributes<E,Collections>[Collection]>>,
                                                    {
                                                        [EntityResultName in Collections[Collection]]:
                                                            EntityResultName extends keyof E
                                                                ? E[EntityResultName] extends Entity<infer A, infer F, infer C, infer S>
                                                                    ? ResponseItem<A,F,C,S>[]
                                                                    : never
                                                                : never
                                                    },
                                                    Partial<
                                                        Spread<
                                                            Collection extends keyof CollectionPageAttributes<E, Collections>
                                                                ? CollectionPageAttributes<E, Collections>[Collection]
                                                                : {},
                                                            Collection extends keyof CollectionIndexAttributes<E, Collections>
                                                                ? CollectionIndexAttributes<E, Collections>[Collection]
                                                                : {}
                                                            >
                                                    >
                                                >>
                                        : never
                                    : never
                                : never
                    }[Collections[Collection]];
                }
                : never
    }[keyof E];
}

type RequiredProperties<T> = Pick<T, {[K in keyof T]-?: {} extends Pick<T, K> ? never : K }[keyof T]>

export class Service<E extends {[name: string]: Entity<any, any, any, any>}> {
    entities: E;
    collections: CollectionQueries<E, CollectionAssociations<E>>
    constructor(entities: E, config?: ServiceConfiguration);
}

export type EntityItem<E extends Entity<any, any, any, any>> =
    E extends Entity<infer A, infer F, infer C, infer S>
        ? ResponseItem<A, F, C, S>
        : never;

export type CreateEntityItem<E extends Entity<any, any, any, any>> =
    E extends Entity<infer A, infer F, infer C, infer S>
        ? PutItem<A, F, C, S>
        : never;

export type UpdateEntityItem<E extends Entity<any, any, any, any>> =
    E extends Entity<infer A, infer F, infer C, infer S>
        ? SetItem<A, F, C, S>
        : never;