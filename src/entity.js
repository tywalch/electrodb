"use strict";
const { Schema, Attribute } = require("./schema");
const { KeyTypes, QueryTypes, MethodTypes } = require("./types");
// const { clauses } = require("./clauses");

const comparisons = {
	gte: ">=",
	gt: ">",
	lte: "<=",
	lt: "<",
};

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

let queryChildren = [
	"get",
	"delete",
	"update",
	"eq",
	"gt",
	"lt",
	"gte",
	"lte",
	"between",
	"params",
	"go",
];

let updateChildren = ["set", "params", "go"];

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
			let queryFacets = entity._buildQueryFacets(facets, state.query.facets.sk);
				state.query.keys.sk.push({
					type: state.query.type,
					facets: queryFacets
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
				let queryFacets = entity._buildQueryFacets(facets, state.query.facets.sk);
				state.query.keys.sk.push({
					type: state.query.type,
					facets: queryFacets
				});
			}
			return state;
		},
		children: ["params", "go"],
	},
	put: {
		action(entity, state = {}, payload = {}) {
			let record = entity.model.schema.checkCreate({...payload});
			state.query.keys.pk = entity._expectFacets(record, state.query.facets.pk);
			state.query.method = MethodTypes.put;
			state.query.type = QueryTypes.eq;
			if (state.hasSortKey) {
			let queryFacets = entity._buildQueryFacets(record, state.query.facets.sk);
				state.query.keys.sk.push({
					type: state.query.type,
					facets: queryFacets
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
				let queryFacets = entity._buildQueryFacets(facets, state.query.facets.sk);
				state.query.keys.sk.push({
					type: state.query.type,
					facets: queryFacets
				});
			}
			return state;
		},
		children: ["set"],
	},
	set: {
		action(entity, state = {}, data) {
			let record = entity.model.schema.checkUpdate({...data});
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
			entity._expectFacets(facets, Object.keys(facets), `"query" facets`);
			state.query.method = MethodTypes.query;
			state.query.type = QueryTypes.begins;
			let queryFacets = entity._buildQueryFacets(facets, state.query.facets.sk);
			state.query.keys.sk.push({
				type: state.query.type,
				facets: queryFacets
			});
			return state;
		},
		children: ["between", "gte", "gt", "lte", "lt"],
	},
	between: {
		action(entity, state = {}, startingFacets = {}, endingFacets = {}) {
			entity._expectFacets(startingFacets, Object.keys(startingFacets), `"between" facets`);
			entity._expectFacets(endingFacets, Object.keys(endingFacets), `"and" facets`);
			state.query.type = QueryTypes.between;
			let queryEndingFacets = entity._buildQueryFacets(endingFacets, state.query.facets.sk);
			let queryStartingFacets = entity._buildQueryFacets(startingFacets, state.query.facets.sk);
			state.query.keys.sk.push({
				type: QueryTypes.and,
				facets: queryEndingFacets
			});
			state.query.keys.sk.push({
				type: QueryTypes.between,
				facets: queryStartingFacets
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
				facets: queryFacets
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
				facets: queryFacets
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
				facets: queryFacets
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
				facets: queryFacets
			});
			return state;
		},
		children: ["go", "params"],
	},
	params: {
		action(entity, state = {}, options) {
			if (state.query.method === MethodTypes.query) {
				return entity._queryParams(state, options);
			} else {
				return entity._params(state.query, options);
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
	constructor(model, client) {
		this._validateModel(model);
		this.client = client;
		this.model = this._parseModel(model);
		this.query = {};
		this.find = (facets = {}) => {
			let index = this._findBestIndexKeyMatch(facets);
			return new QueryChain(this, clauses)
				.make(index, this.model.facets.byIndex[index])
				.query(facets);
		};
		for (let accessPattern in this.model.indexes) {
			let index = this.model.indexes[accessPattern];
			this.query[accessPattern] = (...values) => this._makeChain(index, clauses, clauses.index).query(...values);
		}
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
				facets: {...facets},
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
			},
			hasSortKey: this.model.lookup.indexHasSortKeys[index],
			indexComplete: false,
		}
		return this._chain(state, clauses, rootClause);
	}

	_go() {}

	_params(chainState = {}) {
		// let {
		// 	index = "",
		// 	method = "",
		// 	type = "",
		// 	pk = {},
		// 	sks = [],
		// 	data = {},
		// } = chainState;
		
		
		switch (chainState.method) {
			case MethodTypes.get:
				return this._makeGetParams(chainState.keys.pk, ...chainState.keys.sk);
			case MethodTypes.delete:
				return this._makeDeleteParams(chainState.keys.pk, ...chainState.keys.sk);
			case MethodTypes.put:
				return this._makeUpdateParams(chainState.keys.pk, chainState.keys.sk, chainState.update);
			case MethodTypes.update:
				return 
				break;
			// case MethodTypes.scan:
			// case MethodTypes.query:
			// 	return this._queryParams(chainResults);
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

	_makeGetParams(pk, sk) {
		let index = "";
		let params = {
			TableName: this.model.table,
			Key: this._makeParameterKey("", pk, sk),
		};
		return params;
	}

	_makeDeleteParams(pk, sk) {
		let params = {
			TableName: this.model.table,
			Key: this._makeParameterKey("", pk, sk),
		};
		return params;
	}

	_makeUpdateParams(pk = [], sk = [], data = {}) {
		let index = "";
		let indexFacets = this.model.facets.byIndex[index];
		let keyAttributes = {};
		for (let i = 0; i < pk.length; i++) {
			let {name, type} = indexFacets.all[i] || {};
			if (type === KeyTypes.pk) {
				pkAttributes[name] = pk[i];
			} else {
				break;
			}
		}
		// let translatedAttributes = this.model.schema.translateToFields({...pkAttributes, ...data.set});

		// let [isIncomplete, {incomplete, complete}] = this._getIndexImpact({...pkAttributes, ...data.set});
		// if (isIncomplete) {
		// 	throw new Error("")
		// }
		let composedKeys = this._makeKeysFromAttributes({...pkAttributes, ...data.set});
		return composedKeys;
		// let item = {
		// 	...translatedAttributes,
		// 	...composedKeys,
		// };
		// let {
		// 	UpdateExpression,
		// 	ExpressionAttributeNames,
		// 	ExpressionAttributeValues,
		// } = this._updateExpressionBuilder(item);
		// let params = {
		// 	UpdateExpression,
		// 	ExpressionAttributeNames,
		// 	ExpressionAttributeValues,
		// 	TableName: this.schema.table,
		// 	Key: this._makeParamKeys(pk, ...sk),
		// };
		// return params;
	}

	_queryParams(chainResults) {
		let {
			index = "",
			method = "",
			type = "",
			pk = {},
			sks = [],
			data = {},
			options = {},
		} = chainResults;

		switch (type) {
			case QueryTypes.begins:
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

	_makeKeysFromAttributes(attributes = {}) {
		let [isIncomplete, {incomplete, complete}] = this._getIndexImpact(attributes);
		let incompleteFacets = this._getUniqueIndexImpact(incomplete);
		let incompleteAccessPatterns = incomplete.map(({index}) => this.model.translations.indexes.fromIndexToAccessPattern[index])
		if (isIncomplete) {
			throw new Error(`Incomplete facets: Without the facets ${incompleteFacets.join(", ")} the following access patterns ${incompleteAccessPatterns.join(", ")} cannot be updated`);
		}
		let indexKeys = {}
		for (let index of Object.values(this.model.translations.fromIndexToAccessPattern)) {
			indexKeys[index] = this._makeIndexKeys(index, complete, complete)
		}
		return indexKeys;
	}

	_getIndexImpact(attributes = {}) {
		let impactedIndexes = {};
		let facets = {};
		for (let [attribute, indexes] of Object.entries(this.model.facets.byAttr)) {
			if (attributes[attribute]) {
				facets[attribute] = attributes[attribute];
				indexes.forEach(({index, type}) => {
					impactedIndexes[index] = impactedIndexes[index] || {}
					impactedIndexes[index][type] = impactedIndexes[index][type] || [];
					impactedIndexes[index][type].push(attribute);
				});
			}
		}
		let incomplete = Object.entries(this.model.facets.byIndex).map(([index, {pk, sk}]) => {
			let impacted = impactedIndexes[index];
			if (impacted) {
				let impact;
				if (impacted[KeyTypes.sk] && impacted[KeyTypes.sk].length !== sk.length) {
					impact = impact || {index, missing: []};
					impact.missing = [...impact.missing, ...sk.filter(attr => !impacted[KeyTypes.sk].includes(attr))];
				}
				if (impacted[KeyTypes.pk] && impacted[KeyTypes.pk].length !== pk.length) {
					impact = impact || {index, missing: []};
					impact.missing = [...impact.missing, ...pk.filter(attr => !impacted[KeyTypes.pk].includes(attr))];
				}
				return impact;
			}
		})
		.filter(Boolean)
		.reduce((result, {missing}) => [...result, ...missing], [])
		let isIncomplete = !!incomplete.length;
		return [isIncomplete, {incomplete, complete: facets}];
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

	_buildQueryFacets(facets, skFacets) {
		let queryFacets = this._findProperties(facets, skFacets).reduce(
			(result, [name, value]) => {
				result[name] = value;
				return result;
			},
			{},
		);
		return { ...queryFacets }
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
				// todo: I'm thinking this should build an object not push unnamed values to an array?
				// todo: In the _makeUpdateParams function i'm a little too far removed now from the ACTUAL property something is and have to summize it's property from the order. Less than ideal :( 
				matching.push(value);
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
		for (let skFacet of skFacets) {
			sk.push(this._makeKey(this.model.prefixes.sk, facets.sk, skFacet));
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
		return key;
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
				compose: [...index.pk.compose],
			};
			let sk = {};

			if (hasSk) {
				sk = {
					accessPattern,
					index: indexName,
					type: KeyTypes.sk,
					field: index.sk.field || "",
					compose: [...index.sk.compose],
				};
				facets.fields.push(sk.field);
			}

			let definition = {
				pk,
				sk,
				index: indexName,
			};

			let attributes = [
				...pk.compose.map(name => ({
					name,
					index: indexName,
					type: KeyTypes.pk,
				})),
				...(sk.compose || []).map(name => ({
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
				pk: pk.compose,
				sk: sk.compose,
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

		return {
			service,
			version,
			entity,
			table,
			schema,
			indexes,
			facets,
			prefixes,
			// enum: {
			// 	attributes: {
			// 		...enums,
			// 	},
			// 	keys: facets.fields,
			// },
			lookup: {
				indexHasSortKeys,
			},
			translations: {
				comparisons,
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
};
