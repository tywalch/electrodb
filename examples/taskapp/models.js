const uuid = require("uuid").v4;
const moment = require("moment");

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
			type: ["development", "marketing", "finance", "product", "cool cats and kittens"],
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
			validate: (date) => {
				if (!moment(date).isValid) {
					throw new Error("Invalid date format");
				}
			}
		},
		birthday: {
			type: "string",
			validate: (date) => {
				if (!moment(date).isValid) {
					throw new Error("Invalid date format");
				}
			}
		},
	},
	indexes: {
		employee: {
			pk: {
				field: "pk",
				facets: ["employee"],
			},
			sk: {
				field: "sk",
				facets: [],
			},
		},
		coworkers: {
			index: "gsi1pk-gsi1sk-index",
			collection: "workplaces",
			pk: {
				field: "gsi1pk",
				facets: ["office"],
			},
			sk: {
				field: "gsi1sk",
				facets: ["team", "title", "employee"],
			},
		},
		teams: {
			index: "gsi2pk-gsi2sk-index",
			pk: {
				field: "gsi2pk",
				facets: ["team"],
			},
			sk: {
				field: "gsi2sk",
				facets: ["dateHired", "title"],
			},
		},
		employeeLookup: {
			collection: "assignments",
			index: "gsi3pk-gsi3sk-index",
			pk: {
				field: "gsi3pk",
				facets: ["employee"],
			},
			sk: {
				field: "gsi3sk",
				facets: [],
			},
		},
		roles: {
			index: "gsi4pk-gsi4sk-index",
			pk: {
				field: "gsi4pk",
				facets: ["title"],
			},
			sk: {
				field: "gsi4sk",
				facets: ["salary"],
			},
		},
		directReports: {
			index: "gsi5pk-gsi5sk-index",
			pk: {
				field: "gsi5pk",
				facets: ["manager"],
			},
			sk: {
				field: "gsi5sk",
				facets: ["team", "office"],
			},
		},
	},
	filters: {
		upcomingCelebrations: (attributes, startDate, endDate) => {
			let { dateHired, birthday } = attributes;
			return `${dateHired.between(startDate, endDate)} OR ${birthday.between(
				startDate,
				endDate,
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
		status: {
			type: ["open", "in-progress", "closed"]
		},
		points: {
			type: "number"
		},
		comments: {
			type: "any"
		}
	},
	indexes: {
		task: {
			pk: {
				field: "pk",
				facets: ["task"],
			},
			sk: {
				field: "sk",
				facets: ["project", "employee"],
			},
		},
		project: {
			index: "gsi1pk-gsi1sk-index",
			pk: {
				field: "gsi1pk",
				facets: ["project"],
			},
			sk: {
				field: "gsi1sk",
				facets: ["employee", "status"],
			},
		},
		assigned: {
			collection: "assignments",
			index: "gsi3pk-gsi3sk-index",
			pk: {
				field: "gsi3pk",
				facets: ["employee"],
			},
			sk: {
				field: "gsi3sk",
				facets: ["project", "status"],
			},
		},
		statuses: {
			index: "gsi4pk-gsi4sk-index",
			pk: {
				field: "gsi4pk",
				facets: ["status"],
			},
			sk: {
				field: "gsi4sk",
				facets: ["project", "employee"],
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
		office: {
			type: "string",
			default: () => uuid()
		},
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
				facets: ["country", "state"],
			},
			sk: {
				field: "sk",
				facets: ["city", "zip", "office"],
			},
		},
		office: {
			index: "gsi1pk-gsi1sk-index",
			collection: "workplaces",
			pk: {
				field: "gsi1pk",
				facets: ["office"],
			},
			sk: {
				field: "gsi1sk",
				facets: [],
			},
		},
	},
};

module.exports = {
  EmployeesModel,
  TasksModel,
  OfficesModel,
};
