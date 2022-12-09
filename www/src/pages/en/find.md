---
title: Find
description: Find
layout: ../../layouts/MainLayout.astro
---

### Find Records

DynamoDB offers three methods to query records: `get`, `query`, and `scan`. In **_ElectroDB_**, there is a fourth type: `find`. Unlike `get` and `query`, the `find` method does not require you to provide keys, but under the covers it will leverage the attributes provided to choose the best index to query on. Provide the `find` method will all properties known to match a record and **_ElectroDB_** will generate the most performant query it can to locate the results. This can be helpful with highly dynamic querying needs. If an index cannot be satisfied with the attributes provided, `scan` will be used as a last resort.

> _NOTE: The Find method is similar to the Match method with one exception: The attributes you supply directly to the `.find()` method will only be used to identify and fulfill your index access patterns. Any values supplied that do not contribute to a composite key will not be applied as query filters. Furthermore, if the values you provide do not resolve to an index access pattern, then a table scan will be performed. Use the `where()` chain method to further filter beyond keys, or use [Match](#match-records) for the convenience of automatic filtering based on the values given directly to that method._

The Find method is useful when the index chosen does not matter or is not known. If your secondary indexes do not contain all attributes then this method might not be right for you. The mechanism that picks the best index for a given payload is subject to improvement and change without triggering a breaking change release version.

```javascript
await StoreLocations.find({
    mallId: "EastPointe",
    buildingId: "BuildingA1",
}).go()

// Equivalent Params:
{
  "KeyConditionExpression": "#pk = :pk and begins_with(#sk1, :sk1)",
  "TableName": "StoreDirectory",
  "ExpressionAttributeNames": {
    "#mallId": "mallId",
    "#buildingId": "buildingId",
    "#pk": "gis1pk",
    "#sk1": "gsi1sk"
  },
  "ExpressionAttributeValues": {
    ":mallId1": "EastPointe",
    ":buildingId1": "BuildingA1",
    ":pk": "$mallstoredirectory#mallid_eastpointe",
    ":sk1": "$mallstore_1#buildingid_buildinga1#unitid_"
  },
  "IndexName": "gis1pk-gsi1sk-index",
}
```

### Match Records

Match is a convenience method based off of ElectroDB's [find](#find-records) method. Similar to Find, Match does not require you to provide keys, but under the covers it will leverage the attributes provided to choose the best index to query on.

> \_NOTE: The Math method is useful when the index chosen does not matter or is not known. If your secondary indexes do not contain all attributes then this method might not be right for you. The mechanism that picks the best index for a given payload is subject to improvement and change without triggering a breaking change release version.

Match differs from [Find](#find-records) in that it will also include all supplied values into a query filter.

```javascript
await StoreLocations.find({
    mallId: "EastPointe",
    buildingId: "BuildingA1",
    leaseEndDate: "2020-03-22",
    rent: "1500.00"
}).go()

// Equivalent Params:
{
  "KeyConditionExpression": "#pk = :pk and begins_with(#sk1, :sk1)",
  "TableName": "StoreDirectory",
  "ExpressionAttributeNames": {
    "#mallId": "mallId",
    "#buildingId": "buildingId",
    "#leaseEndDate": "leaseEndDate",
    "#rent": "rent",
    "#pk": "gis1pk",
    "#sk1": "gsi1sk"
  },
  "ExpressionAttributeValues": {
    ":mallId1": "EastPointe",
    ":buildingId1": "BuildingA1",
    ":leaseEndDate1": "2020-03-22",
    ":rent1": "1500.00",
    ":pk": "$mallstoredirectory#mallid_eastpointe",
    ":sk1": "$mallstore_1#buildingid_buildinga1#unitid_"
  },
  "IndexName": "gis1pk-gsi1sk-index",
  "FilterExpression": "#mallId = :mallId1 AND#buildingId = :buildingId1 AND#leaseEndDate = :leaseEndDate1 AND#rent = :rent1"
}

```

After invoking the **Access Pattern** with the required **Partition Key** **Composite Attributes**, you can now choose what **Sort Key Composite Attributes** are applicable to your query. Examine the table in [Sort Key Operations](#sort-key-operations) for more information on the available operations on a **Sort Key**.

### Access Pattern Queries

When you define your [indexes](#indexes) in your model, you are defining the Access Patterns of your entity. The [composite attributes](#composite-attributes) you choose, and their order, ultimately define the finite set of index queries that can be made. The more you can leverage these index queries the better from both a cost and performance perspective.

Unlike Partition Keys, Sort Keys can be partially provided. We can leverage this to multiply our available access patterns and use the Sort Key Operations: `begins`, `between`, `lt`, `lte`, `gt`, and `gte`. These queries are more performant and cost-effective than filters. The costs associated with DynamoDB directly correlate to how effectively you leverage Sort Key Operations.

> For a comprehensive and interactive guide to build queries please visit this runkit: https://runkit.com/tywalch/electrodb-building-queries.

#### Begins With Queries

One important consideration when using Sort Key Operations to make is when to use and not to use "begins".

It is possible to supply partially supply Sort Key composite attributes. Sort Key attributes must be provided in the order they are defined, but it's possible to provide only a subset of the Sort Key Composite Attributes to ElectroDB. By default, when you supply a partial Sort Key in the Access Pattern method, ElectroDB will create a `beginsWith` query. The difference between that and using `.begins()` is that, with a `.begins()` query, ElectroDB will not post-pend the next composite attribute's label onto the query.

The difference is nuanced and makes better sense with an example, but the rule of thumb is that data passed to the Access Pattern method should represent values you know strictly equal the value you want.

The following examples will use the following Access Pattern definition for `units`:

```json
{
  "units": {
    "index": "gis1pk-gsi1sk-index",
    "pk": {
      "field": "gis1pk",
      "composite attributes": ["mallId"]
    },
    "sk": {
      "field": "gsi1sk",
      "composite attributes": ["buildingId", "unitId"]
    }
  }
}
```

The names you have given to your indexes on your entity model/schema express themselves as "Access Pattern" methods on your Entity's `query` object:

```javascript
// Example #1, access pattern `units`
StoreLocations.query.units({ mallId, buildingId }).go();
// -----------------------^^^^^^^^^^^^^^^^^^^^^^
```

Data passed to the Access Pattern method is considered to be full, known, data. In the above example, we are saying we _know_ the `mallId`, `buildingId` and `unitId`.

Alternatively, if you only know the start of a piece of data, use .begins():

```javascript
// Example #2
StoreLocations.query.units({ mallId }).begins({ buildingId }).go();
// ---------------------------------^^^^^^^^^^^^^^^^^^^^^
```

Data passed to the .begins() method is considered to be partial data. In the second example, we are saying we _know_ the `mallId` and `buildingId`, but only know the beginning of `unitId`.

For the above queries we see two different sort keys:

1. `"$mallstore_1#buildingid_f34#unitid_"`
2. `"$mallstore_1#buildingid_f34"`

The first example shows how ElectroDB post-pends the label of the next composite attribute (`unitId`) on the Sort Key to ensure that buildings such as `"f340"` are not included in the query. This is useful to prevent common issues with overloaded sort keys like accidental over-querying.

The second example allows you to make queries that do include buildings such as `"f340"` or `"f3409"` or `"f340356346"`.

For these reasons it is important to consider that attributes passed to the Access Pattern method are considered to be full, known, data.

## Collection Chains

Collections allow you to query across Entities. They can be used on `Service` instance.

```javascript
const DynamoDB = require("aws-sdk/clients/dynamodb");
const table = "projectmanagement";
const client = new DynamoDB.DocumentClient();

const employees = new Entity(
  {
    model: {
      entity: "employees",
      version: "1",
      service: "taskapp",
    },
    attributes: {
      employeeId: {
        type: "string",
      },
      organizationId: {
        type: "string",
      },
      name: {
        type: "string",
      },
      team: {
        type: ["jupiter", "mercury", "saturn"],
      },
    },
    indexes: {
      staff: {
        pk: {
          field: "pk",
          composite: ["organizationId"],
        },
        sk: {
          field: "sk",
          composite: ["employeeId"],
        },
      },
      employee: {
        collection: "assignments",
        index: "gsi2",
        pk: {
          field: "gsi2pk",
          composite: ["employeeId"],
        },
        sk: {
          field: "gsi2sk",
          composite: [],
        },
      },
    },
  },
  { client, table }
);

const tasks = new Entity(
  {
    model: {
      entity: "tasks",
      version: "1",
      service: "taskapp",
    },
    attributes: {
      taskId: {
        type: "string",
      },
      employeeId: {
        type: "string",
      },
      projectId: {
        type: "string",
      },
      title: {
        type: "string",
      },
      body: {
        type: "string",
      },
    },
    indexes: {
      project: {
        pk: {
          field: "pk",
          composite: ["projectId"],
        },
        sk: {
          field: "sk",
          composite: ["taskId"],
        },
      },
      assigned: {
        collection: "assignments",
        index: "gsi2",
        pk: {
          field: "gsi2pk",
          composite: ["employeeId"],
        },
        sk: {
          field: "gsi2sk",
          composite: [],
        },
      },
    },
  },
  { client, table }
);

const TaskApp = new Service({ employees, tasks });
```

Available on your Service are two objects: `entites` and `collections`. Entities available on `entities` have the same capabilities as they would if created individually. When a Model added to a Service with `join` however, its Collections are automatically added and validated with the other Models joined to that Service. These Collections are available on `collections`.

```javascript
TaskApp.collections.assignments({employeeId: "JExotic"}).params();

// Results
{
  TableName: 'projectmanagement',
  ExpressionAttributeNames: { '#pk': 'gsi2pk', '#sk1': 'gsi2sk' },
  ExpressionAttributeValues: { ':pk': '$taskapp_1#employeeid_joeexotic', ':sk1': '$assignments' },
  KeyConditionExpression: '#pk = :pk and begins_with(#sk1, :sk1)',
  IndexName: 'gsi3'
}
```

Collections do not have the same `query` functionality and as an Entity, though it does allow for inline filters like an Entity. The `attributes` available on the filter object include **all** attributes across entities.

```javascript
TaskApp.collections
	.assignments({employee: "CBaskin"})
	.filter((attributes) => `
		${attributes.project.notExists()} OR ${attributes.project.contains("murder")}
	`)

// Results
{
  TableName: 'projectmanagement',
  ExpressionAttributeNames: { '#project': 'project', '#pk': 'gsi2pk', '#sk1': 'gsi2sk' },
  ExpressionAttributeValues: {
    ':project1': 'murder',
    ':pk': '$taskapp_1#employeeid_carolbaskin',
    ':sk1': '$assignments'
  },
  KeyConditionExpression: '#pk = :pk and begins_with(#sk1, :sk1)',
  IndexName: 'gsi2',
  FilterExpression: '\n\t\tattribute_not_exists(#project) OR contains(#project, :project1)\n\t'
}
```
