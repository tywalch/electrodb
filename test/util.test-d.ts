import { Resolve } from "../index";
export type { Resolve } from "../index";

export const troubleshoot = <Params extends any[], Response>(
  fn: (...params: Params) => Response,
  response: Response,
) => {};

export const magnify = <T>(value: T): Resolve<T> => {
  return {} as Resolve<T>;
};

export const keys = <T>(value: T): keyof T => {
  return {} as keyof T;
};

export const get = <T>() => {
  return {} as Resolve<T>;
};