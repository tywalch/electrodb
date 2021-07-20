const {AttributeOperationProxy, ExpressionState} = require("./operations");
const {ItemOperations, AttributeProxyTypes} = require("./types");
const u = require("./util");

class UpdateExpression extends ExpressionState {
    constructor(props) {
        super(props);
        this.operations = {
            set: new Set(),
            append: new Set(),
            remove: new Set(),
            add: new Set(),
            subtract: new Set()
        };
    }

    add(type, expression) {
        this.operations[type].add(expression);
    }

    build() {
        let expressions = [];
        for (const type of Object.keys(this.operations)) {
            const operations = this.operations[type];
            if (operations.size > 0) {
                expressions.push(`${type.toUpperCase()} ${Array.from(operations).join(", ")}`);
            }
        }
        return expressions.join(" ");
    }
}

class UpdateEntity {
    constructor(attributes = {}, operations = {}) {
        this.attributes = {...attributes};
        this.operations = {...operations};
    }

    reformat(builder, result, {root, paths, target, values} = {}) {

    }

    buildCallbackHandler(entity, state) {
        const proxy = new AttributeOperationProxy({
            builder: state.query.update,
            attributes: this.attributes,
            operations: this.operations,
            formatter: (...values) => this.reformat(state.query.update, ...values)
        });

        return (cb, ...params) => {
            if (typeof cb !== "function") {
                throw new Error('Update Callback must be of type "function"');
            }
            state.expressions.fromCB = true;
            let results = proxy.invokeCallback(cb, ...params);
            if (!results) {
                throw new Error("Update Callback must return single operation or an array of operations");
            } else if (!Array.isArray(results)) {
                results = [results];
            }
            for (let {operation, expression, attr} of results) {
                if (ItemOperations[operation] === undefined) {
                    throw new Error(`Invalid Update Operation: "${operation}". Valid operations include ${u.commaSeparatedString(Object.keys(ItemOperations))}`)
                }
                state.addUpdateExpression(operation, expression);
            }
            return state;
        }
    }
}

module.exports = {
    UpdateEntity,
    UpdateExpression
}