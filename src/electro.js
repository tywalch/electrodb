/*
    todo: integrate valiation library
    todo: possible no sk
    *todo: key parts parser
    *todo: normalize aliases/attrs on parse for safe assume use laterz
    todo: check no attr have the same name as schema field names
    todo: remove "__main__"
    todo: rename translate properties
	todo: check if update is trying to changea  PK/SK
	todo: readonly param on schema attribute
*/

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
	DELETE: "delete"
};

const queryTypes = {
	BETWEEN: "between",
	AND: "and",
	GTE: "gte",
	GT: "gt",
	LTE: "lte",
	LT: "lt"
};

let clauses = {
	index: {
		action: (electro, state, ...args) => {
			if (typeof args[0] === "object") {
				let {pk} = electro._orderedFacetsFromObject(args[0], electro.index);
				return electro._fulfillPk(state, ...pk);
			} else {
				return electro._fulfillPk(state, ...args);
			}
		},
		children: [
			"get",
			"query",
			"update",
			"delete",
			"put",
			"find",
			"between",
			"gt",
			"gte",
			"lt",
			"lte",
		],
	},
	put: {
		action(electro, state, ...args) {
			state.type = methodTypes.PUT;
			let remaining = electro._fulfillParts(state, methodTypes.PUT, ...args);
			if (remaining > 0) {
				throw new Error(
					`GET method requires that all key parts are provided. Remaining keys are ${state.parts.remaining
						.map(part => part.name)
						.join(", ")}`,
				);
			}
		},
		children: ["data", "go", "params"],
	},
	get: {
		action: (electro, state, ...args) => {
			state.type = methodTypes.GET;
			let remaining = electro._fulfillParts(state, methodTypes.GET, ...args);
			if (remaining > 0) {
				throw new Error(
					`GET method requires that all key parts are provided. Remaining keys are ${state.parts.remaining
						.map(part => part.name)
						.join(", ")}`,
				);
			}
		},
		children: ["go", "params"],
	},
	query: {
		action: (electro, state, ...args) => {
			state.type = methodTypes.QUERY;
			electro._fulfillParts(state, "query", ...args);
		},
		children: ["find", "between", "gt", "gte", "lt", "lte", "params", "go"],
	},
	update: {
		action: (electro, state, ...args) => {
			state.type = methodTypes.UPDATE;
			let remaining = electro._fulfillParts(state, methodTypes.UPDATE, ...args);
			if (remaining > 0) {
				throw new Error(
					`UPDATE method requires that all key parts are provided. Remaining keys are ${state.parts.remaining
						.map(part => part.name)
						.join(", ")}`,
				);
			}
		},
		children: ["set"],
	},
	delete: {
		action: (electro, state, ...args) => {
			state.type = methodTypes.DELETE;
			let remaining = electro._fulfillParts(state, methodTypes.DELETE, ...args);
			if (remaining > 0) {
				throw new Error(
					`DELETE method requires that all key parts are provided. Remaining keys are ${state.parts.remaining
						.map(part => part.name)
						.join(", ")}`,
				);
			}
		},
		children: ["go", "params"],
	},
	find: {
		action: (electro, state, ...args) => {
			state.type = methodTypes.QUERY;
			electro._fulfillParts(state, methodTypes.QUERY, ...args);
		},
		children: ["between", "gt", "gte", "lt", "lte", "params", "go"],
	},
	between: {
		action: (electro, state, ...args) => {
			state.type = methodTypes.QUERY;
			state.query = queryTypes.BETWEEN;
			electro._branchPart(state, queryTypes.BETWEEN, ...args);
		},
		children: ["and"],
	},
	and: {
		action: (electro, state, ...args) => {
			state.type = methodTypes.QUERY;
			state.query = queryTypes.BETWEEN;
			electro._branchPart(state, queryTypes.AND, ...args);
		},
		children: ["go", "params"],
	},
	gt: {
		action: (electro, state, ...args) => {
			state.type = methodTypes.QUERY;
			state.query = queryTypes.GT;
			electro._fulfillParts(state, queryTypes.GT, ...args);
		},
		children: ["go", "params"],
	},
	gte: {
		action: (electro, state, ...args) => {
			state.type = methodTypes.QUERY;
			state.query = queryTypes.GTE;
			electro._fulfillParts(state, queryTypes.GTE, ...args);
		},
		children: ["go", "params"],
	},
	lt: {
		action: (electro, state, ...args) => {
			state.type = methodTypes.QUERY;
			state.query = queryTypes.LT;
			electro._fulfillParts(state, queryTypes.LT, ...args);
		},
		children: ["go", "params"],
	},
	lte: {
		action: (electro, state, ...args) => {
			state.type = methodTypes.QUERY;
			state.query = queryTypes.LTE;
			electro._fulfillParts(state, queryTypes.LTE, ...args);
		},
		children: ["go", "params"],
	},
	set: {
		action: (electro, state, data = {}) => {
			state.update.set = Object.assign({}, state.update.set, data);
		},
		children: ["set", "go", "params"],
	},
	data: {
		action(electro, state, data) {
			state.put.data = Object.assign({}, state.put.data, data);
		},
		children: ["go", "params"],
	},
	params: {
		action: (electro, state, options) => {
			let params = electro._makeParams(state, options);
			if (params.IndexName === _internal.__main__) {
				delete params.IndexName;
			}
			return params;
		},
		children: [],
	},
	go: {
		action: (electro, state, options = {}) => {
			let method = state.type;
			let params = electro._makeParams(state, options);
			if (params.IndexName === _internal.__main__) {
				delete params.IndexName;
			}
			return electro._go(method, params, options);
		},
		children: [],
	},
};

const _internal = {
	__main__: "__main__",
};

const AttributeTypes = ["string", "number", "boolean", "enum"];

const utilities = {
	_filterUndefined: function(values = []) {
		return values.filter(value => value !== undefined);
	},
};

class Entity {
	constructor(schema, client) {
		this._validateSchema(schema);
		this.schema = this._parseSchema(schema);
		this.client = client;
		this._clauses = clauses;
		for (let accessPattern in this.schema.indexes) {
			this[accessPattern] = this._buildAccessPattern(accessPattern);
		}
	}

	put(attributes = {}) {
		let keys = this._makeKeysFromAttributes(attributes);
		let item = {
			...attributes,
			...keys
		};
		return {
			params: () => this._makeCreateParams([], item),
			go: (options) => {
				return this._go(methodTypes.PUT, this._makeCreateParams([], item), options)
			}
		};
	}

	get(facets = {}) {
		return this._methodOnMain(facets, methodTypes.GET);
	}

	delete(facets = {}) {
		return this._methodOnMain(facets, methodTypes.DELETE);
	}

	update(facets = {}) {
		return this._methodOnMain(facets, methodTypes.UPDATE);
	}

	_methodOnMain(facets = {}, method) {
		if (typeof facets !== "object" || !Object.keys(facets).length) {
			throw new Error("Invalid facet object");
		}
		let index = _internal.__main__;
		let accessPattern = this.schema.translations.indexes.accessPatternFromIndex[index];
		let {pk, sk} = this._orderedFacetsFromObject(facets, index);
		return this._buildAccessPattern(accessPattern)(...pk)[method](...sk);
	}

	_validateUniqueKeys(obj) {
		// used to find duplicates when case is removed;
		let seenKeys = {};
		let duplicateKeys = {};
		for (let key in obj) {
			let name = key.toLowerCase();
			if (seenKeys[name]) {
				duplicateKeys[name] = duplicateKeys[name] || [seenKeys[name]];
				duplicateKeys[name].push(key);
			} else {
				seenKeys[name] = [key];
			}
		}
		if (Object.values(duplicateKeys).length) {
			let message = Object.entries(duplicateKeys).map(([key, value]) => {
				return `Property "${key}" has ${value.length} duplicates with the following properties: ${value.join(", ")}`;
			}).join(", ");
			throw new Error(message);
		}
	}

	_orderedFacetsFromObject(facets = {}, index) {
		// this._validateUniqueKeys(facets);
		let parts = {
			all: [],
			pk: [],
			sk: []
		};
		let missingFacets = [];

		this.schema.translations.keys.parts
			.filter(part => part.index === index)
			.forEach((part) => {
				let facet;
				let type;
				for (let [key, value] of Object.entries(facets)) {
					if (key.toLowerCase() === part.name.toLowerCase()) {
						facet = value;
						type = part.type;
						break;
					}
				}
				if (facet) {
					parts.all.push(facet);
					parts[type].push(facet);
				} else {
					missingFacets.push(part.name);
				}
			});
		if (missingFacets.length) {
			throw new Error(`Missing key facets: ${missingFacets.join(", ")}`)
		} else {
			return parts;
		}
	}

	async _go(method, params = {}, options = {}) {
		let config = {
			includeKeys: options.includeKeys,
			originalErr: options.originalErr,
			raw: options.raw,
		};

		let stackTrace = new Error();
		return this.client[method](params)
			.promise()
			.then(response => {
				if (method === "put") {
					return params.Item;
				} else {
					return response;
				}
			})
			.then(data => {
				if (data.Item) {
					data.Item = this._cleanseRetrievedData(data.Item, config);
					return data;
				} else if (data.Items) {
					data.Items = data.Items.map(item =>
						this._cleanseRetrievedData(item, config),
					);
					return data;
				} else {
					return this._cleanseRetrievedData(data, config);
				}
			})
			.then(data => {
				if (options.raw) {
					return data;
				}
				if (data.Item) {
					return data.Item;
				} else if (data.Items) {
					return data.Items;
				} else {
					return data;
				}
			})
			.catch(err => {
				if (config.originalErr) {
					return Promise.reject(err);
				} else {
					stackTrace.message = err.message;
					return Promise.reject(stackTrace);
				}
			});
	}

	_makeParams(state = {}, options) {
		state.params = {};
		let mainPK = this._makePk(_internal.__main__, state.parts.fulfilled);
		let mainSK = this._makeSk(_internal.__main__, state.parts.fulfilled);
		switch (state.type) {
			case "get":
				return this._makeGetParams(mainPK, mainSK);
			case "delete":
				return this._makeDeleteParams(mainPK, mainSK);
			case "update":
				return this._makeUpdateParams(mainPK, mainSK, state.update.set);
			case "query":
				let pk1 = this._makePk(state.index, state.parts.fulfilled);
				let sk1 = this._makeSk(state.index, [
					...state.parts.fulfilled,
					...(state.parts.branched[0] || []),
				]);
				let sk2 = this._makeSk(state.index, [
					...state.parts.fulfilled,
					...(state.parts.branched[1] || []),
				]);
				return this._makeQueryParams(state, options, pk1, sk1, sk2);
			case "put":
				return this._makeCreateParams(state.parts.fulfilled, state.put.data);
			default:
				throw new Error(`Unknown query type: ${state.type}`);
		}
	}

	_makeQueryParams({ accessPattern, query } = {}, options, pk, sk, sk2) {
		switch (query) {
			case "between":
				return this._makeBetweenQueryParams(accessPattern, pk, sk, sk2);
			case "gte":
				return this._makeComparisonQueryParams(accessPattern, pk, sk, query);
			case "gt":
				return this._makeComparisonQueryParams(accessPattern, pk, sk, query);
			case "lt":
				return this._makeComparisonQueryParams(accessPattern, pk, sk, query);
			case "lte":
				return this._makeComparisonQueryParams(accessPattern, pk, sk, query);
			default:
				return this._makeBeginsWithQueryParams(accessPattern, pk, sk);
		}
	}

	_parseSchema(schema) {
		let { service, entity, table, version = "1" } = schema;
		let {
			indexes,
			keyParts,
			keyAttributes,
			keyTranslation,
			translateForIndexName,
			translateForAccessPattern,
		} = this._normalizeIndexes(schema.indexes);
		let {
			attributes,
			enums,
			translationForTable,
			translationForRetrieval,
		} = this._normalizeAttributes(schema.attributes, keyAttributes);
		return {
			service,
			version,
			entity,
			table,
			attributes,
			indexes,
			keyParts,
			enum: {
				attributes: {
					...enums,
				},
				keys: keyAttributes,
			},
			translations: {
				keys: {
					attrs: keyTranslation,
					parts: keyParts,
				},
				attr: {
					fromNameToTable: translationForTable,
					fromTableToName: translationForRetrieval,
				},
				comparisons,
				indexes: {
					indexFromAccessPattern: translateForAccessPattern,
					accessPatternFromIndex: translateForIndexName,
				},
			},
			original: schema,
		};
	}

	_translateAttributesForStorage(data) {
		let attributes = {};
		for (let attribute in data) {
			attributes[this.schema.translations.attr.fromNameToTable[attribute]] =
				data[attribute];
		}
		return attributes;
	}

	_translateAttributesForResponse(data) {
		let attributes = {};
		for (let attribute in data) {
			attributes[this.schema.translations.attr.fromTableToName[attribute]] =
				data[attribute];
		}
		return attributes;
	}

	_makeGetParams(pk, sk) {
		let params = {
			TableName: this.schema.table,
			Key: this._makeParamKeys(pk, sk),
		};
		return params;
	}

	_makeBeginsWithQueryParams(accessPattern, pk, sk, filter = {}) {
		let index = this.schema.translations.indexes.indexFromAccessPattern[accessPattern];
		let {
			ExpressionAttributeNames,
			ExpressionAttributeValues,
		} = this._queryKeyExpressionAttributeBuilder(index, pk, sk);
		let params = {
			ExpressionAttributeNames,
			ExpressionAttributeValues,
			IndexName: index,
			TableName: this.schema.table,
			KeyConditionExpression: `#pk = :pk and begins_with(#sk1, :sk1)`,
		};
		return params;
	}

	_makeComparisonQueryParams(accessPattern, pk, sk, comparison, filter = {}) {
		let operator = this.schema.translations.comparisons[comparison];
		if (!operator) {
			throw new Error(
				`Unexpected comparison operator "${comparison}", expected ${Object.values(
					this.schema.translations.comparisons,
				).join(", ")}`,
			);
		}
		let index = this.schema.translations.indexes.indexFromAccessPattern[accessPattern];
		let {
			ExpressionAttributeNames,
			ExpressionAttributeValues,
		} = this._queryKeyExpressionAttributeBuilder(index, pk, sk);
		let params = {
			ExpressionAttributeNames,
			ExpressionAttributeValues,
			IndexName: index,
			TableName: this.schema.table,
			KeyConditionExpression: `#pk = :pk and #sk1 ${operator} :sk1`,
		};
		return params;
	}

	_makeBetweenQueryParams(accessPattern, pk, sk1, sk2, filter = {}) {
		let index = this.schema.translations.indexes.indexFromAccessPattern[accessPattern];
		let {
			ExpressionAttributeNames,
			ExpressionAttributeValues,
		} = this._queryKeyExpressionAttributeBuilder(index, pk, sk1, sk2);
		let params = {
			ExpressionAttributeNames,
			ExpressionAttributeValues,
			IndexName: index,
			TableName: this.schema.table,
			KeyConditionExpression: `#pk = :pk and #sk1 BETWEEN :sk1 AND :sk2`,
		};
		return params;
	}

	_makeDeleteParams(pk, sk) {
		let params = {
			TableName: this.schema.table,
			Key: this._makeParamKeys(pk, sk),
		};
		return params;
	}

	_makeCreateParams(facets = [], data = {}) {
		let record = {
			...data,
		};
		for (let {name, value} of facets) {
			record[name] = value;
		}

		let validAttributes = this._checkAttributes(record);
		let translatedAttributes = this._translateAttributesForStorage(
			validAttributes,
		);
		let composedKeys = this._makeKeysFromAttributes(validAttributes);
		let params = {
			Item: {
				...translatedAttributes,
				...composedKeys,
			},
			TableName: this.schema.table,
		};
		return params;
	}

	_makeUpdateParams(pk, sk, data) {
		let validAttributes = this._checkPartialAttributes(data);
		let translatedAttributes = this._translateAttributesForStorage(
			validAttributes,
		);
		let composedKeys = this._makeKeysFromAttributes(validAttributes);
		let item = {
			...translatedAttributes,
			...composedKeys,
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
			TableName: this.schema.table,
			Key: this._makeParamKeys(pk, sk),
		};
		return params;
	}

	_makeParamKeys(pk, sk, index = _internal.__main__) {
		let keyNames = this.schema.translations.keys.attrs[index];
		return {
			[keyNames.pk]: pk,
			[keyNames.sk]: sk,
		};
	}

	_updateExpressionBuilder(data = {}) {
		let skip = Object.values(
			this.schema.translations.keys.attrs[_internal.__main__],
		);
		return this._expressionAttributeBuilder(data, { skip });
	}

	_queryKeyExpressionAttributeBuilder(index, pk, ...sks) {
		let translate = { ...this.schema.translations.keys.attrs[index] };
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

	_expressionAttributeBuilder(item = {}, options = {}) {
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

	_buildAccessPattern(accessPattern) {
		return (...args) => {
			let index = this.schema.translations.indexes.indexFromAccessPattern[accessPattern];
			let parts = [];
			let pkParts = [];
			let skParts = [];
			for (let part of this.schema.keyParts) {
				if (part.index === index) {
					parts.push(part);
					if (part.type === "pk") {
						pkParts.push(part);
					} else {
						skParts.push(part);
					}
				}
			}
			let state = {
				index,
				accessPattern,
				type: "",
				query: "",
				update: {
					set: {},
				},
				put: {
					data: {},
				},
				parts: {
					remaining: parts,
					fulfilled: [],
					branched: [],
					pkParts,
					skParts,
				},
				params: {
					TableName: this.schema.table,
				},
			};
			clauses.index.action(this, state, ...args);
			return this._makeIndexProxy(this, state, clauses.index.children, clauses);
		};
	}

	_makeIndexProxy(electro, state, children = [], clauses) {
		let clause = {};
		for (let child of children) {
			clause[child] = (...args) => {
				let results = clauses[child].action(electro, state, ...args);
				if (clauses[child].children.length) {
					return this._makeIndexProxy(
						electro,
						state,
						clauses[child].children,
						clauses,
					);
				} else {
					return results;
				}
			};
		}
		return clause;
	}

	_makePk(index, fulfilled) {
		let keys = this.schema.keyParts.filter(
			part => part.type === "pk" && part.index === index,
		);
		let parts = {};
		fulfilled.forEach(part => {
			let match = keys.find(
				key => key.name.toLowerCase() === part.name.toLowerCase(),
			);
			if (match) {
				parts[part.name] = part;
			}
		});
		let prefix = `$${this.schema.service}_${this.schema.version}#`;
		return this._makeKey(prefix, keys, parts);
	}

	_makeSk(index, fulfilled) {
		let keys = this.schema.keyParts.filter(
			part => part.type === "sk" && part.index === index,
		);
		let parts = {};
		fulfilled.forEach(part => {
			let match = keys.find(
				key => key.name.toLowerCase() === part.name.toLowerCase(),
			);
			if (match) {
				parts[part.name] = part;
			}
		});
		let prefix = `$${this.schema.entity}#`;
		return this._makeKey(prefix, keys, parts);
	}

	_makeKey(prefix, keyParts, parts) {
		let key = prefix;
		for (let i = 0; i < keyParts.length; i++) {
			let keyPart = keyParts[i];
			key = `${key}${keyPart.label}`;
			if (parts[keyPart.name]) {
				key = `${key}${parts[keyPart.name].value}`;
			} else {
				break;
			}
		}
		return key;
	}

	_makeKeysFromAttributes(attributes) {
		let keys = {};
		for (let part of this.schema.keyParts) {
			if (!attributes[part.name]) {
				continue;
			}
			keys[part.attr] = keys[part.attr] || {};
			keys[part.attr].parts = keys[part.attr].parts || [];
			keys[part.attr].type = part.type;
			keys[part.attr].index = part.index;
			keys[part.attr].parts.push({
				...part,
				type: part.type,
				value: attributes[part.name],
			});
		}
		for (let attribute in keys) {
			let { type, index, parts } = keys[attribute] || {};
			if (type === "pk") {
				keys[attribute] = this._makePk(index, parts);
			} else if (type === "sk") {
				keys[attribute] = this._makeSk(index, parts);
			} else {
				continue;
			}
		}
		return keys;
	}

	_fulfillPk(state, ...keys) {
		keys = utilities._filterUndefined(keys);
		if (keys.length < state.parts.pkParts.length) {
			throw new Error(
				`Params passed to ENTITY method, must only include ${state.parts.pkParts
					.map(part => part.name)
					.join(", ")}`,
			);
		} else if (keys.length > state.parts.pkParts.length) {
			throw new Error(
				`Too many params passed to ENTITY method, expecting only: ${state.parts.pkParts
					.map(part => part.name)
					.join(", ")}`,
			);
		}
		this._fulfillParts(state, "entity", ...keys);
	}

	_fulfillParts(state, type, ...values) {
		let unusedValues = [];
		for (let value of values) {
			let part = state.parts.remaining.shift();
			if (part === undefined) {
				unusedValues.push({ value, type });
			} else {
				state.parts.fulfilled.push({
					...part,
					value,
					type,
				});
			}
		}
		if (unusedValues.length) {
			let message = unusedValues
				.map(
					({ value, type }) =>
						`The value "${value}" used by the ${type.toUpperCase()} method will not be used because the PK and SK for this record are already fulfilled.`,
				)
				.join(", ");
			throw new Error(message);
		}
		return state.parts.remaining.length;
	}

	_branchPart(state, type, ...values) {
		state.branchType = state.branchType || type;
		let branch = [];
		for (let i = 0; i < values.length; i++) {
			let part = state.parts.remaining[i];
			if (part === undefined) {
				throw new Error(
					`The values used by the ${type.toUpperCase()} method will not be used as the PK and SK for this record are already fulfilled.`,
				);
			} else {
				branch.push({
					...part,
					value: values[i],
					type,
				});
			}
		}
		if (branch.length) {
			state.parts.branched.push(branch);
		}
		return state.parts.remaining.length - state.parts.branched.length;
	}

	_validateSchema(schema) {}

	_normalizeIndexes(indexes) {
		let normalized = {};
		let keyAttributes = [];
		let keyTranslation = {};
		let keyParts = [];
		let translateForAccessPattern = {};
		let translateForIndexName = {};

		for (let accessPattern in indexes) {
			let index = indexes[accessPattern];
			let pkType = "pk";
			let skType = "sk";
			let pkAttr = index.pk.attr || pkType;
			let skAttr = index.sk.attr || skType;
			let indexName = index.index || _internal.__main__;
			let definition = {
				index: indexName,
				pk: {
					accessPattern,
					index: indexName,
					type: "pk",
					attr: pkAttr,
					compose: index.pk.compose,
				},
				sk: {
					accessPattern,
					index: indexName,
					type: "sk",
					attr: skAttr,
					compose: index.sk.compose,
				},
			};
			translateForAccessPattern[accessPattern] = indexName;
			translateForIndexName[indexName] = accessPattern;
			keyTranslation[indexName] = { pk: pkAttr, sk: skAttr, index };
			keyAttributes.push(definition.pk.attr);
			keyAttributes.push(definition.sk.attr);
			keyParts = [
				...keyParts,
				...this._parseKey(
					definition.pk.compose,
					pkAttr,
					indexName,
					accessPattern,
					pkType,
				),
				...this._parseKey(
					definition.sk.compose,
					skAttr,
					indexName,
					accessPattern,
					skType,
				),
			];
			normalized[accessPattern] = definition;
		}

		return {
			keyParts,
			translateForIndexName,
			translateForAccessPattern,
			indexes: normalized,
			keyAttributes: keyAttributes,
			keyTranslation: keyTranslation,
		};
	}

	_normalizeAttributes(attributes = {}, keyAttr = []) {
		let invalidProperties = [];
		let normalized = {};
		let usedAttrs = {};
		let enums = {};
		let translationForTable = {};
		let translationForRetrieval = {};

		for (let name in attributes) {
			let attribute = attributes[name];
			if (keyAttr.includes(name)) {
				continue;
			}
			if (attribute.attr && keyAttr.includes(attribute.attr)) {
				continue;
			}
			let definition = {
				name,
				required: !!attribute.required,
				attr: attribute.attr || name,
				hide: !!attribute.hide,
				default: attribute.default,
				validate: attribute.validate,
			};
			if (Array.isArray(attribute.type)) {
				definition.type = "enum";
				definition.enumArray = [...attribute.type];
				enums[definition.name] = [...attribute.type];
			} else {
				definition.type = attribute.type || "string";
			}
			let isValidType = AttributeTypes.includes(definition.type);
			if (!isValidType) {
				invalidProperties.push({
					name,
					property: "type",
					value: definition.type,
					expected: AttributeTypes.join(", "),
				});
			}
			if (usedAttrs[definition.attr] || usedAttrs[name]) {
				invalidProperties.push({
					name,
					property: "attr",
					value: definition.attr,
					expected: `Unique attr property, already used by attribute ${
						usedAttrs[definition.attr]
					}`,
				});
			} else {
				usedAttrs[definition.attr] = definition.name;
			}
			translationForTable[definition.name] = definition.attr;
			translationForRetrieval[definition.attr] = definition.name;
			normalized[name] = definition;
		}
		if (invalidProperties.length) {
			let message = invalidProperties.map(
				prop =>
					`Schema Validation Error: Attribute "${prop.name}" property "${prop.property}". Received: "${prop.value}", Expected: "${prop.expected}"`,
			);
			throw new Error(message);
		} else {
			return {
				enums,
				translationForTable,
				translationForRetrieval,
				attributes: normalized,
			};
		}
	}

	_buildKeyParts(indexes = {}) {
		let keyParts = [];
		for (let accessPattern in indexes) {
			let keys = indexes[accessPattern];
			keyParts = [
				...keyParts,
				...this._parseKey(
					keys.pk.compose,
					keys.pk.attr,
					keys.index,
					accessPattern,
					"pk",
				),
				...this._parseKey(
					keys.sk.compose,
					keys.sk.attr,
					keys.index,
					accessPattern,
					"sk",
				),
			];
		}
		return keyParts;
	}

	_parseKey(key = "", attr = "", index = "", accessPattern = "", type = "") {
		let parts = [];
		let names = key.match(/:[A-Z]*/gi);
		let labels = key.split(/:[A-Z]*/gi);
		for (let i = 0; i < names.length; i++) {
			let name = names[i].replace(":", "");
			let label = labels[i];
			if (name !== "") {
				parts.push({ name, label, type, attr, index, accessPattern });
			}
		}
		return parts;
	}

	_validateAttribute(value, definition) {
		let isValid = false;
		if (definition.validate) {
			if (definition.validate instanceof RegExp) {
				isValid = definition.validate.test(value);
			} else if (typeof definition.validate === "function") {
				isValid = !!definition.validate(value);
			}
		} else {
			isValid = true;
		}
		return isValid;
	}

	_setAttributeDefault(value, definition) {
		if (value === undefined && definition.default !== undefined) {
			if (typeof definition.default === "function") {
				return definition.default();
			} else {
				return definition.default;
			}
		} else {
			return value;
		}
	}

	_checkAttributeType(value, definition) {
		switch (definition.type) {
			case "string":
				return typeof value === "string";
			case "number":
				return typeof value === "number";
			case "boolean":
				return typeof value === "boolean";
			case "enum":
				return definition.enumArray.includes(value);
			default:
				return typeof value === "string";
		}
	}

	_checkAttributes(data = {}) {
		let placeholderError = new Error("");
		let failures = [];
		let result = {};
		for (let property in this.schema.attributes) {
			let definition = this.schema.attributes[property];
			let value = this._setAttributeDefault(data[property], definition);
			let error = this._checkValue(property, value);
			if (error) {
				failures.push(error);
			} else if (value !== undefined) {
				result[property] = value;
			} else {
				continue;
			}
		}
		if (failures.length) {
			let message = failures.join(", ");
			placeholderError.message = message;
			throw placeholderError;
		}
		return result;
	}

	_checkValue(name, value) {
		let definition = this.schema.attributes[name];
		if (!definition) {
			return `Validation Error: The attribute "${name}" is not defined in the entity schema.`;
		}
		if (value === undefined) {
			if (definition.required) {
				return `Validation Error: The attribute "${name}" is required to have a value but recieved "undefined"`;
			}
		} else {
			let isValidType = this._checkAttributeType(value, definition);
			let customValidation = false;
			try {
				customValidation = this._validateAttribute(value, definition);
			} catch (err) {
				return `Custom Validation Error: ${err.message}`;
			}

			if (!isValidType) {
				return `Validation Error: The attribute "${name}" is not of the correct type ${definition.type}`;
			} else if (!customValidation) {
				return `Validation Error: The attribute "${name}" did not pass custom validation`;
			} else {
				return "";
			}
		}
	}

	_checkPartialAttributes(data = {}) {
		let placeholderError = new Error("");
		let failures = [];
		let result = {};
		for (let property in data) {
			let value = data[property];
			let error = this._checkValue(property, value);
			if (error) {
				failures.push(error);
			} else {
				result[property] = value;
			}
		}
		if (failures.length) {
			let message = failures.join(", ");
			placeholderError.message = message;
			throw placeholderError;
		}
		return result;
	}

	_cleanseRetrievedData(item = {}, options = {}) {
		let { includeKeys } = options;
		let data = {};
		let names = this.schema.translations.attr.fromTableToName;
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
}

module.exports = {
	Entity,
	clauses,
	comparisons,
	methodTypes,
	queryTypes
};
