const uuidv4 = require("uuid/v4");
const {Electro, Entity, Collection} = require("electrodb");

const employees = new Entity({
    client,
	version: "1",
	table: "electro",
	service: "electrotest",
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

const offices = new Entity({
    client,
	version: "1",
	table: "electro",
	service: "electrotest",
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

const tasks = new Entity({
    client,
	version: "1",
	table: "electro",
	service: "electrotest",
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

const HumanResources = new Electro("HumanResources", [
    employees, 
    offices, 
    tasks
]);
HumanResources.employees.get({employee}).go();
HumanResources.employees.delete({employee}).go();
HumanResources.employees.update({employee}).set({title}).go();
HumanResources.employees.query.employee({employee}).go();
HumanResources.employees.query.coworkers({office}).go();
HumanResources.employees.query.teams({team}).go();
HumanResources.employees.query.roles({role}).go();
HumanResources.employees.query.directReports({manager}).go();
HumanResources.offices.get({office}).go();
HumanResources.offices.delete({office}).go();
HumanResources.offices.update({office}).set({address}).go();
HumanResources.offices.query.office({office}).go();
HumanResources.offices.query.locations({country, state}).go();
HumanResources.tasks.get({task}).go();
HumanResources.tasks.delete({task}).go();
HumanResources.tasks.update({task}).set({description}).go();
HumanResources.tasks.query.task({task}).go();
HumanResources.tasks.query.project({project}).go();
HumanResources.tasks.query.assigned({employee}).go();
HumanResources.find.personnel({employee}).go();
HumanResources.find.workplaces({office}).go();