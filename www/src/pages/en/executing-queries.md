---
title: Executing Queries
description: How to actually execute your queries
layout: ../../layouts/MainLayout.astro
---

## Execute Queries

All query chains end with either a `.go()`, `.params()`, or `page()` method invocation. These terminal methods will either execute the query to DynamoDB (`.go()`) or return formatted parameters for use with the DynamoDB docClient (`.params()`).

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
  .between({ leaseEndDate: "2020-06-01" }, { leaseEndDate: "2020-07-31" })
  .filter(({ rent }) => rent.lte("5000.00"))
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
let [next, stores] = await MallStores.query.leases({ mallId }).page(); // no "pager" passed to `.page()`

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

> _NOTE: Because the "pager" object is destructured from the keys DynamoDB returns as the `LastEvaluatedKey`, these composite attributes differ from the record's actual attribute values in one important way: Their string values will all be lowercase. If you intend to use these attributes in ways where their casing \_will_ matter (e.g. in a `where` filter), keep in mind this may result in unexpected outcomes.\_

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

**"item":** Similar to "named", however without the Entity's "identifiers". If two Entities with a service have otherwise identical index definitions, using the "item" pager option can result in errors while paginating a Collection. If this is not a concern with your Service, or you are paginating with only an Entity, this option could be preferable because it has fewer properties.

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
    let [next, results] = await MallStores.query.leases({ mallId }).page(pager);
    stores = [...stores, ...results];
    pager = next;
  } while (pager !== null);

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
await StoreLocations.query.leases({ storeId }).go();

// Lease Agreement by StoreId for March 22nd 2020
await StoreLocations.query.leases({ storeId, leaseEndDate: "2020-03-22" }).go();

// Lease agreements by StoreId for 2020
await StoreLocations.query
  .leases({ storeId })
  .begins({ leaseEndDate: "2020" })
  .go();

// Lease Agreements by StoreId after March 2020
await StoreLocations.query
  .leases({ storeId })
  .gt({ leaseEndDate: "2020-03" })
  .go();

// Lease Agreements by StoreId after, and including, March 2020
await StoreLocations.query
  .leases({ storeId })
  .gte({ leaseEndDate: "2020-03" })
  .go();

// Lease Agreements by StoreId before 2021
await StoreLocations.query
  .leases({ storeId })
  .lt({ leaseEndDate: "2021-01" })
  .go();

// Lease Agreements by StoreId before February 2021
await StoreLocations.query
  .leases({ storeId })
  .lte({ leaseEndDate: "2021-02" })
  .go();

// Lease Agreements by StoreId between 2010 and 2020
await StoreLocations.query
  .leases({ storeId })
  .between({ leaseEndDate: "2010" }, { leaseEndDate: "2020" })
  .go();

// Lease Agreements by StoreId after, and including, 2010 in the city of Atlanta and category containing food
await StoreLocations.query
  .leases({ storeId })
  .gte({ leaseEndDate: "2010" })
  .where(
    (attr, op) => `
        ${op.eq(attr.cityId, "Atlanta1")} AND ${op.contains(
      attr.category,
      "food"
    )}
    `
  )
  .go();

// Rents by City and Store who's rent discounts match a certain rent/discount criteria
await StoreLocations.query
  .units({ mallId })
  .begins({ leaseEndDate: june })
  .rentDiscount(discount, maxRent, minRent)
  .go();

// Stores by Mall matching a specific category
await StoreLocations.query.units({ mallId }).byCategory("food/coffee").go();
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
  logger?: (event) => void;
  listeners Array<(event) => void>;
  preserveBatchOrder?: boolean;
  attributes?: string[];
};
```

| Option             |       Default        | Description                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------ | :------------------: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| params             |         `{}`         | Properties added to this object will be merged onto the params sent to the document client. Any conflicts with **ElectroDB** will favor the params specified here.                                                                                                                                                                                                                 |
| table              | _(from constructor)_ | Use a different table than the one defined in the [Service Options](#service-options)                                                                                                                                                                                                                                                                                              |
| attributes         |  _(all attributes)_  | The `attributes` query option allows you to specify ProjectionExpression Attributes for your `get` or `query` operation. As of `1.11.0` only root attributes are allowed to be specified.                                                                                                                                                                                          |
| raw                |       `false`        | Returns query results as they were returned by the docClient.                                                                                                                                                                                                                                                                                                                      |
| includeKeys        |       `false`        | By default, **ElectroDB** does not return partition, sort, or global keys in its response.                                                                                                                                                                                                                                                                                         |
| pager              |      `"named"`       | Used in with pagination (`.pages()`) calls to override ElectroDBs default behaviour to break apart `LastEvaluatedKeys` records into composite attributes. See more detail about this in the sections for [Pager Query Options](#pager-query-options).                                                                                                                              |
| originalErr        |       `false`        | By default, **ElectroDB** alters the stacktrace of any exceptions thrown by the DynamoDB client to give better visibility to the developer. Set this value equal to `true` to turn off this functionality and return the error unchanged.                                                                                                                                          |
| concurrent         |         `1`          | When performing batch operations, how many requests (1 batch operation == 1 request) to DynamoDB should ElectroDB make at one time. Be mindful of your DynamoDB throughput configurations                                                                                                                                                                                          |
| unprocessed        |       `"item"`       | Used in batch processing to override ElectroDBs default behaviour to break apart DynamoDBs `Unprocessed` records into composite attributes. See more detail about this in the sections for [BatchGet](#batch-get), [BatchDelete](#batch-write-delete-records), and [BatchPut](#batch-write-put-records).                                                                           |
| response           |     `"default"`      | Used as a convenience for applying the DynamoDB parameter `ReturnValues`. The options here are the same as the parameter values for the DocumentClient except lowercase. The `"none"` option will cause the method to return null and will bypass ElectroDB's response formatting -- useful if formatting performance is a concern.                                                |
| ignoreOwnership    |       `false`        | By default, **ElectroDB** interrogates items returned from a query for the presence of matching entity "identifiers". This helps to ensure other entities, or other versions of an entity, are filtered from your results. If you are using ElectroDB with an existing table/dataset you can turn off this feature by setting this property to `true`.                             |
| limit              |        _none_        | A target for the number of items to return from DynamoDB. If this option is passed, Queries on entities and through collections will paginate DynamoDB until this limit is reached or all items for that query have been returned.                                                                                                                                                 |
| pages              |          ∞           | How many DynamoDB pages should a query iterate through before stopping. By default ElectroDB paginate through all results for your query.                                                                                                                                                                                                                                          |
| listeners          |         `[]`         | An array of callbacks that are invoked when [internal ElectroDB events](#events) occur.                                                                                                                                                                                                                                                                                            |
| logger             |        _none_        | A convenience option for a single event listener that semantically can be used for logging.                                                                                                                                                                                                                                                                                        |
| preserveBatchOrder |       `false`        | When used with a [batchGet](#batch-get) operation, ElectroDB will ensure the order returned by a batchGet will be the same as the order provided. When enabled, if a record is returned from DynamoDB as "unprocessed" ([read more here](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_BatchGetItem.html)), ElectroDB will return a null value at that index. |
