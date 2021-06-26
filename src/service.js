const { Entity } = require("./entity");
const { clauses } = require("./clauses");
const { Pager, ElectroInstance, ElectroInstanceTypes, ModelVersions } = require("./types");
const { FilterFactory, FilterTypes } = require("./filters");
const { WhereFactory } = require("./where");
const { getInstanceType, getModelVersion, applyBetaModelOverrides } = require("./util");
const v = require("./validations");
const e = require("./errors");
const u = require("./util");

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
		this.service.table = service.table;
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
			throw new e.ElectroError(e.ErrorCodes.InvalidJoin, `Service name defined on joined instance, ${entity.model.service}, does not match the name of this Service: ${this.service.name}. Verify or update the service name on the Entity/Model to match the name defined on this service.`);
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

	_setClient(client) {
		if (client !== undefined) {
			for (let entity of Object.values(this.entities)) {
				entity._setClient(client);
			}
		}
	}

	_getEntityIdentifiers(entities) {
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

	cleanseRetrievedData(collection = "", entities, data = {}, config = {}) {
		if (config.raw) {
			if (config._isPagination) {
				return [data.LastEvaluatedKey, data];
			} else {
				return data;
			}
		}

		data.Items = data.Items || [];
		let index = this.collectionSchema[collection].index;
		let results = {};
		let identifiers = this._getEntityIdentifiers(entities);
		for (let {alias} of identifiers) {
			results[alias] = [];
		}
		for (let record of data.Items) {
			let entityAlias;
			for (let {name, version, nameField, versionField, alias} of identifiers) {
				if (record[nameField] !== undefined && record[nameField] === name && record[versionField] !== undefined && record[versionField] === version) {
					entityAlias = alias;
					break;
				}
			}
			if (!entityAlias) {
				continue;
			}

			// pager=false because we don't want the entity trying to parse the lastEvaluatedKey
			let items = this.collectionSchema[collection].entities[entityAlias].formatResponse(index, {Item: record}, {...config, pager: false});
			results[entityAlias].push(items);
		}

		if (config._isPagination) {
			let page = this._formatReturnPager(config, index, data.LastEvaluatedKey, data.Items[data.Items.length - 1]);
			return [page, results];
		} else {
			return results;
		}
	}

	findKeyOwner(lastEvaluatedKey) {
		return Object.values(this.entities)
			.find((entity) => entity.ownsLastEvaluatedKey(lastEvaluatedKey));
	}

	findItemPagerOwner(collection, pager = {}) {
		if (this.collectionSchema[collection] === undefined) {
			throw new Error("Invalid collection")
		}
		let matchingEntities = [];
		if (pager === null) {
			return matchingEntities;
		}
		for (let entity of Object.values(this.collectionSchema[collection].entities)) {
			if (entity.ownsPager(this.collectionSchema[collection].index, pager)) {
				matchingEntities.push(entity);
			}
		}
		return matchingEntities;
	}

	findNamedPagerOwner(pager = {}) {
		let identifiers = this._getEntityIdentifiers(this.entities);
		for (let identifier of identifiers) {
			let hasCorrectFieldProperties = typeof pager[identifier.nameField] === "string" && typeof pager[identifier.versionField] === "string";
			let hasMatchingFieldValues = pager[identifier.nameField] === identifier.name && pager[identifier.versionField] === identifier.version;
			if (hasCorrectFieldProperties && hasMatchingFieldValues) {
				return identifier.entity;
			}
		}
	}

	expectPagerOwner(type, collection, pager) {
		if (type === Pager.raw) {
			return Object.values(this.collectionSchema[collection].entities)[0];
		} else if (type === Pager.named || type === undefined) {
			let owner = this.findNamedPagerOwner(pager);
			if (owner === undefined) {
				throw new e.ElectroError(e.ErrorCodes.NoOwnerForPager, "Supplied Pager does not resolve to Entity within Service");
			}
			return owner;
		} else if (type === Pager.item) {
			let owners = this.findItemPagerOwner(collection, pager);
			if (owners.length === 1) {
				return owners[0];
			} else {
				throw new e.ElectroError(e.ErrorCodes.PagerNotUnique, "Supplied Pager did not resolve to single Entity");
			}
		} else {
			throw new e.ElectroError(e.ErrorCodes.InvalidOptions, `Invalid value for option "pager" provider: "${pager}". Allowed values include ${u.commaSeparatedString(Object.keys(Pager))}.`)
		}
	}

	findPagerIdentifiers(collection, pager = {}) {
		if (this.collectionSchema[collection] === undefined) {
			throw new Error("Invalid collection");
		}
		let matchingIdentifiers = [];
		if (pager === null) {
			return matchingIdentifiers;
		}
		for (let entity of Object.values(this.collectionSchema[collection].entities)) {
			if (entity.ownsPager(this.collectionSchema[collection].index, pager)) {
				matchingIdentifiers.push({
					[entity.identifiers.entity]: entity.getName(),
					[entity.identifiers.version]: entity.getVersion(),
				});
			}
		}
		return matchingIdentifiers;
	}

	_formatReturnPager(config, index, lastEvaluatedKey, lastReturned) {
		if (config.pager === "raw") {
			return lastEvaluatedKey;
		} else if (!lastEvaluatedKey) {
			return null;
		} else {
			let entity = this.findKeyOwner(lastEvaluatedKey);
			if (!entity) {
				return lastReturned !== undefined
					? this._formatReturnPager(config, index, lastReturned)
					: null
			}
			let page = entity._formatKeysToItem(index, lastEvaluatedKey);
			if (config.pager === "named") {
				page[entity.identifiers.entity] = entity.getName();
				page[entity.identifiers.version] = entity.getVersion();
			}
			return page;
		}
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

	_makeCollectionChain(name = "", attributes = {}, initialClauses = {}, expressions = {}, entities = {}, entity = {}, facets = {}) {
		let filterBuilder = new FilterFactory(attributes, FilterTypes);
		let whereBuilder = new WhereFactory(attributes, FilterTypes);

		let pageClause = {...initialClauses.page};
		let pageAction = initialClauses.page.action;
		pageClause.action = (entity, state, page = null, options = {}) => {
			try {
				if (page === null) {
					return pageAction(entity, state, page, options);
				}
				let owner = this.expectPagerOwner(options.pager, name, page);
				return pageAction(owner, state, page, options);
			} catch(err) {
				return Promise.reject(err);
			}
		}
		let clauses = {...initialClauses, page: pageClause};

		clauses = filterBuilder.injectFilterClauses(clauses);
		clauses = whereBuilder.injectWhereClauses(clauses);

		let options = {
			// expressions, // DynamoDB doesnt return what I expect it would when provided with these entity filters
			parse: (options, data) => {
				return this.cleanseRetrievedData(name, entities, data, options);
			}
		};

		return entity.collection(name, clauses, facets, options);
	}



	_validateCollectionDefinition(definition = {}, providedIndex = {}) {
		let indexMatch = definition.index === providedIndex.index;
		let pkFieldMatch = definition.pk.field === providedIndex.pk.field;
		let pkFacetLengthMatch = definition.pk.facets.length === providedIndex.pk.facets.length;
		let mismatchedFacetLabels = [];
		let collectionDifferences = [];
		let definitionIndexName = definition.index || "(Primary Index)";
		let providedIndexName = providedIndex.index || "(Primary Index)";
		for (let i = 0; i < definition.pk.facets.length; i++) {
			let definitionFacet = definition.pk.facets[i];
			let definitionLabel = definition.labels[definitionFacet] !== undefined
				? definition.labels[definitionFacet]
				: definitionFacet;
			let providedFacet = providedIndex.pk.facets[i];
			let providedLabel = providedIndex.labels[providedFacet] !== undefined
				? providedIndex.labels[providedFacet]
				: providedFacet;
			let noLabels = definition.labels[definitionFacet] === undefined && providedIndex.labels[providedFacet] === undefined;
			if (definitionLabel !== providedLabel) {
				mismatchedFacetLabels.push({
					definitionFacet,
					definitionLabel,
					providedFacet,
					providedLabel,
					type: noLabels ? "facet" : "label"
				});
			} else if (definitionFacet !== providedFacet) {
				mismatchedFacetLabels.push({
					definitionFacet,
					definitionLabel,
					providedFacet,
					providedLabel,
					type: "facet"
				});
			}
		}
		if (!indexMatch) {
			collectionDifferences.push(
				`Collection defined on provided index "${providedIndexName}" does not match collection established index "${definitionIndexName}". Collections must be defined on the same index across all entities within a service.`,
			);
		} else if (!pkFieldMatch) {
			collectionDifferences.push(
				`Partition Key facets provided "${providedIndex.pk.field}" for index "${providedIndexName}" do not match established field "${definition.pk.field}" on established index "${definitionIndexName}"`,
			);
		}
		if (!pkFacetLengthMatch) {
			collectionDifferences.push(
				`Partition Key Facets provided [${providedIndex.pk.facets.map(val => `"${val}"`).join(", ")}] for index "${providedIndexName}" do not match established facets [${definition.pk.facets.map(val => `"${val}"`).join(", ")}] on established index "${definitionIndexName}"`,
			);
		// Else if used here because if they don't even have the same facet length then the data collected for the mismatched facets would include undefined values
		// which would make the error messages even more confusing.
		} else if (mismatchedFacetLabels.length > 0) {

			for (let mismatch of mismatchedFacetLabels) {
				if (mismatch.type === "facet") {
					collectionDifferences.push(
						`Partition Key facets provided for index "${providedIndexName}" do not match established facet "${mismatch.definitionFacet}" on established index "${definitionIndexName}": "${mismatch.definitionLabel}" != "${mismatch.providedLabel}"; Facet definitions must match between all members of a collection to ensure key structures will resolve to identical Partition Keys. Please ensure these facet definitions are identical for all entities associated with this service.`
					);
				} else {
					collectionDifferences.push(
						`Partition Key facets provided for index "${providedIndexName}" contain conflicting facet labels for established facet "${mismatch.definitionFacet}" on established index "${definitionIndexName}". Established facet "${mismatch.definitionFacet}" on established index "${definitionIndexName}" was defined with label "${mismatch.definitionLabel}" while provided facet "${mismatch.providedFacet}" on provided index "${providedIndexName}" is defined with label "${mismatch.providedLabel}". Facet labels definitions must match between all members of a collection to ensure key structures will resolve to identical Partition Keys. Please ensure these labels definitions are identical for all entities associated with this service.`
					);
				}

			}
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
				labels: providedIndex.labels || {},
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
			throw new e.ElectroError(e.ErrorCodes.InvalidJoin, invalidIndexMessages.join(", "));
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
