const {AttributeOperationProxy, ExpressionState} = require("./operations");
const {ItemOperations, BuilderTypes} = require("./types");

class UpdateExpression extends ExpressionState {
    constructor(props = {}) {
        super({...props});
        this.operations = {
            set: new Set(),
            remove: new Set(),
            add: new Set(),
            subtract: new Set(),
            delete: new Set()
        };
        this.type = BuilderTypes.update;
    }

    add(type, expression) {
        this.operations[type].add(expression);
    }

    set(name, value) {
        const n = this.setName({}, name, name);
        const v = this.setValue(name, value);
        this.add(ItemOperations.set, `${n.prop} = ${v}`);
    }

    remove(name) {
        const n = this.setName({}, name, name);
        this.add(ItemOperations.remove, `${n.prop}`);
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

    buildCallbackHandler(entity, state) {
        const proxy = new AttributeOperationProxy({
            builder: state.query.updates,
            attributes: this.attributes,
            operations: this.operations,
        });

        return (cb, ...params) => {
            if (typeof cb !== "function") {
                throw new Error('Update Callback must be of type "function"');
            }
            proxy.invokeCallback(cb, ...params);
        }
    }
}

module.exports = {
    UpdateEntity,
    UpdateExpression
}