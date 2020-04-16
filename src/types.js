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
	collection: "collection"
};

const MethodTypes = {
	put: "put",
	get: "get",
	query: "query",
	scan: "scan",
	update: "update",
	delete: "delete",
	scan: "scan",
};

const Comparisons = {
	gte: ">=",
	gt: ">",
	lte: "<=",
	lt: "<",
};

module.exports = {
	KeyTypes,
	QueryTypes,
	MethodTypes,
	Comparisons,
};
