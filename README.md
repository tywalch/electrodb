
# ElectroDB  
[![Coverage Status](https://coveralls.io/repos/github/tywalch/electrodb/badge.svg?branch=master)](https://coveralls.io/github/tywalch/electrodb?branch=master&kill_cache=please)
[![Coverage Status](https://img.shields.io/npm/dt/electrodb.svg)](https://www.npmjs.com/package/electrodb) 
![npm bundle size](https://img.shields.io/bundlephobia/min/electrodb) [![Build Status](https://travis-ci.org/tywalch/electrodb.svg?branch=master)](https://travis-ci.org/tywalch/electrodb)
[![Runkit Demo](https://img.shields.io/badge/runkit-electrodb-db4792)](https://runkit.com/tywalch/creating-and-querying-an-electrodb-service)

![ElectroDB](https://github.com/tywalch/electrodb/blob/master/assets/electrodb-drk.png?raw=true)
***ElectroDB*** is a dynamodb library to ease the use of having multiple entities and complex hierarchical relationships in a single dynamodb table. 

*This library is a work in progress, please submit issues/feedback or reach out on twitter [@tinkertamper](https://twitter.com/tinkertamper)*. 

### Try it out for yourself! https://runkit.com/tywalch/electrodb-building-queries

## Features  
- [**Attribute Schema Enforcement**](#attributes) - Define a schema for your entities with enforced attribute validation, defaults, types, aliases, and more.
- [**Easily Compose Hierarchical Access Patterns**](#facets) - Plan and design hierarchical keys for your indexes to multiply your possible access patterns.
- [**Single Table Entity Segregation**](#model) - Entities created with **ElectroDB** will not conflict with other entities when using a single table.   
- [**Simplified Sort Key Condition Querying**](#building-queries) - Write efficient sort key queries by easily building compose keys.
- [**Simplified Filter Composition**](#where) - Easily create complex readable filters for DynamoDB queries without worrying about the implementation of `ExpressionAttributeNames`, `ExpressionAttributeValues`. 
- [**Easily Query Across Entities**](#collections) - Define "collections" to create powerful/peformant queries that return multiple entities in a single request.
- [**Automatic Index Selection**](#find-records) - Use `.find()` method to dynamically and effeciently query based on defined sort key structures. 
- [**Simplified Pagination API**](#page) - Use `.page()` to easily iterate through multiquery result sets.
- [**Use With Your Existing Solution**](#facet-templates) - If you are already using DynamoDB, and want to use ElectroDB, use custom Facet Templates to leverage your existing key structures.
- [**Generate Type Defintions**](#electro-cli) - Generate **TypeScript** type definition files (`.d.ts`) based on your model.
- [**Query Directly via the Terminal**](#electro-cli) - Execute queries against your  `Entities`, `Services`, `Models` directly from the command line.
- [**Stand Up HTTP Service for Entities**](#electro-cli) - stand up an HTTP Service to interact with your `Entities`, `Services`, `Models` for easier prototyping.

------------

**Turn this**
```javascript
StoreLocations.query
        .leases({storeId})
        .gte({leaseEndDate: "2010"})
        .where((attr, op) => `
            ${op.eq(attr.cityId, "Atlanta1")} AND ${op.contains(attr.category, "food")}
        `)
        .params()
```
**Into This**
```javascript
{
    "TableName": "StoreDirectory",
    "ExpressionAttributeNames": {
        "#cityId": "cityId",
        "#category": "category",
        "#pk": "gis2pk",
        "#sk1": "gsi2sk"
    },
    "ExpressionAttributeValues": {
        ":cityId_w1": "Atlanta1",
        ":category_w1": "food",
        ":pk": "$mallstoredirectory#storeid_lattelarrys",
        ":sk1": "$mallstore_1#leaseenddate_2010"
    },
    "KeyConditionExpression": "#pk = :pk and #sk1 >= :sk1",
    "IndexName": "gis2pk-gsi2sk-index",
    "FilterExpression": "#cityId = :cityId_w1 AND contains(#category, :category_w1)"
}
``` 

### Try it out for yourself! https://runkit.com/tywalch/electrodb-building-queries

------------

## Table of Contents

- [ElectroDB](#electrodb)
  * [Features](#features)
  * [Table of Contents](#table-of-contents)
- [Installation](#installation)
- [Usage](#usage)
- [Entities and Services](#entities-and-services)
- [Entities](#entities)
- [Services](#services)
  * [Join](#join) 
  * [Model](#model)
    + [Model Properties](#model-properties)
    + [Service Properties](#service-properties)
    + [Model/Service Options](#model-service-options)
  * [Attributes](#attributes)
      - [Simple Syntax](#simple-syntax)
      - [Expanded Syntax](#expanded-syntax)
      - [Attribute Validation](#attribute-validation)
  * [Indexes](#indexes)
      - [Indexes Without Sort Keys](#indexes-without-sort-keys)
      - [Indexes With Sort Keys](#indexes-with-sort-keys)
  * [Facets](#facets)
    + [Facet Arrays](#facet-arrays)
    + [Facet Templates](#facet-templates)
  * [Collections](#collections)
  * [Filters](#filters)
    + [Defined on the model](#defined-on-the-model)
    + [Defined via Filter method after query operators](#defined-via-filter-method-after-query-operators)
    + [Multiple Filters](#multiple-filters)
  * [Where](#where)
    + [FilterExpressions](#filterexpressions)
    + [ConditionExpressions](#conditionexpressions)
    + [Attributes and Operations](#attributes-and-operations)
    + [Multiple Where Clauses](#multiple-where-clauses)
- [Building Queries](#building-queries)
    + [Sort Key Operations](#sort-key-operations)
    + [Using facets to make hierarchical keys](#using-facets-to-make-hierarchical-keys)
      - [Shopping Mall Stores](#shopping-mall-stores)
  * [Query Chains](#query-chains)
    + [Get Record](#get-method)
    + [Batch Get](#batch-get)
    + [Delete Record](#delete-method)
    + [Batch Write - Delete Records](#batch-write-delete-records)
    + [Put Record](#put-record)
    + [Batch Write - Put Records](#batch-write-put-records)
    + [Update Record](#update-record)
    + [Scan Records](#scan-records)
    + [Patch Records](#patch-records)
    + [Create Records](#create-records)
    + [Find Records](#find-records)
    + [Access Pattern Queries](#access-pattern-queries)
	   - [Begins With Queries](#begins-with-queries)
    + [Query Records](#query-records)
      - [Partition Key Facets](#partition-key-facets)
  * [Collection Chains](#collection-chains)
  * [Execute Queries](#execute-queries)
    + [Params](#params)
    + [Go](#go)
    + [Page](#page)
  * [Query Examples](#query-examples)
  * [Query Options](#query-options)
- [Examples](#examples)
  * [Employee App](#employee-app)
    + [Employee App Requirements](#employee-app-requirements)
    + [Entities](#entities-1)
    + [Query Records](#query-records-1)
      - [All tasks and employee information for a given employee](#all-tasks-and-employee-information-for-a-given-employee)
      - [Find all employees and office details for a given office](#find-all-employees-and-office-details-for-a-given-office)
      - [Tasks for a given employee](#tasks-for-a-given-employee)
      - [Tasks for a given project](#tasks-for-a-given-project)
      - [Find office locations](#find-office-locations)
      - [Find employee salaries and titles](#find-employee-salaries-and-titles)
      - [Find employee birthdays or anniversaries](#find-employee-birthdays-or-anniversaries)
      - [Find direct reports](#find-direct-reports)
  * [Shopping Mall Property Management App](#shopping-mall-property-management-app)
    + [Shopping Mall Requirements](#shopping-mall-requirements)
    + [Access Patterns are accessible on the StoreLocation](#access-patterns-are-accessible-on-the-storelocation)
    + [PUT Record](#put-record)
      - [Add a new Store to the Mall](#add-a-new-store-to-the-mall)
    + [UPDATE Record](#update-record)
      - [Change the Store's Lease Date](#change-the-store-s-lease-date)
    + [GET Record](#get-record)
      - [Retrieve a specific Store in a Mall](#retrieve-a-specific-store-in-a-mall)
    + [DELETE Record](#delete-record)
      - [Remove a Store location from the Mall](#remove-a-store-location-from-the-mall)
    + [Query Records](#query-records-2)
      - [All Stores in a particular mall](#all-stores-in-a-particular-mall)
      - [All Stores in a particular mall building](#all-stores-in-a-particular-mall-building)
      - [Find the store located in unit B47](#find-the-store-located-in-unit-b47)
      - [Stores by Category at Mall](#stores-by-category-at-mall)
      - [Stores by upcoming lease](#stores-by-upcoming-lease)
      - [Stores will renewals for Q4](#stores-will-renewals-for-q4)
      - [Spite-stores with release renewals this year](#spite-stores-with-release-renewals-this-year)
      - [All Latte Larrys in a particular mall building](#all-latte-larrys-in-a-particular-mall-building)
- [Electro CLI](#electro-cli)
  * [TypeScript](#electro-cli)
- [Version 1.0 Migration](#version-1-migration)
- [Coming Soon](#coming-soon)

# Installation    

Install from NPM  

```bash  
npm install electrodb --save
```


# Usage
Require `Entity` and/or `Service` from `electrodb`:    
```javascript  
const {Entity, Service} = require("electrodb");
```

# Entities and Services
> To see full examples of ***ElectroDB*** in action, go to the [Examples](#examples) section.

`Entity` allows you to create separate and individual business objects in a *DynamoDB* table. When queried, your results will not include other Entities that also exist the same table. This allows you to easily achieve single table design as recommended by AWS. For more detail, read [Entities](#entities). 

`Service` allows you to build a relationships across Entities. A service imports Entity [Models](#model), builds individual Entities, and creates [Collections](#collections) to allow cross Entity querying. For more detail, read [Services](#services).

You can use Entities independent of Services, you do not need to import models into a Service to use them individually. However, If you intend to make queries that `join` or span multiple Entities you will need to use a Service.

# Entities  

In ***ElectroDB*** an `Entity` is represents a single business object. For example, in a simple task tracking application, one Entity could represent an Employee and or a Task that the employee is assigned to. 

Require or import `Entity` from `electrodb`:    
```javascript  
const {Entity} = require("electrodb");
```

# Services
In ***ElectroDB*** a `Service` represents a collection of Entities and also allows you to build queries span across Entities. Similar to Entities, Services can coexist on a single table without collision. You can use Entities independent of Services, you do not need to import models into a Service to use them individually. However, you do you need to use a Service if you intend make queries that `join` multiple Entities.

Require `electrodb`:    
```javascript  
const {Service} = require("electrodb");
```

## Join 
Create individual (Entities)[#entities] with the (Models)[#models] or `join` them via a Service. 

```javascript
// Independent Models
let table = "my_table_name";
let employees = new Entity(EmployeesModel, { client, table });
let tasks = new Entity(TasksModel, { client, table });
```

```javascript
// Joining Entity instances to a Service
let TaskApp = new Service("TaskApp", { client, table });
TaskApp
	.join(employees) // available at TaskApp.entities.employees
	.join(tasks);    // available at TaskApp.entities.tasks
```

```javascript
// Joining models to a Service
let TaskApp = new Service("TaskApp", { client, table });
TaskApp
	.join(EmployeesModel) // available at TaskApp.entities.employees
	.join(TasksModel);    // available at TaskApp.entities.tasks
```
 
When joining a Model/Entity to a Service a number of validations are done to ensure that Entity conforms to expectations collectively established by all joined Entities.

- [Entity](#entities) names must be unique across a Service.
- [Collection](#collections) names must be unique accross a Service.
- The [name of the Service in the Model](#model-properties) must match the Name defined on the [Service](#service) instance.
- Joined instances must be type [Model](#model) or [Entity](#entities).
- If the attributes of an Entity have overlapping names with other attributes in that service, they must all have compatible or matching [attribute options](#attributes).   
- All primary and global secondary indexes must have the same name field names and be written to assume SortKeys exist/don't exist in the same manor. See [Indexes](#indexes).
- All models conform to the same model format. If your model was made pre-electrodb version 0.9.19 see section [Version 1 Migration](#version-1-migration). 

## Model 

Create an Entity's schema. In the below example.

```javascript
const DynamoDB = require("aws-sdk/clients/dynamodb");
const {Entity, Service} = require("electrodb");
const client = new DynamoDB.DocumentClient();
const EmployeesModel = {
	model: {
		entity: "employees",
		version: "1",
		service: "taskapp",
	},
	attributes: {
		employee: {
			type: "string",
			default: () => uuidv4(),
		},
		firstName: {
			type: "string",
			required: true,
		},
		lastName: {
			type: "string",
			required: true,
		},
		office: {
			type: "string",
			required: true,
		},
		title: {
			type: "string",
			required: true,
		},
		team: {
			type: ["development", "marketing", "finance", "product", "cool cats and kittens"],
			required: true,
		},
		salary: {
			type: "string",
			required: true,
		},
		manager: {
			type: "string",
		},
		dateHired: {
			type: "string",
			validate: /^\d{4}-\d{2}-\d{2}$/gi
		},
		birthday: {
			type: "string",
			validate: /^\d{4}-\d{2}-\d{2}$/gi
		},
	},
	indexes: {
		employee: {
			pk: {
				field: "pk",
				facets: ["employee"],
			},
			sk: {
				field: "sk",
				facets: [],
			},
		},
		coworkers: {
			index: "gsi1pk-gsi1sk-index",
			collection: "workplaces",
			pk: {
				field: "gsi1pk",
				facets: ["office"],
			},
			sk: {
				field: "gsi1sk",
				facets: ["team", "title", "employee"],
			},
		},
		teams: {
			index: "gsi2pk-gsi2sk-index",
			pk: {
				field: "gsi2pk",
				facets: ["team"],
			},
			sk: {
				field: "gsi2sk",
				facets: ["title", "salary", "employee"],
			},
		},
		employeeLookup: {
			collection: "assignments",
			index: "gsi3pk-gsi3sk-index",
			pk: {
				field: "gsi3pk",
				facets: ["employee"],
			},
			sk: {
				field: "gsi3sk",
				facets: [],
			},
		},
		roles: {
			index: "gsi4pk-gsi4sk-index",
			pk: {
				field: "gsi4pk",
				facets: ["title"],
			},
			sk: {
				field: "gsi4sk",
				facets: ["salary", "employee"],
			},
		},
		directReports: {
			index: "gsi5pk-gsi5sk-index",
			pk: {
				field: "gsi5pk",
				facets: ["manager"],
			},
			sk: {
				field: "gsi5sk",
				facets: ["team", "office", "employee"],
			},
		},
	},
	filters: {
		upcomingCelebrations: (attributes, startDate, endDate) => {
			let { dateHired, birthday } = attributes;
			return `${dateHired.between(startDate, endDate)} OR ${birthday.between(
				startDate,
				endDate,
			)}`;
		},
	},
};

const TasksModel = {
	model: {
		entity: "tasks",
		version: "1",
		service: "taskapp",
	},
	attributes: {
		task: {
			type: "string",
			default: () => uuidv4(),
		},
		project: {
			type: "string",
		},
		employee: {
			type: "string",
		},
		description: {
			type: "string",
		},
	},
	indexes: {
		task: {
			pk: {
				field: "pk",
				facets: ["task"],
			},
			sk: {
				field: "sk",
				facets: ["project", "employee"],
			},
		},
		project: {
			index: "gsi1pk-gsi1sk-index",
			pk: {
				field: "gsi1pk",
				facets: ["project"],
			},
			sk: {
				field: "gsi1sk",
				facets: ["employee", "task"],
			},
		},
		assigned: {
			collection: "assignments",
			index: "gsi3pk-gsi3sk-index",
			pk: {
				field: "gsi3pk",
				facets: ["employee"],
			},
			sk: {
				field: "gsi3sk",
				facets: ["project", "task"],
			},
		},
	},
};
```

### Model Properties

| Property | Description |
| ----------- | ----------- |
| model.service  | Name of the application using the entity, used to namespace all entities
| model.entity   | Name of the entity that the schema represents 
| model.version  | (optional) The version number of the schema, used to namespace keys    
| attributes     | An object containing each attribute that makes up the schema  
| indexes        | An object containing table indexes, including the values for the table's default Partition Key and Sort Key
| filters        | An object containing user defined filter template functions


### Model Service Options
Optional second parameter
| Property | Description |
| ----------- | ----------- |
| table | Name of the dynamodb table in aws
| client  | (optional) An instance of the `docClient` from the `aws-sdk` for use when querying a DynamoDB table. This is optional if you wish to only use the `params` functionality, but required if you actually need to query against a database.

## Attributes
**Attributes** define an **Entity** record. The `AttributeName` represents the value your code will use to represent an attribute. 

> **Pro-Tip:**
> Using the `field` property, you can map an `AttributeName` to a different field name in your table. This can be useful to utilize existing tables, existing models, or even to reduce record sizes via shorter field names. For example, you may refer to an attribute as `organization` but want to save the attribute with a field name of `org` in DynamoDB. 

#### Simple Syntax
Assign just the `type` of the attribute directly to the attribute name. Currently supported options are "string", "number", "boolean", an array of strings representing a fixed set of possible values, or "any" which disables value type checking on that attribute.
```typescript
attributes: {
	<AttributeName>: "string"|"number"|"boolean"|"any"|string[]
}
```

#### Expanded Syntax
Use the expanded syntax build out more robust attribute options.
```typescript
attributes: {
	<AttributeName>: {
		"type": string|string[],
		"required"?: boolean,
		"default"?: value|() => value
		"validate"?: RegExp|(value: any) => void|string
		"field"?: string
		"readOnly"?: boolean
		"label"?: string
		"cast"?: "number"|"string"|"boolean",
		"get"?: (attribute, schema) => value,
		"set"?: (attribute, schema) => value 
	}
}
```

| Property | Type | Required | Description |
| -------- | :--: | :--: | ----------- |
| `type`  | `string`, `string[]` | yes | Accepts the values: `"string"`, `"number"` `"boolean"`, an array of strings representing a finite list of acceptable values: `["option1", "option2", "option3"]`, or `"any"`which disables value type checking on that attribute. |
`required` | `boolean` | no | Whether or not the value is required when creating a new record. |  
`default` | `value`, `() => value` | no | Either the default value itself or a synchronous function that returns the desired value. |  
`validate` | `RegExp`, `(value: any) => void`, `(value: any) => string` | no | Either regex or a synchronous callback to return an error string (will result in exception using the string as the error's message), or thrown exception in the event of an error. |  
`field` | `string` | no | The name of the attribute as it exists dynamo, if named differently in the schema attributes. Defaults to the `AttributeName` as defined in the schema.
`readOnly` | `boolean` | no | Prevents update of the property after the record has been created. Attributes used in the composition of the table's primary Partition Key and Sort Key are by read-only by default.
`label` | `string` | no | Used in index composition to prefix key facets. By default, the `AttributeName` is used as the label.
`cast` | `"number"`, `"string"`, `"boolean"` | no | Optionally cast attribute values when interacting with DynamoDB. Current options include: "number", "string", and "boolean".
`set` | `(attribute, schema) => value` | no | A synchronous callback allowing you apply changes to a value before it is set in params or applied to the database. First value represents the value passed to ElectroDB, second value are the attributes passed on that update/put 
`get` | `(attribute, schema) => value` | no | A synchronous callback allowing you apply changes to a value after it is retrieved from the database. First value represents the value passed to ElectroDB, second value are the attributes retrieved from the database. 

#### Attribute Validation
The `validation` property allows for many different function/type signatures. Here the different combinations *ElectroDB* supports:
| signature | behavior |
| --------- | -------- |
| `Regexp`  | ElectroDB will call `.test(val)` on the provided regex with the value passed to this attribute |
| `(value: T) => string`  | If a string with length is returned from `validate` it will be considered the _reason_ an the value is invalid. It will generate an error message with this reason. |
| `(value: T) => boolean` | If a boolean is returned, true or truthy values will signify than a value is invalid while false or falsey will be considered valid |
| `(value: T) => void`    | A void/undefined return will be treated as successful, in this scenario you can throw an Error yourself to interrupt the query |  
  

## Indexes
The `indexes` object requires at least the definition of the table's natural **Partition Key** and (if applicable) **Sort Key**.

Indexes are defined, and later referenced by their `AccessPatternName`. These defined via a `facets` array that is made up of attributes names as listed the model.

```typescript
indexes: {
	<AccessPatternName>: {
		"pk": {
			"field": <string>
			"facets": <AttributeName[]>
		},
		"sk"?: {
			"field": <string>
			"facets": <AttributesName[]>
		},
		"index"?: string
		"collection"?: string
	}
}
```

| Property | Type | Required | Description |
| -------- | :--: | :--: | ----------- |
| `pk`  | `object` | yes | Configuration for the pk of that index or table |
`pk.facets` | `boolean` | no | An array that represents the order in which attributes are concatenated to facets the key (see [Facets](#facets) below for more on this functionality). |  
`pk.field` | `string` | yes | The name of the attribute as it exists dynamo, if named differently in the schema attributes. | 
| `sk`  | `object` | no | Configuration for the sk of that index or table |  
`sk.facets` | `array | string` | no | Either an Array that represents the order in which attributes are concatenated to facets the key, or a String for a facet template. (see [Facets](#facets) below for more on this functionality). |  
`sk.field` | `string` | yes | The name of the attribute as it exists dynamo, if named differently in the schema attributes. |  
`index` | `string` | no | Required when the `Index` defined is a *Secondary Index*; but is left blank for the table's primary index. |
`collection` | `string` | no | Used when models are joined to a `Service`. When two entities share a `collection` on the same `index`, they can be queried with one request to DynamoDB. The name of the collection should represent what the query would return as a pseudo `Entity`. (see [Collections](#collections) below for more on this functionality). 

### Indexes Without Sort Keys
When using indexes without Sort Keys, that should be expressed as an index *without* an `sk` property at all. Indexes without an `sk` cannot have a collection, see (Collections)[[#collections] for more detail. 

> Note: It is generally recommended to have Sort Keys when using ElectroDB as they allow for more advanced query opportunities. Even if your model doesnt _need_ an additional property to define a unique record, having an `sk` with no facets still opens the door to many more query opportunities like (collections)[#collections].

```javascript
// ElectroDB interprets as index *not having* an SK.
{
  indexes: {
    myIndex: {
      pk: {
        field: "pk",
        facets: ["id"]
      }
    }
  }
}
```

### Indexes With Sort Keys
When using indexes with Sort Keys, that should be expressed as an index *with* an `sk` property. If you don't wish to use the `sk` in your model, but it does exist on the table, simply use an empty for the `facets` property. This is still useful as it opens the door to many more query opportunities like (collections)[#collections].

```javascript
// ElectroDB interprets as index *having* SK, but this model doesnt attach any facets to it.
{
  indexes: {
    myIndex: {
      pk: {
        field: "pk",
        facets: ["id"]
      },
      sk: {
        field: "sk",
        facets: []
      }
    }
  }
}
```  

## Facets 
A **Facet** is a segment of a key based on one of the attributes. **Facets** are concatenated together from either a **Partition Key** or an **Sort Key** key, which define an `index`.

> Note: Only attributes with a type of `"string"`, `"number"`, or `"boolean"` can be used as a facet 

There are two ways to provide facets:
1. As a [Facet Array](#facet-arrays)
2. As a [Facet Template](#facet-templates)

For example, in the following **Access Pattern**, "`locations`" is made up of the facets `storeId`, `mallId`, `buildingId` and `unitId` which map to defined attributes in the `schema`:
```
// Input
{
    storeId: "STOREVALUE",
    mallId: "MALLVALUE",
    buildingId: "BUILDINGVALUE",
    unitId: "UNITVALUE"
};

// Output:
{
	pk: '$mallstoredirectory_1#storeId_storevalue',
	sk: '$mallstores#mallid_mallvalue#buildingid_buildingvalue#unitid_unitvalue'
}
```

For `PK` values, the `service` and `version` values from the model are prefixed onto the key.

For `SK` values, the `entity` value from the model is prefixed onto the key. 

### Facet Arrays
In a Facet Array, each element is the name of the corresponding Attribute defined in the Model. If the Attribute has a `label` property, that will be used to prefix the facets, otherwise the full Attribute name will be used.
```javascript
attributes: {
	storeId: {
		type: "string",
		label: "sid",
	},
	mallId: {
		type: "string",
		label: "mid",
	},
	buildingId: {
		type: "string",
		label: "bid",
	},
	unitId: {
		type: "string",
		label: "uid",
	}
},
indexes: {
	locations: {
		pk: {
			field: "pk",
			facets: ["storeId"]
		},
		sk: {
			field: "sk",
			facets: ["mallId", "buildingId", "unitId"]
		}
	}
}
    
// Input
{
    storeId: "STOREVALUE",
    mallId: "MALLVALUE",
    buildingId: "BUILDINGVALUE",
    unitId: "UNITVALUE"
};

// Output:
{
	pk: '$mallstoredirectory_1#sid_storevalue',
	sk: '$mallstores#mid_mallvalue#bid_buildingvalue#uid_unitvalue'
}
```
### Facet Templates
In a Facet Template, you provide a formatted template for ElectroDB to use when making keys. Facet Templates allow for potential ElectroDB adoption on already established tables and records.

Attributes are identified by a prefixed colon and the attributes name. For example, the syntax `:storeId`  will matches `storeId` attribute in the `model`. 

Convention for a composing a key use the `#` symbol to separate attributes, and for labels to attach with underscore. For example, when composing both the `mallId` and `buildingId`  would be expressed as `mid_:mallId#bid_:buildingId`. 

> ***ElectroDB*** will not prefix templated keys with the Entity, Project, Version, or Collection. This will give you greater control of your keys but will limit ***ElectroDB's*** ability to prevent leaking entities with some queries.

Facet Templates have some "gotchas" to consider: 
	1. Keys only allow for one instance of an attribute, the template `:prop1#:prop1` will be interpreted the same as `:prop1#`. 
	2. ElectoDB will continue to always add a trailing delimiter to facets with keys are partially supplied. (More documentation coming on this soon)   

```javascript
attributes: {
	storeId: {
		type: "string"
	},
	mallId: {
		type: "string"
	},
	buildingId: {
		type: "string"
	},
	unitId: {
		type: "string"
	}
},
indexes: {
	locations: {
		pk: {
			field: "pk",
			facets: "sid_:storeId"
		},
		sk: {
			field: "sk",
			facets: "mid_:mallId#bid_:buildingId#uid_:unitId"
		}
	}
}


// Input
{
    storeId: "STOREVALUE",
    mallId: "MALLVALUE",
    buildingId: "BUILDINGVALUE",
    unitId: "UNITVALUE"
};

// Output:
{
	pk: 'sid_storevalue',
	sk: 'mid_mallvalue#bid_buildingvalue#uid_unitvalue'
}
```

## Collections
A Collection is a grouping of Entities with the same Partition Key and allows you to make efficient query across multiple entities. If you background is SQL, imagine Partition Keys as Foreign Keys, a Collection represents a View with multiple joined Entities. 

Collections are defined on an Index, and the name of the collection should represent what the query would return as a pseudo `Entity`. Additionally Collection names must be unique across a `Service`.

> **Note**: `collection` should be unique to a single common index across entities. 

Using the TaskApp Models defined in [Models](#model), these models share a `collection` called `assignments` on the index `gsi3pk-gsi3sk-index`
```javascript
let TaskApp =  new  Service("projectmanagement", { client, table: "projectmanagement" }); 
TaskApp
	.join(EmployeesModel) // TaskApp.entities.employees
	.join(TasksModel);    // TaskApp.entities.tasks

TaskApp.collections.assignments({employee: "JExotic"}).params();

// Results
{
  TableName: 'projectmanagement',
  ExpressionAttributeNames: { '#pk': 'gsi3pk', '#sk1': 'gsi3sk' },
  ExpressionAttributeValues: { ':pk': '$taskapp_1#employee_joeexotic', ':sk1': '$assignments' },
  KeyConditionExpression: '#pk = :pk and begins_with(#sk1, :sk1)',
  IndexName: 'gsi3pk-gsi3sk-index'
}
```

## Filters 

> Filters are no longer the preferred way to add FilterExpressions. Checkout the [Where](#where) section to find out about how to apply FilterExpressions and ConditionExpressions

Building thoughtful indexes can make queries simple and performant. Sometimes you need to filter results down further. By adding Filters to your model, you can extend your queries with custom filters. Below is the traditional way you would add a filter to Dynamo's DocumentClient directly along side how you would accomplish the same using a Filter function.

```javascript
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
### Defined on the model
Filters can defined on the model and used in your query chain.  

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
let stores  =  MallStores.query
	.stores({ mallId: "EastPointe" })
	.between({ leaseEndDate:  "2020-04-01" }, { leaseEndDate:  "2020-07-01" })
	.rentPromotions(minRent, maxRent, promotion)
	.params();

// Results
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
The easiest way to use filters is to use them inline in your query chain.

```javascript
let StoreLocations  =  new Entity(model, {table: "StoreDirectory"});
let maxRent = "5000.00";
let minRent = "2000.00";
let promotion = "1000.00";
let stores  =  StoreLocations.query
	.leases({ mallId: "EastPointe" })
	.between({ leaseEndDate:  "2020-04-01" }, { leaseEndDate:  "2020-07-01" })
	.filter(({rent, discount}) => `
		${rent.between(minRent, maxRent)} AND ${discount.lte(promotion)}
	`)
	.params();

// Results
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

operator | example | result
| ----------- | ----------- | ----------- |  
`gte` | `rent.gte(maxRent)` | `#rent >= :rent1`
`gt` | `rent.gt(maxRent)` | `#rent > :rent1`
`lte` | `rent.lte(maxRent)` | `#rent <= :rent1`
`lt` | `rent.lt(maxRent)` | `#rent < :rent1`
`eq` | `rent.eq(maxRent)` | `#rent = :rent1`
`begins` | `rent.begins(maxRent)` | `begins_with(#rent, :rent1)`
`exists` | `rent.exists()` | `attribute_exists(#rent)`
`notExists` | `rent.notExists()` | `attribute_not_exists(#rent)`
`contains` | `rent.contains(maxRent)` | `contains(#rent = :rent1)`
`notContains` | `rent.notContains(maxRent)` | `not contains(#rent = :rent1)`
`between` | `rent.between(minRent, maxRent)` | `(#rent between :rent1 and :rent2)`
`name` | `rent.name()` | `#rent`
`value` | `rent.value(maxRent)` | `:rent1`

This functionality allows you to write the remaining logic of your `FilterExpression` with ease. Add complex nested `and`/`or` conditions or other `FilterExpression` logic while ElectroDB handles the  `ExpressionAttributeNames` and `ExpressionAttributeValues`.

### Multiple Filters
It is possible to include chain multiple filters. The resulting FilterExpressions are concatinated with an implicit `AND` operator.

```javascript
let MallStores = new Entity(model, {table: "StoreDirectory"});
let stores = MallStores.query
	.leases({ mallId: "EastPointe" })
	.between({ leaseEndDate: "2020-04-01" }, { leaseEndDate: "2020-07-01" })
	.filter(({ rent, discount }) => `
		${rent.between("2000.00", "5000.00")} AND ${discount.eq("1000.00")}
	`)
	.filter(({ category }) => `
		${category.eq("food/coffee")}
	`)
	.params();

// Results
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

## Where 

> The `where()` method is an improvement on the `filter()` method. Unlike `filter`, `where` will be compatible with upcoming features related to complex types.

Building thoughtful indexes can make queries simple and performant. Sometimes you need to filter results down further or add conditions to an update/patch/put/create/delete action. 

### FilterExpressions

Below is the traditional way you would add a `FilterExpression` to Dynamo's DocumentClient directly along side how you would accomplish the same using the `where` method.

```javascript
{
  KeyConditionExpression: '#pk = :pk and begins_with(#sk1, :sk1)',
  TableName: 'zoodirectory',
  ExpressionAttributeNames: {
    '#animal': 'animal',
    '#lastFed': 'lastFed',
    '#pk': 'pk',
    '#sk1': 'sk'
  },
  ExpressionAttributeValues: {
    ':animal_w1': 'Warthog',
    ':lastFed_w1': '2020-09-25',
    ':lastFed_w2': '2020-09-28',
    ':pk': '$zoodirectory_1#habitat_africa',
    ':sk1': '$exibits#enclosure_'
  },
  FilterExpression: '#animal = :animal_w1 AND (#lastFed between :lastFed_w1 and :lastFed_w2)'
}
```

```javascript
animals.query
		.farm({habitat: "Africa"})
		.where(({animal, dangerous}, {value, name, between}) => `
			${name(animal)} = ${value(animal, "Warthog")} AND ${between(dangerous, "2020-09-25", "2020-09-28")}
		`)
		.params()
```

### ConditionExpressions

Below is the traditional way you would add a `ConditionExpression` to Dynamo's DocumentClient directly along side how you would accomplish the same using the `where` method.

```javascript
{
  UpdateExpression: 'SET #dangerous = :dangerous',
  ExpressionAttributeNames: { '#animal': 'animal', '#dangerous': 'dangerous' },
  ExpressionAttributeValues: {
    ':animal_w1': 'Zebra',
    ':dangerous_w1': false,
    ':dangerous': true
  },
  TableName: 'zoodirectory',
  Key: {
    pk: '$zoodirectory_1#habitat_africa',
    sk: '$exibits#enclosure_5b'
  },
  ConditionExpression: '#animal = :animal_w1 AND #dangerous = :dangerous_w1'
}
```

```javascript
animals.update({habitat: "Africa", enclosure: "5b"})
	.set({dangerous: true})
	.where(({animal, dangerous}, {value, name, eq}) => `
		${name(animal)} = ${value(animal, "Zebra")} AND ${eq(dangerous)}
	`)
	.params())
```


### Attributes and Operations

Where functions allow you to write a `FilterExpression` or `ConditionExpression` without having to worry about the complexities of expression attributes. To accomplish this, ElectroDB injects an object `attributes` as the first parameter to all Filter Functions, and an object `operations, as the second parameter. Pass the properties from the `attributes` object to the methods found on the `operations` object, along with inline values to set filters and conditions:

```javascript
// A single filter operation
animals.update({habitat: "Africa", enclosure: "5b"})
	.set({keeper: "Joe Exotic"})
	.where((attr, op) => op.eq(attr.dangerous, true))
	.params());

// Multiple conditions
animals.update({habitat: "Africa", enclosure: "5b"})
	.set({keeper: "Joe Exotic"})
	.where((attr, op) => `
		${op.eq(attr.dangerous, true)} AND ${op.contains(attr.diet, "meat")}
	`)
	.params());
```

The `attributes` object contains every Attribute defined in the Entity's Model. The `operations` object contains the following methods: 

operator | example | result
| ----------- | ----------- | ----------- |  
`gte` | `gte(rent, value)` | `#rent >= :rent1`
`gt` | `gt(rent, maxRent)` | `#rent > :rent1`
`lte` | `lte(rent, maxRent)` | `#rent <= :rent1`
`lt` | `lt(rent, maxRent)` | `#rent < :rent1`
`eq` | `eq(rent, maxRent)` | `#rent = :rent1`
`begins` | `begins(rent, maxRent)` | `begins_with(#rent, :rent1)`
`exists` | `exists(rent)` | `attribute_exists(#rent)`
`notExists` | `notExists(rent)` | `attribute_not_exists(#rent)`
`contains` | `contains(rent, maxRent)` | `contains(#rent = :rent1)`
`notContains` | `notContains(rent, maxRent)` | `not contains(#rent = :rent1)`
`between` | `between(rent, minRent, maxRent)` | `(#rent between :rent1 and :rent2)`
`name` | `name(rent)` | `#rent`
`value` | `value(rent, maxRent)` | `:rent1`

### Multiple Where Clauses
It is possible to include chain multiple where clauses. The resulting FilterExpressions (or ConditionExpressions) are concatinated with an implicit `AND` operator.

```javascript
let MallStores = new Entity(model, {table: "StoreDirectory"});
let stores = MallStores.query
	.leases({ mallId: "EastPointe" })
	.between({ leaseEndDate: "2020-04-01" }, { leaseEndDate: "2020-07-01" })
	.where(({ rent, discount }, {between, eq}) => `
		${between(rent, "2000.00", "5000.00")} AND ${eq(discount, "1000.00")}
	`)
	.where(({ category }, {eq}) => `
		${eq(category, "food/coffee")}
	`)
	.params();

// Results
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

# Building Queries
> For hands-on learners: the following example can be followed along with **and** executed on runkit: https://runkit.com/tywalch/electrodb-building-queries

Forming a composite **Partition Key** and **Sort Key** is a critical step in planning **Access Patterns** in **DynamoDB**. When planning composite keys, it is crucial to consider the order in which they are *composed*.  As of the time of writing this documentation, **DynamoDB**  has the following constraints that should be taken into account when planning your **Access Patterns**:
1. You must always supply the **Partition Key** in full for all queries to **DynamoDB**.
2. You currently only have the following operators available on a **Sort Key**: `begins_with`, `between`, `>`, `>=`, `<`, `<=`, and `Equals`.
3. To act on single record, you will need to know the full  **Partition Key** and **Sort Key** for that record.

### Using facets to make hierarchical keys
Carefully considering your **Facet** order will allow **ElectroDB** to express hierarchical relationships and unlock more available **Access Patterns** for your application. 

For example, let's say you have a `StoreLocations` Entity that represents Store Locations inside Malls:

#### Shopping Mall Stores
```javascript
let schema = {  
    model: {
      service: "MallStoreDirectory",  
      entity: "MallStore",
      version: "1",    
    },  
	attributes: {
		cityId: {
			type: "string",
			required: true,
		}, 
		mallId: {  
			type: "string",  
			required: true,  
		},  
		storeId: {  
			type: "string",  
			required: true,  
		},  
		buildingId: {  
			type: "string",  
			required: true,  
		},  
		unitId: {  
			type: "string",  
			required: true,
		},  
		category: {  
			type: [
				"spite store",
				"food/coffee", 
				"food/meal", 
				"clothing", 
				"electronics", 
				"department", 
				"misc"
			],  
			required: true  
		},  
		leaseEndDate: {  
			type: "string",  
			required: true  
		},
		rent: {
			type: "string",
			required: true,
			validate: /^(\d+\.\d{2})$/
		},
		discount: {
			type: "string",
			required: false,
			default: "0.00",
			validate: /^(\d+\.\d{2})$/
		}  
	},  
	indexes: {  
	    stores: {  
			pk: {
				field: "pk",
				facets: ["cityId", "mallId"]
			}, 
			sk: {
				field: "sk",
				facets: ["buildingId", "storeId"]
			}  
		},  
		units: {  
			index: "gis1pk-gsi1sk-index",  
			pk: {
				field: "gis1pk",
				facets: ["mallId"]
			},  
			sk: {
				field: "gsi1sk",
				facets: ["buildingId", "unitId"]
			}  
		},
		leases: {
			index: "gis2pk-gsi2sk-index",
			pk: {
				field: "gis2pk",
				facets: ["storeId"]
			},  
			sk: {
				field: "gsi2sk",
				facets: ["leaseEndDate"]
			}  
		}
	},
	filters: {
		byCategory: ({category}, name) => category.eq(name),
		rentDiscount: (attributes, discount, max, min) => {
			return `${attributes.discount.lte(discount)} AND ${attributes.rent.between(max, min)}`
		}
	}  
};
const StoreLocations = new Entity(schema, {table: "StoreDirectory"});
```

### Query Records

> Examples in this section using the `MallStore` schema defined [above](#shopping-mall-stores), and available for interacting with here: https://runkit.com/tywalch/electrodb-building-queries

All queries start from the Access Pattern defined in the schema. 

```javascript
const MallStore = new Entity(schema, {table: "StoreDirectory"}); 
// Each Access Pattern is available on the Entity instance
// MallStore.query.stores()
// MallStore.query.malls()
```

#### Partition Key Facets
All queries require (*at minimum*) the **Facets** included in its defined **Partition Key**, and **Facets** you have from the start of the **Sort Key**. 
> *Important: Facets must be supplied in the order they are composed when invoking the **Access Pattern*** 
```javascript
const MallStore = new Entity({
	model: {
		service: "mallmgmt"
		entity: "store", 
		version: "1"
	},
	attributes: {
		cityId: "string"
		mallId: "string",
		storeId: "string",
		buildingId: "string",
		unitId: "string",
		name: "string",
		description: "string",
		category: "string"
	},
	indexes: {
		pk: {
			field: "pk",
			facets: ["cityId", "mallId"]
		},
		sk: {
			field: "sk",
			facets: ["storeId", "unitId"]
		}
	}
}, {table: "StoreDirectory"});

const cityId = "Atlanta1";
const mallId = "EastPointe";
const storeId = "LatteLarrys";
const unitId = "B24";
const buildingId = "F34";

// Good: Includes at least the PK
StoreLocations.query.stores({cityId, mallId});

// Good: Includes at least the PK, and some of the SK
StoreLocations.query.stores({cityId, mallId, buildingId});

// Bad: No PK facets specified, will throw
StoreLocations.query.stores();

// Bad: Not All PK Facets included (cityId), will throw
StoreLocations.query.stores({mallId});

// Bad: Facets not included in order, will NOT throw but will ignore `storeId` 
StoreLocations.query.stores({cityId, mallId, storeId});
```

### Sort Key Operations 
| operator | use case |
| ---: | ----------- |
| `begins` | Keys starting with a particular set of characters.
| `between` | Keys between a specified range. |
| `gt` | Keys less than some value |
| `gte` | Keys less than or equal to some value |
| `lt` | Keys greater than some value |
| `lte` | Keys greater than or equal to some value |

Each record represents one Store location. All Stores are located in Malls we manage. 

To satisfy requirements for searching based on location, you could use the following keys: Each `StoreLocations` record would have a **Partition Key**  with the store's `storeId`. This key alone is not enough to identify a particular store. To solve this, compose a **Sort Key** for the store's location attribute ordered hierarchically (mall/building/unit): `["mallId", "buildingId", "unitId"]`. 

The `StoreLocations` entity above, using just the `stores` **Index** alone enables four **Access Patterns**:
1. All `LatteLarrys` locations in all *Malls*
2. All `LatteLarrys` locations in one *Mall*
3. All `LatteLarrys` locations inside a specific *Mall*
4. A specific `LatteLarrys` inside of a *Mall* and *Building*

## Query Chains
Queries in ***ElectroDB*** are built around the **Access Patterns** defined in the Schema and are capable of using partial key **Facets** to create performant lookups. To accomplish this, ***ElectroDB*** offers a predictable chainable API.

> Examples in this section using the `StoreLocations` schema defined [above](#shopping-mall-stores) and can be directly experiment with on runkit: https://runkit.com/tywalch/electrodb-building-queries 

The methods: Get (`get`), Create (`put`), Update (`update`), and Delete (`delete`) **require* all facets described in the Entities' primary `PK` and `SK`.  

### Get Method
Provide all Table Index facets in an object to the `get` method
```javascript
let results = await StoreLocations.get({
	storeId: "LatteLarrys", 
	mallId: "EastPointe", 
	buildingId: "F34", 
	cityId: "Atlanta1"
}).go();

// Equivalent Params:
// {
//   Key: {
//     pk: "$mallstoredirectory#cityid_atlanta1#mallid_eastpointe",
//     sk: "$mallstore_1#buildingid_f34#storeid_lattelarrys"
//   },
//   TableName: 'StoreDirectory'
// }
```

### Batch Get
Provide all Table Index facets in an array of objects to the `get` method to perform a BatchGet query.

> Note: Performing a BatchGet will return a response structure unique to BatchGet: a two-dimensional array with the results of the query and any unprocessed records. See the example below.

```javascript
let [results, unprocessed] = await StoreLocations.get([
    {
        storeId: "LatteLarrys", 
        mallId: "EastPointe", 
        buildingId: "F34", 
        cityId: "Atlanta1"
    },
    {
        storeId: "MochaJoes", 
        mallId: "WestEnd", 
        buildingId: "A21", 
        cityId: "Madison2"
    }   
]).go();

// Equivalent Params:
// {
//   "RequestItems": {
//     "electro": {
//       "Keys": [
//         {
//           "pk": "$mallstoredirectory#cityid_atlanta1#mallid_eastpointe",
//           "sk": "$mallstore_1#buildingid_f34#storeid_lattelarrys"
//         },
//         {
//           "pk": "$mallstoredirectory#cityid_madison2#mallid_westend",
//           "sk": "$mallstore_1#buildingid_a21#storeid_mochajoes"
//         }
//       ]
//     }
//   }
// }
```

The two-dimensional array returned by batch get most easily used when deconstructed into two variables, in the above case: `results` and `unprocessed`. 

The `results` array are records that were returned DynamoDB as `Responses` on the BatchGet query. They will appear in the same format as ElectroDB queries.

Elements of the `unprocessed` array are unlike results received from a query. Instead of containing all the attributes of a record, an unprocessed record only includes the facets defined in the Table Index. This is in keeping with DynamoDB's practice of returning back only Keys in the case of unprocessed records. For convenience, ElectroDB will return these keys as facets but you can pass the (query option)[#query-options] `{lastEvaluatedKeyRaw:true}` override this behavior and return the Keys as they came from DynamoDB.    

### Delete Method
Provide all Table Index facets in an object to the `delete` method to delete a record.

```javascript
await StoreLocations.delete({
	storeId: "LatteLarrys", 
	mallId: "EastPointe", 
	buildingId: "F34", 
	cityId: "Atlanta1"
}).go();

// Equivalent Params:
// {
//   Key: {
//     pk: "$mallstoredirectory#cityid_atlanta1#mallid_eastpointe",
//     sk: "$mallstore_1#buildingid_f34#storeid_lattelarrys"
//   },
//   TableName: 'StoreDirectory'
// }
```

### Batch Write Delete Records
Provide all table index facets in an array of objects to the `delete` method to batch delete records.

> Note: Performing a Batch Delete will return an array of "unprocessed" records. An empty array signifies all records were processed. If you want the raw DynamoDB response you can always use the option `{raw: true}`, more detail found here: [Query Options](query-options).

```javascript
let unprocessed = await StoreLocations.delete([
    {
        storeId: "LatteLarrys", 
        mallId: "EastPointe", 
        buildingId: "F34", 
        cityId: "LosAngeles1"
    },
    {
        storeId: "MochaJoes", 
        mallId: "EastPointe", 
        buildingId: "F35", 
        cityId: "LosAngeles1"
    }
]).go();

// Equivalent Params:
{
  "RequestItems": {
    "StoreDirectory": [
      {
        "DeleteRequest": {
          "Key": {
            "pk": "$mallstoredirectory#cityid_losangeles1#mallid_eastpointe",
            "sk": "$mallstore_1#buildingid_f34#storeid_lattelarrys"
          }
        }
      },
      {
        "DeleteRequest": {
          "Key": {
            "pk": "$mallstoredirectory#cityid_losangeles1#mallid_eastpointe",
            "sk": "$mallstore_1#buildingid_f35#storeid_mochajoes"
          }
        }
      }
    ]
  }
}
```

Elements of the `unprocessed` array are unlike results received from a query. Instead of containing all the attributes of a record, an unprocessed record only includes the facets defined in the Table Index. This is in keeping with DynamoDB's practice of returning back only Keys in the case of unprocessed records. For convenience, ElectroDB will return these keys as facets but you can pass the (query option)[#query-options] `{lastEvaluatedKeyRaw:true}` override this behavior and return the Keys as they came from DynamoDB.

### Put Record
Provide all *required* Attributes as defined in the model to create a new record. **ElectroDB** will enforce any defined validations, defaults, casting, and field aliasing.

This example includes an optional conditional expression
```javascript
await StoreLocations
  .put({
      cityId: "Atlanta1",
      storeId: "LatteLarrys",
      mallId: "EastPointe",
      buildingId: "BuildingA1",
      unitId: "B47",
      category: "food/coffee",
      leaseEndDate: "2020-03-22",
      rent: "4500.00"
  })
  .where((attr, op) => op.eq(attr.rent, "4500.00"))
  .go()

// Equivalent Params:
{
  "Item": {
    "cityId": "Atlanta1",
    "mallId": "EastPointe",
    "storeId": "LatteLarrys",
    "buildingId": "BuildingA1",
    "unitId": "B47",
    "category": "food/coffee",
    "leaseEndDate": "2020-03-22",
    "rent": "4500.00",
    "discount": "0.00",
    "pk": "$mallstoredirectory#cityid_atlanta1#mallid_eastpointe",
    "sk": "$mallstore_1#buildingid_buildinga1#storeid_lattelarrys",
    "gis1pk": "$mallstoredirectory#mallid_eastpointe",
    "gsi1sk": "$mallstore_1#buildingid_buildinga1#unitid_b47",
    "gis2pk": "$mallstoredirectory#storeid_lattelarrys",
    "gsi2sk": "$mallstore_1#leaseenddate_2020-03-22",
    "__edb_e__": "MallStore",
    "__edb_v__": "1"
  },
  "TableName": "StoreDirectory",
  "ConditionExpression": "#rent = :rent_w1",
  "ExpressionAttributeNames": {
    "#rent": "rent"
  },
  "ExpressionAttributeValues": {
    ":rent_w1": "4500.00"
  }
}
```

### Batch Write Put Records
Provide all *required* Attributes as defined in the model to create records as an _array_ to `.put()`. **ElectroDB** will enforce any defined validations, defaults, casting, and field aliasing.

> Note: Performing a Batch Put will return an array of "unprocessed" records. An empty array signifies all records were processed. If you want the raw DynamoDB response you can always use the option `{raw: true}`, more detail found here: [Query Options](query-options).

```javascript
let unprocessed = await StoreLocations.put([
    {
        cityId: "LosAngeles1",
        storeId: "LatteLarrys",
        mallId: "EastPointe",
        buildingId: "F34",
        unitId: "a1",
        category: "food/coffee",
        leaseEndDate: "2022-03-22",
        rent: "4500.00"
    },
    {
        cityId: "LosAngeles1",
        storeId: "MochaJoes",
        mallId: "EastPointe",
        buildingId: "F35",
        unitId: "a2",
        category: "food/coffee",
        leaseEndDate: "2021-01-22",
        rent: "1500.00"
    }
]).go()

// Equivalent Params:
{
  "RequestItems": {
    "StoreDirectory": [
      {
        "PutRequest": {
          "Item": {
            "cityId": "LosAngeles1",
            "mallId": "EastPointe",
            "storeId": "LatteLarrys",
            "buildingId": "F34",
            "unitId": "a1",
            "category": "food/coffee",
            "leaseEndDate": "2022-03-22",
            "rent": "4500.00",
            "discount": "0.00",
            "pk": "$mallstoredirectory#cityid_losangeles1#mallid_eastpointe",
            "sk": "$mallstore_1#buildingid_f34#storeid_lattelarrys",
            "gis1pk": "$mallstoredirectory#mallid_eastpointe",
            "gsi1sk": "$mallstore_1#buildingid_f34#unitid_a1",
            "gis2pk": "$mallstoredirectory#storeid_lattelarrys",
            "gsi2sk": "$mallstore_1#leaseenddate_2022-03-22",
            "__edb_e__": "MallStore",
            "__edb_v__": "1"
          }
        }
      },
      {
        "PutRequest": {
          "Item": {
            "cityId": "LosAngeles1",
            "mallId": "EastPointe",
            "storeId": "MochaJoes",
            "buildingId": "F35",
            "unitId": "a2",
            "category": "food/coffee",
            "leaseEndDate": "2021-01-22",
            "rent": "1500.00",
            "discount": "0.00",
            "pk": "$mallstoredirectory#cityid_losangeles1#mallid_eastpointe",
            "sk": "$mallstore_1#buildingid_f35#storeid_mochajoes",
            "gis1pk": "$mallstoredirectory#mallid_eastpointe",
            "gsi1sk": "$mallstore_1#buildingid_f35#unitid_a2",
            "gis2pk": "$mallstoredirectory#storeid_mochajoes",
            "gsi2sk": "$mallstore_1#leaseenddate_2021-01-22",
            "__edb_e__": "MallStore",
            "__edb_v__": "1"
          }
        }
      }
    ]
  }
}
```

Elements of the `unprocessed` array are unlike results received from a query. Instead of containing all the attributes of a record, an unprocessed record only includes the facets defined in the Table Index. This is in keeping with DynamoDB's practice of returning back only Keys in the case of unprocessed records. For convenience, ElectroDB will return these keys as facets but you can pass the (query option)[#query-options] `{lastEvaluatedKeyRaw:true}` override this behavior and return the Keys as they came from DynamoDB.

### Update Record
To update a record, pass all Table index facets to the update method and then pass `set` attributes that need to be updated. This example contains an optional conditional expression.

*Note: If your update includes changes to an attribute that is also a facet for a global secondary index, you must provide all facets for that index.*

```javascript
await StoreLocations
    .update({cityId, mallId, storeId, buildingId})
    .set({category: "food/meal"})
    .where((attr, op) => op.eq(attr.category, "food/coffee"))
    .go()

// Equivalent Params:
{
  "UpdateExpression": "SET #category = :category",
  "ExpressionAttributeNames": {
    "#category": "category"
  },
  "ExpressionAttributeValues": {
    ":category_w1": "food/coffee",
    ":category": "food/meal"
  },
  "TableName": "StoreDirectory",
  "Key": {
    "pk": "$mallstoredirectory#cityid_atlanta1#mallid_eastpointe",
    "sk": "$mallstore_1#buildingid_f34#storeid_lattelarrys"
  },
  "ConditionExpression": "#category = :category_w1"
}
```

### Scan Records
When scanning for rows, you can use filters the same as you would any query. For more detial on filters, see the [Where](#where) section.

*Note: `Scan` functionality will be scoped to your Entity. This means your results will only include records that match the Entity defined in the model.*
```javascript
await StoreLocations.scan
    .where(({category}, {eq}) => `
        ${eq(category, "food/coffee")} OR ${eq(category, "spite store")}  
    `)
    .where(({leaseEndDate}, {between}) => `
        ${between(leaseEndDate, "2020-03", "2020-04")}
    `)
    .go()

// Equivalent Params:
{
  "TableName": "StoreDirectory",
  "ExpressionAttributeNames": {
    "#category": "category",
    "#leaseEndDate": "leaseEndDate",
    "#pk": "pk",
    "#sk": "sk",
    "#__edb_e__": "__edb_e__",
    "#__edb_v__": "__edb_v__"
  },
  "ExpressionAttributeValues": {
    ":category_w1": "food/coffee",
    ":category_w2": "spite store",
    ":leaseEndDate_w1": "2020-03",
    ":leaseEndDate_w2": "2020-04",
    ":pk": "$mallstoredirectory#cityid_",
    ":sk": "$mallstore_1#buildingid_",
    ":__edb_e__": "MallStore",
    ":__edb_v__": "1"
  },
  "FilterExpression": "begins_with(#pk, :pk) AND #__edb_e__ = :__edb_e__ AND #__edb_v__ = :__edb_v__ AND begins_with(#sk, :sk) AND (#category = :category_w1 OR #category = :category_w2) AND (#leaseEndDate between :leaseEndDate_w1 and :leaseEndDate_w2)"
}
```

### Patch Records

In DynamoDB, `update` operations by default will insert a record if record being updated does not exist. In **_ElectroDB_**, the `patch` method will utilize the `attribute_exists()` parameter dynamically to ensure records are only "patched" and not inserted when updating. 

```javascript
await StoreLocations
    .patch({cityId, mallId, storeId, buildingId})
    .set({category: "food/meal"})
    .where((attr, op) => op.eq(attr.category, "food/coffee"))
    .go()

// Equivalent Params:
{
  "UpdateExpression": "SET #category = :category",
  "ExpressionAttributeNames": {
    "#category": "category"
  },
  "ExpressionAttributeValues": {
    ":category_w1": "food/coffee",
    ":category": "food/meal"
  },
  "TableName": "StoreDirectory",
  "Key": {
    "pk": "$mallstoredirectory#cityid_atlanta1#mallid_eastpointe",
    "sk": "$mallstore_1#buildingid_f34#storeid_lattelarrys"
  },
  "ConditionExpression": "attribute_exists(pk) AND attribute_exists(sk) AND #category = :category_w1"
}
```

### Create Records

In DynamoDB, `put` operations by default will overwrite a record if record being updated does not exist. In **_ElectroDB_**, the `patch` method will utilize the `attribute_not_exists()` parameter dynamically to ensure records are only "created" and not overwriten when inserting new records into the table. 

```javascript
await StoreLocations
  .create({
      cityId: "Atlanta1",
      storeId: "LatteLarrys",
      mallId: "EastPointe",
      buildingId: "BuildingA1",
      unitId: "B47",
      category: "food/coffee",
      leaseEndDate: "2020-03-22",
      rent: "4500.00"
  })
  .where((attr, op) => op.eq(attr.rent, "4500.00"))
  .go()

// Equivalent Params:
{
  "Item": {
    "cityId": "Atlanta1",
    "mallId": "EastPointe",
    "storeId": "LatteLarrys",
    "buildingId": "BuildingA1",
    "unitId": "B47",
    "category": "food/coffee",
    "leaseEndDate": "2020-03-22",
    "rent": "4500.00",
    "discount": "0.00",
    "pk": "$mallstoredirectory#cityid_atlanta1#mallid_eastpointe",
    "sk": "$mallstore_1#buildingid_buildinga1#storeid_lattelarrys",
    "gis1pk": "$mallstoredirectory#mallid_eastpointe",
    "gsi1sk": "$mallstore_1#buildingid_buildinga1#unitid_b47",
    "gis2pk": "$mallstoredirectory#storeid_lattelarrys",
    "gsi2sk": "$mallstore_1#leaseenddate_2020-03-22",
    "__edb_e__": "MallStore",
    "__edb_v__": "1"
  },
  "TableName": "StoreDirectory",
  "ConditionExpression": "attribute_not_exists(pk) AND attribute_not_exists(sk) AND #rent = :rent_w1",
  "ExpressionAttributeNames": {
    "#rent": "rent"
  },
  "ExpressionAttributeValues": {
    ":rent_w1": "4500.00"
  }
}
```

### Find Records

DynamoDB offers three methods to find records: `get`, `query`, and `scan`. In **_ElectroDB_**, there is a fourth type: `find`. Unlike `get` and `query`, the `find` method does not require you to provide keys, but under the covers it will leverage the attributes provided to find the best index to query on. Provide the `find` method will all properties known to match a record and **_ElectroDB_** will generate the most performant query it can to locate the results. This can be helpful with highly dynamic querying needs. If an index cannot be satisfied with the attributes provided, `scan` will be used as a last resort.

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
After invoking the **Access Pattern** with the required **Partition Key** **Facets**, you can now choose what **Sort Key Facets** are applicable to your query. Examine the table in [Sort Key Operations](#sort-key-operations) for more information on the available operations on a **Sort Key**.

### Access Pattern Queries
When you define your [indexes](#indexes) in your model, you are defining the access patterns of your entity. The [facets](#facets) you choose, and their order, ultimately define the finite set of index queries that can be made. The more you can leverage these index queries the better from both a cost and performance perspective.

Unlike Partition Keys, Sort Keys can be partially provided. We can leverage this to multiply our available access patterns and use the Sort Key Operations: `begins`, `between`, `lt`, `lte`, `gt`, and `gte`. These queries are more performant and cost effective than filters. The costs associated with DynamoDB directly correlate to how effectively you leverage Sort Key Operations. 

> For a comprehensive and interactive guide to build queries please visit this runkit: https://runkit.com/tywalch/electrodb-building-queries.

#### Begins With Queries
One important consideration when using Sort Key Operations to make is when to use and not to use "begins". 

It is possible to supply partially supply Sort Key facets. While they do have to be in order, you can provide only some of the properties to ElectroDB. By default, when you supply a partial Sort Key in the Access Pattern method, ElectroDB will create a `beginsWith` query. The difference between doing that and using .begins() is that ElectroDB will post-pend the next facet's label onto the query.

The difference is nuanced and makes better sense with an example, but the rule of thumb is that data passed to the Access Pattern method should represent values you know strictly equal the value you want.  

The following examples will use the following Access Pattern definition for `units`:
```json
"units": {  
    "index": "gis1pk-gsi1sk-index",  
    "pk": {
        "field": "gis1pk",
        "facets": ["mallId"]
    },  
    "sk": {
        "field": "gsi1sk",
        "facets": ["buildingId", "unitId"]
    }  
}
```
An Access Pattern method is the method after query you use to query a particular accessType:
```javascript
// Example #1
StoreLocations.query.units({mallId, buildingId}).go();
// -----------------------^^^^^^^^^^^^^^^^^^^^^^
```

Data passed to the Access Pattern method is considered to be full, known, data. In the above example, we are saying we *know* the `mallId`, `buildingId` and `unitId`.  

Alternatively, if you only know the start of a piece of data, use .begins():
```javascript
// Example #2
StoreLocations.query.units({mallId}).begins({buildingId}).go();
// ---------------------------------^^^^^^^^^^^^^^^^^^^^^
```

Data passed to the .begins() method is considered to be partial data. In the second example, we are saying we *know* the `mallId` and `buildingId`, but only know the beginning of `unitId`.

For the above queries we see two different sort keys:
1. `"$mallstore_1#buildingid_f34#unitid_"`
2. `"$mallstore_1#buildingid_f34"`

The first example shows how ElectroDB post-pends the label of the next facet (unitId) on the SortKey to ensure that buildings such as `"f340"` are not included in the query. This is useful to prevent common issues with multi-facet sort keys like accidental over-querying.

The second example allows you to make queries that do include buildings such as `"f340"` or `"f3409"` or `"f340356346"`.

For these reasons it is important to consider that Data passed to the Access Pattern method is considered to be full, known, data.

## Collection Chains
Collections allow you to query across Entities. To use them you need to `join` your Models onto a `Service` instance.

> Using the TaskApp Models defined in [Models](#model), these models share a `collection` called `assignments` on the index `gsi3pk-gsi3sk-index`
```javascript
const table = "projectmanagement";
const TaskApp = new Service("projectmanagement",  { client, table }); 

TaskApp
	.join(EmployeesModel) // TaskApp.entities.employees
	.join(TasksModel);    // TaskApp.entities.tasks
```
Available on your Service are two objects: `entites` and `collections`.  Entities available on `entities` have the same capabilities as they would if created individually. When a Model added to a Service with `join` however, its Collections are automatically added and validated with the other Models joined to that Service. These Collections are available on `collections`.

```javascript
TaskApp.collections.assignments({employee: "JExotic"}).params();  

// Results
{
  TableName: 'projectmanagement',
  ExpressionAttributeNames: { '#pk': 'gsi3pk', '#sk1': 'gsi3sk' },
  ExpressionAttributeValues: { ':pk': '$taskapp_1#employee_joeexotic', ':sk1': '$assignments' },
  KeyConditionExpression: '#pk = :pk and begins_with(#sk1, :sk1)',
  IndexName: 'gsi3pk-gsi3sk-index'
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
  ExpressionAttributeNames: { '#project': 'project', '#pk': 'gsi3pk', '#sk1': 'gsi3sk' },
  ExpressionAttributeValues: {
    ':project1': 'murder',
    ':pk': '$taskapp_1#employee_carolbaskin',
    ':sk1': '$assignments'
  },
  KeyConditionExpression: '#pk = :pk and begins_with(#sk1, :sk1)',
  IndexName: 'gsi3pk-gsi3sk-index',
  FilterExpression: '\n\t\tattribute_not_exists(#project) OR contains(#project, :project1)\n\t'
}
```

## Execute Queries
Lastly, all query chains end with either a `.go()` or a `.params()` method invocation. These will either execute the query to DynamoDB (`.go()`) or return formatted parameters for use with the DynamoDB docClient (`.params()`).

Both `.params()` and `.go()` take a query configuration object which is detailed more in the section [Query Options](#query-options).

### Params
The `params` method _ends_ a query chain, and synchronously formats your query into an object ready for the DynamoDB docClient. 

> For more information on the options available in the `config` object, checkout the section [Query Options](#query-options).

```javascript
let config = {};
let stores = MallStores.query
    .leases({ mallId })
    .between(
      { leaseEndDate:  "2020-06-01" }, 
      { leaseEndDate:  "2020-07-31" })
    .filter(attr) => attr.rent.lte("5000.00"))
    .params(config);

// Results:
{
  IndexName: 'idx2',
  TableName: 'electro',
  ExpressionAttributeNames: { '#rent': 'rent', '#pk': 'idx2pk', '#sk1': 'idx2sk' },
  ExpressionAttributeValues: {
    ':rent1': '5000.00',
    ':pk': '$mallstoredirectory_1#mallid_eastpointe',
    ':sk1': '$mallstore#leaseenddate_2020-06-01#rent_',
    ':sk2': '$mallstore#leaseenddate_2020-07-31#rent_'
  },
  KeyConditionExpression: '#pk = :pk and #sk1 BETWEEN :sk1 AND :sk2',
  FilterExpression: '#rent <= :rent1'
}
```

### Go
The `go` method _ends_ a query chain, and asynchronously queries DynamoDB with the `client` provided in the model. 

> For more information on the options available in the `config` object, check out the section [Query Options](#query-options).

```javascript
let config = {};
let stores = MallStores.query
	.leases({ mallId })
	.between(
		{ leaseEndDate:  "2020-06-01" }, 
		{ leaseEndDate:  "2020-07-31" })
	.filter(({rent}) => rent.lte("5000.00"))
	.go(config);

```

### Page

> As of September 29th 2020 the `.page()` now returns the facets that make up the `ExclusiveStartKey` instead of the `ExclusiveStartKey` itself. To get back only the `ExclusiveStartKey`, add the flag `exclusiveStartKeyRaw` to your query options. If you treated this value opaquely no changes are needed, or if you used the `raw` flag. 

The `page` method _ends_ a query chain, and asynchronously queries DynamoDB with the `client` provided in the model. Unlike the `.go()`, the `.page()` method returns a tupple. 

The first element for (Entity)[#entity] page query is the "page": an object contains the facets that make up the `ExclusiveStartKey` that is returned by the DynamoDB client. This is very useful in multi-tenant applications where only some facets are exposed to the client, or there is a need to prevent leaking keys between entities. If there is no `ExclusiveStartKey` this value will be null. On subsequent calls to `.page()`, pass the results returned from the previous call to `.page()` or construct the facets yourself.

The first element for (Collection)[#collections] page query is the `ExclusiveStartKey` as it was returned by the DynamoDB client.

> Note: It is *highly recommended* to use the `lastEvaluatedKeyRaw` flag when using `.page()` in conjunction with scans. This is because when using scan on large tables the docClient may return an `ExclusiveStartKey` for a record that does not belong to entity making the query (regardless of the filters set). In these cases ElectroDB will return null (to avoid leaking the keys of other entities) when further pagination may be needed to find your records.

The second element is the results of the query, exactly as it would be returned through a `query` operation.

> Note: When calling `.page()` the first argument is reserved for the "page" returned from a previous query, the second parameter is for Query Options. For more information on the options available in the `config` object, check out the section [Query Options](#query-options).

```javascript
let [page, stores] = await MallStores.query
	.leases({ mallId })
	.page();

let [pageTwo, moreStores] = await MallStores.query
	.leases({ mallId })
	.page(page, {});

// page:
// { 
//   storeId: "LatteLarrys", 
//   mallId: "EastPointe", 
//   buildingId: "BuildingA1", 
//   unitId: "B47"
// }

// stores
// [{
//   mall: '3010aa0d-5591-4664-8385-3503ece58b1c',
//   leaseEnd: '2020-01-20',
//   sector: '7d0f5c19-ec1d-4c1e-b613-a4cc07eb4db5',
//   store: 'MNO',
//   unit: 'B5',
//   id: 'e0705325-d735-4fe4-906e-74091a551a04',
//   building: 'BuildingE',
//   category: 'food/coffee',
//   rent: '0.00'
// },
// {
//   mall: '3010aa0d-5591-4664-8385-3503ece58b1c',
//   leaseEnd: '2020-01-20',
//   sector: '7d0f5c19-ec1d-4c1e-b613-a4cc07eb4db5',
//   store: 'ZYX',
//   unit: 'B9',
//   id: 'f201a1d3-2126-46a2-aec9-758ade8ab2ab',
//   building: 'BuildingI',
//   category: 'food/coffee',
//   rent: '0.00'
// }]
```

## Query Examples
For a comprehensive and interactive guide to build queries please visit this runkit: https://runkit.com/tywalch/electrodb-building-queries.

```javascript
const cityId = "Atlanta1";
const mallId = "EastPointe";
const storeId = "LatteLarrys";
const unitId = "B24";
const buildingId = "F34";
const june = "2020-06";
const july = "2020-07"; 
const discount = "500.00";
const maxRent = "2000.00";
const minRent = "5000.00";

// Lease Agreements by StoreId
await StoreLocations.query.leases({storeId}).go()

// Lease Agreement by StoreId for March 22nd 2020
await StoreLocations.query.leases({storeId, leaseEndDate: "2020-03-22"}).go()

// Lease agreements by StoreId for 2020
await StoreLocations.query.leases({storeId}).begins({leaseEndDate: "2020"}).go()

// Lease Agreements by StoreId after March 2020
await StoreLocations.query.leases({storeId}).gt({leaseEndDate: "2020-03"}).go()

// Lease Agreements by StoreId after, and including, March 2020
await StoreLocations.query.leases({storeId}).gte({leaseEndDate: "2020-03"}).go()

// Lease Agreements by StoreId before 2021
await StoreLocations.query.leases({storeId}).lt({leaseEndDate: "2021-01"}).go()

// Lease Agreements by StoreId before Feburary 2021
await StoreLocations.query.leases({storeId}).lte({leaseEndDate: "2021-02"}).go()

// Lease Agreements by StoreId between 2010 and 2020
await StoreLocations.query
    .leases({storeId})
    .between(
        {leaseEndDate: "2010"}, 
        {leaseEndDate: "2020"})
    .go()

// Lease Agreements by StoreId after, and including, 2010 in the city of Atlanta and category containing food
await StoreLocations.query
    .leases({storeId})
    .gte({leaseEndDate: "2010"})
    .where((attr, op) => `
        ${op.eq(attr.cityId, "Atlanta1")} AND ${op.contains(attr.category, "food")}
    `)
    .go()
    
// Rents by City and Store who's rent discounts match a certain rent/discount criteria
await StoreLocations.query
    .units({mallId})
    .begins({leaseEndDate: june})
    .rentDiscount(discount, maxRent, minRent)
    .go()

// Stores by Mall matching a specific category
await StoreLocations.query
    .units({mallId})
    .byCategory("food/coffee")
    .go()```

## Query Options
By default **ElectroDB** enables you to work with records as the names and properties defined in the model. Additionally, it removes the need to deal directly with the docClient parameters which can be complex for a team without as much experience with DynamoDB. The Query Options object can be passed to both the `.params()` and `.go()` methods when building you query. Below are the options available:

```typescript
let options = {
	params?: object,
	table?: string,
	raw?: boolean,
	includeKeys?: boolean,
	originalErr?: boolean,
	lastEvaluatedKeyRaw?: boolean,
};
```

## Query Options
Query options can be added the `.params()`, `.go()` and `.page()` to change query behavior or add customer parameters to a query.  

| Option | Description |  
| ----------- | ----------- |  
| params  | Properties added to this object will be merged onto the params sent to the document client. Any conflicts with **ElectroDB** will favor the params specified here. |
| table | Use a different table than the one defined in the model |
| raw  | Returns query results as they were returned by the docClient.  
| includeKeys | By default, **ElectroDB** does not return partition, sort, or global keys in its response. |
| lastEvaluatedKeyRaw | Used in batch processing and `.pages()` calls to override ElectroDBs default behaviour to break apart `LastEvaluatedKeys` or the `Unprocessed` records into facets. See more in the seconds for (Pages)[#pages], (Batch Get)[#batch-get], (BatchDelete)[#batch-write-delete-records], and (BatchPut)[#batch-write-put-records]. |
| originalErr | By default, **ElectroDB** alters the stacktrace of any exceptions thrown by the DynamoDB client to give better visibility to the developer. Set this value equal to `true` to turn off this functionality and return the error unchanged. |

# Errors:
| Error Code | Description |
| :--------: | ----------- | 
| 1000s | Configuration Errors |
| 2000s | Invalid Queries      |
| 3000s | User Defined Errors  |
| 4000s | DynamoDB Errors      |
| 5000s | Unexpected Errors    |

### No Client Defined On Model
*Code: 1001*

*Why this occurred:*
If a DynamoDB DocClient is not passed to the constructor of an Entity or Service (`client`), ElectroDB will be unable to query DynamoDB. This error will only appear when a query(using `go()`) is made because ElectroDB is still useful without a DocClient through the use of it's `params()` method.

*What to do about it:*
For an Entity be sure to pass the DocClient as the second param to the constructor:
```javascript
new Entity(schema, {client})
```
For a Service, the client is passed the same way, as the second param to the constructor:
```javascript
new Service("", {client});
```

### Invalid Identifier
*Code: 1002*

*Why this occurred:*
You tried to modify the entity identifier on an Entity.
   
*What to do about it:*
Make sure the you spelled the identifier correctly or that you actually passed a replacement.

### Invalid Key Facet Template
*Code: 1003*

*Why this occurred:*
You are trying to use the custom Key Facet Template and the format you passed is invalid. 
   
*What to do about it:*
Checkout the section on [Facet Templates]("#facet-templates") and verify your template conforms to the rules detailed there.

### Duplicate Indexes
*Code: 1004*

*Why this occurred:*
Your model contains duplicate indexes. This could be because you accidentally included an index twice or even forgot to add an index name on a secondary index, which would be interpreted as "duplicate" to the Table's Primary index.
   
*What to do about it:*
Double check your indexes as theyre defined on the model for duplicate indexes. The error should specify which index has been duplicated.
```javascript
{
  indexes: {
    index1: {
      index: "idx1", // <-- duplicate "idx1"
      pk: {},
      sk: {}
    },
    index2: {
      index: "idx1", // <-- duplicate "idx1"
      pk: {},
      sk: {}
    }
  }
}
```

### Collection Without An SK
*Code: 1005*

*Why this occurred:*
You have added a `collection` to an index that does not have an SK. Because Collections are used to help query across entities via the Sort Key, not having a Sort Key on an index defeats the purpose of a Collection.  
   
*What to do about it:*
If your index _does_ have an sk but youre unsure of how to inform electro without setting facets to the SK, add the SK object to the index and use an empty array for Facets:
```javascript
// ElectroDB interprets as index *not having* an SK.
{
  indexes: {
    myIndex: {
      pk: {
        field: "pk",
        facets: ["id"]
      }
    }
  }
}

// ElectroDB interprets as index *having* SK, but this model doesnt attach any facets to it.
{
  indexes: {
    myIndex: {
      pk: {
        field: "pk",
        facets: ["id"]
      },
      sk: {
        field: "sk",
        facets: []
      }
    }
  }
}
```  

### Duplicate Collections
*Code: 1006*

*Why this occurred:*
You have assigned the same collection name to multiple indexes. This is not allowed because collection names must be unique. 
   
*What to do about it:*
Determine a new naming scheme

### Missing Primary Index
*Code: 1007*

*Why this occurred:*
DynamoDB requires the definition of at least one Primary Index on the table. In Electro this is defined as an Index _without_ an `index` property. Each model needs at least one, and the facets used for this index must ensure each composite represents a unique record. 
   
*What to do about it:*
Identify the index youre using as the Primary Index and ensure it _does not_ have an index property on it's definition.
```javascript
// ElectroDB interprets as the Primary Index because it lacks an `index` property.
{
  indexes: {
    myIndex: {
      pk: {
        field: "pk",
        facets: ["org"]
      },
      sk: {
        field: "sk",
        facets: ["id"]
      }
    }
  }
}

// ElectroDB interprets as a Global Secondary Index because it has an `index` property.
{
  indexes: {
    myIndex: {
      index: "gsi1"
      pk: {
        field: "gsipk1",
        facets: ["org"]
      },
      sk: {
        field: "gsisk1",
        facets: ["id"]
      }
    }
  }
}
``` 

### Invalid Attribute Definition
*Code: 1008*

*Why this occurred:*
Some attribute on your model has an invalid configuration.   
   
*What to do about it:*
Use the error to identify which column needs to examined, double check the properties on that attribute. Checkout the section on (Attributes)[#attributes] for more information on how they are structured.

### Invalid Model
*Code: 1009*

*Why this occurred:*
Some properties on your model are missing or invalid.  
   
*What to do about it:*
Checkout the section on (Models)[#model] to verify your model against what is expected.  

### Invalid Options
*Code: 1010*

*Why this occurred:*
Some properties on your options object are missing or invalid.  
   
*What to do about it:*
Checkout the section on (Model/Service Options)[#model-service-options] to verify your model against what is expected.

### Duplicate Index Fields
*Code: 1014*

*Why this occurred:*
An Index in your model references the same field twice across indexes. The `field` property in the definition of an index is a mapping to the name of the field assigned to the the PK or SK of an index. 
   
*What to do about it:*
This is likely a typo, if not double check the names of the fields you assigned to be the PK and SK of your index, these field names must be unique.

### Duplicate Index Facets
*Code: 1014*

*Why this occurred:*
Within one index you tried to use the same facet in both the PK and SK. A facet may only be used once within an index. With electrodb it is not uncommon to use the same value as both the PK and SK when when a Sort Key exists on a table -- this usually is done because some value is required in that column but for that entity it is not neccessary. If this is your situation remember that ElectroDB does put a value in the SortKey even if does not include a facet, checkout (this seciton)[#collection-without-an-sk] for more information.
   
*What to do about it:*
Determine how you can change your access pattern to not duplicate the facet. Remember that an empty array for an SK is valid.   

### Missing Facets
*Code: 2002*

*Why this occurred:*
The current request is missing some facets to complete the query based on the model definition. Facets are used to create the Partition and Sort keys. In DynamoDB Partition keys cannot be partially included, and Sort Keys can be partially include they must be at least passed in the order they are defined on the model.   
   
*What to do about it:*
The error should describe the missing facets, ensure those facets are included in the query or update the model to reflect the needs of the access pattern.

### Invalid Last Evaluated Key
*Code: 4002*

*Why this occurred:*
_Likely_ you were were calling `.page()` on a `scan`. If you werent please make an issue and include as much detail about your query as possible.
   
*What to do about it:*
It is highly recommended to use the exclusiveStartKeyRaw flag when using .page() in conjunction with scans. This is because when using scan on large tables the docClient may return an ExclusiveStartKey for a record that does not belong to entity making the query (regardless of the filters set). In these cases ElectroDB will return null (to avoid leaking the keys of other entities) when further pagination may be needed to find your records.
```javascript
// example
model.scan.page({exclusiveStartKeyRaw: true});
```

### aws-error
*Code: 4001*

*Why this occurred:*
DynamoDB didnt like something about your query.
   
*What to do about it:*
By default electrodb tries to keep the stack trace close to your code, ideally this can help you identify what might be going on. A tip to help with troubleshooting: use `.params()` to get insight into how your query is being converted to DocClient params.

 

### Unknown Error

# Examples

> Want to just play with ElectroDB instead of read about it?
> Try it out for yourself! https://runkit.com/tywalch/electrodb-building-queries

## Employee App
For an example, lets look at the needs of application used to manage Employees. The application Looks at employees, offices, tasks, and projects.

### Employee App Requirements
1. As Project Manager I need to find all tasks and details on a specific employee.
2. As a Regional Manager I need to see all details about an office and its employees
3. As an Employee I need to see all my Tasks.
4. As a Product Manager I need to see all the tasks for a project.
5. As a Client I need to find a physical office close to me. 
6. As a Hiring manager I need to find employees with comparable salaries.  
7. As HR I need to find upcoming employee birthdays/anniversaries 
8. As HR I need to find all the employees that report to a specific manager

### Entities
```javascript
const EmployeesModel = {
	model: {
	  entity: "employees",
      version: "1",
      service: "taskapp",  
	},
	attributes: {
		employee: "string",
		firstName: "string",
		lastName: "string",
		office: "string",
		title: "string",
		team: ["development", "marketing", "finance", "product"],
		salary: "string",
		manager: "string",
		dateHired: "string",
		birthday: "string",
	},
	indexes: {
		employee: {
			pk: {
				field: "pk",
				facets: ["employee"],
			},
			sk: {
				field: "sk",
				facets: [],
			},
		},
		coworkers: {
			index: "gsi1pk-gsi1sk-index",
			collection: "workplaces",
			pk: {
				field: "gsi1pk",
				facets: ["office"],
			},
			sk: {
				field: "gsi1sk",
				facets: ["team", "title", "employee"],
			},
		},
		teams: {
			index: "gsi2pk-gsi2sk-index",
			pk: {
				field: "gsi2pk",
				facets: ["team"],
			},
			sk: {
				field: "gsi2sk",
				facets: ["title", "salary", "employee"],
			},
		},
		employeeLookup: {
			collection: "assignements",
			index: "gsi3pk-gsi3sk-index",
			pk: {
				field: "gsi3pk",
				facets: ["employee"],
			},
			sk: {
				field: "gsi3sk",
				facets: [],
			},
		},
		roles: {
			index: "gsi4pk-gsi4sk-index",
			pk: {
				field: "gsi4pk",
				facets: ["title"],
			},
			sk: {
				field: "gsi4sk",
				facets: ["salary", "employee"],
			},
		},
		directReports: {
			index: "gsi5pk-gsi5sk-index",
			pk: {
				field: "gsi5pk",
				facets: ["manager"],
			},
			sk: {
				field: "gsi5sk",
				facets: ["team", "office", "employee"],
			},
		},
	},
	filters: {
		upcomingCelebrations: (attributes, startDate, endDate) => {
			let { dateHired, birthday } = attributes;
			return `${dateHired.between(startDate, endDate)} OR ${birthday.between(
				startDate,
				endDate,
			)}`;
		},
	},
};

const TasksModel = {
	model: {
		entity: "tasks",
    	version: "1",
    	service: "taskapp",  
	}, 
	attributes: {
		task: "string",
		project: "string",
		employee: "string",
		description: "string",
	},
	indexes: {
		task: {
			pk: {
				field: "pk",
				facets: ["task"],
			},
			sk: {
				field: "sk",
				facets: ["project", "employee"],
			},
		},
		project: {
			index: "gsi1pk-gsi1sk-index",
			pk: {
				field: "gsi1pk",
				facets: ["project"],
			},
			sk: {
				field: "gsi1sk",
				facets: ["employee", "task"],
			},
		},
		assigned: {
			collection: "assignements",
			index: "gsi3pk-gsi3sk-index",
			pk: {
				field: "gsi3pk",
				facets: ["employee"],
			},
			sk: {
				field: "gsi3sk",
				facets: ["project", "task"],
			},
		},
	},
};

const OfficesModel = {
	model: {
  		entity: "offices",
      	version: "1",
      	service: "taskapp",  
  	}, 
	attributes: {
		office: "string",
		country: "string",
		state: "string",
		city: "string",
		zip: "string",
		address: "string",
	},
	indexes: {
		locations: {
			pk: {
				field: "pk",
				facets: ["country", "state"],
			},
			sk: {
				field: "sk",
				facets: ["city", "zip", "office"],
			},
		},
		office: {
			index: "gsi1pk-gsi1sk-index",
			collection: "workplaces",
			pk: {
				field: "gsi1pk",
				facets: ["office"],
			},
			sk: {
				field: "gsi1sk",
				facets: [],
			},
		},
	},
};
```
Join models on a new `Service` called `EmployeeApp`
```javascript
const DynamoDB = require("aws-sdk/clients/dynamodb");
const client = new DynamoDB.DocumentClient({region: "us-east-1"});
const { Service } = require("electrodb");
const table = "projectmanagement";
const EmployeeApp = new Service("EmployeeApp", { client, table });

EmployeeApp
	.join(EmployeesModel) // EmployeeApp.entities.employees
	.join(TasksModel)     // EmployeeApp.entities.tasks
	.join(OfficesModel);  // EmployeeApp.entities.tasks
```
### Query Records
#### All tasks and employee information for a given employee 
Fulfilling [Requirement #1](#employee-app-requirements).

```javascript
EmployeeApp.collections.assignements({employee: "CBaskin"}).go();
```
Returns the following:
```javascript
{
	employees: [{
		employee: "cbaskin",
		firstName: "carol",
		lastName: "baskin",
		office: "big cat rescue",
		title: "owner",
		team: "cool cats and kittens",
		salary: "1,000,000",
		manager: "",
		dateHired: "1992-11-04",
		birthday: "1961-06-06",
	}].
	tasks: [{
		task: "Feed tigers",
		description: "Prepare food for tigers to eat",
		project: "Keep tigers alive",
		employee: "cbaskin"
	}, {
		task: "Fill water bowls",
		description: "Ensure the tigers have enough water",
		project: "Keep tigers alive",
		employee: "cbaskin"
	}]
}
```

#### Find all employees and office details for a given office 
Fulfilling [Requirement #2](#employee-app-requirements).
```javascript
EmployeeApp.collections.workplaces({office: "big cat rescue"}).go()
```

Returns the following:
```javascript
{
	employees: [{
		employee: "cbaskin",
		firstName: "carol",
		lastName: "baskin",
		office: "big cat rescue",
		title: "owner",
		team: "cool cats and kittens",
		salary: "1,000,000",
		manager: "",
		dateHired: "1992-11-04",
		birthday: "1961-06-06",
	}],
	offices: [{
		office: "big cat rescue",
		country: "usa",
		state: "florida",
		city: "tampa"
		zip: "12345"
		address: "123 Kitty Cat Lane"
	}]
}
```

#### Tasks for a given employee 
Fulfilling [Requirement #3](#employee-app-requirements).

```javascript
EmployeeApp.entities.tasks.query.assigned({employee: "cbaskin"}).go();
```
Returns the following:
```javascript
[
	{
		task: "Feed tigers",
		description: "Prepare food for tigers to eat",
		project: "Keep tigers alive",
		employee: "cbaskin"
	}, {
		task: "Fill water bowls",
		description: "Ensure the tigers have enough water",
		project: "Keep tigers alive",
		employee: "cbaskin"
	}
]
```
#### Tasks for a given project 
Fulfilling [Requirement #4](#employee-app-requirements).
```javascript
EmployeeApp.entities.tasks.query.project({project: "Murder Carol"}).go();
```
Returns the following:
```javascript
[
	{
		task: "Hire hitman",
		description: "Find someone to murder Carol",
		project: "Murder Carol",
		employee: "jexotic"
	}
];
```

#### Find office locations 
Fulfilling [Requirement #5](#employee-app-requirements).
```javascript
EmployeeApp.entities.office.locations({country: "usa", state: "florida"}).go()
```
Returns the following:
```javascript
[
	{
		office: "big cat rescue",
		country: "usa",
		state: "florida",
		city: "tampa"
		zip: "12345"
		address: "123 Kitty Cat Lane"
	}
]
```

#### Find employee salaries and titles 
Fulfilling [Requirement #6](#employee-app-requirements).
```javascript
EmployeeApp.entities.employees
	.roles({title: "animal wrangler"})
	.lte({salary: "150.00"})
	.go()
```
Returns the following:
```javascript
[
	{
		employee: "ssaffery",
		firstName: "saff",
		lastName: "saffery",
		office: "gw zoo",
		title: "animal wrangler",
		team: "keepers",
		salary: "105.00",
		manager: "jexotic",
		dateHired: "1999-02-23",
		birthday: "1960-07-11",
	}
]
```

#### Find employee birthdays or anniversaries
Fulfilling [Requirement #7](#employee-app-requirements).
```javascript
EmployeeApp.entities.employees
	.workplaces({office: "gw zoo"})
	.upcomingCelebrations("2020-05-01", "2020-06-01")
	.go()
```
Returns the following:
```javascript
[
	{
		employee: "jexotic",
		firstName: "joe",
		lastName: "maldonado-passage",
		office: "gw zoo",
		title: "tiger king",
		team: "founders",
		salary: "10000.00",
		manager: "jlowe",
		dateHired: "1999-02-23",
		birthday: "1963-03-05",
	}
]
```
#### Find direct reports 
Fulfilling [Requirement #8](#employee-app-requirements).
```javascript
EmployeeApp.entities.employees
	.reports({manager: "jlowe"})
	.go()
```
Returns the following:
```javascript
[
	{
		employee: "jexotic",
		firstName: "joe",
		lastName: "maldonado-passage",
		office: "gw zoo",
		title: "tiger king",
		team: "founders",
		salary: "10000.00",
		manager: "jlowe",
		dateHired: "1999-02-23",
		birthday: "1963-03-05",
	}
]
```

## Shopping Mall Property Management App
For an example, lets look at the needs of application used to manage Shopping Mall properties. The application assists employees in the day-to-day operations of multiple Shopping Malls.

### Shopping Mall Requirements
1. As a Maintenance Worker I need to know which stores are currently in each Mall down to the Building they are located.
2. As a Helpdesk Employee I need to locate related stores in Mall locations by Store Category.
3. As a Property Manager I need to identify upcoming leases in need of renewal.

Create a new Entity using the `StoreLocations` schema defined [above](#shopping-mall-stores) 

```javascript
const DynamoDB = require("aws-sdk/clients/dynamodb");
const client = new DynamoDB.DocumentClient();
const StoreLocations = new Entity(model, {client, table: "StoreLocations"});
```

### Access Patterns are accessible on the StoreLocation 

### PUT Record
#### Add a new Store to the Mall
```javascript
await StoreLocations.create({
	mallId: "EastPointe",
	storeId: "LatteLarrys",
	buildingId: "BuildingA1",
	unitId: "B47",
	category: "spite store",
	leaseEndDate: "2020-02-29",
	rent: "5000.00",
}).go();
```
Returns the following:
```json
{
	"mallId": "EastPointe",
	"storeId": "LatteLarrys",
	"buildingId": "BuildingA1",
	"unitId": "B47",
	"category": "spite store",
	"leaseEndDate": "2020-02-29",
	"rent": "5000.00",
	"discount": "0.00",
}
```
---
### UPDATE Record
#### Change the Store's Lease Date
>When updating a record, you must include all **Facets** associated with the table's *primary* **PK** and **SK**.
```javascript
let storeId = "LatteLarrys";
let mallId = "EastPointe";
let buildingId = "BuildingA1";
let unitId = "B47";
await StoreLocations.update({storeId, mallId, buildingId, unitId}).set({
	leaseEndDate: "2021-02-28"
}).go();
```
Returns the following:
```json
{
	"leaseEndDate": "2021-02-28"
}
```

### GET Record
#### Retrieve a specific Store in a Mall
>When retrieving a specific record, you must include all **Facets** associated with the table's *primary* **PK** and **SK**.
```javascript
let storeId = "LatteLarrys";
let mallId = "EastPointe";
let buildingId = "BuildingA1";
let unitId = "B47";
await StoreLocations.get({storeId, mallId, buildingId, unitId}).go();
```
Returns the following:
```json
{
	"mallId": "EastPointe",
	"storeId": "LatteLarrys",
	"buildingId": "BuildingA1",
	"unitId": "B47",
	"category": "spite store",
	"leaseEndDate": "2021-02-28",
	"rent": "5000.00",
	"discount": "0.00"
}
```

### DELETE Record
#### Remove a Store location from the Mall
>When removing a specific record, you must include all **Facets** associated with the table's *primary* **PK** and **SK**.
```javascript
let storeId = "LatteLarrys";
let mallId = "EastPointe";
let buildingId = "BuildingA1";
let unitId = "B47";
let storeId = "LatteLarrys";
await StoreLocations.delete({storeId, mallId, buildingId, unitId}).go();
```
Returns the following:
```
{}
```

### Query Records

####  All Stores in a particular mall 
Fulfilling [Requirement #1](#shopping-mall-requirements).
```javascript

let mallId = "EastPointe";
let stores = await StoreLocations.malls({mallId}).query().go();
```
#### All Stores in a particular mall building 
Fulfilling [Requirement #1](#shopping-mall-requirements).
```javascript
let mallId = "EastPointe";
let buildingId = "BuildingA1";
let stores = await StoreLocations.malls({mallId}).query({buildingId}).go();
```

#### Find the store located in unit B47 
Fulfilling [Requirement #1](#shopping-mall-requirements).
```javascript
let mallId = "EastPointe";
let buildingId = "BuildingA1";
let unitId = "B47";
let stores = await StoreLocations.malls({mallId}).query({buildingId, unitId}).go();
```
#### Stores by Category at Mall 
Fulfilling [Requirement #2](#shopping-mall-requirements).
```javascript
let mallId = "EastPointe";
let category = "food/coffee";
let stores = await StoreLocations.malls({mallId}).byCategory(category).go();
```
#### Stores by upcoming lease 
Fulfilling [Requirement #3](#shopping-mall-requirements).
```javascript
let mallId = "EastPointe";
let q2StartDate = "2020-04-01";
let stores = await StoreLocations.leases({mallId}).lt({leaseEndDate: q2StateDate}).go();
```
#### Stores will renewals for Q4 
Fulfilling [Requirement #3](#shopping-mall-requirements).
```javascript
let mallId = "EastPointe";
let q4StartDate = "2020-10-01";
let q4EndDate = "2020-12-31";
let stores = await StoreLocations.leases(mallId)
    .between (
      {leaseEndDate: q4StartDate}, 
      {leaseEndDate: q4EndDate})
    .go();
```
#### Spite-stores with release renewals this year  
Fulfilling [Requirement #3](#shopping-mall-requirements).
```javascript
let mallId = "EastPointe";
let yearStarDate = "2020-01-01";
let yearEndDate = "2020-12-31";
let storeId = "LatteLarrys";
let stores = await StoreLocations.leases(mallId)
    .between (
      {leaseEndDate: yearStarDate}, 
      {leaseEndDate: yearEndDate})
    .filter(attr => attr.category.eq("Spite Store"))
    .go();
```

#### All Latte Larrys in a particular mall building
```javascript
let mallId = "EastPointe";
let buildingId = "BuildingA1";
let unitId = "B47";
let storeId = "LatteLarrys";
let stores = await StoreLocations.malls({mallId}).query({buildingId, storeId}).go();
``` 

# Electro CLI
> _NOTE: The ElectroCLI is currently in a beta phase and subject to change._

Electro is a CLI utility toolbox for extending the functionality of **ElectroDB**. Current functionality of the CLI allows you to:

1. Generate TypeScript type definition files for your `Entities` and `Services`.
2. Execute queries against your  `Entities`, `Services`, `Models` directly from the command line.
3. Dynamically stand up an HTTP Service to interact with your `Entities`, `Services`, `Models`.

For usage and installation details you can learn more [here](https://github.com/tywalch/electrocli).


# Version 1 Migration
This section is to detail any breaking changes made on the journey to a stable 1.0 product. 

## New schema format/breaking key format change
It became clear when I added the concept of a Service that the "version" paradigm of having the version in the PK wasnt going to work. This is because collection queries use the same PK for all entities and this would prevent some entities in a Service to change versions without impacting the service as a whole. The better more is the place the version in the SK _after_ the entity name so that all version of an entity can be queried. This will work nicely into the migration feature I have planned that will help migrate between model versions.  

To address this change, I decide it would be best to change the structure for defining a model, which is then used as heuristic to determine where to place the version in the key (PK or SK). This has the benefit of not breaking existing models, but does increase some complexity in the underlying code.

Additionally a change was made to the Service class. New Services would take a string of the service name instead of an object as before.

In the *old* scheme, version came after the service name (see `^`). 
```
pk: $mallstoredirectory_1#mall_eastpointe
                        ^
sk: $mallstores#building_buildinga#store_lattelarrys

```

In the *new* scheme, version comes after the entity name (see `^`).
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
  attributes: {},
  indexes: {}
};
new Entity(old_schema, {client});

// new way
let new_schema = {
  model: {
    entity: "model_name",
    service: "service_name",
    version: "1",
  },
  attributes: {},
  indexes: {}
};
new Entity(new_schema, {client, table});
```    
  
And changes to usage of `Service` would look like this:
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
```

# Coming Soon
- Default query options defined on the `model` to give more general control of interactions with the Entity.
- Append/Add/Subtract/Remove updates capabilities
- Complex attributes (list, map, set)
