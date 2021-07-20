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

    setName(paths, name, value) {
        let json = "";
        let expression = "";
        const prop = `#${name}`;
        if (Object.keys(paths).length === 0) {
            json = `${name}`;
            expression = `${prop}`;
            this.names[prop] = value;
        } else if (isNaN(name)) {
            json = `${paths.json}.${name}`;
            expression = `${paths.expression}.${prop}`;
            this.names[prop] = value;
        } else {
            json = `${paths.json}[*]`;
            expression = `${paths.expression}[${name}]`;
        }
        return {json, expression, prop};
    }

    getNames() {
        return this.names;
    }

    setValue(name, value, path) {
        let valueCount = this.incrementName(name);
        let expression = `:${name}${valueCount}`
        this.values[expression] = value;
        if (path) {
            this.setPath(path, value);
        }
        return expression;
    }

    getValues() {
        return this.values;
    }

    setPath(path, value) {
        this.paths[path] = value;
    }

    setExpression(expression) {
        this.expression = expression;
    }

    getExpression() {
        return this.expression;
    }
}

class AttributeOperationProxy {
    constructor({builder, attributes = {}, operations = {}, formatter = (val) => val}) {
        this.ref = {
            attributes,
            operations
        };
        this.attributes = AttributeOperationProxy.buildAttributes(builder, attributes);
        this.operations = AttributeOperationProxy.buildOperations(builder, operations, formatter);
    }

    invokeCallback(op, ...params) {
        return op(this.attributes, this.operations, ...params);
    }

    static buildOperations(builder, operations, operationProxy) {
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
                            const {paths, root, target} = property();
                            const attrValues = [];
                            for (const value of values) {
                                // op.length is to see if function takes value argument
                                if (template.length > 1) {
                                    const attrValue = builder.setValue(target.name, value);
                                    attrValues.push(attrValue);
                                }
                            }

                            const result = template(target, paths.expression, ...attrValues);
                            builder.setPath(paths.json, result);

                            return operationProxy(
                                result,
                                {
                                    root,
                                    paths,
                                    target,
                                    values: attrValues,
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

    static pathProxy(paths, root, target, builder) {
        return new Proxy(() => ({paths, root, target}), {
            get: (_, prop) => {
                if (prop === "__is_clause__") {
                    return AttributeProxySymbol
                } else {
                    const attribute = target.getChild(prop);
                    let field;
                    if (attribute === undefined) {
                        throw new Error(`Invalid attribute "${prop}" on path "${paths.json}".`);
                    } else if (attribute === root && attribute.type === AttributeTypes.any) {
                        // This function is only called if a nested property is called. If this attribute is ultimately the root, don't use the root's field name
                        field = prop;
                    } else {
                        field = attribute.field;
                    }
                    paths = builder.setName(paths, prop, field);
                    return AttributeOperationProxy.pathProxy(paths, root, attribute, builder);
                }
            }
        });
    }

    static buildAttributes(builder, attributes) {
        let attr = {};
        for (let [name, attribute] of Object.entries(attributes)) {
            Object.defineProperty(attr, name, {
                get: () => {
                    const paths = builder.setName({}, attribute.name, attribute.field);
                    return AttributeOperationProxy.pathProxy(paths, attribute, attribute, builder);
                }
            })
        }
        return attr;
    }
}

module.exports = {UpdateOperations, FilterOperations, ExpressionState, AttributeOperationProxy};