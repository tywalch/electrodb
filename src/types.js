const KeyTypes = {
	pk: "pk",
	sk: "sk",
};

const BatchWriteTypes = {
	batch: "batch",
	concurrent: "concurrent"
}

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
	is: "is"
};

const MethodTypes = {
	put: "put",
	get: "get",
	query: "query",
	scan: "scan",
	update: "update",
	delete: "delete",
	remove: "remove",
	scan: "scan",
	patch: "patch",
	create: "create",
	batchGet: "batchGet",
	batchWrite: "batchWrite"
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
	FilterExpression: "FilterExpression",
	UpdateExpression: "UpdateExpression",
	ConditionExpression: "ConditionExpression",
	KeyConditionExpression: "KeyConditionExpression"
};

const ElectroInstance = {
	entity: Symbol("entity"),
	service: Symbol("service"),
	electro: Symbol("electro"),
};

const ElectroInstanceTypes = {
	electro: "electro",
	service: "service",
	entity: "entity",
	model: "model"
};

const ModelVersions = {
	beta: "beta",
	v1: "v1",
	v2: "v2"
};

const EntityVersions = {
	v1: "v1"
};

const ServiceVersions = {
	v1: "v1"
};

const MaxBatchItems = {
	[MethodTypes.batchGet]: 100,
	[MethodTypes.batchWrite]: 25
};

const AttributeMutationMethods = {
	get: "get",
	set: "set"
};

const Pager = {
	raw: "raw",
	named: "named",
	item: "item"
}

const UnprocessedTypes = {
	raw: "raw",
	item: "item"
};

const WatchAll = "*";

const ItemOperations = {
	"SET": "SET",
	"DELETE": "DELETE",
	"REMOVE": "REMOVE",
	"ADD": "ADD",
	"SUBTRACT": "SUBTRACT",
};

module.exports = {
	Pager,
	KeyTypes,
	WatchAll,
	CastTypes,
	QueryTypes,
	MethodTypes,
	Comparisons,
	MaxBatchItems,
	ModelVersions,
	AttributeTypes,
	EntityVersions,
	ItemOperations,
	ServiceVersions,
	ExpressionTypes,
	ElectroInstance,
	UnprocessedTypes,
	ElectroInstanceTypes,
	AttributeMutationMethods,
};
