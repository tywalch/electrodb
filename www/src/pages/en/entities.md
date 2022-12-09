---
title: Entites and Services
description: Lorem ipsum dolor sit amet - 2
layout: ../../layouts/MainLayout.astro
---

## Entities and Services

> To see full examples of **_ElectroDB_** in action, go to the [Examples](#examples) section.

`Entity` allows you to create separate and individual business objects in a _DynamoDB_ table. When queried, your results will not include other Entities that also exist the same table. This allows you to easily achieve single table design as recommended by AWS. For more detail, read [Entities](#entities).

`Service` allows you to build relationships across Entities. A service imports Entity [Models](#model), builds individual Entities, and creates [Collections](#collections) to allow cross Entity querying. For more detail, read [Services](#services).

You can use Entities independent of Services, you do not need to import models into a Service to use them individually. However, If you intend to make queries that `join` or span multiple Entities you will need to use a Service.

## Entities

In **_ElectroDB_** an `Entity` is represents a single business object. For example, in a simple task tracking application, one Entity could represent an Employee and or a Task that is assigned to an employee.

Require or import `Entity` from `electrodb`:

```javascript
const { Entity } = require("electrodb");
// or
import { Entity } from "electrodb";
```

> When using TypeScript, for strong type checking, be sure to either add your model as an object literal to the Entity constructor or create your model using const assertions with the `as const` syntax.

## Services

In **_ElectroDB_** a `Service` represents a collection of related Entities. Services allow you to build queries span across Entities. Similar to Entities, Services can coexist on a single table without collision. You can use Entities independent of Services, you do not need to import models into a Service to use them individually. However, you do you need to use a Service if you intend make queries that `join` multiple Entities.

Require:

```javascript
const { Service } = require("electrodb");
// or
import { Service } from "electrodb";
```
