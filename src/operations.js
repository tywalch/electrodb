const {AttributeTypes, ItemOperations, AttributeProxySymbol, BuilderTypes} = require("./types");
const e = require("./errors");
const u = require("./util");

const deleteOperations = {
    canNest: false,
    template: function del(options, attr, path, value) {
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
    ifNotExists: {
        template: function if_not_exists(options, attr, path, value) {
            const operation = ItemOperations.set;
            const expression = `${path} = if_not_exists(${path}, ${value})`;
            return {operation, expression};
        }
    },
    name: {
        canNest: true,
        template: function name(options, attr, path) {
            return path;
        }
    },
    value: {
        canNest: true,
        template: function value(options, attr, path, value) {
            return value;
        }
    },
    append: {
        canNest: false,
        template: function append(options, attr, path, value) {
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
            return {operation, expression};
        }
    },
    add: {
        canNest: false,
        template: function add(options, attr, path, value) {
            let operation = "";
            let expression = "";
            let type = attr.type;
            if (type === AttributeTypes.any) {
                type = typeof value === 'number'
                    ? AttributeTypes.number
                    : AttributeTypes.any;
            }
            switch(type) {
                case AttributeTypes.any:
                case AttributeTypes.set:
                    operation = ItemOperations.add;
                    expression = `${path} ${value}`;
                    break;
                case AttributeTypes.number:
                    if (options.nestedValue) {
                        operation = ItemOperations.set;
                        expression = `${path} = ${path} + ${value}`;
                    } else {
                        operation = ItemOperations.add;
                        expression = `${path} ${value}`;
                    }
                    break;
                default:
                    throw new Error(`Invalid Update Attribute Operation: "ADD" Operation can only be performed on attributes with type "number", "set", or "any".`);
            }
            return {operation, expression};
        }
    },
    subtract: {
        canNest: false,
        template: function subtract(options, attr, path, value) {
            let operation = "";
            let expression = "";
            switch(attr.type) {
                case AttributeTypes.any:
                case AttributeTypes.number:
                    operation = ItemOperations.set;
                    expression = `${path} = ${path} - ${value}`;
                    break;
                default:
                    throw new Error(`Invalid Update Attribute Operation: "SUBTRACT" Operation can only be performed on attributes with type "number" or "any".`);
            }

            return {operation, expression};
        }
    },
    set: {
        canNest: false,
        template: function set(options, attr, path, value) {
            let operation = "";
            let expression = "";
            switch(attr.type) {
                case AttributeTypes.set:
                case AttributeTypes.list:
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
            return {operation, expression};
        }
    },
    remove: {
        canNest: false,
        template: function remove(options, attr, ...paths) {
            let operation = "";
            let expression = "";
            switch(attr.type) {
                case AttributeTypes.set:
                case AttributeTypes.any:
                case AttributeTypes.list:
                case AttributeTypes.map:
                case AttributeTypes.string:
                case AttributeTypes.number:
                case AttributeTypes.boolean:
                case AttributeTypes.enum:
                    operation = ItemOperations.remove;
                    expression = paths.join(", ");
                    break;
                default: {
                    throw new Error(`Invalid Update Attribute Operation: "REMOVE" Operation can only be performed on attributes with type "map", "list", "string", "number", "boolean", or "any".`);
                }
            }
            return {operation, expression};
        }
    },
    del: deleteOperations,
    delete: deleteOperations
}

const FilterOperations = {
    ne: {
        template: function eq(options, attr, name, value) {
            return `${name} <> ${value}`;
        },
        strict: false,
    },
    eq: {
        template: function eq(options, attr, name, value) {
            return `${name} = ${value}`;
        },
        strict: false,
    },
    gt: {
        template: function gt(options, attr, name, value) {
            return `${name} > ${value}`;
        },
        strict: false
    },
    lt: {
        template: function lt(options, attr, name, value) {
            return `${name} < ${value}`;
        },
        strict: false
    },
    gte: {
        template: function gte(options, attr, name, value) {
            return `${name} >= ${value}`;
        },
        strict: false
    },
    lte: {
        template: function lte(options, attr, name, value) {
            return `${name} <= ${value}`;
        },
        strict: false
    },
    between: {
        template: function between(options, attr, name, value1, value2) {
            return `(${name} between ${value1} and ${value2})`;
        },
        strict: false
    },
    begins: {
        template: function begins(options, attr, name, value) {
            return `begins_with(${name}, ${value})`;
        },
        strict: false
    },
    exists: {
        template: function exists(options, attr, name) {
            return `attribute_exists(${name})`;
        },
        strict: false
    },
    notExists: {
        template: function notExists(options, attr, name) {
            return `attribute_not_exists(${name})`;
        },
        strict: false
    },
    contains: {
        template: function contains(options, attr, name, value) {
            return `contains(${name}, ${value})`;
        },
        strict: false
    },
    notContains: {
        template: function notContains(options, attr, name, value) {
            return `not contains(${name}, ${value})`;
        },
        strict: false
    },
    value: {
        template: function(options, attr, name, value) {
            return value;
        },
        strict: false,
        canNest: true,
    },
    name: {
        template: function(options, attr, name) {
            return name;
        },
        strict: false,
        canNest: true,
    }
};

class ExpressionState {
    constructor({prefix} = {}) {
        this.names = {};
        this.values = {};
        this.paths = {};
        this.counts = {};
        this.impacted = {};
        this.expression = "";
        this.prefix = prefix || "";
    }

    incrementName(name) {
        if (this.counts[name] === undefined) {
            this.counts[name] = 0;
        }
        return `${this.prefix}${this.counts[name]++}`;
    }

    // todo: make the structure: name, value, paths
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

    setValue(name, value) {
        let valueCount = this.incrementName(name);
        let expression = `:${name}${valueCount}`
        this.values[expression] = value;
        return expression;
    }

    updateValue(name, value) {
        this.values[name] = value;
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

    setImpacted(operation, path) {
        this.impacted[path] = operation;
    }
}

class AttributeOperationProxy {
    constructor({builder, attributes = {}, operations = {}}) {
        this.ref = {
            attributes,
            operations
        };
        this.attributes = AttributeOperationProxy.buildAttributes(builder, attributes);
        this.operations = AttributeOperationProxy.buildOperations(builder, operations);
    }

    invokeCallback(op, ...params) {
        return op(this.attributes, this.operations, ...params);
    }

    fromObject(operation, record) {
        for (let path of Object.keys(record)) {
            const value = record[path];
            const parts = u.parseJSONPath(path);
            let attribute = this.attributes;
            for (let part of parts) {
                attribute = attribute[part];
            }
            if (attribute) {
                this.operations[operation](attribute, value);
                const {target} = attribute();
                if (target.readOnly) {
                    throw new Error(`Attribute "${target.path}" is Read-Only and cannot be updated`);
                }
            }
        }
    }

    fromArray(operation, paths) {
        for (let path of paths) {
            const parts = u.parseJSONPath(path);
            let attribute = this.attributes;
            for (let part of parts) {
                attribute = attribute[part];
            }
            if (attribute) {
                this.operations[operation](attribute);
                const {target} = attribute();
                if (target.readOnly) {
                    throw new Error(`Attribute "${target.path}" is Read-Only and cannot be updated`);
                } else if (operation === ItemOperations.remove && target.required) {
                    throw new Error(`Attribute "${target.path}" is Required and cannot be removed`);
                }
            }
        }
    }

    static buildOperations(builder, operations) {
        let ops = {};
        let seen = new Set();
        for (let operation of Object.keys(operations)) {
            let {template, canNest} = operations[operation];
            Object.defineProperty(ops, operation, {
                get: () => {
                    return (property, ...values) => {
                        if (property === undefined) {
                            throw new e.ElectroError(e.ErrorCodes.InvalidWhere, `Invalid/Unknown property passed in where clause passed to operation: '${operation}'`);
                        }
                        if (property.__is_clause__ === AttributeProxySymbol) {
                            const {paths, root, target} = property();
                            const attributeValues = [];
                            let hasNestedValue = false;
                            for (let value of values) {
                                value = target.applyFixings(value);
                                // template.length is to see if function takes value argument
                                if (template.length > 3) {
                                    if (seen.has(value)) {
                                        attributeValues.push(value);
                                        hasNestedValue = true;
                                    } else {
                                        let attributeValueName = builder.setValue(target.name, value);
                                        builder.setPath(paths.json, {value, name: attributeValueName});
                                        attributeValues.push(attributeValueName);
                                    }
                                }
                            }

                            const options = {
                                nestedValue: hasNestedValue
                            }

                            const formatted = template(options, target, paths.expression, ...attributeValues);
                            builder.setImpacted(operation, paths.json);
                            if (canNest) {
                                seen.add(paths.expression);
                                seen.add(formatted);
                            }

                            if (builder.type === BuilderTypes.update && formatted && typeof formatted.operation === "string" && typeof formatted.expression === "string") {
                                builder.add(formatted.operation, formatted.expression);
                                return formatted.expression;
                            }

                            return formatted;
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
                        throw new Error(`Invalid attribute "${prop}" at path "${paths.json}".`);
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
            });
        }
        return attr;
    }
}

const FilterOperationNames = Object.keys(FilterOperations).reduce((ops, name) => {
    ops[name] = name;
    return ops;
}, {});

module.exports = {UpdateOperations, FilterOperations, FilterOperationNames, ExpressionState, AttributeOperationProxy};