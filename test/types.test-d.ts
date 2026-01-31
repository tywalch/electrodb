import { expectType, expectAssignable } from "tsd";
import { QueryCommandOutput } from '@aws-sdk/client-dynamodb';
import { Entity, EntityItem, ElectroError } from "../";
import { entityWithSK } from "./types-entities.test-d";
import { get } from "./util.test-d";

type EntityWithSK = ReturnType<typeof entityWithSK.parse>["data"][0];
type EntityWithSKEntityItem = EntityItem<typeof entityWithSK>;
type EntitySchema = typeof entityWithSK extends Entity<
  infer A,
  infer F,
  infer C,
  infer S
>
  ? { supposedly: "can" }
  : { cannot: "ever" };

expectType<{
  attr1: string;
  attr2: string;
  attr3?: "123" | "def" | "ghi" | undefined;
  attr4: "abc" | "ghi";
  attr5?: string | undefined;
  attr6?: number | undefined;
  attr7?: any;
  attr8: boolean;
  attr9?: number | undefined;
  attr10?: boolean | undefined;
}>(get<EntityWithSK>());

expectType<{
  attr1: string;
  attr2: string;
  attr3?: "123" | "def" | "ghi" | undefined;
  attr4: "abc" | "ghi";
  attr5?: string | undefined;
  attr6?: number | undefined;
  attr7?: any;
  attr8: boolean;
  attr9?: number | undefined;
  attr10?: boolean | undefined;
}>(get<EntityWithSKEntityItem>());

expectType<{ supposedly: "can" }>(get<EntitySchema>());

const error = new ElectroError('test');

expectAssignable<{
  params: () => Record<string, unknown> | null;
}>(error);

const defaultErrorParams = error.params();

expectType<Record<string, unknown> | null>(defaultErrorParams);

const queryErrorParams = error.params<QueryCommandOutput>();

expectType<QueryCommandOutput | null>(queryErrorParams);