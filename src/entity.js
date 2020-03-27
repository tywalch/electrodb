"use strict";
const { Schema } = require("./schema");
const { KeyTypes, QueryTypes, MethodTypes, Comparisons } = require("./types");
const { FilterFactory, FilterTypes } = require("./filters");

let clauses = {
	index: {
		action(entity, state = {}, facets = {}) {
			// todo: maybe all key info is passed on the subsequent query identifiers?
			// todo: look for article/list of all dynamodb query limitations
			return state;
		},
		children: ["get", "delete", "update", "query", "put"],
	},
	get: {
		action(entity, state = {}, facets = {}) {
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
		children: ["params", "go"],
	},
	delete: {
		action(entity, state = {}, facets = {}) {
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
		children: ["params", "go"],
	},
	put: {
		action(entity, state = {}, payload = {}) {
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
		children: ["params", "go"],
	},
	update: {
		action(entity, state = {}, facets = {}) {
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
		action(entity, state = {}, data) {
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
		action(entity, state = {}, facets = {}) {
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
		children: ["between", "gte", "gt", "lte", "lt", "params", "go"],
	},
	between: {
		action(entity, state = {}, startingFacets = {}, endingFacets = {}) {
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
		action(entity, state = {}, facets = {}) {
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
		action(entity, state = {}, facets = {}) {
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
		action(entity, state = {}, facets = {}) {
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
		action(entity, state = {}, facets = {}) {
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
		action(entity, state = {}, options) {
			if (state.query.method === MethodTypes.query) {
				return entity._queryParams(state.query, options);
			} else {
				return entity._params(state.query, options);
			}
		},
		children: [],
	},
	go: {
		action(entity, state = {}, options) {
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
};

const utilities = {
	structureFacets: function(
		structure,
		{ index, type, name } = {},
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
};

class Entity {
	constructor(model = {}, { client } = {}) {
		this._validateModel(model);
		this.client = client;
		this.model = this._parseModel(model);
		this._filterBuilder = new FilterFactory(
			this.model.schema.attributes,
			FilterTypes,
		);
		this.query = {};
		this.find = (facets = {}) => {
			let index = this._findBestIndexKeyMatch(facets);
			let clausesWithFilters = this._injectFiltersIntoClauses(
				clauses,
				this.model.filters,
			);
			return this._makeChain(index, clausesWithFilters, clauses.index).query(
				facets,
			);
		};
		for (let accessPattern in this.model.indexes) {
			let index = this.model.indexes[accessPattern].index;
			this.query[accessPattern] = (...values) => {
				let clausesWithFilters = this._injectFiltersIntoClauses(
					clauses,
					this.model.filters,
				);
				return this._makeChain(index, clausesWithFilters, clauses.index).query(
					...values,
				);
			};
		}
	}

	_injectFiltersIntoClauses(clauses = {}, filters = {}) {
		let injected = { ...clauses };
		let filterParents = Object.entries(injected)
			.filter(clause => {
				let [name, { children }] = clause;
				return children.includes("go");
			})
			.map(([name]) => name);
		let filterChildren = [];
		for (let [name, filter] of Object.entries(filters)) {
			filterChildren.push(name);
			injected[name] = {
				action: this._filterBuilder.buildClause(filter),
				children: ["params", "go"],
			};
		}
		filterChildren.push("filter");
		injected["filter"] = {
			action: (entity, state, fn) => {
				return this._filterBuilder.buildClause(fn)(entity, state);
			},
			children: ["params", "go"],
		};
		for (let parent of filterParents) {
			injected[parent] = { ...injected[parent] };
			injected[parent].children = [
				...filterChildren,
				...injected[parent].children,
			];
		}
		return injected;
	}

	_validateModel(model = {}) {}

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

	_makeChain(index = "", clauses, rootClause) {
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
			hasSortKey: this.model.lookup.indexHasSortKeys[index],
			indexComplete: false,
		};
		return this._chain(state, clauses, rootClause);
	}

	_cleanseRetrievedData(item = {}, options = {}) {
		let { includeKeys } = options;
		let data = {};
		let names = this.model.schema.translationForRetrieval;
		for (let [attr, value] of Object.entries(item)) {
			let name = names[attr];
			if (name) {
				data[name] = value;
			} else if (includeKeys) {
				data[attr] = value;
			} else {
				// an index key
			}
		}
		return data;
	}

	async go(method, params = {}, options = {}) {
		let config = {
			includeKeys: options.includeKeys,
			originalErr: options.originalErr,
			raw: options.raw,
		};

		let stackTrace = new Error();
		try {
			let response = await this.client[method](params).promise();

			if (config.raw) {
				return response;
			}

			let data = {};
			if (method === "put") {
				data = this._cleanseRetrievedData(params.Item, config);
			} else if (response.Item) {
				data = this._cleanseRetrievedData(response.Item);
			} else if (response.Items) {
				data = response.Items.map(item =>
					this._cleanseRetrievedData(item, config),
				);
			}
			return data;
		} catch (err) {
			if (config.originalErr) {
				return Promise.reject(err);
			} else {
				stackTrace.message = err.message;
				return Promise.reject(stackTrace);
			}
		}
	}

	_params(chainState = {}) {
		let conlidatedQueryFacets = this._consolidateQueryFacets(
			chainState.keys.sk,
		);

		switch (chainState.method) {
			case MethodTypes.get:
			case MethodTypes.delete:
				return this._makeSimpleIndexParams(
					chainState.keys.pk,
					...conlidatedQueryFacets,
				);
			case MethodTypes.put:
				return this._makePutParams(
					chainState.put,
					chainState.keys.pk,
					...chainState.keys.sk,
				);
			case MethodTypes.update:
				return this._makeUpdateParams(
					chainState.update,
					chainState.keys.pk,
					...conlidatedQueryFacets,
				);
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

	_makeSimpleIndexParams(pk, sk) {
		let index = "";

		let keys = this._makeIndexKeys(index, pk, sk);
		let params = {
			TableName: this.model.table,
			Key: this._makeParameterKey(index, keys.pk, ...keys.sk),
		};
		return params;
	}

	_makeUpdateParams({ set } = {}, pk = {}, sk = {}) {
		let { indexKey, updatedKeys } = this._getUpdatedKeys(pk, sk, set);
		let translatedAttributes = this.model.schema.translateToFields(set);
		let item = {
			...translatedAttributes,
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
		let { updatedKeys } = this._getUpdatedKeys(pk, sk, data);
		let translatedAttributes = this.model.schema.translateToFields(data);
		let params = {
			Item: {
				...translatedAttributes,
				...updatedKeys,
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

	_queryKeyExpressionAttributeBuilder(index, pk, ...sks) {
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
			let missing = require.filter(prop => !props.includes(prop));
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

	_queryParams(chainState) {
		let conlidatedQueryFacets = this._consolidateQueryFacets(
			chainState.keys.sk,
		);
		let { pk, sk } = this._makeIndexKeys(
			chainState.index,
			chainState.keys.pk,
			...conlidatedQueryFacets,
		);
		switch (chainState.type) {
			case QueryTypes.begins:
				return this._makeBeginsWithQueryParams(
					chainState.index,
					chainState.filter,
					pk,
					...sk,
				);
			case QueryTypes.between:
				return this._makeBetweenQueryParams(
					chainState.index,
					chainState.filter,
					pk,
					...sk,
				);
			case QueryTypes.gte:
			case QueryTypes.gt:
			case QueryTypes.lte:
			case QueryTypes.lt:
				return this._makeComparisonQueryParams(
					chainState.index,
					chainState.type,
					chainState.filter,
					pk,
					...sk,
				);
			default:
				throw new Error(`Invalid method: ${method}`);
		}
	}

	_makeBetweenQueryParams(index = "", filter = {}, pk = {}, ...sk) {
		let keyExpressions = this._queryKeyExpressionAttributeBuilder(
			index,
			pk,
			...sk,
		);
		delete keyExpressions.ExpressionAttributeNames["#sk2"];
		let params = {
			IndexName: index,
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
			IndexName: index,
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
			IndexName: index,
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
		if (filter.FilterExpression) {
			params.FilterExpression = filter.FilterExpression;
		}
		return params;
	}

	_expectIndexFacets(attributes = {}) {
		let [isIncomplete, { incomplete, complete }] = this._getIndexImpact(
			attributes,
		);
		let incompleteAccessPatterns = incomplete.map(
			({ index }) =>
				this.model.translations.indexes.fromIndexToAccessPattern[index],
		);
		if (isIncomplete) {
			throw new Error(
				`Incomplete facets: Without the facets ${incomplete.join(
					", ",
				)} the following access patterns ${incompleteAccessPatterns.join(
					", ",
				)} cannot be updated`,
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
		let completeFacets = this._expectIndexFacets({
			...keyAttributes,
			...set,
		});
		let composedKeys = this._makeKeysFromAttributes(completeFacets.indexes, {
			...completeFacets.facets,
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

	_getIndexImpact(attributes = {}) {
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
				if (impacted) {
					let impact;
					let missingPk =
						impacted[KeyTypes.pk] && impacted[KeyTypes.pk].length !== pk.length;
					let missingSk =
						impacted[KeyTypes.sk] && impacted[KeyTypes.sk].length !== sk.length;
					if (missingPk) {
						impact = impact || { index, missing: [] };
						impact.missing = [
							...impact.missing,
							...pk.filter(attr => !impacted[KeyTypes.pk].includes(attr)),
						];
					}
					if (missingSk) {
						impact = impact || { index, missing: [] };
						impact.missing = [
							...impact.missing,
							...sk.filter(attr => !impacted[KeyTypes.sk].includes(attr)),
						];
					}
					if (!missingPk && !missingSk) {
						completedIndexes.push(index);
					}
					return impact;
				}
			})
			.filter(Boolean)
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
		return properties.map(name => [name, obj[name]]);
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

	_makeIndexKeys(index = "", pkFacets = {}, ...skFacets) {
		this._validateIndex(index);
		let facets = this.model.facets.byIndex[index];
		let pk = this._makeKey(this.model.prefixes.pk, facets.pk, pkFacets);
		let sk = [];
		if (this.model.lookup.indexHasSortKeys[index]) {
			for (let skFacet of skFacets) {
				sk.push(this._makeKey(this.model.prefixes.sk, facets.sk, skFacet));
			}
		}
		return { pk, sk };
	}

	_makeKey(prefix = "", facets = [], supplied = {}) {
		let key = prefix;
		for (let i = 0; i < facets.length; i++) {
			let facet = facets[i];
			let { label, name } = this.model.schema.attributes[facet];
			key = `${key}#${label || name}_`;
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

	_normalizeIndexes(indexes = {}) {
		let normalized = {};
		let indexFieldTranslation = {};
		let indexHasSortKeys = {};
		let indexAccessPatternTransaction = {
			fromAccessPatternToIndex: {},
			fromIndexToAccessPattern: {},
		};

		let facets = {
			byIndex: {},
			byFacet: {},
			byAttr: {},
			byType: {},
			bySlot: [],
			fields: [],
			attributes: [],
		};

		let accessPatterns = Object.keys(indexes);

		for (let i in accessPatterns) {
			let accessPattern = accessPatterns[i];
			let index = indexes[accessPattern];
			let indexName = index.index || "";
			let hasSk = !!index.sk;
			indexHasSortKeys[indexName] = hasSk;
			let pk = {
				accessPattern,
				index: indexName,
				type: KeyTypes.pk,
				field: index.pk.field || "",
				facets: [...index.pk.facets],
			};
			let sk = {};

			if (hasSk) {
				sk = {
					accessPattern,
					index: indexName,
					type: KeyTypes.sk,
					field: index.sk.field || "",
					facets: [...index.sk.facets],
				};
				facets.fields.push(sk.field);
			}

			let definition = {
				pk,
				sk,
				index: indexName,
			};

			let attributes = [
				...pk.facets.map(name => ({
					name,
					index: indexName,
					type: KeyTypes.pk,
				})),
				...(sk.facets || []).map(name => ({
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
				pk: pk.facets,
				sk: sk.facets,
				all: attributes,
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
		};
	}

	_parseModel(model = {}) {
		let { service, entity, table, version = "1" } = model;
		let prefixes = this._makeKeyPrefixes(service, entity, version);
		let {
			facets,
			indexes,
			indexField,
			indexHasSortKeys,
			indexAccessPattern,
		} = this._normalizeIndexes(model.indexes);
		let schema = new Schema(model.attributes, facets);
		let filters = model.filters || {};
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
			lookup: {
				indexHasSortKeys,
			},
			translations: {
				keys: indexField,
				indexes: indexAccessPattern,
			},

			original: model,
		};
	}
}

// class AccessPattern {
// 	constructor(name = "", definition = {}) {
// 		this._validateIndex(definition);
// 		this.name = name;
// 		this.index = definition.index;
// 	}

// 	_validateIndex() {}
// }

module.exports = {
	Entity,
	clauses,
};
