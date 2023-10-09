import {
  client,
  dynamodb,
  initializeTable,
  table,
  tableDefinition,
} from "../common";
import { createLock } from "./Lock";

function print(value: any, label?: string) {
  const formatted = JSON.stringify(value, null, 4);
  console.log(
    ...[label, value instanceof Error ? value : formatted].filter(Boolean),
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const lock = createLock({ client, table, defaultTtl: 1000 });

async function main() {
  await initializeTable({
    definition: tableDefinition,
    dropOnExists: true,
    dynamodb,
  });
  // a long ttl to allow time to play with the keys
  const ttl = 10_000;
  const target1 = "test1";
  const target2 = "test2";
  const target3 = "test3";

  // should successfully aquire target1
  const key1a = await lock.aquire(target1, ttl);

  // should fail to aquire target1
  const key2a = await lock.aquire(target1, ttl);

  // should successfully aquire target2
  const key3a = await lock.aquire(target2, ttl);

  // should successfully aquire target3
  const key4a = await lock.aquire(target3, ttl);

  // key1a, key3a, and key4a should be available
  // key2a should be null
  print({ key1a, key2a, key3a, key4a });

  // allow a little time to pass
  await sleep(1000);

  // check the status of each key
  const check1 = await lock.check(target1);
  const check2 = await lock.check(target2);
  const check3 = await lock.check(target3);

  // all keys should still be available
  print({ check1, check2, check3 });

  // release key1a and key2a
  const release1 = await key1a?.release();
  const release2 = await key2a?.release();

  // key1a should be successfuly released (returns `true`)
  // key2a should be unsuccessful because it was never aquired
  print({ release1, release2 });

  // check the status of each key
  const remaining1a = key1a?.remaining();
  const remaining2a = key2a?.remaining();
  const remaining3a = key3a?.remaining();
  const remaining4a = key4a?.remaining();

  // remaining1a should be `0` because they were released
  // remaining3a will be undefeined because it was never aquired in the first place
  // remaining2a, remaining4a will be > `0` because it has not been released yet
  print({ remaining1a, remaining2a, remaining3a, remaining4a });

  // lets try aquire locks again with the same targets (pretend we are a new process)
  const key1b = await lock.aquire(target1, ttl);
  const key2b = await lock.aquire(target1, ttl);
  const key3b = await lock.aquire(target2, ttl);
  const key4b = await lock.aquire(target3, ttl);

  // key1b, should be available
  // key2b missed its chance to aquire target1 (losing to key1b)
  // key4b, key3b not should be available because it was never released by key4a and key3a
  print({ key1b, key2b, key3b, key4b });

  // lets wait out the full original ttl
  await sleep(ttl);

  // get remaining values for the _original_ keys
  const remaining1b = key1a?.remaining();
  const remaining2b = key2a?.remaining();
  const remaining3b = key3a?.remaining();
  const remaining4b = key4a?.remaining();

  // they all should be `0` because they should have expired by now
  print({ remaining1b, remaining2b, remaining3b, remaining4b });

  // officially release all keys except for key4a
  const released1 = await key1a?.release();
  const released2 = await key2a?.release();
  const released3 = await key3a?.release();

  // never officially release key4a so we can see what happens (commented out for easier comprehension)
  // const released4 = await key4a?.release();

  // none of these should have been "successful" because they were already released or expired
  print({ released1, released2, released3 });

  // try to aquire these locks again
  const key1c = await lock.aquire(target1, ttl);
  const key2c = await lock.aquire(target1, ttl);
  const key3c = await lock.aquire(target2, ttl);
  const key4c = await lock.aquire(target3, ttl);

  // key1c should not be available because it is still owned by key1b
  // key2c missed its chance to aquire target1 (losing to key1b)
  // key3c is available becaused it key3a expired it's usage, and key3b never aquired it
  // key4c is available because key4a expired it's usage, and key4b never aquired it
  print({ key1c, key2c, key3c, key4c });

  const released3b = await key3c?.release();
  const released4b = await key4c?.release();

  // released3b and release4b should be successfully released
  print({ released3b, released4b });

  const key3d = await lock.aquire(target2, ttl);
  const key4d = await lock.aquire(target3, ttl);

  // key3d and key4d should be available
  print({ key3d, key4d });
}

main().catch(console.error);
