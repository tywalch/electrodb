const { Entity } = require("./entity");
const { clauses } = require("./clauses");
const { FilterFactory, FilterTypes } = require("./filters");

class Electro {
	constructor(config = {}) {
		this.service = {
			name: config.service,
			table: config.table,
			version: config.version,
		};
		this.client = config.client;
		this.entities = {};
		this._entityCollections = {};
	}

	import(name = "", model = {}) {
		model.entity = name;
		model.service = this.service.name;
		model.table = this.service.table;
		model.version = this.service.version;
		this.entities[name] = new Entity(model, { client: this.client });
		for (let collection of this.entities[name].model.collections) {
			this._addCollectionEntity(collection, name, this.entities[name]);
		}
		this.collections = new Proxy(this._entityCollections, {
			get: (target, name) => {
				let { entities, keys, attributes } = target[name];
				return (...facets) =>
					this._makeCollectionChain(
						name,
						attributes,
						clauses,
						Object.values(entities)[0],
						...facets,
					);
			},
		});
	}

	_makeCollectionChain(
		name = "",
		attributes = {},
		clauses = {},
		entity = {},
		facets = {},
	) {
		let filterBuilder = new FilterFactory(attributes, FilterTypes);
		clauses = filterBuilder.injectFilterClauses(clauses);
		return new Proxy(entity.collection(name, clauses, facets), {
			get: (target, prop) => {
				if (prop === "go") {
					return (options = {}) => {
						let config = { ...options, raw: true };
						return target[prop](config).then((data) => {
							return this.cleanseRetrievedData(name, data, options);
						});
					};
				} else {
					return target[prop];
				}
			},
		});
	}

	cleanseRetrievedData(collection = "", data = {}, config = {}) {
		data.Items = data.Items || [];
		let results = {};
		for (let record of data.Items) {
			let entity = record.__edb_e__;
			if (entity) {
				results[entity] = results[entity] || [];
				results[entity].push(
					this._entityCollections[collection].entities[
						entity
					].cleanseRetrievedData(record, config),
				);
			} else {
				results.push(record);
			}
		}
		return results;
	}

	_validateCollectionDefinition(definition = {}, providedIndex = {}) {
		let indexMatch = definition.index === providedIndex.index;
		let pkFieldMatch = definition.pk.field === providedIndex.pk.field;
		let pkFacetLengthMatch =
			definition.pk.facets.length === providedIndex.pk.facets.length;
		let pkFacetContentMatch;
		let collectionDifferences = [];
		for (let i = 0; i < definition.pk.facets.length; i++) {
			pkFacetContentMatch =
				definition.pk.facets[i] === providedIndex.pk.facets[i];
			if (!pkFacetContentMatch) {
				break;
			}
		}
		if (!indexMatch) {
			collectionDifferences.push(
				`Index provided "${providedIndex.index}" does not match established index ${definition.index}`,
			);
		}
		if (!pkFieldMatch) {
			collectionDifferences.push(
				`Partition Key Field provided "${providedIndex.pk.field}" for index "${providedIndex.index}" does not match established field ${definition.field}`,
			);
		}
		if (!pkFacetLengthMatch || !pkFacetContentMatch) {
			collectionDifferences.push(
				`Partition Key Facets provided "${providedIndex.pk.facets.join(
					", ",
				)}" do not match established facets "${definition.pk.facets.join(
					", ",
				)}"`,
			);
		}
		return [!!collectionDifferences.length, collectionDifferences];
	}

	_compareEntityAttributes(definition = {}, providedAttributes = {}) {
		let results = {
			additions: {},
			invalid: [],
		};
		for (let [name, detail] of Object.entries(providedAttributes)) {
			let defined = definition[name];
			if (defined === undefined) {
				results.additions[name] = detail;
			} else if (defined.field !== detail.field) {
				results.invalid.push(
					`Attribute provided "${name}" with Table Field "${detail.field}" does not match established Table Field ${provided.field}`,
				);
			}
			return [!!results.invalid.length, results];
		}
	}

	_processEntityAttributes(definition = {}, providedAttributes = {}) {
		let [
			attributesAreIncompatible,
			attributeResults,
		] = this._compareEntityAttributes(definition, providedAttributes);
		if (attributesAreIncompatible) {
			throw new Error(attributeResults.invalid.join(", "));
		} else {
			return {
				...definition,
				...attributeResults.additions,
			};
		}
	}

	_processEntityKeys(definition = {}, providedIndex = {}) {
		let initialDefinition = {};
		if (!Object.keys(definition).length) {
			initialDefinition = {
				index: providedIndex.index || "",
				pk: {
					field: providedIndex.pk.field,
					facets: providedIndex.pk.facets,
				},
				sk: {
					field: providedIndex.sk.field,
					facets: providedIndex.sk.facets,
				},
			};
		} else {
			let [
				invalidDefinition,
				invalidIndexMessages,
			] = this._validateCollectionDefinition(definition, providedIndex);
			if (invalidDefinition) {
				throw new Error(invalidIndexMessages.join(", "));
			}
		}
		return initialDefinition;
	}

	_getEntityIndexFromCollectionName(collection, entity) {
		return Object.values(entity.model.indexes).find(
			(index) => index.collection === collection,
		);
	}

	_addCollectionEntity(collection = "", name = "", entity = {}) {
		let providedIndex = this._getEntityIndexFromCollectionName(
			collection,
			entity,
		);
		this._entityCollections[collection] = this._entityCollections[
			collection
		] || {
			entities: {},
			keys: {},
			attributes: {},
		};
		this._entityCollections[collection].keys = this._processEntityKeys(
			this._entityCollections[collection].keys,
			providedIndex,
		);
		this._entityCollections[
			collection
		].attributes = this._processEntityAttributes(
			this._entityCollections[collection].attributes,
			entity.model.schema.attributes,
		);
		this._entityCollections[collection].entities[name] = entity;
	}
}

module.exports = { Electro };
