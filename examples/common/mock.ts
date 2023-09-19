/* istanbul ignore file */
import { faker } from "@faker-js/faker";

export function flipCoin() {
  return !!faker.number.int({ min: 0, max: 1 });
}

export function createItems<T>(count: number, factory: () => T): T[] {
  return new Array(20).fill({}).map(() => factory());
}

export function uniqueItems<T extends Record<string, any>>(
  arr: T[],
  ...uniqueIdentifers: Array<keyof T>
): T[];
export function uniqueItems<T>(arr: T[]): T[];
export function uniqueItems<T>(
  arr: T[],
  ...uniqueIdentifiers: Array<keyof T>
): T[] {
  const seen = new Set<any>();
  const results: T[] = [];
  for (const item of arr) {
    let id = uniqueIdentifiers.length ? item : "";

    if (item && typeof item === "object") {
      for (const identifier of uniqueIdentifiers) {
        if (identifier in item) {
          id += identifier.toString();
        }
      }
    }

    if (!seen.has(id)) {
      seen.add(id);
      results.push(item);
    }
  }

  return results;
}
