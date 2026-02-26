const sleep = async (ms) => new Promise((resolve) => setTimeout(resolve, ms));
process.env.AWS_NODEJS_CONNECTION_REUSE_ENABLED = 1;
const { Entity } = require("../src/entity");
const { Service } = require("../src/service");
const { expect } = require("chai");
const uuid = require("uuid").v4;
const DynamoDB = require("aws-sdk/clients/dynamodb");
const table = "electro";

const client = new DynamoDB.DocumentClient({
  region: "us-east-1",
  endpoint: process.env.LOCAL_DYNAMO_ENDPOINT ?? "http://localhost:8000",
  credentials: {
    accessKeyId: "test",
    secretAccessKey: "test",
  },
});

let modelOne = {
  entity: "entityOne",
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
    prop4: {
      type: "string",
    },
    prop5: {
      type: "string",
    },
    prop6: {
      type: "string",
    },
    prop7: {
      type: "string",
    },
    prop8: {
      type: "string",
    },
    prop9: {
      type: "string",
    },
  },
  indexes: {
    index1: {
      pk: {
        field: "pk",
        facets: ["prop1"],
      },
      sk: {
        field: "sk",
        facets: ["prop2", "prop3"],
      },
      collection: "collectionA",
    },
    index2: {
      pk: {
        field: "gsi1pk",
        facets: ["prop3"],
      },
      sk: {
        field: "gsi1sk",
        facets: ["prop4", "prop5"],
      },
      collection: "collectionB",
      index: "gsi1pk-gsi1sk-index",
    },
    index3: {
      pk: {
        field: "gsi2pk",
        facets: ["prop5"],
      },
      sk: {
        field: "gsi2sk",
        facets: ["prop6", "prop7"],
      },
      collection: "collectionC",
      index: "gsi2pk-gsi2sk-index",
    },
    index4: {
      pk: {
        field: "gsi3pk",
        facets: ["prop7"],
      },
      sk: {
        field: "gsi3sk",
        facets: ["prop8", "prop9"],
      },
      collection: "collectionD",
      index: "gsi3pk-gsi3sk-index",
    },
  },
};

let modelTwo = {
  entity: "entityTwo",
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
    prop4: {
      type: "string",
    },
    prop5: {
      type: "string",
    },
    prop6: {
      type: "string",
    },
    prop7: {
      type: "string",
    },
    prop8: {
      type: "string",
    },
    prop9: {
      type: "string",
    },
  },
  indexes: {
    index1: {
      pk: {
        field: "pk",
        facets: ["prop1"],
      },
      sk: {
        field: "sk",
        facets: ["prop2", "prop3"],
      },
      collection: "collectionE",
    },
    index2: {
      pk: {
        field: "gsi1pk",
        facets: ["prop3"],
      },
      sk: {
        field: "gsi1sk",
        facets: ["prop4", "prop5"],
      },
      collection: "collectionB",
      index: "gsi1pk-gsi1sk-index",
    },
    index3: {
      pk: {
        field: "gsi2pk",
        facets: ["prop5"],
      },
      sk: {
        field: "gsi2sk",
        facets: ["prop6", "prop7"],
      },
      collection: "collectionF",
      index: "gsi2pk-gsi2sk-index",
    },
    index4: {
      pk: {
        field: "gsi3pk",
        facets: ["prop7"],
      },
      sk: {
        field: "gsi3sk",
        facets: ["prop8", "prop9"],
      },
      collection: "collectionG",
      index: "gsi3pk-gsi3sk-index",
    },
  },
};

let modelThree = {
  entity: "entityThree",
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
    prop4: {
      type: "string",
    },
    prop5: {
      type: "string",
    },
    prop6: {
      type: "string",
    },
    prop7: {
      type: "string",
    },
    prop8: {
      type: "string",
    },
    prop9: {
      type: "string",
    },
  },
  indexes: {
    index1: {
      pk: {
        field: "pk",
        facets: ["prop1"],
      },
      sk: {
        field: "sk",
        facets: ["prop2", "prop3"],
      },
      collection: "collectionE",
    },
    index2: {
      pk: {
        field: "gsi1pk",
        facets: ["prop3"],
      },
      sk: {
        field: "gsi1sk",
        facets: ["prop4", "prop5"],
      },
      collection: "collectionB",
      index: "gsi1pk-gsi1sk-index",
    },
    index3: {
      pk: {
        field: "gsi2pk",
        facets: ["prop5"],
      },
      sk: {
        field: "gsi2sk",
        facets: ["prop6", "prop7"],
      },
      collection: "collectionF",
      index: "gsi2pk-gsi2sk-index",
    },
    index4: {
      pk: {
        field: "gsi3pk",
        facets: ["prop7"],
      },
      sk: {
        field: "gsi3sk",
        facets: ["prop8", "prop9"],
      },
      collection: "collectionD",
      index: "gsi3pk-gsi3sk-index",
    },
  },
};

let database = new Service(
  {
    table,
    version: "1",
    service: "electrotest",
  },
  { client },
);

database.join(modelOne);
database.join(modelTwo);
database.join(modelThree);

describe("Service Connected", () => {
  before(async () => sleep(1000));
  it("Should add three records and retrieve correct records based on collections", async () => {
    let prop1 = uuid();
    let recordOne = {
      prop1: prop1,
      prop2: "prop2-one",
      prop3: "prop3",
      prop4: "prop4-one",
      prop5: "prop5",
      prop6: "prop6-one",
      prop7: "prop7",
      prop8: "prop8-one",
      prop9: "prop9-one",
    };
    let addOne = database.entities.entityOne
      .put(recordOne)
      .go()
      .then((res) => res.data);
    let paramsOne = database.entities.entityOne.put(recordOne).params();
    expect(paramsOne).to.deep.equal({
      Item: {
        prop1: prop1,
        prop2: "prop2-one",
        prop3: "prop3",
        prop4: "prop4-one",
        prop5: "prop5",
        prop6: "prop6-one",
        prop7: "prop7",
        prop8: "prop8-one",
        prop9: "prop9-one",
        pk: `$electrotest_1#prop1_${recordOne.prop1}`,
        sk: "$collectiona#entityone#prop2_prop2-one#prop3_prop3",
        gsi1pk: "$electrotest_1#prop3_prop3",
        gsi1sk: "$collectionb#entityone#prop4_prop4-one#prop5_prop5",
        gsi2pk: "$electrotest_1#prop5_prop5",
        gsi2sk: "$collectionc#entityone#prop6_prop6-one#prop7_prop7",
        gsi3pk: "$electrotest_1#prop7_prop7",
        gsi3sk: "$collectiond#entityone#prop8_prop8-one#prop9_prop9-one",
        __edb_e__: "entityOne",
        __edb_v__: "1",
      },
      TableName: "electro",
    });
    let recordTwo = {
      prop1: prop1,
      prop2: "prop2-two",
      prop3: "prop3",
      prop4: "prop4-two",
      prop5: "prop5",
      prop6: "prop6-two",
      prop7: "prop7",
      prop8: "prop8-two",
      prop9: "prop9-two",
    };
    let addTwo = database.entities.entityTwo
      .put(recordTwo)
      .go()
      .then((res) => res.data);
    let paramsTwo = database.entities.entityTwo.put(recordTwo).params();
    expect(paramsTwo).to.deep.equal({
      Item: {
        prop1: prop1,
        prop2: "prop2-two",
        prop3: "prop3",
        prop4: "prop4-two",
        prop5: "prop5",
        prop6: "prop6-two",
        prop7: "prop7",
        prop8: "prop8-two",
        prop9: "prop9-two",
        pk: `$electrotest_1#prop1_${prop1}`,
        sk: "$collectione#entitytwo#prop2_prop2-two#prop3_prop3",
        gsi1pk: "$electrotest_1#prop3_prop3",
        gsi1sk: "$collectionb#entitytwo#prop4_prop4-two#prop5_prop5",
        gsi2pk: "$electrotest_1#prop5_prop5",
        gsi2sk: "$collectionf#entitytwo#prop6_prop6-two#prop7_prop7",
        gsi3pk: "$electrotest_1#prop7_prop7",
        gsi3sk: "$collectiong#entitytwo#prop8_prop8-two#prop9_prop9-two",
        __edb_e__: "entityTwo",
        __edb_v__: "1",
      },
      TableName: "electro",
    });
    let recordThree = {
      prop1: prop1,
      prop2: "prop2-three",
      prop3: "prop3",
      prop4: "prop4-three",
      prop5: "prop5",
      prop6: "prop6-three",
      prop7: "prop7",
      prop8: "prop8-three",
      prop9: "prop9-three",
    };
    let addThree = database.entities.entityThree
      .put(recordThree)
      .go()
      .then((res) => res.data);
    let paramsThree = database.entities.entityThree.put(recordThree).params();
    expect(paramsThree).to.deep.equal({
      Item: {
        prop1: prop1,
        prop2: "prop2-three",
        prop3: "prop3",
        prop4: "prop4-three",
        prop5: "prop5",
        prop6: "prop6-three",
        prop7: "prop7",
        prop8: "prop8-three",
        prop9: "prop9-three",
        pk: `$electrotest_1#prop1_${prop1}`,
        sk: "$collectione#entitythree#prop2_prop2-three#prop3_prop3",
        gsi1pk: "$electrotest_1#prop3_prop3",
        gsi1sk: "$collectionb#entitythree#prop4_prop4-three#prop5_prop5",
        gsi2pk: "$electrotest_1#prop5_prop5",
        gsi2sk: "$collectionf#entitythree#prop6_prop6-three#prop7_prop7",
        gsi3pk: "$electrotest_1#prop7_prop7",
        gsi3sk: "$collectiond#entitythree#prop8_prop8-three#prop9_prop9-three",
        __edb_e__: "entityThree",
        __edb_v__: "1",
      },
      TableName: "electro",
    });
    await Promise.all([addOne, addTwo, addThree]);
    // let prop1 = "prop1";
    let prop3 = "prop3";
    let prop5 = "prop5";
    let prop7 = "prop7";
    let getCollectionA = database.collections
      .collectionA({ prop1 })
      .go()
      .then((res) => res.data);
    let getCollectionB = database.collections
      .collectionB({ prop3 })
      .go()
      .then((res) => res.data);
    let getCollectionC = database.collections
      .collectionC({ prop5 })
      .go()
      .then((res) => res.data);
    let getCollectionD = database.collections
      .collectionD({ prop7 })
      .go()
      .then((res) => res.data);
    let getCollectionE = database.collections
      .collectionE({ prop1 })
      .go()
      .then((res) => res.data);
    let getCollectionF = database.collections
      .collectionF({ prop5 })
      .go()
      .then((res) => res.data);
    let getCollectionG = database.collections
      .collectionG({ prop7 })
      .go()
      .then((res) => res.data);
    let [
      collectionA,
      collectionB,
      collectionC,
      collectionD,
      collectionE,
      collectionF,
      collectionG,
    ] = await Promise.all([
      getCollectionA,
      getCollectionB,
      getCollectionC,
      getCollectionD,
      getCollectionE,
      getCollectionF,
      getCollectionG,
    ]);

    expect(collectionA).to.deep.equal({ entityOne: [recordOne] });

    expect(collectionB).to.deep.equal({
      entityOne: [
        {
          prop8: "prop8-one",
          prop9: "prop9-one",
          prop4: "prop4-one",
          prop5: "prop5",
          prop6: "prop6-one",
          prop7: "prop7",
          prop1: prop1,
          prop2: "prop2-one",
          prop3: "prop3",
        },
      ],
      entityThree: [
        {
          prop8: "prop8-three",
          prop9: "prop9-three",
          prop4: "prop4-three",
          prop5: "prop5",
          prop6: "prop6-three",
          prop7: "prop7",
          prop1: prop1,
          prop2: "prop2-three",
          prop3: "prop3",
        },
      ],
      entityTwo: [
        {
          prop8: "prop8-two",
          prop9: "prop9-two",
          prop4: "prop4-two",
          prop5: "prop5",
          prop6: "prop6-two",
          prop7: "prop7",
          prop1: prop1,
          prop2: "prop2-two",
          prop3: "prop3",
        },
      ],
    });

    expect(collectionC).to.deep.equal({
      entityOne: [recordOne],
    });

    expect(collectionD).to.deep.equal({
      entityOne: [recordOne],
      entityThree: [recordThree],
    });

    expect(collectionE).to.deep.equal({
      entityTwo: [recordTwo],
      entityThree: [recordThree],
    });

    expect(collectionF).to.deep.equal({
      entityTwo: [recordTwo],
      entityThree: [recordThree],
    });

    expect(collectionG).to.deep.equal({
      entityTwo: [recordTwo],
    });
  }).timeout(10000);
});

describe("Entities with custom identifiers and versions", () => {
  let modelOne = {
    model: {
      entity: "entityOne",
      service: "myservice",
      version: "1",
    },
    attributes: {
      uniqueToModelOne: {
        type: "string",
      },
      prop1: {
        type: "string",
      },
      prop2: {
        type: "string",
      },
      prop3: {
        type: "string",
      },
      prop4: {
        type: "string",
      },
      prop5: {
        type: "string",
      },
      prop6: {
        type: "string",
      },
      prop7: {
        type: "string",
      },
      prop8: {
        type: "string",
      },
      prop9: {
        type: "string",
      },
    },
    indexes: {
      index1: {
        pk: {
          field: "pk",
          facets: ["prop1"],
        },
        sk: {
          field: "sk",
          facets: ["prop2", "prop3"],
        },
        collection: "collectionA",
      },
      index2: {
        pk: {
          field: "gsi1pk",
          facets: ["prop3"],
        },
        sk: {
          field: "gsi1sk",
          facets: ["prop4", "prop5"],
        },
        collection: "collectionB",
        index: "gsi1pk-gsi1sk-index",
      },
      index3: {
        pk: {
          field: "gsi2pk",
          facets: ["prop5"],
        },
        sk: {
          field: "gsi2sk",
          facets: ["prop6", "prop7"],
        },
        collection: "collectionC",
        index: "gsi2pk-gsi2sk-index",
      },
      index4: {
        pk: {
          field: "gsi3pk",
          facets: ["prop7"],
        },
        sk: {
          field: "gsi3sk",
          facets: ["prop8", "prop9"],
        },
        collection: "collectionD",
        index: "gsi3pk-gsi3sk-index",
      },
    },
  };

  let modelTwo = {
    model: {
      entity: "entityTwo",
      service: "myservice",
      version: "1",
    },
    attributes: {
      uniqueToModelTwo: {
        type: "string",
      },
      prop1: {
        type: "string",
      },
      prop2: {
        type: "string",
      },
      prop3: {
        type: "string",
      },
      prop4: {
        type: "string",
      },
      prop5: {
        type: "string",
      },
      prop6: {
        type: "string",
      },
      prop7: {
        type: "string",
      },
      prop8: {
        type: "string",
      },
      prop9: {
        type: "string",
      },
    },
    indexes: {
      index1: {
        pk: {
          field: "pk",
          facets: ["prop1"],
        },
        sk: {
          field: "sk",
          facets: ["prop2", "prop3"],
        },
        collection: "collectionE",
      },
      index2: {
        pk: {
          field: "gsi1pk",
          facets: ["prop3"],
        },
        sk: {
          field: "gsi1sk",
          facets: ["prop4", "prop5"],
        },
        collection: "collectionB",
        index: "gsi1pk-gsi1sk-index",
      },
      index3: {
        pk: {
          field: "gsi2pk",
          facets: ["prop5"],
        },
        sk: {
          field: "gsi2sk",
          facets: ["prop6", "prop7"],
        },
        collection: "collectionF",
        index: "gsi2pk-gsi2sk-index",
      },
      index4: {
        pk: {
          field: "gsi3pk",
          facets: ["prop7"],
        },
        sk: {
          field: "gsi3sk",
          facets: ["prop8", "prop9"],
        },
        collection: "collectionG",
        index: "gsi3pk-gsi3sk-index",
      },
    },
  };

  let modelThree = {
    model: {
      entity: "entityThree",
      service: "myservice",
      version: "1",
    },
    attributes: {
      uniqueToModelThree: {
        type: "string",
      },
      prop1: {
        type: "string",
      },
      prop2: {
        type: "string",
      },
      prop3: {
        type: "string",
      },
      prop4: {
        type: "string",
      },
      prop5: {
        type: "string",
      },
      prop6: {
        type: "string",
      },
      prop7: {
        type: "string",
      },
      prop8: {
        type: "string",
      },
      prop9: {
        type: "string",
      },
    },
    indexes: {
      index1: {
        pk: {
          field: "pk",
          facets: ["prop1"],
        },
        sk: {
          field: "sk",
          facets: ["prop2", "prop3"],
        },
        collection: "collectionE",
      },
      index2: {
        pk: {
          field: "gsi1pk",
          facets: ["prop3"],
        },
        sk: {
          field: "gsi1sk",
          facets: ["prop4", "prop5"],
        },
        collection: "collectionB",
        index: "gsi1pk-gsi1sk-index",
      },
      index3: {
        pk: {
          field: "gsi2pk",
          facets: ["prop5"],
        },
        sk: {
          field: "gsi2sk",
          facets: ["prop6", "prop7"],
        },
        collection: "collectionF",
        index: "gsi2pk-gsi2sk-index",
      },
      index4: {
        pk: {
          field: "gsi3pk",
          facets: ["prop7"],
        },
        sk: {
          field: "gsi3sk",
          facets: ["prop8", "prop9"],
        },
        collection: "collectionD",
        index: "gsi3pk-gsi3sk-index",
      },
    },
  };

  let modelThreeV2 = {
    model: {
      entity: "entityThree",
      service: "myservice",
      version: "2",
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
      prop4: {
        type: "string",
      },
      prop5: {
        type: "string",
      },
      prop6: {
        type: "string",
      },
      prop7: {
        type: "string",
      },
      prop8: {
        type: "string",
      },
      prop9: {
        type: "string",
      },
    },
    indexes: {
      index1: {
        pk: {
          field: "pk",
          facets: ["prop1"],
        },
        sk: {
          field: "sk",
          facets: ["prop2", "prop3"],
        },
        collection: "collectionE",
      },
      index2: {
        pk: {
          field: "gsi1pk",
          facets: ["prop3"],
        },
        sk: {
          field: "gsi1sk",
          facets: ["prop4", "prop5"],
        },
        collection: "collectionB",
        index: "gsi1pk-gsi1sk-index",
      },
      index3: {
        pk: {
          field: "gsi2pk",
          facets: ["prop5"],
        },
        sk: {
          field: "gsi2sk",
          facets: ["prop6", "prop7"],
        },
        collection: "collectionF",
        index: "gsi2pk-gsi2sk-index",
      },
      index4: {
        pk: {
          field: "gsi3pk",
          facets: ["prop7"],
        },
        sk: {
          field: "gsi3sk",
          facets: ["prop8", "prop9"],
        },
        collection: "collectionD",
        index: "gsi3pk-gsi3sk-index",
      },
    },
  };

  it("Raw collection query should return query as returned by DynamoDB Client", async () => {
    let entityOne = new Entity(modelOne);
    let entityTwo = new Entity(modelTwo);
    let entityThree = new Entity(modelThree);
    let entityThreeV2 = new Entity(modelThreeV2);
    let service = new Service(
      {
        entityOne,
        entityTwo,
        entityThree,
        entityThreeV2,
      },
      { table, client },
    );
    let prop1 = uuid();
    await entityOne
      .put({
        uniqueToModelOne: "uniqueToModelOneValue",
        prop1: prop1,
        prop2: "prop2Value",
        prop3: "prop3Value",
        prop4: "prop4Value",
        prop5: "prop5Value",
        prop6: "prop6Value",
        prop7: "prop7Value",
        prop8: "prop8Value",
        prop9: "prop9Value",
      })
      .go()
      .then((res) => res.data);
    let collectionA = await service.collections
      .collectionA({ prop1 })
      .where(({ prop2 }, { eq }) => eq(prop2, "prop2Value"))
      .go({ data: 'raw' })
      .then((res) => res.data)
      .then((data) => ({ success: true, data }))
      .catch((err) => ({ success: false, err }));
    expect(collectionA.success).to.be.true;
    expect(collectionA.data).to.be.deep.equal({
      Items: [
        {
          gsi1sk: "$collectionb#entityone_1#prop4_prop4value#prop5_prop5value",
          gsi2sk: "$collectionc#entityone_1#prop6_prop6value#prop7_prop7value",
          gsi3sk: "$collectiond#entityone_1#prop8_prop8value#prop9_prop9value",
          gsi1pk: "$myservice#prop3_prop3value",
          prop9: "prop9Value",
          __edb_e__: "entityOne",
          prop8: "prop8Value",
          prop7: "prop7Value",
          prop6: "prop6Value",
          uniqueToModelOne: "uniqueToModelOneValue",
          prop5: "prop5Value",
          prop4: "prop4Value",
          prop3: "prop3Value",
          prop2: "prop2Value",
          prop1: prop1,
          sk: "$collectiona#entityone_1#prop2_prop2value#prop3_prop3value",
          gsi2pk: "$myservice#prop5_prop5value",
          gsi3pk: "$myservice#prop7_prop7value",
          __edb_v__: "1",
          pk: `$myservice#prop1_${prop1}`,
        },
      ],
      Count: 1,
      ScannedCount: 1,
    });
  });

  it("Should be able to differentiate between models with otherwise identical attribute schemas", async () => {
    let entityOne = new Entity(modelOne);
    let entityTwo = new Entity(modelTwo);
    let entityThree = new Entity(modelThree);
    let entityThreeV2 = new Entity(modelThreeV2);
    entityOne.setIdentifier("entity", "__e");
    entityOne.setIdentifier("version", "__v");
    entityThreeV2.setIdentifier("entity", "e");

    let service = new Service(
      {
        entityOne,
        entityTwo,
        entityThree,
        entityThreeV2,
      },
      { table, client },
    );

    let prop1 = uuid();
    let prop3 = uuid();

    entityOne
      .put({
        uniqueToModelOne: "uniqueToModelOneValue",
        prop1: prop1,
        prop2: "prop2Value",
        prop3: prop3,
        prop4: "prop4Value",
        prop5: "prop5Value",
        prop6: "prop6Value",
        prop7: "prop7Value",
        prop8: "prop8Value",
        prop9: "prop9Value",
      })
      .go()
      .then((res) => res.data);

    await entityThree
      .put({
        uniqueToModelTwo: "uniqueToModelTwoValue",
        prop1: prop1,
        prop2: "prop2Value",
        prop3: prop3,
        prop4: "prop4Value",
        prop5: "prop5Value",
        prop6: "prop6Value",
        prop7: "prop7Value",
        prop8: "prop8Value",
        prop9: "prop9ValueV1",
      })
      .go()
      .then((res) => res.data);

    await entityThreeV2
      .put({
        uniqueToModelTwo: "uniqueToModelTwoValue",
        prop1: prop1,
        prop2: "prop2Value",
        prop3: prop3,
        prop4: "prop4Value",
        prop5: "prop5Value",
        prop6: "prop6Value",
        prop7: "prop7Value",
        prop8: "prop8Value",
        prop9: "prop9ValueV2",
      })
      .go()
      .then((res) => res.data);

    let collectionA = await service.collections
      .collectionA({ prop1: prop1 })
      .where(({ prop2 }, { eq }) => eq(prop2, "prop2Value"))
      .go()
      .then((res) => res.data)
      .then((data) => ({ success: true, data }))
      .catch((err) => ({ success: false, err }));

    let collectionB = await service.collections
      .collectionB({ prop3: prop3 })
      .where(({ prop2 }, { eq }) => eq(prop2, "prop2Value"))
      .go()
      .then((res) => res.data)
      .then((data) => ({ success: true, data }))
      .catch((err) => ({ success: false, err }));

    let collectionB2 = await service.collections
      .collectionB({ prop3: prop3 })
      .go()
      .then((res) => res.data)
      .then((data) => ({ success: true, data }))
      .catch((err) => ({ success: false, err }));

    expect(collectionA.success).to.be.true;
    expect(collectionB.success).to.be.true;
    expect(collectionB2.success).to.be.true;

    expect(collectionA.data).to.be.deep.equal({
      entityOne: [
        {
          prop9: "prop9Value",
          prop8: "prop8Value",
          prop7: "prop7Value",
          prop6: "prop6Value",
          uniqueToModelOne: "uniqueToModelOneValue",
          prop5: "prop5Value",
          prop4: "prop4Value",
          prop3: prop3,
          prop2: "prop2Value",
          prop1: prop1,
        },
      ],
    });

    expect(collectionB.data).to.be.deep.equal({
      entityOne: [
        {
          prop9: "prop9Value",
          prop8: "prop8Value",
          prop7: "prop7Value",
          prop6: "prop6Value",
          uniqueToModelOne: "uniqueToModelOneValue",
          prop5: "prop5Value",
          prop4: "prop4Value",
          prop3: prop3,
          prop2: "prop2Value",
          prop1: prop1,
        },
      ],
      entityTwo: [],
      entityThree: [
        {
          prop9: "prop9ValueV1",
          prop8: "prop8Value",
          prop7: "prop7Value",
          prop6: "prop6Value",
          prop5: "prop5Value",
          prop4: "prop4Value",
          prop3: prop3,
          prop2: "prop2Value",
          prop1: prop1,
        },
      ],
      entityThreeV2: [
        {
          prop9: "prop9ValueV2",
          prop8: "prop8Value",
          prop7: "prop7Value",
          prop6: "prop6Value",
          prop5: "prop5Value",
          prop4: "prop4Value",
          prop3: prop3,
          prop2: "prop2Value",
          prop1: prop1,
        },
      ],
    });
    expect(collectionB2.data).to.be.deep.equal({
      entityOne: [
        {
          prop9: "prop9Value",
          prop8: "prop8Value",
          prop7: "prop7Value",
          prop6: "prop6Value",
          uniqueToModelOne: "uniqueToModelOneValue",
          prop5: "prop5Value",
          prop4: "prop4Value",
          prop3: prop3,
          prop2: "prop2Value",
          prop1: prop1,
        },
      ],
      entityTwo: [],
      entityThree: [
        {
          prop9: "prop9ValueV1",
          prop8: "prop8Value",
          prop7: "prop7Value",
          prop6: "prop6Value",
          prop5: "prop5Value",
          prop4: "prop4Value",
          prop3: prop3,
          prop2: "prop2Value",
          prop1: prop1,
        },
      ],
      entityThreeV2: [
        {
          prop9: "prop9ValueV2",
          prop8: "prop8Value",
          prop7: "prop7Value",
          prop6: "prop6Value",
          prop5: "prop5Value",
          prop4: "prop4Value",
          prop3: prop3,
          prop2: "prop2Value",
          prop1: prop1,
        },
      ],
    });
  });

  it("Should always include an array for each entity associated with a collection in a collection query response", async () => {
    let entityOne = new Entity(modelOne);
    let entityTwo = new Entity(modelTwo);
    let entityThree = new Entity(modelThree);
    let entityThreeV2 = new Entity(modelThreeV2);
    entityOne.setIdentifier("entity", "__e");
    entityOne.setIdentifier("version", "__v");

    let prop1 = uuid();
    let prop3 = uuid();

    let service = new Service(
      {
        entityOne,
        entityTwo,
        entityThree,
        entityThreeV2,
      },
      { table, client },
    );

    let collectionA = await service.collections
      .collectionA({ prop1 })
      .where(({ prop2 }, { eq }) => eq(prop2, "value2"))
      .go()
      .then((res) => res.data)
      .then((data) => {
        let success = true;
        return { data, success };
      })
      .catch((err) => {
        let success = false;
        return { err, success };
      });

    let collectionB = await service.collections
      .collectionB({ prop3 })
      .where(({ prop2 }, { eq }) => eq(prop2, "value2"))
      .go()
      .then((res) => res.data)
      .then((data) => {
        let success = true;
        return { data, success };
      })
      .catch((err) => {
        let success = false;
        return { err, success };
      });

    expect(collectionA.success).to.be.true;
    expect(collectionB.success).to.be.true;
    expect(collectionA.data).to.have.keys(["entityOne"]);
    expect(collectionA.data.entityOne).to.be.an("array").with.length(0);
    expect(collectionB.data).to.have.keys([
      "entityOne",
      "entityTwo",
      "entityThree",
      "entityThreeV2",
    ]);
    expect(collectionB.data.entityOne).to.be.an("array").with.length(0);
    expect(collectionB.data.entityTwo).to.be.an("array").with.length(0);
    expect(collectionB.data.entityThree).to.be.an("array").with.length(0);
    expect(collectionB.data.entityThreeV2).to.be.an("array").with.length(0);

    await entityOne
      .put({
        uniqueToModelOne: "uniqueToModelOneValue",
        prop1: prop1,
        prop2: "prop2Value",
        prop3: prop3,
        prop4: "prop4Value",
        prop5: "prop5Value",
        prop6: "prop6Value",
        prop7: "prop7Value",
        prop8: "prop8Value",
        prop9: "prop9Value",
      })
      .go()
      .then((res) => res.data);

    await entityTwo
      .put({
        uniqueToModelTwo: "uniqueToModelTwoValue",
        prop1: prop1,
        prop2: "prop2Value",
        prop3: prop3,
        prop4: "prop4Value",
        prop5: "prop5Value",
        prop6: "prop6Value",
        prop7: "prop7Value",
        prop8: "prop8Value",
        prop9: "prop9Value",
      })
      .go()
      .then((res) => res.data);

    let collectionAAfterPut = await service.collections
      .collectionA({ prop1 })
      .where(({ prop2 }, { eq }) => eq(prop2, "prop2Value"))
      .go()
      .then((res) => res.data)
      .then((data) => {
        let success = true;
        return { data, success };
      })
      .catch((err) => {
        let success = false;
        return { err, success };
      });

    let collectionBAfterPut = await service.collections
      .collectionB({ prop3: prop3 })
      .where(({ prop2 }, { eq }) => eq(prop2, "prop2Value"))
      .go()
      .then((res) => res.data)
      .then((data) => {
        let success = true;
        return { data, success };
      })
      .catch((err) => {
        let success = false;
        return { err, success };
      });

    expect(collectionAAfterPut.success).to.be.true;
    expect(collectionBAfterPut.success).to.be.true;
    expect(collectionAAfterPut.data).to.have.keys(["entityOne"]);
    expect(collectionAAfterPut.data.entityOne).to.be.an("array").with.length(1);
    expect(collectionAAfterPut.data.entityOne).to.deep.equal([
      {
        prop9: "prop9Value",
        prop8: "prop8Value",
        prop7: "prop7Value",
        prop6: "prop6Value",
        uniqueToModelOne: "uniqueToModelOneValue",
        prop5: "prop5Value",
        prop4: "prop4Value",
        prop3: prop3,
        prop2: "prop2Value",
        prop1: prop1,
      },
    ]);
    expect(collectionBAfterPut.data).to.have.keys([
      "entityOne",
      "entityTwo",
      "entityThree",
      "entityThreeV2",
    ]);
    expect(collectionBAfterPut.data.entityOne).to.be.an("array").with.length(1);
    expect(collectionBAfterPut.data.entityTwo).to.be.an("array").with.length(1);
    expect(collectionBAfterPut.data.entityThree)
      .to.be.an("array")
      .with.length(0);
    expect(collectionBAfterPut.data.entityThreeV2)
      .to.be.an("array")
      .with.length(0);
    expect(collectionBAfterPut.data.entityOne).to.deep.equal([
      {
        prop9: "prop9Value",
        prop8: "prop8Value",
        prop7: "prop7Value",
        prop6: "prop6Value",
        uniqueToModelOne: "uniqueToModelOneValue",
        prop5: "prop5Value",
        prop4: "prop4Value",
        prop3: prop3,
        prop2: "prop2Value",
        prop1: prop1,
      },
    ]);
    expect(collectionBAfterPut.data.entityTwo).to.deep.equal([
      {
        prop9: "prop9Value",
        prop8: "prop8Value",
        uniqueToModelTwo: "uniqueToModelTwoValue",
        prop7: "prop7Value",
        prop6: "prop6Value",
        prop5: "prop5Value",
        prop4: "prop4Value",
        prop3: prop3,
        prop2: "prop2Value",
        prop1: prop1,
      },
    ]);
  });

  it("should include attributes associated with a collection in the where clause.", () => {
    let modelOne = {
      model: {
        entity: "entityOne",
        service: "myservice",
        version: "1",
      },
      attributes: {
        uniqueToModelOne: {
          type: "string",
        },
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
        index1: {
          pk: {
            field: "pk",
            facets: ["prop1"],
          },
          sk: {
            field: "sk",
            facets: ["prop2", "prop3"],
          },
          collection: "collectionA",
        },
      },
    };
    let modelTwo = {
      model: {
        entity: "entityTwo",
        service: "myservice",
        version: "1",
      },
      attributes: {
        uniqueToModelTwo: {
          type: "string",
        },
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
        index1: {
          pk: {
            field: "pk",
            facets: ["prop1"],
          },
          sk: {
            field: "sk",
            facets: ["prop2", "prop3"],
          },
          collection: "collectionA",
        },
      },
    };
    let entityOne = new Entity(modelOne);
    let entityTwo = new Entity(modelTwo);
    let service = new Service(
      {
        entityOne,
        entityTwo,
      },
      { table, client },
    );
    let params = service.collections
      .collectionA({ prop1: "abc" })
      .where(({ uniqueToModelTwo, uniqueToModelOne }, { eq }) => {
        expect(uniqueToModelTwo).to.be.a("function");
        expect(uniqueToModelOne).to.be.a("function");
        return `${eq(uniqueToModelTwo, "uniqueToModelTwoValue")} OR ${eq(
          uniqueToModelOne,
          "uniqueToModelOneValue",
        )}`;
      })
      .params();

    expect(params).to.deep.equal({
      KeyConditionExpression: "#pk = :pk and begins_with(#sk1, :sk1)",
      TableName: "electro",
      ExpressionAttributeNames: {
        "#uniqueToModelTwo": "uniqueToModelTwo",
        "#uniqueToModelOne": "uniqueToModelOne",
        "#pk": "pk",
        "#sk1": "sk",
        "#__edb_e__": "__edb_e__",
        "#__edb_v__": "__edb_v__",
      },
      ExpressionAttributeValues: {
        ":uniqueToModelTwo0": "uniqueToModelTwoValue",
        ":uniqueToModelOne0": "uniqueToModelOneValue",
        ":pk": "$myservice#prop1_abc",
        ":sk1": "$collectiona",
        ":__edb_e___entityOne_c0": "entityOne",
        ":__edb_e___entityTwo_c0": "entityTwo",
        ":__edb_v___entityOne_c0": "1",
        ":__edb_v___entityTwo_c0": "1",
      },
      FilterExpression:
        "((#__edb_e__ = :__edb_e___entityOne_c0 AND #__edb_v__ = :__edb_v___entityOne_c0) OR (#__edb_e__ = :__edb_e___entityTwo_c0 AND #__edb_v__ = :__edb_v___entityTwo_c0)) AND #uniqueToModelTwo = :uniqueToModelTwo0 OR #uniqueToModelOne = :uniqueToModelOne0"
    });
  });

  it("should apply attribute getters from the appropriate entities when retrieving data from a collection query.", async () => {
    let modelOne = {
      model: {
        entity: "entityOne",
        service: "myservice",
        version: "1",
      },
      attributes: {
        uniqueToModelOne: {
          type: "string",
          get: (value) => value + "_fromEntityOneGetter",
        },
        prop1: {
          type: "string",
          get: (value) => value + "_fromEntityOneGetter",
        },
        prop2: {
          type: "string",
          get: (value) => value + "_fromEntityOneGetter",
        },
        prop3: {
          type: "string",
          get: (value) => value + "_fromEntityOneGetter",
        },
      },
      indexes: {
        index1: {
          pk: {
            field: "pk",
            facets: ["prop1"],
          },
          sk: {
            field: "sk",
            facets: ["prop2", "prop3"],
          },
          collection: "collectionA",
        },
      },
    };
    let modelTwo = {
      model: {
        entity: "entityTwo",
        service: "myservice",
        version: "1",
      },
      attributes: {
        uniqueToModelTwo: {
          type: "string",
          get: (value) => value + "_fromEntityTwoGetter",
        },
        prop1: {
          type: "string",
          get: (value) => value + "_fromEntityTwoGetter",
        },
        prop2: {
          type: "string",
          get: (value) => value + "_fromEntityTwoGetter",
        },
        prop3: {
          type: "string",
          get: (value) => value + "_fromEntityTwoGetter",
        },
      },
      indexes: {
        index1: {
          pk: {
            field: "pk",
            facets: ["prop1"],
          },
          sk: {
            field: "sk",
            facets: ["prop2", "prop3"],
          },
          collection: "collectionA",
        },
      },
    };
    let entityOne = new Entity(modelOne);
    let entityTwo = new Entity(modelTwo);
    let service = new Service(
      {
        entityOne,
        entityTwo,
      },
      { table, client },
    );
    let prop1 = uuid();
    await Promise.all([
      entityOne
        .put({
          prop1,
          prop2: "prop2Value",
          prop3: "prop3Value_entityOne",
          uniqueToModelOne: "uniqueToModelOneValue",
        })
        .go()
        .then((res) => res.data),
      entityTwo
        .put({
          prop1,
          prop2: "prop2Value",
          prop3: "prop3Value_entityTwo",
          uniqueToModelTwo: "uniqueToModelTwoValue",
        })
        .go()
        .then((res) => res.data),
    ]);
    let record = await service.collections
      .collectionA({ prop1 })
      .go()
      .then((res) => res.data);
    let recordWithWhere = await service.collections
      .collectionA({ prop1 })
      .where(({ prop2 }, { eq }) => eq(prop2, "prop2Value"))
      .go()
      .then((res) => res.data);

    expect(record).to.deep.equal({
      entityOne: [
        {
          prop2: "prop2Value_fromEntityOneGetter",
          prop1: `${prop1}_fromEntityOneGetter`,
          uniqueToModelOne: "uniqueToModelOneValue_fromEntityOneGetter",
          prop3: "prop3Value_entityOne_fromEntityOneGetter",
        },
      ],
      entityTwo: [
        {
          prop2: "prop2Value_fromEntityTwoGetter",
          prop1: `${prop1}_fromEntityTwoGetter`,
          uniqueToModelTwo: "uniqueToModelTwoValue_fromEntityTwoGetter",
          prop3: "prop3Value_entityTwo_fromEntityTwoGetter",
        },
      ],
    });
    expect(recordWithWhere).to.deep.equal({
      entityOne: [
        {
          prop2: "prop2Value_fromEntityOneGetter",
          prop1: `${prop1}_fromEntityOneGetter`,
          uniqueToModelOne: "uniqueToModelOneValue_fromEntityOneGetter",
          prop3: "prop3Value_entityOne_fromEntityOneGetter",
        },
      ],
      entityTwo: [
        {
          prop2: "prop2Value_fromEntityTwoGetter",
          prop1: `${prop1}_fromEntityTwoGetter`,
          uniqueToModelTwo: "uniqueToModelTwoValue_fromEntityTwoGetter",
          prop3: "prop3Value_entityTwo_fromEntityTwoGetter",
        },
      ],
    });
  });
});

describe("Sub-Collections", () => {
  const entity1 = new Entity({
    model: {
      entity: "entity1",
      service: "myservice",
      version: "myversion",
    },
    attributes: {
      attr1: {
        type: "string",
      },
      attr2: {
        type: "string",
      },
      attr3: {
        type: "string",
        default: () => "entity1_" + uuid(),
      },
    },
    indexes: {
      myIndex: {
        collection: ["outercollection", "innercollection"],
        pk: {
          field: "pk",
          composite: ["attr1"],
        },
        sk: {
          field: "sk",
          composite: ["attr2"],
        },
      },
    },
  });

  const entity2 = new Entity({
    model: {
      entity: "entity2",
      service: "myservice",
      version: "myversion",
    },
    attributes: {
      attr1: {
        type: "string",
      },
      attr2: {
        type: "string",
      },
      attr3: {
        type: "string",
        default: () => "entity2_" + uuid(),
      },
    },
    indexes: {
      myIndex: {
        collection: ["outercollection", "innercollection"],
        pk: {
          field: "pk",
          composite: ["attr1"],
        },
        sk: {
          field: "sk",
          composite: ["attr2"],
        },
      },
      myIndex2: {
        index: "gsi1pk-gsi1sk-index",
        collection: ["extracollection"],
        pk: {
          field: "gsi1pk",
          composite: ["attr1"],
        },
        sk: {
          field: "gsi1sk",
          composite: ["attr2"],
        },
      },
    },
  });

  const entity3 = new Entity({
    model: {
      entity: "entity3",
      service: "myservice",
      version: "myversion",
    },
    attributes: {
      attr1: {
        type: "string",
      },
      attr2: {
        type: "string",
      },
      attr3: {
        type: "string",
        default: () => "entity3_" + uuid(),
      },
    },
    indexes: {
      myIndex: {
        collection: "outercollection",
        pk: {
          field: "pk",
          composite: ["attr1"],
        },
        sk: {
          field: "sk",
          composite: ["attr2"],
        },
      },
      myIndex2: {
        index: "gsi1pk-gsi1sk-index",
        collection: "extracollection",
        pk: {
          field: "gsi1pk",
          composite: ["attr1"],
        },
        sk: {
          field: "gsi1sk",
          composite: ["attr2"],
        },
      },
    },
  });
  const service = new Service({ entity1, entity2, entity3 }, { table, client });
  it("Should allow for sub-collections", async () => {
    const record = {
      attr1: uuid(),
      attr2: uuid(),
    };
    let [entity1Record, entity2Record, entity3Record] = await Promise.all([
      entity1
        .put(record)
        .go()
        .then((res) => res.data),
      entity2
        .put(record)
        .go()
        .then((res) => res.data),
      entity3
        .put(record)
        .go()
        .then((res) => res.data),
    ]);
    let [innercollection, outercollection, extracollection] = await Promise.all(
      [
        service.collections
          .innercollection(record)
          .go()
          .then((res) => res.data),
        service.collections
          .outercollection(record)
          .go()
          .then((res) => res.data),
        service.collections
          .extracollection(record)
          .go()
          .then((res) => res.data),
      ],
    );

    expect(innercollection).to.have.keys("entity1", "entity2");
    expect(innercollection).to.deep.equal({
      entity1: [entity1Record],
      entity2: [entity2Record],
    });

    expect(outercollection).to.have.keys("entity1", "entity2", "entity3");
    expect(outercollection).to.deep.equal({
      entity1: [entity1Record],
      entity2: [entity2Record],
      entity3: [entity3Record],
    });

    expect(extracollection).to.have.keys("entity2", "entity3");
    expect(extracollection).to.deep.equal({
      entity2: [entity2Record],
      entity3: [entity3Record],
    });
  });
});
