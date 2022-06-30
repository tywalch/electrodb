import {
  GoRecord,
  ParamRecord,
  QueryOptions,
  PageRecord,
  PutQueryOptions,
  UpdateQueryOptions,
  UpdateQueryParams,
  DeleteQueryOptions,
  BulkOptions,
  BatchGoRecord
} from './options';
import {
  WhereClause, 
  DataUpdateMethod,
} from './where';

import {
  AllTableIndexCompositeAttributes, 
  IndexCompositeAttributes, 
  ResponseItem, 
  IndexWithSortKey, 
  IndexSKAttributes, 
  Item, 
  Schema, 
  SetItem, 
  UpdateData, 
  AddItem, 
  SubtractItem, 
  AppendItem, 
  DeleteItem,
} from './schema';


export interface RecordsActionOptions<A extends string, 
F extends string, C extends string, S extends Schema<A,F,C>, Items, IndexCompositeAttributes> {
  go: GoRecord<Items>;
  params: ParamRecord;
  page: PageRecord<Items,IndexCompositeAttributes>;
  where: WhereClause<A,F,C,S,Item<A,F,C,S,S["attributes"]>,RecordsActionOptions<A,F,C,S,Items,IndexCompositeAttributes>>;
}

export interface SingleRecordOperationOptions<A extends string, F extends string, C extends string, S extends Schema<A,F,C>, ResponseType> {
  go: GoRecord<ResponseType, QueryOptions>;
  params: ParamRecord<QueryOptions>;
  where: WhereClause<A,F,C,S,Item<A,F,C,S,S["attributes"]>,SingleRecordOperationOptions<A,F,C,S,ResponseType>>;
};

export interface PutRecordOperationOptions<A extends string, F extends string, C extends string, S extends Schema<A,F,C>, ResponseType> {
  go: GoRecord<ResponseType, PutQueryOptions>;
  params: ParamRecord<PutQueryOptions>;
  where: WhereClause<A,F,C,S,Item<A,F,C,S,S["attributes"]>,PutRecordOperationOptions<A,F,C,S,ResponseType>>;
};

export interface UpdateRecordOperationOptions<A extends string, F extends string, C extends string, S extends Schema<A,F,C>, ResponseType> {
  go: GoRecord<ResponseType, UpdateQueryOptions>;
  params: ParamRecord<UpdateQueryParams>;
  where: WhereClause<A,F,C,S,Item<A,F,C,S,S["attributes"]>,PutRecordOperationOptions<A,F,C,S,ResponseType>>;
};

export interface DeleteRecordOperationOptions<A extends string, F extends string, C extends string, S extends Schema<A,F,C>, ResponseType> {
  go: GoRecord<ResponseType, DeleteQueryOptions>;
  params: ParamRecord<DeleteQueryOptions>;
  where: WhereClause<A,F,C,S,Item<A,F,C,S,S["attributes"]>,DeleteRecordOperationOptions<A,F,C,S,ResponseType>>;
};

export interface BulkRecordOperationOptions<A extends string, F extends string, C extends string, S extends Schema<A,F,C>, ResponseType, AlternateResponseType> {
  go: BatchGoRecord<ResponseType, AlternateResponseType>;
  params: ParamRecord<BulkOptions>;
};

interface SetRecordActionOptions<A extends string, F extends string, C extends string, S extends Schema<A,F,C>, SetAttr,IndexCompositeAttributes,TableItem> {
  go: GoRecord<Partial<TableItem>, UpdateQueryOptions>;
  params: ParamRecord<UpdateQueryParams>;
  set: SetRecord<A,F,C,S, SetItem<A,F,C,S>,IndexCompositeAttributes,TableItem>;
  remove: SetRecord<A,F,C,S, Array<keyof SetItem<A,F,C,S>>,IndexCompositeAttributes,TableItem>;
  add: SetRecord<A,F,C,S, AddItem<A,F,C,S>,IndexCompositeAttributes,TableItem>;
  subtract: SetRecord<A,F,C,S, SubtractItem<A,F,C,S>,IndexCompositeAttributes,TableItem>;
  append: SetRecord<A,F,C,S, AppendItem<A,F,C,S>,IndexCompositeAttributes,TableItem>;
  delete: SetRecord<A,F,C,S, DeleteItem<A,F,C,S>,IndexCompositeAttributes,TableItem>;
  data: DataUpdateMethodRecord<A,F,C,S, Item<A,F,C,S,S["attributes"]>,IndexCompositeAttributes,TableItem>;
  where: WhereClause<A,F,C,S, Item<A,F,C,S,S["attributes"]>,SetRecordActionOptions<A,F,C,S,SetAttr,IndexCompositeAttributes,TableItem>>;
}

export type SetRecord<A extends string, F extends string, C extends string, S extends Schema<A,F,C>, SetAttr, IndexCompositeAttributes, TableItem> = (properties: SetAttr) => SetRecordActionOptions<A,F,C,S, SetAttr, IndexCompositeAttributes, TableItem>;
export type RemoveRecord<A extends string, F extends string, C extends string, S extends Schema<A,F,C>, RemoveAttr, IndexCompositeAttributes, TableItem> = (properties: RemoveAttr) => SetRecordActionOptions<A,F,C,S, RemoveAttr, IndexCompositeAttributes, TableItem>;

export type DataUpdateMethodRecord<A extends string, F extends string, C extends string, S extends Schema<A,F,C>, SetAttr, IndexCompositeAttributes, TableItem> =
    DataUpdateMethod<A,F,C,S, UpdateData<A,F,C,S>, SetRecordActionOptions<A,F,C,S, SetAttr, IndexCompositeAttributes, TableItem>>

interface QueryOperations<A extends string, F extends string, C extends string, S extends Schema<A,F,C>, CompositeAttributes, TableItem, IndexCompositeAttributes> {
  between: (skCompositeAttributesStart: CompositeAttributes, skCompositeAttributesEnd: CompositeAttributes) => RecordsActionOptions<A,F,C,S, Array<TableItem>,IndexCompositeAttributes>;
  gt: (skCompositeAttributes: CompositeAttributes) => RecordsActionOptions<A,F,C,S, Array<TableItem>,IndexCompositeAttributes>;
  gte: (skCompositeAttributes: CompositeAttributes) => RecordsActionOptions<A,F,C,S, Array<TableItem>,IndexCompositeAttributes>;
  lt: (skCompositeAttributes: CompositeAttributes) => RecordsActionOptions<A,F,C,S, Array<TableItem>,IndexCompositeAttributes>;
  lte: (skCompositeAttributes: CompositeAttributes) => RecordsActionOptions<A,F,C,S, Array<TableItem>,IndexCompositeAttributes>;
  begins: (skCompositeAttributes: CompositeAttributes) => RecordsActionOptions<A,F,C,S, Array<TableItem>,IndexCompositeAttributes>;
  go: GoRecord<Array<TableItem>>;
  params: ParamRecord;
  page: PageRecord<Array<TableItem>,IndexCompositeAttributes>;
  where: WhereClause<A,F,C,S,Item<A,F,C,S,S["attributes"]>,RecordsActionOptions<A,F,C,S,Array<TableItem>,IndexCompositeAttributes>>
}

export type Queries<A extends string, F extends string, C extends string, S extends Schema<A,F,C>> = {
  [I in keyof S["indexes"]]: <CompositeAttributes extends IndexCompositeAttributes<A,F,C,S,I>>(composite: CompositeAttributes) =>
      IndexSKAttributes<A,F,C,S,I> extends infer SK
          // If there is no SK, dont show query operations (when an empty array is provided)
          ? [keyof SK] extends [never]
              ? RecordsActionOptions<A,F,C,S, ResponseItem<A,F,C,S>[], AllTableIndexCompositeAttributes<A,F,C,S> & Required<CompositeAttributes>>
              // If there is no SK, dont show query operations (When no PK is specified)
              : S["indexes"][I] extends IndexWithSortKey
                  ? QueryOperations<
                      A,F,C,S,
                      // Omit the composite attributes already provided
                      Omit<Partial<IndexSKAttributes<A,F,C,S,I>>, keyof CompositeAttributes>,
                      ResponseItem<A,F,C,S>,
                      AllTableIndexCompositeAttributes<A,F,C,S> & Required<CompositeAttributes> & SK
                      >
                  : RecordsActionOptions<A,F,C,S, ResponseItem<A,F,C,S>[], AllTableIndexCompositeAttributes<A,F,C,S> & Required<CompositeAttributes> & SK>
          : never
}

export type ParseSingleInput = {
  Item?: {[key: string]: any}
} | {
  Attributes?: {[key: string]: any}
} | null;

export type ParseMultiInput = {
  Items?: {[key: string]: any}[]
}

