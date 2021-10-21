const ElectroDB = require("../index");
window.Prism = window.Prism || {};
window.electroParams = window.electroParams || [];
const appDiv = document.getElementById('param-container');

window.notifyRedirect = function notifyRedirect(e) {
    if (top.location !== self.location) {
        e.preventDefault();
        window.top.postMessage(JSON.stringify({type: "redirect", data: e.target.href}), "*");
    }
}

function aOrAn(value = "") {
    return ["a", "e", "i", "o", "u"].includes(value[0].toLowerCase())
        ? "an"
        : "a"
}

function properCase(str = "") {
    let newStr = "";
    for (let i = 0; i < str.length; i++) {
        let value = i === 0
            ? str[i].toUpperCase()
            : str[i];
        newStr += value;
    }
    return newStr;
}

function formatProper(value) {
    return formatStrict(properCase(value));
}

function formatStrict(value) {
    return `<b>${value}</b>`
}

function formatProvidedKeys(pk = {}, sks = []) {
    let keys = {...pk};
    for (const sk of sks) {
        keys = {...keys, ...sk.facets};
    }
    const provided = Object.keys(keys).map(key => formatStrict(key));
    if (provided.length === 0) {
        return "";
    } else if (provided.length === 1) {
        return provided[0];
    } else if (provided.length === 2) {
        return provided.join(" and ");
    } else {
        provided[provided.length - 1] = `and ${provided[provided.length - 1]}`;
        return provided.join(", ");
    }
}

function formatParamLabel(state, entity) {
    if (!state) {
        return null;
    } else if (typeof state === "string") {
        return state;
    } else {
        const method = state.query.method;
        const type = state.query.type;
        const collection = state.query.collection;
        const accessPattern = entity.model.translations.indexes.fromIndexToAccessPattern[state.query.index];
        const keys = formatProvidedKeys(state.query.keys.pk, state.query.keys.sk);
        if (collection) {
            return `<h2>Queries the collection ${formatProper(collection)}, on the service ${formatProper(entity.model.service)}, by ${keys}</h2>`;
        } else if (method === "query") {
            return `<h2>Queries the access pattern ${formatProper(accessPattern)}, on the entity ${formatProper(entity.model.name)}, by ${keys}</h2>`;
        } else {
            return `<h2>Performs ${aOrAn(method)} ${formatProper(method)} operation, on the entity ${formatProper(entity.model.name)}</h2>`;
        }
    }
}

function printToScreen({params, state, entity, cache} = {}) {
    const innerHtml = appDiv.innerHTML;
    const label = formatParamLabel(state, entity);
    if (cache) {
        window.electroParams.push({title: label, json: params});
    }
    let code = `<pre class="language-json"><code class="language-json">${JSON.stringify(params, null, 4)}</code></pre>`;
    if (label) {
        code = `<hr>${label}${code}`;
    } else {
        code = `<hr>${code}`;
    }
    appDiv.innerHTML = innerHtml + code;
    window.Prism.highlightAll();
}

function formatError(message) {
    const electroErrorPattern = "- For more detail on this error reference:";
    const isElectroError = message.match(electroErrorPattern);
    if (!isElectroError) {
        return `<h3>${message}</h3>`;
    }
    const [description, link] = message.split(electroErrorPattern);
    return `<h3>${description}</h3><br><h3>For more detail on this error reference <a href="${link}" onclick="notifyRedirect(event)">${link}</a></h3>`
}

function printMessage(type, message) {
    const error = formatError(message);
    const innerHtml = appDiv.innerHTML;
    const label = type === "info" ? "" : "<h2>Query Error</h2>";
    const code = `<hr>${label}<div class="${type} message">${error}</div>`;
    appDiv.innerHTML = innerHtml + code;
}

function clearScreen() {
    appDiv.innerHTML = '';
    window.electroParams = [];
}

function promiseCallback(results) {
    return {
        promise: async () => results
    }
}

class Entity extends ElectroDB.Entity {
    constructor(...params) {
        super(...params);
        this.client = {
            get: () => promiseCallback({Item: {}}),
            query: () => promiseCallback({Items: []}),
            put: () => promiseCallback({}),
            delete: () => promiseCallback({}),
            update: () => promiseCallback({}),
            batchWrite: () => promiseCallback({UnprocessedKeys: {[this._getTableName()]: {Keys: []}}}),
            batchGet: () => promiseCallback({Responses: {[this._getTableName()]: []}, UnprocessedKeys: {[this._getTableName()]: {Keys: []}}})
        };
    }

    _demoParams(method, state, config) {
        try {
            const params = super[method](state, config);
            if (params && typeof params.catch === "function") {
                params.catch(err => {
                    console.log(err);
                    printMessage("error", err.message);
                });
            }
            printToScreen({params, state, entity: this, cache: true});
            return params;
        } catch(err) {
            console.log(err);
            printMessage("error", err.message);
        }
    }

    _queryParams(state, config) {
        return this._demoParams("_queryParams", state, config);
    }

    _batchWriteParams(state, config) {
        return this._demoParams("_batchWriteParams", state, config);
    }

    _batchGetParams(state, config) {
        return this._demoParams("_batchGetParams", state, config);
    }

    _params(state, config) {
        return this._demoParams("_params", state, config);
    }

    _makeChain(index, clauses, rootClause, options) {
        const params = clauses.params.action;
        const go = clauses.go.action;
        clauses.params.action = (entity, state, options) => {
            try {
                params(entity, state, options);
            } catch(err) {
                printMessage("error", err.message);
            }
        }
        clauses.go.action = async (entity, state, options) => {
            try {
                return await go(entity, state, options);
            } catch(err) {
                printMessage("error", err.message);
            }
        }
        return super._makeChain(index, clauses, rootClause, options);
    }
}

class Service extends ElectroDB.Service {}


window.ElectroDB = {
    Entity,
    Service,
    clearScreen,
    printMessage,
    printToScreen
};