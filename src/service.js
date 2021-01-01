const { Entity } = require("./entity");
const { clauses } = require("./clauses");
const { ElectroInstance, ElectroInstanceTypes, ModelVersions } = require("./types");
const { FilterFactory, FilterTypes } = require("./filters");
const { getInstanceType, getModelVersion, applyBetaModelOverrides } = require("./util");
const v = require("./validations");
const e = require("./errors");

class Service {
	constructor(service = "", config = {}) {
		this.service = {};
		/** start beta/v1 condition **/
		this._modelOverrides = {};
		this._modelVersion = ModelVersions.v1;
		if (v.isObjectHasLength(service)) {
			this._modelVersion = ModelVersions.beta;
			this._modelOverrides = {
				table: service.table,
				service: service.service,
				version: service.version,
			};
			this.service.name = service.name || service.service;
			this.service.table = service.table || config.table;
			this.service.version = service.version;
		} else if (v.isStringHasLength(service)) {
			this._modelVersion = ModelVersions.v1;
			this.service.name = service;
			this.service.table = config.table;
			this._modelOverrides.table = config.table;
		} else {
			throw new e.ElectroError(e.ErrorCodes.InvalidJoin, `Invalid service name: ${JSON.stringify(service)}. Service name must have length greater than zero`);
		}
		/** end beta/v1 condition **/
		this.config = config;
		this.client = config.client;
		this.entities = {};
		this.find = {};
		this.collectionSchema = {};
		this.collections = {};
		this._instance = ElectroInstance.service;
	}

	join(instance = {}, config = {}) {
		let options = { ...config, ...this.config };
		let entity = {};
		let type = getInstanceType(instance);
		/** start beta/v1 condition **/
		let modelVersion = getModelVersion(instance);
		/** end beta/v1 condition **/
		switch(type) {
			case ElectroInstanceTypes.model:
				entity = new Entity(instance, options);
				break;
			case ElectroInstanceTypes.entity:
				entity = instance;
				break;
			default:
				/** start beta/v1 condition **/
				if (modelVersion !== this._modelVersion) {
					throw new e.ElectroError(e.ErrorCodes.InvalidJoin, "Invalid instance: Valid instances to join include Models and Entity instances. Additionally, all models must be in the same format (v1 vs beta). Review https://github.com/tywalch/electrodb#version-v1-migration for more detail.");
				} else if (modelVersion === ModelVersions.beta) {
					instance = applyBetaModelOverrides(instance, this._modelOverrides);
				} else {
					throw new e.ElectroError(e.ErrorCodes.InvalidJoin, `Invalid instance: Valid instances to join include Models and Entity instances.`);
				}
				entity = new Entity(instance, options);
				/** end beta/v1 condition **/
				break;
		}

		let name = entity.model.entity;
		if (this.service.name.toLowerCase() !== entity.model.service.toLowerCase()) {
			throw new Error(`Service name defined on joined instance, ${entity.model.service}, does not match the name of this Service: ${this.service.name}. Verify or update the service name on the Entity/Model to match the name defined on this service.`);
		}

		if (this._getTableName()) {
			entity.table = this._getTableName();
		}

		if (this.service.version) {
			entity.model.version = this.service.version;
		}

		this.entities[name] = entity;
		for (let collection of this.entities[name].model.collections) {
			this._addCollectionEntity(collection, name, this.entities[name]);
			this.collections[collection] = (...facets) => {
				let { entities, attributes, identifiers } = this.collectionSchema[collection];
				return this._makeCollectionChain(collection, attributes, clauses, identifiers, Object.values(entities)[0], ...facets);
			};
		}
		this.find = { ...this.entities, ...this.collections };
		return this;
	}

	cleanseRetrievedData(collection = "", data = {}, config = {}) {
		data.Items = data.Items || [];
		let results = {};
		for (let record of data.Items) {
			let entity = record.__edb_e__;
			if (entity) {
				results[entity] = results[entity] || [];
				results[entity].push(this.collectionSchema[collection].entities[entity].cleanseRetrievedData(record, config));
			}
		}
		return results;
	}

	_getTableName() {
		return this.service.table;
	}

	_setTableName(table) {
		this.service.table = table;
	}

	_makeCollectionChain(name = "", attributes = {}, clauses = {}, identifiers = {}, entity = {}, facets = {}) {
		let filterBuilder = new FilterFactory(attributes, FilterTypes);
		clauses = filterBuilder.injectFilterClauses(clauses);
		return new Proxy(entity.collection(name, clauses, facets, identifiers), {
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

	_validateCollectionDefinition(definition = {}, providedIndex = {}) {
		let indexMatch = definition.index === providedIndex.index;
		let pkFieldMatch = definition.pk.field === providedIndex.pk.field;
		let pkFacetLengthMatch = definition.pk.facets.length === providedIndex.pk.facets.length;
		let pkFacetContentMatch;
		let collectionDifferences = [];
		for (let i = 0; i < definition.pk.facets.length; i++) {
			pkFacetContentMatch = definition.pk.facets[i] === providedIndex.pk.facets[i];
			if (!pkFacetContentMatch) {
				break;
			}
		}
		if (!indexMatch) {
			collectionDifferences.push(
				`Index provided "${providedIndex.index}" does not match established index: ${definition.index || "[Main Table Index]"}`,
			);
		}
		if (!pkFieldMatch) {
			collectionDifferences.push(
				`Partition Key Field provided "${providedIndex.pk.field}" for index "${providedIndex.index}" does not match established field "${definition.pk.field}"`,
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
					`Attribute provided "${name}" with Table Field "${detail.field}" does not match established Table Field "${defined.field}"`,
				);
			}
		}
		return [!!results.invalid.length, results];
	}

	_processEntityAttributes(definition = {}, providedAttributes = {}) {
		let [attributesAreIncompatible, attributeResults] = this._compareEntityAttributes(definition, providedAttributes);
		if (attributesAreIncompatible) {
			throw new e.ElectroError(e.ErrorCodes.InvalidJoin, `Invalid entity attributes. The following attributes have already been defined on this model but with incompatible or conflicting properties: ${attributeResults.invalid.join(", ")}`);
		} else {
			return {
				...definition,
				...attributeResults.additions,
			};
		}
	}

	_processEntityKeys(definition = {}, providedIndex = {}) {
		if (!Object.keys(definition).length) {
			definition = {
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
		}
			let [invalidDefinition, invalidIndexMessages] = this._validateCollectionDefinition(definition, providedIndex);
			if (invalidDefinition) {
				throw new e.ElectroError(e.ErrorCodes.InvalidJoin, `Invalid entity index definitions. The following index definitions have already been defined on this model but with incompatible or conflicting properties: ${invalidIndexMessages.join(", ")}`);
			}
		return definition;
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
		this.collectionSchema[collection] = this.collectionSchema[collection] || {
			entities: {},
			keys: {},
			attributes: {},
			identifiers: {
				names: {},
				values: {},
				expression: ""
			}
		};
		if (this.collectionSchema[collection].entities[name] !== undefined) {
			throw new e.ElectroError(e.ErrorCodes.InvalidJoin, `Entity with name ${name} has already been joined to this service.`);
		}
		this.collectionSchema[collection].keys = this._processEntityKeys(this.collectionSchema[collection].keys, providedIndex);
		this.collectionSchema[collection].attributes = this._processEntityAttributes(this.collectionSchema[collection].attributes, entity.model.schema.attributes);
		this.collectionSchema[collection].entities[name] = entity;
		this.collectionSchema[collection].identifiers = this._processEntityIdentifiers(this.collectionSchema[collection].identifiers, entity.getIdentifierExpressions());
	}

	_processEntityIdentifiers(existing = {}, {names, values, expression} = {}) {
		let identifiers = {};
		if (names) {
			identifiers.names = Object.assign({}, existing.names, names);
		}
		if (values) {
			identifiers.values = Object.assign({}, existing.values, values);
		}
		if (expression) {
			identifiers.expression = [existing.expression, expression].filter(Boolean).join(" OR ");
		}
		return identifiers;
	}
}

module.exports = { Service };
