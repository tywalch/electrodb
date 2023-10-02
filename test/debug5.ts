import { expect } from "chai";
import { v4 as uuid } from 'uuid';
import {Entity, EntityItem, QueryResponse} from '..';
import { DocumentClient } from "aws-sdk/clients/dynamodb";

const client = new DocumentClient({
  region: "us-east-1",
  endpoint: 'http://localhost:8000',
});

const table = "electro";

const entity = new Entity(
  {
    model: {
      entity: "cats",
      version: "1",
      service: "cats3"
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

function generateItems() {
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

  const subcats = ["subcat1", "subcat2", "subcat3"];

  const cats = ["cat1", "cat2", "cat3"];

  const dates = years.flatMap(year => months.flatMap(month => {
    const days = monthDurations[month];
    return Array.from({ length: days }, (_, i) => `${year}-${month}-${String(i + 1).padStart(2, '0')}`);
  }));

  const items: Item[] = [];
  for (const subcat of subcats) {
    for (const cat of cats) {
      for (const date of dates) {
        items.push({
          prop2: cat, 
          prop1: date,
          prop3: subcat,
        });
      }
    }
  }

  return items;
}

async function loadItem(items: any[]) {
  const alreadyLoaded = await entity.get(items[0]).go();
  if (alreadyLoaded.data !== null) return;
  await entity.put(items).go();
} 

async function getAllSortKeys() {
  const allSortKeys = await entity.query.records({}).go({ includeKeys: true, pages: 'all' });
  // @ts-ignore
  return allSortKeys.data.map(item => item.sk);
}

let sortKeys: string[] = [];

async function init() {
  const items = generateItems();
  await loadItem(items);
  sortKeys = await getAllSortKeys();
}

async function main() {
  // await init();
  // console.log(JSON.stringify(sortKeys, null, 2));
  // return;
  async function perform() {
    const filter: any = {
      prop1: '2024-07-01',
      prop2: 'cat2',
      // prop3: 'subcat2',
    }
    
    process.env.SHIFT = "up";
    const shiftUp = await entity.query.records({}).gt(filter).go();
    const shiftUpParams = entity.query.records({}).gt(filter).params()
    process.env.SHIFT = undefined;
    const noShift = await entity.query.records({}).gt(filter).go();
    const noShiftParams = entity.query.records({}).gt(filter).params()
    const selfShift = await entity.query.records({}).gt({
      prop1: filter.prop1 ? filter.prop1 + '!' : undefined,
      prop2: filter.prop2 ? filter.prop2 + '!' : undefined,
      prop3: filter.prop3 ? filter.prop3 + '!' : undefined,
    }).go();
    const selfShiftParams = entity.query.records({}).gt({
      prop1: filter.prop1 ? filter.prop1 + '!' : undefined,
      prop2: filter.prop2 ? filter.prop2 + '!' : undefined,
      prop3: filter.prop3 ? filter.prop3 + '!' : undefined,
    }).params()

    const gte = await entity.query.records({}).gte(filter).go();
    
    console.log('------------------------')
    console.log('filter:')
    console.log(` prop1: ${filter.prop1}`);
    console.log(` prop2: ${filter.prop2}`);
    console.log(` prop3: ${filter.prop3}`);
    console.log('------------------------')
    console.log('shiftUp:')
    console.log(` prop1: ${shiftUp.data[0].prop1}`);
    console.log(` prop2: ${shiftUp.data[0].prop2}`);
    console.log(` prop3: ${shiftUp.data[0].prop3}`);
    console.log('noShift:')
    console.log(` prop1: ${noShift.data[0].prop1}`);
    console.log(` prop2: ${noShift.data[0].prop2}`);
    console.log(` prop3: ${noShift.data[0].prop3}`);
    console.log('selfShiftShift:')
    console.log(` prop1: ${selfShift.data[0].prop1}`);
    console.log(` prop2: ${selfShift.data[0].prop2}`);
    console.log(` prop3: ${selfShift.data[0].prop3}`);
    console.log('gte')
    console.log(` prop1: ${gte.data[0].prop1}`);
    console.log(` prop2: ${gte.data[0].prop2}`);
    console.log(` prop3: ${gte.data[0].prop3}`);
    console.log('------------------------')
    // console.log('shiftUpParams %o', shiftUpParams);
    // console.log('selfShiftParams %o', selfShiftParams);
    // console.log('noShiftParams %o', noShiftParams);
    // console.log('------------------------')
  }

  console.log('')
  console.log('old')
  process.env.GTE_FILTER = "old";
  await perform();
  console.log('none')
  process.env.GTE_FILTER = "none";
  await perform();
  console.log('new')
  process.env.GTE_FILTER = undefined;
  await perform();
  console.log('')
}

/*
gt:
prop1: 2022-04-01
prop2: credit
prop3: blue
gte
prop1: 2022-03-01
prop2: credit
prop3: blue
*/

main().catch(console.error);