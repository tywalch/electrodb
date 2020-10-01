const KeyTypes = {
	pk: "pk",
	sk: "sk",
};

const QueryTypes = {
	and: "and",
	gte: "gte",
	gt: "gt",
	lte: "lte",
	lt: "lt",
	eq: "eq",
	begins: "begins",
	between: "between",
	collection: "collection",
};

const MethodTypes = {
	put: "put",
	get: "get",
	query: "query",
	scan: "scan",
	update: "update",
	delete: "delete",
	scan: "scan",
	patch: "patch",
	create: "create"
};

const Comparisons = {
	gte: ">=",
	gt: ">",
	lte: "<=",
	lt: "<",
};

const CastTypes = ["string", "number"];

const AttributeTypes = {
	string: "string",
	number: "number",
	boolean: "boolean",
	enum: "enum",
	map: "map",
	set: "set",
	list: "list",
	any: "any",
};

const ExpressionTypes = {
	ConditionExpression: "ConditionExpression",
	FilterExpression: "FilterExpression"
}

const ElectroInstance = {
	entity: Symbol("entity"),
	service: Symbol("service")
}

module.exports = {
	KeyTypes,
	QueryTypes,
	MethodTypes,
	CastTypes,
	Comparisons,
	AttributeTypes,
	ExpressionTypes,
	ElectroInstance,
};
