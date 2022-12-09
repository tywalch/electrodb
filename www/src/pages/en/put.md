---
title: Put
description: Adding items with ElectroDb
layout: ../../layouts/MainLayout.astro
---

### Put Record

Provide all _required_ Attributes as defined in the model to create a new record. **ElectroDB** will enforce any defined validations, defaults, casting, and field aliasing. A Put operation will trigger the `default`, and `set` attribute callbacks when writing to DynamoDB. By default, after performing a `put()` or `create()` operation, ElectroDB will format and return the record through the same process as a Get/Query. This process will invoke the `get` callback on all included attributes. If this behaviour is not desired, use the [Query Option](#query-options) `response:"none"` to return a null value.

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

Provide all _required_ Attributes as defined in the model to create records as an _array_ to `.put()`. **ElectroDB** will enforce any defined validations, defaults, casting, and field aliasing. Another convenience ElectroDB provides, is accepting BatchWrite arrays _larger_ than the 25 record limit. This is achieved making multiple, "parallel", requests to DynamoDB for batches of 25 records at a time. A failure with any of these requests will cause the query to throw, so be mindful of your table's configured throughput.

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
