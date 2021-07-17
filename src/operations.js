const {AttributeTypes, ItemOperations, AttributeProxySymbol} = require("./types");

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
        template: function eq(name, value) {
            return `${name} <> ${value}`;
        },
        strict: false,
    },
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

class ExpressionState {
    constructor() {
        this.names = {};
        this.values = {};
        this.paths = {};
        this.counts = {};
        this.expression = "";
    }

    incrementName(name) {
        if (this.counts[name] === undefined) {
            this.counts[name] = 1;
        }
        return this.counts[name]++;
    }

    setName(name, value, path) {
        this.names[name] = value;
        this.setPath(path, "name", name);
    }

    getNames() {
        return this.names;
    }

    setValue(name, value, path) {
        this.values[name] = value;
        this.setPath(path, "value", name);
    }

    getValues() {
        return this.values;
    }

    setPath(path, type, name) {
        this.paths[path] = this.paths[path] || {};
        this.paths[path][type] = name;
    }

    getPaths() {
        return this.paths;
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
        this.sym = AttributeProxySymbol
    }

    invokeCallback(op, ...params) {
        return op(this.attributes, this.operations, ...params);
    }

    static buildOperations(expressions, operations, operationProxy) {
        let ops = {};
        for (let operation of Object.keys(operations)) {
            let {template} = operations[operation];
            Object.defineProperty(ops, operation, {
                get: () => {
                    return (property, ...values) => {
                        if (property === undefined) {
                            throw new e.ElectroError(e.ErrorCodes.InvalidWhere, `Invalid/Unknown property passed in where clause passed to operation: '${operation}'`);
                        }
                        if (property.__is_clause__ === this.sym) {
                            const {path, name, attr, jsonPath} = property();
                            const target = attr.type === "any"
                                ? attr
                                : attr.getAttribute(jsonPath);

                            const attrValues = [];
                            for (const value of values) {
                                let valueCount = expressions.incrementName(name);
                                let attrValue = `:${name}_w${valueCount}`;
                                // op.length is to see if function takes value argument
                                if (template.length > 1) {
                                    expressions.setAttribute(this.type, operation, target.path, value);
                                    expressions.setValue(attrValue, value, operation, jsonPath);
                                    attrValues.push(attrValue);
                                }
                            }

                            return operationProxy(
                                template(target, path, ...attrValues)
                            )
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
                    return this.sym
                } else if (isNaN(prop)) {
                    jsonPath = `${jsonPath}.${prop}`;
                    expressions.setName(`#${prop}`, prop, jsonPath);
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
        for (let [name, attr] of Object.entries(attributes)) {
            Object.defineProperty(attr, name, {
                get: () => {
                    let path = `#${name}`;
                    expressions.setName(path, attr.field, name);
                    return AttributeOperationProxy.pathProxy(path, name, attr, name, expressions);
                }
            })
        }
        return attr;
    }
}

module.exports = {UpdateOperations, FilterOperations};