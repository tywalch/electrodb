import { Entity } from '../entity';
import { ResponseItem, PutItem, AddItem, SubtractItem, AppendItem, RemoveItem, DeleteItem, Item } from './schema';
import { Service } from '../service';
import { CollectionAssociations } from './collections';

export * from './where';
export * from './schema';
export * from './options';
export * from './client';
export * from './collections';
export * from './model';
export * from './events';

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
        ? Partial<ResponseItem<A,F,C,S>>
        : never;

export type UpdateAddEntityItem<E extends Entity<any, any, any, any>> =
    E extends Entity<infer A, infer F, infer C, infer S>
        ? AddItem<A, F, C, S>
        : never;

export type UpdateSubtractEntityItem<E extends Entity<any, any, any, any>> =
    E extends Entity<infer A, infer F, infer C, infer S>
        ? SubtractItem<A, F, C, S>
        : never;

export type UpdateAppendEntityItem<E extends Entity<any, any, any, any>> =
    E extends Entity<infer A, infer F, infer C, infer S>
        ? AppendItem<A, F, C, S>
        : never;

export type UpdateRemoveEntityItem<E extends Entity<any, any, any, any>> =
    E extends Entity<infer A, infer F, infer C, infer S>
        ? RemoveItem<A, F, C, S>
        : never;

export type UpdateDeleteEntityItem<E extends Entity<any, any, any, any>> =
    E extends Entity<infer A, infer F, infer C, infer S>
        ? DeleteItem<A, F, C, S>
        : never;

export type EntityRecord<E extends Entity<any, any, any, any>> =
    E extends Entity<infer A, infer F, infer C, infer S>
        ? Item<A,F,C,S,S["attributes"]>
        : never;

export type CollectionItem<SERVICE extends Service<any>, COLLECTION extends keyof SERVICE["collections"]> =
    SERVICE extends Service<infer E>
        ? Pick<{
            [EntityName in keyof E]: E[EntityName] extends Entity<infer A, infer F, infer C, infer S>
            ? COLLECTION extends keyof CollectionAssociations<E>
                ? EntityName extends CollectionAssociations<E>[COLLECTION]
                    ? ResponseItem<A,F,C,S>[]
                    : never
                : never
            : never
        }, COLLECTION extends keyof CollectionAssociations<E>
            ? CollectionAssociations<E>[COLLECTION]
            : never>
        : never