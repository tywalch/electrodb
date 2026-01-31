import { expectType } from "tsd";
import {
  entityWithSK,
  entityWithoutSK,
  entityWithSKE,
} from "./queries-entities.test-d";
import { magnify } from "./util.test-d";

const entityWithSKGo = entityWithSK.getGoQueryTerminal();
const entityWithSKScan = entityWithSK.getScanTerminal();

entityWithSKGo({
  attributes: ["attr2", "attr3", "attr4", "attr6", "attr8"],
}).then((results) => {
  expectType<
    {
      attr2: string;
      attr3?: "123" | "def" | "ghi" | undefined;
      attr4: "abc" | "ghi";
      attr6?: number | undefined;
      attr8: boolean;
    }[]
  >(results.data);
});

entityWithSKScan({
  attributes: ["attr2", "attr3", "attr4", "attr6", "attr8"],
}).then((results) => {
  expectType<
    {
      attr2: string;
      attr3?: "123" | "def" | "ghi" | undefined;
      attr4: "abc" | "ghi";
      attr6?: number | undefined;
      attr8: boolean;
    }[]
  >(results.data);
});

// const entityWithSKPage = entityWithSK.getPageQueryTerminal();
// entityWithSKPage(null, {attributes: ['attr2', 'attr3', 'attr4', 'attr6', 'attr8']}).then(data => {
//     const [page, results] = data;
//     expectType<{
//         attr2: string;
//         attr3?: '123' | 'def' | 'ghi' | undefined;
//         attr4: 'abc' | 'ghi';
//         attr6?: number | undefined;
//         attr8: boolean;
//     }[]>(results);
//     expectType<{
//         __edb_e__?: string | undefined;
//         __edb_v__?: string | undefined;
//         abc: string;
//     } | null>(magnify(page));
// });

const entityWithoutSKGo = entityWithoutSK.getGoQueryTerminal();
const entityWithoutSKScan = entityWithoutSK.getScanTerminal();

entityWithoutSKGo({
  attributes: ["attr2", "attr3", "attr4", "attr6", "attr8"],
}).then((results) => {
  expectType<
    {
      attr2?: string | undefined;
      attr3?: "123" | "def" | "ghi" | undefined;
      attr4: "abc" | "def";
      attr6?: number | undefined;
      attr8: boolean;
    }[]
  >(magnify(results.data));
});

entityWithoutSKScan({
  attributes: ["attr2", "attr3", "attr4", "attr6", "attr8"],
}).then((results) => {
  expectType<
    {
      attr2?: string | undefined;
      attr3?: "123" | "def" | "ghi" | undefined;
      attr4: "abc" | "def";
      attr6?: number | undefined;
      attr8: boolean;
    }[]
  >(magnify(results.data));
});

// const entityWithoutSKPage = entityWithoutSK.getPageQueryTerminal();
// entityWithoutSKPage(null, {attributes: ['attr2', 'attr3', 'attr4', 'attr6', 'attr8']}).then(data => {
//     const [page, results] = data;
//     expectType<{
//         attr2?: string | undefined;
//         attr3?: '123' | 'def' | 'ghi' | undefined;
//         attr4: 'abc' | 'def';
//         attr6?: number | undefined;
//         attr8: boolean;
//     }[]>(magnify(results));
//     expectType<{
//         __edb_e__?: string | undefined;
//         __edb_v__?: string | undefined;
//         abc: string;
//     } | null>(magnify(page));
// });

expectType<"myIndex" | "myIndex2" | "myIndex3">(entityWithSK.getKeyofQueries());
expectType<"myIndex" | "myIndex2" | "myIndex3">(
  entityWithoutSK.getKeyofQueries(),
);

const entityWithSKQueries = entityWithSK.getQueries();

const entityWithSKMyIndex = entityWithSKQueries.myIndex;
const entityWithSKMyIndexOptions = {} as Parameters<
  typeof entityWithSKMyIndex
>[0];
expectType<{
  attr1: string;
  attr2?: string | undefined;
}>(magnify(entityWithSKMyIndexOptions));

const entityWithSKMyIndexSKOperations = entityWithSKQueries.myIndex2({
  attr6: 10,
  attr9: 5,
  attr4: "abc",
});

type EntityWithSKMyIndexOperationsTerminals = Pick<
  typeof entityWithSKMyIndexSKOperations,
  "go" | "params" | "where"
>;
const afterWhere = entityWithSKMyIndexSKOperations.where((attr, op) =>
  op.eq(attr.attr4, "zz"),
);
expectType<EntityWithSKMyIndexOperationsTerminals>(afterWhere);

const entityWithSKMyIndexSKOperationsKeys =
  {} as keyof typeof entityWithSKMyIndexSKOperations;
expectType<
  "go" | "params" | "where" | "begins" | "between" | "gt" | "gte" | "lt" | "lte"
>(entityWithSKMyIndexSKOperationsKeys);

const entityWithSKMyIndexSKOperationsBegins = {} as Parameters<
  typeof entityWithSKMyIndexSKOperations.begins
>[0];
expectType<{
  attr5?: string | undefined;
}>(magnify(entityWithSKMyIndexSKOperationsBegins));

const entityWithSKMyIndexSKOperationsBetween0 = {} as Parameters<
  typeof entityWithSKMyIndexSKOperations.between
>[0];
const entityWithSKMyIndexSKOperationsBetween1 = {} as Parameters<
  typeof entityWithSKMyIndexSKOperations.between
>[1];
expectType<{
  attr5?: string | undefined;
}>(magnify(entityWithSKMyIndexSKOperationsBetween0));
expectType<{
  attr5?: string | undefined;
}>(magnify(entityWithSKMyIndexSKOperationsBetween1));

const entityWithSKMyIndexSKOperationsGT = {} as Parameters<
  typeof entityWithSKMyIndexSKOperations.gt
>[0];
expectType<{
  attr5?: string | undefined;
}>(magnify(entityWithSKMyIndexSKOperationsGT));

const entityWithSKMyIndexSKOperationsGTE = {} as Parameters<
  typeof entityWithSKMyIndexSKOperations.gte
>[0];
expectType<{
  attr5?: string | undefined;
}>(magnify(entityWithSKMyIndexSKOperationsGTE));

const entityWithSKMyIndexSKOperationsLT = {} as Parameters<
  typeof entityWithSKMyIndexSKOperations.lt
>[0];
expectType<{
  attr5?: string | undefined;
}>(magnify(entityWithSKMyIndexSKOperationsLT));

const entityWithSKMyIndexSKOperationsLTE = {} as Parameters<
  typeof entityWithSKMyIndexSKOperations.lte
>[0];
expectType<{
  attr5?: string | undefined;
}>(magnify(entityWithSKMyIndexSKOperationsLTE));

const entityWithoutSKQueries = entityWithoutSK.getQueries();
const entityWithoutSKMyIndex = entityWithoutSKQueries.myIndex;
const entityWithoutSKMyIndexOptions = {} as Parameters<
  typeof entityWithoutSKMyIndex
>[0];
expectType<{
  attr1: string;
}>(magnify(entityWithoutSKMyIndexOptions));

const entityWithoutSKMyIndex2SKOperations = entityWithoutSKQueries.myIndex2({
  attr6: 10,
  attr9: 5,
});
const entityWithoutSKMyIndex2SKOperationsKeys =
  {} as keyof typeof entityWithoutSKMyIndex2SKOperations;
expectType<"go" | "params" | "where">(entityWithoutSKMyIndex2SKOperationsKeys);

const afterGetOperations = entityWithSKE.get({ attr1: "abc", attr2: "def" });
const afterGetFilterOperations = entityWithSKE
  .get({ attr1: "abc", attr2: "def" })
  .where((attr, op) => {
    return op.eq(attr.attr4, "zzz");
  });
expectType<typeof afterGetOperations>(afterGetFilterOperations);
