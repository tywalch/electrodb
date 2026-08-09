"use strict";

const path = require("path");
const fs = require("fs");
const { execFileSync } = require("child_process");
const { expect } = require("chai");
const { Entity } = require("../src/entity");
const { Service } = require("../src/service");
const { DynamoDBSet } = require("../src/set");
const c = require("../src/client");
const { TABLE, registry } = require("./models/compile.models.js");

const FORMAT_PATH = path.resolve(__dirname, "../src/format.js");
const format = require("../src/format.js");

describe("JIT compiled item formatter", () => {
  let suiteEnvHad, suiteEnvPrev;
  before(() => {
    suiteEnvHad = hasOwn(process.env, "ELECTRODB_COMPILE");
    suiteEnvPrev = process.env.ELECTRODB_COMPILE;
    delete process.env.ELECTRODB_COMPILE;
  });
  after(() => {
    if (suiteEnvHad) process.env.ELECTRODB_COMPILE = suiteEnvPrev;
    else delete process.env.ELECTRODB_COMPILE;
  });

  describe("A. module surface (src/format.js)", () => {
    it("exports { supportsCompilation, compileDocumentFormatter, runtime }", () => {
      expect(format.supportsCompilation).to.be.a("function");
      expect(format.compileDocumentFormatter).to.be.a("function");
      expect(format.runtime).to.be.an("object");
      expect(format.runtime.fromSet, "runtime.fromSet").to.be.a("function");
      expect(format.runtime.hasOwn, "runtime.hasOwn").to.be.a("function");
    });

    it("supportsCompilation() returns true where new Function works", () => {
      expect(format.supportsCompilation()).to.equal(true);

      expect(format.supportsCompilation()).to.equal(true);
    });

    it("runtime.hasOwn: own-key check, undefined-value and inherited-prop aware", () => {
      const proto = { inherited: 1 };
      const obj = Object.create(proto);
      obj.present = undefined;
      expect(format.runtime.hasOwn(obj, "present")).to.equal(true);
      expect(format.runtime.hasOwn(obj, "inherited")).to.equal(false);
      expect(format.runtime.hasOwn(obj, "missing")).to.equal(false);
      expect(format.runtime.hasOwn(Object.create(null), "x")).to.equal(false);
    });

    it("runtime.fromSet: fromDDBSet duck-typing order (EC-39)", () => {
      const { fromSet } = format.runtime;
      expect(fromSet({ wrapperName: "Set", values: ["x", "y"] })).to.deep.equal(
        ["x", "y"],
      );
      expect(fromSet(new DynamoDBSet(["a", "b"], "string"))).to.deep.equal([
        "a",
        "b",
      ]);
      expect(fromSet(new Set(["b", "a"]))).to.deep.equal(["b", "a"]);
      const arr = ["k"];
      expect(
        fromSet(arr),
        "arrays pass through unchanged (same reference)",
      ).to.equal(arr);
      const obj = { foo: 1 };
      expect(fromSet(obj), "plain objects pass through unchanged").to.equal(
        obj,
      );
      expect(fromSet("zz")).to.equal("zz");
      expect(fromSet(7)).to.equal(7);
      expect(fromSet(null)).to.equal(null);
      expect(fromSet(undefined)).to.equal(undefined);
    });

    it("sameFormatted: verify comparator semantics (T6)", () => {
      const { sameFormatted } = format;
      expect(
        sameFormatted({ a: NaN }, { a: NaN }),
        "NaN vs NaN equal (Object.is)",
      ).to.equal(true);
      expect(sameFormatted({ a: -0 }, { a: 0 }), "-0 vs 0 not equal").to.equal(
        false,
      );
      expect(
        sameFormatted([1, 2], [1, 3]),
        "equal-length array content mismatch",
      ).to.equal(false);
      expect(
        sameFormatted([,], [undefined]),
        "hole vs explicit undefined",
      ).to.equal(false); // eslint-disable-line no-sparse-arrays
      expect(
        sameFormatted({ a: { b: 1 } }, { a: { b: 1, c: undefined } }),
        "nested extra own key",
      ).to.equal(false);
      expect(
        sameFormatted({ a: undefined }, {}),
        "own-key-set sensitivity at top level",
      ).to.equal(false);
      expect(
        sameFormatted({ a: [1, { b: "x" }] }, { a: [1, { b: "x" }] }),
        "deep equal",
      ).to.equal(true);
    });

    it("compiled.source ends with the sourceURL marker", () => {
      const compiled = getCompiled(pair("orderRemapTorture").jit, "sourceURL");
      expect(
        compiled.source
          .trimEnd()
          .endsWith("//# sourceURL=electrodb-jit-format.js"),
      ).to.equal(true);
    });
  });

  describe("B. eligibility gate (compileDocumentFormatter direct)", () => {
    for (const name of Object.keys(registry)) {
      const def = registry[name];
      it(`${name}: ${
        def.eligible ? "eligible → compiled object" : "INELIGIBLE → null"
      } (${def.why})`, () => {
        const entity = pair(name).plain;
        const result = format.compileDocumentFormatter(entity.model.schema, {
          strict: true,
        });
        if (def.eligible) {
          expect(result, name).to.be.an("object");
          expect(result.fromDocument).to.be.a("function");
          expect(result.source).to.be.a("string");
        } else {
          expect(result, name).to.equal(null);
        }
      });
    }

    it("ineligibility is silent even in strict mode (null, no throw)", () => {
      const entity = pair("getterWatcherTorture").plain;
      let result;
      expect(() => {
        result = format.compileDocumentFormatter(entity.model.schema, {
          strict: true,
        });
      }).to.not.throw();
      expect(result).to.equal(null);
    });

    it("eligible-but-codegen-throws: strict rethrows, graceful returns null", () => {
      const schema = pair("orderRemapTorture").plain.model.schema;
      const poisoned = new Proxy(schema, {
        get(target, prop, receiver) {
          if (
            prop === "attributes" ||
            prop === "translationForRetrieval" ||
            prop === "hiddenAttributes"
          ) {
            throw new Error("intentional-codegen-failure");
          }
          return Reflect.get(target, prop, receiver);
        },
      });
      expect(() =>
        format.compileDocumentFormatter(poisoned, { strict: true }),
      ).to.throw();
      expect(
        format.compileDocumentFormatter(poisoned, { strict: false }),
      ).to.equal(null);
    });

    it("codegen is deterministic: same schema compiles to identical source", () => {
      const schema = pair("containerTorture").plain.model.schema;
      const a = format.compileDocumentFormatter(schema, { strict: true });
      const b = format.compileDocumentFormatter(schema, { strict: true });
      expect(a).to.be.an("object");
      expect(b).to.be.an("object");
      expect(a.source, "temp-name counters must reset per compile").to.equal(
        b.source,
      );
    });

    it("gate does not miss a user getter hidden by a traverser path collision", () => {
      const model = {
        model: { entity: "collideget", service: "compilespec", version: "1" },
        attributes: {
          id: { type: "string" },
          map: {
            type: "map",
            properties: { cf: { type: "string", get: (v) => v + "!!" } },
          },
          other: {
            type: "map",
            properties: { cf2: { type: "string", field: "cf" } },
          },
        },
        indexes: {
          main: {
            pk: { field: "pk", composite: ["id"] },
            sk: { field: "sk", composite: [] },
          },
        },
      };
      const plain = new Entity(model, { table: TABLE });
      const jit = new Entity(model, { table: TABLE, compile: true });

      expectNotCompiled(jit, "user-getter-behind-collision");

      const item = { id: "1", map: { cf: "hello" }, other: { cf: "world" } };
      const viaJit = jit.parse({ Attributes: item });
      const viaPlain = plain.parse({ Attributes: item });
      expectSame(viaJit.data, viaPlain.data, "collision-getter parity");
      expect(viaJit.data.map.cf).to.equal("hello!!");
    });
  });

  describe("C. no-silent-fallback eligibility table (Entity + compile:true)", () => {
    const DEFINITION_FILE_CLASSIFICATION = {
      "castkeys.json": "dynamodb-table-definition",
      "composite-projection.json": "dynamodb-table-definition",
      "customkeys.json": "dynamodb-table-definition",
      "issue530.json": "dynamodb-table-definition",
      "keynamesattributenames.json": "dynamodb-table-definition",
      "keysonly.json": "dynamodb-table-definition",
      "leadingunderscorekeys.json": "dynamodb-table-definition",
      "localsecondaryindexes.json": "dynamodb-table-definition",
      "multiattribute-projections.json": "dynamodb-table-definition",
      "multiattributekeys.json": "dynamodb-table-definition",
      "nosortkey.json": "dynamodb-table-definition",
      "nostringkeys.json": "dynamodb-table-definition",
      "projection-include-without-edb.json": "dynamodb-table-definition",
      "projection-include.json": "dynamodb-table-definition",
      "reverseindex.json": "dynamodb-table-definition",
    };

    it("every test/definitions/*.json file is classified (add new files to the table)", () => {
      const files = fs
        .readdirSync(path.resolve(__dirname, "definitions"))
        .filter((f) => f.endsWith(".json"))
        .sort();
      const classified = Object.keys(DEFINITION_FILE_CLASSIFICATION).sort();
      expect(
        files,
        "unclassified definitions file — update DEFINITION_FILE_CLASSIFICATION (and the registry if it is an Entity model)",
      ).to.deep.equal(classified);
    });

    for (const name of Object.keys(registry)) {
      const def = registry[name];
      it(`${name}: schema.compiled ${
        def.eligible ? "!== null" : "=== null"
      } under compile:true (${def.why})`, () => {
        const entity = new Entity(def.model, { table: TABLE, compile: true });
        if (def.eligible) getCompiled(entity, name);
        else expectNotCompiled(entity, name);
      });
    }

    it("compile defaults to OFF: plain entity has schema.compiled === null", () => {
      const entity = new Entity(registry.orderRemapTorture.model, {
        table: TABLE,
      });
      expectNotCompiled(entity, "default-off");
    });

    it("fix #11: Service({models}, {compile:true}) compiles model-joined members", () => {
      const svc = new Service(
        {
          e1: registry.collectionMemberE1.model,
          e2: registry.collectionMemberE2.model,
        },
        { table: TABLE, compile: true },
      );
      getCompiled(svc.entities.e1, "service-model-join e1");
      getCompiled(svc.entities.e2, "service-model-join e2");
    });

    it("fix #11: pre-built Entity instance joins are a no-op for compile (already constructed)", () => {
      const e1 = new Entity(registry.collectionMemberE1.model, {
        table: TABLE,
      });
      const e2 = new Entity(registry.collectionMemberE2.model, {
        table: TABLE,
        compile: true,
      });
      const svc = new Service({ e1, e2 }, { table: TABLE, compile: true });
      expectNotCompiled(svc.entities.e1, "instance-join keeps its own mode");
      getCompiled(svc.entities.e2, "instance-join keeps compiled mode");
    });
  });

  describe("D. dispatch predicate & config surface", () => {
    function ownedItem(extra) {
      const p = pair("containerTorture");
      const item = p.plain.put({ id: "d1", s: "sv", n: 2 }).params().Item;
      return Object.assign({}, item, extra || {});
    }

    function withSpy(jit, label, fn) {
      const compiled = getCompiled(jit, label);
      const original = compiled.fromDocument;
      const calls = [];
      compiled.fromDocument = function (item, filter) {
        calls.push({ item, filter });
        return original.call(this, item, filter);
      };
      try {
        return fn(calls);
      } finally {
        compiled.fromDocument = original;
      }
    }

    it("EC-02: parse({Item}) with no options (data undefined) takes the compiled path and matches interpreted", () => {
      const p = pair("containerTorture");
      const item = ownedItem();
      withSpy(p.jit, "EC-02", (calls) => {
        const viaJit = p.jit.parse({ Item: item });
        expect(calls.length).to.equal(1);
        expect(calls[0].filter, "filter null when no attributes").to.equal(
          null,
        );
        const viaPlain = p.plain.parse({ Item: item });
        expectSame(viaJit.data, viaPlain.data, "EC-02 parity");
      });
    });

    it("EC-01: compiled path is never consulted for config.parse / data:'raw'", () => {
      const p = pair("containerTorture");
      const item = ownedItem();
      withSpy(p.jit, "EC-01", (calls) => {
        p.jit.parse({ Item: item }, { data: "raw" });
        p.jit.parse({ Item: item }, { parse: () => ({ custom: true }) });
        expect(calls.length).to.equal(0);
      });
    });

    it("EC-04: data:'includeKeys' (hydrate first pass) bails to interpreted and keeps key fields", () => {
      const p = pair("containerTorture");
      const item = ownedItem();
      withSpy(p.jit, "EC-04", (calls) => {
        const res = p.jit.parse({ Item: item }, { data: "includeKeys" });
        expect(calls.length).to.equal(0);
        expect(res.data).to.have.property("pk");
        const viaPlain = p.plain.parse({ Item: item }, { data: "includeKeys" });
        expectSame(res.data, viaPlain.data, "EC-04 parity");
      });
    });

    it("EC-03: attributes [] → null filter; ['s'] → Set filter reaches compiled fromDocument", () => {
      const p = pair("containerTorture");
      const item = ownedItem();
      withSpy(p.jit, "EC-03", (calls) => {
        const empty = p.jit.parse({ Item: item }, { attributes: [] });
        expect(calls.length).to.equal(1);
        expect(calls[0].filter, "[] → null filter").to.equal(null);

        const one = p.jit.parse({ Item: item }, { attributes: ["s"] });
        expect(calls.length).to.equal(2);
        expect(calls[1].filter, "['s'] → Set filter").to.be.instanceOf(Set);
        expect([...calls[1].filter]).to.deep.equal(["s"]);

        expectSame(
          empty.data,
          p.plain.parse({ Item: item }, { attributes: [] }).data,
          "EC-03 [] parity",
        );
        expectSame(
          one.data,
          p.plain.parse({ Item: item }, { attributes: ["s"] }).data,
          "EC-03 ['s'] parity",
        );
        expect(one.data).to.deep.equal({ s: "sv" });
      });
    });

    it("fix #1: the precomputed filter Set is passed through and reused across items", () => {
      const p = pair("containerTorture");
      const item = ownedItem();
      const filter = new Set(["s", "n"]);
      const config = {
        attributes: ["s", "n"],
        _returnAttributesFilter: filter,
      };
      withSpy(p.jit, "fix1-cache", (calls) => {
        p.jit.model.schema.formatItemForRetrieval(item, config);
        p.jit.model.schema.formatItemForRetrieval(item, config);
        expect(calls.length).to.equal(2);
        expect(calls[0].filter).to.equal(filter);
        expect(calls[1].filter, "same instance reused per item").to.equal(
          filter,
        );
      });
    });

    it("T1: attributes filter × watcher epilogue — artifact keys are pruned by the filter", () => {
      const { oracle, actual } = expectParity(
        "getterlessWatchers",
        { a: "av" },
        { attributes: ["a"] },
        "T1",
      );
      expect(Object.keys(oracle)).to.deep.equal(["a"]);
      expect(
        Object.keys(actual),
        "epilogue artifacts must respect the filter",
      ).to.deep.equal(["a"]);
    });

    it("T2: attributes filter × cold branch — key-present-undefined pruned when unrequested", () => {
      const { oracle, actual } = expectParity(
        "containerTorture",
        { s: undefined, n: 1 },
        { attributes: ["n"] },
        "T2",
      );
      expect(hasOwn(actual, "s")).to.equal(false);
      expect(hasOwn(oracle, "s")).to.equal(false);
      expect(actual).to.deep.equal({ n: 1 });
    });

    it("EC-09: legacy includeKeys:true execution option does NOT include keys (data untouched) — compiled parity", () => {
      const p = pair("containerTorture");
      const item = ownedItem();
      withSpy(p.jit, "EC-09", (calls) => {
        const res = p.jit.parse({ Item: item }, { includeKeys: true });
        expect(calls.length).to.equal(1);
        expect(res.data).to.not.have.property("pk");
        expect(res.data).to.not.have.property("sk");
        expect(res.data).to.not.have.property("__edb_e__");
        expectSame(
          res.data,
          p.plain.parse({ Item: item }, { includeKeys: true }).data,
          "EC-09 parity",
        );
      });
    });

    it("EC-06: parse({Attributes:{s:undefined}}) → null (undefined dropped ⇒ empty ⇒ null), both paths", () => {
      const p = pair("containerTorture");
      getCompiled(p.jit, "EC-06");
      const viaJit = p.jit.parse({ Attributes: { s: undefined } });
      const viaPlain = p.plain.parse({ Attributes: { s: undefined } });

      expect(viaPlain.data, "interpreted: empty ⇒ null").to.equal(null);
      expect(viaJit.data, "compiled: empty ⇒ null").to.equal(null);
    });

    it("EC-05: put echo formats request params through the compiled path (DynamoDBSet + prefixed keys)", async () => {
      const def = registry.putEcho;
      const { client } = mockClient({ put: () => ({}) });
      const plain = new Entity(def.model, { table: TABLE, client });
      const jit = new Entity(def.model, {
        table: TABLE,
        client,
        compile: true,
      });
      const compiled = getCompiled(jit, "EC-05");

      const params = plain
        .put({ id: "42", code: "A#1", other: "o", tags: ["t1", "t2"] })
        .params();
      expect(
        params.Item.tags && params.Item.tags.wrapperName,
        "fixture: set attr serialized as DynamoDBSet",
      ).to.equal("Set");
      expect(params.Item.pk).to.equal("user#42");

      let calls = 0;
      const original = compiled.fromDocument;
      compiled.fromDocument = function (...args) {
        calls += 1;
        return original.apply(this, args);
      };
      let jitRes, plainRes;
      try {
        jitRes = await jit
          .put({ id: "42", code: "A#1", other: "o", tags: ["t1", "t2"] })
          .go();
        plainRes = await plain
          .put({ id: "42", code: "A#1", other: "o", tags: ["t1", "t2"] })
          .go();
      } finally {
        compiled.fromDocument = original;
      }
      expect(calls).to.be.greaterThan(0);
      expectSame(jitRes.data, plainRes.data, "EC-05 put-echo parity");

      expect(plainRes.data).to.deep.equal({
        id: "user#42",
        code: "pre#a#1",
        other: "o",
        tags: ["t1", "t2"],
      });
    });

    it("EC-07: collection query results format each record through the compiled path (service parity)", async () => {
      const e1def = registry.collectionMemberE1;
      const e2def = registry.collectionMemberE2;
      const item1 = new Entity(e1def.model, { table: TABLE })
        .put({ prop1: "p1", prop2: "a", prop3: "x1" })
        .params().Item;
      const item2 = new Entity(e2def.model, { table: TABLE })
        .put({ prop1: "p1", prop2: "b", prop3: "x2" })
        .params().Item;

      const mkService = (compile) => {
        const { client } = mockClient({
          query: () => ({ Items: [item1, item2] }),
        });
        return new Service(
          {
            e1: new Entity(e1def.model, { table: TABLE, compile }),
            e2: new Entity(e2def.model, { table: TABLE, compile }),
          },
          { client },
        );
      };
      const jitSvc = mkService(true);
      const plainSvc = mkService(false);
      const compiled1 = getCompiled(jitSvc.entities.e1, "EC-07 e1");
      getCompiled(jitSvc.entities.e2, "EC-07 e2");

      let calls = 0;
      const original = compiled1.fromDocument;
      compiled1.fromDocument = function (...args) {
        calls += 1;
        return original.apply(this, args);
      };
      let jitRes, plainRes;
      try {
        jitRes = await jitSvc.collections.col({ prop1: "p1" }).go();
        plainRes = await plainSvc.collections.col({ prop1: "p1" }).go();
      } finally {
        compiled1.fromDocument = original;
      }
      expect(calls).to.be.greaterThan(0);
      expectSame(jitRes.data, plainRes.data, "EC-07 collection parity");
      expect(plainRes.data, "oracle sanity").to.deep.equal({
        e1: [{ prop1: "p1", prop2: "a", prop3: "x1" }],
        e2: [{ prop1: "p1", prop2: "b", prop3: "x2" }],
      });
    });
  });

  describe("E. behavior parity — top-level remap & scalars", () => {
    it("EC-11: compiled top-level key order is SCHEMA order (documented divergence); key SETS match interpreted", () => {
      const p = pair("orderRemapTorture");
      const compiled = getCompiled(p.jit, "EC-11");

      const item = {
        s: "sv",
        anyv: { a: 1 },
        'f"\\\n${y}': "w",
        num: 7,
        pk: "kp",
        zero_f: "z",
        bool: false,
        en: "TWO",
        storeLocationId: "junk-unmodeled",
      };
      const out = compiled.fromDocument(item, null);
      const oracle = interpret(p.plain, item, {});

      expect(Object.keys(out).sort()).to.deep.equal(Object.keys(oracle).sort());
      const schemaOrder = Object.keys(
        registry.orderRemapTorture.model.attributes,
      );
      const expectedOrder = schemaOrder.filter((name) => hasOwn(out, name));
      expect(Object.keys(out)).to.deep.equal(expectedOrder);
      expectSame(out, oracle, "EC-11 value parity");
    });

    it("EC-11/EC-30: nested map key order is schema property order in BOTH paths (exact parity)", () => {
      const p = pair("containerTorture");
      const compiled = getCompiled(p.jit, "EC-11-nested");
      const item = {
        m: { st: new Set([2, 1]), a_f: "A", innerAny: 9, ls: [{ q_f: "Q" }] },
      };
      const out = compiled.fromDocument(item, null);
      const oracle = interpret(p.plain, item, {});
      expect(
        Object.keys(oracle.m),
        "oracle sanity: interpreted nested order is schema order",
      ).to.deep.equal(["alias", "ls", "innerAny", "st"]);
      expect(Object.keys(out.m)).to.deep.equal(Object.keys(oracle.m));
      expectSame(out, oracle, "EC-30 parity");
    });

    it("EC-12: proto-named unmodeled fields — interpreted leaks garbage keys, compiled DROPS them (documented divergence)", () => {
      const p = pair("containerTorture");
      const compiled = getCompiled(p.jit, "EC-12");
      const item = {
        s: "v",
        constructor: "evil",
        hasOwnProperty: "evil2",
        toString: "evil3",
      };
      const oracle = interpret(p.plain, item, {});

      expect(Object.keys(oracle)).to.deep.equal([
        "s",
        "function Object() { [native code] }",
        "function hasOwnProperty() { [native code] }",
        "function toString() { [native code] }",
      ]);
      const out = compiled.fromDocument(item, null);
      expect(out, "compiled emits only modeled attrs").to.deep.equal({
        s: "v",
      });
    });

    it("EC-12b: proto-shadowing stored keys (toString/valueOf/constructor/hasOwnProperty) — compiled DROPS them; downstream {Attributes} flips object to null (documented divergence)", () => {
      const p = pair("containerTorture");
      const compiled = getCompiled(p.jit, "EC-12b");
      const item = {
        constructor: "c",
        toString: "t",
        valueOf: "v",
        hasOwnProperty: "h",
      };
      const oracle = interpret(p.plain, item, {});
      expect(
        Object.keys(oracle),
        "oracle drift — interpreted leak changed, re-pin",
      ).to.deep.equal([
        "function Object() { [native code] }",
        "function toString() { [native code] }",
        "function valueOf() { [native code] }",
        "function hasOwnProperty() { [native code] }",
      ]);
      expect(compiled.fromDocument(item, null)).to.deep.equal({});

      const viaPlain = p.plain.parse({ Attributes: { constructor: "evil" } });
      const viaJit = p.jit.parse({ Attributes: { constructor: "evil" } });
      expect(viaPlain.data, "interpreted non-null").to.deep.equal({
        "function Object() { [native code] }": "evil",
      });
      expect(viaJit.data, "compiled → null").to.equal(null);
    });

    it("EC-10: inherited enumerable props — interpreted drops them, compiled reads item[field] (documented divergence)", () => {
      const p = pair("containerTorture");
      const compiled = getCompiled(p.jit, "EC-10");
      const item = Object.create({ s: "inherited" });
      const oracle = interpret(p.plain, item, {});
      expect(
        oracle,
        "oracle sanity: Object.entries never sees inherited props",
      ).to.deep.equal({});
      const out = compiled.fromDocument(item, null);
      expect(
        out,
        "compiled item[field] reads inherited values (EC-10 ruling)",
      ).to.deep.equal({ s: "inherited" });
    });

    it("EC-14: injection-probe attribute names/fields round-trip inertly through generated code", () => {
      const p = pair("orderRemapTorture");
      const compiled = getCompiled(p.jit, "EC-14");
      const item = { 'f"\\\n${y}': "inj", zero_f: "z0" };
      const out = compiled.fromDocument(item, null);
      const oracle = interpret(p.plain, item, {});
      expect(oracle).to.deep.equal({ 0: "z0", 'we"ird\n${x}': "inj" });
      expectSame(out, oracle, "EC-14 parity");
    });

    it("T5: whitespace-bearing field names (\\r, \\t, space) round-trip identically", () => {
      const { oracle } = expectParity(
        "whitespaceFields",
        { "car\rriage": "cr", "ta\tb": "tb", "with space": "sp" },
        undefined,
        "T5",
      );
      expect(oracle).to.deep.equal({ cr: "cr", tab: "tb", sp: "sp" });
    });

    it("EC-15: attribute-name/field collision (legal declaration order) remaps by FIELD", () => {
      expectParity(
        "collisionLegal",
        { x: "vx", x2: "vx2" },
        undefined,
        "EC-15",
      );
      const { oracle } = expectParity(
        "collisionLegal",
        { x: "vx", x2: "vx2" },
        undefined,
        "EC-15b",
      );
      expect(
        oracle,
        "pinned: field x → attr a, field x2 → attr x",
      ).to.deep.equal({ a: "vx", x: "vx2" });
    });

    it("EC-16: scalar key-present-undefined is dropped (present-undefined == absent)", () => {
      const { actual } = expectParity(
        "containerTorture",
        { s: undefined, n: 1 },
        undefined,
        "EC-16",
      );
      expect(hasOwn(actual, "s")).to.equal(false);
      expect(actual).to.deep.equal({ n: 1 });
    });

    it("EC-17: falsy values (0, '', false, null, NaN, -0) pass through untouched", () => {
      const { actual } = expectParity(
        "orderRemapTorture",
        { num: NaN, bool: false, s: "", anyv: null },
        undefined,
        "EC-17a",
      );
      expect(Number.isNaN(actual.num)).to.equal(true);
      const r2 = expectParity(
        "containerTorture",
        { n: -0, s: "" },
        undefined,
        "EC-17b",
      );
      expect(Object.is(r2.actual.n, -0), "-0 must survive").to.equal(true);
      expect(r2.actual.s).to.equal("");
    });

    it("EC-25: no cast/validate on read — out-of-enum and mistyped scalars pass through", () => {
      const { actual } = expectParity(
        "orderRemapTorture",
        { en: "ZZZ", s: 123, num: "not-a-number", bool: "yes" },
        undefined,
        "EC-25",
      );
      expect(actual.en).to.equal("ZZZ");
      expect(actual.s).to.equal(123);
      expect(actual.num).to.equal("not-a-number");
      expect(actual.bool).to.equal("yes");
    });

    it("EC-26: any/custom attributes are pure passthrough incl. object identity", () => {
      const p = pair("orderRemapTorture");
      const compiled = getCompiled(p.jit, "EC-26");
      const anyObj = { deep: new Set([1]), d: new Date(0) };
      const out = compiled.fromDocument({ anyv: anyObj }, null);
      expect(out.anyv, "same reference, no clone").to.equal(anyObj);
      const oracle = interpret(p.plain, { anyv: anyObj }, {});
      expect(oracle.anyv).to.equal(anyObj);
    });

    it("EC-27/EC-28: template fixings via bound unformat closures — pinned interpreted outputs (probed)", () => {
      const cases = [
        [
          { pk: "USER#42", sk: "PRE#A#1#POST", other: "o" },
          { id: "USER#42", code: "PRE#A#1", other: "o" },
        ],
        [{ sk: "pre#a#1#post" }, { code: "pre#a#1" }],
        [{ sk: "PO" }, { code: "PO" }],
        [{ sk: 5 }, { code: 5 }],
        [{ pk: "USER#" }, { id: "" }],
        [{ sk: "#POST" }, { code: "" }],
        [{ sk: "xx#POST" }, { code: "xx" }],
        [{ sk: "PRE#abc" }, { code: "PRE#abc" }],
      ];
      for (const [item, pinned] of cases) {
        const { oracle, actual } = expectParity(
          "templateTorture",
          item,
          undefined,
          `EC-28 ${show(item)}`,
        );
        expect(
          oracle,
          `oracle drift for ${show(
            item,
          )} — interpreted behavior changed, re-pin`,
        ).to.deep.equal(pinned);
        expectSame(actual, pinned, `EC-28 pinned ${show(item)}`);
      }
    });

    it("EC-29: hidden top-level scalar is absent (no own key) in both paths", () => {
      const { actual } = expectParity(
        "hiddenProjection",
        { visible: "v", hidS: "secret" },
        undefined,
        "EC-29",
      );
      expect(hasOwn(actual, "hidS")).to.equal(false);
      expect(actual.visible).to.equal("v");
    });
  });

  describe("F. behavior parity — containers (maps & lists)", () => {
    it("EC-30: nested map — alias remap, hidden children dropped, unknown nested keys dropped, falsy kept", () => {
      const item = {
        m: {
          a_f: "",
          hidStr: "gone",
          unknown_nested: "dropped",
          innerAny: 0,
          ls: [{ q_f: "Q", junk: 1 }],
        },
      };
      const { oracle, actual } = expectParity(
        "containerTorture",
        item,
        undefined,
        "EC-30",
      );
      expect(oracle.m).to.deep.equal({
        alias: "",
        ls: [{ q: "Q" }],
        innerAny: 0,
      });
      expect(hasOwn(actual.m, "hidStr")).to.equal(false);
      expect(hasOwn(actual.m, "unknown_nested")).to.equal(false);
    });

    it("EC-31: map key-present-undefined is dropped (present-undefined == absent)", () => {
      const { actual } = expectParity(
        "containerTorture",
        { m: undefined, s: "x" },
        undefined,
        "EC-31",
      );
      expect(hasOwn(actual, "m")).to.equal(false);
      expect(actual).to.deep.equal({ s: "x" });
    });

    it("EC-33: map value of wrong type is silently mangled, not rejected (pinned fixtures)", () => {
      let r = expectParity(
        "containerTorture",
        { m: "abc" },
        undefined,
        "EC-33 m:'abc'",
      );
      expect(r.oracle).to.deep.equal({ m: {} });
      r = expectParity(
        "containerTorture",
        { m: ["q", "r"] },
        undefined,
        "EC-33 m:[..]",
      );
      expect(r.oracle).to.deep.equal({ m: {} });

      r = expectParity(
        "mapIndexFields",
        { m: "qr" },
        undefined,
        "EC-33 midx m:'qr'",
      );
      expect(r.oracle).to.deep.equal({ m: { zero: "q", len: 2 } });
      r = expectParity(
        "mapIndexFields",
        { m: ["q", "r"] },
        undefined,
        "EC-33 midx m:[..]",
      );
      expect(r.oracle).to.deep.equal({ m: { zero: "q", len: 2 } });
      r = expectParity("mapIndexFields", { m: 5 }, undefined, "EC-33 midx m:5");
      expect(r.oracle).to.deep.equal({ m: {} });
      r = expectParity(
        "mapIndexFields",
        { m: true },
        undefined,
        "EC-33 midx m:true",
      );
      expect(r.oracle).to.deep.equal({ m: {} });
    });

    it("EC-35: list key-present-undefined is dropped (no longer coerced to [])", () => {
      const { actual } = expectParity(
        "containerTorture",
        { l: undefined },
        undefined,
        "EC-35",
      );
      expect(hasOwn(actual, "l"), "omitted, not []").to.equal(false);
      expect(actual).to.deep.equal({});
    });

    it("EC-36: proper scalar array round-trips identically (null kept)", () => {
      const { oracle, actual } = expectParity(
        "containerTorture",
        { l: ["x", "y", null] },
        undefined,
        "EC-36",
      );
      expect(oracle.l).to.deep.equal(["x", "y", null]);
      expect(actual.l).to.deep.equal(["x", "y", null]);
    });

    it("EC-36b: container-list loop drops the undefined guard (documented divergence)", () => {
      const p = pair("containerTorture");
      const compiled = getCompiled(p.jit, "EC-36b");

      const dense = { lm: [{ q: "a" }, { q: "b" }] };
      expectSame(
        compiled.fromDocument(dense, null),
        interpret(p.plain, dense, undefined),
        "EC-36b dense",
      );

      const sparse = { lm: [{ q: "a" }, , undefined, { q: "b" }] }; // eslint-disable-line no-sparse-arrays
      expect(interpret(p.plain, sparse, undefined).lm).to.deep.equal([
        { q: "a" },
        { q: "b" },
      ]);
      expect(() => compiled.fromDocument(sparse, null)).to.throw();

      const lsetSparse = { lset: [new Set(["a"]), undefined] };
      expect(interpret(p.plain, lsetSparse, undefined).lset).to.deep.equal([
        ["a"],
      ]);
      expect(compiled.fromDocument(lsetSparse, null).lset).to.deep.equal([
        ["a"],
        undefined,
      ]);
    });

    it("EC-37: scalar list fast path skips for..of coercion/compaction (documented divergence)", () => {
      const p = pair("containerTorture");
      const compiled = getCompiled(p.jit, "EC-37");

      let item = { l: "abc" };
      expect(interpret(p.plain, item, undefined).l).to.deep.equal([
        "a",
        "b",
        "c",
      ]);
      expect(compiled.fromDocument(item, null).l).to.equal("abc");

      item = { l: new Set(["p", "q"]) };
      expect(interpret(p.plain, item, undefined).l).to.deep.equal(["p", "q"]);
      expect(compiled.fromDocument(item, null).l).to.be.instanceOf(Set);

      const sparse = ["x", , "y", undefined]; // eslint-disable-line no-sparse-arrays
      item = { l: sparse };
      expect(interpret(p.plain, item, undefined).l).to.deep.equal(["x", "y"]);
      expect(compiled.fromDocument(item, null).l).to.equal(sparse);
    });

    it("EC-38: deep composition — list<map> remap, set-in-list conversion", () => {
      let r = expectParity(
        "containerTorture",
        { m: { ls: [{ q_f: "deep" }] } },
        undefined,
        "EC-38 nest",
      );
      expect(r.oracle).to.deep.equal({ m: { ls: [{ q: "deep" }] } });
      r = expectParity(
        "containerTorture",
        { lset: [new Set(["a", "b"])] },
        undefined,
        "EC-38 lset",
      );
      expect(r.oracle).to.deep.equal({ lset: [["a", "b"]] });
    });

    it("EC-34/EC-47: fresh output objects, deep-frozen input formats safely, input never mutated", () => {
      const p = pair("containerTorture");
      const compiled = getCompiled(p.jit, "EC-34");
      const innerAny = Object.freeze({ z: 1 });
      const item = Object.freeze({
        s: "a",
        m: Object.freeze({
          a_f: "A",
          innerAny,
          ls: Object.freeze([Object.freeze({ q_f: "Q" })]),
        }),
        l: Object.freeze(["x"]),
      });
      const out = compiled.fromDocument(item, null);
      const oracle = interpret(p.plain, item, {});
      expectSame(out, oracle, "EC-34 parity");
      expect(out).to.not.equal(item);
      expect(out.m, "map output must be a fresh object").to.not.equal(item.m);
      expect(out.m.innerAny, "any children keep input references").to.equal(
        innerAny,
      );

      expect(out.l, "scalar list shared by reference").to.equal(item.l);
    });
  });

  describe("G. behavior parity — sets", () => {
    it("EC-39: fromDDBSet duck-typing through the full formatter (each input shape)", () => {
      let r = expectParity(
        "containerTorture",
        { topSet: new Set(["a", "b"]) },
        undefined,
        "EC-39 native",
      );
      expect(r.oracle).to.deep.equal({ topSet: ["a", "b"] });
      r = expectParity(
        "containerTorture",
        { topSet: new DynamoDBSet(["a", "b"], "string") },
        undefined,
        "EC-39 ddbset",
      );
      expect(r.oracle).to.deep.equal({ topSet: ["a", "b"] });
      r = expectParity(
        "containerTorture",
        { topSet: { wrapperName: "Set", values: ["x", "y"] } },
        undefined,
        "EC-39 wrapper",
      );
      expect(r.oracle).to.deep.equal({ topSet: ["x", "y"] });
      r = expectParity(
        "containerTorture",
        { topSet: "zz" },
        undefined,
        "EC-39 string",
      );
      expect(r.oracle).to.deep.equal({ topSet: "zz" });
      r = expectParity(
        "containerTorture",
        { topSet: 7 },
        undefined,
        "EC-39 number",
      );
      expect(r.oracle).to.deep.equal({ topSet: 7 });
    });

    it("EC-39: arrays and plain objects pass through a set attribute by REFERENCE", () => {
      const p = pair("containerTorture");
      const compiled = getCompiled(p.jit, "EC-39-identity");
      const arr = ["k"];
      expect(compiled.fromDocument({ topSet: arr }, null).topSet).to.equal(arr);
      expect(interpret(p.plain, { topSet: arr }, {}).topSet).to.equal(arr);
      const obj = { foo: 1 };
      expect(compiled.fromDocument({ topSet: obj }, null).topSet).to.equal(obj);
      expect(interpret(p.plain, { topSet: obj }, {}).topSet).to.equal(obj);
    });

    it("EC-42: set key-present-undefined is dropped (present-undefined == absent)", () => {
      const { actual } = expectParity(
        "containerTorture",
        { topSet: undefined, s: "x" },
        undefined,
        "EC-42",
      );
      expect(hasOwn(actual, "topSet")).to.equal(false);
      expect(actual).to.deep.equal({ s: "x" });
    });

    it("EC-43: hidden sets are pruned everywhere (nested + top-level) since #580", () => {
      const item = {
        m: {
          a_f: "A",
          hidStr: "H",
          hidSet: new Set(["a"]),
          st: new Set([1, 2]),
        },
        hidTopSet: new Set(["x"]),
        topSet: new Set(["y"]),
      };
      const { oracle, actual } = expectParity(
        "containerTorture",
        item,
        undefined,
        "EC-43",
      );

      expect(oracle.m).to.deep.equal({ alias: "A", st: [1, 2] });
      expect(hasOwn(oracle, "hidTopSet")).to.equal(false);
      expect(hasOwn(actual.m, "hidSet"), "nested pruned").to.equal(false);
      expect(hasOwn(actual, "hidTopSet"), "top-level pruned").to.equal(false);

      const r2 = expectParity(
        "hiddenProjection",
        { m: { x: "x", hs: new Set(["a"]) } },
        undefined,
        "EC-43b",
      );
      expect(r2.oracle.m).to.deep.equal({ x: "x" });
    });

    it("EC-49: BigInt values pass through set and any attributes", () => {
      const { actual } = expectParity(
        "containerTorture",
        { topSet: 10n, anyv: 10n },
        undefined,
        "EC-49",
      );
      expect(actual.topSet).to.equal(10n);
      expect(actual.anyv).to.equal(10n);
    });
  });

  describe("H. hidden sweep & returnAttributes filtering", () => {
    it("EC-45: hidden top-level attributes of every type are omitted; visible ones survive", () => {
      const item = {
        visible: "v",
        zero_f: "z",
        hidS: "s",
        hidL: ["a"],
        hidM: { x: "x" },
        hidSet: new Set(["s"]),
      };
      const { oracle, actual } = expectParity(
        "hiddenProjection",
        item,
        undefined,
        "EC-45",
      );
      expect(Object.keys(oracle).sort()).to.deep.equal(["0", "visible"]);
      expect(Object.keys(actual).sort()).to.deep.equal(["0", "visible"]);
    });

    it("EC-45: hidden beats an explicit attributes filter naming the hidden attribute", () => {
      const { actual } = expectParity(
        "hiddenProjection",
        { visible: "v", hidS: "s" },
        { attributes: ["hidS"] },
        "EC-45-filter",
      );
      expect(actual).to.deep.equal({});
    });

    it("returnAttributes Set prunes identifiers, key composites and unrequested attributes", () => {
      const p = pair("collectionMemberE1");
      const compiled = getCompiled(p.jit, "returnAttributes");
      const full = p.plain
        .put({ prop1: "p1", prop2: "a", prop3: "x1" })
        .params().Item;

      const out = compiled.fromDocument(full, new Set(["prop3"]));
      expect(out).to.deep.equal({ prop3: "x1" });
      const oracle = interpret(p.plain, full, { attributes: ["prop3"] });
      expectSame(out, oracle, "returnAttributes parity");
    });

    it("EC-46: integer-like attribute name '0' sorts first in both paths (JS own-key order)", () => {
      const { oracle, actual } = expectParity(
        "hiddenProjection",
        { visible: "v", zero_f: "z" },
        undefined,
        "EC-46",
      );
      expect(Object.keys(oracle)[0]).to.equal("0");
      expect(Object.keys(actual)[0]).to.equal("0");
    });
  });

  describe("I. read counts on hostile inputs (EC-48)", () => {
    function countingItem() {
      let topReads = 0;
      let nestedReads = 0;
      const item = {};
      Object.defineProperty(item, "s", {
        enumerable: true,
        get() {
          topReads += 1;
          return "sv";
        },
      });
      const inner = {};
      Object.defineProperty(inner, "x", {
        enumerable: true,
        get() {
          nestedReads += 1;
          return "xv";
        },
      });
      item.m = inner;
      return { item, reads: () => ({ topReads, nestedReads }) };
    }

    it("interpreted invariant (passes today by design): 1 top-level read, 2 nested reads", () => {
      const p = pair("readCounts");
      const { item, reads } = countingItem();
      const out = interpret(p.plain, item, {});
      expect(out).to.deep.equal({ s: "sv", m: { x: "xv" } });
      expect(reads()).to.deep.equal({ topReads: 1, nestedReads: 2 });
    });

    it("compiled: exactly 1 top-level read; nested reads 1..2 (deviation from 2 must be deliberate — EC-48)", () => {
      const p = pair("readCounts");
      const compiled = getCompiled(p.jit, "EC-48");
      const { item, reads } = countingItem();
      const out = compiled.fromDocument(item, null);
      expectSame(out, { s: "sv", m: { x: "xv" } }, "EC-48 output");
      const r = reads();
      expect(r.topReads, "top-level read exactly once").to.equal(1);
      expect(
        r.nestedReads,
        "nested read 1 (temp-cached) or 2 (interpreted-parity)",
      ).to.be.within(1, 2);
    });
  });

  describe("J. error parity — raw TypeErrors and the formatResponse wrap (EC-32/33/36/37/40/41/56)", () => {
    it("EC-32: map value null throws with the identical TypeError message", () => {
      expectThrowParity("containerTorture", { m: null }, "EC-32");
    });

    it("EC-37: non-iterable list values — list<map> throws identically (still loops)", () => {
      expectThrowParity("containerTorture", { lm: 5 }, "EC-37 lm:5");
      expectThrowParity("containerTorture", { lm: {} }, "EC-37 lm:{}");
    });

    it("EC-36: null element in a list of maps throws identically", () => {
      expectThrowParity("containerTorture", { lm: [null] }, "EC-36 lm:[null]");
    });

    it("EC-41: null-prototype object in a set attribute throws; in a map attribute it succeeds", () => {
      expectThrowParity(
        "containerTorture",
        { topSet: Object.create(null) },
        "EC-41 set",
      );
      const mapVal = Object.create(null);
      mapVal.a_f = "A";
      expectParity(
        "containerTorture",
        { m: mapVal },
        undefined,
        "EC-41 map ok",
      );
    });

    it("EC-40: {wrapperName:'Set'} without iterable values throws identically", () => {
      expectThrowParity(
        "containerTorture",
        { topSet: { wrapperName: "Set" } },
        "EC-40",
      );
    });

    it("T3: native Set duck-typed as {wrapperName:'Set'} throws identically (wrapperName checked first)", () => {
      const hybrid = () =>
        Object.assign(new Set(["a", "b"]), { wrapperName: "Set" });
      const { iErr } = expectThrowParity(
        "containerTorture",
        { topSet: hybrid() },
        "T3",
      );
      expect(iErr.message).to.equal("value.values is not iterable");
    });

    it("EC-56: through entity.parse both paths wrap as ElectroError 4001 with identical message and cause", () => {
      const p = pair("containerTorture");
      getCompiled(p.jit, "EC-56");
      const plainErr = captureError(() =>
        p.plain.parse({ Attributes: { m: null } }),
      );
      const jitErr = captureError(() =>
        p.jit.parse({ Attributes: { m: null } }),
      );
      expect(plainErr, "oracle must throw").to.not.equal(null);
      expect(jitErr, "compiled must throw").to.not.equal(null);
      expect(jitErr.code).to.equal(4001);
      expect(plainErr.code).to.equal(4001);
      expect(jitErr.message).to.equal(plainErr.message);
      expect(
        jitErr.cause && jitErr.cause.message,
        "err.cause carries the raw TypeError",
      ).to.equal(plainErr.cause && plainErr.cause.message);
    });
  });

  describe("K. getter-less watchers format as ordinary attributes (#578 method-aware watch)", () => {
    function ownKeys(out) {
      const res = {};
      for (const k of Object.keys(out)) res[k] = out[k];
      return res;
    }

    it("getterlessWatchers model is ELIGIBLE and compiles", () => {
      getCompiled(pair("getterlessWatchers").jit, "watch-eligible");
    });

    it("watched present but watchers absent → no watcher keys conjured (W1)", () => {
      const { oracle, actual } = expectParity(
        "getterlessWatchers",
        { a: "av" },
        undefined,
        "W1",
      );
      expect(ownKeys(oracle)).to.deep.equal({ a: "av" });
      expect(hasOwn(actual, "wS"), "no phantom watcher key").to.equal(false);
      expect(hasOwn(actual, "wStar"), "no phantom watch:'*'").to.equal(false);
    });

    it("empty item → empty result (no watch:'*' artifacts) (W2)", () => {
      const { oracle } = expectParity(
        "getterlessWatchers",
        {},
        undefined,
        "W2",
      );
      expect(ownKeys(oracle)).to.deep.equal({});
    });

    it("watcher present in item keeps its stored value (W3)", () => {
      const { oracle } = expectParity(
        "getterlessWatchers",
        { a: "av", wS: "stored" },
        undefined,
        "W3",
      );
      expect(oracle.wS).to.equal("stored");
    });

    it("watcher present while watched absent is formatted normally (W4)", () => {
      const { oracle } = expectParity(
        "getterlessWatchers",
        { wS: "only" },
        undefined,
        "W4",
      );
      expect(ownKeys(oracle)).to.deep.equal({ wS: "only" });
    });

    it("watched present-with-undefined does not conjure watchers (W5)", () => {
      const { oracle, actual } = expectParity(
        "getterlessWatchers",
        { a: undefined },
        undefined,
        "W5",
      );
      expect(hasOwn(oracle, "a"), "undefined 'a' dropped").to.equal(false);
      expect(hasOwn(oracle, "wS"), "no watcher conjured").to.equal(false);
      expect(hasOwn(actual, "wS")).to.equal(false);
    });

    it("multi-watch attribute is not conjured when a watched attr is present (W6)", () => {
      const { oracle } = expectParity(
        "getterlessWatchers",
        { b: "bv" },
        undefined,
        "W6",
      );
      expect(ownKeys(oracle)).to.deep.equal({ b: "bv" });
    });

    it("unrelated attribute surfaces alone, no watch:'*' artifact (W7)", () => {
      const { oracle } = expectParity(
        "getterlessWatchers",
        { id: "1" },
        undefined,
        "W7",
      );
      expect(Object.keys(oracle).sort()).to.deep.equal(["id"]);
    });

    it("stored list/set watchers format through their type machinery (W8)", () => {
      const { oracle, actual } = expectParity(
        "getterlessWatchers",
        { a: "av", wL: ["x"], wSet: new Set(["s"]) },
        undefined,
        "W8",
      );
      expect(oracle.wL).to.deep.equal(["x"]);
      expect(oracle.wSet).to.deep.equal(["s"]);
      expect(actual.wSet).to.deep.equal(["s"]);
    });

    it("hidden watched attribute is pruned and its getter-less watcher is not conjured (W9)", () => {
      const { oracle, actual } = expectParity(
        "hiddenWatched",
        { h: "hv" },
        undefined,
        "W9",
      );
      expect(ownKeys(oracle)).to.deep.equal({});
      expect(hasOwn(actual, "h"), "hidden pruned").to.equal(false);
      expect(hasOwn(actual, "wOfH"), "watcher not conjured").to.equal(false);
    });

    it("EC-24: nested watch without get is inert AND eligible", () => {
      getCompiled(pair("nestedWatchNoGet").jit, "EC-24");
      const { oracle } = expectParity(
        "nestedWatchNoGet",
        { m: { a: "A" } },
        undefined,
        "EC-24",
      );
      expect(oracle).to.deep.equal({ m: { a: "A" } });
    });

    it("fix #2: a watcher watching a watch:'*' attribute is NEVER triggered by its presence (phantom key)", () => {
      getCompiled(pair("watcherOfWatchAll").jit, "fix2");

      let r = expectParity(
        "watcherOfWatchAll",
        { star: "S" },
        undefined,
        "fix2 star-only",
      );
      expect(hasOwn(r.oracle, "w"), "oracle: no phantom w").to.equal(false);
      expect(hasOwn(r.actual, "w"), "compiled: no phantom w").to.equal(false);
      expect(hasOwn(r.actual, "star")).to.equal(true);
      r = expectParity(
        "watcherOfWatchAll",
        { star: "S", w: "W" },
        undefined,
        "fix2 both",
      );
      expect(r.actual.w).to.equal("W");
      r = expectParity("watcherOfWatchAll", {}, undefined, "fix2 empty");
      expect(ownKeys(r.oracle)).to.deep.equal({});
      r = expectParity(
        "watcherOfWatchAll",
        { w: "W" },
        undefined,
        "fix2 w-only",
      );
      expect(ownKeys(r.oracle)).to.deep.equal({ w: "W" });
    });

    it("ineligible gettered entities still construct and format via interpreted fallback", () => {
      const p = pair("getterWatcherTorture");
      expectNotCompiled(p.jit, "gettered-fallback");
      const out = p.jit.parse({ Attributes: { a: "raw" } });
      expect(out.data.a, "interpreted getter runs").to.equal("raw+A");
    });
  });

  describe("L. differential fuzz (seeded, deterministic)", () => {
    const N = 500;
    const SEED = 0xe1ec720;

    const stringPool = [
      "",
      "a",
      "A",
      "user#42",
      "USER#42",
      "PRE#A#1#POST",
      "pre#a#1#post",
      "#POST",
      "PO",
      "0",
      "line\nbreak",
      'q"uo\\te',
      "π🙂",
      "car\rriage",
      "ta\tb",
      " ",
      "\uD800",
    ];
    const numberPool = [
      0,
      -0,
      1,
      -1.5,
      NaN,
      Infinity,
      -Infinity,
      9007199254740992,
      0.1,
    ];
    const junkPool = [null, true, false, 0, "", "zz", 42];

    function genScalar(rng, kind) {
      if (rng() < 0.12) return pick(rng, junkPool);
      switch (kind) {
        case "string":
        case "enum":
          return pick(rng, stringPool);
        case "number":
          return pick(rng, numberPool);
        case "boolean":
          return rng() < 0.5;
        default:
          return pick(rng, junkPool);
      }
    }

    function genList(rng, hostile, spec) {
      const scalar = !(spec && spec.itemKind);
      const roll = rng();
      if (!scalar) {
        if (hostile && roll < 0.04) return pick(rng, [5, null, {}]);
        if (roll < 0.12) return pick(rng, stringPool);
        if (roll < 0.2)
          return new Set([pick(rng, stringPool), pick(rng, stringPool)]);
      }
      if (roll < 0.24) return [];
      const len = Math.floor(rng() * 4);
      const arr = [];
      const element = () => {
        if (spec && spec.itemKind === "map")
          return genMapValue(rng, spec.children || [], hostile);
        if (spec && spec.itemKind === "set") return genSet(rng, hostile);
        return pick(rng, stringPool);
      };
      for (let i = 0; i < len; i++) {
        if (rng() < 0.2) arr.push(null);
        else arr.push(element());
      }
      return arr;
    }

    function genSet(rng, hostile) {
      const roll = rng();
      if (hostile && roll < 0.03) return { wrapperName: "Set" };
      if (hostile && roll < 0.05)
        return Object.assign(new Set([pick(rng, stringPool)]), {
          wrapperName: "Set",
        });
      if (roll < 0.1) return new Set();
      if (roll < 0.2) return new Set([pick(rng, stringPool)]);
      if (roll < 0.35)
        return {
          wrapperName: "Set",
          values: [pick(rng, stringPool), pick(rng, stringPool)],
        };
      if (roll < 0.45)
        return new DynamoDBSet([pick(rng, stringPool) || "x"], "string");
      if (roll < 0.5) return new DynamoDBSet([], "string");
      if (roll < 0.6) return [pick(rng, stringPool)];
      if (roll < 0.65) return [];
      if (roll < 0.75) return { foo: 1 };
      return pick(rng, ["zz", 7, null]);
    }

    function genAny(rng) {
      return pick(rng, [
        { a: 1 },
        [1, 2],
        new Set([1]),
        "s",
        7,
        null,
        10n,
        { nested: { deep: [true] } },
      ]);
    }

    function genMapValue(rng, fields, hostile) {
      const roll = rng();
      if (hostile && roll < 0.03) return null;
      if (roll < 0.15) return pick(rng, ["abc", ["q", "r"], 7, true]);
      if (roll < 0.19) return {};
      const obj = {};
      for (const f of fields) {
        if (rng() < 0.6) obj[f.field] = genFieldValue(rng, f, hostile);
      }
      if (rng() < 0.3) obj.unknown_nested = "u";
      return obj;
    }

    function genFieldValue(rng, spec, hostile) {
      if (rng() < 0.08) return undefined;
      switch (spec.kind) {
        case "list":
          return genList(rng, hostile, spec);
        case "set":
          return genSet(rng, hostile);
        case "map":
          return genMapValue(rng, spec.children, hostile);
        case "any":
          return genAny(rng);
        default:
          return genScalar(rng, spec.kind);
      }
    }

    const fieldSpecs = {
      orderRemapTorture: [
        { field: "storeLocationId", kind: "string" },
        { field: "zero_f", kind: "string" },
        { field: 'f"\\\n${y}', kind: "string" },
        { field: "bool", kind: "boolean" },
        { field: "num", kind: "number" },
        { field: "en", kind: "enum" },
        { field: "s", kind: "string" },
        { field: "anyv", kind: "any" },
        { field: "id", kind: "string" },
        { field: "pk", kind: "string" },
        { field: "sk", kind: "string" },
        { field: "__edb_e__", kind: "string" },
        { field: "__edb_v__", kind: "string" },
        { field: "unknown_top", kind: "string" },
      ],
      containerTorture: [
        { field: "id", kind: "string" },
        { field: "s", kind: "string" },
        { field: "n", kind: "number" },
        {
          field: "m",
          kind: "map",
          children: [
            { field: "a_f", kind: "string" },
            { field: "hidStr", kind: "string" },
            { field: "hidSet", kind: "set" },
            {
              field: "ls",
              kind: "list",
              itemKind: "map",
              children: [{ field: "q_f", kind: "string" }],
            },
            { field: "innerAny", kind: "any" },
            { field: "st", kind: "set" },
          ],
        },
        { field: "l", kind: "list" },
        {
          field: "lm",
          kind: "list",
          itemKind: "map",
          children: [{ field: "q", kind: "string" }],
        },
        { field: "lset", kind: "list", itemKind: "set" },
        { field: "topSet", kind: "set" },
        { field: "hidTopSet", kind: "set" },
        { field: "anyv", kind: "any" },
        { field: "pk", kind: "string" },
        { field: "sk", kind: "string" },
        { field: "__edb_e__", kind: "string" },
        { field: "unknown_top", kind: "string" },
      ],
      templateTorture: [
        { field: "pk", kind: "string" },
        { field: "sk", kind: "string" },
        { field: "other", kind: "string" },
        { field: "__edb_e__", kind: "string" },
        { field: "unknown_top", kind: "string" },
      ],
      getterlessWatchers: [
        { field: "id", kind: "string" },
        { field: "a", kind: "string" },
        { field: "b", kind: "string" },
        { field: "wS", kind: "string" },
        { field: "wL", kind: "list" },
        {
          field: "wM",
          kind: "map",
          children: [{ field: "x", kind: "string" }],
        },
        { field: "wSet", kind: "set" },
        { field: "wAny", kind: "any" },
        { field: "wMulti", kind: "string" },
        { field: "wStar", kind: "string" },
        { field: "wStarL", kind: "list" },
        {
          field: "wStarM",
          kind: "map",
          children: [{ field: "x", kind: "string" }],
        },
        { field: "wStarSet", kind: "set" },
        { field: "unknown_top", kind: "string" },
      ],
    };

    function genItem(rng, specs, hostile) {
      if (rng() < 0.03) return {};
      const chosen = specs.filter(() => rng() < 0.65);

      for (let i = chosen.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [chosen[i], chosen[j]] = [chosen[j], chosen[i]];
      }
      const item = {};
      for (const spec of chosen)
        item[spec.field] = genFieldValue(rng, spec, hostile);
      return item;
    }

    for (const modelName of Object.keys(fieldSpecs)) {
      it(`${modelName}: ${N} seeded items — compiled === interpreted (values, own-key sets, thrown messages)`, () => {
        const p = pair(modelName);
        const compiled = getCompiled(p.jit, `fuzz:${modelName}`);
        const rng = mulberry32(SEED ^ modelName.length);
        const failures = [];
        for (let i = 0; i < N && failures.length < 3; i++) {
          const item = genItem(rng, fieldSpecs[modelName], true);
          let iOut, cOut, iErr, cErr;
          try {
            iOut = interpret(p.plain, item, {});
          } catch (err) {
            iErr = err;
          }
          try {
            cOut = compiled.fromDocument(item, null);
          } catch (err) {
            cErr = err;
          }
          if (!!iErr !== !!cErr) {
            failures.push(
              `#${i}: throw mismatch (interpreted ${
                iErr ? `threw "${iErr.message}"` : "returned"
              }, compiled ${
                cErr ? `threw "${cErr.message}"` : "returned"
              }) item=${show(item)}`,
            );
            continue;
          }
          if (iErr) {
            continue;
          }
          const diffs = [];
          deepDiff(cOut, iOut, "$", diffs, 0);
          if (diffs.length > 0) {
            failures.push(`#${i}: ${diffs.join("; ")} item=${show(item)}`);
          }
        }
        expect(
          failures,
          `fuzz divergences (seed ${SEED}):\n  ${failures.join("\n  ")}`,
        ).to.deep.equal([]);
      });

      it(`${modelName}: ${
        N / 2
      } seeded items with a random attributes filter — compiled === interpreted`, () => {
        const p = pair(modelName);
        const compiled = getCompiled(p.jit, `fuzz-filter:${modelName}`);
        const attributeNames = Object.keys(
          registry[modelName].model.attributes,
        );
        const rng = mulberry32((SEED ^ 0x51f7e6) + modelName.length);
        const failures = [];
        for (let i = 0; i < N / 2 && failures.length < 3; i++) {
          const item = genItem(rng, fieldSpecs[modelName], true);
          const attributes = attributeNames.filter(() => rng() < 0.4);
          const config = { attributes };
          let iOut, cOut, iErr, cErr;
          try {
            iOut = interpret(p.plain, item, config);
          } catch (err) {
            iErr = err;
          }
          try {
            cOut = compiled.fromDocument(item, filterOf(config));
          } catch (err) {
            cErr = err;
          }
          if (!!iErr !== !!cErr) {
            if (iErr && !cErr) {
              let cErrNoFilter;
              try {
                compiled.fromDocument(item, null);
              } catch (err) {
                cErrNoFilter = err;
              }
              if (cErrNoFilter) {
                continue;
              }
            }
            failures.push(
              `#${i}: throw mismatch (interpreted ${
                iErr ? `threw "${iErr.message}"` : "returned"
              }, compiled ${
                cErr ? `threw "${cErr.message}"` : "returned"
              }) attrs=${show(attributes)} item=${show(item)}`,
            );
            continue;
          }
          if (iErr) {
            continue;
          }
          const diffs = [];
          deepDiff(cOut, iOut, "$", diffs, 0);
          if (diffs.length > 0) {
            failures.push(
              `#${i}: ${diffs.join("; ")} attrs=${show(attributes)} item=${show(
                item,
              )}`,
            );
          }
        }
        expect(
          failures,
          `filtered fuzz divergences (seed ${SEED}):\n  ${failures.join(
            "\n  ",
          )}`,
        ).to.deep.equal([]);
      });
    }
  });

  describe("M. compiled.source snapshots (test/snapshots/compile)", () => {
    const SNAP_DIR = path.resolve(__dirname, "snapshots", "compile");
    const SNAPSHOTS = [
      ["wide-flat", "orderRemapTorture"],
      ["nested-containers", "containerTorture"],
      ["sets-and-fixings", "setsAndFixings"],
      ["hidden-projection", "hiddenProjection"],
      ["getterless-watchers", "getterlessWatchers"],
    ];

    function headerLine(name) {
      return `# compiled.source snapshot: ${name} — regenerate with UPDATE_SNAPSHOTS=1 npx mocha test/offline.compile.spec.js, review the diff, commit`;
    }

    for (const [snapName, modelName] of SNAPSHOTS) {
      it(`${snapName}.txt matches compiled.source of ${modelName}`, () => {
        const compiled = getCompiled(
          pair(modelName).jit,
          `snapshot:${snapName}`,
        );
        const file = path.join(SNAP_DIR, `${snapName}.txt`);
        if (process.env.UPDATE_SNAPSHOTS) {
          fs.writeFileSync(file, `${headerLine(snapName)}\n${compiled.source}`);
          return;
        }
        expect(
          fs.existsSync(file),
          `${file} missing — snapshot fixtures must be committed`,
        ).to.equal(true);
        const content = fs.readFileSync(file, "utf8");
        const nl = content.indexOf("\n");
        const body = nl === -1 ? "" : content.slice(nl + 1);
        expect(
          compiled.source,
          `${snapName}: generated source drifted from the committed snapshot — if intentional, regenerate with UPDATE_SNAPSHOTS=1 and review`,
        ).to.equal(body);
      });
    }
  });

  describe("N. mode semantics (config compile flag, ELECTRODB_COMPILE, verify, CSP)", () => {
    const eligibleModel = registry.orderRemapTorture.model;
    const ineligibleModel = registry.getterWatcherTorture.model;

    it("ELECTRODB_COMPILE=off beats config compile:true", () => {
      const entity = withCompileEnv(
        "off",
        () => new Entity(eligibleModel, { table: TABLE, compile: true }),
      );
      expectNotCompiled(entity, "env-off");
    });

    it("ELECTRODB_COMPILE=on compiles even when config omits compile", () => {
      const entity = withCompileEnv(
        "on",
        () => new Entity(eligibleModel, { table: TABLE }),
      );
      getCompiled(entity, "env-on");
    });

    it("ELECTRODB_COMPILE=on beats explicit compile:false", () => {
      const entity = withCompileEnv(
        "on",
        () => new Entity(eligibleModel, { table: TABLE, compile: false }),
      );
      getCompiled(entity, "env-on-vs-false");
    });

    it("ELECTRODB_COMPILE=on with an INELIGIBLE model: null, no throw (ineligibility is not failure)", () => {
      let entity;
      expect(() => {
        entity = withCompileEnv(
          "on",
          () => new Entity(ineligibleModel, { table: TABLE }),
        );
      }).to.not.throw();
      expectNotCompiled(entity, "env-on-ineligible");
    });

    it("env read at construction time: entities built before the env change keep their mode", () => {
      const before = new Entity(eligibleModel, { table: TABLE, compile: true });
      withCompileEnv("off", () => {
        getCompiled(before, "pre-env entity stays compiled");
      });
    });

    it("ELECTRODB_COMPILE=verify: matching outputs pass through and equal interpreted", () => {
      const jit = withCompileEnv(
        "verify",
        () => new Entity(eligibleModel, { table: TABLE }),
      );
      getCompiled(jit, "verify-clean");
      const plain = new Entity(eligibleModel, { table: TABLE });
      const item = { s: "sv", num: 3, zero_f: "z" };
      const viaJit = jit.parse({ Attributes: item });
      const viaPlain = plain.parse({ Attributes: item });
      expectSame(viaJit.data, viaPlain.data, "verify-clean parity");
    });

    it("ELECTRODB_COMPILE=verify: a divergent compiled result throws an ElectroError", () => {
      const jit = withCompileEnv(
        "verify",
        () => new Entity(eligibleModel, { table: TABLE }),
      );
      const compiled = getCompiled(jit, "verify-divergence");
      compiled.fromDocument = () => ({ s: "WRONG", extra: 1 });
      const err = captureError(() => jit.parse({ Attributes: { s: "sv" } }));
      expect(err, "verify mode must throw on divergence").to.not.equal(null);
      expect(err.isElectroError, "must be an ElectroError").to.equal(true);
    });

    it("fix #5: ELECTRODB_COMPILE matching is trimmed and case-insensitive", () => {
      expectNotCompiled(
        withCompileEnv(
          " OFF ",
          () => new Entity(eligibleModel, { table: TABLE, compile: true }),
        ),
        "env-OFF",
      );
      getCompiled(
        withCompileEnv("On", () => new Entity(eligibleModel, { table: TABLE })),
        "env-On",
      );
      const verify = withCompileEnv(
        "VERIFY",
        () => new Entity(eligibleModel, { table: TABLE }),
      );
      getCompiled(verify, "env-VERIFY");
      expect(
        verify.model.schema.compiledVerify,
        "VERIFY must enable verify mode",
      ).to.equal(true);
    });

    it("fix #5: unrecognized ELECTRODB_COMPILE values are ignored (config decides)", () => {
      getCompiled(
        withCompileEnv(
          "banana",
          () => new Entity(eligibleModel, { table: TABLE, compile: true }),
        ),
        "env-junk-config-on",
      );
      expectNotCompiled(
        withCompileEnv(
          "banana",
          () => new Entity(eligibleModel, { table: TABLE }),
        ),
        "env-junk-config-off",
      );
      expectNotCompiled(
        withCompileEnv("", () => new Entity(eligibleModel, { table: TABLE })),
        "env-empty",
      );
    });

    it("fix #4: strict mode with no new Function support throws an ElectroError; graceful returns null", () => {
      format._setCompilationSupportedForTesting(false);
      try {
        expect(format.supportsCompilation()).to.equal(false);
        const schema = pair("orderRemapTorture").plain.model.schema;
        const err = captureError(() =>
          format.compileDocumentFormatter(schema, { strict: true }),
        );
        expect(err, "strict must not silently no-op").to.not.equal(null);
        expect(err.isElectroError).to.equal(true);
        expect(err.code).to.equal(1027);
        expect(err.message).to.include("new Function");
        expect(
          format.compileDocumentFormatter(schema, { strict: false }),
          "graceful falls back",
        ).to.equal(null);
      } finally {
        format._setCompilationSupportedForTesting(null);
      }
    });

    it("fix #4: ELECTRODB_COMPILE=on with blocked codegen fails Entity construction loudly", () => {
      format._setCompilationSupportedForTesting(false);
      try {
        const err = captureError(() =>
          withCompileEnv(
            "on",
            () => new Entity(eligibleModel, { table: TABLE }),
          ),
        );
        expect(err).to.not.equal(null);
        expect(err.isElectroError).to.equal(true);
      } finally {
        format._setCompilationSupportedForTesting(null);
      }
    });

    function deepListModel(depth) {
      let items = { type: "string" };
      for (let i = 0; i < depth; i++) items = { type: "list", items };
      return {
        model: { entity: "deep", service: "compilespec", version: "1" },
        attributes: { id: { type: "string" }, d: items },
        indexes: {
          main: {
            pk: { field: "pk", composite: ["id"] },
            sk: { field: "sk", composite: [] },
          },
        },
      };
    }

    let codegenFailingDepth;
    function findCodegenFailingDepth() {
      if (codegenFailingDepth !== undefined) return codegenFailingDepth;
      codegenFailingDepth = null;
      for (const depth of [700, 850, 1000, 1200]) {
        let entity;
        try {
          entity = new Entity(deepListModel(depth), {
            table: TABLE,
            compile: true,
          });
        } catch (err) {
          break;
        }
        if (entity.model.schema.compiled === null) {
          codegenFailingDepth = depth;
          break;
        }
      }
      if (codegenFailingDepth === null) {
        throw new Error(
          "could not find a depth where construction succeeds but codegen overflows — adjust the probe depths",
        );
      }
      return codegenFailingDepth;
    }

    it("fix #6: strict env mode wraps eligible codegen failures in an ElectroError (no raw RangeError)", () => {
      const depth = findCodegenFailingDepth();
      const err = captureError(() =>
        withCompileEnv(
          "on",
          () => new Entity(deepListModel(depth), { table: TABLE }),
        ),
      );
      expect(err, "strict must surface the codegen failure").to.not.equal(null);
      expect(
        err.isElectroError,
        `expected ElectroError, got ${err.constructor.name}: ${err.message}`,
      ).to.equal(true);
      expect(err.code).to.equal(1027);
      expect(err.cause, "codegen error as cause").to.be.instanceOf(RangeError);
    });

    it("fix #6: graceful compile:true falls back to interpreted for the same codegen-failing model", () => {
      const depth = findCodegenFailingDepth();
      let entity;
      expect(() => {
        entity = new Entity(deepListModel(depth), {
          table: TABLE,
          compile: true,
        });
      }).to.not.throw();
      expectNotCompiled(entity, "deep-list graceful");
      expect(
        entity.parse({ Attributes: { d: [] } }).data,
        "interpreted fallback formats",
      ).to.deep.equal({ d: [] });
    });

    it("fix #7: a strict compile failure clears previously-compiled state", () => {
      const entity = new Entity(eligibleModel, { table: TABLE });
      const schema = entity.model.schema;
      schema.compileRetrievalFormatters({ strict: true, verify: true });
      expect(schema.compiled).to.not.equal(null);
      expect(schema.compiledVerify).to.equal(true);
      format._setCompilationSupportedForTesting(false);
      try {
        expect(() =>
          schema.compileRetrievalFormatters({ strict: true, verify: true }),
        ).to.throw();
      } finally {
        format._setCompilationSupportedForTesting(null);
      }
      expect(
        schema.compiled,
        "stale formatter cleared before recompiling",
      ).to.equal(null);
      expect(schema.compiledVerify).to.equal(false);
    });

    it("fix #8: schema.compiled/compiledVerify are non-enumerable — JSON.stringify(schema) has no generated source", () => {
      const entity = new Entity(eligibleModel, { table: TABLE, compile: true });
      const schema = entity.model.schema;
      getCompiled(entity, "fix8");
      expect(
        Object.prototype.propertyIsEnumerable.call(schema, "compiled"),
      ).to.equal(false);
      expect(
        Object.prototype.propertyIsEnumerable.call(schema, "compiledVerify"),
      ).to.equal(false);
      expect(Object.keys(schema)).to.not.include("compiled");
      const json = JSON.stringify(schema);
      expect(json).to.not.include("fromDocument");
      expect(json).to.not.include("sourceURL");
      expect(schema.compiled.source).to.be.a("string");
    });

    it("EC-51: environment without new Function (CSP-like): construct + fallback + supportsCompilation false", function () {
      this.timeout(20000);

      const script = `
        const path = ${JSON.stringify(
          path.resolve(__dirname, "../src/entity"),
        )};
        const fmtPath = ${JSON.stringify(FORMAT_PATH)};
        const { Entity } = require(path);
        let supports;
        try { supports = require(fmtPath).supportsCompilation(); } catch (e) { supports = "module-missing"; }
        let constructed = false, compiledIsNull = false, parsed = null, threw = null;
        try {
          const entity = new Entity(${JSON.stringify(
            eligibleModel,
          )}, { table: "t", compile: true });
          constructed = true;
          compiledIsNull = entity.model.schema.compiled === null;
          parsed = entity.parse({ Attributes: { s: "sv" } }).data;
        } catch (e) { threw = e.message; }
        // strict env mode must NOT silently run interpreted where codegen is blocked
        let strictThrewElectro = false;
        process.env.ELECTRODB_COMPILE = "on";
        try {
          new Entity(${JSON.stringify(eligibleModel)}, { table: "t" });
        } catch (e) { strictThrewElectro = e.isElectroError === true; }
        console.log(JSON.stringify({ supports, constructed, compiledIsNull, parsed, threw, strictThrewElectro }));
      `;
      const stdout = execFileSync(
        process.execPath,
        ["--disallow-code-generation-from-strings", "-e", script],
        {
          encoding: "utf8",
        },
      );
      const lines = stdout.trim().split("\n");
      const result = JSON.parse(lines[lines.length - 1]);
      expect(
        result.threw,
        `constructor must not throw in a no-codegen env (threw: ${result.threw})`,
      ).to.equal(null);
      expect(result.constructed).to.equal(true);
      expect(
        result.supports,
        "supportsCompilation() false when new Function banned",
      ).to.equal(false);
      expect(
        result.compiledIsNull,
        "compile:true silently falls back (compiled === null)",
      ).to.equal(true);
      expect(result.parsed).to.deep.equal({ s: "sv" });
      expect(
        result.strictThrewElectro,
        "ELECTRODB_COMPILE=on throws ElectroError when banned (fix #4)",
      ).to.equal(true);
    });
  });

  describe("O. setIdentifier after compile (EC-54)", () => {
    it("setIdentifier does not alter compiled formatting (identifiers are not baked in)", () => {
      const def = registry.containerTorture;
      const jit = new Entity(def.model, { table: TABLE, compile: true });
      const plain = new Entity(def.model, { table: TABLE });
      const compiled = getCompiled(jit, "EC-54");
      const item = {
        s: "sv",
        n: 1,
        __edb_e__: "m2",
        __edb_v__: "1",
        custom_e: "x",
      };
      const before = compiled.fromDocument(item, null);
      jit.setIdentifier("entity", "custom_e");
      jit.setIdentifier("version", "custom_v");
      const after = compiled.fromDocument(item, null);
      expectSame(after, before, "EC-54 output unchanged after setIdentifier");
      expectSame(after, interpret(plain, item, {}), "EC-54 parity");
      expect(hasOwn(after, "custom_e"), "unmodeled → dropped").to.equal(false);
    });

    it("identifier set to a MODELED field name: the attribute still formats (no compile-time pruning)", () => {
      const def = registry.containerTorture;
      const jit = new Entity(def.model, { table: TABLE, compile: true });
      const compiled = getCompiled(jit, "EC-54b");
      jit.setIdentifier("entity", "s");
      const out = compiled.fromDocument({ s: "still-here" }, null);
      expect(out).to.deep.equal({ s: "still-here" });
    });
  });

  describe("P. interpreted invariants guarding codegen assumptions (pass today by design)", () => {
    function badModel(attributes) {
      return {
        model: { entity: "bad", service: "compilespec", version: "1" },
        attributes,
        indexes: {
          main: {
            pk: { field: "pk", composite: ["id"] },
            sk: { field: "sk", composite: [] },
          },
        },
      };
    }

    function expectRejected(model, label) {
      const err = captureError(() => new Entity(model, { table: TABLE }));
      expect(err, `${label} must be rejected at construction`).to.not.equal(
        null,
      );
      expect(err.isElectroError, `${label}: expected an ElectroError`).to.equal(
        true,
      );
      expect(err.code, `${label}: InvalidAttributeDefinition`).to.equal(1008);
      expect(err.message, `${label}: clear reserved-name message`).to.include(
        "reserved",
      );
    }

    it("EC-13: models cannot declare attributes named/fielded as Object.prototype keys (construction throws)", () => {
      for (const bad of [
        "constructor",
        "toString",
        "hasOwnProperty",
        "valueOf",
      ]) {
        expectRejected(
          badModel({ id: { type: "string" }, [bad]: { type: "string" } }),
          `attribute named "${bad}"`,
        );
        expectRejected(
          badModel({
            id: { type: "string" },
            ok: { type: "string", field: bad },
          }),
          `field "${bad}"`,
        );
      }

      const protoOk = new Entity(
        badModel({
          id: { type: "string" },
          prototype: { type: "string" },
        }),
        { table: TABLE, compile: true },
      );
      expect(protoOk.model.schema.compiled).to.not.equal(null);
      expect(
        protoOk.model.schema.compiled.fromDocument(
          { id: "a", prototype: "p1" },
          null,
        ),
      ).to.deep.equal({ id: "a", prototype: "p1" });

      expectRejected(
        badModel({
          id: { type: "string" },
          m: { type: "map", properties: { toString: { type: "string" } } },
        }),
        `nested attribute named "toString"`,
      );
    });

    it("EC-13b: own-key __proto__ attribute (via defineProperty) and field:'__proto__' are rejected explicitly", () => {
      const attributes = { id: { type: "string" } };
      Object.defineProperty(attributes, "__proto__", {
        value: { type: "string" },
        enumerable: true,
        configurable: true,
      });
      expectRejected(badModel(attributes), `own-key "__proto__" attribute`);
      expectRejected(
        badModel({
          id: { type: "string" },
          ok: { type: "string", field: "__proto__" },
        }),
        `field "__proto__"`,
      );
    });

    it("adversarial models with weird-but-legal names construct (codegen input space)", () => {
      expect(() => pair("orderRemapTorture").plain).to.not.throw();
      expect(() => pair("collisionLegal").plain).to.not.throw();
    });
  });
});

const hasOwn = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

const pairCache = new Map();
function pair(name) {
  const def = registry[name];
  if (!def)
    throw new Error(
      `model "${name}" is not in test/models/compile.models.js registry`,
    );
  if (!pairCache.has(name)) {
    pairCache.set(name, {
      def,
      plain: new Entity(def.model, { table: TABLE }),
      jit: new Entity(def.model, { table: TABLE, compile: true }),
    });
  }
  return pairCache.get(name);
}

function getCompiled(entity, label) {
  const compiled = entity.model.schema.compiled;
  if (compiled === null) {
    throw new Error(
      `[${label}] schema.compiled is null — this eligible entity did NOT compile ` +
        `(silent fallback is forbidden; fix eligibility detection or codegen)`,
    );
  }
  expect(compiled.fromDocument, `[${label}] compiled.fromDocument`).to.be.a(
    "function",
  );
  expect(compiled.source, `[${label}] compiled.source`).to.be.a("string");
  return compiled;
}

function expectNotCompiled(entity, label) {
  const compiled = entity.model.schema.compiled;
  expect(compiled, `[${label}] expected schema.compiled === null`).to.equal(
    null,
  );
}

function interpret(entity, item, config) {
  const c = config || {};
  return entity.model.schema.formatItemForRetrieval(item, {
    ...c,
    _returnAttributesFilter: filterOf(c),
  });
}

function filterOf(config) {
  if (!config || !config.attributes || config.attributes.length === 0)
    return null;
  return new Set(config.attributes);
}

function captureError(fn) {
  try {
    fn();
  } catch (err) {
    return err;
  }
  return null;
}

function kindOf(v) {
  if (v === null) return "null";
  if (Array.isArray(v)) return "array";
  const t = typeof v;
  if (t !== "object") return t;
  if (v instanceof Date) return "date";
  if (v instanceof Set) return "set";
  if (v instanceof Map) return "map";
  if (ArrayBuffer.isView(v)) return "typedarray";
  return "object";
}

function show(v) {
  try {
    if (typeof v === "bigint") return `${v}n`;
    if (v instanceof Set) return `Set(${JSON.stringify([...v])})`;
    return JSON.stringify(v, (k, x) =>
      x === undefined ? "«undefined»" : typeof x === "bigint" ? `${x}n` : x,
    );
  } catch (err) {
    return String(v);
  }
}

function deepDiff(a, b, at, out, depth) {
  if (out.length >= 5 || depth > 25) return;
  if (Object.is(a, b)) return;
  const ka = kindOf(a);
  const kb = kindOf(b);
  if (ka !== kb) {
    out.push(`${at}: kind ${ka} !== ${kb} (${show(a)} vs ${show(b)})`);
    return;
  }
  switch (ka) {
    case "array": {
      if (a.length !== b.length) {
        out.push(
          `${at}: array length ${a.length} !== ${b.length} (${show(
            a,
          )} vs ${show(b)})`,
        );
        return;
      }
      for (let i = 0; i < a.length; i++) {
        const ha = hasOwn(a, i);
        const hb = hasOwn(b, i);
        if (ha !== hb) {
          out.push(`${at}[${i}]: hole-ness differs (own ${ha} vs ${hb})`);
          continue;
        }
        deepDiff(a[i], b[i], `${at}[${i}]`, out, depth + 1);
      }
      return;
    }
    case "typedarray": {
      if (
        Object.getPrototypeOf(a) !== Object.getPrototypeOf(b) ||
        a.length !== b.length
      ) {
        out.push(`${at}: typed array shape differs`);
        return;
      }
      for (let i = 0; i < a.length; i++) {
        if (!Object.is(a[i], b[i])) {
          out.push(`${at}[${i}]: ${a[i]} !== ${b[i]}`);
          return;
        }
      }
      return;
    }
    case "set": {
      if (a.size !== b.size) {
        out.push(`${at}: Set size ${a.size} !== ${b.size}`);
        return;
      }

      const bs = [...b];
      for (const m of a) {
        const idx = bs.findIndex((x) => deepEquals(m, x));
        if (idx === -1) {
          out.push(`${at}: Set member ${show(m)} missing from other side`);
          return;
        }
        bs.splice(idx, 1);
      }
      return;
    }
    case "map": {
      if (a.size !== b.size) {
        out.push(`${at}: Map size ${a.size} !== ${b.size}`);
        return;
      }
      for (const [k, v] of a) {
        if (!b.has(k)) {
          out.push(`${at}: Map key ${show(k)} missing`);
          return;
        }
        deepDiff(v, b.get(k), `${at}.get(${show(k)})`, out, depth + 1);
      }
      return;
    }
    case "date": {
      if (a.getTime() !== b.getTime())
        out.push(`${at}: Date ${a.toISOString()} !== ${b.toISOString()}`);
      return;
    }
    case "object": {
      const aKeys = Object.keys(a).sort();
      const bKeys = Object.keys(b).sort();
      if (JSON.stringify(aKeys) !== JSON.stringify(bKeys)) {
        const missing = bKeys.filter((k) => !aKeys.includes(k));
        const extra = aKeys.filter((k) => !bKeys.includes(k));
        out.push(
          `${at}: own-key sets differ (left-only: ${show(
            extra,
          )}, right-only: ${show(missing)})`,
        );
        return;
      }
      for (const k of aKeys) deepDiff(a[k], b[k], `${at}.${k}`, out, depth + 1);
      return;
    }
    default:
      out.push(`${at}: ${show(a)} !== ${show(b)}`);
  }
}

function deepEquals(a, b) {
  const out = [];
  deepDiff(a, b, "$", out, 0);
  return out.length === 0;
}

function expectSame(actual, expected, label) {
  const out = [];
  deepDiff(actual, expected, "$", out, 0);
  expect(
    out,
    `[${label}] compiled vs expected diffs:\n  ${out.join("\n  ")}`,
  ).to.deep.equal([]);
}

function expectParity(name, item, config, label) {
  const p = pair(name);
  const compiled = getCompiled(p.jit, label);
  const oracle = interpret(p.plain, item, config);
  const actual = compiled.fromDocument(item, filterOf(config));
  expectSame(actual, oracle, label);
  return { oracle, actual };
}

function expectThrowParity(name, item, label) {
  const p = pair(name);
  const compiled = getCompiled(p.jit, label);
  const iErr = captureError(() => interpret(p.plain, item, {}));
  const cErr = captureError(() => compiled.fromDocument(item, null));
  expect(
    iErr,
    `[${label}] interpreted path was expected to throw`,
  ).to.not.equal(null);
  expect(
    cErr,
    `[${label}] compiled path was expected to throw (interpreted threw: ${
      iErr && iErr.message
    })`,
  ).to.not.equal(null);
  expect(cErr.message, `[${label}] thrown message parity`).to.equal(
    iErr.message,
  );
  expect(
    cErr.constructor.name,
    `[${label}] thrown error class parity`,
  ).to.equal(iErr.constructor.name);
  return { iErr, cErr };
}

function mockClient(responses) {
  const calls = [];
  const client = c.v2Methods.reduce((cl, method) => {
    cl[method] = (params) => {
      calls.push({ method, params });
      const body =
        responses && responses[method] ? responses[method](params) : {};
      return { promise: () => Promise.resolve(body) };
    };
    return cl;
  }, {});
  client.createSet = (list) => {
    const arr = [].concat(list);
    return new DynamoDBSet(arr, typeof arr[0]);
  };
  return { client, calls };
}

function withCompileEnv(value, fn) {
  const had = hasOwn(process.env, "ELECTRODB_COMPILE");
  const prev = process.env.ELECTRODB_COMPILE;
  if (value === undefined) delete process.env.ELECTRODB_COMPILE;
  else process.env.ELECTRODB_COMPILE = value;
  try {
    return fn();
  } finally {
    if (had) process.env.ELECTRODB_COMPILE = prev;
    else delete process.env.ELECTRODB_COMPILE;
  }
}

function mulberry32(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
