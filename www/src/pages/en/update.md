---
title: Update
description: How to update things with ElectroDB
layout: ../../layouts/MainLayout.astro
---

### Update Record

Update Methods are available **_after_** the method `update()` is called, and allow you to perform alter an item stored dynamodb. The methods can be used (and reused) in a chain to form update parameters, when finished with `.params()`, or an update operation, when finished with `.go()`. If your application requires the update method to return values related to the update (e.g. via the `ReturnValues` DocumentClient parameters), you can use the [Query Option](#query-options) `{response: "none" | "all_old" | "updated_old" | "all_new" | "updated_new"}` with the value that matches your need. By default, the Update operation returns an empty object when using `.go()`.

> ElectroDB will validate an attribute's type when performing an operation (e.g. that the `subtract()` method can only be performed on numbers), but will defer checking the logical validity your update operation to the DocumentClient. If your query performs multiple mutations on a single attribute, or perform other illogical operations given nature of an item/attribute, ElectroDB will not validate these edge cases and instead will simply pass back any error(s) thrown by the Document Client.

| Update Method                       | Attribute Types                                             | Parameter  |
| ----------------------------------- | ----------------------------------------------------------- | ---------- |
| [set](#update-method-set)           | `number` `string` `boolean` `enum` `map` `list` `set` `any` | `object`   |
| [remove](#update-method-remove)     | `number` `string` `boolean` `enum` `map` `list` `set` `any` | `array`    |
| [add](#update-method-add)           | `number` `any` `set`                                        | `object`   |
| [subtract](#update-method-subtract) | `number`                                                    | `object`   |
| [append](#update-method-append)     | `any` `list`                                                | `object`   |
| [delete](#update-method-delete)     | `any` `set`                                                 | `object`   |
| [data](#update-method-data)         | `*`                                                         | `callback` |

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

> \_NOTE: Included in the update are all attributes from the table's primary index. These values are automatically included on all updates in the event an update results in an insert.\_\_

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

> _NOTE that the attribute property `required` functions as a sort of `NOT NULL` flag. Because of this, if a property exists as `required:true` it will not be possible to \_remove_ that property in particular. If the attribute is a property is on "map", and the "map" is not required, then the "map" _can_ be removed.\_

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

| operation     | example                              | result                                                                | description                                                                                                                                           |
| ------------- | ------------------------------------ | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `set`         | `set(category, value)`               | `#category = :category0`                                              | Add or overwrite existing value                                                                                                                       |
| `add`         | `add(tenant, name)`                  | `#tenant :tenant1`                                                    | Add value to existing `set` attribute (used when provided attribute is of type `any` or `set`)                                                        |
| `add`         | `add(rent, amount)`                  | `#rent = #rent + :rent0`                                              | Mathematically add given number to existing number on record                                                                                          |
| `subtract`    | `subtract(deposit, amount)`          | `#deposit = #deposit - :deposit0`                                     | Mathematically subtract given number from existing number on record                                                                                   |
| `remove`      | `remove(petFee)`                     | `#petFee`                                                             | Remove attribute/property from item                                                                                                                   |
| `append`      | `append(rentalAgreement, amendment)` | `#rentalAgreement = list_append(#rentalAgreement, :rentalAgreement0)` | Add element to existing `list` attribute                                                                                                              |
| `delete`      | `delete(tenant, name)`               | `#tenant :tenant1`                                                    | Remove item from existing `set` attribute                                                                                                             |
| `del`         | `del(tenant, name)`                  | `#tenant :tenant1`                                                    | Alias for `delete` operation                                                                                                                          |
| `name`        | `name(rent)`                         | `#rent`                                                               | Reference another attribute's name, can be passed to other operation that allows leveraging existing attribute values in calculating new values       |
| `value`       | `value(rent, amount)`                | `:rent1`                                                              | Create a reference to a particular value, can be passed to other operation that allows leveraging existing attribute values in calculating new values |
| `ifNotExists` | `ifNotExists(rent, amount)`          | `#rent = if_not_exists(#rent, :rent0)`                                | Update a property's value only if that property doesn't yet exist on the record                                                                       |

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
await StoreLocations.update({ cityId, mallId, storeId, buildingId })
  .set({ "mapAttribute.mapProperty": "value" })
  .go();

// via Data Method
await StoreLocations.update({ cityId, mallId, storeId, buildingId })
  .data(({ mapAttribute }, { set }) => set(mapAttribute.mapProperty, "value"))
  .go();
```

**Example 2: Removing an element from a `list` attribute**

Specifying an index on a `list` attribute is expressed with square brackets containing the element's index number.

```javascript
// via Chain Method
await StoreLocations.update({ cityId, mallId, storeId, buildingId })
  .remove(["listAttribute[0]"])
  .go();

// via Data Method
await StoreLocations.update({ cityId, mallId, storeId, buildingId })
  .data(({ listAttribute }, { remove }) => remove(listAttribute[0]))
  .go();
```

**Example 3: Adding an item to a `set` attribute, on a `map` attribute, that is an element of a `list` attribute**

All other complex structures are simply variations on the above two examples.

```javascript
// Set values must use the DocumentClient to create a `set`
const newSetValue = StoreLocations.client.createSet("setItemValue");

// via Data Method
await StoreLocations.update({ cityId, mallId, storeId, buildingId })
  .add({ "listAttribute[1].setAttribute": newSetValue })
  .go();

await StoreLocations.update({ cityId, mallId, storeId, buildingId })
  .data(({ listAttribute }, { add }) => {
    add(listAttribute[1].setAttribute, newSetValue);
  })
  .go();
```

### Patch Record

In DynamoDB, `update` operations by default will insert a record if record being updated does not exist. In **_ElectroDB_**, the `patch` method will utilize the `attribute_exists()` parameter dynamically to ensure records are only "patched" and not inserted when updating.

For more detail on how to use the `patch()` method, see the section [Update Record](#update-record) to see all the transferable requirements and capabilities available to `patch()`.
