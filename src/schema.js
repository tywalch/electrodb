const { CastTypes, ValueTypes, AttributeTypes, AttributeMutationMethods, AttributeWildCard, PathTypes, TraverserIndexes } = require("./types");
const AttributeTypeNames = Object.keys(AttributeTypes);
const ValidFacetTypes = [AttributeTypes.string, AttributeTypes.number, AttributeTypes.boolean, AttributeTypes.enum];
const e = require("./errors");
const u = require("./util");
const {DynamoDBSet} = require("./set");

function getValueType(value) {
	if (value === undefined) {
		return ValueTypes.undefined;
	} else if (value === null) {
		return ValueTypes.null;
	} else if (typeof value === "string") {
		return ValueTypes.string;
	} else if (typeof value === "number") {
		return ValueTypes.number;
	} else if (typeof value === "boolean") {
		return ValueTypes.boolean;
	} else if (Array.isArray(value)) {
		return ValueTypes.array;
	} else if (value.wrapperName === "Set") {
		return ValueTypes.aws_set;
	} else if (value.constructor.name === "Set") {
		return ValueTypes.set;
	} else if (value.constructor.name === "Map") {
		return ValueTypes.map;
	} else if (value.constructor.name === "Object") {
		return ValueTypes.object;
	} else {
		return ValueTypes.unknown;
	}
}

class AttributeTraverser {
	constructor(parentTraverser) {
		if (parentTraverser instanceof AttributeTraverser) {
			this.parent = parentTraverser;
			this.paths = this.parent.paths;
		} else {
			this.parent = null;
			this.paths = new Map();
		}
		this.children = new Map();
		this.indexes = new Map();
	}

	setChild(name, attribute) {
		this.children.set(name, attribute);
	}

	asChild(name, attribute) {
		if (this.parent) {
			this.parent.setChild(name, attribute);
		}
	}

	setPath(path, attribute) {
		if (this.parent) {
			this.parent.setPath(path, attribute);
		}
		this.paths.set(path, attribute);
	}

	getPath(path) {
		if (this.parent) {
			return this.parent.getPath(path);
		}
		return this.paths.get(path);
	}

	getChild(name) {
		return this.children.get(name);
	}

	getAllChildren() {
		return this.children.entries();
	}

	getAll() {
		if (this.parent) {
			return this.parent.getAll();
		}
		return this.paths.entries();
	}

	_getChildIndex(name, key) {
		const index = this.indexes.get(name);
		if (index !== undefined) {
			return index.get(key);
		}
	}

	_setChildIndex(name, key, value) {
		if (!this.indexes.has(name)) {
			this.indexes.set(name, new Map());
		}
		this.indexes.get(name).set(key, value);
	}

	setIndex(name, key, value) {
		if (this.parent) {
			this.parent.setIndex(name, key, value);
		} else {
			this._setChildIndex(name, key, value);
		}
	}

	getIndex(name, key) {
		if (this.parent) {
			return this.parent.getIndex(name, key);
		} else {
			return this._getChildIndex(name, key);
		}
	}

	spawn() {
		return new AttributeTraverser(this);
	}
}


class Attribute {
	constructor(definition = {}) {
		this.name = definition.name;
		this.field = definition.field || definition.name;
		this.label = definition.label;
		this.readOnly = !!definition.readOnly;
		this.hidden = !!definition.hidden;
		this.required = !!definition.required;
		this.cast = this._makeCast(definition.name, definition.cast);
		this.default = this._makeDefault(definition.default);
		this.validate = this._makeValidate(definition.validate);
		this.indexes = [...(definition.indexes || [])];
		let {isWatched, isWatcher, watchedBy, watching, watchAll} = Attribute._destructureWatcher(definition);
		this._isWatched = isWatched
		this._isWatcher = isWatcher;
		this.watchedBy = watchedBy;
		this.watching = watching;
		this.watchAll = watchAll;
		let { type, enumArray } = this._makeType(this.name, definition.type);
		this.type = type;
		this.enumArray = enumArray;
		this.parentType = definition.parentType;
		this.parentPath = definition.parentPath;
		const pathType = this.getPathType(this.type, this.parentType);
		const path = Attribute.buildPath(this.name, pathType, this.parentPath);
		const fieldPath = Attribute.buildPath(this.field, pathType, this.parentType);
		this.path = path;
		this.fieldPath = fieldPath;
		this.traverser = new AttributeTraverser(definition.traverser);
		this.traverser.setPath(this.path, this);
		this.traverser.setPath(this.fieldPath, this);
		this.traverser.asChild(this.name, this);
		this.parent = { parentType: this.type, parentPath: this.path };
		this.get = this._makeGet(definition.get);
		this.set = this._makeSet(definition.set);
	}

	static buildChildAttributes(type, definition, parent) {
		let items;
		let properties;
		if (type === AttributeTypes.list) {
			items = Attribute.buildChildListItems(definition, parent);
		} else if (type === AttributeTypes.set) {
			items = Attribute.buildChildSetItems(definition, parent);
		} else if (type === AttributeTypes.map) {
			properties = Attribute.buildChildMapProperties(definition, parent);
		}

		return {items, properties};
	}

	static buildChildListItems(definition, parent) {
		const {items} = definition;
		const prop = {...items, ...parent};
		// The use of "*" is to ensure the child's name is "*" when added to the traverser and searching for the children of a list
		return Schema.normalizeAttributes({ '*': prop }, {}, parent.traverser).attributes["*"];
	}

	static buildChildSetItems(definition, parent) {
		const {items} = definition;

		const allowedTypes = [AttributeTypes.string, AttributeTypes.boolean, AttributeTypes.number, AttributeTypes.enum];
		if (!Array.isArray(items) && !allowedTypes.includes(items)) {
			throw new e.ElectroError(e.ErrorCodes.InvalidAttributeDefinition, `Invalid "items" definition for Set attribute: "${definition.path}". Acceptable item types include ${u.commaSeparatedString(allowedTypes)}`);
		}
		const prop = {type: items, ...parent};
		return Schema.normalizeAttributes({ prop }, {}, parent.traverser).attributes.prop;
	}

	static buildChildMapProperties(definition, parent) {
		const {properties} = definition;
		if (!properties || typeof properties !== "object") {
			throw new e.ElectroError(e.ErrorCodes.InvalidAttributeDefinition, `Invalid "properties" definition for Map attribute: "${definition.path}". The "properties" definition must describe the attributes that the Map will accept`);
		}
		const attributes = {};
		for (let name of Object.keys(properties)) {
			attributes[name] = {...properties[name], ...parent};
		}
		return Schema.normalizeAttributes(attributes, {}, parent.traverser);
	}

	static buildPath(name, type, parentPath) {
		if (!parentPath) return name;
		switch(type) {
			case AttributeTypes.string:
			case AttributeTypes.number:
			case AttributeTypes.boolean:
			case AttributeTypes.map:
			case AttributeTypes.set:
			case AttributeTypes.list:
			case AttributeTypes.enum:
				return `${parentPath}.${name}`;
			case PathTypes.item:
				return `${parentPath}[*]`;
			case AttributeTypes.any:
			default:
				return `${parentPath}.*`;
		}
	}

	static _destructureWatcher(definition) {
		let watchAll = !!definition.watchAll;
		let watchingArr = watchAll ? []: [...(definition.watching || [])];
		let watchedByArr = [...(definition.watchedBy || [])];
		let isWatched = watchedByArr.length > 0;
		let isWatcher = watchingArr.length > 0;
		let watchedBy = {};
		let watching = {};

		for (let watched of watchedByArr) {
			watchedBy[watched] = watched;
		}

		for (let attribute of watchingArr) {
			watching[attribute] = attribute;
		}

		return {
			watchAll,
			watching,
			watchedBy,
			isWatched,
			isWatcher
		}
	}

	_makeGet(get) {
		this._checkGetSet(get, "get");
		const getter = get || ((attr) => attr);
		return (values, siblings) => {
			if (this.hidden) {
				return;
			}
			return getter(values, siblings);
		}
	}

	_makeSet(set) {
		this._checkGetSet(set, "set");
		return set || ((attr) => attr);
	}

	getPathType(type, parentType) {
		if (parentType === AttributeTypes.list || parentType === AttributeTypes.set) {
			return PathTypes.item;
		}
		return type;
	}

	getAttribute(path) {
		return this.traverser.getPath(path);
	}

	getChild(path) {
		if (this.type === AttributeTypes.any) {
			return this;
		} else if (!isNaN(path) && (this.type === AttributeTypes.list || this.type === AttributeTypes.set)) {
			// if they're asking for a number, and this is a list, children will be under "*"
			return this.traverser.getChild("*");
		} else {
			return this.traverser.getChild(path);
		}
	}

	_checkGetSet(val, type) {
		if (typeof val !== "function" && val !== undefined) {
			throw new e.ElectroError(e.ErrorCodes.InvalidAttributeDefinition, `Invalid "${type}" property for attribute ${this.path}. Please ensure value is a function or undefined.`);
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
				let reason = isValid ? "" : `Invalid value for attribute "${this.path}": Failed user defined regex`;
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
			return [!this.required, this.required ? `Invalid value type at entity path: "${this.path}". Value is required.` : ""];
		}
		let isTyped = false;
		let reason = "";
		switch (this.type) {
			case AttributeTypes.enum:
				isTyped = this.enumArray.includes(value);
				if (!isTyped) {
					reason = `Invalid value type at entity path: "${this.path}". Value not found in set of acceptable values: ${u.commaSeparatedString(this.enumArray)}`;
				}
				break;
			case AttributeTypes.any:
				isTyped = true;
				break;
			case AttributeTypes.string:
			case AttributeTypes.number:
			case AttributeTypes.boolean:
			default:
				isTyped = typeof value === this.type;
				if (!isTyped) {
					reason = `Invalid value type at entity path: "${this.path}". Received value of type "${typeof value}", expected value of type "${this.type}"`;
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
			throw new Error(validationError);
		}
		return value;
	}
}

class MapAttribute extends Attribute {
	constructor(definition) {
		super(definition);
		const properties = Attribute.buildChildMapProperties(definition, {
			parentType: this.type,
			parentPath: this.path,
			traverser: this.traverser
		});
		this.properties = properties;
		this.get = this._makeGet(definition.get, properties);
		this.set = this._makeSet(definition.set, properties);
	}

	_makeGet(get, properties) {
		this._checkGetSet(get, "get");

		const getter = get || ((attr) => attr);

		return (values, siblings) => {
			const data = {};

			if (this.hidden) {
				return;
			}

			if (values === undefined) {
				return getter(data, siblings);
			}

			for (const name of Object.keys(properties.attributes)) {
				const attribute = properties.attributes[name];
				if (values[attribute.field] !== undefined) {
					let results = attribute.get(values[attribute.field], {...values});
					if (results !== undefined) {
						data[attribute.name] = results;
					}
				}
			}


			return getter(data, siblings);
		}
	}

	_makeSet(set, properties) {
		this._checkGetSet(set, "set");
		const setter = set || ((attr) => attr);
		return (values, siblings) => {
			const data = {};
			if (values === undefined) {
				return setter(data, siblings);
			}


			for (const name of Object.keys(properties.attributes)) {
				const attribute = properties.attributes[name];
				if (values[attribute.name] !== undefined) {
					const results = attribute.set(values[attribute.name], {...values});
					if (results !== undefined) {
						data[attribute.field] = results;
					}
				}
			}
			return setter(data, siblings);
		}
	}

	_isType(value) {
		if (value === undefined) {
			return [!this.required, this.required ? `Invalid value type at entity path: "${this.path}". Value is required.` : ""];
		}
		let reason = "";
		const [childrenAreValid, childErrors] = this._validateChildren(value);
		if (!childrenAreValid) {
			reason = childErrors;
		}
		return [childrenAreValid, reason]
	}

	_validateChildren(value) {
		const valueType = getValueType(value);
		const attributes = this.properties.attributes;
		const errors = [];
		if (valueType === ValueTypes.object) {
			for (const child of Object.keys(attributes)) {
				const [isValid, errorMessages] = attributes[child].isValid(value === undefined ? value : value[child])
				if (!isValid) {
					errors.push(errorMessages);
				}
			}
		} else if (valueType !== ValueTypes.object) {
			errors.push(
				`Invalid value type at entity path: "${this.path}". Expected value to be an object to fulfill attribute type "${this.type}"`
			);
		} else if (this.properties.hasRequiredAttributes) {
			errors.push(
				`Invalid value type at entity path: "${this.path}". Map attribute requires at least the properties ${u.commaSeparatedString(Object.keys(attributes))}`
			);
		}
		return [errors.length === 0, errors.filter(Boolean).join(", ")];
	}

	val(value) {
		const getValue = (v) => {
			v = this.cast(v);
			if (v === undefined) {
				v = this.default();
			}
			return v;
		}

		if (value === undefined || value && Object.keys(value).length === 0) {
			return getValue(value);
		}

		const data = {};

		for (const name of Object.keys(this.properties.attributes)) {
			const attribute = this.properties.attributes[name];
			const results = attribute.val(value[attribute.name]);
			if (results !== undefined) {
				data[attribute.field] = results;
			}
		}

		if (Object.keys(data).length > 0) {
			return getValue(data);
		} else {
			return getValue();
		}
	}
}

class ListAttribute extends Attribute {
	constructor(definition) {
		super(definition);
		const items = Attribute.buildChildListItems(definition, {
			parentType: this.type,
			parentPath: this.path,
			traverser: this.traverser
		});
		this.items = items;
		this.get = this._makeGet(definition.get, items);
		this.set = this._makeSet(definition.set, items);
	}

	_makeGet(get, items) {
		this._checkGetSet(get, "get");

		const getter = get || ((attr) => attr);

		return (values, siblings) => {
			const data = [];

			if (this.hidden) {
				return;
			}

			if (values === undefined) {
				return getter(data, siblings);
			}

			for (let value of values) {
				const results = items.get(value, [...values]);
				if (results !== undefined) {
					data.push(results);
				}
			}

			return getter(data, siblings);
		}
	}

	_makeSet(set, items) {
		this._checkGetSet(set, "set");
		const setter = set || ((attr) => attr);
		return (values, siblings) => {
			const data = [];

			if (values === undefined) {
				return setter(values, siblings);
			}

			for (const value of values) {
				const results = items.set(value, [...values]);
				if (results !== undefined) {
					data.push(results);
				}
			}

			return setter(data, siblings);
		}
	}

	_isType(value) {
		if (value === undefined) {
			return [!this.required, this.required ? `Invalid value type at entity path: "${this.path}". Value is required.` : ""];
		}
		let reason = "";
		const [childrenAreValid, childErrors] = this._validateChildren(value);
		if (!childrenAreValid) {
			reason = childErrors;
		}
		return [childrenAreValid, reason]
	}

	_validateChildren(value) {
		const valueType = getValueType(value);
		const errors = [];
		if (valueType === ValueTypes.array) {
			for (const i in value) {
				const [isValid, errorMessages] = this.items.isValid(value[i]);
				if (!isValid) {
					errors.push(errorMessages + ` at index "${i}"`);
				}
			}
		} else {
			errors.push(
				`Invalid value type at entity path: "${this.path}". Expected value to be an Array to fulfill attribute type "${this.type}"`
			);
		}
		return [errors.length === 0, errors.filter(Boolean).join(", ")];
	}

	val(value) {
		const getValue = (v) => {
			v = this.cast(v);
			if (v === undefined) {
				v = this.default();
			}
			return v;
		}

		if (value === undefined) {
			return this.default();
		} else if (Array.isArray(value) && value.length === 0) {
			return value;
		} else if (!Array.isArray(value)) {
			value = [value];
		}

		const data = [];

		for (const v of value) {
			const results = this.items.val(v);
			if (results !== undefined) {
				data.push(results);
			}
		}

		if (data.filter(value => value !== undefined).length > 0) {
			return getValue(data);
		} else {
			return getValue();
		}
	}
}

class SetAttribute extends Attribute {
	constructor(definition) {
		super(definition);
		const items = Attribute.buildChildSetItems(definition, {
			parentType: this.type,
			parentPath: this.path,
			traverser: this.traverser
		});
		this.items = items;
		this.get = this._makeGet(definition.get, items);
		this.set = this._makeSet(definition.set, items);
	}

	fromDDBSet(value) {
		if (getValueType(value) === ValueTypes.aws_set) {
			return value.values;
		}
		return value;
	}

	toDDBSet(value) {
		const valueType = getValueType(value);
		let array;
		switch(valueType) {
			case ValueTypes.set:
				array = Array.from(value);
				return new DynamoDBSet(array, this.items.type);
			case ValueTypes.aws_set:
				return value;
			case ValueTypes.array:
				return new DynamoDBSet(value, this.items.type);
			case ValueTypes.string:
			case ValueTypes.boolean:
			case ValueTypes.number: {
				if (valueType === this.items.type) {
					return new DynamoDBSet(value, this.items.type);
				} else {
					throw new Error(`Invalid attribute value supplied to "set" attribute "${this.path}". Received value of type "${valueType}" but Attribute is defined as ${this.items.type}`);
				}
			}
		}

		throw new Error(`Invalid attribute value supplied to "set" attribute "${this.path}". Received value of type "${valueType}". Set values must be supplied as either Arrays, native JavaScript Set objects, or DocumentClient Set objects.`)
	}

	_makeGet(get, items) {
		this._checkGetSet(get, "get");

		const getter = get || ((attr) => attr);

		return (values, siblings) => {
			if (values !== undefined) {
				const data = this.fromDDBSet(values);
				return getter(data, siblings);
			}
			let results = getter(data, siblings);
			if (results !== undefined) {
				// if not undefined, try to convert, else no need to return
				return this.fromDDBSet(results);
			}
		}
	}

	_makeSet(set, items) {
		this._checkGetSet(set, "set");
		const setter = set || ((attr) => attr);
		return (values, siblings) => {
			const results = setter(values, siblings);
			if (results !== undefined) {
				return this.toDDBSet(results);
			}
		}
	}

	_isType(value) {
		if (value === undefined) {
			return [!this.required, this.required ? `Invalid value type at entity path: "${this.path}". Value is required.` : ""];
		}
		let reason = "";
		const [childrenAreValid, childErrors] = this._validateChildren(value);
		if (!childrenAreValid) {
			reason = childErrors;
		}
		return [childrenAreValid, reason]
	}

	_validateChildren(value) {
		const valueType = getValueType(value);
		const errors = [];
		let arr = [];
		if (valueType === ValueTypes.array) {
			arr = value;
		} else if (valueType === ValueTypes.set) {
			arr = Array.from(value);
		} else if (valueType === ValueTypes.aws_set) {
			arr = value.values;
		} else {
			errors.push(
				`Invalid value type at attribute path: "${this.path}". Expected value to be an Expected value to be an Array, native JavaScript Set objects, or DocumentClient Set objects to fulfill attribute type "${this.type}"`
			)
		}
		for (const item of arr) {
			const [isValid, errorMessage] = this.items.isValid(item);
			if (!isValid) {
				errors.push(errorMessage);
			}
		}
		return [errors.length === 0, errors.filter(Boolean).join(", ")];
	}

	val(value) {
		const getValue = (v) => {
			v = this.cast(v);
			if (v === undefined) {
				v = this.default();
			}
			return v;
		}

		if (value === undefined) {
			value = this.default();
		}

		if (value === undefined) {
			return value;
		} else {
			const results = getValue(value);
			return this.toDDBSet(results);
		}
	}
}

class Schema {
	constructor(properties = {}, facets = {}, traverser = new AttributeTraverser()) {
		this._validateProperties(properties);
		let schema = Schema.normalizeAttributes(properties, facets, traverser);
		this.attributes = schema.attributes;
		this.enums = schema.enums;
		this.translationForTable = schema.translationForTable;
		this.translationForRetrieval = schema.translationForRetrieval;
		this.hiddenAttributes = schema.hiddenAttributes;
		this.readOnlyAttributes = schema.readOnlyAttributes;
		this.requiredAttributes = schema.requiredAttributes;
		this.translationForWatching = this._formatWatchTranslations(this.attributes);
		this.traverser = traverser;

	}

	static normalizeAttributes(attributes = {}, facets = {}, traverser) {
		let invalidProperties = [];
		let normalized = {};
		let usedAttrs = {};
		let enums = {};
		let translationForTable = {};
		let translationForRetrieval = {};
		let watchedAttributes = {};
		let requiredAttributes = new Set();
		let hiddenAttributes = new Set();
		let readOnlyAttributes = new Set();
		let definitions = {};
		for (let name in attributes) {
			let attribute = attributes[name];
			if (typeof attribute === AttributeTypes.string || Array.isArray(attribute)) {
				attribute = {
					type: attribute
				};
			}
			if (facets.fields && facets.fields.includes(name)) {
				continue;
			}
			if (attribute.field && facets.fields.includes(attribute.field)) {
				continue;
			}
			let isKey = !!facets.byIndex && facets.byIndex[""].all.find((facet) => facet.name === name);
			let definition = {
				name,
				traverser,
				label: attribute.label,
				required: !!attribute.required,
				field: attribute.field || name,
				default: attribute.default,
				validate: attribute.validate,
				readOnly: !!attribute.readOnly || isKey,
				hidden: !!attribute.hidden,
				indexes: (facets.byAttr && facets.byAttr[name]) || [],
				type: attribute.type,
				get: attribute.get,
				set: attribute.set,
				watching: Array.isArray(attribute.watch) ? attribute.watch : [],
				items: attribute.items,
				properties: attribute.properties,
				parentPath: attribute.parentPath,
				parentType: attribute.parentType
			};

			if (attribute.watch !== undefined) {
				if (attribute.watch === AttributeWildCard) {
					definition.watchAll = true;
					definition.watching = [];
				} else if (Array.isArray(attribute.watch)) {
					definition.watching = attribute.watch;
				} else {
					throw new e.ElectroError(e.ErrorCodes.InvalidAttributeWatchDefinition, `Attribute Validation Error. The attribute '${name}' is defined to "watch" an invalid value of: '${attribute.watch}'. The watch property must either be a an array of attribute names, or the single string value of "${WatchAll}".`);
				}
			} else {
				definition.watching = [];
			}

			if (definition.readOnly) {
				readOnlyAttributes.add(name);
			}

			if (definition.hidden) {
				hiddenAttributes.add(name);
			}

			if (definition.required) {
				requiredAttributes.add(name);
			}

			if (facets.byAttr && facets.byAttr[definition.name] !== undefined && (!ValidFacetTypes.includes(definition.type) && !Array.isArray(definition.type))) {
				let assignedIndexes = facets.byAttr[name].map(assigned => assigned.index === "" ? "Table Index" : assigned.index);
				throw new e.ElectroError(e.ErrorCodes.InvalidAttributeDefinition, `Invalid composite attribute definition: Composite attributes must be one of the following: ${ValidFacetTypes.join(", ")}. The attribute "${name}" is defined as being type "${attribute.type}" but is a composite attribute of the the following indexes: ${assignedIndexes.join(", ")}`);
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
			const definition = definitions[name];

			definition.watchedBy = Array.isArray(watchedAttributes[name])
				? watchedAttributes[name]
				: [];

			switch(definition.type) {
				case AttributeTypes.map:
					normalized[name] = new MapAttribute(definition);
					break;
				case AttributeTypes.list:
					normalized[name] = new ListAttribute(definition);
					break;
				case AttributeTypes.set:
					normalized[name] = new SetAttribute(definition);
					break;
				default:
					normalized[name] = new Attribute(definition);
			}
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

		let missingFacetAttributes = Array.isArray(facets.attributes)
			? facets.attributes
				.filter(({ name }) => !normalized[name])
				.map((facet) => `"${facet.type}: ${facet.name}"`)
			: []
		if (missingFacetAttributes.length > 0) {
			throw new e.ElectroError(e.ErrorCodes.InvalidKeyCompositeAttributeTemplate, `Invalid key composite attribute template. The following composite attribute attributes were described in the key composite attribute template but were not included model's attributes: ${missingFacetAttributes.join(", ")}`);
		}
		if (invalidProperties.length > 0) {
			let message = invalidProperties.map((prop) => `Schema Validation Error. Attribute "${prop.name}" property "${prop.property}". Received: "${prop.value}", Expected: "${prop.expected}"`);
			throw new e.ElectroError(e.ErrorCodes.InvalidAttributeDefinition, message);
		} else {
			return {
				enums,
				hiddenAttributes,
				readOnlyAttributes,
				requiredAttributes,
				translationForTable,
				translationForRetrieval,
				attributes: normalized,
			};
		}
	}

	_validateProperties() {}

	_formatWatchTranslations(attributes) {
		let watchersToAttributes = {};
		let attributesToWatchers = {};
		let watchAllAttributes = {};
		let hasWatchers = false;
		for (let name of Object.keys(attributes)) {
			if (attributes[name].isWatcher()) {
				hasWatchers = true;
				watchersToAttributes[name] = attributes[name].watching;
			} else if (attributes[name].watchAll) {
				hasWatchers = true;
				watchAllAttributes[name] = name;
			} else {
				attributesToWatchers[name] = attributesToWatchers[name] || {};
				attributesToWatchers[name] = attributes[name].watchedBy;
			}
		}
		return {
			hasWatchers,
			watchAllAttributes,
			watchersToAttributes,
			attributesToWatchers
		};
	}

	getAttribute(path) {
		return this.traverser.getPath(path);
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

	_applyAttributeMutation(method, include, avoid, payload) {
		let data = { ...payload };
		for (let path of Object.keys(include)) {
			// this.attributes[attribute] !== undefined | Attribute exists as actual attribute. If `includeKeys` is turned on for example this will include values that do not have a presence in the model and therefore will not have a `.get()` method
			// avoid[attribute] === undefined           | Attribute shouldn't be in the avoided
			const attribute = this.getAttribute(path);
			if (attribute !== undefined && avoid[path] === undefined) {
				data[path] = attribute[method](payload[path], {...payload});
			}
		}
		return data;
	}

	_fulfillAttributeMutationMethod(method, payload) {
		let watchersToTrigger = {};
		// include: payload               | We want to hit the getters/setters for any attributes coming in to be changed
		// avoid: watchersToAttributes    | We want to avoid anything that is a watcher, even if it was included
		let avoid = {...this.translationForWatching.watchersToAttributes, ...this.translationForWatching.watchAllAttributes};
		let data = this._applyAttributeMutation(method, payload, avoid, payload);
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
		let include = {...data, ...watchersToTrigger, ...this.translationForWatching.watchAllAttributes};
		return this._applyAttributeMutation(method, include, this.translationForWatching.attributesToWatchers, data);
	}

	applyAttributeGetters(payload = {}) {
		return this._fulfillAttributeMutationMethod(AttributeMutationMethods.get, payload);
	}

	applyAttributeSetters(payload = {}) {
		return this._fulfillAttributeMutationMethod(AttributeMutationMethods.set, payload);
	}

	translateFromFields(item = {}, options = {}) {
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

	checkRemove(paths = []) {
		for (const path of paths) {
			const attribute = this.traverser.getPath(path);
			if (!attribute) {
				throw new Error(`Attribute "${path}" does not exist on model.`);
			} else if (attribute.readOnly) {
				throw new Error(`Attribute "${attribute.path}" is Read-Only and cannot be updated`);
			}
		}
		return paths;
	}

	checkUpdate(payload = {}) {
		let record = {};
		for (let [path, attribute] of this.traverser.getAll()) {
			let value = payload[path];
			if (value === undefined) {
				continue;
			}
			if (attribute.readOnly) {
				// todo: #electroerror
				throw new Error(`Attribute "${attribute.path}" is Read-Only and cannot be updated`);
			} else {
				record[path] = attribute.getValidate(value);
			}
		}
		return record;
	}

	getReadOnly() {
		return Array.from(this.readOnlyAttributes);
	}

	getRequired() {
		return Array.from(this.requiredAttributes);
	}

	formatItemForRetrieval(item, config) {
		let remapped = this.translateFromFields(item, config);
		let data = this._fulfillAttributeMutationMethod("get", remapped);
		if (this.hiddenAttributes.size > 0) {
			for (let attribute of Object.keys(data)) {
				if (this.hiddenAttributes.has(attribute)) {
					delete data[attribute];
				}
			}
		}
		return data;
	}
}

module.exports = {
	Schema,
	Attribute,
	CastTypes,
};
