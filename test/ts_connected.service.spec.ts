process.env.AWS_NODEJS_CONNECTION_REUSE_ENABLED = "1";
import { Entity, Service } from "../";
import { expect } from "chai";
import DynamoDB from "aws-sdk/clients/dynamodb";
import { v4 as uuid } from "uuid";

const client = new DynamoDB.DocumentClient({
  region: "us-east-1",
  endpoint: process.env.LOCAL_DYNAMO_ENDPOINT,
});

type DocClient = typeof client;

const table = "electro";

const serviceName = uuid();

export function getPaddingEntities(options: {
  client?: DocClient;
  serviceName: string;
  table: string;
}) {
  const { client, serviceName, table } = options;
  const baseEntity = new Entity(
    {
      model: {
        service: serviceName,
        entity: "baseentity",
        version: "1",
      },
      attributes: {
        padded: {
          type: "string",
          padding: {
            char: "0",
            length: 5,
          },
        },
        padded2: {
          type: "string",
          padding: {
            char: "#",
            length: 10,
          },
        },
        notPadded: {
          type: "string",
        },
      },
      indexes: {
        pkOnly: {
          collection: "sharedPKOnly",
          pk: {
            field: "pk",
            composite: ["padded"],
          },
          sk: {
            field: "sk",
            composite: ["notPadded"],
          },
        },
        skOnly: {
          index: "gsi1",
          collection: "sharedSKOnly",
          pk: {
            field: "gsi1pk",
            composite: ["notPadded"],
          },
          sk: {
            field: "gsi1sk",
            composite: ["padded"],
          },
        },
        both: {
          index: "gsi2",
          collection: "sharedBoth",
          pk: {
            field: "gsi2pk",
            composite: ["padded"],
          },
          sk: {
            field: "gsi2sk",
            composite: ["padded2"],
          },
        },
      },
    },
    { table, client },
  );

  const baseEntity2 = new Entity(
    {
      model: {
        service: serviceName,
        entity: "baseentity2",
        version: "1",
      },
      attributes: {
        padded: {
          type: "string",
          padding: {
            char: "0",
            length: 5,
          },
        },
        padded2: {
          type: "string",
          padding: {
            char: "#",
            length: 10,
          },
        },
        notPadded: {
          type: "string",
        },
      },
      indexes: {
        pkOnly: {
          collection: "sharedPKOnly",
          pk: {
            field: "pk",
            composite: ["padded"],
          },
          sk: {
            field: "sk",
            composite: ["notPadded"],
          },
        },
        skOnly: {
          index: "gsi1",
          collection: "sharedSKOnly",
          pk: {
            field: "gsi1pk",
            composite: ["notPadded"],
          },
          sk: {
            field: "gsi1sk",
            composite: ["padded"],
          },
        },
        both: {
          index: "gsi2",
          collection: "sharedBoth",
          pk: {
            field: "gsi2pk",
            composite: ["padded"],
          },
          sk: {
            field: "gsi2sk",
            composite: ["padded2"],
          },
        },
      },
    },
    { table, client },
  );

  const actuallyHasPadding = new Entity(
    {
      model: {
        service: serviceName,
        entity: "actuallyHasPadding",
        version: "1",
      },
      attributes: {
        padded: {
          type: "string",
          padding: {
            char: "0",
            length: 5,
          },
        },
        padded2: {
          type: "string",
          padding: {
            char: "#",
            length: 10,
          },
        },
        notPadded: {
          type: "string",
          padding: {
            char: "0",
            length: 5,
          },
        },
      },
      indexes: {
        pkOnly: {
          collection: "sharedPKOnly",
          pk: {
            field: "pk",
            composite: ["padded"],
          },
          sk: {
            field: "sk",
            composite: ["notPadded"],
          },
        },
        skOnly: {
          index: "gsi1",
          collection: "sharedSKOnly",
          pk: {
            field: "gsi1pk",
            composite: ["notPadded"],
          },
          sk: {
            field: "gsi1sk",
            composite: ["padded"],
          },
        },
        both: {
          index: "gsi2",
          collection: "sharedBoth",
          pk: {
            field: "gsi2pk",
            composite: ["padded"],
          },
          sk: {
            field: "gsi2sk",
            composite: ["padded2"],
          },
        },
      },
    },
    { table, client },
  );

  const incorrectPk = new Entity(
    {
      model: {
        service: serviceName,
        entity: "incorrectpk",
        version: "1",
      },
      attributes: {
        padded: {
          type: "string",
          padding: {
            char: "z",
            length: 5,
          },
        },
        padded2: {
          type: "string",
          padding: {
            char: "#",
            length: 10,
          },
        },
        notPadded: {
          type: "string",
        },
      },
      indexes: {
        pkOnly: {
          collection: "sharedPKOnly",
          pk: {
            field: "pk",
            composite: ["padded"],
          },
          sk: {
            field: "sk",
            composite: ["notPadded"],
          },
        },
      },
    },
    { table, client },
  );

  const incorrectSk = new Entity(
    {
      model: {
        service: serviceName,
        entity: "incorrectsk",
        version: "1",
      },
      attributes: {
        padded: {
          type: "string",
          padding: {
            char: "0",
            length: 5,
          },
        },
        padded2: {
          type: "string",
          padding: {
            char: "z",
            length: 10,
          },
        },
        notPadded: {
          type: "string",
        },
      },
      indexes: {
        pkOnly: {
          collection: "sharedPKOnly",
          pk: {
            field: "pk",
            composite: ["padded"],
          },
          sk: {
            field: "sk",
            composite: ["notPadded"],
          },
        },
        both: {
          index: "gsi2",
          collection: "sharedBoth",
          pk: {
            field: "gsi2pk",
            composite: ["padded"],
          },
          sk: {
            field: "gsi2sk",
            composite: ["padded2"],
          },
        },
      },
    },
    { table, client },
  );
  const incorrectNonCollection = new Entity(
    {
      model: {
        service: serviceName,
        entity: "incorrectNonCollection",
        version: "1",
      },
      attributes: {
        padded: {
          type: "string",
          padding: {
            char: "z",
            length: 5,
          },
        },
        padded2: {
          type: "string",
          padding: {
            char: "z",
            length: 10,
          },
        },
        notPadded: {
          type: "string",
        },
      },
      indexes: {
        pkOnly: {
          collection: "sharedPKOnly2",
          pk: {
            field: "pk",
            composite: ["padded"],
          },
          sk: {
            field: "sk",
            composite: ["notPadded"],
          },
        },
        skOnly: {
          index: "gsi1pk-gsi1sk",
          collection: "sharedSKOnly2",
          pk: {
            field: "gsi1pk",
            composite: ["notPadded"],
          },
          sk: {
            field: "gsi1sk",
            composite: ["padded"],
          },
        },
        both: {
          index: "gsi2",
          pk: {
            field: "gsi2pk",
            composite: ["padded2"],
          },
          sk: {
            field: "gsi2sk",
            composite: ["padded"],
          },
        },
      },
    },
    { table, client },
  );

  return {
    baseEntity,
    baseEntity2,
    incorrectPk,
    incorrectSk,
    actuallyHasPadding,
    incorrectNonCollection,
  };
}

describe("padding validations", () => {
  // const serviceName = 'paddingTest';
  const {
    baseEntity,
    baseEntity2,
    incorrectPk,
    incorrectSk,
    actuallyHasPadding,
    incorrectNonCollection,
  } = getPaddingEntities({
    serviceName,
    table,
  });

  it("should not throw when attributes used in a shared collection pk are defined with the same padding configurations", () => {
    expect(() => {
      new Service({
        baseEntity,
        baseEntity2,
      });
    }).to.not.throw();
  });

  it("should throw when attributes used in a shared collection pk are defined with differing padding configurations", () => {
    expect(() => {
      new Service({
        baseEntity,
        incorrectPk,
      });
    }).to.throw(
      'Inconsistent attribute(s) on the entity "incorrectPk". The following attribute(s) are defined with incompatible or conflicting definitions across participating entities: The attribute "padded" contains inconsistent padding definitions that impact how keys are formed. These attribute definitions must match among all members of the collection. - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#join',
    );
  });

  it("should throw when attributes used in a shared collection pk are defined with missing padding configurations", () => {
    expect(() => {
      new Service({
        baseEntity,
        actuallyHasPadding,
      });
    }).to.throw(
      'Inconsistent attribute(s) on the entity "actuallyHasPadding". The following attribute(s) are defined with incompatible or conflicting definitions across participating entities: The attribute "notPadded" contains inconsistent padding definitions that impact how keys are formed. These attribute definitions must match among all members of the collection. - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#join',
    );
  });

  it("should not throw when attributes used in a shared collection sk are defined with differing padding configurations", () => {
    expect(() => {
      new Service({
        baseEntity,
        incorrectSk,
      });
    }).not.to.throw();
  });

  it("should not throw when pk attributes of the same name and index are defined with differing padding configurations but do not belong to the same collections", () => {
    expect(() => {
      new Service({
        baseEntity,
        incorrectNonCollection,
      });
    }).not.to.throw();
  });
});

const createClusteredEntity = (serviceName: string, entityName: string) => {
  return new Entity(
    {
      model: {
        service: serviceName,
        entity: entityName,
        version: "1",
      },
      attributes: {
        prop1: {
          type: "string",
        },
        prop2: {
          type: "number",
          padding: {
            char: "0",
            length: 2,
          },
        },
        prop3: {
          type: "string",
        },
        prop4: {
          type: "string",
        },
        prop5: {
          type: "number",
          padding: {
            char: "0",
            length: 2,
          },
        },
        prop6: {
          type: "string",
        },
        prop7: {
          type: "string",
        },
      },
      indexes: {
        primary: {
          collection: "primaryCollection",
          type: "clustered",
          pk: {
            field: "pk",
            composite: ["prop1"],
          },
          sk: {
            field: "sk",
            composite: ["prop2", "prop3"],
          },
        },
        secondary: {
          index: "gsi1pk-gsi1sk-index",
          type: "clustered",
          collection: "secondaryCollection",
          pk: {
            field: "gsi1pk",
            composite: ["prop4"],
          },
          sk: {
            field: "gsi1sk",
            composite: ["prop5", "prop6"],
          },
        },
      },
    },
    { table, client },
  );
};

const createIsolatedEntity = (serviceName: string, entityName: string) => {
  return new Entity(
    {
      model: {
        service: serviceName,
        entity: entityName,
        version: "1",
      },
      attributes: {
        prop1: {
          type: "string",
        },
        prop2: {
          type: "number",
          padding: {
            char: "0",
            length: 2,
          },
        },
        prop3: {
          type: "string",
        },
        prop4: {
          type: "string",
        },
        prop5: {
          type: "number",
          padding: {
            char: "0",
            length: 2,
          },
        },
        prop6: {
          type: "string",
        },
        prop7: {
          type: "string",
        },
      },
      indexes: {
        primary: {
          collection: "primaryCollection",
          type: "isolated",
          pk: {
            field: "pk",
            composite: ["prop1"],
          },
          sk: {
            field: "sk",
            composite: ["prop2", "prop3"],
          },
        },
        secondary: {
          index: "gsi1pk-gsi1sk-index",
          type: "isolated",
          collection: "secondaryCollection",
          pk: {
            field: "gsi1pk",
            composite: ["prop4"],
          },
          sk: {
            field: "gsi1sk",
            composite: ["prop5", "prop6"],
          },
        },
      },
    },
    { table, client },
  );
};

const createClusteredSingleSKEntity = (
  serviceName: string,
  entityName: string,
) => {
  return new Entity(
    {
      model: {
        service: serviceName,
        entity: entityName,
        version: "1",
      },
      attributes: {
        prop1: {
          type: "string",
        },
        prop2: {
          type: "number",
          padding: {
            char: "0",
            length: 2,
          },
        },
        prop3: {
          type: "string",
        },
        prop4: {
          type: "string",
        },
        prop5: {
          type: "number",
          padding: {
            char: "0",
            length: 2,
          },
        },
        prop6: {
          type: "string",
        },
        prop7: {
          type: "string",
        },
      },
      indexes: {
        primary: {
          collection: "primaryCollection",
          type: "clustered",
          pk: {
            field: "pk",
            composite: ["prop1"],
          },
          sk: {
            field: "sk",
            composite: ["prop2"],
          },
        },
        secondary: {
          index: "gsi1pk-gsi1sk-index",
          type: "clustered",
          collection: "secondaryCollection",
          pk: {
            field: "gsi1pk",
            composite: ["prop4"],
          },
          sk: {
            field: "gsi1sk",
            composite: ["prop5"],
          },
        },
      },
    },
    { table, client },
  );
};

const createIsolatedSingleSKEntity = (
  serviceName: string,
  entityName: string,
) => {
  return new Entity(
    {
      model: {
        service: serviceName,
        entity: entityName,
        version: "1",
      },
      attributes: {
        prop1: {
          type: "string",
        },
        prop2: {
          type: "number",
          padding: {
            char: "0",
            length: 2,
          },
        },
        prop3: {
          type: "string",
        },
        prop4: {
          type: "string",
        },
        prop5: {
          type: "number",
          padding: {
            char: "0",
            length: 2,
          },
        },
        prop6: {
          type: "string",
        },
        prop7: {
          type: "string",
        },
      },
      indexes: {
        primary: {
          collection: "primaryCollection",
          type: "isolated",
          pk: {
            field: "pk",
            composite: ["prop1"],
          },
          sk: {
            field: "sk",
            composite: ["prop2"],
          },
        },
        secondary: {
          index: "gsi1pk-gsi1sk-index",
          type: "isolated",
          collection: "secondaryCollection",
          pk: {
            field: "gsi1pk",
            composite: ["prop4"],
          },
          sk: {
            field: "gsi1sk",
            composite: ["prop5"],
          },
        },
      },
    },
    { table, client },
  );
};

type IndexTypeTestItem = {
  prop1: string;
  prop2: number;
  prop3: string;
  prop4: string;
  prop5: number;
  prop6: string;
  prop7: string;
};

type IndexTypeTestItemCompositeKey = Partial<
  Pick<IndexTypeTestItem, "prop1" | "prop2" | "prop3">
>;

const createItem = (
  primaryIndexPk: string,
  secondaryIndexPk: string,
  index: number,
) => {
  return {
    prop1: primaryIndexPk,
    prop2: index,
    prop3: uuid(),
    prop4: secondaryIndexPk,
    prop5: index,
    prop6: uuid(),
    prop7: uuid(),
  };
};

type CreateServiceOptions = {
  serviceName: string;
  entity1Name?: string;
  entity2Name?: string;
};

const createClusteredService = (options: CreateServiceOptions) => {
  const { entity1Name, entity2Name, serviceName } = options;
  const entity1 = createClusteredEntity(serviceName, entity1Name ?? uuid());
  const entity2 = createClusteredEntity(serviceName, entity2Name ?? uuid());
  return new Service({
    entity1,
    entity2,
  });
};

const createIsolatedService = (options: CreateServiceOptions) => {
  const { entity1Name, entity2Name, serviceName } = options;
  const entity1 = createIsolatedEntity(serviceName, entity1Name ?? uuid());
  const entity2 = createIsolatedEntity(serviceName, entity2Name ?? uuid());
  return new Service({
    entity1,
    entity2,
  });
};

const createClusteredSingleSKService = (options: CreateServiceOptions) => {
  const { entity1Name, entity2Name, serviceName } = options;
  const entity1 = createClusteredSingleSKEntity(
    serviceName,
    entity1Name ?? uuid(),
  );
  const entity2 = createClusteredSingleSKEntity(
    serviceName,
    entity2Name ?? uuid(),
  );
  return new Service({
    entity1,
    entity2,
  });
};

const createIsolatedSingleSKService = (options: CreateServiceOptions) => {
  const { entity1Name, entity2Name, serviceName } = options;
  const entity1 = createIsolatedSingleSKEntity(
    serviceName,
    entity1Name ?? uuid(),
  );
  const entity2 = createIsolatedSingleSKEntity(
    serviceName,
    entity2Name ?? uuid(),
  );
  return new Service({
    entity1,
    entity2,
  });
};

const createCompositeKey = (item: IndexTypeTestItemCompositeKey) => {
  return item.prop1 ?? "" + item.prop2 ?? "" + item.prop3 ?? "";
};

const print = (val: any) => console.log(JSON.stringify(val, null, 4));

async function initIndexTests() {
  // const serviceName = uuid();
  const entity1Name = "entity1";
  const entity2Name = "entity2";
  const clusteredService = createClusteredService({
    serviceName,
    entity1Name: `clustered+${entity1Name}`,
    entity2Name: `clustered+${entity2Name}`,
  });
  const isolatedService = createIsolatedService({
    serviceName,
    entity1Name: `isolated+${entity1Name}`,
    entity2Name: `isolated+${entity2Name}`,
  });
  const clusteredPrimaryPkKey = `cluz|${uuid()}`;
  const clusteredSecondaryPkKey = `cluz|${uuid()}`;
  const isolatedPrimaryPkKey = `iso|${uuid()}`;
  const isolatedSecondaryPkKey = `iso|${uuid()}`;
  const clusteredEntity1Items: IndexTypeTestItem[] = [];
  const clusteredEntity2Items: IndexTypeTestItem[] = [];
  const isolatedEntity1Items: IndexTypeTestItem[] = [];
  const isolatedEntity2Items: IndexTypeTestItem[] = [];

  for (let i = 0; i < 10; i++) {
    clusteredEntity1Items.push(
      createItem(clusteredPrimaryPkKey, clusteredSecondaryPkKey, i),
    );
    clusteredEntity2Items.push(
      createItem(clusteredPrimaryPkKey, clusteredSecondaryPkKey, i),
    );
    isolatedEntity1Items.push(
      createItem(isolatedPrimaryPkKey, isolatedSecondaryPkKey, i),
    );
    isolatedEntity2Items.push(
      createItem(isolatedPrimaryPkKey, isolatedSecondaryPkKey, i),
    );
  }

  await Promise.all([
    clusteredService.entities.entity1.put(clusteredEntity1Items).go(),
    clusteredService.entities.entity2.put(clusteredEntity2Items).go(),
    isolatedService.entities.entity1.put(isolatedEntity1Items).go(),
    isolatedService.entities.entity2.put(isolatedEntity2Items).go(),
  ]);

  return {
    keys: {
      clusteredPrimaryPkKey,
      clusteredSecondaryPkKey,
      isolatedPrimaryPkKey,
      isolatedSecondaryPkKey,
    },
    loaded: {
      clusteredEntity1Items,
      clusteredEntity2Items,
      isolatedEntity1Items,
      isolatedEntity2Items,
    },
    services: {
      clusteredService,
      isolatedService,
    },
  };
}

async function initSingleSKTests() {
  // const serviceName = uuid();
  const entity1Name = "entity1";
  const entity2Name = "entity2";
  const clusteredService = createClusteredSingleSKService({
    serviceName,
    entity1Name: `clustered+${entity1Name}`,
    entity2Name: `clustered+${entity2Name}`,
  });
  const isolatedService = createIsolatedSingleSKService({
    serviceName,
    entity1Name: `isolated+${entity1Name}`,
    entity2Name: `isolated+${entity2Name}`,
  });
  const clusteredPrimaryPkKey = `cluz|${uuid()}`;
  const clusteredSecondaryPkKey = `cluz|${uuid()}`;
  const isolatedPrimaryPkKey = `iso|${uuid()}`;
  const isolatedSecondaryPkKey = `iso|${uuid()}`;
  const clusteredEntity1Items: IndexTypeTestItem[] = [];
  const clusteredEntity2Items: IndexTypeTestItem[] = [];
  const isolatedEntity1Items: IndexTypeTestItem[] = [];
  const isolatedEntity2Items: IndexTypeTestItem[] = [];

  for (let i = 0; i < 10; i++) {
    clusteredEntity1Items.push(
      createItem(clusteredPrimaryPkKey, clusteredSecondaryPkKey, i),
    );
    clusteredEntity2Items.push(
      createItem(clusteredPrimaryPkKey, clusteredSecondaryPkKey, i),
    );
    isolatedEntity1Items.push(
      createItem(isolatedPrimaryPkKey, isolatedSecondaryPkKey, i),
    );
    isolatedEntity2Items.push(
      createItem(isolatedPrimaryPkKey, isolatedSecondaryPkKey, i),
    );
  }

  await Promise.all([
    clusteredService.entities.entity1.put(clusteredEntity1Items).go(),
    clusteredService.entities.entity2.put(clusteredEntity2Items).go(),
    isolatedService.entities.entity1.put(isolatedEntity1Items).go(),
    isolatedService.entities.entity2.put(isolatedEntity2Items).go(),
  ]);

  return {
    keys: {
      clusteredPrimaryPkKey,
      clusteredSecondaryPkKey,
      isolatedPrimaryPkKey,
      isolatedSecondaryPkKey,
    },
    loaded: {
      clusteredEntity1Items,
      clusteredEntity2Items,
      isolatedEntity1Items,
      isolatedEntity2Items,
    },
    services: {
      clusteredService,
      isolatedService,
    },
  };
}

const sortItems = (
  items: IndexTypeTestItemCompositeKey[],
): IndexTypeTestItemCompositeKey[] => {
  return [...items].sort((a, z) => {
    return createCompositeKey(a) > createCompositeKey(z) ? 1 : -1;
  });
};

const compareItems = (
  items: IndexTypeTestItemCompositeKey[],
  expected: IndexTypeTestItemCompositeKey[],
  meta?: any,
) => {
  const left = sortItems(items);
  const right = sortItems(expected);
  try {
    expect(items.length).to.be.greaterThan(0);
    expect(items.length).to.equal(expected.length);
    const allMatch = expected.every((item) =>
      items.find(
        (found) => createCompositeKey(item) === createCompositeKey(found),
      ),
    );
    expect(allMatch).to.be.true;
  } catch (err) {
    print({ err, provided: left, expected: right, meta });
    throw err;
  }
};

describe("index types and operations", () => {
  const testInitializers = [
    [initIndexTests, "multi-attribute sortkey"],
    [initSingleSKTests, "single attribute sortkey"],
  ] as const;
  for (const [testInitializer, initializerDescription] of testInitializers) {
    it(`should iterate through only the specified entities regardless of type using only a pk with a ${initializerDescription}`, async () => {
      const { loaded, keys, services } = await testInitializer();
      const isolatedPrimaryCollectionData =
        await services.isolatedService.collections
          .primaryCollection({
            prop1: keys.isolatedPrimaryPkKey,
          })
          .go({ compare: 'attributes' });

      expect(isolatedPrimaryCollectionData.cursor).to.be.null;
      compareItems(
        isolatedPrimaryCollectionData.data.entity1,
        loaded.isolatedEntity1Items,
      );
      compareItems(
        isolatedPrimaryCollectionData.data.entity2,
        loaded.isolatedEntity2Items,
      );

      const isolatedSecondaryCollectionData =
        await services.isolatedService.collections
          .secondaryCollection({
            prop4: keys.isolatedSecondaryPkKey,
          })
          .go({ compare: 'attributes' });

      expect(isolatedSecondaryCollectionData.cursor).to.be.null;
      compareItems(
        isolatedSecondaryCollectionData.data.entity1,
        loaded.isolatedEntity1Items,
      );
      compareItems(
        isolatedSecondaryCollectionData.data.entity2,
        loaded.isolatedEntity2Items,
      );

      const clusteredPrimaryCollectionData =
        await services.clusteredService.collections
          .primaryCollection({
            prop1: keys.clusteredPrimaryPkKey,
          })
          .go({ compare: 'attributes' });

      expect(clusteredPrimaryCollectionData.cursor).to.be.null;
      compareItems(
        clusteredPrimaryCollectionData.data.entity1,
        loaded.clusteredEntity1Items,
      );
      compareItems(
        clusteredPrimaryCollectionData.data.entity2,
        loaded.clusteredEntity2Items,
      );

      const clusteredSecondaryCollectionData =
        await services.clusteredService.collections
          .secondaryCollection({
            prop4: keys.clusteredSecondaryPkKey,
          })
          .go({ compare: 'attributes' });

      expect(clusteredSecondaryCollectionData.cursor).to.be.null;
      compareItems(
        clusteredSecondaryCollectionData.data.entity1,
        loaded.clusteredEntity1Items,
      );
      compareItems(
        clusteredSecondaryCollectionData.data.entity2,
        loaded.clusteredEntity2Items,
      );
    });

    it(`should iterate through only the specified entities regardless of type using a partial ${initializerDescription}`, async () => {
      const { loaded, keys, services } = await testInitializer();
      const clusteredPrimaryCollectionPartialSKData =
        await services.clusteredService.collections
          .primaryCollection({
            prop1: keys.clusteredPrimaryPkKey,
            prop2: 5,
          })
          .go({ compare: 'attributes' });

      expect(clusteredPrimaryCollectionPartialSKData.cursor).to.be.null;
      compareItems(clusteredPrimaryCollectionPartialSKData.data.entity1, [
        loaded.clusteredEntity1Items[5],
      ]);
      compareItems(clusteredPrimaryCollectionPartialSKData.data.entity2, [
        loaded.clusteredEntity2Items[5],
      ]);

      const clusteredSecondaryCollectionPartialSKData =
        await services.clusteredService.collections
          .secondaryCollection({
            prop4: keys.clusteredSecondaryPkKey,
            prop5: 5,
          })
          .go({ compare: 'attributes' });

      expect(clusteredSecondaryCollectionPartialSKData.cursor).to.be.null;
      compareItems(clusteredSecondaryCollectionPartialSKData.data.entity1, [
        loaded.clusteredEntity1Items[5],
      ]);
      compareItems(clusteredSecondaryCollectionPartialSKData.data.entity2, [
        loaded.clusteredEntity2Items[5],
      ]);
    });

    describe("clustered collection sort key operations", () => {
      const sortKeyOperations = [
        ["gt", 5],
        ["gte", 5],
        ["lt", 5],
        ["lte", 5],
        ["between", 3, 7],
      ] as const;
      for (const [operation, first, last] of sortKeyOperations) {
        it(`should iterate through only the specified entities regardless of type using a sort key the ${operation} sort key operation on a ${initializerDescription}`, async () => {
          const { loaded, keys, services } = await testInitializer();
          const filterByOperation = (item: {
            prop5: number;
            prop2: number;
          }) => {
            const properties = [item.prop5, item.prop2];
            return properties.every((property) => {
              switch (operation) {
                case "between":
                  return property >= first && property <= last;
                case "gte":
                  return property >= first;
                case "gt":
                  return property > first;
                case "lte":
                  return property <= first;
                case "lt":
                  return property < first;
              }
            });
          };
          const entity1Items =
            loaded.clusteredEntity1Items.filter(filterByOperation);
          const entity2Items =
            loaded.clusteredEntity2Items.filter(filterByOperation);

          const clusteredPrimaryCollectionPartialSKOperation =
            services.clusteredService.collections.primaryCollection({
              prop1: keys.clusteredPrimaryPkKey,
            });

          const clusteredPrimaryCollectionPartialSKData =
            await (async function () {
              switch (operation) {
                case "between":
                  return clusteredPrimaryCollectionPartialSKOperation
                    .between({ prop2: first }, { prop2: last })
                    .go({ compare: 'attributes' });
                case "gte":
                  return clusteredPrimaryCollectionPartialSKOperation
                    .gte({ prop2: first })
                    .go({ compare: 'attributes' });
                case "gt":
                  return clusteredPrimaryCollectionPartialSKOperation
                    .gt({ prop2: first })
                    .go({compare: 'attributes'});
                case "lte":
                  return clusteredPrimaryCollectionPartialSKOperation
                    .lte({ prop2: first })
                    .go({compare: 'attributes'});
                case "lt":
                  return clusteredPrimaryCollectionPartialSKOperation
                    .lt({ prop2: first })
                    .go({compare: 'attributes'});
              }
            })();

          expect(clusteredPrimaryCollectionPartialSKData.cursor).to.be.null;
          compareItems(
            clusteredPrimaryCollectionPartialSKData.data.entity1,
            entity1Items,
          );
          compareItems(
            clusteredPrimaryCollectionPartialSKData.data.entity2,
            entity2Items,
          );

          const clusteredSecondaryCollectionPartialSKOperation =
            services.clusteredService.collections.secondaryCollection({
              prop4: keys.clusteredSecondaryPkKey,
            });

          const clusteredSecondaryCollectionPartialSKData =
            await (async function () {
              switch (operation) {
                case "between":
                  return clusteredSecondaryCollectionPartialSKOperation
                    .between({ prop5: first }, { prop5: last })
                    .go({ compare: 'attributes' });
                case "gte":
                  return clusteredSecondaryCollectionPartialSKOperation
                    .gte({ prop5: first })
                    .go({ compare: 'attributes' });
                case "gt":
                  return clusteredSecondaryCollectionPartialSKOperation
                    .gt({ prop5: first })
                    .go({ compare: 'attributes' });
                case "lte":
                  return clusteredSecondaryCollectionPartialSKOperation
                    .lte({ prop5: first })
                    .go({ compare: 'attributes' });
                case "lt":
                  return clusteredSecondaryCollectionPartialSKOperation
                    .lt({ prop5: first })
                    .go({ compare: 'attributes' });
              }
            })();

          expect(clusteredSecondaryCollectionPartialSKData.cursor).to.be.null;
          compareItems(
            clusteredSecondaryCollectionPartialSKData.data.entity1,
            entity1Items,
          );
          compareItems(
            clusteredSecondaryCollectionPartialSKData.data.entity2,
            entity2Items,
          );
        });
      }
    });
  }

  describe("query sort key operations", () => {
    const sortKeyOperations = [
      ["gt", 5],
      ["gte", 5],
      ["lt", 5],
      ["lte", 5],
      ["between", 3, 7],
    ] as const;
    const indexTypes = ["isolated", "clustered"] as const;
    for (const [operation, first, last] of sortKeyOperations) {
      for (const indexType of indexTypes) {
        it(`should iterate through only the specified entity regardless of type using a sort key the ${operation} sort key operation on a multi-attribute sort key`, async () => {
          const { loaded, keys, services } = await initIndexTests();
          const filterByOperation = (item: {
            prop5: number;
            prop2: number;
          }) => {
            const properties = [item.prop5, item.prop2];
            return properties.every((property) => {
              switch (operation) {
                case "between":
                  return property >= first && property <= last;
                case "gte":
                  return property >= first;
                case "gt":
                  return property > first;
                case "lte":
                  return property <= first;
                case "lt":
                  return property < first;
              }
            });
          };
          const entity1Items =
            loaded.clusteredEntity1Items.filter(filterByOperation);

          const entity1PrimaryQuery =
            services.clusteredService.entities.entity1.query.primary({
              prop1: keys.clusteredPrimaryPkKey,
            });

          const entity1PrimaryQueryResults = await (async function () {
            switch (operation) {
              case "between":
                return entity1PrimaryQuery
                  .between({ prop2: first }, { prop2: last })
                  .go({ compare: 'attributes' });
              case "gte":
                return entity1PrimaryQuery.gte({ prop2: first }).go({ compare: 'attributes' });
              case "gt":
                return entity1PrimaryQuery.gt({ prop2: first }).go({ compare: 'attributes' });
              case "lte":
                return entity1PrimaryQuery.lte({ prop2: first }).go({ compare: 'attributes' });
              case "lt":
                return entity1PrimaryQuery.lt({ prop2: first }).go({ compare: 'attributes' });
            }
          })();

          expect(entity1PrimaryQueryResults.cursor).to.be.null;
          compareItems(entity1PrimaryQueryResults.data, entity1Items);

          const entity1SecondaryQuery =
            services.clusteredService.entities.entity1.query.secondary({
              prop4: keys.clusteredSecondaryPkKey,
            });

          const entity1SecondaryQueryResults = await (async function () {
            switch (operation) {
              case "between":
                return entity1SecondaryQuery
                  .between({ prop5: first }, { prop5: last })
                  .go({ compare: 'attributes' });
              case "gte":
                return entity1SecondaryQuery.gte({ prop5: first }).go({ compare: 'attributes' });
              case "gt":
                return entity1SecondaryQuery.gt({ prop5: first }).go({ compare: 'attributes' });
              case "lte":
                return entity1SecondaryQuery.lte({ prop5: first }).go({ compare: 'attributes' });
              case "lt":
                return entity1SecondaryQuery.lt({ prop5: first }).go({ compare: 'attributes' });
            }
          })();

          expect(entity1SecondaryQueryResults.cursor).to.be.null;
          compareItems(entity1SecondaryQueryResults.data, entity1Items);
        });

        it(`should iterate through only the specified entity regardless of type using a sort key the ${operation} sort key operation on a multi-attribute sort key`, async () => {
          const { loaded, keys, services } = await initIndexTests();
          const filterByOperation = (item: {
            prop5: number;
            prop2: number;
          }) => {
            const properties = [item.prop5, item.prop2];
            return properties.every((property) => {
              switch (operation) {
                case "between":
                  return property >= first && property <= last;
                case "gte":
                  return property >= first;
                case "gt":
                  return property > first;
                case "lte":
                  return property <= first;
                case "lt":
                  return property < first;
              }
            });
          };

          const entity1Items =
            indexType === "clustered"
              ? loaded.clusteredEntity1Items.filter(filterByOperation)
              : loaded.isolatedEntity1Items.filter(filterByOperation);

          const entity1PrimaryQuery =
            indexType === "clustered"
              ? services.clusteredService.entities.entity1.query.primary({
                  prop1: keys.clusteredPrimaryPkKey,
                })
              : services.isolatedService.entities.entity1.query.primary({
                  prop1: keys.isolatedPrimaryPkKey,
                });

          const entity1PrimaryQueryResults = await (async function () {
            switch (operation) {
              case "between":
                return entity1PrimaryQuery
                  .between({ prop2: first }, { prop2: last })
                  .go({ compare: 'attributes' });
              case "gte":
                return entity1PrimaryQuery.gte({ prop2: first }).go({ compare: 'attributes' });
              case "gt":
                return entity1PrimaryQuery.gt({ prop2: first }).go({ compare: 'attributes' });
              case "lte":
                return entity1PrimaryQuery.lte({ prop2: first }).go({ compare: 'attributes' });
              case "lt":
                return entity1PrimaryQuery.lt({ prop2: first }).go({ compare: 'attributes' });
            }
          })();

          expect(entity1PrimaryQueryResults.cursor).to.be.null;
          compareItems(entity1PrimaryQueryResults.data, entity1Items);

          const entity1SecondaryQuery =
            indexType === "clustered"
              ? services.clusteredService.entities.entity1.query.secondary({
                  prop4: keys.clusteredSecondaryPkKey,
                })
              : services.isolatedService.entities.entity1.query.secondary({
                  prop4: keys.isolatedSecondaryPkKey,
                });

          const entity1SecondaryQueryResults = await (async function () {
            switch (operation) {
              case "between":
                return entity1SecondaryQuery
                  .between({ prop5: first }, { prop5: last })
                  .go({ compare: 'attributes' });
              case "gte":
                return entity1SecondaryQuery.gte({ prop5: first }).go({ compare: 'attributes' });
              case "gt":
                return entity1SecondaryQuery.gt({ prop5: first }).go({ compare: 'attributes' });
              case "lte":
                return entity1SecondaryQuery.lte({ prop5: first }).go({ compare: 'attributes' });
              case "lt":
                return entity1SecondaryQuery.lt({ prop5: first }).go({ compare: 'attributes' });
            }
          })();

          expect(entity1SecondaryQueryResults.cursor).to.be.null;
          compareItems(entity1SecondaryQueryResults.data, entity1Items);
        });

        it(`should iterate through only the specified entity regardless of type using a sort key the ${operation} sort key operation on a single attribute sort key`, async () => {
          const { loaded, keys, services } = await initSingleSKTests();
          const filterByOperation = (item: {
            prop5: number;
            prop2: number;
          }) => {
            const properties = [item.prop5, item.prop2];
            return properties.every((property) => {
              switch (operation) {
                case "between":
                  return property >= first && property <= last;
                case "gte":
                  return property >= first;
                case "gt":
                  return property > first;
                case "lte":
                  return property <= first;
                case "lt":
                  return property < first;
              }
            });
          };
          const entity1Items =
            loaded.clusteredEntity1Items.filter(filterByOperation);

          const entity1PrimaryQuery =
            services.clusteredService.entities.entity1.query.primary({
              prop1: keys.clusteredPrimaryPkKey,
            });

          const entity1PrimaryQueryResults = await (async function () {
            switch (operation) {
              case "between":
                return entity1PrimaryQuery
                  .between({ prop2: first }, { prop2: last })
                  .go({ compare: 'attributes' });
              case "gte":
                return entity1PrimaryQuery.gte({ prop2: first }).go({ compare: 'attributes' });
              case "gt":
                return entity1PrimaryQuery.gt({ prop2: first }).go({ compare: 'attributes' });
              case "lte":
                return entity1PrimaryQuery.lte({ prop2: first }).go({ compare: 'attributes' });
              case "lt":
                return entity1PrimaryQuery.lt({ prop2: first }).go({ compare: 'attributes' });
            }
          })();

          expect(entity1PrimaryQueryResults.cursor).to.be.null;
          compareItems(entity1PrimaryQueryResults.data, entity1Items);

          const entity1SecondaryQuery =
            services.clusteredService.entities.entity1.query.secondary({
              prop4: keys.clusteredSecondaryPkKey,
            });

          const entity1SecondaryQueryResults = await (async function () {
            switch (operation) {
              case "between":
                return entity1SecondaryQuery
                  .between({ prop5: first }, { prop5: last })
                  .go({ compare: 'attributes' });
              case "gte":
                return entity1SecondaryQuery.gte({ prop5: first }).go({ compare: 'attributes' });
              case "gt":
                return entity1SecondaryQuery.gt({ prop5: first }).go({ compare: 'attributes' });
              case "lte":
                return entity1SecondaryQuery.lte({ prop5: first }).go({ compare: 'attributes' });
              case "lt":
                return entity1SecondaryQuery.lt({ prop5: first }).go({ compare: 'attributes' });
            }
          })();

          expect(entity1SecondaryQueryResults.cursor).to.be.null;
          compareItems(entity1SecondaryQueryResults.data, entity1Items);
        });

        it(`should iterate through only the specified entity regardless of type using a sort key the ${operation} sort key operation on a single attribute sort key on ${indexType} index type`, async () => {
          const { loaded, keys, services } = await initSingleSKTests();
          const filterByOperation = (item: {
            prop5: number;
            prop2: number;
          }) => {
            const properties = [item.prop5, item.prop2];
            return properties.every((property) => {
              switch (operation) {
                case "between":
                  return property >= first && property <= last;
                case "gte":
                  return property >= first;
                case "gt":
                  return property > first;
                case "lte":
                  return property <= first;
                case "lt":
                  return property < first;
              }
            });
          };

          const entity1Items =
            indexType === "clustered"
              ? loaded.clusteredEntity1Items.filter(filterByOperation)
              : loaded.isolatedEntity1Items.filter(filterByOperation);

          console.log('items', JSON.stringify({
            entity1Items,
            indexType,
            loaded: indexType === "clustered"
              ? loaded.clusteredEntity1Items
              : loaded.isolatedEntity1Items,
          }, null, 4));

          const entity1PrimaryQuery =
            indexType === "clustered"
              ? services.clusteredService.entities.entity1.query.primary({
                  prop1: keys.clusteredPrimaryPkKey,
                })
              : services.isolatedService.entities.entity1.query.primary({
                  prop1: keys.isolatedPrimaryPkKey,
                });

          const entity1PrimaryQueryResults = await (async function () {
            switch (operation) {
              case "between":
                return entity1PrimaryQuery
                  .between({ prop2: first }, { prop2: last })
                  .go({ compare: 'attributes', logger: (event) => {
                    if (event.type === 'query') {
                      console.log('paramz', JSON.stringify({ params: event.params, first, last }, null, 4))
                    }
                  }});
              case "gte":
                return entity1PrimaryQuery.gte({ prop2: first }).go({ compare: 'attributes' });
              case "gt":
                return entity1PrimaryQuery.gt({ prop2: first }).go({ compare: 'attributes' });
              case "lte":
                return entity1PrimaryQuery.lte({ prop2: first }).go({ compare: 'attributes' });
              case "lt":
                return entity1PrimaryQuery.lt({ prop2: first }).go({ compare: 'attributes' });
            }
          })();

          expect(entity1PrimaryQueryResults.cursor).to.be.null;
          console.log('result', {
            data: entity1PrimaryQueryResults.data,
            entity1Items,
          })
          compareItems(entity1PrimaryQueryResults.data, entity1Items);

          const entity1SecondaryQuery =
            indexType === "clustered"
              ? services.clusteredService.entities.entity1.query.secondary({
                  prop4: keys.clusteredSecondaryPkKey,
                })
              : services.isolatedService.entities.entity1.query.secondary({
                  prop4: keys.isolatedSecondaryPkKey,
                });

          const entity1SecondaryQueryResults = await (async function () {
            console.log('wot?', {operation})
            switch (operation) {
              case "between":
                return entity1SecondaryQuery
                  .between({ prop5: first }, { prop5: last })
                  .go({ compare: 'attributes', logger: (event) => {
                    if (event.type === 'query') {
                      const { params } = event;
                      console.log('BETWEENz', {params})
                    } else {
                      const { results } = event;
                      console.log('BETWEENs', {results})
                    }
                    } });
              case "gte":
                return entity1SecondaryQuery.gte({ prop5: first }).go({ compare: 'attributes' });
              case "gt":
                return entity1SecondaryQuery.gt({ prop5: first }).go({ compare: 'attributes' });
              case "lte":
                return entity1SecondaryQuery.lte({ prop5: first }).go({ compare: 'attributes' });
              case "lt":
                return entity1SecondaryQuery.lt({ prop5: first }).go({ compare: 'attributes' });
            }
          })();

          expect(entity1SecondaryQueryResults.cursor).to.be.null;
          compareItems(entity1SecondaryQueryResults.data, entity1Items);
        });
      }
    }
  });
});

describe("service validation", () => {
  it("should throw when a clustered entity has sub collections", () => {
    const entity1 = new Entity({
      model: {
        entity: "my_entity_1",
        service: "my_service",
        version: "1",
      },
      attributes: {
        prop1: {
          type: "string",
        },
        prop2: {
          type: "string",
        },
      },
      indexes: {
        main: {
          collection: ["collection1", "collection2"],
          type: "clustered",
          pk: {
            field: "pk",
            composite: ["prop1"],
          },
          sk: {
            field: "sk",
            composite: ["prop2"],
          },
        },
      },
    });

    expect(() => new Service({ entity1 })).to.throw(
      `Clustered indexes do not support sub-collections. The sub-collection "collection1", on Entity "entity1" must be defined as either an individual collection name or the index must be redefined as an isolated cluster`,
    );
  });

  const indexTypes = [undefined, "isolated", "clustered"] as const;
  for (const indexType1 of indexTypes) {
    for (const indexType2 of indexTypes) {
      it(`should throw when all collection members do not share the same index type: "${
        indexType1 ?? "undefined"
      }" and "${indexType2 ?? "undefined"}"`, () => {
        const entity1 = new Entity({
          model: {
            entity: "my_entity_1",
            service: "my_service",
            version: "1",
          },
          attributes: {
            prop1: {
              type: "string",
            },
            prop2: {
              type: "string",
            },
          },
          indexes: {
            main: {
              collection: "collection1",
              type: indexType1,
              pk: {
                field: "pk",
                composite: ["prop1"],
              },
              sk: {
                field: "sk",
                composite: ["prop2"],
              },
            },
          },
        });
        const entity2 = new Entity({
          model: {
            entity: "my_entity_2",
            service: "my_service",
            version: "1",
          },
          attributes: {
            prop1: {
              type: "string",
            },
            prop2: {
              type: "string",
            },
          },
          indexes: {
            main: {
              collection: "collection1",
              type: indexType2,
              pk: {
                field: "pk",
                composite: ["prop1"],
              },
              sk: {
                field: "sk",
                composite: ["prop2"],
              },
            },
          },
        });

        // default undefined to "isolated"
        const leftType = indexType1 ?? "isolated";
        const rightType = indexType2 ?? "isolated";
        const assertion = expect(() => new Service({ entity1, entity2 }));

        if (leftType !== rightType) {
          assertion.to.throw(
            `Index type mismatch on collection collection1. The entity entity2 defines the index as type ${rightType} while the established type for that index is ${leftType}. Note that when omitted, indexes default to the type "isolated" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#join`,
          );
        } else {
          assertion.to.not.throw();
        }
      });
    }
  }
});

type QueryParameters = {
  ExpressionAttributeValues: {
    ":sk1": string;
  };
};

type SingleOperationParameters = {
  Key: {
    sk: string;
  };
};

type CreateEntityParameters = {
  Item: {
    sk: string;
    gsi1sk: string;
  };
};

type KeyUpdateParameters = {
  ExpressionAttributeValues: {
    ":gsi1sk_u0": string;
  };
};

type EntityIsolationTestCase = {
  description: string;
  buildSk: () => string;
  expected: string;
};

describe("clustered index sort key formatting", () => {
  // const serviceName = uuid();
  const entity1Name = uuid();
  const entity2Name = uuid();
  const service = createClusteredService({
    serviceName,
    entity1Name,
    entity2Name,
  });
  const prop1 = "val1";
  const prop2 = 123456;
  const prop3 = "val3";
  const prop4 = "val4";
  const prop5 = 987654;
  const prop6 = "val6";
  const prop7 = "val7";
  const testCases: EntityIsolationTestCase[] = [
    {
      description:
        "complete service key on main index should not add entity name to sort key",
      buildSk: () =>
        service.collections
          .primaryCollection({ prop1, prop2, prop3 })
          .params<QueryParameters>()["ExpressionAttributeValues"][":sk1"],
      expected: "$primarycollection#prop2_123456#prop3_val3",
    },
    {
      description:
        "complete entity key on main index should add entity name to sort key",
      buildSk: () =>
        service.entities.entity1.query
          .primary({ prop1, prop2, prop3 })
          .params<QueryParameters>()["ExpressionAttributeValues"][":sk1"],
      expected: `$primarycollection#prop2_123456#prop3_val3#${entity1Name}_1`,
    },
    {
      description:
        "complete service key on secondary index should not add entity name to sort key",
      buildSk: () =>
        service.collections
          .secondaryCollection({ prop4, prop5, prop6 })
          .params<QueryParameters>()["ExpressionAttributeValues"][":sk1"],
      expected: "$secondarycollection#prop5_987654#prop6_val6",
    },
    {
      description:
        "complete entity key on secondary index should add entity name to sort key",
      buildSk: () => {
        const params = service.entities.entity1.query
          .secondary({ prop4, prop5, prop6 })
          .params<QueryParameters>();
        return params.ExpressionAttributeValues[":sk1"];
      },
      expected: `$secondarycollection#prop5_987654#prop6_val6#${entity1Name}_1`,
    },
    {
      description:
        "creating an entity correctly formats the sk for clustered entities",
      buildSk: () =>
        service.entities.entity1
          .create({ prop1, prop2, prop3, prop4, prop5, prop6 })
          .params<CreateEntityParameters>().Item.sk,
      expected: `$primarycollection#prop2_123456#prop3_val3#${entity1Name}_1`,
    },
    {
      description:
        "creating an entity correctly formats the gsi1sk for clustered entities",
      buildSk: () =>
        service.entities.entity1
          .create({ prop1, prop2, prop3, prop4, prop5, prop6 })
          .params<CreateEntityParameters>().Item.gsi1sk,
      expected: `$secondarycollection#prop5_987654#prop6_val6#${entity1Name}_1`,
    },
    {
      description:
        "putting an entity correctly formats the sk for clustered entities",
      buildSk: () =>
        service.entities.entity1
          .put({ prop1, prop2, prop3, prop4, prop5, prop6 })
          .params<CreateEntityParameters>().Item.sk,
      expected: `$primarycollection#prop2_123456#prop3_val3#${entity1Name}_1`,
    },
    {
      description:
        "putting an entity correctly formats the gsi1sk for clustered entities",
      buildSk: () =>
        service.entities.entity1
          .put({ prop1, prop2, prop3, prop4, prop5, prop6 })
          .params<CreateEntityParameters>().Item.gsi1sk,
      expected: `$secondarycollection#prop5_987654#prop6_val6#${entity1Name}_1`,
    },
    {
      description:
        "updating an entity correctly formats the sk for clustered entities",
      buildSk: () =>
        service.entities.entity1
          .update({ prop1, prop2, prop3 })
          .set({ prop7 })
          .params<SingleOperationParameters>().Key.sk,
      expected: `$primarycollection#prop2_123456#prop3_val3#${entity1Name}_1`,
    },
    {
      description:
        "updating an entity resulting in a change to a secondary index correctly formats the sort key for clustered indexes",
      buildSk: () =>
        service.entities.entity1
          .update({ prop1, prop2, prop3 })
          .set({ prop5, prop6 })
          .params<KeyUpdateParameters>().ExpressionAttributeValues[
          ":gsi1sk_u0"
        ],
      expected: `$secondarycollection#prop5_987654#prop6_val6#${entity1Name}_1`,
    },
    {
      description:
        "patching an entity correctly formats the sk for clustered entities",
      buildSk: () =>
        service.entities.entity1
          .patch({ prop1, prop2, prop3 })
          .set({ prop7 })
          .params<SingleOperationParameters>().Key.sk,
      expected: `$primarycollection#prop2_123456#prop3_val3#${entity1Name}_1`,
    },
    {
      description:
        "patching an entity resulting in a change to a secondary index correctly formats the sort key for clustered indexes",
      buildSk: () =>
        service.entities.entity1
          .patch({ prop1, prop2, prop3 })
          .set({ prop5, prop6 })
          .params<KeyUpdateParameters>().ExpressionAttributeValues[
          ":gsi1sk_u0"
        ],
      expected: `$secondarycollection#prop5_987654#prop6_val6#${entity1Name}_1`,
    },
    {
      description:
        "getting an entity correctly formats the sk for clustered entities",
      buildSk: () =>
        service.entities.entity1
          .get({ prop1, prop2, prop3 })
          .params<SingleOperationParameters>().Key.sk,
      expected: `$primarycollection#prop2_123456#prop3_val3#${entity1Name}_1`,
    },
    {
      description:
        "deleting an entity correctly formats the sk for clustered entities",
      buildSk: () =>
        service.entities.entity1
          .delete({ prop1, prop2, prop3 })
          .params<SingleOperationParameters>().Key.sk,
      expected: `$primarycollection#prop2_123456#prop3_val3#${entity1Name}_1`,
    },
    {
      description:
        "removing an entity correctly formats the sk for clustered entities",
      buildSk: () =>
        service.entities.entity1
          .remove({ prop1, prop2, prop3 })
          .params<SingleOperationParameters>().Key.sk,
      expected: `$primarycollection#prop2_123456#prop3_val3#${entity1Name}_1`,
    },
  ];
  for (const { description, expected, buildSk } of testCases) {
    it(description, () => {
      const sortKey = buildSk();
      expect(sortKey).to.equal(expected);
    });
  }
});

it("should add entity filter when clustered index is partially provided on entity query", () => {
  // const serviceName = uuid();
  const entity1Name = uuid();
  const entity2Name = uuid();
  const service = createClusteredService({
    serviceName,
    entity1Name,
    entity2Name,
  });

  const params = service.entities.entity1.query
    .primary({ prop1: "abc", prop2: 123 })
    .params();
  expect(params).to.deep.equal({
    KeyConditionExpression: "#pk = :pk and begins_with(#sk1, :sk1)",
    TableName: "electro",
    ExpressionAttributeNames: {
      "#__edb_e__": "__edb_e__",
      "#__edb_v__": "__edb_v__",
      "#pk": "pk",
      "#sk1": "sk",
    },
    ExpressionAttributeValues: {
      ":__edb_e__0": entity1Name,
      ":__edb_v__0": "1",
      ":pk": `$${serviceName}#prop1_abc`,
      ":sk1": "$primarycollection#prop2_123#prop3_",
    },
    FilterExpression:
      "(#__edb_e__ = :__edb_e__0) AND #__edb_v__ = :__edb_v__0",
  });
});

describe("composite compatibility", () => {
  it("should validate that partition keys are not mixed/matched custom keys", () => {
    const tasks = new Entity(
      {
        model: {
          entity: "tasks",
          version: "1",
          service: "taskapp",
        },
        attributes: {
          team: {
            type: "string",
            required: true,
          },
          task: {
            type: "string",
            required: true,
          },
          project: {
            type: "string",
            required: true,
          },
          user: {
            type: "string",
            required: true,
          },
          title: {
            type: "string",
            required: true,
          },
          description: {
            type: "string",
          },
          accountId: {
            type: "string",
          },
          status: {
            // use an array to type an enum
            type: ["open", "in-progress", "on-hold", "closed"] as const,
            default: "open",
          },
        },
        indexes: {
          projects: {
            pk: {
              field: "pk",
              composite: ["team"],
            },
            sk: {
              field: "sk",
              // create composite keys for partial sort key queries
              composite: ["project", "task"],
            },
          },
          assigned: {
            // collections allow for queries across multiple entities
            collection: "assignments",
            type: "clustered",
            index: "gsi1pk-gsi1sk-index",
            pk: {
              // map to your GSI Hash/Partition key
              field: "gsi1pk",
              composite: ["accountId"],
            },
            sk: {
              // map to your GSI Range/Sort key
              field: "gsi1sk",
              composite: ["user", "team"],
            },
          },
        },
      },
      { table, client },
    );

    /* Users Entity */
    const users = new Entity(
      {
        model: {
          entity: "user",
          service: "taskapp",
          version: "1",
        },
        attributes: {
          team: {
            type: "string",
          },
          user: {
            type: "string",
          },
          role: {
            type: ["dev", "senior", "staff", "principal"] as const,
            set: (title: string) => {
              // save as index for comparison
              return ["dev", "senior", "staff", "principal"].indexOf(title);
            },
            get: (index: number) => {
              return ["dev", "senior", "staff", "principal"][index] || "other";
            },
          },
          manager: {
            type: "string",
          },
          firstName: {
            type: "string",
          },
          lastName: {
            type: "string",
          },
          accountId: {
            type: "string",
          },
        },
        indexes: {
          members: {
            collection: "organization",
            pk: {
              composite: ["team"],
              field: "pk",
            },
            sk: {
              composite: ["user"],
              field: "sk",
            },
          },
          user: {
            type: "clustered",
            collection: "assignments",
            index: "gsi1pk-gsi1sk-index",
            pk: {
              composite: ["accountId"],
              field: "gsi1pk",
              template: "ACCT#${accountId}",
            },
            sk: {
              field: "gsi1sk",
              composite: ["user", "lastName", "team"],
            },
          },
        },
      },
      { table, client },
    );

    expect(() => new Service({ tasks, users })).to.throw(
      'Validation Error while joining entity, "users". The usage of key templates the partition key on index gsi1pk-gsi1sk-index must be consistent across all Entities, some entities provided use template while others do not; Partition Key composite attributes provided for index "gsi1pk-gsi1sk-index" contain conflicting composite attribute labels for established composite attribute "accountId" on established index "gsi1pk-gsi1sk-index". Established composite attribute "accountId" on established index "gsi1pk-gsi1sk-index" was defined with label "accountId" while provided composite attribute "accountId" on provided index "gsi1pk-gsi1sk-index" is defined with label "ACCT#". Composite attribute labels definitions must match between all members of a collection to ensure key structures will resolve to identical Partition Keys. Please ensure these labels definitions are identical for all entities associated with this service. - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#join',
    );
    expect(() => new Service({ users, tasks })).to.throw(
      'Validation Error while joining entity, "tasks". The usage of key templates the partition key on index gsi1pk-gsi1sk-index must be consistent across all Entities, some entities provided use template while others do not; Partition Key composite attributes provided for index "gsi1pk-gsi1sk-index" contain conflicting composite attribute labels for established composite attribute "accountId" on established index "gsi1pk-gsi1sk-index". Established composite attribute "accountId" on established index "gsi1pk-gsi1sk-index" was defined with label "ACCT#" while provided composite attribute "accountId" on provided index "gsi1pk-gsi1sk-index" is defined with label "accountId". Composite attribute labels definitions must match between all members of a collection to ensure key structures will resolve to identical Partition Keys. Please ensure these labels definitions are identical for all entities associated with this service. - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#join',
    );
  });

  it("should validate that sort keys are not mixed/matched custom keys", () => {
    const tasks = new Entity(
      {
        model: {
          entity: "tasks",
          version: "1",
          service: "taskapp",
        },
        attributes: {
          team: {
            type: "string",
            required: true,
          },
          task: {
            type: "string",
            required: true,
          },
          project: {
            type: "string",
            required: true,
          },
          user: {
            type: "string",
            required: true,
          },
          title: {
            type: "string",
            required: true,
          },
          description: {
            type: "string",
          },
          accountId: {
            type: "string",
          },
          status: {
            // use an array to type an enum
            type: ["open", "in-progress", "on-hold", "closed"] as const,
            default: "open",
          },
        },
        indexes: {
          projects: {
            pk: {
              field: "pk",
              composite: ["team"],
            },
            sk: {
              field: "sk",
              // create composite keys for partial sort key queries
              composite: ["project", "task"],
            },
          },
          assigned: {
            // collections allow for queries across multiple entities
            collection: "assignments",
            type: "clustered",
            index: "gsi1pk-gsi1sk-index",
            pk: {
              // map to your GSI Hash/Partition key
              field: "gsi1pk",
              composite: ["accountId"],
            },
            sk: {
              // map to your GSI Range/Sort key
              field: "gsi1sk",
              composite: ["user", "team"],
            },
          },
        },
      },
      { table, client },
    );

    /* Users Entity */
    const users = new Entity(
      {
        model: {
          entity: "user",
          service: "taskapp",
          version: "1",
        },
        attributes: {
          team: {
            type: "string",
          },
          user: {
            type: "string",
          },
          role: {
            type: ["dev", "senior", "staff", "principal"] as const,
            set: (title: string) => {
              // save as index for comparison
              return ["dev", "senior", "staff", "principal"].indexOf(title);
            },
            get: (index: number) => {
              return ["dev", "senior", "staff", "principal"][index] || "other";
            },
          },
          manager: {
            type: "string",
          },
          firstName: {
            type: "string",
          },
          lastName: {
            type: "string",
          },
          accountId: {
            type: "string",
          },
        },
        indexes: {
          members: {
            collection: "organization",
            pk: {
              composite: ["team"],
              field: "pk",
            },
            sk: {
              composite: ["user"],
              field: "sk",
            },
          },
          user: {
            type: "clustered",
            collection: "assignments",
            index: "gsi1pk-gsi1sk-index",
            pk: {
              composite: ["accountId"],
              field: "gsi1pk",
            },
            sk: {
              field: "gsi1sk",
              composite: ["user", "lastName", "team"],
              template: "U#${user}#N#${lastName}#T#${team}",
            },
          },
        },
      },
      { table, client },
    );

    expect(() => new Service({ tasks, users })).to.throw(
      'Validation Error while joining entity, "users". The usage of key templates the sort key on index gsi1pk-gsi1sk-index must be consistent across all Entities, some entities provided use template while others do not; Sort Key composite attributes provided for index "gsi1pk-gsi1sk-index" contain conflicting composite attribute labels for established composite attribute "user" on established index "gsi1pk-gsi1sk-index". Established composite attribute "user" on established index "gsi1pk-gsi1sk-index" was defined with label "user" while provided composite attribute "user" on provided index "gsi1pk-gsi1sk-index" is defined with label "U#". Composite attribute labels definitions must match between all members of a collection to ensure key structures will resolve to identical Partition Keys. Please ensure these labels definitions are identical for all entities associated with this service. - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#join',
    );
    expect(() => new Service({ users, tasks })).to.throw(
      'Validation Error while joining entity, "tasks". The usage of key templates the sort key on index gsi1pk-gsi1sk-index must be consistent across all Entities, some entities provided use template while others do not; Sort Key composite attributes provided for index "gsi1pk-gsi1sk-index" contain conflicting composite attribute labels for established composite attribute "user" on established index "gsi1pk-gsi1sk-index". Established composite attribute "user" on established index "gsi1pk-gsi1sk-index" was defined with label "U#" while provided composite attribute "user" on provided index "gsi1pk-gsi1sk-index" is defined with label "user". Composite attribute labels definitions must match between all members of a collection to ensure key structures will resolve to identical Partition Keys. Please ensure these labels definitions are identical for all entities associated with this service. - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#join',
    );
  });

  it("should validate template sort key labels until the composite attributes differ when using clustered indexes", () => {
    const tasks = new Entity(
      {
        model: {
          entity: "tasks",
          version: "1",
          service: "taskapp",
        },
        attributes: {
          team: {
            type: "string",
            required: true,
          },
          task: {
            type: "string",
            required: true,
          },
          project: {
            type: "string",
            required: true,
          },
          user: {
            type: "string",
            required: true,
          },
          title: {
            type: "string",
            required: true,
          },
          description: {
            type: "string",
          },
          accountId: {
            type: "string",
          },
          status: {
            // use an array to type an enum
            type: ["open", "in-progress", "on-hold", "closed"] as const,
            default: "open",
          },
        },
        indexes: {
          projects: {
            pk: {
              field: "pk",
              composite: ["team"],
            },
            sk: {
              field: "sk",
              // create composite keys for partial sort key queries
              composite: ["project", "task"],
            },
          },
          assigned: {
            // collections allow for queries across multiple entities
            collection: "assignments",
            type: "clustered",
            index: "gsi1pk-gsi1sk-index",
            pk: {
              // map to your GSI Hash/Partition key
              field: "gsi1pk",
              composite: [],
            },
            sk: {
              // map to your GSI Range/Sort key
              field: "gsi1sk",
              composite: ["user", "accountId", "team"],
              template: "USER#${user}#ACCOUNTID#${accountId}#TEAMZ#${team}",
            },
          },
        },
      },
      { table, client },
    );

    /* Users Entity */
    const users = new Entity(
      {
        model: {
          entity: "user",
          service: "taskapp",
          version: "1",
        },
        attributes: {
          team: {
            type: "string",
          },
          user: {
            type: "string",
          },
          role: {
            type: ["dev", "senior", "staff", "principal"] as const,
            set: (title: string) => {
              // save as index for comparison
              return ["dev", "senior", "staff", "principal"].indexOf(title);
            },
            get: (index: number) => {
              return ["dev", "senior", "staff", "principal"][index] || "other";
            },
          },
          manager: {
            type: "string",
          },
          firstName: {
            type: "string",
          },
          lastName: {
            type: "string",
          },
          accountId: {
            type: "string",
          },
        },
        indexes: {
          members: {
            collection: "organization",
            pk: {
              composite: ["team"],
              field: "pk",
            },
            sk: {
              composite: ["user"],
              field: "sk",
            },
          },
          user: {
            type: "clustered",
            collection: "assignments",
            index: "gsi1pk-gsi1sk-index",
            pk: {
              composite: [],
              field: "gsi1pk",
            },
            sk: {
              field: "gsi1sk",
              composite: ["user", "accountId", "team"],
              template: "USER#${user}#ACCOUNTID#${accountId}#TEAM#${team}",
            },
          },
        },
      },
      { table, client },
    );
    expect(() => new Service({ tasks, users })).to.throw(
      'Validation Error while joining entity, "users". Sort Key composite attributes provided for index "gsi1pk-gsi1sk-index" contain conflicting composite attribute labels for established composite attribute "team" on established index "gsi1pk-gsi1sk-index". Established composite attribute "team" on established index "gsi1pk-gsi1sk-index" was defined with label "#TEAMZ#" while provided composite attribute "team" on provided index "gsi1pk-gsi1sk-index" is defined with label "#TEAM#". Composite attribute labels definitions must match between all members of a collection to ensure key structures will resolve to identical Partition Keys. Please ensure these labels definitions are identical for all entities associated with this service. - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#join',
    );
    expect(() => new Service({ users, tasks })).to.throw(
      'Validation Error while joining entity, "tasks". Sort Key composite attributes provided for index "gsi1pk-gsi1sk-index" contain conflicting composite attribute labels for established composite attribute "team" on established index "gsi1pk-gsi1sk-index". Established composite attribute "team" on established index "gsi1pk-gsi1sk-index" was defined with label "#TEAM#" while provided composite attribute "team" on provided index "gsi1pk-gsi1sk-index" is defined with label "#TEAMZ#". Composite attribute labels definitions must match between all members of a collection to ensure key structures will resolve to identical Partition Keys. Please ensure these labels definitions are identical for all entities associated with this service. - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#join',
    );
  });

  it("should allow template sort key labels until the composite attributes differ when using clustered indexes", () => {
    const tasks = new Entity(
      {
        model: {
          entity: "tasks",
          version: "1",
          service: "taskapp",
        },
        attributes: {
          team: {
            type: "string",
            required: true,
          },
          task: {
            type: "string",
            required: true,
          },
          project: {
            type: "string",
            required: true,
          },
          user: {
            type: "string",
            required: true,
          },
          title: {
            type: "string",
            required: true,
          },
          description: {
            type: "string",
          },
          accountId: {
            type: "string",
          },
          status: {
            // use an array to type an enum
            type: ["open", "in-progress", "on-hold", "closed"] as const,
            default: "open",
          },
        },
        indexes: {
          projects: {
            pk: {
              field: "pk",
              composite: ["team"],
            },
            sk: {
              field: "sk",
              // create composite keys for partial sort key queries
              composite: ["project", "task"],
            },
          },
          assigned: {
            // collections allow for queries across multiple entities
            collection: "assignments",
            type: "clustered",
            index: "gsi1pk-gsi1sk-index",
            pk: {
              // map to your GSI Hash/Partition key
              field: "gsi1pk",
              composite: [],
            },
            sk: {
              // map to your GSI Range/Sort key
              field: "gsi1sk",
              composite: ["user", "accountId", "status", "team"],
              template:
                "USER#${user}#ACCOUNTID#${accountId}#STATUS#${status}#TEAM#${team}",
            },
          },
        },
      },
      { table, client },
    );

    /* Users Entity */
    const users = new Entity(
      {
        model: {
          entity: "user",
          service: "taskapp",
          version: "1",
        },
        attributes: {
          team: {
            type: "string",
          },
          user: {
            type: "string",
          },
          role: {
            type: ["dev", "senior", "staff", "principal"] as const,
            set: (title: string) => {
              // save as index for comparison
              return ["dev", "senior", "staff", "principal"].indexOf(title);
            },
            get: (index: number) => {
              return ["dev", "senior", "staff", "principal"][index] || "other";
            },
          },
          manager: {
            type: "string",
          },
          firstName: {
            type: "string",
          },
          lastName: {
            type: "string",
          },
          accountId: {
            type: "string",
          },
        },
        indexes: {
          members: {
            collection: "organization",
            pk: {
              composite: ["team"],
              field: "pk",
            },
            sk: {
              composite: ["user"],
              field: "sk",
            },
          },
          user: {
            type: "clustered",
            collection: "assignments",
            index: "gsi1pk-gsi1sk-index",
            pk: {
              composite: [],
              field: "gsi1pk",
            },
            sk: {
              field: "gsi1sk",
              composite: ["user", "accountId", "team"],
              template: "USER#${user}#ACCOUNTID#${accountId}#TEAM#${team}",
            },
          },
        },
      },
      { table, client },
    );

    function one() {
      const service = new Service({ tasks, users });
      const params = service.collections
        .assignments({ accountId: "acct_059", user: "tyler.walch" })
        .params();
      expect(params.ExpressionAttributeValues[":sk1"]).to.equal(
        "user#tyler.walch#accountid#acct_059",
      );
    }

    function two() {
      const service = new Service({ users, tasks });
      const params = service.collections
        .assignments({ accountId: "acct_059", user: "tyler.walch" })
        .params();
      expect(params.ExpressionAttributeValues[":sk1"]).to.equal(
        "user#tyler.walch#accountid#acct_059",
      );
    }

    one();
    two();
  });

  it("should validate partition key template string compatibility", () => {
    const tasks = new Entity(
      {
        model: {
          entity: "tasks",
          version: "1",
          service: "taskapp",
        },
        attributes: {
          team: {
            type: "string",
            required: true,
          },
          task: {
            type: "string",
            required: true,
          },
          project: {
            type: "string",
            required: true,
          },
          user: {
            type: "string",
            required: true,
          },
          title: {
            type: "string",
            required: true,
          },
          description: {
            type: "string",
          },
          status: {
            // use an array to type an enum
            type: ["open", "in-progress", "on-hold", "closed"] as const,
            default: "open",
          },
        },
        indexes: {
          projects: {
            pk: {
              field: "pk",
              composite: ["team"],
            },
            sk: {
              field: "sk",
              // create composite keys for partial sort key queries
              composite: ["project", "task"],
            },
          },
          assigned: {
            // collections allow for queries across multiple entities
            collection: "assignments",
            index: "gsi1pk-gsi1sk-index",
            pk: {
              // map to your GSI Hash/Partition key
              field: "gsi1pk",
              composite: ["user"],
            },
            sk: {
              // map to your GSI Range/Sort key
              field: "gsi1sk",
              composite: ["status"],
            },
          },
        },
      },
      { table, client },
    );

    /* Users Entity */
    const users = new Entity(
      {
        model: {
          entity: "user",
          service: "taskapp",
          version: "1",
        },
        attributes: {
          team: {
            type: "string",
          },
          user: {
            type: "string",
          },
          role: {
            type: ["dev", "senior", "staff", "principal"] as const,
            set: (title: string) => {
              // save as index for comparison
              return ["dev", "senior", "staff", "principal"].indexOf(title);
            },
            get: (index: number) => {
              return ["dev", "senior", "staff", "principal"][index] || "other";
            },
          },
          manager: {
            type: "string",
          },
          firstName: {
            type: "string",
          },
          lastName: {
            type: "string",
          },
        },
        indexes: {
          members: {
            collection: "organization",
            pk: {
              composite: ["team"],
              field: "pk",
            },
            sk: {
              composite: ["user"],
              field: "sk",
            },
          },
          user: {
            collection: "assignments",
            index: "gsi1pk-gsi1sk-index",
            pk: {
              composite: ["user"],
              field: "gsi1pk",
              template: "USER#${user}",
            },
            sk: {
              field: "gsi1sk",
              composite: [],
            },
          },
        },
      },
      { table, client },
    );

    expect(() => new Service({ tasks, users })).to.throw(
      'Validation Error while joining entity, "users". The usage of key templates the partition key on index gsi1pk-gsi1sk-index must be consistent across all Entities, some entities provided use template while others do not; Partition Key composite attributes provided for index "gsi1pk-gsi1sk-index" contain conflicting composite attribute labels for established composite attribute "user" on established index "gsi1pk-gsi1sk-index". Established composite attribute "user" on established index "gsi1pk-gsi1sk-index" was defined with label "user" while provided composite attribute "user" on provided index "gsi1pk-gsi1sk-index" is defined with label "USER#". Composite attribute labels definitions must match between all members of a collection to ensure key structures will resolve to identical Partition Keys. Please ensure these labels definitions are identical for all entities associated with this service. - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#join',
    );
    expect(() => new Service({ users, tasks })).to.throw(
      'Validation Error while joining entity, "tasks". The usage of key templates the partition key on index gsi1pk-gsi1sk-index must be consistent across all Entities, some entities provided use template while others do not; Partition Key composite attributes provided for index "gsi1pk-gsi1sk-index" contain conflicting composite attribute labels for established composite attribute "user" on established index "gsi1pk-gsi1sk-index". Established composite attribute "user" on established index "gsi1pk-gsi1sk-index" was defined with label "USER#" while provided composite attribute "user" on provided index "gsi1pk-gsi1sk-index" is defined with label "user". Composite attribute labels definitions must match between all members of a collection to ensure key structures will resolve to identical Partition Keys. Please ensure these labels definitions are identical for all entities associated with this service. - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#join',
    );
  });

  it("should validate partition key template string compatibility when pk has postfix", () => {
    const tasks = new Entity(
      {
        model: {
          entity: "tasks",
          version: "1",
          service: "taskapp",
        },
        attributes: {
          team: {
            type: "string",
            required: true,
          },
          task: {
            type: "string",
            required: true,
          },
          project: {
            type: "string",
            required: true,
          },
          user: {
            type: "string",
            required: true,
          },
          title: {
            type: "string",
            required: true,
          },
          description: {
            type: "string",
          },
          status: {
            // use an array to type an enum
            type: ["open", "in-progress", "on-hold", "closed"] as const,
            default: "open",
          },
        },
        indexes: {
          projects: {
            pk: {
              field: "pk",
              composite: ["team"],
            },
            sk: {
              field: "sk",
              // create composite keys for partial sort key queries
              composite: ["project", "task"],
            },
          },
          assigned: {
            // collections allow for queries across multiple entities
            collection: "assignments",
            index: "gsi1pk-gsi1sk-index",
            pk: {
              // map to your GSI Hash/Partition key
              field: "gsi1pk",
              composite: ["user"],
              template: "USER_START#${user}",
            },
            sk: {
              // map to your GSI Range/Sort key
              field: "gsi1sk",
              composite: ["status"],
            },
          },
        },
      },
      { table, client },
    );

    /* Users Entity */
    const users = new Entity(
      {
        model: {
          entity: "user",
          service: "taskapp",
          version: "1",
        },
        attributes: {
          team: {
            type: "string",
          },
          user: {
            type: "string",
          },
          role: {
            type: ["dev", "senior", "staff", "principal"] as const,
            set: (title: string) => {
              // save as index for comparison
              return ["dev", "senior", "staff", "principal"].indexOf(title);
            },
            get: (index: number) => {
              return ["dev", "senior", "staff", "principal"][index] || "other";
            },
          },
          manager: {
            type: "string",
          },
          firstName: {
            type: "string",
          },
          lastName: {
            type: "string",
          },
        },
        indexes: {
          members: {
            collection: "organization",
            pk: {
              composite: ["team"],
              field: "pk",
            },
            sk: {
              composite: ["user"],
              field: "sk",
            },
          },
          user: {
            collection: "assignments",
            index: "gsi1pk-gsi1sk-index",
            pk: {
              composite: ["user"],
              field: "gsi1pk",
              template: "USER_START#${user}#USER_END",
            },
            sk: {
              field: "gsi1sk",
              composite: [],
            },
          },
        },
      },
      { table, client },
    );

    expect(() => new Service({ tasks, users })).to.throw(
      'Validation Error while joining entity, "users". Partition Key composite attributes provided for index "gsi1pk-gsi1sk-index" contain conflicting composite attribute labels for established composite attribute "" on established index "gsi1pk-gsi1sk-index". Established composite attribute "" on established index "gsi1pk-gsi1sk-index" was defined with label "undefined" while provided composite attribute "" on provided index "gsi1pk-gsi1sk-index" is defined with label "#USER_END". Composite attribute labels definitions must match between all members of a collection to ensure key structures will resolve to identical Partition Keys. Please ensure these labels definitions are identical for all entities associated with this service. - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#join',
    );
    expect(() => new Service({ users, tasks })).to.throw(
      'Validation Error while joining entity, "tasks". Partition Key composite attributes provided for index "gsi1pk-gsi1sk-index" contain conflicting composite attribute labels for established composite attribute "" on established index "gsi1pk-gsi1sk-index". Established composite attribute "" on established index "gsi1pk-gsi1sk-index" was defined with label "#USER_END" while provided composite attribute "" on provided index "gsi1pk-gsi1sk-index" is defined with label "undefined". Composite attribute labels definitions must match between all members of a collection to ensure key structures will resolve to identical Partition Keys. Please ensure these labels definitions are identical for all entities associated with this service. - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#join',
    );
  });

  it("should allow compatible partition key templates", () => {
    const tasks = new Entity(
      {
        model: {
          entity: "tasks",
          version: "1",
          service: "taskapp",
        },
        attributes: {
          team: {
            type: "string",
            required: true,
          },
          task: {
            type: "string",
            required: true,
          },
          project: {
            type: "string",
            required: true,
          },
          user: {
            type: "string",
            required: true,
          },
          title: {
            type: "string",
            required: true,
          },
          description: {
            type: "string",
          },
          status: {
            // use an array to type an enum
            type: ["open", "in-progress", "on-hold", "closed"] as const,
            default: "open",
          },
        },
        indexes: {
          projects: {
            pk: {
              field: "pk",
              composite: ["team"],
            },
            sk: {
              field: "sk",
              // create composite keys for partial sort key queries
              composite: ["project", "task"],
            },
          },
          assigned: {
            // collections allow for queries across multiple entities
            collection: "assignments",
            index: "gsi1pk-gsi1sk-index",
            pk: {
              // map to your GSI Hash/Partition key
              field: "gsi1pk",
              composite: ["user"],
              template: "USER#${user}",
            },
            sk: {
              // map to your GSI Range/Sort key
              field: "gsi1sk",
              composite: ["status"],
            },
          },
        },
      },
      { table, client },
    );

    /* Users Entity */
    const users = new Entity(
      {
        model: {
          entity: "user",
          service: "taskapp",
          version: "1",
        },
        attributes: {
          team: {
            type: "string",
          },
          user: {
            type: "string",
          },
          role: {
            type: ["dev", "senior", "staff", "principal"] as const,
            set: (title: string) => {
              // save as index for comparison
              return ["dev", "senior", "staff", "principal"].indexOf(title);
            },
            get: (index: number) => {
              return ["dev", "senior", "staff", "principal"][index] || "other";
            },
          },
          manager: {
            type: "string",
          },
          firstName: {
            type: "string",
          },
          lastName: {
            type: "string",
          },
        },
        indexes: {
          members: {
            collection: "organization",
            pk: {
              composite: ["team"],
              field: "pk",
            },
            sk: {
              composite: ["user"],
              field: "sk",
            },
          },
          user: {
            collection: "assignments",
            index: "gsi1pk-gsi1sk-index",
            pk: {
              composite: ["user"],
              field: "gsi1pk",
              template: "USER#${user}",
            },
            sk: {
              field: "gsi1sk",
              composite: [],
            },
          },
        },
      },
      { table, client },
    );

    function one() {
      const service = new Service({ tasks, users });
      const params = service.collections
        .assignments({ user: "tyler.walch" })
        .params();
      expect(params.ExpressionAttributeValues[":pk"]).to.equal(
        "user#tyler.walch",
      );
    }

    function two() {
      const service = new Service({ users, tasks });
      const params = service.collections
        .assignments({ user: "tyler.walch" })
        .params();
      expect(params.ExpressionAttributeValues[":pk"]).to.equal(
        "user#tyler.walch",
      );
    }

    one();
    two();
  });

  it("should allow compatible partition key templates with postfix", () => {
    const tasks = new Entity(
      {
        model: {
          entity: "tasks",
          version: "1",
          service: "taskapp",
        },
        attributes: {
          team: {
            type: "string",
            required: true,
          },
          task: {
            type: "string",
            required: true,
          },
          project: {
            type: "string",
            required: true,
          },
          user: {
            type: "string",
            required: true,
          },
          title: {
            type: "string",
            required: true,
          },
          description: {
            type: "string",
          },
          status: {
            // use an array to type an enum
            type: ["open", "in-progress", "on-hold", "closed"] as const,
            default: "open",
          },
        },
        indexes: {
          projects: {
            pk: {
              field: "pk",
              composite: ["team"],
            },
            sk: {
              field: "sk",
              // create composite keys for partial sort key queries
              composite: ["project", "task"],
            },
          },
          assigned: {
            // collections allow for queries across multiple entities
            collection: "assignments",
            index: "gsi1pk-gsi1sk-index",
            pk: {
              // map to your GSI Hash/Partition key
              field: "gsi1pk",
              composite: ["user"],
              template: "USER#${user}#USER",
            },
            sk: {
              // map to your GSI Range/Sort key
              field: "gsi1sk",
              composite: ["status"],
            },
          },
        },
      },
      { table, client },
    );

    /* Users Entity */
    const users = new Entity(
      {
        model: {
          entity: "user",
          service: "taskapp",
          version: "1",
        },
        attributes: {
          team: {
            type: "string",
          },
          user: {
            type: "string",
          },
          role: {
            type: ["dev", "senior", "staff", "principal"] as const,
            set: (title: string) => {
              // save as index for comparison
              return ["dev", "senior", "staff", "principal"].indexOf(title);
            },
            get: (index: number) => {
              return ["dev", "senior", "staff", "principal"][index] || "other";
            },
          },
          manager: {
            type: "string",
          },
          firstName: {
            type: "string",
          },
          lastName: {
            type: "string",
          },
        },
        indexes: {
          members: {
            collection: "organization",
            pk: {
              composite: ["team"],
              field: "pk",
            },
            sk: {
              composite: ["user"],
              field: "sk",
            },
          },
          user: {
            collection: "assignments",
            index: "gsi1pk-gsi1sk-index",
            pk: {
              composite: ["user"],
              field: "gsi1pk",
              template: "USER#${user}#USER",
            },
            sk: {
              field: "gsi1sk",
              composite: [],
            },
          },
        },
      },
      { table, client },
    );

    function one() {
      const service = new Service({ tasks, users });
      const params = service.collections
        .assignments({ user: "tyler.walch" })
        .params();
      expect(params.ExpressionAttributeValues[":pk"]).to.equal(
        "user#tyler.walch#user",
      );
    }
    function two() {
      const service = new Service({ users, tasks });
      const params = service.collections
        .assignments({ user: "tyler.walch" })
        .params();
      expect(params.ExpressionAttributeValues[":pk"]).to.equal(
        "user#tyler.walch#user",
      );
    }

    one();
    two();
  });
});

describe('scope compatibility', () => {
  const entity1 = new Entity(
      {
        model: {
          entity: "entity1",
          service: 'test',
          version: "1",
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
          }
        },
        indexes: {
          test: {
            collection: 'testing',
            scope: 'subtest',
            pk: {
              field: "pk",
              composite: ["prop1"],
            },
            sk: {
              field: "sk",
              composite: ["prop2"],
            },
          },
        },
      },
      { table: "electro", client }
  );

  const entity2 = new Entity(
      {
        model: {
          entity: "entity2",
          service: 'test',
          version: "1",
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
          }
        },
        indexes: {
          test: {
            collection: 'testing',
            scope: 'subtestz',
            pk: {
              field: "pk",
              composite: ["prop1"],
            },
            sk: {
              field: "sk",
              composite: ["prop2"],
            },
          },
        },
      },
      { table: "electro", client }
  );

  const entity3 = new Entity(
      {
        model: {
          entity: "entity3",
          service: 'test',
          version: "1",
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
          }
        },
        indexes: {
          test: {
            collection: 'testing',
            scope: 'subtest',
            pk: {
              field: "pk",
              composite: ["prop1"],
            },
            sk: {
              field: "sk",
              composite: ["prop2"],
            },
          },
        },
      },
      { table: "electro", client }
  );

  it('should throw an error when scopes are not compatible between collection members', () => {
    let result: any = null;
    let threw = false;
    try {
      new Service({ entity1, entity2 });
    } catch(err) {
      threw = true;
      result = err;
    }

    expect(threw).to.be.true;
    expect(result.message).to.equal(`Validation Error while joining entity, "entity2". The index scope value provided "subtestz" does not match established index scope value "subtest" on index "(Primary Index)". Index scope options must match across all entities participating in a collection - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#join`)
  });

  it('should not throw when scopes are compatible between collection members', () => {
    let result: any = null;
    let threw = false;
    try {
      new Service({ entity1, entity3 });
    } catch(err) {
      threw = true;
      result = err;
    }

    expect(threw).to.be.false;
    expect(result).to.be.null;
  });

  it('should query when scopes are compatible between collection members', async () => {
    const service = new Service({ entity1, entity3 });
    const prop1 = uuid();
    const prop2 = uuid();
    const record1 = {
      prop1,
      prop2,
      prop3: uuid(),
    };

    const record2 = {
      prop1,
      prop2,
      prop3: uuid(),
    };

    const record3 = {
      prop1,
      prop2,
      prop3: uuid(),
    };

    await Promise.all([
        entity1.put(record1).go(),
        entity2.put(record2).go(),
        entity3.put(record3).go(),
    ]);

    const params = service.collections.testing({ prop1 }).params();
    expect(params.ExpressionAttributeValues[':pk']).to.equal(`$test_subtest#prop1_${prop1}`);

    const collectionResponse = await service.collections.testing({ prop1 }).go();
    expect(collectionResponse.data).to.deep.equal({
        entity1: [record1],
        entity3: [record3],
    });

    const entity2Params = entity2.query.test({ prop1 }).params();
    expect(entity2Params.ExpressionAttributeValues[':pk']).to.equal(`$test_subtestz#prop1_${prop1}`);

    const entity2Response = await entity2.query.test({ prop1 }).go();

    expect(entity2Response.data.length).to.equal(1);
    expect(entity2Response.data[0]).to.deep.equal(record2);
  })
});
