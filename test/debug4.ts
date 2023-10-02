import { expect } from "chai";
import { v4 as uuid } from 'uuid';
import {Entity, EntityItem, QueryResponse} from '..';
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { ComparisonOperator } from "@aws-sdk/client-dynamodb";

const client = new DocumentClient({
  region: "us-east-1",
  endpoint: 'http://localhost:8000',
});

function print(value: any, label?: string) {
    const formatted = JSON.stringify(value, null, 4);
    console.log(...[
        label,
        value instanceof Error ? value : formatted,
    ].filter(Boolean));
}

const table = "electro";

const entity = new Entity(
  {
    model: {
      entity: "sortKeys",
      version: "1",
      service: "sortKeys"
    },
    attributes: {
      prop1: {
        type: "string",
      },
      prop2: {
        type: "string",
      },
      prop3: {
        type: "string",
      },
    },
    indexes: {
      records: {
        pk: {
          field: "pk",
          composite: []
        },
        sk: {
          field: "sk",
          composite: ["prop1", "prop2", "prop3"],
        }
      }
    }
  },
  { table, client }
);

type Item = EntityItem<typeof entity>;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function getEveryCharacterConcatinationCombination(chars: string[]) {
  if(!chars || chars.length === 0) return [];
  
  let result: string[] = [];
  
  // Create a function to form combinations of a specific length
  function combine(prefix: string, index: number, length: number) {
      if (length === 0) {
          result.push(prefix);
          return;
      }
      
      for(let i = index; i < chars.length; i++) {
          combine(prefix + chars[i], i, length - 1);
      }
  }
  
  // Generate all combinations for lengths from 1 to chars.length
  for(let len = 1; len <= chars.length; len++) {
      combine('', 0, len);
  }
  
  return result;
}

// const allValues = getEveryCharacterConcatinationCombination(characters);

function generateAllPossibleItems(
  properties: Array<keyof Item>,
  allValues: string[]
): Item[] {
  const result: Item[] = [];

  // A recursive function to form all possible Item combinations
  function generateItem(
      currentItem: Partial<Item>,
      propertyIndex: number
  ): void {
      if (propertyIndex === properties.length) {
          result.push(currentItem as Item);
          return;
      }

      for (const value of allValues) {
          const nextItem: Partial<Item> = {
              ...currentItem,
              [properties[propertyIndex]]: value,
          };
          generateItem(nextItem, propertyIndex + 1);
      }
  }

  generateItem({}, 0);

  return result;
}

function getAllPossiblePartialItems(item: Item) {
  const partialSortKeys: Partial<Item>[] = [];
  for (let i = 0; i < entity.schema.indexes.records.sk.composite.length; i++) {
    const previousPartialSortKeys = partialSortKeys[partialSortKeys.length - 1] ?? {};
    const field = entity.schema.indexes.records.sk.composite[i];
    const value = item[field];
    if (value !== undefined) {
      partialSortKeys.push({
        ...previousPartialSortKeys,
        [field]: value,
      });
    }
  }

  return partialSortKeys;
}

function expectItemsEqual(a: any[], b: any[]) {
  let i = 0;
  try {
    expect(a.length).to.equal(b.length);
    for (i = 0; i < a.length; i++) {
      const itemA = a[i];
      const itemB = b[i];
      expect(itemA).to.deep.equal(itemB);
    }
  } catch(err) {
    console.log('%o', { failedAt: i, a: a[i], b: b[i] });
    throw err;
  }
}

const properties: Array<keyof Item> = ['prop1', 'prop2', 'prop3'];
const characters = ['a', 'b', 'c'];

// const allValues = getEveryCharacterConcatinationCombination(characters);
// const allItems = generateAllPossibleItems(properties, allValues);
// const allPartialItems = allItems.flatMap(item => getAllPossiblePartialItems(item));

// const params: Params[] = entity.put(allItems).params();
// const allSortKeys = params
//   .flatMap(param => param.RequestItems.electro.map(item => item.PutRequest.Item.sk))
//   .sort((a, b) => a.localeCompare(b));

// const allSortKeysWithPartial = Array.from(new Set(allPartialItems.map((item): string => {
//   return entity.query.records({}).begins(item).params().ExpressionAttributeValues[':sk1'];
// }))).sort((a, z) => a.localeCompare(z));

async function loadAllPossibleValues(items: any[]) {
  const alreadyLoaded = await entity.get(items[0]).go();
  if (alreadyLoaded.data !== null) return;
  await entity.put(items).go();
  await sleep(5_000);
} 

const allSortKeysOrdered: Item[] = [];
async function init() {
  // await loadAllPossibleValues(allItems);
  const all = await entity.query.records({}).go({ 
    logger: (event) => {
      if (event.type === 'results') {
        allSortKeysOrdered.push(...event.results.Items.map((item: any) => item.sk));
      }
    } 
  });
};

type Params = {
  "RequestItems": {
      "electro": [
          {
              "PutRequest": {
                  "Item": {
                      "prop1": string;
                      "prop2": string;
                      "prop3": string;
                      "pk": string;
                      "sk": string;
                  }
              }
          }
      ]
  }
}

async function main() {
  const filter = {
    prop1: 'ab',
    // prop2: 'aaa',
    // prop3: 'a',
  }
  const params = entity.query.records({}).gt(filter).params()
  console.log('%o', params);
  const results = await entity.query.records({}).gt(filter).go();
  const gte = await entity.query.records({}).gte(filter).go();
  const first = results.data[0];
  console.log(`prop1: ${first.prop1}`);
  console.log(`prop2: ${first.prop2}`);
  console.log(`prop3: ${first.prop3}`);
  console.log(`gte.prop1: ${gte.data[0].prop1}`);
  console.log(`gte.prop2: ${gte.data[0].prop2}`);
  console.log(`gte.prop3: ${gte.data[0].prop3}`);
}

main().catch(console.error);

const params = entity.query.records({}).gt({
  prop1: '2023-01-01',
}).params();

const monthDurations: Record<string, number> = {
  ["01"]: 31,
  ["02"]: 28,
  ["03"]: 31,
  ["04"]: 30,
  ["05"]: 31,
  ["06"]: 30,
  ["07"]: 31,
  ["08"]: 31,
  ["09"]: 30,
  ["10"]: 31,
  ["11"]: 30,
  ["12"]: 31,
}

const months = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];

const years = ["2021", "2022", "2023", "2024", "2025"];

const colors = ["red", "yellow", "blue"];

const types = ["debit", "credit"];

const dates = years.flatMap(year => months.flatMap(month => {
  const days = monthDurations[month];
  return Array.from({ length: days }, (_, i) => `${year}-${month}-${String(i + 1).padStart(2, '0')}`);
}));

const items: Item[] = [];
for (const color of colors) {
  for (const type of types) {
    for (const date of dates) {
      items.push({
        prop1: color,
        prop2: type,
        prop3: date,
      });
    }
  }
}

// gte
// prop1: ab // 1807
// prop2: a
// prop3: a

// (no shift)
// prop1: abb // 2168
// prop2: a
// prop3: a

// (shift up)
// prop1: ac // 2890
// prop2: a
// prop3: a