# ElectroDB
[![Coverage Status](https://coveralls.io/repos/github/tywalch/electrodb/badge.svg?branch=master)](https://coveralls.io/github/tywalch/electrodb?branch=master&kill_cache=please)
[![Coverage Status](https://img.shields.io/npm/dt/electrodb.svg)](https://www.npmjs.com/package/electrodb)
![npm bundle size](https://img.shields.io/bundlephobia/min/electrodb) [![Build Status](https://travis-ci.org/tywalch/electrodb.svg?branch=master)](https://travis-ci.org/tywalch/electrodb)
[![Runkit Demo](https://img.shields.io/badge/runkit-electrodb-db4792)](https://runkit.com/tywalch/creating-and-querying-an-electrodb-service)

![ElectroDB](https://github.com/tywalch/electrodb/blob/master/assets/electrodb-drk.png?raw=true)
***ElectroDB*** is a DynamoDB library to ease the use of having multiple entities and complex hierarchical relationships in a single DynamoDB table.

*Please submit issues/feedback or reach out on Twitter [@tinkertamper](https://twitter.com/tinkertamper).*

------------

<a href="https://electrodb.fun"><h1 align="center">Introducing: The NEW ElectroDB Playground</h1></a>

<p align="center">
  <a href="https://electrodb.fun"><img width="400" src="https://github.com/tywalch/electrodb/blob/master/assets/playground.jpg?raw=true"></a>
</p>

<p align="center">Try out and share ElectroDB Models, Services, and Single Table Design at <a href="https://electrodb.fun">electrodb.fun</a></p>

------------

## Features
- [**Use with your existing tables**](#using-electrodb-with-existing-data) - ElectroDB simplifies building DocumentClient parameters, so you can use it with existing tables/data.   
- [**Attribute Schema Enforcement**](#attributes) - Define a schema for your entities with enforced attribute validation, defaults, types, aliases, and more.
- [**Easily Compose Hierarchical Access Patterns**](#composite-attributes) - Plan and design hierarchical keys for your indexes to multiply your possible access patterns.
- [**Single Table Entity Segregation**](#model) - Entities created with **ElectroDB** will not conflict with other entities when using a single table.
- [**Simplified Sort Key Condition Querying**](#building-queries) - Write efficient sort key queries by easily building compose keys.
- [**Simplified Filter Composition**](#where) - Easily create complex readable filters for DynamoDB queries without worrying about the implementation of `ExpressionAttributeNames`, `ExpressionAttributeValues`, and `FilterExpressions`.
- [**Simplified Update Expression Composition**](#update-record) - Easily compose type safe update operations without having to format tedious `ExpressionAttributeNames`, `ExpressionAttributeValues`, and `UpdateExpressions`. 
- [**Easily Query Across Entities**](#collections) - Define "collections" to create powerful/idiomatic queries that return multiple entities in a single request.
- [**Automatic Index Selection**](#find-records) - Use `.find()` or `.match()` methods to dynamically and efficiently query based on defined sort key structures.
- [**Simplified Pagination API**](#page) - Use `.page()` to easily paginate through result sets.
- [**Use With Your Existing Solution**](#composite-attribute-templates) - If you are already using DynamoDB, and want to use ElectroDB, use custom Composite Attribute Templates to leverage your existing key structures.
- [**TypeScript Support**](#typescript-support) - Strong **TypeScript** support for both Entities and Services now in Beta.
- [**Query Directly via the Terminal**](#electro-cli) - Execute queries against your  `Entities`, `Services`, `Models` directly from the command line.
- [**Stand Up Rest Server for Entities**](#electro-cli) - Stand up a REST Server to interact with your `Entities`, `Services`, `Models` for easier prototyping.

------------

**Turn this**
```typescript
tasks
  .patch({ 
    team: "core",
    task: "45-662", 
    project: "backend"
  })
  .set({ status: "open" })
  .add({ points: 5 })
  .append({ 
    comments: [{
      user: "janet",
      body: "This seems half-baked."
    }] 
  })
  .where(( {status}, {eq} ) => eq(status, "in-progress"))
  .go();
```
**Into This**
```json
{
    "UpdateExpression": "SET #status = :status_u0, #points = #points + :points_u0, #comments = list_append(#comments, :comments_u0), #updatedAt = :updatedAt_u0, #gsi1sk = :gsi1sk_u0",
    "ExpressionAttributeNames": {
        "#status": "status",
        "#points": "points",
        "#comments": "comments",
        "#updatedAt": "updatedAt",
        "#gsi1sk": "gsi1sk"
    },
    "ExpressionAttributeValues": {
        ":status0": "in-progress",
        ":status_u0": "open",
        ":points_u0": 5,
        ":comments_u0": [
            {
                "user": "janet",
                "body": "This seems half-baked."
            }
        ],
        ":updatedAt_u0": 1630977029015,
        ":gsi1sk_u0": "$assignments#tasks_1#status_open"
    },
    "TableName": "your_table_name",
    "Key": {
        "pk": "$taskapp#team_core",
        "sk": "$tasks_1#project_backend#task_45-662"
    },
    "ConditionExpression": "attribute_exists(pk) AND attribute_exists(sk) AND #status = :status0"
}
``` 
[![Try it out!](https://img.shields.io/badge/electrodb-try_out_this_example_›-%23f9bd00?style=for-the-badge&logo=amazondynamodb&labelColor=1a212a)](https://electrodb.fun/?#code/PQKgBAsg9gJgpgGzARwK5wE4Es4GcA0YuccYGeqCALgUQBYCG5YA7llXWAGbZwB2MXGBDAAUKKwBbAA5QMVMAG8wAUT5V2AT0IBlTADcsAY1IBfbhiiSwAIkRwjVSzABGNgNzijUPrgVUGFwRSAF5bTShUDAB9AKC4aL4GSTgPcVAwABUGXABrITUNKk1hMW9ffxz8sDC+OBZVdS0AClEwJTb2sElYRAAuDq6u-iLNAZsAvNwbfE6h-UxcLB9xgEYZua7iDEMTccnchmlpG03TWaGGKicsF1QqPAHFTfaH5KeXruLpOHG-bD4AHMNkMhuQ0FhyDABk50J9zp8Dh9QV9ND8-jcgSCUWQ4BCoTCMHCUQiUdJLAArBxUZE476-Wz-LBYi448GoSFwaFgWFweGsoaoba0lH0jEA4EC0Hsznc3n8xHsYIi0FixmYyWfdoygk8olwKXtUmg+C4IzYaQaFaDOlohk2JlYhUovxXIUqoZqgDaNigPz4M1szIAtOSoIDyLhpoRfXxg3QoAgYIGbEYEFBiMmALpgHJgcp+Q1deBcBiUGm2P38U4kouyZk0D2o9G2PioSQuTDYobGz0MQG4JuvO1-OBUbug9hwSSD9USmug3tdbySFLqWfPHE8ke2BBYPwToZTmdD5v2yRHQ+gsM-eQ4Dda0FCzCn0U7h0ahdbo1FlEuWBjDa35nuKzLAo+PYQWApiPjBtafOacBXFyACCFabraLY2G2HZdr+YAlmW1ADM0ACUNQAHxgAAIshAB0fBQCwZH4eQDAwAA8nwCCAfK8Eoqg0gwMhMBoaearYe2nYYFe7QsFcRh0OMICyUQY4keRIRUbRDwMUxLGPmxnHcbx+rwmcUrMvAAAejxAV0YZUo4D5btIuSvtwOBJuMbmqe0K6yEsDwDD6bySDYWawfheQeVwXncg6uR+WAwDAPmbEPPmViBVOYC5HAmhCFwchgNITAaAwSC4HICj5SUaCYPeUEBRmU4hTYjnUimBwRbBzqgjkSyAnU3IYSiqVZQgwSOMsvi5lNTHcCVDW8EIDDmhmQiSOWWDSMEYAjOwTVbt4U3UrN4yDVgw1rjQqlWXA1njAOWCrG5wYvaseTBg91mqW5HkTRe0g8lAYARFEYAAOI6AAkmAAASOR0MAAAK5VHT4eUFVBcWIAln2+fh-nZa1wVgD6z4yZFW5LkMMX2eNaXA6D4ORBg0Nw2AABKDBAnAwA6DV2OaLj8XPUsX1JcTWUyGTDI+q6VBCr1tPmZBP6dMocT7TBpGeKIE0AAZlVQilG2A+5gHu+VgEbgnCQ8FuPSYlqWwoz5CDYVw3HcDyJFAVDRI9+53aIBy4J0dGm4pzTKJsYXjN45ATkitgACwAKzBgAbDnABMgabJ1jjjC4635QIC6mKRUfEFQcdEAEyuzr6-o2NBtftHR7EwI39brgMmed1HRz+n38dDCut2zl6Y1dFT4wUnzY5Xv+MCATYmR0FbxDTkIjAIFwwbl-lMB0V+0E5p0NdRywdCYHAzTNEoStCucSh4uYmlUXizRv7QGwIYwwRjwNMUiXcwB0UBFAMi7ggA)

------------

## Table of Contents
- [ElectroDB](#electrodb)
  * [Features](#features)
  * [Table of Contents](#table-of-contents)
- [Project Goals](#project-goals)
- [Installation](#installation)
- [Usage](#usage)
- [Entities and Services](#entities-and-services)
- [Entities](#entities)
- [Services](#services)
  * [TypeScript Support](#typescript-support)
    + [TypeScript Services](#typescript-services)
  * [Join](#join)
      - [Independent Models](#independent-models)
      - [Joining Entity instances to a Service](#joining-entity-instances-to-a-service)
      - [Joining models to a Service](#joining-models-to-a-service)
      - [Joining Entities or Models with an alias](#joining-entities-or-models-with-an-alias)
      - [Joining Entities at Service construction for TypeScript](#joining-entities-at-service-construction-for-typescript)
  * [Model](#model)
    + [Model Properties](#model-properties)
    + [Service Options](#service-options)
  * [Attributes](#attributes)
    + [Simple Syntax](#simple-syntax)
    + [Expanded Syntax](#expanded-syntax)
      - [Attribute Definition](#attribute-definition)
      - [Enum Attributes](#enum-attributes)
      - [Map Attributes](#map-attributes)
      - [List Attributes](#list-attributes)
      - [Set Attributes](#set-attributes)
      - [Attribute Getters and Setters](#attribute-getters-and-setters)
      - [Attribute Watching](#attribute-watching)
        * [Attribute Watching: Watch All](#attribute-watching--watch-all)
        * [Attribute Watching Examples](#attribute-watching-examples)
      - [Calculated Attributes](#calculated-attributes)
      - [Virtual Attributes](#virtual-attributes)
      - [CreatedAt and UpdatedAt Attributes](#createdat-and-updatedat-attributes)
      - [Attribute Validation](#attribute-validation)
  * [Indexes](#indexes)
    + [Indexes Without Sort Keys](#indexes-without-sort-keys)
    + [Indexes With Sort Keys](#indexes-with-sort-keys)
    + [Numeric Keys](#numeric-keys)
    + [Index Casing](#index-casing)
  * [Facets](#facets)
  * [Composite Attributes](#composite-attributes)
    + [Composite Attribute Arrays](#composite-attribute-arrays)
    + [Composite Attribute Templates](#composite-attribute-templates)
      - [Templates and Composite Attribute Arrays](#templates-and-composite-attribute-arrays)
  * [Composite Attribute and Index Considerations](#composite-attribute-and-index-considerations)
    + [Attributes as Indexes](#attributes-as-indexes)
  * [Collections](#collections)
    + [Collection Queries vs Entity Queries](#collection-queries-vs-entity-queries)
    + [Collection Response Structure](#collection-response-structure)
  * [Sub-Collections](#sub-collections)
      - [Sub-Collection Entities](#sub-collection-entities)
  * [Index and Collection Naming Conventions](#index-and-collection-naming-conventions)
    + [Index Naming Conventions](#index-naming-conventions)
  * [Collection Naming Conventions](#collection-naming-conventions)
  * [Filters](#filters)
    + [Defined on the model](#defined-on-the-model)
    + [Defined via Filter method after query operators](#defined-via-filter-method-after-query-operators)
    + [Multiple Filters](#multiple-filters)
  * [Where](#where)
    + [FilterExpressions](#filterexpressions)
    + [ConditionExpressions](#conditionexpressions)
    + [Where with Complex Attributes](#where-with-complex-attributes)
    + [Attributes and Operations](#attributes-and-operations)
    + [Multiple Where Clauses](#multiple-where-clauses)
  * [Parse](#parse)
- [Building Queries](#building-queries)
    + [Using composite attributes to make hierarchical keys](#using-composite-attributes-to-make-hierarchical-keys)
      - [Shopping Mall Stores](#shopping-mall-stores)
    + [Query App Records](#query-app-records)
      - [Partition Key Composite Attributes](#partition-key-composite-attributes)
    + [Sort Key Operations](#sort-key-operations)
  * [Query Chains](#query-chains)
    + [Query Method](#query-method)
    + [Get Method](#get-method)
    + [Batch Get](#batch-get)
    + [Delete Method](#delete-method)
    + [Batch Write Delete Records](#batch-write-delete-records)
    + [Put Record](#put-record)
    + [Batch Write Put Records](#batch-write-put-records)
    + [Update Record](#update-record)
      - [Updates to Composite Attributes](#updates-to-composite-attributes)
      - [Update Method: Set](#update-method--set)
      - [Update Method: Remove](#update-method--remove)
      - [Update Method: Add](#update-method--add)
      - [Update Method: Subtract](#update-method--subtract)
      - [Update Method: Append](#update-method--append)
      - [Update Method: Delete](#update-method--delete)
      - [Update Method: Data](#update-method--data)
    + [Update Method: Complex Data Types](#update-method--complex-data-types)
    + [Scan Records](#scan-records)
    + [Remove Method](#remove-method)
    + [Patch Record](#patch-record)
    + [Create Record](#create-record)
    + [Find Records](#find-records)
    + [Match Records](#match-records)
    + [Access Pattern Queries](#access-pattern-queries)
      - [Begins With Queries](#begins-with-queries)
  * [Collection Chains](#collection-chains)
  * [Execute Queries](#execute-queries)
    + [Params](#params)
    + [Go](#go)
    + [Page](#page)
      - [Entity Pagination](#entity-pagination)
      - [Service Pagination](#service-pagination)
      - [Pager Query Options](#pager-query-options)
        * [Pagination Example](#pagination-example)
  * [Query Examples](#query-examples)
  * [Query Options](#query-options)
- [Errors:](#errors-)
    + [No Client Defined On Model](#no-client-defined-on-model)
    + [Invalid Identifier](#invalid-identifier)
    + [Invalid Key Composite Attribute Template](#invalid-key-composite-attribute-template)
    + [Duplicate Indexes](#duplicate-indexes)
    + [Collection Without An SK](#collection-without-an-sk)
    + [Duplicate Collections](#duplicate-collections)
    + [Missing Primary Index](#missing-primary-index)
    + [Invalid Attribute Definition](#invalid-attribute-definition)
    + [Invalid Model](#invalid-model)
    + [Invalid Options](#invalid-options)
    + [Duplicate Index Fields](#duplicate-index-fields)
    + [Duplicate Index Composite Attributes](#duplicate-index-composite-attributes)
    + [Incompatible Key Composite Attribute Template](#incompatible-key-composite-attribute-template)
    + [Invalid Index With Attribute Name](#invalid-index-with-attribute-name)
    + [Invalid Collection on Index With Attribute Field Names](#invalid-collection-on-index-with-attribute-field-names)
    + [Missing Composite Attributes](#missing-composite-attributes)
    + [Missing Table](#missing-table)
    + [Invalid Concurrency Option](#invalid-concurrency-option)
    + [Invalid Pages Option](#invalid-pages-option)
    + [Invalid Limit Option](#invalid-limit-option)
    + [Invalid Attribute](#invalid-attribute)
    + [AWS Error](#aws-error)
    + [Unknown Errors](#unknown-errors)
    + [Invalid Last Evaluated Key](#invalid-last-evaluated-key)
    + [No Owner For Pager](#no-owner-for-pager)
    + [Pager Not Unique](#pager-not-unique)
- [Examples](#examples)
  * [Employee App](#employee-app)
    + [Employee App Requirements](#employee-app-requirements)
    + [App Entities](#app-entities)
    + [Query Records](#query-records)
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
      - [Change the Stores Lease Date](#change-the-stores-lease-date)
    + [GET Record](#get-record)
      - [Retrieve a specific Store in a Mall](#retrieve-a-specific-store-in-a-mall)
    + [DELETE Record](#delete-record)
      - [Remove a Store location from the Mall](#remove-a-store-location-from-the-mall)
    + [Query Mall Records](#query-mall-records)
      - [All Stores in a particular mall](#all-stores-in-a-particular-mall)
      - [All Stores in a particular mall building](#all-stores-in-a-particular-mall-building)
      - [Find the store located in unit B47](#find-the-store-located-in-unit-b47)
      - [Stores by Category at Mall](#stores-by-category-at-mall)
      - [Stores by upcoming lease](#stores-by-upcoming-lease)
      - [Stores will renewals for Q4](#stores-will-renewals-for-q4)
      - [Spite-stores with release renewals this year](#spite-stores-with-release-renewals-this-year)
      - [All Latte Larrys in a particular mall building](#all-latte-larrys-in-a-particular-mall-building)
- [Exported TypeScript Types](#exported-typescript-types)
  * [EntityRecord Type](#entityrecord-type)
  * [EntityItem Type](#entityitem-type)
  * [CollectionItem Type](#collectionitem-type)
  * [CreateEntityItem Type](#createentityitem-type)
  * [UpdateEntityItem Type](#updateentityitem-type)
  * [UpdateAddEntityItem Type](#updateaddentityitem-type)
  * [UpdateSubtractEntityItem Type](#updatesubtractentityitem-type)
  * [UpdateAppendEntityItem Type](#updateappendentityitem-type)
  * [UpdateRemoveEntityItem Type](#updateremoveentityitem-type)
  * [UpdateDeleteEntityItem Type](#updatedeleteentityitem-type)
- [Using ElectroDB With Existing Data](#using-electrodb-with-existing-data)
- [Electro CLI](#electro-cli)
- [Version 1 Migration](#version-1-migration)
  * [New schema format/breaking key format change](#new-schema-format-breaking-key-format-change)
  * [The renaming of index property Facets to Composite and Template](#the-renaming-of-index-property-facets-to-composite-and-template)
  * [Get Method to Return null](#get-method-to-return-null)
- [Coming Soon](#coming-soon)

----------

# Project Goals

ElectroDB focuses on simplifying the process of modeling, enforcing data constraints, querying across entities, and formatting complex DocumentClient parameters. Three important design considerations we're made with the development of ElectroDB:

1. ElectroDB should be able to be useful without having to query the database itself [[read more](#params)].
2. ElectroDB should be able to be added to a project that already has been established tables, data, and access patterns [[read more](#using-electrodb-with-existing-data)].
3. ElectroDB should not require additional design considerations on top of those made for DynamoDB, and therefore should be able to be removed from a project at any time without sacrifice.

# Installation

Install from NPM

```bash  
npm install electrodb --save
```

# Usage
Require/import `Entity` and/or `Service` from `electrodb`:
```javascript  
const {Entity, Service} = require("electrodb");
// or 
import {Entity, Service} from "electrodb";
```

# Entities and Services
> To see full examples of ***ElectroDB*** in action, go to the [Examples](#examples) section.

`Entity` allows you to create separate and individual business objects in a *DynamoDB* table. When queried, your results will not include other Entities that also exist the same table. This allows you to easily achieve single table design as recommended by AWS. For more detail, read [Entities](#entities).

`Service` allows you to build relationships across Entities. A service imports Entity [Models](#model), builds individual Entities, and creates [Collections](#collections) to allow cross Entity querying. For more detail, read [Services](#services).

You can use Entities independent of Services, you do not need to import models into a Service to use them individually. However, If you intend to make queries that `join` or span multiple Entities you will need to use a Service.

# Entities

In ***ElectroDB*** an `Entity` is represents a single business object. For example, in a simple task tracking application, one Entity could represent an Employee and or a Task that is assigned to an employee.

Require or import `Entity` from `electrodb`:
```javascript  
const {Entity} = require("electrodb");
// or
import {Entity} from "electrodb";
```

> When using TypeScript, for strong type checking, be sure to either add your model as an object literal to the Entity constructor or create your model using const assertions with the `as const` syntax.

# Services
In ***ElectroDB*** a `Service` represents a collection of related Entities. Services allow you to build queries span across Entities. Similar to Entities, Services can coexist on a single table without collision. You can use Entities independent of Services, you do not need to import models into a Service to use them individually. However, you do you need to use a Service if you intend make queries that `join` multiple Entities.

Require:
```javascript  
const {Service} = require("electrodb");
// or
import {Service} from "electrodb";
```

## TypeScript Support

Previously it was possible to generate type definition files (`.d.ts`) for you Models, Entities, and Services with the [Electro CLI](#electro-cli). New with version `0.10.0` is TypeScript support for Entities and Services.

As of writing this, this functionality is still a work in progress, and enforcement of some of ElectroDB's query constraints have still not been written into the type checks. Most notably are the following constraints not yet enforced by the type checker, but are enforced at query runtime:

- Sort Key Composite Attribute order is not strongly typed. Sort Key Composite Attributes must be provided in the order they are defined on the model to build the key appropriately. This will not cause an error at query runtime, be sure your partial Sort Keys are provided in accordance with your model to fully leverage Sort Key queries. For more information about composite attribute ordering see the section on [Composite Attributes](#composite-attributes).
- Put/Create/Update/Patch/Delete/Create operations that partially impact index composite attributes are not statically typed. When performing a `put` or `update` type operation that impacts a composite attribute of a secondary index, ElectroDB performs a check at runtime to ensure all composite attributes of that key are included. This is detailed more in the section [Composite Attribute and Index Considerations](#composite-attribute-and-index-considerations).
- Use of the `params` method does not yet return strict types.
- Use of the `raw` or `includeKeys` query options do not yet impact the returned types.

If you experience any issues using TypeScript with ElectroDB, your feedback is very important, please create a GitHub issue, and it can be addressed.

See the section [Exported TypeScript Types](#exported-typescript-types) to read more about the useful types exported from ElectroDB.  

### TypeScript Services

New with version `0.10.0` is TypeScript support. To ensure accurate types with, TypeScript users should create their services by passing an Object literal or const object that maps Entity alias names to Entity instances.
```typescript
const table = "my_table_name";
const employees = new Entity(EmployeesModel, { client, table });
const tasks = new Entity(TasksModel, { client, table });
const TaskApp = new Service({employees, tasks});
```

The property name you assign the entity will then be "alias", or name, you can reference that entity by through the Service. Aliases can be useful if you are building a service with multiple versions of the same entity or wish to change the reference name of an entity without impacting the schema/key names of that entity.

Services take an optional second parameter, similar to Entities, with a `client` and `table`. Using this constructor interface, the Service will utilize the values from those entities, if they were provided, or be passed values to override the `client` or `table` name on the individual entities.

Not yet available for TypeScript, this pattern will also accept Models, or a mix of Entities and Models, in the same object literal format.

## Join
When using JavaScript, use `join` to add [Entities](#entities) or [Models](#model) onto a Service.

> _NOTE: If using TypeScript, see [Joining Entities at Service construction for TypeScript](#joining-entities-at-service-construction-for-typescript) to learn how to "join" entities for use in a TypeScript project._

#### Independent Models

```javascript
let table = "my_table_name";
let employees = new Entity(EmployeesModel, { client, table });
let tasks = new Entity(TasksModel, { client, table });
```

#### Joining Entity instances to a Service

```javascript
// Joining Entity instances to a Service
let TaskApp = new Service("TaskApp", { client, table });
TaskApp
	.join(employees) // available at TaskApp.entities.employees
	.join(tasks);    // available at TaskApp.entities.tasks
```

#### Joining models to a Service

```javascript
let TaskApp = new Service("TaskApp", { client, table });
TaskApp
	.join(EmployeesModel) // available at TaskApp.entities.employees (based on entity name in model)
	.join(TasksModel);    // available at TaskApp.entities.tasks (based on entity name in model)
```

#### Joining Entities or Models with an alias

```javascript
let TaskApp = new Service("TaskApp", { client, table });
TaskApp
    .join("personnel", EmployeesModel) // available at TaskApp.entities.personnel
    .join("directives", TasksModel); // available at TaskApp.entities.directives
```

#### Joining Entities at Service construction for TypeScript

```typescript
let TaskApp = new Service({
	personnel: EmployeesModel, // available at TaskApp.entities.personnel
	directives: TasksModel, // available at TaskApp.entities.directives
});
```

When joining a Model/Entity to a Service, ElectroDB will perform a number of validations to ensure that Entity conforms to expectations collectively established by all joined Entities.

- [Entity](#entities) names must be unique across a Service.
- [Collection](#collections) names must be unique across a Service.
- All [Collections](#collections) map to on the same DynamoDB indexes with the same index field names. See [Indexes](#indexes).
- Partition Key [Composite Attributes](#composite attribute-arrays) on a [Collection](#collections) must have the same attribute names and labels (if applicable). See [Attribute Definitions](#attribute-definition).
- The [name of the Service in the Model](#model-properties) must match the Name defined on the [Service](#services) instance.
- Joined instances must be type [Model](#model) or [Entity](#entities).
- If the attributes of an Entity have overlapping names with other attributes in that service, they must all have compatible or matching [attribute definitions](#attributes).
- All models conform to the same model format. If you created your model prior to ElectroDB version 0.9.19 see section [Version 1 Migration](#version-1-migration). 

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
				composite: ["employee"],
			},
			sk: {
				field: "sk",
				composite: [],
			},
		},
		coworkers: {
			index: "gsi1pk-gsi1sk-index",
			collection: "workplaces",
			pk: {
				field: "gsi1pk",
				composite: ["office"],
			},
			sk: {
				field: "gsi1sk",
				composite: ["team", "title", "employee"],
			},
		},
		teams: {
			index: "gsi2pk-gsi2sk-index",
			pk: {
				field: "gsi2pk",
				composite: ["team"],
			},
			sk: {
				field: "gsi2sk",
				composite: ["title", "salary", "employee"],
			},
		},
		employeeLookup: {
			collection: "assignments",
			index: "gsi3pk-gsi3sk-index",
			pk: {
				field: "gsi3pk",
				composite: ["employee"],
			},
			sk: {
				field: "gsi3sk",
				composite: [],
			},
		},
		roles: {
			index: "gsi4pk-gsi4sk-index",
			pk: {
				field: "gsi4pk",
				composite: ["title"],
			},
			sk: {
				field: "gsi4sk",
				composite: ["salary", "employee"],
			},
		},
		directReports: {
			index: "gsi5pk-gsi5sk-index",
			pk: {
				field: "gsi5pk",
				composite: ["manager"],
			},
			sk: {
				field: "gsi5sk",
				composite: ["team", "office", "employee"],
			},
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
				composite: ["task"],
			},
			sk: {
				field: "sk",
				composite: ["project", "employee"],
			},
		},
		project: {
			index: "gsi1pk-gsi1sk-index",
			pk: {
				field: "gsi1pk",
				composite: ["project"],
			},
			sk: {
				field: "gsi1sk",
				composite: ["employee", "task"],
			},
		},
		assigned: {
			collection: "assignments",
			index: "gsi3pk-gsi3sk-index",
			pk: {
				field: "gsi3pk",
				composite: ["employee"],
			},
			sk: {
				field: "gsi3sk",
				composite: ["project", "task"],
			},
		},
	},
};
```

### Model Properties

Property       | Description
-------------- | ----------- 
model.service  | Name of the application using the entity, used to namespace all entities
model.entity   | Name of the entity that the schema represents
model.version  | (optional) The version number of the schema, used to namespace keys
attributes     | An object containing each attribute that makes up the schema
indexes        | An object containing table indexes, including the values for the table's default Partition Key and Sort Key

### Service Options
Optional second parameter

Property | Description
-------- | ----------- 
table    | The name of the dynamodb table in aws.
client   | (optional) An instance of the `docClient` from the `aws-sdk` for use when querying a DynamoDB table. This is optional if you wish to only use the `params` functionality, but required if you actually need to query against a database.

## Attributes
**Attributes** define an **Entity** record. The `AttributeName` represents the value your code will use to represent an attribute.

> **Pro-Tip:**
> Using the `field` property, you can map an `AttributeName` to a different field name in your table. This can be useful to utilize existing tables, existing models, or even to reduce record sizes via shorter field names. For example, you may refer to an attribute as `organization` but want to save the attribute with a field name of `org` in DynamoDB.

### Simple Syntax
Assign just the `type` of the attribute directly to the attribute name. Types currently supported options are "string", "number", "boolean", an array of strings representing a fixed set of possible values, or "any" which disables value type checking on that attribute.
```typescript
attributes: {
	<AttributeName>: "string" | "number" | "boolean" | "list" | "map" | "set" | "any" | string[] | ReadonlyArray<string> 
}
```

### Expanded Syntax
Use the expanded syntax build out more robust attribute options.
```typescript
attributes: {
	<AttributeName>: {
		type: "string" | "number" | "boolean" | "list" | "map" | "set" | "any" | ReadonlyArray<string>;
		required?: boolean;
		default?: <type> | (() => <type>);
		validate?: RegExp | ((value: <type>) => void | string);
		field?: string;
		readOnly?: boolean;
		label?: string;
        cast?: "number"|"string"|"boolean";
		get?: (attribute: <type>, schema: any) => <type> | void | undefined;
		set?: (attribute?: <type>, schema?: any) => <type> | void | undefined; 
		watch: "*" | string[]
	}
}
```

> _NOTE: When using get/set in TypeScript, be sure to use the `?:` syntax to denote an optional attribute on `set`_

#### Attribute Definition

Property      | Type                                                       | Required | Types     | Description
 ------------ | :--------------------------------------------------------: | :------: | :-------: | -----------
`type`        | `string`, `ReadonlyArray<string>`, `string[]`              | yes      | all       | Accepts the values: `"string"`, `"number"` `"boolean"`, `"map"`, `"list"`, `"set"`, an array of strings representing a finite list of acceptable values: `["option1", "option2", "option3"]`, or `"any"` which disables value type checking on that attribute.
`required`    | `boolean`                                                  | no       | all       | Flag an attribute as required to be present when creating a record. This attribute also acts as a type of `NOT NULL` flag, preventing it from being removed directly.  
`hidden`      | `boolean`                                                  | no       | all       | Flag an attribute as hidden to remove the property from results before they are returned. 
`default`     | `value`, `() => value`                                     | no       | all       | Either the default value itself or a synchronous function that returns the desired value. Applied before `set` and before `required` check. 
`validate`    | `RegExp`, `(value: any) => void`, `(value: any) => string` | no       | all       | Either regex or a synchronous callback to return an error string (will result in exception using the string as the error's message), or thrown exception in the event of an error.   
`field`       | `string`                                                   | no       | all       | The name of the attribute as it exists in DynamoDB, if named differently in the schema attributes. Defaults to the `AttributeName` as defined in the schema.
`readOnly`    | `boolean`                                                  | no       | all       | Prevents an attribute from being updated after the record has been created. Attributes used in the composition of the table's primary Partition Key and Sort Key are read-only by default. The one exception to `readOnly` is for properties that also use the `watch` property, read [attribute watching](#attribute-watching) for more detail. 
`label`       | `string`                                                   | no       | all       | Used in index composition to prefix key composite attributes. By default, the `AttributeName` is used as the label.
`cast`        | `"number"`, `"string"`, `"boolean"`                        | no       | all       | Optionally cast attribute values when interacting with DynamoDB. Current options include: "number", "string", and "boolean".
`set`         | `(attribute, schema) => value`                             | no       | all       | A synchronous callback allowing you to apply changes to a value before it is set in params or applied to the database. First value represents the value passed to ElectroDB, second value are the attributes passed on that update/put
`get`         | `(attribute, schema) => value`                             | no       | all       | A synchronous callback allowing you to apply changes to a value after it is retrieved from the database. First value represents the value passed to ElectroDB, second value are the attributes retrieved from the database.
`watch`       | `Attribute[], "*"`                                         | no       | root-only | Define other attributes that will always trigger your attribute's getter and setter callback after their getter/setter callbacks are executed. Only available on root level attributes.
`properties`  | `{[key: string]: Attribute}`                               | yes*     | map       | Define the properties available on a `"map"` attribute, required if your attribute is a map. Syntax for map properties is the same as root level attributes.
`items`       | `Attribute`                                                | yes*     | list      | Define the attribute type your list attribute will contain, required if your attribute is a list. Syntax for list items is the same as a single attribute.
`items`       | "string" | "number"                                        | yes*     | set       | Define the primitive type your set attribute will contain, required if your attribute is a set. Unlike lists, a set defines it's items with a string of either "string" or "number".

#### Enum Attributes

When using TypeScript, if you wish to also enforce this type make sure to us the `as const` syntax. If TypeScript is not told this array is Readonly, even when your model is passed directly to the Entity constructor, it will not resolve the unique values within that array. 

This may be desirable, however, as enforcing the type value can require consumers of your model to do more work to resolve the type beyond just the type `string`.

> _NOTE: Regardless of using TypeScript or JavaScript, ElectroDB will enforce values supplied match the supplied array of values at runtime._

The following example shows the differences in how TypeScript may enforce your enum value:

```typescript
attributes: {
  myEnumAttribute1: {
      type: ["option1", "option2", "option3"]        // TypeScript enforces as `string[]`
  },
  myEnumAttribute2: {
    type: ["option1", "option2", "option3"] as const // TypeScript enforces as `"option1" | "option2" | "option3" | undefined`
  },
  myEnumAttribute3: {
    required: true,
    type: ["option1", "option2", "option3"] as const // TypeScript enforces as `"option1" | "option2" | "option3"`
  }
}
```

#### Map Attributes

Map attributes leverage DynamoDB's native support for object-like structures. The attributes within a Map are defined under the `properties` property; a syntax that mirrors the syntax used to define root level attributes. You are not limited in the types of attributes you can nest inside a map attribute.

```typescript
attributes: {
  myMapAttribute: {
    type: "map",
    properties: {
      myStringAttribute: {
        type: "string"
      },
      myNumberAttribute: {
        type: "number"
      }
    }
  }
}
```

#### List Attributes

List attributes model array-like structures with DynamoDB's List type. The elements of a List attribute are defined using the `items` property. Similar to Map properties, ElectroDB does not restrict the types of items that can be used with a list.

```typescript
attributes: {
  myStringList: { 
    type: "list",
    items: {
      type: "string"
    },
  },
  myMapList: {
    myMapAttribute: {
      type: "map",
      properties: {
        myStringAttribute: {
          type: "string"
        },
        myNumberAttribute: {
          type: "number"
        }
      }
    }
  }
}
```

#### Set Attributes

The Set attribute is arguably DynamoDB's most powerful type. ElectroDB supports String and Number Sets using the `items` property set as either `"string"` or `"number"`. 

In addition to having the same modeling benefits you get with other attributes, ElectroDB also simplifies the use of Sets by removing the need to use DynamoDB's special `createSet` class to work with Sets. ElectroDB Set Attributes accept Arrays, JavaScript native Sets, and objects from `createSet` as values. ElectroDB will manage the casting of values to a DynamoDB Set value prior to saving and ElectroDB will also convert Sets back to JavaScript arrays on retrieval.

> _NOTE: If you are using TypeScript, Sets are currently typed as Arrays to simplify the type system. Again, ElectroDB will handle the conversion of these Arrays without the need to use `client.createSet()`._
 
```typescript
attributes: {
  myStringSet: {
    type: "set",
    items: "string"
  },
  myNumberSet: {
    type: "set",
    items: "number"
  }
}
```

#### Attribute Getters and Setters
Using `get` and `set` on an attribute can allow you to apply logic before and just after modifying or retrieving a field from DynamoDB. Both callbacks should be pure synchronous functions and may be invoked multiple times during one query.

The first argument in an attribute's `get` or `set` callback is the value received in the query. The second argument, called `"item"`, in an attribute's is an object containing the values of other attributes on the item as it was given or retrieved. If your attribute uses `watch`, the getter or setter of attribute being watched will be invoked _before_ your getter or setter and the updated value will be on the `"item"` argument instead of the original.

> _NOTE: Using getters/setters on Composite Attributes is **not recommended** without considering the consequences of how that will impact your keys. When a Composite Attribute is supplied for a new record via a `put` or `create` operation, or is changed via a `patch` or `updated` operation, the Attribute's `set` callback will be invoked prior to formatting/building your record's keys on when creating or updating a record._

ElectroDB invokes an Attribute's `get` method in the following circumstances:
1. If a field exists on an item after retrieval from DynamoDB, the attribute associated with that field will have its getter method invoked.
2. After a `put` or `create` operation is performed, attribute getters are applied against the object originally received and returned.
3. When using ElectroDB's [attribute watching](#attribute-watching) functionality, an attribute will have its getter callback invoked whenever the getter callback of any "watched" attributes are invoked. Note: The getter of an Attribute Watcher will always be applied _after_ the getters for the attributes it watches.

ElectroDB invokes an Attribute's `set` callback in the following circumstances:
1. Setters for all Attributes will always be invoked when performing a `create` or `put` operation.
2. Setters will only be invoked when an Attribute is modified when performing a `patch` or `update` operation.
3. When using ElectroDB's [attribute watching](#attribute-watching) functionality, an attribute will have its setter callback invoked whenever the setter callback of any "watched" attributes are invoked. Note: The setter of an Attribute Watcher will always be applied _after_ the setters for the attributes it watches.

> _NOTE: As of ElectroDB `1.3.0`, the `watch` property is only possible for root level attributes. Watch is currently not supported for nested attributes like properties on a "map" or items of a "list"._  

#### Attribute Watching
Attribute watching is a powerful feature in ElectroDB that can be used to solve many unique challenges with DynamoDB. In short, you can define a column to have its getter/setter callbacks called whenever another attribute's getter or setter callbacks are called. If you haven't read the section on [Attribute Getters and Setters](#attribute-getters-and-setters), it will provide you with more context about when an attribute's mutation callbacks are called.

Because DynamoDB allows for a flexible schema, and ElectroDB allows for optional attributes, it is possible for items belonging to an entity to not have all attributes when setting or getting records. Sometimes values or changes to other attributes will require corresponding changes to another attribute. Sometimes, to fully leverage some advanced model denormalization or query access patterns,  it is necessary to duplicate some attribute values with similar or identical values. This functionality has many uses; below are just a few examples of how you can use `watch`:

> _NOTE: Using the `watch` property impacts the order of which getters and setters are called. You cannot `watch` another attribute that also uses `watch`, so ElectroDB first invokes the getters or setters of attributes without the `watch` property, then subsequently invokes the getters or setters of attributes who use `watch`._

```typescript
myAttr: { 
  type: "string",
  watch: ["otherAttr"],
  set: (myAttr, {otherAttr}) => {
    // Whenever "myAttr" or "otherAttr" are updated from an `update` or `patch` operation, this callback will be fired. 
    // Note: myAttr or otherAttr could be indendently undefined because either attribute could have triggered this callback  
  },
  get: (myAttr, {otherAttr}) => {
    // Whenever "myAttr" or "otherAttr" are retrieved from a `query` or `get` operation, this callback will be fired. 
    // Note: myAttr or otherAttr could be indendently undefined because either attribute could have triggered this callback.
  } 
}
```

##### Attribute Watching: Watch All

If your attributes needs to watch for any changes to an item, you can model this by supplying the watch property a string value of `"*"`  
```typescript
myAttr: { 
  type: "string",
  watch: "*", // "watch all"
  set: (myAttr, allAttributes) => {
    // Whenever an `update` or `patch` operation is performed, this callback will be fired. 
    // Note: myAttr or the attributes under `allAttributes` could be indendently undefined because either attribute could have triggered this callback  
  },
  get: (myAttr, allAttributes) => {
    // Whenever a `query` or `get` operation is performed, this callback will be fired. 
    // Note: myAttr or the attributes under `allAttributes` could be indendently undefined because either attribute could have triggered this callback
  } 
}
```

##### Attribute Watching Examples

**Example 1 - A calculated attribute that depends on the value of another attribute:**

In this example, we have an attribute `"fee"` that needs to be updated any time an item's `"price"` attribute is updated. The attribute `"fee"` uses `watch` to have its setter callback called any time `"price"` is updated via a `put`, `create`, `update`, or `patch` operation.

[![Try it out!](https://img.shields.io/badge/electrodb-try_out_this_example_›-%23f9bd00?style=for-the-badge&logo=amazondynamodb&labelColor=1a212a)](https://electrodb.fun/?ssl=3&ssc=29&pln=37&pc=2#code/JYWwDg9gTgLgBAbzgUQHY2DAnnAvnAMyghDgCIBTAGwoGMZiATAIzIG4AoD2iVAZ3hgmAV3p84AXjioKAdxTpMWABQIOcOCAiNqALkTqNcCouz6yQ7aJh8yAGkMa+FKADdgtCuYoDQAQxhoe0c4Vxc+YF5zAEYyQ1wHDQCGYGZhGB99NSM4S0ZrLJCNbDAvcgEoYFQAczichJChDzLsnLgSsrJUYRBmF2C2uCgKAEdhYGHGfQZhChCGnIIKFqL2rFLzbt7+xLbZANoAC30AbQtKzzIAXV2c5xh9ZQB9O0Qmz1wASkkAPgNBjTDGDCKCoXIXChwABUcAAdAAmTiDXDzeK7Ko6AAemX+RneVWqhUGYAA1kSAQRgNQpuRSQMATxwBAIhlTucrPRrqsFm0+GTcYNKdTzHz6YNGZAWWUTlduaiNCiEoh2n5mDRzFgICCnjBVTQnqg-CAKGQ8J9OBw8tY+IZYWB0qpwRyHrTKugduDmvoACwAVjNtuqEGUny4VrEtuEYEYAQojvDLrIVD8YECYFNX1t93jEP00XhAAYCwGNLCgyGgA)

```javascript
{
  model: {
    entity: "products",
    service: "estimator",
    version: "1"
  },
  attributes: {
    product: {
      type: "string"
    },
    price: {
      type: "number",
              required: true
    },
    fee: {
      type: "number",
              watch: ["price"],
              set: (_, {price}) => {
        return price * .2;
      }
    }
  },
  indexes: {
    pricing: {
      pk: {
        field: "pk",
                composite: ["product"]
      },
      sk: {
        field: "sk",
                composite: []
      }
    }
  }
}
```

**Example 2 - Making a virtual attribute that never persists to the database:**

In this example we have an attribute `"displayPrice"` that needs its getter called anytime an item's `"price"` attribute is retrieved.  The attribute `"displayPrice"` uses `watch` to return a formatted price string based whenever an item with a `"price"` attribute is queried.  Additionally, `"displayPrice"` always returns `undefined` from its setter callback to ensure that it will never write data back to the table.

```javascript
{
  model: {
    entity: "services",
    service: "costEstimator",
    version: "1"
  },
  attributes: {
    service: {
      type: "string"
    },
    price: {
      type: "number",
      required: true
    },
    displayPrice: {
      type: "string",
      watch: ["price"],
      get: (_, {price}) => {
        return "$" + price;  
      },
      set: () => undefined
    }
  },
  indexes: {
    pricing: {
      pk: {
        field: "pk",
        composite: ["service"]
      },
      sk: {
        field: "sk",
        composite: []
      }
    }
  }
}
```

**Example 3 - Creating a more filter-friendly version of an attribute without impacting the original attribute:**

In this example we have an attribute `"descriptionSearch"` which will help our users easily filter for transactions by `"description"`. To ensure our filters will not take into account a description's character casing, `descriptionSearch` duplicates the value of `"description"` so it can be used in filters without impacting the original `"description"` value. Without ElectroDB's `watch` functionality, to accomplish this you would either have to duplicate this logic or cause permanent modification to the property itself. Additionally, the `"descriptionSearch"` attribute has used `hidden:true` to ensure this value will not be presented to the user.

```javascript
{
  model: {
    entity: "transaction",
    service: "bank",
    version: "1"
  },
  attributes: {
    accountNumber: {
      type: "string"
    },
    transactionId: {
      type: "string"
    },
    amount: {
      type: "number",
    },
    description: {
      type: "string",
    },
    descriptionSearch: {
      type: "string",
      hidden: true,
      watch: ["description"],
      set: (_, {description}) => {
        if (typeof description === "string") {
            return description.toLowerCase();
        }
      }
    }
  },
  indexes: {
    transactions: {
      pk: {
        field: "pk",
        composite: ["accountNumber"]
      },
      sk: {
        field: "sk",
        composite: ["transactionId"]
      }
    }
  }
}
```

**Example 4 - Creating an `updatedAt` property:**

In this example we can easily create both `updatedAt` and `createdAt` attributes on our model. `createdAt` will use ElectroDB's `set` and `readOnly` attribute properties, while `updatedAt` will make use of `readOnly`, and `watch` with the "watchAll" syntax: `{watch: "*"}`. By supplying an asterisk, instead of an array of attribute names, attributes can be defined to watch _all_ changes to _all_ attributes.

Using `watch` in conjunction with `readOnly` is another powerful modeling technique. This combination allows you to model attributes that can only be modified via the model and not via the user. This is useful for attributes that need to be locked down and/or strictly calculated. 

Notable about this example is that both `updatedAt` and `createdAt` use the `set` property without using its arguments. The `readOnly` only prevents modification of an attributes on `update`, and `patch`. By disregarding the arguments passed to `set`, the `updatedAt` and `createdAt` attributes are then effectively locked down from user influence/manipulation.        

```javascript
{
  model: {
    entity: "transaction",
    service: "bank",
    version: "1"
  },
  attributes: {
    accountNumber: {
      type: "string"
    },
    transactionId: {
      type: "string"
    },
    description: {
      type: "string",
    },
    createdAt: {
      type: "number",
      readOnly: true,
      set: () => Date.now()
    },
    updatedAt: {
      type: "number",
      readOnly: true,
      watch: "*",
      set: () => Date.now()
    },
    
  },
  indexes: {
    transactions: {
      pk: {
        field: "pk",
        facets: ["accountNumber"]
      },
      sk: {
        field: "sk",
        facets: ["transactionId"]
      }
    }
  }
}
```

#### Calculated Attributes
See: [Attribute Watching (Example 1)](#attribute-watching).

#### Virtual Attributes
See: [Attribute Watching (Example 2)](#attribute-watching).

#### CreatedAt and UpdatedAt Attributes
See: [Attribute Watching (Example 4)](#attribute-watching).

#### Attribute Validation
The `validation` property allows for multiple function/type signatures. Here the different combinations *ElectroDB* supports:
signature               | behavior
----------------------- | --------
`Regexp`                | ElectroDB will call `.test(val)` on the provided regex with the value passed to this attribute
`(value: T) => string`  | If a string value with length is returned, the text will be considered the _reason_ the value is invalid. It will generate a new exception this text as the message.
`(value: T) => boolean` | If a boolean value is returned, `true` or truthy values will signify than a value is invalid while `false` or falsey will be considered valid.
`(value: T) => void`    | A void or `undefined` value is returned, will be treated as successful, in this scenario you can throw an Error yourself to interrupt the query



## Indexes
When using ElectroDB, indexes are referenced by their `AccessPatternName`. This allows you to maintain generic index names on your DynamoDB table, but reference domain specific names while using your ElectroDB Entity. These will often be referenced as _"Access Patterns"_.

All DynamoDB table start with at least a PartitionKey with an optional SortKey, this can be referred to as the _"Table Index"_. The `indexes` object requires at least the definition of this _Table Index_ **Partition Key** and (if applicable) **Sort Key**.

In your model, the _Table Index_ this is expressed as an _Access Pattern_ *without* an `index` property. For Secondary Indexes, use the `index` property to define the name of the index as defined on your DynamoDB table.

Within these _AccessPatterns_, you define the PartitionKey and (optionally) SortKeys that are present on your DynamoDB table and map the key's name on the table with the `field` property.

```typescript
indexes: {
	[AccessPatternName]: {
		pk: {
			field: string; 
			composite: AttributeName[];
			template?: string;
		},
		sk?: {
			field: string;
			composite: AttributesName[];
            template?: string;
		},
		index?: string
		collection?: string | string[]
	}
}
```

| Property       | Type                                   | Required | Description |
| -------------- | :------------------------------------: | :------: | ----------- |
| `pk`           | `object`                               | yes      | Configuration for the pk of that index or table
| `pk.composite` | `string | string[]`                    | yes      | An array that represents the order in which attributes are concatenated to composite attributes the key (see [Composite Attributes](#composite-attributes) below for more on this functionality).
| `pk.template`  | `string`                               | no       | A string that represents the template in which attributes composed to form a key (see [Composite Attribute Templates](#composite-attribute-templates) below for more on this functionality).
| `pk.field`     | `string`                               | yes      | The name of the attribute as it exists in DynamoDB, if named differently in the schema attributes.
| `pk.casing`    | `default` | `upper` | `lower` | `none` | no       | Choose a case for ElectroDB to convert your keys to, to avoid casing pitfalls when querying data. Default: `lower`. 
| `sk`           | `object`                               | no       | Configuration for the sk of that index or table
| `sk.composite` | `string | string[]`                    | no       | Either an Array that represents the order in which attributes are concatenated to composite attributes the key, or a String for a composite attribute template. (see [Composite Attributes](#composite-attributes) below for more on this functionality).
| `sk.template`  | `string`                               | no       | A string that represents the template in which attributes composed to form a key (see [Composite Attribute Templates](#composite-attribute-templates) below for more on this functionality).
| `sk.field`     | `string`                               | yes      | The name of the attribute as it exists in DynamoDB, if named differently in the schema attributes.
| `pk.casing`    | `default` | `upper` | `lower` | `none` | no       | Choose a case for ElectroDB to convert your keys to, to avoid casing pitfalls when querying data. Default: `lower`.
| `index`        | `string`                               | no       | Required when the `Index` defined is a *Secondary Index*; but is left blank for the table's primary index.
| `collection`   | `string | string[]`                    | no       | Used when models are joined to a `Service`. When two entities share a `collection` on the same `index`, they can be queried with one request to DynamoDB. The name of the collection should represent what the query would return as a pseudo `Entity`. (see [Collections](#collections) below for more on this functionality).

### Indexes Without Sort Keys
When using indexes without Sort Keys, that should be expressed as an index *without* an `sk` property at all. Indexes without an `sk` cannot have a collection, see [Collections](#collections) for more detail.

> _NOTE: It is generally recommended to always use Sort Keys when using ElectroDB as they allow for more advanced query opportunities. Even if your model doesn't _need_ an additional property to define a unique record, having an `sk` with no defined composite attributes (e.g. an empty array) still opens the door to many more query opportunities like [collections](#collections)._

```javascript
// ElectroDB interprets as index *not having* an SK.
{
  indexes: {
    myIndex: {
      pk: {
        field: "pk",
        composite: ["id"]
      }
    }
  }
}
```

[![Try it out!](https://img.shields.io/badge/electrodb-try_out_this_example_›-%23f9bd00?style=for-the-badge&logo=amazondynamodb&labelColor=1a212a)](https://electrodb.fun/?#code/JYWwDg9gTgLgBAbzgUQHY2DAnnAvnAMyghDgCIBTAGwoGMZiATAIzIG4AoD2iVAZ3gwAhnwDWfOAF44qCgHcU6TFgAUHOInUa4ICI2oAuTdu0Ul2I2WFi+ZADRaTANwpQ+wXpYCM9x9r6uTsC0FJbWokJgYGR+uA4mQjAMwMwArjAUfEYIfhrAjNm52thgoeQCUMCoAOa+JiZQFACOqcCNBXAMqRRFcUWoQiBlOfXFWKWWFVW18aNwjS1tFB1dPaO4sbN5qPoAHpmFo408UB0jc2Cih3MaBMDUHWSXdTdwPOAQ7hlGANpk+WQALpFDQbG4AenBKBo9GIABEAEJwKoZKBgRowCQwAAWFDgVCEtFEcAgBDgQlQcAABmIqSC4JC4OiIKVYDgRJ1cfjCcTSeS4HxoPBRBQcLxyfTGdVgC5KVU9gA6XqxLR9DRIYTMGiWLAQVJQAD6mpoBoGQzIeA4AEpONxeAJkYwpOQQFgDcdoIwDQDODx+PAzXjpGRXabBhQDczWdh2FxwnwtArqhQYCokPk8FbE9UICobXGROJE2B0mnHXYZOHM9nc-mOPGFS1XFhEx7TmWM7gsxok7W2EA)

### Indexes With Sort Keys
When using indexes with Sort Keys, that should be expressed as an index *with* an `sk` property. If you don't wish to use the Sort Key in your model, but it does exist on the table, simply use an empty for the `composite` property. An empty array is still very useful, and opens the door to more query opportunities and access patterns like [collections](#collections).

```javascript
// ElectroDB interprets as index *having* SK, but this model doesnt assign any composite attributes to it.
{
  indexes: {
    myIndex: {
      pk: {
        field: "pk",
        composite: ["id"]
      },
      sk: {
        field: "sk",
        composite: []
      }
    }
  }
}
```

[![Try it out!](https://img.shields.io/badge/electrodb-try_out_this_example_›-%23f9bd00?style=for-the-badge&logo=amazondynamodb&labelColor=1a212a)](https://electrodb.fun/?#code/JYWwDg9gTgLgBAbzgUQHY2DAnnAvnAMyghDgCIBTAGwoGMZiATAIzIG4AoD2iVAZ3gwAhnwDWfOAF44qCgHcU6TFgAUHOInUa4ICI2oAuTdu0Ul2I2WFi+ZADRaTANwpQ+wXpYCM9x9r6uTsC0FJbWokJgYGR+uA4mQjAMwMwArjAUfEYIfhrAjNm52thgoeQCUMCoAOa+JiZQFACOqcCNBXAMqRRFcUWoQiBlOfXFWKWWFVW18aNwjS1tFB1dPaO4sbN5qPoAHpmFo408UB0jc2Cih3MaBMDUHWSXdTdwPOAQ7hlGANpk+WQALpFDR9G5ia43O4PSaiF43AD0CLgAEE4BRwNg3iRIF8KHAhFAoEIcMAJAJgFQqBoQdokXAqrR2ikqDhUgECKkqAA6OAAYQAFnRRHAIOlOkK4LSNPSKLtBmAaBJmNQIAoYBA4AF8QK1eiaPQmMwpa84PT2Zk4GBGnd9hJeBL8XxoDBRBQcBqTa96QMiXqYJK+DxSqKCHAWq57nxudLsR88b9gTcNutYlowYhOkJmDRLFgxVAAPrCHMUQsDIZkPAcACUnG4vAEDMYUnIICwheO0EYhYBnB4-HgFfx0jI7fLgzL1ogpVgWHYXHCfC03OqFBgKiQ+TwNZX1QgKjri5E4hXYHSm+bdhkk53e4PR44S+5EagWBXXdOl+3uF3GlXD5sEAA)

### Numeric Keys

If you have an index where the Partition or Sort Keys are expected to be numeric values, you can accomplish this with the `template` property on the index that requires numeric keys. Define the attribute used in the composite template as type "number", and then create a template string with only the attribute's name.

For example, this model defines both the Partition and Sort Key as numeric:

```javascript
const schema = {
  model: {
    entity: "numeric",
    service: "example",
    version: "1"
  },
  attributes: {
    number1: {
      type: "number" // defined as number
    },
    number2: {
      type: "number"  // defined as number
    }
  },
  indexes: {
    record: {
      pk: {
        field: "pk",
        template: "${number1}" // will build PK as numeric value 
      },
      sk: {
        field: "sk",
        template: "${number2}" // will build SK as numeric value
      }
    }
  }
}
```

[![Try it out!](https://img.shields.io/badge/electrodb-try_out_this_example_›-%23f9bd00?style=for-the-badge&logo=amazondynamodb&labelColor=1a212a)](https://electrodb.fun/?#code/JYWwDg9gTgLgBAbzgUQHY2DAnnAvnAMyghDgCIBTAGwoGMZiATAIzIG4AoD2iVAZ3gwAhnwDWfOAF44qCgHcU6TFgAUCDnDggIjagC5EGzXApLsBsqgCuIClGC0yAGiOa+dgG4OKFigA8hcBpnVzgPOz5gXgsARjIjXBdNIRgGYGYrGAo+A3VjGRtmOxjc0M0AenK4XQJgWUY4EQKQIqgyuGwwH3JrFrsyOFDE0N7WgCZS-IqqmrqKBqbRu3bO7stC-s0hhKS4Ot0-bMnjKDpoRmP8sFFLqdrqC-JrkKnjSrg5YCoqOAyvhoACgBpRoSXp2BxhIRUKwUdqaLJBFJrAAkCCWUBiuGcg1emh44AgkSyBgA2us+piyABddrDV5iW75e5UR5kMQvPHvT7fX5Wf5wADKIMWNghtChMLheI6FCRJPIaIxY2xTlxeIJkGJ3XJyppdO2mlwHESiA6QmYNAsWAgVigAH1hJaKPbUIEKANcABKTjcXgCZqtGJSOAxMYAZgALABWTg8fjwZUhgBsAHYABwATgADL7hGI+EYAHQAcwoMDUgeKaqT3uLJYgKh9XHz4mLYEylYxMRrGygYzwXvrjebHFbfCLAEdYVAsMXTjwoIwu33g3XNEWijA5BRTCpQkhlQYkwBaUPZ7N4XaaQ99iZV-twADU58v9LgQ43DabbCAA)

### Index Casing

DynamoDB is a case-sensitive data store, and therefore it is common to convert the casing of keys to uppercase or lowercase prior to saving, updating, or querying data to your table. ElectroDB, by default, will lowercase all keys when preparing query parameters. For those who are using ElectroDB with an existing dataset, have preferences on upper or lowercase, or wish to not convert case at all, this can be configured on an index key field basis.

In the example below, we are configuring the casing ElectroDB will use individually for the Partition Key and Sort Key on the GSI "gis1". For the index's PK, mapped to `gsi1pk`, we ElectroDB will convert this key to uppercase prior to its use in queries. For the index's SK, mapped to `gsi1pk`, we ElectroDB will not convert the case of this key prior to its use in queries.

```typescript
{
  indexes: {
    myIndex: {
      index: "gsi1",
      pk: {
        field: "gsi1pk",
        casing: "upper", // Acct_0120 -> ACCT_0120
        composite: ["organizationId"]
      },
      sk: {
        field: "gsi1sk",
        casing: "none", // Acct_0120 -> Acct_0120 
        composite: ["accountId"]
      }
    }
  }
}
```

[![Try it out!](https://img.shields.io/badge/electrodb-try_out_this_example_›-%23f9bd00?style=for-the-badge&logo=amazondynamodb&labelColor=1a212a)](https://electrodb.fun/?#code/JYWwDg9gTgLgBAbzgUQHY2DAnnAvnAMyghDgCIBTAGwoGMZiATAIzIG4AoD2iVAZ3gBXPhSh84AXjioKAdxTpMWABQIOcOCAiNqALkTqNcCouz6yw0WQA0hjSKgA3YLQrmYAQz4BrD2DA2dnCOonzAvOYAjGSGuLYaHjAMwMyCMBR8+mpGcOkeIACSjFlBGthgbuQCUMCoAOYxOXFBllBFJTllWBXm1bUNQc050HUeqMAAXonhqO0GnbndlWR99Y1GQ0bENB2d5curA03xRgTAYjAAcvmV2XtLvclrgycaVF5XN7s5+481z8cghQQB5gFRvkZflUnkcNq84IxEhQABLnCjFeb3HrQ-4NeG4WInWo6AAeGQhrUymJyYG8EJyZ2oGLItMCCw0PHAEDC6X0AG0yCMxpNprwimQALrwnIAehlcHetG8cAgBDgAANaF5+uq4GBiBVYDgdAQPIIqDBxDAIAqILJRFqRKU8NK4D56adgEzet42ezOZAeZUBa1xVLnRo5XBBP4HV4MnBvBQcMwKARoBQ3R5nPUZTHERhcwBHQSiLD9CNwR39cwxw3rJovILbcnUozEigk8x1MKRWkAWh7wEiPn7HZJfppdLbDK9VGZQ77vtdHJIgcwwbIeUKjElK7gUcYEAy6CrAAsxnVM0mcNX6nBZGeTFmc3U82AC-0ZSWyxX2VXtXqcxUF4CgbDgZ1Nhyd0Z09b1yEXHxJ06ANuQ3fkyBbcCyALFE0V3cN-yjOs4xEcQbzgVN0ygTM+GzL982mYtSygct6krO86lrWMoAbDZBliDg4kQXIPGYHZyCwCBBCgAB9TxxIoWTUBuMg8AASk4bheAEXIKHyIpJHIAAVfSQAAISoUsYh4fghAcQypDIABVBxIgAJgAZhsnT4CFcYpgwMVGCMshTNoM8AGFoACbS7LgFtQpALAACUIBoHz4rOC5rhATMnIAKQ8JVMt094BFy-LyAAQUYGheLi3TgVBKhQoAK2K7wADoPDq0QAAF0gingoDALrmEmUr4Fw1EaJCpz3IABncyJ+0WgB2Nboi4SlDC6sA0lUIJtyKeFQ0YeF-JFILZgu5t0ooeFsoqm54XKz48vhZqwXhGb8JOXB1L2uoIGUTSdocPgup-Vi9spVQrsCmYikB4HQfBjhKWhlisD2ls+FUE6LoSh7UY0caKBge0TGUIIED+ubzCWla1oANjIKDEAZ9EmeW9yto5wwgfJkGwbYIA)

> _NOTE: Casing is a very important decision when modeling your data in DynamoDB. While choosing upper/lower is largely a personal preference, once you have begun loading records in your table it can be difficult to change your casing after the fact. Unless you have good reason, allowing for mixed case keys can make querying data difficult because it will require database consumers to always have a knowledge of their data's case._         

Casing Option | Effect 
:-----------: | --------
`default`     | The default for keys is lowercase, or `lower`
`lower`       | Will convert the key to lowercase prior it its use
`upper`       | Will convert the key to uppercase prior it its use
`none`        | Will not perform any casing changes when building keys

## Facets

As of version `0.11.1`, "Facets" have been renamed to "Composite Attributes", and all documentation has been updated to reflect that change.

- To learn about the latest syntax, checkout [Composite Attributes](#composite-attributes).
- To learn about why this change was made in preparation for 1.0 checkout [Renaming Facets](#the-renaming-of-index-property-facets-to-composite-and-template).


## Composite Attributes
A **Composite Attribute** is a segment of a key based on one of the attributes. **Composite Attributes** are concatenated together from either a **Partition Key**, or a **Sort Key** key, which define an `index`.

> _NOTE: Only attributes with a type of `"string"`, `"number"`, `"boolean"`, or `string[]` (enum) can be used as composite attributes._

There are two ways to provide composite:
1. As a [Composite Attribute Array](#composite-attribute-arrays)
2. As a [Composite Attribute Template](#composite-attribute-templates)

For example, in the following **Access Pattern**, "`locations`" is made up of the composite attributes `storeId`, `mallId`, `buildingId` and `unitId` which map to defined attributes in the [model](#model):
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

### Composite Attribute Arrays
Within a Composite Attribute Array, each element is the name of the corresponding Attribute defined in the Model. The attributes chosen, and the order in which they are specified, will translate to how your composite keys will be built by ElectroDB.

> _NOTE: If the Attribute has a `label` property, that will be used to prefix the composite attributes, otherwise the full Attribute name will be used._
>
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
			composite: ["storeId"]
		},
		sk: {
			field: "sk",
			composite: ["mallId", "buildingId", "unitId"]
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

[![Try it out!](https://img.shields.io/badge/electrodb-try_out_this_example_›-%23f9bd00?style=for-the-badge&logo=amazondynamodb&labelColor=1a212a)](https://electrodb.fun/?#code/JYWwDg9gTgLgBAbzgUQHY2DAnnAvnAMyghDgCIBTAGwoGMZiATAIzIG4AoD2iVAZ3gDoFPnAC8cVBQDuKdJiwAKBBzhwQERtQBciVWrgV52XWSFQRZADT61fClABuwWhVMgAhlSqNgF+tBY1rZwjg58wLymAIxk+rg2ah4wDMDMAK4wIroqBnDmFACSjDkhathgbuQCUMCoAObBeWpUHsw61cCMTQYJIZ7exaXNcBVVZqkNPXmt7VTuXdN4iQYZwD519UN6I2OmNZtLLW0dZMyLK2p9eemomNu5zXvVk42XBrOn6RchuPErdS0AA9sjsPhBaMlIvxhs0wABrWEjAjAaglcgIo4GHjgCARLK6ADaE2ExTIAF0yssqXxEWDkaifPt4Vi1DjIPiqsSBlQyVZyGsNg0+eRbvdupSRn88tK8BwEohRm0aKYsBB0lAAPowZUUTWoDwgChkPAASk4HAKfH0ADowJllCECtsyABlAAqAHkAErIABqAEEADIAVWQSx5LoAssGg4HQ+H3oLfML0WQAEIhwpBgAihQAcgBxeNhpZimAukP5wrukvh+Km231CCKc1AA)

### Composite Attribute Templates
In a Composite Template, you provide a formatted template for ElectroDB to use when making keys. Composite Attribute Templates allow for potential ElectroDB adoption on already established tables and records.

Attributes are identified by surrounding the attribute with `${...}` braces. For example, the syntax `${storeId}`  will match `storeId` attribute in the model.

Convention for a composing a key use the `#` symbol to separate attributes, and for labels to attach with underscore. For example, when composing both the `mallId` and `buildingId`  would be expressed as `mid_${mallId}#bid_${buildingId}`.

> _NOTE: ***ElectroDB*** will not prefix templated keys with the Entity, Project, Version, or Collection. This will give you greater control of your keys but will limit ***ElectroDB's*** ability to prevent leaking entities with some queries._

ElectroDB will continue to always add a trailing delimiter to composite attributes with keys are partially supplied. The section on [BeginsWith Queries](#begins-with-queries) goes into more detail about how ***ElectroDB*** builds indexes from composite attributes.

```javascript
{
    model: {
        entity: "MallStoreCustom",
        version: "1",
        service: "mallstoredirectory"
    },
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
              template: "sid_${storeId}"
          },
          sk: {
              field: "sk",
              template: "mid_${mallId}#bid_${buildingId}#uid_${unitId}"
          }
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

[![Try it out!](https://img.shields.io/badge/electrodb-try_out_this_example_›-%23f9bd00?style=for-the-badge&logo=amazondynamodb&labelColor=1a212a)](https://electrodb.fun/?#code/JYWwDg9gTgLgBAbzgUQHY2DAnnAvnAMyghDgCIBTAGwoGMZiATAIzIG4AoD2iVAZ3gDoFPnAC8cVBQDuKdJiwAKBBzhq4ICI2oAuRKvWGK87HrIBZAIZUqAZRjCAwgFchIMgBoDhtQDcKUHzAvGYAjJ7ePnwBvsC0FGYg1lRCUBSMwGn00FhkkbhehpYwDMDMzjAieio+6qkUAJKM1ZG1athgCeQCUMCoAOZ5bXiFbUk2TS3Dhh1dZD19g63qBctq5cBUGQOT+tPqs2YLA0Ntq8POqJi7Nftwh92lJ2t4+aNqfdoAHlV7bVQQWjFYL8KZ3MAAazBd3UBGA1Ga5EhERhMwo4CoxTmQUYAH0ACQIepNXAo1FqHjgCBBSp6ADa8wcaSaZAAui9DOc7nwoX9yXCEUcIWTyZUMVjEsA8YTxlQSQBiZhSgkIDZbRYK5zKwmXa6MUnvVGUyA0roM2UsjzkNXbfqW8i6mAs9kw3AvN2cjgFRD3SzMGhmLAQZxQXEwP00XGoSwgChkPAASk4HHqfAMADowBVlJFiYiyLYACoAeQASsgAGoAQQAMgBVZAijTJXYWWs16v1xuGm0a-MAITrDRrABEGgA5ADinYbTcdrbr44ahZnjYMuATGf6EEUSaAA)

#### Templates and Composite Attribute Arrays

The example above shows indexes defined only with the `template` property. This property alone is enough to work with ElectroDB, however it can be useful to also include a `composite` array with the names of the Composite Attributes included in the `template` string. Doing so achieves the following benefits:

1. ElectroDB will enforce that the template you have supplied actually resolves to the composite attributes specified in the array.

2. If you use ElectroDB with TypeScript, supplying the `composite` array will ensure the indexes' Composite Attributes are typed just the same as if you had not used a composite template.

An example of using `template` while also using `composite`:

```javascript
{
  indexes: {
    locations: {
      pk: {
        field: "pk",
        template: "sid_${storeId}"
        composite: ["storeId"]
      },
      sk: {
        field: "sk",
        template: "mid_${mallId}#bid_${buildingId}#uid_${unitId}",
        composite: ["mallId", "buildingId", "unitId"]
      }
    }
  }
}
```

[![Try it out!](https://img.shields.io/badge/electrodb-try_out_this_example_›-%23f9bd00?style=for-the-badge&logo=amazondynamodb&labelColor=1a212a)](https://electrodb.fun/?#code/JYWwDg9gTgLgBAbzgUQHY2DAnnAvnAMyghDgCIBTAGwoGMZiATAIzIG4AoD2iVAZ3gDoFPnAC8cVBQDuKdJiwAKBBzhq4ICI2oAuRKvWGK87HrIBZAIZUqAZRjCAwgFchIMgBoDhtQDcKUHzAvGYAjJ7ePnwBvsC0FGYg1lRCUBSMwGn00FhkkbhehpYwDMDMzjAieio+6qkUAJKM1ZG1athgCeQCUMCoAOZ5bXiFbUk2TS3Dhh1dZD19g63qBctq5cBUGQOT+tPqs2YLA0Ntq8POqJi7Nftwh92lJ2t4+aNqfdoAHlV7bVQQWjFYL8KZ3MAAazBd3UBGA1Ga5EhERhMwo4CoxTmQUYAH0ACQIepNXAo1FqHjgCBBSp6ADa8wcaSaZAAui9DOc7nwoX9yXCEUcIWTyZUMVjEsA8YTxlQSQBiZhSgkIDZbRYK5zKwmXa6MUnvVGUyA0roM2UsjzkNXbfqW8i6mAs9kw3AvN2cjgFRD3SzMGhmLAQZxQXEwP00XGoSwgChkPAASk4HHqfAMADowBVlJFiYiyLYACoAeQASsgAGoAQQAMgBVZAijTJXYWWs16v1xuGm0a-MAITrDRrABEGgA5ADinYbTcdrbr44ahZnjYMuATGf6EEUSaAA)

## Composite Attribute and Index Considerations

As described in the above two sections ([Composite Attributes](#composite-attributes), [Indexes](#indexes)), ElectroDB builds your keys using the attribute values defined in your model and provided on your query. Here are a few considerations to take into account when thinking about how to model your indexes:

- Your table's primary Partition and Sort Keys cannot be changed after a record has been created. Be mindful of **not** to use Attributes that have values that can change as composite attributes for your primary table index.

- When updating/patching an Attribute that is also a composite attribute for secondary index, ElectroDB will perform a runtime check that the operation will leave a key in a partially built state. For example: if a Sort Key is defined as having the Composite Attributes `["prop1", "prop2", "prop3"]`, than an update to the `prop1` Attribute will require supplying the `prop2` and `prop3` Attributes as well. This prevents a loss of key fidelity because ElectroDB is not able to update a key partially in place with its existing values.

- As described and detailed in [Composite Attribute Arrays](#composite attribute-arrays), you can use the `label` property on an Attribute shorten a composite attribute's prefix on a key. This can allow trim down the length of your keys.

### Attributes as Indexes

It may be the case that an index field is also an attribute. For example, if a table was created with a Primary Index partition key of `accountId`, and that same field is used to store the `accountId` value used by the application. The following are a few examples of how to model that schema with ElectroDB:

> _NOTE: If you have the unique opportunity to use ElectroDB with a new project, it is strongly recommended to use genericly named index fields that are separate from your business attributes._  

**Using `composite`**

When your attribute's name, or [`field` property](#expanded-syntax) on an attribute, matches the `field` property on an indexes' `pk` or `sk` ElectroDB will forego its usual index key prefixing.    

```typescript
{
  model: {
    entity: "your_entity_name",
    service: "your_service_name",
    version: "1"
  },
  attributes: {
    accountId: {
      type: "string"
    },
    productNumber: {
      type: "number"
    }
  },
  indexes: {
    products: {
      pk: {
        field: "accountId",
        composite: ["accountId"]
      },
      sk: {
        field: "productNumber",
        composite: ["productNumber"]
      }
    }
  }
}
```

[![Try it out!](https://img.shields.io/badge/electrodb-try_out_this_example_›-%23f9bd00?style=for-the-badge&logo=amazondynamodb&labelColor=1a212a)](JYWwDg9gTgLgBAbzgUQHY2DAnnAvnAMyghDgCIBTAGwoGMZiATAIzIG4AoD2iVAZ3jBUANwrpoOALxxUFAO4p0mLAAoEHOJrggIjagC5EGrSbEZshslggBXKAH0zy)

**Using `template`** 

Another approach allows you to use the `template` property, which allows you to format exactly how your key should be built when interacting with DynamoDB. In this case `composite` is optional when using `template`, but including it helps with TypeScript typing.

```typescript
{
  model: {
    entity: "your_entity_name",
    service: "your_service_name",
    version: "1"
  },
  attributes: {
    accountId: {
      type: "string" // string and number types are both supported
    }      
  },
  indexes: {
    "your_access_pattern_name": {
      pk: {
        field: "accountId",
        composite: ["accountId"], // `composite` is optional when using `template` but is required when using TypeScript
        template: "${accountId}"
      },
      sk: {...}
    }
  }
}
```

[![Try it out!](https://img.shields.io/badge/electrodb-try_out_this_example_›-%23f9bd00?style=for-the-badge&logo=amazondynamodb&labelColor=1a212a)](https://electrodb.fun/?#code/JYWwDg9gTgLgBAbzgUQHY2DAnnAvnAMyghDgCIBTAGwoGMZiATAIzIG4AoD2iVAZ3jBUANwrpoOALxxUFAO4p0mLAAoEHOJrggIjagC5EGrSbEZshslggBXKAH0zy+6gCGICmQA0xk5r4UUMLAtBSW1nb2AUEhFC7unj5+WqJQfMC8lgCMZL54SVquMAzAzDYwFHyG6smarrQ8NugAkozVebVw2GBh5AJQQgDmZHAdWrheyWOaYEw29AByNiDMge2dJt29ZKjLq1C5nRN5xyZCegAeleu1s7rzMFVGG1pgANY3LyYEwNRt5PVGi1GN5phsKuAqEVtgASBCA2zA3Cgr5+HjgCDpCqGADaZARTRgrTIAF0Ci9Tl8+B9nqitD8-pY7owHksVoEUXTNBCwFDseQ4czWXtAsjyXT0ZAsb08ULFiKDmSwSZcGDVSqOBNEF1XMwaOFbA4YLqaPEPCNcABKTjcXgCOAE4FwaT4howAC0ABYAKwAZgADOxbfx4HKYGz9s64AAmf3+rI2oSicRQLDGAB0YHKagdDURRMYkzDEcCeEtGcGEBU1q4SbMEnTAEcbIE0yZM3N6Hw1I6C1a8unK9XOEA)

**Advanced use of `template`**

When your `string` attribute is also an index key, and using key templates, you can also add static prefixes and postfixes to your attribute. Under the covers, ElectroDB will leverage this template while interacting with DynamoDB but will allow you to maintain a relationship with the attribute value itself. 

For example, given the following model:    

```typescript
{
  model: {
    entity: "your_entity_name",
    service: "your_service_name",
    version: "1"
  },
  attributes: {
    accountId: {
      type: "string" // only string types are both supported for this example
    },
    organizationId: {
      type: "string"
    },
    name: {
      type: "string"
    }
  },
  indexes: {
    "your_access_pattern_name": {
      pk: {
        field: "accountId",
        composite: ["accountId"],
        template: "prefix_${accountId}_postfix"
      },
      sk: {
        field: "organizationId",
        composite: ["organizationId"]
      }
    }
  }
}
```

[![Try it out!](https://img.shields.io/badge/electrodb-try_out_this_example_›-%23f9bd00?style=for-the-badge&logo=amazondynamodb&labelColor=1a212a)](https://electrodb.fun/?#code/JYWwDg9gTgLgBAbzgUQHY2DAnnAvnAMyghDgCIBTAGwoGMZiATAIzIG4AoD2iVAZ3jBUANwrpoOALxxUFAO4p0mLAAoEHOHBARG1AFyINmuGIzYDZLBACuUAPqnld1AEMQFMgBojmvhSjCwLQUFla2dn4BQRTObh7exnCiUHzAvBYAjGRGuAlwLjAMwMzWMBR8BuqJLrQ81ugAkoyVPsbYYCHkAlBCAOZkcAD0g3C8VDjdfXDt5flQFHDMEDAAFnB81mCQsBSMhNDTK8B8JgAebmA0rbmt0L0uqMAAXgVpqE0tiZozFpOo-dc8ppXO5Pl8fl0iv9solcDk8kJdKdymDNDU6ugKoYvsYwABrVE44wEYDUZrkO4PZ6vXhNLytIlwHjgCCpMoGADaZEpjxeGFpjDIAF0GcYboy+ATsYziaSqOSyOibI1BUCZczIGzOlylfUYHShWrGWVwFQCp0yGB5iTTnYACQIXUq3B2TUwG0wonisU5Di5RDTFzMGihGz2GBBmixdwDXAASk43F4AnytWV+r20kVtRgAFoACwAVgAzAAGdhJ-jwHnU-nvTMUqC9XMATjLWUTQlE4igWCMADowKU1KmMRnPKMm1S+W8mng4wPehAVAmuMM4HJMCsbPAnRn1ptLqTGBwu6YJP2AI7Wfx9xL9vd8NQ1mcC+OtftLleJ9d7ucbLYqGPfIThcchmAoXohD4bIzx7LArxvXsP0fZ8p15Gl63fe8IKg-g1D-RhsOMT9l1XDhfzTPV-0PIDdhA8gCGsKhxjgPFUAgORUFgkRz17RDbxQqjMTQ+4MLrJoJ0I4jNFI78gA)

ElectroDB will accept a `get` request like this:

```typescript
await myEntity.get({
  accountId: "1111-2222-3333-4444",
  organizationId: "AAAA-BBBB-CCCC-DDDD"
}).go()
```

Query DynamoDB with the following params (note the pre/postfix on `accountId`):

> _NOTE: ElectroDB defaults keys to lowercase, though this can be configured using [Index Casing](#index-casing)._

```
{
  Key: {
    accountId: "prefix_1111-2222-3333-4444_postfix",
    organizationId: `aaaa-bbbb-cccc-dddd`, 
  },
  TableName: 'your_table_name'
}
```

When returned from a query, however, ElectroDB will return the following and trim the key of it's prefix and postfix:

```typescript
{
  accountId: "prefix_1111-2222-3333-4444_postfix",
  organizationId: `aaaa-bbbb-cccc-dddd`,
}
name: "your_item_name"
```

## Collections
A Collection is a grouping of Entities with the same Partition Key and allows you to make efficient query across multiple entities. If your background is SQL, imagine Partition Keys as Foreign Keys, a Collection represents a View with multiple joined Entities.

> _NOTE: ElectroDB Collections use DynamoDB queries to retrieve results. One query is made to retrieve results for all Entities (the benefits of single table design), however like the [query method](#query-method), ElectroDB will paginate through all results for a given query._

Collections are defined on an Index, and the name of the collection should represent what the query would return as a pseudo `Entity`. Additionally, Collection names must be unique across a `Service`.

> _NOTE: A `collection` name should be unique to a single common index across entities._

```javascript
const DynamoDB = require("aws-sdk/clients/dynamodb");
const table = "projectmanagement";
const client = new DynamoDB.DocumentClient();

const employees = new Entity({
  model: {
    entity: "employees",
    version: "1",
    service: "taskapp",
  },
  attributes: {
    employeeId: {
      type: "string"
    },
    organizationId: {
      type: "string"
    },
    name: {
      type: "string"
    },
    team: {
      type: ["jupiter", "mercury", "saturn"]
    }
  },
  indexes: {
    staff: {
      pk: {
        field: "pk",
        composite: ["organizationId"]
      },
      sk: {
        field: "sk",
        composite: ["employeeId"]
      }
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
    }
  }
}, { client, table })

const tasks = new Entity({
  model: {
    entity: "tasks",
    version: "1",
    service: "taskapp",
  },
  attributes: {
    taskId: {
      type: "string"
    },
    employeeId: {
      type: "string"
    },
    projectId: {
      type: "string"
    },
    title: {
      type: "string"
    },
    body: {
      type: "string"
    }
  },
  indexes: {
    project: {
      pk: {
        field: "pk",
        composite: ["projectId"]
      },
      sk: {
        field: "sk",
        composite: ["taskId"]
      }
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
        composite: ["projectId"],
      },
    }
  }
}, { client, table });

const TaskApp = new Service({employees, tasks});

await TaskApp.collections
	.assignments({employeeId: "JExotic"})
	.go();

// Equivalent Parameters
{
  "TableName": 'projectmanagement',
  "ExpressionAttributeNames": { '#pk': 'gsi2pk', '#sk1': 'gsi2sk' },
  "ExpressionAttributeValues": { ':pk': '$taskapp_1#employeeid_joeexotic', ':sk1': '$assignments' },
  "KeyConditionExpression": '#pk = :pk and begins_with(#sk1, :sk1)',
  "IndexName": 'gsi2'
}
```

[![Try it out!](https://img.shields.io/badge/electrodb-try_out_this_example_›-%23f9bd00?style=for-the-badge&logo=amazondynamodb&labelColor=1a212a)](https://electrodb.fun/?#code/JYWwDg9gTgLgBAbzgUQHY2DAngGjgZQFMoA3YAY0LgF84AzKCEOAIkIBtDyZGATAIxYBuAFAjyEVAGd4MAIb9OcALyswjAFZcYIOajkBzQiELphYidPjGw7CFkKEpKuKkIB3FOkxYAFAhE4OBAIXg4ALkRAoLhTDGxItnA7BycWHGigkmIpYElEgEZ0zLgpYjJKRPkpAGs5MDBioOoMoLkYHmB+AFcYJ0iAmNjk+0cASV4BkqDsMEJEmShgVAMWEpaS6AM9YAAvdrzUCamhmaw5hc6VtaGNof0TE9PZ+dZF5dX11pi+uRAnoYvSIAbRYGm6YEwxHSrBMUHI3SgWBhLCk7URqBYAF11tE7nBlmEAB79KJDGRyOh0AExMA1GlDOjADiTNQ1JqnIIScAQXJ9EEsLY7fYYSQTbHTGjfcn0smc+jM9is1Hs6WnbmQPmvUE2FLjXgSznUL4lXWjV6DdUQdicbiHRJyKS5AyoEzoKQcoaEwhExIGXIAJk9tNlls5TJZfsDdODQw1vKhArNqXFWLVzXTpVDkqCEaVUeAAdqsZi8a1ILTkvxzTxIhaiDg8kUVGoAEoLJIZI3HTVnKo3J40PE-JaQmF2DS4j4qj2PWrslBcvlWEU1WVSBRXixqnUGhz8e1Oj0+lIaTvjnLAect+9riahsn9QzG9fLks77c1eoIFpuBewz8r5vFcnyfiU8ScM+QLAe+oExNWcD8KEWBQUBqIgTc8F4t83okqel5wN+v4wM+dLPrmirKjGmZckwmqJnAoJEdoqZVpmtTkQqkZvKqOZwGWDGgueBo4ka94xI6zpuKyAG0Ta2j2qwknAC6bowHOkq4QWQaZmRBGMpR2nUXxAn8oxSS2OaqaZghQQcfpMR5sq-qFsWNH8XRCZmUxmgsSJNlqsaNb1kgTZKG2ojiJ2sg9vUYAuAOBDlJu-iPk4eA7lIEViDucUAHQSPJdqdiIACQeXKapcRSKlIwpsqABSyBEhAGDkCwbZlXlBgQL4rZCEAA)

### Collection Queries vs Entity Queries

To query across entities, collection queries make use of ElectroDB's Sort Key structure, which prefixes Sort Key fields with the collection name. Unlike an Entity Query, Collection Queries only leverage [Composite Attributes](#composite-attributes) from an access pattern's Partition Key.  

To better explain how Collection Queries are formed, here is a juxtaposition of an Entity Query's parameters vs a Collection Query's parameters:

**Entity Query**
```javascript
await TaskApp.entities
    .tasks.query
	.assigned({employeeId: "JExotic"})
	.go();

// Equivalent Parameters
{
  KeyConditionExpression: '#pk = :pk and begins_with(#sk1, :sk1)',
  TableName: 'projectmanagement',
  ExpressionAttributeNames: { '#pk': 'gsi2pk', '#sk1': 'gsi2sk' },
  ExpressionAttributeValues: {
    ':pk': '$taskapp#employeeid_jexotic',
    ':sk1': '$assignments#tasks_1'
  },
  IndexName: 'gsi2'
}
```

[![Try it out!](https://img.shields.io/badge/electrodb-try_out_this_example_›-%23f9bd00?style=for-the-badge&logo=amazondynamodb&labelColor=1a212a)](https://electrodb.fun/?#code/JYWwDg9gTgLgBAbzgUQHY2DAngGjgZQFMoA3YAY0LgF84AzKCEOAIkIBtDyZGATAIxYBuAFAjyEVAGd4MAIb9OcALyswjAFZcYIOajkBzQiELphYidPjGw7CFkKEpKuKkIB3FOkxYAFAhE4OBAIXg4ALkRAoLhTDGxItnA7BycWHGigkmIpYElEgEZ0zLgpYjJKRPkpAGs5MDBioOoMoLkYHmB+AFcYJ0iAmNjk+0cASV4BkqDsMEJEmShgVAMWEpaS6AM9YAAvdrzUCamhmaw5hc6VtaGNof0TE9PZ+dZF5dX11pi+uRAnoYvSIAbRYGm6YEwxHSrBMUHI3SgWBhLCk7URqBYAF11tE7nBlmEAB79KJDGRyOh0AExMA1GlDOjADiTNQ1JqnIIScAQXJ9EEsLY7fYYSQTbHTGjfcn0smc+jM9is1Hs6WnbmQPmvUE2FLjXgSznUL4lXWjV6DdUQdicbiHRJyKS5AyoEzoKQcoaEwhExIGXIAJk9tNlls5TJZfsDdODQw1vKhArNqXFWLVzXTpVDkqCEaVUeAAdqsZi8a1ILTkvxzTxIhaiDg8kUVGoAEoLJIZI3HTVnKo3J40PE-JaQmF2DS4j4qj2PWrslBcvlWEU1WVSBRXixqnUGhz8e1Oj0+lIaTvjnLAect+9riahsn9QzG9fLks77c1eoIFpuBewz8r5vFcnyfiU8ScM+QLAe+oExNWcD8KEWBQUBqIgTc8F4t83okqel5wN+v4wM+dLPrmirKjGmZckwmqJnAoJEdoqZVpmtTkQqkZvKqOZwGWDGgueBo4ka94xI6zpuKyAG0Ta2j2qwknAC6bowHOkq4QWQaZmRBGMpR2nUXxAn8oxSS2OaqaZghQQcfpMR5sq-qFsWNH8XRCZmUxmgsSJNlqsaNb1kgTZKG2ojiJ2sg9vUYAuAOBDlJu-iPk4eA7lIEViDucUAHRThgTjRHlmV5QAjt0xBYCIACQeXKS6hC8KlIwpsqABSyBEhAGDkCwbZ1XlBgQL4rZCEAA)

**Collection Query** 
```javascript
await TaskApp.collections
	.assignments({employeeId: "JExotic"})
	.go();

// Equivalent Parameters
{
  KeyConditionExpression: '#pk = :pk and begins_with(#sk1, :sk1)',
  TableName: 'projectmanagement',
  ExpressionAttributeNames: { '#pk': 'gsi2pk', '#sk1': 'gsi2sk' },
  ExpressionAttributeValues: { ':pk': '$taskapp#employeeid_jexotic', ':sk1': '$assignments' },
  IndexName: 'gsi2'
}
```

[![Try it out!](https://img.shields.io/badge/electrodb-try_out_this_example_›-%23f9bd00?style=for-the-badge&logo=amazondynamodb&labelColor=1a212a)](https://electrodb.fun/?#code/JYWwDg9gTgLgBAbzgUQHY2DAngGjgZQFMoA3YAY0LgF84AzKCEOAIkIBtDyZGATAIxYBuAFAjyEVAGd4MAIb9OcALyswjAFZcYIOajkBzQiELphYidPjGw7CFkKEpKuKkIB3FOkxYAFAhE4OBAIXg4ALkRAoLhTDGxItnA7BycWHGigkmIpYElEgEZ0zLgpYjJKRPkpAGs5MDBioOoMoLkYHmB+AFcYJ0iAmNjk+0cASV4BkqDsMEJEmShgVAMWEpaS6AM9YAAvdrzUCamhmaw5hc6VtaGNof0TE9PZ+dZF5dX11pi+uRAnoYvSIAbRYGm6YEwxHSrBMUHI3SgWBhLCk7URqBYAF11tE7nBlmEAB79KJDGRyOh0AExMA1GlDOjADiTNQ1JqnIIScAQXJ9EEsLY7fYYSQTbHTGjfcn0smc+jM9is1Hs6WnbmQPmvUE2FLjXgSznUL4lXWjV6DdUQdicbiHRJyKS5AyoEzoKQcoaEwhExIGXIAJk9tNlls5TJZfsDdODQw1vKhArNqXFWLVzXTpVDkqCEaVUeAAdqsZi8a1ILTkvxzTxIhaiDg8kUVGoAEoLJIZI3HTVnKo3J40PE-JaQmF2DS4j4qj2PWrslBcvlWEU1WVSBRXixqnUGhz8e1Oj0+lIaTvjnLAect+9riahsn9QzG9fLks77c1eoIFpuBewz8r5vFcnyfiU8ScM+QLAe+oExNWcD8KEWBQUBqIgTc8F4t83okqel5wN+v4wM+dLPrmirKjGmZckwmqJnAoJEdoqZVpmtTkQqkZvKqOZwGWDGgueBo4ka94xI6zpuKyAG0Ta2j2qwknAC6bowHOkq4QWQaZmRBGMpR2nUXxAn8oxSS2OaqaZghQQcfpMR5sq-qFsWNH8XRCZmUxmgsSJNlqsaNb1kgTZKG2ojiJ2sg9vUYAuAOBDlJu-iPk4eA7lIEViDucUAHQSPJdqdiIACQeXKapcRSKlIwpsqABSyBEhAGDkCwbZlXlBgQL4rZCEAA)

The notable difference between the two is how much of the Sort Key is specified at query time.

**Entity Query:**
```
ExpressionAttributeValues: { ':sk1': '$assignments#tasks_1' },
```

**Collection Query:**
```
ExpressionAttributeValues: { ':sk1': '$assignments' },
```

### Collection Response Structure
Unlike Entity Queries which return an array, Collection Queries return an object. This object will have a key for every Entity name (or [Entity Alias](#join)) associated with that Collection, and an array for all results queried that belong to that Entity. 

For example, using the "TaskApp" models defined [above](#collections), we would expect the following response from a query to the "assignments" collection:

```typescript
let results = await TaskApp.collections
        .assignments({employeeId: "JExotic"})
        .go();

{
    tasks: [...],    // tasks for employeeId "JExotic" 
    employees: [...] // employee record(s) with employeeId "JExpotic"
}
```

Because the Tasks and Employee Entities both associated their index (`gsi2`) with the same collection name (`assignments`), ElectroDB is able to associate the two entities via a shared Partition Key. As stated in the [collections section](#collections), querying across Entities by PK can be comparable to querying across a foreign key in a traditional relational database.   

## Sub-Collections

Sub-Collections are an extension of [Collection](#collections) functionality that allow you to model more advanced access patterns. Collections and Sub-Collections are defined on [Indexes](#indexes) via a property called `collection`, as either a string or string array respectively. 

The following is an example of functionally identical collections, implemented as a string (referred to as a "collection") and then as a string array (referred to as sub-collections):

**As a string (collection):**
```typescript
{
  colleciton: "assignments"
  pk: {
    field: "pk",
    composite: ["employeeId"]
  },
  sk: {
    field: "sk",
    composite: ["projectId"]
  }
}
```

**As a string array (sub-collections):**
```typescript
{
  colleciton: ["assignments"]
  pk: {
    field: "pk",
            composite: ["employeeId"]
  },
  sk: {
    field: "sk",
            composite: ["projectId"]
  }
}
```

Both implementations above will create a "collections" method called `assignments` when added to a Service.

```typescript
const results = await TaskApp.collections
	.assignments({employeeId: "JExotic"})
	.go();
```

The advantage to using a string array to define collections is the ability to express sub-collections. Below is an example of three entities using sub-collections, followed by an explanation of their sub-collection definitions:

#### Sub-Collection Entities
```typescript
import {Entity, Service} from "electrodb"
import DynamoDB from "aws-sdk/clients/dynamodb";
const table = "projectmanagement";
const client = new DynamoDB.DocumentClient();

const employees = new Entity({
  model: {
    entity: "employees",
    version: "1",
    service: "taskapp",
  },
  attributes: {
    employeeId: {
      type: "string"
    },
    organizationId: {
      type: "string"
    },
    name: {
      type: "string"
    },
    team: {
      type: ["jupiter", "mercury", "saturn"] as const
    }
  },
  indexes: {
    staff: {
      pk: {
        field: "pk",
        composite: ["organizationId"]
      },
      sk: {
        field: "sk",
        composite: ["employeeId"]
      }
    },
    employee: {
      collection: "contributions",
      index: "gsi2",
      pk: {
        field: "gsi2pk",
        composite: ["employeeId"],
      },
      sk: {
        field: "gsi2sk",
        composite: [],
      },
    }
  }
}, { client, table })

const tasks = new Entity({
  model: {
    entity: "tasks",
    version: "1",
    service: "taskapp",
  },
  attributes: {
    taskId: {
      type: "string"
    },
    employeeId: {
      type: "string"
    },
    projectId: {
      type: "string"
    },
    title: {
      type: "string"
    },
    body: {
      type: "string"
    }
  },
  indexes: {
    project: {
      collection: "overview",
      pk: {
        field: "pk",
        composite: ["projectId"]
      },
      sk: {
        field: "sk",
        composite: ["taskId"]
      }
    },
    assigned: {
      collection: ["contributions", "assignments"] as const,
      index: "gsi2",
      pk: {
        field: "gsi2pk",
        composite: ["employeeId"],
      },
      sk: {
        field: "gsi2sk",
        composite: ["projectId"],
      },
    }
  }
}, { client, table });

const projectMembers = new Entity({
  model: {
    entity: "projectMembers",
    version: "1",
    service: "taskapp",
  },
  attributes: {
    employeeId: {
      type: "string"
    },
    projectId: {
      type: "string"
    },
    name: {
      type: "string"
    },
  },
  indexes: {
    members: {
      collection: "overview",
      pk: {
        field: "pk",
        composite: ["projectId"]
      },
      sk: {
        field: "sk",
        composite: ["employeeId"]
      }
    },
    projects: {
      collection: ["contributions", "assignments"] as const,
      index: "gsi2",
      pk: {
        field: "gsi2pk",
        composite: ["employeeId"],
      },
      sk: {
        field: "gsi2sk",
        composite: [],
      },
    }
  }
}, { client, table }); 

const TaskApp = new Service({employees, tasks, projectMembers});
```

[![Try it out!](https://img.shields.io/badge/electrodb-try_out_this_example_›-%23f9bd00?style=for-the-badge&logo=amazondynamodb&labelColor=1a212a)](https://electrodb.fun/?#code/JYWwDg9gTgLgBAbwKIDsbBgTwDRwMoCmUAbsAMYEC+cAZlBCHAEQEA2BZM9AJgEZMAoMhBQBneDACGvdnAC8zMPQBWHGCEkpJAcwIgCaJgG4BQkeLh6wrCJgIFR8uCgIB3OKnRYAFAgFw4EAhuNgAuRH8AyzQMTHCWcBs7ByZsSIDiIlFgEXiARlT0uFEiUgp4qVEAa0kwMEKAyjSAyRguYF4AVxgHcL8oy0TbewBJbj6igKwwAnjxKGAUbUEBpqLobU1gAC9WnJQxiYGpzBm59qWVqLWBrX0j4+nZ5nnF5aKbqJ7JEAeBp-CAG1JlEmMpOmAMERUnAQQEmPooGROlBMDC4S9WiiUFcBgBdOCSRzCMQwD6RT6LEIAD16EQG4kkNBofyiYCqrIGNGAbHGiiqDWOAWE4Ag2R6QKYGy2u3QIjGTDxIM+DI59KFtB5rD5TGqgqFIsg4uegIS1mGBAVSqFlA+zSiViS9k5cGErHYnH28RJ7S6crE+qiVII1Pi2myACZAwF2S6AtzeWHI+zo1FDWKoZLHRarfbVnmotU45rE8xw8AI3qCwN08agXjq3AVU2KQImog4FIZAQmwBKUwkiyVKqOBQudyeWK+SJBEKsVkGLxxZjD0SBzJQbK5ZgFAslEjkZ5MYe1er2z6tX3dOn9L5EqqHdX-U5H16XO1FbPJR+359nF4XO8+ZFEoECqJwP4ggCAELO+wH-Bg7AutBuqAbiTYFrwwTLr+XwvucsFAdcFL2sGtKiKyoHgTALpuh6-rxBAG6kG4qaxk+xwJtq8Qpo2woMEamZwKaVFqFayqNkWHFclqOpVhitZCaaw7iTaH4DES2TaC4fK4fx7pqF6wkYkwPoLH6+xrrgJmacA2n6Gga4ggSRKuuYMCNmRSYVmxap6VEXE6uWEa8QpAkZhKwlmk6lrcIqjbNgEUn+fGsneZWAp8W5op1lFokQXFDYSeSjRtrgCCdtIsiUL2JhmKScD5TAACyei8FkTjjh4MQ+Les5hBxi6xDxKhqK1IDtZu65ZEZTC7kU+5lEeJ51IKF5tOZ14UYNQzfrpUH4TBbzoc2TWQUKKFvkRjQFnczz+ZdaHqRhkRkTeRT6BNWS0RABmetuUrMTyri+cWgU8ZlYU5UpTBnYVxVCslGLgy8kMatlgmRaaX6jPDanwWyo2cNt-l0YZ27AujpkiFe-pWbCVO2fZi5OUKLnEu5nkoDS6Wg9JAVpWWyZoxqilY9FOaFQlkl+cjgtMMF8no2LJpFTaBa2qV7YVV21W1bC9UWAAKveACCdSdW4+ClIevg4w4uCrrgTXjZNog1SYg7wPbYxOMeriSKwZAABbGKYJvVObYAAHRk-9YiRLHNObXTdu7bjNWJ9oEDeP2ATRzAwcGN43CtJI8gAHwcQA9NXbloCnlluX9-pwFABAwNijjt6InSsDAohFLXtD0Iwhc9jQv02K4bzRF4PIUUUXuIPbojO0TLVtVkjv3u7Til1IJiNP2AgR1UUdJy3lmJ0zKAOQPafmntmf59nueJ+PKAl2Xlc13XZkdG6E3OOrd26dygGINuDg+4DyHnXOgDBOxF1oFPCAM8lhzwwAvUIS93KIBdlvTcO9qh7wUAfSQR8+wmCAA)

> TypeScript Note: Use `as const` syntax when defining `collection` as a string array for improved type support

The last line of the code block above creates a Service called `TaskApp` using the Entity instances created above its declaration. By creating a Service, ElectroDB will identify and validate the sub-collections defined across all three models. The result in this case are four unique collections: "overview", "contributions", and "assignments". 

The simplest collection to understand is `overview`. This collection is defined on the table's Primary Index, composed of a `projectId` in the Partition Key, and is _currently_ implemented by two Entities: `tasks` and `projectMembers`. If another entity were to be added to our service, it could "join" this collection by implementing an identical Partition Key composite (`projectId`) and labeling itself as part of the `overview` collection. The following is an example of using the `overview` collection:

```typescript
// overview
const results = await TaskApp.collections
    .overview({projectId: "SD-204"})
    .go();

// results 
{ 
  tasks: [...],         // tasks associated with projectId "SD-204
  projectMembers: [...] // employees of project "SD-204"
}

// parameters
{
  KeyConditionExpression: '#pk = :pk and begins_with(#sk1, :sk1)',
  TableName: 'projectmanagement',
  ExpressionAttributeNames: { '#pk': 'pk', '#sk1': 'sk' },
  ExpressionAttributeValues: { ':pk': '$taskapp#projectid_sd-204', ':sk1': '$overview' }
}
```

[![Try it out!](https://img.shields.io/badge/electrodb-try_out_this_example_›-%23f9bd00?style=for-the-badge&logo=amazondynamodb&labelColor=1a212a)](https://electrodb.fun/?#code/JYWwDg9gTgLgBAbwKIDsbBgTwDRwMoCmUAbsAMYEC+cAZlBCHAEQEA2BZM9AJgEZMAoMhBQBneDACGvdnAC8zMPQBWHGCEkpJAcwIgCaJgG4BQkeLh6wrCJgIFR8uCgIB3OKnRYAFAgFw4EAhuNgAuRH8AyzQMTHCWcBs7ByZsSIDiIlFgEXiARlT0uFEiUgp4qVEAa0kwMEKAyjSAyRguYF4AVxgHcL8oy0TbewBJbj6igKwwAnjxKGAUbUEBpqLobU1gAC9WnJQxiYGpzBm59qWVqLWBrX0j4+nZ5nnF5aKbqJ7JEAeBp-CAG1JlEmMpOmAMERUnAQQEmPooGROlBMDC4S9WiiUFcBgBdOCSRzCMQwD6RT6LEIAD16EQG4kkNBofyiYCqrIGNGAbHGiiqDWOAWE4Ag2R6QKYGy2u3QIjGTDxIM+DI59KFtB5rD5TGqgqFIsg4uegIS1mGBAVSqFlA+zSiViS9k5cGErHYnH28RJ7S6crE+qiVII1Pi2myACZAwF2S6AtzeWHI+zo1FDWKoZLHRarfbVnmotU45rE8xw8AI3qCwN08agXjq3AVU2KQImog4FIZAQmwBKUwkiyVKqOBQudyeWK+SJBEKsVkGLxxZjD0SBzJQbK5ZgFAslEjkZ5MYe1er2z6tX3dOn9L5EqqHdX-U5H16XO1FbPJR+359nF4XO8+ZFEoECqJwP4ggCAELO+wH-Bg7AutBuqAbiTYFrwwTLr+XwvucsFAdcFL2sGtKiKyoHgTALpuh6-rxBAG6kG4qaxk+xwJtq8Qpo2woMEamZwKaVFqFayqNkWHFclqOpVhitZCaaw7iTaH4DES2TaC4fK4fx7pqF6wkYkwPoLH6+xrrgJmacA2n6Gga4ggSRKuuYMCNmRSYVmxap6VEXE6uWEa8QpAkZhKwlmk6lrcIqjbNgEUn+fGsneZWAp8W5op1lFokQXFDYSeSjRtrgCCdtIsiUL2JhmKScD5TAACyei8FkTjjh4MQ+Les5hBxi6xDxKhqK1IDtZu65ZEZTC7kU+5lEeJ51IKF5tOZ14UYNQzfrpUH4TBbzoc2TWQUKKFvkRjQFnczz+ZdaHqRhkRkTeRT6BNWS0RABmetuUrMTyri+cWgU8ZlYU5UpTBnYVxVCslGLgy8kMatlgmRaaX6jPDanwWyo2cNt-l0YZ27AujpkiFe-pWbCVO2fZi5OUKLnEu5nkoDS6Wg9JAVpWWyZoxqilY9FOaFQlkl+cjgtMMF8no2LJpFTaBa2qV7YVV21W1bC9UWAAKveACCdSdW4+ClIevg4w4uCrrgTXjZNog1XVJvVObYAAHRk-9YhFL7TE224vhw-EeAACIALQRgADAALEwNXB9oEDeLVQA)

Unlike `overview`, the collections `contributions`, and `assignments` are more complex. 

In the case of `contributions`, _all three_ entities implement this collection on the `gsi2` index, and compose their Partition Key with the `employeeId` attribute. The `assignments` collection, however, is only implemented by the `tasks` and `projectMembers` Entities. Below is an example of using these collections:  

> _NOTE: Collection values of `collection: "contributions"` and `collection: ["contributions"]` are interpreted by ElectroDB as being the same implementation._
 
```typescript
// contributions
const results = await TaskApp.collections
        .contributions({employeeId: "JExotic"})
        .go();

// results 
{
  tasks: [...], // tasks assigned to employeeId "JExotic" 
  projectMembers: [...], // projects with employeeId "JExotic"
  employees: [...] // employee record(s) with employeeId "JExotic"
}

{
  KeyConditionExpression: '#pk = :pk and begins_with(#sk1, :sk1)',
  TableName: 'projectmanagement',
  ExpressionAttributeNames: { '#pk': 'gsi2pk', '#sk1': 'gsi2sk' },
  ExpressionAttributeValues: { ':pk': '$taskapp#employeeid_jexotic', ':sk1': '$contributions' },
  IndexName: 'gsi2'
}
```

[![Try it out!](https://img.shields.io/badge/electrodb-try_out_this_example_›-%23f9bd00?style=for-the-badge&logo=amazondynamodb&labelColor=1a212a)](https://electrodb.fun/?ssl=158&ssc=9&pln=157&pc=1#code/JYWwDg9gTgLgBAbwKIDsbBgTwDRwMoCmUAbsAMYEC+cAZlBCHAEQEA2BZM9AJgEZMAoMhBQBneDACGvdnAC8zMPQBWHGCEkpJAcwIgCaJgG4BQkeLh6wrCJgIFR8uCgIB3OKnRYAFAgFw4EAhuNgAuRH8AyzQMTHCWcBs7ByZsSIDiIlFgEXiARlT0uFEiUgp4qVEAa0kwMEKAyjSAyRguYF4AVxgHcL8oy0TbewBJbj6igKwwAnjxKGAUbUEBpqLobU1gAC9WnJQxiYGpzBm59qWVqLWBrX0j4+nZ5nnF5aKbqJ7JEAeBp-CAG1JlEmMpOmAMERUnAQQEmPooGROlBMDC4S9WiiUFcBgBdOCSRzCMQwD6RT6LEIAD16EQG4kkNBofyiYCqrIGNGAbHGiiqDWOAWE4Ag2R6QKYGy2u3QIjGTDxIM+DI59KFtB5rD5TGqgqFIsg4uegIS1mGBAVSqFlA+zSiViS9k5cGErHYnH28RJ7S6crE+qiVII1Pi2myACZAwF2S6AtzeWHI+zo1FDWKoZLHRarfbVnmotU45rE8xw8AI3qCwN08agXjq3AVU2KQImog4FIZAQmwBKUwkiyVKqOBQudyeWK+SJBEKsVkGLxxZjD0SBzJQbK5ZgFAslEjkZ5MYe1er2z6tX3dOn9L5EqqHdX-U5H16XO1FbPJR+359nF4XO8+ZFEoECqJwP4ggCAELO+wH-Bg7AutBuqAbiTYFrwwTLr+XwvucsFAdcFL2sGtKiKyoHgTALpuh6-rxBAG6kG4qaxk+xwJtq8Qpo2woMEamZwKaVFqFayqNkWHFclqOpVhitZCaaw7iTaH4DES2TaC4fK4fx7pqF6wkYkwPoLH6+xrrgJmacA2n6Gga4ggSRKuuYMCNmRSYVmxap6VEXE6uWEa8QpAkZhKwlmk6lrcIqjbNgEUn+fGsneZWAp8W5op1lFokQXFDYSeSjRtrgCCdtIsiUL2JhmKScD5TAACyei8FkTjjh4MQ+Les5hBxi6xDxKhqK1IDtZu65ZEZTC7kU+5lEeJ51IKF5tOZ14UYNQzfrpUH4TBbzoc2TWQUKKFvkRjQFnczz+ZdaHqRhkRkTeRT6BNWS0RABmetuUrMTyri+cWgU8ZlYU5UpTBnYVxVCslGLgy8kMatlgmRaaX6jPDanwWyo2cNt-l0YZ27AujpkiFe-pWbCVO2fZi5OUKLnEu5nkoDS6Wg9JAVpWWyZoxqilY9FOaFQlkl+cjgtMMF8no2LJpFTaBa2qV7YVV21W1bC9UWAAKveACCdSdW4+ClIevg4w4uCrrgTXjZNog1XVJvVObYAAHRk-9YiRP7NObXTdu7bj8QAFJINSEDoGQTA1cH2gQN4tVAA)

```typescript
// assignments
const results = await TaskApp.collections
        .assignments({employeeId: "JExotic"})
        .go();

// results 
{
  tasks: [...],          // tasks assigned to employeeId "JExotic" 
  projectMembers: [...], // projects with employeeId "JExotic"
}

{
  KeyConditionExpression: '#pk = :pk and begins_with(#sk1, :sk1)',
  TableName: 'projectmanagement',
  ExpressionAttributeNames: { '#pk': 'gsi2pk', '#sk1': 'gsi2sk' },
  ExpressionAttributeValues: {
    ':pk': '$taskapp#employeeid_jexotic',
    ':sk1': '$contributions#assignments'
  },
  IndexName: 'gsi2'
}
```

[![Try it out!](https://img.shields.io/badge/electrodb-try_out_this_example_›-%23f9bd00?style=for-the-badge&logo=amazondynamodb&labelColor=1a212a)](https://electrodb.fun/?#code/JYWwDg9gTgLgBAbwKIDsbBgTwDRwMoCmUAbsAMYEC+cAZlBCHAEQEA2BZM9AJgEZMAoMhBQBneDACGvdnAC8zMPQBWHGCEkpJAcwIgCaJgG4BQkeLh6wrCJgIFR8uCgIB3OKnRYAFAgFw4EAhuNgAuRH8AyzQMTHCWcBs7ByZsSIDiIlFgEXiARlT0uFEiUgp4qVEAa0kwMEKAyjSAyRguYF4AVxgHcL8oy0TbewBJbj6igKwwAnjxKGAUbUEBpqLobU1gAC9WnJQxiYGpzBm59qWVqLWBrX0j4+nZ5nnF5aKbqJ7JEAeBp-CAG1JlEmMpOmAMERUnAQQEmPooGROlBMDC4S9WiiUFcBgBdOCSRzCMQwD6RT6LEIAD16EQG4kkNBofyiYCqrIGNGAbHGiiqDWOAWE4Ag2R6QKYGy2u3QIjGTDxIM+DI59KFtB5rD5TGqgqFIsg4uegIS1mGBAVSqFlA+zSiViS9k5cGErHYnH28RJ7S6crE+qiVII1Pi2myACZAwF2S6AtzeWHI+zo1FDWKoZLHRarfbVnmotU45rE8xw8AI3qCwN08agXjq3AVU2KQImog4FIZAQmwBKUwkiyVKqOBQudyeWK+SJBEKsVkGLxxZjD0SBzJQbK5ZgFAslEjkZ5MYe1er2z6tX3dOn9L5EqqHdX-U5H16XO1FbPJR+359nF4XO8+ZFEoECqJwP4ggCAELO+wH-Bg7AutBuqAbiTYFrwwTLr+XwvucsFAdcFL2sGtKiKyoHgTALpuh6-rxBAG6kG4qaxk+xwJtq8Qpo2woMEamZwKaVFqFayqNkWHFclqOpVhitZCaaw7iTaH4DES2TaC4fK4fx7pqF6wkYkwPoLH6+xrrgJmacA2n6Gga4ggSRKuuYMCNmRSYVmxap6VEXE6uWEa8QpAkZhKwlmk6lrcIqjbNgEUn+fGsneZWAp8W5op1lFokQXFDYSeSjRtrgCCdtIsiUL2JhmKScD5TAACyei8FkTjjh4MQ+Les5hBxi6xDxKhqK1IDtZu65ZEZTC7kU+5lEeJ51IKF5tOZ14UYNQzfrpUH4TBbzoc2TWQUKKFvkRjQFnczz+ZdaHqRhkRkTeRT6BNWS0RABmetuUrMTyri+cWgU8ZlYU5UpTBnYVxVCslGLgy8kMatlgmRaaX6jPDanwWyo2cNt-l0YZ27AujpkiFe-pWbCVO2fZi5OUKLnEu5nkoDS6Wg9JAVpWWyZoxqilY9FOaFQlkl+cjgtMMF8no2LJpFTaBa2qV7YVV21W1bC9UWAAKveACCdSdW4+ClIevg4w4uCrrgTXjZNog1XVJvVObYAAHRk-9YiRL7TMoA5MCiHbu24-EABSSDUhA6BkEwNXB9oEDeL2QA)

Looking above we can see that the `assignments` collection is actually a subset of the results that could be queried with the `contributions` collection. The power behind having the `assignments` sub-collection is the flexibility to further slice and dice your cross-entity queries into more specific and performant queries.

> If you're interested in the naming used in the collection and access pattern definitions above, checkout the section on [Naming Conventions](#index-and-collection-naming-conventions)

## Index and Collection Naming Conventions
ElectroDB puts an emphasis on allowing users to define more domain specific naming. Instead of referring to indexes by their name on the table, ElectroDB allows users to define their indexes as Access Patterns. 

> Please refer to the Entities defined in the section [Sub-Collection Entities](#sub-collection-entities) as the source of examples within this section.

### Index Naming Conventions
The following is an access pattern on the "employees" entity defined [here](#sub-collection-entities):

```typescript
staff: {
  pk: {
    field: "pk",
    composite: ["organizationId"]
  },
  sk: {
    field: "sk",
    composite: ["employeeId"]
  }
}
```

This Access Pattern is defined on the table's Primary Index (note the lack of an `index` property), is given the name `staff`, and is composed of an `organiztionId` and an `employeeId`.

When deciding on an Access Pattern name, ask yourself, "What would the array of items returned represent if I only supplied the Partition Key". In this example case, the entity defines an "Employee" by its `organizationId` and `employeeId`. If you performed a query against this index, and only provided `organizationId` you would then expect to receive all Employees for that Organization. From there, the name `staff` was chosen because the focus becomes "What _are_ these Employees _to_ that Organization?". 

This convention also becomes evident when you consider Access Pattern name becomes the name of the method you use query that index.

```typescript
await employee.query.staff({organizationId: "nike"}).go();
```

## Collection Naming Conventions
The following are access patterns on entities defined [here](#sub-collection-entities):

```typescript
// employees entity
employee: {
  collection: "contributions",
  index: "gsi2",
  pk: {
    field: "gsi2pk",
    composite: ["employeeId"],
  },
  sk: {
    field: "gsi2sk",
    composite: [],
  },
}

// tasks entity
assigned: {
  collection: ["contributions", "assignments"],
  index: "gsi2",
  pk: {
    field: "gsi2pk",
    composite: ["employeeId"],
  },
  sk: {
    field: "gsi2sk",
    composite: ["projectId"],
  },
}

// projectMembers entity
projects: {
  collection: ["contributions", "assignments"] as const,
  index: "gsi2",
  pk: {
    field: "gsi2pk",
    composite: ["employeeId"],
  },
  sk: {
    field: "gsi2sk",
    composite: [],
  },
}
```

In the case of the entities above, we see an example of a [sub-collection](#sub-collections). ElectroDB will use the above definitions to generate two collections: `contributions`, `assignments`.

The considerations for naming a collection are nearly identical to the considerations for [naming an index](#index-naming-conventions): What do the query results from supplying just the Partition Key represent? In the case of collections you must also consider what the results represent across _all_ of the involved entities, and the entities that may be added in the future.

For example, the `contributions` collection is named such because when given an `employeeId` we receive the employee's details, the tasks the that employee, and the projects where they are currently a member.

In the case of `assignments`, we receive a subset of `contributions` when supplying an `employeeId`: Only the tasks and projects they are "assigned" are returned.

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

operator      | example                          | result
| ----------- | -------------------------------- |  
`gte`         | `rent.gte(maxRent)`              | `#rent >= :rent1`
`gt`          | `rent.gt(maxRent)`               | `#rent > :rent1`
`lte`         | `rent.lte(maxRent)`              | `#rent <= :rent1`
`lt`          | `rent.lt(maxRent)`               | `#rent < :rent1`
`eq`          | `rent.eq(maxRent)`               | `#rent = :rent1`
`ne`          | `rent.ne(maxRent)`               | `#rent <> :rent1`
`begins`      | `rent.begins(maxRent)`           | `begins_with(#rent, :rent1)`
`exists`      | `rent.exists()`                  | `attribute_exists(#rent)`
`notExists`   | `rent.notExists()`               | `attribute_not_exists(#rent)`
`contains`    | `rent.contains(maxRent)`         | `contains(#rent = :rent1)`
`notContains` | `rent.notContains(maxRent)`      | `not contains(#rent = :rent1)`
`between`     | `rent.between(minRent, maxRent)` | `(#rent between :rent1 and :rent2)`
`name`        | `rent.name()`                    | `#rent`
`value`       | `rent.value(maxRent)`            | `:rent1`

This functionality allows you to write the remaining logic of your `FilterExpression` with ease. Add complex nested `and`/`or` conditions or other `FilterExpression` logic while ElectroDB handles the  `ExpressionAttributeNames` and `ExpressionAttributeValues`.

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

## Where

> The `where()` method is an improvement on the `filter()` method. Unlike `filter`, `where` will be compatible with upcoming features related to complex types.

Building thoughtful indexes can make queries simple and performant. Sometimes you need to filter results down further or add conditions to an update/patch/put/create/delete/remove action.

### FilterExpressions

Below is the traditional way you would add a `FilterExpression` to Dynamo's DocumentClient directly alongside how you would accomplish the same using the `where` method.

```javascript
animals.query
  .exhibit({habitat: "Africa"})
  .where(({isPregnant, offspring}, {exists, eq}) => `
    ${eq(isPregnant, true)} OR ${exists(offspring)}
  `)
  .go()
```

```json
{
  "KeyConditionExpression": "#pk = :pk and begins_with(#sk1, :sk1)",
  "TableName": "zoo_manifest",
  "ExpressionAttributeNames": {
    "#isPregnant": "isPregnant",
    "#offspring": "offspring",
    "#pk": "gsi1pk",
    "#sk1": "gsi1sk"
  },
  "ExpressionAttributeValues": {
    ":isPregnant0": true,
    ":pk": "$zoo#habitat_africa",
    ":sk1": "$animals_1#enclosure_"
  },
  "IndexName": "gsi1pk-gsi1sk-index",
  "FilterExpression": "#isPregnant = :isPregnant0 OR attribute_exists(#offspring)"
}
```

[![Try it out!](https://img.shields.io/badge/electrodb-try_out_this_example_›-%23f9bd00?style=for-the-badge&logo=amazondynamodb&labelColor=1a212a)](https://electrodb.fun/?ssl=91&ssc=8&pln=86&pc=1#code/JYWwDg9gTgLgBAbwKIDsbBgTwDRwMoCmUAbsAMYEC+cAZlBCHAEQEA2BZM9AJgEZMAoAWQgoAzvACGKUJNZi4AXjgoCAdzip0WABQIBcOCAjc2ALkQHD1sUVIULTAF4QITbFetwCaDJkfSsvLuntbERGLAoo4AjCGGlB6GkjBcwLwArjAEYhb6XgAWkrwYKXmhhlhgBBYA2kwAgnTkku7MDVCc5G1MAEqSwCgAYtA5MEwAuklecFAEAI4ZwHPcFlwZBNMJW94oZKwQYhlz5TNwVTXMElCDAObx1omhgSBypzMXjtd3D15zi8sCKtzlANjsnl4UJIQJd8h9MNUvmkUPdQhDrKxJBIhkD3l5PldkaivOjDJjsUCAEL+SxnAlMb4owQknbcaS3IgQDK5WnwxHMXiudjSX5wUlwYBiAAKc1uULQeOs9MFEGFKGZjx2JVgBTZNLh+IRlwZRI121C3GABBgisqRq+1tFhgwBBAPJNNyZaJ2EBoNDEYE9t1t53tzFYkvGO2d2TdIbt-KYrzATusgYg1VgVp5BrOKmhsIqefpjOJefN5cM2pgusk+qLdLDHp+Dc1rcMKAg2XjfONpbNecoraHZxHbYrEpQpgAHjlFQGOKAfCGwABrHuGGhW1jAphr1NeETgQ4uupMF5ySbRsXXsTr3nlrdsXd3g-WI+QSLduD1KEwyZFmOE6GAQ04FOkGAhoMM6OLckQxGuAC0cHADEd6IdBoGpmuG60Nuu4oQhq5voYH4nt+9RFCUMApFegG3veuZnE+O6wfBr7XoeDCfqeP4sHsBxHHMPTkjAOLcABo7elYTyJIgNG8OwjguBAAD6rwyDQYxMJQACUADcQgXvIAB0ixEJgVgmaB4HUXoVGlDa7TNGQrR6VZagFEQBA6HokoygQcrSDAuC+v6gZ3HJCCgZGYi4AselKAAfHAAAGoQACTRfMOj+bK8ohSCGy6dQADyvRwFlMUSGIOhhQGQYlVYqW6VZtwQDoBkCEAA)

### ConditionExpressions

Below is the traditional way you would add a `ConditionExpression` to Dynamo's DocumentClient directly alongside how you would accomplish the same using the `where` method.

```javascript
animals.update({
    animal: "blackbear",
    name: "Isabelle"
  })
  // no longer pregnant because Ernesto was born!
  .set({
    isPregnant: false,
    lastEvaluation: "2021-09-12",
    lastEvaluationBy: "stephanie.adler"
  })
  // welcome to the world Ernesto!
  .append({
    offspring: [{
      name: "Ernesto",
      birthday: "2021-09-12",
      note: "healthy birth, mild pollen allergy"
    }]
  })
  // using the where clause can guard against making
  // updates against stale data
  .where(({isPregnant, lastEvaluation}, {lt, eq}) => `
    ${eq(isPregnant, true)} AND ${lt(lastEvaluation, "2021-09-12")}
  `)
  .go()
```

```json
{
  "UpdateExpression": "SET #isPregnant = :isPregnant_u0, #lastEvaluation = :lastEvaluation_u0, #lastEvaluationBy = :lastEvaluationBy_u0, #offspring = list_append(#offspring, :offspring_u0)",
  "ExpressionAttributeNames": {
    "#isPregnant": "isPregnant",
    "#lastEvaluation": "lastEvaluation",
    "#lastEvaluationBy": "lastEvaluationBy",
    "#offspring": "offspring"
  },
  "ExpressionAttributeValues": {
    ":isPregnant0": true,
    ":lastEvaluation0": "2021-09-12",
    ":isPregnant_u0": false,
    ":lastEvaluation_u0": "2021-09-12",
    ":lastEvaluationBy_u0": "stephanie.adler",
    ":offspring_u0": [
      {
        "name": "Ernesto",
        "birthday": "2021-09-12",
        "note": "healthy birth, mild pollen allergy"
      }
    ]
  },
  "TableName": "zoo_manifest",
  "Key": {
    "pk": "$zoo#animal_blackbear",
    "sk": "$animals_1#name_isabelle"
  },
  "ConditionExpression": "#isPregnant = :isPregnant0 AND #lastEvaluation < :lastEvaluation0"
}
```

[![Try it out!](https://img.shields.io/badge/electrodb-try_out_this_example_›-%23f9bd00?style=for-the-badge&logo=amazondynamodb&labelColor=1a212a)](https://electrodb.fun/?ssl=96&ssc=50&pln=96&pc=3#code/JYWwDg9gTgLgBAbwKIDsbBgTwDRwMoCmUAbsAMYEC+cAZlBCHAEQEA2BZM9AJgEZMAoAWQgoAzvACGKUJNZi4AXjgoCAdzip0WABQIBcOCAjc2ALkQHD1sUVIULTAF4QITbFetwCaDJkfSsvLuntbERGLAoo4AjCGGlB6GkjBcwLwArjAEYhb6XgAWkrwYKXmhhlhgBBYA2kwAgnTkku7MDVCc5G1MAEqSwCgAYtA5MEwAuklecFAEAI4ZwHPcFlwZBNMJW94oZKwQYhlz5TNwVTXMElCDAObx1omhgSBypzMXjtd3D15zi8sCKtzlANjsnl4UJIQJd8h9MNUvmkUPdQhDrNxpLciBAMrlLGdPsxeK52NJfnB0YZgGIAApzW5QtDvLxEpgkiBklCCLxUuAlWAFTH+AnwxFXZGo3k7bjAAgwFnWNm2cY7anZED4pjfFE8x47CA0GhiMA3FGKyoIy5MVg01UVOAYAiai1Kq2OV5gCleU0QaqwOX4uFnQxQmGuwnuiVmqUh7YOrwCmBCyQi4Nx85R7WSvVxvlnFAQbIRsXWnWxvMJykOyhonasSQSIZA13KnN10INptAgBCaYdbZjucp9cbMCQxDkGRSURQraz5eHfK748nrGn6FEffn4uzQ7RVnRg1MAA8coqTRxQD5XWAANYlww0OWsYFMe-emYicCHJ11JgvHIkxqiODpiA+opxs+bBvuBn5eN+kCRMWcD1GGBCTDWHZeAQJ4FOkGCuseuGOLckQxPeAC0ZHADE4GUcRJ6fvej60C+b40RRd7wdYiG-ih9RFCUMApMBNYgeBrHQa+pHkXBIEIQwSF-qhLB7AcRxzD0K7NtwmFnLW0qHh4iSICJvDsI4LgQAA+q8Mg0GMTCUAAlAA3EIgHyAAdBkYCYtkejPDIrysI4FmSGQd68AQkhQBS6GOAAkmIxRsOwequVYAD02UqBAcAHCiRBwKaBCMtI8AxWQkh4gQmhQKoEgFWojb8tAKAAIRWN5Kp6HAoQ0vS5VMgqtByLYo4SBOU4ztEzAAEwAAwLTElFLQAnJRMQLRSK4zeuc0oNuEoEGARQyAQ3mSNw7DxYeLk5XlahsN+9UwAVyb1Wo0Cvg1TUfd1hjXWA1QoNw-WhIaxqmncdTpqG0LWkgjVjG4IFJimIpMMtq3rVtO2foWKFMAUsWsMmmD8ssya4CAwB-ZArDsCgcByHdtyYEuEwPU9cB4nc5xk3Aahk3McD7LVtgS9IcC3NOUDcGztwDOI8CvHedx835AU5MrqsSHAEhyPVAWSD1otEAQOh6ENDKjbg+1rhus6mQgFO4AsrlKAAfHAAAGoQACQIAsOh2yNlW4OsBAudQDQAHIACJwCHFM6E7s2biguA4yta2bdtu1x1Y-uPcDtwQDo7kCEAA)

### Where with Complex Attributes

ElectroDB supports using the `where()` method with DynamoDB's complex attribute types: `map`, `list`, and `set`. When using the injected `attributes` object, simply drill into the attribute itself to apply your update directly to the required object.

The following are examples on how to filter on complex attributes:

**Example 1: Filtering on a `map` attribute**

```javascript
animals.query
	.farm({habitat: "Africa"})
	.where(({veterinarian}, {eq}) => eq(veterinarian.name, "Herb Peterson"))
	.go()
```

[![Try it out!](https://img.shields.io/badge/electrodb-try_out_this_example_›-%23f9bd00?style=for-the-badge&logo=amazondynamodb&labelColor=1a212a)](https://electrodb.fun/?#code/JYWwDg9gTgLgBAbwKIDsbBgTwDRwMoCmUAbsAMYEC+cAZlBCHAEQEA2BZM9AJgEZMAoAWQgoAzvACGKUJNZi4AXjgoCAdzip0WABQIBcOCAjc2ALkQHD1sUVIULTAF4QITbFetwCaDJkfSsvLuntbERGLAoo4AjCGGlB6GkjBcwLwArjAEYhb6XgAWkrwYKXmhhlhgBBYA2kwAgnTkku7MDVCc5G1MAEqSwCgAYtA5MEwAuklecFAEAI4ZwHPcFlwZBNMJW94oZKwQYhlz5TNwVTXMElCDAObx1omhgSBypzMXjtd3D15zi8sCKtzlANjsnl4UJIQJd8h9MNUvmkUPdQhDrNxpLciBAMrlLGdPsxeK52NJfnB0YZgGIAApzW5QtDvLxEpgkiBklCCLxUuAlWAFTH+AnwxFXZGo3k7bjAAgwFnWNm2cY7anZED4pjfFE8x47CA0GhiMA3FGKyoIy5MVg01UVOAYAiai1Kq2OV5gCleU0QaqwOX4uFnQxQmGuwnuiVmqUh7YOrwCmBCyQi4Nx85R7WSvVxvlnFAQbIRsXWnWxvMJykOyhonbhbJmyQ3aSutme71wX3+9A5Eth2FVy3i7Mx3MzfM2apkYByLAl4dlnNV2tnVf60KsSQSIZAttZ8vjvlbndAgBCaYdyuX0s325gSGIcgyKSiKH3I8PdbvEkfz9fogXh+S5jmiVjooMpgAB59qKhgmhwoA+K6YAANYLrQcqsMCTBoZ2XgiOAhxOnUTAvHIkxqpSVFiOhcEhjQWE4bR+HWIRkCRMWcD1AOkw1t+XgEFBBTpBgrqQUJji3JEMRoQAtNJwAxLRckSVBnZoRhjFsDhimyahrGGOxxFcfURQlDAKSUTWNF0emZzadhUkySxVEEQwHEkdxLB7AcRxzD0J4wLu3B8WuAnUQIiSIJZvDsI4LgQAA+q8Mg0GMTCUAAlAA3EI5HyAAdIsRCYFYhVCSJFl6OZpQKu0zRkK02XlWoBREAQOh6A2RCDM2s4oNFCALNlSgAHzePMOg9U2LYoIVA64EwAASRC8HAtLyhEohMFlWXlbcEA6PtAhAA)

**Example 1: Filtering on an element in a `list` attribute**

```javascript
animals.query
  .exhibit({habitat: "Tundra"})
  .where(({offspring}, {eq}) => eq(offspring[0].name, "Blitzen"))
  .go()
```

[![Try it out!](https://img.shields.io/badge/electrodb-try_out_this_example_›-%23f9bd00?style=for-the-badge&logo=amazondynamodb&labelColor=1a212a)](https://electrodb.fun/?ssl=106&ssc=8&pln=103&pc=1#code/JYWwDg9gTgLgBAbwKIDsbBgTwDRwMoCmUAbsAMYEC+cAZlBCHAEQEA2BZM9AJgEZMAoAWQgoAzvACGKUJNZi4AXjgoCAdzip0WABQIBcOCAjc2ALkQHD1sUVIULTAF4QITbFetwCaDJkfSsvLuntbERGLAoo4AjCGGlB6GkjBcwLwArjAEYhb6XgAWkrwYKXmhhlhgBBYA2kwAgnTkku7MACoZKNxQrbhMAEqSwCgAYtA5MEwAuklecFAEAI4ZwIvcFlwZBHMJu94oZKwQYhmL5fNwVTXMElAjAObx1omhgSByF-PXjnePz15Fis1gQNlcoNt9q8vChJCAbvlvphqr80ignqFodZuNIHkQIBlcpZLj9mLxXOxpAC4FjDMAxAAFRYPWFoL5eUlMckQSkoQReWlwEqwAo4-zEpEo25ojEC-bcYAEGDs6yc2xTfZ07IgIlMP7o-kvfYQGg0MRge7olWVZE3JisekaipwDAEHXW1W2xwfMDUrwWiDVWCKomIy6GWHwj0kr3Sy2y8N7Z1eYUwUWScVhxNXWN6mWGxOCy4oCDZaOSu36hOF5M052UTH7cLZS2Se7SD2cn1+uABoPoHLlyMI2s2qV5+MF+ZFmzVMjAORYctjyv52sNy4bo2hViSCSjUGd3NVqeC3f70EAIUzzrVa7lO73MCQxDkGRSURQR-HJ8bj4kL5vh+ojXt+q6TpiVhYiMpgAB6DhKhjmhwoA+B6YAANbLrQiqsGCTCYT2XgiOAJyunUTDvHIMyajStFiFhiHhjQuH4QxRHWCRkCRGWcD1MOMz1n+XgELBBTpBgHowaJjgPJEMSYQAtHJwAxAxinSbBPaYdhLFsPhKkKRhHGGFxZG8fURQlDAKQ0fW9GMVmlx6XhsnyextHEQw3HkXxLCHMcpyLG09pPge3CCZuwl0QIiSIDZvDsI4LgQAA+h8Mg0JMTCUAAlAA3EIVHyAAdCsRCYFYJWieJ1l6FZpTKh0XQ9K0eVVWoBREAQOh6CaZoWo8cUIMseVKAAfN4Sw6P15rxrUAAM0wlcO-SXg6MBOD4TC5blVUPBAOi5UAA)

### Attributes and Operations

Where functions allow you to write a `FilterExpression` or `ConditionExpression` without having to worry about the complexities of expression attributes. To accomplish this, ElectroDB injects an object `attributes` as the first parameter to all Filter Functions, and an object `operations`, as the second parameter. Pass the properties from the `attributes` object to the methods found on the `operations` object, along with inline values to set filters and conditions. 

> _NOTE: `where` callbacks must return a string. All method on the  `operation` object all return strings, so you can return the results of the `operation` method or use template strings compose an expression._

```javascript
// A single filter operation 
animals.update({habitat: "Africa", enclosure: "5b"})
  .set({keeper: "Joe Exotic"})
  .where((attr, op) => op.eq(attr.dangerous, true))
  .go();

// A single filter operation w/ destructuring
animals.update({animal: "tiger", name: "janet"})
  .set({keeper: "Joe Exotic"})
  .where(({dangerous}, {eq}) => eq(dangerous, true))
  .go();

// Multiple conditions - `op`
animals.update({animal: "tiger", name: "janet"})
  .set({keeper: "Joe Exotic"})
  .where((attr, op) => `
    ${op.eq(attr.dangerous, true)} AND ${op.notExists(attr.lastFed)}
  `)
  .go();

// Multiple usages of `where` (implicit AND)
animals.update({animal: "tiger", name: "janet"})
  .set({keeper: "Joe Exotic"})
  .where((attr, op) => `
    ${op.eq(attr.dangerous, true)} OR ${op.notExists(attr.lastFed)}
  `)
  .where(({birthday}, {between}) => {
    const today = Date.now();
    const lastMonth = today - 1000 * 60 * 60 * 24 * 30;
    return between(birthday, lastMonth, today);
  })
  .go();

// "dynamic" filtering
function getAnimals(habitat, keepers) {
  const query = animals.query.exhibit({habitat});
  for (const name of keepers) {
    query.where(({keeper}, {eq}) => eq(keeper, name));
  }
  return query.go();
}

const keepers = [
  "Joe Exotic",
  "Carol Baskin"
];

getAnimals("RainForest", keepers);
```

[![Try it out!](https://img.shields.io/badge/electrodb-try_out_this_example_›-%23f9bd00?style=for-the-badge&logo=amazondynamodb&labelColor=1a212a)](https://electrodb.fun/?#code/JYWwDg9gTgLgBAbwKIDsbBgTwDRwMoCmUAbsAMYEC+cAZlBCHAEQEA2BZM9AJgEZMAoAWQgoAzvAAWAQ14ZpMMXAC8cANpMAgnXLSmuLVE7l9zAErTgKAGLQCEpgF040pSPEwA3AKxgCcAAlZeXhVXwIIGjgZORgFMTUUAFcQXiJHb2FRCRcUUGlWJVUUAgB3OFR0LAAKBAE4OBAIbjYALkR6hq6xIlIKdqYALwgIfU6uuAI0DEwB6TyQArExiYbiIjFgUQGARhW4SmxOhS5gXiSYe3a6iZiQ6-Gu8Pa7uMUj1bgoAgBHJOBvtx2lwkgQPl1Do8pmRWBAxElvg9Ps9mBIoFYAOb7BqQibzfKsJGrFFMNGY7Fdb5-AEEIFwEFgx64rooaQgAhEiYkskoLFM8ENbjzDFECBJMScp6YPwDXgjdjzCnMhrAMQABW+GNZaElDRJcogCpQggmyrgclgkiFsw6yOlHOYyVSRBNEIFcG4wAIMF19PtAx6MApKsuIAlqNOvNdOPdAGsCAQ-FBfdzI3zTe71pd0az0fMU-6Izn027HpEaGIwMWCzLmKxVUH3SGCGHfXrC0xFmBg10qxAk+grrbPiy2Q6biOuR2eSXJ2bPhaYFbpDaJ5P27XSWnoyP56sUBBLm3idPt49PpRzxCr5eM49WK4YNZaTWHVvizuzQ+JM-uAAhVcr1TD9+XvR8kGIAokgULYUFfAMzzvCZvxgCCoJg0QAPgotySZTpmSsFoAA8hzXOBKw4UApl9MBY2PBoaC9Vg6SYWiewmERwDhDAHQ0fFFlYJwmwOYSxDo4dJ0YtgWLE9iuk4yBNiPdQmFZdknBvUCJgIIjJDODBfUInSBgxTYdlogBaUzgB2MSLKMoie1o+jaCYljrPM2M5IaBTuOUjRXgUISb1E8SyM+KTmJMszZOEjiGEUnj2g0aFYXhb5TCYFDfw0i8tJEgRDkQOJeHYAZhggAB9RY8hoewg0oABKTIAHoACo2vqNq4AANWkPN0GyOBRGiCBykwMU4DIeY4HFfwl38AADUpJCIAhFqmh85q6lqhBalq4E0cjMXYVzWGzYakwwlA4AEfilgAOiSMAhUuWp7sJZh0BFKBTDUt8ACt5m9JgmoEABIB7A1qeNEyIAYACkIH8JAiMPEwwYaB6VrW6pqhOKBcH7RqVAAPkuh7fnxmAuAeoVeVFcVcAZRrGs6B6MQgapmr2g6js2XlTsY86iEuohrrgUoDpaNEkk4BFMTuhZHue16CHe5XPqYb6XVwf6BiBkoGrZyHoYQWGk0R5GKjR9AyFBtmsZx748YQemfrFMQioQX4mrJyYfmqd3GbEZmoFBVn2c57nWoOgBZJJzuAMBTvcT1BvEOALLgRb+0WpWCTEJ6XoUdWEA+gYdd+vWxwN4HjYhqHvRhhNLeYJGUdtjHHbgbHVpd6muCJsASeUcn84mAASBB+0pwOCbp4UQ7DiPqE0AA5AAROBp9ng9UKIhsxEHqAHuy2lGtvHOe45rmeYEfa4ATpOU-8cVpBFJRIhz531rgapQAp3IBgQ6W82YfSLqrUuGsCSV2AD9P6tdmCGxBmDU2zdzat3hu3a2qN0b20xr3X+eMCbD1HuPR4u8wBzxPovBm9Amb0nDgQS+cAADyZgd4z2ofvVGR9aHn24JfToi0b7ENqIuZcmBvZpBgKUBMKA-ZjwklNbI8AYDNBXCoOAm9S4PQPKUGOjx3A5BQnHUQS5tEaOtFnOAOwAAMji4DdQAGz2OcXANxHiABMAAWDxABmex3gJjfBgAiG6sj5FTGqJI60uAzEWMkMzTRmAeY4hvtHe+j8mDcEwGpEwZ1syKxoEkFAxgRoihgJoTWx9Ao+kCMEN4uALYbHaDONQjgSYThMfAP4RBMDaIgQ9fpUBMCU10vpGAtR6lNRCbQaA-9elwH+sNKIrSoBiG6Y8UZ4zxGYLhlAb2vtyEB2qBsmu7JWbzKvmEiJcBdm3yMZeLIHg4AbKKOoToTAO423wfsJgABhfqho4B-lcLGKwggMhCCqTUwu1QmAWCsLYb4DgWlYM2c1IAA)

The `attributes` object contains every Attribute defined in the Entity's Model. The `operations` object contains the following methods:

operator      | example                           | result
------------- | --------------------------------- | -------------------------------
`eq`          | `eq(rent, maxRent)`               | `#rent = :rent1`
`ne`          | `eq(rent, maxRent)`               | `#rent <> :rent1`
`gte`         | `gte(rent, value)`                | `#rent >= :rent1`
`gt`          | `gt(rent, maxRent)`               | `#rent > :rent1`
`lte`         | `lte(rent, maxRent)`              | `#rent <= :rent1`
`lt`          | `lt(rent, maxRent)`               | `#rent < :rent1`
`begins`      | `begins(rent, maxRent)`           | `begins_with(#rent, :rent1)`
`exists`      | `exists(rent)`                    | `attribute_exists(#rent)`
`notExists`   | `notExists(rent)`                 | `attribute_not_exists(#rent)`
`contains`    | `contains(rent, maxRent)`         | `contains(#rent = :rent1)`
`notContains` | `notContains(rent, maxRent)`      | `not contains(#rent = :rent1)`
`between`     | `between(rent, minRent, maxRent)` | `(#rent between :rent1 and :rent2)`
`name`        | `name(rent)`                      | `#rent`
`value`       | `value(rent, maxRent)`            | `:rent1`

### Multiple Where Clauses
It is possible to include chain multiple where clauses. The resulting FilterExpressions (or ConditionExpressions) are concatenated with an implicit `AND` operator.

```javascript
let MallStores = new Entity(model, {table: "StoreDirectory"});
let stores = await MallStores.query
	.leases({ mallId: "EastPointe" })
	.between({ leaseEndDate: "2020-04-01" }, { leaseEndDate: "2020-07-01" })
	.where(({ rent, discount }, {between, eq}) => `
		${between(rent, "2000.00", "5000.00")} AND ${eq(discount, "1000.00")}
	`)
	.where(({ category }, {eq}) => `
		${eq(category, "food/coffee")}
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

## Parse
The parse method can be given a DocClient response and return a typed and formatted ElectroDB item.

ElectroDB's `parse()` method accepts results from `get`, `delete`, `put`, `update`, `query`, and `scan` operations, applies all the same operations as though the item was retrieved by ElectroDB itself, and will return `null` (or empty array for `query` results) if the item could not be parsed.

```typescript
const myEntity = new Entity({...});
const getResults = docClient.get({...}).promise();
const queryResults = docClient.query({...}).promise();
const updateResults = docClient.update({...}).promise(); 
const formattedGetResults = myEntity.parse(getResults);
const formattedQueryResults = myEntity.parse(formattedQueryResults);
```

Parse also accepts an optional `options` object as a second argument (see the section [Query Options](#query-options) to learn more). Currently, the following query options are relevant to the `parse()` method:

Option            | Default | Notes
----------------- : ------- | -----
`ignoreOwnership` | `true`  | This property defaults to `true` here, unlike elsewhere in the application when it defaults to `false`. You can overwrite the default here with your own preference. 

# Building Queries
> For hands-on learners: the following example can be followed along with **and** executed on runkit: https://runkit.com/tywalch/electrodb-building-queries

ElectroDB queries use DynamoDB's `query` method to find records based on your table's indexes.

> _NOTE: By default, ElectroDB will paginate through all items that match your query. To limit the number of items ElectroDB will retrieve, read more about the [Query Options](#query-options) `pages` and `limit`, or use the ElectroDB [Pagination API](#page) for fine-grain pagination support._

Forming a composite **Partition Key** and **Sort Key** is a critical step in planning **Access Patterns** in **DynamoDB**. When planning composite keys, it is crucial to consider the order in which they are *composed*.  As of the time of writing this documentation, **DynamoDB**  has the following constraints that should be taken into account when planning your **Access Patterns**:
1. You must always supply the **Partition Key** in full for all queries to **DynamoDB**.
2. You currently only have the following operators available on a **Sort Key**: `begins_with`, `between`, `>`, `>=`, `<`, `<=`, and `Equals`.
3. To act on single record, you will need to know the full  **Partition Key** and **Sort Key** for that record.

### Using composite attributes to make hierarchical keys
Carefully considering your **Composite Attribute** order will allow **ElectroDB** to express hierarchical relationships and unlock more available **Access Patterns** for your application.

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
				composite: ["cityId", "mallId"]
			}, 
			sk: {
				field: "sk",
				composite: ["buildingId", "storeId"]
			}  
		},  
		units: {  
			index: "gis1pk-gsi1sk-index",  
			pk: {
				field: "gis1pk",
				composite: ["mallId"]
			},  
			sk: {
				field: "gsi1sk",
				composite: ["buildingId", "unitId"]
			}  
		},
		leases: {
			index: "gis2pk-gsi2sk-index",
			pk: {
				field: "gis2pk",
				composite: ["storeId"]
			},  
			sk: {
				field: "gsi2sk",
				composite: ["leaseEndDate"]
			}  
		}
	}
};
const StoreLocations = new Entity(schema, {table: "StoreDirectory"});
```

### Query App Records

> Examples in this section using the `MallStore` schema defined [above](#shopping-mall-stores), and available for interacting with here: https://runkit.com/tywalch/electrodb-building-queries

All queries start from the Access Pattern defined in the schema.

```javascript
const MallStore = new Entity(schema, {table: "StoreDirectory"}); 
// Each Access Pattern is available on the Entity instance
// MallStore.query.stores()
// MallStore.query.malls()
```

#### Partition Key Composite Attributes
All queries require (*at minimum*) the **Composite Attributes** included in its defined **Partition Key**. **Composite Attributes** you define on the **Sort Key** can be partially supplied, but must be supplied in the order they are defined.

> *Important: Composite Attributes must be supplied in the order they are composed when invoking the **Access Pattern***. This is because composite attributes are used to form a concatenated key string, and if attributes supplied out of order, it is not possible to fill the gaps in that concatenation.

```javascript
const MallStore = new Entity({
  model: {
    service: "mallmgmt",
    entity: "store", 
    version: "1"
  },
  attributes: {
    cityId: "string",
    mallId: "string",
    storeId: "string",
    buildingId: "string",
    unitId: "string",
    name: "string",
    description: "string",
    category: "string"
  },
  indexes: {
    stores: {
      pk: {
        field: "pk",
        composite: ["cityId", "mallId"]
      },
      sk: {
        field: "sk",
        composite: ["storeId", "unitId"]
      }
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

// Good: Includes at least the PK, and the first SK attribute
StoreLocations.query.stores({cityId, mallId, storeId});

// Good: Includes at least the PK, and the all SK attributes   
StoreLocations.query.stores({cityId, mallId, storeId, unitId});

// Bad: No PK composite attributes specified, will throw
StoreLocations.query.stores();

// Bad: Not All PK Composite Attributes included (cityId), will throw
StoreLocations.query.stores({mallId});

// Bad: Composite Attributes not included in order, will NOT throw, but will ignore `unitId` because `storeId` was not supplied as well
StoreLocations.query.stores({cityId, mallId, unitId});
```

### Sort Key Operations
| operator  | use case 
| --------: | ----------- |
| `begins`  | Keys starting with a particular set of characters.
| `between` | Keys between a specified range. 
| `gt`      | Keys less than some value 
| `gte`     | Keys less than or equal to some value 
| `lt`      | Keys greater than some value 
| `lte`     | Keys greater than or equal to some value 

Each record represents one Store location. All Stores are located in Malls we manage.

To satisfy requirements for searching based on location, you could use the following keys: Each `StoreLocations` record would have a **Partition Key**  with the store's `storeId`. This key alone is not enough to identify a particular store. To solve this, compose a **Sort Key** for the store's location attribute ordered hierarchically (mall/building/unit): `["mallId", "buildingId", "unitId"]`.

The `StoreLocations` entity above, using just the `stores` **Index** alone enables four **Access Patterns**:
1. All `LatteLarrys` locations in all *Malls*
2. All `LatteLarrys` locations in one *Mall*
3. All `LatteLarrys` locations inside a specific *Mall*
4. A specific `LatteLarrys` inside of a *Mall* and *Building*

## Query Chains
Queries in ***ElectroDB*** are built around the **Access Patterns** defined in the Schema and are capable of using partial key **Composite Attributes** to create performant lookups. To accomplish this, ***ElectroDB*** offers a predictable chainable API.

> Examples in this section using the `StoreLocations` schema defined [above](#shopping-mall-stores) and can be directly experiment with on runkit: https://runkit.com/tywalch/electrodb-building-queries

The methods: Get (`get`), Create (`put`), Update (`update`), and Delete (`delete`) **require* all composite attributes described in the Entities' primary `PK` and `SK`.

### Query Method

ElectroDB queries use DynamoDB's `query` method to find records based on your table's indexes. To read more about queries checkout the section [Building Queries](#building-queries)

> _NOTE: By default, ElectroDB will paginate through all items that match your query. To limit the number of items ElectroDB will retrieve, read more about the [Query Options](#query-options) `pages` and `limit`, or use the ElectroDB [Pagination API](#page) for fine-grain pagination support._

### Get Method
Provide all Table Index composite attributes in an object to the `get` method. In the event no record is found, a value of `null` will be returned.

> _NOTE: As part of ElectroDB's roll out of 1.0.0, a breaking change was made to the `get` method. Prior to 1.0.0, the `get` method would return an empty object if a record was not found. This has been changed to now return a value of `null` in this case._

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
Provide all Table Index composite attributes in an array of objects to the `get` method to perform a BatchGet query.

> _NOTE: Performing a BatchGet will return a response structure unique to BatchGet: a two-dimensional array with the results of the query and any unprocessed records. See the example below._
> Additionally, when performing a BatchGet the `.params()` method will return an _array_ of parameters, rather than just the parameters for one docClient query. This is because ElectroDB BatchGet queries larger than the docClient's limit of 100 records.

If the number of records you are requesting is above the BatchGet threshold of 100 records, ElectroDB will make multiple requests to DynamoDB and return the results in a single array. By default, ElectroDB will make these requests in series, one after another. If you are confident your table can handle the throughput, you can use the [Query Option](#query-options) `concurrent`. This value can be set to any number greater than zero, and will execute that number of requests simultaneously.

For example, 150 records (50 records over the DynamoDB maximum):

The default value of `concurrent` will be `1`. ElectroDB will execute a BatchGet request of 100, then after that request has responded, make another BatchGet request for 50 records.

If you set the [Query Option](#query-options) `concurrent` to `2`, ElectroDB will execute a BatchGet request of 100 records, and another BatchGet request for 50 records without waiting for the first request to finish.

It is important to consider your Table's throughput considerations when setting this value.

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
]).go({concurrent: 1}); // `concurrent` value is optional and default's to `1`

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

The `results` array are records that were returned DynamoDB as `Responses` on the BatchGet query. They will appear in the same format as other ElectroDB queries.

Elements of the `unprocessed` array are unlike results received from a query. Instead of containing all the attributes of a record, an unprocessed record only includes the composite attributes defined in the Table Index. This is in keeping with DynamoDB's practice of returning only Keys in the case of unprocessed records. For convenience, ElectroDB will return these keys as composite attributes, but you can pass the [query option](#query-options) `{unprocessed:"raw"}` override this behavior and return the Keys as they came from DynamoDB.

### Delete Method
Provide all Table Index composite attributes in an object to the `delete` method to delete a record.

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
Provide all table index composite attributes in an array of objects to the `delete` method to batch delete records.

> _NOTE: Performing a Batch Delete will return an array of "unprocessed" records. An empty array signifies all records were processed. If you want the raw DynamoDB response you can always use the option `{raw: true}`, more detail found here: [Query Options](#query-options)._
> Additionally, when performing a BatchWrite the `.params()` method will return an _array_ of parameters, rather than just the parameters for one docClient query. This is because ElectroDB BatchWrite queries larger than the docClient's limit of 25 records.

If the number of records you are requesting is above the BatchWrite threshold of 25 records, ElectroDB will make multiple requests to DynamoDB and return the results in a single array. By default, ElectroDB will make these requests in series, one after another. If you are confident your table can handle the throughput, you can use the [Query Option](#query-options) `concurrent`. This value can be set to any number greater than zero, and will execute that number of requests simultaneously.

For example, 75 records (50 records over the DynamoDB maximum):

The default value of `concurrent` will be `1`. ElectroDB will execute a BatchWrite request of 25, then after that request has responded, make another BatchWrite request for 25 records, and then another.

If you set the [Query Option](#query-options) `concurrent` to `2`, ElectroDB will execute a BatchWrite request of 25 records, and another BatchGet request for 25 records without waiting for the first request to finish. After those two have finished it will execute another BatchWrite request for 25 records.

It is important to consider your Table's throughput considerations when setting this value.

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
]).go({concurrent: 1}); // `concurrent` value is optional and default's to `1` 

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

Elements of the `unprocessed` array are unlike results received from a query. Instead of containing all the attributes of a record, an unprocessed record only includes the composite attributes defined in the Table Index. This is in keeping with DynamoDB's practice of returning only Keys in the case of unprocessed records. For convenience, ElectroDB will return these keys as composite attributes, but you can pass the [query option](#query-options) `{unprocessed:"raw"}` override this behavior and return the Keys as they came from DynamoDB.

### Put Record
Provide all *required* Attributes as defined in the model to create a new record. **ElectroDB** will enforce any defined validations, defaults, casting, and field aliasing. A Put operation will trigger the `default`, and `set` attribute callbacks when writing to DynamoDB. By default, after performing a `put()` or `create()` operation, ElectroDB will format and return the record through the same process as a Get/Query. This process will invoke the `get` callback on all included attributes. If this behaviour is not desired, use the [Query Option](#query-options) `response:"none"` to return a null value.     

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
Provide all *required* Attributes as defined in the model to create records as an _array_ to `.put()`. **ElectroDB** will enforce any defined validations, defaults, casting, and field aliasing. Another convenience ElectroDB provides, is accepting BatchWrite arrays _larger_ than the 25 record limit. This is achieved making multiple, "parallel", requests to DynamoDB for batches of 25 records at a time. A failure with any of these requests will cause the query to throw, so be mindful of your table's configured throughput.

> _NOTE: Performing a Batch Put will return an array of "unprocessed" records. An empty array signifies all records returned were processed. If you want the raw DynamoDB response you can always use the option `{raw: true}`, more detail found here: [Query Options](#query-options)._
> Additionally, when performing a BatchWrite the `.params()` method will return an _array_ of parameters, rather than just the parameters for one docClient query. This is because ElectroDB BatchWrite queries larger than the docClient's limit of 25 records.

If the number of records you are requesting is above the BatchWrite threshold of 25 records, ElectroDB will make multiple requests to DynamoDB and return the results in a single array. By default, ElectroDB will make these requests in series, one after another. If you are confident your table can handle the throughput, you can use the [Query Option](#query-options) `concurrent`. This value can be set to any number greater than zero, and will execute that number of requests simultaneously.

For example, 75 records (50 records over the DynamoDB maximum):

The default value of `concurrent` will be `1`. ElectroDB will execute a BatchWrite request of 25, then after that request has responded, make another BatchWrite request for 25 records, and then another.

If you set the [Query Option](#query-options) `concurrent` to `2`, ElectroDB will execute a BatchWrite request of 25 records, and another BatchGet request for 25 records without waiting for the first request to finish. After those two have finished it will execute another BatchWrite request for 25 records.

It is important to consider your Table's throughput considerations when setting this value.

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
]).go({concurrent: 1}); // `concurrent` value is optional and default's to `1`

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

Elements of the `unprocessed` array are unlike results received from a query. Instead of containing all the attributes of a record, an unprocessed record only includes the composite attributes defined in the Table Index. This is in keeping with DynamoDB's practice of returning only Keys in the case of unprocessed records. For convenience, ElectroDB will return these keys as composite attributes, but you can pass the [query option](#query-options) `{unprocessed:"raw"}` override this behavior and return the Keys as they came from DynamoDB.

### Update Record

Update Methods are available **_after_** the method `update()` is called, and allow you to perform alter an item stored dynamodb. The methods can be used (and reused) in a chain to form update parameters, when finished with `.params()`, or an update operation, when finished with `.go()`. If your application requires the update method to return values related to the update (e.g. via the `ReturnValues` DocumentClient parameters), you can use the [Query Option](#query-options) `{response: "none" | "all_old" | "updated_old" | "all_new" | "updated_new"}` with the value that matches your need. By default, the Update operation returns an empty object when using `.go()`.

> ElectroDB will validate an attribute's type when performing an operation (e.g. that the `subtract()` method can only be performed on numbers), but will defer checking the logical validity your update operation to the DocumentClient. If your query performs multiple mutations on a single attribute, or perform other illogical operations given nature of an item/attribute, ElectroDB will not validate these edge cases and instead will simply pass back any error(s) thrown by the Document Client.

Update Method                          | Attribute Types                                              | Parameter
-------------------------------------- | ------------------------------------------------------------ | ---------
[set](#update-method-set)              | `number` `string` `boolean` `enum` `map` `list` `set` `any`  | `object`
[remove](#update-method-remove)        | `number` `string` `boolean` `enum` `map` `list` `set` `any`  | `array`
[add](#update-method-add)              | `number` `any` `set`                                         | `object`
[subtract](#update-method-subtract)    | `number`                                                     | `object`
[append](#update-method-append)        | `any` `list`                                                 | `object`
[delete](#update-method-delete)        | `any` `set`                                                  | `object`
[data](#update-method-data)            | `*`                                                          | `callback`

#### Updates to Composite Attributes

ElectroDB adds some constraints to update calls to prevent the accidental loss of data. If an access pattern is defined with multiple composite attributes, then ElectroDB ensure the attributes cannot be updated individually. If an attribute involved in an index composite is updated, then the index key also must be updated, and if the whole key cannot be formed by the attributes supplied to the update, then it cannot create a composite key without overwriting the old data. 

This example shows why a partial update to a composite key is prevented by ElectroDB:

```json
{
  "index": "my-gsi",
  "pk": {
    "field": "gsi1pk",
    "composite": ["attr1"]
  },
  "sk": {
    "field": "gsi1sk",
    "composite": ["attr2", "attr3"]
  }
}
```

The above secondary index definition would generate the following index keys:

```json
{
  "gsi1pk": "$service#attr1_value1",
  "gsi1sk": "$entity_version#attr2_value2#attr3_value6"
}
```

If a user attempts to update the attribute `attr2`, then ElectroDB has no way of knowing value of the attribute `attr3` or if forming the composite key without it would overwrite its value. The same problem exists if a user were to update `attr3`, ElectroDB cannot update the key without knowing each composite attribute's value. 

In the event that a secondary index includes composite values from the table's primary index, ElectroDB will draw from the values supplied for the update key to address index gaps in the secondary index. For example:  

For the defined indexes:

```json
{
  "accessPattern1": {
    "pk": {
      "field": "pk",
      "composite": ["attr1"]
    },
    "sk": {
      "field": "sk",
      "composite": ["attr2"]
    }
  },
  "accessPattern2": {
    "index": "my-gsi",
    "pk": {
      "field": "gsi1pk",
      "composite": ["attr3"]
    },
    "sk": {
      "field": "gsi1sk",
      "composite": ["attr2", "attr4"]
    }
  }
}
```

A user could update `attr4` alone because ElectroDB is able to leverage the value for `attr2` from values supplied to the `update()` method:

```typescript
entity.update({ attr1: "value1", attr2: "value2" })
  .set({ attr4: "value4" })
  .go();

{
  "UpdateExpression": "SET #attr4 = :attr4_u0, #gsi1sk = :gsi1sk_u0, #attr1 = :attr1_u0, #attr2 = :attr2_u0",
  "ExpressionAttributeNames": {
    "#attr4": "attr4",
    "#gsi1sk": "gsi1sk",
    "#attr1": "attr1",
    "#attr2": "attr2"
  },
  "ExpressionAttributeValues": {
    ":attr4_u0": "value6",
    // This index was successfully built
    ":gsi1sk_u0": "$update-edgecases_1#attr2_value2#attr4_value6",
    ":attr1_u0": "value1",
    ":attr2_u0": "value2"
  },
  "TableName": "test_table",
  "Key": { 
    "pk": "$service#attr1_value1", 
    "sk": "$entity_version#attr2_value2" 
  }
}
```

> Note: Included in the update are all attributes from the table's primary index. These values are automatically included on all updates in the event an update results in an insert. 

#### Update Method: Set

The `set()` method will accept all attributes defined on the model. Provide a value to apply or replace onto the item.

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

#### Update Method: Remove

The `remove()` method will accept all attributes defined on the model. Unlike most other update methods, the `remove()` method accepts an array with the names of the attributes that should be removed.

> _NOTE that the attribute property `required` functions as a sort of `NOT NULL` flag. Because of this, if a property exists as `required:true` it will not be possible to _remove_ that property in particular. If the attribute is a property is on "map", and the "map" is not required, then the "map" _can_ be removed._  

```javascript
await StoreLocations
    .update({cityId, mallId, storeId, buildingId})
    .remove(["category"])
    .where((attr, op) => op.eq(attr.category, "food/coffee"))
    .go()

// Equivalent Params:
{
  "UpdateExpression": "REMOVE #category",
  "ExpressionAttributeNames": {
    "#category": "category"
  },
  "ExpressionAttributeValues": {
    ":category0": "food/coffee"
  },
  "TableName": "StoreDirectory",
  "Key": {
    "pk": "$mallstoredirectory#cityid_atlanta#mallid_eastpointe",
    "sk": "$mallstore_1#buildingid_a34#storeid_lattelarrys"
  },
  "ConditionExpression": "#category = :category0"
}
```

#### Update Method: Add

The `add()` method will accept attributes with type `number`, `set`, and `any` defined on the model. In the case of a `number` attribute, provide a number to _add_ to the existing attribute's value on the item.

If the attribute is defined as `any`, the syntax compatible with the attribute type `set` will be used. For this reason, do not use the attribute type `any` to represent a `number`. 

```javascript
const newTenant = client.createSet("larry");

await StoreLocations
    .update({cityId, mallId, storeId, buildingId})
    .add({
      rent: 100,         // "number" attribute
      tenant: ["larry"]  // "set" attribute
    })
    .where((attr, op) => op.eq(attr.category, "food/coffee"))
    .go()

// Equivalent Params:
{
  "UpdateExpression": "SET #rent = #rent + :rent0 ADD #tenant :tenant0",
  "ExpressionAttributeNames": {
    "#category": "category",
    "#rent": "rent",
    "#tenant": "tenant"
  },
  "ExpressionAttributeValues": {
    ":category0": "food/coffee",
    ":rent0": 100,
    ":tenant0": ["larry"]
  },
  "TableName": "StoreDirectory",
  "Key": {
    "pk": "$mallstoredirectory#cityid_atlanta#mallid_eastpointe",
    "sk": "$mallstore_1#buildingid_a34#storeid_lattelarrys"
  },
  "ConditionExpression": "#category = :category0"
}
```

#### Update Method: Subtract

The `subtract()` method will accept attributes with type `number`. In the case of a `number` attribute, provide a number to _subtract_ from the existing attribute's value on the item.

```javascript
await StoreLocations
    .update({cityId, mallId, storeId, buildingId})
    .subtract({deposit: 500})
    .where((attr, op) => op.eq(attr.category, "food/coffee"))
    .go()

// Equivalent Params:
{
  "UpdateExpression": "SET #deposit = #deposit - :deposit0",
  "ExpressionAttributeNames": {
    "#category": "category",
    "#deposit": "deposit"
  },
  "ExpressionAttributeValues": {
    ":category0": "food/coffee",
    ":deposit0": 500
  },
  "TableName": "StoreDirectory",
  "Key": {
    "pk": "$mallstoredirectory#cityid_atlanta#mallid_eastpointe",
    "sk": "$mallstore_1#buildingid_a34#storeid_lattelarrys"
  },
  "ConditionExpression": "#category = :category0"
}
```

#### Update Method: Append

The `append()` method will accept attributes with type `any`. This is a convenience method for working with DynamoDB lists, and is notably different that [`set`](#update-method-set) because it will add an element to an existing array, rather than overwrite the existing value.

```javascript
await StoreLocations
    .update({cityId, mallId, storeId, buildingId})
    .append({
      rentalAgreement: [{
        type: "ammendment", 
        detail: "no soup for you"
      }]
    })
    .where((attr, op) => op.eq(attr.category, "food/coffee"))
    .go()

// Equivalent Params:
{
  "UpdateExpression": "SET #rentalAgreement = list_append(#rentalAgreement, :rentalAgreement0)",
  "ExpressionAttributeNames": {
    "#category": "category",
    "#rentalAgreement": "rentalAgreement"
  },
  "ExpressionAttributeValues": {
    ":category0": "food/coffee",
    ":rentalAgreement0": [
      {
        "type": "ammendment",
        "detail": "no soup for you"
      }
    ]
  },
  "TableName": "StoreDirectory",
  "Key": {
    "pk": "$mallstoredirectory#cityid_atlanta#mallid_eastpointe",
    "sk": "$mallstore_1#buildingid_a34#storeid_lattelarrys"
  },
  "ConditionExpression": "#category = :category0"
}
```

#### Update Method: Delete

The `delete()` method will accept attributes with type `any` or `set` . This operation removes items from a the `contract` attribute, defined as a `set` attribute.

```javascript
await StoreLocations
    .update({cityId, mallId, storeId, buildingId})
    .delete({contact: ['555-345-2222']})
    .where((attr, op) => op.eq(attr.category, "food/coffee"))
    .go()

// Equivalent Params:
{
  "UpdateExpression": "DELETE #contact :contact0",
  "ExpressionAttributeNames": {
    "#category": "category",
    "#contact": "contact"
  },
  "ExpressionAttributeValues": {
    ":category0": "food/coffee",
    ":contact0": "555-345-2222"
  },
  "TableName": "StoreDirectory",
  "Key": {
    "pk": "$mallstoredirectory#cityid_atlanta#mallid_eastpointe",
    "sk": "$mallstore_1#buildingid_a34#storeid_lattelarrys"
  },
  "ConditionExpression": "#category = :category0"
}
```

#### Update Method: Data

The `data()` allows for different approach to updating your item, by accepting a callback with a similar argument signature to the [where clause](#where).

The callback provided to the `data` method is injected with an `attributes` object as the first parameter, and an `operations` object as the second parameter. All operations accept an attribute from the `attributes` object as a first parameter, and optionally accept a second `value` parameter.

As mentioned above, this method is functionally similar to the `where` clause with one exception: The callback provided to `data()` is not expected to return a value. When you invoke an injected `operation` method, the side effects are applied directly to update expression you are building.

operation     | example                               | result                                                                | description
------------- | ------------------------------------- | --------------------------------------------------------------------- | -----------
`set`         | `set(category, value)`                | `#category = :category0`                                              | Add or overwrite existing value
`add`         | `add(tenant, name)`                   | `#tenant :tenant1`                                                    | Add value to existing `set` attribute (used when provided attribute is of type `any` or `set`)
`add`         | `add(rent, amount)`                   | `#rent = #rent + :rent0`                                              | Mathematically add given number to existing number on record
`subtract`    | `subtract(deposit, amount)`           | `#deposit = #deposit - :deposit0`                                     | Mathematically subtract given number from existing number on record
`remove`      | `remove(petFee)`                      | `#petFee`                                                             | Remove attribute/property from item
`append`      | `append(rentalAgreement, amendment)`  | `#rentalAgreement = list_append(#rentalAgreement, :rentalAgreement0)` | Add element to existing `list` attribute
`delete`      | `delete(tenant, name)`                | `#tenant :tenant1`                                                    | Remove item from existing `set` attribute
`del`         | `del(tenant, name)`                   | `#tenant :tenant1`                                                    | Alias for `delete` operation
`name`        | `name(rent)`                          | `#rent`                                                               | Reference another attribute's name, can be passed to other operation that allows leveraging existing attribute values in calculating new values
`value`       | `value(rent, value)`                  | `:rent1`                                                              | Create a reference to a particular value, can be passed to other operation that allows leveraging existing attribute values in calculating new values

```javascript
await StoreLocations
    .update({cityId, mallId, storeId, buildingId})
    .data((a, o) => {
        const newTenant = a.value(attr.tenant, "larry");
        o.set(a.category, "food/meal");   // electrodb "enum"   -> dynamodb "string"
        o.add(a.tenant, newTenant);       // electrodb "set"    -> dynamodb "set"
        o.add(a.rent, 100);               // electrodb "number" -> dynamodb "number"
        o.subtract(a.deposit, 200);       // electrodb "number" -> dynamodb "number"
        o.remove(a.leaseEndDate);         // electrodb "string" -> dynamodb "string"
        o.append(a.rentalAgreement, [{    // electrodb "list"   -> dynamodb "list"
            type: "ammendment",           // electrodb "map"    -> dynamodb "map"
            detail: "no soup for you"
        }]);
        o.delete(a.tags, ['coffee']);     // electrodb "set"    -> dynamodb "set"
        o.del(a.contact, '555-345-2222'); // electrodb "string" -> dynamodb "string"
        o.add(a.fees, op.name(a.petFee)); // electrodb "number" -> dynamodb "number"
        o.add(a.leaseHolders, newTenant); // electrodb "set"    -> dynamodb "set"
    })
    .where((attr, op) => op.eq(attr.category, "food/coffee"))
    .go()

// Equivalent Params:
{
  "UpdateExpression": "SET #category = :category_u0, #rent = #rent + :rent_u0, #deposit = #deposit - :deposit_u0, #rentalAgreement = list_append(#rentalAgreement, :rentalAgreement_u0), #totalFees = #totalFees + #petFee REMOVE #leaseEndDate, #gsi2sk ADD #tenant :tenant_u0, #leaseHolders :tenant_u0 DELETE #tags :tags_u0, #contact :contact_u0",
  "ExpressionAttributeNames": {
  "#category": "category",
    "#tenant": "tenant",
    "#rent": "rent",
    "#deposit": "deposit",
    "#leaseEndDate": "leaseEndDate",
    "#rentalAgreement": "rentalAgreement",
    "#tags": "tags",
    "#contact": "contact",
    "#totalFees": "totalFees",
    "#petFee": "petFee",
    "#leaseHolders": "leaseHolders",
    "#gsi2sk": "gsi2sk"
  },
  "ExpressionAttributeValues": {
    ":category0": "food/coffee",
    ":category_u0": "food/meal",
    ":tenant_u0": ["larry"],
    ":rent_u0": 100,
    ":deposit_u0": 200,
    ":rentalAgreement_u0": [{
      "type": "amendment",
      "detail": "no soup for you"
    }],
    ":tags_u0": ["coffee"], // <- DynamoDB Set
    ":contact_u0": ["555-345-2222"], // <- DynamoDB Set 
    },
  "TableName": "electro",
  "Key": {
    "pk": `$mallstoredirectory#cityid_12345#mallid_eastpointe`,
    "sk": "$mallstore_1#buildingid_a34#storeid_lattelarrys"
  },
  "ConditionExpression": "#category = :category0"
}
```

### Update Method: Complex Data Types

ElectroDB supports updating DynamoDB's complex types (`list`, `map`, `set`) with all of its Update Methods.

When using the chain methods [set](#update-method-set), [add](#update-method-add), [subtract](#update-method-subtract), [remove](#update-method-remove), [append](#update-method-append), and [delete](#update-method-delete), you can access `map` properties, `list` elements, and `set` items by supplying the json path of the property as the name of the attribute.

The [`data()` method](#update-method-data) also allows for working with complex types. Unlike using the update chain methods, the `data()` method ensures type safety when using TypeScript. When using the injected `attributes` object, simply drill into the attribute itself to apply your update directly to the required object.

The following are examples on how update complex attributes, using both with chain methods and the `data()` method.

**Example 1: Set property on a `map` attribute**

Specifying a property on a `map` attribute is expressed with dot notation.

```javascript
// via Chain Method
await StoreLocations
    .update({cityId, mallId, storeId, buildingId})
    .set({'mapAttribute.mapProperty':  "value"})
    .go();

// via Data Method 
await StoreLocations
    .update({cityId, mallId, storeId, buildingId})
    .data(({mapAttribute}, {set}) => set(mapAttribute.mapProperty, "value"))
    .go()
```

**Example 2: Removing an element from a `list` attribute**

Specifying an index on a `list` attribute is expressed with square brackets containing the element's index number.

```javascript
// via Chain Method
await StoreLocations
    .update({cityId, mallId, storeId, buildingId})
    .remove(['listAttribute[0]'])
    .go();

// via Data Method 
await StoreLocations
    .update({cityId, mallId, storeId, buildingId})
    .data(({listAttribute}, {remove}) => remove(listAttribute[0]))
    .go();
```

**Example 3: Adding an item to a `set` attribute, on a `map` attribute, that is an element of a `list` attribute**

All other complex structures are simply variations on the above two examples.

```javascript
// Set values must use the DocumentClient to create a `set`
const newSetValue = StoreLocations.client.createSet("setItemValue"); 

// via Data Method 
await StoreLocations
    .update({cityId, mallId, storeId, buildingId})
    .add({'listAttribute[1].setAttribute': newSetValue})
    .go();

await StoreLocations
    .update({cityId, mallId, storeId, buildingId})
    .data(({listAttribute}, {add}) => {
        add(listAttribute[1].setAttribute, newSetValue)
    })
    .go();
```

### Scan Records
When scanning for rows, you can use filters the same as you would any query. For more information on filters, see the [Where](#where) section.

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

### Remove Method
A convenience method for `delete` with ConditionExpression that the item being deleted exists. Provide all Table Index composite attributes in an object to the `remove` method to remove the record.

```javascript
await StoreLocations.remove({
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
//   ConditionExpression: 'attribute_exists(pk) AND attribute_exists(sk)'
// }
```

### Patch Record

In DynamoDB, `update` operations by default will insert a record if record being updated does not exist. In **_ElectroDB_**, the `patch` method will utilize the `attribute_exists()` parameter dynamically to ensure records are only "patched" and not inserted when updating.

For more detail on how to use the `patch()` method, see the section [Update Record](#update-record) to see all the transferable requirements and capabilities available to `patch()`.

### Create Record

In DynamoDB, `put` operations by default will overwrite a record if record being updated does not exist. In **_ElectroDB_**, the `patch` method will utilize the `attribute_not_exists()` parameter dynamically to ensure records are only "created" and not overwritten when inserting new records into the table.

A Put operation will trigger the `default`, and `set` attribute callbacks when writing to DynamoDB. By default, after writing to DynamoDB, ElectroDB will format and return the record through the same process as a Get/Query, which will invoke the `get` callback on all included attributes. If this behaviour is not desired, use the [Query Option](#query-options) `response:"none"` to return a null value.

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

DynamoDB offers three methods to query records: `get`, `query`, and `scan`. In **_ElectroDB_**, there is a fourth type: `find`. Unlike `get` and `query`, the `find` method does not require you to provide keys, but under the covers it will leverage the attributes provided to choose the best index to query on. Provide the `find` method will all properties known to match a record and **_ElectroDB_** will generate the most performant query it can to locate the results. This can be helpful with highly dynamic querying needs. If an index cannot be satisfied with the attributes provided, `scan` will be used as a last resort.

> _NOTE: The Find method is similar to the Match method with one exception: The attributes you supply directly to the `.find()` method will only be used to identify and fulfill your index access patterns. Any values supplied that do not contribute to a composite key will not be applied as query filters. Furthermore, if the values you provide do not resolve to an index access pattern, then a table scan will be performed. Use the `where()` chain method to further filter beyond keys, or use [Match](#match-records) for the convenience of automatic filtering based on the values given directly to that method._

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
      "composite attributes": [
        "mallId"
      ]
    },
    "sk": {
      "field": "gsi1sk",
      "composite attributes": [
        "buildingId",
        "unitId"
      ]
    }
  }
}
```
The names you have given to your indexes on your entity model/schema express themselves as "Access Pattern" methods on your Entity's `query` object:
```javascript
// Example #1, access pattern `units`
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

The first example shows how ElectroDB post-pends the label of the next composite attribute (`unitId`) on the Sort Key to ensure that buildings such as `"f340"` are not included in the query. This is useful to prevent common issues with overloaded sort keys like accidental over-querying.

The second example allows you to make queries that do include buildings such as `"f340"` or `"f3409"` or `"f340356346"`.

For these reasons it is important to consider that attributes passed to the Access Pattern method are considered to be full, known, data.

## Collection Chains
Collections allow you to query across Entities. They can be used on `Service` instance.

```javascript
const DynamoDB = require("aws-sdk/clients/dynamodb");
const table = "projectmanagement";
const client = new DynamoDB.DocumentClient();

const employees = new Entity({
  model: {
    entity: "employees",
    version: "1",
    service: "taskapp",
  },
  attributes: {
    employeeId: {
      type: "string"
    },
    organizationId: {
      type: "string"
    },
    name: {
      type: "string"
    },
    team: {
      type: ["jupiter", "mercury", "saturn"]
    }
  },
  indexes: {
    staff: {
      pk: {
        field: "pk",
        composite: ["organizationId"]
      },
      sk: {
        field: "sk",
        composite: ["employeeId"]
      }
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
    }
  }
}, { client, table })

const tasks = new Entity({
  model: {
    entity: "tasks",
    version: "1",
    service: "taskapp",
  },
  attributes: {
    taskId: {
      type: "string"
    },
    employeeId: {
      type: "string"
    },
    projectId: {
      type: "string"
    },
    title: {
      type: "string"
    },
    body: {
      type: "string"
    }
  },
  indexes: {
    project: {
      pk: {
        field: "pk",
        composite: ["projectId"]
      },
      sk: {
        field: "sk",
        composite: ["taskId"]
      }
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
    }
  }
}, { client, table });

const TaskApp = new Service({employees, tasks});
```
Available on your Service are two objects: `entites` and `collections`.  Entities available on `entities` have the same capabilities as they would if created individually. When a Model added to a Service with `join` however, its Collections are automatically added and validated with the other Models joined to that Service. These Collections are available on `collections`.

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

> _NOTE: By Default, ElectroDB queries will paginate through all results with the [`go()`](#building-queries) method. ElectroDB's `page()` method can be used to manually iterate through DynamoDB query results._

The `page` method _ends_ a query chain, and asynchronously queries DynamoDB with the `client` provided in the model. Unlike the `.go()`, the `.page()` method returns a tuple.

The first element for a page query is the "pager": an object contains the composite attributes that make up the `ExclusiveStartKey` that is returned by the DynamoDB client. This is very useful in multi-tenant applications where only some composite attributes are exposed to the client, or there is a need to prevent leaking keys between entities. If there is no `ExclusiveStartKey` this value will be null. On subsequent calls to `.page()`, pass the results returned from the previous call to `.page()` or construct the composite attributes yourself.

The "pager" includes the associated entity's Identifiers.

> _NOTE: It is *highly recommended* to use the [query option](#query-options) `pager: "raw""` flag when using `.page()` with `scan` operations. This is because when using scan on large tables the docClient may return an `ExclusiveStartKey` for a record that does not belong to entity making the query (regardless of the filters set). In these cases ElectroDB will return null (to avoid leaking the keys of other entities) when further pagination may be needed to find your records._

The second element is the results of the query, exactly as it would be returned through a `query` operation.

> _NOTE: When calling `.page()` the first argument is reserved for the "page" returned from a previous query, the second parameter is for Query Options. For more information on the options available in the `config` object, check out the section [Query Options](#query-options)._

#### Entity Pagination

```javascript
let [next, stores] = await MallStores.query
	.leases({ mallId })
	.page(); // no "pager" passed to `.page()`

let [pageTwo, moreStores] = await MallStores.query
	.leases({ mallId })
	.page(next, {}); // the "pager" from the first query (`next`) passed to the second query

// page:
// { 
//   storeId: "LatteLarrys", 
//   mallId: "EastPointe", 
//   buildingId: "BuildingA1", 
//   unitId: "B47"
//   __edb_e__: "MallStore",
//   __edb_v__: "version" 
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

#### Service Pagination

> _NOTE: By Default, ElectroDB will paginate through all results with the [`query()`](#building-queries) method. ElectroDB's `page()` method can be used to manually iterate through DynamoDB query results._

Pagination with services is also possible. Similar to [Entity Pagination](#entity-pagination), calling the `.page()` method returns a `[pager, results]` tuple. Also, similar to pagination on Entities, the pager object returned by default is a deconstruction of the returned LastEvaluatedKey.

#### Pager Query Options

The `.page()` method also accepts [Query Options](#query-options) just like the `.go()` and `.params()` methods. Unlike those methods, however, the `.page()` method accepts Query Options as the _second_ parameter (the first parameter is reserved for the "pager").

A notable Query Option, that is available only to the `.page()` method, is an option called `pager`. This property defines the post-processing ElectroDB should perform on a returned `LastEvaluatedKey`, as well as how ElectroDB should interpret an _incoming_ pager, to use as an ExclusiveStartKey.

> _NOTE: Because the "pager" object is destructured from the keys DynamoDB returns as the `LastEvaluatedKey`, these composite attributes differ from the record's actual attribute values in one important way: Their string values will all be lowercase. If you intend to use these attributes in ways where their casing _will_ matter (e.g. in a `where` filter), keep in mind this may result in unexpected outcomes._

The three options for the query option `pager` are as follows:

```javascript
// LastEvaluatedKey
{
  pk: '$taskapp#country_united states of america#state_oregon',
  sk: '$offices_1#city_power#zip_34706#office_mobile branch',
  gsi1pk: '$taskapp#office_mobile branch',
  gsi1sk: '$workplaces#offices_1'
}
```

**"named" (default):** By default, ElectroDB will deconstruct the LastEvaluatedKey returned by the DocClient into it's individual composite attribute parts. The "named" option, chosen by default, also includes the Entity's column "identifiers" -- this is useful with Services where destructured pagers may be identical between more than one Entity in that Service.

```javascript
// {pager: "named"} | {pager: undefined} 
{  
  "city": "power",
  "country": "united states of america",
  "state": "oregon",
  "zip": "34706",
  "office": "mobile branch",
  "__edb_e__": "offices",
  "__edb_v__": "1"
}
```

**"item":**  Similar to "named", however without the Entity's "identifiers". If two Entities with a service have otherwise identical index definitions, using the "item" pager option can result in errors while paginating a Collection. If this is not a concern with your Service, or you are paginating with only an Entity, this option could be preferable because it has fewer properties.

```javascript
// {pager: "item"} 
{  
  "city": "power",
  "country": "united states of america",
  "state": "oregon",
  "zip": "34706",
  "office": "mobile branch",
}
```

**"raw":** The `"raw"` option returns the LastEvaluatedKey as it was returned by the DynamoDB DocClient.

```javascript
// {pager: "raw"} 
{
  pk: '$taskapp#country_united states of america#state_oregon',
  sk: '$offices_1#city_power#zip_34706#office_mobile branch',
  gsi1pk: '$taskapp#office_mobile branch',
  gsi1sk: '$workplaces#offices_1'
}
```

##### Pagination Example

Simple pagination example:

```javascript
async function getAllStores(mallId) {
  let stores = [];
  let pager = null;

  do {
    let [next, results] = await MallStores.query
      .leases({ mallId })
      .page(pager);
    stores = [...stores, ...results]; 
    pager = next;
  } while(pager !== null);
  
  return stores;
} 
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
    .go()
```

## Query Options
Query options can be added the `.params()`, `.go()` and `.page()` to change query behavior or add customer parameters to a query.

By default, **ElectroDB** enables you to work with records as the names and properties defined in the model. Additionally, it removes the need to deal directly with the docClient parameters which can be complex for a team without as much experience with DynamoDB. The Query Options object can be passed to both the `.params()` and `.go()` methods when building you query. Below are the options available:

```typescript
{
  params?: object;
  table?: string;
  raw?: boolean;
  includeKeys?: boolean;
  pager?: "raw" | "named" | "item";
  originalErr?: boolean;
  concurrent?: number;
  unprocessed?: "raw" | "item";
  response?: "default" | "none" | "all_old" | "updated_old" | "all_new" | "updated_new";
  ignoreOwnership?: boolean;
  limit?: number;
  pages?: number;
};
```

Option          | Default              | Description
--------------- | :------------------: | -----------   
params          | `{}`                 | Properties added to this object will be merged onto the params sent to the document client. Any conflicts with **ElectroDB** will favor the params specified here.
table           | _(from constructor)_ | Use a different table than the one defined in the [Service Options](#service-options)
raw             | `false`              | Returns query results as they were returned by the docClient.
includeKeys     | `false`              | By default, **ElectroDB** does not return partition, sort, or global keys in its response.
pager           | `"named"`            | Used in with pagination (`.pages()`) calls to override ElectroDBs default behaviour to break apart `LastEvaluatedKeys` records into composite attributes. See more detail about this in the sections for [Pager Query Options](#pager-query-options).
originalErr     | `false`              | By default, **ElectroDB** alters the stacktrace of any exceptions thrown by the DynamoDB client to give better visibility to the developer. Set this value equal to `true` to turn off this functionality and return the error unchanged.
concurrent      | `1`                  | When performing batch operations, how many requests (1 batch operation == 1 request) to DynamoDB should ElectroDB make at one time. Be mindful of your DynamoDB throughput configurations
unprocessed     | `"item"`             | Used in batch processing to override ElectroDBs default behaviour to break apart DynamoDBs `Unprocessed` records into composite attributes. See more detail about this in the sections for [BatchGet](#batch-get), [BatchDelete](#batch-write-delete-records), and [BatchPut](#batch-write-put-records).
response        | `"default"`          | Used as a convenience for applying the DynamoDB parameter `ReturnValues`. The options here are the same as the parameter values for the DocumentClient except lowercase. The `"none"` option will cause the method to return null and will bypass ElectroDB's response formatting -- useful if formatting performance is a concern.
ignoreOwnership | `false`              | By default, **ElectroDB** interrogates items returned from a query for the presence of matching entity "identifiers". This helps to ensure other entities, or other versions of an entity, are filtered from your results. If you are using ElectroDB with an existing table/dataset you can turn off this feature by setting this property to `true`.
limit           | _none_               | A target for the number of items to return from DynamoDB. If this option is passed, Queries on entities and through collections will paginate DynamoDB until this limit is reached or all items for that query have been returned.
pages           | ∞                    | How many DynamoDB pages should a query iterate through before stopping. By default ElectroDB paginate through all results for your query.

# Errors:

Error Code | Description
:--------: | -------------------- 
1000s      | Configuration Errors
2000s      | Invalid Queries     
3000s      | User Defined Errors 
4000s      | DynamoDB Errors     
5000s      | Unexpected Errors   

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
Make sure you have spelled the identifier correctly or that you actually passed a replacement.

### Invalid Key Composite Attribute Template
*Code: 1003*

*Why this occurred:*
You are trying to use the custom Key Composite Attribute Template, and the format you passed is invalid.

*What to do about it:*
Checkout the section on [Composite Attribute Templates](#composite attribute-templates) and verify your template conforms to the rules detailed there.

### Duplicate Indexes
*Code: 1004*

*Why this occurred:*
Your model contains duplicate indexes. This could be because you accidentally included an index twice or even forgot to add an index name on a secondary index, which would be interpreted as "duplicate" to the Table's Primary index.

*What to do about it:*
Double-check the index names on your model for duplicate indexes. The error should specify which index has been duplicated. It is also possible that you have forgotten to include an index name. Each table must have at least one Table Index (which does not include an `index` property in ElectroDB), but all Secondary and Local indexes must include an `index` property with the name of that index as defined on the table.
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
If your index _does_ have a Sort Key, but you are unsure of how to inform electro without setting composite attributes to the SK, add the SK object to the index and use an empty array for Composite Attributes:
```javascript
// ElectroDB interprets as index *not having* an SK.
{
  indexes: {
    myIndex: {
      pk: {
        field: "pk",
        composite: ["id"]
      }
    }
  }
}

// ElectroDB interprets as index *having* SK, but this model doesnt attach any composite attributes to it.
{
  indexes: {
    myIndex: {
      pk: {
        field: "pk",
        composite: ["id"]
      },
      sk: {
        field: "sk",
        composite: []
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
DynamoDB requires the definition of at least one Primary Index on the table. In Electro this is defined as an Index _without_ an `index` property. Each model needs at least one, and the composite attributes used for this index must ensure each composite represents a unique record.

*What to do about it:*
Identify the index you're using as the Primary Index and ensure it _does not_ have an index property on its definition.
```javascript
// ElectroDB interprets as the Primary Index because it lacks an `index` property.
{
  indexes: {
    myIndex: {
      pk: {
        field: "pk",
        composite: ["org"]
      },
      sk: {
        field: "sk",
        composite: ["id"]
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
        composite: ["org"]
      },
      sk: {
        field: "gsisk1",
        composite: ["id"]
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
Use the error to identify which column needs to examined, double-check the properties on that attribute. Checkout the section on [Attributes](#attributes) for more information on how they are structured.

### Invalid Model
*Code: 1009*

*Why this occurred:*
Some properties on your model are missing or invalid.

*What to do about it:*
Checkout the section on [Models](#model) to verify your model against what is expected.

### Invalid Options
*Code: 1010*

*Why this occurred:*
Some properties on your options object are missing or invalid.

*What to do about it:*
Checkout the section on [Model/Service Options](#service-options) to verify your model against what is expected.

### Duplicate Index Fields
*Code: 1014*

*Why this occurred:*
An Index in your model references the same field twice across indexes. The `field` property in the definition of an index is a mapping to the name of the field assigned to the PK or SK of an index.

*What to do about it:*
This is likely a typo, if not double-check the names of the fields you assigned to be the PK and SK of your index, these field names must be unique.

### Duplicate Index Composite Attributes
*Code: 1015*

*Why this occurred:*
Within one index you tried to use the same composite attribute in both the PK and SK. A composite attribute may only be used once within an index. With ElectroDB it is not uncommon to use the same value as both the PK and SK when a Sort Key exists on a table -- this usually is done because some value is required in that column but for that entity it is not necessary. If this is your situation remember that ElectroDB does put a value in the SortKey even if does not include a composite attribute, checkout [this section](#collection-without-an-sk) for more information.

*What to do about it:*
Determine how you can change your access pattern to not duplicate the composite attribute. Remember that an empty array for an SK is valid.

### Incompatible Key Composite Attribute Template
*Code: 1017*

*Why this occurred:*
You are trying to use the custom Key Composite Attribute Template, and a Composite Attribute Array on your model, and they do not contain identical composite attributes.

*What to do about it:*
Checkout the section on [Composite Attribute Templates](#composite attribute-templates) and verify your template conforms to the rules detailed there. Both properties must contain the same attributes and be provided in the same order.

### Invalid Index With Attribute Name
*Code: 1018*

*Why this occurred:*
ElectroDB's design revolves around best practices related to modeling in single table design. This includes giving indexed fields generic names. If the PK and SK fields on your table indexes also match the names of attributes on your Entity you will need to make special considerations to make sure ElectroDB can accurately map your data.  

*What to do about it:*
Checkout the section [Using ElectroDB with existing data](#using-electrodb-with-existing-data) to learn more about considerations to make when using attributes as index fields.

### Invalid Collection on Index With Attribute Field Names
*Code: 1019*

*Why this occurred:*
Collections allow for unique access patterns to be modeled between entities. It does this by appending prefixes to your key composites. If an Entity leverages an attribute field as an index key, ElectroDB will be unable to prefix your value because that would result in modifying the value itself.   

*What to do about it:*
Checkout the section [Collections](#collections) to learn more about collections, as well as the section [Using ElectroDB with existing data](#using-electrodb-with-existing-data) to learn more about considerations to make when using attributes as index fields.

### Missing Composite Attributes
*Code: 2002*

*Why this occurred:*
The current request is missing some composite attributes to complete the query based on the model definition. Composite Attributes are used to create the Partition and Sort keys. In DynamoDB Partition keys cannot be partially included, and Sort Keys can be partially include they must be at least passed in the order they are defined on the model.

*What to do about it:*
The error should describe the missing composite attributes, ensure those composite attributes are included in the query or update the model to reflect the needs of the access pattern.

### Missing Table
*Code: 2003*f

*Why this occurred:*
You never specified a Table for DynamoDB to use.

*What to do about it:*
Tables can be defined on the [Service Options](#service-options) object when you create an Entity or Service, or if that is not known at the time of creation, it can be supplied as a [Query Option](#query-options) and supplied on each query individually. If can be supplied on both, in that case the Query Option will override the Service Option.

### Invalid Concurrency Option
*Code: 2004*

*Why this occurred:*
When performing a bulk operation ([Batch Get](#batch-get), [Batch Delete Records](#batch-write-delete-records), [Batch Put Records](#batch-write-put-records)) you can pass a [Query Options](#query-options) called `concurrent`, which impacts how many batch requests can occur at the same time. Your value should pass the test of both, `!isNaN(parseInt(value))` and `parseInt(value) > 0`.

*What to do about it:*   
Expect this error only if you're providing a `concurrency` option. Double-check the value you are providing is the value you expect to be passing, and that the value passes the tests listed above.

### Invalid Pages Option
*Code: 2005*

*Why this occurred:*
When performing a query [Query](#building-queries) you can pass a [Query Options](#query-options) called `pages`, which impacts how many DynamoDB pages a query should iterate through. Your value should pass the test of both, `!isNaN(parseInt(value))` and `parseInt(value) > 0`.

*What to do about it:*
Expect this error only if you're providing a `pages` option. Double-check the value you are providing is the value you expect to be passing, and that the value passes the tests listed above.

### Invalid Limit Option
*Code: 2006*

*Why this occurred:*
When performing a query [Query](#building-queries) you can pass a [Query Options](#query-options) called `limit`, which impacts how many DynamoDB items a query should return. Your value should pass the test of both, `!isNaN(parseInt(value))` and `parseInt(value) > 0`.

*What to do about it:*
Expect this error only if you're providing a `limit` option. Double-check the value you are providing is the value you expect to be passing, and that the value passes the tests listed above.

### Invalid Attribute
*Code: 3001*

*Why this occurred:*
The value received for a validation either failed type expectations (e.g. a "number" instead of a "string"), or the user provided "validate" callback on an attribute rejected a value.

*What to do about it:*
Examine the error itself for more precise detail on why the failure occurred. The error object itself should have a property called "fields" which contains an array of every attribute that failed validation, and a reason for each. If the failure originated from a "validate" callback, the originally thrown error will be accessible via the `cause` property the corresponding element within the fields array.1

Below is the type definition for an ElectroValidationError:

```typescript
ElectroValidationError<T extends Error = Error> extends ElectroError {
    readonly name: "ElectroValidationError"
    readonly fields: ReadonlyArray<{
        /**
         * The json path to the attribute that had a validation error
         */
        readonly field: string;

        /**
         * A description of the validation error for that attribute
         */
        readonly reason: string;

        /**
         * Index of the value passed (present only in List attribute validation errors)
         */
        readonly index: number | undefined;

        /**
         * The error thrown from the attribute's validate callback (if applicable)
         */
        readonly cause: T | undefined;
    }>
}
```

### AWS Error
*Code: 4001*

*Why this occurred:*
DynamoDB did not like something about your query.

*What to do about it:*
By default ElectroDB tries to keep the stack trace close to your code, ideally this can help you identify what might be going on. A tip to help with troubleshooting: use `.params()` to get more insight into how your query is converted to DocClient params.

### Unknown Errors

### Invalid Last Evaluated Key
*Code: 5003*

*Why this occurred:*
_Likely_ you were calling `.page()` on a `scan`. If you weren't please make an issue and include as much detail about your query as possible.

*What to do about it:*
When paginating with *scan* queries, it is highly recommended that the query option, `{pager: "raw"}`. This is because when using scan on large tables the docClient may return an ExclusiveStartKey for a record that does not belong to entity making the query (regardless of the filters set). In these cases ElectroDB will return null (to avoid leaking the keys of other entities) when further pagination may be needed to find your records.
```javascript
// example
myModel.scan.page(null, {pager: "raw"});
```

### No Owner For Pager
*Code: 5004*

*Why this occurred:*
When using pagination with a Service, ElectroDB will try to identify which Entity is associated with the supplied pager. This error can occur when you supply an invalid pager, or when you are using a different [pager option](#pager-query-options) to a pager than what was used when retrieving it. Consult the section on [Pagination](#page) to learn more.

*What to do about it:*
If you are sure the pager you are passing to `.page()` is the same you received from `.page()` this could be an unexpected error. To mitigate the issue use the Query Option `{pager: "raw"}` and please open a support issue.

### Pager Not Unique

*Code: 5005*

*Why this occurred:*
When using pagination with a Service, ElectroDB will try to identify which Entity is associated with the supplied [pager option](#pager-query-options). This error can occur when you supply a pager that resolves to more than one Entity. This can happen if your entities share the same composite attributes for the index you are querying on, and you are using the Query Option `{pager: "item""}`.

*What to do about it:*
Because this scenario is possible with otherwise well considered/thoughtful entity models, the default `pager` type used by ElectroDB is `"named"`. To avoid this error, you will need to use either the `"raw"` or `"named"` [pager options](#pager-query-options) for any index that could result in an ambiguous Entity owner.

# Examples

> Want to just play with ElectroDB instead of read about it?
> Try it out for yourself! https://runkit.com/tywalch/electrodb-building-queries

## Employee App
For an example, lets look at the needs of application used to manage Employees. The application Looks at employees, offices, tasks, and projects.

### Employee App Requirements
1. As a Project Manager, I need to find all tasks and details on a specific employee.
2. As a Regional Manager, I need to see all details about an office and its employees
3. As an Employee, I need to see all my Tasks.
4. As a Product Manager, I need to see all the tasks for a project.
5. As a Client, I need to find a physical office close to me.
6. As a Hiring manager, I need to find employees with comparable salaries.
7. As HR, I need to find upcoming employee birthdays/anniversaries
8. As HR, I need to find all the employees that report to a specific manager

### App Entities
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
				composite: ["employee"],
			},
			sk: {
				field: "sk",
				composite: [],
			},
		},
		coworkers: {
			index: "gsi1pk-gsi1sk-index",
			collection: "workplaces",
			pk: {
				field: "gsi1pk",
				composite: ["office"],
			},
			sk: {
				field: "gsi1sk",
				composite: ["team", "title", "employee"],
			},
		},
		teams: {
			index: "gsi2pk-gsi2sk-index",
			pk: {
				field: "gsi2pk",
				composite: ["team"],
			},
			sk: {
				field: "gsi2sk",
				composite: ["title", "salary", "employee"],
			},
		},
		employeeLookup: {
			collection: "assignements",
			index: "gsi3pk-gsi3sk-index",
			pk: {
				field: "gsi3pk",
				composite: ["employee"],
			},
			sk: {
				field: "gsi3sk",
				composite: [],
			},
		},
		roles: {
			index: "gsi4pk-gsi4sk-index",
			pk: {
				field: "gsi4pk",
				composite: ["title"],
			},
			sk: {
				field: "gsi4sk",
				composite: ["salary", "employee"],
			},
		},
		directReports: {
			index: "gsi5pk-gsi5sk-index",
			pk: {
				field: "gsi5pk",
				composite: ["manager"],
			},
			sk: {
				field: "gsi5sk",
				composite: ["team", "office", "employee"],
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
				composite: ["task"],
			},
			sk: {
				field: "sk",
				composite: ["project", "employee"],
			},
		},
		project: {
			index: "gsi1pk-gsi1sk-index",
			pk: {
				field: "gsi1pk",
				composite: ["project"],
			},
			sk: {
				field: "gsi1sk",
				composite: ["employee", "task"],
			},
		},
		assigned: {
			collection: "assignements",
			index: "gsi3pk-gsi3sk-index",
			pk: {
				field: "gsi3pk",
				composite: ["employee"],
			},
			sk: {
				field: "gsi3sk",
				composite: ["project", "task"],
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
				composite: ["country", "state"],
			},
			sk: {
				field: "sk",
				composite: ["city", "zip", "office"],
			},
		},
		office: {
			index: "gsi1pk-gsi1sk-index",
			collection: "workplaces",
			pk: {
				field: "gsi1pk",
				composite: ["office"],
			},
			sk: {
				field: "gsi1sk",
				composite: [],
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
	}],
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
		city: "tampa",
		zip: "12345",
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
		city: "tampa",
		zip: "12345",
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
1. As a Maintenance Worker, I need to know which stores are currently in each Mall down to the Building they are located.
2. As a Helpdesk Employee, I need to locate related stores in Mall locations by Store Category.
3. As a Property Manager, I need to identify upcoming leases in need of renewal.

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
	"discount": "0.00"
}
```
---
### UPDATE Record
#### Change the Stores Lease Date
>When updating a record, you must include all **Composite Attributes** associated with the table's *primary* **PK** and **SK**.
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
>When retrieving a specific record, you must include all **Composite Attributes** associated with the table's *primary* **PK** and **SK**.
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
>When removing a specific record, you must include all **Composite Attributes** associated with the table's *primary* **PK** and **SK**.
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

### Query Mall Records

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

# Exported TypeScript Types

The following types are exported for easier use while using ElectroDB with TypeScript:

## EntityRecord Type

The EntityRecord type is an object containing every attribute an Entity's model.

_Definition:_

```typescript
type EntityRecord<E extends Entity<any, any, any, any>> =
    E extends Entity<infer A, infer F, infer C, infer S>
        ? Item<A,F,C,S,S["attributes"]>
        : never;
```

_Use:_
```typescript
type EntiySchema = EntityRecord<typeof MyEntity>
```

## EntityItem Type

This type represents an item as it is returned from a query. This is different from the `EntityRecord` in that this type reflects the `required`, `hidden`, `default`, etc properties defined on the attribute.

_Definition:_

```typescript
export type EntityItem<E extends Entity<any, any, any, any>> =
  E extends Entity<infer A, infer F, infer C, infer S>
  ? ResponseItem<A, F, C, S>
  : never;
```

_Use:_

```typescript
type Thing = EntityItem<typeof MyEntityInstance>;
```

## CollectionItem Type

This type represents the value returned from a collection query, and is similar to EntityItem.

_Use:_

```
type CollectionResults = CollectionItem<typeof MyServiceInstance, "collectionName">
``` 

## CreateEntityItem Type

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

## UpdateEntityItem Type

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


## UpdateAddEntityItem Type

This type represents an item that you would pass your entity's `add` method when using `create` or `update`.

_Definition:_
```typescript
export type UpdateAddEntityItem<E extends Entity<any, any, any, any>> =
    E extends Entity<infer A, infer F, infer C, infer S>
        ? AddItem<A, F, C, S>
        : never;

`````

## UpdateSubtractEntityItem Type

This type represents an item that you would pass your entity's `subtract` method when using `create` or `update`.

_Definition:_
```typescript
export type UpdateSubtractEntityItem<E extends Entity<any, any, any, any>> =
    E extends Entity<infer A, infer F, infer C, infer S>
        ? SubtractItem<A, F, C, S>
        : never;
```

## UpdateAppendEntityItem Type

This type represents an item that you would pass your entity's `append` method when using `create` or `update`.

_Definition:_
```typescript
export type UpdateAppendEntityItem<E extends Entity<any, any, any, any>> =
    E extends Entity<infer A, infer F, infer C, infer S>
        ? AppendItem<A, F, C, S>
        : never;
```

## UpdateRemoveEntityItem Type

This type represents an item that you would pass your entity's `remove` method when using `create` or `update`.

_Definition:_
```typescript
export type UpdateRemoveEntityItem<E extends Entity<any, any, any, any>> =
    E extends Entity<infer A, infer F, infer C, infer S>
        ? RemoveItem<A, F, C, S>
        : never;
```

## UpdateDeleteEntityItem Type

This type represents an item that you would pass your entity's `delete` method when using `create` or `update`.

_Definition:_
```typescript
export type UpdateDeleteEntityItem<E extends Entity<any, any, any, any>> =
    E extends Entity<infer A, infer F, infer C, infer S>
        ? DeleteItem<A, F, C, S>
        : never;
```

# Using ElectroDB With Existing Data
When using ElectroDB with an existing table and/or data model, there are a few configurations you may need to make to your ElectroDB model. Read the sections below to see if any of the following cases fits your particular needs.

Whenever using ElectroDB with existing tables/data, it is best to use the [Query Option](#query-options) `ignoreOwnership`. ElectroDB leaves some meta-data on items to help ensure data queried and returned from DynamoDB does not leak between entities. Because your data was not made by ElectroDB, these checks could impede your ability to return data.

```typescript
// when building params
.params({ignoreOwnership: true})
// when querying the table
.go({ignoreOwnership: true})
// when using pagination
.page(null, {ignoreOwnership: true})
```

**Your existing index fields have values with mixed case:**

DynamoDB is case-sensitive, and ElectroDB will lowercase key values by default. In the case where you modeled your data with uppercase, or did not apply case modifications, ElectroDB can be configured to match this behavior. Checkout the second on [Index Casing](#index-casing) to read more. 

**You have index field names that match attribute names:**

With Single Table Design, it is encouraged to give index fields a generic name, like `pk`, `sk`, `gsi1pk`, etc. In reality, it is also common for tables to have index fields that are named after the domain itself, like `accountId`, `organizationId`, etc. 

ElectroDB tries to abstract away your when working with DynamoDB, so instead of defining `pk` or `sk` in your model's attributes, you define them as indexes and map other attributes onto those fields as a composite. Using separate item fields for keys, then for the actual attributes you use in your application, you can leverage more advanced modeling techniques in DynamoDB. 

If your existing table uses non-generic fields that also function as attributes, checkout the section [Attributes as Indexes](#attributes-as-indexes) to learn more about how ElectroDB handles these types of indexes.

# Electro CLI
> _NOTE: The ElectroCLI is currently in a beta phase and subject to change._

Electro is a CLI utility toolbox for extending the functionality of **ElectroDB**. Current functionality of the CLI allows you to:

1. Execute queries against your  `Entities`, `Services`, `Models` directly from the command line.
2. Dynamically stand up an HTTP Service to interact with your `Entities`, `Services`, `Models`.

For usage and installation details you can learn more [here](https://github.com/tywalch/electrocli).

# Version 1 Migration
This section is to detail any breaking changes made on the journey to a stable 1.0 product.

## New schema format/breaking key format change
It became clear when I added the concept of a Service that the "version" paradigm of having the version in the PK wasn't going to work. This is because collection queries use the same PK for all entities and this would prevent some entities in a Service to change versions without impacting the service as a whole. The better more is the place the version in the SK _after_ the entity name so that all version of an entity can be queried. This will work nicely into the migration feature I have planned that will help migrate between model versions.

To address this change, I decide it would be best to change the structure for defining a model, which is then used as heuristic to determine where to place the version in the key (PK or SK). This has the benefit of not breaking existing models, but does increase some complexity in the underlying code.

Additionally, a change was made to the Service class. New Services would take a string of the service name instead of an object as before.

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

## The renaming of index property Facets to Composite and Template

In preparation of moving the codebase to version 1.0, ElectroDB will now accept the `facets` property as either the `composite` and/or `template` properties. Using the `facets` property is still accepted by ElectroDB but will be deprecated sometime in the future (tbd).

This change stems from the fact the `facets` is already a defined term in the DynamoDB space and that definition does not fit the use-case of how ElectroDB uses the term. To avoid confusion from new developers, the `facets` property shall now be called `composite` (as in Composite Attributes) when supplying an Array of attributes, and `template` while supplying a string. These are two independent fields for two reasons:

1. ElectroDB will validate the Composite Attributes provided map to those in the template (more validation is always nice).

2. Allowing for the `composite` array to be supplied independently will allow for Composite Attributes to remained typed even when using a Composite Attribute Template.

## Get Method to Return null

1.0.0 brings back a `null` response from the `get()` method when a record could not be found. Prior to `1.0.0` ElectroDB returned an empty object.

# Coming Soon
- Default query options defined on the `model` to give more general control of interactions with the Entity.
