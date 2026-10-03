"use strict";
// Model registry for offline.compile.spec.js. Each define() carries an
// `eligible` verdict the spec's no-silent-fallback table iterates — adding a
// model without a verdict fails the suite. Rule: a schema is JIT-eligible
// unless some attribute (any depth) has a user `get`; setters and getter-less
// watchers (incl. watch:'*') never gate.

const TABLE = "electro_compile";

const registry = {};

function define(name, eligible, why, model) {
  if (registry[name]) throw new Error(`duplicate model name: ${name}`);
  registry[name] = { name, eligible, why, model };
  return model;
}

define("orderRemapTorture", true, "no user getters anywhere", {
  model: { entity: "m1", service: "compilespec", version: "1" },
  attributes: {
    id: { type: "string" },
    0: { type: "string", field: "zero_f" },
    'we"ird\n${x}': { type: "string", field: 'f"\\\n${y}' },
    bool: { type: "boolean" },
    num: { type: "number" },
    en: { type: ["ONE", "TWO"] },
    s: { type: "string" },
    anyv: { type: "any" },
  },
  indexes: {
    main: {
      pk: { field: "pk", composite: ["id"] },
      sk: { field: "sk", composite: [] },
    },
  },
});

// Shape is load-bearing: the spec pins literal outputs for this exact model. Do not reorder.
define(
  "containerTorture",
  true,
  "containers, aliases, hidden nested, sets — no getters",
  {
    model: { entity: "m2", service: "compilespec", version: "1" },
    attributes: {
      id: { type: "string" },
      s: { type: "string" },
      n: { type: "number" },
      m: {
        type: "map",
        properties: {
          alias: { type: "string", field: "a_f" },
          hidStr: { type: "string", hidden: true },
          hidSet: { type: "set", items: "string", hidden: true }, // EC-43 leak
          ls: {
            type: "list",
            items: {
              type: "map",
              properties: { q: { type: "string", field: "q_f" } },
            },
          },
          innerAny: { type: "any" },
          st: { type: "set", items: "number" },
        },
      },
      l: { type: "list", items: { type: "string" } },
      lm: {
        type: "list",
        items: { type: "map", properties: { q: { type: "string" } } },
      },
      lset: { type: "list", items: { type: "set", items: "string" } },
      topSet: { type: "set", items: "string" },
      hidTopSet: { type: "set", items: "string", hidden: true },
      anyv: { type: "any" },
    },
    indexes: {
      main: {
        pk: { field: "pk", composite: ["id"] },
        sk: { field: "sk", composite: [] },
      },
    },
  },
);

// child fields "0"/"length" pick chars/props off mistyped values (EC-33)
define("mapIndexFields", true, "no getters", {
  model: { entity: "midx", service: "compilespec", version: "1" },
  attributes: {
    id: { type: "string" },
    m: {
      type: "map",
      properties: {
        zero: { type: "string", field: "0" },
        len: { type: "number", field: "length" },
      },
    },
  },
  indexes: {
    main: {
      pk: { field: "pk", composite: ["id"] },
      sk: { field: "sk", composite: [] },
    },
  },
});

define("templateTorture", true, "template-keyed attributes, no getters", {
  model: { entity: "m3", service: "compilespec", version: "1" },
  attributes: {
    id: { type: "string", field: "pk" },
    code: { type: ["A#1", "B#2"], field: "sk" },
    other: { type: "string" },
  },
  indexes: {
    main: {
      pk: { field: "pk", composite: ["id"], template: "USER#${id}" },
      sk: { field: "sk", composite: ["code"], template: "PRE#${code}#POST" },
    },
  },
});

define("putEcho", true, "template keys + set attr, no getters", {
  model: { entity: "mecho", service: "compilespec", version: "1" },
  attributes: {
    id: { type: "string", field: "pk" },
    code: { type: ["A#1", "B#2"], field: "sk" },
    other: { type: "string" },
    tags: { type: "set", items: "string" },
  },
  indexes: {
    main: {
      pk: { field: "pk", composite: ["id"], template: "USER#${id}" },
      sk: { field: "sk", composite: ["code"], template: "PRE#${code}#POST" },
    },
  },
});

define(
  "getterWatcherTorture",
  false,
  "user getters at top level, on watchers, on set attr",
  {
    model: { entity: "m4", service: "compilespec", version: "1" },
    attributes: {
      id: { type: "string" },
      a: { type: "string", get: (v) => v + "+A" },
      w1: {
        type: "string",
        watch: ["a"],
        get: (v, s) => JSON.stringify([v, s.a, s.w2]),
      },
      w2: {
        type: "string",
        watch: ["a"],
        get: (v, s) => JSON.stringify([v, s.a, s.w1]),
      },
      star: {
        type: "map",
        properties: { x: { type: "string" } },
        watch: "*",
        get: (v) => v,
      },
      gU: { type: "string", get: () => undefined },
      setG: { type: "set", items: "string", get: (v) => v },
      hidG: {
        type: "string",
        hidden: true,
        get: () => {
          throw new Error("must never run");
        },
      },
    },
    indexes: {
      main: {
        pk: { field: "pk", composite: ["id"] },
        sk: { field: "sk", composite: [] },
      },
    },
  },
);

// order-dependently legal: x{field:x2} declared before a{field:x} (EC-15)
define(
  "collisionLegal",
  true,
  "field/name collision, legal order, no getters",
  {
    model: { entity: "m5a", service: "compilespec", version: "1" },
    attributes: {
      id: { type: "string" },
      x: { type: "string", field: "x2" },
      a: { type: "string", field: "x" },
    },
    indexes: {
      main: {
        pk: { field: "pk", composite: ["id"] },
        sk: { field: "sk", composite: [] },
      },
    },
  },
);

define("deepGetter", false, "user get on map>list>map leaf (depth 3)", {
  model: { entity: "m5b", service: "compilespec", version: "1" },
  attributes: {
    id: { type: "string" },
    deep: {
      type: "map",
      properties: {
        l: {
          type: "list",
          items: {
            type: "map",
            properties: { leaf: { type: "string", get: (v) => v } },
          },
        },
      },
    },
  },
  indexes: {
    main: {
      pk: { field: "pk", composite: ["id"] },
      sk: { field: "sk", composite: [] },
    },
  },
});

// Shape is load-bearing: the spec pins per-type pass-2 epilogue artifacts for this exact model.
define(
  "getterlessWatchers",
  true,
  "watchers & watch:'*' with neither get nor set — does not gate",
  {
    model: { entity: "w", service: "compilespec", version: "1" },
    attributes: {
      id: { type: "string" },
      a: { type: "string" },
      b: { type: "string" },
      wS: { type: "string", watch: ["a"] },
      wL: { type: "list", items: { type: "string" }, watch: ["a"] },
      wM: { type: "map", properties: { x: { type: "string" } }, watch: ["a"] },
      wSet: { type: "set", items: "string", watch: ["a"] },
      wAny: { type: "any", watch: ["a"] },
      wMulti: { type: "string", watch: ["a", "b"] },
      wStar: { type: "string", watch: "*" },
      wStarL: { type: "list", items: { type: "string" }, watch: "*" },
      wStarM: {
        type: "map",
        properties: { x: { type: "string" } },
        watch: "*",
      },
      wStarSet: { type: "set", items: "string", watch: "*" },
    },
    indexes: {
      main: {
        pk: { field: "pk", composite: ["id"] },
        sk: { field: "sk", composite: [] },
      },
    },
  },
);

define(
  "watcherOfWatchAll",
  true,
  "getter-less watcher watching a watch:'*' attribute",
  {
    model: { entity: "wcw", service: "compilespec", version: "1" },
    attributes: {
      id: { type: "string" },
      star: { type: "string", watch: "*" },
      w: { type: "string", watch: ["star"] },
    },
    indexes: {
      main: {
        pk: { field: "pk", composite: ["id"] },
        sk: { field: "sk", composite: [] },
      },
    },
  },
);

// fields containing \r, \t and spaces — kills naive codegen quoting
define("whitespaceFields", true, "whitespace-bearing fields, no getters", {
  model: { entity: "wsf", service: "compilespec", version: "1" },
  attributes: {
    id: { type: "string" },
    cr: { type: "string", field: "car\rriage" },
    tab: { type: "string", field: "ta\tb" },
    sp: { type: "string", field: "with space" },
  },
  indexes: {
    main: {
      pk: { field: "pk", composite: ["id"] },
      sk: { field: "sk", composite: [] },
    },
  },
});

define(
  "hiddenWatched",
  true,
  "getter-less watcher watching a hidden attribute",
  {
    model: { entity: "wh", service: "compilespec", version: "1" },
    attributes: {
      id: { type: "string" },
      h: { type: "string", hidden: true },
      wOfH: { type: "string", watch: ["h"] },
    },
    indexes: {
      main: {
        pk: { field: "pk", composite: ["id"] },
        sk: { field: "sk", composite: [] },
      },
    },
  },
);

define("readCounts", true, "plain scalar + map child, no getters", {
  model: { entity: "rc", service: "compilespec", version: "1" },
  attributes: {
    id: { type: "string" },
    s: { type: "string" },
    m: { type: "map", properties: { x: { type: "string" } } },
  },
  indexes: {
    main: {
      pk: { field: "pk", composite: ["id"] },
      sk: { field: "sk", composite: [] },
    },
  },
});

define("settersOnly", true, "setters at every depth — setters never gate", {
  model: { entity: "setonly", service: "compilespec", version: "1" },
  attributes: {
    id: { type: "string" },
    s: { type: "string", set: (v) => v },
    m: { type: "map", properties: { x: { type: "string", set: (v) => v } } },
    l: { type: "list", items: { type: "string", set: (v) => v } },
    st: { type: "set", items: "string", set: (v) => v },
  },
  indexes: {
    main: {
      pk: { field: "pk", composite: ["id"] },
      sk: { field: "sk", composite: [] },
    },
  },
});

define("topGet", false, "one top-level user get", {
  model: { entity: "topget", service: "compilespec", version: "1" },
  attributes: {
    id: { type: "string" },
    s: { type: "string", get: (v) => v },
  },
  indexes: {
    main: {
      pk: { field: "pk", composite: ["id"] },
      sk: { field: "sk", composite: [] },
    },
  },
});

define("nestedMapGet", false, "user get on a map child", {
  model: { entity: "nmget", service: "compilespec", version: "1" },
  attributes: {
    id: { type: "string" },
    m: { type: "map", properties: { x: { type: "string", get: (v) => v } } },
  },
  indexes: {
    main: {
      pk: { field: "pk", composite: ["id"] },
      sk: { field: "sk", composite: [] },
    },
  },
});

define("listItemGet", false, "user get on list items", {
  model: { entity: "liget", service: "compilespec", version: "1" },
  attributes: {
    id: { type: "string" },
    l: { type: "list", items: { type: "string", get: (v) => v } },
  },
  indexes: {
    main: {
      pk: { field: "pk", composite: ["id"] },
      sk: { field: "sk", composite: [] },
    },
  },
});

define("setAttrGet", false, "user get on a set attribute", {
  model: { entity: "saget", service: "compilespec", version: "1" },
  attributes: {
    id: { type: "string" },
    st: { type: "set", items: "string", get: (v) => v },
  },
  indexes: {
    main: {
      pk: { field: "pk", composite: ["id"] },
      sk: { field: "sk", composite: [] },
    },
  },
});

define("watchWithGet", false, "watcher WITH a user get — the get gates", {
  model: { entity: "wwg", service: "compilespec", version: "1" },
  attributes: {
    id: { type: "string" },
    a: { type: "string" },
    w: { type: "string", watch: ["a"], get: (v) => v },
  },
  indexes: {
    main: {
      pk: { field: "pk", composite: ["id"] },
      sk: { field: "sk", composite: [] },
    },
  },
});

define("watchStarWithGet", false, "watch:'*' WITH a user get — the get gates", {
  model: { entity: "wsg", service: "compilespec", version: "1" },
  attributes: {
    id: { type: "string" },
    star: { type: "string", watch: "*", get: (v) => v },
  },
  indexes: {
    main: {
      pk: { field: "pk", composite: ["id"] },
      sk: { field: "sk", composite: [] },
    },
  },
});

define(
  "nestedWatchNoGet",
  true,
  "nested watch, no get — inert on read (EC-24)",
  {
    model: { entity: "nwng", service: "compilespec", version: "1" },
    attributes: {
      id: { type: "string" },
      m: {
        type: "map",
        properties: {
          a: { type: "string" },
          b: { type: "string", watch: ["a"] },
        },
      },
    },
    indexes: {
      main: {
        pk: { field: "pk", composite: ["id"] },
        sk: { field: "sk", composite: [] },
      },
    },
  },
);

define("nestedWatchWithGet", false, "nested watch whose get gates (EC-24)", {
  model: { entity: "nwwg", service: "compilespec", version: "1" },
  attributes: {
    id: { type: "string" },
    m: {
      type: "map",
      properties: {
        a: { type: "string" },
        b: { type: "string", watch: ["a"], get: (v) => v },
      },
    },
  },
  indexes: {
    main: {
      pk: { field: "pk", composite: ["id"] },
      sk: { field: "sk", composite: [] },
    },
  },
});

define(
  "setsAndFixings",
  true,
  "sets at every level + template keys, no getters",
  {
    model: { entity: "snapsets", service: "compilespec", version: "1" },
    attributes: {
      id: { type: "string", field: "pk" },
      code: { type: ["A#1", "B#2"], field: "sk" },
      tags: { type: "set", items: "string" },
      nums: { type: "set", items: "number" },
      m: { type: "map", properties: { st: { type: "set", items: "string" } } },
      lset: { type: "list", items: { type: "set", items: "string" } },
    },
    indexes: {
      main: {
        pk: { field: "pk", composite: ["id"], template: "USER#${id}" },
        sk: { field: "sk", composite: ["code"], template: "PRE#${code}#POST" },
      },
    },
  },
);

define(
  "hiddenProjection",
  true,
  "hidden attrs of every type + nested hidden set (EC-43), no getters",
  {
    model: { entity: "snaphidden", service: "compilespec", version: "1" },
    attributes: {
      id: { type: "string" },
      0: { type: "string", field: "zero_f" },
      visible: { type: "string" },
      hidS: { type: "string", hidden: true },
      hidL: { type: "list", items: { type: "string" }, hidden: true },
      hidM: {
        type: "map",
        properties: { x: { type: "string" } },
        hidden: true,
      },
      hidSet: { type: "set", items: "string", hidden: true },
      m: {
        type: "map",
        properties: {
          x: { type: "string" },
          hs: { type: "set", items: "string", hidden: true }, // EC-43 leak
        },
      },
    },
    indexes: {
      main: {
        pk: { field: "pk", composite: ["id"] },
        sk: { field: "sk", composite: [] },
      },
    },
  },
);

function collectionMember(entity) {
  return {
    model: { entity, service: "compilesvc", version: "1" },
    attributes: {
      prop1: { type: "string" },
      prop2: { type: "string" },
      prop3: { type: "string" },
    },
    indexes: {
      main: {
        pk: { field: "pk", composite: ["prop1"] },
        sk: { field: "sk", composite: ["prop2"] },
        collection: "col",
      },
    },
  };
}
define(
  "collectionMemberE1",
  true,
  "plain service member, no getters",
  collectionMember("e1"),
);
define(
  "collectionMemberE2",
  true,
  "plain service member, no getters",
  collectionMember("e2"),
);

module.exports = { TABLE, registry };
