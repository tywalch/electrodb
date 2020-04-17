const uuidv4 = require("uuid/v4");
const {Electro, Entity, Collection} = require("electrodb");

const database = new Electro({
	client,
	version: "1",
	table: "electro",
	service: "electrotest",
});

database.import("employees", {
    attributes: {
        employee: {
            type: "string",
            default: () => uuidv4()
        },
        firstName: {
            type: "string"   
        },
        lastName: {
            type: "string"
        },
        office: {
            type: "string",
        },
        title: {
            type: "string"
        },
        team: {
            type: ["development", "marketing", "finance", "product"]
        },
        salary: {
            type: "string"
        },
        manager: {
            type: "string"
        },
        dateHired: {
            type: "string"
        }
    },
    indexes: {
        employee: {
            pk: {
                field: "pk",
                facets: ["employee"]
            },
            sk: {
                field: "sk",
                facets: []
            }
        },
        coworkers: {
            index: "gsi1pk-gsi1sk-index",
            collection: "workplaces",
            pk: {
                field: "gsi1pk",
                facets: ["office"]
            },
            sk: {
                field: "gsi1sk",
                facets: ["team", "role", "employee"]
            },
        },
        teams: {
            index: "gsi2pk-gsi2sk-index",
            pk: {
                field: "gsi2pk",
                facets: ["team"]
            },
            sk: {
                field: "gsi2sk",
                facets: ["role", "salary", "employee"]
            },
        },
        employeeLookup: {
            collection: "personnel",
            index: "gsi3pk-gsi3sk-index",
            pk: {
                field: "gsi3pk",
                facets: ["employee"]
            },
            sk: {
                field: "gsi3sk",
                facets: []
            }
        },
        roles: {
            index: "gsi4pk-gsi4sk-index",
            pk: {
                field: "gsi4pk",
                facets: ["role"]
            },
            sk: {
                field: "gsi4sk",
                facets: ["salary", "employee"]
            },
        },
        directReports: {
            index: "gsi5pk-gsi5sk-index",
            pk: {
                field: "gsi5pk",
                facets: ["manager"]
            },
            sk: {
                field: "gsi5sk",
                facets: ["team", "office", "employee"]
            },
        }
    }
});

database.import("offices", {
    attributes: {
        office: {
            type: "string",
            default: () => uuidv4()
        },
        name: {
            type: "string"
        },
        country: {
            type: "string"
        },
        state: {
            type: "string"
        },
        city: {
            type: "string"
        },
        zip: {
            type: "string"
        },
        address: {
            type: "string"
        }
    },
    indexes: {
        office: {
            pk: {
                field: "pk",
                facets: ["office"]
            },
            sk: {
                field: "sk",
                facets: []
            }
        },
        officeLookup: {
            index: "gsi1pk-gsi1sk-index",
            collection: "workplaces",
            pk: {
                field: "gsi1pk",
                facets: ["office"]
            },
            sk: {
                field: "gsi1sk",
                facets: []
            },
        },
        locations: {
            index: "gsi1pk-gsi1sk-index",
            pk: {
                field: "gsi1pk",
                facets: ["country", "state"]
            },
            sk: {
                field: "gsi1sk",
                facets: ["city", "zip", "office"]
            },
        },
    }
});

database.import("tasks", {
    attributes: {
        task: {
            default: () => uuidv4()
        },
        project: {
            type: "string",
        },
        employee: {

        },
        name: {
            type: "string"
        },
        description: {
            type: "string"
        }
    },
    indexes: {
        task: {
            index: "gsi2pk-gsi2sk-index",
            pk: {
                field: "gsi2pk",
                facets: ["task"]
            },
            sk: {
                field: "gsi2sk",
                facets: ["project", "employee"]
            }
        },
        project: {
            index: "gsi1pk-gsi1sk-index",
            pk: {
                field: "gsi1pk",
                facets: ["project"]
            },
            sk: {
                field: "gsi1sk",
                facets: ["employee", "task"]
            }
        },
        assigned: {
            collection: "personnel",
            index: "gsi3pk-gsi3sk-index",
            pk: {
                field: "gsi3pk",
                facets: ["employee"]
            },
            sk: {
                field: "gsi3sk",
                facets: ["project", "task"]
            }
        },
    }
});

database.entities.employees
database.entities.employees.query.employee
database.entities.employees.query.coworkers
database.entities.employees.query.teams
database.entities.employees.query.roles
database.entities.employees.query.directReports
database.entities.offices
database.entities.offices.query.office
database.entities.offices.query.locations
database.entities.tasks
database.entities.tasks.query.task
database.entities.tasks.query.project
database.entities.tasks.query.assigned
database.collections.personnel
database.collections.workplaces


// entity on base
// comments
//  - entities/collections cannot conflict
database.employees.get({employee})
database.employees.delete({employee})
database.employees.update({employee}).set({title})
database.employees.query.employee({employee})
database.employees.query.coworkers({office})
database.employees.query.teams({team})
database.employees.query.roles({role})
database.employees.query.directReports({manager})
database.offices.get({office})
database.offices.delete({office})
database.offices.update({office}).set({address})
database.offices.query.office({office})
database.offices.query.locations({country, state})
database.tasks.get({task})
database.tasks.delete({task})
database.tasks.update({task}).set({description})
database.tasks.query.task({task})
database.tasks.query.project({project})
database.tasks.query.assigned({employee})
database.find.personnel({employee})
database.find.workplaces({office})

// entity on base AND access pattern on query
// comments:
//  - Entities cannot be named "find" 
//  - AccessPatterns cannot be named "get", "delete", "update"
database.employees.get({employee})
database.employees.delete({employee})
database.employees.update({employee}).set({title})
database.employees.employee({employee})
database.employees.coworkers({office})
database.employees.teams({team})
database.employees.roles({role})
database.employees.directReports({manager})
database.offices.get({office})
database.offices.delete({office})
database.offices.update({office}).set({address})
database.offices.office({office})
database.offices.locations({country, state})
database.tasks.get({task})
database.tasks.delete({task})
database.tasks.update({task}).set({description})
database.tasks.task({task})
database.tasks.project({project})
database.tasks.assigned({employee})
database.find.personnel({employee})
database.find.workplaces({office})

database.collections.personnel
    // employee
    // tasks
database.collections.workplaces
    // office
    // employees
database.entities.employees.query.employee
    // by employee
database.entities.employees.query.coworkers
    // by office
        // by team
            // by role
                // by employee
database.entities.employees.query.teams
    // by team
        // by role
            // by salary
                // by employee
database.entities.employees.query.roles
    // by role
        // by salary
            // by employee
database.entities.employees.query.directReports
    // by manager
        // by team
            // by office
                // by employee
database.entities.offices.query.office
    // by office
database.entities.offices.query.locations
    // by country/state
        // by city
            // by zip
                // by office
database.entities.tasks.query.task
    // by task
database.entities.tasks.query.project
    // by project
        // by employee
            // by task
database.entities.tasks.query.assigned
    // by employee
        // by project
            // task