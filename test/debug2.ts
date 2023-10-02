import { expect } from "chai";
import { v4 as uuid } from 'uuid';
import {Entity, EntityItem} from '..';
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { format } from "path";

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
      entity: "test",
      version: "1",
      service: "test"
    },
    attributes: {
      id: {
        type: "string",
      },
      date: {
        type: "string",
      },
      color: {
        type: "string",
      },
      group: {
        type: "string",
      },
      region: {
        type: "string",
      },
    },
    indexes: {
      records: {
        pk: {
          field: "pk",
          composite: ["region"]
        },
        sk: {
          field: "sk",
          composite: ["date", "color", "group", "id"],
        }
      }
    }
  },
  { table, client }
);

type Item = EntityItem<typeof entity>;

function getPartialKeyCombinations(item: Item) {
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

async function main() {
  const region = uuid();
  const records = [
    {
      id: '00',
      date: '2021-09-01',
      color: 'green',
      group: 'group1',
      region
    },
    {
      region,
      id: '01',
      date: '2021-09-01',
      color: 'green',
      group: 'group1'
    },
    {
      region,
      id: '02',
      date: '2021-09-01',
      color: 'green',
      group: 'group2'
    },
    {
      region,
      id: '03',
      date: '2021-09-01',
      color: 'green',
      group: 'group3'
    },
    {
      region,
      id: '04',
      date: '2021-09-01',
      color: 'red',
      group: 'group1'
    },
    {
      region,
      id: '05',
      date: '2021-09-01',
      color: 'red',
      group: 'group10'
    },
    {
      region,
      id: '06',
      date: '2021-09-01',
      color: 'red',
      group: 'group2'
    },
    {
      region,
      id: '07',
      date: '2021-09-01',
      color: 'yellow',
      group: 'group2'
    },
    {
      region,
      id: '08',
      date: '2021-09-01',
      color: 'yellow',
      group: 'group3'
    },
    {
      region,
      id: '09',
      date: '2021-09-02',
      color: 'green',
      group: 'group1'
    },
    {
      region,
      id: '10',
      date: '2021-09-02',
      color: 'green',
      group: 'group1'
    },
    {
      region,
      id: '11',
      date: '2021-09-02',
      color: 'green',
      group: 'group2'
    },
    {
      region,
      id: '12',
      date: '2021-09-02',
      color: 'green',
      group: 'group3'
    },
    {
      region,
      id: '13',
      date: '2021-09-02',
      color: 'red',
      group: 'group1'
    },
    {
      region,
      id: '14',
      date: '2021-09-02',
      color: 'red',
      group: 'group10'
    },
    {
      region,
      id: '15',
      date: '2021-09-02',
      color: 'red',
      group: 'group2'
    },
    {
      region,
      id: '16',
      date: '2021-09-02',
      color: 'red',
      group: 'group3'
    },
    {
      region,
      id: '17',
      date: '2021-09-02',
      color: 'yellow',
      group: 'group2'
    },
    {
      region,
      id: '18',
      date: '2021-09-02',
      color: 'yellow',
      group: 'group3'
    },
    {
      region,
      id: '19',
      date: '2021-09-03',
      color: 'green',
      group: 'group1'
    },
    {
      region,
      id: '20',
      date: '2021-09-03',
      color: 'green',
      group: 'group10'
    },
    {
      region,
      id: '21',
      date: '2021-09-03',
      color: 'green',
      group: 'group2'
    },
    {
      region,
      id: '22',
      date: '2021-09-03',
      color: 'green',
      group: 'group3'
    },
    {
      region,
      id: '23',
      date: '2021-09-03',
      color: 'red',
      group: 'group1'
    },
    {
      region,
      id: '24',
      date: '2021-09-03',
      color: 'red',
      group: 'group10'
    },
    {
      region,
      id: '25',
      date: '2021-09-03',
      color: 'red',
      group: 'group2'
    },
    {
      region,
      id: '26',
      date: '2021-09-03',
      color: 'red',
      group: 'group3'
    },
    {
      region,
      id: '27',
      date: '2021-09-03',
      color: 'yellow',
      group: 'group2'
    },
    {
      region,
      id: '28',
      date: '2021-09-03',
      color: 'yellow',
      group: 'group3'
    },
    {
      region,
      id: '29',
      date: '2021-09-04',
      color: 'green',
      group: 'group1'
    },
    {
      region,
      id: '30',
      date: '2021-09-04',
      color: 'green',
      group: 'group1'
    },
    {
      region,
      id: '31',
      date: '2021-09-04',
      color: 'green',
      group: 'group2'
    },
    {
      region,
      id: '32',
      date: '2021-09-04',
      color: 'green',
      group: 'group3'
    },
    {
      region,
      id: '33',
      date: '2021-09-04',
      color: 'red',
      group: 'group1'
    },
    {
      region,
      id: '34',
      date: '2021-09-04',
      color: 'red',
      group: 'group10'
    },
    {
      region,
      id: '35',
      date: '2021-09-04',
      color: 'red',
      group: 'group2'
    },
    {
      region,
      id: '36',
      date: '2021-09-04',
      color: 'red',
      group: 'group3'
    },
  ];


  await entity.put(records).go();

  // gte
  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const { region } = record;
    const { data } = await entity.query.records({region}).gte(record).go();
    const sliced = records.slice(i, records.length);
    try {
      expect(data).to.be.deep.equal(sliced);
    } catch(err) {
      console.log({ data, sliced, i, record, type: 'gte' });
      throw err;
    }
  }

  // gt
  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const { region } = record;
    const { data } = await entity.query.records({region}).gt(record).go();
    const sliced = records.slice(i + 1, records.length);
    try {
    expect(data).to.be.deep.equal(sliced);
    } catch(err) {
      console.log({ data, sliced, i, record, type: 'gt' });
      throw err;
    }
    // if (i === records.length - 1) {
    //   expect(data).to.have.length(0);
    //   continue;
    // }
    // for (let j = 0; j < data.length; j++) {
    //   const item = data[j];
    //   const expected = sliced[j];
    //   try {
    //     expect(item).to.deep.equal(expected);
    //   } catch(err) {
    //     console.log('%o', { item, expected, data, i, j, type: 'gt' });
    //     throw err;
    //   }
    // }
  }

  // lte
  for (let i = records.length - 1; i >= 0; i--) {
    const record = records[i];
    const { region } = record;
    const { data } = await entity.query.records({region}).lte(record).go();
    const sliced = records.slice(0, i + 1);
    try {
      expect(data).to.be.deep.equal(sliced);
    } catch(err) {
      console.log({ data, sliced, i, record, type: 'lte' });
      throw err;
    }
    // for (let j = 0; j < data.length; j++) {
    //   expect(j <= i).to.be.true;
    //   const item = data[j];
    //   const expected = sliced[j];
    //   try {
    //     expect(item).to.deep.equal(expected);
    //   } catch(err) {
    //     console.log('%o', { item, expected, data, i, j, type: 'lte', index: i - j });
    //     throw err;
    //   }
    // }
  }

  // lt
  for (let i = records.length - 1; i >= 0; i--) {
    const record = records[i];
    const { region } = record;
    const { data } = await entity.query.records({region}).lt(record).go();
    const sliced = records.slice(0, i);
    try {
      expect(data).to.be.deep.equal(sliced);
    } catch(err) {
      console.log({ data, sliced, i, record, type: 'lt' });
      throw err;
    }
    // if (i === 0) {
    //   expect(data).to.have.length(0);
    //   continue;
    // }
    // for (let j = 0; j < data.length; j++) {
    //   expect(j < i).to.be.true;
    //   const item = data[j];
    //   const expected = records[j];
    //   try {
    //     expect(item).to.deep.equal(expected);
    //   } catch(err) {
    //     console.log('%o', { item, expected, data, i, j, type: 'lt' });
    //     throw err;
    //   }
    // }
  }
  // between
  let start = 0;
  let end = records.length - 1;
  while(start < end) {
    const first = records[start];
    const last = records[end];
    const { region } = first;
    const params = entity.query.records({region}).between(first, last).params();
    const { data } = await entity.query.records({region}).between(first, last).go();
    const sliced = records.slice(start, end + 1);
    try {
      expect(data).to.be.deep.equal(sliced);
    } catch(err) {
      console.log('%o', { records, data, sliced, start, end, type: 'between', params, first, last });
      throw err;
    }
    // for (let i = 0; i <= data.length; i++) {
    //   const item = data[i];
    //   const expected = between[i];
    //   try {
    //     expect(item).to.deep.equal(expected);
    //   } catch(err) {
    //     console.log('%o', { item, expected, data, i, start, end, type: 'between', params, between, first, last });
    //     throw err;
    //   }
    // }

    start++;
    end--;
  }

  // between
  let b_start = 0;
  let b_end = records.length - 1;
  while(b_start < b_end) {
    const { region } = records[b_start];
    const firsts = getPartialKeyCombinations(records[b_start]);
    const lasts = getPartialKeyCombinations(records[b_end]);
    for (let i = 0; i < firsts.length; i++) {
      const first = firsts[i];
      const firstKeys = Object.keys(first) as Array<keyof typeof first>;
      const gte = await entity.query.records({region}).gte(first).go();
      const gt = await entity.query.records({region}).gt(first).go({
        logger: (event) => {
          if (event.type === "results") {
            console.log('gt length', event.results.Items.length);
          }
        }
      });
      const gtParams = entity.query.records({region}).gt(first).params();
      
      for (let j = 0; j < lasts.length; j++) {
        const last = lasts[j];
        const lastKeys = Object.keys(last) as Array<keyof typeof last>;
        const lte = await entity.query.records({region}).lte(last).go();
        const lt = await entity.query.records({region}).lt(last).go();
        const between = await entity.query.records({region}).between(first, last).go();
        
        let gteIndex: number | undefined;
        let gtIndex: number | undefined;
        let lteIndex: number | undefined;
        let ltIndex: number | undefined;
        for (let k = 0; k < records.length; k++) {
          const record = records[k];
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

        const expectedGte = records.slice(gteIndex ?? 0, records.length);
        const expectedGt = records.slice(gtIndex ?? 0, records.length);
        const expectedLte = records.slice(0, lteIndex);
        const expectedLt = records.slice(0, ltIndex);
        const expectedBetween = records.slice(gteIndex ?? 0, lteIndex);
        try {
        expect(gte.data).to.be.deep.equal(expectedGte);
        } catch(err) {
          console.log('%o', { gte, expectedGte, first, last, gteIndex, type: 'gte' });
          throw err;
        }
        try {
          expect(lte.data).to.be.deep.equal(expectedLte);
        } catch(err) {
          console.log('%o', { lte, expectedLte, first, last, lteIndex, type: 'lte' });
          throw err;
        }
        try {
          expect(lt.data).to.be.deep.equal(expectedLt);
        } catch(err) {
          console.log('%o', { lt, expectedLt, first, last, ltIndex, type: 'lt' });
          throw err;
        }
        try {
          expect(between.data).to.be.deep.equal(expectedBetween);
        } catch(err) {
          console.log('%o', { between, expectedBetween, first, last, gteIndex, lteIndex, type: 'between' });
          throw err;
        }
        try {
          expect(gt.data).to.be.deep.equal(expectedGt);
        } catch(err) {
          console.log('%o', { gt, expectedGt, first, last, gtIndex, gtParams, type: 'gt' });
          throw err;
        }
      }
    }
    
    b_start++;
    b_end--;
  }

  // lte
  // for (let i = 0; i < records.length; i++) {
  //   const record = records[i];
  //   const { region } = record;
  //   const partialSortKeys = getPartialKeyCombinations(record);
    
  //   for (let i = 0; i < partialSortKeys.length; i++) {
  //     const partialSortKey = partialSortKeys[i];
  //     const expected = filterItemsBySortKeyCombinations('lte', records, partialSortKey);
  //     const { data } = await entity.query.records({region}).gte(partialSortKey).go();
  //     try {
  //       expect(data).to.be.deep.equal(expected);
  //     } catch(err) {
  //       console.log('%o', { data, expected, partialSortKey, i, type: 'gte' });
  //       throw err;
  //     }
  //   }
  // }
}

main().catch(print);
