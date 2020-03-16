"use strict";
const { Schema, Attribute } = require("./schema");
const { KeyTypes, QueryTypes, MethodTypes } = require("./types");
const { QueryChain, clauses } = require("./clauses");

const comparisons = {
	gte: ">=",
	gt: ">",
	lte: "<=",
	lt: "<",
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
		this.query = (facets = {}) => {
			let index = this._findBestIndexKeyMatch(facets);
			return new QueryChain(this, clauses)
				.make(index, this.model.facets.byIndex[index])
				.query(facets);
		};
		for (let accessPattern in this.model.indexes) {
			let index = this.model.indexes[accessPattern];
			this.query[accessPattern] = new QueryChain(this, clauses).make(
				index,
				this.model.facets.byIndex[index],
			);
		}
	}

	_validateModel(model = {}) {}

	get(facets = {}) {
		let index = "";
		return new QueryChain(this, clauses)
			.make(index, this.model.facets.byIndex[index])
			.get(facets);
	}

	delete(facets = {}) {}

	put(attributes = {}) {}

	update(facets = {}, payload) {}

	query(facets = {}) {}

	_go() {}

	_params(chainResults = {}) {
		let {
			index = "",
			method = "",
			type = "",
			pk = {},
			sks = [],
			data = {},
			options = {},
		} = chainResults;

		switch (method) {
			case MethodTypes.get:
				return this._makeGetParams(pk, sks, options);
			case MethodTypes.delete:
				break;
			case MethodTypes.put:
				break;
			case MethodTypes.update:
				break;
			case MethodTypes.scan:
			case MethodTypes.query:
				return this._queryParams(chainResults);
			default:
				throw new Error(`Invalid method: ${method}`);
		}
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

	_makeGetParams(pk, sk) {
		let params = {
			TableName: this.model.table,
			Key: this._makeParameterKey(pk, sk),
		};
		return params;
	}

	_makeDeleteParams(pk, sk) {
		let params = {
			TableName: this.model.table,
			Key: this._makeParameterKey(pk, sk),
		};
		return params;
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
