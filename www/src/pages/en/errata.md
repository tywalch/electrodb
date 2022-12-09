---
title: Errata
description: Some details and specifics
layout: ../../layouts/MainLayout.astro
---

## TypeScript Support

Previously it was possible to generate type definition files (`.d.ts`) for you Models, Entities, and Services with the [Electro CLI](#electro-cli). New with version `0.10.0` is TypeScript support for Entities and Services.

As of writing this, this functionality is still a work in progress, and enforcement of some of ElectroDB's query constraints have still not been written into the type checks. Most notably are the following constraints not yet enforced by the type checker, but are enforced at query runtime:

- Sort Key Composite Attribute order is not strongly typed. Sort Key Composite Attributes must be provided in the order they are defined on the model to build the key appropriately. This will not cause an error at query runtime, be sure your partial Sort Keys are provided in accordance with your model to fully leverage Sort Key queries. For more information about composite attribute ordering see the section on [Composite Attributes](#composite-attributes).
- Put/Create/Update/Patch/Delete/Create operations that partially impact index composite attributes are not statically typed. When performing a `put` or `update` type operation that impacts a composite attribute of a secondary index, ElectroDB performs a check at runtime to ensure all composite attributes of that key are included. This is detailed more in the section [Composite Attribute and Index Considerations](#composite-attribute-and-index-considerations).
- Use of the `params` method does not yet return strict types.
- Use of the `raw` or `includeKeys` query options do not yet impact the returned types.

If you experience any issues using TypeScript with ElectroDB, your feedback is very important, please create a GitHub issue, and it can be addressed.

See the section [Exported TypeScript Types](#exported-typescript-types) to read more about the useful types exported from ElectroDB.

## Version 1 Migration

This section is to detail any breaking changes made on the journey to a stable 1.0 product.

### New schema format/breaking key format change

It became clear when I added the concept of a Service that the "version" paradigm of having the version in the PK wasn't going to work. This is because collection queries use the same PK for all entities and this would prevent some entities in a Service to change versions without impacting the service as a whole. The better more is the place the version in the SK _after_ the entity name so that all version of an entity can be queried. This will work nicely into the migration feature I have planned that will help migrate between model versions.

To address this change, I decide it would be best to change the structure for defining a model, which is then used as heuristic to determine where to place the version in the key (PK or SK). This has the benefit of not breaking existing models, but does increase some complexity in the underlying code.

Additionally, a change was made to the Service class. New Services would take a string of the service name instead of an object as before.

In the _old_ scheme, version came after the service name (see `^`).

```
pk: $mallstoredirectory_1#mall_eastpointe
                        ^
sk: $mallstores#building_buildinga#store_lattelarrys

```

In the _new_ scheme, version comes after the entity name (see `^`).

```
pk: $mallstoredirectory#mall_eastpointe

sk: $mallstores_1#building_buildinga#store_lattelarrys
                ^
```

In practice the change looks like this for use of `Entity`:

```javascript
const  DynamoDB  =  require("aws-sdk/clients/dynamodb");
const {Entity} = require("electrodb");
const client = new DynamoDB.DocumentClient();
const table = "dynamodb_table_name";

// old way
let old_schema = {
  entity: "model_name",
  service: "service_name",
  version: "1",
  table: table,
  attributes: {...},
  indexes: {...}
};
new Entity(old_schema, {client});

// new way
let new_schema = {
  model: {
    entity: "model_name",
    service: "service_name",
    version: "1",
  },
  attributes: {...},
  indexes: {...}
};
new Entity(new_schema, {client, table});
```

Changes to usage of `Service` would look like this:

```javascript
const  DynamoDB  =  require("aws-sdk/clients/dynamodb");
const {Service} = require("electrodb");
const client = new DynamoDB.DocumentClient();
const table = "dynamodb_table_name";

// old way
new Service({
  service: "service_name",
  version: "1",
  table: table,
}, {client});

// new way
new Service("service_name", {client, table});

// new way (for better TypeScript support)
new Service({entity1, entity2, ...})
```

### The renaming of index property Facets to Composite and Template

In preparation of moving the codebase to version 1.0, ElectroDB will now accept the `facets` property as either the `composite` and/or `template` properties. Using the `facets` property is still accepted by ElectroDB but will be deprecated sometime in the future (tbd).

This change stems from the fact the `facets` is already a defined term in the DynamoDB space and that definition does not fit the use-case of how ElectroDB uses the term. To avoid confusion from new developers, the `facets` property shall now be called `composite` (as in Composite Attributes) when supplying an Array of attributes, and `template` while supplying a string. These are two independent fields for two reasons:

1. ElectroDB will validate the Composite Attributes provided map to those in the template (more validation is always nice).

2. Allowing for the `composite` array to be supplied independently will allow for Composite Attributes to remained typed even when using a Composite Attribute Template.

### Get Method to Return null

1.0.0 brings back a `null` response from the `get()` method when a record could not be found. Prior to `1.0.0` ElectroDB returned an empty object.

## Facets

As of version `0.11.1`, "Facets" have been renamed to "Composite Attributes", and all documentation has been updated to reflect that change.

- To learn about the latest syntax, checkout [Composite Attributes](#composite-attributes).
- To learn about why this change was made in preparation for 1.0 checkout [Renaming Facets](#the-renaming-of-index-property-facets-to-composite-and-template).

## Filters

> Filters are no longer the preferred way to add FilterExpressions. Checkout the [Where](#where) section to find out about how to apply FilterExpressions and ConditionExpressions.

Building thoughtful indexes can make queries simple and performant. Sometimes you need to filter results down further. By adding Filters to your model, you can extend your queries with custom filters. Below is the traditional way you would add a filter to Dynamo's DocumentClient directly alongside how you would accomplish the same using a Filter function.

```json
{
  "IndexName": "idx2",
  "TableName": "StoreDirectory",
  "ExpressionAttributeNames": {
    "#rent": "rent",
    "#discount": "discount",
    "#pk": "idx2pk",
    "#sk1": "idx2sk"
  },
  "ExpressionAttributeValues": {
    ":rent1": "2000.00",
    ":rent2": "5000.00",
    ":discount1": "1000.00",
    ":pk": "$mallstoredirectory_1#mallid_eastpointe",
    ":sk1": "$mallstore#leaseenddate_2020-04-01#rent_",
    ":sk2": "$mallstore#leaseenddate_2020-07-01#rent_"
  },
  "KeyConditionExpression": ",#pk = :pk and #sk1 BETWEEN :sk1 AND :sk2",
  "FilterExpression": "(#rent between :rent1 and :rent2) AND #discount <= :discount1"
}
```

### Defined on the model

> Deprecated but functional with 1.x

Filters can be defined on the model and used in your query chain.

```javascript
/**
	* Filter by low rent a specific mall or a leaseEnd withing a specific range
	* @param {Object} attributes - All attributes from the model with methods for each filter operation
	* @param {...*} values - Values passed when calling the filter in a query chain.
**/
filters: {
	rentPromotions: function(attributes, minRent, maxRent, promotion)  {
		let {rent, discount} = attributes;
		return `
			${rent.between(minRent, maxRent)} AND ${discount.lte(promotion)}
		`
	}
}


let StoreLocations  =  new Entity(model, {table: "StoreDirectory"});
let maxRent = "5000.00";
let minRent = "2000.00";
let promotion = "1000.00";
let stores = await MallStores.query
	.stores({ mallId: "EastPointe" })
	.between({ leaseEndDate:  "2020-04-01" }, { leaseEndDate:  "2020-07-01" })
	.rentPromotions(minRent, maxRent, promotion)
	.go();

// Equivalent Parameters
{
  IndexName: 'idx2',
  TableName: 'StoreDirectory',
  ExpressionAttributeNames: {
    '#rent': 'rent',
    '#discount': 'discount',
    '#pk': 'idx2pk',
    '#sk1': 'idx2sk'
  },
  ExpressionAttributeValues: {
    ':rent1': '2000.00',
    ':rent2': '5000.00',
    ':discount1': '1000.00',
    ':pk': '$mallstoredirectory_1#mallid_eastpointe',
    ':sk1': '$mallstore#leaseenddate_2020-04-01#rent_',
    ':sk2': '$mallstore#leaseenddate_2020-07-01#rent_'
  },
  KeyConditionExpression: '#pk = :pk and #sk1 BETWEEN :sk1 AND :sk2',
  FilterExpression: '(#rent between :rent1 and :rent2) AND #discount <= :discount1'
}
```

### Defined via Filter method after query operators

> Filters are no longer the preferred way to add FilterExpressions. Checkout the [Where](#where) section to find out about how to apply FilterExpressions and ConditionExpressions.

The easiest way to use filters is to use them inline in your query chain.

```javascript
let StoreLocations  =  new Entity(model, {table: "StoreDirectory"});
let maxRent = "5000.00";
let minRent = "2000.00";
let promotion = "1000.00";
let stores  =  await StoreLocations.query
	.leases({ mallId: "EastPointe" })
	.between({ leaseEndDate:  "2020-04-01" }, { leaseEndDate:  "2020-07-01" })
	.filter(({rent, discount}) => `
		${rent.between(minRent, maxRent)} AND ${discount.lte(promotion)}
	`)
	.go();

// Equivalent Parameters
{
  IndexName: 'idx2',
  TableName: 'StoreDirectory',
  ExpressionAttributeNames: {
    '#rent': 'rent',
    '#discount': 'discount',
    '#pk': 'idx2pk',
    '#sk1': 'idx2sk'
  },
  ExpressionAttributeValues: {
    ':rent1': '2000.00',
    ':rent2': '5000.00',
    ':discount1': '1000.00',
    ':pk': '$mallstoredirectory_1#mallid_eastpointe',
    ':sk1': '$mallstore#leaseenddate_2020-04-01#rent_',
    ':sk2': '$mallstore#leaseenddate_2020-07-01#rent_'
  },
  KeyConditionExpression: '#pk = :pk and #sk1 BETWEEN :sk1 AND :sk2',
  FilterExpression: '(#rent between :rent1 and :rent2) AND #discount <= :discount1'
}
```

Filter functions allow you to write a `FilterExpression` without having to worry about the complexities of expression attributes. To accomplish this, ElectroDB injects an object `attributes` as the first parameter to all Filter Functions. This object contains every Attribute defined in the Entity's Model with the following operators as methods:

| operator      | example                          | result                              |
| ------------- | -------------------------------- | ----------------------------------- |
| `gte`         | `rent.gte(maxRent)`              | `#rent >= :rent1`                   |
| `gt`          | `rent.gt(maxRent)`               | `#rent > :rent1`                    |
| `lte`         | `rent.lte(maxRent)`              | `#rent <= :rent1`                   |
| `lt`          | `rent.lt(maxRent)`               | `#rent < :rent1`                    |
| `eq`          | `rent.eq(maxRent)`               | `#rent = :rent1`                    |
| `ne`          | `rent.ne(maxRent)`               | `#rent <> :rent1`                   |
| `begins`      | `rent.begins(maxRent)`           | `begins_with(#rent, :rent1)`        |
| `exists`      | `rent.exists()`                  | `attribute_exists(#rent)`           |
| `notExists`   | `rent.notExists()`               | `attribute_not_exists(#rent)`       |
| `contains`    | `rent.contains(maxRent)`         | `contains(#rent = :rent1)`          |
| `notContains` | `rent.notContains(maxRent)`      | `not contains(#rent = :rent1)`      |
| `between`     | `rent.between(minRent, maxRent)` | `(#rent between :rent1 and :rent2)` |
| `name`        | `rent.name()`                    | `#rent`                             |
| `value`       | `rent.value(maxRent)`            | `:rent1`                            |

This functionality allows you to write the remaining logic of your `FilterExpression` with ease. Add complex nested `and`/`or` conditions or other `FilterExpression` logic while ElectroDB handles the `ExpressionAttributeNames` and `ExpressionAttributeValues`.

### Multiple Filters

> Filters are no longer the preferred way to add FilterExpressions. Checkout the [Where](#where) section to find out about how to apply FilterExpressions and ConditionExpressions.

It is possible to chain together multiple filters. The resulting FilterExpressions are concatenated with an implicit `AND` operator.

```javascript
let MallStores = new Entity(model, {table: "StoreDirectory"});
let stores = await MallStores.query
	.leases({ mallId: "EastPointe" })
	.between({ leaseEndDate: "2020-04-01" }, { leaseEndDate: "2020-07-01" })
	.filter(({ rent, discount }) => `
		${rent.between("2000.00", "5000.00")} AND ${discount.eq("1000.00")}
	`)
	.filter(({ category }) => `
		${category.eq("food/coffee")}
	`)
	.go();

// Equivalent Parameters
{
  TableName: 'StoreDirectory',
  ExpressionAttributeNames: {
    '#rent': 'rent',
    '#discount': 'discount',
    '#category': 'category',
    '#pk': 'idx2pk',
    '#sk1': 'idx2sk'
  },
  ExpressionAttributeValues: {
    ':rent1': '2000.00',
    ':rent2': '5000.00',
    ':discount1': '1000.00',
    ':category1': 'food/coffee',
    ':pk': '$mallstoredirectory_1#mallid_eastpointe',
    ':sk1': '$mallstore#leaseenddate_2020-04-01#storeid_',
    ':sk2': '$mallstore#leaseenddate_2020-07-01#storeid_'
  },
  KeyConditionExpression: '#pk = :pk and #sk1 BETWEEN :sk1 AND :sk2',
  IndexName: 'idx2',
  FilterExpression: '(#rent between :rent1 and :rent2) AND (#discount = :discount1 AND #category = :category1)'
}
```

# AWS DynamoDB Client

ElectroDB supports both the [v2](https://www.npmjs.com/package/aws-sdk) and [v3](https://www.npmjs.com/package/@aws-sdk/client-dynamodb) aws clients. The client can be supplied creating a new Entity or Service, or added to a Entity/Service instance via the `setClient()` method.

_On the instantiation of an `Entity`:_

```typescript
import { Entity } from "electrodb";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
const table = "my_table_name";
const client = new DocumentClient({
  region: "us-east-1",
});

const task = new Entity(
  {
    // your model
  },
  {
    client, // <----- client
    table,
  }
);
```

_On the instantiation of an `Service`:_

```typescript
import { Entity } from "electrodb";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
const table = "my_table_name";
const client = new DocumentClient({
  region: "us-east-1",
});

const task = new Entity({
  // your model
});

const user = new Entity({
  // your model
});

const service = new Service(
  { task, user },
  {
    client, // <----- client
    table,
  }
);
```

_Via the `setClient` method:_

```typescript
import { Entity } from "electrodb";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
const table = "my_table_name";
const client = new DocumentClient({
  region: "us-east-1",
});

const task = new Entity({
  // your model
});

task.setClient(client);
```

## V2 Client

The [v2](https://www.npmjs.com/package/aws-sdk) sdk will work out of the box with the the DynamoDB DocumentClient.

_Example:_

```typescript
import { DocumentClient } from "aws-sdk/clients/dynamodb";
const client = new DocumentClient({
  region: "us-east-1",
});
```

## V3 Client

The [v3](https://www.npmjs.com/package/@aws-sdk/client-dynamodb) client will work out of the box with the the DynamoDBClient.

```typescript
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
const client = new DynamoDBClient({
  region: "us-east-1",
});
```

# Logging

A logger callback function can be provided both the at the instantiation of an `Entity` or `Service` instance or as a [Query Option](#query-options). The property `logger` is implemented as a convenience property; under the hood ElectroDB uses this property identically to how it uses a [Listener](#listeners).

_On the instantiation of an `Entity`:_

```typescript
import { DynamoDB } from "aws-sdk";
import { Entity, ElectroEvent } from "electrodb";

const table = "my_table_name";
const client = new DynamoDB.DocumentClient();
const logger = (event: ElectroEvent) => {
  console.log(JSON.stringify(event, null, 4));
};

const task = new Entity(
  {
    // your model
  },
  {
    client,
    table,
    logger, // <----- logger listener
  }
);
```

_On the instantiation of an `Service`:_

```typescript
import { DynamoDB } from "aws-sdk";
import { Entity, ElectroEvent } from "electrodb";

const table = "my_table_name";
const client = new DynamoDB.DocumentClient();
const logger = (event: ElectroEvent) => {
  console.log(JSON.stringify(event, null, 4));
};

const task = new Entity({
  // your model
});

const user = new Entity({
  // your model
});

const service = new Service(
  { task, user },
  {
    client,
    table,
    logger, // <----- logger listener
  }
);
```

_As a [Query Option](#query-options):_

```typescript
const logger = (event: ElectroEvent) => {
  console.log(JSON.stringify(event, null, 4));
};

task.query.assigned({ userId }).go({ logger });
```

# Events

ElectroDB can be supplied with callbacks (see: [logging](#logging) and [listeners](#listeners) to learn how) to be invoked after certain request lifecycles. This can be useful for logging, analytics, expanding functionality, and more. The following are events currently supported by ElectroDB -- if you would like to see additional events feel free to create a github issue to discuss your concept/need!

## Query Event

The `query` event occurs when a query is made via the terminal methods [`go()`](#go) and [`page()`](#page). The event includes the exact parameters given to the provided client, the ElectroDB method used, and the ElectroDB configuration provided.

_Type:_

```typescript
interface ElectroQueryEvent<P extends any = any> {
  type: "query";
  method:
    | "put"
    | "get"
    | "query"
    | "scan"
    | "update"
    | "delete"
    | "remove"
    | "patch"
    | "create"
    | "batchGet"
    | "batchWrite";
  config: any;
  params: P;
}
```

_Example Input:_

```typescript
const prop1 = "22874c81-27c4-4264-92c3-b280aa79aa30";
const prop2 = "366aade8-a7c0-4328-8e14-0331b185de4e";
const prop3 = "3ec9ed0c-7497-4d05-bdb8-86c09a618047";

entity.update({ prop1, prop2 }).set({ prop3 }).go();
```

_Example Output:_

```json
{
  "type": "query",
  "method": "update",
  "params": {
    "UpdateExpression": "SET #prop3 = :prop3_u0, #prop1 = :prop1_u0, #prop2 = :prop2_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0",
    "ExpressionAttributeNames": {
      "#prop3": "prop3",
      "#prop1": "prop1",
      "#prop2": "prop2",
      "#__edb_e__": "__edb_e__",
      "#__edb_v__": "__edb_v__"
    },
    "ExpressionAttributeValues": {
      ":prop3_u0": "3ec9ed0c-7497-4d05-bdb8-86c09a618047",
      ":prop1_u0": "22874c81-27c4-4264-92c3-b280aa79aa30",
      ":prop2_u0": "366aade8-a7c0-4328-8e14-0331b185de4e",
      ":__edb_e___u0": "entity",
      ":__edb_v___u0": "1"
    },
    "TableName": "electro",
    "Key": {
      "pk": "$test#prop1_22874c81-27c4-4264-92c3-b280aa79aa30",
      "sk": "$testcollection#entity_1#prop2_366aade8-a7c0-4328-8e14-0331b185de4e"
    }
  },
  "config": {}
}
```

## Results Event

The `results` event occurs when results are returned from DynamoDB. The event includes the exact results returned from the provided client, the ElectroDB method used, and the ElectroDB configuration provided. Note this event handles both failed (or thrown) results in addition to returned (or resolved) results.

> **Pro-Tip:**
> Use this event to hook into the DyanmoDB's [consumed capacity](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Query.html#DDB-Query-request-ReturnConsumedCapacity) statistics to learn more about the impact and cost associated with your queries.

_Type::_

```typescript
interface ElectroResultsEvent<R extends any = any> {
  type: "results";
  method:
    | "put"
    | "get"
    | "query"
    | "scan"
    | "update"
    | "delete"
    | "remove"
    | "patch"
    | "create"
    | "batchGet"
    | "batchWrite";
  config: any;
  results: R;
  success: boolean;
}
```

_Example Input:_

```typescript
const prop1 = "22874c81-27c4-4264-92c3-b280aa79aa30";
const prop2 = "366aade8-a7c0-4328-8e14-0331b185de4e";

entity.get({ prop1, prop2 }).go();
```

_Example Output:_

```typescript
{
  "type": "results",
  "method": "get",
  "config": {  },
  "success": true,
  "results": {
    "Item": {
      "prop2": "366aade8-a7c0-4328-8e14-0331b185de4e",
      "sk": "$testcollection#entity_1#prop2_366aade8-a7c0-4328-8e14-0331b185de4e",
      "prop1": "22874c81-27c4-4264-92c3-b280aa79aa30",
      "prop3": "3ec9ed0c-7497-4d05-bdb8-86c09a618047",
      "__edb_e__": "entity",
      "__edb_v__": "1",
      "pk": "$test_1#prop1_22874c81-27c4-4264-92c3-b280aa79aa30"
    }
  }
}
```

# Listeners

ElectroDB can be supplied with callbacks (called "Listeners") to be invoked after certain request lifecycles. Unlike [Attribute Getters and Setters](#attribute-getters-and-setters), Listeners are implemented to react to events passively, not to modify values during the request lifecycle. Listeners can be useful for logging, analytics, expanding functionality, and more. Listeners can be provide both the at the instantiation of an `Entity` or `Service` instance or as a [Query Option](#query-options).

> \_NOTE: Listeners treated as synchronous callbacks and are not awaited. In the event that a callback throws an exception, ElectroDB will quietly catch and log the exception with `console.error` to prevent the exception from impacting your query.

_On the instantiation of an `Entity`:_

```typescript
import { DynamoDB } from "aws-sdk";
import { Entity, ElectroEvent } from "electrodb";

const table = "my_table_name";
const client = new DynamoDB.DocumentClient();
const listener1 = (event: ElectroEvent) => {
  // do work
};

const listener2 = (event: ElectroEvent) => {
  // do work
};

const task = new Entity(
  {
    // your model
  },
  {
    client,
    table,
    listeners: [
      listener1,
      listener2, // <----- supports multiple listeners
    ],
  }
);
```

_On the instantiation of an `Service`:_

```typescript
import { DynamoDB } from "aws-sdk";
import { Entity, ElectroEvent } from "electrodb";

const table = "my_table_name";
const client = new DynamoDB.DocumentClient();

const listener1 = (event: ElectroEvent) => {
  // do work
};

const listener2 = (event: ElectroEvent) => {
  // do work
};

const task = new Entity({
  // your model
});

const user = new Entity({
  // your model
});

const service = new Service(
  { task, user },
  {
    client,
    table,
    listeners: [
      listener1,
      listener2, // <----- supports multiple listeners
    ],
  }
);
```

_As a [Query Option](#query-options):_

```typescript
const listener1 = (event: ElectroEvent) => {
  // do work
};

const listener2 = (event: ElectroEvent) => {
  // do work
};

task.query.assigned({ userId }).go({ listeners: [listener1, listener2] });
```

# Electro CLI

> _NOTE: The ElectroCLI is currently in a beta phase and subject to change._

Electro is a CLI utility toolbox for extending the functionality of **ElectroDB**. Current functionality of the CLI allows you to:

1. Execute queries against your `Entities`, `Services`, `Models` directly from the command line.
2. Dynamically stand up an HTTP Service to interact with your `Entities`, `Services`, `Models`.

For usage and installation details you can learn more [here](https://github.com/tywalch/electrocli).
