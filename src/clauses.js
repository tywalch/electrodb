"use strict";
const { QueryTypes, MethodTypes } = require("./types");
let queryChildren = [
	"eq",
	"gt",
	"lt",
	"gte",
	"lte",
	"between",
	"and",
	"filter",
	"params",
	"go",
];

let updateChildren = ["set", "params", "go"];

const methodTypes = {
	PUT: "put",
	GET: "get",
	QUERY: "query",
	UPDATE: "update",
	DELETE: "delete",
};

const queryTypes = {
	BETWEEN: "between",
	AND: "and",
	GTE: "gte",
	GT: "gt",
	LTE: "lte",
	LT: "lt",
};

let clauses = {
	index: {
		action(entity, state = {}, facets = {}) {
			// todo: maybe all key info is passed on the subsequent query identifiers?
			// todo: look for article/list of all dynamodb query limitations
			return state;
		},
		children: ["get", "delete", "update", "query"],
	},
	get: {
		action(entity, state = {}, facets = {}) {
			state.query.pk = entity._expectFacets(facets, entity.facets.pk);
			entity._setQueryFacet(QueryTypes.eq, facets);
			state.query.method = MethodTypes.get;
			return state;
		},
		children: ["params", "go"],
	},
	delete: {
		action(entity, state = {}, facets = {}) {
			state.query.pk = entity._expectFacets(facets, entity.facets.pk);
			entity._setQueryFacet(QueryTypes.eq, facets);
			state.query.method = MethodTypes.delete;
			return state;
		},
		children: ["params", "go"],
	},
	put: {
		action(entity, state = {}, payload = {}) {
			state.query.pk = entity._expectFacets(payload, entity.facets.pk);
			entity._setQueryFacet(QueryTypes.eq, payload);
			state.query.method = MethodTypes.put;
			entity.query.put.data = Object.assign({}, payload);
			return state;
		},
		children: ["params", "go"],
	},
	update: {
		action(entity, state = {}, facets = {}) {
			state.query.pk = entity._expectFacets(facets, entity.facets.pk);
			entity._setQueryFacet(QueryTypes.eq, facets);
			state.query.method = MethodTypes.update;
			return state;
		},
		children: updateChildren,
	},
	set: {
		action(entity, state = {}, data) {
			entity.query.update.set = Object.assign(
				{},
				entity.query.update.set,
				data,
			);
			return state;
		},
		children: updateChildren,
	},
	query: {
		action(entity, state = {}, facets = {}) {
			entity._expectFacets(facets, Object.keys(facets), `"query" facets`);
			entity._setQueryFacet(QueryTypes.begins, facets);
			state.query.method = MethodTypes.query;
		},
		children: ["between", "gte", "gt", "lte", "lt"],
	},
	between: {
		action(entity, state = {}, facets = {}) {
			entity._expectFacets(facets, Object.keys(facets), `"between" facets`);
			entity._setQueryFacet(QueryTypes.between, facets);
			return state;
		},
		children: ["and"],
	},
	and: {
		action(entity, state = {}, facets = {}) {
			entity._expectFacets(facets, Object.keys(facets), `"and" facets`);
			entity._setQueryFacet(QueryTypes.and, facets);
			return state;
		},
		children: ["go", "params"],
	},
	gt: {
		action(entity, state = {}, facets = {}) {
			entity._expectFacets(facets, Object.keys(facets), `"gt" facets`);
			entity._setQueryFacet(QueryTypes.gt, facets);
			return state;
		},
		children: queryChildren,
	},
	gte: {
		action(entity, state = {}, facets = {}) {
			entity._expectFacets(facets, Object.keys(facets), `"gte" facets`);
			entity._setQueryFacet(QueryTypes.gte, facets);
			return state;
		},
		children: queryChildren,
	},
	lt: {
		action(entity, state = {}, facets = {}) {
			entity._expectFacets(facets, Object.keys(facets), `"lt" facets`);
			entity._setQueryFacet(QueryTypes.lt, facets);
			return state;
		},
		children: queryChildren,
	},
	lte: {
		action(entity, state = {}, facets = {}) {
			entity._expectFacets(facets, Object.keys(facets), `"lte" facets`);
			entity._setQueryFacet(QueryTypes.lte, facets);
			return state;
		},
		children: queryChildren,
	},
	params: {
		action(entity, state = {}, options) {
			console.log("PARAMSzz");
			if (state.query.method === MethodTypes.query) {
				return entity._queryParams(state, options);
			} else {
				return entity._params(state, options);
			}
		},
		children: [],
	},
	go: {
		action(entity, state = {}, options) {
			state["go"] = true;
			return state;
		},
		children: [],
	},
};


class QueryChain {
	constructor(electro, clauses) {
		this.electro = electro;
		this.clauses = clauses;
		this.constants = {
			methods: {
				PUT: "put",
				GET: "get",
				QUERY: "query",
				UPDATE: "update",
				DELETE: "delete",
			},
			queries: {
				BEGINS: "BEGINS",
				BETWEEN: "BETWEEN",
				AND: "AND",
				GTE: "GTE",
				GT: "GT",
				LTE: "LTE",
				LT: "LT",
				EQ: "EQ",
			},
		};
		this.query = {
			index: "",
			type: "",
			method: "",
			facets: {},
			update: {
				set: {},
			},
			put: {
				data: {},
			},
			keys: {
				pk: {},
				sk: [],
			},
			indexComplete: false,
		};
	}

	chain(state = {}, clause = {}) {
		let current = {};
		for (let child of clause.children) {
			current[child] = (...args) => {
				state.prev = state.self;
				state.self = child;
				let results = this.clauses[child].action(this, state, ...args);
				if (this.clauses[child].children.length) {
					return this.chain(results, this.clauses[child]);
				} else {
					return results;
				}
			};
		}
		return current;
	}

	make(index = "", facets = {}) {
		this.query.index = index;
		this.query.facets = { ...facets };
		return this.chain(this.query, this.clauses.index);
	}

	_consolidateQueryFacets(queryFacets) {
		let sk1 = {};
		let sk2 = {};
		for (let { type, facets } of queryFacets) {
			if (type === QueryTypes.and) {
				sk2 = Object.assign({}, sk2, facets);
			} else {
				sk1 = Object.assign({}, sk1, facets);
			}
		}
		return [sk1, sk2];
	}

	_makeParameterKey(index, pk, sk) {
		let name = this.electro.model.translations.indexes.fromIndexToAccessPattern[
			index
		];
		let hasSortKey = this.electro.model.lookup.indexHasSortKeys[index];
		let accessPattern = this.electro.model.indexes[name];
		let key = {
			[accessPattern.pk.field]: pk,
		};
		if (hasSortKey && sk !== undefined) {
			key[accessPattern.sk.field] = sk;
		}
		return key;
	}

	_makeGetParams(table, pk, sk) {
		let params = {
			TableName: table,
			Key: this._makeParameterKey(pk, sk),
		};
		return params;
	}

	_makeDeleteParams(table, pk, sk) {
		let params = {
			TableName: table,
			Key: this._makeParameterKey(pk, sk),
		};
		return params;
	}

	_makeParams(options = {}) {
		let table = this.electro.model.table;
		let pk = this.query.keys.pk;
		let sks = this._consolidateKeys(this.query.keys.sk);

		switch (this.query.method) {
			case MethodTypes.get:
				return this._makeGetParams(table, pk, ...sks);
			case MethodTypes.delete:
				return this._makeDeleteParams(table, pk, ...sks);
			case MethodTypes.put:
				break;
			case MethodTypes.update:
				break;
			case MethodTypes.scan:
			case MethodTypes.query:
				return this._queryParams(pk, ...sks);
			default:
				throw new Error(`Invalid method: ${method}`);
		}
	}

	_queryParams(pk, ...sks) {
		switch (this.query.type) {
			case QueryTypes.begins:
				break;
			case QueryTypes.and:
				break;
			case QueryTypes.gte:
				break;
			case QueryTypes.gt:
				break;
			case QueryTypes.lte:
				break;
			case QueryTypes.lt:
				break;
			default:
				throw new Error(`Invalid method: ${method}`);
		}
	}

	_setQueryFacet(type, facets) {
		let query = QueryTypes[type];
		if (!query) {
			throw new Error(`Invalid query type: ${type}`);
		}
		this.query.type = type;
		let queryFacets = this._findProperties(facets, this.query.facets.sk).reduce(
			(result, [name, value]) => {
				result[name] = value;
				return result;
			},
			{},
		);
		return this.query.keys.sk.push({
			type,
			facets: { ...queryFacets },
		});
	}

	_expectFacets(obj = {}, properties = [], type = "key facets") {
		let [incompletePk, missing, matching] = this._expectProperties(
			obj,
			properties,
		);
		if (incompletePk) {
			throw new Error(
				`Incomplete or invalid ${type} supplied. Missing properties: ${missing.join(
					", ",
				)}`,
			);
		} else {
			return matching;
		}
	}

	_findProperties(obj = {}, properties = []) {
		return properties.map(name => [name, obj[name]]);
	}

	_expectProperties(obj = {}, properties = []) {
		let missing = [];
		let matching = [];
		this._findProperties(obj, properties).forEach(([name, value]) => {
			if (value === undefined) {
				missing.push(name);
			} else {
				matching.push(value);
			}
		});
		return [!!missing.length, missing, matching];
	}
}

module.exports = {
	clauses,
	queryTypes,
	methodTypes,
	QueryChain,
};
