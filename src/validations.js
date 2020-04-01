const Validator = require("jsonschema").Validator;
Validator.prototype.customFormats.isFunction = function(input) {
	return typeof input === "function";
};
Validator.prototype.customFormats.isFunctionOrString = function(input) {
	return typeof input === "function" || typeof input === "string";
};
Validator.prototype.customFormats.isFunctionOrRegexp = function(input) {
	return typeof input === "function" || input instanceof RegExp;
};

let v = new Validator();

const Attribute = {
	id: "/Attribute",
	type: "object",
	required: ["type"],
	properties: {
		type: {
			// todo: only specific values
			type: ["string", "array"],
			// enum: ["string", "number", "boolean", "enum"],
		},
		field: {
			type: "string",
		},
		label: {
			type: "string",
		},
		readOnly: {
			type: "boolean",
		},
		required: {
			type: "boolean",
		},
		cast: {
			type: "string",
			enum: ["string", "number"],
		},
		default: {
			type: "any",
			format: "isFunctionOrString",
		},
		validate: {
			type: "any",
			format: "isFunctionOrRegexp",
		},
		get: {
			type: "any",
			format: "isFunction",
		},
		set: {
			type: "any",
			format: "isFunction",
		},
	},
};

const Index = {
	id: "/Index",
	type: "object",
	properties: {
		pk: {
			type: "object",
			required: true,
			properties: {
				field: {
					type: "string",
					required: true,
				},
				facets: {
					type: "array",
					minItems: 1,
					items: {
						type: "string",
					},
					required: true,
				},
			},
		},
		sk: {
			type: "object",
			required: ["field", "facets"],
			properties: {
				field: {
					type: "string",
					required: true,
				},
				facets: {
					type: "array",
					minItems: 1,
					required: true,
					items: {
						type: "string",
					},
				},
			},
		},
		index: {
			type: "string",
		},
	},
};

const Model = {
	type: "object",
	required: true,
	properties: {
		service: {
			type: "string",
			required: true,
		},
		entity: {
			type: "string",
			required: true,
		},
		table: {
			type: "string",
			required: true,
		},
		version: {
			type: "string",
		},
		attributes: {
			type: "object",
			patternProperties: {
				["."]: { $ref: "/Attribute" },
			},
		},
		indexes: {
			type: "object",
			minProperties: 1,
			patternProperties: {
				["."]: { $ref: "/Index" },
			},
		},
		filters: { $ref: "/Filters" },
	},
};

const Filters = {
	id: "/Filters",
	type: "object",
	patternProperties: {
		["."]: {
			type: "any",
			format: "isFunction",
			message: "Requires function",
		},
	},
};

v.addSchema(Attribute, "/Attribute");
v.addSchema(Index, "/Index");
v.addSchema(Filters, "/Filters");
v.addSchema(Model, "/Model");

function validateModel(model = {}) {
	let errors = v.validate(model, "/Model").errors;
	if (errors.length) {
		throw new Error(
			errors
				.map(err => {
					let message = `${err.property}`;
					if (err.argument === "isFunction") {
						return `${message} must be a function`;
					} else if (err.argument === "isFunctionOrString") {
						return `${message} must be either a function or string`;
					} else if (err.argument === "isFunctionOrRegexp") {
						return `${message} must be either a function or Regexp`;
					} else {
						return `${message} ${err.message}`;
					}
				})
				.join(", "),
		);
	}
}

module.exports = {
	model: validateModel,
};
