const e = require("./errors");
const {MethodTypes, ExpressionTypes} = require("./types");

let FilterTypes = {
	eq: {
		template: function eq(name, value) {
			return `${name} = ${value}`;
		},
		strict: false,
	},
	gt: {
		template: function gt(name, value) {
			return `${name} > ${value}`;
		},
		strict: false
	},
	lt: {
		template: function lt(name, value) {
			return `${name} < ${value}`;
		},
		strict: false
	},
	gte: {
		template: function gte(name, value) {
			return `${name} >= ${value}`;
		},
		strict: false
	},
	lte: {
		template: function lte(name, value) {
			return `${name} <= ${value}`;
		},
		strict: false
	},
	between: {
		template: function between(name, value1, value2) {
			return `(${name} between ${value1} and ${value2})`;
		},
		strict: false
	},
	begins: {
		template: function begins(name, value) {
			return `begins_with(${name}, ${value})`;
		},
		strict: false
	},
	exists: {
		template: function exists(name) {
			return `attribute_exists(${name})`;
		},
		strict: false
	},
	notExists: {
		template: function notExists(name) {
			return `attribute_not_exists(${name})`;
		},
		strict: false
	},
	contains: {
		template: function contains(name, value) {
			return `contains(${name}, ${value})`;
		},
		strict: false
	},
	notContains: {
		template: function notContains(name, value) {
			return `not contains(${name}, ${value})`;
		},
		strict: false
	},
	value: {
		template: function(name, value) {
			return value;
		},
		strict: false
	},
	name: {
		template: function(name) {
			return name;
		},
		strict: false
	}
};

class FilterFactory {
	constructor(attributes = {}, filterTypes = {}) {
		this.attributes = { ...attributes };
		this.filters = {
			...filterTypes,
		};
	}

	getExpressionType(methodType) {
		switch (methodType) {
			case MethodTypes.put:
			case MethodTypes.create:
			case MethodTypes.update:
			case MethodTypes.patch:
			case MethodTypes.delete:
				return ExpressionTypes.ConditionExpression
			default:
				return ExpressionTypes.FilterExpression
		}
	}

	_buildFilterAttributes(setName, setValue, getValueCount) {
		let attributes = {};
		for (let [name, attribute] of Object.entries(this.attributes)) {
			let filterAttribute = {};
			for (let [type, {strict, template}] of Object.entries(this.filters)) {
				Object.defineProperty(filterAttribute, type, {
					get: () => {
						return (...values) => {
							let attrName = `#${name}`;
							setName(attrName, attribute.field);
							let attrValues = [];
							for (let value of values) {
								let valueCount = getValueCount(name);
								let attrValue = `:${name}${valueCount}`;
								if (template.length > 1) {
									setValue(attrValue, value);
									attrValues.push(attrValue);
								}
							}
							let expression = template(attrName, ...attrValues);
								return expression.trim();
						};
					},
				});
			}
			attributes[name] = filterAttribute;
		}
		return attributes;
	}

	_concatFilterExpression(existingExpression = "", newExpression = "") {
		if (typeof existingExpression === "string" && existingExpression.length) {
			existingExpression = existingExpression.replace(/\n|\r/g, "").trim();
			newExpression = newExpression.replace(/\n|\r/g, "").trim();
			let existingNeedsParens =
				!existingExpression.startsWith("(") &&
				!existingExpression.endsWith(")");
			let newNeedsParens =
				!newExpression.startsWith("(") && !newExpression.endsWith(")");
			if (existingNeedsParens) {
				existingExpression = `(${existingExpression})`;
			}
			return `${existingExpression} AND ${newExpression}`;
		} else {
			return newExpression;
		}
	}

	buildClause(filterFn) {
		return (entity, state, ...params) => {
			let expressionType = this.getExpressionType(state.query.method);
			state.query.filter.ExpressionAttributeNames =
				state.query.filter.ExpressionAttributeNames || {};
			state.query.filter.ExpressionAttributeValues =
				state.query.filter.ExpressionAttributeValues || {};
			state.query.filter.valueCount = state.query.filter.valueCount || {};
			let getValueCount = name => {
				if (state.query.filter.valueCount[name] === undefined) {
					state.query.filter.valueCount[name] = 1;
				}
				return state.query.filter.valueCount[name]++;
			};
			let setName = (name, value) => {
				console.log({name, value});
					state.query.filter.ExpressionAttributeNames[name] = value
			};
			let setValue = (name, value) =>
				(state.query.filter.ExpressionAttributeValues[name] = value);
			let attributes = this._buildFilterAttributes(
				setName,
				setValue,
				getValueCount,
			);
			let expression = filterFn(attributes, ...params);
			if (typeof expression !== "string") {
				throw new e.ElectroError(e.ErrorCodes.InvalidFilter, "Invalid filter response. Expected result to be of type string");
			}
			state.query.filter[expressionType] = this._concatFilterExpression(
				state.query.filter[expressionType],
				expression,
			);
			return state;
		};
	}

	injectFilterClauses(clauses = {}, filters = {}) {
		let injected = { ...clauses };
		let filterParents = Object.entries(injected)
			.filter(clause => {
				let [name, { children }] = clause;
				return children.includes("go");
			})
			.map(([name]) => name);
		let modelFilters = Object.keys(filters);
		let filterChildren = [];
		for (let [name, filter] of Object.entries(filters)) {
			filterChildren.push(name);
			injected[name] = {
				action: this.buildClause(filter),
				children: ["params", "go", "page", "filter", ...modelFilters],
			};
		}
		filterChildren.push("filter");
		injected["filter"] = {
			action: (entity, state, fn) => {
				return this.buildClause(fn)(entity, state);
			},
			children: ["params", "go", "page", "filter", ...modelFilters],
		};
		for (let parent of filterParents) {
			injected[parent] = { ...injected[parent] };
			injected[parent].children = [
				...filterChildren,
				...injected[parent].children,
			];
		}
		return injected;
	}
}

module.exports = { FilterFactory, FilterTypes };
