const { QueryTypes, MethodTypes, ItemOperations, ExpressionTypes, TransactionCommitSymbol, TransactionOperations, TerminalOperation, KeyTypes, IndexTypes } = require("./types");
const {AttributeOperationProxy, UpdateOperations, FilterOperationNames} = require("./operations");
const {UpdateExpression} = require("./update");
const {FilterExpression} = require("./where");
const v = require("./validations");
const e = require("./errors");
const u = require("./util");

function toTransactionParams(method, parameters) {
	const operation = TransactionOperations[method];
	if (operation) {
		return {
			[operation]: parameters
		}
	} else if (method === MethodTypes.get) {
		return parameters;
	} else {
		throw new Error('Invalid commit method');
	}
}

function batchAction(action, type, entity, state, payload) {
	if (state.getError() !== null) {
		return state;
	}
	try {
		state.setMethod(type);
		for (let facets of payload) {
			let batchState = action(entity, state.createSubState(), facets);
			if (batchState.getError() !== null) {
				throw batchState.getError();
			}
		}
		return state;
	} catch(err) {
		state.setError(err);
		return state;
	}
}

let clauses = {
	index: {
		name: "index",
		children: ["check", "get", "delete", "update", "query", "upsert", "put", "scan", "collection", "clusteredCollection", "create", "remove", "patch", "batchPut", "batchDelete", "batchGet"],
	},
	clusteredCollection: {
		name: "clusteredCollection",
		action(entity, state, collection = "", facets /* istanbul ignore next */ = {}) {
			if (state.getError() !== null) {
				return state;
			}
			try {
				const { pk, sk } = state.getCompositeAttributes();
				return state
					.setType(QueryTypes.clustered_collection)
					.setMethod(MethodTypes.query)
					.setCollection(collection)
					.setPK(entity._expectFacets(facets, pk))
					.ifSK(() => {
						const {composites, unused} = state.identifyCompositeAttributes(facets, sk, pk);
						state.setSK(composites);
						// we must apply eq on filter on all provided because if the user then does a sort key operation, it'd actually then unexpect results
						if (sk.length > 1) {
							state.filterProperties(FilterOperationNames.eq, {...unused, ...composites});
						}
					})
					.whenOptions(({ options, state }) => {
						if (!options.ignoreOwnership) {
							state.query.options.expressions.names = {
								...state.query.options.expressions.names,
								...state.query.options.identifiers.names,
							};
							state.query.options.expressions.values = {
								...state.query.options.expressions.values,
								...state.query.options.identifiers.values,
							};
							state.query.options.expressions.expression =
								state.query.options.expressions.expression.length > 1
									? `(${state.query.options.expressions.expression}) AND ${state.query.options.identifiers.expression}`
									: `${state.query.options.identifiers.expression}`;
						}
					});

			} catch(err) {
				state.setError(err);
				return state;
			}
		},
		children: ["between", "gte", "gt", "lte", "lt", "begins", "params", "go"],
	},
	collection: {
		name: "collection",
		/* istanbul ignore next */
		action(entity, state, collection = "", facets /* istanbul ignore next */ = {}) {
			if (state.getError() !== null) {
				return state;
			}
			try {
				const {pk, sk} = state.getCompositeAttributes();
				return state
					.setType(QueryTypes.collection)
					.setMethod(MethodTypes.query)
					.setCollection(collection)
					.setPK(entity._expectFacets(facets, pk))
					.whenOptions(({ options, state }) => {
						if (!options.ignoreOwnership) {
							state.query.options.expressions.names = {
								...state.query.options.expressions.names,
								...state.query.options.identifiers.names,
							};
							state.query.options.expressions.values = {
								...state.query.options.expressions.values,
								...state.query.options.identifiers.values,
							};
							state.query.options.expressions.expression =
								state.query.options.expressions.expression.length > 1
									? `(${state.query.options.expressions.expression}) AND ${state.query.options.identifiers.expression}`
									: `${state.query.options.identifiers.expression}`;
						}
					});
			} catch(err) {
				state.setError(err);
				return state;
			}
		},
		children: ["params", "go"],
	},
	scan: {
		name: "scan",
		action(entity, state, config) {
			if (state.getError() !== null) {
				return state;
			}
			try {
				return state.setMethod(MethodTypes.scan)
					.whenOptions(({ state, options }) => {
						if (!options.ignoreOwnership) {
							state.unsafeApplyFilter(FilterOperationNames.eq, entity.identifiers.entity, entity.getName());
							state.unsafeApplyFilter(FilterOperationNames.eq, entity.identifiers.version, entity.getVersion());
						}
					});
			} catch(err) {
				state.setError(err);
				return state;
			}
		},
		children: ["params", "go"],
	},
	get: {
		name: "get",
		/* istanbul ignore next */
		action(entity, state, facets = {}) {
			if (state.getError() !== null) {
				return state;
			}
			try {
				const {pk, sk} = state.getCompositeAttributes();
				const {composites} = state.identifyCompositeAttributes(facets, sk, pk);
				return state
					.setMethod(MethodTypes.get)
					.setType(QueryTypes.eq)
					.setPK(entity._expectFacets(facets, pk))
					.ifSK(() => {
						entity._expectFacets(facets, sk);
						state.setSK(composites);
					});
			} catch(err) {
				state.setError(err);
				return state;
			}
		},
		children: ["params", "go", "commit"],
	},
	check: {
		name: 'check',
		action(...params) {
			return clauses.get.action(...params)
				.setMethod(MethodTypes.check);
		},
		children: ["commit"],
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
			if (state.getError() !== null) {
				return state;
			}
			try {
				const {pk, sk} = state.getCompositeAttributes();
				return state
					.setMethod(MethodTypes.delete)
					.setType(QueryTypes.eq)
					.setPK(entity._expectFacets(facets, pk))
					.ifSK(() => {
						entity._expectFacets(facets, sk);
						state.setSK(state.buildQueryComposites(facets, sk));
					});
			} catch(err) {
				state.setError(err);
				return state;
			}
		},
		children: ["where", "params", "go", "commit"],
	},
	remove: {
		name: "remove",
		/* istanbul ignore next */
		action(entity, state, facets = {}) {
			if (state.getError() !== null) {
				return state;
			}
			try {
				const attributes = state.getCompositeAttributes();
				const filter = state.query.filter[ExpressionTypes.ConditionExpression];
				const {pk, sk} = entity._getPrimaryIndexFieldNames();
				filter.unsafeSet(FilterOperationNames.exists, pk);
				if (sk) {
					filter.unsafeSet(FilterOperationNames.exists, sk);
				}
				return state
					.setMethod(MethodTypes.delete)
					.setType(QueryTypes.eq)
					.setPK(entity._expectFacets(facets, attributes.pk))
					.ifSK(() => {
						entity._expectFacets(facets, attributes.sk);
						state.setSK(state.buildQueryComposites(facets, attributes.sk));
					});
			} catch(err) {
				state.setError(err);
				return state;
			}
		},
		children: ["where", "params", "go", "commit"],
	},
	upsert: {
		name: 'upsert',
		action(entity, state, payload = {}) {
			if (state.getError() !== null) {
				return state;
			}
			try {
				let record = entity.model.schema.checkCreate({...payload});
				const attributes = state.getCompositeAttributes();
				return state
					.setMethod(MethodTypes.upsert)
					.setType(QueryTypes.eq)
					.applyUpsert(record)
					.setPK(entity._expectFacets(record, attributes.pk))
					.ifSK(() => {
						entity._expectFacets(record, attributes.sk);
						state.setSK(entity._buildQueryFacets(record, attributes.sk));
					});
			} catch(err) {
				state.setError(err);
				return state;
			}
		},
		children: ["params", "go", "where", "commit"],
	},
	put: {
		name: "put",
		/* istanbul ignore next */
		action(entity, state, payload = {}) {
			if (state.getError() !== null) {
				return state;
			}
			try {
				let record = entity.model.schema.checkCreate({...payload});
				const attributes = state.getCompositeAttributes();
				return state
					.setMethod(MethodTypes.put)
					.setType(QueryTypes.eq)
					.applyPut(record)
					.setPK(entity._expectFacets(record, attributes.pk))
					.ifSK(() => {
						entity._expectFacets(record, attributes.sk);
						state.setSK(state.buildQueryComposites(record, attributes.sk));
					});
			} catch(err) {
				state.setError(err);
				return state;
			}
		},
		children: ["params", "go", "commit"],
	},
	batchPut: {
		name: "batchPut",
		action: (entity, state, payload) => batchAction(clauses.put.action, MethodTypes.batchWrite, entity, state, payload),
		children: ["params", "go"],
	},
	create: {
		name: "create",
		action(entity, state, payload) {
			if (state.getError() !== null) {
				return state;
			}
			try {
				let record = entity.model.schema.checkCreate({...payload});
				const attributes = state.getCompositeAttributes();
				const filter = state.query.filter[ExpressionTypes.ConditionExpression];
				const {pk, sk} = entity._getPrimaryIndexFieldNames();
				filter.unsafeSet(FilterOperationNames.notExists, pk);
				if (sk) {
					filter.unsafeSet(FilterOperationNames.notExists, sk);
				}
				return state
					.setMethod(MethodTypes.put)
					.setType(QueryTypes.eq)
					.applyPut(record)
					.setPK(entity._expectFacets(record, attributes.pk))
					.ifSK(() => {
						entity._expectFacets(record, attributes.sk);
						state.setSK(state.buildQueryComposites(record, attributes.sk));
					});
			} catch(err) {
				state.setError(err);
				return state;
			}
		},
		children: ["params", "go", "commit"],
	},
	patch: {
		name: "patch",
		action(entity, state, facets) {
			if (state.getError() !== null) {
				return state;
			}
			try {
				const attributes = state.getCompositeAttributes();
				const filter = state.query.filter[ExpressionTypes.ConditionExpression];
				const {pk, sk} = entity._getPrimaryIndexFieldNames();
				filter.unsafeSet(FilterOperationNames.exists, pk);
				if (sk) {
					filter.unsafeSet(FilterOperationNames.exists, sk);
				}
				return state
					.setMethod(MethodTypes.update)
					.setType(QueryTypes.eq)
					.setPK(entity._expectFacets(facets, attributes.pk))
					.ifSK(() => {
						entity._expectFacets(facets, attributes.sk);
						state.setSK(state.buildQueryComposites(facets, attributes.sk));
					});
			} catch(err) {
				state.setError(err);
				return state;
			}
		},
		children: ["set", "append","updateRemove", "updateDelete", "add", "subtract", "data", "commit"],
	},
	update: {
		name: "update",
		action(entity, state, facets) {
			if (state.getError() !== null) {
				return state;
			}
			try {
				const attributes = state.getCompositeAttributes();
				return state
					.setMethod(MethodTypes.update)
					.setType(QueryTypes.eq)
					.setPK(entity._expectFacets(facets, attributes.pk))
					.ifSK(() => {
						entity._expectFacets(facets, attributes.sk);
						state.setSK(state.buildQueryComposites(facets, attributes.sk));
					});
			} catch(err) {
				state.setError(err);
				return state;
			}
		},
		children: ["data", "set", "append", "add", "updateRemove", "updateDelete", "go", "params", "subtract", "commit"],
	},
	data: {
		name: "data",
		action(entity, state, cb) {
			if (state.getError() !== null) {
				return state;
			}
			try {
				state.query.updateProxy.invokeCallback(cb);
				for (const path of Object.keys(state.query.update.refs)) {
					const operation = state.query.update.impacted[path];
					const attribute = state.query.update.refs[path];
					// note: keyValue will be empty if the user used `name`/`value` operations
					// because it becomes hard to know how they are used and which attribute
					// should validate the change. This is an edge case however, this change
					// still improves on the existing implementation.
					const keyValue = state.query.update.paths[path] || {};
					if (!attribute) {
						throw new e.ElectroAttributeValidationError(path, `Attribute "${path}" does not exist on model.`);
					}

					entity.model.schema.checkOperation(attribute, operation, keyValue.value);
				}
				return state;
			} catch(err) {
				state.setError(err);
				return state;
			}
		},
		children: ["data", "set", "append", "add", "updateRemove", "updateDelete", "go", "params", "subtract", "commit"],
	},
	set: {
		name: "set",
		action(entity, state, data) {
			if (state.getError() !== null) {
				return state;
			}
			try {
				entity.model.schema.checkUpdate(data);
				state.query.updateProxy.fromObject(ItemOperations.set, data);
				return state;
			} catch(err) {
				state.setError(err);
				return state;
			}
		},
		children: ["data", "set", "append", "add", "updateRemove", "updateDelete", "go", "params", "subtract", "commit"],
	},
	append: {
		name: "append",
		action(entity, state, data = {}) {
			if (state.getError() !== null) {
				return state;
			}
			try {
				entity.model.schema.checkUpdate(data);
				state.query.updateProxy.fromObject(ItemOperations.append, data);
				return state;
			} catch(err) {
				state.setError(err);
				return state;
			}
		},
		children: ["data", "set", "append", "add", "updateRemove", "updateDelete", "go", "params", "subtract", "commit"],
	},
	updateRemove: {
		name: "remove",
		action(entity, state, data) {
			if (state.getError() !== null) {
				return state;
			}
			try {
				if (!Array.isArray(data)) {
					throw new Error("Update method 'remove' expects type Array");
				}
				entity.model.schema.checkRemove(data);
				state.query.updateProxy.fromArray(ItemOperations.remove, data);
				return state;
			} catch(err) {
				state.setError(err);
				return state;
			}
		},
		children: ["data", "set", "append", "add", "updateRemove", "updateDelete", "go", "params", "subtract", "commit"],
	},
	updateDelete: {
		name: "delete",
		action(entity, state, data) {
			if (state.getError() !== null) {
				return state;
			}
			try {
				entity.model.schema.checkUpdate(data);
				state.query.updateProxy.fromObject(ItemOperations.delete, data);
				return state;
			} catch(err) {
				state.setError(err);
				return state;
			}
		},
		children: ["data", "set", "append", "add", "updateRemove", "updateDelete", "go", "params", "subtract", "commit"],
	},
	add: {
		name: "add",
		action(entity, state, data) {
			if (state.getError() !== null) {
				return state;
			}
			try {
				entity.model.schema.checkUpdate(data);
				state.query.updateProxy.fromObject(ItemOperations.add, data);
				return state;
			} catch(err) {
				state.setError(err);
				return state;
			}
		},
		children: ["data", "set", "append", "add", "updateRemove", "updateDelete", "go", "params", "subtract", "commit"],
	},
	subtract: {
		name: "subtract",
		action(entity, state, data) {
			if (state.getError() !== null) {
				return state;
			}
			try {
				entity.model.schema.checkUpdate(data);
				state.query.updateProxy.fromObject(ItemOperations.subtract, data);
				return state;
			} catch(err) {
				state.setError(err);
				return state;
			}
		},
		children: ["data", "set", "append", "add", "updateRemove", "updateDelete", "go", "params", "subtract", "commit"],
	},
	query: {
		name: "query",
		action(entity, state, facets, options = {}) {
			if (state.getError() !== null) {
				return state;
			}
			try {
				state.addOption('_isPagination', true);
				const {pk, sk} = state.getCompositeAttributes();
				return state
					.setMethod(MethodTypes.query)
					.setType(QueryTypes.is)
					.setPK(entity._expectFacets(facets, pk))
					.ifSK(() => {
						const {composites, unused} = state.identifyCompositeAttributes(facets, sk, pk);
						state.setSK(state.buildQueryComposites(facets, sk));
						// we must apply eq on filter on all provided because if the user then does a sort key operation, it'd actually then unexpect results
						if (sk.length > 1) {
							state.filterProperties(FilterOperationNames.eq, {...unused, ...composites});
						}

						state.whenOptions(({ options, state }) => {
							if (state.query.options.indexType === IndexTypes.clustered && Object.keys(composites).length < sk.length && !options.ignoreOwnership) {
								state.unsafeApplyFilter(FilterOperationNames.eq, entity.identifiers.entity, entity.getName())
									.unsafeApplyFilter(FilterOperationNames.eq, entity.identifiers.version, entity.getVersion());
							}
						});
					});
			} catch(err) {
				state.setError(err);
				return state;
			}
		},
		children: ["between", "gte", "gt", "lte", "lt", "begins", "params", "go"],
	},
	between: {
		name: "between",
		action(entity, state, startingFacets = {}, endingFacets = {}) {
			if (state.getError() !== null) {
				return state;
			}
			try {
				const {pk, sk} = state.getCompositeAttributes();
				const endingSk = state.identifyCompositeAttributes(endingFacets, sk, pk);
				const startingSk = state.identifyCompositeAttributes(startingFacets, sk, pk);
				return state
					.setType(QueryTypes.and)
					.setSK(endingSk.composites)
					.setType(QueryTypes.between)
					.setSK(startingSk.composites)
					.filterProperties(FilterOperationNames.lte, endingSk.composites);
			} catch(err) {
				state.setError(err);
				return state;
			}
		},
		children: ["go", "params"],
	},
	begins: {
		name: "begins",
		action(entity, state, facets = {}) {
			if (state.getError() !== null) {
				return state;
			}
			try {
				return state
					.setType(QueryTypes.begins)
					.ifSK(state => {
						const attributes = state.getCompositeAttributes();
						state.setSK(state.buildQueryComposites(facets, attributes.sk));
					});
			} catch(err) {
				state.setError(err);
				return state;
			}
		},
		children: ["go", "params"],
	},
	gt: {
		name: "gt",
		action(entity, state, facets = {}) {
			if (state.getError() !== null) {
				return state;
			}
			try {

				return state
					.setType(QueryTypes.gt)
					.ifSK(state => {
						const {pk, sk} = state.getCompositeAttributes();
						const {composites} = state.identifyCompositeAttributes(facets, sk, pk);
						state.setSK(composites);
						state.filterProperties(FilterOperationNames.gt, {
							...composites,
						});
					});
			} catch(err) {
				state.setError(err);
				return state;
			}
		},
		children: ["go", "params"],
	},
	gte: {
		name: "gte",
		action(entity, state, facets = {}) {
			if (state.getError() !== null) {
				return state;
			}
			try {
				return state
					.setType(QueryTypes.gte)
					.ifSK(state => {
						const attributes = state.getCompositeAttributes();
						state.setSK(state.buildQueryComposites(facets, attributes.sk));
					});
			} catch(err) {
				state.setError(err);
				return state;
			}
		},
		children: ["go", "params"],
	},
	lt: {
		name: "lt",
		action(entity, state, facets = {}) {
			if (state.getError() !== null) {
				return state;
			}
			try {
				return state.setType(QueryTypes.lt)
					.ifSK(state => {
						const {pk, sk} = state.getCompositeAttributes();
						const {composites} = state.identifyCompositeAttributes(facets, sk, pk);
						state.setSK(composites);
					});
			} catch(err) {
				state.setError(err);
				return state;
			}
		},
		children: ["go", "params"],
	},
	lte: {
		name: "lte",
		action(entity, state, facets = {}) {
			if (state.getError() !== null) {
				return state;
			}
			try {
				return state.setType(QueryTypes.lte)
					.ifSK(state => {
						const {pk, sk} = state.getCompositeAttributes();
						const {composites} = state.identifyCompositeAttributes(facets, sk, pk);
						state.setSK(composites);
						state.filterProperties(FilterOperationNames.lte, {
							...composites,
						});
					});
			} catch(err) {
				state.setError(err);
				return state;
			}
		},
		children: ["go", "params"],
	},
	commit: {
		name: 'commit',
		action(entity, state, options) {
			if (state.getError() !== null) {
				throw state.error;
			}

			const results = clauses.params.action(entity, state, {
				...options,
				_returnOptions: true,
				_isTransaction: true,
			});

			const method = TransactionOperations[state.query.method];
			if (!method) {
				throw new Error('Invalid commit method');
			}

			return {
				[method]: results.params,
				[TransactionCommitSymbol]: () => {
					return {
						entity,
					}
				},
			}
		},
		children: [],
	},
	params: {
		name: "params",
		action(entity, state, options = {}) {
			if (state.getError() !== null) {
				throw state.error;
			}
			try {
				if (!v.isStringHasLength(options.table) && !v.isStringHasLength(entity.getTableName())) {
					throw new e.ElectroError(e.ErrorCodes.MissingTable, `Table name not defined. Table names must be either defined on the model, instance configuration, or as a query option.`);
				}
				const method = state.getMethod();
				const normalizedOptions = entity._normalizeExecutionOptions({
					provided: [ state.getOptions(), state.query.options, options ],
					context: { operation: options._isTransaction ? MethodTypes.transactWrite : undefined }
				});
				state.applyWithOptions(normalizedOptions);
				let results;
				switch (method) {
					case MethodTypes.query: {
						results = entity._queryParams(state, normalizedOptions);
						break;
					}
					case MethodTypes.batchWrite: {
						results = entity._batchWriteParams(state, normalizedOptions);
						break;
					}
					case MethodTypes.batchGet: {
						results = entity._batchGetParams(state, normalizedOptions);
						break;
					}
					default: {
						results = entity._params(state, normalizedOptions);
						break;
					}
				}

				if (method === MethodTypes.update && results.ExpressionAttributeValues && Object.keys(results.ExpressionAttributeValues).length === 0) {
					// An update that only does a `remove` operation would result in an empty object
					// todo: change the getValues() method to return undefined in this case (would potentially require a more generous refactor)
					delete results.ExpressionAttributeValues;
				}

				if (options._returnOptions) {
					return {
						params: results,
						options: normalizedOptions,
					}
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
			if (state.getError() !== null) {
				return Promise.reject(state.error);
			}
			try {
				if (entity.client === undefined) {
					throw new e.ElectroError(e.ErrorCodes.NoClientDefined, "No client defined on model");
				}
				options.terminalOperation = TerminalOperation.go;
				const paramResults = clauses.params.action(entity, state, { ...options, _returnOptions: true });
				return entity.go(state.getMethod(), paramResults.params, paramResults.options);
			} catch(err) {
				return Promise.reject(err);
			}
		},
		children: [],
	},
};

class ChainState {
	constructor({index = "", compositeAttributes = {}, attributes = {}, hasSortKey = false, options = {}, parentState = null} = {}) {
		const update = new UpdateExpression({prefix: "_u"});
		this.parentState = parentState;
		this.error = null;
		this.attributes = attributes;
		this.query = {
			collection: "",
			index: index,
			type: "",
			method: "",
			facets: { ...compositeAttributes },
			update,
			updateProxy: new AttributeOperationProxy({
				builder: update,
				attributes: attributes,
				operations: UpdateOperations,
			}),
			put: {
				data: {},
			},
			upsert: {
				data: {}
			},
			keys: {
				provided: [],
				pk: {},
				sk: [],
			},
			filter: {
				[ExpressionTypes.ConditionExpression]: new FilterExpression(),
				[ExpressionTypes.FilterExpression]: new FilterExpression()
			},
			options,
		};
		this.subStates = [];
		this.applyAfterOptions = [];
		this.hasSortKey = hasSortKey;
		this.prev = null;
		this.self = null;
	}

	init(entity, allClauses, currentClause) {
		let current = {};
		for (let child of currentClause.children) {
			const name = allClauses[child].name;
			current[name] = (...args) => {
				this.prev = this.self;
				this.self = child;
				let results = allClauses[child].action(entity, this, ...args);
				if (allClauses[child].children.length) {
					return this.init(entity, allClauses, allClauses[child]);
				} else {
					return results;
				}
			};
		}
		return current;
	}

	getMethod() {
		return this.query.method;
	}

	getOptions() {
		return this.query.options;
	}

	addOption(key, value) {
		this.query.options[key] = value;
	}

	_appendProvided(type, attributes) {
		const newAttributes = Object.keys(attributes).map(attribute => {
			return {
				type,
				attribute
			}
		});
		return u.getUnique(this.query.keys.provided, newAttributes);
	}

	setPK(attributes) {
		this.query.keys.pk = attributes;
		this.query.keys.provided = this._appendProvided(KeyTypes.pk, attributes);

		return this;
	}

	ifSK(cb) {
		if (this.hasSortKey) {
			cb(this);
		}
		return this;
	}

	getCompositeAttributes() {
		return this.query.facets;
	}

	buildQueryComposites(provided, definition) {
		return definition
			.map(name => [name, provided[name]])
				.reduce(
				(result, [name, value]) => {
					if (value !== undefined) {
						result[name] = value;
					}
					return result;
				},
				{},
			);
	}

	identifyCompositeAttributes(provided, defined, skip) {
		// todo: make sure attributes are valid
		const composites = {};
		const unused = {};
		const definedSet = new Set(defined || []);
		const skipSet = new Set(skip || []);
		for (const key of Object.keys(provided)) {
			const value = provided[key];
			if (definedSet.has(key)) {
				composites[key] = value;
			} else if (skipSet.has(key)) {
				continue;
			} else {
				unused[key] = value;
			}
		}

		return {
			composites,
			unused,
		}
	}

	applyFilter(operation, name, ...values) {
		if (FilterOperationNames[operation] !== undefined & name !== undefined && values.length > 0) {
			const attribute = this.attributes[name];
			if (attribute !== undefined) {
				this.unsafeApplyFilter(operation, attribute.field, ...values);
			}
		}
		return this;
	}

	unsafeApplyFilter(operation, name, ...values) {
		if (FilterOperationNames[operation] !== undefined & name !== undefined && values.length > 0) {
			const filter = this.query.filter[ExpressionTypes.FilterExpression];
			filter.unsafeSet(operation, name, ...values);
		}
		return this;
	}

	filterProperties(operation, obj = {}) {
		for (const property in obj) {
			const value = obj[property];
			if (value !== undefined) {
				this.applyFilter(operation, property, value);
			}
		}
		return this;
	}

	setSK(attributes, type = this.query.type) {
		if (this.hasSortKey) {
			this.query.keys.sk.push({
				type: type,
				facets: attributes
			});
			this.query.keys.provided = this._appendProvided(KeyTypes.sk, attributes);
		}
		return this;
	}

	setType(type) {
		if (!QueryTypes[type]) {
			throw new Error(`Invalid query type: "${type}"`);
		}
		this.query.type = QueryTypes[type];
		return this;
	}

	setMethod(method) {
		if (!MethodTypes[method]) {
			throw new Error(`Invalid method type: "${method}"`);
		}
		this.query.method = MethodTypes[method];
		return this;
	}

	setCollection(collection) {
		this.query.collection = collection;
		return this;
	}

	createSubState() {
		let subState = new ChainState({
			parentState: this,
			index: this.query.index,
			attributes: this.attributes,
			hasSortKey: this.hasSortKey,
			options: this.query.options,
			compositeAttributes: this.query.facets
		});
		this.subStates.push(subState);
		return subState;
	}

	getError() {
		return this.error;
	}

	setError(err) {
		this.error = err;
		if (this.parentState) {
			this.parentState.setError(err);
		}
	}

	applyUpsert(data = {}) {
		this.query.upsert.data = {...this.query.upsert.data, ...data};
		return this;
	}

	applyPut(data = {}) {
		this.query.put.data = {...this.query.put.data, ...data};
		return this;
	}

	whenOptions(fn) {
		if (v.isFunction(fn)) {
			this.applyAfterOptions.push((options) => {
				fn({ options, state: this });
			});
		}
	}

	applyWithOptions(options = {}) {
		this.applyAfterOptions.forEach((fn) => fn(options));
	}
}

module.exports = {
	clauses,
	ChainState,
};
