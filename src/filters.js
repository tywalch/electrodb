let queryChildren = [
	"eq",
	"gt",
	"lt",
	"gte",
	"lte",
	"between",
	"params",
	"begins",
	"exists",
	"notExists",
	"contains",
	"notContains",
	"go",
	"and",
	"or",
];

function eq(name, value) {
	return `${name} = ${value}`;
}

function gt(name, value) {
	return `${name} > ${value}`;
}

function lt(name, value) {
	return `${name} < ${value}`;
}

function gte(name, value) {
	return `${name} >= ${value}`;
}

function lte(name, value) {
	return `${name} <= ${value}`;
}

function between(name, value1, value2) {
	return `${name} between ${value1} and ${value2}`;
}

function begins(name, value) {
	return `begins_with(${name}, ${value})`;
}

function exists() {
	return `exists(${name}, ${value})`;
}

function notExists() {
	return `not exists(${name}, ${value})`;
}

function contains() {
	return `contains(${name}, ${value})`;
}

function notContains() {
	return `not contains(${name}, ${value})`;
}

function and(...filters) {}

function or(...filters) {}

const AttributeTypes = ["string", "number", "boolean", "enum"];
const CastTypes = ["string", "number"];

class Attribute {
	constructor(definition = {}) {
		this.name = definition.name;
		this.field = definition.field || definition.name;
		this.readOnly = !!definition.readOnly;
		this.required = !!definition.required;
		this.cast = definition.cast;
		this.default = definition.default || "";
		this.validate = definition.validate;
		this.indexes = [...(definition.indexes || [])];
		if (Array.isArray(definition.type)) {
			this.type = "enum";
			this.enumArray = [...definition.type];
		} else {
			this.type = definition.type || "string";
		}

		if (!AttributeTypes.includes(this.type)) {
			throw new Error(
				`Invalid "type" property for attribute: "${
					definition.name
				}". Acceptable types include ${AttributeTypes.join(", ")}`,
			);
		}

		if (cast !== undefined && !AttributeTypes.includes(this.cast)) {
			throw new Error(
				`Invalid "cast" property for attribute: "${
					definition.name
				}". Acceptable types include ${AttributeTypes.join(", ")}`,
			);
		}
	}
}

class Filter {
	constructor(attributes = {}) {
		this.attributes = { ...attributes };
		this.filters = {};
	}
}
