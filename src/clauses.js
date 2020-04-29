const { QueryTypes, MethodTypes } = require("./types");

let clauses = {
	index: {
		// action(entity, state, facets = {}) {
		// 	// todo: maybe all key info is passed on the subsequent query identifiers?
		// 	// todo: look for article/list of all dynamodb query limitations
		// 	// return state;
		// },
		children: ["get", "delete", "update", "query", "put", "scan", "collection"],
	},
	collection: {
		action(entity, state, collection /* istanbul ignore next */ = "", facets /* istanbul ignore next */ = {}) {
			state.query.keys.pk = entity._expectFacets(facets, state.query.facets.pk);
			entity._expectFacets(facets, Object.keys(facets), `"query" facets`);
			state.query.collection = collection;
			state.query.method = MethodTypes.query;
			state.query.type = QueryTypes.collection;
			return state;
		},
		children: ["params", "go", "page"],
	},
	scan: {
		action(entity, state) {
			state.query.method = MethodTypes.scan;
			return state;
		},
		children: ["params", "go", "page"],
	},
	get: {
		action(entity, state, facets = {}) {
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
		},
		children: ["params", "go", "page"],
	},
	delete: {
		action(entity, state, facets = {}) {
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
		},
		children: ["params", "go", "page"],
	},
	put: {
		action(entity, state, payload = {}) {
			let record = entity.model.schema.checkCreate({ ...payload });
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
		},
		children: ["params", "go", "page"],
	},
	update: {
		action(entity, state, facets = {}) {
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
		},
		children: ["set"],
	},
	set: {
		action(entity, state, data) {
			let record = entity.model.schema.checkUpdate({ ...data });
			state.query.update.set = Object.assign(
				{},
				state.query.update.set,
				record,
			);
			return state;
		},
		children: ["set", "go", "params"],
	},
	query: {
		action(entity, state, facets = {}, options = {}) {
			state.query.keys.pk = entity._expectFacets(facets, state.query.facets.pk);
			entity._expectFacets(facets, Object.keys(facets), `"query" facets`);
			state.query.method = MethodTypes.query;
			state.query.type = QueryTypes.begins;
			let queryFacets = entity._buildQueryFacets(facets, state.query.facets.sk);
			state.query.keys.sk.push({
				type: state.query.type,
				facets: queryFacets,
			});
			return state;
		},
		children: ["between", "gte", "gt", "lte", "lt", "params", "go", "page"],
	},
	between: {
		action(entity, state, startingFacets = {}, endingFacets = {}) {
			entity._expectFacets(
				startingFacets,
				Object.keys(startingFacets),
				`"between" facets`,
			);
			entity._expectFacets(
				endingFacets,
				Object.keys(endingFacets),
				`"and" facets`,
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
		},
		children: ["go", "params"],
	},
	gt: {
		action(entity, state, facets = {}) {
			entity._expectFacets(facets, Object.keys(facets), `"gt" facets`);
			state.query.type = QueryTypes.gt;
			let queryFacets = entity._buildQueryFacets(facets, state.query.facets.sk);
			state.query.keys.sk.push({
				type: state.query.type,
				facets: queryFacets,
			});
			return state;
		},
		children: ["go", "params"],
	},
	gte: {
		action(entity, state, facets = {}) {
			entity._expectFacets(facets, Object.keys(facets), `"gte" facets`);
			state.query.type = QueryTypes.gte;
			let queryFacets = entity._buildQueryFacets(facets, state.query.facets.sk);
			state.query.keys.sk.push({
				type: state.query.type,
				facets: queryFacets,
			});
			return state;
		},
		children: ["go", "params"],
	},
	lt: {
		action(entity, state, facets = {}) {
			entity._expectFacets(facets, Object.keys(facets), `"lt" facets`);
			state.query.type = QueryTypes.lt;
			let queryFacets = entity._buildQueryFacets(facets, state.query.facets.sk);
			state.query.keys.sk.push({
				type: state.query.type,
				facets: queryFacets,
			});
			return state;
		},
		children: ["go", "params"],
	},
	lte: {
		action(entity, state, facets = {}) {
			entity._expectFacets(facets, Object.keys(facets), `"lte" facets`);
			state.query.type = QueryTypes.lte;
			let queryFacets = entity._buildQueryFacets(facets, state.query.facets.sk);
			state.query.keys.sk.push({
				type: state.query.type,
				facets: queryFacets,
			});
			return state;
		},
		children: ["go", "params"],
	},
	params: {
		action(entity, state, options = {}) {
			if (state.query.method === MethodTypes.query) {
				return entity._queryParams(state.query, options);
			} else {
				return entity._params(state.query, options);
			}
		},
		children: [],
	},
	go: {
		action(entity, state, options = {}) {
			if (entity.client === undefined) {
				throw new Error("No client defined on model");
			}
			let params = {};
			if (state.query.method === MethodTypes.query) {
				params = entity._queryParams(state.query, options);
			} else {
				params = entity._params(state.query, options);
			}
			return entity.go(state.query.method, params, options);
		},
		children: [],
	},
	page: {
		action(entity, state, page = "", options = {}) {
			options.page = page;
			if (entity.client === undefined) {
				throw new Error("No client defined on model");
			}
			let params = {};
			if (state.query.method === MethodTypes.query) {
				params = entity._queryParams(state.query, options);
			} else {
				params = entity._params(state.query, options);
			}
			return entity.go(state.query.method, params, options);
		},
		children: []
	},
};

module.exports = {
	clauses,
};
