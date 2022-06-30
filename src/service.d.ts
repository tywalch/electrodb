import { Entity } from './entity';
import { DocumentClient } from './types/client';
import { ElectroEventListener } from './types/events';
import { CollectionQueries, CollectionAssociations } from './types/collections';

export type ServiceConfiguration = {
  table?: string;
  client?: DocumentClient;
  listeners?: Array<ElectroEventListener>;
  logger?: ElectroEventListener;
};

export class Service<E extends {[name: string]: Entity<any, any, any, any>}> {
  entities: E;
  collections: CollectionQueries<E, CollectionAssociations<E>>
  constructor(entities: E, config?: ServiceConfiguration);
}