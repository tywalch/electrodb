const { QueryTypes, MethodTypes } = require("./types");
const v = require("./validations");
const e = require("./errors");

function batchAction(action, type, entity, state, payload) {
	if (state.error !== null) {
		return state;
	}
	try {
		state.query.method = type;
		for (let facets of payload) {
			let batchState = action(entity, state.batch.create(), facets);
			if (batchState.error !== null) {
				throw batchState.error;
			}
			state.batch.push(batchState);
		}
		return state;
	} catch(err) {
		state.error = err;
		return state;
	}
}

let clauses = {
	index: {
		name: "index",
		children: ["get", "delete", "update", "query", "put", "scan", "collection", "create", "remove", "patch", "batchPut", "batchDelete", "batchGet"],
	},
	collection: {
		name: "collection",
		/* istanbul ignore next */
		action(entity, state, collection = "", facets /* istanbul ignore next */ = {}) {
			if (state.error !== null) {
				return state;
			}
			try {
				state.query.keys.pk = entity._expectFacets(facets, state.query.facets.pk);
				entity._expectFacets(facets, Object.keys(facets), `"query" composite attributes`);
				state.query.collection = collection;
				state.query.method = MethodTypes.query;
				state.query.type = QueryTypes.collection;
				return state;
			} catch(err) {
				state.error = err;
				return state;
			}
		},
		children: ["params", "go", "page"],
	},
	scan: {
		name: "scan",
		action(entity, state) {
			if (state.error !== null) {
				return state;
			}
			try {
				state.query.method = MethodTypes.scan;
				return state;
			} catch(err) {
				state.error = err;
				return state;
			}
		},
		children: ["params", "go", "page"],
	},
	get: {
		name: "get",
		/* istanbul ignore next */
		action(entity, state, facets = {}) {
			if (state.error !== null) {
				return state;
			}
			try {
				state.query.keys.pk = entity._expectFacets(facets, state.query.facets.pk);
				state.query.method = MethodTypes.get;
				state.query.type = QueryTypes.eq;
				if (state.hasSortKey) {
					let queryFacets = entity._buildQueryFacets(
						facets,
						state.query.facets.sk,
					);
					state.query.keys.sk.push({
						type: state.query.type,
						facets: queryFacets,
					});
				}
				return state;
			} catch(err) {
				state.error = err;
				return state;
			}
		},
		children: ["params", "go"],
	},
	batchGet: {
		name: "batchGet",
		action: (entity, state, payload) => batchAction(clauses.get.action, MethodTypes.batchGet, entity, state, payload),
		children: ["params", "go"],
	},
	batchDelete: {
		name: "batchDelete",
		action: (entity, state, payload) => batchAction(clauses.delete.action, MethodTypes.batchWrite, entity, state, payload),
		children: ["params", "go"],
	},
	delete: {
		name: "delete",
		/* istanbul ignore next */
		action(entity, state, facets = {}) {
			if (state.error !== null) {
				return state;
			}
			try {
				state.query.keys.pk = entity._expectFacets(facets, state.query.facets.pk);
				state.query.method = MethodTypes.delete;
				state.query.type = QueryTypes.eq;
				if (state.hasSortKey) {
					let queryFacets = entity._buildQueryFacets(
						facets,
						state.query.facets.sk,
					);
					state.query.keys.sk.push({
						type: state.query.type,
						facets: queryFacets,
					});
				}
				return state;
			} catch(err) {
				state.error = err;
				return state;
			}
		},
		children: ["where", "params", "go"],
	},
	remove: {
		name: "remove",
		/* istanbul ignore next */
		action(entity, state, facets = {}) {
			if (state.error !== null) {
				return state;
			}
			try {
				state.query.keys.pk = entity._expectFacets(facets, state.query.facets.pk);
				state.query.method = MethodTypes.remove;
				state.query.type = QueryTypes.eq;
				if (state.hasSortKey) {
					let queryFacets = entity._buildQueryFacets(
						facets,
						state.query.facets.sk,
					);
					state.query.keys.sk.push({
						type: state.query.type,
						facets: queryFacets,
					});
				}
				return state;
			} catch(err) {
				state.error = err;
				return state;
			}
		},
		children: ["where", "params", "go"],
	},
	put: {
		name: "put",
		/* istanbul ignore next */
		action(entity, state, payload) {
			if (state.error !== null) {
				return state;
			}
			try {
				let record = entity.model.schema.checkCreate({...payload});
				state.query.keys.pk = entity._expectFacets(record, state.query.facets.pk);
				state.query.method = MethodTypes.put;
				state.query.type = QueryTypes.eq;
				if (state.hasSortKey) {
					let queryFacets = entity._buildQueryFacets(
						record,
						state.query.facets.sk,
					);
					state.query.keys.sk.push({
						type: state.query.type,
						facets: queryFacets,
					});
				}
				state.query.put.data = Object.assign({}, record);
				return state;
			} catch(err) {
				state.error = err;
				return state;
			}
		},
		children: ["params", "go"],
	},
	batchPut: {
		name: "batchPut",
		action: (entity, state, payload) => batchAction(clauses.put.action, MethodTypes.batchWrite, entity, state, payload),
		children: ["params", "go"],
	},
	create: {
		name: "create",
		action(entity, state, payload) {
			if (state.error !== null) {
				return state;
			}
			try {
				let record = entity.model.schema.checkCreate({...payload});
				state.query.keys.pk = entity._expectFacets(record, state.query.facets.pk);
				state.query.method = MethodTypes.put;
				state.query.type = QueryTypes.eq;
				if (state.hasSortKey) {
					let queryFacets = entity._buildQueryFacets(
						record,
						state.query.facets.sk,
					);
					state.query.keys.sk.push({
						type: state.query.type,
						facets: queryFacets,
					});
				}
				state.query.put.data = Object.assign({}, record);
				return state;
			} catch(err) {
				state.error = err;
				return state;
			}
		},
		children: ["params", "go"],
	},
	patch: {
		name: "patch",
		action(entity, state, facets) {
			if (state.error !== null) {
				return state;
			}
			try {
				state.query.keys.pk = entity._expectFacets(facets, state.query.facets.pk);
				state.query.method = MethodTypes.update;
				state.query.type = QueryTypes.eq;
				if (state.hasSortKey) {
					let queryFacets = entity._buildQueryFacets(
						facets,
						state.query.facets.sk,
					);
					state.query.keys.sk.push({
						type: state.query.type,
						facets: queryFacets,
					});
				}
				return state;
			} catch(err) {
				state.error = err;
				return state;
			}
		},
		children: ["set", "append", "remove", "add", "subtract"],
	},
	update: {
		name: "update",
		action(entity, state, facets) {
			if (state.error !== null) {
				return state;
			}
			try {
				state.query.keys.pk = entity._expectFacets(facets, state.query.facets.pk);
				state.query.method = MethodTypes.update;
				state.query.type = QueryTypes.eq;
				if (state.hasSortKey) {
					let queryFacets = entity._buildQueryFacets(
						facets,
						state.query.facets.sk,
					);
					state.query.keys.sk.push({
						type: state.query.type,
						facets: queryFacets,
					});
				}
				return state;
			} catch(err) {
				state.error = err;
				return state;
			}
		},
		children: ["set", "append", "remove", "add", "subtract"],
	},
	set: {
		name: "set",
		action(entity, state, data) {
			if (state.error !== null) {
				return state;
			}
			try {
				let record = entity.model.schema.checkUpdate({...data});
				state.query.update.set = Object.assign(
					{},
					state.query.update.set,
					record,
				);
				return state;
			} catch(err) {
				state.error = err;
				return state;
			}
		},
		children: ["set", "go", "params"],
	},
	// append: {
	// 	name: "append",
	// 	action(entity, state, data = {}) {
	// 		let attributes = {}
	// 		let payload = {};
	// 		for (let path of Object.keys(data)) {
	// 			let parsed = entity.model.schema.parseAttributePath(path);
	//
	// 		}
	// 	},
	// 	children: ["set", "append", "remove", "add", "subtract", "go", "params"]
	// },
	// remove: {
	// 	name: "remove",
	// 	action(entity, state, data) {
	//
	// 	},
	// 	children: ["set", "append", "remove", "add", "subtract", "go", "params"]
	// },
	// add: {
	// 	name: "add",
	// 	action(entity, state, data) {
	//
	// 	},
	// 	children: ["set", "append", "remove", "add", "subtract", "go", "params"]
	// },
	// subtract: {
	// 	name: "subtract",
	// 	action(entity, state, data) {
	//
	// 	},
	// 	children: ["set", "append", "remove", "add", "subtract", "go", "params"]
	// },
	query: {
		name: "query",
		action(entity, state, facets, options = {}) {
			if (state.error !== null) {
				return state;
			}
			try {
				state.query.keys.pk = entity._expectFacets(facets, state.query.facets.pk);
				entity._expectFacets(facets, Object.keys(facets), `"query" composite attributes`);
				state.query.method = MethodTypes.query;
				state.query.type = QueryTypes.is;
				if (state.query.facets.sk) {
					let queryFacets = entity._buildQueryFacets(facets, state.query.facets.sk);
					state.query.keys.sk.push({
						type: state.query.type,
						facets: queryFacets,
					});
				}
				return state;
			} catch(err) {
				state.error = err;
				return state;
			}
		},
		children: ["between", "gte", "gt", "lte", "lt", "begins", "params", "go", "page"],
	},
	between: {
		name: "between",
		action(entity, state, startingFacets = {}, endingFacets = {}) {
			if (state.error !== null) {
				return state;
			}
			try {
				entity._expectFacets(
					startingFacets,
					Object.keys(startingFacets),
					`"between" composite attributes`,
				);
				entity._expectFacets(
					endingFacets,
					Object.keys(endingFacets),
					`"and" composite attributes`,
				);
				state.query.type = QueryTypes.between;
				let queryEndingFacets = entity._buildQueryFacets(
					endingFacets,
					state.query.facets.sk,
				);
				let queryStartingFacets = entity._buildQueryFacets(
					startingFacets,
					state.query.facets.sk,
				);
				state.query.keys.sk.push({
					type: QueryTypes.and,
					facets: queryEndingFacets,
				});
				state.query.keys.sk.push({
					type: QueryTypes.between,
					facets: queryStartingFacets,
				});
				return state;
			} catch(err) {
				state.error = err;
				return state;
			}
		},
		children: ["go", "params", "page"],
	},
	begins: {
		name: "begins",
		action(entity, state, facets = {}) {
			if (state.error !== null) {
				return state;
			}
			try {
				entity._expectFacets(facets, Object.keys(facets), `"gt" composite attributes`);
				state.query.type = QueryTypes.begins;
				let queryFacets = entity._buildQueryFacets(facets, state.query.facets.sk);
				state.query.keys.sk.push({
					type: state.query.type,
					facets: queryFacets,
				});
				return state;
			} catch(err) {
				state.error = err;
				return state;
			}
		},
		children: ["go", "params", "page"],
	},
	gt: {
		name: "gt",
		action(entity, state, facets = {}) {
			if (state.error !== null) {
				return state;
			}
			try {
				entity._expectFacets(facets, Object.keys(facets), `"gt" composite attributes`);
				state.query.type = QueryTypes.gt;
				let queryFacets = entity._buildQueryFacets(facets, state.query.facets.sk);
				state.query.keys.sk.push({
					type: state.query.type,
					facets: queryFacets,
				});
				return state;
			} catch(err) {
				state.error = err;
				return state;
			}
		},
		children: ["go", "params", "page"],
	},
	gte: {
		name: "gte",
		action(entity, state, facets = {}) {
			if (state.error !== null) {
				return state;
			}
			try {
				entity._expectFacets(facets, Object.keys(facets), `"gte" composite attributes`);
				state.query.type = QueryTypes.gte;
				let queryFacets = entity._buildQueryFacets(facets, state.query.facets.sk);
				state.query.keys.sk.push({
					type: state.query.type,
					facets: queryFacets,
				});
				return state;
			} catch(err) {
				state.error = err;
				return state;
			}
		},
		children: ["go", "params", "page"],
	},
	lt: {
		name: "lt",
		action(entity, state, facets = {}) {
			if (state.error !== null) {
				return state;
			}
			try {
				entity._expectFacets(facets, Object.keys(facets), `"lt" composite attributes`);
				state.query.type = QueryTypes.lt;
				let queryFacets = entity._buildQueryFacets(facets, state.query.facets.sk);
				state.query.keys.sk.push({
					type: state.query.type,
					facets: queryFacets,
				});
				return state;
			} catch(err) {
				state.error = err;
				return state;
			}
		},
		children: ["go", "params", "page"],
	},
	lte: {
		name: "lte",
		action(entity, state, facets = {}) {
			if (state.error !== null) {
				return state;
			}
			try {
				entity._expectFacets(facets, Object.keys(facets), `"lte" composite attributes`);
				state.query.type = QueryTypes.lte;
				let queryFacets = entity._buildQueryFacets(facets, state.query.facets.sk);
				state.query.keys.sk.push({
					type: state.query.type,
					facets: queryFacets,
				});
				return state;
			} catch(err) {
				state.error = err;
				return state;
			}
		},
		children: ["go", "params", "page"],
	},
	params: {
		name: "params",
		action(entity, state, options = {}) {
			if (state.error !== null) {
				throw state.error;
			}
			try {
				if (!v.isStringHasLength(options.table) && !v.isStringHasLength(entity._getTableName())) {
					throw new e.ElectroError(e.ErrorCodes.MissingTable, `Table name not defined. Table names must be either defined on the model, instance configuration, or as a query option.`);
				}
				let results;
				if (state.query.method === MethodTypes.query) {
					results = entity._queryParams(state, options);
				} else if (state.query.method === MethodTypes.batchWrite) {
					results = entity._batchWriteParams(state, options);
				} else if (state.query.method === MethodTypes.batchGet) {
					results = entity._batchGetParams(state, options);
				} else {
					results = entity._params(state, options);
				}
				return results;
			} catch(err) {
				throw err;
			}
		},
		children: [],
	},
	go: {
		name: "go",
		action(entity, state, options = {}) {
			if (state.error !== null) {
				return Promise.reject(state.error);
			}
			try {
				if (entity.client === undefined) {
					throw new e.ElectroError(e.ErrorCodes.NoClientDefined, "No client defined on model");
				}
				let params = clauses.params.action(entity, state, options);
				let {config} = entity._applyParameterOptions({}, state.query.options, options);
				return entity.go(state.query.method, params, config);
			} catch(err) {
				return Promise.reject(err);
			}
		},
		children: [],
	},
	page: {
		name: "page",
		action(entity, state, page = null, options = {}) {
			if (state.error !== null) {
				return Promise.reject(state.error);
			}
			try {
				options.page = page;
				options._isPagination = true;
				if (entity.client === undefined) {
					throw new e.ElectroError(e.ErrorCodes.NoClientDefined, "No client defined on model");
				}
				let params = clauses.params.action(entity, state, options);
				let {config} = entity._applyParameterOptions({}, state.query.options, options);
				return entity.go(state.query.method, params, config);
			} catch(err) {
				return Promise.reject(err);
			}
		},
		children: []
	},
};

function initChainState(index, facets = {}, hasSortKey, options) {
	return {
		error: null,
		query: {
			index: index,
			type: "",
			method: "",
			facets: { ...facets },
			update: {
				set: {},
				append: {},
				remove: {},
				add: {},
				subtract: {}
			},
			put: {
				data: {},
			},
			keys: {
				pk: {},
				sk: [],
			},
			filter: {},
			options,
		},
		batch: {
			items: [],
			create() {
				return initChainState(index, facets, hasSortKey, options);
			},
			push(state) {
				this.items.push(state);
			}
		},
		hasSortKey: hasSortKey,
	};
}

module.exports = {
	clauses,
	initChainState
};
