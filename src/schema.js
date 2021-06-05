const { KeyTypes, CastTypes, AttributeTypes, AttributeMutationMethods } = require("./types");
const AttributeTypeNames = Object.keys(AttributeTypes);
const ValidFacetTypes = [AttributeTypes.string, AttributeTypes.number, AttributeTypes.boolean, AttributeTypes.enum];
const e = require("./errors");

class Attribute {
	constructor(definition = {}) {
		this.name = definition.name;
		this.field = definition.field || definition.name;
		this.label = definition.label;
		this.readOnly = !!definition.readOnly;
		this.required = !!definition.required;
		this.cast = this._makeCast(definition.name, definition.cast);
		this.default = this._makeDefault(definition.default);
		this.validate = this._makeValidate(definition.validate);
		this.get = this._makeGet(definition.name, definition.get);
		this.set = this._makeSet(definition.name, definition.set);
		this.indexes = [...(definition.indexes || [])];
		let watching = [...(definition.watching || [])];
		let watchedBy = [...(definition.watchedBy || [])];
		this._isWatched = watchedBy.length > 0;
		this._isWatcher = watching.length > 0;
		this.watchedBy = {};
		this.watching = {};
		for (let watched of watchedBy) {
			this.watchedBy[watched] = watched;
		}
		for (let attribute of watching) {
			this.watching[attribute] = attribute;
		}
		let { type, enumArray } = this._makeType(this.name, definition.type);
		this.type = type;
		this.enumArray = enumArray;
	}

	static _destructureWatcher(definition) {
		let watchingCopy = [...(definition.watching || [])];
		let watchedByCopy = [...(definition.watchedBy || [])];
		let isWatched = watchingCopy.length > 0;
		let isWatcher = watchedByCopy.length > 0;
		let watchedBy = {};
		let watching = {};
		for (let attribute of watchingCopy) {
			watching[attribute] = attribute;
		}
		for (let watched of watchedByCopy) {
			watchedBy[watched] = watched;
		}

		return {isWatcher, isWatched, watching, watchedBy};
	}

	_makeGet(name, get) {
		if (typeof get === "function") {
			return get;
		} else if (get === undefined) {
			return (attr) => attr;
		} else {
			throw new e.ElectroError(e.ErrorCodes.InvalidAttributeDefinition, `Invalid "get" property for attribute ${name}. Please ensure value is a function or undefined.`);
		}
	}

	_makeSet(name, set) {
		if (typeof set === "function") {
			return set;
		} else if (set === undefined) {
			return (attr) => attr;
		} else {
			throw new e.ElectroError(e.ErrorCodes.InvalidAttributeDefinition, `Invalid "set" property for attribute ${name}. Please ensure value is a function or undefined.`);
		}
	}

	_makeCast(name, cast) {
		if (cast !== undefined && !CastTypes.includes(cast)) {
			throw new e.ElectroError(e.ErrorCodes.InvalidAttributeDefinition, `Invalid "cast" property for attribute: "${name}". Acceptable types include ${CastTypes.join(", ",)}`,
			);
		} else if (cast === AttributeTypes.string) {
			return (val) => {
				if (val === undefined) {
					// todo: #electroerror
					throw new Error(`Attribute ${name} is undefined and cannot be cast to type ${cast}`);
				} else if (typeof val === "string") {
					return val;
				} else {
					return JSON.stringify(val);
				}
			};
		} else if (cast === AttributeTypes.number) {
			return (val) => {
				if (val === undefined) {
					// todo: #electroerror
					throw new Error(`Attribute ${name} is undefined and cannot be cast to type ${cast}`);
				} else if (typeof val === "number") {
					return val;
				} else {
					let results = Number(val);
					if (isNaN(results)) {
						// todo: #electroerror
						throw new Error(`Attribute ${name} cannot be cast to type ${cast}. Doing so results in NaN`);
					} else {
						return results;
					}
				}
			};
		} else {
			return (val) => val;
		}
	}

	_makeValidate(definition) {
		if (typeof definition === "function") {
			return (val) => {
				let reason = definition(val);
				return [!reason, reason || ""];
			};
		} else if (definition instanceof RegExp) {
			return (val) => {
				let isValid = definition.test(val);
				let reason = isValid ? "" : "Failed user defined regex";
				return [isValid, reason];
			};
		} else {
			return (val) => [true, ""];
		}
	}

	_makeDefault(definition) {
		if (typeof definition === "function") {
			return () => definition();
		} else {
			return () => definition;
		}
	}

	_makeType(name, definition) {
		let type = "";
		let enumArray = [];
		if (Array.isArray(definition)) {
			type = AttributeTypes.enum;
			enumArray = [...definition];
		} else {
			type = definition || "string";
		}
		if (!AttributeTypeNames.includes(type)) {
			throw new e.ElectroError(e.ErrorCodes.InvalidAttributeDefinition, `Invalid "type" property for attribute: "${name}". Acceptable types include ${AttributeTypeNames.join(", ")}`);
		}
		return { type, enumArray };
	}

	isWatcher() {
		return this._isWatcher;
	}

	isWatched() {
		return this._isWatched;
	}

	isWatching(attribute) {
		return this.watching[attribute] !== undefined;
	}

	isWatchedBy(attribute) {
		return this.watchedBy[attribute] !== undefined;
	}

	_isType(value) {
		if (value === undefined) {
			return [!this.required, this.required ? "Value is required" : ""];
		}
		let isTyped = false;
		let reason = "";
		switch (this.type) {
			case AttributeTypes.enum:
				isTyped = this.enumArray.includes(value);
				if (!isTyped) {
					reason = `Value not found in set of acceptable values: ${this.enumArray.join(", ")}`;
				}
				break;
			case AttributeTypes.any:
				isTyped = true;
				break;
			case AttributeTypes.map:
				isTyped = value.constructor.name === "Object" || value.constructor.name === "Map";
				if (!isTyped) {
					reason = `Expected value to be an Object to fulfill attribute type "${this.type}"`
				}
				break;
			case AttributeTypes.set:
				isTyped = Array.isArray(value) || value.constructor.name === "Set";
				if (!isTyped) {
					reason = `Expected value to be an Array or javascript Set to fulfill attribute type "${this.type}"`
				}
				break;
			case AttributeTypes.list:
				isTyped = Array.isArray(value);
				if (!isTyped) {
					reason = `Expected value to be an Array to fulfill attribute type "${this.type}"`
				}
				break;
			case AttributeTypes.string:
			case AttributeTypes.number:
			case AttributeTypes.boolean:
			default:
				isTyped = typeof value === this.type;
				if (!isTyped) {
					reason = `Received value of type "${typeof value}", expected value of type "${this.type}"`;
				}
				break;
		}
		return [isTyped, reason];
	}

	isValid(value) {
		try {
			let [isTyped, typeError] = this._isType(value);
			let [isValid, validationError] = this.validate(value);
			let reason = [typeError, validationError].filter(Boolean).join(", ");
			return [isTyped && isValid, reason];
		} catch (err) {
			return [false, err.message];
		}
	}

	val(value) {
		value = this.cast(value);
		if (value === undefined) {
			value = this.default();
		}
		return value;
	}

	getValidate(value) {
		value = this.val(value);
		let [isValid, validationError] = this.isValid(value);
		if (!isValid) {
			// todo: #electroerror
			throw new Error(`Invalid value for attribute "${this.name}": ${validationError}.`);
		}
		return value;
	}
}

class Schema {
	constructor(properties = {}, facets = {}) {
		this._validateProperties(properties);
		let schema = this._normalizeAttributes(properties, facets);
		this.attributes = schema.attributes;
		this.enums = schema.enums;
		this.translationForTable = schema.translationForTable;
		this.translationForRetrieval = schema.translationForRetrieval;
		this.translationForWatching = this._formatWatchTranslations(this.attributes);
	}

	_validateProperties() {}

	_formatWatchTranslations(attributes) {
		let watchersToAttributes = {};
		let attributesToWatchers = {};
		let hasWatchers = false;
		for (let name of Object.keys(attributes)) {
			if (attributes[name].isWatcher()) {
				hasWatchers = true;
				watchersToAttributes[name] = attributes[name].watching;
			} else {
				attributesToWatchers[name] = attributesToWatchers[name] || {};
				attributesToWatchers[name] = attributes[name].watchedBy;
			}
		}
		return {
			hasWatchers,
			watchersToAttributes,
			attributesToWatchers
		};
	}

	_normalizeAttributes(attributes = {}, facets = {}) {
		let invalidProperties = [];
		let normalized = {};
		let usedAttrs = {};
		let enums = {};
		let translationForTable = {};
		let translationForRetrieval = {};
		let watchedAttributes = {};
		let definitions = {};
		for (let name in attributes) {
			let attribute = attributes[name];
			if (typeof attribute === AttributeTypes.string || Array.isArray(attribute)) {
				attribute = {
					type: attribute
				};
			}
			if (facets.fields.includes(name)) {
				continue;
			}
			if (attribute.field && facets.fields.includes(attribute.field)) {
				continue;
			}
			let isKey = !!facets.byIndex[""].all.find((facet) => facet.name === name);
			let definition = {
				name,
				label: facets.labels[name] || attribute.label,
				required: !!attribute.required,
				field: attribute.field || name,
				hide: !!attribute.hide,
				default: attribute.default,
				validate: attribute.validate,
				readOnly: !!attribute.readOnly || isKey,
				indexes: facets.byAttr[name] || [],
				type: attribute.type,
				get: attribute.get,
				set: attribute.set,
				watching: Array.isArray(attribute.watch) ? attribute.watch : []
			};
			
			if (facets.byAttr[definition.name] !== undefined && (!ValidFacetTypes.includes(definition.type) && !Array.isArray(definition.type))) {
				let assignedIndexes = facets.byAttr[name].map(assigned => assigned.index === "" ? "Table Index" : assigned.index);
				throw new e.ElectroError(e.ErrorCodes.InvalidAttributeDefinition, `Invalid facet definition: Facets must be one of the following: ${ValidFacetTypes.join(", ")}. The attribute "${name}" is defined as being type "${attribute.type}" but is a facet of the the following indexes: ${assignedIndexes.join(", ")}`);
			}
			
			if (usedAttrs[definition.field] || usedAttrs[name]) {
				invalidProperties.push({
					name,
					property: "field",
					value: definition.field,
					expected: `Unique field property, already used by attribute ${
						usedAttrs[definition.field]
					}`,
				});
			} else {
				usedAttrs[definition.field] = definition.name;
			}
			
			translationForTable[definition.name] = definition.field;
			translationForRetrieval[definition.field] = definition.name;

			for (let watched of definition.watching) {
				watchedAttributes[watched] = watchedAttributes[watched] || [];
				watchedAttributes[watched].push(name);
			}

			definitions[name] = definition;
		}

		for (let name of Object.keys(definitions)) {
			let definition = definitions[name];
			definition.watchedBy = Array.isArray(watchedAttributes[name])
				? watchedAttributes[name]
				: []
			normalized[name] = new Attribute(definition);
		}

		let watchedWatchers = [];
		let watchingUnknownAttributes = [];
		for (let watched of Object.keys(watchedAttributes)) {
			if (normalized[watched] === undefined) {
				for (let attribute of watchedAttributes[watched]) {
					watchingUnknownAttributes.push({attribute, watched});
				}
			} else if (normalized[watched].isWatcher()) {
				for (let attribute of watchedAttributes[watched]) {
					watchedWatchers.push({attribute, watched});
				}
			}
		}

		if (watchingUnknownAttributes.length > 0) {
			throw new e.ElectroError(e.ErrorCodes.InvalidAttributeWatchDefinition, `Attribute Validation Error. The following attributes are defined to "watch" invalid/unknown attributes: ${watchingUnknownAttributes.map(({watched, attribute}) => `"${attribute}"->"${watched}"`).join(", ")}.`);
		}

		if (watchedWatchers.length > 0) {
			throw new e.ElectroError(e.ErrorCodes.InvalidAttributeWatchDefinition, `Attribute Validation Error. Attributes may only "watch" other attributes also watch attributes. The following attributes are defined with ineligible attributes to watch: ${watchedWatchers.map(({attribute, watched}) => `"${attribute}"->"${watched}"`).join(", ")}.`)
		}

		let missingFacetAttributes = facets.attributes
			.filter(({ name }) => {
				return !normalized[name];
			})
			.map((facet) => `"${facet.type}: ${facet.name}"`);
		if (missingFacetAttributes.length) {
			throw new e.ElectroError(e.ErrorCodes.InvalidKeyFacetTemplate, `Invalid key facet template. The following facet attributes were described in the key facet template but were not included model's attributes: ${missingFacetAttributes.join(", ")}`);
		}
		if (invalidProperties.length) {
			let message = invalidProperties.map((prop) => `Schema Validation Error. Attribute "${prop.name}" property "${prop.property}". Received: "${prop.value}", Expected: "${prop.expected}"`);
			throw new e.ElectroError(e.ErrorCodes.InvalidAttributeDefinition, message);
		} else {
			return {
				enums,
				translationForTable,
				translationForRetrieval,
				attributes: normalized,
			};
		}
	}

	reMapRetrievedData(item = {}, options = {}) {
		let { includeKeys } = options;
		let data = {};
		let names = this.translationForRetrieval;
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

	getLabels() {
		let labels = {};
		for (let name of Object.keys(this.attributes)) {
			let label = this.attributes[name].label;
			if (label !== undefined) {
				labels[name] = label;
			}
		}
		return labels;
	};

	// _getPartDetail(part = "") {
	// 	let detail = {
	// 			expression: "",
	// 			name: "",
	// 			value: "",
	// 	};
	// 	if (part.includes("[")) {
	// 			if (!part.match(/\[\d\]/gi)) {
	// 					throw new Error(`Invalid path: Part "${part}" has bracket containing non-numeric characters.`);
	// 			}
	// 			let [name] = part.match(/.*(?=\[)/gi);
	// 			detail.name = `#${name}`;
	// 			detail.value = name;
	// 	} else {
	// 			detail.name = `#${part}`;
	// 			detail.value = part;
	// 	}
	// 	detail.expression = `#${part}`;
	// 	return detail;
	// }

	// parseAttributePath(path = "") {
	// 	if (typeof path !== "string" || !path.length) {
  //     throw new Error("Invalid path: Path must be a string with a non-zero length");
	// 	}
	// 	let parts = path.split(/\./gi);
	// 	let attr = this._getPartDetail(parts[0]);
	// 	let target = this._getPartDetail(parts[parts.length-1]).value;
	// 	if (this.attributes[attr.value] === undefined) {
	// 		throw new Error(`Invalid path: Target attribute "${attr.value}" does not exist in model`);
	// 	} else if (attr.expression.includes("[") && this.attributes[attr.value].type !== AttributeTypes.list) {
	// 		throw new Error(`Invalid path: Target attribute "${attr.value}" is not of type "${AttributeTypes.list}"`);
	// 	}
	// 	let names = {};
	// 	let expressions = [];
	// 	for (let part of parts) {
	// 			let detail = this._getPartDetail(part);
	// 			names[detail.name] = detail.value;
	// 			expressions.push(detail.expression);
	// 	}
	// 	return {path, names, target, attr: attr.value, expression: expressions.join(".")};
	// }

	_applyAttributeMutation(method, include, avoid, payload) {
		let data = { ...payload };
		for (let attribute of Object.keys(include)) {
			// this.attributes[attribute] !== undefined | Attribute exists as actual attribute. If `includeKeys` is turned on for example this will include values that do not have a presence in the model and therefore will not have a `.get()` method
			// avoid[attribute] === undefined           | Attribute shouldn't be in the avoided
			if (this.attributes[attribute] !== undefined && avoid[attribute] === undefined) {
				data[attribute] = this.attributes[attribute][method](payload[attribute], {...payload});
			}
		}
		return data;
	}

	_fulfillAttributeMutationMethod(method, payload) {
		let watchersToTrigger = {};
		// include: payload               | We want to hit the getters/setters for any attributes coming in to be changed
		// avoid: watchersToAttributes    | We want to avoid anything that is a watcher, even if it was included
		let data = this._applyAttributeMutation(method, payload, this.translationForWatching.watchersToAttributes, payload);
		// `data` here will include all the original payload values, but with the mutations applied to on non-watchers
		if (!this.translationForWatching.hasWatchers) {
			// exit early, why not
			return data;
		}
		for (let attribute of Object.keys(data)) {
			let watchers = this.translationForWatching.attributesToWatchers[attribute];
			// Any of the attributes on data have a watcher?
			if (watchers !== undefined) {
				watchersToTrigger = {...watchersToTrigger, ...watchers}
			}
		}
		// include: ...data, ...watchersToTrigger | We want to hit attributes that were watching an attribute included in data, and include an properties that were skipped because they were a watcher
		// avoid: attributesToWatchers            | We want to avoid hit anything that was not a watcher because they were already hit once above
		return this._applyAttributeMutation(method, {...data, ...watchersToTrigger}, this.translationForWatching.attributesToWatchers, data);
	}

	applyAttributeGetters(payload = {}) {
		return this._fulfillAttributeMutationMethod(AttributeMutationMethods.get, payload);
	}

	applyAttributeSetters(payload = {}) {
		return this._fulfillAttributeMutationMethod(AttributeMutationMethods.set, payload);
	}

	translateToFields(payload = {}) {
		let record = {};
		for (let [name, value] of Object.entries(payload)) {
			let field = this.translationForTable[name];
			if (value !== undefined) {
				record[field] = value;
			}
		}
		return record;
	}

	checkCreate(payload = {}) {
		let record = {};
		for (let attribute of Object.values(this.attributes)) {
			let value = payload[attribute.name];
			record[attribute.name] = attribute.getValidate(value);
		}
		return record;
	}

	checkUpdate(payload = {}) {
		let record = {};
		for (let attribute of Object.values(this.attributes)) {
			let value = payload[attribute.name];
			if (value === undefined) continue;
			if (attribute.readOnly) {
				// todo: #electroerror
				throw new Error(`Attribute ${attribute.name} is Read-Only and cannot be updated`);
			} else {
				record[attribute.name] = attribute.getValidate(value);
			}
		}
		return record;
	}

	getReadOnly() {
		return Object.values(this.attributes)
			.filter((attribute) => attribute.readOnly)
			.map((attribute) => attribute.name);
	}

	formatItemForRetrieval(item, config) {
		let remapped = this.reMapRetrievedData(item, config);
		return this._fulfillAttributeMutationMethod("get", remapped);
	}
}

module.exports = {
	Schema,
	Attribute,
	CastTypes,
};
