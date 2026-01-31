import { expectType } from "tsd";
import { entityOne, serviceOne } from "./v2response-entities.test-d";

const prop1 = "value1";
const prop2 = "value2";
const prop4 = "value4";

entityOne
  .get({ prop1, prop2, prop4 })
  .go()
  .then((res) => {
    if (res.data) {
      expectType<string>(res.data.prop1);
    }
  });

entityOne
  .get({ prop1, prop2, prop4 })
  .where((attr, op) => op.eq(attr.prop3, "abc"))
  .go()
  .then((res) => {
    if (res.data) {
      expectType<string>(res.data.prop1);
    }
  });

entityOne
  .get([{ prop1, prop2, prop4 }])
  .go()
  .then((res) => {
    expectType<string>(res.data[0].prop2);
    expectType<{ prop1: string; prop2: string; prop4: string }>(
      res.unprocessed[0],
    );
  });

entityOne
  .put({ prop2, prop4 })
  .go()
  .then((res) => {
    expectType<string>(res.data.prop1);
  });

entityOne
  .put([{ prop2, prop4 }])
  .go()
  .then((res) => {
    expectType<string>(res.unprocessed[0].prop1);
  });

entityOne
  .create({ prop2, prop4 })
  .go()
  .then((res) => {
    expectType<string>(res.data.prop1);
  });

entityOne
  .delete({ prop1, prop2, prop4 })
  .go()
  .then((res) => {
    expectType<string | undefined>(res.data?.prop1);
  });

entityOne
  .delete([{ prop1, prop2, prop4 }])
  .go()
  .then((res) => {
    expectType<string>(res.unprocessed[0].prop1);
  });

entityOne
  .update({ prop1, prop2, prop4 })
  .add({ prop6: 1 })
  .append({ prop7: ["abc"] })
  .delete({ prop8: ["def"] })
  .remove(["prop3"])
  .set({ prop7: ["abd"] })
  .subtract({ prop6: 10 })
  .data((attr, op) => {
    op.add(attr.prop6, 1);
    op.append(attr.prop7, ["abc"]);
    op.delete(attr.prop8, ["def"]);
    op.remove(attr.prop6);
    op.set(attr.prop7, ["abd"]);
    op.subtract(attr.prop6, 10);
  })
  .where((attr, op) => op.eq(attr.prop6, 10))
  .go()
  .then((res) => {
    expectType<string | undefined>(res.data.prop1);
  });

entityOne
  .patch({ prop1, prop2, prop4 })
  .add({ prop6: 1 })
  .append({ prop7: ["abc"] })
  .delete({ prop8: ["def"] })
  .remove(["prop3"])
  .set({ prop7: ["abd"] })
  .subtract({ prop6: 10 })
  .data((attr, op) => {
    op.add(attr.prop6, 1);
    op.append(attr.prop7, ["abc"]);
    op.delete(attr.prop8, ["def"]);
    op.remove(attr.prop6);
    op.set(attr.prop7, ["abd"]);
    op.subtract(attr.prop6, 10);
  })
  .where((attr, op) => op.eq(attr.prop6, 10))
  .go()
  .then((res) => {
    expectType<string | undefined>(res.data.prop1);
  });

entityOne.query
  .index1({ prop1, prop2 })
  .between({ prop4 }, { prop4 })
  .go()
  .then((res) => {
    expectType<string>(res.data[0].prop1);
    expectType<string | null>(res.cursor);
  });

entityOne.query
  .index1({ prop1, prop2 })
  .between({ prop4 }, { prop4 })
  .where((attr, op) => op.gte(attr.prop6, 10))
  .go()
  .then((res) => {
    expectType<string>(res.data[0].prop1);
    expectType<string | null>(res.cursor);
  });

entityOne.scan.go().then((res) => {
  expectType<string>(res.data[0].prop1);
  expectType<string | null>(res.cursor);
});

entityOne.scan
  .where((attr, op) => op.eq(attr.prop2, "abc"))
  .go()
  .then((res) => {
    expectType<string>(res.data[0].prop1);
    expectType<string | null>(res.cursor);
  });

entityOne
  .match({ prop6: 13 })
  .go()
  .then((res) => {
    expectType<string>(res.data[0].prop1);
    expectType<string | null>(res.cursor);
  });

entityOne
  .match({ prop6: 13 })
  .where((attr, op) => op.eq(attr.prop2, "abc"))
  .go()
  .then((res) => {
    expectType<string>(res.data[0].prop1);
    expectType<string | null>(res.cursor);
  });

entityOne
  .find({ prop6: 13 })
  .go()
  .then((res) => {
    expectType<string>(res.data[0].prop1);
    expectType<string | null>(res.cursor);
  });

entityOne
  .find({ prop6: 13 })
  .where((attr, op) => op.eq(attr.prop2, "abc"))
  .go()
  .then((res) => {
    expectType<string>(res.data[0].prop1);
    expectType<string | null>(res.cursor);
  });

serviceOne.collections
  .basic({ prop1, prop2 })
  .go()
  .then((res) => {
    expectType<string>(res.data.entityOne[0].prop1);
    expectType<string | null>(res.cursor);
  });

serviceOne.collections
  .basic({ prop1, prop2 })
  .where((attr, op) => {
    return op.eq(attr.prop5, "abc");
  })
  .go()
  .then((res) => {
    expectType<string>(res.data.entityOne[0].prop1);
    expectType<string | null>(res.cursor);
  });
