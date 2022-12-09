---
title: Indexes
description: How indexes work in DynamoDB
layout: ../../layouts/MainLayout.astro
---

## Indexes

When using ElectroDB, indexes are referenced by their `AccessPatternName`. This allows you to maintain generic index names on your DynamoDB table, but reference domain specific names while using your ElectroDB Entity. These will often be referenced as _"Access Patterns"_.

All DynamoDB table start with at least a PartitionKey with an optional SortKey, this can be referred to as the _"Table Index"_. The `indexes` object requires at least the definition of this _Table Index_ **Partition Key** and (if applicable) **Sort Key**.

In your model, the _Table Index_ this is expressed as an _Access Pattern_ _without_ an `index` property. For Secondary Indexes (both GSIs and LSIs), use the `index` property to define the name of the index as defined on your DynamoDB table.

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

| Property       |                 Type                 | Required | Description                                                                                                                                                                                                                                                                                                                     |
| -------------- | :----------------------------------: | :------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pk`           |               `object`               |   yes    | Configuration for the pk of that index or table                                                                                                                                                                                                                                                                                 |
| `pk.composite` |              `string[]`              |   yes    | An array that represents the order in which attributes are concatenated to composite attributes the key (see [Composite Attributes](#composite-attributes) below for more on this functionality).                                                                                                                               |
| `pk.template`  |               `string`               |    no    | A string that represents the template in which attributes composed to form a key (see [Composite Attribute Templates](#composite-attribute-templates) below for more on this functionality).                                                                                                                                    |
| `pk.field`     |               `string`               |   yes    | The name of the attribute as it exists in DynamoDB, if named differently in the schema attributes.                                                                                                                                                                                                                              |
| `pk.casing`    | `default`, `upper`, `lower`, `none`  |    no    | Choose a case for ElectroDB to convert your keys to, to avoid casing pitfalls when querying data. Default: `lower`.                                                                                                                                                                                                             |
| `sk`           |               `object`               |    no    | Configuration for the sk of that index or table                                                                                                                                                                                                                                                                                 |
| `sk.composite` |              `string[]`              |    no    | Either an Array that represents the order in which attributes are concatenated to composite attributes the key, or a String for a composite attribute template. (see [Composite Attributes](#composite-attributes) below for more on this functionality).                                                                       |
| `sk.template`  |               `string`               |    no    | A string that represents the template in which attributes composed to form a key (see [Composite Attribute Templates](#composite-attribute-templates) below for more on this functionality).                                                                                                                                    |
| `sk.field`     |               `string`               |   yes    | The name of the attribute as it exists in DynamoDB, if named differently in the schema attributes.                                                                                                                                                                                                                              |
| `pk.casing`    | `default`, `upper`, `lower`, `none`, |    no    | Choose a case for ElectroDB to convert your keys to, to avoid casing pitfalls when querying data. Default: `lower`.                                                                                                                                                                                                             |
| `index`        |               `string`               |    no    | Required when the `Index` defined is a _Secondary Index_; but is left blank for the table's primary index.                                                                                                                                                                                                                      |
| `collection`   |         `string`, `string[]`         |    no    | Used when models are joined to a `Service`. When two entities share a `collection` on the same `index`, they can be queried with one request to DynamoDB. The name of the collection should represent what the query would return as a pseudo `Entity`. (see [Collections](#collections) below for more on this functionality). |

### Indexes Without Sort Keys

When using indexes without Sort Keys, that should be expressed as an index _without_ an `sk` property at all. Indexes without an `sk` cannot have a collection, see [Collections](#collections) for more detail.

> _NOTE: It is generally recommended to always use Sort Keys when using ElectroDB as they allow for more advanced query opportunities. Even if your model doesn't \_need_ an additional property to define a unique record, having an `sk` with no defined composite attributes (e.g. an empty array) still opens the door to many more query opportunities like [collections](#collections).\_

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

When using indexes with Sort Keys, that should be expressed as an index _with_ an `sk` property. If you don't wish to use the Sort Key in your model, but it does exist on the table, simply use an empty for the `composite` property. An empty array is still very useful, and opens the door to more query opportunities and access patterns like [collections](#collections).

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
    version: "1",
  },
  attributes: {
    number1: {
      type: "number", // defined as number
    },
    number2: {
      type: "number", // defined as number
    },
  },
  indexes: {
    record: {
      pk: {
        field: "pk",
        template: "${number1}", // will build PK as numeric value
      },
      sk: {
        field: "sk",
        template: "${number2}", // will build SK as numeric value
      },
    },
  },
};
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

| Casing Option | Effect                                                 |
| :-----------: | ------------------------------------------------------ |
|   `default`   | The default for keys is lowercase, or `lower`          |
|    `lower`    | Will convert the key to lowercase prior it its use     |
|    `upper`    | Will convert the key to uppercase prior it its use     |
|    `none`     | Will not perform any casing changes when building keys |
