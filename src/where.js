const __is_clause__ = Symbol("IsWhereClause");
const {MethodTypes, ExpressionTypes} = require("./types");

function attributeProxy(path, attr, setName) {
  return new Proxy(() => ({path, attr}), {
    get: (target, prop, receiver) => {
      if (prop === "__is_clause__") {
        return __is_clause__
      } else if (isNaN(prop)) {
        setName(`#${prop}`, prop);
        return attributeProxy(`${path}.#${prop}`, attr, setName);
      } else {
        return attributeProxy(`${path}[${prop}]`, attr, setName);
      }
    }
  });
}

class WhereFactory {
  constructor(attributes = {}, filterTypes = {}) {
    this.attributes = {...attributes};
    this.filters = {...filterTypes};
  }

  _buildAttributes(setName) {
    let attributes = {};
		for (let name of Object.keys(this.attributes)) {
      Object.defineProperty(attributes, name, {
        get: () => {
          let path = `#${name}`;
          setName(path, name);
          return attributeProxy(path, name, setName);
        }
      }) 
    }
    return attributes;
  }

  _buildOperations(setName, setValue, getValueCount) {
    let operations = {};
    for (let type of Object.keys(this.filters)) {
      let {template} = this.filters[type];
      Object.defineProperty(operations, type, {
        get: () => {
          return (property, ...values) => {
						if (property === undefined) {
							throw new Error(`Invalid/Unknown property passed in where clause passed to operation: '${type}'`);
						}
            if (property.__is_clause__ === __is_clause__) {
              let {path, attr} = property();
              let attrValues = [];
              for (let value of values) {
								let valueCount = getValueCount(attr);
								let attrValue = `:${attr}_w${valueCount}`;
								if (template.length > 1) {
									setValue(attrValue, value);
									attrValues.push(attrValue);
								}
							}
              let expression = template(path, ...attrValues);
              return expression.trim();
            } else if (typeof property === "string") {
              // todo: parse string
            } else {
              // todo: proper error logging.
              throw new Error("INVALID PROPERTY")
            }
          }
        }
      })
    }
    return operations; 
  }

  _concatFilterExpression(existingExpression = "", newExpression = "") {
		if (typeof existingExpression === "string" && existingExpression.length) {
			existingExpression = existingExpression.replace(/\n|\r/g, "").trim();
			newExpression = newExpression.replace(/\n|\r/g, "").trim();
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
				return ExpressionTypes.ConditionExpression
			default:
				return ExpressionTypes.FilterExpression
		}
	}
  
  buildClause(filterFn) {
		return (entity, state, ...params) => {
			let expressionType = this.getExpressionType(state.query.method);
			state.query.filter.ExpressionAttributeNames = state.query.filter.ExpressionAttributeNames || {};
			state.query.filter.ExpressionAttributeValues = state.query.filter.ExpressionAttributeValues || {};
			state.query.filter.valueCount = state.query.filter.valueCount || {};
			let getValueCount = name => {
				if (state.query.filter.valueCount[name] === undefined) {
					state.query.filter.valueCount[name] = 1;
				}
				return state.query.filter.valueCount[name]++;
			};
			let setName = (name, value) => (state.query.filter.ExpressionAttributeNames[name] = value);
			let setValue = (name, value) => (state.query.filter.ExpressionAttributeValues[name] = value);
      let attributes = this._buildAttributes(setName);
      let operations = this._buildOperations(setName, setValue, getValueCount);
			let expression = filterFn(attributes, operations, ...params);
			if (typeof expression !== "string") {
				throw new Error("Invalid filter response. Expected result to be of type string");
			}
			state.query.filter[expressionType] = this._concatFilterExpression(
				state.query.filter[expressionType],
				expression,
			);
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