"use strict";
const { Schema } = require("./schema");
const { AllPages, 
	KeyCasing, 
	TableIndex, 
	FormatToReturnValues, 
	ReturnValues, 
	EntityVersions, 
	ItemOperations, 
	UnprocessedTypes, 
	Pager, 
	ElectroInstance, 
	KeyTypes, 
	QueryTypes, 
	MethodTypes, 
	Comparisons, 
	ExpressionTypes, 
	ModelVersions, 
	ElectroInstanceTypes, 
	MaxBatchItems, 
	TerminalOperation, 
	ResultOrderOption,
	ResultOrderParam,
	IndexTypes,
	PartialComparisons,
	MethodTypeTranslation,
	TransactionCommitSymbol,
} = require("./types");
const { FilterFactory } = require("./filters");
const { FilterOperations } = require("./operations");
const { WhereFactory } = require("./where");
const { clauses, ChainState } = require("./clauses");
const {EventManager} = require('./events');
const validations = require("./validations");
const c = require('./client');
const u = require("./util");
const e = require("./errors");
const v = require('./validations');

class Entity {
	constructor(model, config = {}) {
		config = c.normalizeConfig(config);
		this.eventManager = new EventManager({
			listeners: config.listeners
		});
		this.eventManager.add(config.logger);
		this._validateModel(model);
		this.version = EntityVersions.v1;
		this.config = config;
		this.client = config.client;
		this.model = this._parseModel(model, config);
		/** start beta/v1 condition **/
		this.config.table = config.table || model.table;
		/** end beta/v1 condition **/
		this._filterBuilder = new FilterFactory(this.model.schema.attributes, FilterOperations);
		this._whereBuilder = new WhereFactory(this.model.schema.attributes, FilterOperations);
		this._clausesWithFilters = this._filterBuilder.injectFilterClauses(clauses, this.model.filters);
		this._clausesWithFilters = this._whereBuilder.injectWhereClauses(this._clausesWithFilters);

		this.query = {};
		for (let accessPattern in this.model.indexes) {
			let index = this.model.indexes[accessPattern].index;
			this.query[accessPattern] = (...values) => {
				const options = {
					indexType: this.model.indexes[accessPattern].type || IndexTypes.isolated,
				}
				return this._makeChain(index, this._clausesWithFilters, clauses.index, options).query(...values);
			};
		}
		this.config.identifiers = config.identifiers || {};
		this.identifiers = {
			entity: this.config.identifiers.entity || "__edb_e__",
			version: this.config.identifiers.version || "__edb_v__",
		};
		this._instance = ElectroInstance.entity;
		this._instanceType = ElectroInstanceTypes.entity;
		this.schema = model;
	}

	get scan() {
		return this._makeChain(TableIndex, this._clausesWithFilters, clauses.index, {_isPagination: true}).scan();
	}

	setIdentifier(type = "", identifier = "") {
		if (!this.identifiers[type]) {
			throw new e.ElectroError(e.ErrorCodes.InvalidIdentifier, `Invalid identifier type: "${type}". Valid identifiers include: ${u.commaSeparatedString(Object.keys(this.identifiers))}`);
		} else {
			this.identifiers[type] = identifier;
		}
	}

	getName() {
		return this.model.entity;
	}

	getVersion() {
		return this.model.version;
	}

	ownsItem(item) {
		return (
			item &&
			this.getName() === item[this.identifiers.entity] &&
			this.getVersion() === item[this.identifiers.version] &&
			validations.isStringHasLength(item[this.identifiers.entity]) &&
			validations.isStringHasLength(item[this.identifiers.version])
		) || !!this.ownsKeys(item)
	}

	ownsKeys(key = {}) {
		let {pk, sk} = this.model.prefixes[TableIndex];
		let hasSK = this.model.lookup.indexHasSortKeys[TableIndex];
		let pkMatch = typeof key[pk.field] === "string" && key[pk.field].startsWith(pk.prefix);
		let skMatch = pkMatch && !hasSK;
		if (pkMatch && hasSK) {
			skMatch = typeof key[sk.field] === "string" && key[sk.field].startsWith(sk.prefix);
		}

		return (pkMatch && skMatch &&
			this._formatKeysToItem(TableIndex, key) !== null);
	}

	ownsCursor(cursor) {
		if (typeof cursor === 'string') {
			cursor = u.cursorFormatter.deserialize(cursor);
		}
		return this.ownsKeys(cursor);
	}

	serializeCursor(key) {
		return u.cursorFormatter.serialize(key);
	}

	deserializeCursor(cursor) {
		return u.cursorFormatter.deserialize(cursor);
	}

	/** @depricated pagers no longer exist, use the new cursor api */
	ownsPager(pager, index = TableIndex) {
		if (pager === null) {
			return false;
		}
		let tableIndexFacets = this.model.facets.byIndex[index];
		// todo: is the fact it doesn't use the provided index a bug?
		// feels like collections may have played a roll into why this is this way
		let indexFacets = this.model.facets.byIndex[index];

		// Unknown index
		if (tableIndexFacets === undefined || indexFacets === undefined) {
			return false;
		}

		// Should match all primary index facets
		let matchesTableIndex = tableIndexFacets.all.every((facet) => {
			return pager[facet.name] !== undefined;
		});

		// If the pager doesnt match the table index, exit early
		if (!matchesTableIndex) {
			return false;
		}

		return indexFacets.all.every((facet) => {
			return pager[facet.name] !== undefined;
		});
	}

	match(facets = {}) {
		const options = { _isPagination: true };
		const match = this._findBestIndexKeyMatch(facets);
		if (match.shouldScan) {
			return this._makeChain(TableIndex, this._clausesWithFilters, clauses.index, options)
				.scan()
				.filter(attr => {
					let eqFilters = [];
					for (let facet of Object.keys(facets)) {
						if (attr[facet] !== undefined && facets[facet] !== undefined) {
							eqFilters.push(attr[facet].eq(facets[facet]));
						}
					}
				return eqFilters.join(" AND ");
			});
		} else {
			return this._makeChain(match.index, this._clausesWithFilters, clauses.index, options)
				.query(facets)
				.filter(attr => {
					let eqFilters = [];
					for (let facet of Object.keys(facets)) {
						if (attr[facet] !== undefined && facets[facet] !== undefined) {
							eqFilters.push(attr[facet].eq(facets[facet]));
						}
					}
					return eqFilters.join(" AND ");
				});
		}
	}

	find(facets = {}) {
		const options = { _isPagination: true };
		const match = this._findBestIndexKeyMatch(facets);
		if (match.shouldScan) {
			return this._makeChain(TableIndex, this._clausesWithFilters, clauses.index, options).scan();
		} else {
			return this._makeChain(match.index, this._clausesWithFilters, clauses.index, options).query(facets);
		}
	}

	collection(collection = "", clauses = {}, facets = {}, options = {}) {
		const chainOptions = {
			...options,
			_isCollectionQuery: true,
		};

		let index = this.model.translations.collections.fromCollectionToIndex[collection];
		if (index === undefined) {
			throw new Error(`Invalid collection: ${collection}`);
		}
		const chain = this._makeChain(index, clauses, clauses.index, chainOptions);
		if (options.indexType === IndexTypes.clustered) {
			return chain.clusteredCollection(
				collection,
				facets,
			);
		} else {
			return chain.collection(
				collection,
				facets,
			);
		}
	}

	_validateModel(model) {
		return validations.model(model);
	}

	check(compositeAttributes = {}) {
		return this._makeChain(TableIndex, this._clausesWithFilters, clauses.index).check(compositeAttributes);
	}

	get(facets = {}) {
		let index = TableIndex;
		if (Array.isArray(facets)) {
			return this._makeChain(index, this._clausesWithFilters, clauses.index).batchGet(facets);
		} else {
			return this._makeChain(index, this._clausesWithFilters, clauses.index).get(facets);
		}
	}


	delete(facets = {}) {
		let index = TableIndex;
		if (Array.isArray(facets)) {
			return this._makeChain(index, this._clausesWithFilters, clauses.index).batchDelete(facets);
		} else {
			return this._makeChain(index, this._clausesWithFilters, clauses.index).delete(facets);
		}
	}

	put(attributes = {}) {
		let index = TableIndex;
		if (Array.isArray(attributes)) {
			return this._makeChain(index, this._clausesWithFilters, clauses.index).batchPut(attributes);
		} else {
			return this._makeChain(index, this._clausesWithFilters, clauses.index).put(attributes);
		}
	}

	upsert(attributes = {}) {
		let index = TableIndex;
		return this._makeChain(index, this._clausesWithFilters, clauses.index).upsert(attributes);
	}

	create(attributes = {}) {
		let index = TableIndex;
		let options = {};
		return this._makeChain(index, this._clausesWithFilters, clauses.index, options).create(attributes);
	}

	update(facets = {}) {
		let index = TableIndex;
		return this._makeChain(index, this._clausesWithFilters, clauses.index).update(facets);
	}

	patch(facets = {}) {
		let index = TableIndex;
		let options = {};
		return this._makeChain(index, this._clausesWithFilters, clauses.index, options).patch(facets);
	}

	remove(facets = {}) {
		let index = TableIndex;
		let options = {};
		return this._makeChain(index, this._clausesWithFilters, clauses.index, options).remove(facets);
	}

	async transactWrite(parameters, config) {
		let response = await this._exec(MethodTypes.transactWrite, parameters, config);
		return response;
	}

	async transactGet(parameters, config) {
		let response = await this._exec(MethodTypes.transactGet, parameters, config);
		return response;
	}

	async go(method, parameters = {}, config = {}) {
		let stackTrace;
		if (!config.originalErr) {
			stackTrace = new e.ElectroError(e.ErrorCodes.AWSError);
		}
		try {
			switch (method) {
				case MethodTypes.batchWrite:
					return await this.executeBulkWrite(parameters, config);
				case MethodTypes.batchGet:
					return await this.executeBulkGet(parameters, config);
				case MethodTypes.query:
				case MethodTypes.scan:
					return await this.executeQuery(method, parameters, config);
				default:
					return await this.executeOperation(method, parameters, config);
			}
		} catch (err) {
			if (config.originalErr || stackTrace === undefined) {
				return Promise.reject(err);
			} else {
				if (err.__isAWSError) {
					stackTrace.message = new e.ElectroError(e.ErrorCodes.AWSError, `Error thrown by DynamoDB client: "${err.message}"`).message;
					return Promise.reject(stackTrace);
				} else if (err.isElectroError) {
					return Promise.reject(err);
				} else {
					stackTrace.message = new e.ElectroError(e.ErrorCodes.UnknownError, err.message).message;
					return Promise.reject(stackTrace);
				}
			}
		}
	}

	async _exec(method, params, config = {}) {
		const notifyQuery = () => {
			this.eventManager.trigger({
				type: "query",
				method,
				params,
				config,
			}, config.listeners);
		};
		const notifyResults = (results, success) => {
			this.eventManager.trigger({
				type: "results",
				method,
				config,
				success,
				results,
			}, config.listeners);
		}
		const dynamoDBMethod = MethodTypeTranslation[method];
		return this.client[dynamoDBMethod](params).promise()
			.then((results) => {
				notifyQuery();
				notifyResults(results, true);
				return results;
			})
			.catch(err => {
				notifyQuery();
				notifyResults(err, false);
				err.__isAWSError = true;
				throw err;
			});
	}

	async executeBulkWrite(parameters, config) {
		if (!Array.isArray(parameters)) {
			parameters = [parameters];
		}
		let results = [];
		let concurrent = this._normalizeConcurrencyValue(config.concurrent)
		let concurrentOperations = u.batchItems(parameters, concurrent);
		for (let operation of concurrentOperations) {
			await Promise.all(operation.map(async params => {
				let response = await this._exec(MethodTypes.batchWrite, params, config);
				if (validations.isFunction(config.parse)) {
					let parsed = config.parse(config, response);
					results.push(parsed.data);
				} else {
					let {unprocessed} = this.formatBulkWriteResponse(response, config);
					for (let u of unprocessed) {
						results.push(u);
					}
				}
			}));
		}

		return { unprocessed: results };
	}

	_createNewBatchGetOrderMaintainer(config = {}) {
		const pkName = this.model.translations.keys[TableIndex].pk;
		const skName = this.model.translations.keys[TableIndex].sk;
		const enabled = !!config.preserveBatchOrder;
		const table = this.config.table;
		const keyFormatter = ((record = {}) => {
			const pk = record[pkName];
			const sk = record[skName];
			return `${pk}${sk}`;
		});

		return new u.BatchGetOrderMaintainer({
			table,
			enabled,
			keyFormatter,
		});
	}

	async executeBulkGet(parameters, config) {
		if (!Array.isArray(parameters)) {
			parameters = [parameters];
		}

		const orderMaintainer = this._createNewBatchGetOrderMaintainer(config);
		orderMaintainer.defineOrder(parameters);
		let concurrent = this._normalizeConcurrencyValue(config.concurrent);
		let concurrentOperations = u.batchItems(parameters, concurrent);
		let resultsAll = config.preserveBatchOrder
			? new Array(orderMaintainer.getSize()).fill(null)
			: [];
		let unprocessedAll = [];
		for (let operation of concurrentOperations) {
			await Promise.all(operation.map(async params => {
				let response = await this._exec(MethodTypes.batchGet, params, config);
				if (validations.isFunction(config.parse)) {
					const parsed = config.parse(config, response);
					resultsAll.push(parsed.data);
				} else {
					this.applyBulkGetResponseFormatting({
						orderMaintainer,
						resultsAll,
						unprocessedAll,
						response,
						config
					});
				}
			}));
		}
		return { data: resultsAll, unprocessed: unprocessedAll };
	}

	async hydrate(index, keys = [], config) {
		const items = keys
			.map(key => this._formatKeysToItem(index, key))
			.filter(item => item !== null);

		const results = await this.get(items).go({
			...config,
			hydrate: false,
			parse: undefined,
			hydrator: undefined,
			_isCollectionQuery: false,
			preserveBatchOrder: true,
			ignoreOwnership: config._providedIgnoreOwnership,
		});
		return results;
	}

	async executeQuery(method, parameters, config = {}) {
		let results = config._isCollectionQuery
			? {}
			: [];
		let ExclusiveStartKey = this._formatExclusiveStartKey(config);
		if (ExclusiveStartKey === null) {
			ExclusiveStartKey = undefined;
		}
		let pages = this._normalizePagesValue(config.pages);
		let configLimit = this._normalizeNumberOptionsValue('limit', config.limit);
		let configCount = this._normalizeNumberOptionsValue('count', config.count);
		let max = this._safeMinimum(configLimit, configCount);
		let iterations = 0;
		let count = 0;
		let hydratedUnprocessed = [];
		const shouldHydrate = config.hydrate && method === MethodTypes.query;
		do {
			let remainingCount = configCount !== undefined
				? max - count
				: undefined;

			let limit = configLimit !== undefined
				? max - count
				: undefined;

			let params = { ExclusiveStartKey, ...parameters };

			if (config.raw || (limit !== undefined && remainingCount === undefined)) {
				params.Limit = limit;
			}

			let response = await this._exec(method, params, config);

			response = this.formatResponse(response, parameters.IndexName, {
				...config,
				count: remainingCount,
				includeKeys: shouldHydrate || config.includeKeys,
				ignoreOwnership: shouldHydrate || config.ignoreOwnership,
				_returnLastEvaluatedKeyRaw: true,
			});

			ExclusiveStartKey = response.lastEvaluatedKey;
			delete response.lastEvaluatedKey;

			if (config.raw) {
				return response;
			} else if (config._isCollectionQuery) {
				for (const entity in response.data) {
					if (max) {
						count += response.data[entity].length;
					}
					let items = response.data[entity];
					if (shouldHydrate && items.length) {
						const hydrated = await config.hydrator(entity, parameters.IndexName, items, config);
						items = hydrated.data;
						hydratedUnprocessed = hydratedUnprocessed.concat(hydrated.unprocessed);
					}
					results[entity] = results[entity] || [];
					results[entity] = [...results[entity], ...items];
				}
			} else if (Array.isArray(response.data)) {
				if (max) {
					count += response.data.length;
				}
				let items = response.data;
				if (shouldHydrate) {
					const hydrated = await this.hydrate(parameters.IndexName, items, config);
					items = hydrated.data;
					hydratedUnprocessed = hydratedUnprocessed.concat(hydrated.unprocessed);
				}
				results = [...results, ...items];
			} else {
				return response;
			}
			iterations++;
		} while(
			ExclusiveStartKey &&
			(pages === AllPages || iterations < pages) &&
			(max === undefined || count < max)
		);

		const cursor = this._formatReturnPager(config, ExclusiveStartKey);

		if (shouldHydrate) {
			return {
				cursor,
				data: results,
				unprocessed: hydratedUnprocessed,
			};
		}
		return { data: results, cursor };
	}

	async executeOperation(method, parameters, config) {
		let response = await this._exec(method, parameters, config);
		switch (parameters.ReturnValues) {
			case FormatToReturnValues.none:
				return { data: null };
			case FormatToReturnValues.all_new:
			case FormatToReturnValues.all_old:
			case FormatToReturnValues.updated_new:
			case FormatToReturnValues.updated_old:
				return this.formatResponse(response, TableIndex, config);
			case FormatToReturnValues.default:
			default:
				return this._formatDefaultResponse(method, parameters.IndexName, parameters, config, response);
		}
	}

	_formatDefaultResponse(method, index, parameters, config = {}, response) {
		switch (method) {
			case MethodTypes.put:
			case MethodTypes.create:
				return this.formatResponse(parameters, index, config);
			case MethodTypes.update:
			case MethodTypes.patch:
			case MethodTypes.delete:
			case MethodTypes.remove:
			case MethodTypes.upsert:
				return this.formatResponse(response, index, {...config, _objectOnEmpty: true});
			default:
				return this.formatResponse(response, index, config);
		}
	}

	cleanseRetrievedData(item = {}, options = {}) {
		let { includeKeys } = options;
		let data = {};
		let names = this.model.schema.translationForRetrieval;
		for (let [attr, value] of Object.entries(item)) {
			let name = names[attr];
			if (name) {
				data[name] = value;
			} else if (includeKeys) {
				data[attr] = value;
			}
		}
		return data;
	}

	formatBulkWriteResponse(response = {}, config = {}) {
		if (!response || !response.UnprocessedItems) {
			return response;
		}
		const table = config.table || this.getTableName();
		const index = TableIndex;
		let unprocessed = response.UnprocessedItems[table];
		if (Array.isArray(unprocessed) && unprocessed.length) {
			unprocessed = unprocessed.map(request => {
				if (request.PutRequest) {
					return this.formatResponse(request.PutRequest, index, config).data;
				} else if (request.DeleteRequest) {
					if (config.unprocessed === UnprocessedTypes.raw) {
						return request.DeleteRequest.Key;
					} else {
						return this._formatKeysToItem(index, request.DeleteRequest.Key);
					}
				} else {
					throw new Error("Unknown response format");
				}
			});
		} else {
			unprocessed = [];
		}
		
		return { unprocessed };
	}

	applyBulkGetResponseFormatting({
		resultsAll,
		unprocessedAll,
		orderMaintainer,
		response = {},
		config = {},
	}) {
		const table = config.table || this.getTableName();
		const index = TableIndex;

		if (!response.UnprocessedKeys || !response.Responses) {
			throw new Error("Unknown response format");
		}

		if (response.UnprocessedKeys[table] && response.UnprocessedKeys[table].Keys && Array.isArray(response.UnprocessedKeys[table].Keys)) {
			for (let value of response.UnprocessedKeys[table].Keys) {
				if (config && config.unprocessed === UnprocessedTypes.raw) {
					unprocessedAll.push(value);
				} else {
					unprocessedAll.push(
						this._formatKeysToItem(index, value)
					);
				}
			}
		}

		if (response.Responses[table] && Array.isArray(response.Responses[table])) {
			const responses = response.Responses[table];
			for (let i = 0; i < responses.length; i++) {
				const item = responses[i];
				const slot = orderMaintainer.getOrder(item);
				const formatted = this.formatResponse({ Item: item }, index, config);
				if (slot !== -1) {
					resultsAll[slot] = formatted.data;
				} else {
					resultsAll.push(formatted.data);
				}
			}
		}
	}

	_getLastEvaluatedKeyFromItem({indexName = TableIndex, item}) {
		const indexFields = this.model.translations.keys[indexName];
		const tableIndexFields = this.model.translations.keys[TableIndex];
		const lastEvaluatedKey = {
			[indexFields.pk]: item[indexFields.pk],
			[tableIndexFields.pk]: item[tableIndexFields.pk],
		}
		if (indexFields.sk && item[indexFields.sk]) {
			lastEvaluatedKey[indexFields.sk] = item[indexFields.sk]
		}
		if (tableIndexFields.sk && item[tableIndexFields.sk]) {
			lastEvaluatedKey[tableIndexFields.sk] = item[tableIndexFields.sk]
		}

		return lastEvaluatedKey;
	}

	formatResponse(response, index, config = {}) {
		let stackTrace;
		if (!config.originalErr) {
			stackTrace = new e.ElectroError(e.ErrorCodes.AWSError);
		}
		let lastEvaluatedKey = response.LastEvaluatedKey;
		try {
			let results = {};
			if (validations.isFunction(config.parse)) {
				const parsed = config.parse(config, response);
				results = parsed.data;
				lastEvaluatedKey = parsed.lastEvaluatedKey;
			} else if (config.raw && !config._isPagination) {
				if (response.TableName) {
					results = {};
				} else {
					results = response;
				}
			} else if (config.raw && (config._isPagination || config.lastEvaluatedKeyRaw)) {
				results = response;
			} else {
				if (response.Item) {
					if (config.ignoreOwnership || this.ownsItem(response.Item)) {
						results = this.model.schema.formatItemForRetrieval(response.Item, config);
						if (Object.keys(results).length === 0) {
							results = null;
						}
					} else if (!config._objectOnEmpty) {
						results = null;
					}
				} else if (response.Items) {
					let size = typeof config.count === 'number' ? config.count : response.Items.length;
					let count = 0;
					let lastItem;
					results = [];
					for (let i = 0; i < response.Items.length; i++) {
						const item = { ...response.Items[i] };
						if (config.ignoreOwnership || this.ownsItem(item)) {
							let record = this.model.schema.formatItemForRetrieval(item, config);
							if (Object.keys(record).length > 0) {
								count = count + 1;
								if (count > size) {
									if (lastItem) {
										lastEvaluatedKey = this._getLastEvaluatedKeyFromItem({
											indexName: index,
											item: lastItem,
										});
									}
									break;
								}
								results.push(record);
								lastItem = response.Items[i];
							}
						}
					}
				} else if (response.Attributes) {
					results = this.model.schema.formatItemForRetrieval(response.Attributes, config);
					if (Object.keys(results).length === 0) {
						results = null;
					}
				} else if (config._objectOnEmpty) {
					return { data: {} };
				} else {
					results = null;
				}
			}

			if (config._isPagination || lastEvaluatedKey) {
				const nextPage = this._formatReturnPager(config, lastEvaluatedKey);
				if (config._returnLastEvaluatedKeyRaw) {
					return { cursor: nextPage || null, data: results, lastEvaluatedKey };
				}
				return { cursor: nextPage || null, data: results };
			}

			return { data: results };

		} catch (err) {
			if (config.originalErr || stackTrace === undefined) {
				throw err;
			} else {
				stackTrace.message = err.message;
				throw stackTrace;
			}
		}
	}


	parse(item, options = {}) {
		if (item === undefined || item === null) {
			return null;
		}
		const config = {
			...(options || {}),
			ignoreOwnership: true
		}
		return this.formatResponse(item, TableIndex, config);
	}

	_formatReturnPager(config, lastEvaluatedKey) {
		let page = lastEvaluatedKey || null;
		if (config.raw || config.pager === Pager.raw) {
			return page;
		}
		return config.formatCursor.serialize(page) || null;
	}

	_formatExclusiveStartKey(config) {
		let exclusiveStartKey = config.cursor;
		if (config.raw || config.pager === Pager.raw) {
			return exclusiveStartKey || null;
		}
		return config.formatCursor.deserialize(exclusiveStartKey) || null;
	}

	setClient(client) {
		if (client) {
			this.client = c.normalizeClient(client);
		}
	}

	setTableName(tableName) {
		this.config.table = tableName;
	}

	getTableName() {
		return this.config.table;
	}

	getTableName() {
		return this.config.table;
	}

	_chain(state, clauses, clause) {
		let current = {};
		for (let child of clause.children) {
			current[child] = (...args) => {
				state.prev = state.self;
				state.self = child;
				let results = clauses[child].action(this, state, ...args);
				if (clauses[child].children.length) {
					return this._chain(results, clauses, clauses[child]);
				} else {
					return results;
				}
			};
		}
		return current;
	}
	/* istanbul ignore next */
	_makeChain(index = TableIndex, clauses, rootClause, options = {}) {
		let state = new ChainState({
			index,
			options,
			attributes: options.attributes || this.model.schema.attributes,
			hasSortKey: options.hasSortKey || this.model.lookup.indexHasSortKeys[index],
			compositeAttributes: options.compositeAttributes || this.model.facets.byIndex[index],
		});
		return state.init(this, clauses, rootClause);
	}

	_regexpEscape(string) {
		return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	}

	_normalizeConcurrencyValue(value = 1) {
		value = parseInt(value);
		if (isNaN(value) || value < 1) {
			throw new e.ElectroError(e.ErrorCodes.InvalidConcurrencyOption, "Query option 'concurrency' must be of type 'number' and greater than zero.");
		}
		return value;
	}

	_normalizePagesValue(value) {
		if (value === AllPages) {
			return value;
		}
		value = parseInt(value);
		if (isNaN(value) || value < 1) {
			throw new e.ElectroError(e.ErrorCodes.InvalidPagesOption, `Query option 'pages' must be of type 'number' and greater than zero or the string value '${AllPages}'`);
		}
		return value;
	}

	_normalizeNumberOptionsValue(option, value) {
		if (value !== undefined) {
			value = parseInt(value);
			if (isNaN(value) || value < 1) {
				throw new e.ElectroError(e.ErrorCodes.InvalidLimitOption, `Query option '${option}' must be of type 'number' and greater than zero.`);
			}
		}
		return value;
	}

	_safeMinimum(...values) {
		let eligibleNumbers = [];
		for (let value of values) {
			if (typeof value === 'number') {
				eligibleNumbers.push(value);
			}
		}

		if (eligibleNumbers.length) {
			return Math.min(...eligibleNumbers);
		}

		return undefined;
	}

	_createKeyDeconstructor(prefixes = {}, labels = [], attributes = {}) {
		let {prefix, isCustom, postfix} = prefixes;
		let names = [];
		let types = [];
		let pattern = `^${this._regexpEscape(prefix || '')}`;
		for (let {name, label} of labels) {
			let attr = attributes[name];
			if (attr) {
				if (isCustom) {
					pattern += `${this._regexpEscape(label === undefined ? "" : label)}(.+)`;
				} else {
					pattern += `#${this._regexpEscape(label === undefined ? name : label)}_(.+)`;
				}
				names.push(name);
				types.push(attr.type);
			}
		}
		if (typeof postfix === 'string') {
			pattern += this._regexpEscape(postfix);
		}
		pattern += "$";

		let regex = new RegExp(pattern, "i");

		return ({ key } = {}) => {
			if (!['string', 'number'].includes(typeof key)) {
				return null;
			}
			key = `${key}`;
			let match = key.match(regex);
			let results = {};
			if (match) {
				for (let i = 0; i < names.length; i++) {
					let key = names[i];
					let value = match[i + 1];
					let type = types[i];
					switch (type) {
						case "number":
							value = parseFloat(value);
							break;
						case "boolean":
							value = value === "true";
							break;
					}
					results[key] = value;
				}
			} else {
				results = null;
			}

			return results;
		}
	}

	_deconstructIndex({index = TableIndex, keys = {}} = {}) {
		const hasIndex = !!this.model.translations.keys[index];
		if (!hasIndex) {
			return null;
		}
		let pkName = this.model.translations.keys[index].pk;
		let skName = this.model.translations.keys[index].sk;
		const indexHasSortKey = this.model.lookup.indexHasSortKeys[index];
		const deconstructors = this.model.keys.deconstructors[index];
		const pk = keys[pkName];
		if (pk === undefined) {
			return null;
		}
		const pkComposites = deconstructors.pk({key: pk});
		if (pkComposites === null) {
			return null;
		}
		let skComposites = {};
		if (indexHasSortKey) {
			const sk = keys[skName];
			if (!sk) {
				return null;
			}
			skComposites = deconstructors.sk({key: sk});
			if (skComposites === null) {
				return null;
			}
		}
		return {
			...pkComposites,
			...skComposites,
		}
	}

	_formatKeysToItem(index = TableIndex, keys) {
		if (keys === null || typeof keys !== "object" || Object.keys(keys).length === 0) {
			return keys;
		}
		let tableIndex = TableIndex;
		let indexParts = this._deconstructIndex({index, keys});
		if (indexParts === null) {
			return null;
		}
		// lastEvaluatedKeys from query calls include the index pk/sk as well as the table index's pk/sk
		if (index !== tableIndex) {
			const tableIndexParts = this._deconstructIndex({index: tableIndex, keys});
			if (tableIndexParts === null) {
				return null;
			}
			indexParts = { ...indexParts, ...tableIndexParts };
		}
		let noPartsFound = Object.keys(indexParts).length === 0;
		let partsAreIncomplete = this.model.facets.byIndex[tableIndex].all.find(facet => indexParts[facet.name] === undefined);
		if (noPartsFound || partsAreIncomplete) {
			// In this case no suitable record could be found be the deconstructed pager.
			// This can be valid in cases where a scan is performed but returns no results.
			return null;
		}

		return indexParts;
	}

	_constructPagerIndex(index = TableIndex, item) {
		let pkAttributes = this._expectFacets(item, this.model.facets.byIndex[index].pk);
		let skAttributes = this._expectFacets(item, this.model.facets.byIndex[index].sk);
		let keys = this._makeIndexKeys({
			index,
			pkAttributes,
			skAttributes: [skAttributes],
		});
		return this._makeParameterKey(index, keys.pk, ...keys.sk);
	}

	_formatSuppliedPager(index = TableIndex, item) {
		if (typeof item !== "object" || Object.keys(item).length === 0) {
			return item;
		}
		let tableIndex = TableIndex;
		let pager = this._constructPagerIndex(index, item);
		if (index !== tableIndex) {
			pager = {...pager, ...this._constructPagerIndex(tableIndex, item)}
		}
		return pager
	}

	_normalizeExecutionOptions({ provided = [], context = {} } = {}) {
		let config = {
			includeKeys: false,
			originalErr: false,
			raw: false,
			params: {},
			page: {},
			lastEvaluatedKeyRaw: false,
			table: undefined,
			concurrent: undefined,
			parse: undefined,
			pager: Pager.named,
			unprocessed: UnprocessedTypes.item,
			response: 'default',
			cursor: null,
			data: 'attributes',
			ignoreOwnership: false,
			_providedIgnoreOwnership: false,
			_isPagination: false,
			_isCollectionQuery: false,
			pages: 1,
			listeners: [],
			preserveBatchOrder: false,
			attributes: [],
			terminalOperation: undefined,
			formatCursor: u.cursorFormatter,
			order: undefined,
			hydrate: false,
			hydrator: (_entity, _indexName, items) => items,
		};

		return provided.filter(Boolean).reduce((config, option) => {
			if (typeof option.order === 'string') {
				switch (option.order.toLowerCase()) {
					case 'asc':
						config.params[ResultOrderParam] = ResultOrderOption.asc;
						break;
					case 'desc':
						config.params[ResultOrderParam] = ResultOrderOption.desc;
						break;
					default:
						throw new e.ElectroError(e.ErrorCodes.InvalidOptions, `Invalid value for query option "order" provided. Valid options include 'asc' and 'desc, received: "${option.order}"`);
				}
			}

			if (typeof option.response === 'string' && option.response.length) {
				const format = 	ReturnValues[option.response];
				if (format === undefined) {
					throw new e.ElectroError(e.ErrorCodes.InvalidOptions, `Invalid value for query option "format" provided: "${option.format}". Allowed values include ${u.commaSeparatedString(Object.keys(ReturnValues))}.`);
				}
				config.response = format;
				if (context.operation === MethodTypes.transactWrite) {
					config.params.ReturnValuesOnConditionCheckFailure = FormatToReturnValues[format];
				} else {
					config.params.ReturnValues = FormatToReturnValues[format];
				}
			}

			if (option.formatCursor) {
				const isValid = ['serialize', 'deserialize'].every(method =>
					method in option.formatCursor &&
					validations.isFunction(option.formatCursor[method])
				);
				if (isValid) {
					config.formatCursor = option.formatCursor;
				} else {
					throw new e.ElectroError(e.ErrorCodes.InvalidOptions, `Invalid value for query option "formatCursor" provided. Formatter interface must have serialize and deserialize functions`);
				}
			}

			if (option.terminalOperation in TerminalOperation) {
				config.terminalOperation = TerminalOperation[option.terminalOperation];
			}

			if (Array.isArray(option.attributes)) {
				config.attributes = config.attributes.concat(option.attributes);
			}

			if (option.preserveBatchOrder === true) {
				config.preserveBatchOrder = true;
			}

			if (option.pages !== undefined) {
				config.pages = option.pages;
			}

			if (option._isCollectionQuery === true) {
				config._isCollectionQuery = true;
			}

			if (option.includeKeys === true) {
				config.includeKeys = true;
			}

			if (option.originalErr === true) {
				config.originalErr = true;
			}

			if (option.raw === true) {
				config.raw = true;
			}

			if (option._isPagination) {
				config._isPagination = true;
			}

			if (option.lastEvaluatedKeyRaw === true) {
				config.lastEvaluatedKeyRaw = true;
				config.pager = Pager.raw;
				config.unprocessed = UnprocessedTypes.raw;
			}

			if (option.cursor) {
				config.cursor = option.cursor;
			}

			if (option.data) {
				config.data = option.data;
				switch(option.data) {
					case 'raw':
						config.raw = true;
						break;
					case 'includeKeys':
						config.includeKeys = true;
						break;
				}
			}

			if (option.limit !== undefined) {
				config.limit = option.limit;
				config.params.Limit = option.limit;
			}

			if (typeof option.count === 'number') {
				config.count = option.count;
			}

			if (validations.isStringHasLength(option.table)) {
				config.params.TableName = option.table;
				config.table = option.table;
			}

			if (option.concurrent !== undefined) {
				config.concurrent = option.concurrent;
			}

			if (validations.isFunction(option.parse)) {
				config.parse = option.parse;
			}

			if (typeof option.pager === "string") {
				if (typeof Pager[option.pager] === "string") {
					config.pager = option.pager;
				} else {
					throw new e.ElectroError(e.ErrorCodes.InvalidOptions, `Invalid value for option "pager" provided: "${option.pager}". Allowed values include ${u.commaSeparatedString(Object.keys(Pager))}.`);
				}
			}

			if (typeof option.unprocessed === "string") {
				if (typeof UnprocessedTypes[option.unprocessed] === "string") {
					config.unproessed = UnprocessedTypes[option.unprocessed];
				} else {
					throw new e.ElectroError(e.ErrorCodes.InvalidOptions, `Invalid value for option "unprocessed" provided: "${option.unprocessed}". Allowed values include ${u.commaSeparatedString(Object.keys(UnprocessedTypes))}.`);
				}
			}

			if (option.ignoreOwnership) {
				config.ignoreOwnership = option.ignoreOwnership;
				config._providedIgnoreOwnership = option.ignoreOwnership;
			}

			if (option.listeners) {
				if (Array.isArray(option.listeners)) {
					config.listeners = config.listeners.concat(option.listeners);
				}
			}

			if (option.logger) {
				if (validations.isFunction(option.logger)) {
					config.listeners.push(option.logger);
				} else {
					throw new e.ElectroError(e.ErrorCodes.InvalidLoggerProvided, `Loggers must be of type function`);
				}
			}

			if (option.hydrate) {
				config.hydrate = true;
				config.ignoreOwnership = true;
			}

			if (validations.isFunction(option.hydrator)) {
				config.hydrator = option.hydrator;
			}

			config.page = Object.assign({}, config.page, option.page);
			config.params = Object.assign({}, config.params, option.params);
			return config;
		}, config);
	}

	_applyParameterOptions({ params = {}, options = {} } = {}) {
		let parameters = Object.assign({}, params);

		for (let customParameter of Object.keys(options.params || {})) {
			if (options.params[customParameter] !== undefined) {
				parameters[customParameter] = options.params[customParameter];
			}
		}

		return parameters;
	}

	addListeners(logger) {
		this.eventManager.add(logger);
	}

	_addLogger(logger) {
		if (validations.isFunction(logger)) {
			this.addListeners(logger);
		} else {
			throw new e.ElectroError(e.ErrorCodes.InvalidLoggerProvided, `Logger must be of type function`);
		}
	}

	_getPrimaryIndexFieldNames() {
		let hasSortKey = this.model.lookup.indexHasSortKeys[TableIndex];
		let accessPattern = this.model.translations.indexes.fromIndexToAccessPattern[TableIndex];
		let pkField = this.model.indexes[accessPattern].pk.field;
		let skField;
		if (hasSortKey) {
			skField = this.model.indexes[accessPattern].sk.field;
		}
		return {
			pk: pkField,
			sk: skField
		}
	}

	_applyParameterExpressionTypes(params, filter) {
		const conditions = filter[ExpressionTypes.ConditionExpression];
		if (conditions.build().length > 0) {
			if (typeof params[ExpressionTypes.ConditionExpression] === "string" && params[ExpressionTypes.ConditionExpression].length > 0) {
				params[ExpressionTypes.ConditionExpression] = `${params[ExpressionTypes.ConditionExpression]} AND ${conditions.build()}`
			} else {
				params[ExpressionTypes.ConditionExpression] = conditions.build();
			}
			if (Object.keys(conditions.getNames()).length > 0) {
				params.ExpressionAttributeNames = params.ExpressionAttributeNames || {};
				params.ExpressionAttributeNames = Object.assign({}, conditions.getNames(), params.ExpressionAttributeNames);
			}
			if (Object.keys(conditions.getValues()).length > 0) {
				params.ExpressionAttributeValues = params.ExpressionAttributeValues || {};
				params.ExpressionAttributeValues = Object.assign({}, conditions.getValues(), params.ExpressionAttributeValues);
			}
		}
		return params;
	}
	/* istanbul ignore next */
	_params(state, config = {}) {
		const { keys = {}, method = "", put = {}, update = {}, filter = {}, upsert } = state.query;
		let consolidatedQueryFacets = this._consolidateQueryFacets(keys.sk);
		let params = {};
		switch (method) {
			case MethodTypes.check:
			case MethodTypes.get:
			case MethodTypes.delete:
			case MethodTypes.remove:
				params = this._makeSimpleIndexParams(keys.pk, ...consolidatedQueryFacets);
				break;
			case MethodTypes.upsert:
				params = this._makeUpsertParams({update, upsert}, keys.pk, ...keys.sk)
				break;
			case MethodTypes.put:
			case MethodTypes.create:
				params = this._makePutParams(put, keys.pk, ...keys.sk);
				break;
			case MethodTypes.update:
			case MethodTypes.patch:
				params = this._makeUpdateParams(
					update,
					keys.pk,
					...consolidatedQueryFacets,
				);
				break;
			case MethodTypes.scan:
				params = this._makeScanParam(filter[ExpressionTypes.FilterExpression]);
				break;
			/* istanbul ignore next */
			default:
				throw new Error(`Invalid method: ${method}`);
		}

		let appliedParameters = this._applyParameterOptions({
			params,
			options: config,
		});

		return this._applyParameterExpressions(method, appliedParameters, config, filter);
	}

	_applyParameterExpressions(method, parameters, config, filter) {
		if (method !== MethodTypes.get) {
			return this._applyParameterExpressionTypes(parameters, filter);
		} else {
			parameters = this._applyProjectionExpressions({parameters, config});
			return this._applyParameterExpressionTypes(parameters, filter);
		}

	}

	_applyProjectionExpressions({parameters = {}, config = {}} = {}) {
		const attributes = config.attributes || [];
		if (attributes.length === 0) {
			return parameters;
		}

		const requiresRawResponse = !!config.raw;
		const enforcesOwnership = !config.ignoreOwnership;
		const requiresUserInvolvedPagination = TerminalOperation[config.terminalOperation] === TerminalOperation.page;
		const isServerBound = TerminalOperation[config.terminalOperation] === TerminalOperation.go ||
			TerminalOperation[config.terminalOperation] === TerminalOperation.page;

		// 1. Take stock of invalid attributes, if there are any this should be considered
		//    unintentional and should throw to prevent unintended results
		// 2. Convert all attribute names to their respective "field" names
		const unknownAttributes = [];
		let attributeFields = new Set();
		for (const attributeName of attributes) {
			const fieldName = this.model.schema.getFieldName(attributeName);
			if (typeof fieldName !== "string") {
				unknownAttributes.push(attributeName);
			} else {
				attributeFields.add(fieldName);
			}
		}

		// Stop doing work, prepare error message and throw
		if (attributeFields.size === 0 || unknownAttributes.length > 0) {
			let message = 'Unknown attributes provided in query options';
			if (unknownAttributes.length) {
				message += `: ${u.commaSeparatedString(unknownAttributes)}`;
			}
			throw new e.ElectroError(e.ErrorCodes.InvalidOptions, message);
		}

		// add ExpressionAttributeNames if it doesn't exist already
		parameters.ExpressionAttributeNames = parameters.ExpressionAttributeNames || {};

		if (
			// The response you're returning:
			// 1. is not expected to be raw
			!requiresRawResponse
			// 2. is making a request to the server
			&& isServerBound
			// 3. will expect entity identifiers down stream
			&& enforcesOwnership

		) {
			// add entity identifiers to so items can be identified
			attributeFields.add(this.identifiers.entity);
			attributeFields.add(this.identifiers.version);

			// if pagination is required you may enter into a scenario where
			// the LastEvaluatedKey doesn't belong to entity and one must be formed.
			// We must add the attributes necessary to make that key to not break
			// pagination. This stinks.
			if (
				requiresUserInvolvedPagination
				&& config.pager !== Pager.raw
			) {
				// LastEvaluatedKeys return the TableIndex keys and the keys for the SecondaryIndex
				let tableIndexFacets = this.model.facets.byIndex[TableIndex];
				let indexFacets = this.model.facets.byIndex[parameters.IndexName] || { all: [] };

				for (const attribute of [...tableIndexFacets.all, ...indexFacets.all]) {
					const fieldName = this.model.schema.getFieldName(attribute.name);
					attributeFields.add(fieldName);
				}
			}
		}

		for (const attributeField of attributeFields) {
			// prefix the ExpressionAttributeNames because some prefixes are not allowed
			parameters.ExpressionAttributeNames['#' + attributeField] = attributeField;
		}

		// if there is already a ProjectionExpression (e.g. config "params"), merge it
		if (typeof parameters.ProjectionExpression === 'string') {
			parameters.ProjectionExpression = [parameters.ProjectionExpression, ...Object.keys([parameters.ExpressionAttributeNames])].join(', ');
		} else {
			parameters.ProjectionExpression = Object.keys(parameters.ExpressionAttributeNames).join(', ');
		}

		return parameters;
	}

	_batchGetParams(state, config = {}) {
		let table = config.table || this.getTableName();
		let userDefinedParams = config.params || {};

		// TableName is added when the config provided includes "table"
		// this is evaluated upstream so we remove it to avoid forming
		// bad syntax. Code should reconsider how this is applied to
		// make this cleaner :(
		delete userDefinedParams.TableName;

		let records = [];
		for (let itemState of state.subStates) {
			let method = itemState.query.method;
			let params = this._params(itemState, config);
			if (method === MethodTypes.get) {
				let { Key } = params;
				records.push(Key);
			}
		}
		let batches = u.batchItems(records, MaxBatchItems.batchGet);
		return batches.map(batch => {
			return {
				RequestItems: {
					[table]: {
						...userDefinedParams,
						Keys: batch
					}
				}
			}
		});
	}

	_batchWriteParams(state, config = {}) {
		let table = config.table || this.getTableName();
		let records = [];
		for (let itemState of state.subStates) {
			let method = itemState.query.method;
			let params = this._params(itemState, config);
			switch (method) {
				case MethodTypes.put:
					let {Item} = params;
					records.push({PutRequest: {Item}});
					break;
				case MethodTypes.delete:
					let {Key} = params;
					records.push({DeleteRequest: {Key}});
					break;
				/* istanbul ignore next */
				default:
					throw new Error("Invalid method type");
			}
		}
		let batches = u.batchItems(records, MaxBatchItems.batchWrite);
		return batches.map(batch => {
			return {
				RequestItems: {
					[table]: batch
				}
			}
		});
	}

	_makeParameterKey(index, pk, sk) {
		let hasSortKey = this.model.lookup.indexHasSortKeys[index];
		let accessPattern = this.model.translations.indexes.fromIndexToAccessPattern[index];
		let pkField = this.model.indexes[accessPattern].pk.field;
		let key = {
			[pkField]: pk,
		};
		if (hasSortKey && sk !== undefined) {
			let skField = this.model.indexes[accessPattern].sk.field;
			key[skField] = sk;
		}
		return key;
	}

	getIdentifierExpressions(alias = this.getName()) {
		let name = this.getName();
		let version = this.getVersion();
		return {
			names: {
				[`#${this.identifiers.entity}`]: this.identifiers.entity,
				[`#${this.identifiers.version}`]: this.identifiers.version,
			},
			values: {
				[`:${this.identifiers.entity}_${alias}`]: name,
				[`:${this.identifiers.version}_${alias}`]: version,
			},
			expression: `(#${this.identifiers.entity} = :${this.identifiers.entity}_${alias} AND #${this.identifiers.version} = :${this.identifiers.version}_${alias})`
		}
	}

	/* istanbul ignore next */
	_makeScanParam(filter = {}) {
		let indexBase = TableIndex;
		let hasSortKey = this.model.lookup.indexHasSortKeys[indexBase];
		let accessPattern = this.model.translations.indexes.fromIndexToAccessPattern[indexBase];
		let pkField = this.model.indexes[accessPattern].pk.field;
		let {pk, sk} = this._makeIndexKeys({
			index: indexBase,
		});
		let keys = this._makeParameterKey(indexBase, pk, ...sk);
		let keyExpressions = this._expressionAttributeBuilder(keys);
		let params = {
			TableName: this.getTableName(),
			ExpressionAttributeNames: this._mergeExpressionsAttributes(
				filter.getNames(),
				keyExpressions.ExpressionAttributeNames
			),
			ExpressionAttributeValues: this._mergeExpressionsAttributes(
				filter.getValues(),
				keyExpressions.ExpressionAttributeValues,
			),
			FilterExpression: `begins_with(#${pkField}, :${pkField})`,
		};

		if (hasSortKey) {
			let skField = this.model.indexes[accessPattern].sk.field;
			params.FilterExpression = `${params.FilterExpression} AND begins_with(#${skField}, :${skField})`;
		}
		if (filter.build()) {
			params.FilterExpression = `${params.FilterExpression} AND ${filter.build()}`;
		}
		return params;
	}

	_makeSimpleIndexParams(partition, sort) {
		let index = TableIndex;
		let keys = this._makeIndexKeys({
			index,
			pkAttributes: partition,
			skAttributes: [sort],
		});
		let Key = this._makeParameterKey(index, keys.pk, ...keys.sk);
		let TableName = this.getTableName();
		return { Key, TableName };
	}

	_removeAttributes(item, keys) {
		let copy = {...item};
		for (let key of (Object.keys(keys))) {
			delete copy[key];
		}
		return copy;
	}

	_makeUpdateParams(update = {}, pk = {}, sk = {}) {
		let primaryIndexAttributes = {...pk, ...sk};
		let modifiedAttributeValues = {};
		let modifiedAttributeNames = {};
		for (const path of Object.keys(update.paths)) {
			const {value, name} = update.paths[path];
			modifiedAttributeValues[path] = value;
			modifiedAttributeNames[path] = name;
		}
		const removed = {};
		for (const name in update.impacted) {
			if (update.impacted[name] === ItemOperations.remove) {
				removed[name] = name;
			}
		}
		modifiedAttributeValues = this._removeAttributes(modifiedAttributeValues, {...pk, ...sk, ...this.model.schema.getReadOnly()});
		const preparedUpdateValues = this.model.schema.applyAttributeSetters(modifiedAttributeValues);
		// We need to remove the pk/sk facets from before applying the Attribute setters because these values didnt
		// change, and we also don't want to trigger the setters of any attributes watching these facets because that
		// should only happen when an attribute is changed.
		const { indexKey, updatedKeys, deletedKeys = [] } = this._getUpdatedKeys(pk, sk, preparedUpdateValues, removed);
		const accessPattern = this.model.translations.indexes.fromIndexToAccessPattern[TableIndex];

		for (const path of Object.keys(preparedUpdateValues)) {
			if (modifiedAttributeNames[path] !== undefined && preparedUpdateValues[path] !== undefined) {
				update.updateValue(modifiedAttributeNames[path], preparedUpdateValues[path]);
			} else if (preparedUpdateValues[path] !== undefined) {
				update.set(path, preparedUpdateValues[path]);
			}
		}

		for (const indexKey of Object.keys(updatedKeys)) {
			const isNotTablePK = indexKey !== this.model.indexes[accessPattern].pk.field;
			const isNotTableSK = indexKey !== this.model.indexes[accessPattern].sk.field;
			const wasNotAlreadyModified = modifiedAttributeNames[indexKey] === undefined;
			if (isNotTablePK && isNotTableSK && wasNotAlreadyModified) {
				update.set(indexKey, updatedKeys[indexKey]);

			}
		}

		for (const indexKey of deletedKeys) {
			const isNotTablePK = indexKey !== this.model.indexes[accessPattern].pk.field;
			const isNotTableSK = indexKey !== this.model.indexes[accessPattern].sk.field;
			const wasNotAlreadyModified = modifiedAttributeNames[indexKey] === undefined;
			if (isNotTablePK && isNotTableSK && wasNotAlreadyModified) {
				update.remove(indexKey);
			}
		}

		// This loop adds the composite attributes to the Primary Index. This is important
		// in the case an update results in an "upsert". We want to add the Primary Index
		// composite attributes to the update so they will be included on the item when it
		// is created. It is done after all of the above because it is not a true "update"
		// so it should not be subject to the above "rules".
		for (const primaryIndexAttribute of Object.keys(primaryIndexAttributes)) {
			// isNotTablePK and isNotTableSK is important to check in case these properties
			// are not also the name of the index (you cannot modify the PK or SK of an item
			// after its creation)
			const attribute = this.model.schema.attributes[primaryIndexAttribute];
			const isNotTablePK = !!(attribute && attribute.field !== this.model.indexes[accessPattern].pk.field);
			const isNotTableSK = !!(attribute && attribute.field !== this.model.indexes[accessPattern].sk.field);
			const wasNotAlreadyModified = modifiedAttributeNames[primaryIndexAttribute] === undefined;
			if (isNotTablePK && isNotTableSK && wasNotAlreadyModified) {
				update.set(primaryIndexAttribute, primaryIndexAttributes[primaryIndexAttribute]);
			}
		}

		update.set(this.identifiers.entity, this.getName());
		update.set(this.identifiers.version, this.getVersion());

		return {
			UpdateExpression: update.build(),
			ExpressionAttributeNames: update.getNames(),
			ExpressionAttributeValues: update.getValues(),
			TableName: this.getTableName(),
			Key: indexKey,
		};
	}

	/* istanbul ignore next */
	_makePutParams({ data } = {}, pk, sk) {
		let { updatedKeys, setAttributes } = this._getPutKeys(pk, sk && sk.facets, data);
		let translatedFields = this.model.schema.translateToFields(setAttributes);

		return {
			Item: {
				...translatedFields,
				...updatedKeys,
				[this.identifiers.entity]: this.getName(),
				[this.identifiers.version]: this.getVersion(),
			},
			TableName: this.getTableName(),
		};
	}

	_makeUpsertParams({ update, upsert } = {}, pk, sk) {
		const { updatedKeys, setAttributes, indexKey } = this._getPutKeys(pk, sk && sk.facets, upsert.data);
		const upsertAttributes = this.model.schema.translateToFields(setAttributes);
		const keyNames = Object.keys(indexKey);
		for (const field of [...Object.keys(upsertAttributes), ...Object.keys(updatedKeys)]) {
			const value = u.getFirstDefined(upsertAttributes[field], updatedKeys[field]);
			if (!keyNames.includes(field)) {
				update.set(field, value);
			}
		}

		return {
			TableName: this.getTableName(),
			UpdateExpression: update.build(),
			ExpressionAttributeNames: update.getNames(),
			ExpressionAttributeValues: update.getValues(),
			Key: indexKey,
		};
	}

	_updateExpressionBuilder(data) {
		let accessPattern = this.model.translations.indexes.fromIndexToAccessPattern[TableIndex]
		let skip = [
			// Removing readOnly from here because this should have been validated earlier in the process. Not checking
			// readOnly here also allows `watch` properties to circumnavigate the readOnly check for attributes that
			// should be calculated but not updatable by the user.
			// ...this.model.schema.getReadOnly(),

			// ...this.model.facets.fields,
			this.model.indexes[accessPattern].pk.field,
			this.model.indexes[accessPattern].sk.field
		];
		return this._expressionAttributeBuilder(data, ItemOperations.set, { skip });
	}

	_queryKeyExpressionAttributeBuilder(index, pk, ...sks) {
		let translate = { ...this.model.translations.keys[index] };
		let restrict = ["pk"];
		let keys = { pk };
		sks = sks.filter(sk => sk !== undefined);

		for (let i = 0; i < sks.length; i++) {
			let id = `sk${i + 1}`;
			keys[id] = sks[i];
			restrict.push(id);
			translate[id] = translate["sk"];
		}

		let keyExpressions = this._expressionAttributeBuilder(keys, ItemOperations.set, {
			translate,
			restrict,
		});

		return {
			ExpressionAttributeNames: Object.assign({}, keyExpressions.ExpressionAttributeNames),
			ExpressionAttributeValues: Object.assign({}, keyExpressions.ExpressionAttributeValues),
		};
	}

	/* istanbul ignore next */
	_expressionAttributeBuilder(item = {}, operation = "", options = {}) {
		let {
			require = [],
			reject = [],
			restrict = [],
			skip = [],
			translate = {},
		} = options;
		/*
        In order of execution:
        require   - if all elements in require are not present as attributes, it throws.
        reject    - if an attribute on item is present in "reject", it throws.
        restrict  - if an attribute on item is not present in "restrict", it throws.
        skip      - if an attribute matches an element in "skip", it is skipped.
        translate - if an attribute in item matches a property in "translate", use the value in "translate".
    */
		let expressions = {
			UpdateExpression: [],
			ExpressionAttributeNames: {},
			ExpressionAttributeValues: {},
		};

		if (require.length) {
			let props = Object.keys(item);
			let missing = require.filter((prop) => !props.includes(prop));
			if (!missing) {
				throw new e.ElectroError(e.ErrorCodes.MissingAttribute, `Item is missing attributes: ${u.commaSeparatedString(missing)}`);
			}
		}

		for (let prop in item) {
			if (reject.includes(prop)) {
				throw new Error(`Invalid attribute ${prop}`);
			}
			if (restrict.length && !restrict.includes(prop)) {
				throw new Error(`${prop} is not a valid attribute: ${u.commaSeparatedString(restrict)}`);
			}
			if (prop === undefined || skip.includes(prop)) {
				continue;
			}

			let name = prop;
			let value = item[prop];
			let nameProp = `#${prop}`;
			let valProp = `:${prop}`;

			if (translate[prop]) {
				name = translate[prop];
			}

			expressions.UpdateExpression.push(`${nameProp} = ${valProp}`);
			expressions.ExpressionAttributeNames[nameProp] = name;
			expressions.ExpressionAttributeValues[valProp] = value;
		}
		expressions.UpdateExpression = `${operation.toUpperCase()} ${expressions.UpdateExpression.join(
			", ",
		)}`;
		return expressions;
	}

	_makeQueryKeys(state) {
		let consolidatedQueryFacets = this._consolidateQueryFacets(
			state.query.keys.sk,
		);
		switch (state.query.type) {
			case QueryTypes.is:
				return this._makeIndexKeys({
					index: state.query.index,
					pkAttributes: state.query.keys.pk,
					skAttributes: consolidatedQueryFacets,
					indexType: state.query.options.indexType,
					queryType: state.query.type,
					isCollection: state.query.options._isCollectionQuery,
				});
			default:
				return this._makeIndexKeysWithoutTail(state, consolidatedQueryFacets);
		}
	}

	/* istanbul ignore next */
	_queryParams(state = {}, options = {}) {
		const indexKeys = this._makeQueryKeys(state);
		let parameters = {};
		switch (state.query.type) {
			case QueryTypes.is:
				parameters = this._makeIsQueryParams(
					state.query,
					state.query.index,
					state.query.filter[ExpressionTypes.FilterExpression],
					indexKeys.pk,
					...indexKeys.sk,
				);
				break;
			case QueryTypes.begins:
				parameters = this._makeBeginsWithQueryParams(
					state.query.options,
					state.query.index,
					state.query.filter[ExpressionTypes.FilterExpression],
					indexKeys.pk,
					...indexKeys.sk,
				);
				break;
			case QueryTypes.collection:
				parameters = this._makeBeginsWithQueryParams(
					state.query.options,
					state.query.index,
					state.query.filter[ExpressionTypes.FilterExpression],
					indexKeys.pk,
					this._getCollectionSk(state.query.collection),
				);
				break;
			case QueryTypes.clustered_collection:
				parameters = this._makeBeginsWithQueryParams(
					state.query.options,
					state.query.index,
					state.query.filter[ExpressionTypes.FilterExpression],
					indexKeys.pk,
					...indexKeys.sk,
				);
				break;
			case QueryTypes.between:
				parameters = this._makeBetweenQueryParams(
					state.query.index,
					state.query.filter[ExpressionTypes.FilterExpression],
					indexKeys.pk,
					...indexKeys.sk,
				);
				break;
			case QueryTypes.gte:
			case QueryTypes.gt:
			case QueryTypes.lte:
			case QueryTypes.lt:
				parameters = this._makeComparisonQueryParams(
					state.query.index,
					state.query.type,
					state.query.filter[ExpressionTypes.FilterExpression],
					indexKeys,
				);
				break;
			default:
				throw new Error(`Invalid query type: ${state.query.type}`);
		}

		const appliedParameters = this._applyParameterOptions({
			params: parameters,
			options,
		});

		return this._applyProjectionExpressions({
			parameters: appliedParameters,
			config: options,
		});
	}

	_makeBetweenQueryParams(index, filter, pk, ...sk) {
		let keyExpressions = this._queryKeyExpressionAttributeBuilder(
			index,
			pk,
			...sk,
		);
		delete keyExpressions.ExpressionAttributeNames["#sk2"];
		let params = {
			TableName: this.getTableName(),
			ExpressionAttributeNames: this._mergeExpressionsAttributes(
				filter.getNames(),
				keyExpressions.ExpressionAttributeNames,
			),
			ExpressionAttributeValues: this._mergeExpressionsAttributes(
				filter.getValues(),
				keyExpressions.ExpressionAttributeValues,
			),
			KeyConditionExpression: `#pk = :pk and #sk1 BETWEEN :sk1 AND :sk2`,
		};
		if (index) {
			params["IndexName"] = index;
		}
		if (filter.build()) {
			params.FilterExpression = filter.build();
		}
		return params;
	}

	_makeInclusiveQueryParams(options, index, filter, pk, sk, type) {
		let keyExpressions = this._queryKeyExpressionAttributeBuilder(index, pk, sk);
		let KeyConditionExpression = "#pk = :pk";

		if (this.model.lookup.indexHasSortKeys[index] && typeof keyExpressions.ExpressionAttributeValues[":sk1"] === "string" && keyExpressions.ExpressionAttributeValues[":sk1"].length > 0) {
			if (type === QueryTypes.is) {
				KeyConditionExpression = `${KeyConditionExpression} and #sk1 = :sk1`;
			} else {
				KeyConditionExpression = `${KeyConditionExpression} and begins_with(#sk1, :sk1)`;
			}
		} else {
			delete keyExpressions.ExpressionAttributeNames["#sk1"];
			delete keyExpressions.ExpressionAttributeValues[":sk1"];
		}

		let customExpressions = {
			names: (options.expressions && options.expressions.names) || {},
			values: (options.expressions && options.expressions.values) || {},
			expression: (options.expressions && options.expressions.expression) || ""
		};

		let params = {
			KeyConditionExpression,
			TableName: this.getTableName(),
			ExpressionAttributeNames: this._mergeExpressionsAttributes(filter.getNames(), keyExpressions.ExpressionAttributeNames, customExpressions.names),
			ExpressionAttributeValues: this._mergeExpressionsAttributes(filter.getValues(), keyExpressions.ExpressionAttributeValues, customExpressions.values),
		};

		if (index) {
			params["IndexName"] = index;
		}

		let expressions = [customExpressions.expression, filter.build()].filter(Boolean).join(" AND ");

		if (expressions.length) {
			params.FilterExpression = expressions;
		}

		return params;
	}

	_makeIsQueryParams(query, index, filter, pk, sk) {
		const { options, keys } = query;

		const providedSks = keys.provided
			.filter(item => item.type === KeyTypes.sk)
			.map(item => item.attribute);

		const skDefinition = (this.model.facets.byIndex[index] &&
			this.model.facets.byIndex[index].sk &&
			Array.isArray(this.model.facets.byIndex[index].sk) &&
			this.model.facets.byIndex[index].sk
		) || [];

		const skCompositeAttributes = new Set(skDefinition);
		const skIsCompletelyFulfilled = skCompositeAttributes.size === providedSks.length &&
			skDefinition.every(attr => providedSks.includes(attr));

		if (skIsCompletelyFulfilled) {
			return this._makeInclusiveQueryParams(options, index, filter, pk, sk, QueryTypes.is);
		} else {
			return this._makeBeginsWithQueryParams(options, index, filter, pk, sk);
		}

	}

	_makeBeginsWithQueryParams(options, index, filter, pk, sk) {
		return this._makeInclusiveQueryParams(options, index, filter, pk, sk, QueryTypes.begins);
	}

	_mergeExpressionsAttributes(...expressionAttributes) {
		let merged = {};
		for (let obj of expressionAttributes) {
			if (obj) {
				merged = { ...merged, ...obj };
			}
		}
		return merged;
	}

	/* istanbul ignore next */
	_makeComparisonQueryParams(index = TableIndex, comparison = "", filter = {}, indexKeys = {}) {
		const {pk, fulfilled} = indexKeys;
		const sk = indexKeys.sk[0];
		let operator = PartialComparisons[comparison];
			// fulfilled
			// ? Comparisons[comparison]
			// : PartialComparisons[comparison];

		if (!operator) {
			throw new Error(`Unexpected comparison operator "${comparison}", expected ${u.commaSeparatedString(Object.values(Comparisons))}`);
		}
		let keyExpressions = this._queryKeyExpressionAttributeBuilder(
			index,
			pk,
			sk,
		);
		let params = {
			TableName: this.getTableName(),
			ExpressionAttributeNames: this._mergeExpressionsAttributes(
				filter.getNames(),
				keyExpressions.ExpressionAttributeNames,
			),
			ExpressionAttributeValues: this._mergeExpressionsAttributes(
				filter.getValues(),
				keyExpressions.ExpressionAttributeValues,
			),
			KeyConditionExpression: `#pk = :pk and #sk1 ${operator} :sk1`,
		};
		if (index) {
			params["IndexName"] = index;
		}
		if (filter.build()) {
			params.FilterExpression = filter.build();
		}
		return params;
	}

	_expectIndexFacets(attributes, facets) {
		let [isIncomplete, { incomplete, complete }] = this._getIndexImpact(
			attributes,
			facets,
		);
		if (isIncomplete) {
			let incompleteAccessPatterns = incomplete.map(({index}) => this.model.translations.indexes.fromIndexToAccessPattern[index]);
			let missingFacets = incomplete.reduce((result, { missing }) => [...result, ...missing], []);
			throw new e.ElectroError(e.ErrorCodes.IncompleteCompositeAttributes,
				`Incomplete composite attributes: Without the composite attributes ${u.commaSeparatedString(missingFacets)} the following access patterns cannot be updated: ${u.commaSeparatedString(incompleteAccessPatterns.filter((val) => val !== undefined))} `,
			);
		}
		return complete;
	}

	_makeKeysFromAttributes(indexes, attributes) {
		let indexKeys = {};
		for (let [index, keyTypes] of Object.entries(indexes)) {
			let keys = this._makeIndexKeys({
				index,
				pkAttributes: attributes,
				skAttributes: [attributes],
			});
			if (keyTypes.pk || keyTypes.sk) {
				indexKeys[index] = {};
			}

			if (keyTypes.pk && keys.pk) {
				indexKeys[index].pk = keys.pk
			}

			if (keyTypes.sk && keys.sk) {
				indexKeys[index].sk = keys.sk
			} else {
				// at least return the same datatype (array)
				indexKeys[index].sk = []
			}
		}
		return indexKeys;
	}

	_makePutKeysFromAttributes(indexes, attributes) {
		let indexKeys = {};
		for (let index of indexes) {
			indexKeys[index] = this._makeIndexKeys({
				index,
				pkAttributes: attributes,
				skAttributes: [attributes],
			});
		}
		return indexKeys;
	}

	_getPutKeys(pk, sk, set) {
		let setAttributes = this.model.schema.applyAttributeSetters(set);
		let updateIndex = TableIndex;
		let keyTranslations = this.model.translations.keys;
		let keyAttributes = { ...sk, ...pk };
		let completeFacets = this._expectIndexFacets(
			{ ...set },
			{ ...keyAttributes },
		);

		// complete facets, only includes impacted facets which likely does not include the updateIndex which then needs to be added here.
		if (!completeFacets.indexes.includes(updateIndex)) {
			completeFacets.indexes.push(updateIndex);
		}
		let composedKeys = this._makePutKeysFromAttributes(completeFacets.indexes, { ...keyAttributes, ...setAttributes });
		let updatedKeys = {};
		let indexKey = {};
		for (let [index, keys] of Object.entries(composedKeys)) {
			let { pk, sk } = keyTranslations[index];
			if (index === updateIndex) {
				indexKey[pk] = keys.pk;
				if (sk) {
					indexKey[sk] = keys.sk[0];
				}
			}
			updatedKeys[pk] = keys.pk;
			if (sk) {
				updatedKeys[sk] = keys.sk[0];
			}
		}

		return { indexKey, updatedKeys, setAttributes };
	}

	_getUpdatedKeys(pk, sk, set, removed) {
		let updateIndex = TableIndex;
		let keyTranslations = this.model.translations.keys;
		let keyAttributes = { ...sk, ...pk };
		let completeFacets = this._expectIndexFacets(
			{ ...set },
			{ ...keyAttributes },
		);
		const removedKeyImpact = this._expectIndexFacets(
			{ ...removed },
			{...keyAttributes}
		)

		// complete facets, only includes impacted facets which likely does not include the updateIndex which then needs to be added here.
		if (completeFacets.impactedIndexTypes[updateIndex] === undefined) {
			completeFacets.impactedIndexTypes[updateIndex] = {
				pk: "pk",
				sk: "sk"
			}
		}
		let composedKeys = this._makeKeysFromAttributes(completeFacets.impactedIndexTypes,{ ...set, ...keyAttributes });
		let updatedKeys = {};
		let deletedKeys = [];
		let indexKey = {};
		for (const keys of Object.values(removedKeyImpact.impactedIndexTypes)) {
			deletedKeys = deletedKeys.concat(Object.values(keys));
		}
		for (let [index, keys] of Object.entries(composedKeys)) {
			let { pk, sk } = keyTranslations[index];
			if (index === updateIndex) {
				indexKey[pk] = keys.pk;
				if (sk) {
					indexKey[sk] = keys.sk[0];
				}
			} else {
				// This block is for when Sort Keys used in sparse indexes never get made because they don't actually
				// have any composite attributes. Without this the PK would be made for the GSI but the SK would always
				// be blank, and therefore, not queryable.
				let noImpactSk = Array.isArray(keys.sk) && keys.sk.length === 0;
				let indexHasSk = this.model.lookup.indexHasSortKeys[index];
				let noAttributeSk = indexHasSk && this.model.facets.byIndex[index].sk.length === 0;
				let hasPrefix = indexHasSk && this.model.prefixes[index].sk.prefix !== undefined;
				if (noImpactSk && noAttributeSk && hasPrefix) {
					keys.sk.push(this.model.prefixes[index].sk.prefix);
				}
			}

			if (keys.pk) {
				updatedKeys[pk] = keys.pk;
			}

			if (sk && keys.sk[0]) {
				updatedKeys[sk] = keys.sk[0];
			}
		}
		return { indexKey, updatedKeys, deletedKeys };
	}

	/* istanbul ignore next */
	_getIndexImpact(attributes = {}, included = {}) {
		let includedFacets = Object.keys(included);
		let impactedIndexes = {};
		let impactedIndexTypes = {}
		let completedIndexes = [];
		let facets = {};
		for (let [attribute, indexes] of Object.entries(this.model.facets.byAttr)) {
			if (attributes[attribute] !== undefined) {
				facets[attribute] = attributes[attribute];
				indexes.forEach(({ index, type }) => {
					impactedIndexes[index] = impactedIndexes[index] || {};
					impactedIndexes[index][type] = impactedIndexes[index][type] || [];
					impactedIndexes[index][type].push(attribute);
					impactedIndexTypes[index] = impactedIndexTypes[index] || {};
					impactedIndexTypes[index][type] = this.model.translations.keys[index][type];
				});
			}
		}

		let incomplete = Object.entries(this.model.facets.byIndex)
			.map(([index, { pk, sk }]) => {
				let impacted = impactedIndexes[index];
				let impact = { index, missing: [] };
				if (impacted) {
					let missingPk = impacted[KeyTypes.pk] && impacted[KeyTypes.pk].length !== pk.length;
					let missingSk = impacted[KeyTypes.sk] && impacted[KeyTypes.sk].length !== sk.length;
					if (missingPk) {
						impact.missing = [
							...impact.missing,
							...pk.filter((attr) => {
								return !impacted[KeyTypes.pk].includes(attr) && !includedFacets.includes(attr)
							}),
						];
					}
					if (missingSk) {
						impact.missing = [
							...impact.missing,
							...sk.filter(
								(attr) =>
									!impacted[KeyTypes.sk].includes(attr) &&
									!includedFacets.includes(attr),
							),
						];
					}
					if (!missingPk && !missingSk) {
						completedIndexes.push(index);
					}
				}
				return impact;
			})
			.filter(({ missing }) => missing.length)

		let isIncomplete = !!incomplete.length;
		let complete = {facets, indexes: completedIndexes, impactedIndexTypes};
		return [isIncomplete, { incomplete, complete }];
	}

	_consolidateQueryFacets(queryFacets) {
		let sk1 = {};
		let sk2 = {};
		for (let { type, facets } of queryFacets) {
			if (type === QueryTypes.between) {
				sk1 = { ...sk1, ...facets };
			} else if (type === QueryTypes.and) {
				sk2 = { ...sk2, ...facets };
			} else {
				sk1 = { ...sk1, ...facets };
				sk2 = { ...sk2, ...facets };
			}
		}
		return [sk1, sk2];
	}

	_buildQueryFacets(facets, skFacets) {
		let queryFacets = this._findProperties(facets, skFacets).reduce(
			(result, [name, value]) => {
				if (value !== undefined) {
					result[name] = value;
				}
				return result;
			},
			{},
		);
		return { ...queryFacets };
	}

	/* istanbul ignore next */
	_expectFacets(obj = {}, properties = [], type = "key composite attributes") {
		let [incompletePk, missing, matching] = this._expectProperties(obj, properties);
		if (incompletePk) {
			throw new e.ElectroError(e.ErrorCodes.IncompleteCompositeAttributes, `Incomplete or invalid ${type} supplied. Missing properties: ${u.commaSeparatedString(missing)}`);
		} else {
			return matching;
		}
	}

	_findProperties(obj, properties) {
		return properties.map((name) => [name, obj[name]]);
	}

	_expectProperties(obj, properties) {
		let missing = [];
		let matching = {};
		this._findProperties(obj, properties).forEach(([name, value]) => {
			if (value === undefined) {
				missing.push(name);
			} else {
				matching[name] = value;
			}
		});
		return [!!missing.length, missing, matching];
	}

	_makeKeyFixings({
		service,
		entity,
		version = "1",
		tableIndex,
		modelVersion,
		isClustered
	}) {
		/*
			Collections will prefix the sort key so they can be queried with
			a "begins_with" operator when crossing entities. It is also possible
			that the user defined a custom key on either the PK or SK. In the case
			of a customKey AND a collection, the collection is ignored to favor
			the custom key.
		*/

		let keys = {
			pk: {
				prefix: "",
				field: tableIndex.pk.field,
				casing: tableIndex.pk.casing,
				isCustom: tableIndex.customFacets.pk,
			},
			sk: {
				prefix: "",
				casing: tableIndex.sk.casing,
				isCustom: tableIndex.customFacets.sk,
				field: tableIndex.sk ? tableIndex.sk.field : undefined,
			}
		};

		let pk = `$${service}`;
		let sk = "";
		let entityKeys = "";
		let postfix = "";
		// If the index is in a collections, prepend the sk;
		let collectionPrefix = this._makeCollectionPrefix(tableIndex.collection);
		if (validations.isStringHasLength(collectionPrefix)) {
			sk = `${collectionPrefix}`;
			entityKeys += `#${entity}`;
		} else {
			entityKeys += `$${entity}`;
		}

		/** start beta/v1 condition **/
		if (modelVersion === ModelVersions.beta) {
			pk = `${pk}_${version}`;
		} else {
			entityKeys = `${entityKeys}_${version}`;
		}
		/** end beta/v1 condition **/

		if (isClustered) {
			postfix = entityKeys;
		} else {
			sk = `${sk}${entityKeys}`
		}

		// If no sk, append the sk properties to the pk
		if (Object.keys(tableIndex.sk).length === 0) {
			pk += sk;
			if (isClustered) {
				pk += postfix;
			}
		}

		// If keys arent custom, set the prefixes
		if (!keys.pk.isCustom) {
			keys.pk.prefix = u.formatKeyCasing(pk, tableIndex.pk.casing);
		}

		if (!keys.sk.isCustom) {
			keys.sk.prefix = u.formatKeyCasing(sk, tableIndex.sk.casing);
			keys.sk.postfix = u.formatKeyCasing(postfix, tableIndex.sk.casing);
		}

		return keys;
	}

	_formatKeyCasing(accessPattern, key) {
		const casing = this.model.indexes[accessPattern] !== undefined
			? this.model.indexes[accessPattern].sk.casing
			: undefined;

		return u.formatKeyCasing(key, casing);
	}

	_validateIndex(index) {
		if (!this.model.facets.byIndex[index]) {
			throw new Error(`Invalid index: ${index}`);
		}
	}

	_getCollectionSk(collection = "") {
		const subCollections = this.model.subCollections[collection];
		const index = this.model.translations.collections.fromCollectionToIndex[collection];
		const accessPattern = this.model.translations.indexes.fromIndexToAccessPattern[index];
		const prefixes = this.model.prefixes[index];
		const prefix = this._makeCollectionPrefix(subCollections);
		if (prefixes.sk && prefixes.sk.isCustom) {
			return '';
		}
		return this._formatKeyCasing(accessPattern, prefix);
	}

	_makeCollectionPrefix(collection = []) {
		let prefix = "";
		if (validations.isArrayHasLength(collection)) {
			for (let i = 0; i < collection.length; i++) {
				let subCollection = collection[i];
				if (i === 0) {
					prefix += `$${subCollection}`;
				} else {
					prefix += `#${subCollection}`;
				}
			}
		} else if (validations.isStringHasLength(collection)) {
			prefix = `$${collection}`;
		}
		return prefix;
	}

	_makeKeyTransforms(queryType) {
		const transforms = [];
		const shiftUp = (val) => u.shiftSortOrder(val, 1);
		const noop = (val) => val;
		switch (queryType) {
			case QueryTypes.between:
				transforms.push(noop, shiftUp);
				break;
			case QueryTypes.lte:
			case QueryTypes.gt:
				transforms.push(shiftUp);
				break;
			default:
				transforms.push(noop);
				break;
		}
		return transforms;
	}

	/* istanbul ignore next */
	_makeIndexKeysWithoutTail(state = {}, skFacets = []) {
		const index = state.query.index || TableIndex;
		this._validateIndex(index);
		const pkFacets = state.query.keys.pk || {};
		const excludePostfix = state.query.options.indexType === IndexTypes.clustered && state.query.options._isCollectionQuery;
		const transforms = this._makeKeyTransforms(state.query.type);
		if (!skFacets.length) {
			skFacets.push({});
		}
		let facets = this.model.facets.byIndex[index];
		let prefixes = this.model.prefixes[index];
		if (!prefixes) {
			throw new Error(`Invalid index: ${index}`);
		}
		let partitionKey = this._makeKey(prefixes.pk, facets.pk, pkFacets, this.model.facets.labels[index].pk, { excludeLabelTail: true });
		let pk = partitionKey.key;
		let sk = [];
		let fulfilled = false;
		if (this.model.lookup.indexHasSortKeys[index]) {
			for (let i = 0; i < skFacets.length; i++) {
				const skFacet = skFacets[i];
				const transform = transforms[i];
				let hasLabels = this.model.facets.labels[index] && Array.isArray(this.model.facets.labels[index].sk);
				let labels = hasLabels
					? this.model.facets.labels[index].sk
					: [];
				let sortKey = this._makeKey(prefixes.sk, facets.sk, skFacet, labels, {
					excludeLabelTail: true,
					excludePostfix,
					transform,
				});
				if (sortKey.key !== undefined) {
					sk.push(sortKey.key);
				}
				if (sortKey.fulfilled) {
					fulfilled = true;
				}
			}
		}
		return {
			pk,
			sk,
			fulfilled,
		};
	}

	/* istanbul ignore next */
	_makeIndexKeys({
	   index = TableIndex,
	   pkAttributes = {},
	   skAttributes = [],
	   queryType,
	   indexType,
	   isCollection = false,
	}) {
		this._validateIndex(index);
		const excludePostfix = indexType === IndexTypes.clustered && isCollection;
		const transforms = this._makeKeyTransforms(queryType);
		if (!skAttributes.length) {
			skAttributes.push({});
		}
		let facets = this.model.facets.byIndex[index];
		let prefixes = this.model.prefixes[index];
		if (!prefixes) {
			throw new Error(`Invalid index: ${index}`);
		}
		let pk = this._makeKey(prefixes.pk, facets.pk, pkAttributes, this.model.facets.labels[index].pk);
		let sk = [];
		let fulfilled = false;
		if (this.model.lookup.indexHasSortKeys[index]) {
			for (let i = 0; i < skAttributes.length; i++) {
				const skFacet = skAttributes[i];
				const transform = transforms[i];
				let hasLabels = this.model.facets.labels[index] && Array.isArray(this.model.facets.labels[index].sk);
				let labels = hasLabels
					? this.model.facets.labels[index].sk
					: []
				let sortKey = this._makeKey(prefixes.sk, facets.sk, skFacet, labels, {excludePostfix, transform});
				if (sortKey.key !== undefined) {
					sk.push(sortKey.key);
				}
				if (sortKey.fulfilled) {
					fulfilled = true;
				}
			}
		}
		return {
			pk: pk.key,
			sk,
			fulfilled
		};
	}

	_isNumericKey(isCustom, facets = [], labels = []) {
		let attribute = this.model.schema.attributes[facets[0]];
		let isSingleComposite = facets.length === 1;
		let hasNoLabels = isCustom && labels.every(({label}) => !label);
		let facetIsNonStringPrimitive = attribute && attribute.type === "number";
		return isCustom && isSingleComposite && hasNoLabels && facetIsNonStringPrimitive
	}

	/* istanbul ignore next */
	_makeKey({prefix, isCustom, casing, postfix} = {}, facets = [], supplied = {}, labels = [], {excludeLabelTail, excludePostfix, transform = (val) => val} = {}) {
		if (this._isNumericKey(isCustom, facets, labels)) {
			return {
				fulfilled: supplied[facets[0]] !== undefined,
				key: supplied[facets[0]],
			};
		}

		let key = prefix;
		let foundCount = 0;
		for (let i = 0; i < labels.length; i++) {
			const { name, label } = labels[i];
			const attribute = this.model.schema.getAttribute(name);
			let value = supplied[name];
			if (supplied[name] === undefined && excludeLabelTail) {
				break;
			}

			if (attribute && validations.isFunction(attribute.format)) {
				value = attribute.format(`${value}`);
			}

			if (isCustom) {
				key = `${key}${label}`;
			} else {
				key = `${key}#${label}_`;
			}
			// Undefined facet value means we cant build any more of the key
			if (supplied[name] === undefined) {
				break;
			}
			foundCount++;
			key = `${key}${value}`;
		}



		// when sort keys are fulfilled we need to add the entity postfix
		// this is used for cluster indexes
		const fulfilled = foundCount === labels.length;
		const shouldApplyPostfix = typeof postfix === 'string' && !excludePostfix;
		if (fulfilled && shouldApplyPostfix) {
			key += postfix;
		}

		const transformedKey = transform(u.formatKeyCasing(key, casing));

		return {
			fulfilled,
			key: transformedKey,
		};
	}

	_findBestIndexKeyMatch(attributes = {}) {
		// an array of arrays, representing the order of pk and sk composites specified for each index, and then an
		// array with each access pattern occupying the same array index.
		let facets = this.model.facets.bySlot;
		// a flat array containing the match results of each access pattern, in the same array index they occur within
		// bySlot above
		let matches = [];
		for (let f = 0; f < facets.length; f++) {
			const slots = facets[f] || [];
			for (let s = 0; s < slots.length; s++) {
				const accessPatternSlot = slots[s];
				matches[s] = matches[s] || {
					index: accessPatternSlot.index,
					allKeys: false,
					hasSk: false,
					count: 0,
					done: false,
					keys: []
				}
				// already determined to be out of contention on prior iteration
				const indexOutOfContention = matches[s].done;
				// composite shorter than other indexes
				const lacksAttributeAtSlot = !accessPatternSlot;
				// attribute at this slot is not in the object provided
				const attributeNotProvided = accessPatternSlot && attributes[accessPatternSlot.name] === undefined;
				// if the next attribute is a sort key then all partition keys were provided
				const nextAttributeIsSortKey = accessPatternSlot && accessPatternSlot.next && facets[f+1][s].type === "sk";
				// if no keys are left then all attribute requirements were met (remember indexes don't require a sort key)
				const hasAllKeys = accessPatternSlot && !accessPatternSlot.next;

				// no sense iterating on items we know to be "done"
				if (indexOutOfContention || lacksAttributeAtSlot || attributeNotProvided) {
					matches[s].done = true;
					continue;
				}

				// if the next attribute is a sort key (and you reached this line) then you have fulfilled all the
				// partition key requirements for this index
				if (nextAttributeIsSortKey) {
					matches[s].hasSk = true;
				// if you reached this step and there are no more attributes, then you fulfilled the index
				} else if (hasAllKeys) {
					matches[s].allKeys = true;
				}

				// number of successfully fulfilled attributes plays into the ranking heuristic
				matches[s].count++;

				// note the names/types of fulfilled attributes
				matches[s].keys.push({
					name: accessPatternSlot.name,
					type: accessPatternSlot.type
				});
			}
		}
		// the highest count of matched attributes among all access patterns
		let max = 0;
		matches = matches
			// remove incomplete indexes
			.filter(match => match.hasSk || match.allKeys)
			// calculate max attribute match
			.map(match => {
				max = Math.max(max, match.count);
				return match;
			});

		// matched contains the ranked attributes. The closer an element is to zero the "higher" the rank.
		const matched = [];
		for (let m = 0; m < matches.length; m++) {
			const match = matches[m];
			// a finished primary index is most ideal (could be a get)
			const primaryIndexIsFinished = match.index === "" && match.allKeys;
			// if there is a tie for matched index attributes, primary index should win
			const primaryIndexIsMostMatched = match.index === "" && match.count === max;
			// composite attributes are complete
			const indexRequirementsFulfilled = match.allKeys;
			// having the most matches is important
			const hasTheMostAttributeMatches = match.count === max;
			if (primaryIndexIsFinished) {
				matched[0] = match;
			} else if (primaryIndexIsMostMatched) {
				matched[1] = match;
			} else if (indexRequirementsFulfilled) {
				matched[2] = match;
			} else if (hasTheMostAttributeMatches) {
				matched[3] = match;
			}
		}
		// find the first non-undefined element (best ranked) -- if possible
		const match = matched.find(value => !!value);
		let keys = [];
		let index = "";
		let shouldScan = true;
		if (match) {
			keys = match.keys;
			index = match.index;
			shouldScan = false;
		}
		return { keys, index, shouldScan };
	}

	/* istanbul ignore next */
	_parseComposedKey(key = TableIndex) {
		let attributes = {};
		let names = key.match(/:[A-Z1-9]+/gi);
		if (!names) {
			throw new e.ElectroError(e.ErrorCodes.InvalidKeyCompositeAttributeTemplate, `Invalid key composite attribute template. No composite attributes provided, expected at least one composite attribute with the format ":attributeName". Received: ${key}`);
		}
		let labels = key.split(/:[A-Z1-9]+/gi);
		for (let i = 0; i < names.length; i++) {
			let name = names[i].replace(":", "");
			let label = labels[i];
			if (name !== "") {
				attributes[name] = attributes[name] || [];
				attributes[name].push(label);
			}
		}
		return attributes;
	}

	_parseTemplateKey(template = "") {
		let attributes = [];
		let current = {
			label: "",
			name: ""
		};
		let type = "label";
		for (let i = 0; i < template.length; i++) {
			let char = template[i];
			let last = template[i - 1];
			let next = template[i + 1];
			if (char === "{" && last === "$" && type === "label") {
				type = "name";
			} else if (char === "}" && type === "name") {
				if (current.name.match(/^\s*$/)) {
					throw new e.ElectroError(e.ErrorCodes.InvalidKeyCompositeAttributeTemplate, `Invalid key composite attribute template. Empty expression "\${${current.name}}" provided. Expected attribute name.`);
				}
				attributes.push({name: current.name, label: current.label});
				current.name = "";
				current.label = "";
				type = "label";
			} else if (char === "$" && next === "{" && type === "label") {
				continue;
			} else {
				current[type] += char;
			}
		}
		if (current.name.length > 0 || current.label.length > 0) {
			attributes.push({name: current.name, label: current.label});
		}

		return attributes;
	}

	_parseFacets(facets) {
		let isCustom = !Array.isArray(facets) && typeof facets === "string";
		if (isCustom && facets.length > 0) {
			let labels = this._parseComposedKey(facets);
			return {
				isCustom,
				labels: [],
				attributes: Object.keys(attributes),
			}
		} else if (isCustom && facets.length === 0) {
			// treat like empty array sk
			return {
				isCustom: false,
				labels: [],
				attributes: []
			}
		} else {
			return {
				isCustom,
				labels: [],
				attributes: Object.keys(facets),
			};
		}
	}

	_parseTemplateAttributes(composite = []) {
		let isCustom = !Array.isArray(composite) && typeof composite === "string";
		if (isCustom && composite.length > 0) {
			let labels = this._parseTemplateKey(composite);
			return {
				isCustom,
				labels,
				attributes: labels.map(({name}) => name).filter(name => !!name)
			}
		} else if (isCustom && composite.length === 0) {
			// treat like empty array sk
			return {
				isCustom: false,
				labels: [],
				attributes: []
			}
		} else {
			return {
				isCustom,
				labels: composite.map(name => ({name})),
				attributes: composite,
			};
		}
	}

	_compositeTemplateAreCompatible(parsedAttributes, composite) {
		if (!Array.isArray(composite) || !parsedAttributes || !parsedAttributes.isCustom) {
			// not beholden to compatibility constraints
			return true;
		}

		return validations.stringArrayMatch(composite, parsedAttributes.attributes);
	}

	_optimizeIndexKey(keyDefinition) {
		const hasTemplate = typeof keyDefinition.template === "string";
		const hasSingleItemComposite = Array.isArray(keyDefinition.facets) && keyDefinition.facets.length === 1 && keyDefinition.facets[0] === keyDefinition.field;
		if (!hasTemplate && hasSingleItemComposite) {
			keyDefinition.facets = "${" + keyDefinition.field + "}";
		}
		return keyDefinition;
	}

	_optimizeMatchingKeyAttributes(model = {}) {
		const attributeFields = [];
		for (const name of Object.keys(model.attributes)) {
			const {field} = model.attributes[name];
			attributeFields.push(field || name);
		}
		for (const accessPattern of Object.keys(model.indexes)) {
			let {pk, sk} = model.indexes[accessPattern];
			if (attributeFields.includes(pk.field)) {
				model.indexes[accessPattern].pk = this._optimizeIndexKey(pk);
			}
			if (sk && attributeFields.includes(sk.field)) {
				model.indexes[accessPattern].sk = this._optimizeIndexKey(sk);
			}
		}
		return model;
	}

	_normalizeIndexes(indexes) {
		let normalized = {};
		let indexFieldTranslation = {};
		let indexHasSortKeys = {};
		let indexHasSubCollections = {};
		let clusteredIndexes = new Set();
		let indexAccessPatternTransaction = {
			fromAccessPatternToIndex: {},
			fromIndexToAccessPattern: {},
		};
		let collectionIndexTranslation = {
			fromCollectionToIndex: {},
			fromIndexToCollection: {},
		};
		let subCollections = {};
		let collections = {};
		let facets = {
			byIndex: {},
			byField: {},
			byFacet: {},
			byAttr: {},
			byType: {},
			bySlot: [],
			fields: [],
			attributes: [],
			labels: {},
		};
		let seenIndexes = {};
		let seenIndexFields = {};

		let accessPatterns = Object.keys(indexes);

		for (let i in accessPatterns) {
			let accessPattern = accessPatterns[i];
			let index = indexes[accessPattern];
			let indexName = index.index || TableIndex;
			let indexType = typeof index.type === 'string' ? index.type : IndexTypes.isolated;
			if (indexType === 'clustered') {
				clusteredIndexes.add(accessPattern);
			}
			if (seenIndexes[indexName] !== undefined) {
				if (indexName === TableIndex) {
					throw new e.ElectroError(e.ErrorCodes.DuplicateIndexes, `Duplicate index defined in model found in Access Pattern '${accessPattern}': '${u.formatIndexNameForDisplay(indexName)}'. This could be because you forgot to specify the index name of a secondary index defined in your model.`);
				} else {
					throw new e.ElectroError(e.ErrorCodes.DuplicateIndexes, `Duplicate index defined in model found in Access Pattern '${accessPattern}': '${indexName}'`);
				}
			}
			seenIndexes[indexName] = indexName;
			let hasSk = !!index.sk;
			let inCollection = !!index.collection;
			if (!hasSk && inCollection) {
				throw new e.ElectroError(e.ErrorCodes.CollectionNoSK, `Invalid Access pattern definition for '${accessPattern}': '${u.formatIndexNameForDisplay(indexName)}', contains a collection definition without a defined SK. Collections can only be defined on indexes with a defined SK.`);
			}
			let collection = index.collection || "";
			let customFacets = {
				pk: false,
				sk: false,
			};
			const pkCasing = KeyCasing[index.pk.casing] === undefined
				? KeyCasing.default
				: index.pk.casing;
			let skCasing = KeyCasing.default;
			if (hasSk && KeyCasing[index.sk.casing] !== undefined) {
				skCasing = index.sk.casing;
			}
			indexHasSortKeys[indexName] = hasSk;
			let parsedPKAttributes = this._parseTemplateAttributes(index.pk.facets);
			customFacets.pk = parsedPKAttributes.isCustom;
			// labels can be set via the attribute definition or as part of the facetTemplate.
			facets.labels[indexName] = facets.labels[indexName] || {};
			facets.labels[indexName]["pk"] = facets.labels[indexName]["pk"] || parsedPKAttributes;
			facets.labels[indexName]["sk"] = facets.labels[indexName]["sk"] || this._parseTemplateAttributes();
			let pk = {
				inCollection,
				accessPattern,
				index: indexName,
				casing: pkCasing,
				type: KeyTypes.pk,
				field: index.pk.field || "",
				facets: parsedPKAttributes.attributes,
				isCustom: parsedPKAttributes.isCustom,
				facetLabels: parsedPKAttributes.labels,
			};
			let sk = {};
			let parsedSKAttributes = {};
			if (hasSk) {
				parsedSKAttributes = this._parseTemplateAttributes(index.sk.facets);
				customFacets.sk = parsedSKAttributes.isCustom;
				facets.labels[indexName]["sk"] = parsedSKAttributes;
				sk = {
					inCollection,
					accessPattern,
					index: indexName,
					casing: skCasing,
					type: KeyTypes.sk,
					field: index.sk.field || "",
					facets: parsedSKAttributes.attributes,
					isCustom: parsedSKAttributes.isCustom,
					facetLabels: parsedSKAttributes.labels,
				};
				facets.fields.push(sk.field);
			}

			if (Array.isArray(sk.facets)) {
				let duplicates = pk.facets.filter(facet => sk.facets.includes(facet));
				if (duplicates.length !== 0) {
					throw new e.ElectroError(e.ErrorCodes.DuplicateIndexCompositeAttributes, `The Access Pattern '${accessPattern}' contains duplicate references the composite attribute(s): ${u.commaSeparatedString(duplicates)}. Composite attributes may only be used once within an index. If this leaves the Sort Key (sk) without any composite attributes simply set this to be an empty array.`);
				}
			}

			let definition = {
				pk,
				sk,
				collection,
				hasSk,
				customFacets,
				index: indexName,
				type: indexType,
			};

			indexHasSubCollections[indexName] = inCollection && Array.isArray(collection);

			if (inCollection) {
				let collectionArray = this._toSubCollectionArray(collection);

				for (let collectionName of collectionArray) {
					if (collections[collectionName] !== undefined) {
						throw new e.ElectroError(e.ErrorCodes.DuplicateCollections, `Duplicate collection, "${collectionName}" is defined across multiple indexes "${collections[collectionName]}" and "${accessPattern}". Collections must be unique names across indexes for an Entity.`,);
					} else {
						collections[collectionName] = accessPattern;
					}
					collectionIndexTranslation.fromCollectionToIndex[collectionName] = indexName;
					collectionIndexTranslation.fromIndexToCollection[indexName] = collectionIndexTranslation.fromIndexToCollection[indexName] || [];
					collectionIndexTranslation.fromIndexToCollection[indexName].push(collection);
				}
				subCollections = {
					...subCollections,
					...this._normalizeSubCollections(collectionArray)
				};
			}

			let attributes = [
				...pk.facets.map((name) => ({
					name,
					index: indexName,
					type: KeyTypes.pk,
				})),
				...(sk.facets || []).map((name) => ({
					name,
					index: indexName,
					type: KeyTypes.sk,
				})),
			];

			normalized[accessPattern] = definition;

			indexAccessPatternTransaction.fromAccessPatternToIndex[
				accessPattern
			] = indexName;
			indexAccessPatternTransaction.fromIndexToAccessPattern[
				indexName
			] = accessPattern;

			indexFieldTranslation[indexName] = {
				pk: pk.field,
				sk: sk.field || "",
			};

			facets.attributes = [...facets.attributes, ...attributes];

			facets.fields.push(pk.field);

			facets.byIndex[indexName] = {
				customFacets,
				pk: pk.facets,
				sk: sk.facets,
				all: attributes,
				collection: index.collection,
				hasSortKeys: !!indexHasSortKeys[indexName],
				hasSubCollections: !!indexHasSubCollections[indexName],
				casing: {
					pk: pkCasing,
					sk: skCasing
				}
			};

			facets.byField = facets.byField || {};
			facets.byField[pk.field] = facets.byField[pk.field] || {};
			facets.byField[pk.field][indexName] = pk;
			if (sk.field) {
				facets.byField[sk.field] = facets.byField[sk.field] || {};
				facets.byField[sk.field][indexName] = sk;
			}

			if (seenIndexFields[pk.field] !== undefined) {
				const definition = Object.values(facets.byField[pk.field]).find(definition => definition.index !== indexName)
				const definitionsMatch = validations.stringArrayMatch(pk.facets, definition.facets);
				if (!definitionsMatch) {
					throw new e.ElectroError(e.ErrorCodes.InconsistentIndexDefinition, `Partition Key (pk) on Access Pattern '${u.formatIndexNameForDisplay(accessPattern)}' is defined with the composite attribute(s) ${u.commaSeparatedString(pk.facets)}, but the accessPattern '${u.formatIndexNameForDisplay(definition.index)}' defines this field with the composite attributes ${u.commaSeparatedString(definition.facets)}'. Key fields must have the same composite attribute definitions across all indexes they are involved with`);
				}
				seenIndexFields[pk.field].push({accessPattern, type: 'pk'});
			} else {
				seenIndexFields[pk.field] = [];
				seenIndexFields[pk.field].push({accessPattern, type: 'pk'});
			}

			if (sk.field) {
				if (sk.field === pk.field) {
					throw new e.ElectroError(e.ErrorCodes.DuplicateIndexFields, `The Access Pattern '${u.formatIndexNameForDisplay(accessPattern)}' references the field '${sk.field}' as the field name for both the PK and SK. Fields used for indexes need to be unique to avoid conflicts.`);
				} else if (seenIndexFields[sk.field] !== undefined) {
					const isAlsoDefinedAsPK = seenIndexFields[sk.field].find(field => field.type === "pk");
					if (isAlsoDefinedAsPK) {
						throw new e.ElectroError(e.ErrorCodes.InconsistentIndexDefinition, `The Sort Key (sk) on Access Pattern '${u.formatIndexNameForDisplay(accessPattern)}' references the field '${pk.field}' which is already referenced by the Access Pattern(s) '${u.formatIndexNameForDisplay(isAlsoDefinedAsPK.accessPattern)}' as a Partition Key. Fields mapped to Partition Keys cannot be also mapped to Sort Keys.`);
					}
					const definition = Object.values(facets.byField[sk.field]).find(definition => definition.index !== indexName)
					const definitionsMatch = validations.stringArrayMatch(sk.facets, definition.facets);
					if (!definitionsMatch) {
						throw new e.ElectroError(e.ErrorCodes.DuplicateIndexFields, `Sort Key (sk) on Access Pattern '${u.formatIndexNameForDisplay(accessPattern)}' is defined with the composite attribute(s) ${u.commaSeparatedString(sk.facets)}, but the accessPattern '${u.formatIndexNameForDisplay(definition.index)}' defines this field with the composite attributes ${u.commaSeparatedString(definition.facets)}'. Key fields must have the same composite attribute definitions across all indexes they are involved with`);
					}
					seenIndexFields[sk.field].push({accessPattern, type: 'sk'});
				} else {
					seenIndexFields[sk.field] = [];
					seenIndexFields[sk.field].push({accessPattern, type: 'sk'});
				}
			}

			attributes.forEach(({index, type, name}, j) => {
				let next = attributes[j + 1] !== undefined ? attributes[j + 1].name : "";
				let facet = { index, name, type, next };
				facets.byAttr[name] = facets.byAttr[name] || [];
				facets.byAttr[name].push(facet);
				facets.byType[type] = facets.byType[type] || [];
				facets.byType[type].push(facet);
				facets.byFacet[name] = facets.byFacet[name] || [];
				facets.byFacet[name][j] = facets.byFacet[name][j] || [];
				facets.byFacet[name][j].push(facet);
				facets.bySlot[j] = facets.bySlot[j] || [];
				facets.bySlot[j][i] = facet;
			});

			let pkTemplateIsCompatible = this._compositeTemplateAreCompatible(parsedPKAttributes, index.pk.composite);
			if (!pkTemplateIsCompatible) {
				throw new e.ElectroError(e.ErrorCodes.IncompatibleKeyCompositeAttributeTemplate, `Incompatible PK 'template' and 'composite' properties for defined on index "${u.formatIndexNameForDisplay(indexName)}". PK "template" string is defined as having composite attributes ${u.commaSeparatedString(parsedPKAttributes.attributes)} while PK "composite" array is defined with composite attributes ${u.commaSeparatedString(index.pk.composite)}`);
			}

			if (index.sk !== undefined && Array.isArray(index.sk.composite) && typeof index.sk.template === "string") {
				let skTemplateIsCompatible = this._compositeTemplateAreCompatible(parsedSKAttributes, index.sk.composite);
				if (!skTemplateIsCompatible) {
					throw new e.ElectroError(e.ErrorCodes.IncompatibleKeyCompositeAttributeTemplate, `Incompatible SK 'template' and 'composite' properties for defined on index "${u.formatIndexNameForDisplay(indexName)}". SK "template" string is defined as having composite attributes ${u.commaSeparatedString(parsedSKAttributes.attributes)} while SK "composite" array is defined with composite attributes ${u.commaSeparatedString(index.sk.composite)}`);
				}
			}
		}

		if (facets.byIndex[TableIndex] === undefined) {
			throw new e.ElectroError(e.ErrorCodes.MissingPrimaryIndex, "Schema is missing an index definition for the table's main index. Please update the schema to include an index without a specified name to define the table's natural index");
		}

		return {
			facets,
			subCollections,
			indexHasSortKeys,
			clusteredIndexes,
			indexHasSubCollections,
			indexes: normalized,
			indexField: indexFieldTranslation,
			indexAccessPattern: indexAccessPatternTransaction,
			indexCollection: collectionIndexTranslation,
			collections: Object.keys(collections),
		};
	}

	_normalizeFilters(filters = {}) {
		let normalized = {};
		let invalidFilterNames = ["go", "params", "filter", "where", "set"];

		for (let [name, fn] of Object.entries(filters)) {
			if (invalidFilterNames.includes(name)) {
				throw new e.ElectroError(e.ErrorCodes.InvalidFilter, `Invalid filter name: ${name}. Filter cannot be named ${u.commaSeparatedString(invalidFilterNames)}`);
			} else {
				normalized[name] = fn;
			}
		}

		return normalized;
	}

	_normalizeKeyFixings({service, entity, version, indexes, modelVersion, clusteredIndexes}) {
		let prefixes = {};
		for (let accessPattern of Object.keys(indexes)) {
			let tableIndex = indexes[accessPattern];
			prefixes[tableIndex.index] = this._makeKeyFixings({
				service,
				entity,
				version,
				tableIndex,
				modelVersion,
				isClustered: clusteredIndexes.has(accessPattern),
			});
		}
		return prefixes;
	}

	_normalizeSubCollections(collections = []) {
		let lookup = {};
		for (let i = collections.length -1; i >= 0; i--) {
			let subCollection = collections[i];
			lookup[subCollection] = lookup[subCollection] || [];
			for (let j = 0; j <= i; j++) {
				lookup[subCollection].push(collections[j]);
			}
		}
		return lookup;
	}

	_toSubCollectionArray(collection) {
		let collectionArray = [];
		if (Array.isArray(collection) && collection.every(col => validations.isStringHasLength(col))) {
			collectionArray = collection;
		} else if (validations.isStringHasLength(collection)) {
			collectionArray.push(collection);
		} else {
			throw new Error("Invalid collection definition");
		}
		return collectionArray;
	}

	_applyCompositeToFacetConversion(model) {
		for (let accessPattern of Object.keys(model.indexes)) {
			let index = model.indexes[accessPattern];
			let invalidPK = index.pk.facets === undefined && index.pk.composite === undefined && index.pk.template === undefined;
			let invalidSK = index.sk && (index.sk.facets === undefined && index.sk.composite === undefined && index.sk.template === undefined);
			if (invalidPK) {
				throw new Error("Missing Index Composite Attributes!");
			} else if (invalidSK) {
				throw new Error("Missing Index Composite Attributes!");
			}


			if (Array.isArray(index.pk.composite)) {
				index.pk = {
					...index.pk,
					facets: index.pk.composite
				}
			}

			if (typeof index.pk.template === "string") {
				index.pk = {
					...index.pk,
					facets: index.pk.template
				}
		    }

			// SK may not exist on index
			if (index.sk && Array.isArray(index.sk.composite)) {
				index.sk = {
					...index.sk,
					facets: index.sk.composite
				}
			}

			if (index.sk && typeof index.sk.template === "string") {
				index.sk = {
					...index.sk,
					facets: index.sk.template
				}
			}

			model.indexes[accessPattern] = index;
		}
		return model;
	}

	_mergeKeyDefinitions(fromIndex, fromModel) {
		let definitions = {};
		for (let indexName of Object.keys(fromIndex)) {
			let pk = fromIndex[indexName].pk;
			let sk = fromIndex[indexName].sk || {labels: []};
			definitions[indexName] = {
				pk: [],
				sk: []
			};
			for (let {name, label} of pk.labels) {
				if (pk.isCustom) {
					definitions[indexName].pk.push({name, label});
				} else {
					definitions[indexName].pk.push({name, label: fromModel[name] || name});
				}
			}
			for (let {name, label} of sk.labels) {
				if (sk.isCustom) {
					definitions[indexName].sk.push({name, label});
				} else {
					definitions[indexName].sk.push({name, label: u.getFirstDefined(fromModel[name], name) });
				}
			}
		}

		return definitions;
	}

	_parseModel(model, config = {}) {
		/** start beta/v1 condition **/
		const {client} = config;
		let modelVersion = u.getModelVersion(model);
		let service, entity, version, table, name;
		switch(modelVersion) {
			case ModelVersions.beta:
				service = model.service;
				entity = model.entity;
				version = model.version;
				table = config.table || model.table;
				name = entity;
				break;
			case ModelVersions.v1:
				service = model.model && model.model.service;
				entity = model.model && model.model.entity;
				version = model.model && model.model.version;
				table = config.table || model.table;
				name = entity;
				break;
			default:
				throw new Error("Invalid model");
		}

		model = this._applyCompositeToFacetConversion(model);

		// _optimizeMatchingKeyAttributes abides by the design compromises made by _applyCompositeToFacetConversion :\
		model = this._optimizeMatchingKeyAttributes(model);
		/** end beta/v1 condition **/

		let {
			facets,
			indexes,
			indexField,
			collections,
			subCollections,
			indexCollection,
			clusteredIndexes,
			indexHasSortKeys,
			indexAccessPattern,
			indexHasSubCollections,
		} = this._normalizeIndexes(model.indexes);
		let schema = new Schema(model.attributes, facets, {client, isRoot: true});
		let filters = this._normalizeFilters(model.filters);
		// todo: consider a rename
		let prefixes = this._normalizeKeyFixings({service, entity, version, indexes, modelVersion, clusteredIndexes});

		// apply model defined labels
		let schemaDefinedLabels = schema.getLabels();
		facets.labels = this._mergeKeyDefinitions(facets.labels, schemaDefinedLabels);
		for (let indexName of Object.keys(facets.labels)) {
			indexes[indexAccessPattern.fromIndexToAccessPattern[indexName]].pk.labels = facets.labels[indexName].pk;
			indexes[indexAccessPattern.fromIndexToAccessPattern[indexName]].sk.labels = facets.labels[indexName].sk;
		}
		const deconstructors = {};
		for (const indexName of Object.keys(facets.labels)) {
			const keyTypes = prefixes[indexName] || {};
			deconstructors[indexName] = {};
			for (const keyType in keyTypes) {
				const prefixes = keyTypes[keyType];
				const labels = facets.labels[indexName][keyType] || [];
				const attributes = schema.attributes;
				deconstructors[indexName][keyType] = this._createKeyDeconstructor(prefixes, labels, attributes);
			}
		}

		return {
			name,
			table,
			schema,
			facets,
			entity,
			service,
			indexes,
			version,
			filters,
			prefixes,
			collections,
			modelVersion,
			subCollections,
			lookup: {
				clusteredIndexes,
				indexHasSortKeys,
				indexHasSubCollections
			},
			translations: {
				keys: indexField,
				indexes: indexAccessPattern,
				collections: indexCollection,
			},
			keys: {
				deconstructors,
			},
			original: model,
		};
	}
}

function getEntityIdentifiers(entities) {
	let identifiers = [];
	for (let alias of Object.keys(entities)) {
		let entity = entities[alias];
		let name = entity.model.entity;
		let version = entity.model.version;
		identifiers.push({
			name,
			alias,
			version,
			entity,
			nameField: entity.identifiers.entity,
			versionField: entity.identifiers.version
		});
	}
	return identifiers;
}

function matchToEntityAlias({ paramItem, identifiers, record, entities = {} } = {}) {
	let entity;
	if (paramItem && v.isFunction(paramItem[TransactionCommitSymbol])) {
		const committed = paramItem[TransactionCommitSymbol]();
		entity = committed.entity;
	}

	let entityAlias;
	for (let {name, version, nameField, versionField, alias} of identifiers) {
		if (entity && entity.model.entity === name && entity.model.version === version) {
			entityAlias = alias;
			break;
		} else if (record[nameField] !== undefined && record[versionField] !== undefined && record[nameField] === name && record[versionField] === version) {
			entityAlias = alias;
			break;
		} else if (entities[alias] && entities[alias].ownsKeys(record)) {
			entityAlias = alias;
			break;
		}
	}

	return entityAlias;
}

module.exports = {
	Entity,
	clauses,
	getEntityIdentifiers,
	matchToEntityAlias,
};
