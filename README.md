# ElectroDB  

![ElectroDB](https://github.com/tywalch/electrodb/blob/master/assets/electrodb.png?raw=true)
***ElectroDB*** is a dynamodb library to ease the use of having multiple entities and complex heretical relationships in a single dynamodb table. 

*This library is a work in progress, please submit issues/feedback or reach out on twitter [@tinkertamper](https://twitter.com/tinkertamper)*. 

## Features  
- **Attribute Schema Enforcement**: Define a schema for your entities with enforced attribute validation, defaults, types, aliases, and more.
- **Easily Compose Hierarchical Access Patterns**: Plan and design hierarchical keys for your indexes to multiply your possible access patterns.
- **Single Table Entity Segregation**: Entities created with **ElectroDB** will not conflict with other entities when using a single table.   
- **Simple Sort Key Condition Querying**: Write efficient sort key queries by easily building compose keys.
- **Simple Filter Composition**: Easily create complex readable filters for Dynamo queries without worrying about the implementation of `ExpressionAttributeNames`, `ExpressionAttributeValues`. 

Table of Contents
=================
- [ElectroDB](#electrodb)
	- [Features](#features)
- [Table of Contents](#table-of-contents)
- [Installation](#installation)
- [Usage](#usage)
	- [Entities](#entities)
	- [Model](#model)
	- [Attributes](#attributes)
	- [Indexes](#indexes)
	- [Facets](#facets)
		- [Facet Arrays](#facet-arrays)
		- [Facet Templates](#facet-templates)
	- [Filters](#filters)
		- [Defined on the model](#defined-on-the-model)
		- [Defined via "Filter" method after query operators](#defined-via-filter-method-after-query-operators)
		- [Multiple Filters](#multiple-filters)
- [Building Queries](#building-queries)
		- [Sort Key Operations](#sort-key-operations)
		- [Using Facets to Make Heretical Keys](#using-facets-to-make-heretical-keys)
			- [Shopping Mall Stores](#shopping-mall-stores)
	- [Query Chains](#query-chains)
		- [`Get` Method](#get-method)
		- [`Delete` Method](#delete-method)
		- [`Put` Record](#put-record)
		- [`Update` Record](#update-record)
		- [`Scan` Records](#scan-records)
		- [`Query` Records](#query-records)
			- [Partition Key Facets](#partition-key-facets)
		- [Execute Query `.go() and .params()`](#execute-query-go-and-params)
		- [`.params()`](#params)
		- [`.go()`](#go)
	- [Query Chain Examples](#query-chain-examples)
	- [Query Options](#query-options)
- [Examples](#examples)
		- [Shopping Mall Property Management App](#shopping-mall-property-management-app)
			- [Shopping Mall Requirements](#shopping-mall-requirements)
	- [Access Patterns are accessible on the StoreLocation](#access-patterns-are-accessible-on-the-storelocation)
		- [`PUT` Record](#put-record-1)
			- [Add a new Store to the Mall:](#add-a-new-store-to-the-mall)
		- [`UPDATE` Record](#update-record-1)
			- [Change the Store's Lease Date:](#change-the-stores-lease-date)
		- [`GET` Record](#get-record)
			- [Retrieve a specific Store in a Mall](#retrieve-a-specific-store-in-a-mall)
		- [`DELETE` Record](#delete-record)
			- [Remove a Store location from the Mall](#remove-a-store-location-from-the-mall)
		- [`Query` Records](#query-records-1)
			- [Find Stores that match core access patterns](#find-stores-that-match-core-access-patterns)
	- [Coming Soon:](#coming-soon)

# Installation    

Install from NPM  

```bash  
npm install electrodb --save
```

# Usage
Unlike in traditional sql databases, a single *DynamoDB* table will include multiple entities along side each other. Additionally, *DynamoDB* utilizes *Partition* and *Sort Keys* to query records to allow for hierarchical relationships. ElectroDB allows you to make the most of these concepts with less headaches. 

## Entities  

In ***ElectroDB*** an `Entity` is a single record that represents a single business object. For example, in a simple contact application, one entity could represent a Person and another entity might represent a Contact method for that person (email, phone, etc.).

Require or import `Entity` from `electrodb`:    
```javascript  
const {Entity} = require("electrodb");
```

## Model  

Create an Entity's schema   

```javascript
const  DynamoDB  =  require("aws-sdk/clients/dynamodb");
const {Entity} = require("electrodb");
const client = new DynamoDB.DocumentClient();

let model = {  
	service: "ClientRelationshipApp", 
	entity: "UserContacts", 
	table: "ClientContactTable", 
	version: "1", 
	attributes: {
		clientId: {
			type: "string",
			required: true,
		},            
		userId: {  
			type: "string", 
			required: true,  
		},
		type: { 
			type: ["email", "phone", "social"], 
			required: true,
		},
		value:  {
			type: "string", 
			required: true,
		},
		canContactWeekends: {
			type: "boolean",
			required: false
		},
		maxContactFrequency: {
			type: "number",
			required: true,
			default: 5
		}
	},
	indexes: {
		contact: {
			pk: {
				field: "PK",
				facets: ["value"]
			},
			sk: {
				field: "SK",
				facets: ["clientId", "userId"]
			}
		},
		clientContact: {
			index: "GSI1PK-GSI1SK-Index",
			pk: {
				field: "GSI1PK",
				facets: ["clientId"]
			},
			sk: {
				field: "GSI1SK",
				facets: ["value", "userId"]
			}
		},
		userContact: {
			index: "GSI2PK-GSI2SK-Index",
			pk: {
				field: "GSI2PK",
				facets: ["userId"]
			},
			sk: {
				field: "GSI2SK",
				facets: ["userId", "value"]
			}
		}
	},
	filters: {
		weekendFrequency: (attributes, max, canContact) => {
			let {maxContactFrequency, canContactWeekends} = attributes;
			return ` 
				${maxContactFrequency.lte(max)} AND ${canContactWeekends.eq(canContact)} 
			`
		}
 	}  
};

const UserContacts = new Entity(model, {client});
```

| Property | Description |
| ----------- | ----------- |
| service  | Name of the application using the entity, used to namespace all entities |
entity | Name of the entity that the schema represents |  
table | Name of the dynamodb table in aws |  
version | (optional) The version number of the schema, used to namespace keys |  
attributes | An object containing each attribute that makes up the schema |  
indexes | An object containing table indexes, including the values for the table's default Partition Key and Sort Key
filters | An object containing user defined filter template functions.

## Attributes
**Attributes** define an **Entity** record. The `propertyName` represents the value your code will use to represent an attribute. 

> **Pro-Tip:**
> Using the `field` property, you can map an `AttributeName` to a different field name in your table. This can be useful to utilize existing tables, existing models, or even to reduce record sizes via shorter field names. 

```typescript
attributes: {
	<AttributeName>: {
		"type": <string|string[]>,
		"required": [boolean],
		"default": [value|() => value]
		"validate": [RegExp|() => boolean]
		"field": [string]
		"readOnly": [boolean]
		"label": [string]
		"cast": ["number"|"string"|"boolean"],
		get: (attribute, schema) => value,
		set: (attribute, schema) => value 
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
		"sk": {
			"field": <string>
			"facets": <AttributesName[]>
		},
		"index": [string]
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
`index` | `string` | yes | Used only when the `Index` defined is a *Global Secondary Index*; this is left blank for the table's primary index.  

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
In a Facet Template, you provide a formatted template for ElectroDB to use when making keys. 

The syntax to a Facet Template is simple using the following rules: 
	1. Only alphanumeric, underscore, colons, and hash symbols are valid. the following regex is used to determine validity: `/^[A-Z1-9:#_]+$/gi`
	2. Attributes are identified by a prefixed colon and the attributes name. For example, the syntax `:storeId`  will matches `storeId` attribute in the `model`
	3. Convention for a composing a key use the `#` symbol to separate attributes, and for labels to attach with underscore. For example, when composing both the `mallId` and `buildingId`  would be expressed as `mid_:mallId#bid_:buildingId`. 

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
	pk: '$mallstoredirectory_1#sid_storevalue',
	sk: '$mallstores#mid_mallvalue#bid_buildingvalue#uid_unitvalue'
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


let MallStores  =  new Entity(model,  client);
let mallId  =  "EastPointe";
let stateDate = "2020-04-01";
let endDate = "2020-07-01";
let maxRent = "5000.00";
let minRent = "2000.00";
let promotion = "1000.00";
let stores  =  MallStores.query
	.stores({ mallId })
	.between({ leaseEndDate:  stateDate }, { leaseEndDate:  endDate })
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
let MallStores  =  new Entity(model,  client);
let mallId  =  "EastPointe";
let stateDate = "2020-04-01";
let endDate = "2020-07-01";
let maxRent = "5000.00";
let minRent = "2000.00";
let promotion = "1000.00";
let stores  =  MallStores.query
	.leases({ mallId })
	.between({ leaseEndDate:  stateDate }, { leaseEndDate:  endDate })
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
`exists` | `rent.exists(maxRent)` | `exists(#rent = :rent1)`
`notExists` | `rent.notExists(maxRent)` | `not exists(#rent = :rent1)`
`contains` | `rent.contains(maxRent)` | `contains(#rent = :rent1)`
`notContains` | `rent.notContains(maxRent)` | `not contains(#rent = :rent1)`
`between` | `rent.between(minRent, maxRent)` | `(#rent between :rent1 and :rent2)`

This functionality allows you to write the remaining logic of your `FilterExpression` with ease. Add complex nested `and`/`or` conditions or other `FilterExpression` logic while ElectroDB handles the  `ExpressionAttributeNames` and `ExpressionAttributeValues`.

### Multiple Filters
It is possible to include chain multiple filters. The resulting FilterExpressions are concatinated with an implicit `AND` operator.

```javascript
let MallStores = new Entity(model, client);
let mallId = "EastPointe";
let stateDate = "2020-04-01";
let endDate = "2020-07-01";
let maxRent = "5000.00";
let minRent = "2000.00";
let promotion = "1000.00";
let stores = MallStores.query
	.leases({ mallId })
	.between({ leaseEndDate: stateDate }, { leaseEndDate: endDate })
	.filter(({ rent, discount }) => `
		${rent.between(minRent, maxRent)} AND ${discount.eq(promotion)}
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

### Using Facets to Make Heretical Keys
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
let storeId = "LatteLarrys";
let mallId = "EastPointe";
let buildingId = "BuildingA1";
let unitId = "B47";
await StoreLocations.get({storeId, mallId, buildingId, unitId}).go();
```
### `Delete` Method
Provide all facets in an object to the `delete` method to delete a record.

```javascript
let storeId = "LatteLarrys";
let mallId = "EastPointe";
let buildingId = "BuildingA1";
let unitId = "B47";
await StoreLocations.delete({storeId, mallId, buildingId, unitId}).go();
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
// MallStore.stores()
// MallStore.malls()
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
MallStore.stores({storeId});

// Bad: Facets missing, will throw
MallStore.stores(); // err: Params passed to ENTITY method, must only include storeId

// Bad: Facets not included, will throw
MallStore.stores({mallId}); // err: Params passed to ENTITY method, must only include storeId
```

After invoking the **Access Pattern** with the required **Partition Key** **Facets**, you can now choose what **Sort Key Facets** are applicable to your query. Examine the table in [Sort Key Operations](#sort-key-operations) for more information on the available operations on a **Sort Key**.

### Execute Query `.go() and .params()` 
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

## Query Chain Examples
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

### Shopping Mall Property Management App
For an example, lets look at the needs of application used to manage Shopping Mall properties. The application assists employees in the day-to-day operations of multiple Shopping Malls.
#### Shopping Mall Requirements
1. As a Maintenance Worker I need to know which stores are currently in each Mall down to the Building they are located.
2. As a Helpdesk Employee I need to locate related stores in Mall locations by Store Category.
3. As a Property Manager I need to identify upcoming leases in need of renewal.

Create a new Entity using the `MallStore` schema defined [above](#shopping-mall-stores) 

```javascript
const DynamoDB = require("aws-sdk/clients/dynamodb");
const client = new DynamoDB.DocumentClient();
const MallStore = new Entity(model, {client});
```

Access Patterns are accessible on the StoreLocation 
---
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
#### Find Stores that match core access patterns 

All Stores in a particular mall ([Requirement #1](#shopping-mall-requirements))
```javascript

let mallId = "EastPointe";
let stores = await StoreLocations.malls({mallId}).query().go();
```
All Stores in a particular mall building ([Requirement #1](#shopping-mall-requirements))
```javascript
let mallId = "EastPointe";
let buildingId = "BuildingA1";
let stores = await StoreLocations.malls({mallId}).query({buildingId}).go();
```

What store is located in unit "B47"? ([Requirement #1](#shopping-mall-requirements))
```javascript
let mallId = "EastPointe";
let buildingId = "BuildingA1";
let unitId = "B47";
let stores = await StoreLocations.malls({mallId}).query({buildingId, unitId}).go();
```
Stores by Category at Mall ([Requirement #2](#shopping-mall-requirements)) 
```javascript
let mallId = "EastPointe";
let category = "food/coffee";
let stores = await StoreLocations.malls({mallId}).byCategory(category).go();
```
Stores by upcoming lease ([Requirement #3](#shopping-mall-requirements))  
```javascript
let mallId = "EastPointe";
let q2StartDate = "2020-04-01";
let stores = await StoreLocations.leases({mallId}).lt({leaseEndDate: q2StateDate}).go();
```
Stores will renewals for Q4 ([Requirement #3](#shopping-mall-requirements))  
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
Spite-stores with release renewals this year  ([Requirement #3](#shopping-mall-requirements))  
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

All Latte Larry's in a particular mall building (crazy for any store except a coffee shop)
```javascript

let mallId = "EastPointe";
let buildingId = "BuildingA1";
let unitId = "B47";
let storeId = "LatteLarrys";
let stores = await StoreLocations.malls({mallId}).query({buildingId, storeId}).go();
```
## Coming Soon:
- `Collection` class for relating and querying across multiple entities, configuring/enforcing relationships
- `.page()` finish method (like `.params()` and `.go()`) to allow for easier pagination of results
- Additional query options like `limit`, `pages`, `attributes`, `sort` and more for easier querying.
- Default query options defined on the `model` to give more general control of interactions with the Entity.