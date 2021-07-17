const {AttributeTypes, ItemOperations, AttributeProxySymbol} = require("./types");
const e = require("./errors");

const deleteOperations = {
    template: function del(attr, path, value) {
        let operation = "";
        let expression = "";
        switch(attr.type) {
            case AttributeTypes.any:
            case AttributeTypes.set:
                operation = ItemOperations.delete;
                expression = `${path} ${value}`;
                break;
            default:
                throw new Error(`Invalid Update Attribute Operation: "DELETE" Operation can only be performed on attributes with type "set" or "any".`);
        }
        return {operation, expression};
    },
};

const UpdateOperations = {
    append: {
        template: function append(attr, path, value) {
            let operation = "";
            let expression = "";
            switch(attr.type) {
                case AttributeTypes.any:
                case AttributeTypes.list:
                    operation = ItemOperations.set;
                    expression = `${path} = list_append(${path}, ${value})`;
                    break;
                default:
                    throw new Error(`Invalid Update Attribute Operation: "APPEND" Operation can only be performed on attributes with type "list" or "any".`);
            }
            return {operation, expression, attr};
        }
    },
    add: {
        template: function add(attr, path, value) {
            let operation = "";
            let expression = "";
            switch(attr.type) {
                case AttributeTypes.set:
                case AttributeTypes.number:
                case AttributeTypes.any:
                    operation = ItemOperations.add;
                    expression = `${path} ${value}`;
                    break;
                default:
                    throw new Error(`Invalid Update Attribute Operation: "ADD" Operation can only be performed on attributes with type "number", "set", or "any".`);
            }
            return {operation, expression, attr};
        }
    },
    subtract: {
        template: function subtract(attr, path, value) {
            let operation = "";
            let expression = "";
            switch(attr.type) {
                case AttributeTypes.any:
                case AttributeTypes.number:
                    operation = ItemOperations.subtract;
                    expression = `${path} ${value}`;
                    break;
                default:
                    throw new Error(`Invalid Update Attribute Operation: "SUBTRACT" Operation can only be performed on attributes with type "number" or "any".`);
            }

            return {operation, expression};
        }
    },
    set: {
        template: function set(attr, path, value) {
            let operation = "";
            let expression = "";
            switch(attr.type) {
                case AttributeTypes.list:
                    operation = ItemOperations.set;
                    expression = `${path} = list_append(${path}, ${value})`;
                    break;
                case AttributeTypes.map:
                case AttributeTypes.enum:
                case AttributeTypes.string:
                case AttributeTypes.number:
                case AttributeTypes.boolean:
                case AttributeTypes.any:
                    operation = ItemOperations.set;
                    expression = `${path} = ${value}`;
                    break;
                default:
                    throw new Error(`Invalid Update Attribute Operation: "SET" Operation can only be performed on attributes with type "list", "map", "string", "number", "boolean", or "any".`);
            }
            return {operation, expression, attr};
        }
    },
    remove: {
        template: function remove(attr, path) {
            let operation = "";
            let expression = "";
            switch(attr.type) {
                case AttributeTypes.any:
                case AttributeTypes.list:
                case AttributeTypes.map:
                case AttributeTypes.string:
                case AttributeTypes.number:
                case AttributeTypes.boolean:
                    operation = ItemOperations.remove;
                    expression = `${path}`;
                    break;
                default:
                    throw new Error(`Invalid Update Attribute Operation: "REMOVE" Operation can only be performed on attributes with type "map", "list", "string", "number", "boolean", or "any".`);
            }
            return {operation, expression, attr};
        }
    },
    del: deleteOperations,
    delete: deleteOperations
}

const FilterOperations = {
    ne: {
        template: function eq(attr, name, value) {
            return `${name} <> ${value}`;
        },
        strict: false,
    },
    eq: {
        template: function eq(attr, name, value) {
            return `${name} = ${value}`;
        },
        strict: false,
    },
    gt: {
        template: function gt(attr, name, value) {
            return `${name} > ${value}`;
        },
        strict: false
    },
    lt: {
        template: function lt(attr, name, value) {
            return `${name} < ${value}`;
        },
        strict: false
    },
    gte: {
        template: function gte(attr, name, value) {
            return `${name} >= ${value}`;
        },
        strict: false
    },
    lte: {
        template: function lte(attr, name, value) {
            return `${name} <= ${value}`;
        },
        strict: false
    },
    between: {
        template: function between(attr, name, value1, value2) {
            return `(${name} between ${value1} and ${value2})`;
        },
        strict: false
    },
    begins: {
        template: function begins(attr, name, value) {
            return `begins_with(${name}, ${value})`;
        },
        strict: false
    },
    exists: {
        template: function exists(attr, name) {
            return `attribute_exists(${name})`;
        },
        strict: false
    },
    notExists: {
        template: function notExists(attr, name) {
            return `attribute_not_exists(${name})`;
        },
        strict: false
    },
    contains: {
        template: function contains(attr, name, value) {
            return `contains(${name}, ${value})`;
        },
        strict: false
    },
    notContains: {
        template: function notContains(attr, name, value) {
            return `not contains(${name}, ${value})`;
        },
        strict: false
    },
    value: {
        template: function(attr, name, value) {
            return value;
        },
        strict: false
    },
    name: {
        template: function(attr, name) {
            return name;
        },
        strict: false
    }
};

class ExpressionState {
    constructor() {
        this.names = {};
        this.values = {};
        this.pathNames = {};
        this.pathValues = {};
        this.counts = {};
        this.expression = "";
    }

    incrementName(name) {
        if (this.counts[name] === undefined) {
            this.counts[name] = 1;
        }
        return this.counts[name]++;
    }

    setName(name, value) {
        this.names[name] = value;
    }

    getNames() {
        return this.names;
    }

    setValue(name, value) {
        this.values[name] = value;
    }

    getValues() {
        return this.values;
    }

    setPathName(path, name) {
        this.pathNames[path] = name;
    }

    setPathValue(path, name) {
        this.pathValues[path] = name;
    }

    getPaths() {
        return {
            names: this.pathNames,
            values: this.pathValues
        };
    }

    setExpression(expression) {
        this.expression = expression;
    }

    getExpression() {
        return this.expression;
    }
}

class AttributeOperationProxy {
    constructor({expressions, attributes = {}, operations = {}, operationProxy = (val) => val}) {
        this.ref = {
            attributes,
            operations
        }
        this.expressions = expressions;
        this.attributes = AttributeOperationProxy.buildAttributes(expressions, attributes);
        this.operations = AttributeOperationProxy.buildOperations(expressions, operations, operationProxy);
    }

    invokeCallback(op, ...params) {
        return op(this.attributes, this.operations, ...params);
    }

    static buildOperations(expression, operations, operationProxy) {
        let ops = {};
        for (let operation of Object.keys(operations)) {
            let {template} = operations[operation];
            Object.defineProperty(ops, operation, {
                get: () => {
                    return (property, ...values) => {
                        if (property === undefined) {
                            throw new e.ElectroError(e.ErrorCodes.InvalidWhere, `Invalid/Unknown property passed in where clause passed to operation: '${operation}'`);
                        }
                        if (property.__is_clause__ === AttributeProxySymbol) {
                            const {path, name, attr, jsonPath} = property();
                            const target = attr.type === "any"
                                ? attr
                                : attr.getAttribute(jsonPath);

                            const attrValues = [];
                            for (const value of values) {
                                let valueCount = expression.incrementName(name);
                                let attrValue = `:${name}_w${valueCount}`;
                                // op.length is to see if function takes value argument
                                if (template.length > 1) {
                                    expression.setValue(attrValue, value);
                                    expression.setPathValue(jsonPath, value);
                                    attrValues.push(attrValue);
                                }
                            }

                            const result = template(target, path, ...attrValues);
                            expression.setPathValue(jsonPath, result);

                            return operationProxy(
                                result,
                                {
                                    expressionPath: path,
                                    jsonPath,
                                    target,
                                    values: attrValues,
                                    attribute: attr,
                                }
                            );
                            // } else if (typeof property === "string") {
                            //   // todo: parse string
                        } else {
                            throw new e.ElectroError(e.ErrorCodes.InvalidWhere, `Invalid Attribute in where clause passed to operation '${operation}'. Use injected attributes only.`);
                        }
                    }
                }
            });
        }
        return ops;
    }

    static pathProxy(path, name, attr, jsonPath, expressions) {
        return new Proxy(() => ({path, name, attr, jsonPath}), {
            get: (target, prop) => {
                if (prop === "__is_clause__") {
                    return AttributeProxySymbol
                } else if (isNaN(prop)) {
                    jsonPath = `${jsonPath}.${prop}`;
                    expressions.setName(`#${prop}`, prop);
                    return AttributeOperationProxy.pathProxy(`${path}.#${prop}`, name, attr, jsonPath, expressions);
                } else {
                    jsonPath = `${jsonPath}[*]`;
                    return AttributeOperationProxy.pathProxy(`${path}[${prop}]`, name, attr, jsonPath, expressions);
                }
            }
        });
    }

    static buildAttributes(expressions, attributes) {
        let attr = {};
        for (let [name, attribute] of Object.entries(attributes)) {
            Object.defineProperty(attr, name, {
                get: () => {
                    let path = `#${name}`;
                    expressions.setName(path, attribute.field);
                    return AttributeOperationProxy.pathProxy(path, name, attribute, name, expressions);
                }
            })
        }
        return attr;
    }
}

module.exports = {UpdateOperations, FilterOperations, ExpressionState, AttributeOperationProxy};