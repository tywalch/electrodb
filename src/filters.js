const e = require("./errors");
const {MethodTypes, ExpressionTypes} = require("./types");

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
			for (let [type, {template}] of Object.entries(this.filters)) {
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
							let expression = template(attribute, attrName, ...attrValues);
							return expression.trim();
						};
					},
				});
			}
			attributes[name] = filterAttribute;
		}
		return attributes;
	}

	_cleanUpExpression(value) {
		if (typeof value === "string" && value.length > 0) {
			return value.replace(/\n|\r/g, "").trim();
		}
		return ""
	}

	_isEmptyExpression(value) {
		if (typeof value !== "string") {
			throw new Error("Invalid expression value type. Expected type string.");
		}
		return !value.replace(/\n|\r|\w/g, "").trim();
	}

	_concatFilterExpression(existingExpression = "", newExpression = "") {
		if (typeof existingExpression === "string" && existingExpression.length) {
			existingExpression = this._cleanUpExpression(existingExpression);
			newExpression = this._cleanUpExpression(newExpression);
			let isEmpty = this._isEmptyExpression(newExpression);
			if (isEmpty) {
				return existingExpression;
			}
			let existingNeedsParens =
				!existingExpression.startsWith("(") &&
				!existingExpression.endsWith(")");
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
			const type = this.getExpressionType(state.query.method);
			const filter = state.query.filter[type];
			let getValueCount = (name) => filter.incrementName(name);
			let setName = (name, value, path) => filter.setName(name, value, path);
			let setValue = (name, value, path) => filter.setValue(name, value, path);
			let attributes = this._buildFilterAttributes(
				setName,
				setValue,
				getValueCount,
			);
			let result = filterFn(attributes, ...params);
			if (typeof result !== "string") {
				throw new e.ElectroError(e.ErrorCodes.InvalidFilter, "Invalid filter response. Expected result to be of type string");
			}
			const expression = this._concatFilterExpression(
				filter.getExpression(),
				result,
			)
			filter.setExpression(expression);
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

module.exports = { FilterFactory };
