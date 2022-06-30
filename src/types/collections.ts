import { Entity } from '../entity';
import {
    GoRecord,
    ParamRecord,
    PageRecord,
} from './options';
import {
  EntityCollections,
  ItemAttribute,
  ResponseItem,
  Schema,
  TableIndexCompositeAttributes,
} from './schema';
import {
  WhereAttributeSymbol
} from './where';

type AllCollectionNames<E extends {[name: string]: Entity<any, any, any, any>}> = {
  [Name in keyof E]:
  E[Name] extends Entity<infer A, infer F, infer C, infer S>
      ? {
          [Collection in keyof EntityCollections<A,F,C,S>]: Collection
      }[keyof EntityCollections<A,F,C,S>]
      : never
}[keyof E];

type AllEntityAttributeNames<E extends {[name: string]: Entity<any, any, any, any>}> = {
  [Name in keyof E]: {
      [A in keyof E[Name]["schema"]["attributes"]]: A
  }[keyof E[Name]["schema"]["attributes"]]
}[keyof E];

type AllEntityAttributes<E extends {[name: string]: Entity<any, any, any, any>}> = {
  [Attr in AllEntityAttributeNames<E>]: {
      [Name in keyof E]: Attr extends keyof E[Name]["schema"]["attributes"]
          ? ItemAttribute<E[Name]["schema"]["attributes"][Attr]>
          : never
  }[keyof E];
};

export type CollectionAssociations<E extends {[name: string]: Entity<any, any, any, any>}> = {
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

interface CollectionWhereOperations {
  eq: <T, A extends WhereAttributeSymbol<T>>(attr: A, value: T) => string;
  ne: <T, A extends WhereAttributeSymbol<T>>(attr: A, value: T) => string;
  gt: <T, A extends WhereAttributeSymbol<T>>(attr: A, value: T) => string;
  lt: <T, A extends WhereAttributeSymbol<T>>(attr: A, value: T) => string;
  gte: <T, A extends WhereAttributeSymbol<T>>(attr: A, value: T) => string;
  lte: <T, A extends WhereAttributeSymbol<T>>(attr: A, value: T) => string;
  between: <T, A extends WhereAttributeSymbol<T>>(attr: A, value: T, value2: T) => string;
  begins: <T, A extends WhereAttributeSymbol<T>>(attr: A, value: T) => string;
  exists: <T, A extends WhereAttributeSymbol<T>>(attr: A) => string;
  notExists: <T, A extends WhereAttributeSymbol<T>>(attr: A) => string;
  contains: <T, A extends WhereAttributeSymbol<T>>(attr: A, value: T) => string;
  notContains: <T, A extends WhereAttributeSymbol<T>>(attr: A, value: T) => string;
  value: <T, A extends WhereAttributeSymbol<T>>(attr: A, value: T) => string;
  name: <T, A extends WhereAttributeSymbol<T>>(attr: A) => string;
}

type CollectionWhereCallback<E extends {[name: string]: Entity<any, any, any, any>}, I extends Partial<AllEntityAttributes<E>>> =
    <W extends {[A in keyof I]: WhereAttributeSymbol<I[A]>}>(attributes: W, operations: CollectionWhereOperations) => string;

type CollectionWhereClause<E extends {[name: string]: Entity<any, any, any, any>}, A extends string, F extends string, C extends string, S extends Schema<A,F,C>, I extends Partial<AllEntityAttributes<E>>, T> = (where: CollectionWhereCallback<E, I>) => T;

interface WhereRecordsActionOptions<E extends {[name: string]: Entity<any, any, any, any>}, A extends string, F extends string, C extends string, S extends Schema<A,F,C>, I extends Partial<AllEntityAttributes<E>>, Items, IndexCompositeAttributes> {
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

type RequiredProperties<T> = Pick<T, {[K in keyof T]-?: {} extends Pick<T, K> ? never : K }[keyof T]>

export type CollectionQueries<E extends {[name: string]: Entity<any, any, any, any>}, Collections extends CollectionAssociations<E>> = {
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