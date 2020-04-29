"use strict";
const { Schema } = require("./schema");
const { KeyTypes, QueryTypes, MethodTypes, Comparisons } = require("./types");
const { FilterFactory, FilterTypes } = require("./filters");
const validations = require("./validations");
const { clauses } = require("./clauses");

const utilities = {
	structureFacets: function (
		structure,
		{ index, type, name } /* istanbul ignore next */ = {},
		i,
		attributes,
		indexSlot,
	) {
		let next = attributes[i + 1] !== undefined ? attributes[i + 1].name : "";
		let facet = { index, name, type, next };
		structure.byAttr[name] = structure.byAttr[name] || [];
		structure.byAttr[name].push(facet);
		structure.byType[type] = structure.byType[type] || [];
		structure.byType[type].push(facet);
		structure.byFacet[name] = structure.byFacet[name] || [];
		structure.byFacet[name][i] = structure.byFacet[name][i] || [];
		structure.byFacet[name][i].push(facet);
		structure.bySlot[i] = structure.bySlot[i] || [];
		structure.bySlot[i][indexSlot] = facet;
	},
	safeParse(str = "") {
		try {
			if (typeof str === "string") {
				
			}
		} catch(err) {

		}
	},
	safeStringify() {

	}
};

class Entity {
	constructor(model /* istanbul ignore next */ = {}, config /* istanbul ignore next */ = {}) {
		this._validateModel(model);
		this.client = config.client;
		this.model = this._parseModel(model);
		this._filterBuilder = new FilterFactory(
			this.model.schema.attributes,
			FilterTypes,
		);
		this.query = {};

		let clausesWithFilters = this._filterBuilder.injectFilterClauses(
			clauses,
			this.model.filters,
		);
		// this.find = (facets = {}) => {
		// 	let index = this._findBestIndexKeyMatch(facets);
		// 	return this._makeChain(index, clausesWithFilters, clauses.index).query(
		// 		facets,
		// 	);
		// };
		this.scan = this._makeChain("", clausesWithFilters, clauses.index).scan();
		for (let accessPattern in this.model.indexes) {
			let index = this.model.indexes[accessPattern].index;
			this.query[accessPattern] = (...values) => {
				return this._makeChain(index, clausesWithFilters, clauses.index).query(
					...values,
				);
			};
		}
	}

	collection(collection /* istanbul ignore next */ = "", clauses /* istanbul ignore next */ = {}, facets /* istanbul ignore next */ = {}) {
		let index = this.model.translations.collections.fromCollectionToIndex[
			collection
		];
		return this._makeChain(index, clauses, clauses.index).collection(
			collection,
			facets,
		);
	}

	_validateModel(model = {}) {
		return validations.model(model);
	}

	get(facets = {}) {
		let index = "";
		return this._makeChain(index, clauses, clauses.index).get(facets);
	}

	delete(facets = {}) {
		let index = "";
		return this._makeChain(index, clauses, clauses.index).delete(facets);
	}

	put(attributes = {}) {
		let index = "";
		return this._makeChain(index, clauses, clauses.index).put(attributes);
	}

	update(facets = {}) {
		let index = "";
		return this._makeChain(index, clauses, clauses.index).update(facets);
	}

	_chain(state = {}, clauses, clause = {}) {
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

	_makeChain(index = "", clauses, rootClause, options = {}) {
		let facets = this.model.facets.byIndex[index];
		let state = {
			query: {
				index: index,
				type: "",
				method: "",
				facets: { ...facets },
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
				filter: {},
			},
			collectionOnly: !!options.collectionOnly,
			hasSortKey: this.model.lookup.indexHasSortKeys[index],
		};
		return this._chain(state, clauses, rootClause);
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

	formatResponse(response, config = {}) {
		let stackTrace = new Error();
		try {
			if (config.raw) {
				if (response.TableName) {
					// a VERY hacky way to deal with PUTs
					return {};
				} else {
					return response;
				}
			}

			let data = {};
			if (response.Item) {
				data = this.cleanseRetrievedData(response.Item, config);
			} else if (response.Items) {
				data = response.Items.map((item) =>
					this.cleanseRetrievedData(item, config),
				);
			}

			let appliedGets;
			if (Array.isArray(data)) {
				appliedGets = data.map((item) =>
					this.model.schema.applyAttributeGetters(item),
				);
			} else {
				appliedGets = this.model.schema.applyAttributeGetters(data);
			}
			console.log("CONFIG.PAGE", typeof config.page, response.LastEvaluatedKey);
			if (typeof config.page === "string") {
				let nextPage = response.LastEvaluatedKey || "";
				return [nextPage, appliedGets]
			}
			return appliedGets;
		} catch (err) {
			if (config.originalErr) {
				throw err;
			} else {
				stackTrace.message = err.message;
				throw stackTrace;
			}
		}
	}

	

	async go(method, params = {}, options = {}) {
		let config = {
			includeKeys: options.includeKeys,
			originalErr: options.originalErr,
			raw: options.raw,
			params: options.params || {},
			page: options.page
		};
		let parameters = Object.assign({}, params);
		for (let [name, value] of Object.entries(config.params)) {
			if (value !== undefined) {
				parameters[name] = value;
			}
		}
		

		let stackTrace = new Error();
		try {
			let response = await this.client[method](parameters).promise();
			if (method === "put") {
				// a VERY hacky way to deal with PUTs
				return this.formatResponse(parameters, config);
			} else {
				return this.formatResponse(response, config);
			}
		} catch (err) {
			if (config.originalErr) {
				return Promise.reject(err);
			} else {
				stackTrace.message = err.message;
				return Promise.reject(stackTrace);
			}
		}
	}

	_params({ keys = {}, method = "", put = {}, update = {}, filter = {} } = {}) {
		let conlidatedQueryFacets = this._consolidateQueryFacets(keys.sk);

		switch (method) {
			case MethodTypes.get:
			case MethodTypes.delete:
				return this._makeSimpleIndexParams(keys.pk, ...conlidatedQueryFacets);
			case MethodTypes.put:
				return this._makePutParams(put, keys.pk, ...keys.sk);
			case MethodTypes.update:
				return this._makeUpdateParams(
					update,
					keys.pk,
					...conlidatedQueryFacets,
				);
			case MethodTypes.scan:
				return this._makeScanParam(filter);
			default:
				throw new Error(`Invalid method: ${method}`);
		}
	}

	_makeParameterKey(index, pk, sk) {
		let name = this.model.translations.indexes.fromIndexToAccessPattern[index];
		let hasSortKey = this.model.lookup.indexHasSortKeys[index];
		let accessPattern = this.model.indexes[name];
		let key = {
			[accessPattern.pk.field]: pk,
		};
		if (hasSortKey && sk !== undefined) {
			key[accessPattern.sk.field] = sk;
		}
		return key;
	}

	_makeScanParam(filter = {}) {
		// let _makeKey
		// let { pk, sk } = this._makeIndexKeys();
		let indexBase = "";
		let hasSortKey = this.model.lookup.indexHasSortKeys[indexBase];
		let facets = this.model.facets.byIndex[indexBase];
		let keys = this._makeParameterKey(
			indexBase,
			this._makeKey(this.model.prefixes.pk, facets.pk),
			this._makeKey(this.model.prefixes.sk, facets.sk),
		);
		let keyExpressions = this._expressionAttributeBuilder(keys);
		let params = {
			TableName: this.model.table,
			ExpressionAttributeNames: this._mergeExpressionsAttributes(
				filter.ExpressionAttributeNames,
				keyExpressions.ExpressionAttributeNames,
			),
			ExpressionAttributeValues: this._mergeExpressionsAttributes(
				filter.ExpressionAttributeValues,
				keyExpressions.ExpressionAttributeValues,
			),
			FilterExpression: `(begins_with(#pk, :pk)`,
		};
		if (hasSortKey) {
			params.FilterExpression = `${params.FilterExpression} AND begins_with(#sk, :sk))`;
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
		let params = {
			Key,
			TableName: this.model.table,
		};
		return params;
	}

	_makeUpdateParams({ set } = {}, pk = {}, sk = {}) {
		let setAttributes = this.model.schema.applyAttributeSetters(set);
		let { indexKey, updatedKeys } = this._getUpdatedKeys(pk, sk, setAttributes);
		let transatedFields = this.model.schema.translateToFields(setAttributes);
		let item = {
			...transatedFields,
			...updatedKeys,
		};
		let {
			UpdateExpression,
			ExpressionAttributeNames,
			ExpressionAttributeValues,
		} = this._updateExpressionBuilder(item);

		let params = {
			UpdateExpression,
			ExpressionAttributeNames,
			ExpressionAttributeValues,
			TableName: this.model.table,
			Key: indexKey,
		};
		return params;
	}

	_makePutParams({ data } = {}, pk, sk) {
		let setAttributes = this.model.schema.applyAttributeSetters(data);
		let { updatedKeys } = this._getUpdatedKeys(pk, sk, setAttributes);
		let transatedFields = this.model.schema.translateToFields(setAttributes);
		let params = {
			Item: {
				...transatedFields,
				...updatedKeys,
				__edb_e__: this.model.entity,
			},
			TableName: this.model.table,
		};
		return params;
	}

	_updateExpressionBuilder(data = {}) {
		let skip = [
			...this.model.schema.getReadOnly(),
			...this.model.facets.fields,
		];
		return this._expressionAttributeBuilder(data, { skip });
	}

	_queryKeyExpressionAttributeBuilder(index = "", pk, ...sks) {
		let translate = { ...this.model.translations.keys[index] };
		let restrict = ["pk"];
		let keys = { pk };
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
			ExpressionAttributeNames: Object.assign(
				{},
				keyExpressions.ExpressionAttributeNames,
			),
			ExpressionAttributeValues: Object.assign(
				{},
				keyExpressions.ExpressionAttributeValues,
			),
		};
	}

	_expressionAttributeBuilder(
		item = {},
		options = {},
		{ noDuplicateNames } = {},
	) {
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
				throw new Error(`Item is missing attributes: ${missing.join(", ")}`);
			}
		}

		for (let prop in item) {
			if (reject.includes(prop)) {
				throw new Error(`Invalid attribute ${prop}`);
			}
			if (restrict.length && !restrict.includes(prop)) {
				throw new Error(
					`${prop} is not a valid attribute: ${restrict.join(", ")}`,
				);
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

	_queryParams(chainState = {}, options = {}) {
		let conlidatedQueryFacets = this._consolidateQueryFacets(
			chainState.keys.sk,
		);
		let { pk, sk } = this._makeIndexKeys(
			chainState.index,
			chainState.keys.pk,
			...conlidatedQueryFacets,
		);
		let parameters = {};
		switch (chainState.type) {
			case QueryTypes.begins:
				parameters = this._makeBeginsWithQueryParams(
					chainState.index,
					chainState.filter,
					pk,
					...sk,
				);
				break;
			case QueryTypes.collection:
				parameters = this._makeBeginsWithQueryParams(
					chainState.index,
					chainState.filter,
					pk,
					this._getCollectionSk(chainState.collection),
				);
				break;
			case QueryTypes.between:
				parameters = this._makeBetweenQueryParams(
					chainState.index,
					chainState.filter,
					pk,
					...sk,
				);
				break;
			case QueryTypes.gte:
			case QueryTypes.gt:
			case QueryTypes.lte:
			case QueryTypes.lt:
				parameters = this._makeComparisonQueryParams(
					chainState.index,
					chainState.type,
					chainState.filter,
					pk,
					...sk,
				);
				break;
			default:
				throw new Error(`Invalid method: ${method}`);
		}
		if (typeof options.page === "string" && options.page.length) {
			parameters.ExclusiveStartKey = options.page;
		}
		return parameters;
	}

	_makeBetweenQueryParams(index = "", filter = {}, pk = {}, ...sk) {
		let keyExpressions = this._queryKeyExpressionAttributeBuilder(
			index,
			pk,
			...sk,
		);
		delete keyExpressions.ExpressionAttributeNames["#sk2"];
		let params = {
			TableName: this.model.table,
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

	_makeBeginsWithQueryParams(index = "", filter = {}, pk = {}, sk = {}) {
		let keyExpressions = this._queryKeyExpressionAttributeBuilder(
			index,
			pk,
			sk,
		);
		let params = {
			TableName: this.model.table,
			ExpressionAttributeNames: this._mergeExpressionsAttributes(
				filter.ExpressionAttributeNames,
				keyExpressions.ExpressionAttributeNames,
			),
			ExpressionAttributeValues: this._mergeExpressionsAttributes(
				filter.ExpressionAttributeValues,
				keyExpressions.ExpressionAttributeValues,
			),
			KeyConditionExpression: `#pk = :pk and begins_with(#sk1, :sk1)`,
		};
		if (index) {
			params["IndexName"] = index;
		}
		if (filter.FilterExpression) {
			params.FilterExpression = filter.FilterExpression;
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

	_makeComparisonQueryParams(
		index = "",
		comparison = "",
		filter = {},
		pk = {},
		sk = {},
	) {
		let operator = Comparisons[comparison];
		if (!operator) {
			throw new Error(
				`Unexpected comparison operator "${comparison}", expected ${Object.values(
					Comparisons,
				).join(", ")}`,
			);
		}
		let keyExpressions = this._queryKeyExpressionAttributeBuilder(
			index,
			pk,
			sk,
		);
		let params = {
			TableName: this.model.table,
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

	_expectIndexFacets(attributes = {}, facets = {}) {
		let [isIncomplete, { incomplete, complete }] = this._getIndexImpact(
			attributes,
			facets,
		);
		let incompleteAccessPatterns = incomplete.map(
			({ index }) =>
				this.model.translations.indexes.fromIndexToAccessPattern[index],
		);
		if (isIncomplete) {
			throw new Error(
				`Incomplete facets: Without the facets ${incomplete
					.filter((val) => val !== undefined)
					.join(
						", ",
					)} the following access patterns ${incompleteAccessPatterns
					.filter((val) => val !== undefined)
					.join(", ")}cannot be updated.`,
			);
		}
		return complete;
	}

	_makeKeysFromAttributes(indexes, attributes = {}) {
		let indexKeys = {};
		for (let index of indexes) {
			indexKeys[index] = this._makeIndexKeys(index, attributes, attributes);
		}
		return indexKeys;
	}

	_getUpdatedKeys(pk = {}, sk = {}, set = {}) {
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
		let composedKeys = this._makeKeysFromAttributes(completeFacets.indexes, {
			...keyAttributes,
			...set,
		});
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
		return { indexKey, updatedKeys };
	}

	_getIndexImpact(attributes = {}, included = {}) {
		let includedFacets = Object.keys(included);
		let impactedIndexes = {};
		let completedIndexes = [];
		let facets = {};
		for (let [attribute, indexes] of Object.entries(this.model.facets.byAttr)) {
			if (attributes[attribute]) {
				facets[attribute] = attributes[attribute];
				indexes.forEach(({ index, type }) => {
					impactedIndexes[index] = impactedIndexes[index] || {};
					impactedIndexes[index][type] = impactedIndexes[index][type] || [];
					impactedIndexes[index][type].push(attribute);
				});
			}
		}
		let incomplete = Object.entries(this.model.facets.byIndex)
			.map(([index, { pk, sk }]) => {
				let impacted = impactedIndexes[index];
				let impact = { index, missing: [] };
				if (impacted) {
					let missingPk =
						impacted[KeyTypes.pk] && impacted[KeyTypes.pk].length !== pk.length;
					let missingSk =
						impacted[KeyTypes.sk] && impacted[KeyTypes.sk].length !== sk.length;
					if (missingPk) {
						impact.missing = [
							...impact.missing,
							...pk.filter(
								(attr) =>
									!impacted[KeyTypes.pk].includes(attr) &&
									!includedFacets.includes(attr),
							),
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
			.reduce((result, { missing }) => [...result, ...missing], []);
		let isIncomplete = !!incomplete.length;
		let complete = {
			facets,
			indexes: completedIndexes,
		};
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
		return properties.map((name) => [name, obj[name]]);
	}

	_expectProperties(obj = {}, properties = []) {
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

	_makeKeyPrefixes(service = "", entity = "", version = "1") {
		return {
			pk: `$${service}_${version}`,
			sk: `$${entity}`,
		};
	}

	_validateIndex(index = "") {
		if (!this.model.facets.byIndex[index]) {
			throw new Error(`Invalid index: ${index}`);
		}
	}

	_getCollectionSk(collection = "") {
		if (typeof collection && collection.length) {
			return `$${collection}`.toLowerCase();
		} else {
			return "";
		}
	}

	_getPrefixes({ collection = "", customFacets = {} } = {}) {
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
				isCustom: false,
			},
			sk: {
				prefix: "",
				isCustom: false,
			},
		};

		if (collection) {
			keys.pk.prefix = this.model.prefixes.pk;
			keys.sk.prefix = `$${collection}#${this.model.entity}`;
		} else {
			keys.pk.prefix = this.model.prefixes.pk;
			keys.sk.prefix = this.model.prefixes.sk;
		}

		if (customFacets.pk) {
			keys.pk.prefix = "";
			keys.pk.isCustom = customFacets.pk;
		}

		if (customFacets.sk) {
			keys.sk.prefix = "";
			keys.sk.isCustom = customFacets.sk;
		}

		return keys;
	}

	_makeIndexKeys(index = "", pkFacets = {}, ...skFacets) {
		this._validateIndex(index);
		let facets = this.model.facets.byIndex[index];
		let prefixes = this._getPrefixes(facets);
		let pk = this._makeKey(
			prefixes.pk.prefix,
			facets.pk,
			pkFacets,
			prefixes.pk,
		);
		let sk = [];
		if (this.model.lookup.indexHasSortKeys[index]) {
			for (let skFacet of skFacets) {
				sk.push(
					this._makeKey(prefixes.sk.prefix, facets.sk, skFacet, prefixes.sk),
				);
			}
		}
		return { pk, sk };
	}

	_makeKey(prefix = "", facets = [], supplied = {}, { isCustom } = {}) {
		let key = prefix;
		for (let i = 0; i < facets.length; i++) {
			let facet = facets[i];
			let { label, name } = this.model.schema.attributes[facet];
			if (isCustom) {
				key = `${key}${label}`;
			} else {
				key = `${key}#${label || name}_`;
			}
			if (supplied[name] !== undefined) {
				key = `${key}${supplied[name]}`;
			} else {
				break;
			}
		}
		return key.toLowerCase();
	}

	_findBestIndexKeyMatch(attributes = {}) {
		let candidates = this.model.facets.bySlot.map((val, i) => i);
		let facets = this.model.facets.bySlot;
		let match = "";
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
				match = "";
				break;
			} else {
				match =
					(candidates[0] !== undefined && facets[i][candidates[0]].index) || "";
				break;
			}
		}
		return {
			keys: keys[match] || [],
			index: match || "",
		};
	}

	_parseComposedKey(key = "") {
		let facets = {};
		let names = key.match(/:[A-Z1-9]+/gi);
		if (!names) {
			throw new Error(
				`Invalid key facet template. No facets provided, expected at least one facet with the format ":attributeName". Received: ${key}`,
			);
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

	_normalizeIndexes(indexes = {}) {
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

		let accessPatterns = Object.keys(indexes);

		for (let i in accessPatterns) {
			let accessPattern = accessPatterns[i];
			let index = indexes[accessPattern];
			let indexName = index.index || "";
			if (seenIndexes[indexName] !== undefined) {
				throw new Error(
					`Duplicate index defined in model: ${accessPattern} (${
						indexName || "PRIMARY INDEX"
					})`,
				);
			}
			seenIndexes[indexName] = indexName;
			let hasSk = !!index.sk;
			let inCollection = !!index.collection;
			let collection = index.collection || "";
			let customFacets = {
				pk: false,
				sk: false,
			};
			indexHasSortKeys[indexName] = hasSk;
			let parsedPKFacets = this._parseFacets(index.pk.facets);
			let { facetArray, facetLabels } = parsedPKFacets;
			customFacets.pk = parsedPKFacets.isCustom;
			facets.labels = Object.assign({}, facets.labels, facetLabels);
			let pk = {
				accessPattern,
				facetLabels,
				index: indexName,
				type: KeyTypes.pk,
				field: index.pk.field || "",
				facets: [...facetArray],
			};
			let sk = {};

			if (hasSk) {
				let parseSKFacets = this._parseFacets(index.sk.facets);
				let { facetArray, facetLabels } = parseSKFacets;
				customFacets.sk = parseSKFacets.isCustom;
				facets.labels = Object.assign({}, facets.labels, facetLabels);
				sk = {
					facetLabels,
					accessPattern,
					index: indexName,
					type: KeyTypes.sk,
					field: index.sk.field || "",
					facets: [...facetArray],
				};
				facets.fields.push(sk.field);
			}

			// if (inCollection) {
			// 	collections[index.collection] = index.collection;
			// }

			let definition = {
				pk,
				sk,
				collection,
				customFacets,
				index: indexName,
				collection: index.collection,
			};

			if (inCollection) {
				if (collections[collection] !== undefined) {
					throw new Error(
						`Duplicate collection, "${collection}" is defined across multiple indexes "${collections[collection]}" and "${accessPattern}". Collections must be unique names across indexes for an Entity.`,
					);
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

			attributes.forEach((facet, j) =>
				utilities.structureFacets(facets, facet, j, attributes, i),
			);
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
		let invalidFilterNames = ["go", "params", "filter"];

		for (let [name, fn] of Object.entries(filters)) {
			if (invalidFilterNames.includes(name)) {
				throw new Error(
					`Invalid filter name. Filter cannot be named "go", "params", or "filter"`,
				);
			} else {
				normalized[name] = fn;
			}
		}

		return normalized;
	}

	_parseModel(model = {}) {
		let { service, entity, table, version = "1" } = model;
		let prefixes = this._makeKeyPrefixes(service, entity, version);
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
		return {
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
