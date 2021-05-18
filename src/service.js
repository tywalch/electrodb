const { Entity } = require("./entity");
const { clauses } = require("./clauses");
const { ElectroInstance, ElectroInstanceTypes, ModelVersions } = require("./types");
const { FilterFactory, FilterTypes } = require("./filters");
const { WhereFactory } = require("./where");
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

		let name = hasAlias ? alias : entity.getName();

		if (this.service.name.toLowerCase() !== entity.model.service.toLowerCase()) {
			throw new Error(`Service name defined on joined instance, ${entity.model.service}, does not match the name of this Service: ${this.service.name}. Verify or update the service name on the Entity/Model to match the name defined on this service.`);
		}

		if (this._getTableName()) {
			entity._setTableName(this._getTableName());
		}

		if (options.client) {
			entity._setClient(options.client);
		}

		if (this._modelVersion === ModelVersions.beta && this.service.version) {
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
	 * done: test matching entities with custom model identifiers
	 * done: test matching entities with custom version identifiers
	 * done: test matching entities with aliases
	 * done: test setClient on entity
	 * done: test entities with different tables on entities
	 * done: test entities with different clients on entities
	 * done: test config combinations services/entities
	 * done: don't over query entity versions
	 * done: services require extra parens for entity wheres?
	 * todo: tests for params query option for all query methods?
	 * todo: readme write up on applying table to v1Map constructors
	 * done: test applying attribute properties when doing collection query
	 * todo: make complete query option test suite
	 */
	cleanseRetrievedData(collection = "", entities, data = {}, config = {}) {
		if (config.raw) {
			return data;
		}
		data.Items = data.Items || [];
		let results = {};
		let entityIdentifiers = [];
		for (let alias of Object.keys(entities)) {
			let entity = entities[alias];
			let name = entity.model.entity;
			let version = entity.model.version;
			results[alias] = [];
			entityIdentifiers.push({
				name,
				alias,
				version,
				nameIdentifier: entity.identifiers.entity,
				versionIdentifier: entity.identifiers.version
			});
		}
		for (let record of data.Items) {
			let entityAlias;
			for (let {name, version, nameIdentifier, versionIdentifier, alias} of entityIdentifiers) {
				if (record[nameIdentifier] !== undefined && record[nameIdentifier] === name && record[versionIdentifier] !== undefined && record[versionIdentifier] === version) {
					entityAlias = alias;
					break;
				}
			}
			if (!entityAlias) {
				continue;
			}
			let index = this.collectionSchema[collection].index;
			results[entityAlias].push(
				this.collectionSchema[collection].entities[entityAlias].formatResponse(index, {Item: record}, config)
			);
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

	_makeCollectionChain(name = "", attributes = {}, clauses = {}, expressions = {}, entities = {}, entity = {}, facets = {}) {
		let filterBuilder = new FilterFactory(attributes, FilterTypes);
		let whereBuilder = new WhereFactory(attributes, FilterTypes);
		clauses = filterBuilder.injectFilterClauses(clauses);
		clauses = whereBuilder.injectWhereClauses(clauses);
		let options = {
			// expressions, // DynamoDB doesnt return what I expect it would when provided with these entity filters
			parse: (options, data) => {
				return this.cleanseRetrievedData(name, entities, data, options);
			}
		}
		return entity.collection(name, clauses, facets, options);
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
				`Partition Key Facets provided "${providedIndex.pk.facets.join(", ")}" do not match established facets "${definition.pk.facets.join(", ")}"`,
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
			},
			index: undefined,
			table: ""
		};
		if (this.collectionSchema[collection].entities[name] !== undefined) {
			throw new e.ElectroError(e.ErrorCodes.InvalidJoin, `Entity with name '${name}' has already been joined to this service.`);
		}

		if (this.collectionSchema[collection].table !== "") {
			if (this.collectionSchema[collection].table !== entity._getTableName()) {
				throw new e.ElectroError(e.ErrorCodes.InvalidJoin, `Entity with name '${name}' is defined to use a different Table than what is defined on other Service Entities and/or the Service itself. Entity '${name}' is defined with table name '${entity._getTableName()}' but the Service has been defined to use table name '${this.collectionSchema[collection].table}'. All Entities in a Service must reference the same DynamoDB table. To ensure all Entities will use the same DynamoDB table, it is possible to apply the property 'table' to the Service constructor's configuration parameter.`);
			}
		} else {
			this.collectionSchema[collection].table = entity._getTableName();
		}

		this.collectionSchema[collection].keys = this._processEntityKeys(this.collectionSchema[collection].keys, providedIndex);
		this.collectionSchema[collection].attributes = this._processEntityAttributes(this.collectionSchema[collection].attributes, entity.model.schema.attributes);
		this.collectionSchema[collection].entities[name] = entity;
		this.collectionSchema[collection].identifiers = this._processEntityIdentifiers(this.collectionSchema[collection].identifiers, entity.getIdentifierExpressions(name));
		this.collectionSchema[collection].index = this._processEntityCollectionIndex(this.collectionSchema[collection].index, providedIndex.index, name, collection);
	}

	_processEntityCollectionIndex(existing, provided, name, collection) {
		if (typeof provided !== "string") {
			throw new e.ElectroError(e.ErrorCodes.InvalidJoin, `Entity with name '${name}' does not have collection ${collection} defined on it's model`);
		} else if (existing === undefined) {
			return provided;
		} else if (provided !== existing) {
			throw new e.ElectroError(e.ErrorCodes.InvalidJoin, `Entity with name '${name}' defines collection ${collection} on index `);
		} else {
			return existing;
		}
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
