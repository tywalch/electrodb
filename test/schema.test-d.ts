import {
  CustomAttributeType,
} from "../";
import { expectType, expectError, expectNotType } from "tsd";
import {
  entityWithoutSK,
  entityWithSK,
  complex,
  normalEntity1,
  normalEntity2,
  diverseTableKeyTypes,
  entityWithCustomAttribute2,
  casingEntity,
  entityWithComplexShapesRequired,
  entityWithComplexShapesRequiredOnEdge,
  entityWithComplexShapes,
  MyBasicCustomAttribute,
  entityWithNestedCustomAttribute,
  readOnlyEntity,
  mapTests,
  PizzaSize,
  OpaqueAttr1,
  OpaqueAttr2,
  entityWithHiddenAttributes1,
  entityWithMultipleCollections2,
  entityWithComplexShapesRequiredOnEdgeWithDefault,
  entityWithMultipleCollections3,
  entityWithCustomAttribute,
  entityWithEnumSets,
  entityWithWatchAll,
  entityWithoutCollection,
  standAloneEntity2,
  standAloneEntityWithDefault,
  entityWithHiddenAttributes2,
  MyCustomAttributeType,
} from "./schema-entities.test-d";
import { magnify } from "./util.test-d";

expectError(() => {
  CustomAttributeType<string>("any");
});

expectError(() => {
  CustomAttributeType<{ complex: "shape" }>("string");
});

expectError(() => {
  CustomAttributeType<boolean>("number");
});

CustomAttributeType<string>("string");
CustomAttributeType<number>("number");
CustomAttributeType<boolean>("boolean");
CustomAttributeType<{ complex: string }>("any");

// getEntityCollections
expectType<{ normalcollection: "tableIndex" }>(
  normalEntity1.getEntityCollections(),
);

expectType<{
  normalcollection: "indexTable";
  mycollection1: "anotherIndex";
}>(normalEntity2.getEntityCollections());

expectType<{}>(entityWithoutCollection.getEntityCollections());

expectType<{
  outercollection: "myIndex";
  innercollection: "myIndex";
  extracollection: "myIndex2";
}>(entityWithMultipleCollections2.getEntityCollections());

expectType<{
  outercollection: "myIndex";
  extracollection: "myIndex2";
}>(entityWithMultipleCollections3.getEntityCollections());

// getIndexCollections
expectType<"normalcollection">(normalEntity1.getIndexCollections());
expectType<"normalcollection" | "mycollection1">(
  normalEntity2.getIndexCollections(),
);
expectType<never>(entityWithoutCollection.getIndexCollections());
expectType<"outercollection" | "innercollection" | "extracollection">(
  entityWithMultipleCollections2.getIndexCollections(),
);
expectType<"outercollection" | "extracollection">(
  entityWithMultipleCollections3.getIndexCollections(),
);

// ItemTypeDescription
// todo: current implementation is shallow, is that a problem?
expectType<{ attr1: "string"; attr2: "string" }>(
  entityWithMultipleCollections2.getItemTypeDescription(),
);
expectType<{
  attr1: "string";
  attr2: "string";
  attr3: Readonly<["123", "def", "ghi"]>;
  attr4: Readonly<["abc", "def"]>;
  attr5: "string";
  attr6: "number";
  attr7: "any";
  attr8: "boolean";
  attr9: "number";
}>(entityWithoutSK.getItemTypeDescription());

expectType<{
  username: "string";
  mapObject: "map";
}>(mapTests.getItemTypeDescription());

// getRequiredAttributes
expectType<"attr4" | "attr8">(entityWithoutSK.getRequiredAttributes());
expectType<"prop3">(normalEntity2.getRequiredAttributes());
expectType<"attr3" | "attr4" | "attr5" | "attr6">(
  entityWithComplexShapesRequired.getRequiredAttributes(),
);

// getHiddenAttributes
expectType<"prop4">(entityWithHiddenAttributes2.getHiddenAttributes());

// getReadOnlyAttributes
expectType<"prop1" | "prop4" | "prop5" | "prop6" | "prop7">(
  readOnlyEntity.getReadOnlyAttributes(),
);

// getTableIndexes
expectType<{
  store: "table";
  other: "secondary";
}>(casingEntity.getTableIndexes());

expectType<{
  myIndex: "table";
  myIndex2: "secondary";
  myIndex3: "secondary";
}>(entityWithSK.getTableIndexes());

expectType<{
  myIndex: "table";
  myIndex2: "secondary";
  myIndex3: "secondary";
}>(entityWithoutSK.getTableIndexes());

// getTableIndexName
expectType<"store">(casingEntity.getTableIndexName());
expectType<"myIndex">(entityWithSK.getTableIndexName());
expectType<"myIndex">(entityWithoutSK.getTableIndexName());

// getPKCompositeAttributes
expectType<{
  tableIndex: "prop1" | "prop2";
}>(normalEntity1.getPKCompositeAttributes());

expectType<{
  myIndex: "attr1";
}>(entityWithCustomAttribute2.getPKCompositeAttributes());

expectType<{
  myIndex: "attr1";
}>(entityWithNestedCustomAttribute.getPKCompositeAttributes());

expectType<{
  myIndex: "attr1";
  myIndex2: "attr6" | "attr9";
  myIndex3: "attr5";
}>(entityWithSK.getPKCompositeAttributes());

expectType<{
  myIndex: "attr1";
  myIndex2: "attr6" | "attr9";
  myIndex3: "attr5";
}>(entityWithoutSK.getPKCompositeAttributes());

// getSKCompositeAttributes
expectType<{
  tableIndex: "prop4";
}>(normalEntity1.getSKCompositeAttributes());

expectType<{
  myIndex: "attr2";
  myIndex2: "attr4" | "attr5";
  myIndex3: "attr4" | "attr3" | "attr9";
}>(entityWithSK.getSKCompositeAttributes());

expectType<{
  myIndex: never;
  myIndex2: never;
  myIndex3: never;
}>(entityWithoutSK.getSKCompositeAttributes());

// getTableIndexPKCompositeAttributes
expectType<{
  tableIndex: "prop1" | "prop2";
}>(normalEntity1.getTableIndexPKCompositeAttributes());

expectType<{
  myIndex: "attr1";
}>(entityWithSK.getTableIndexPKCompositeAttributes());

expectType<{
  myIndex: "attr1";
}>(entityWithoutSK.getTableIndexPKCompositeAttributes());

// getTableIndexSKCompositeAttributes
expectType<{
  tableIndex: "prop4";
}>(normalEntity1.getTableIndexSKCompositeAttributes());

expectType<{
  myIndex: "attr2";
}>(entityWithSK.getTableIndexSKCompositeAttributes());

expectType<{
  myIndex: never;
}>(entityWithoutSK.getTableIndexSKCompositeAttributes());

// getTableIndexPKAttributes
expectType<{ attr1: string }>(entityWithSK.getTableIndexPKAttributes());
expectType<{ prop1: string; prop2: string }>(
  normalEntity2.getTableIndexPKAttributes(),
);
expectType<{
  prop1: string;
  prop2: number;
  prop3: boolean;
  prop4: "abc";
}>(diverseTableKeyTypes.getTableIndexPKAttributes());

expectType<{
  attr1: OpaqueAttr1;
}>(entityWithCustomAttribute2.getTableIndexPKAttributes());

expectType<{
  attr1: OpaqueAttr1;
}>(entityWithNestedCustomAttribute.getTableIndexPKAttributes());

// getTableIndexSKAttributes
expectType<{ attr2: string }>(entityWithSK.getTableIndexSKAttributes());
expectType<{}>(entityWithoutSK.getTableIndexSKAttributes());
expectType<{ prop5: number }>(normalEntity2.getTableIndexSKAttributes());
expectType<{
  prop5: string;
  prop6: number;
  prop7: boolean;
  prop8: "abc";
}>(diverseTableKeyTypes.getTableIndexSKAttributes());

expectType<{
  attr2: OpaqueAttr2;
}>(entityWithCustomAttribute2.getTableIndexSKAttributes());

expectType<{
  attr2: OpaqueAttr2;
}>(entityWithNestedCustomAttribute.getTableIndexSKAttributes());

// getTableIndexCompositeAttributes
expectType<{
  attr1: string;
  attr2?: string | undefined;
}>(entityWithSK.getTableIndexCompositeAttributes());

expectType<{
  attr1: string;
}>(entityWithoutSK.getTableIndexCompositeAttributes());

expectType<{
  prop1: string;
  prop2: string;
  prop5?: number | undefined;
}>(normalEntity2.getTableIndexCompositeAttributes());

expectType<{
  prop1: string;
  prop2: number;
  prop3: boolean;
  prop4: "abc";
  prop5?: string | undefined;
  prop6?: number | undefined;
  prop7?: boolean | undefined;
  prop8?: "abc" | undefined;
}>(diverseTableKeyTypes.getTableIndexCompositeAttributes());

// getIndexPKAttributes
expectType<{
  attr1: string;
}>(entityWithSK.getIndexPKAttributes("myIndex"));

expectType<{
  attr6: number;
  attr9: number;
}>(entityWithSK.getIndexPKAttributes("myIndex2"));

expectType<{
  attr5: string;
}>(entityWithSK.getIndexPKAttributes("myIndex3"));

expectType<{
  attr1: string;
}>(entityWithoutSK.getIndexPKAttributes("myIndex"));

expectType<{
  attr6: number;
  attr9: number;
}>(entityWithoutSK.getIndexPKAttributes("myIndex2"));

expectType<{
  attr5: string;
}>(entityWithoutSK.getIndexPKAttributes("myIndex3"));

expectType<{
  prop1: string;
  prop2: string;
}>(normalEntity2.getIndexPKAttributes("indexTable"));

expectType<{
  attr6: number;
  attr9: number;
}>(normalEntity2.getIndexPKAttributes("anotherIndex"));

expectType<{
  prop1: string;
  prop2: number;
  prop3: boolean;
  prop4: "abc";
}>(diverseTableKeyTypes.getIndexPKAttributes("record"));

// getIndexSKAttributes
expectType<{
  attr2: string;
}>(entityWithSK.getIndexSKAttributes("myIndex"));

expectType<{
  attr4: "abc" | "ghi";
  attr5: string;
}>(entityWithSK.getIndexSKAttributes("myIndex2"));

expectType<{
  attr4: "abc" | "ghi";
  attr3: "123" | "def" | "ghi";
  attr9: number;
}>(entityWithSK.getIndexSKAttributes("myIndex3"));

expectType<{}>(entityWithoutSK.getIndexSKAttributes("myIndex"));
expectType<{}>(entityWithoutSK.getIndexSKAttributes("myIndex2"));
expectType<{}>(entityWithoutSK.getIndexSKAttributes("myIndex3"));

expectType<{
  prop5: number;
}>(normalEntity2.getIndexSKAttributes("indexTable"));

expectType<{}>(normalEntity2.getIndexSKAttributes("anotherIndex"));

expectType<{
  prop5: string;
  prop6: number;
  prop7: boolean;
  prop8: "abc";
}>(diverseTableKeyTypes.getIndexSKAttributes("record"));

// getAllTableIndexCompositeAttributes
expectType<{
  attr1: string;
  attr2: string;
}>(entityWithSK.getAllTableIndexCompositeAttributes());

expectType<{
  attr1: string;
}>(entityWithoutSK.getAllTableIndexCompositeAttributes());

expectType<{
  prop1: string;
  prop2: string;
  prop5: number;
}>(normalEntity2.getAllTableIndexCompositeAttributes());

expectType<{
  attr1: OpaqueAttr1;
  attr2: OpaqueAttr2;
}>(entityWithCustomAttribute2.getAllTableIndexCompositeAttributes());

expectType<{
  attr1: OpaqueAttr1;
  attr2: OpaqueAttr2;
}>(entityWithNestedCustomAttribute.getAllTableIndexCompositeAttributes());

expectType<{
  prop1: string;
  prop2: number;
  prop3: boolean;
  prop4: "abc";
  prop5: string;
  prop6: number;
  prop7: boolean;
  prop8: "abc";
}>(diverseTableKeyTypes.getAllTableIndexCompositeAttributes());

// getTableItem

expectType<{
  prop1: string;
  prop2: string;
  prop3?:
    | {
        val1?: string | undefined;
      }
    | undefined;
  prop4?: {
    val2?: number | undefined;
    val3?: string[] | undefined;
    val4?: number[] | undefined;
  }[];
  prop5?: string[] | undefined;
  prop6?: string[] | undefined;
}>(entityWithComplexShapes.getTableItem());

expectType<{
  attr1: OpaqueAttr1;
  attr2: OpaqueAttr2;
  attr3: MyBasicCustomAttribute;
  attr4: MyBasicCustomAttribute;
  attr5?: MyBasicCustomAttribute;
  attr6?: PizzaSize;
}>(entityWithCustomAttribute2.getTableItem());

expectType<{
  attr1: OpaqueAttr1;
  attr2: OpaqueAttr2;
  map: {
    attr3: MyBasicCustomAttribute;
    attr4: MyBasicCustomAttribute;
    attr5?: MyBasicCustomAttribute;
    attr6?: PizzaSize;
  };
  list: Array<{
    attr3: MyBasicCustomAttribute;
    attr4: MyBasicCustomAttribute;
    attr5?: MyBasicCustomAttribute;
    attr6?: PizzaSize;
  }>;
}>(entityWithNestedCustomAttribute.getTableItem());

expectType<{
  id: string;
  mall: string;
  stores: number;
  value?: string | undefined;
}>(casingEntity.getTableItem());

expectType<{
  prop1: string;
  prop2: string;
  prop3?: string | undefined;
}>(entityWithWatchAll.getTableItem());

expectType<{
  prop1: string;
  prop2: string;
  attr3: {
    val1: string;
  };
  attr4: Array<{
    val2: number;
    val3: string[];
    val4: number[];
  }>;
  attr5: string[];
  attr6: string[];
}>(entityWithComplexShapesRequired.getTableItem());

expectType<{
  prop1: string;
  prop2: string;
  attrz3?:
    | {
        val1: string;
      }
    | undefined;
  attrz4?:
    | {
        val2: number;
        val3?: string[] | undefined;
        val4?: number[] | undefined;
        val5?:
          | {
              val6: string;
            }
          | undefined;
      }[]
    | undefined;
  attrz5?: string[] | undefined;
  attrz6?: string[] | undefined;
}>(entityWithComplexShapesRequiredOnEdge.getTableItem());

expectType<{
  prop1: string;
  prop2: string;
  prop3?:
    | {
        val1?: string | undefined;
      }
    | undefined;
  prop4?:
    | {
        val2?: number | undefined;
        val3?: string[] | undefined;
        val4?: number[] | undefined;
      }[]
    | undefined;
  prop5?: string[] | undefined;
  prop6?: string[] | undefined;
}>(entityWithComplexShapes.getTableItem());

expectNotType<{
  prop1: string;
  prop2: string;
  attrz3: {
    val1?: string | undefined;
  };
  attrz4: Array<{
    val2: number | undefined;
    val3: string[];
    val4: number[];
    val5: {
      val6?: string | undefined;
    };
  }>;
  attr5: string[];
  attr6: string[];
}>(entityWithComplexShapesRequiredOnEdge.getTableItem());

expectType<{
  prop1: string;
  prop2: string;
  prop3: string;
}>(entityWithHiddenAttributes1.getTableItem());

// getResponseItem
expectType<{
  prop1: string;
  prop2: string;
}>(entityWithHiddenAttributes1.getResponseItem());

expectType<{
  attr1: OpaqueAttr1;
  attr2: OpaqueAttr2;
  attr3: MyBasicCustomAttribute;
  attr4: MyBasicCustomAttribute;
  attr5?: MyBasicCustomAttribute;
  attr6?: PizzaSize;
}>(entityWithCustomAttribute2.getResponseItem());

expectType<{
  attr1: OpaqueAttr1;
  attr2: OpaqueAttr2;
  map: {
    attr3: MyBasicCustomAttribute;
    attr4: MyBasicCustomAttribute;
    attr5?: MyBasicCustomAttribute;
    attr6?: PizzaSize;
  },
  list: Array<{
    attr3: MyBasicCustomAttribute;
    attr4: MyBasicCustomAttribute;
    attr5?: MyBasicCustomAttribute;
    attr6?: PizzaSize;
  }>;
}>(magnify(entityWithNestedCustomAttribute.getResponseItem()));

function hiddenKeysOnRoot() {
  const item = entityWithHiddenAttributes1.getResponseItem();
  if (item) {
    const keys = "" as keyof typeof item;
    expectType<"prop1" | "prop2">(keys);
    expectNotType<"hidden">(keys);
  }
}

expectType<{
  username: string;
  mapObject?:
    | {
        minimal?: string | undefined;
        readOnly?: string | undefined;
        required: string;
        anotherMap?:
          | {
              minimal?: string | undefined;
              readOnly?: string | undefined;
              required: string;
            }
          | undefined;
      }
    | undefined;
}>(magnify(mapTests.getResponseItem()));

function hiddenKeysInMap() {
  const item = mapTests.getResponseItem();
  if (item.mapObject) {
    const keys = "" as keyof typeof item.mapObject;
    expectType<"required" | "readOnly" | "minimal" | "anotherMap">(keys);
    expectNotType<"hidden">(keys);
  }
}

expectType<{
  prop1: string;
  prop2: string;
  prop3: string;
  prop4?: string | undefined;
  prop5: string;
}>(standAloneEntityWithDefault.getResponseItem());

expectType<{
  attr1: string;
  strEnumSet?: ("ONE" | "TWO" | "THREE")[] | undefined;
  numEnumSet?: (1 | 2 | 3)[] | undefined;
  mapAttr?:
    | {
        nestedStrEnumSet?: ("ONE" | "TWO" | "THREE")[] | undefined;
        nestedNumEnumSet?: (1 | 2 | 3)[] | undefined;
      }
    | undefined;
}>(magnify(entityWithEnumSets.getResponseItem()));

// RequiredPutItems
expectType<{
  username: true;
  mapObject: false;
}>(mapTests.getRequiredPutItems());

expectType<{
  attr1: true;
  attr2: false;
  attr3: true;
  attr4: false;
  attr5: false;
  attr6: false;
}>(entityWithCustomAttribute2.getRequiredPutItems());

expectType<{
  attr1: true;
  attr2: false;
  map: true;
  list: true;
}>(entityWithNestedCustomAttribute.getRequiredPutItems());

expectType<{
  prop1: false; // is pk, but has default
  prop2: true; // is pk
  prop3: true; // is required
  prop4: true; // is sk
  prop10: false; // optional default
}>(normalEntity1.getRequiredPutItems());

expectType<{
  prop1: false; // is pk, but has default
  prop2: true; // is pk
  prop3: false; // is sk, but has default
  prop4: true; // is required
  prop5: false; // is required, but has default
}>(standAloneEntity2.getRequiredPutItems());

// PutItem
expectType<{
  username: string;
  mapObject?:
    | {
        minimal?: string | undefined;
        required: string;
        readOnly?: string | undefined;
        anotherMap?:
          | {
              minimal?: string | undefined;
              required: string;
              readOnly?: string | undefined;
            }
          | undefined;
      }
    | undefined;
}>(mapTests.getPutItem());

expectType<{
  attr1: OpaqueAttr1;
  attr2?: OpaqueAttr2;
  attr3: MyBasicCustomAttribute;
  attr4?: MyBasicCustomAttribute;
  attr5?: MyBasicCustomAttribute;
  attr6?: PizzaSize;
}>(entityWithCustomAttribute2.getPutItem());

expectType<{
  attr1: OpaqueAttr1;
  attr2?: OpaqueAttr2;
  map: {
    attr3: MyBasicCustomAttribute;
    attr4?: MyBasicCustomAttribute;
    attr5?: MyBasicCustomAttribute;
    attr6?: PizzaSize;
  };
  list: {
    attr3: MyBasicCustomAttribute;
    attr4?: MyBasicCustomAttribute;
    attr5?: MyBasicCustomAttribute | undefined;
    attr6?: PizzaSize | undefined;
  }[];
}>(magnify(entityWithNestedCustomAttribute.getPutItem()));

expectType<{
  prop1?: string | undefined;
  prop2: string;
  prop3: string;
  prop4?: string | undefined;
  prop5?: string | undefined;
}>(standAloneEntityWithDefault.getPutItem());

expectType<{
  prop1: string;
  prop2?: string | undefined;
  attrz3?:
    | {
        val1: string;
      }
    | undefined;
  attrz4?:
    | {
        val2?: number | undefined;
        val3?: string[] | undefined;
        val4?: number[] | undefined;
        val6?: boolean | undefined;
        val5?:
          | {
              val6?: string | undefined;
            }
          | undefined;
      }[]
    | undefined;
  attrz5?: string[] | undefined;
  attrz6?: string[] | undefined;
}>(entityWithComplexShapesRequiredOnEdgeWithDefault.getPutItem());

expectType<{
  prop1?: string | undefined; // is pk, but has default
  prop2: string; // is pk
  prop3: string; // is required
  prop4: number; // is sk
  prop10?: boolean | undefined; // optional default
}>(normalEntity1.getPutItem());

expectType<{
  prop1?: string | undefined; // is pk, but has default
  prop2: string; // is pk
  prop3?: string | undefined; // is sk, but has default
  prop4: {
    prop1?: string | undefined;
    prop2: string;
    prop3?: string | undefined;
  }; // is required
  prop5?:
    | {
        prop1?: string | undefined;
        prop2: string;
        prop3?: string | undefined;
      }
    | undefined; // is required, but has default
}>(standAloneEntity2.getPutItem());

// UpdateData
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
}>(mapTests.getUpdateData());

expectType<{ prop3: boolean }>(readOnlyEntity.getUpdateData());

// RemoveItem
expectType<Array<"mapObject">>(mapTests.getRemoveItem());

expectType<Array<"attr6">>(entityWithCustomAttribute2.getRemoveItem());

expectType<Array<never>>(entityWithNestedCustomAttribute.getRemoveItem());

expectType<Array<"prop3">>(readOnlyEntity.getRemoveItem());

expectType<Array<"prop10">>(normalEntity1.getRemoveItem());

expectType<Array<"attr3" | "attr5" | "attr6" | "attr7" | "attr9" | "attr10">>(
  entityWithSK.getRemoveItem(),
);

// AppendItem
expectType<{}>(magnify(readOnlyEntity.getAppendItem)());

expectType<{
  prop4?:
    | {
        val2?: number | undefined;
        val3?: string[] | undefined;
        val4?: number[] | undefined;
      }[]
    | undefined;
}>(magnify(entityWithComplexShapes.getAppendItem()));

expectType<{
  attr3?: MyBasicCustomAttribute | undefined;
  attr4?: MyBasicCustomAttribute | undefined;
  attr5?: undefined;
}>(magnify(entityWithCustomAttribute2.getAppendItem()));

expectType<{
  list?: Array<{
    attr3: MyBasicCustomAttribute;
    attr4: MyBasicCustomAttribute;
    attr6?: PizzaSize;
  }> | undefined;
}>(magnify(entityWithNestedCustomAttribute.getAppendItem()));

expectType<{
  attr4?:
    | {
        val2: number;
        val3: string[];
        val4: number[];
      }[]
    | undefined;
}>(magnify(entityWithComplexShapesRequired.getAppendItem()));

expectType<{
  attrz4?:
    | {
        val2: number;
        val3?: string[] | undefined;
        val4?: number[] | undefined;
        val5?:
          | {
              val6: string;
            }
          | undefined;
      }[]
    | undefined;
}>(magnify(entityWithComplexShapesRequiredOnEdge.getAppendItem()));

// AddItem
expectType<{
  strEnumSet?: ("ONE" | "TWO" | "THREE")[];
  numEnumSet?: (1 | 2 | 3)[];
}>(entityWithEnumSets.getAddItem());

expectType<{}>(complex.getAppendItem());

expectType<{
  attr5?: string[] | undefined;
  attr6?: string[] | undefined;
}>(entityWithComplexShapesRequired.getAddItem());

expectType<{
  attr2?: undefined;
  attr3?: MyBasicCustomAttribute | undefined;
  attr4?: MyBasicCustomAttribute | undefined;
  attr5?: undefined;
  attr6?: PizzaSize | undefined;
}>(magnify(entityWithCustomAttribute2.getAddItem()));

expectType<{
  attrz5?: string[] | undefined;
  attrz6?: string[] | undefined;
}>(entityWithComplexShapesRequiredOnEdge.getAddItem());

expectType<{
  // todo: would be great for these not to show up at all
  prop4?: undefined;
}>(normalEntity1.getAddItem());

expectType<{
  attr6?: number | undefined;
  attr7?: any;
  attr9?: number | undefined;
}>(entityWithSK.getAddItem());

expectType<{
  // todo: would be great for these not to show up at all
  prop2?: undefined;
  prop7?: undefined;
}>(readOnlyEntity.getAddItem());

// SubtractItem
expectType<{
  attr6?: number | undefined;
  attr7?: any;
  attr9?: number | undefined;
}>(entityWithSK.getSubtractItem());

expectType<{
  attr2?: undefined;
  attr6?: PizzaSize | undefined;
}>(magnify(entityWithCustomAttribute2.getSubtractItem()));

expectType<{}>(entityWithCustomAttribute.getSubtractItem());

expectType<{
  // todo: would be great for these not to show up at all
  prop4?: undefined;
}>(normalEntity1.getSubtractItem());

// DeleteItem
expectType<{
  attr5?: string[] | undefined;
  attr6?: string[] | undefined;
}>(entityWithComplexShapesRequired.getDeleteItem());

expectType<{
  attr2?: MyCustomAttributeType;
}>(entityWithCustomAttribute.getDeleteItem());

expectType<{
  attrz5?: string[] | undefined;
  attrz6?: string[] | undefined;
}>(entityWithComplexShapesRequiredOnEdge.getDeleteItem());

expectType<{
  attr3?: MyBasicCustomAttribute | undefined;
  attr4?: MyBasicCustomAttribute | undefined;
  attr5?: undefined;
}>(magnify(entityWithCustomAttribute2.getDeleteItem()));

expectType<{
  // todo: would be great for these not to show up at all
  prop2?: undefined;
}>(readOnlyEntity.getSubtractItem());

expectType<{}>(normalEntity1.getDeleteItem());

expectType<{
  strEnumSet?: ("ONE" | "TWO" | "THREE")[];
  numEnumSet?: (1 | 2 | 3)[];
}>(entityWithEnumSets.getDeleteItem());

expectType<{
  attr7?: any;
}>(entityWithSK.getDeleteItem());

expectType<{
  // todo: would be great for these not to show up at all
  prop7?: undefined;
}>(readOnlyEntity.getDeleteItem());
