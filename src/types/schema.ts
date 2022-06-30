export interface ElectroError extends Error {
  readonly name: 'ElectroError';
  readonly code: number;
  readonly date: number;
  readonly isElectroError: boolean;
  ref: {
      readonly code: number;
      readonly section: string;
      readonly name: string;
      readonly sym: unique symbol;
  }
}

export interface ElectroValidationErrorFieldReference<T extends Error = Error> {
  /**
   * The json path to the attribute that had a validation error
   */
  readonly field: string;

  /**
   * A description of the validation error for that attribute
   */
  readonly reason: string;

  /**
   * Index of the value passed (present only in List attribute validation errors)
   */
  readonly index: number | undefined;

  /**
   * The error thrown from the attribute's validate callback (if applicable)
   */
  readonly cause: T | undefined;
}

export interface ElectroValidationError<T extends Error = Error> extends ElectroError {
  readonly fields: ReadonlyArray<ElectroValidationErrorFieldReference<T>>;
}

export interface ReadOnlyAttribute {
  readonly readOnly: true;
}

export interface RequiredAttribute {
  required: true;
}

export interface HiddenAttribute {
  readonly hidden: true;
}

export interface DefaultedAttribute {
  readonly default: any;
}

export interface SecondaryIndex {
  readonly index: string;
}

export interface NestedBooleanAttribute {
  readonly type: "boolean";
  readonly required?: boolean;
  readonly hidden?: boolean;
  readonly readOnly?: boolean;
  readonly get?: (val: boolean, item: any) => boolean | undefined | void;
  readonly set?: (val?: boolean, item?: any) => boolean | undefined | void;
  readonly default?: boolean | (() => boolean);
  readonly validate?: ((val: boolean) => boolean) | ((val: boolean) => void) | ((val: boolean) => string | void);
  readonly field?: string;
}

export interface BooleanAttribute {
  readonly type: "boolean";
  readonly required?: boolean;
  readonly hidden?: boolean;
  readonly readOnly?: boolean;
  readonly get?: (val: boolean, item: any) => boolean | undefined | void;
  readonly set?: (val?: boolean, item?: any) => boolean | undefined | void;
  readonly default?: boolean | (() => boolean);
  readonly validate?: ((val: boolean) => boolean) | ((val: boolean) => void) | ((val: boolean) => string | void);
  readonly field?: string;
  readonly label?: string;
  readonly watch?: ReadonlyArray<string> | "*";
}

export interface NestedNumberAttribute {
  readonly type: "number";
  readonly required?: boolean;
  readonly hidden?: boolean;
  readonly readOnly?: boolean;
  readonly get?: (val: number, item: any) => number | undefined | void;
  readonly set?: (val?: number, item?: any) => number | undefined | void;
  readonly default?: number | (() => number);
  readonly validate?: ((val: number) => boolean) | ((val: number) => void) | ((val: number) => string | void);
  readonly field?: string;
}

export interface NumberAttribute {
  readonly type: "number";
  readonly required?: boolean;
  readonly hidden?: boolean;
  readonly readOnly?: boolean;
  readonly get?: (val: number, item: any) => number | undefined | void;
  readonly set?: (val?: number, item?: any) => number | undefined | void;
  readonly default?: number | (() => number);
  readonly validate?: ((val: number) => boolean) | ((val: number) => void) | ((val: number) => string | void);
  readonly field?: string;
  readonly label?: string;
  readonly watch?: ReadonlyArray<string> | "*";
}

export interface NestedStringAttribute {
  readonly type: "string";
  readonly required?: boolean;
  readonly hidden?: boolean;
  readonly readOnly?: boolean;
  readonly get?: (val: string, item: any) => string | undefined | void;
  readonly set?: (val?: string, item?: any) => string | undefined | void;
  readonly default?: string | (() => string);
  readonly validate?: ((val: string) => boolean) | ((val: string) => void) | ((val: string) => string | void) | RegExp;
  readonly field?: string;
}

export interface StringAttribute {
  readonly type: "string";
  readonly required?: boolean;
  readonly hidden?: boolean;
  readonly readOnly?: boolean;
  readonly get?: (val: string, item: any) => string | undefined | void;
  readonly set?: (val?: string, item?: any) => string | undefined | void;
  readonly default?: string | (() => string);
  readonly validate?: ((val: string) => boolean) | ((val: string) => void) | ((val: string) => string | void) | RegExp;
  readonly field?: string;
  readonly label?: string;
  readonly watch?: ReadonlyArray<string> | "*";
}

export interface NestedEnumAttribute {
  readonly type: ReadonlyArray<string>;
  readonly required?: boolean;
  readonly hidden?: boolean;
  readonly readOnly?: boolean;
  readonly get?: (val: any, item: any) => any | undefined | void;
  readonly set?: (val?: any, item?: any) => any | undefined | void;
  readonly default?: string | (() => string);
  readonly validate?: ((val: any) => boolean) | ((val: any) => void) | ((val: any) => string | void);
  readonly field?: string;
  readonly label?: string;
}


export interface EnumAttribute {
  readonly type: ReadonlyArray<string>;
  readonly required?: boolean;
  readonly hidden?: boolean;
  readonly readOnly?: boolean;
  readonly get?: (val: any, item: any) => any | undefined | void;
  readonly set?: (val?: any, item?: any) => any | undefined | void;
  readonly default?: string | (() => string);
  readonly validate?: ((val: any) => boolean) | ((val: any) => void) | ((val: any) => string | void);
  readonly field?: string;
  readonly label?: string;
  readonly watch?: ReadonlyArray<string> | "*";
}

export interface NestedAnyAttribute {
  readonly type: "any";
  readonly required?: boolean;
  readonly hidden?: boolean;
  readonly readOnly?: boolean;
  readonly get?: (val: any, item: any) => any | undefined | void;
  readonly set?: (val?: any, item?: any) => any | undefined | void;
  readonly default?: any | (() => any);
  readonly validate?: ((val: any) => boolean) | ((val: any) => void) | ((val: any) => string | void);
  readonly field?: string;
}

export interface AnyAttribute {
  readonly type: "any";
  readonly required?: boolean;
  readonly hidden?: boolean;
  readonly readOnly?: boolean;
  readonly get?: (val: any, item: any) => any | undefined | void;
  readonly set?: (val?: any, item?: any) => any | undefined | void;
  readonly default?: any | (() => any);
  readonly validate?: ((val: any) => boolean) | ((val: any) => void) | ((val: any) => string | void);
  readonly field?: string;
  readonly label?: string;
  readonly watch?: ReadonlyArray<string> | "*";
}

export interface NestedMapAttribute {
  readonly type: "map";
  readonly properties: {
      readonly [name: string]: NestedAttributes;
  };
  readonly required?: boolean;
  readonly hidden?: boolean;
  readonly readOnly?: boolean;
  readonly get?: (val: Record<string, any>, item: any) => Record<string, any> | undefined | void;
  readonly set?: (val?: Record<string, any>, item?: any) => Record<string, any> | undefined | void;
  readonly default?: Record<string, any> | (() => Record<string, any>);
  readonly validate?: ((val: Record<string, any>) => boolean) | ((val: Record<string, any>) => void) | ((val: Record<string, any>) => string | void);
  readonly field?: string;
}

export interface MapAttribute {
  readonly type: "map";
  readonly properties: {
      readonly [name: string]: NestedAttributes;
  };
  readonly required?: boolean;
  readonly hidden?: boolean;
  readonly readOnly?: boolean;
  readonly get?: (val: Record<string, any>, item: any) => Record<string, any> | undefined | void;
  readonly set?: (val?: Record<string, any>, item?: any) => Record<string, any> | undefined | void;
  readonly default?: Record<string, any> | (() => Record<string, any>);
  readonly validate?: ((val: Record<string, any>) => boolean) | ((val: Record<string, any>) => void) | ((val: Record<string, any>) => string | void);
  readonly field?: string;
  readonly watch?: ReadonlyArray<string> | "*";
}

export interface NestedStringListAttribute {
  readonly type: "list";
  readonly items: {
      readonly type: "string";
      readonly required?: boolean;
      readonly hidden?: boolean;
      readonly readOnly?: boolean;
      readonly get?: (val: string, item: any) => string | undefined | void;
      readonly set?: (val?: string, item?: any) => string | undefined | void;
      readonly default?: string | (() => string);
      readonly validate?: ((val: string) => boolean) | ((val: string) => void) | ((val: string) => string | void) | RegExp;
      readonly field?: string;
  };
  readonly required?: boolean;
  readonly hidden?: boolean;
  readonly readOnly?: boolean;
  readonly get?: (val: Array<string>, item: any) => Array<string> | undefined | void;
  readonly set?: (val?: Array<string>, item?: any) => Array<string> | undefined | void;
  readonly default?: Array<string> | (() => Array<string>);
  readonly validate?: ((val: Array<string>) => boolean) | ((val: Array<string>) => void) | ((val: Array<string>) => string | void);
}

export interface StringListAttribute {
  readonly type: "list";
  readonly items: {
      readonly type: "string";
      readonly required?: boolean;
      readonly hidden?: boolean;
      readonly readOnly?: boolean;
      readonly get?: (val: string, item: any) => string | undefined | void;
      readonly set?: (val?: string, item?: any) => string | undefined | void;
      readonly default?: string | (() => string);
      readonly validate?: ((val: string) => boolean) | ((val: string) => void) | ((val: string) => string | void) | RegExp;
      readonly field?: string;
  }
  readonly required?: boolean;
  readonly hidden?: boolean;
  readonly readOnly?: boolean;
  readonly get?: (val: Array<string>, item: any) => Array<string> | undefined | void;
  readonly set?: (val?: Array<string>, item?: any) => Array<string> | undefined | void;
  readonly default?: Array<string> | (() => Array<string>);
  readonly validate?: ((val: Array<string>) => boolean) | ((val: Array<string>) => void) | ((val: Array<string>) => string | void);
  readonly watch?: ReadonlyArray<string> | "*";
}

export interface NestedNumberListAttribute {
  readonly type: "list";
  readonly items: NestedNumberAttribute;
  readonly required?: boolean;
  readonly hidden?: boolean;
  readonly readOnly?: boolean;
  readonly get?: (val: Array<number>, item: any) => Array<number> | undefined | void;
  readonly set?: (val?: Array<number>, item?: any) => Array<number> | undefined | void;
  readonly default?: Array<number> | (() => Array<number>);
  readonly validate?: ((val: Array<number>) => boolean) | ((val: Array<number>) => void) | ((val: Array<number>) => string | void);
  readonly field?: string;
}

export interface NumberListAttribute {
  readonly type: "list";
  readonly items: NestedNumberAttribute;
  readonly required?: boolean;
  readonly hidden?: boolean;
  readonly readOnly?: boolean;
  readonly get?: (val: Array<number>, item: any) => Array<number> | undefined | void;
  readonly set?: (val?: Array<number>, item?: any) => Array<number> | undefined | void;
  readonly default?: Array<number> | (() => Array<number>);
  readonly validate?: ((val: Array<number>) => boolean) | ((val: Array<number>) => void) | ((val: Array<number>) => string | void);
  readonly field?: string;
  readonly watch?: ReadonlyArray<string> | "*";
}

export interface NestedMapListAttribute {
  readonly type: "list";
  readonly items: NestedMapAttribute;
  readonly required?: boolean;
  readonly hidden?: boolean;
  readonly readOnly?: boolean;
  readonly get?: (val: Record<string, any>[], item: any) => Record<string, any>[] | undefined | void;
  readonly set?: (val?: Record<string, any>[], item?: any) => Record<string, any>[] | undefined | void;
  readonly default?: Record<string, any>[] | (() => Record<string, any>[]);
  readonly validate?: ((val: Record<string, any>[]) => boolean) | ((val: Record<string, any>[]) => void) | ((val: Record<string, any>[]) => string | void);
  readonly field?: string;
}

export interface MapListAttribute {
  readonly type: "list";
  readonly items: NestedMapAttribute;
  readonly required?: boolean;
  readonly hidden?: boolean;
  readonly readOnly?: boolean;
  readonly get?: (val: Record<string, any>[], item: any) => Record<string, any>[] | undefined | void;
  readonly set?: (val?: Record<string, any>[], item?: any) => Record<string, any>[] | undefined | void;
  readonly default?: Record<string, any>[] | (() => Record<string, any>[]);
  readonly validate?: ((val: Record<string, any>[]) => boolean) | ((val: Record<string, any>[]) => void) | ((val: Record<string, any>[]) => string | void);
  readonly field?: string;
  readonly watch?: ReadonlyArray<string> | "*";
}

export interface NestedStringSetAttribute {
  readonly type: "set";
  readonly items: "string";
  readonly required?: boolean;
  readonly hidden?: boolean;
  readonly readOnly?: boolean;
  readonly get?: (val: Array<string>, item: any) => Array<string> | undefined | void;
  readonly set?: (val?: Array<string>, item?: any) => Array<string> | undefined | void;
  readonly default?: Array<string> | (() => Array<string>);
  readonly validate?: ((val: Array<string>) => boolean) | ((val: Array<string>) => void) | ((val: Array<string>) => string | void) | RegExp;
  readonly field?: string;
}

export interface StringSetAttribute {
  readonly type: "set";
  readonly items: "string";
  readonly required?: boolean;
  readonly hidden?: boolean;
  readonly readOnly?: boolean;
  readonly get?: (val: Array<string>, item: any) => Array<string> | undefined | void;
  readonly set?: (val?: Array<string>, item?: any) => Array<string> | undefined | void;
  readonly default?: Array<string> | (() => Array<string>);
  readonly validate?: ((val: Array<string>) => boolean) | ((val: Array<string>) => void) | ((val: Array<string>) => string | void) | RegExp;
  readonly field?: string;
  readonly watch?: ReadonlyArray<string> | "*";
}

export interface NestedNumberSetAttribute {
  readonly type: "set";
  readonly items: "number";
  readonly required?: boolean;
  readonly hidden?: boolean;
  readonly readOnly?: boolean;
  readonly get?: (val: Array<number>, item: any) => Array<number> | undefined | void;
  readonly set?: (val?: Array<number>, item?: any) => Array<number> | undefined | void;
  readonly default?: Array<number> | (() => Array<number>);
  readonly validate?: ((val: Array<number>) => boolean) | ((val: Array<number>) => void) | ((val: Array<number>) => string | void);
  readonly field?: string;
}

export interface NumberSetAttribute {
  readonly type: "set";
  readonly items: "number";
  readonly required?: boolean;
  readonly hidden?: boolean;
  readonly readOnly?: boolean;
  readonly get?: (val: Array<number>, item: any) => Array<number> | undefined | void;
  readonly set?: (val?: Array<number>, item?: any) => Array<number> | undefined | void;
  readonly default?: Array<number> | (() => Array<number>);
  readonly validate?: ((val: Array<number>) => boolean) | ((val: Array<number>) => void) | ((val: Array<number>) => string | void);
  readonly field?: string;
  readonly watch?: ReadonlyArray<string> | "*";
}

export type Attribute =
  BooleanAttribute
  | NumberAttribute
  | StringAttribute
  | EnumAttribute
  | AnyAttribute
  | MapAttribute
  | StringSetAttribute
  | NumberSetAttribute
  | StringListAttribute
  | NumberListAttribute
  | MapListAttribute;

export type NestedAttributes =
NestedBooleanAttribute
| NestedNumberAttribute
| NestedStringAttribute
| NestedAnyAttribute
| NestedMapAttribute
| NestedStringListAttribute
| NestedNumberListAttribute
| NestedMapListAttribute
| NestedStringSetAttribute
| NestedNumberSetAttribute
| NestedEnumAttribute;

export interface IndexWithSortKey {
  readonly sk: {
      readonly field: string;
      readonly composite: ReadonlyArray<string>;
      readonly template?: string;
  }
}

export type AccessPatternCollection<C extends string> = C | ReadonlyArray<C>;

export interface Schema<A extends string, F extends string, C extends string> {
  readonly model: {
      readonly entity: string;
      readonly service: string;
      readonly version: string;
  }
  readonly attributes: {
      readonly [a in A]: Attribute
  };
  readonly indexes: {
      [accessPattern: string]: {
          readonly index?: string;
          readonly collection?: AccessPatternCollection<C>;
          readonly pk: {
              readonly casing?: "upper" | "lower" | "none" | "default";
              readonly field: string;
              readonly composite: ReadonlyArray<F>;
              readonly template?: string;
          }
          readonly sk?: {
              readonly casing?: "upper" | "lower" | "none" | "default";
              readonly field: string;
              readonly composite: ReadonlyArray<F>;
              readonly template?: string;
          }
      }
  }
}

export type Attributes<A extends string> = Record<A, Attribute>

export type IndexCollections<A extends string, F extends string, C extends string, S extends Schema<A,F,C>> = {
  [i in keyof S["indexes"]]: S["indexes"][i]["collection"] extends
      AccessPatternCollection<infer Name>
          ? Name
          : never
}[keyof S["indexes"]];

export type EntityCollections<A extends string, F extends string, C extends string, S extends Schema<A,F,C>> = {
  [N in IndexCollections<A,F,C,S>]: {
      [i in keyof S["indexes"]]: S["indexes"][i]["collection"] extends AccessPatternCollection<infer Name>
          ? Name extends N
              ? i
              : never
          : never
  }[keyof S["indexes"]];
}

// type UndefinedKeys<T> = {
//   [P in keyof T]: undefined extends T[P] ? P: never
// }[keyof T]

declare const SkipSymbol: unique symbol;
type SkipValue = typeof SkipSymbol;

type DefinedKeys<T> = {
  [P in keyof T as 
    [undefined] extends [T[P]] 
      ? never 
      : SkipValue extends T[P]
        ? never
        : P
    ]: T[P]
}

type PartialDefinedKeys<T> = { 
  [P in keyof T as 
    [undefined] extends [T[P]] 
      ? never 
      : SkipValue extends T[P]
        ? never
        : P
  ]?: T[P] | undefined; 
}

type SkipKeys<T> = { 
  [P in keyof T as SkipValue extends T[P] ? never : P]: T[P]
}

// type TrimmedAttributes<A extends Attributes<any>> =
//   Partial<Pick<A, UndefinedKeys<A>>> & Omit<A, UndefinedKeys<A>>

export type ItemAttribute<A extends Attribute> =
  A["type"] extends infer R
      ? R extends "string" ? string
      : R extends "number" ? number
          : R extends "boolean" ? boolean
              : R extends ReadonlyArray<infer E> ? E
                  : R extends "map"
                      ? "properties" extends keyof A
                          ? {
                              [P in keyof A["properties"]]:
                              A["properties"][P] extends infer M
                                  ? M extends Attribute
                                      ? ItemAttribute<M>
                                      : never
                                  : never
                          }
                          : never
                      : R extends "list"
                          ? "items" extends keyof A
                              ? A["items"] extends infer I
                                  ? I extends Attribute
                                      ? Array<ItemAttribute<I>>
                                      : never
                                  : never
                              : never
                          : R extends "set"
                              ? "items" extends keyof A
                                  ? A["items"] extends infer I
                                      ? I extends "string" ? string[]
                                          : I extends "number" ? number[]
                                              : never
                                      : never
                                  : never
                              : R extends "any" ? any
                                  : never
      : never

type FormattedPutMapAttributes<A extends MapAttribute> = {
  [P in keyof A["properties"]]: A["properties"][P] extends infer M
    ? M extends HiddenAttribute
      ? false
      : M extends DefaultedAttribute
        ? false
        : M extends RequiredAttribute
          ? true
          : false
    : false
}

export type ReturnedAttribute<A extends Attribute> =
  A["type"] extends infer R
    ? R extends "string" ? string
    : R extends "number" ? number
        : R extends "boolean" ? boolean
            : R extends ReadonlyArray<infer E> ? E
                : R extends "map"
                    ? "properties" extends keyof A
                        ?
                        {
                          [
                            P in keyof A["properties"] as A["properties"][P] extends RequiredAttribute
                              ? P
                              : never
                          ]: A["properties"][P] extends infer M
                            ? M extends Attribute
                              ? ReturnedAttribute<M>
                              : never
                            : never
                        } & {
                          [
                            P in keyof A["properties"] as A["properties"][P] extends HiddenAttribute | RequiredAttribute
                              ? never
                              : P
                          ]?: A["properties"][P] extends infer M
                            ? M extends Attribute
                              ? ReturnedAttribute<M> | undefined
                              : never
                            : never
                        }
                        // SkipKeys<{
                        //     [P in keyof A["properties"]]: A["properties"][P] extends infer M
                        //         ? M extends Attribute
                        //           ? M extends HiddenAttribute
                        //             ? SkipValue
                        //             : M extends RequiredAttribute
                        //                 ? ReturnedAttribute<M>
                        //                 : SkipValue
                        //             : never
                        //           : never
                        // }> & SkipKeys<{
                        //   [P in keyof A["properties"]]?: A["properties"][P] extends infer M
                        //         ? M extends Attribute
                        //           ? M extends HiddenAttribute
                        //             ? SkipValue
                        //             : M extends RequiredAttribute
                        //                 ? SkipValue
                        //                 : ReturnedAttribute<M> | undefined
                        //             : never
                        //           : never
                        // }>
                        : never
                    : R extends "list"
                        ? "items" extends keyof A
                            ? A["items"] extends infer I
                                ? I extends Attribute
                                    ? ReturnedAttribute<I>[]
                                    : never
                                : never
                            : never
                        : R extends "set"
                            ? "items" extends keyof A
                                ? A["items"] extends infer I
                                    ? I extends "string" ? string[]
                                        : I extends "number" ? number[]
                                            : never
                                    : never
                                : never
                            : R extends "any" ? any
                                : never
    : never

export type CreatedAttribute<A extends Attribute> =
  A["type"] extends infer R
  ? R extends "string" ? string
      : R extends "number" ? number
          : R extends "boolean" ? boolean
              : R extends ReadonlyArray<infer E> ? E
                  : R extends "map"
                      ? "properties" extends keyof A
                        ? {
                          [
                            P in keyof A["properties"] as A["properties"][P] extends RequiredAttribute
                              ? A["properties"][P] extends DefaultedAttribute
                                ? never
                                : P
                              : never
                          ]: A["properties"][P] extends infer M
                            ? M extends Attribute
                              ? CreatedAttribute<M>
                              : never
                            : never
                        } & {
                          [P in keyof A["properties"] as A["properties"][P] extends HiddenAttribute
                            ? never
                            : P
                          ]?: A["properties"][P] extends infer M
                          ? M extends Attribute
                            ? CreatedAttribute<M> | undefined
                            : never
                          : never
                        }
                          // ? SkipKeys<{
                          //     [P in keyof A["properties"]]: A["properties"][P] extends infer M
                          //         ? M extends Attribute
                          //             ? M extends HiddenAttribute 
                          //               ? SkipValue
                          //               : M extends DefaultedAttribute
                          //                   ? SkipValue
                          //                   : M extends RequiredAttribute
                          //                       ? CreatedAttribute<M>
                          //                       : SkipValue
                          //             : never
                          //     : never
                          // }> & SkipKeys<{
                          //   [P in keyof A["properties"]]?: A["properties"][P] extends infer M
                          //     ? M extends Attribute
                          //       ? M extends HiddenAttribute
                          //         ? SkipValue
                          //         : CreatedAttribute<M> | undefined
                          //       : never
                          //     : never
                          // }>
                          : never
                      : R extends "list"
                          ? "items" extends keyof A
                              ? A["items"] extends infer I
                                  ? I extends Attribute
                                      ? CreatedAttribute<I>[]
                                      : never
                                  : never
                              : never
                          : R extends "set"
                              ? "items" extends keyof A
                                  ? A["items"] extends infer I
                                      ? I extends "string" ? string[]
                                          : I extends "number" ? number[]
                                              : never
                                      : never
                                  : never
                              : R extends "any" ? any
                                  : never
  : never

export type ReturnedItem<A extends string, F extends string, C extends string, S extends Schema<A,F,C>,Attr extends S["attributes"]> = {
  [a in keyof Attr]: ReturnedAttribute<Attr[a]>
}

export type CreatedItem<A extends string, F extends string, C extends string, S extends Schema<A,F,C>,Attr extends S["attributes"]> = {
  [a in keyof Attr]: CreatedAttribute<Attr[a]>
}

export type EditableItemAttribute<A extends Attribute> =
  A extends ReadOnlyAttribute
      ? never
      : A["type"] extends infer R
          ? R extends "string" ? string
          : R extends "number" ? number
              : R extends "boolean" ? boolean
                  : R extends ReadonlyArray<infer E> ? E
                      : R extends "map"
                          ? "properties" extends keyof A
                              ? {
                                  [
                                    P in keyof A["properties"] as A["properties"][P] extends ReadOnlyAttribute
                                      ? never
                                      : P
                                  ]:
                                  A["properties"][P] extends infer M
                                      ? M extends Attribute
                                          ? EditableItemAttribute<M>
                                          : never
                                      : never
                              }
                              : never
                          : R extends "list"
                              ? "items" extends keyof A
                                  ? A["items"] extends infer I
                                      ? I extends Attribute
                                          ? Array<EditableItemAttribute<I>>
                                          : never
                                      : never
                                  : never
                              : R extends "set"
                                  ? "items" extends keyof A
                                      ? A["items"] extends infer I
                                          ? I extends "string" ? string[]
                                              : I extends "number" ? number[]
                                                  : never
                                          : never
                                      : never
                                  : R extends "any" ? any
                                      : never
          : never    
          
export type UpdatableItemAttribute<A extends Attribute> =
  A extends ReadOnlyAttribute
      ? never
      : A["type"] extends infer R
          ? R extends "string" ? string
          : R extends "number" ? number
              : R extends "boolean" ? boolean
                  : R extends ReadonlyArray<infer E> ? E
                      : R extends "map"
                          ? "properties" extends keyof A
                              ? {
                                  [
                                    P in keyof A["properties"] as A["properties"][P] extends ReadOnlyAttribute
                                      ? never
                                      : A["properties"][P] extends RequiredAttribute
                                        ? P
                                        : never
                                  ]:
                                  A["properties"][P] extends infer M
                                      ? M extends Attribute
                                          ? UpdatableItemAttribute<M>
                                          : never
                                      : never
                              } & {
                                [
                                  P in keyof A["properties"] as A["properties"][P] extends ReadOnlyAttribute
                                    ? never
                                    : A["properties"][P] extends RequiredAttribute
                                      ? never
                                      : P
                                ]?:
                                A["properties"][P] extends infer M
                                    ? M extends Attribute
                                        ? UpdatableItemAttribute<M>
                                        : never
                                    : never
                              }
                              : never
                          : R extends "list"
                              ? "items" extends keyof A
                                  ? A["items"] extends infer I
                                      ? I extends Attribute
                                          ? Array<UpdatableItemAttribute<I>>
                                          : never
                                      : never
                                  : never
                              : R extends "set"
                                  ? "items" extends keyof A
                                      ? A["items"] extends infer I
                                          ? I extends "string" ? string[]
                                              : I extends "number" ? number[]
                                                  : never
                                          : never
                                      : never
                                  : R extends "any" ? any
                                      : never
          : never

export type RemovableItemAttribute<A extends Attribute> =
  A extends ReadOnlyAttribute | RequiredAttribute
      ? never
      : A["type"] extends infer R
      ? R extends "string" ? string
          : R extends "number" ? number
              : R extends "boolean" ? boolean
                  : R extends ReadonlyArray<infer E> ? E
                      : R extends "map"
                          ? "properties" extends keyof A
                              ? {
                                  [
                                    P in keyof A["properties"] as A["properties"][P] extends ReadOnlyAttribute | RequiredAttribute
                                      ? never
                                      : P
                                  ]?:
                                  A["properties"][P] extends infer M
                                      ? M extends Attribute
                                          ? UpdatableItemAttribute<M>
                                          : never
                                      : never
                              }
                              : never
                          : R extends "list"
                              ? "items" extends keyof A
                                  ? A["items"] extends infer I
                                      ? I extends Attribute
                                          ? Array<UpdatableItemAttribute<I>>
                                          : never
                                      : never
                                  : never
                              : R extends "set"
                                  ? "items" extends keyof A
                                      ? A["items"] extends infer I
                                          ? I extends "string" ? string[]
                                              : I extends "number" ? number[]
                                                  : never
                                          : never
                                      : never
                                  : R extends "any" ? any
                                      : never
      : never

export type Item<A extends string, F extends string, C extends string, S extends Schema<A,F,C>, Attr extends Attributes<A>> = {
  [a in keyof Attr]: ItemAttribute<Attr[a]>
}

export type ItemTypeDescription<A extends string, F extends string, C extends string, S extends Schema<A,F,C>> = {
  [a in keyof S["attributes"]]: S["attributes"][a]["type"] extends infer R
      ? R
      : never
}

export type RequiredAttributes<A extends string, F extends string, C extends string, S extends Schema<A,F,C>> = ExtractKeysOfValueType<{
  [a in keyof S["attributes"]]: S["attributes"][a] extends RequiredAttribute
      ? true
      : false
}, true>

export type HiddenAttributes<A extends string, F extends string, C extends string, S extends Schema<A,F,C>> = ExtractKeysOfValueType<{
  [a in keyof S["attributes"]]: S["attributes"][a] extends HiddenAttribute
      ? true
      : false
}, true>

export type ReadOnlyAttributes<A extends string, F extends string, C extends string, S extends Schema<A,F,C>> = ExtractKeysOfValueType<{
  [a in keyof S["attributes"]]: S["attributes"][a] extends ReadOnlyAttribute
      ? true
      : false
}, true>

type ExtractKeysOfValueType<T, K> = {
  [I in keyof T]: T[I] extends K ? I : never
}[keyof T];

export type TableIndexes<A extends string, F extends string, C extends string, S extends Schema<A,F,C>> = {
  [i in keyof S["indexes"]]: S["indexes"][i] extends SecondaryIndex
      ? "secondary"
      : "table"
};

export type TableIndexName<A extends string, F extends string, C extends string, S extends Schema<A,F,C>> = ExtractKeysOfValueType<TableIndexes<A,F,C,S>, "table">;

export type PKCompositeAttributes<A extends string, F extends string, C extends string, S extends Schema<A,F,C>> = {
  [i in keyof S["indexes"]]: S["indexes"][i]["pk"]["composite"] extends ReadonlyArray<infer Composite>
      ? Composite
      : never
}

export type SKCompositeAttributes<A extends string, F extends string, C extends string, S extends Schema<A,F,C>> = {
  [i in keyof S["indexes"]]: S["indexes"][i] extends IndexWithSortKey
      ? S["indexes"][i]["sk"]["composite"] extends ReadonlyArray<infer Composite>
          ? Composite
          : never
      : never;
}

export type TableIndexPKCompositeAttributes<A extends string, F extends string, C extends string, S extends Schema<A,F,C>> = Pick<PKCompositeAttributes<A,F,C,S>, TableIndexName<A,F,C,S>>;

export type TableIndexSKCompositeAttributes<A extends string, F extends string, C extends string, S extends Schema<A,F,C>> = Pick<SKCompositeAttributes<A,F,C,S>, TableIndexName<A,F,C,S>>;

export type IndexPKCompositeAttributes<A extends string, F extends string, C extends string, S extends Schema<A,F,C>, I extends keyof S["indexes"]> = Pick<PKCompositeAttributes<A,F,C,S>,I>;

export type IndexSKCompositeAttributes<A extends string, F extends string, C extends string, S extends Schema<A,F,C>, I extends keyof S["indexes"]> = Pick<SKCompositeAttributes<A,F,C,S>,I>;

export type TableIndexPKAttributes<A extends string, F extends string, C extends string, S extends Schema<A,F,C>> = 
  TableIndexName<A,F,C,S> extends keyof TableIndexPKCompositeAttributes<A,F,C,S>
  ? TableIndexPKCompositeAttributes<A,F,C,S>[TableIndexName<A,F,C,S>] extends keyof Item<A,F,C,S,S["attributes"]>
      ? Pick<Item<A,F,C,S,S["attributes"]>, TableIndexPKCompositeAttributes<A,F,C,S>[TableIndexName<A,F,C,S>]>
      : never
  : never

export type TableIndexSKAttributes<A extends string, F extends string, C extends string, S extends Schema<A,F,C>> = TableIndexSKCompositeAttributes<A,F,C,S>[TableIndexName<A,F,C,S>] extends keyof S["attributes"]
  ? Pick<Item<A,F,C,S,S["attributes"]>, TableIndexSKCompositeAttributes<A,F,C,S>[TableIndexName<A,F,C,S>]>
  : Item<A,F,C,S,S["attributes"]>;

export type IndexPKAttributes<A extends string, F extends string, C extends string, S extends Schema<A,F,C>, I extends keyof S["indexes"]> = 
  I extends keyof IndexPKCompositeAttributes<A,F,C,S,I>
      ? IndexPKCompositeAttributes<A,F,C,S,I>[I] extends keyof Item<A,F,C,S,S["attributes"]>
          ? Pick<Item<A,F,C,S,S["attributes"]>, IndexPKCompositeAttributes<A,F,C,S,I>[I]>
          : never
      : never;

export type IndexSKAttributes<A extends string, F extends string, C extends string, S extends Schema<A,F,C>, I extends keyof S["indexes"]> = IndexSKCompositeAttributes<A,F,C,S,I>[I] extends keyof S["attributes"]
  ? Pick<Item<A,F,C,S,S["attributes"]>, IndexSKCompositeAttributes<A,F,C,S,I>[I]>
  : Item<A,F,C,S,S["attributes"]>;

export type TableIndexCompositeAttributes<A extends string, F extends string, C extends string, S extends Schema<A,F,C>> = TableIndexPKAttributes<A,F,C,S> & Partial<TableIndexSKAttributes<A,F,C,S>>;

export type AllTableIndexCompositeAttributes<A extends string, F extends string, C extends string, S extends Schema<A,F,C>> = TableIndexPKAttributes<A,F,C,S> & TableIndexSKAttributes<A,F,C,S>;

export type IndexCompositeAttributes<A extends string, F extends string, C extends string, S extends Schema<A,F,C>, I extends keyof S["indexes"]> = IndexPKAttributes<A,F,C,S,I> & Partial<IndexSKAttributes<A,F,C,S,I>>;

export type TableItem<A extends string, F extends string, C extends string, S extends Schema<A,F,C>> =
  AllTableIndexCompositeAttributes<A,F,C,S> &
  Pick<ReturnedItem<A,F,C,S,S["attributes"]>, RequiredAttributes<A,F,C,S>> &
  Partial<Omit<ReturnedItem<A,F,C,S,S["attributes"]>, RequiredAttributes<A,F,C,S>>>

export type ResponseItem<A extends string, F extends string, C extends string, S extends Schema<A,F,C>> =
  Omit<TableItem<A,F,C,S>, HiddenAttributes<A,F,C,S>>

export type RequiredPutItems<A extends string, F extends string, C extends string, S extends Schema<A,F,C>> = {
  [Attribute in keyof S["attributes"]]:
    "default" extends keyof S["attributes"][Attribute]
        ? false
        : "required" extends keyof S["attributes"][Attribute]
            ? true extends S["attributes"][Attribute]["required"]
                ? true
                    : Attribute extends keyof TableIndexCompositeAttributes<A,F,C,S>
                        ? true
                        : false
            : Attribute extends keyof TableIndexCompositeAttributes<A,F,C,S>
                ? true
                : false
}

export type PutItem<A extends string, F extends string, C extends string, S extends Schema<A,F,C>> =
  Pick<CreatedItem<A,F,C,S,S["attributes"]>, ExtractKeysOfValueType<RequiredPutItems<A,F,C,S>,true>>
  & Partial<CreatedItem<A,F,C,S,S["attributes"]>>

export type UpdateData<A extends string, F extends string, C extends string, S extends Schema<A,F,C>> =
  Omit<{
      [Attr in keyof S["attributes"]]: EditableItemAttribute<S["attributes"][Attr]>
  }, keyof AllTableIndexCompositeAttributes<A,F,C,S> | ReadOnlyAttributes<A,F,C,S>>

export type SetItem<A extends string, F extends string, C extends string, S extends Schema<A,F,C>> =
  // UpdatableItemAttribute
  Omit<{
      [Attr in keyof S["attributes"]]?: UpdatableItemAttribute<S["attributes"][Attr]>
  }, keyof AllTableIndexCompositeAttributes<A,F,C,S> | ReadOnlyAttributes<A,F,C,S>>

// type RemoveItem<A extends string, F extends string, C extends string, S extends Schema<A,F,C>> =
//     Array<keyof SetItem<A,F,C,S>>
export type RemoveItem<A extends string, F extends string, C extends string, S extends Schema<A,F,C>> =
  Array< keyof Omit<{
      [Attr in keyof S["attributes"]]?: RemovableItemAttribute<S["attributes"][Attr]>
  }, keyof AllTableIndexCompositeAttributes<A,F,C,S> | ReadOnlyAttributes<A,F,C,S> | RequiredAttributes<A,F,C,S>>>

export type AppendItem<A extends string, F extends string, C extends string, S extends Schema<A,F,C>> = 
  {
    [
      P in keyof ItemTypeDescription<A,F,C,S> as ItemTypeDescription<A,F,C,S>[P] extends 'list' | 'any'
        ? P
        : never
    ]?: P extends keyof SetItem<A,F,C,S>
      ? SetItem<A,F,C,S>[P] | undefined
      : never
  }

export type AddItem<A extends string, F extends string, C extends string, S extends Schema<A,F,C>> =
  {
    [
      P in keyof ItemTypeDescription<A,F,C,S> as ItemTypeDescription<A,F,C,S>[P] extends "number" | "any" | "set"
        ? P
        : never
    ]?: P extends keyof SetItem<A,F,C,S>
      ? SetItem<A,F,C,S>[P] | undefined
      : never
  }

export type SubtractItem<A extends string, F extends string, C extends string, S extends Schema<A,F,C>> =
  {
      [
        P in keyof ItemTypeDescription<A,F,C,S> as ItemTypeDescription<A,F,C,S>[P] extends "number" | "any"
          ? P
          : never
      ]?: P extends keyof SetItem<A,F,C,S>
          ? SetItem<A,F,C,S>[P] | undefined
          : never
  }

export type DeleteItem<A extends string, F extends string, C extends string, S extends Schema<A,F,C>> =
  {
      [
        P in keyof ItemTypeDescription<A,F,C,S> as ItemTypeDescription<A,F,C,S>[P] extends "any" | "set"
          ? P
          : never
      ]?: P extends keyof SetItem<A,F,C,S>
          ? SetItem<A,F,C,S>[P] | undefined
          : never
  }
