
# ElectroDB  

![ElectroDB](https://github.com/tywalch/electrodb/blob/master/assets/electrodb.png?raw=true)
***ElectroDB*** is a dynamodb library to ease the use of having multiple entities and complex hierarchical relationships in a single dynamodb table. 

*This library is a work in progress, please submit issues/feedback or reach out on twitter [@tinkertamper](https://twitter.com/tinkertamper)*. 

## Features  
- **Attribute Schema Enforcement**: Define a schema for your entities with enforced attribute validation, defaults, types, aliases, and more.
- **Easily Compose Hierarchical Access Patterns**: Plan and design hierarchical keys for your indexes to multiply your possible access patterns.
- **Single Table Entity Segregation**: Entities created with **ElectroDB** will not conflict with other entities when using a single table.   
- **Simple Sort Key Condition Querying**: Write efficient sort key queries by easily building compose keys.
- **Simple Filter Composition**: Easily create complex readable filters for Dynamo queries without worrying about the implementation of `ExpressionAttributeNames`, `ExpressionAttributeValues`. 
- **Easily Query Across Entities**: Define "collections" to create powerful/peformant queries that return multiple entities in a single request.

Turn this:
```javascript
MallStores.query
	.leases({ mallId: "EastPointe" })
	.between({ leaseEndDate:  "2020-04-01" }, { leaseEndDate:  "2020-07-01" })
	.filter(({rent, discount}) => `
		${rent.between("2000.00", "5000.00")} AND ${discount.lte("1000.00")}
	`)
	.params();
```
Into This:
```javascript
{
  "IndexName": "idx2",
  "TableName": "electro",
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
  "KeyConditionExpression": "#pk = :pk and #sk1 BETWEEN :sk1 AND :sk2",
  "FilterExpression": "(#rent between :rent1 and :rent2) AND #discount <= :discount1"
}
```
Table of Contents
=================
- [ElectroDB](#electrodb)
  * [Features](#features)
- [Table of Contents](#table-of-contents)
- [Installation](#installation)
- [Usage](#usage)
- [Entities and Services](#entities-and-services)
- [Entities](#entities)
- [Services](#services)
  * [Model](#model)
    + [Model Properties:](#model-properties-)
    + [Service Properties](#service-properties)
    + [Model/Service Options](#model-service-options)
  * [Attributes](#attributes)
  * [Indexes](#indexes)
  * [Facets](#facets)
    + [Facet Arrays](#facet-arrays)
    + [Facet Templates](#facet-templates)
  * [Collections](#collections)
  * [Filters](#filters)
    + [Defined on the model](#defined-on-the-model)
    + [Defined via "Filter" method after query operators](#defined-via--filter--method-after-query-operators)
    + [Multiple Filters](#multiple-filters)
- [Building Queries](#building-queries)
    + [Sort Key Operations](#sort-key-operations)
    + [Using facets to make hierarchical keys](#using-facets-to-make-hierarchical-keys)
      - [Shopping Mall Stores](#shopping-mall-stores)
  * [Query Chains](#query-chains)
    + [`Get` Method](#-get--method)
    + [`Delete` Method](#-delete--method)
    + [`Put` Record](#-put--record)
    + [`Update` Record](#-update--record)
    + [`Scan` Records](#-scan--records)
    + [`Query` Records](#-query--records)
      - [Partition Key Facets](#partition-key-facets)
  * [Collection Chains](#collection-chains)
  * [Execute Query `.go() and .params()`](#execute-query--go---and-params---)
    + [`.params()`](#-params---)
    + [`.go()`](#-go---)
  * [Query Examples](#query-examples)
  * [Query Options](#query-options)
- [Examples](#examples)
  * [Employee App](#employee-app)
    + [Employee App Requirements](#employee-app-requirements)
    + [Entities](#entities-1)
    + [`Query` Records](#-query--records-1)
      - [All tasks and employee information for a given employee](#all-tasks-and-employee-information-for-a-given-employee--requirement--1---employee-app-requirements-)
      - [Find all employees and office details for a given office](#find-all-employees-and-office-details-for-a-given-office--requirement--2---employee-app-requirements-)
      - [Tasks for a given employee](#tasks-for-a-given-employee--requirement--3---employee-app-requirements-)
      - [Tasks for a given project](#tasks-for-a-given-project--requirement--4---employee-app-requirements-)
      - [Find office locations](#find-office-locations--requirement--5---employee-app-requirements-)
      - [Find employee salaries and titles](#find-employee-salaries-and-titles--requirement--6---employee-app-requirements-)
      - [Find employee birthday/anniversary](#find-employee-birthday-anniversary--requirement--7---employee-app-requirements-)
      - [Find direct reports](#find-direct-reports--requirement--8---employee-app-requirements-)
  * [Shopping Mall Property Management App](#shopping-mall-property-management-app)
    + [Shopping Mall Requirements](#shopping-mall-requirements)
    + [Access Patterns are accessible on the StoreLocation](#access-patterns-are-accessible-on-the-storelocation)
    + [`PUT` Record](#-put--record)
      - [Add a new Store to the Mall](#add-a-new-store-to-the-mall-)
    + [`UPDATE` Record](#-update--record)
      - [Change the Store's Lease Date](#change-the-store-s-lease-date-)
    + [`GET` Record](#-get--record)
      - [Retrieve a specific Store in a Mall](#retrieve-a-specific-store-in-a-mall)
    + [`DELETE` Record](#-delete--record)
      - [Remove a Store location from the Mall](#remove-a-store-location-from-the-mall)
    + [`Query` Records](#-query--records-2)
      - [All Stores in a particular mall](#all-stores-in-a-particular-mall---requirement--1---shopping-mall-requirements--)
      - [All Stores in a particular mall building](#all-stores-in-a-particular-mall-building---requirement--1---shopping-mall-requirements--)
      - [What store is located in unit "B47"?)](#what-store-is-located-in-unit--b47-----requirement--1---shopping-mall-requirements--)
      - [Stores by Category at Mall](#stores-by-category-at-mall---requirement--2---shopping-mall-requirements--)
      - [Stores by upcoming lease](#stores-by-upcoming-lease---requirement--3---shopping-mall-requirements--)
      - [Stores will renewals for Q4](#stores-will-renewals-for-q4---requirement--3---shopping-mall-requirements--)
      - [Spite-stores with release renewals this year](#spite-stores-with-release-renewals-this-year----requirement--3---shopping-mall-requirements--)
      - [All Latte Larry's in a particular mall building](#all-latte-larry-s-in-a-particular-mall-building--crazy-for-any-store-except-a-coffee-shop-)
- [Coming Soon:](#coming-soon-)


# Installation    

Install from NPM  

```bash  
npm install electrodb --save
```


# Usage
Require or import `Entity` or `Service` from `electrodb`:    
```javascript  
const {Entity, Service} = require("electrodb");
```

# Entities and Services
> To see full examples of ***ElectroDB*** in action, go to the [Examples](#examples) section.

`Entity` allows you to create separate and individual business objects in a *DynamoDB* table. When queried your results will not include other Entities that exist the same table. For more detail, read [Entities](#entities). 

`Service` allows you to build a relationships across Entities. A service imports Entity [Models](#model), builds individual Entities and builds [Collections](#collections) for cross Entity querying. For more detail, read [Services](#services).

You can use Entities independent of Services, you do not need to import models into a Service to use them individually. However, you do you need to use a Service if you intend make queries `join` multiple Entities.

# Entities  

In ***ElectroDB*** an `Entity` is represents a single business object. For example, in a simple task tracking application, one Entity could represent an Employee and another Entity might represent a the Task that the employee is assigned to. 

Require or import `Entity` from `electrodb`:    
```javascript  
const {Entity} = require("electrodb");
```

# Services
In ***ElectroDB*** a `Service` represents a collection of Entities and also allows you to build queries span across Entities. Similar to Entities, Services can coexist on a single table without collision. You can use Entities independent of Services, you do not need to import models into a Service to use them individually. However, you do you need to use a Service if you intend make queries `join` multiple Entities.

Require or import `Service` from `electrodb`:    
```javascript  
const {Service} = require("electrodb");
```


## Model 

Create an Entity's schema. In the below example.

```javascript
const  DynamoDB  =  require("aws-sdk/clients/dynamodb");
const {Entity, Service} = require("electrodb");
const client = new DynamoDB.DocumentClient();
const EmployeesModel = {
	entity: "employees",
	version: "1",
	service: "taskapp",
	table: "projectmanagement",
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
	entity: "tasks",
	version: "1",
	service: "taskapp",
	table: "projectmanagement",
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
Create individual Entities with the Models or `join` them via a Service: 
```javascript
// Independent Models
let employees = new Entity(EmployeesModel, { client });
let tasks = new Entity(TasksModel, { client });
```

```javascript
// Joined via a Service
let TaskApp = new Service({
		version: "1",
		service: "TaskApp",
		table: "projectmanagement",
	},
	{ client },
);
TaskApp.join(EmployeesModel); // TaskApp.entities.employees
TaskApp.join(TasksModel); // TaskApp.entities.tasks
```
### Model Properties:

| Property | Description |
| ----------- | ----------- |
| service  | Name of the application using the entity, used to namespace all entities |
entity | Name of the entity that the schema represents |  
table | Name of the dynamodb table in aws |  
version | (optional) The version number of the schema, used to namespace keys |  
attributes | An object containing each attribute that makes up the schema |  
indexes | An object containing table indexes, including the values for the table's default Partition Key and Sort Key
filters | An object containing user defined filter template functions.

### Service Properties
| Property | Description |
| ----------- | ----------- |
| service  | Name of the service, used to namespace all joined entities, will override the model definition. |
table | Name of the dynamodb table in aws, will override the model definition. | 
version | (optional) The version number of the schema, used to namespace keys, will override the model definition. |


### Model/Service Options
Optional second parameter
| Property | Description |
| ----------- | ----------- |
| client  | (optional) A docClient instance for use when querying a DynamoDB table. This is optional if you wish to only use the `params` functionality, but required if you actually need to query against a database.  

## Attributes
**Attributes** define an **Entity** record. The `propertyName` represents the value your code will use to represent an attribute. 

> **Pro-Tip:**
> Using the `field` property, you can map an `AttributeName` to a different field name in your table. This can be useful to utilize existing tables, existing models, or even to reduce record sizes via shorter field names. 

```typescript
attributes: {
	<AttributeName>: {
		"type": string|string[],
		"required"?: boolean,
		"default"?: value|() => value
		"validate"?: RegExp|() => boolean
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
| `type`  | `string`, `string[]` | yes | Accepts the values: `"string"`, `"number"` `"boolean"`, or an array of strings representing a finite list of acceptable values: `["option1", "option2", "option3"]`. |
`required` | `boolean` | no | Whether or not the value is required when creating a new record. |  
`default` | `value`, `() => value` | no | Either the default value itself or a synchronous function that returns the desired value. |  
`validate` | `RegExp`, `() => boolean` | no | Either regex or a synchronous callback to return a boolean. |  
`field` | `string` | no | The name of the attribute as it exists dynamo, if named differently in the schema attributes. Defaults to the `AttributeName` as defined in the schema.
`readOnly` | `boolean` | no | Prevents update of the property after the record has been created. Attributes used in the composition of the table's primary Partition Key and Sort Key are by read-only by default.
`label` | `string` | no | Used in index composition to prefix key facets. By default, the `AttributeName` is used as the label.
`cast` | `"number"`, `"string"`, `"boolean"` | no | Optionally cast attribute values when interacting with DynamoDB. Current options include: "number", "string", and "boolean".
`set` | `(attribute, schema) => value` | no | A synchronous callback allowing you apply changes to a value before it is set in params or applied to the database. First value represents the value passed to ElectroDB, second value are the attributes passed on that update/put 
`get` | `(attribute, schema) => value` | no | A synchronous callback allowing you apply changes to a value after it is retrieved from the database. First value represents the value passed to ElectroDB, second value are the attributes retrieved from the database. 

## Indexes
The `indexes` object requires at least the definition of the table's natural **Partition Key** and (if applicable) **Sort Key**.

Indexes are defined, and later referenced by their `accessPatternName`. These defined via a `facets` array that is made up of attributes names as listed the model.

```typescript
indexes: {
	<accessPatternName>: {
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

## Facets 
A **Facet** is a segment of a key based on one of the attributes. **Facets** are concatenated together from either a **Partition Key** or an **Sort Key** key, which define an `index`. 

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

Collections are defined on an Index, and the name of the collection should represent what the query would return as a pseudo `Entity`.

> **Note**: `collection` should be unique to a single common index across entities. 

Using the TaskApp Models defined in [Models](#model), these models share a `collection` called `assignments` on the index `gsi3pk-gsi3sk-index`
```javascript
let TaskApp =  new  Service({
	version:  "1", 
	service:  "TaskApp", 
	table:  "projectmanagement"
},  { client }); 
TaskApp.join(EmployeesModel);  // TaskApp.entities.employees
TaskApp.join(TasksModel);  // TaskApp.entities.tasks

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
Building thoughtful indexes can make queries simple and performant. Sometimes you need to filter results down further. By adding Filters to your model, you can extend your queries with custom filters. Below is the traditional way you would add a filter to Dynamo's DocumentClient directly along side how you would accomplish the same using a Filter function.

```javascript
{
  IndexName: 'idx2',
  TableName: 'electro',
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


let MallStores  =  new Entity("MallStores", model);
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
  TableName: 'electro',
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
### Defined via "Filter" method after query operators 
```javascript
let MallStores  =  new Entity("MallStores", model);
let maxRent = "5000.00";
let minRent = "2000.00";
let promotion = "1000.00";
let stores  =  MallStores.query
	.leases({ mallId: "EastPointe" })
	.between({ leaseEndDate:  "2020-04-01" }, { leaseEndDate:  "2020-07-01" })
	.filter(({rent, discount}) => `
		${rent.between(minRent, maxRent)} AND ${discount.lte(promotion)}
	`)
	.params();

// Results
{
  IndexName: 'idx2',
  TableName: 'electro',
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
let MallStores = new Entity("MallStores", model);
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

# Building Queries
Forming a composite **Partition Key** and **Sort Key** is a critical step in planning **Access Patterns** in **DynamoDB**. When planning composite keys, it is critical to consider the order in which they are *composed*.  As of the time of writing this documentation, **DynamoDB**  has the following constraints that should be taken into account when planning your **Access Patterns**:
1. You must always supply the **Partition Key** in full for all queries to **DynamoDB**.
2. You currently only have the following operators available on a **Sort Key**: `begins_with`, `between`, `>`, `>=`, `<`, `<=`, and `Equals`.
3. To act on single record, you will need to know the full  **Partition Key** and **Sort Key** for that record.

### Sort Key Operations 
| operator | use case |
| ---: | ----------- |
| `begins_with` | Keys starting with a particular set of characters.
| `between` | Keys between a specified range. |
| `eq` | Keys equal to some value |
| `gt` | Keys less than some value |
| `gte` | Keys less than or equal to some value |
| `lt` | Keys greater than some value |
| `lte` | Keys greater than or equal to some value |

### Using facets to make hierarchical keys
Carefully considering your **Facet** order will allow ***ElectroDB** to express hierarchical relationships and unlock more available **Access Patterns** for your application. 

For example, let's say you have a `MallStore` Entity that represents Store Locations inside Malls:

#### Shopping Mall Stores
```javascript
let model = {  
	service: "MallStoreDirectory",  
	entity: "MallStore",  
	table: "StoreDirectory",  
	version: "1",  
	attributes: {  
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
				facets: ["storeId"]
			}, 
			sk: {
				field: "sk",
				facets: ["mallId", "buildingId", "unitId"]
			}  
		},  
		malls: {  
			index: "idx1",  
			pk: {
				field: "idx1pk",
				facets: ["mallId"]
			},  
			sk: {
				field: "idx1sk",
				facets: ["buildingId", "unitId", "storeId"]
			}  
		},
		leases: {
			index: "idx2",
			pk: {
				field: "idx2pk",
				facets: ["mallId"]
			},  
			sk: {
				field: "idx2pk",
				facets: ["leaseEndDate", "storeId", "buildingId", "unitId"]
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
```

Each record represents one Store location. All Stores are located in Malls we manage. 

To satisfy requirements for searching based on location, you could use the following keys: Each `MallStore` record would have a **Partition Key**  with the store's `storeId`. This key alone is not enough to identify a particular store. To solve this, compose a **Sort Key** for the store's location attribute ordered hierarchically (mall/building/unit): `["mallId", "buildingId", "unitId"]`. 

The `MallStore` entity above, using just the `stores` **Index** alone enables four **Access Patterns**:
1. All `LatteLarrys` locations in all *Malls*
2. All `LatteLarrys` locations in one *Mall*
3. All `LatteLarrys` locations inside a specific *Mall*
4. A specific `LatteLarrys` inside of a *Mall* and *Building*

## Query Chains
Queries in ***ElectroDB*** are built around the **Access Patterns** defined in the Schema and are capable of using partial key **Facets** to create performant lookups. To accomplish this, ***ElectroDB*** offers a predictable chainable API.

> Examples in this section using the `MallStore` schema defined [above](#shopping-mall-stores). 

The methods: Get (`get`), Create (`put`), Update (`update`), and Delete (`delete`) **require* all facets described in the Entities' primary `PK` and `SK`.  

### `Get` Method
Provide all facets in an object to the `get` method
```javascript
await StoreLocations.get({
	storeId: "LatteLarrys", 
	mallId: "EastPointe", 
	buildingId: "BuildingA1", 
	unitId: "B47"
}).go();
```
### `Delete` Method
Provide all facets in an object to the `delete` method to delete a record.

```javascript
await StoreLocations.delete({
	storeId: "LatteLarrys", 
	mallId: "EastPointe", 
	buildingId: "BuildingA1", 
	unitId: "B47"
}).go();
```

### `Put` Record
Provide all *required* Attributes as defined in the model to create a new record. **ElectroDB** will enforce any defined validations, defaults, casting, and field aliasing.
```javascript
let store = {
	storeId: "LatteLarrys",
	mallId: "EastPointe",
	buildingId: "BuildingA1",
	unitId: "B47",
	category: "food/coffee",
	leaseEndDate: "2020-03-22"
}
await StoreLocations.put(store).go();
```

### `Update` Record
To update a record, pass all facets to the update method and then pass `set` attributes that need to be updated. 

*Note: If your update includes changes to an attribute that is also a facet for a global secondary index, you must provide all facets for that index.*

```javascript
let storeId = "LatteLarrys";
let mallId = "EastPointe";
let buildingId = "BuildingA1";
let unitId = "B47";
let category = "food/meal";
await StoreLocations
	.update({storeId, mallId, buildingId, unitId})
	.set({category})
	.go();
```

### `Scan` Records
When scanning for rows, you can use filters the same as you would any query. For more detial on filters, see the [Filters](#filters) section.

*Note: `Scan` functionality will be scoped to your Entity. This means your results will only include records that match the Entity defined in the model.*
```javascript
await StoreLocations.scan
	.filter(({category}) => `
		${category.eq("food/coffee")} OR ${category.eq("spite store")}  
	`)
	.filter(({leaseEndDate}) => `
		${leaseEndDate.between("2020-03", "2020-04")}
	`)
	.go();
```

### `Query` Records

> Examples in this section using the `MallStore` schema defined [above](#shopping-mall-stores). 

All queries start from the Access Pattern defined in the schema. 

```javascript
const MallStore = new Entity(schema); 
// Each Access Pattern is available on the Entity instance
// MallStore.query.stores()
// MallStore.query.malls()
```

#### Partition Key Facets
All queries require (*at minimum*) the **Facets** included in its defined **Partition Key**. They can be supplied in the order they are composed or in a single object when invoking the **Access Pattern**.
```javascript
const MallStore = new Entity(schema);
//	stores
//	pk: ["storeId"]
//	sk: ["mallId", "buildingId", "unitId"]

let storeId = "LatteLarrys";
let mallId = "EastPointe";

// Good: As an object
MallStore.query.stores({storeId});

// Bad: Facets missing, will throw
MallStore.query.stores(); // err: Params passed to ENTITY method, must only include storeId

// Bad: Facets not included, will throw
MallStore.query.stores({mallId}); // err: Params passed to ENTITY method, must only include storeId
```

After invoking the **Access Pattern** with the required **Partition Key** **Facets**, you can now choose what **Sort Key Facets** are applicable to your query. Examine the table in [Sort Key Operations](#sort-key-operations) for more information on the available operations on a **Sort Key**.

## Collection Chains
Collections allow you to query across Entities. To use them you need to `join` your Models onto a `Service` instance.
  
> Using the TaskApp Models defined in [Models](#model), these models share a `collection` called `assignments` on the index `gsi3pk-gsi3sk-index`
```javascript
let TaskApp =  new Service({
	version:  "1", 
	service:  "TaskApp", 
	table:  "projectmanagement"
},  { client }); 
TaskApp.join(EmployeesModel);  // TaskApp.entities.employees
TaskApp.join(TasksModel);  // TaskApp.entities.tasks
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


## Execute Query `.go() and .params()` 
Lastly, all query chains end with either a `.go()` or a `.params()` method invocation. These will either execute the query to DynamoDB (`.go()`) or return formatted parameters for use with the DynamoDB docClient (`.params()`).

Both `.params()` and `.go()` take a query configuration object which is detailed more in the section [Query Options](#query-options).

### `.params()`
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

### `.go()`
The `go` method _ends_ a query chain, and asynchronously queries DynamoDB with the `client` provided in the model. 

> For more information on the options available in the `config` object, check out the section [Query Options](#query-options).

```javascript
let config = {};
let stores  =  MallStores.query
				.leases({ mallId })
				.between(
					{ leaseEndDate:  "2020-06-01" }, 
					{ leaseEndDate:  "2020-07-31" })
				.filter(({rent}) => rent.lte("5000.00"))
				.go(config);

```

## Query Examples
Below are _all_ chain possibilities available, given the `MallStore` model. 

```javascript
// leases  
// pk: ["mallId"]  
// sk: ["buildingId", "unitId", "storeId"]

let mallId = "EastPointe";

// begins_with
MallStore.query.leases({mallId}).go()
MallStore.query.leases({mallId, leaseEndDate: "2020-03"}}).go();
MallStore.query.leases({mallId, leaseEndDate: "2020-03-22", rent: "2000.00"}).go();

// gt, gte, lt, lte
MallStore.query.leases({mallId}).gt({leaseEndDate}).go();
MallStore.query.leases({mallId}).gte({leaseEndDate}).go();
MallStore.query.leases({mallId}).lt({leaseEndDate}).go();
MallStore.query.leases({mallId}).lte({leaseEndDate}).go();

// between
MallStore.query.leases({mallId}).between({leaseEndDate: "2020-03"}, {leaseEndDate: "2020-04"}).go();

// filters -- applied after any of the sort key operators above 
let june = "2020-06";
let july = "2020-07"; 
let discount = "500.00";
let maxRent = "2000.00";
let minRent = "5000.00";

MallStore.query
  .leases({mallId, leaseEndDate: june})
  .rentDiscount(discount, maxRent, minRent)
  .go();

MallStore.query
  .leases({mallId})
  .between(
    {leaseEndDate: june}, 
    {leaseEndDate: july})
  .byCategory("food/coffee")
  .go();
```

## Query Options
By default **ElectroDB** enables you to work with records as the names and properties defined in the model. Additionally, it removes the need to deal directly with the docClient parameters which can be complex for a team without as much experience with DynamoDB. The Query Options object can be passed to both the `.params()` and `.go()` methods when building you query. Below are the options available:

```typescript
let options = {
	params: [object],
	raw: [boolean],
	includeKeys: [boolean],
	originalErr: [boolean],
};
```
| Option | Description |  
| ----------- | ----------- |  
| params  | Properties added to this object will be merged onto the params sent to the document client. Any conflicts with **ElectroDB** will favor the params specified here.
| raw  | Returns query results as they were returned by the docClient.  
| includeKeys | By default, **ElectroDB** does not return partition, sort, or global keys in its response. 
| originalErr | By default, **ElectroDB** alters the stacktrace of any exceptions thrown by the DynamoDB client to give better visibility to the developer. Set this value equal to `true` to turn off this functionality and return the error unchanged.
# Examples

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
	entity: "employees",
	version: "1",
	service: "taskapp",
	table: "projectmanagement",
	attributes: {
		employee: {
			type: "string",
		},
		firstName: {
			type: "string",
		},
		lastName: {
			type: "string",
		},
		office: {
			type: "string",
		},
		title: {
			type: "string",
		},
		team: {
			type: ["development", "marketing", "finance", "product"],
		},
		salary: {
			type: "string",
		},
		manager: {
			type: "string",
		},
		dateHired: {
			type: "string",
		},
		birthday: {
			type: "string",
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
	entity: "tasks",
	version: "1",
	service: "taskapp",
	table: "projectmanagement",
	attributes: {
		task: {
			type: "string",
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
	entity: "offices",
	version: "1",
	table: "electro",
	service: "electrotest",
	attributes: {
		office: {
			type: "string",
		},
		country: {
			type: "string",
		},
		state: {
			type: "string",
		},
		city: {
			type: "string",
		},
		zip: {
			type: "string",
		},
		address: {
			type: "string",
		},
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
const client = new DynamoDB.DocumentClient({
	region: "us-east-1",
});
const { Service } = require("electrodb");
let EmployeeApp = new Service(
	{
		version: "1",
		service: "EmployeeApp",
		table: "projectmanagement",
	},
	{ client },
);

EmployeeApp.join(EmployeesModel); // EmployeeApp.entities.employees
EmployeeApp.join(TasksModel); // EmployeeApp.entities.tasks
EmployeeApp.join(OfficesModel); // EmployeeApp.entities.tasks
```
### `Query` Records
#### All tasks and employee information for a given employee [Requirement #1](#employee-app-requirements)

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

#### Find all employees and office details for a given office [Requirement #2](#employee-app-requirements)
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

#### Tasks for a given employee [Requirement #3](#employee-app-requirements)

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
#### Tasks for a given project [Requirement #4](#employee-app-requirements)
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

#### Find office locations [Requirement #5](#employee-app-requirements)
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

#### Find employee salaries and titles [Requirement #6](#employee-app-requirements)
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

#### Find employee birthday/anniversary [Requirement #7](#employee-app-requirements)
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
#### Find direct reports [Requirement #8](#employee-app-requirements)
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

Create a new Entity using the `MallStore` schema defined [above](#shopping-mall-stores) 

```javascript
const DynamoDB = require("aws-sdk/clients/dynamodb");
const client = new DynamoDB.DocumentClient();
const MallStore = new Entity(model, {client});
```

### Access Patterns are accessible on the StoreLocation 

### `PUT` Record
#### Add a new Store to the Mall:
```javascript
await MallStore.create({
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
### `UPDATE` Record
#### Change the Store's Lease Date:
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

### `GET` Record
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

### `DELETE` Record
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

### `Query` Records

####  All Stores in a particular mall ([Requirement #1](#shopping-mall-requirements))
```javascript

let mallId = "EastPointe";
let stores = await StoreLocations.malls({mallId}).query().go();
```
#### All Stores in a particular mall building ([Requirement #1](#shopping-mall-requirements))
```javascript
let mallId = "EastPointe";
let buildingId = "BuildingA1";
let stores = await StoreLocations.malls({mallId}).query({buildingId}).go();
```

#### What store is located in unit "B47"? ([Requirement #1](#shopping-mall-requirements))
```javascript
let mallId = "EastPointe";
let buildingId = "BuildingA1";
let unitId = "B47";
let stores = await StoreLocations.malls({mallId}).query({buildingId, unitId}).go();
```
#### Stores by Category at Mall ([Requirement #2](#shopping-mall-requirements)) 
```javascript
let mallId = "EastPointe";
let category = "food/coffee";
let stores = await StoreLocations.malls({mallId}).byCategory(category).go();
```
#### Stores by upcoming lease ([Requirement #3](#shopping-mall-requirements))  
```javascript
let mallId = "EastPointe";
let q2StartDate = "2020-04-01";
let stores = await StoreLocations.leases({mallId}).lt({leaseEndDate: q2StateDate}).go();
```
#### Stores will renewals for Q4 ([Requirement #3](#shopping-mall-requirements))  
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
#### Spite-stores with release renewals this year  ([Requirement #3](#shopping-mall-requirements))  
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

#### All Latte Larry's in a particular mall building (crazy for any store except a coffee shop)
```javascript

let mallId = "EastPointe";
let buildingId = "BuildingA1";
let unitId = "B47";
let storeId = "LatteLarrys";
let stores = await StoreLocations.malls({mallId}).query({buildingId, storeId}).go();
```
# Coming Soon:
- `.page()` finish method (like `.params()` and `.go()`) to allow for easier pagination of results
- Additional query options like `limit`, `pages`, `attributes`, `sort` and more for easier querying.
- Default query options defined on the `model` to give more general control of interactions with the Entity.
