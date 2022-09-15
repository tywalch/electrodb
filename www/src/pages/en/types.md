---
title: Types
description: Types
layout: ../../layouts/MainLayout.astro
---

## Exported Types

The following types are exported for easier use while using ElectroDB with TypeScript:

### EntityRecord Type

The EntityRecord type is an object containing every attribute an Entity's model.

_Definition:_

```typescript
type EntityRecord<E extends Entity<any, any, any, any>> = E extends Entity<
  infer A,
  infer F,
  infer C,
  infer S
>
  ? Item<A, F, C, S, S["attributes"]>
  : never;
```

_Use:_

```typescript
type EntiySchema = EntityRecord<typeof MyEntity>;
```

### EntityItem Type

This type represents an item as it is returned from a query. This is different from the `EntityRecord` in that this type reflects the `required`, `hidden`, `default`, etc properties defined on the attribute.

_Definition:_

```typescript
export type EntityItem<E extends Entity<any, any, any, any>> = E extends Entity<
  infer A,
  infer F,
  infer C,
  infer S
>
  ? ResponseItem<A, F, C, S>
  : never;
```

_Use:_

```typescript
type Thing = EntityItem<typeof MyEntityInstance>;
```

### CollectionItem Type

This type represents the value returned from a collection query, and is similar to EntityItem.

_Use:_

```
type CollectionResults = CollectionItem<typeof MyServiceInstance, "collectionName">
```

### CreateEntityItem Type

This type represents an item that you would pass your entity's `put` or `create` method

_Definition:_

```typescript
export type CreateEntityItem<E extends Entity<any, any, any, any>> =
  E extends Entity<infer A, infer F, infer C, infer S>
    ? PutItem<A, F, C, S>
    : never;
```

_Use:_

```typescript
type NewThing = CreateEntityItem<typeof MyEntityInstance>;
```

### UpdateEntityItem Type

This type represents an item that you would pass your entity's `set` method when using `create` or `update`.

_Definition:_

```typescript
export type UpdateEntityItem<E extends Entity<any, any, any, any>> =
  E extends Entity<infer A, infer F, infer C, infer S>
    ? SetItem<A, F, C, S>
    : never;
```

_Use:_

```typescript
type UpdateProperties = UpdateEntityItem<typeof MyEntityInstance>;
```

### UpdateAddEntityItem Type

This type represents an item that you would pass your entity's `add` method when using `create` or `update`.

_Definition:_

```typescript
export type UpdateAddEntityItem<E extends Entity<any, any, any, any>> =
  E extends Entity<infer A, infer F, infer C, infer S>
    ? AddItem<A, F, C, S>
    : never;
```

### UpdateSubtractEntityItem Type

This type represents an item that you would pass your entity's `subtract` method when using `create` or `update`.

_Definition:_

```typescript
export type UpdateSubtractEntityItem<E extends Entity<any, any, any, any>> =
  E extends Entity<infer A, infer F, infer C, infer S>
    ? SubtractItem<A, F, C, S>
    : never;
```

### UpdateAppendEntityItem Type

This type represents an item that you would pass your entity's `append` method when using `create` or `update`.

_Definition:_

```typescript
export type UpdateAppendEntityItem<E extends Entity<any, any, any, any>> =
  E extends Entity<infer A, infer F, infer C, infer S>
    ? AppendItem<A, F, C, S>
    : never;
```

### UpdateRemoveEntityItem Type

This type represents an item that you would pass your entity's `remove` method when using `create` or `update`.

_Definition:_

```typescript
export type UpdateRemoveEntityItem<E extends Entity<any, any, any, any>> =
  E extends Entity<infer A, infer F, infer C, infer S>
    ? RemoveItem<A, F, C, S>
    : never;
```

### UpdateDeleteEntityItem Type

This type represents an item that you would pass your entity's `delete` method when using `create` or `update`.

_Definition:_

```typescript
export type UpdateDeleteEntityItem<E extends Entity<any, any, any, any>> =
  E extends Entity<infer A, infer F, infer C, infer S>
    ? DeleteItem<A, F, C, S>
    : never;
```
