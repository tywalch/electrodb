import {
  ParseOptions
} from './types/options';
import {
  TableIndexCompositeAttributes,
  AllTableIndexCompositeAttributes, 
  ResponseItem, 
  Item, 
  Schema, 
  SetItem, 
  AddItem, 
  SubtractItem, 
  AppendItem, 
  DeleteItem,
  RemoveItem,
  PutItem,
} from './types/schema';

import {
  Queries,
  SetRecord,
  RemoveRecord,
  DataUpdateMethodRecord,
  RecordsActionOptions,
  SingleRecordOperationOptions,
  BulkRecordOperationOptions,
  DeleteRecordOperationOptions,
  PutRecordOperationOptions,
  ParseSingleInput,
  ParseMultiInput
} from './types/model';

import { ElectroEventListener } from './types/events';
import { DocumentClient } from './types/client';

export type Resolve<T> = T extends Function | string | number | boolean
    ? T : {[Key in keyof T]: Resolve<T[Key]>}

export type EntityConfiguration = {
  table?: string;
  client?: DocumentClient;
  listeners?: Array<ElectroEventListener>;
  logger?: ElectroEventListener;
};

export class Entity<A extends string, F extends string, C extends string, S extends Schema<A,F,C>> {
  readonly schema: S;
  private config?: EntityConfiguration; 
  constructor(schema: S, config?: EntityConfiguration);

  get(key: AllTableIndexCompositeAttributes<A,F,C,S>): SingleRecordOperationOptions<A,F,C,S, ResponseItem<A,F,C,S> | null>;
  get(key: AllTableIndexCompositeAttributes<A,F,C,S>[]): BulkRecordOperationOptions<A,F,C,S, [Array<Resolve<ResponseItem<A,F,C,S>>>, Array<Resolve<AllTableIndexCompositeAttributes<A,F,C,S>>>], [Array<Resolve<ResponseItem<A,F,C,S>> | null>, Array<Resolve<AllTableIndexCompositeAttributes<A,F,C,S>>>]>;

  delete(key: AllTableIndexCompositeAttributes<A,F,C,S>): DeleteRecordOperationOptions<A,F,C,S, ResponseItem<A,F,C,S>>;
  delete(key: AllTableIndexCompositeAttributes<A,F,C,S>[]): BulkRecordOperationOptions<A,F,C,S, AllTableIndexCompositeAttributes<A,F,C,S>[], AllTableIndexCompositeAttributes<A,F,C,S>[]>;

  put(record: PutItem<A,F,C,S>): PutRecordOperationOptions<A,F,C,S, ResponseItem<A,F,C,S>>;
  put(record: PutItem<A,F,C,S>[]): BulkRecordOperationOptions<A,F,C,S, AllTableIndexCompositeAttributes<A,F,C,S>[], AllTableIndexCompositeAttributes<A,F,C,S>[]>;

  remove(key: AllTableIndexCompositeAttributes<A,F,C,S>): DeleteRecordOperationOptions<A,F,C,S, ResponseItem<A,F,C,S>>
  update(key: AllTableIndexCompositeAttributes<A,F,C,S>): {
      set: SetRecord<A,F,C,S, SetItem<A,F,C,S>, TableIndexCompositeAttributes<A,F,C,S>, ResponseItem<A,F,C,S>>;
      remove: RemoveRecord<A,F,C,S, RemoveItem<A,F,C,S>, TableIndexCompositeAttributes<A,F,C,S>, ResponseItem<A,F,C,S>>;
      add: SetRecord<A,F,C,S, AddItem<A,F,C,S>, TableIndexCompositeAttributes<A,F,C,S>, ResponseItem<A,F,C,S>>;
      subtract: SetRecord<A,F,C,S, SubtractItem<A,F,C,S>, TableIndexCompositeAttributes<A,F,C,S>, ResponseItem<A,F,C,S>>;
      append: SetRecord<A,F,C,S, AppendItem<A,F,C,S>, TableIndexCompositeAttributes<A,F,C,S>, ResponseItem<A,F,C,S>>;
      delete: SetRecord<A,F,C,S, DeleteItem<A,F,C,S>, TableIndexCompositeAttributes<A,F,C,S>, ResponseItem<A,F,C,S>>;
      data: DataUpdateMethodRecord<A,F,C,S, Item<A,F,C,S,S["attributes"]>, TableIndexCompositeAttributes<A,F,C,S>, ResponseItem<A,F,C,S>>;
  };

  patch(key: AllTableIndexCompositeAttributes<A,F,C,S>): {
      set: SetRecord<A,F,C,S, SetItem<A,F,C,S>, TableIndexCompositeAttributes<A,F,C,S>, ResponseItem<A,F,C,S>>;
      remove: RemoveRecord<A,F,C,S, RemoveItem<A,F,C,S>, TableIndexCompositeAttributes<A,F,C,S>, ResponseItem<A,F,C,S>>;
      add: SetRecord<A,F,C,S, AddItem<A,F,C,S>, TableIndexCompositeAttributes<A,F,C,S>, ResponseItem<A,F,C,S>>;
      subtract: SetRecord<A,F,C,S, SubtractItem<A,F,C,S>, TableIndexCompositeAttributes<A,F,C,S>, ResponseItem<A,F,C,S>>;
      append: SetRecord<A,F,C,S, AppendItem<A,F,C,S>, TableIndexCompositeAttributes<A,F,C,S>, ResponseItem<A,F,C,S>>;
      delete: SetRecord<A,F,C,S, DeleteItem<A,F,C,S>, TableIndexCompositeAttributes<A,F,C,S>, ResponseItem<A,F,C,S>>;
      data: DataUpdateMethodRecord<A,F,C,S, Item<A,F,C,S,S["attributes"]>, TableIndexCompositeAttributes<A,F,C,S>, ResponseItem<A,F,C,S>>;
  };
  
  create(record: PutItem<A,F,C,S>): PutRecordOperationOptions<A,F,C,S, ResponseItem<A,F,C,S>>

  find(record: Partial<Item<A,F,C,S,S["attributes"]>>): RecordsActionOptions<A,F,C,S, ResponseItem<A,F,C,S>[], AllTableIndexCompositeAttributes<A,F,C,S>>;

  match(record: Partial<Item<A,F,C,S,S["attributes"]>>): RecordsActionOptions<A,F,C,S, ResponseItem<A,F,C,S>[], AllTableIndexCompositeAttributes<A,F,C,S>>;

  scan: RecordsActionOptions<A,F,C,S, ResponseItem<A,F,C,S>[], TableIndexCompositeAttributes<A,F,C,S>>;
  query: Queries<A,F,C,S>;
  
  parse(item: ParseSingleInput, options?: ParseOptions): ResponseItem<A,F,C,S> | null;
  parse(item: ParseMultiInput, options?: ParseOptions): ResponseItem<A,F,C,S>[];
  setIdentifier(type: "entity" | "version", value: string): void;
  client: any;
}