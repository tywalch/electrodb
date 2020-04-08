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
	eq: function eq(name, value) {
		return `${name} = ${value}`;
	},
	gt: function gt(name, value) {
		return `${name} > ${value}`;
	},
	lt: function lt(name, value) {
		return `${name} < ${value}`;
	},
	gte: function gte(name, value) {
		return `${name} >= ${value}`;
	},
	lte: function lte(name, value) {
		return `${name} <= ${value}`;
	},
	between: function between(name, value1, value2) {
		return `(${name} between ${value1} and ${value2})`;
	},
	begins: function begins(name, value) {
		return `begins_with(${name}, ${value})`;
	},
	exists: function exists(name, value) {
		return `exists(${name}, ${value})`;
	},
	notExists: function notExists(name, value) {
		return `not exists(${name}, ${value})`;
	},
	contains: function contains(name, value) {
		return `contains(${name}, ${value})`;
	},
	notContains: function notContains(name, value) {
		return `not contains(${name}, ${value})`;
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
			for (let [type, template] of Object.entries(this.filters)) {
				Object.defineProperty(filterAttribute, type, {
					get: () => {
						return (...values) => {
							let attrName = `#${name}`;
							setName(attrName, attribute.field);
							let attrValues = [];
							for (let value of values) {
								let [isValid, errMessage] = attribute.isValid(value);
								if (!isValid) {
									throw new Error(errMessage);
								}

								let valueCount = getValueCount(name);
								let attrValue = `:${name}${valueCount}`;
								setValue(attrValue, value);
								attrValues.push(attrValue);
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
