/**
 * P3 — chain construction + params building. Read chains (get/query/scan)
 * should never build update machinery; update/upsert chains pay for it once.
 */
import type { ScenarioEntry } from "../run";
import { makeFixtureEntity } from "../../test/fixtures/entities";

const entity = makeFixtureEntity();
const key = { org: "org1", id: "id1" };

const scenarios: ScenarioEntry[] = [
  {
    name: "params-chain/get",
    fn: () => entity.get(key).params(),
  },
  {
    name: "params-chain/query",
    fn: () => entity.query.records({ org: "org1" }).params(),
  },
  {
    name: "params-chain/query-where",
    fn: () =>
      entity.query
        .records({ org: "org1" })
        .where((attributes: any, operations: any) =>
          operations.gt(attributes.count, 10),
        )
        .params(),
  },
  {
    name: "params-chain/update-set",
    fn: () => entity.update(key).set({ name: "x" }).params(),
  },
  {
    name: "params-chain/upsert",
    fn: () => entity.upsert({ ...key, name: "x", count: 1 }).params(),
  },
];

export default scenarios;
