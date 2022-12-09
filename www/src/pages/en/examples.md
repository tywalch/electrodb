---
title: Examples
description: Some examples!
layout: ../../layouts/MainLayout.astro
---

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
        endDate
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
const client = new DynamoDB.DocumentClient({ region: "us-east-1" });
const { Service } = require("electrodb");
const table = "projectmanagement";
const EmployeeApp = new Service("EmployeeApp", { client, table });

EmployeeApp.join(EmployeesModel) // EmployeeApp.entities.employees
  .join(TasksModel) // EmployeeApp.entities.tasks
  .join(OfficesModel); // EmployeeApp.entities.tasks
```

### Query Records

#### All tasks and employee information for a given employee

Fulfilling [Requirement #1](#employee-app-requirements).

```javascript
EmployeeApp.collections.assignements({ employee: "CBaskin" }).go();
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
EmployeeApp.collections.workplaces({ office: "big cat rescue" }).go();
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
EmployeeApp.entities.tasks.query.assigned({ employee: "cbaskin" }).go();
```

Returns the following:

```javascript
[
  {
    task: "Feed tigers",
    description: "Prepare food for tigers to eat",
    project: "Keep tigers alive",
    employee: "cbaskin",
  },
  {
    task: "Fill water bowls",
    description: "Ensure the tigers have enough water",
    project: "Keep tigers alive",
    employee: "cbaskin",
  },
];
```

#### Tasks for a given project

Fulfilling [Requirement #4](#employee-app-requirements).

```javascript
EmployeeApp.entities.tasks.query.project({ project: "Murder Carol" }).go();
```

Returns the following:

```javascript
[
  {
    task: "Hire hitman",
    description: "Find someone to murder Carol",
    project: "Murder Carol",
    employee: "jexotic",
  },
];
```

#### Find office locations

Fulfilling [Requirement #5](#employee-app-requirements).

```javascript
EmployeeApp.entities.office
  .locations({ country: "usa", state: "florida" })
  .go();
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
    address: "123 Kitty Cat Lane",
  },
];
```

#### Find employee salaries and titles

Fulfilling [Requirement #6](#employee-app-requirements).

```javascript
EmployeeApp.entities.employees
  .roles({ title: "animal wrangler" })
  .lte({ salary: "150.00" })
  .go();
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
  },
];
```

#### Find employee birthdays or anniversaries

Fulfilling [Requirement #7](#employee-app-requirements).

```javascript
EmployeeApp.entities.employees
  .workplaces({ office: "gw zoo" })
  .upcomingCelebrations("2020-05-01", "2020-06-01")
  .go();
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
  },
];
```

#### Find direct reports

Fulfilling [Requirement #8](#employee-app-requirements).

```javascript
EmployeeApp.entities.employees.reports({ manager: "jlowe" }).go();
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
  },
];
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
const StoreLocations = new Entity(model, { client, table: "StoreLocations" });
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

> When updating a record, you must include all **Composite Attributes** associated with the table's _primary_ **PK** and **SK**.

```javascript
let storeId = "LatteLarrys";
let mallId = "EastPointe";
let buildingId = "BuildingA1";
let unitId = "B47";
await StoreLocations.update({ storeId, mallId, buildingId, unitId })
  .set({
    leaseEndDate: "2021-02-28",
  })
  .go();
```

Returns the following:

```json
{
  "leaseEndDate": "2021-02-28"
}
```

### GET Record

#### Retrieve a specific Store in a Mall

> When retrieving a specific record, you must include all **Composite Attributes** associated with the table's _primary_ **PK** and **SK**.

```javascript
let storeId = "LatteLarrys";
let mallId = "EastPointe";
let buildingId = "BuildingA1";
let unitId = "B47";
await StoreLocations.get({ storeId, mallId, buildingId, unitId }).go();
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

> When removing a specific record, you must include all **Composite Attributes** associated with the table's _primary_ **PK** and **SK**.

```javascript
let storeId = "LatteLarrys";
let mallId = "EastPointe";
let buildingId = "BuildingA1";
let unitId = "B47";
let storeId = "LatteLarrys";
await StoreLocations.delete({ storeId, mallId, buildingId, unitId }).go();
```

Returns the following:

```
{}
```

### Query Mall Records

#### All Stores in a particular mall

Fulfilling [Requirement #1](#shopping-mall-requirements).

```javascript
let mallId = "EastPointe";
let stores = await StoreLocations.malls({ mallId }).query().go();
```

#### All Stores in a particular mall building

Fulfilling [Requirement #1](#shopping-mall-requirements).

```javascript
let mallId = "EastPointe";
let buildingId = "BuildingA1";
let stores = await StoreLocations.malls({ mallId }).query({ buildingId }).go();
```

#### Find the store located in unit B47

Fulfilling [Requirement #1](#shopping-mall-requirements).

```javascript
let mallId = "EastPointe";
let buildingId = "BuildingA1";
let unitId = "B47";
let stores = await StoreLocations.malls({ mallId })
  .query({ buildingId, unitId })
  .go();
```

#### Stores by Category at Mall

Fulfilling [Requirement #2](#shopping-mall-requirements).

```javascript
let mallId = "EastPointe";
let category = "food/coffee";
let stores = await StoreLocations.malls({ mallId }).byCategory(category).go();
```

#### Stores by upcoming lease

Fulfilling [Requirement #3](#shopping-mall-requirements).

```javascript
let mallId = "EastPointe";
let q2StartDate = "2020-04-01";
let stores = await StoreLocations.leases({ mallId })
  .lt({ leaseEndDate: q2StateDate })
  .go();
```

#### Stores will renewals for Q4

Fulfilling [Requirement #3](#shopping-mall-requirements).

```javascript
let mallId = "EastPointe";
let q4StartDate = "2020-10-01";
let q4EndDate = "2020-12-31";
let stores = await StoreLocations.leases(mallId)
  .between({ leaseEndDate: q4StartDate }, { leaseEndDate: q4EndDate })
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
  .between({ leaseEndDate: yearStarDate }, { leaseEndDate: yearEndDate })
  .filter((attr) => attr.category.eq("Spite Store"))
  .go();
```

#### All Latte Larrys in a particular mall building

```javascript
let mallId = "EastPointe";
let buildingId = "BuildingA1";
let unitId = "B47";
let storeId = "LatteLarrys";
let stores = await StoreLocations.malls({ mallId })
  .query({ buildingId, storeId })
  .go();
```

# TypeScript

ElectroDB using advanced dynamic typing techniques to automatically create types based on the configurations in your model. Changes to your model will automatically change the types returned by ElectroDB.

## Custom Attributes

If you have a need for a custom attribute type (beyond those supported by ElectroDB) you can use the the export function `createCustomAttribute`. This function takes an attribute definition and allows you to specify a custom typed attribute with ElectroDB:

> _NOTE: creating a custom type, ElectroDB will enforce attribute constraints based on the attribute definition provided, but will yield typing control to the user. This may result in some mismatches between your typing and the constraints enforced by ElectroDB._

```typescript
import { Entity, createCustomAttribute } from "electrodb";

const table = "workplace_table";

type PersonnelRole =
  | {
      type: "employee";
      startDate: number;
      endDate?: number;
    }
  | {
      type: "contractor";
      contractStartDate: number;
      contractEndDate: number;
    };

const person = new Entity(
  {
    model: {
      entity: "personnel",
      service: "workplace",
      version: "1",
    },
    attributes: {
      id: {
        type: "string",
      },
      role: createCustomAttribute<PersonnelRole>({
        required: true,
      }),
    },
    indexes: {
      record: {
        pk: {
          field: "pk",
          composite: ["id"],
        },
        sk: {
          field: "sk",
          composite: [],
        },
      },
    },
  },
  { table }
);
```

[![Try it out!](https://img.shields.io/badge/electrodb-try_out_this_example_›-%23f9bd00?style=for-the-badge&logo=amazondynamodb&labelColor=1a212a)](https://electrodb.fun/?#code/JYWwDg9gTgLgBAbzgUQHY2DAngGjgYygFMBDGIgYQFcBnGCEAQRhimACMry4BfOAMygM4AIiIAbIvlYQAJuxEBuAFDL8EVHTgwS7SXAC8cAOQB3aAGsw4kviIB9HXqLGVy7GCJwACkSg0NVAkAJQh9IwRlOGjtLE8ALhMicHEILCIXFRi4OhJYABEyIkTUKhB2PyyYolRZQvIAfhKyiqgVPgAfRCiYj2KTdXQoW3ooVx7owdYRgGUdAqLm8sqJgg1p6TQ6xbhS5bblHjc1DS1Pfw1DXaJTFHRMLAAKSOyQOQlEl+zq++xE43OAVQQXExhwq2yND8ADdgHZ-uYoFYbHYwRCYtC-DRgBp-gBGYyrHjg7JkVgcLhEGifdHRYCyGnfJmxBImOhsVAAc0JzN4JOZQkkiUIpHI1DoDGY5M45AAPL4LsCQmEiAA+Z6077EACOVGAxAZ2igVCI-KZPAAlGa+atgLUiAAPKmMgVSaCGr686JgCwur3ffjACSGgEWNH+pnqcAQbHkRIAbWM9OMAF1NdliemYjRfd0IwGg+IQznw-mYlHILH+vGU9beTxNQ2M4c8EgnPpLW5Blp6VdjEQALQAFgADABOAluAD0U7giIsNGUgI0ADowFwNdl6dbBf1Pd8+v9ktY0hlS0zcgs43B6kQV6gIKZHlaiYcLSvORBn9PZ304H4hCgJcsVXdcYE3GJt1WXc-QPOJ+mMKZhmkaBz2+S8YFvRJb3vR9n2tBtLQ-L8LUUIA)
