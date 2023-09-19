---
name: Bug report
about: Create a report to help us improve
title: ""
labels: ""
assignees: ""
---

**Describe the bug**
A clear and concise description of what the bug is.

**ElectroDB Version**
Specify the version of ElectroDB you are using
(e.g. `1.8.4`)

**ElectroDB Playground Link**
(if possible) Use the [ElectroDB Playground](https://electrodb.fun) to recreate your issue and supply the link here to help with troubleshooting.

**Entity/Service Definitions**
Include your entity model (or a model that sufficiently recreates your issue) to help troubleshoot.

```
{
    model: {
        entity: "my_entity",
        service: "my_service",
        version: "my_version"
    },
    attributes: {
        prop1: {
            type: "string"
        },
        prop2: {
            type: "string"
        }
    },
    indexes: {
        record: {
            pk: {
                field: "pk",
                composite: ["prop1"],
            },
            sk: {
                field: "sk",
                composite: ["prop2"],
            },
        }
    }
}
```

**Expected behavior**
A clear and concise description of what you expected to happen.

**Errors**

```
If applicable, paste the errors you received
```

**Additional context**
Add any other context about the problem here.
