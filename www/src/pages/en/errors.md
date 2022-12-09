---
title: Errors
description: Errors from ElectroDB
layout: ../../layouts/MainLayout.astro
---

# Errors:

| Error Code | Description          |
| :--------: | -------------------- |
|   1000s    | Configuration Errors |
|   2000s    | Invalid Queries      |
|   3000s    | User Defined Errors  |
|   4000s    | DynamoDB Errors      |
|   5000s    | Unexpected Errors    |

### No Client Defined On Model

_Code: 1001_

_Why this occurred:_
If a DynamoDB DocClient is not passed to the constructor of an Entity or Service (`client`), ElectroDB will be unable to query DynamoDB. This error will only appear when a query(using `go()`) is made because ElectroDB is still useful without a DocClient through the use of it's `params()` method.

_What to do about it:_
For an Entity be sure to pass the DocClient as the second param to the constructor:

```javascript
new Entity(schema, { client });
```

For a Service, the client is passed the same way, as the second param to the constructor:

```javascript
new Service("", { client });
```

### Invalid Identifier

_Code: 1002_

_Why this occurred:_
You tried to modify the entity identifier on an Entity.

_What to do about it:_
Make sure you have spelled the identifier correctly or that you actually passed a replacement.

### Invalid Key Composite Attribute Template

_Code: 1003_

_Why this occurred:_
You are trying to use the custom Key Composite Attribute Template, and the format you passed is invalid.

_What to do about it:_
Checkout the section on [Composite Attribute Templates](#composite attribute-templates) and verify your template conforms to the rules detailed there.

### Duplicate Indexes

_Code: 1004_

_Why this occurred:_
Your model contains duplicate indexes. This could be because you accidentally included an index twice or even forgot to add an index name on a secondary index, which would be interpreted as "duplicate" to the Table's Primary index.

_What to do about it:_
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

_Code: 1005_

_Why this occurred:_
You have added a `collection` to an index that does not have an SK. Because Collections are used to help query across entities via the Sort Key, not having a Sort Key on an index defeats the purpose of a Collection.

_What to do about it:_
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

_Code: 1006_

_Why this occurred:_
You have assigned the same collection name to multiple indexes. This is not allowed because collection names must be unique.

_What to do about it:_
Determine a new naming scheme

### Missing Primary Index

_Code: 1007_

_Why this occurred:_
DynamoDB requires the definition of at least one Primary Index on the table. In Electro this is defined as an Index _without_ an `index` property. Each model needs at least one, and the composite attributes used for this index must ensure each composite represents a unique record.

_What to do about it:_
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

_Code: 1008_

_Why this occurred:_
Some attribute on your model has an invalid configuration.

_What to do about it:_
Use the error to identify which column needs to examined, double-check the properties on that attribute. Checkout the section on [Attributes](#attributes) for more information on how they are structured.

### Invalid Model

_Code: 1009_

_Why this occurred:_
Some properties on your model are missing or invalid.

_What to do about it:_
Checkout the section on [Models](#model) to verify your model against what is expected.

### Invalid Options

_Code: 1010_

_Why this occurred:_
Some properties on your options object are missing or invalid.

_What to do about it:_
Checkout the section on [Model/Service Options](#service-options) to verify your model against what is expected.

### Duplicate Index Fields

_Code: 1014_

_Why this occurred:_
An Index in your model references the same field twice across indexes. The `field` property in the definition of an index is a mapping to the name of the field assigned to the PK or SK of an index.

_What to do about it:_
This is likely a typo, if not double-check the names of the fields you assigned to be the PK and SK of your index, these field names must be unique.

### Duplicate Index Composite Attributes

_Code: 1015_

_Why this occurred:_
Within one index you tried to use the same composite attribute in both the PK and SK. A composite attribute may only be used once within an index. With ElectroDB it is not uncommon to use the same value as both the PK and SK when a Sort Key exists on a table -- this usually is done because some value is required in that column but for that entity it is not necessary. If this is your situation remember that ElectroDB does put a value in the SortKey even if does not include a composite attribute, checkout [this section](#collection-without-an-sk) for more information.

_What to do about it:_
Determine how you can change your access pattern to not duplicate the composite attribute. Remember that an empty array for an SK is valid.

### Incompatible Key Composite Attribute Template

_Code: 1017_

_Why this occurred:_
You are trying to use the custom Key Composite Attribute Template, and a Composite Attribute Array on your model, and they do not contain identical composite attributes.

_What to do about it:_
Checkout the section on [Composite Attribute Templates](#composite attribute-templates) and verify your template conforms to the rules detailed there. Both properties must contain the same attributes and be provided in the same order.

### Invalid Index With Attribute Name

_Code: 1018_

_Why this occurred:_
ElectroDB's design revolves around best practices related to modeling in single table design. This includes giving indexed fields generic names. If the PK and SK fields on your table indexes also match the names of attributes on your Entity you will need to make special considerations to make sure ElectroDB can accurately map your data.

_What to do about it:_
Checkout the section [Using ElectroDB with existing data](#using-electrodb-with-existing-data) to learn more about considerations to make when using attributes as index fields.

### Invalid Collection on Index With Attribute Field Names

_Code: 1019_

_Why this occurred:_
Collections allow for unique access patterns to be modeled between entities. It does this by appending prefixes to your key composites. If an Entity leverages an attribute field as an index key, ElectroDB will be unable to prefix your value because that would result in modifying the value itself.

_What to do about it:_
Checkout the section [Collections](#collections) to learn more about collections, as well as the section [Using ElectroDB with existing data](#using-electrodb-with-existing-data) to learn more about considerations to make when using attributes as index fields.

### Missing Composite Attributes

_Code: 2002_

_Why this occurred:_
The current request is missing some composite attributes to complete the query based on the model definition. Composite Attributes are used to create the Partition and Sort keys. In DynamoDB Partition keys cannot be partially included, and Sort Keys can be partially include they must be at least passed in the order they are defined on the model.

_What to do about it:_
The error should describe the missing composite attributes, ensure those composite attributes are included in the query or update the model to reflect the needs of the access pattern.

### Missing Table

*Code: 2003*f

_Why this occurred:_
You never specified a Table for DynamoDB to use.

_What to do about it:_
Tables can be defined on the [Service Options](#service-options) object when you create an Entity or Service, or if that is not known at the time of creation, it can be supplied as a [Query Option](#query-options) and supplied on each query individually. If can be supplied on both, in that case the Query Option will override the Service Option.

### Invalid Concurrency Option

_Code: 2004_

_Why this occurred:_
When performing a bulk operation ([Batch Get](#batch-get), [Batch Delete Records](#batch-write-delete-records), [Batch Put Records](#batch-write-put-records)) you can pass a [Query Options](#query-options) called `concurrent`, which impacts how many batch requests can occur at the same time. Your value should pass the test of both, `!isNaN(parseInt(value))` and `parseInt(value) > 0`.

_What to do about it:_  
Expect this error only if you're providing a `concurrency` option. Double-check the value you are providing is the value you expect to be passing, and that the value passes the tests listed above.

### Invalid Pages Option

_Code: 2005_

_Why this occurred:_
When performing a query [Query](#building-queries) you can pass a [Query Options](#query-options) called `pages`, which impacts how many DynamoDB pages a query should iterate through. Your value should pass the test of both, `!isNaN(parseInt(value))` and `parseInt(value) > 0`.

_What to do about it:_
Expect this error only if you're providing a `pages` option. Double-check the value you are providing is the value you expect to be passing, and that the value passes the tests listed above.

### Invalid Limit Option

_Code: 2006_

_Why this occurred:_
When performing a query [Query](#building-queries) you can pass a [Query Options](#query-options) called `limit`, which impacts how many DynamoDB items a query should return. Your value should pass the test of both, `!isNaN(parseInt(value))` and `parseInt(value) > 0`.

_What to do about it:_
Expect this error only if you're providing a `limit` option. Double-check the value you are providing is the value you expect to be passing, and that the value passes the tests listed above.

### Invalid Attribute

_Code: 3001_

_Why this occurred:_
The value received for a validation either failed type expectations (e.g. a "number" instead of a "string"), or the user provided "validate" callback on an attribute rejected a value.

_What to do about it:_
Examine the error itself for more precise detail on why the failure occurred. The error object itself should have a property called "fields" which contains an array of every attribute that failed validation, and a reason for each. If the failure originated from a "validate" callback, the originally thrown error will be accessible via the `cause` property the corresponding element within the fields array.1

Below is the type definition for an ElectroValidationError:

```typescript
ElectroValidationError<T extends Error = Error> extends ElectroError {
    readonly name: "ElectroValidationError"
    readonly code: number;
    readonly date: number;
    readonly isElectroError: boolean;
    ref: {
        readonly code: number;
        readonly section: string;
        readonly name: string;
        readonly sym: unique symbol;
    }
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

_Code: 4001_

_Why this occurred:_
DynamoDB did not like something about your query.

_What to do about it:_
By default ElectroDB tries to keep the stack trace close to your code, ideally this can help you identify what might be going on. A tip to help with troubleshooting: use `.params()` to get more insight into how your query is converted to DocClient params.

### Unknown Errors

### Invalid Last Evaluated Key

_Code: 5003_

_Why this occurred:_
_Likely_ you were calling `.page()` on a `scan`. If you weren't please make an issue and include as much detail about your query as possible.

_What to do about it:_
When paginating with _scan_ queries, it is highly recommended that the query option, `{pager: "raw"}`. This is because when using scan on large tables the docClient may return an ExclusiveStartKey for a record that does not belong to entity making the query (regardless of the filters set). In these cases ElectroDB will return null (to avoid leaking the keys of other entities) when further pagination may be needed to find your records.

```javascript
// example
myModel.scan.page(null, { pager: "raw" });
```

### No Owner For Pager

_Code: 5004_

_Why this occurred:_
When using pagination with a Service, ElectroDB will try to identify which Entity is associated with the supplied pager. This error can occur when you supply an invalid pager, or when you are using a different [pager option](#pager-query-options) to a pager than what was used when retrieving it. Consult the section on [Pagination](#page) to learn more.

_What to do about it:_
If you are sure the pager you are passing to `.page()` is the same you received from `.page()` this could be an unexpected error. To mitigate the issue use the Query Option `{pager: "raw"}` and please open a support issue.

### Pager Not Unique

_Code: 5005_

_Why this occurred:_
When using pagination with a Service, ElectroDB will try to identify which Entity is associated with the supplied [pager option](#pager-query-options). This error can occur when you supply a pager that resolves to more than one Entity. This can happen if your entities share the same composite attributes for the index you are querying on, and you are using the Query Option `{pager: "item""}`.

_What to do about it:_
Because this scenario is possible with otherwise well considered/thoughtful entity models, the default `pager` type used by ElectroDB is `"named"`. To avoid this error, you will need to use either the `"raw"` or `"named"` [pager options](#pager-query-options) for any index that could result in an ambiguous Entity owner.
