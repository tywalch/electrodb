const uuid = require("uuid").v4;
const moment = require("moment");

module.exports = {
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
	}
};