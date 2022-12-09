---
title: Getting your data with ElectroDB
description: More about params, queries and go
layout: ../../layouts/MainLayout.astro
---

> For hands-on learners: the following example can be followed along with **and** executed on runkit: https://runkit.com/tywalch/electrodb-building-queries

# Building Queries

ElectroDB queries use DynamoDB's `query` method to find records based on your table's indexes.

> _NOTE: By default, ElectroDB will paginate through all items that match your query. To limit the number of items ElectroDB will retrieve, read more about the [Query Options](#query-options) `pages` and `limit`, or use the ElectroDB [Pagination API](#page) for fine-grain pagination support._

Forming a composite **Partition Key** and **Sort Key** is a critical step in planning **Access Patterns** in **DynamoDB**. When planning composite keys, it is crucial to consider the order in which they are _composed_. As of the time of writing this documentation, **DynamoDB** has the following constraints that should be taken into account when planning your **Access Patterns**:

1. You must always supply the **Partition Key** in full for all queries to **DynamoDB**.
2. You currently only have the following operators available on a **Sort Key**: `begins_with`, `between`, `>`, `>=`, `<`, `<=`, and `Equals`.
3. To act on single record, you will need to know the full **Partition Key** and **Sort Key** for that record.

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
        "misc",
      ],
      required: true,
    },
    leaseEndDate: {
      type: "string",
      required: true,
    },
    rent: {
      type: "string",
      required: true,
      validate: /^(\d+\.\d{2})$/,
    },
    discount: {
      type: "string",
      required: false,
      default: "0.00",
      validate: /^(\d+\.\d{2})$/,
    },
  },
  indexes: {
    stores: {
      pk: {
        field: "pk",
        composite: ["cityId", "mallId"],
      },
      sk: {
        field: "sk",
        composite: ["buildingId", "storeId"],
      },
    },
    units: {
      index: "gis1pk-gsi1sk-index",
      pk: {
        field: "gis1pk",
        composite: ["mallId"],
      },
      sk: {
        field: "gsi1sk",
        composite: ["buildingId", "unitId"],
      },
    },
    leases: {
      index: "gis2pk-gsi2sk-index",
      pk: {
        field: "gis2pk",
        composite: ["storeId"],
      },
      sk: {
        field: "gsi2sk",
        composite: ["leaseEndDate"],
      },
    },
  },
};
const StoreLocations = new Entity(schema, { table: "StoreDirectory" });
```

### Query App Records

> Examples in this section using the `MallStore` schema defined [above](#shopping-mall-stores), and available for interacting with here: https://runkit.com/tywalch/electrodb-building-queries

All queries start from the Access Pattern defined in the schema.

```javascript
const MallStore = new Entity(schema, { table: "StoreDirectory" });
// Each Access Pattern is available on the Entity instance
// MallStore.query.stores()
// MallStore.query.malls()
```

#### Partition Key Composite Attributes

All queries require (_at minimum_) the **Composite Attributes** included in its defined **Partition Key**. **Composite Attributes** you define on the **Sort Key** can be partially supplied, but must be supplied in the order they are defined.

> \*IMPORTANT: Composite Attributes must be supplied in the order they are composed when invoking the **Access Pattern\***. This is because composite attributes are used to form a concatenated key string, and if attributes supplied out of order, it is not possible to fill the gaps in that concatenation.

```javascript
const MallStore = new Entity(
  {
    model: {
      service: "mallmgmt",
      entity: "store",
      version: "1",
    },
    attributes: {
      cityId: "string",
      mallId: "string",
      storeId: "string",
      buildingId: "string",
      unitId: "string",
      name: "string",
      description: "string",
      category: "string",
    },
    indexes: {
      stores: {
        pk: {
          field: "pk",
          composite: ["cityId", "mallId"],
        },
        sk: {
          field: "sk",
          composite: ["storeId", "unitId"],
        },
      },
    },
  },
  { table: "StoreDirectory" }
);

const cityId = "Atlanta1";
const mallId = "EastPointe";
const storeId = "LatteLarrys";
const unitId = "B24";
const buildingId = "F34";

// Good: Includes at least the PK
StoreLocations.query.stores({ cityId, mallId });

// Good: Includes at least the PK, and the first SK attribute
StoreLocations.query.stores({ cityId, mallId, storeId });

// Good: Includes at least the PK, and the all SK attributes
StoreLocations.query.stores({ cityId, mallId, storeId, unitId });

// Bad: No PK composite attributes specified, will throw
StoreLocations.query.stores();

// Bad: Not All PK Composite Attributes included (cityId), will throw
StoreLocations.query.stores({ mallId });

// Bad: Composite Attributes not included in order, will NOT throw, but will ignore `unitId` because `storeId` was not supplied as well
StoreLocations.query.stores({ cityId, mallId, unitId });
```

### Sort Key Operations

|  operator | use case                                           |
| --------: | -------------------------------------------------- |
|  `begins` | Keys starting with a particular set of characters. |
| `between` | Keys between a specified range.                    |
|      `gt` | Keys less than some value                          |
|     `gte` | Keys less than or equal to some value              |
|      `lt` | Keys greater than some value                       |
|     `lte` | Keys greater than or equal to some value           |

Each record represents one Store location. All Stores are located in Malls we manage.

To satisfy requirements for searching based on location, you could use the following keys: Each `StoreLocations` record would have a **Partition Key** with the store's `storeId`. This key alone is not enough to identify a particular store. To solve this, compose a **Sort Key** for the store's location attribute ordered hierarchically (mall/building/unit): `["mallId", "buildingId", "unitId"]`.

The `StoreLocations` entity above, using just the `stores` **Index** alone enables four **Access Patterns**:

1. All `LatteLarrys` locations in all _Malls_
2. All `LatteLarrys` locations in one _Mall_
3. All `LatteLarrys` locations inside a specific _Mall_
4. A specific `LatteLarrys` inside of a _Mall_ and _Building_

## Query Chains

Queries in **_ElectroDB_** are built around the **Access Patterns** defined in the Schema and are capable of using partial key **Composite Attributes** to create performant lookups. To accomplish this, **_ElectroDB_** offers a predictable chainable API.

> Examples in this section using the `StoreLocations` schema defined [above](#shopping-mall-stores) and can be directly experiment with on runkit: https://runkit.com/tywalch/electrodb-building-queries

The methods: Get (`get`), Create (`put`), Update (`update`), and Delete (`delete`) \*_require_ all composite attributes described in the Entities' primary `PK` and `SK`.

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
  cityId: "Atlanta1",
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
    cityId: "Atlanta1",
  },
  {
    storeId: "MochaJoes",
    mallId: "WestEnd",
    buildingId: "A21",
    cityId: "Madison2",
  },
]).go({ concurrent: 1 }); // `concurrent` value is optional and default's to `1`

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

> _NOTE: By default ElectroDB will return items without concern for order. If the order returned by ElectroDB must match the order provided, the [query option](#query-options) `preserveBatchOrder` can be used. When enabled, ElectroDB will ensure the order returned by a batchGet will be the same as the order provided. When enabled, if a record is returned from DynamoDB as "unprocessed" ([read more here](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_BatchGetItem.html)), ElectroDB will return a null value at that index._

Elements of the `unprocessed` array are unlike results received from a query. Instead of containing all the attributes of a record, an unprocessed record only includes the composite attributes defined in the Table Index. This is in keeping with DynamoDB's practice of returning only Keys in the case of unprocessed records. For convenience, ElectroDB will return these keys as composite attributes, but you can pass the [query option](#query-options) `{unprocessed:"raw"}` override this behavior and return the Keys as they came from DynamoDB.
