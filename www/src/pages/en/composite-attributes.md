---
title: Composite Attributes
description: Composite Attributes
layout: ../../layouts/MainLayout.astro
---

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

Attributes are identified by surrounding the attribute with `${...}` braces. For example, the syntax `${storeId}` will match `storeId` attribute in the model.

Convention for a composing a key use the `#` symbol to separate attributes, and for labels to attach with underscore. For example, when composing both the `mallId` and `buildingId` would be expressed as `mid_${mallId}#bid_${buildingId}`.

> _NOTE: ***ElectroDB*** will not prefix templated keys with the Entity, Project, Version, or Collection. This will give you greater control of your keys but will limit ***ElectroDB's*** ability to prevent leaking entities with some queries._

ElectroDB will continue to always add a trailing delimiter to composite attributes with keys are partially supplied. The section on [BeginsWith Queries](#begins-with-queries) goes into more detail about how **_ElectroDB_** builds indexes from composite attributes.

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

> _NOTE: If you have the unique opportunity to use ElectroDB with a new project, it is strongly recommended to use generically named index fields that are separate from your business attributes._

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

[![Try it out!](https://img.shields.io/badge/electrodb-try_out_this_example_›-%23f9bd00?style=for-the-badge&logo=amazondynamodb&labelColor=1a212a)](https://electrodb.fun/?#code/JYWwDg9gTgLgBAbwKIDsbBgTwL5wGZQQhwDkApgDZkDGMhAJgEYkDcAUG9RCgM7zAoAbmTTRMcALxwUZAO5xU6LAAoEbOHBAR6lAFyJ1GuCKWZ9AIkwQArlAD6JjJjsoAhiDLmANIY08yUILA1GQWVrZ2-oHBZC7unj5GcMJQPMDcFgCM5obYiXCuMHTAjNYwZDz6akmu1FzWaACS9FW+RlhgoXDmfFACAOY5SXltYAzWtABy1iCMAa1JGh1d5igzc1BDRti5+QI6AB4VC0Zj2hMwlQaLcGAA1ic3eMCULd219U303m1JXOAQNLlfQAbXMHxsX3MAF1fnARjceA9rjd8C8KG9zGd6BdprMAj9UXB-pAgV0wdjcesCbCbjthrk2HlEDBXIwqPoSCBMAAVNlUEjYACU7E43D4BTqkJgzUk7zqMAAtAAWACsAGYAAzmdhcXjwSlTalQOUAJk1msyooEwlEUEwhgAdGAyqpJZ8ZfQvLdxkb8SbhU7+hBlCKODaTGJHQBHawBB1JZ2+y6qCENT2BxPB0PsIA)

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
await myEntity
  .get({
    accountId: "1111-2222-3333-4444",
    organizationId: "AAAA-BBBB-CCCC-DDDD",
  })
  .go();
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
