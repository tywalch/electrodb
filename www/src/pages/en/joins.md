---
title: Joins
description: Joins
layout: ../../layouts/MainLayout.astro
---

## Joining models to a Service

```javascript
let TaskApp = new Service("TaskApp", { client, table });
TaskApp.join(EmployeesModel) // available at TaskApp.entities.employees (based on entity name in model)
  .join(TasksModel); // available at TaskApp.entities.tasks (based on entity name in model)
```

## Joining Entities or Models with an alias

```javascript
let TaskApp = new Service("TaskApp", { client, table });
TaskApp.join("personnel", EmployeesModel) // available at TaskApp.entities.personnel
  .join("directives", TasksModel); // available at TaskApp.entities.directives
```

## Joining Entities at Service construction for TypeScript

```typescript
let TaskApp = new Service({
  personnel: EmployeesModel, // available at TaskApp.entities.personnel
  directives: TasksModel, // available at TaskApp.entities.directives
});
```

When joining a Model/Entity to a Service, ElectroDB will perform a number of validations to ensure that Entity conforms to expectations collectively established by all joined Entities.

- [Entity](/entities) names must be unique across a Service.
- [Collection](#collections) names must be unique across a Service.
- All [Collections](#collections) map to on the same DynamoDB indexes with the same index field names. See [Indexes](#indexes).
- Partition Key [Composite Attributes](#composite attribute-arrays) on a [Collection](#collections) must have the same attribute names and labels (if applicable). See [Attribute Definitions](#attribute-definition).
- The [name of the Service in the Model](#model-properties) must match the Name defined on the [Service](#services) instance.
- Joined instances must be type [Model](#model) or [Entity](/entities).
- If the attributes of an Entity have overlapping names with other attributes in that service, they must all have compatible or matching [attribute definitions](#attributes).
- All models conform to the same model format. If you created your model prior to ElectroDB version 0.9.19 see section [Version 1 Migration](/errata#version-1-migration).
