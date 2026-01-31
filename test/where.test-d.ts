import { expectType, expectError } from "tsd";
import {
  MyBasicCustomAttribute,
  entityWithComplexShapes,
  entityWithNestedCustomAttribute,
  entityWithSK,
  PizzaSize,
  mapTests,
  readOnlyEntity,
  OpaqueAttr1,
  OpaqueAttr2,
} from "./where-entities.test-d";
import { troubleshoot, magnify, keys } from "./util.test-d";

expectType<{
  attr1: OpaqueAttr1;
  attr2: OpaqueAttr2;
  map: {
    attr3: MyBasicCustomAttribute;
    attr4: MyBasicCustomAttribute;
    attr5: MyBasicCustomAttribute;
    attr6: PizzaSize;
  };
  list: Array<{
    attr3: MyBasicCustomAttribute;
    attr4: MyBasicCustomAttribute;
    attr5: MyBasicCustomAttribute;
    attr6: PizzaSize;
  }>;
}>(entityWithNestedCustomAttribute.getWhereAttributes());

// WhereAttributes
expectType<{
  attr1: string;
  attr2: string;
  attr3: "123" | "def" | "ghi";
  attr4: "abc" | "ghi";
  attr5: string;
  attr6: number;
  attr7: any;
  attr8: boolean;
  attr9: number;
  attr10: boolean;
}>(entityWithSK.getWhereAttributes());

expectType<{
  prop1: string;
  prop2: string;
  prop3: {
    val1: string;
  };
  prop4: {
    val2: number;
    val3: string[];
    val4: number[];
  }[];
  prop5: string[];
  prop6: number[];
}>(entityWithComplexShapes.getWhereAttributes());

// DataUpdateAttributes

expectType<{
  // attr1: OpaqueAttr1;
  // attr2: OpaqueAttr2;
  map: {
    attr3: MyBasicCustomAttribute;
    attr4: MyBasicCustomAttribute;
    // attr5: MyBasicCustomAttribute;
    attr6: PizzaSize;
  };
  list: Array<{
    attr3: MyBasicCustomAttribute;
    attr4: MyBasicCustomAttribute;
    // attr5: MyBasicCustomAttribute;
    attr6: PizzaSize;
  }>;
}>(entityWithNestedCustomAttribute.getDataUpdateAttributes());

expectType<{
  attr3: "123" | "def" | "ghi";
  attr4: "abc" | "ghi";
  attr5: string;
  attr6: number;
  attr7: any;
  attr8: boolean;
  attr9: number;
  attr10: boolean;
}>(entityWithSK.getDataUpdateAttributes());

expectType<{
  mapObject: {
    minimal: string;
    required: string;
    hidden: string;
    anotherMap: {
      minimal: string;
      required: string;
      hidden: string;
    };
  };
}>(mapTests.getDataUpdateAttributes());

expectType<{
  prop3: {
    val1: string;
  };
  prop4: {
    val2: number;
    val3: string[];
    val4: number[];
  }[];
  prop5: string[];
  prop6: number[];
}>(entityWithComplexShapes.getDataUpdateAttributes());

expectType<{
  prop3: boolean;
}>(readOnlyEntity.getDataUpdateAttributes());

// WhereCallback
entityWithNestedCustomAttribute.getWhereCallback((a, o) => {
  expectType<MyBasicCustomAttribute['type']>(a.map.attr3.type);
  expectType<MyBasicCustomAttribute['toppings']>(a.map.attr3.toppings);
  expectType<number>(a.map.attr3.count);
  expectError(() => o.eq(a.map.attr3.count, "1"));
  return "";
});

entityWithSK.getWhereCallback((a, o) => {
  const attr = magnify(a);
  const op = magnify(o);
  op.escape(1);
  op.escape("1");
  op.escape(true);
  expectType<string>(a.attr1);
  expectType<string>(attr.attr2);
  expectType<"123" | "def" | "ghi">(attr.attr3);
  expectType<"abc" | "ghi">(attr.attr4);
  expectType<string>(attr.attr5);
  expectType<number>(attr.attr6);
  expectType<any>(attr.attr7);
  expectType<boolean>(attr.attr8);
  expectType<number>(attr.attr9);
  expectType<boolean>(attr.attr10);
  expectType<
    | "eq"
    | "ne"
    | "gt"
    | "lt"
    | "gte"
    | "lte"
    | "between"
    | "begins"
    | "exists"
    | "notExists"
    | "contains"
    | "notContains"
    | "value"
    | "name"
    | "escape"
    | "size"
    | "type"
    | "field"
  >(keys(op));

  expectType<string>(o.eq(a.attr1, ""));
  expectType<string>(o.ne(a.attr1, ""));
  expectType<string>(o.gt(a.attr1, ""));
  expectType<string>(o.lt(a.attr1, ""));
  expectType<string>(o.gte(a.attr1, ""));
  expectType<string>(o.lte(a.attr1, ""));
  expectType<string>(o.between(a.attr1, "", ""));
  expectType<string>(o.begins(a.attr1, ""));
  expectType<string>(o.exists(a.attr1));
  expectType<string>(o.notExists(a.attr1));
  expectType<string>(o.contains(a.attr1, ""));
  expectType<string>(o.notContains(a.attr1, ""));
  expectType<string>(o.value(a.attr1, ""));
  expectType<string>(o.name(a.attr1));

  expectError(() => o.eq(a.attr1, 1));
  expectError(() => o.ne(a.attr1, 1));
  expectError(() => o.gt(a.attr1, 1));
  expectError(() => o.lt(a.attr1, 1));
  expectError(() => o.gte(a.attr1, 1));
  expectError(() => o.lte(a.attr1, 1));
  expectError(() => o.between(a.attr1, 1, 1));
  expectError(() => o.begins(a.attr1, 1));
  expectError(() => o.exists());
  expectError(() => o.notExists());
  expectError(() => o.contains(a.attr1, 1));
  expectError(() => o.notContains(a.attr1, 1));
  expectError(() => o.value(a.attr1, 1));
  expectError(() => o.name());

  expectError(() => {
    o.between(a.attr1, "");
  });

  expectError(() => {
    o.exists(a.attr1, "");
  });

  expectError(() => {
    o.notExists(a.attr1, "");
  });

  troubleshoot(() => keys(op), "gte");
  return "";
});

entityWithComplexShapes.getWhereCallback((a, o) => {
  expectType<string>(a.prop1);
  expectType<string>(a.prop2);
  expectType<{
    val1: string;
  }>(a.prop3);
  expectType<
    {
      val2: number;
      val3: string[];
      val4: number[];
    }[]
  >(a.prop4);
  expectType<string[]>(a.prop5);
  expectType<number[]>(a.prop6);

  expectError(() => o.eq(a.prop4, 1));
  expectError(() => o.ne(a.prop4, 1));
  expectError(() => o.gt(a.prop4, 1));
  expectError(() => o.lt(a.prop4, 1));
  expectError(() => o.gte(a.prop4, 1));
  expectError(() => o.lte(a.prop4, 1));
  expectError(() => o.between(a.prop4, 1, 1));
  expectError(() => o.begins(a.prop4, 1));
  expectError(() => o.contains(a.prop4, 1));
  expectError(() => o.notContains(a.prop4, 1));
  expectError(() => o.value(a.prop4, 1));

  o.eq(a.prop4[0].val2, 1);
  o.ne(a.prop4[0].val2, 1);
  o.gt(a.prop4[0].val2, 1);
  o.lt(a.prop4[0].val2, 1);
  o.gte(a.prop4[0].val2, 1);
  o.lte(a.prop4[0].val2, 1);
  o.between(a.prop4[0].val2, 1, 1);
  o.begins(a.prop4[0].val2, 1);

  o.contains(a.prop3.val1, "1");
  o.notContains(a.prop3.val1, "1");

  o.contains(a.prop5, "1");
  o.notContains(a.prop5, "1");

  o.contains(a.prop6, 1);
  o.notContains(a.prop6, 1);

  o.contains(a.prop4, { val2: 5, val3: [], val4: [4] });
  o.notContains(a.prop4, { val2: 5, val3: [], val4: [4] });

  o.value(a.prop4[0].val2, 1);

  return "";
});

// DataUpdateCallback

entityWithNestedCustomAttribute.getDataUpdateCallback((a, o) => {
    expectType<MyBasicCustomAttribute['type']>(a.map.attr3.type);
    expectType<MyBasicCustomAttribute['toppings']>(a.map.attr3.toppings);
    expectType<number>(a.map.attr3.count);
    expectError(() => o.set(a.map.attr3.count, "1"));
});

mapTests.getDataUpdateCallback((a, o) => {
  expectError(() => a.username);
  expectError(() => a.mapObject.readOnly);
});

entityWithSK.getDataUpdateCallback((a, o) => {
  o.add(a.attr6, 5);
  o.subtract(a.attr6, 5);
  o.set(a.attr6, 5);
  o.value(a.attr6, 5);
  o.name(a.attr6);
  o.ifNotExists(a.attr6, 5);

  expectError(() => o.add(a.attr6, "5"));
  expectError(() => o.subtract(a.attr6, "5"));
  expectError(() => o.set(a.attr6, "5"));
  expectError(() => o.value(a.attr6, "5"));
  expectError(() => o.ifNotExists(a.attr6, "5"));
  expectError(() => o.del(a.attr6));
  expectError(() => o.delete(a.attr6));
  expectError(() => o.append(a.attr6));
  expectError(() => o.name());
  expectError(() => o.ifNotExists());
  expectError(() => o.ifNotExists(a.attr6));
  expectError(() => o.value());
  expectError(() => o.value(a.attr6));
});

entityWithComplexShapes.getDataUpdateCallback((a, o) => {
  o.add(a.prop5, ["abc"]);
  o.del(a.prop5, ["abc"]);
  o.delete(a.prop5, ["abc"]);
  o.append(a.prop4, [
    {
      val2: 5,
      val3: ["abc"],
      val4: [5],
    },
  ]);

  expectError(() => o.add(a.prop5, [4]));
  expectError(() => o.add(a.prop5, "abc"));
  expectError(() => o.del(a.prop5, [4]));
  expectError(() => o.del(a.prop5, "abc"));
  expectError(() => o.delete(a.prop5, [4]));
  expectError(() => o.delete(a.prop5, "abc"));
  expectError(() => {
    o.append(a.prop4, [{ val2: "5", val3: 34, val4: ["5"] }]);
  });
});
