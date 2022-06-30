import {Schema, Item, UpdateData} from './schema';

declare const WhereSymbol: unique symbol;
declare const UpdateDataSymbol: unique symbol;

export type WhereAttributeSymbol<T extends any> =
    { [WhereSymbol]: void }
    & T extends string ? T
        : T extends number ? T
        : T extends boolean ? T
        : T extends {[key: string]: any}
            ? {[key in keyof T]: WhereAttributeSymbol<T[key]>}
            : T extends ReadonlyArray<infer A>
                ? ReadonlyArray<WhereAttributeSymbol<A>>
                : T extends Array<infer I>
                    ? Array<WhereAttributeSymbol<I>>
                    : T

export type WhereAttributes<A extends string, F extends string, C extends string, S extends Schema<A,F,C>, I extends Item<A,F,C,S,S["attributes"]>> = {
    [Attr in keyof I]: WhereAttributeSymbol<I[Attr]>
}

export type DataUpdateAttributeSymbol<T extends any> = 
    { [UpdateDataSymbol]: void } 
    & T extends string ? T
    : T extends number ? T
    : T extends boolean ? T
    : T extends {[key: string]: any}
        ? {[key in keyof T]: DataUpdateAttributeSymbol<T[key]>}
            : T extends ReadonlyArray<infer A>
                ? ReadonlyArray<DataUpdateAttributeSymbol<A>>
                : T extends Array<infer I>
                    ? Array<DataUpdateAttributeSymbol<I>>
                    : [T] extends [never]
                        ? never
                        : T

type DataUpdateAttributeValues<A extends DataUpdateAttributeSymbol<any>> =
    A extends DataUpdateAttributeSymbol<infer T>
        ? T extends string ? T
        : T extends number ? T
        : T extends boolean ? T
        : T extends {[key: string]: any}
        ? {[key in keyof T]?: DataUpdateAttributeValues<T[key]>}
        : T extends ReadonlyArray<infer A> ? ReadonlyArray<DataUpdateAttributeValues<A>>
        : T extends Array<infer I> ? Array<DataUpdateAttributeValues<I>>
        : [T] extends [never]
        ? never
        : T
    : never

export type DataUpdateAttributes<A extends string, F extends string, C extends string, S extends Schema<A,F,C>, I extends UpdateData<A,F,C,S>> = {
    [Attr in keyof I]: DataUpdateAttributeSymbol<I[Attr]>
}

export interface WhereOperations<A extends string, F extends string, C extends string, S extends Schema<A,F,C>, I extends Item<A,F,C,S,S["attributes"]>> {
    eq: <T, A extends WhereAttributeSymbol<T>>(attr: A, value: T) => string;
    ne: <T, A extends WhereAttributeSymbol<T>>(attr: A, value: T) => string;
    gt: <T, A extends WhereAttributeSymbol<T>>(attr: A, value: T) => string;
    lt: <T, A extends WhereAttributeSymbol<T>>(attr: A, value: T) => string;
    gte: <T, A extends WhereAttributeSymbol<T>>(attr: A, value: T) => string;
    lte: <T, A extends WhereAttributeSymbol<T>>(attr: A, value: T) => string;
    between: <T, A extends WhereAttributeSymbol<T>>(attr: A, value: T, value2: T) => string;
    begins: <T, A extends WhereAttributeSymbol<T>>(attr: A, value: T) => string;
    exists: <A extends WhereAttributeSymbol<any>>(attr: A) => string;
    notExists: <A extends WhereAttributeSymbol<any>>(attr: A) => string;
    contains: <T, A extends WhereAttributeSymbol<T>>(attr: A, value: T) => string;
    notContains: <T, A extends WhereAttributeSymbol<T>>(attr: A, value: T) => string;
    value: <T, A extends WhereAttributeSymbol<T>>(attr: A, value: A extends WhereAttributeSymbol<infer V> ? V : never) => A extends WhereAttributeSymbol<infer V> ? V : never;
    name: <A extends WhereAttributeSymbol<any>>(attr: A) => string;
};

export interface DataUpdateOperations<A extends string, F extends string, C extends string, S extends Schema<A,F,C>, I extends UpdateData<A,F,C,S>> {
    set: <T, A extends DataUpdateAttributeSymbol<T>>(attr: A, value: DataUpdateAttributeValues<A>) => any;
    remove: <T, A extends DataUpdateAttributeSymbol<T>>(attr: [T] extends [never] ? never : A) => any;
    append: <T, A extends DataUpdateAttributeSymbol<T>>(attr: A, value: DataUpdateAttributeValues<A> extends Array<any> ? DataUpdateAttributeValues<A> : never) => any;
    add: <T, A extends DataUpdateAttributeSymbol<T>>(attr: A, value: A extends DataUpdateAttributeSymbol<infer V> ? V extends number | Array<any> ? V : [V] extends [any] ? V : never : never ) => any;
    subtract: <T, A extends DataUpdateAttributeSymbol<T>>(attr: A, value: A extends DataUpdateAttributeSymbol<infer V> ? V extends number ? V : [V] extends [any] ? V : never : never ) => any;
    delete: <T, A extends DataUpdateAttributeSymbol<T>>(attr: A, value: A extends DataUpdateAttributeSymbol<infer V> ? V extends Array<any> ? V : [V] extends [any] ? V : never : never ) => any;
    del:    <T, A extends DataUpdateAttributeSymbol<T>>(attr: A, value: A extends DataUpdateAttributeSymbol<infer V> ? V extends Array<any> ? V : never : never ) => any;
    value: <T, A extends DataUpdateAttributeSymbol<T>>(attr: A, value: DataUpdateAttributeValues<A>) => Required<DataUpdateAttributeValues<A>>;
    name: <T, A extends DataUpdateAttributeSymbol<T>>(attr: A) => any;
    ifNotExists: <T, A extends DataUpdateAttributeSymbol<T>>(attr: A, value: DataUpdateAttributeValues<A>) => any;
};

export type WhereCallback<A extends string, F extends string, C extends string, S extends Schema<A,F,C>, I extends Item<A,F,C,S,S["attributes"]>> =
    <W extends WhereAttributes<A,F,C,S,I>>(attributes: W, operations: WhereOperations<A,F,C,S,I>) => string;

export type DataUpdateCallback<A extends string, F extends string, C extends string, S extends Schema<A,F,C>, I extends UpdateData<A,F,C,S>> =
    <W extends DataUpdateAttributes<A,F,C,S,I>>(attributes: W, operations: DataUpdateOperations<A,F,C,S,I>) => any;

export type WhereClause<A extends string, F extends string, C extends string, S extends Schema<A,F,C>, I extends Item<A,F,C,S,S["attributes"]>, T> = (where: WhereCallback<A,F,C,S,I>) => T;

export type DataUpdateMethod<A extends string, F extends string, C extends string, S extends Schema<A,F,C>, I extends UpdateData<A,F,C,S>, T> = (update: DataUpdateCallback<A,F,C,S,I>) => T;