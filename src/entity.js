"use strict";
const { Schema } = require("./schema");
const { ElectroInstance, KeyTypes, QueryTypes, MethodTypes, Comparisons, ExpressionTypes, ModelVersions, ElectroInstanceTypes, MaxBatchItems } = require("./types");
const { FilterFactory, FilterTypes } = require("./filters");
const { WhereFactory } = require("./where");
const { clauses, initChainState } = require("./clauses");
const validations = require("./validations");
const utilities = require("./util");
const e = require("./errors");

class Entity {
	constructor(model, config = {}) {
		this._validateModel(model);
		this.config = config;
		this.client = config.client;
		this.model = this._parseModel(model, config);
		/** start beta/v1 condition **/
		this.config.table = config.table || model.table;
		/** end beta/v1 condition **/
		this._filterBuilder = new FilterFactory(this.model.schema.attributes, FilterTypes);
		this._whereBuilder = new WhereFactory(this.model.schema.attributes, FilterTypes);
		this._clausesWithFilters = this._filterBuilder.injectFilterClauses(clauses, this.model.filters);
		this._clausesWithFilters = this._whereBuilder.injectWhereClauses(this._clausesWithFilters);
		this.scan = this._makeChain("", this._clausesWithFilters, clauses.index).scan();
		this.query = {};
		for (let accessPattern in this.model.indexes) {
			let index = this.model.indexes[accessPattern].index;
			this.query[accessPattern] = (...values) => {
				return this._makeChain(index, this._clausesWithFilters, clauses.index).query(...values);
			};
		}
		this.config.identifiers = config.identifiers || {};
		this.identifiers = {
			entity: this.config.identifiers.entity || "__edb_e__",
			version: this.config.identifiers.version || "__edb_v__",
		};
		this._instance = ElectroInstance.entity;
		this._instanceType = ElectroInstanceTypes.entity;
	}

	setIdentifier(type = "", identifier = "") {
		if (!this.identifiers[type]) {
			throw new e.ElectroError(e.ErrorCodes.InvalidIdentifier, `Invalid identifier type: ${type}. Valid indentifiers include ${Object.keys(this.identifiers).join(", ")}`);
		} else {
			this.identifiers[type] = identifier;
		}
	}

	find(facets = {}) {
		let match = this._findBestIndexKeyMatch(facets);
		if (match.shouldScan) {
			return this._makeChain("", this._clausesWithFilters, clauses.index).scan().filter(attr => {
				let eqFilters = [];
				for (let facet of Object.keys(facets)) {
					if (attr[facet]) {
						eqFilters.push(attr[facet].eq(facets[facet]));
					}
				}
				return eqFilters.join(" AND");
			})
		} else {
			return this._makeChain(match.index, this._clausesWithFilters, clauses.index).query(
				facets,
			).filter(attr => {
				let eqFilters = [];
				for (let facet of Object.keys(facets)) {
					if (attr[facet]) {
						eqFilters.push(attr[facet].eq(facets[facet]));
					}
				}
				return eqFilters.join(" AND");
			});
		}
	}

	collection(collection = "", clauses = {}, facets = {}, expressions = {}) {
		let options = {
			expressions: {
				names: expressions.names || {},
				values: expressions.values|| {},
				expression: expressions.expression || ""
			},
			lastEvaluatedKeyRaw: true,
		};
		let index = this.model.translations.collections.fromCollectionToIndex[
			collection
		];
		if (index === undefined) {
			throw new Error(`Invalid collection: ${collection}`);
		}
		return this._makeChain(index, this._clausesWithFilters, clauses.index, options).collection(
			collection,
			facets
		);
	}

	_validateModel(model) {
		return validations.model(model);
	}

	get(facets = {}) {
		let index = "";
		if (Array.isArray(facets)) {
			return this._makeChain(index, this._clausesWithFilters, clauses.index).batchGet(facets);
		} else {
			return this._makeChain(index, clauses, clauses.index).get(facets);
		}
	}


	delete(facets = {}) {
		let index = "";
		if (Array.isArray(facets)) {
			return this._makeChain(index, this._clausesWithFilters, clauses.index).batchDelete(facets);
		} else {
			return this._makeChain(index, this._clausesWithFilters, clauses.index).delete(facets);
		}
	}

	put(attributes = {}) {
		let index = "";
		if (Array.isArray(attributes)) {
			return this._makeChain(index, this._clausesWithFilters, clauses.index).batchPut(attributes);
		} else {
			return this._makeChain(index, this._clausesWithFilters, clauses.index).put(attributes);
		}
	}

	create(attributes = {}) {
		let index = "";
		let options = {
			params: {
				ConditionExpression: this._makeCreateConditions(index)
			}
		};
		return this._makeChain(index, this._clausesWithFilters, clauses.index, options).create(attributes);
	}

	update(facets = {}) {
		let index = "";
		return this._makeChain(index, this._clausesWithFilters, clauses.index).update(facets);
	}

	patch(facets = {}) {
		let index = "";
		let options = {
			params: {
				ConditionExpression: this._makePatchConditions(index)
			}
		};
		return this._makeChain(index, this._clausesWithFilters, clauses.index, options).patch(facets);
	}

	async go(method, parameters = {}, options = {}) {
		let config = {
			includeKeys: options.includeKeys,
			originalErr: options.originalErr,
			raw: options.raw,
			params: options.params || {},
			page: options.page,
			pager: !!options.pager,
			lastEvaluatedKeyRaw: !!options.lastEvaluatedKeyRaw,
			table: options.table
		};
		let stackTrace = new e.ElectroError(e.ErrorCodes.AWSError);
		try {
			switch (method) {
				case MethodTypes.batchWrite:
					return await this.executeBulkWrite(parameters, config);
				case MethodTypes.batchGet:
					return await this.executeBulkGet(parameters, config);
				default:
					return await this.executeQuery(method, parameters, config);
			}
		} catch (err) {
			if (config.originalErr) {
				return Promise.reject(err);
			} else {
				if (err.__isAWSError) {
					stackTrace.message = new e.ElectroError(e.ErrorCodes.AWSError, err.message).message;
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

	async _exec(method, parameters) {
		return this.client[method](parameters).promise().catch(err => {
			err.__isAWSError = true;
			throw err;
		});
	}

	async executeBulkWrite(parameters, config) {
		if (!Array.isArray(parameters)) {
			parameters = [parameters];
		}
		let results = [];
		await Promise.all(parameters.map(async params => {
			let response = await this._exec(MethodTypes.batchWrite, params);
			let unprocessed = this.formatBulkWriteResponse(params.IndexName, response, config);
			results = [...results, ...unprocessed];
		}));
		return results;
	}

	async executeBulkGet(parameters, config) {
		if (!Array.isArray(parameters)) {
			parameters = [parameters];
		}
		let resultsAll = [];
		let unprocessedAll = [];
		await Promise.all(parameters.map(async params => {
			let response = await this._exec(MethodTypes.batchGet, params);
			let [results, unprocessed] = this.formatBulkGetResponse(params.IndexName, response, config);
			resultsAll = [...resultsAll, ...results];
			unprocessedAll = [...unprocessedAll, ...unprocessed];
		}));
		return [resultsAll, unprocessedAll];
	}

	async executeQuery(method, parameters, config) {
		// let params = Object.assign({}, parameters);
		let response = await this._exec(method, parameters);
		if (method === MethodTypes.put || method === MethodTypes.create) {
			return this.formatResponse(parameters.IndexName, parameters, config);
		} else {
			return this.formatResponse(parameters.IndexName, response, config);
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

	formatBulkWriteResponse(index, response = {}, config = {}) {
		if (!response || !response.UnprocessedItems) {
			return response;
		}
		let table = config.table || this._getTableName();
		let unprocessed = response.UnprocessedItems[table];
		if (Array.isArray(unprocessed) && unprocessed.length) {
			return unprocessed.map(request => {
				if (request.PutRequest) {
					return this.formatResponse(index, request.PutRequest, config);
				} else if (request.DeleteRequest) {
					return this._formatReturnPager(index, request.DeleteRequest.Key);
				} else {
					throw new Error("Unknown response format");
				}
			})
		} else {
			return []
		}
	}

	formatBulkGetResponse(index, response = {}, config = {}) {
		let unprocessed = [];
		let results = [];
		let table = config.table || this._getTableName();
		if (!response.UnprocessedKeys || !response.Responses) {
			throw new Error("Unknown response format");
		}

		if (response.UnprocessedKeys[table] && response.UnprocessedKeys[table].Keys && Array.isArray(response.UnprocessedKeys[table].Keys)) {
			for (let value of response.UnprocessedKeys[table].Keys) {
				if (config && config.lastEvaluatedKeyRaw) {
					unprocessed.push(value);
				} else {
					unprocessed.push(
						this._formatReturnPager(index, value)
					);
				}
			}
		}

		if (response.Responses[table] && Array.isArray(response.Responses[table])) {
			results = this.formatResponse(index, {Items: response.Responses[table]}, config);
		}

		return [results, unprocessed];
	}

	formatResponse(index, response, config = {}) {
		let stackTrace = new Error();
		try {
			let results;

			if (config.raw) {
				if (response.TableName) {
					// a VERY hacky way to deal with PUTs
					results = {};
				} else {
					results = response;
				}
			} else {

				let data = {};
				if (response.Item) {
					data = this.cleanseRetrievedData(response.Item, config);
				} else if (response.Items) {
					data = response.Items.map((item) =>
						this.cleanseRetrievedData(item, config),
					);
				}

				if (Array.isArray(data)) {
					results = data.map((item) =>
						this.model.schema.applyAttributeGetters(item),
					);
				} else {
					results = this.model.schema.applyAttributeGetters(data);
				}
			}


			if (config.pager) {
				let nextPage = response.LastEvaluatedKey || null;
				if (!config.raw && !config.lastEvaluatedKeyRaw) {
					nextPage = this._formatReturnPager(index, nextPage, results[results.length - 1]);
				}
				results = [nextPage, results];
			}

			return results;

		} catch (err) {
			if (config.originalErr) {
				throw err;
			} else {
				stackTrace.message = err.message;
				throw stackTrace;
			}
		}
	}

	_getTableName() {
		return this.config.table;
	}

	_setTableName(table) {
		this.config.table = table;
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
	_makeChain(index = "", clauses, rootClause, options = {}) {
		let facets = this.model.facets.byIndex[index];
		let state = initChainState(index, facets, this.model.lookup.indexHasSortKeys[index], options);
		return this._chain(state, clauses, rootClause);
	}

	_regexpEscape(string) {
		return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	}

	_deconstructKeys(index, keyType, key, backupFacets = {}) {
		if (typeof key !== "string" || key.length === 0) {
			return null;
		}
		
		let accessPattern = this.model.translations.indexes.fromIndexToAccessPattern[index];
		let {prefix, isCustom} = this.model.prefixes[index][keyType];
		let {facets} = this.model.indexes[accessPattern][keyType];
		let names = [];
		let pattern = `^${this._regexpEscape(prefix)}`;
		let labels = this.model.facets.labels[index];
		for (let facet of facets) {
			let { name } = this.model.schema.attributes[facet];
			let label = labels[facet];
			if (isCustom) {
				pattern += `${this._regexpEscape(label === undefined ? "" : label)}(.+)`;
			} else {
				pattern += `#${this._regexpEscape(label === undefined ? name : label)}_(.+)`;
			}
			names.push(name);
		}
		pattern += "$";
		let regex = RegExp(pattern);
		let match = key.match(regex);
		let results = {};
		if (!match) {
			if (Object.keys(backupFacets || {}).length === 0) {
				// this can occur when a scan is performed but returns no results given the current filters or record timing
				return {};
			}
			for (let facet of facets) {
				if (backupFacets[facet] === undefined) {
					throw new e.ElectroError(e.ErrorCodes.LastEvaluatedKey, "LastEvaluatedKey contains entity that does not match the entity used to query. Use {lastEvaulatedKeyRaw: true} option.");
				} else {
					results[facet] = backupFacets[facet];
				}
			}
		} else {
			for (let i = 0; i < names.length; i++) {
				results[names[i]] = match[i+1]; 
			}
		}
		return results;
	}



	_deconstructIndex(index = "", lastEvaluated, lastReturned) {
		let pkName = this.model.translations.keys[index].pk;
		let skName = this.model.translations.keys[index].sk;
		let pkFacets = this._deconstructKeys(index, KeyTypes.pk, lastEvaluated[pkName], lastReturned);
		let skFacets = this._deconstructKeys(index, KeyTypes.sk, lastEvaluated[skName], lastReturned);
		let facets = {...pkFacets};
		if (skFacets && Object.keys(skFacets).length) {
			facets = {...skFacets, ...pkFacets};
		}
		return facets;
	}

	_formatReturnPager(index = "", lastEvaluated, lastReturned) {
		if (lastEvaluated === null || typeof lastEvaluated !== "object" || Object.keys(lastEvaluated).length === 0) {
			return lastEvaluated;
		}
		let tableIndex = "";
		let pager = this._deconstructIndex(index, lastEvaluated, lastReturned);
		// lastEvaluatedKeys from query calls include the index pk/sk as well as the table index's pk/sk
		if (index !== tableIndex) {
			pager = {...pager, ...this._deconstructIndex(tableIndex, lastEvaluated, lastReturned)};
		}
		let pagerIsEmpty = Object.keys(pager).length === 0;
		let pagerIsIncomplete = this.model.facets.byIndex[tableIndex].all.find(facet => pager[facet.name] === undefined);
		if (pagerIsEmpty || pagerIsIncomplete) {
			// In this case no suitable record could be found be the deconstructed pager.
			// This can be valid in cases where a scan is performed but returns no results.
			return null;
		}

		return pager;
	}

	_constructPagerIndex(index = "", item) {
		let pk = this._expectFacets(item, this.model.facets.byIndex[index].pk);
		let sk = this._expectFacets(item, this.model.facets.byIndex[index].sk);
		let keys = this._makeIndexKeys(index, pk, sk);
		return this._makeParameterKey(index, keys.pk, ...keys.sk);
	}

	_formatSuppliedPager(index = "", item) {
		if (typeof item !== "object" || Object.keys(item).length === 0) {
			return item;
		}
		let tableIndex = "";
		let pager = this._constructPagerIndex(index, item);
		if (index !== tableIndex) {
			pager = {...pager, ...this._constructPagerIndex(tableIndex, item)}
		}
		return pager
	}

	_applyParameterOptions(params, ...options) {
		let config = {
			includeKeys: false,
			originalErr: false,
			raw: false,
			params: {},
			page: {},
			pager: false
		};

		config = options.reduce((config, option) => {
			if (option.includeKeys) config.includeKeys = true;
			if (option.originalErr) config.originalErr = true;
			if (option.raw) config.raw = true;
			if (option.pager) config.pager = true;
			if (option.lastEvaluatedKeyRaw === true) config.lastEvaluatedKeyRaw = true;
			if (option.limit) config.params.Limit = option.limit;
			if (option.table) config.params.TableName = option.table;
			config.page = Object.assign({}, config.page, option.page);
			config.params = Object.assign({}, config.params, option.params);
			return config;
		}, config);

		let parameters = Object.assign({}, params);

		for (let customParameter of Object.keys(config.params)) {
			if (config.params[customParameter] !== undefined) {
				parameters[customParameter] = config.params[customParameter];
			}
		}

		if (Object.keys(config.page || {}).length) {
			if (config.raw || config.lastEvaluatedKeyRaw) {
				parameters.ExclusiveStartKey = config.page;
			} else {
				parameters.ExclusiveStartKey = this._formatSuppliedPager(params.IndexName, config.page);
			}
		}

		return parameters;
	}

	_makeCreateConditions(index) {
		let hasSortKey = this.model.lookup.indexHasSortKeys[index];
		let accessPattern = this.model.translations.indexes.fromIndexToAccessPattern[index];
		let pkField = this.model.indexes[accessPattern].pk.field;
		let filter = [`attribute_not_exists(${pkField})`];
		if (hasSortKey) {
			let skField = this.model.indexes[accessPattern].sk.field;
			filter.push(`attribute_not_exists(${skField})`);
		}
		return filter.join(" AND ");
	}

	_makePatchConditions(index) {
		let hasSortKey = this.model.lookup.indexHasSortKeys[index];
		let accessPattern = this.model.translations.indexes.fromIndexToAccessPattern[index];
		let pkField = this.model.indexes[accessPattern].pk.field;

		let filter = [`attribute_exists(${pkField})`];
		if (hasSortKey) {
			let skField = this.model.indexes[accessPattern].sk.field;
			filter.push(`attribute_exists(${skField})`);
		}
		return filter.join(" AND ");
	}

	_applyParameterExpressionTypes(params, filter) {
		if (typeof filter[ExpressionTypes.ConditionExpression] === "string" && filter[ExpressionTypes.ConditionExpression].length > 0) {
			if (typeof params[ExpressionTypes.ConditionExpression] === "string" && params[ExpressionTypes.ConditionExpression].length > 0) {
				params[ExpressionTypes.ConditionExpression] = `${params[ExpressionTypes.ConditionExpression]} AND ${filter[ExpressionTypes.ConditionExpression]}`
			} else {
				params[ExpressionTypes.ConditionExpression] = filter[ExpressionTypes.ConditionExpression];
			}
			if (Object.keys(filter.ExpressionAttributeNames).length > 0) {
				params.ExpressionAttributeNames = params.ExpressionAttributeNames || {};
				params.ExpressionAttributeNames = Object.assign({}, filter.ExpressionAttributeNames, params.ExpressionAttributeNames);
			}
			if (Object.keys(filter.ExpressionAttributeValues).length > 0) {
				params.ExpressionAttributeValues = params.ExpressionAttributeValues || {};
				params.ExpressionAttributeValues = Object.assign({}, filter.ExpressionAttributeValues, params.ExpressionAttributeValues);
			}
		}
		return params;
	}
	/* istanbul ignore next */
	_params(state, config = {}) {
		let { keys = {}, method = "", put = {}, update = {}, filter = {}, options = {} } = state.query;
		let conlidatedQueryFacets = this._consolidateQueryFacets(keys.sk);
		let params = {};
		switch (method) {
			case MethodTypes.get:
			case MethodTypes.delete:
				params = this._makeSimpleIndexParams(keys.pk, ...conlidatedQueryFacets);
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
					...conlidatedQueryFacets,
				);
				break;
			case MethodTypes.scan:
				params = this._makeScanParam(filter);
				break;
			/* istanbul ignore next */
			default:
				throw new Error(`Invalid method: ${method}`);
		}
		params = this._applyParameterOptions(params, options, config);
		return this._applyParameterExpressionTypes(params, filter);
	}

	_batchGetParams(state, config = {}) {
		let table = config.table || this._getTableName();
		let userDefinedParams = config.params || {};
		let records = [];
		for (let itemState of state.batch.items) {
			let method = itemState.query.method;
			let params = this._params(itemState, config);
			if (method === MethodTypes.get) {
				let {Key} = params;
				records.push(Key);
			}
		}
		let batches = utilities.batchItems(records, MaxBatchItems.batchGet);
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
		let table = config.table || this._getTableName();
		let records = [];
		for (let itemState of state.batch.items) {
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
		let batches = utilities.batchItems(records, MaxBatchItems.batchWrite);
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

	getIdentifierExpressions() {
		return {
			names: {
				[`#${this.identifiers.entity}_${this.model.entity}`]: this.identifiers.entity,
				[`#${this.identifiers.version}_${this.model.entity}`]: this.identifiers.version,
			},
			values: {
				[`:${this.identifiers.entity}_${this.model.entity}`]: this.model.entity,
				[`:${this.identifiers.version}_${this.model.entity}`]: this.model.version,
			},
			expression: `(#${this.identifiers.entity}_${this.model.entity} = :${this.identifiers.entity}_${this.model.entity} AND #${this.identifiers.version}_${this.model.entity} = :${this.identifiers.version}_${this.model.entity})`
		}
	}

	/* istanbul ignore next */
	_makeScanParam(filter = {}) {
		let indexBase = "";
		let hasSortKey = this.model.lookup.indexHasSortKeys[indexBase];
		let accessPattern = this.model.translations.indexes.fromIndexToAccessPattern[indexBase];
		let pkField = this.model.indexes[accessPattern].pk.field;
		// let facets = this.model.facets.byIndex[indexBase];
		let {pk, sk} = this._makeIndexKeys(indexBase);
		let keys = this._makeParameterKey(indexBase, pk, ...sk);
		let keyExpressions = this._expressionAttributeBuilder(keys);
		let params = {
			TableName: this._getTableName(),
			ExpressionAttributeNames: this._mergeExpressionsAttributes(
				filter.ExpressionAttributeNames,
				keyExpressions.ExpressionAttributeNames
			),
			ExpressionAttributeValues: this._mergeExpressionsAttributes(
				filter.ExpressionAttributeValues,
				keyExpressions.ExpressionAttributeValues,
			),
			FilterExpression: `begins_with(#${pkField}, :${pkField})`,
		};
		params.ExpressionAttributeNames["#" + this.identifiers.entity] = this.identifiers.entity;
		params.ExpressionAttributeNames["#" + this.identifiers.version] = this.identifiers.version;
		params.ExpressionAttributeValues[":" + this.identifiers.entity] = this.model.entity;
		params.ExpressionAttributeValues[":" + this.identifiers.version] = this.model.version;
		params.FilterExpression = `${params.FilterExpression} AND #${this.identifiers.entity} = :${this.identifiers.entity} AND #${this.identifiers.version} = :${this.identifiers.version}`;
		if (hasSortKey) {
			let skField = this.model.indexes[accessPattern].sk.field;
			params.FilterExpression = `${params.FilterExpression} AND begins_with(#${skField}, :${skField})`;
		}
		if (filter.FilterExpression) {
			params.FilterExpression = `${params.FilterExpression} AND ${filter.FilterExpression}`;
		}
		return params;
	}

	_makeSimpleIndexParams(partition, sort) {
		let index = "";
		let keys = this._makeIndexKeys(index, partition, sort);
		let Key = this._makeParameterKey(index, keys.pk, ...keys.sk);
		let TableName = this._getTableName();
		return {Key, TableName};
	}

	/* istanbul ignore next */
	_makeUpdateParams({ set } = {}, pk = {}, sk = {}) {
		let setAttributes = this.model.schema.applyAttributeSetters(set);
		let { indexKey, updatedKeys } = this._getUpdatedKeys(pk, sk, setAttributes);
		let translatedFields = this.model.schema.translateToFields(setAttributes);

		let item = {
			...translatedFields,
			...updatedKeys,
		};

		let {
			UpdateExpression,
			ExpressionAttributeNames,
			ExpressionAttributeValues,
		} = this._updateExpressionBuilder(item);

		return {
			UpdateExpression,
			ExpressionAttributeNames,
			ExpressionAttributeValues,
			TableName: this._getTableName(),
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
				[this.identifiers.entity]: this.model.entity,
				[this.identifiers.version]: this.model.version,
			},
			TableName: this._getTableName(),
		};
	}

	_updateExpressionBuilder(data) {
		let accessPattern = this.model.translations.indexes.fromIndexToAccessPattern[""]
		let skip = [
			...this.model.schema.getReadOnly(),
			// ...this.model.facets.fields,
			this.model.indexes[accessPattern].pk.field,
			this.model.indexes[accessPattern].sk.field
		];
		return this._expressionAttributeBuilder(data, { skip });
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
		let keyExpressions = this._expressionAttributeBuilder(keys, {
			translate,
			restrict,
		});

		return {
			ExpressionAttributeNames: Object.assign({}, keyExpressions.ExpressionAttributeNames),
			ExpressionAttributeValues: Object.assign({}, keyExpressions.ExpressionAttributeValues),
		};
	}

	/* istanbul ignore next */
	_expressionAttributeBuilder(item = {}, options = {}) {
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
				throw new e.ElectroError(e.ErrorCodes.MissingAttribute, `Item is missing attributes: ${missing.join(", ")}`);
			}
		}

		for (let prop in item) {
			if (reject.includes(prop)) {
				throw new Error(`Invalid attribute ${prop}`);
			}
			if (restrict.length && !restrict.includes(prop)) {
				throw new Error(`${prop} is not a valid attribute: ${restrict.join(", ")}`);
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
		expressions.UpdateExpression = `SET ${expressions.UpdateExpression.join(
			", ",
		)}`;
		return expressions;
	}

	/* istanbul ignore next */
	_queryParams(state = {}, options = {}) {
		let conlidatedQueryFacets = this._consolidateQueryFacets(
			state.query.keys.sk,
		);
		let indexKeys;
		if (state.query.type === QueryTypes.is) {
			indexKeys = this._makeIndexKeys(state.query.index, state.query.keys.pk, ...conlidatedQueryFacets);
		} else {
			indexKeys = this._makeIndexKeysWithoutTail(state.query.index, state.query.keys.pk, ...conlidatedQueryFacets);
		}

		let parameters = {};
		switch (state.query.type) {
			case QueryTypes.is:
			case QueryTypes.begins:
				parameters = this._makeBeginsWithQueryParams(
					state.query.options,
					state.query.index,
					state.query.filter,
					indexKeys.pk,
					...indexKeys.sk,
				);
				break;
			case QueryTypes.collection:
				parameters = this._makeBeginsWithQueryParams(
					state.query.options,
					state.query.index,
					state.query.filter,
					indexKeys.pk,
					this._getCollectionSk(state.query.collection),
				);
				break;
			case QueryTypes.between:
				parameters = this._makeBetweenQueryParams(
					state.query.index,
					state.query.filter,
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
					state.query.filter,
					indexKeys.pk,
					...indexKeys.sk,
				);
				break;
			default:
				throw new Error(`Invalid method: ${method}`);
		}
		return this._applyParameterOptions(parameters, options);
	}

	_makeBetweenQueryParams(index, filter, pk, ...sk) {
		let keyExpressions = this._queryKeyExpressionAttributeBuilder(
			index,
			pk,
			...sk,
		);
		delete keyExpressions.ExpressionAttributeNames["#sk2"];
		let params = {
			TableName: this._getTableName(),
			ExpressionAttributeNames: this._mergeExpressionsAttributes(
				filter.ExpressionAttributeNames,
				keyExpressions.ExpressionAttributeNames,
			),
			ExpressionAttributeValues: this._mergeExpressionsAttributes(
				filter.ExpressionAttributeValues,
				keyExpressions.ExpressionAttributeValues,
			),
			KeyConditionExpression: `#pk = :pk and #sk1 BETWEEN :sk1 AND :sk2`,
		};
		if (index) {
			params["IndexName"] = index;
		}
		if (filter.FilterExpression) {
			params.FilterExpression = filter.FilterExpression;
		}
		return params;
	}

	_makeBeginsWithQueryParams(options, index, filter, pk, sk) {
		let keyExpressions = this._queryKeyExpressionAttributeBuilder(index, pk, sk);
		let KeyConditionExpression = "#pk = :pk";
		if (this.model.lookup.indexHasSortKeys[index]) {
			KeyConditionExpression = `${KeyConditionExpression} and begins_with(#sk1, :sk1)`;
		}
		let customExpressions = {
			names: (options.expressions && options.expressions.names) || {},
			values: (options.expressions && options.expressions.values) || {},
			expression: (options.expressions && options.expressions.expression) || ""
		};
		let params = {
			KeyConditionExpression,
			TableName: this._getTableName(),
			ExpressionAttributeNames: this._mergeExpressionsAttributes(filter.ExpressionAttributeNames, keyExpressions.ExpressionAttributeNames, customExpressions.names),
			ExpressionAttributeValues: this._mergeExpressionsAttributes(filter.ExpressionAttributeValues, keyExpressions.ExpressionAttributeValues, customExpressions.values),
		};
		if (index) {
			params["IndexName"] = index;
		}
		let expressions = [customExpressions.expression, filter.FilterExpression].filter(Boolean).join(" AND ");
		if (expressions.length) {
			params.FilterExpression = expressions;
		}
		return params;
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
	_makeComparisonQueryParams(index = "", comparison = "", filter = {}, pk = {}, sk = {}) {
		let operator = Comparisons[comparison];
		if (!operator) {
			throw new Error(`Unexpected comparison operator "${comparison}", expected ${Object.values(Comparisons,).join(", ")}`);
		}
		let keyExpressions = this._queryKeyExpressionAttributeBuilder(
			index,
			pk,
			sk,
		);
		let params = {
			TableName: this._getTableName(),
			ExpressionAttributeNames: this._mergeExpressionsAttributes(
				filter.ExpressionAttributeNames,
				keyExpressions.ExpressionAttributeNames,
			),
			ExpressionAttributeValues: this._mergeExpressionsAttributes(
				filter.ExpressionAttributeValues,
				keyExpressions.ExpressionAttributeValues,
			),
			KeyConditionExpression: `#pk = :pk and #sk1 ${operator} :sk1`,
		};
		if (index) {
			params["IndexName"] = index;
		}
		if (filter.FilterExpression) {
			params.FilterExpression = filter.FilterExpression;
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
			throw new e.ElectroError(e.ErrorCodes.IncompleteFacets,
				`Incomplete facets: Without the facets ${missingFacets.map(val => `'${val}'`).join(", ")} the following access patterns cannot be updated: ${incompleteAccessPatterns.filter((val) => val !== undefined).map(val => `'${val}'`).join(", ")} `,
			);
		}
		return complete;
	}

	_makeKeysFromAttributes(indexes, attributes) {
		let indexKeys = {};
		for (let [index, keyTypes] of Object.entries(indexes)) {
			// let pkAttributes = keyTypes.pk ? attributes : {};
			// let skAttributes = keyTypes.sk ? attributes : {};
			// indexKeys[index] = this._makeIndexKeys(index, pkAttributes, skAttributes);
			let keys = this._makeIndexKeys(index, attributes, attributes);
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
			indexKeys[index] = this._makeIndexKeys(index, attributes, attributes);
		}
		return indexKeys;
	}

	_getPutKeys(pk, sk, set) {
		let setAttributes = this.model.schema.applyAttributeSetters(set);
		let updateIndex = "";
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

	_getUpdatedKeys(pk, sk, set) {
		let updateIndex = "";
		let keyTranslations = this.model.translations.keys;
		let keyAttributes = { ...sk, ...pk };
		let completeFacets = this._expectIndexFacets(
			{ ...set },
			{ ...keyAttributes },
		);

		// complete facets, only includes impacted facets which likely does not include the updateIndex which then needs to be added here.
		if (completeFacets.impactedIndexTypes[updateIndex] === undefined) {
			completeFacets.impactedIndexTypes[updateIndex] = {
				pk: "pk",
				sk: "sk"
			}
		}
		let composedKeys = this._makeKeysFromAttributes(completeFacets.impactedIndexTypes,{ ...set, ...keyAttributes });
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
			if (keys.pk) {
				updatedKeys[pk] = keys.pk;
			}
			if (sk && keys.sk[0]) {
				updatedKeys[sk] = keys.sk[0];
			}
		}
		return { indexKey, updatedKeys };
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
					impactedIndexTypes[index][type] = type;
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
			// .reduce((result, { missing }) => [...result, ...missing], []);

		// let impactedKeyFields = [];
		// for (let indexName of Object.keys(impactedIndexes)) {
		// 	let keyFields = Object.keys(impactedIndexes[indexName])
		// 		.map(keyType => this.model.translations.keys[indexName][keyType]);
		// 	impactedKeyFields = [...impactedKeyFields, ...keyFields];
		// }


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
				if (value) {
					result[name] = value;
				}
				return result;
			},
			{},
		);
		return { ...queryFacets };
	}

	/* istanbul ignore next */
	_expectFacets(obj = {}, properties = [], type = "key facets") {
		let [incompletePk, missing, matching] = this._expectProperties(obj, properties);
		if (incompletePk) {
			throw new e.ElectroError(e.ErrorCodes.IncompleteFacets, `Incomplete or invalid ${type} supplied. Missing properties: ${missing.join(", ")}`);
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

	_makeKeyPrefixes(service, entity, version = "1", tableIndex, modelVersion) {
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
				isCustom: tableIndex.customFacets.pk
			},
			sk: {
				prefix: "",
				isCustom: tableIndex.customFacets.sk
			}
		};

		let pk = `$${service}`;
		let sk = "";

		// If the index is in a collections, prepend the sk;
		if (tableIndex.collection) {
			sk = `$${tableIndex.collection}#${entity}`
		} else {
			sk = `$${entity}`
		}

		/** start beta/v1 condition **/
		if (modelVersion === ModelVersions.v1) {
			sk = `${sk}_${version}`;
		} else {
			pk = `${pk}_${version}`;
		}
		/** end beta/v1 condition **/

		// If no sk, append the sk properties to the pk
		if (Object.keys(tableIndex.sk).length === 0) {
			pk += sk;
		}

		// If keys arent custom, set the prefixes
		if (!keys.pk.isCustom) {
			keys.pk.prefix = pk.toLowerCase();
		}
		if (!keys.sk.isCustom) {
			keys.sk.prefix = sk.toLowerCase();
		}

		return keys;
	}

	_validateIndex(index) {
		if (!this.model.facets.byIndex[index]) {
			throw new Error(`Invalid index: ${index}`);
		}
	}

	_getCollectionSk(collection) {
		if (typeof collection && collection.length) {
			return `$${collection}`.toLowerCase();
		} else {
			return "";
		}
	}

	/* istanbul ignore next */
	_makeIndexKeysWithoutTail(index = "", pkFacets = {}, ...skFacets) {
		this._validateIndex(index);
		if (!skFacets.length) {
			skFacets.push({});
		}
		let facets = this.model.facets.byIndex[index];
		let prefixes = this.model.prefixes[index];
		if (!prefixes) {
			throw new Error(`Invalid index: ${index}`);
		}
		let pk = this._makeKey(prefixes.pk, facets.pk, pkFacets, this.model.facets.labels[index], {excludeLabelTail: true});
		let sk = [];
		if (this.model.lookup.indexHasSortKeys[index]) {
			for (let skFacet of skFacets) {
				sk.push(
					this._makeKey(prefixes.sk, facets.sk, skFacet, this.model.facets.labels[index], {excludeLabelTail: true}),
				);
			}
		}
		return { pk, sk };
	}

	/* istanbul ignore next */
	_makeIndexKeys(index = "", pkFacets = {}, ...skFacets) {
		this._validateIndex(index);
		if (!skFacets.length) {
			skFacets.push({});
		}
		let facets = this.model.facets.byIndex[index];
		let prefixes = this.model.prefixes[index];
		if (!prefixes) {
			throw new Error(`Invalid index: ${index}`);
		}
		let pk = this._makeKey(prefixes.pk, facets.pk, pkFacets, this.model.facets.labels[index]);
		let sk = [];
		if (this.model.lookup.indexHasSortKeys[index]) {
			for (let skFacet of skFacets) {
				sk.push(
					this._makeKey(prefixes.sk, facets.sk, skFacet, this.model.facets.labels[index]),
				);
			}
		}
		return { pk, sk };
	}

	/* istanbul ignore next */
	_makeKey({prefix, isCustom} = {}, facets = [], supplied = {}, labels = {}, {excludeLabelTail} = {}) {
		let key = prefix;
		for (let i = 0; i < facets.length; i++) {
			let facet = facets[i];
			let { name } = this.model.schema.attributes[facet];

			if (supplied[name] === undefined && excludeLabelTail) {
				break;
			}

			if (isCustom) {
				key = `${key}${labels[facet] === undefined ? "" : labels[facet]}`;
			} else {
				key = `${key}#${labels[facet] === undefined ? name : labels[facet]}_`;
			}
			// Undefined facet value means we cant build any more of the key
			if (supplied[name] === undefined) {
				break;
			}

			key = `${key}${supplied[name]}`;
		}
		return key.toLowerCase();
	}

	_findBestIndexKeyMatch(attributes) {
		let candidates = this.model.facets.bySlot.map((val, i) => i);
		let facets = this.model.facets.bySlot;
		let match;
		let keys = {};
		for (let i = 0; i < facets.length; i++) {
			let currentMatches = [];
			let nextMatches = [];
			for (let j = 0; j < candidates.length; j++) {
				let slot = candidates[j];
				if (!facets[i][slot]) {
					continue;
				}
				let name = facets[i][slot].name;
				let next = facets[i][slot].next;
				let index = facets[i][slot].index;
				let type = facets[i][slot].type;
				let match = !!attributes[name];
				let matchNext = !!attributes[next];
				if (match) {
					keys[index] = keys[index] || [];
					keys[index].push({ name, type });
					currentMatches.push(slot);
					if (matchNext) {
						nextMatches.push(slot);
					}
				}
			}
			if (currentMatches.length) {
				if (nextMatches.length) {
					candidates = [...nextMatches];
					continue;
				} else {
					match = facets[i][currentMatches[0]].index;
					break;
				}
			} else if (i === 0) {
				break;
			} else {
				match = (candidates[0] !== undefined && facets[i][candidates[0]].index) || "";
				break;
			}
		}
		return {
			keys: keys[match] || [],
			index: match || "",
			shouldScan: match === undefined
		};
	}

	/* istanbul ignore next */
	_parseComposedKey(key = "") {
		let facets = {};
		let names = key.match(/:[A-Z1-9]+/gi);
		if (!names) {
			throw new e.ElectroError(e.ErrorCodes.InvalidKeyFacetTemplate, `Invalid key facet template. No facets provided, expected at least one facet with the format ":attributeName". Received: ${key}`);
		}
		let labels = key.split(/:[A-Z1-9]+/gi);
		for (let i = 0; i < names.length; i++) {
			let name = names[i].replace(":", "");
			let label = labels[i];
			if (name !== "") {
				facets[name] = label;
			}
		}
		return facets;
	}

	_parseFacets(facets) {
		let isCustom = !Array.isArray(facets);
		if (isCustom) {
			let facetLabels = this._parseComposedKey(facets);
			return {
				isCustom,
				facetLabels,
				facetArray: Object.keys(facetLabels),
			};
		} else {
			return {
				isCustom,
				facetLabels: {},
				facetArray: facets,
			};
		}
	}

	_normalizeIndexes(indexes) {
		let normalized = {};
		let indexFieldTranslation = {};
		let indexHasSortKeys = {};
		let indexAccessPatternTransaction = {
			fromAccessPatternToIndex: {},
			fromIndexToAccessPattern: {},
		};
		let collectionIndexTranslation = {
			fromCollectionToIndex: {},
			fromIndexToCollection: {},
		};
		let collections = {};
		let facets = {
			byIndex: {},
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
			let indexName = index.index || "";
			if (seenIndexes[indexName] !== undefined) {
				if (indexName === "") {
					throw new e.ElectroError(e.ErrorCodes.DuplicateIndexes, `Duplicate index defined in model: ${accessPattern} ${indexName || "(PRIMARY INDEX)"}. This could be because you forgot to specify the index name of a secondary index defined in your model.`);
				} else {
					throw new e.ElectroError(e.ErrorCodes.DuplicateIndexes, `Duplicate index defined in model: ${accessPattern} ${indexName || "(PRIMARY INDEX)"}`);
				}
			}
			seenIndexes[indexName] = indexName;
			let hasSk = !!index.sk;
			let inCollection = !!index.collection;
			if (!hasSk && inCollection) {
				throw new e.ElectroError(e.ErrorCodes.CollectionNoSK, `Invalid index definition: Access pattern, ${accessPattern} ${indexName || "(PRIMARY INDEX)"}, contains a collection definition without a defined SK. Collections can only be defined on indexes with a defined SK.`);
			}
			let collection = index.collection || "";
			let customFacets = {
				pk: false,
				sk: false,
			};
			indexHasSortKeys[indexName] = hasSk;
			let parsedPKFacets = this._parseFacets(index.pk.facets);

			let { facetArray, facetLabels } = parsedPKFacets;
			customFacets.pk = parsedPKFacets.isCustom;
			// labels can be set via the attribute definition or as part of the facetTemplate.
			facets.labels[indexName] = Object.assign({}, facets.labels[indexName] || {}, facetLabels);

			let pk = {
				accessPattern,
				facetLabels,
				index: indexName,
				type: KeyTypes.pk,
				field: index.pk.field || "",
				facets: [...facetArray],
				isCustom: parsedPKFacets.isCustom
			};
			let sk = {};
			let parsedSKFacets = {};
			if (hasSk) {
				parsedSKFacets = this._parseFacets(index.sk.facets);
				let { facetArray, facetLabels } = parsedSKFacets;
				customFacets.sk = parsedSKFacets.isCustom;
        facets.labels[indexName] = Object.assign({}, facets.labels[indexName] || {}, facetLabels);
				sk = {
					facetLabels,
					accessPattern,
					index: indexName,
					type: KeyTypes.sk,
					field: index.sk.field || "",
					facets: [...facetArray],
					isCustom: parsedSKFacets.isCustom
				};
				facets.fields.push(sk.field);
			}

			if (seenIndexFields[pk.field] !== undefined) {
				throw new e.ElectroError(e.ErrorCodes.DuplicateIndexFields, `Partition Key (pk) on Access Pattern '${accessPattern}' references the field '${pk.field}' which is already referenced by the Access Pattern '${seenIndexFields[pk.field]}'. Fields used for indexes need to be unique to avoid conflicts.`);
			} else {
				seenIndexFields[pk.field] = accessPattern;
			}

			if (sk.field) {
				if (sk.field === pk.field) {
					throw new e.ElectroError(e.ErrorCodes.DuplicateIndexFields, `The Access Pattern '${accessPattern}' references the field '${pk.field}' as the field name for both the PK and SK. Fields used for indexes need to be unique to avoid conflicts.`);
				} else if (seenIndexFields[sk.field] !== undefined) {
					throw new e.ElectroError(e.ErrorCodes.DuplicateIndexFields, `Sort Key (sk) on Access Pattern '${accessPattern}' references the field '${pk.field}' which is already referenced by the Access Pattern '${seenIndexFields[pk.field]}'. Fields used for indexes need to be unique to avoid conflicts.`);
				}else {
					seenIndexFields[sk.field] = accessPattern;
				}
			}

			if (Array.isArray(sk.facets)) {
				let duplicates = pk.facets.filter(facet => sk.facets.includes(facet));
				if (duplicates.length !== 0) {
					throw new e.ElectroError(e.ErrorCodes.DuplicateIndexFacets, `The Access Pattern '${accessPattern}' contains duplicate references the facet(s): ${duplicates.map(facet => `'${facet}'`).join(", ")}. Facet attributes can only be used once within an index. If this leaves the Sort Key (sk) without any facets simply set this to be an empty array.`);
				}
			}

			let definition = {
				pk,
				sk,
				collection,
				customFacets,
				index: indexName,
			};

			if (inCollection) {
				if (collections[collection] !== undefined) {
					throw new e.ElectroError(e.ErrorCodes.DuplicateCollections, `Duplicate collection, "${collection}" is defined across multiple indexes "${collections[collection]}" and "${accessPattern}". Collections must be unique names across indexes for an Entity.`,);
				} else {
					collections[collection] = accessPattern;
				}
				collectionIndexTranslation.fromCollectionToIndex[
					collection
				] = indexName;
				collectionIndexTranslation.fromIndexToCollection[
					indexName
				] = collection;
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
			};

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
		}

		if (facets.byIndex[""] === undefined) {
			throw new e.ElectroError(e.ErrorCodes.MissingPrimaryIndex, "Schema is missing an index definition for the table's main index. Please update the schema to include an index without a specified name to define the table's natural index");
		}

		return {
			facets,
			indexHasSortKeys,
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
				throw new e.ElectroError(e.ErrorCodes.InvalidFilter, `Invalid filter name: ${name}. Filter cannot be named ${invalidFilterNames.map(name => `"${name}"`).join(", ")}`);
			} else {
				normalized[name] = fn;
			}
		}

		return normalized;
	}

	_normalizePrefixes(service, entity, version, indexes, modelVersion) {
		let prefixes = {};
		for (let accessPattern of Object.keys(indexes)) {
			let item = indexes[accessPattern];
			prefixes[item.index] = this._makeKeyPrefixes(service, entity, version, item, modelVersion);
		}
		return prefixes;
	}

	_parseModel(model, config = {}) {
		/** start beta/v1 condition **/
		let modelVersion = utilities.getModelVersion(model);
		let service, entity, version, table;
		switch(modelVersion) {
			case ModelVersions.beta:
				service = model.service;
				entity = model.entity;
				version = model.version;
				table = config.table || model.table;
				break;
			case ModelVersions.v1:
				service = model.model && model.model.service;
				entity = model.model && model.model.entity;
				version = model.model && model.model.version;
				table = config.table || model.table;
				break;
			default:
				throw new Error("Invalid model");
		}
		/** end beta/v1 condition **/

		let {
			facets,
			indexes,
			indexField,
			collections,
			indexHasSortKeys,
			indexAccessPattern,
			indexCollection,
		} = this._normalizeIndexes(model.indexes);
		let schema = new Schema(model.attributes, facets);
		let filters = this._normalizeFilters(model.filters);
		let prefixes = this._normalizePrefixes(service, entity, version, indexes, modelVersion);

		// apply model defined labels
		let modelLabels = schema.getLabels();
		for (let indexName of Object.keys(facets.labels)) {
			facets.labels[indexName] = Object.assign({}, modelLabels, facets.labels[indexName]);
		}

		return {
			modelVersion,
			service,
			version,
			entity,
			table,
			schema,
			facets,
			indexes,
			filters,
			prefixes,
			collections,
			lookup: {
				indexHasSortKeys,
			},
			translations: {
				keys: indexField,
				indexes: indexAccessPattern,
				collections: indexCollection,
			},
			original: model,
		};
	}
}

module.exports = {
	Entity,
	clauses,
};
