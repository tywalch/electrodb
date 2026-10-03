"use strict";

const SET = "set";
const MAP = "map";
const LIST = "list";
const STRING = "string";
const ENUM = "enum";

let supported = null;

function supportsCompilation() {
  if (supported === null) {
    try {
      new Function("");
      supported = true;
    } catch (err) {
      supported = false;
    }
  }
  return supported;
}

function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function fromSet(value) {
  if (value === undefined || value === null) {
    return value;
  }
  const type = typeof value;
  if (type === "string" || type === "number" || type === "boolean") {
    return value;
  }
  if (Array.isArray(value)) {
    return value;
  }
  if (value.wrapperName === "Set") {
    return [...value.values];
  }
  if (value.constructor.name === "Set") {
    return Array.from(value);
  }
  return value;
}

function generate(schema) {
  const attributes = schema.attributes;
  const hiddenAttributes = schema.hiddenAttributes;
  const names = Object.keys(attributes);
  const unformatters = [];
  const lines = [];
  let temp = 0;
  const J = JSON.stringify;
  const push = (indent, text) => lines.push("  ".repeat(indent) + text);
  const nextVar = (prefix) => `${prefix}${temp++}`;

  const isScalarPassthrough = (attribute) =>
    attribute.type !== MAP &&
    attribute.type !== LIST &&
    attribute.type !== SET &&
    !(
      (attribute.type === STRING || attribute.type === ENUM) &&
      attribute.isKeyField
    );

  function emitGuardedValue({
    attribute,
    valueVar,
    indent,
    place,
    guardExtra,
    guard = true,
  }) {
    const checks = [];
    if (guard) checks.push(`${valueVar} !== undefined`);
    if (guardExtra) checks.push(guardExtra);
    const cond = checks.length ? checks.join(" && ") : null;
    const guarded = (body) => (cond ? `if (${cond}) ${body}` : body);
    if (attribute.type === MAP) {
      const result = nextVar("r");
      push(indent, guarded(`{`));
      push(indent + 1, `var ${result} = {};`);
      emitMapChildren({
        mapAttribute: attribute,
        sourceVar: valueVar,
        targetVar: result,
        indent: indent + 1,
      });
      push(indent + 1, place(result));
      push(indent, `}`);
    } else if (attribute.type === LIST) {
      const items = attribute.items;
      if (isScalarPassthrough(items) && !items.hidden) {
        push(indent, guarded(place(valueVar)));
      } else {
        const result = nextVar("r");
        push(indent, guarded(`{`));
        push(indent + 1, `var ${result} = [];`);
        emitListLoop({
          listAttribute: attribute,
          valuesVar: valueVar,
          targetVar: result,
          indent: indent + 1,
        });
        push(indent + 1, place(result));
        push(indent, `}`);
      }
    } else if (attribute.type === SET) {
      push(indent, guarded(place(`fromSet(${valueVar})`)));
    } else if (
      (attribute.type === STRING || attribute.type === ENUM) &&
      attribute.isKeyField
    ) {
      const index = unformatters.push(attribute.unformat) - 1;
      push(indent, guarded(place(`unformat[${index}](${valueVar})`)));
    } else {
      push(indent, guarded(place(valueVar)));
    }
  }

  function emitMapChildren({ mapAttribute, sourceVar, targetVar, indent }) {
    const children = mapAttribute.properties.attributes;
    for (const childName of Object.keys(children)) {
      const child = children[childName];
      if (child.hidden) {
        continue;
      }
      const value = nextVar("v");
      push(indent, `var ${value} = ${sourceVar}[${J(child.field)}];`);
      emitGuardedValue({
        attribute: child,
        valueVar: value,
        indent,
        place: (expr) => `${targetVar}[${J(childName)}] = ${expr};`,
      });
    }
  }

  function emitListLoop({ listAttribute, valuesVar, targetVar, indent }) {
    const items = listAttribute.items;
    if (items.hidden) return;
    const element = nextVar("v");
    push(indent, `{`);
    push(indent + 1, `const values = ${valuesVar};`);
    push(indent + 1, `for (const ${element} of values) {`);
    emitGuardedValue({
      attribute: items,
      valueVar: element,
      indent: indent + 2,
      place: (expr) => `${targetVar}.push(${expr});`,
      guard: false,
    });
    push(indent + 1, `}`);
    push(indent, `}`);
  }

  function emitPrologue() {
    push(1, `var out = {};`);
  }

  function emitRootAttribute(name) {
    const attribute = attributes[name];
    if (hiddenAttributes.has(name)) {
      return;
    }
    const value = nextVar("v");
    push(1, `var ${value} = item[${J(attribute.field)}];`);
    emitGuardedValue({
      attribute,
      valueVar: value,
      indent: 1,
      place: (expr) => `out[${J(name)}] = ${expr};`,
      guardExtra: `(filter == null || filter.has(${J(name)}))`,
    });
  }

  function emitAttributeLoop() {
    for (const name of names) {
      emitRootAttribute(name);
    }
  }

  function emitReturn() {
    push(1, `return out;`);
  }

  function assembleFactory() {
    const source =
      '"use strict";\n' +
      "return function fromDocument(item, filter) {\n" +
      lines.join("\n") +
      "\n};\n" +
      "//# sourceURL=electrodb-jit-format.js\n";
    const factory = new Function("fromSet", "unformat", source);
    return {
      fromDocument: factory(fromSet, unformatters),
      source,
    };
  }

  emitPrologue();
  emitAttributeLoop();
  emitReturn();
  return assembleFactory();
}

function isCompilable(schema) {
  for (const entry of schema.traverser.getAll()) {
    if (entry[1].hasUserGet) {
      return false;
    }
  }
  return true;
}

function compileDocumentFormatter(schema) {
  if (!supportsCompilation() || !isCompilable(schema)) {
    return null;
  }
  try {
    return generate(schema);
  } catch (err) {
    return null;
  }
}

const runtime = { fromSet, hasOwn };

module.exports = {
  supportsCompilation,
  isCompilable,
  compileDocumentFormatter,
  runtime,
};
