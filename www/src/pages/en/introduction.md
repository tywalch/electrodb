---
title: Introduction
description: Docs intro
layout: ../../layouts/MainLayout.astro
---

## Installation

Install from NPM

```bash
npm install electrodb --save
```

## Playground

---

<p align="center">
  <a href="https://electrodb.fun"><img width="400" src="https://github.com/tywalch/electrodb/blob/master/assets/playground.jpg?raw=true"></a>
</p>

<p align="center">Try out and share ElectroDB Models, Services, and Single Table Design at <a href="https://electrodb.fun">electrodb.fun</a></p>

---

## Usage

**ElecrtoDB turns this:**

```typescript
tasks
  .patch({
    team: "core",
    task: "45-662",
    project: "backend",
  })
  .set({ status: "open" })
  .add({ points: 5 })
  .append({
    comments: [
      {
        user: "janet",
        body: "This seems half-baked.",
      },
    ],
  })
  .where(({ status }, { eq }) => eq(status, "in-progress"))
  .go();
```

**Into This**

```json
{
  "UpdateExpression": "SET #status = :status_u0, #points = #points + :points_u0, #comments = list_append(#comments, :comments_u0), #updatedAt = :updatedAt_u0, #gsi1sk = :gsi1sk_u0",
  "ExpressionAttributeNames": {
    "#status": "status",
    "#points": "points",
    "#comments": "comments",
    "#updatedAt": "updatedAt",
    "#gsi1sk": "gsi1sk"
  },
  "ExpressionAttributeValues": {
    ":status0": "in-progress",
    ":status_u0": "open",
    ":points_u0": 5,
    ":comments_u0": [
      {
        "user": "janet",
        "body": "This seems half-baked."
      }
    ],
    ":updatedAt_u0": 1630977029015,
    ":gsi1sk_u0": "$assignments#tasks_1#status_open"
  },
  "TableName": "your_table_name",
  "Key": {
    "pk": "$taskapp#team_core",
    "sk": "$tasks_1#project_backend#task_45-662"
  },
  "ConditionExpression": "attribute_exists(pk) AND attribute_exists(sk) AND #status = :status0"
}
```

## Project Goals

ElectroDB focuses on simplifying the process of modeling, enforcing data constraints, querying across entities, and formatting complex DocumentClient parameters. Three important design considerations we're made with the development of ElectroDB:

1. ElectroDB should be able to be useful without having to query the database itself [[read more](#params)].
2. ElectroDB should be able to be added to a project that already has been established tables, data, and access patterns [[read more](#using-electrodb-with-existing-data)].
3. ElectroDB should not require additional design considerations on top of those made for DynamoDB, and therefore should be able to be removed from a project at any time without sacrifice.
