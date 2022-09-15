---
title: Delete
description: Removing things with ElectroDb
layout: ../../layouts/MainLayout.astro
---

### Delete Method

Provide all Table Index composite attributes in an object to the `delete` method to delete a record.

```javascript
await StoreLocations.delete({
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

### Remove Method

A convenience method for `delete` with ConditionExpression that the item being deleted exists. Provide all Table Index composite attributes in an object to the `remove` method to remove the record.

```javascript
await StoreLocations.remove({
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
//   ConditionExpression: 'attribute_exists(pk) AND attribute_exists(sk)'
// }
```
