import { expectType, expectError, expectAssignable, expectNotAssignable, expectNotType } from 'tsd';
import { EntityItem } from './';
import { Entity } from '../entity';

export type Resolve<T> = T extends Function | string | number | boolean
    ? T : {[Key in keyof T]: Resolve<T[Key]>}

const magnify = <T>(value: T): Resolve<T> => { return {} as Resolve<T> };
const get = <T>() => { return {} as Resolve<T> };
const troubleshoot = <T>(value: T) => Text;

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

type EntityWithSK = ReturnType<typeof entityWithSK.parse>[0];
type EntityWithSKEntityItem = EntityItem<typeof entityWithSK>;
type EntitySchema = typeof entityWithSK extends Entity<infer A, infer F, infer C, infer S>
  ? { supposedly: 'can' }
  : { cannot: 'ever' };

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

expectType<{supposedly: 'can'}>(get<EntitySchema>());
