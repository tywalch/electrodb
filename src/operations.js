const {AttributeTypes, ItemOperations} = require("./types");

const deleteOperations = {
    template: function del(attr, path, value) {
        let operation = "";
        let expression = "";
        switch(attr.type) {
            case AttributeTypes.any:
            case AttributeTypes.set:
                operation = ItemOperations.DELETE;
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
                    operation = ItemOperations.SET;
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
                    operation = ItemOperations.ADD;
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
                    operation = ItemOperations.SUBTRACT;
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
                    operation = ItemOperations.SET;
                    expression = `${path} = list_append(${path}, ${value})`;
                    break;
                case AttributeTypes.map:
                case AttributeTypes.enum:
                case AttributeTypes.string:
                case AttributeTypes.number:
                case AttributeTypes.boolean:
                case AttributeTypes.any:
                    operation = ItemOperations.SET;
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
                    operation = ItemOperations.REMOVE;
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

module.exports = {UpdateOperations, FilterOperations};