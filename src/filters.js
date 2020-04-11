let queryChildren = [
	"eq",
	"gt",
	"lt",
	"gte",
	"lte",
	"between",
	"begins",
	"exists",
	"notExists",
	"contains",
	"notContains",
];
let FilterTypes = {
	eq: {
		template: function eq(name, value) {
			return `${name} = ${value}`;
		},
		strict: true,
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
};

class FilterFactory {
	constructor(attributes = {}, filterTypes = {}) {
		this.attributes = { ...attributes };
		this.filters = {
			...filterTypes,
		};
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
								if (strict) {
									let [isValid, errMessage] = attribute.isValid(value);
									if (!isValid) {
										throw new Error(errMessage);
									}
								}

								let valueCount = getValueCount(name);
								let attrValue = `:${name}${valueCount}`;
								if (template.length > 1) {
									setValue(attrValue, value);
									attrValues.push(attrValue);
								}
							}
							let expression = template(attrName, ...attrValues);
							if (typeof expression !== "string") {
								throw new Error(
									"Invalid filter response. Expected result to be of type string",
								);
							} else {
								return expression.trim();
							}
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
			if (newNeedsParens) {
				newExpression = `(${newExpression})`;
			}
			return `${existingExpression} AND ${newExpression}`;
		} else {
			return newExpression;
		}
	}

	buildClause(filterFn) {
		return (entity, state, ...params) => {
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
			let setName = (name, value) =>
				(state.query.filter.ExpressionAttributeNames[name] = value);
			let setValue = (name, value) =>
				(state.query.filter.ExpressionAttributeValues[name] = value);
			let attributes = this._buildFilterAttributes(
				setName,
				setValue,
				getValueCount,
			);
			let expression = filterFn(attributes, ...params);
			state.query.filter.FilterExpression = this._concatFilterExpression(
				state.query.filter.FilterExpression,
				expression,
			);
			return state;
		};
	}
}

module.exports = { FilterFactory, FilterTypes };
