const {MethodTypes, ExpressionTypes} = require("./types");
const e = require("./errors");
const {AttributeOperationProxy} = require("./operations")

class WhereFactory {
  constructor(attributes = {}, filterTypes = {}) {
    this.attributes = {...attributes};
    this.filters = {...filterTypes};
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
		if (typeof existingExpression === "string" && existingExpression.length > 0) {
			existingExpression = this._cleanUpExpression(existingExpression);
			newExpression = this._cleanUpExpression(newExpression);
			let isEmpty = this._isEmptyExpression(newExpression);
			if (isEmpty) {
				return existingExpression;
			}
			let existingNeedsParens = !existingExpression.startsWith("(") && !existingExpression.endsWith(")");
			if (existingNeedsParens) {
				existingExpression = `(${existingExpression})`;
			}
			return `${existingExpression} AND ${newExpression}`;
		} else {
			return newExpression;
		}
	}

	getExpressionType(methodType) {
		switch (methodType) {
			case MethodTypes.put:
			case MethodTypes.create:
			case MethodTypes.update:
			case MethodTypes.patch:
			case MethodTypes.delete:
			case MethodTypes.remove:
				return ExpressionTypes.ConditionExpression
			default:
				return ExpressionTypes.FilterExpression
		}
	}

  buildClause(filterFn) {
		return (entity, state, ...params) => {
			const proxy = new AttributeOperationProxy(state, this.attributes, this.filters);
			const results = proxy.invokeCallback(filterFn, ...params);
			if (typeof results !== "string") {
				throw new e.ElectroError(e.ErrorCodes.InvalidWhere, "Invalid response from where clause callback. Expected return result to be of type string");
			}
			const type = this.getExpressionType(state.query.method);
			const expression = this._concatFilterExpression(
				state.expressions.getExpression(type),
				results,
			)
			state.expressions.setExpression(type, expression);
			return state;
		};
  }

  injectWhereClauses(clauses = {}, filters = {}) {
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
				children: ["params", "go", "page", "where", ...modelFilters],
			};
		}
		filterChildren.push("where");
		injected["where"] = {
			action: (entity, state, fn) => {
				return this.buildClause(fn)(entity, state);
			},
			children: ["params", "go", "page", "where", ...modelFilters],
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

module.exports = {
  WhereFactory
};
