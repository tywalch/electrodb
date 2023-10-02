import { expect } from "chai";
process.env.AWS_NODEJS_CONNECTION_REUSE_ENABLED = "1";
import { Entity, EntityItem } from '..';
import { DocumentClient } from "aws-sdk/clients/dynamodb";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const client = new DocumentClient({
  region: "us-east-1",
  endpoint: 'http://localhost:8000',
});

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

async function loadAllPossibleValues(items: Item[]) {
  const alreadyLoaded = await entity.get(items[0]).go();
  if (alreadyLoaded.data !== null) return;
  await entity.put(items).go();
  await sleep(5_000);
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

const allValues = getEveryCharacterConcatinationCombination(characters);
const allItems = generateAllPossibleItems(properties, allValues);

const allValuesOrdered: Item[] = [];
before(async function () {
  this.timeout(30_000);
  await loadAllPossibleValues(allItems);
  const all = await entity.query.records({}).go({ pages: 'all' });
  for (const item of all.data) {
    allValuesOrdered.push(item);
  }
});

it('should have queried everything', () => {
  expect(allValuesOrdered.length).to.equal(allItems.length);
});

describe('sort key comparison operator operations', () => {
  it('should correctly return items based on the operator', async function() {
    this.timeout(1000 * 60 * 60 * 5);
    const beginning = Date.now();
    let start = 0;
    let end = allValuesOrdered.length - 1;
    const interval = setInterval(() => {
      const completed = start + (allValuesOrdered.length - 1 - end);
      const speed = (completed / ((Date.now() - beginning) / 1000)).toFixed(3);
      console.log(`${ (start / allValuesOrdered.length).toFixed(2) }% complete: start: ${start}, end: ${end} at ${speed} queries/sec`);
    }, 1000 * 30);
    try {
      while(start < end) {
        const firsts = getAllPossiblePartialItems(allValuesOrdered[start]);
        const lasts = getAllPossiblePartialItems(allValuesOrdered[end]);
        for (let i = 0; i < firsts.length; i++) {
          const first = firsts[i];
          const firstKeys = Object.keys(first) as Array<keyof typeof first>;
          const gte = await entity.query.records({}).gte(first).go({pages: 'all'});
          const gteParams = entity.query.records({}).gte(first).params();
          const gt = await entity.query.records({}).gt(first).go({pages: 'all'});
          const gtParams = entity.query.records({}).gt(first).params();
          
          for (let j = 0; j < lasts.length; j++) {
            const last = lasts[j];
            const lastKeys = Object.keys(last) as Array<keyof typeof last>;
            const lte = await entity.query.records({}).lte(last).go({pages: 'all'});
            const lteParams = entity.query.records({}).lte(last).params();
            const lt = await entity.query.records({}).lt(last).go({pages: 'all'});
            const ltParams = entity.query.records({}).lt(last).params();
            const between = await entity.query.records({}).between(first, last).go({pages: 'all'});
            const betweenParams = entity.query.records({}).between(first, last).params();
            
            let gteIndex: number | undefined;
            let gtIndex: number | undefined;
            let lteIndex: number | undefined;
            let ltIndex: number | undefined;
            for (let k = 0; k < allValuesOrdered.length; k++) {
              const record = allValuesOrdered[k];
              let matchesAllStart = firstKeys.every((key) => first[key] === record[key]);
              let matchesAllEnd = lastKeys.every((key) => last[key] === record[key]);
              if (gteIndex === undefined && matchesAllStart) {
                gteIndex = k;
              }
              if (gteIndex !== undefined && gtIndex === undefined && !matchesAllStart) {
                gtIndex = k;
              }
              
              if (matchesAllEnd) {
                lteIndex = k + 1;
              }

              if (lteIndex === undefined && !matchesAllEnd) {
                ltIndex = k + 1;
              }
            }

            const expectedGte = allValuesOrdered.slice(gteIndex ?? 0, allValuesOrdered.length);
            const expectedGt = allValuesOrdered.slice(gtIndex ?? 0, allValuesOrdered.length);
            const expectedLte = allValuesOrdered.slice(0, lteIndex);
            const expectedLt = allValuesOrdered.slice(0, ltIndex);
            const expectedBetween = allValuesOrdered.slice(gteIndex ?? 0, lteIndex);
            try {
              expectItemsEqual(gte.data, expectedGte);
            } catch(err) {
              console.log('%o', { 
                gteParams,
                received: {
                  first: gte.data[0],
                  last: gte.data[gte.data.length - 1],
                  count: gte.data.length,
                },
                expected: {
                  first: expectedGte[0],
                  last: expectedGte[expectedGte.length - 1],
                  count: expectedGte.length,
                },
                gte, expectedGte, first, last, gteIndex, type: 'gte' });
              throw err;
            }
            try {
              expectItemsEqual(lte.data, expectedLte);
            } catch(err) {
              console.log('%o', { 
                lteParams,
                received: {
                  first: lte.data[0],
                  last: lte.data[lte.data.length - 1],
                  count: lte.data.length,
                },
                expected: {
                  first: expectedLte[0],
                  last: expectedLte[expectedLte.length - 1],
                  count: expectedLte.length,
                },
                lte, expectedLte, first, last, lteIndex, type: 'lte' });
              throw err;
            }
            try {
              expectItemsEqual(lt.data, expectedLt);
            } catch(err) {
              console.log('%o', { 
                ltParams,
                received: {
                  first: lt.data[0],
                  last: lt.data[lt.data.length - 1],
                  count: lt.data.length,
                },
                expected: {
                  first: expectedLt[0],
                  last: expectedLt[expectedLt.length - 1],
                  count: expectedLt.length,
                },
                lt, expectedLt, first, last, ltIndex, type: 'lt' });
              throw err;
            }
            try {
              expectItemsEqual(between.data, expectedBetween);
            } catch(err) {
              console.log('%o', { 
                betweenParams,
                received: {
                  first: between.data[0],
                  last: between.data[between.data.length - 1],
                  count: between.data.length,
                },
                expected: {
                  first: expectedBetween[0],
                  last: expectedBetween[expectedBetween.length - 1],
                  count: expectedBetween.length,
                },
                between, expectedBetween, first, last, gteIndex, lteIndex, type: 'between' });
              throw err;
            }
            try {
              expectItemsEqual(gt.data, expectedGt);
            } catch(err) {
              console.log('%o', { 
                gtParams,
                received: {
                  first: gt.data[0],
                  last: gt.data[gt.data.length - 1],
                  count: gt.data.length,
                },
                expected: {
                  first: expectedGt[0],
                  last: expectedGt[expectedGt.length - 1],
                  count: expectedGt.length,
                },
                gt, expectedGt, first, last, gtIndex, type: 'gt' });
              throw err;
            }
          }
        }
        
        start++;
        end--;
      }
    } finally {
      clearInterval(interval);
      process.exit(0);
    }
  });

  // describe('gte', () => {
  //   it('should return all items including and after provided item', async () => {
  //     for (let i = 0; i < allItems.length; i++) {
  //       const record = allItems[i];
  //       const { data } = await entity.query.records({}).gte(record).go();
  //       const sliced = allItems.slice(i, allItems.length);
  //       expect(data).to.be.deep.equal(sliced);
  //     }
  //   });
  // })

  // describe('gt', () => {
  //   it('should return all items after provided item', async () => {
  //     for (let i = 0; i < allItems.length; i++) {
  //       const record = allItems[i];
  //       const { data } = await entity.query.records({}).gt(record).go();
  //       const sliced = allItems.slice(i + 1, allItems.length);
  //       expect(data).to.be.deep.equal(sliced);
  //     }
  //   });
  // })

  // describe('lte', () => {
  //   it('should return all items including and before provided item', async () => {
  //     for (let i = allItems.length - 1; i >= 0; i--) {
  //       const record = allItems[i];
  //       const { data } = await entity.query.records({}).lte(record).go();
  //       const sliced = allItems.slice(0, i + 1);
  //       expect(data).to.be.deep.equal(sliced);
  //     }
  //   });
  // })

  // describe('lt', () => {
  //   it('should return all items before provided item', async () => {
  //     for (let i = allItems.length - 1; i >= 0; i--) {
  //       const record = allItems[i];
  //       const { data } = await entity.query.records({}).lt(record).go();
  //       const sliced = allItems.slice(0, i);
  //       expect(data).to.be.deep.equal(sliced);
  //     }
  //   });
  // })

  // describe('between', () => {
  //   it('should return all items between provided items', async () => {

  //   });
  // })
});