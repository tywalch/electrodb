const e = require("./errors");

let WhereOperations = {
    ne: {
        format: (attr, val) => val,
        op: function eq(attr, name, value) {
            return `${name} <> ${value}`;
        },
        strict: false,
    },
    eq: {
        format: (attr, val) => val,
        op: function eq(attr, name, value) {
            return `${name} = ${value}`;
        },
        strict: false,
    },
    gt: {
        format: (attr, val) => val,
        op: function gt(attr, name, value) {
            return `${name} > ${value}`;
        },
        strict: false
    },
    lt: {
        format: (attr, val) => val,
        op: function lt(attr, name, value) {
            return `${name} < ${value}`;
        },
        strict: false
    },
    gte: {
        format: (attr, val) => val,
        op: function gte(attr, name, value) {
            return `${name} >= ${value}`;
        },
        strict: false
    },
    lte: {
        format: (attr, val) => val,
        op: function lte(attr, name, value) {
            return `${name} <= ${value}`;
        },
        strict: false
    },
    between: {
        format: (attr, val) => val,
        op: function between(attr, name, value1, value2) {
            return `(${name} between ${value1} and ${value2})`;
        },
        strict: false
    },
    begins: {
        format: (attr, val) => val,
        op: function begins(attr, name, value) {
            return `begins_with(${name}, ${value})`;
        },
        strict: false
    },
    exists: {
        format: (attr, val) => val,
        op: function exists(attr, name) {
            return `attribute_exists(${name})`;
        },
        strict: false
    },
    notExists: {
        format: (attr, val) => val,
        op: function notExists(attr, name) {
            return `attribute_not_exists(${name})`;
        },
        strict: false
    },
    contains: {
        format: (attr, val) => val,
        op: function contains(attr, name, value) {
            return `contains(${name}, ${value})`;
        },
        strict: false
    },
    notContains: {
        format: (attr, val) => val,
        op: function notContains(attr, name, value) {
            return `not contains(${name}, ${value})`;
        },
        strict: false
    },
    value: {
        format: (attr, val) => val,
        op: function(attr, name, value) {
            return value;
        },
        strict: false
    },
    name: {
        format: (attr, val) => val,
        op: function(attr, name) {
            return name;
        },
        strict: false
    }
};

class AttributeOperationProxy {
    constructor(state, attributes = {}, operations = {}) {
        this.ref = {
            attributes,
            operations
        }
        this.state = state;
        this.attributes = this.buildAttributes(this.state);
        this.operations = this.buildOperations(this.state);
        this.sym = Symbol("operation");
    }

    invokeCallback(op, ...params) {
        return op(this.attributes, this.operations, ...params);
    }

    buildOperations(state) {
        let operations = {};
        for (let operation of Object.keys(this.ref.operations)) {
            let {op, format} = this.ref.operations[operation];
            Object.defineProperty(operations, operation, {
                get: () => {
                    return (property, ...values) => {
                        if (property === undefined) {
                            throw new e.ElectroError(e.ErrorCodes.InvalidWhere, `Invalid/Unknown property passed in where clause passed to operation: '${operation}'`);
                        }
                        if (property.__is_clause__ === this.sym) {
                            let {path, name, attr} = property();
                            let attrValues = [];
                            for (let value of values) {
                                let valueCount = state.expressions.incrementName(name);
                                let attrValue = `:${name}_w${valueCount}`;
                                // op.length is to see if function takes value argument
                                if (op.length > 1) {
                                    state.expressions.setValue(attrValue, format(attr, value));
                                    attrValues.push(attrValue);
                                }
                            }

                            return op(this.ref.attributes[name], path, ...attrValues);
                            // } else if (typeof property === "string") {
                            //   // todo: parse string
                        } else {
                            throw new e.ElectroError(e.ErrorCodes.InvalidWhere, `Invalid Attribute in where clause passed to operation '${operation}'. Use injected attributes only.`);
                        }
                    }
                }
            })
        }
        return operations;
    }

    _attributeProxy(path, name, attr, state) {
        return new Proxy(() => ({path, name, attr}), {
            get: (target, prop) => {
                if (prop === "__is_clause__") {
                    return this.sym
                } else if (isNaN(prop)) {
                    state.expressions.setName(`#${prop}`, prop);
                    return this._attributeProxy(`${path}.#${prop}`, name, attr, state);
                } else {
                    return this._attributeProxy(`${path}[${prop}]`, name, attr, state);
                }
            }
        });
    }

    buildAttributes(state) {
        let attributes = {};
        for (let [name, attr] of Object.entries(this.ref.attributes)) {
            Object.defineProperty(attributes, name, {
                get: () => {
                    let path = `#${name}`;
                    state.expressions.setName(path, attr.field);
                    return this._attributeProxy(path, name, attr, state);
                }
            })
        }
        return attributes;
    }
}

module.exports = {
    WhereOperations,
    AttributeOperationProxy
}