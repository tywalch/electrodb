import { expect } from "chai";
import { v4 as uuid } from 'uuid';
import {Entity, EntityItem} from '..';
import { DocumentClient } from "aws-sdk/clients/dynamodb";

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

function formatSortKey(item: Partial<Item>) {
  const params = entity.create({
    region: 'abc',
    color: '',
    date: '',
    group: '',
    id: '',
    ...item,  
  }).params();
  return params.Item?.sk;
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

  const keys = records.map(item => formatSortKey(item));

  await entity.put(records).go();

  const all = await entity.query.records({region}).go({});
  for (let i = 0; i < all.data.length; i++) {
    const item = all.data[i];
    const record = records[i];
    expect(item).to.deep.equal(record);
  }

  const begin = { 
    date: '2021-09-02', 
    color: 'red', 
    group: 'group2' 
  };

  const end = { 
    date: '2021-09-03',
    color: 'red', 
    group: 'group1'
  }

  const params = entity.query
    .records({region})
    .between(begin, end)
    .params();

  const response = await entity.query
    .records({region})
    .between(begin, end)
    .go({ raw: true });
  
    const data = (response.data as unknown as { Items: any[] });

  const first = data.Items[0];
  const last = data.Items[data.Items.length - 1];

  const beginKey = params.ExpressionAttributeValues[':sk1'];
  const endKey = params.ExpressionAttributeValues[':sk2'];
  
  let firstManualCheckKey: string | null = null;
  let lastManualCheckKey: string | null = null;
  for (const key of keys) {
    const cond = key >= beginKey && key <= endKey;
    if (cond) {
      if (firstManualCheckKey === null) {
        firstManualCheckKey = key;
      }
      lastManualCheckKey = key;
    }
  }
  
  console.log('firstKey >= beginKey', first.sk >= beginKey);
  console.log('lastKey <= endKey', last.sk <= endKey);

  console.log(JSON.stringify({
    params,
    items: data.Items,
    length: data.Items.length,
    first,
    last, 
    firstKey: first.sk,
    lastKey: last.sk,
    beginKey,
    endKey, 
    firstManualCheckKey,
    lastManualCheckKey,
  }, null, 4));
}

main().catch(print);



const first = {
  length: 10,
  first: {
    date: '2021-09-02',
    color: 'red',
    sk: '$test_1#date_2021-09-02#color_red#group_group2#id_15',
    __edb_e__: 'test',
    __edb_v__: '1',
    id: '15',
    pk: '$test#region_8d2e4c68-9750-484d-9455-33b124a0d453',
    region: '8d2e4c68-9750-484d-9455-33b124a0d453',
    group: 'group2'
  },
  last: {
    date: '2021-09-03',
    color: 'red',
    sk: '$test_1#date_2021-09-03#color_red#group_group10#id_24',
    __edb_e__: 'test',
    __edb_v__: '1',
    id: '24',
    pk: '$test#region_8d2e4c68-9750-484d-9455-33b124a0d453',
    region: '8d2e4c68-9750-484d-9455-33b124a0d453',
    group: 'group10'
  },
  firstKey: '$test_1#date_2021-09-02#color_red#group_group2#id_15',
  lastKey: '$test_1#date_2021-09-03#color_red#group_group10#id_24',
  beginKey: '$test_1#date_2021-09-02#color_red#group_group2',
  endKey: '$test_1#date_2021-09-03#color_red#group_group2',
  firstManualCheckKey: '$test_1#date_2021-09-02#color_red#group_group2#id_15',
  lastManualCheckKey: '$test_1#date_2021-09-03#color_red#group_group10#id_24'
}

const second = {
  length: 8,
  first: {
    date: '2021-09-02',
    color: 'red',
    sk: '$test_1#date_2021-09-02#color_red#group_group2#id_15',
    __edb_e__: 'test',
    __edb_v__: '1',
    id: '15',
    pk: '$test#region_595744d7-1a04-47aa-b12c-74397f3da122',
    region: '595744d7-1a04-47aa-b12c-74397f3da122',
    group: 'group2'
  },
  last: {
    date: '2021-09-03',
    color: 'green',
    sk: '$test_1#date_2021-09-03#color_green#group_group3#id_22',
    __edb_e__: 'test',
    __edb_v__: '1',
    id: '22',
    pk: '$test#region_595744d7-1a04-47aa-b12c-74397f3da122',
    region: '595744d7-1a04-47aa-b12c-74397f3da122',
    group: 'group3'
  },
  firstKey: '$test_1#date_2021-09-02#color_red#group_group2#id_15',
  lastKey: '$test_1#date_2021-09-03#color_green#group_group3#id_22',
  beginKey: '$test_1#date_2021-09-02#color_red#group_group2',
  endKey: '$test_1#date_2021-09-03#color_red#group_group2',
  firstManualCheckKey: '$test_1#date_2021-09-02#color_red#group_group2#id_15',
  lastManualCheckKey: '$test_1#date_2021-09-03#color_red#group_group10#id_24'
}