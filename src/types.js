const KeyTypes = {
	pk: "pk",
	sk: "sk",
};

const QueryTypes = {
	begins: "begins",
	between: "between",
	and: "and",
	gte: "gte",
	gt: "gt",
	lte: "lte",
	lt: "lt",
	eq: "eq",
};

const MethodTypes = {
	put: "put",
	get: "get",
	query: "query",
	scan: "scan",
	update: "update",
	delete: "delete",
};

module.exports = {
	KeyTypes,
	QueryTypes,
	MethodTypes,
};
