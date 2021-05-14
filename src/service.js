const { Entity } = require("./entity");
const { clauses } = require("./clauses");
const { ElectroInstance, ElectroInstanceTypes, ModelVersions } = require("./types");
const { FilterFactory, FilterTypes } = require("./filters");
const { getInstanceType, getModelVersion, applyBetaModelOverrides } = require("./util");
const v = require("./validations");
const e = require("./errors");

const ConstructorTypes = {
	beta: "beta",
	v1: "v1",
	v1Map: "v1Map",
	unknown: "unknown"
}

function inferConstructorType(service) {
	if (v.isNameEntityRecordType(service) || v.isNameModelRecordType(service)) {
		return ConstructorTypes.v1Map;
	} else if (v.isBetaServiceConfig(service)) {
		return ConstructorTypes.beta;
	} else if (v.isStringHasLength(service)) {
		return ConstructorTypes.v1;
	} else {
		return ConstructorTypes.unknown;
	}
}

function inferJoinValues(alias, instance, config) {
	let hasAlias = true;
	let args = {alias, instance, config, hasAlias};
	if (typeof alias !== "string") {
		args.config = instance;
		args.instance = alias;
		args.hasAlias = false;
	}
	return args;
}

class Service {
	_betaConstructor(service, config) {
		this.service = {};
		this._modelOverrides = {};

		// Unique to Beta
		this._modelVersion = ModelVersions.beta;
		this._modelOverrides = {
			table: service.table,
			service: service.service,
			version: service.version,
		};
		this.service.name = service.name || service.service;
		this.service.table = service.table || config.table;
		this.service.version = service.version;
		// Unique to Beta

		this.config = config;
		this.client = config.client;
		this.entities = {};
		this.find = {};
		this.collectionSchema = {};
		this.collections = {};
		this._instance = ElectroInstance.service;
		this._instanceType = ElectroInstanceTypes.service;
	}

	_v1Constructor(service, config) {
		this.service = {};
		this._modelOverrides = {};

		// Unique to V1
		this._modelVersion = ModelVersions.v1;
		this.service.name = service;
		this.service.table = config.table;
		this._modelOverrides.table = config.table;
		// Unique to V1

		this.config = config;
		this.client = config.client;
		this.entities = {};
		this.find = {};
		this.collectionSchema = {};
		this.collections = {};
		this._instance = ElectroInstance.service;
		this._instanceType = ElectroInstanceTypes.service;
	}

	_v1MapConstructor(service, config) {
		let entityNames = Object.keys(service);
		let serviceName = this._inferServiceNameFromEntityMap(service);
		this._v1Constructor(serviceName, config);
		for (let name of entityNames) {
			let entity = service[name];
			this.join(name, entity, config);
		}
	}

	constructor(service = "", config = {}) {
		let type = inferConstructorType(service);
		switch(type) {
			case ConstructorTypes.v1Map:
				this._v1MapConstructor(service, config);
				break;
			case ConstructorTypes.beta:
				this._betaConstructor(service, config);
				break;
			case ConstructorTypes.v1:
				this._v1Constructor(service, config);
				break;
			default:
				throw new e.ElectroError(e.ErrorCodes.InvalidJoin, `Invalid service name: ${JSON.stringify(service)}. Service name must have length greater than zero`);
		}
	}

	_inferServiceNameFromEntityMap(service) {
		let names = Object.keys(service);
		let entity = names
			.map(name => service[name])
			.map(instance => this._inferJoinEntity(instance))
			.find(entity => entity && entity.model && entity.model.service)

		if (!entity || !entity.model || !entity.model.service) {
			throw new e.ElectroError(e.ErrorCodes.InvalidJoin, `Invalid service name: Entities/Models provided do not contain property for Service Name`);
		}

		return entity.model.service;
	}

	_inferJoinEntity(instance, options) {
		let entity = {};
		let type = getInstanceType(instance);
		let modelVersion = getModelVersion(instance);
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
		return entity;
	}

	/**
	 * Join
	 * @param {string} alias
	 * @param instance
	 * @param config
	 * @returns {Service}
	 */
	join(...args) {
		let {alias, instance, config, hasAlias} = inferJoinValues(...args);
		let options = { ...config, ...this.config };

		let entity = this._inferJoinEntity(instance, options);
		let name = hasAlias ? alias : entity.model.entity;

		if (this.service.name.toLowerCase() !== entity.model.service.toLowerCase()) {
			throw new Error(`Service name defined on joined instance, ${entity.model.service}, does not match the name of this Service: ${this.service.name}. Verify or update the service name on the Entity/Model to match the name defined on this service.`);
		}

		if (this._getTableName()) {
			entity._setTableName(this._getTableName());
		}

		if (options.client) {
			entity._setClient(options.client);
		}

		if (this.service.version) {
			entity.model.version = this.service.version;
		}

		this.entities[name] = entity;
		for (let collection of this.entities[name].model.collections) {
			this._addCollectionEntity(collection, name, this.entities[name]);
			this.collections[collection] = (...facets) => {
				let { entities, attributes, identifiers } = this.collectionSchema[collection];
				return this._makeCollectionChain(collection, attributes, clauses, identifiers, entities, Object.values(entities)[0], ...facets);
			};
		}
		this.find = { ...this.entities, ...this.collections };
		return this;
	}

	/**
	 * todo: test entities with custom model identifiers
	 * todo: test entities with custom version identifiers
	 * todo: test for entities with aliases
	 * todo: test setClient on entity
	 * todo: test entities with different tables on entities
	 * todo: test entities with different clients on entities
	 * todo: test config combinations services/entities
	 */
	cleanseRetrievedData(collection = "", entities, data = {}, config = {}) {
		data.Items = data.Items || [];
		let results = {};
		let entityAliasMap = {};
		let entityIdentifiers = [];
		for (let alias of Object.keys(entities)) {
			results[alias] = [];
			let name = entities[alias].model.entity;
			entityIdentifiers.push({name, identifier: entities[alias].identifiers.entity});
			entityAliasMap[name] = alias;
		}
		for (let record of data.Items) {
			let match = entityIdentifiers.find(({name, identifier}) => {
				return record[identifier] === name
			});
			if (!match) {
				continue;
			}
			let entity = record[match.identifier];
			let alias = entityAliasMap[entity];
			if (!alias) {
				continue;
			}
			results[alias] = results[alias] || [];
			results[alias].push(this.collectionSchema[collection].entities[alias].cleanseRetrievedData(record, config));
		}
		return results;
	}

	_getTableName() {
		return this.service.table;
	}

	_setTableName(table) {
		this.service.table = table;
		for (let entity of Object.values(this.entities)) {
			entity._setTableName(table);
		}
	}

	_makeCollectionChain(name = "", attributes = {}, clauses = {}, identifiers = {}, entities = {}, entity = {}, facets = {}) {
		let filterBuilder = new FilterFactory(attributes, FilterTypes);
		clauses = filterBuilder.injectFilterClauses(clauses);
		return new Proxy(entity.collection(name, clauses, facets, identifiers), {
			get: (target, prop) => {
				if (prop === "go") {
					return (options = {}) => {
						let config = { ...options, raw: true };
						return target[prop](config).then((data) => {
							return this.cleanseRetrievedData(name, entities, data, options);
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
