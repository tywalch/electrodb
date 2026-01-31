import {
  Resolve,
  EntityRecord,
  EntityItem,
} from "../";
import {
  requiredMapAttributeEntity,
  entityWithSK,
  customAttributeEntity,
  UnionType
} from "./entity-entities.test-d";
import { expectType } from "tsd";
import { magnify } from "./util.test-d";

entityWithSK
  .update({
    attr1: "abc",
    attr2: "def",
  })
  .append({});

type CreateOptions = Parameters<typeof entityWithSK.create>[0];
type UpsertOptions = Parameters<typeof entityWithSK.upsert>[0];

const createOptions = {} as Partial<CreateOptions>;
const upsertOptions = {} as UpsertOptions;

expectType<UpsertOptions>(createOptions);
expectType<{
  attr1?: string | undefined;
  attr2?: string | undefined;
  attr3?: "123" | "def" | "ghi" | undefined;
  attr4?: "abc" | "ghi" | undefined;
  attr5?: string | undefined;
  attr6?: number | undefined;
  attr7?: any;
  attr8?: boolean | undefined;
  attr9?: number | undefined;
  attr10?: boolean | undefined;
  attr11?: string[] | undefined;
}>(magnify(upsertOptions));

const getItem = async () => {
  const item = await requiredMapAttributeEntity
    .get({ stringVal: "abc", stringVal2: "def" })
    .go();
  if (item.data) {
    return item.data;
  }

  throw new Error("Not exists!");
};

type Item = Awaited<ReturnType<typeof getItem>>;
const item = {} as Item;

expectType<{
  stringVal: string;
  stringVal2: string;
  map: {
    test?: string;
  };
}>(magnify(item));

type CustomAttributeEntityRecordType = EntityRecord<
  typeof customAttributeEntity
>;
const unionEntityRecord = {} as CustomAttributeEntityRecordType["union"];

expectType<UnionType>(magnify(unionEntityRecord));

type CustomAttributeEntityItemType = EntityItem<typeof customAttributeEntity>;
const unionEntityItem = {} as CustomAttributeEntityItemType["union"];

expectType<UnionType>(magnify(unionEntityItem));

const batchGetWithoutAttributesNoPreserve = entityWithSK.get([{attr1: 'abc', attr2: 'def'}]).go();
expectType<Promise<{
  data: {
    attr1: string;
    attr2: string;
    attr3?: "def" | "123" | "ghi" | undefined;
    attr4: "abc" | "ghi";
    attr5?: string | undefined;
    attr6?: number | undefined;
    attr7?: any;
    attr8: boolean;
    attr9?: number | undefined;
    attr10?: boolean | undefined;
    attr11?: string[] | undefined;
  }[];
  unprocessed: {
    attr1: string;
    attr2: string;
  }[];
}>>(batchGetWithoutAttributesNoPreserve);

const batchGetWithoutAttributesPreserve = entityWithSK.get([{attr1: 'abc', attr2: 'def'}]).go({ preserveBatchOrder: true });
expectType<Promise<{
  data: ({
    attr1: string
    attr2: string
    attr3?: "123" | "def" | "ghi" | undefined
    attr4: "abc" | "ghi"
    attr5?: string | undefined
    attr6?: number | undefined
    attr7?: any
    attr8: boolean
    attr9?: number | undefined
    attr10?: boolean | undefined
    attr11?: string[] | undefined
  } | null)[];
  unprocessed: {
    attr1: string;
    attr2: string;
  }[];
}>>(batchGetWithoutAttributesPreserve);

const batchGetWithAttributesNoPreserve = entityWithSK.get([{attr1: 'abc', attr2: 'def'}]).go({ attributes: ['attr5', 'attr10'] });
expectType<Promise<{
  data: Array<{
    attr5?: string | undefined;
    attr10?: boolean | undefined;
  }>;
  unprocessed: { attr1: string; attr2: string; }[];
}>>(magnify(batchGetWithAttributesNoPreserve));

const batchGetWithAttributesPreserve = entityWithSK.get([{attr1: 'abc', attr2: 'def'}]).go({ attributes: ['attr5', 'attr10'], preserveBatchOrder: true });
expectType<Promise<{
  data: Array<{
    attr5?: string | undefined;
    attr10?: boolean | undefined;
  } | null>;
  unprocessed: { attr1: string; attr2: string; }[];
}>>(magnify(batchGetWithAttributesPreserve));