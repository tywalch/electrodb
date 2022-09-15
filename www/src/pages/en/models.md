---
title: Models
description: Models, attributes and attribute watching
layout: ../../layouts/MainLayout.astro
---

## Model

Create an Entity's schema. In the below example.

```javascript
const DynamoDB = require("aws-sdk/clients/dynamodb");
const { Entity, Service } = require("electrodb");
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
      default: () => uuid(),
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
      type: [
        "development",
        "marketing",
        "finance",
        "product",
        "cool cats and kittens",
      ],
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
      validate: /^\d{4}-\d{2}-\d{2}$/gi,
    },
    birthday: {
      type: "string",
      validate: /^\d{4}-\d{2}-\d{2}$/gi,
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
      default: () => uuid(),
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

| Property      | Description                                                                                                 |
| ------------- | ----------------------------------------------------------------------------------------------------------- |
| model.service | Name of the application using the entity, used to namespace all entities                                    |
| model.entity  | Name of the entity that the schema represents                                                               |
| model.version | (optional) The version number of the schema, used to namespace keys                                         |
| attributes    | An object containing each attribute that makes up the schema                                                |
| indexes       | An object containing table indexes, including the values for the table's default Partition Key and Sort Key |

### Service Options

Optional second parameter

| Property | Description                                                                                                                                                                                                                              |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| table    | The name of the dynamodb table in aws.                                                                                                                                                                                                   |
| client   | (optional) An instance of the `docClient` from the `aws-sdk` for use when querying a DynamoDB table. This is optional if you wish to only use the `params` functionality, but required if you actually need to query against a database. |

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

| Property     | Type                                                       | Required | Types     | Description                                                                                                                                                                                                                                                                                                                                      |
| ------------ | ---------------------------------------------------------- | -------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `type`       | `string`, `ReadonlyArray<string>`, `string[]`              | yes      | all       | Accepts the values: `"string"`, `"number"` `"boolean"`, `"map"`, `"list"`, `"set"`, an array of strings representing a finite list of acceptable values: `["option1", "option2", "option3"]`, or `"any"` which disables value type checking on that attribute.                                                                                   |
| `required`   | `boolean`                                                  | no       | all       | Flag an attribute as required to be present when creating a record. This attribute also acts as a type of `NOT NULL` flag, preventing it from being removed directly. When applied to nested properties, be mindful that default map values can cause required child attributes to fail validation.                                              |
| `hidden`     | `boolean`                                                  | no       | all       | Flag an attribute as hidden to remove the property from results before they are returned.                                                                                                                                                                                                                                                        |
| `default`    | `value`, `() => value`                                     | no       | all       | Either the default value itself or a synchronous function that returns the desired value. Applied before `set` and before `required` check. In the case of nested attributes, default values will apply defaults to children attributes until an undefined value is reached                                                                      |
| `validate`   | `RegExp`, `(value: any) => void`, `(value: any) => string` | no       | all       | Either regex or a synchronous callback to return an error string (will result in exception using the string as the error's message), or thrown exception in the event of an error.                                                                                                                                                               |
| `field`      | `string`                                                   | no       | all       | The name of the attribute as it exists in DynamoDB, if named differently in the schema attributes. Defaults to the `AttributeName` as defined in the schema.                                                                                                                                                                                     |
| `readOnly`   | `boolean`                                                  | no       | all       | Prevents an attribute from being updated after the record has been created. Attributes used in the composition of the table's primary Partition Key and Sort Key are read-only by default. The one exception to `readOnly` is for properties that also use the `watch` property, read [attribute watching](#attribute-watching) for more detail. |
| `label`      | `string`                                                   | no       | all       | Used in index composition to prefix key composite attributes. By default, the `AttributeName` is used as the label.                                                                                                                                                                                                                              |
| `cast`       | `"number"`, `"string"`, `"boolean"`                        | no       | all       | Optionally cast attribute values when interacting with DynamoDB. Current options include: "number", "string", and "boolean".                                                                                                                                                                                                                     |
| `set`        | `(attribute, schema) => value`                             | no       | all       | A synchronous callback allowing you to apply changes to a value before it is set in params or applied to the database. First value represents the value passed to ElectroDB, second value are the attributes passed on that update/put                                                                                                           |
| `get`        | `(attribute, schema) => value`                             | no       | all       | A synchronous callback allowing you to apply changes to a value after it is retrieved from the database. First value represents the value passed to ElectroDB, second value are the attributes retrieved from the database.                                                                                                                      |
| `watch`      | `Attribute[], "*"`                                         | no       | root-only | Define other attributes that will always trigger your attribute's getter and setter callback after their getter/setter callbacks are executed. Only available on root level attributes.                                                                                                                                                          |
| `properties` | `{[key: string]: Attribute}`                               | yes\*    | map       | Define the properties available on a `"map"` attribute, required if your attribute is a map. Syntax for map properties is the same as root level attributes.                                                                                                                                                                                     |
| `items`      | `Attribute`                                                | yes\*    | list      | Define the attribute type your list attribute will contain, required if your attribute is a list. Syntax for list items is the same as a single attribute.                                                                                                                                                                                       |
| `items`      | `string`, `number`                                         | yes\*    | set       | Define the primitive type your set attribute will contain, required if your attribute is a set. Unlike lists, a set defines it's items with a string of either `string` or `number`.                                                                                                                                                             |

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

The Set attribute is arguably DynamoDB's most powerful type. ElectroDB supports String and Number Sets using the `items` property set as either `"string"`, `"number"`, or an array of strings or numbers. When a ReadonlyArray is provided, ElectroDB will enforce those values as a finite list of acceptable values, similar to an [Enum Attribute](#enum-attributes)

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
  },
  myEnumStringSet: {
    type: "set",
    items: ["RED", "GREEN", "BLUE"] as const // electrodb will only accept the included values "RED", "GREEN", and/or "BLUE"
  },
  myEnumNumberSet: {
    type: "set",
    items: [1, 2, 3] as const // electrodb will only accept the included values 1, 2, and/or 3
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

## Attribute Watching

Attribute watching is a powerful feature in ElectroDB that can be used to solve many unique challenges with DynamoDB. In short, you can define a column to have its getter/setter callbacks called whenever another attribute's getter or setter callbacks are called. If you haven't read the section on [Attribute Getters and Setters](#attribute-getters-and-setters), it will provide you with more context about when an attribute's mutation callbacks are called.

Because DynamoDB allows for a flexible schema, and ElectroDB allows for optional attributes, it is possible for items belonging to an entity to not have all attributes when setting or getting records. Sometimes values or changes to other attributes will require corresponding changes to another attribute. Sometimes, to fully leverage some advanced model denormalization or query access patterns, it is necessary to duplicate some attribute values with similar or identical values. This functionality has many uses; below are just a few examples of how you can use `watch`:

> _NOTE: Using the `watch` property impacts the order of which getters and setters are called. You cannot `watch` another attribute that also uses `watch`, so ElectroDB first invokes the getters or setters of attributes without the `watch` property, then subsequently invokes the getters or setters of attributes who use `watch`._

```typescript
myAttr: {
  type: "string",
  watch: ["otherAttr"],
  set: (myAttr, {otherAttr}) => {
    // Whenever "myAttr" or "otherAttr" are updated from an `update` or `patch` operation, this callback will be fired.
    // Note: myAttr or otherAttr could be independently undefined because either attribute could have triggered this callback
  },
  get: (myAttr, {otherAttr}) => {
    // Whenever "myAttr" or "otherAttr" are retrieved from a `query` or `get` operation, this callback will be fired.
    // Note: myAttr or otherAttr could be independently undefined because either attribute could have triggered this callback.
  }
}
```

#### Attribute Watching: Watch All

If your attributes needs to watch for any changes to an item, you can model this by supplying the watch property a string value of `"*"`

```typescript
myAttr: {
  type: "string",
  watch: "*", // "watch all"
  set: (myAttr, allAttributes) => {
    // Whenever an `update` or `patch` operation is performed, this callback will be fired.
    // Note: myAttr or the attributes under `allAttributes` could be independently undefined because either attribute could have triggered this callback
  },
  get: (myAttr, allAttributes) => {
    // Whenever a `query` or `get` operation is performed, this callback will be fired.
    // Note: myAttr or the attributes under `allAttributes` could be independently undefined because either attribute could have triggered this callback
  }
}
```

### Attribute Watching Examples

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

In this example we have an attribute `"displayPrice"` that needs its getter called anytime an item's `"price"` attribute is retrieved. The attribute `"displayPrice"` uses `watch` to return a formatted price string based whenever an item with a `"price"` attribute is queried. Additionally, `"displayPrice"` always returns `undefined` from its setter callback to ensure that it will never write data back to the table.

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

### Calculated Attributes

See: [Attribute Watching (Example 1)](#attribute-watching).

### Virtual Attributes

See: [Attribute Watching (Example 2)](#attribute-watching).

### CreatedAt and UpdatedAt Attributes

See: [Attribute Watching (Example 4)](#attribute-watching).

### Attribute Validation

The `validation` property allows for multiple function/type signatures. Here the different combinations _ElectroDB_ supports:
signature | behavior
----------------------- | --------
`Regexp` | ElectroDB will call `.test(val)` on the provided regex with the value passed to this attribute
`(value: T) => string` | If a string value with length is returned, the text will be considered the _reason_ the value is invalid. It will generate a new exception this text as the message.
`(value: T) => boolean` | If a boolean value is returned, `true` or truthy values will signify than a value is invalid while `false` or falsey will be considered valid.
`(value: T) => void` | A void or `undefined` value is returned, will be treated as successful, in this scenario you can throw an Error yourself to interrupt the query
