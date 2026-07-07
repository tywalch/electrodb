/* istanbul ignore file */
const ElectroDB = require("../index");

window.Prism = window.Prism || {};
window.electroParams = window.electroParams || [];

window.notifyRedirect = function notifyRedirect(e) {
  if (top.location !== self.location) {
    e.preventDefault();
    window.top.postMessage(
      JSON.stringify({ type: "redirect", data: e.target.href }),
      "*",
    );
  }
};

function aOrAn(value = "") {
  return ["a", "e", "i", "o", "u"].includes(value[0].toLowerCase())
    ? "an"
    : "a";
}

function properCase(str = "") {
  let newStr = "";
  for (let i = 0; i < str.length; i++) {
    let value = i === 0 ? str[i].toUpperCase() : str[i];
    newStr += value;
  }
  return newStr;
}

function formatProper(value) {
  return formatStrict(properCase(value));
}

function formatStrict(value) {
  return `<b>${value}</b>`;
}

function formatProvidedKeys(pk = {}, sks = []) {
  let keys = { ...pk };
  for (const sk of sks) {
    keys = { ...keys, ...sk.facets };
  }
  const provided = Object.keys(keys).map((key) => formatStrict(key));
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
    return `<h2>${state}</h2>`;
  } else {
    const method = state.query.method;
    const type = state.query.type;
    const collection = state.query.collection;
    const accessPattern =
      entity.model.translations.indexes.fromIndexToAccessPattern[
        state.query.index
      ];
    const keys = formatProvidedKeys(state.query.keys.pk, state.query.keys.sk);
    if (collection) {
      return `<h2>Queries the collection ${formatProper(
        collection,
      )}, on the service ${formatProper(
        entity.model.service,
      )}, by ${keys}</h2>`;
    } else if (method === "query") {
      return `<h2>Queries the access pattern ${formatProper(
        accessPattern,
      )}, on the entity ${formatProper(entity.model.name)}, by ${keys}</h2>`;
    } else if (state.self === "commit") {
      // handled inside the "client" so each operation doesn't get its own printed line
    } else {
      return `<h2>Performs ${aOrAn(method)} ${formatProper(
        method,
      )} operation, on the entity ${formatProper(entity.model.name)}</h2>`;
    }
  }
}

function formatError(message) {
  const electroErrorPattern = "- For more detail on this error reference:";
  const isElectroError = message.match(electroErrorPattern);
  if (!isElectroError) {
    return `<h3>${message}</h3>`;
  }
  const [description, link] = message.split(electroErrorPattern);
  return `<h3>${description}</h3><br><h3>For more detail on this error reference <a href="${link}" target="_blank" rel="noopener noreferrer" onclick="notifyRedirect(event)">${link}</a></h3>`;
}

// The default listener preserves the original playground behavior: append
// rendered output directly to the #param-container element when one exists.
const domListener = {
  getContainer() {
    return document.getElementById("param-container");
  },
  onParams({ label, params }) {
    const appDiv = this.getContainer();
    if (!appDiv) {
      return;
    }
    let code = `<pre class="language-json"><code class="language-json">${JSON.stringify(
      params,
      null,
      4,
    )}</code></pre>`;
    if (label) {
      code = `<hr>${label}${code}`;
    } else {
      code = `<hr>${code}`;
    }
    appDiv.innerHTML = appDiv.innerHTML + code;
    if (typeof window.Prism.highlightAll === "function") {
      window.Prism.highlightAll();
    }
  },
  onMessage({ type, html }) {
    const appDiv = this.getContainer();
    if (!appDiv) {
      return;
    }
    const label = type === "info" ? "" : "<h2>Query Error</h2>";
    const code = `<hr>${label}<div class="${type} message">${html}</div>`;
    appDiv.innerHTML = appDiv.innerHTML + code;
  },
  onClear() {
    const appDiv = this.getContainer();
    if (appDiv) {
      appDiv.innerHTML = "";
    }
  },
};

let listener = domListener;

// Allows consumers (the React playground, documentation embeds, etc.) to
// receive playground output as structured events instead of DOM mutations.
// Returns a function that restores the previous listener.
function configure(custom = {}) {
  const previous = listener;
  listener = {
    onParams: custom.onParams || (() => {}),
    onMessage: custom.onMessage || (() => {}),
    onClear: custom.onClear || (() => {}),
  };
  return function restore() {
    listener = previous;
  };
}

function printToScreen({ params, state, entity, cache } = {}) {
  const label = formatParamLabel(state, entity);
  if (cache) {
    window.electroParams.push({ title: label, json: params });
  }
  listener.onParams({ label, params, cache });
}

function printMessage(type, message) {
  const html = formatError(message);
  listener.onMessage({ type, html, text: message });
}

function clearScreen() {
  window.electroParams = [];
  listener.onClear();
}

function promiseCallback(results) {
  return {
    promise: async () => results,
  };
}

class Entity extends ElectroDB.Entity {
  constructor(schema, options = {}) {
    super(schema, {
      ...options,
      client: {
        put: () => promiseCallback({}),
        delete: () => promiseCallback({}),
        update: () => promiseCallback({}),
        get: () => promiseCallback({ Item: {} }),
        query: () => promiseCallback({ Items: [] }),
        scan: () => promiseCallback({ Items: [] }),
        batchWrite: () =>
          promiseCallback({
            UnprocessedKeys: { [options.table]: { Keys: [] } },
          }),
        batchGet: () =>
          promiseCallback({
            Responses: { [options.table]: [] },
            UnprocessedKeys: { [options.table]: { Keys: [] } },
          }),
        transactWrite: (params) => {
          return {
            promise: async () => {
              printToScreen({
                params,
                entity: this,
                cache: true,
                state: "Performs a TransactWrite operation",
              });
              return {};
            },
            on: () => {},
          };
        },
        transactGet: (params) => {
          return {
            promise: async () => {
              printToScreen({
                params,
                entity: this,
                cache: true,
                state: "Performs a TransactGet operation",
              });
              return { Responses: [] };
            },
            on: () => {},
          };
        },
        createSet: (val) => val,
      },
    });
  }

  _demoParams(method, state, config) {
    try {
      const params = super[method](state, config);
      if (params && typeof params.catch === "function") {
        params.catch((err) => {
          console.log("param creation rejected: %o", err);
          printMessage("error", err.message);
        });
      }
      if (state.self !== "commit") {
        printToScreen({ params, state, entity: this, cache: true });
      }
      return params;
    } catch (err) {
      console.log("create params error: %o", err);
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
    const commit = clauses.commit.action;
    clauses.params.action = (entity, state, options) => {
      try {
        return params(entity, state, options);
      } catch (err) {
        printMessage("error", err.message);
      }
    };
    clauses.go.action = async (entity, state, options) => {
      try {
        return await go(entity, state, options);
      } catch (err) {
        printMessage("error", err.message);
      }
    };
    clauses.commit.action = (entity, state, options) => {
      try {
        return commit(entity, state, options);
      } catch (err) {
        printMessage("error", err.message);
      }
    };
    return super._makeChain(index, clauses, rootClause, options);
  }
}

class Service extends ElectroDB.Service {}

const createSchema = ElectroDB.createSchema;

const createCustomAttribute = ElectroDB.createCustomAttribute;

const CustomAttributeType = ElectroDB.CustomAttributeType;

window.ElectroDB = {
  Entity,
  Service,
  configure,
  clearScreen,
  printMessage,
  printToScreen,
  createSchema,
  createCustomAttribute,
  CustomAttributeType,
};
