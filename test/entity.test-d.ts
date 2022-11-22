import {Entity, Resolve} from '../';
import { expectType } from 'tsd';

const troubleshoot = <Params extends any[], Response>(fn: (...params: Params) => Response, response: Response) => {};
const magnify = <T>(value: T): Resolve<T> => { return {} as Resolve<T> };

const entityWithSK = new Entity({
  model: {
      entity: "abc",
      service: "myservice",
      version: "myversion"
  },
  attributes: {
      attr1: {
          type: "string",
          default: "abc",
          get: (val) => val + 123,
          set: (val) => (val ?? "") + 456,
          validate: (val) => !!val,
      },
      attr2: {
          type: "string",
          // default: () => "sfg",
          // required: false,
          validate: (val) => val.length > 0
      },
      attr3: {
          type: ["123", "def", "ghi"] as const,
          default: "def"
      },
      attr4: {
          type: ["abc", "ghi"] as const,
          required: true
      },
      attr5: {
          type: "string"
      },
      attr6: {
          type: "number",
          default: () => 100,
          get: (val) => val + 5,
          set: (val) => (val ?? 0) + 5,
          validate: (val) => true,
      },
      attr7: {
          type: "any",
          default: () => false,
          get: (val) => ({key: "value"}),
          set: (val) => (val ?? 0) + 5,
          validate: (val) => true,
      },
      attr8: {
          type: "boolean",
          required: true,
          get: (val) => !!val,
          set: (val) => !!val,
          validate: (val) => !!val,
      },
      attr9: {
          type: "number"
      },
      attr10: {
          type: "boolean"
      },
      attr11: {
        type: 'list',
        items: {
            type: 'string'
        }
      }
  },
  indexes: {
      myIndex: {
          collection: "mycollection2",
          pk: {
              field: "pk",
              composite: ["attr1"]
          },
          sk: {
              field: "sk",
              composite: ["attr2"]
          }
      },
      myIndex2: {
          collection: "mycollection1",
          index: "gsi1",
          pk: {
              field: "gsipk1",
              composite: ["attr6", "attr9"]
          },
          sk: {
              field: "gsisk1",
              composite: ["attr4", "attr5"]
          }
      },
      myIndex3: {
          collection: "mycollection",
          index: "gsi2",
          pk: {
              field: "gsipk2",
              composite: ["attr5"]
          },
          sk: {
              field: "gsisk2",
              composite: ["attr4", "attr3", "attr9"]
          }
      }
  }
});

entityWithSK.update({
    attr1: 'abc', 
    attr2: 'def'
}).append({});

type CreateOptions = Parameters<typeof entityWithSK.create>[0];
type UpsertOptions = Parameters<typeof entityWithSK.upsert>[0];

const createOptions = {} as CreateOptions;
const upsertOptions = {} as UpsertOptions;

expectType<UpsertOptions>(createOptions);
expectType<{
    attr1?: string | undefined;
    attr2: string;
    attr3?: "123" | "def" | "ghi" | undefined;
    attr4: 'abc' | 'ghi';
    attr5?: string | undefined;
    attr6?: number | undefined;
    attr7?: any;
    attr8: boolean;
    attr9?: number | undefined;
    attr10?: boolean | undefined;
    attr11?: string[] | undefined;
}>(magnify(upsertOptions));