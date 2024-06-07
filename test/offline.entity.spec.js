const { Entity, clauses } = require("../src/entity");
const { Service } = require("../src/service");
const { expect } = require("chai");
const moment = require("moment");
const uuid = require("uuid/v4");
const table = "electro";
const { shiftSortOrder } = require("../src/util");
let schema = {
  service: "MallStoreDirectory",
  entity: "MallStores",
  table: "StoreDirectory",
  version: "1",
  attributes: {
    id: {
      type: "string",
      default: () => uuid(),
      field: "storeLocationId",
    },
    mall: {
      type: "string",
      required: true,
      field: "mall",
    },
    store: {
      type: "string",
      required: true,
      field: "storeId",
    },
    building: {
      type: "string",
      required: true,
      field: "buildingId",
    },
    unit: {
      type: "string",
      required: true,
      field: "unitId",
    },
    category: {
      type: [
        "food/coffee",
        "food/meal",
        "clothing",
        "electronics",
        "department",
        "misc",
      ],
      required: true,
    },
    leaseEnd: {
      type: "string",
      required: true,
      validate: (date) =>
        moment(date, "YYYY-MM-DD").isValid() ? "" : "Invalid date format",
    },
    rent: {
      type: "string",
      required: false,
      default: "0.00",
    },
    adjustments: {
      type: "string",
      required: false,
    },
  },
  filters: {
    rentsLeaseEndFilter: function (
      attr,
      { lowRent, beginning, end, location } = {},
    ) {
      return `(${attr.rent.gte(lowRent)} AND ${attr.mall.eq(
        location,
      )}) OR ${attr.leaseEnd.between(beginning, end)}`;
    },
  },
  indexes: {
    store: {
      pk: {
        field: "pk",
        facets: ["id"],
      },
    },
    units: {
      index: "gsi1pk-gsi1sk-index",
      pk: {
        field: "gsi1pk",
        facets: ["mall"],
      },
      sk: {
        field: "gsi1sk",
        facets: ["building", "unit", "store"],
      },
    },
    leases: {
      index: "gsi2pk-gsi2sk-index",
      pk: {
        field: "gsi2pk",
        facets: ["mall"],
      },
      sk: {
        field: "gsi2sk",
        facets: ["leaseEnd", "store", "building", "unit"],
      },
    },
    categories: {
      index: "gsi3pk-gsi3sk-index",
      pk: {
        field: "gsi3pk",
        facets: ["mall"],
      },
      sk: {
        field: "gsi3sk",
        facets: ["category", "building", "unit", "store"],
      },
    },
    shops: {
      index: "gsi4pk-gsi4sk-index",
      pk: {
        field: "gsi4pk",
        facets: ["store"],
      },
      sk: {
        field: "gsi4sk",
        facets: ["mall", "building", "unit"],
      },
    },
  },
};

describe("Entity", () => {
  it("Should check whether or not a client has been supplied before trying to query dynamodb", async () => {
    let mall = "EastPointe";
    let store = "LatteLarrys";
    let building = "BuildingA";
    let category = "food/coffee";
    let unit = "B54";
    let leaseEnd = "2020-01-20";
    let rent = "0.00";
    let MallStores = new Entity(schema);
    let { success, results } = await MallStores.put({
      store,
      mall,
      building,
      rent,
      category,
      leaseEnd,
      unit,
    })
      .go()
      .then((res) => res.data)
      .then((results) => ({ success: true, results }))
      .catch((results) => ({ success: false, results }));
    expect(success).to.be.false;
    expect(results.message).to.equal(
      "No client defined on model - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#no-client-defined-on-model",
    );
  });
  describe("Schema validation", () => {
    let MallStores = new Entity(schema);
    describe("skipping values if they at least result in a partial sort key", () => {
      const entity = new Entity({
        service: "test",
        entity: "entityOne",
        table: "test",
        version: "1",
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
        },
        indexes: {
          index1: {
            collection: "collectionA",
            pk: {
              field: "pk",
              facets: ["prop1", "prop2"],
            },
            sk: {
              field: "sk",
              facets: ["prop3", "prop4", "prop5"],
            },
          },
        },
      });
      const tests = [
        {
          description:
            "undefined sort key property passed to main query method",
          happy: true,
          input: {
            pk: {
              prop1: "val1",
              prop2: "val2",
              prop3: undefined,
            },
            sk: {},
          },
          output: {
            gt: {
              TableName: "test",
              ExpressionAttributeNames: { "#pk": "pk", "#sk1": "sk" },
              ExpressionAttributeValues: {
                ":pk": "$test_1#prop1_val1#prop2_val2",
                ":sk1": "$collectiona#entityonf",
              },
              KeyConditionExpression: "#pk = :pk and #sk1 >= :sk1",
            },
            lt: {
              TableName: "test",
              ExpressionAttributeNames: { "#pk": "pk", "#sk1": "sk" },
              ExpressionAttributeValues: {
                ":pk": "$test_1#prop1_val1#prop2_val2",
                ":sk1": "$collectiona#entityone",
              },
              KeyConditionExpression: "#pk = :pk and #sk1 < :sk1",
            },
            gte: {
              TableName: "test",
              ExpressionAttributeNames: { "#pk": "pk", "#sk1": "sk" },
              ExpressionAttributeValues: {
                ":pk": "$test_1#prop1_val1#prop2_val2",
                ":sk1": "$collectiona#entityone",
              },
              KeyConditionExpression: "#pk = :pk and #sk1 >= :sk1",
            },
            lte: {
              TableName: "test",
              ExpressionAttributeNames: { "#pk": "pk", "#sk1": "sk" },
              ExpressionAttributeValues: {
                ":pk": "$test_1#prop1_val1#prop2_val2",
                ":sk1": "$collectiona#entityonf",
              },
              KeyConditionExpression: "#pk = :pk and #sk1 < :sk1",
            },
            main: {
              KeyConditionExpression: "#pk = :pk and begins_with(#sk1, :sk1)",
              TableName: "test",
              ExpressionAttributeNames: { "#pk": "pk", "#sk1": "sk" },
              ExpressionAttributeValues: {
                ":pk": "$test_1#prop1_val1#prop2_val2",
                ":sk1": "$collectiona#entityone#prop3_",
              },
            },
            begins: {
              KeyConditionExpression: "#pk = :pk and begins_with(#sk1, :sk1)",
              TableName: "test",
              ExpressionAttributeNames: { "#pk": "pk", "#sk1": "sk" },
              ExpressionAttributeValues: {
                ":pk": "$test_1#prop1_val1#prop2_val2",
                ":sk1": "$collectiona#entityone",
              },
            },
            between: {
              TableName: "test",
              ExpressionAttributeNames: { "#pk": "pk", "#sk1": "sk" },
              ExpressionAttributeValues: {
                ":pk": "$test_1#prop1_val1#prop2_val2",
                ":sk1": "$collectiona#entityone",
                ":sk2": "$collectiona#entityonf",
              },
              KeyConditionExpression:
                "#pk = :pk and #sk1 BETWEEN :sk1 AND :sk2",
            },
          },
        },
        {
          description:
            "undefined sort key property passed to main query method, but passed with value in sk method",
          happy: true,
          input: {
            pk: {
              prop1: "val1",
              prop2: "val2",
              prop3: undefined,
            },
            sk: {
              prop3: "val3",
            },
          },
          output: {
            gt: {
              TableName: "test",
              ExpressionAttributeNames: {
                "#pk": "pk",
                "#sk1": "sk",
                "#prop3": "prop3",
              },
              ExpressionAttributeValues: {
                ":pk": "$test_1#prop1_val1#prop2_val2",
                ":sk1": "$collectiona#entityone#prop3_val4",
                ":prop30": "val3",
              },
              FilterExpression: "#prop3 > :prop30",
              KeyConditionExpression: "#pk = :pk and #sk1 >= :sk1",
            },
            lt: {
              TableName: "test",
              ExpressionAttributeNames: { "#pk": "pk", "#sk1": "sk" },
              ExpressionAttributeValues: {
                ":pk": "$test_1#prop1_val1#prop2_val2",
                ":sk1": "$collectiona#entityone#prop3_val3",
              },
              KeyConditionExpression: "#pk = :pk and #sk1 < :sk1",
            },
            gte: {
              TableName: "test",
              ExpressionAttributeNames: { "#pk": "pk", "#sk1": "sk" },
              ExpressionAttributeValues: {
                ":pk": "$test_1#prop1_val1#prop2_val2",
                ":sk1": "$collectiona#entityone#prop3_val3",
              },
              KeyConditionExpression: "#pk = :pk and #sk1 >= :sk1",
            },
            lte: {
              TableName: "test",
              ExpressionAttributeNames: {
                "#pk": "pk",
                "#sk1": "sk",
                "#prop3": "prop3",
              },
              ExpressionAttributeValues: {
                ":prop30": "val3",
                ":pk": "$test_1#prop1_val1#prop2_val2",
                ":sk1": "$collectiona#entityone#prop3_val4",
              },
              FilterExpression: "#prop3 <= :prop30",
              KeyConditionExpression: "#pk = :pk and #sk1 < :sk1",
            },
            main: {
              KeyConditionExpression: "#pk = :pk and begins_with(#sk1, :sk1)",
              TableName: "test",
              ExpressionAttributeNames: { "#pk": "pk", "#sk1": "sk" },
              ExpressionAttributeValues: {
                ":pk": "$test_1#prop1_val1#prop2_val2",
                ":sk1": "$collectiona#entityone#prop3_",
              },
            },
            begins: {
              KeyConditionExpression: "#pk = :pk and begins_with(#sk1, :sk1)",
              TableName: "test",
              ExpressionAttributeNames: { "#pk": "pk", "#sk1": "sk" },
              ExpressionAttributeValues: {
                ":pk": "$test_1#prop1_val1#prop2_val2",
                ":sk1": "$collectiona#entityone#prop3_val3",
              },
            },
            between: {
              TableName: "test",
              ExpressionAttributeNames: {
                "#pk": "pk",
                "#sk1": "sk",
                "#prop3": "prop3",
              },
              ExpressionAttributeValues: {
                ":prop30": "val3",
                ":pk": "$test_1#prop1_val1#prop2_val2",
                ":sk1": "$collectiona#entityone#prop3_val3",
                ":sk2": "$collectiona#entityone#prop3_val4",
              },
              FilterExpression: "#prop3 <= :prop30",
              KeyConditionExpression:
                "#pk = :pk and #sk1 BETWEEN :sk1 AND :sk2",
            },
          },
        },
        {
          description:
            "sort key property passed to main query method and again to sort key method",
          happy: true,
          input: {
            pk: {
              prop1: "val1",
              prop2: "val2",
              prop3: "val3a",
            },
            sk: {
              prop3: "val3",
            },
          },
          output: {
            gt: {
              TableName: "test",
              ExpressionAttributeNames: {
                "#pk": "pk",
                "#sk1": "sk",
                "#prop3": "prop3",
              },
              ExpressionAttributeValues: {
                ":prop30": "val3",
                ":pk": "$test_1#prop1_val1#prop2_val2",
                ":sk1": "$collectiona#entityone#prop3_val4",
                ":prop30": "val3a",
                ":prop31": "val3",
              },
              FilterExpression: "(#prop3 = :prop30) AND #prop3 > :prop31",
              KeyConditionExpression: "#pk = :pk and #sk1 >= :sk1",
            },
            lt: {
              TableName: "test",
              ExpressionAttributeNames: {
                "#pk": "pk",
                "#sk1": "sk",
                "#prop3": "prop3",
              },
              ExpressionAttributeValues: {
                ":pk": "$test_1#prop1_val1#prop2_val2",
                ":sk1": "$collectiona#entityone#prop3_val3",
                ":prop30": "val3a",
              },
              KeyConditionExpression: "#pk = :pk and #sk1 < :sk1",
              FilterExpression: "#prop3 = :prop30",
            },
            gte: {
              TableName: "test",
              ExpressionAttributeNames: {
                "#pk": "pk",
                "#sk1": "sk",
                "#prop3": "prop3",
              },
              ExpressionAttributeValues: {
                ":pk": "$test_1#prop1_val1#prop2_val2",
                ":sk1": "$collectiona#entityone#prop3_val3",
                ":prop30": "val3a",
              },
              KeyConditionExpression: "#pk = :pk and #sk1 >= :sk1",
              FilterExpression: "#prop3 = :prop30",
            },
            lte: {
              TableName: "test",
              ExpressionAttributeNames: {
                "#pk": "pk",
                "#sk1": "sk",
                "#prop3": "prop3",
              },
              ExpressionAttributeValues: {
                ":prop30": "val3a",
                ":prop31": "val3",
                ":pk": "$test_1#prop1_val1#prop2_val2",
                ":sk1": "$collectiona#entityone#prop3_val4",
              },
              FilterExpression: "(#prop3 = :prop30) AND #prop3 <= :prop31",
              KeyConditionExpression: "#pk = :pk and #sk1 < :sk1",
            },
            main: {
              KeyConditionExpression: "#pk = :pk and begins_with(#sk1, :sk1)",
              TableName: "test",
              ExpressionAttributeNames: {
                "#pk": "pk",
                "#sk1": "sk",
                "#prop3": "prop3",
              },
              ExpressionAttributeValues: {
                ":pk": "$test_1#prop1_val1#prop2_val2",
                ":sk1": "$collectiona#entityone#prop3_val3a#prop4_",
                ":prop30": "val3a",
              },
              FilterExpression: "#prop3 = :prop30",
            },
            begins: {
              KeyConditionExpression: "#pk = :pk and begins_with(#sk1, :sk1)",
              TableName: "test",
              ExpressionAttributeNames: {
                "#pk": "pk",
                "#sk1": "sk",
                "#prop3": "prop3",
              },
              ExpressionAttributeValues: {
                ":pk": "$test_1#prop1_val1#prop2_val2",
                ":sk1": "$collectiona#entityone#prop3_val3",
                ":prop30": "val3a",
              },
              FilterExpression: "#prop3 = :prop30",
            },
            between: {
              TableName: "test",
              ExpressionAttributeNames: {
                "#pk": "pk",
                "#sk1": "sk",
                "#prop3": "prop3",
              },
              ExpressionAttributeValues: {
                ":prop30": "val3a",
                ":prop31": "val3",
                ":pk": "$test_1#prop1_val1#prop2_val2",
                ":sk1": "$collectiona#entityone#prop3_val3",
                ":sk2": "$collectiona#entityone#prop3_val4",
              },
              FilterExpression: "(#prop3 = :prop30) AND #prop3 <= :prop31",
              KeyConditionExpression:
                "#pk = :pk and #sk1 BETWEEN :sk1 AND :sk2",
            },
          },
        },
        {
          description:
            "second slot sort key property passed to main query method and first slot key property passed to sort key method",
          happy: true,
          input: {
            pk: {
              prop1: "val1",
              prop2: "val2",
              prop4: "val4",
            },
            sk: {
              prop3: "val3",
            },
          },
          output: {
            gt: {
              TableName: "test",
              ExpressionAttributeNames: {
                "#pk": "pk",
                "#sk1": "sk",
                "#prop3": "prop3",
                "#prop4": "prop4",
              },
              ExpressionAttributeValues: {
                ":prop30": "val3",
                ":pk": "$test_1#prop1_val1#prop2_val2",
                ":sk1": "$collectiona#entityone#prop3_val3#prop4_val5",
                ":prop40": "val4",
              },
              FilterExpression: "(#prop4 = :prop40) AND #prop3 > :prop30",
              KeyConditionExpression: "#pk = :pk and #sk1 >= :sk1",
            },
            lt: {
              TableName: "test",
              ExpressionAttributeNames: {
                "#pk": "pk",
                "#sk1": "sk",
                "#prop4": "prop4",
              },
              ExpressionAttributeValues: {
                ":pk": "$test_1#prop1_val1#prop2_val2",
                ":sk1": "$collectiona#entityone#prop3_val3#prop4_val4",
                ":prop40": "val4",
              },
              KeyConditionExpression: "#pk = :pk and #sk1 < :sk1",
              FilterExpression: "#prop4 = :prop40",
            },
            gte: {
              TableName: "test",
              ExpressionAttributeNames: {
                "#pk": "pk",
                "#sk1": "sk",
                "#prop4": "prop4",
              },
              ExpressionAttributeValues: {
                ":pk": "$test_1#prop1_val1#prop2_val2",
                ":sk1": "$collectiona#entityone#prop3_val3#prop4_val4",
                ":prop40": "val4",
              },
              KeyConditionExpression: "#pk = :pk and #sk1 >= :sk1",
              FilterExpression: "#prop4 = :prop40",
            },
            lte: {
              TableName: "test",
              ExpressionAttributeNames: {
                "#pk": "pk",
                "#sk1": "sk",
                "#prop3": "prop3",
                "#prop4": "prop4",
              },
              ExpressionAttributeValues: {
                ":prop30": "val3",
                ":pk": "$test_1#prop1_val1#prop2_val2",
                ":sk1": "$collectiona#entityone#prop3_val3#prop4_val5",
                ":prop40": "val4",
              },
              FilterExpression: "(#prop4 = :prop40) AND #prop3 <= :prop30",
              KeyConditionExpression: "#pk = :pk and #sk1 < :sk1",
            },
            main: {
              KeyConditionExpression: "#pk = :pk and begins_with(#sk1, :sk1)",
              TableName: "test",
              ExpressionAttributeNames: {
                "#pk": "pk",
                "#sk1": "sk",
                "#prop4": "prop4",
              },
              ExpressionAttributeValues: {
                ":pk": "$test_1#prop1_val1#prop2_val2",
                ":sk1": "$collectiona#entityone#prop3_",
                ":prop40": "val4",
              },
              FilterExpression: "#prop4 = :prop40",
            },
            begins: {
              KeyConditionExpression: "#pk = :pk and begins_with(#sk1, :sk1)",
              TableName: "test",
              ExpressionAttributeNames: {
                "#pk": "pk",
                "#sk1": "sk",
                "#prop4": "prop4",
              },
              ExpressionAttributeValues: {
                ":pk": "$test_1#prop1_val1#prop2_val2",
                ":sk1": "$collectiona#entityone#prop3_val3#prop4_val4",
                ":prop40": "val4",
              },
              FilterExpression: "#prop4 = :prop40",
            },
            between: {
              TableName: "test",
              ExpressionAttributeNames: {
                "#pk": "pk",
                "#sk1": "sk",
                "#prop3": "prop3",
                "#prop4": "prop4",
              },
              ExpressionAttributeValues: {
                ":prop30": "val3",
                ":pk": "$test_1#prop1_val1#prop2_val2",
                ":sk1": "$collectiona#entityone#prop3_val3#prop4_val4",
                ":sk2": "$collectiona#entityone#prop3_val3#prop4_val5",
                ":prop40": "val4",
              },
              FilterExpression: "(#prop4 = :prop40) AND #prop3 <= :prop30",
              KeyConditionExpression:
                "#pk = :pk and #sk1 BETWEEN :sk1 AND :sk2",
            },
          },
        },
        {
          description:
            "second slot sort key property passed to main query method and first slot key property never passed to sort key method",
          happy: true,
          input: {
            pk: {
              prop1: "val1",
              prop2: "val2",
              prop4: "val4",
            },
            sk: {},
          },
          output: {
            gt: {
              TableName: "test",
              ExpressionAttributeNames: {
                "#pk": "pk",
                "#sk1": "sk",
                "#prop4": "prop4",
              },
              ExpressionAttributeValues: {
                ":pk": "$test_1#prop1_val1#prop2_val2",
                ":sk1": "$collectiona#entityonf",
                ":prop40": "val4",
              },
              KeyConditionExpression: "#pk = :pk and #sk1 >= :sk1",
              FilterExpression: "#prop4 = :prop40",
            },
            lt: {
              TableName: "test",
              ExpressionAttributeNames: {
                "#pk": "pk",
                "#sk1": "sk",
                "#prop4": "prop4",
              },
              ExpressionAttributeValues: {
                ":pk": "$test_1#prop1_val1#prop2_val2",
                ":sk1": "$collectiona#entityone",
                ":prop40": "val4",
              },
              KeyConditionExpression: "#pk = :pk and #sk1 < :sk1",
              FilterExpression: "#prop4 = :prop40",
            },
            gte: {
              TableName: "test",
              ExpressionAttributeNames: {
                "#pk": "pk",
                "#sk1": "sk",
                "#prop4": "prop4",
              },
              ExpressionAttributeValues: {
                ":pk": "$test_1#prop1_val1#prop2_val2",
                ":sk1": "$collectiona#entityone",
                ":prop40": "val4",
              },
              KeyConditionExpression: "#pk = :pk and #sk1 >= :sk1",
              FilterExpression: "#prop4 = :prop40",
            },
            lte: {
              TableName: "test",
              ExpressionAttributeNames: {
                "#pk": "pk",
                "#sk1": "sk",
                "#prop4": "prop4",
              },
              ExpressionAttributeValues: {
                ":pk": "$test_1#prop1_val1#prop2_val2",
                ":sk1": "$collectiona#entityonf",
                ":prop40": "val4",
              },
              KeyConditionExpression: "#pk = :pk and #sk1 < :sk1",
              FilterExpression: "#prop4 = :prop40",
            },
            main: {
              KeyConditionExpression: "#pk = :pk and begins_with(#sk1, :sk1)",
              TableName: "test",
              ExpressionAttributeNames: {
                "#pk": "pk",
                "#sk1": "sk",
                "#prop4": "prop4",
              },
              ExpressionAttributeValues: {
                ":pk": "$test_1#prop1_val1#prop2_val2",
                ":sk1": "$collectiona#entityone#prop3_",
                ":prop40": "val4",
              },
              FilterExpression: "#prop4 = :prop40",
            },
            begins: {
              KeyConditionExpression: "#pk = :pk and begins_with(#sk1, :sk1)",
              TableName: "test",
              ExpressionAttributeNames: {
                "#pk": "pk",
                "#sk1": "sk",
                "#prop4": "prop4",
              },
              ExpressionAttributeValues: {
                ":pk": "$test_1#prop1_val1#prop2_val2",
                ":sk1": "$collectiona#entityone",
                ":prop40": "val4",
              },
              FilterExpression: "#prop4 = :prop40",
            },
            between: {
              TableName: "test",
              ExpressionAttributeNames: {
                "#pk": "pk",
                "#sk1": "sk",
                "#prop4": "prop4",
              },
              ExpressionAttributeValues: {
                ":pk": "$test_1#prop1_val1#prop2_val2",
                ":sk1": "$collectiona#entityone",
                ":sk2": "$collectiona#entityonf",
                ":prop40": "val4",
              },
              FilterExpression: "#prop4 = :prop40",
              KeyConditionExpression:
                "#pk = :pk and #sk1 BETWEEN :sk1 AND :sk2",
            },
          },
        },
        {
          description:
            "second slot sort key property passed to main query method, and third slot key property passed to sort key method, no first sort key property passed",
          happy: true,
          input: {
            pk: {
              prop1: "val1",
              prop2: "val2",
              prop4: "val4",
            },
            sk: {
              prop5: "val5",
            },
          },
          output: {
            gt: {
              TableName: "test",
              ExpressionAttributeNames: {
                "#pk": "pk",
                "#sk1": "sk",
                "#prop5": "prop5",
                "#prop4": "prop4",
              },
              ExpressionAttributeValues: {
                ":pk": "$test_1#prop1_val1#prop2_val2",
                ":sk1": "$collectiona#entityonf",
                ":prop50": "val5",
                ":prop40": "val4",
              },
              FilterExpression: "(#prop4 = :prop40) AND #prop5 > :prop50",
              KeyConditionExpression: "#pk = :pk and #sk1 >= :sk1",
            },
            lt: {
              TableName: "test",
              ExpressionAttributeNames: {
                "#pk": "pk",
                "#sk1": "sk",
                "#prop4": "prop4",
              },
              ExpressionAttributeValues: {
                ":pk": "$test_1#prop1_val1#prop2_val2",
                ":sk1": "$collectiona#entityone",
                ":prop40": "val4",
              },
              KeyConditionExpression: "#pk = :pk and #sk1 < :sk1",
              FilterExpression: "#prop4 = :prop40",
            },
            gte: {
              TableName: "test",
              ExpressionAttributeNames: {
                "#pk": "pk",
                "#sk1": "sk",
                "#prop4": "prop4",
              },
              ExpressionAttributeValues: {
                ":pk": "$test_1#prop1_val1#prop2_val2",
                ":sk1": "$collectiona#entityone",
                ":prop40": "val4",
              },
              FilterExpression: "#prop4 = :prop40",
              KeyConditionExpression: "#pk = :pk and #sk1 >= :sk1",
            },
            lte: {
              TableName: "test",
              ExpressionAttributeNames: {
                "#pk": "pk",
                "#sk1": "sk",
                "#prop5": "prop5",
                "#prop4": "prop4",
              },
              ExpressionAttributeValues: {
                ":pk": "$test_1#prop1_val1#prop2_val2",
                ":sk1": "$collectiona#entityonf",
                ":prop50": "val5",
                ":prop40": "val4",
              },
              FilterExpression: "(#prop4 = :prop40) AND #prop5 <= :prop50",
              KeyConditionExpression: "#pk = :pk and #sk1 < :sk1",
            },
            main: {
              KeyConditionExpression: "#pk = :pk and begins_with(#sk1, :sk1)",
              TableName: "test",
              ExpressionAttributeNames: {
                "#pk": "pk",
                "#sk1": "sk",
                "#prop4": "prop4",
              },
              ExpressionAttributeValues: {
                ":pk": "$test_1#prop1_val1#prop2_val2",
                ":sk1": "$collectiona#entityone#prop3_",
                ":prop40": "val4",
              },
              FilterExpression: "#prop4 = :prop40",
            },
            begins: {
              KeyConditionExpression: "#pk = :pk and begins_with(#sk1, :sk1)",
              TableName: "test",
              ExpressionAttributeNames: {
                "#pk": "pk",
                "#sk1": "sk",
                "#prop4": "prop4",
              },
              ExpressionAttributeValues: {
                ":pk": "$test_1#prop1_val1#prop2_val2",
                ":sk1": "$collectiona#entityone",
                ":prop40": "val4",
              },
              FilterExpression: "#prop4 = :prop40",
            },
            between: {
              TableName: "test",
              ExpressionAttributeNames: {
                "#pk": "pk",
                "#sk1": "sk",
                "#prop5": "prop5",
                "#prop4": "prop4",
              },
              ExpressionAttributeValues: {
                ":pk": "$test_1#prop1_val1#prop2_val2",
                ":sk1": "$collectiona#entityone",
                ":sk2": "$collectiona#entityonf",
                ":prop50": "val5",
                ":prop40": "val4",
              },
              FilterExpression: "(#prop4 = :prop40) AND #prop5 <= :prop50",
              KeyConditionExpression:
                "#pk = :pk and #sk1 BETWEEN :sk1 AND :sk2",
            },
          },
        },
        {
          description:
            "Partition key property passed to sort key method but not main query method",
          happy: false,
          input: {
            pk: {
              prop1: "val1",
              prop4: "val4",
            },
            sk: {
              prop5: "val5",
              prop2: "val2",
            },
          },
          output: {
            gt: 'Incomplete or invalid key composite attributes supplied. Missing properties: "prop2" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#incomplete-composite-attributes',
            lt: 'Incomplete or invalid key composite attributes supplied. Missing properties: "prop2" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#incomplete-composite-attributes',
            gte: 'Incomplete or invalid key composite attributes supplied. Missing properties: "prop2" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#incomplete-composite-attributes',
            lte: 'Incomplete or invalid key composite attributes supplied. Missing properties: "prop2" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#incomplete-composite-attributes',
            main: 'Incomplete or invalid key composite attributes supplied. Missing properties: "prop2" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#incomplete-composite-attributes',
            begins:
              'Incomplete or invalid key composite attributes supplied. Missing properties: "prop2" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#incomplete-composite-attributes',
            between:
              'Incomplete or invalid key composite attributes supplied. Missing properties: "prop2" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#incomplete-composite-attributes',
          },
        },
      ];
      for (const test of tests) {
        for (const method of Object.keys(test.output)) {
          it(`should ${test.happy ? "allow" : "not allow"} ${
            test.description
          } on ${method} method`, () => {
            const query =
              method === "main"
                ? entity.query.index1(test.input.pk)
                : entity.query
                    .index1(test.input.pk)
                    [method](test.input.sk, test.input.sk);
            if (test.happy) {
              expect(query.params()).to.deep.equal(test.output[method]);
            } else {
              expect(() => query.params()).to.throw(test.output[method]);
            }
          });
        }
      }
    });
    it("Should enforce enum validation on enum type attribute", () => {
      let [isValid, reason] =
        MallStores.model.schema.attributes.category.isValid("BAD_CATEGORY");
      expect(!isValid);
      expect(reason).to.be.an("array").with.length(1);
      expect(reason[0].message).to.eq(
        `Invalid value type at entity path: "category". Value not found in set of acceptable values: "food/coffee", "food/meal", "clothing", "electronics", "department", "misc" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#invalid-attribute`,
      );
    });
    it("Should identify a missing definiton for the table's main index", () => {
      expect(
        () =>
          new Entity({
            service: "test",
            entity: "entityOne",
            table: "test",
            version: "1",
            attributes: {
              prop1: {
                type: "string",
              },
              prop4: {
                type: "string",
              },
              prop5: {
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
                  facets: ["prop4", "prop5"],
                },
                collection: "collectionA",
                index: "different-index-than-entity-one",
              },
            },
          }),
      ).to.throw(
        "Schema is missing an index definition for the table's main index. Please update the schema to include an index without a specified name to define the table's natural index",
      );
    });
    it("Should validate an attribute's type when evaluating a composite attribute. Supported composite attribute types should be a string, number, boolean, or enum", () => {
      let tests = [
        {
          input: "string",
          fail: false,
        },
        {
          input: "number",
          fail: false,
        },
        {
          input: "boolean",
          fail: false,
        },
        {
          input: ["option1", "option2", "option3"],
          fail: false,
        },
        {
          input: "set",
          fail: true,
          message: `Invalid composite attribute definition: Composite attributes must be one of the following: string, number, boolean, enum. The attribute "id" is defined as being type "set" but is a composite attribute of the following indexes: Table Index`,
        },
        {
          input: "list",
          fail: true,
          message: `Invalid composite attribute definition: Composite attributes must be one of the following: string, number, boolean, enum. The attribute "id" is defined as being type "list" but is a composite attribute of the following indexes: Table Index`,
        },
        {
          input: "map",
          fail: true,
          message: `Invalid composite attribute definition: Composite attributes must be one of the following: string, number, boolean, enum. The attribute "id" is defined as being type "map" but is a composite attribute of the following indexes: Table Index`,
        },
        {
          input: "any",
          fail: true,
          message: `Invalid composite attribute definition: Composite attributes must be one of the following: string, number, boolean, enum. The attribute "id" is defined as being type "any" but is a composite attribute of the following indexes: Table Index`,
        },
      ];

      let schema = {
        service: "MallStoreDirectory",
        entity: "MallStores",
        table: "StoreDirectory",
        version: "1",
        attributes: {
          id: {
            type: "string",
            field: "id",
          },
        },
        indexes: {
          main: {
            pk: {
              field: "pk",
              facets: ["id"],
            },
          },
        },
      };

      for (let test of tests) {
        schema.attributes.id.type = test.input;
        if (test.fail) {
          expect(() => new Entity(schema)).to.throw(test.message);
        } else {
          expect(() => new Entity(schema)).to.not.throw();
        }
      }
    });
    it("Should validate an attribute's defined type when evaluating a field for saving", () => {
      let tests = [
        {
          input: {
            data: {
              type: "string",
              field: "data",
            },
            value: "abc",
          },
          fail: false,
        },
        {
          input: {
            data: {
              type: "number",
              field: "data",
            },
            value: 123,
          },
          fail: false,
        },
        {
          input: {
            data: {
              type: "boolean",
            },
            value: true,
          },
          fail: false,
        },
        {
          input: {
            data: {
              type: ["option1", "option2", "option3"],
              field: "data",
            },
            value: "option1",
          },
          fail: false,
        },
        {
          input: {
            data: {
              type: "any",
            },
            value: "abc",
          },
          fail: false,
        },
        {
          input: {
            data: {
              type: "any",
              field: "data",
            },
            value: 456,
          },
          fail: false,
        },
        {
          input: {
            data: {
              type: "any",
            },
            value: true,
          },
          fail: false,
        },
        {
          input: {
            data: {
              type: "any",
            },
            value: ["yes", "no", "maybe"],
          },
          fail: false,
        },
        {
          input: {
            data: {
              type: "any",
              field: "data",
            },
            value: { prop1: "val1", prop2: "val2" },
          },
          fail: false,
        },
        {
          input: {
            data: {
              type: "set",
              items: "string",
              field: "data",
            },
            value: ["yes", "no", "maybe"],
          },
          fail: false,
        },
        {
          input: {
            data: {
              type: "set",
              items: "string",
              field: "data",
            },
            value: new Set(["yes", "no", "maybe"]),
          },
          fail: false,
        },
        {
          input: {
            data: {
              type: "list",
              items: {
                type: "string",
              },
              field: "data",
            },
            value: ["yes", "no", "maybe"],
          },
          fail: false,
        },
        {
          input: {
            data: {
              type: "map",
              properties: {
                prop1: {
                  type: "string",
                },
                prop2: {
                  type: "string",
                },
              },
              field: "data",
            },
            value: { prop1: "val1", prop2: "val2" },
          },
          fail: false,
        },
        {
          input: {
            data: {
              type: "map",
              properties: {
                prop1: {
                  type: "string",
                },
                prop2: {
                  type: "string",
                },
              },
              field: "data",
            },
            value: { prop1: "val1" },
          },
          fail: false,
        },
        {
          input: {
            data: {
              type: "map",
              properties: {
                prop1: {
                  type: "string",
                },
                prop2: {
                  type: "string",
                  required: true,
                },
              },
              field: "data",
            },
            value: { prop1: "val1" },
          },
          fail: true,
          message: `Invalid value type at entity path: "data.prop2". Value is required`,
        },
        {
          input: {
            data: {
              type: "map",
              properties: {
                prop1: {
                  type: "string",
                },
                prop2: {
                  type: "string",
                },
              },
              field: "data",
              required: true,
            },
            value: undefined,
          },
          fail: true,
          message: `Invalid value type at entity path: "data". Value is required.`,
        },
        {
          input: {
            data: {
              type: "list",
              items: {
                type: "string",
                required: true,
              },
              field: "data",
            },
            value: [],
          },
          fail: false,
        },
        {
          input: {
            data: {
              type: "list",
              items: {
                type: "string",
              },
              field: "data",
              required: true,
            },
            value: undefined,
          },
          fail: true,
          message: `Invalid value type at entity path: "data". Value is required.`,
        },
        {
          input: {
            data: {
              type: "map",
              properties: {
                prop1: {
                  type: "string",
                },
                prop2: {
                  type: "string",
                },
              },
              field: "data",
            },
            value: new Map(Object.entries({ prop1: "val1", prop2: "val2" })),
          },
          fail: true,
          message: `Invalid value type at entity path: "data". Expected value to be an object to fulfill attribute type "map" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#invalid-attribute`,
        },
        {
          input: {
            data: {
              type: "string",
              field: "data",
            },
            value: 462,
          },
          fail: true,
          message: `Invalid value type at entity path: "data". Received value of type "number", expected value of type "string"`,
        },
        {
          input: {
            data: {
              type: "number",
              field: "data",
            },
            value: true,
          },
          fail: true,
          message: `Invalid value type at entity path: "data". Received value of type "boolean", expected value of type "number"`,
        },
        {
          input: {
            data: {
              type: "boolean",
              field: "data",
            },
            value: "yes",
          },
          fail: true,
          message: `Invalid value type at entity path: "data". Received value of type "string", expected value of type "boolean"`,
        },
        {
          input: {
            data: {
              type: ["option1", "option2", "option3"],
              field: "data",
            },
            value: "option4",
          },
          fail: true,
          message: `Invalid value type at entity path: "data". Value not found in set of acceptable values: "option1", "option2", "option3"`,
        },
        {
          // this test also sucks, we drop another value
          input: {
            data: {
              type: "map",
              properties: {
                prop1: {
                  type: "string",
                },
              },
              field: "data",
            },
            value: new Set(["yes", "no", "maybe"]),
          },
          fail: true,
          message: `Invalid value type at entity path: "data". Expected value to be an object to fulfill attribute type "map" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#invalid-attribute`,
        },
        {
          input: {
            data: {
              type: "list",
              items: {
                type: "string",
              },
              field: "data",
            },
            value: new Set(["yes", "no", "maybe"]),
          },
          fail: true,
          message: `Invalid value type at entity path "data. Received value of type "set", expected value of type "array"`,
        },
        {
          input: {
            data: {
              type: "set",
              items: "string",
              field: "data",
            },
            value: { prop1: "val1", prop2: "val2" },
          },
          fail: true,
          message: `Invalid attribute value supplied to "set" attribute "data". Received value of type "object". Set values must be supplied as either Arrays, native JavaScript Set objects, DocumentClient Set objects, strings, or numbers.`,
        },
        {
          input: {
            data: {
              type: "invalid_type",
              field: "data",
            },
          },
          fail: true,
          message: `Invalid "type" property for attribute: "data". Acceptable types include string, number, boolean, enum, map, set, list, any`,
        },
      ];
      let schema = {
        service: "MallStoreDirectory",
        entity: "MallStores",
        table: "StoreDirectory",
        version: "1",
        attributes: {
          id: {
            type: "string",
            field: "id",
          },
          data: {
            type: "string",
            field: "data",
          },
        },
        indexes: {
          main: {
            pk: {
              field: "pk",
              facets: ["id"],
            },
          },
        },
      };

      for (let test of tests) {
        schema.attributes.data = test.input.data;
        let id = "abcdefg";
        let data = test.input.value;

        if (test.fail) {
          expect(() => {
            try {
              let entity = new Entity(schema);
              entity.put({ id, data }).params();
              console.log("should have failed", test);
            } catch (err) {
              throw err;
            }
          }).to.throw(test.message);
        } else {
          expect(() => {
            try {
              let entity = new Entity(schema);
              entity.put({ id, data }).params();
            } catch (err) {
              console.log(err, test);
              throw err;
            }
          }).to.not.throw();
        }
      }
    });
    it("should recognize when an attribute's field property is duplicated", () => {
      let schema = {
        service: "MallStoreDirectory",
        entity: "MallStores",
        table: "StoreDirectory",
        version: "1",
        attributes: {
          id: {
            type: "string",
            field: "id",
          },
          duplicateFieldName: {
            type: "string",
            field: "id",
          },
        },
        indexes: {
          main: {
            pk: {
              field: "pk",
              facets: ["id"],
            },
          },
        },
      };
      expect(() => new Entity(schema)).to.throw(
        `Schema Validation Error. Attribute "duplicateFieldName" property "field". Received: "id", Expected: "Unique field property, already used by attribute id" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#invalid-attribute-definition`,
      );
    });
    it("Should validate regex", () => {
      let Test = new Entity({
        service: "MallStoreDirectory",
        entity: "MallStores",
        table: "StoreDirectory",
        version: "1",
        attributes: {
          regexp: {
            type: "string",
            validate: /^\d{4}-\d{2}-\d{2}$/gi,
          },
        },
        indexes: {
          test: {
            pk: {
              field: "test",
              facets: ["regexp"],
            },
          },
        },
      });
      expect(() => Test.put({ regexp: "1533-15-44" }).params()).to.not.throw();
      expect(() => Test.put({ regexp: "1533-1a-44" }).params()).to.throw(
        `Invalid value for attribute "regexp": Failed model defined regex`,
      );
    });
    it("Should not allow for an invalid schema type", () => {
      expect(
        () =>
          new Entity({
            service: "MallStoreDirectory",
            entity: "MallStores",
            table: "StoreDirectory",
            version: "1",
            attributes: {
              regexp: {
                type: "raccoon",
              },
            },
            indexes: {
              test: {
                pk: {
                  field: "test",
                  facets: ["regexp"],
                },
              },
            },
          }),
      ).to.throw(
        `Invalid composite attribute definition: Composite attributes must be one of the following: string, number, boolean, enum. The attribute "regexp" is defined as being type "raccoon" but is a composite attribute of the following indexes: Table Index`,
      );
    });
    it("Should prevent the update of the main partition key without the user needing to define the property as read-only in their schema", async () => {
      let id = uuid();
      let rent = "0.00";
      let category = "food/coffee";
      let adjustments = "500.00";
      expect(() =>
        MallStores.update({ id }).set({ rent, category, id }).params(),
      ).to.throw(`Attribute "id" is Read-Only and cannot be updated`);
      expect(() =>
        MallStores.update({ id }).set({ rent, adjustments }).params(),
      ).to.not.throw();
    });
    it("Should prevent an index without an SK to have a `collection` property defined", () => {
      let schema = {
        service: "MallStoreDirectory",
        entity: "MallStores",
        table: "StoreDirectory",
        version: "1",
        attributes: {
          id: {
            type: "string",
            field: "id",
          },
          mall: {
            type: "string",
            required: true,
            field: "mall",
          },
        },
        filters: {},
        indexes: {
          store: {
            collection: "abcdef",
            pk: {
              field: "pk",
              facets: ["id"],
            },
          },
        },
      };

      let error =
        "Invalid Access pattern definition for 'store': '(Primary Index)', contains a collection definition without a defined SK. Collections can only be defined on indexes with a defined SK.";
      expect(() => new Entity(schema)).to.throw(error);
    });
    it("Should identify impacted indexes from attributes", () => {
      let id = uuid();
      let rent = "0.00";
      let category = "food/coffee";
      let mall = "EastPointe";
      let leaseEnd = "2020/04/27";
      let unit = "B45";
      let building = "BuildingB";
      let store = "LatteLarrys";
      let impact1 = MallStores._getIndexImpact({ rent, category, mall });
      let impact2 = MallStores._getIndexImpact({ leaseEnd });
      let impact3 = MallStores._getIndexImpact({ mall });
      let impact4 = MallStores._getIndexImpact(
        { rent, mall },
        { id, building, unit },
      );
      let impact5 = MallStores._getIndexImpact(
        { rent, leaseEnd, category },
        { store, building, unit },
      );
      expect(impact1).to.deep.equal([
        true,
        {
          incomplete: [
            {
              index: "gsi3pk-gsi3sk-index",
              missing: ["building", "unit", "store"],
            },
            {
              index: "gsi4pk-gsi4sk-index",
              missing: ["building", "unit"],
            },
          ],
          complete: {
            facets: { mall, category },
            indexes: ["gsi1pk-gsi1sk-index", "gsi2pk-gsi2sk-index"],
            impactedIndexTypes: {
              "gsi1pk-gsi1sk-index": {
                pk: "gsi1pk",
              },
              "gsi2pk-gsi2sk-index": {
                pk: "gsi2pk",
              },
              "gsi3pk-gsi3sk-index": {
                pk: "gsi3pk",
                sk: "gsi3sk",
              },
              "gsi4pk-gsi4sk-index": {
                sk: "gsi4sk",
              },
            },
            conditions: {
              "": true,
              "gsi1pk-gsi1sk-index": true,
              "gsi2pk-gsi2sk-index": true,
              "gsi3pk-gsi3sk-index": true,
              "gsi4pk-gsi4sk-index": true,
            }
          },
        },
      ]);
      expect(impact2).to.deep.equal([
        true,
        {
          incomplete: [
            {
              index: "gsi2pk-gsi2sk-index",
              missing: ["store", "building", "unit"],
            },
          ],
          complete: {
            facets: {
              leaseEnd: leaseEnd,
            },
            indexes: [],
            impactedIndexTypes: {
              "gsi2pk-gsi2sk-index": {
                sk: "gsi2sk",
              },
            },
            conditions: {
              "": true,
              "gsi1pk-gsi1sk-index": true,
              "gsi2pk-gsi2sk-index": true,
              "gsi3pk-gsi3sk-index": true,
              "gsi4pk-gsi4sk-index": true,
            }
          },
        },
      ]);

      expect(impact3).to.deep.equal([
        true,
        {
          incomplete: [
            {
              index: "gsi4pk-gsi4sk-index",
              missing: ["building", "unit"],
            },
          ],
          complete: {
            facets: {
              mall: mall,
            },
            indexes: [
              "gsi1pk-gsi1sk-index",
              "gsi2pk-gsi2sk-index",
              "gsi3pk-gsi3sk-index",
            ],
            impactedIndexTypes: {
              "gsi1pk-gsi1sk-index": {
                pk: "gsi1pk",
              },
              "gsi2pk-gsi2sk-index": {
                pk: "gsi2pk",
              },
              "gsi3pk-gsi3sk-index": {
                pk: "gsi3pk",
              },
              "gsi4pk-gsi4sk-index": {
                sk: "gsi4sk",
              },
            },
            conditions: {
              "": true,
              "gsi1pk-gsi1sk-index": true,
              "gsi2pk-gsi2sk-index": true,
              "gsi3pk-gsi3sk-index": true,
              "gsi4pk-gsi4sk-index": true,
            },
          },
        },
      ]);

      expect(impact4).to.deep.equal([
        false,
        {
          incomplete: [],
          complete: {
            facets: {
              mall: mall,
            },
            indexes: [
              "gsi1pk-gsi1sk-index",
              "gsi2pk-gsi2sk-index",
              "gsi3pk-gsi3sk-index",
            ],
            impactedIndexTypes: {
              "gsi1pk-gsi1sk-index": {
                pk: "gsi1pk",
              },
              "gsi2pk-gsi2sk-index": {
                pk: "gsi2pk",
              },
              "gsi3pk-gsi3sk-index": {
                pk: "gsi3pk",
              },
              "gsi4pk-gsi4sk-index": {
                sk: "gsi4sk",
              },
            },
            conditions: {
              "": true,
              "gsi1pk-gsi1sk-index": true,
              "gsi2pk-gsi2sk-index": true,
              "gsi3pk-gsi3sk-index": true,
              "gsi4pk-gsi4sk-index": true,
            }
          },
        },
      ]);

      expect(impact5).to.deep.equal([
        false,
        {
          incomplete: [],
          complete: {
            facets: {
              leaseEnd: leaseEnd,
              category: category,
            },
            indexes: [],
            impactedIndexTypes: {
              "gsi2pk-gsi2sk-index": {
                sk: "gsi2sk",
              },
              "gsi3pk-gsi3sk-index": {
                sk: "gsi3sk",
              },
            },
            conditions: {
              "": true,
              "gsi1pk-gsi1sk-index": true,
              "gsi2pk-gsi2sk-index": true,
              "gsi3pk-gsi3sk-index": true,
              "gsi4pk-gsi4sk-index": true,
            }
          },
        },
      ]);
    });
  });
  describe("navigate query chains", () => {
    let MallStores = new Entity(schema);
    it("Should allow for a multiple combinations given a schema", () => {
      let mall = "EastPointe";
      let store = "LatteLarrys";
      let building = "BuildingA";
      let id = uuid();
      let category = "food/coffee";
      let unit = "B54";
      let leaseEnd = "2020-01-20";
      let rent = "0.00";
      let buildingOne = "BuildingA";
      let buildingTwo = "BuildingF";
      let get = MallStores.get({ id });
      expect(get).to.have.keys(
        "commit",
        "go",
        "params",
        "filter",
        "rentsLeaseEndFilter",
        "where",
      );
      let del = MallStores.delete({ id });
      expect(del).to.have.keys(
        "commit",
        "go",
        "params",
        "where",
        "filter",
        "rentsLeaseEndFilter",
      );
      let update = MallStores.update({ id }).set({ rent, category });
      expect(update).to.have.keys(
        "commit",
        "go",
        "params",
        "set",
        "filter",
        "where",
        "rentsLeaseEndFilter",
        "add",
        "append",
        "data",
        "subtract",
        "delete",
        "remove",
        "composite",
        "ifNotExists",
      );
      let patch = MallStores.patch({ id }).set({ rent, category });
      expect(patch).to.have.keys(
        "commit",
        "go",
        "params",
        "set",
        "filter",
        "where",
        "rentsLeaseEndFilter",
        "add",
        "append",
        "data",
        "subtract",
        "delete",
        "remove",
        "composite",
        "ifNotExists",
      );
      let put = MallStores.put({
        store,
        mall,
        building,
        rent,
        category,
        leaseEnd,
        unit,
      });
      expect(put).to.have.keys(
        "commit",
        "go",
        "params",
        "where",
        "filter",
        "rentsLeaseEndFilter",
      );
      let create = MallStores.create({
        store,
        mall,
        building,
        rent,
        category,
        leaseEnd,
        unit,
      });
      expect(create).to.have.keys(
        "commit",
        "go",
        "params",
        "where",
        "filter",
        "rentsLeaseEndFilter",
      );
      let queryUnitsBetween = MallStores.query
        .units({ mall })
        .between({ building: buildingOne }, { building: buildingTwo });
      expect(queryUnitsBetween).to.have.keys(
        "where",
        "filter",
        "go",
        "params",
        "rentsLeaseEndFilter",
      );
      let queryUnitGt = MallStores.query.units({ mall }).gt({ building });
      expect(queryUnitGt).to.have.keys(
        "where",
        "filter",
        "go",
        "params",
        "rentsLeaseEndFilter",
      );
      let queryUnitsGte = MallStores.query.units({ mall }).gte({ building });
      expect(queryUnitsGte).to.have.keys(
        "where",
        "filter",
        "go",
        "params",
        "rentsLeaseEndFilter",
      );
      let queryUnitsLte = MallStores.query.units({ mall }).lte({ building });
      expect(queryUnitsLte).to.have.keys(
        "where",
        "filter",
        "go",
        "params",
        "rentsLeaseEndFilter",
      );
      let queryUnitsLt = MallStores.query.units({ mall }).lt({ building });
      expect(queryUnitsLt).to.have.keys(
        "where",
        "filter",
        "go",
        "params",
        "rentsLeaseEndFilter",
      );
      let find = MallStores.query.units({ mall });
      expect(find).to.have.keys(
        "between",
        "begins",
        "gt",
        "gte",
        "lt",
        "lte",
        "where",
        "filter",
        "go",
        "params",
        "rentsLeaseEndFilter",
      );
    });
    it("Should make scan parameters", () => {
      let scan = MallStores.scan
        .filter(({ store }) => store.eq("Starblix"))
        .params();
      expect(scan).to.deep.equal({
        ExpressionAttributeNames: {
          "#__edb_e__": "__edb_e__",
          "#__edb_v__": "__edb_v__",
          "#pk": "pk",
          "#store": "storeId",
        },
        ExpressionAttributeValues: {
          ":__edb_e__0": "MallStores",
          ":__edb_v__0": "1",
          ":pk": "$mallstoredirectory_1$mallstores#id_",
          ":store0": "Starblix",
        },
        FilterExpression:
          "begins_with(#pk, :pk) AND (#store = :store0) AND #__edb_e__ = :__edb_e__0 AND #__edb_v__ = :__edb_v__0",
        TableName: "StoreDirectory",
      });
    });
    it("Should check if filter returns string", () => {
      expect(() => MallStores.scan.filter(() => 1234).params()).to.throw(
        "Invalid filter response. Expected result to be of type string",
      );
    });
    it("Should create parameters for a given chain", () => {
      let mall = "EastPointe";
      let store = "LatteLarrys";
      let building = "BuildingA";
      let id = uuid();
      let category = "food/coffee";
      let unit = "B54";
      let leaseEnd = "2020-01-20";
      let rent = "0.00";
      let buildingOne = "BuildingA";
      let buildingTwo = "BuildingF";
      let unitOne = "A1";
      let unitTwo = "F6";
      let get = MallStores.get({ id }).params();
      expect(get).to.be.deep.equal({
        TableName: "StoreDirectory",
        Key: { pk: `$mallstoredirectory_1$mallstores#id_${id}` },
      });

      let del = MallStores.delete({ id }).params();
      expect(del).to.be.deep.equal({
        TableName: "StoreDirectory",
        Key: { pk: `$mallstoredirectory_1$mallstores#id_${id}` },
      });

      let update = MallStores.update({ id })
        .set({ mall, store, building, category, unit, rent, leaseEnd })
        .params();
      expect(update).to.deep.equal({
        UpdateExpression:
          "SET #mall = :mall_u0, #store = :store_u0, #building = :building_u0, #category = :category_u0, #unit = :unit_u0, #rent = :rent_u0, #leaseEnd = :leaseEnd_u0, #gsi1pk = :gsi1pk_u0, #gsi1sk = :gsi1sk_u0, #gsi2pk = :gsi2pk_u0, #gsi2sk = :gsi2sk_u0, #gsi3pk = :gsi3pk_u0, #gsi3sk = :gsi3sk_u0, #gsi4pk = :gsi4pk_u0, #gsi4sk = :gsi4sk_u0, #storeLocationId = :storeLocationId_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0",
        ExpressionAttributeNames: {
          "#storeLocationId": "storeLocationId",
          "#mall": "mall",
          "#store": "storeId",
          "#building": "buildingId",
          "#unit": "unitId",
          "#category": "category",
          "#leaseEnd": "leaseEnd",
          "#rent": "rent",
          "#gsi1pk": "gsi1pk",
          "#gsi1sk": "gsi1sk",
          "#gsi2pk": "gsi2pk",
          "#gsi2sk": "gsi2sk",
          "#gsi3pk": "gsi3pk",
          "#gsi3sk": "gsi3sk",
          "#gsi4pk": "gsi4pk",
          "#gsi4sk": "gsi4sk",
          "#__edb_e__": "__edb_e__",
          "#__edb_v__": "__edb_v__",
        },
        ExpressionAttributeValues: {
          ":storeLocationId_u0": id,
          ":mall_u0": mall,
          ":store_u0": store,
          ":building_u0": building,
          ":unit_u0": unit,
          ":category_u0": category,
          ":leaseEnd_u0": leaseEnd,
          ":rent_u0": rent,
          ":gsi1pk_u0": "$mallstoredirectory_1#mall_eastpointe",
          ":gsi1sk_u0":
            "$mallstores#building_buildinga#unit_b54#store_lattelarrys",
          ":gsi2pk_u0": "$mallstoredirectory_1#mall_eastpointe",
          ":gsi2sk_u0":
            "$mallstores#leaseend_2020-01-20#store_lattelarrys#building_buildinga#unit_b54",
          ":gsi3pk_u0": "$mallstoredirectory_1#mall_eastpointe",
          ":gsi3sk_u0":
            "$mallstores#category_food/coffee#building_buildinga#unit_b54#store_lattelarrys",
          ":gsi4pk_u0": "$mallstoredirectory_1#store_lattelarrys",
          ":gsi4sk_u0":
            "$mallstores#mall_eastpointe#building_buildinga#unit_b54",
          ":__edb_e___u0": "MallStores",
          ":__edb_v___u0": "1",
        },
        TableName: "StoreDirectory",
        Key: {
          pk: `$mallstoredirectory_1$mallstores#id_${id}`,
        },
      });

      let put = MallStores.put({
        store,
        mall,
        building,
        rent,
        category,
        leaseEnd,
        unit,
      }).params();

      expect(put).to.deep.equal({
        Item: {
          __edb_e__: "MallStores",
          __edb_v__: "1",
          storeLocationId: put.Item.storeLocationId,
          mall,
          storeId: store,
          buildingId: building,
          unitId: unit,
          category,
          leaseEnd,
          rent,
          pk: `$mallstoredirectory_1$mallstores#id_${put.Item.storeLocationId}`,
          gsi1pk: `$MallStoreDirectory_1#mall_${mall}`.toLowerCase(),
          gsi1sk:
            `$MallStores#building_${building}#unit_${unit}#store_${store}`.toLowerCase(),
          gsi2pk: `$MallStoreDirectory_1#mall_${mall}`.toLowerCase(),
          gsi2sk:
            `$MallStores#leaseEnd_2020-01-20#store_${store}#building_${building}#unit_${unit}`.toLowerCase(),
          gsi3pk: `$MallStoreDirectory_1#mall_${mall}`.toLowerCase(),
          gsi3sk:
            `$MallStores#category_${category}#building_${building}#unit_${unit}#store_${store}`.toLowerCase(),
          gsi4pk: `$MallStoreDirectory_1#store_${store}`.toLowerCase(),
          gsi4sk:
            `$MallStores#mall_${mall}#building_${building}#unit_${unit}`.toLowerCase(),
        },
        TableName: "StoreDirectory",
      });
      let beingsWithOne = MallStores.query.units({ mall, building }).params();
      expect(beingsWithOne).to.deep.equal({
        ExpressionAttributeNames: {
          "#pk": "gsi1pk",
          "#sk1": "gsi1sk",
          "#buildingId": "buildingId",
        },
        ExpressionAttributeValues: {
          ":buildingId0": "BuildingA",
          ":pk": `$MallStoreDirectory_1#mall_${mall}`.toLowerCase(),
          ":sk1": `$MallStores#building_${building}#unit_`.toLowerCase(),
        },
        FilterExpression: "#buildingId = :buildingId0",
        IndexName: "gsi1pk-gsi1sk-index",
        TableName: "StoreDirectory",
        KeyConditionExpression: "#pk = :pk and begins_with(#sk1, :sk1)",
      });
      let beingsWithTwo = MallStores.query
        .units({ mall, building, store })
        .params();
      expect(beingsWithTwo).to.deep.equal({
        ExpressionAttributeNames: {
          "#pk": "gsi1pk",
          "#sk1": "gsi1sk",
          "#buildingId": "buildingId",
          "#storeId": "storeId",
        },
        ExpressionAttributeValues: {
          ":buildingId0": "BuildingA",
          ":storeId0": "LatteLarrys",
          ":pk": `$MallStoreDirectory_1#mall_${mall}`.toLowerCase(),
          ":sk1": `$MallStores#building_${building}#unit_`.toLowerCase(),
        },
        IndexName: "gsi1pk-gsi1sk-index",
        TableName: "StoreDirectory",
        FilterExpression:
          "(#buildingId = :buildingId0) AND #storeId = :storeId0",
        KeyConditionExpression: "#pk = :pk and begins_with(#sk1, :sk1)",
      });
      let beingsWithThree = MallStores.query
        .units({ mall, building, unit })
        .params();
      expect(beingsWithThree).to.deep.equal({
        ExpressionAttributeNames: {
          "#pk": "gsi1pk",
          "#sk1": "gsi1sk",
          "#buildingId": "buildingId",
          "#unitId": "unitId",
        },
        ExpressionAttributeValues: {
          ":buildingId0": "BuildingA",
          ":unitId0": "B54",
          ":pk": `$MallStoreDirectory_1#mall_${mall}`.toLowerCase(),
          ":sk1":
            `$MallStores#building_${building}#unit_${unit}#store_`.toLowerCase(),
        },
        FilterExpression: "(#buildingId = :buildingId0) AND #unitId = :unitId0",
        IndexName: "gsi1pk-gsi1sk-index",
        TableName: "StoreDirectory",
        KeyConditionExpression: "#pk = :pk and begins_with(#sk1, :sk1)",
      });
      let beingsWithFour = MallStores.query
        .units({ mall, building, unit, store })
        .params();
      expect(beingsWithFour).to.deep.equal({
        ExpressionAttributeNames: {
          "#pk": "gsi1pk",
          "#sk1": "gsi1sk",
          "#buildingId": "buildingId",
          "#unitId": "unitId",
          "#storeId": "storeId",
        },
        ExpressionAttributeValues: {
          ":buildingId0": "BuildingA",
          ":unitId0": "B54",
          ":storeId0": "LatteLarrys",
          ":pk": `$MallStoreDirectory_1#mall_${mall}`.toLowerCase(),
          ":sk1":
            `$MallStores#building_${building}#unit_${unit}#store_${store}`.toLowerCase(),
        },
        FilterExpression:
          "(#buildingId = :buildingId0) AND #unitId = :unitId0 AND #storeId = :storeId0",
        IndexName: "gsi1pk-gsi1sk-index",
        TableName: "StoreDirectory",
        KeyConditionExpression: "#pk = :pk and #sk1 = :sk1",
      });

      let queryUnitsBetweenOne = MallStores.query
        .units({ mall })
        .between(
          { building: buildingOne, unit },
          { building: buildingTwo, unit },
        )
        .params();
      expect(queryUnitsBetweenOne).to.deep.equal({
        ExpressionAttributeNames: {
          "#pk": "gsi1pk",
          "#sk1": "gsi1sk",
          "#buildingId": "buildingId",
          "#unitId": "unitId",
        },
        ExpressionAttributeValues: {
          ":unitId0": "B54",
          ":buildingId0": "BuildingF",
          ":pk": `$MallStoreDirectory_1#mall_${mall}`.toLowerCase(),
          ":sk1": `$MallStores#building_${buildingOne}#unit_B54`.toLowerCase(),
          ":sk2": `$MallStores#building_${buildingTwo}#unit_B55`.toLowerCase(),
        },
        FilterExpression:
          "(#buildingId <= :buildingId0) AND #unitId <= :unitId0",
        IndexName: "gsi1pk-gsi1sk-index",
        TableName: "StoreDirectory",
        KeyConditionExpression: "#pk = :pk and #sk1 BETWEEN :sk1 AND :sk2",
      });

      let queryUnitsBetweenTwo = MallStores.query
        .units({ mall, building })
        .between({ unit: unitOne }, { unit: unitTwo })
        .params();
      expect(queryUnitsBetweenTwo).to.deep.equal({
        ExpressionAttributeNames: {
          "#buildingId": "buildingId",
          "#pk": "gsi1pk",
          "#sk1": "gsi1sk",
          "#unitId": "unitId",
        },
        ExpressionAttributeValues: {
          ":unitId0": "F6",
          ":buildingId0": "BuildingA",
          ":pk": `$MallStoreDirectory_1#mall_${mall}`.toLowerCase(),
          ":sk1":
            `$MallStores#building_${building}#unit_${unitOne}`.toLowerCase(),
          ":sk2": `$MallStores#building_${building}#unit_${shiftSortOrder(
            unitTwo,
            1,
          )}`.toLowerCase(),
        },
        FilterExpression:
          "(#buildingId = :buildingId0) AND #unitId <= :unitId0",
        IndexName: "gsi1pk-gsi1sk-index",
        TableName: "StoreDirectory",
        KeyConditionExpression: "#pk = :pk and #sk1 BETWEEN :sk1 AND :sk2",
      });

      let queryUnitsBetweenThree = MallStores.query
        .units({ mall, building })
        .between({ store }, { store })
        .params();
      expect(queryUnitsBetweenThree).to.deep.equal({
        ExpressionAttributeNames: {
          "#pk": "gsi1pk",
          "#sk1": "gsi1sk",
          "#storeId": "storeId",
          "#buildingId": "buildingId",
        },
        ExpressionAttributeValues: {
          ":storeId0": "LatteLarrys",
          ":buildingId0": "BuildingA",
          ":pk": `$MallStoreDirectory_1#mall_${mall}`.toLowerCase(),
          ":sk1": `$MallStores#building_${building}`.toLowerCase(),
          ":sk2": `$MallStores#building_${shiftSortOrder(
            building,
            1,
          )}`.toLowerCase(),
        },
        FilterExpression:
          "(#buildingId = :buildingId0) AND #storeId <= :storeId0",
        IndexName: "gsi1pk-gsi1sk-index",
        TableName: "StoreDirectory",
        KeyConditionExpression: "#pk = :pk and #sk1 BETWEEN :sk1 AND :sk2",
      });

      let queryUnitGt = MallStores.query
        .units({ mall })
        .gt({ building })
        .params();

      expect(queryUnitGt).to.deep.equal({
        ExpressionAttributeNames: {
          "#pk": "gsi1pk",
          "#sk1": "gsi1sk",
          "#buildingId": "buildingId",
        },
        ExpressionAttributeValues: {
          ":buildingId0": "BuildingA",
          ":pk": `$MallStoreDirectory_1#mall_${mall}`.toLowerCase(),
          ":sk1": `$MallStores#building_${shiftSortOrder(
            building,
            1,
          )}`.toLowerCase(),
        },
        FilterExpression: "#buildingId > :buildingId0",
        IndexName: "gsi1pk-gsi1sk-index",
        TableName: "StoreDirectory",
        KeyConditionExpression: "#pk = :pk and #sk1 >= :sk1",
      });

      let queryBegins = MallStores.query
        .units({ mall })
        .begins({ building })
        .params();

      expect(queryBegins).to.deep.equal({
        ExpressionAttributeNames: { "#pk": "gsi1pk", "#sk1": "gsi1sk" },
        ExpressionAttributeValues: {
          ":pk": `$MallStoreDirectory_1#mall_${mall}`.toLowerCase(),
          ":sk1": `$MallStores#building_${building}`.toLowerCase(),
        },
        IndexName: "gsi1pk-gsi1sk-index",
        TableName: "StoreDirectory",
        KeyConditionExpression: "#pk = :pk and begins_with(#sk1, :sk1)",
      });

      let queryUnitsGte = MallStores.query
        .units({ mall })
        .gte({ building })
        .params();
      expect(queryUnitsGte).to.deep.equal({
        ExpressionAttributeNames: { "#pk": "gsi1pk", "#sk1": "gsi1sk" },
        ExpressionAttributeValues: {
          ":pk": `$MallStoreDirectory_1#mall_${mall}`.toLowerCase(),
          ":sk1": `$MallStores#building_${building}`.toLowerCase(),
        },
        IndexName: "gsi1pk-gsi1sk-index",
        TableName: "StoreDirectory",
        KeyConditionExpression: "#pk = :pk and #sk1 >= :sk1",
      });

      let queryUnitsLte = MallStores.query
        .units({ mall })
        .lte({ building })
        .params();
      expect(queryUnitsLte).to.deep.equal({
        ExpressionAttributeNames: {
          "#pk": "gsi1pk",
          "#sk1": "gsi1sk",
          "#buildingId": "buildingId",
        },
        ExpressionAttributeValues: {
          ":buildingId0": "BuildingA",
          ":pk": `$MallStoreDirectory_1#mall_${mall}`.toLowerCase(),
          ":sk1": `$MallStores#building_${shiftSortOrder(
            building,
            1,
          )}`.toLowerCase(),
        },
        FilterExpression: "#buildingId <= :buildingId0",
        IndexName: "gsi1pk-gsi1sk-index",
        TableName: "StoreDirectory",
        KeyConditionExpression: "#pk = :pk and #sk1 < :sk1",
      });

      let queryUnitsLt = MallStores.query
        .units({ mall })
        .lt({ building })
        .params();
      expect(queryUnitsLt).to.deep.equal({
        ExpressionAttributeNames: { "#pk": "gsi1pk", "#sk1": "gsi1sk" },
        ExpressionAttributeValues: {
          ":pk": `$MallStoreDirectory_1#mall_${mall}`.toLowerCase(),
          ":sk1": `$MallStores#building_${building}`.toLowerCase(),
        },
        IndexName: "gsi1pk-gsi1sk-index",
        TableName: "StoreDirectory",
        KeyConditionExpression: "#pk = :pk and #sk1 < :sk1",
      });
    });
  });
  describe("Index casing", () => {
    it("should build indexes with the specified case on the entity schema while using composites", () => {
      let schema = {
        model: {
          service: "MallStoreDirectory",
          entity: "MallStores",
          version: "1",
        },
        attributes: {
          id: {
            type: "string",
            field: "id",
          },
          mall: {
            type: "string",
            required: true,
            field: "mall",
          },
          stores: {
            type: "number",
          },
          value: {
            type: "string",
          },
        },
        indexes: {
          store: {
            collection: ["myCollection"],
            pk: {
              field: "partition_key",
              composite: ["id"],
              casing: "none",
            },
            sk: {
              field: "sort_key",
              composite: ["mall", "stores"],
              casing: "upper",
            },
          },
          other: {
            index: "idx1",
            collection: "otherCollection",
            pk: {
              field: "partition_key_idx1",
              composite: ["mall"],
              casing: "upper",
            },
            sk: {
              field: "sort_key_idx1",
              composite: ["id", "stores"],
              casing: "none",
            },
          },
        },
      };

      const MallStores = new Entity(schema, { table: "StoreDirectory" });
      const MallService = new Service(
        { stores: MallStores },
        { table: "StoreDirectory" },
      );
      let id = "Abcd";
      let mall = "Defg";
      let stores = 1;
      let value = "Ahssfh";
      let getParams = MallStores.get({ id, mall, stores }).params();
      let bulkGetParams = MallStores.get([{ id, mall, stores }]).params();
      let deleteParams = MallStores.delete({ id, mall, stores }).params();
      let bulkDeleteParams = MallStores.delete([{ id, mall, stores }]).params();
      let removeParams = MallStores.remove({ id, mall, stores }).params();
      let updateParams = MallStores.update({ id, mall, stores })
        .set({ value })
        .params();
      let patchParams = MallStores.patch({ id, mall, stores })
        .set({ value })
        .params();
      let createParams = MallStores.create({
        id,
        mall,
        stores,
        value,
      }).params();
      let putParams = MallStores.put({ id, mall, stores, value }).params();
      let batchPutParams = MallStores.put([
        { id, mall, stores, value },
      ]).params();
      let query1 = MallStores.query.store({ id, mall, stores }).params();
      let query2 = MallStores.query.other({ id, mall, stores }).params();
      let scanParams = MallStores.scan.params();
      let collectionParams = MallService.collections
        .myCollection({ id })
        .params();
      expect(getParams).to.deep.equal({
        Key: {
          partition_key: "$MallStoreDirectory#id_Abcd",
          sort_key: "$MYCOLLECTION#MALLSTORES_1#MALL_DEFG#STORES_1",
        },
        TableName: "StoreDirectory",
      });
      expect(bulkGetParams).to.deep.equal([
        {
          RequestItems: {
            StoreDirectory: {
              Keys: [
                {
                  partition_key: "$MallStoreDirectory#id_Abcd",
                  sort_key: "$MYCOLLECTION#MALLSTORES_1#MALL_DEFG#STORES_1",
                },
              ],
            },
          },
        },
      ]);
      expect(deleteParams).to.deep.equal({
        Key: {
          partition_key: "$MallStoreDirectory#id_Abcd",
          sort_key: "$MYCOLLECTION#MALLSTORES_1#MALL_DEFG#STORES_1",
        },
        TableName: "StoreDirectory",
      });
      expect(bulkDeleteParams).to.deep.equal([
        {
          RequestItems: {
            StoreDirectory: [
              {
                DeleteRequest: {
                  Key: {
                    partition_key: "$MallStoreDirectory#id_Abcd",
                    sort_key: "$MYCOLLECTION#MALLSTORES_1#MALL_DEFG#STORES_1",
                  },
                },
              },
            ],
          },
        },
      ]);
      expect(removeParams).to.deep.equal({
        Key: {
          partition_key: "$MallStoreDirectory#id_Abcd",
          sort_key: "$MYCOLLECTION#MALLSTORES_1#MALL_DEFG#STORES_1",
        },
        TableName: "StoreDirectory",
        ConditionExpression:
          "attribute_exists(#partition_key) AND attribute_exists(#sort_key)",
        ExpressionAttributeNames: {
          "#partition_key": "partition_key",
          "#sort_key": "sort_key",
        },
      });
      expect(updateParams).to.deep.equal({
        UpdateExpression:
          "SET #value = :value_u0, #id = :id_u0, #mall = :mall_u0, #stores = :stores_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0",
        ExpressionAttributeNames: {
          "#id": "id",
          "#mall": "mall",
          "#stores": "stores",
          "#value": "value",
          "#__edb_e__": "__edb_e__",
          "#__edb_v__": "__edb_v__",
        },
        ExpressionAttributeValues: {
          ":id_u0": "Abcd",
          ":mall_u0": "Defg",
          ":stores_u0": 1,
          ":value_u0": "Ahssfh",
          ":__edb_e___u0": "MallStores",
          ":__edb_v___u0": "1",
        },
        TableName: "StoreDirectory",
        Key: {
          partition_key: "$MallStoreDirectory#id_Abcd",
          sort_key: "$MYCOLLECTION#MALLSTORES_1#MALL_DEFG#STORES_1",
        },
      });
      expect(patchParams).to.deep.equal({
        UpdateExpression:
          "SET #value = :value_u0, #id = :id_u0, #mall = :mall_u0, #stores = :stores_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0",
        ExpressionAttributeNames: {
          "#id": "id",
          "#mall": "mall",
          "#stores": "stores",
          "#value": "value",
          "#__edb_e__": "__edb_e__",
          "#__edb_v__": "__edb_v__",
          "#partition_key": "partition_key",
          "#sort_key": "sort_key",
        },
        ExpressionAttributeValues: {
          ":id_u0": "Abcd",
          ":mall_u0": "Defg",
          ":stores_u0": 1,
          ":value_u0": "Ahssfh",
          ":__edb_e___u0": "MallStores",
          ":__edb_v___u0": "1",
        },
        TableName: "StoreDirectory",
        Key: {
          partition_key: "$MallStoreDirectory#id_Abcd",
          sort_key: "$MYCOLLECTION#MALLSTORES_1#MALL_DEFG#STORES_1",
        },
        ConditionExpression:
          "attribute_exists(#partition_key) AND attribute_exists(#sort_key)",
      });
      expect(createParams).to.deep.equal({
        Item: {
          id: "Abcd",
          mall: "Defg",
          stores: 1,
          value: "Ahssfh",
          partition_key: "$MallStoreDirectory#id_Abcd",
          sort_key: "$MYCOLLECTION#MALLSTORES_1#MALL_DEFG#STORES_1",
          partition_key_idx1: "$MALLSTOREDIRECTORY#MALL_DEFG",
          sort_key_idx1: "$otherCollection#MallStores_1#id_Abcd#stores_1",
          __edb_e__: "MallStores",
          __edb_v__: "1",
        },
        TableName: "StoreDirectory",
        ConditionExpression:
          "attribute_not_exists(#partition_key) AND attribute_not_exists(#sort_key)",
        ExpressionAttributeNames: {
          "#partition_key": "partition_key",
          "#sort_key": "sort_key",
        },
      });
      expect(putParams).to.deep.equal({
        Item: {
          id: "Abcd",
          mall: "Defg",
          stores: 1,
          value: "Ahssfh",
          partition_key: "$MallStoreDirectory#id_Abcd",
          sort_key: "$MYCOLLECTION#MALLSTORES_1#MALL_DEFG#STORES_1",
          partition_key_idx1: "$MALLSTOREDIRECTORY#MALL_DEFG",
          sort_key_idx1: "$otherCollection#MallStores_1#id_Abcd#stores_1",
          __edb_e__: "MallStores",
          __edb_v__: "1",
        },
        TableName: "StoreDirectory",
      });
      expect(batchPutParams).to.deep.equal([
        {
          RequestItems: {
            StoreDirectory: [
              {
                PutRequest: {
                  Item: {
                    __edb_e__: "MallStores",
                    __edb_v__: "1",
                    id: "Abcd",
                    mall: "Defg",
                    partition_key: "$MallStoreDirectory#id_Abcd",
                    partition_key_idx1: "$MALLSTOREDIRECTORY#MALL_DEFG",
                    sort_key: "$MYCOLLECTION#MALLSTORES_1#MALL_DEFG#STORES_1",
                    sort_key_idx1:
                      "$otherCollection#MallStores_1#id_Abcd#stores_1",
                    stores: 1,
                    value: "Ahssfh",
                  },
                },
              },
            ],
          },
        },
      ]);
      expect(query1).to.deep.equal({
        KeyConditionExpression: "#pk = :pk and #sk1 = :sk1",
        TableName: "StoreDirectory",
        ExpressionAttributeNames: {
          "#pk": "partition_key",
          "#sk1": "sort_key",
          "#mall": "mall",
          "#stores": "stores",
        },
        ExpressionAttributeValues: {
          ":mall0": "Defg",
          ":stores0": 1,
          ":pk": "$MallStoreDirectory#id_Abcd",
          ":sk1": "$MYCOLLECTION#MALLSTORES_1#MALL_DEFG#STORES_1",
        },
        FilterExpression: "(#mall = :mall0) AND #stores = :stores0",
      });
      expect(query2).to.deep.equal({
        KeyConditionExpression: "#pk = :pk and #sk1 = :sk1",
        TableName: "StoreDirectory",
        ExpressionAttributeNames: {
          "#pk": "partition_key_idx1",
          "#sk1": "sort_key_idx1",
          "#stores": "stores",
          "#id": "id",
        },
        FilterExpression: "(#id = :id0) AND #stores = :stores0",
        ExpressionAttributeValues: {
          ":id0": "Abcd",
          ":stores0": 1,
          ":pk": "$MALLSTOREDIRECTORY#MALL_DEFG",
          ":sk1": "$otherCollection#MallStores_1#id_Abcd#stores_1",
        },
        IndexName: "idx1",
      });
      expect(scanParams).to.deep.equal({
        TableName: "StoreDirectory",
        ExpressionAttributeNames: {
          "#partition_key": "partition_key",
          "#sort_key": "sort_key",
          "#__edb_e__": "__edb_e__",
          "#__edb_v__": "__edb_v__",
        },
        ExpressionAttributeValues: {
          ":partition_key": "$MallStoreDirectory#id_",
          ":sort_key": "$MYCOLLECTION#MALLSTORES_1#MALL_",
          ":__edb_e__0": "MallStores",
          ":__edb_v__0": "1",
        },
        FilterExpression:
          "begins_with(#partition_key, :partition_key) AND begins_with(#sort_key, :sort_key) AND (#__edb_e__ = :__edb_e__0) AND #__edb_v__ = :__edb_v__0",
      });
      expect(collectionParams).to.deep.equal({
        KeyConditionExpression: "#pk = :pk and begins_with(#sk1, :sk1)",
        TableName: "StoreDirectory",
        ExpressionAttributeNames: {
          "#pk": "partition_key",
          "#sk1": "sort_key",
          "#__edb_e__": "__edb_e__",
          "#__edb_v__": "__edb_v__",
        },
        ExpressionAttributeValues: {
          ":pk": "$MallStoreDirectory#id_Abcd",
          ":sk1": "$MYCOLLECTION",
          ":__edb_e___stores": "MallStores",
          ":__edb_v___stores": "1",
        },
        FilterExpression:
          "(#__edb_e__ = :__edb_e___stores AND #__edb_v__ = :__edb_v___stores)",
      });
    });

    it("should build indexes with the specified case on the entity schema while using key templates", () => {
      let schema = {
        model: {
          service: "MallStoreDirectory",
          entity: "MallStores",
          version: "1",
        },
        attributes: {
          id: {
            type: "string",
            field: "id",
          },
          mall: {
            type: "string",
            required: true,
            field: "mall",
          },
          stores: {
            type: "number",
          },
          value: {
            type: "string",
          },
        },
        indexes: {
          store: {
            pk: {
              field: "partition_key",
              composite: ["id"],
              template: "mIxEdCaSe#${id}",
              casing: "none",
            },
            sk: {
              field: "sort_key",
              composite: ["mall", "stores"],
              template: "mAlL#${mall}#sToReS#${stores}",
              casing: "upper",
            },
          },
          other: {
            index: "idx1",
            pk: {
              field: "partition_key_idx1",
              composite: ["mall"],
              template: "MaLl#${mall}",
              casing: "upper",
            },
            sk: {
              field: "sort_key_idx1",
              composite: ["id", "stores"],
              template: "iD#${id}#sToReS#${stores}",
              casing: "none",
            },
          },
        },
      };
      const MallStores = new Entity(schema, { table: "StoreDirectory" });
      let id = "Abcd";
      let mall = "Defg";
      let stores = 1;
      let value = "Ahssfh";
      let getParams = MallStores.get({ id, mall, stores }).params();
      let bulkGetParams = MallStores.get([{ id, mall, stores }]).params();
      let deleteParams = MallStores.delete({ id, mall, stores }).params();
      let bulkDeleteParams = MallStores.delete([{ id, mall, stores }]).params();
      let removeParams = MallStores.remove({ id, mall, stores }).params();
      let updateParams = MallStores.update({ id, mall, stores })
        .set({ value })
        .params();
      let patchParams = MallStores.patch({ id, mall, stores })
        .set({ value })
        .params();
      let createParams = MallStores.create({
        id,
        mall,
        stores,
        value,
      }).params();
      let putParams = MallStores.put({ id, mall, stores, value }).params();
      let batchPutParams = MallStores.put([
        { id, mall, stores, value },
      ]).params();
      let query1 = MallStores.query.store({ id, mall, stores }).params();
      let query2 = MallStores.query.other({ id, mall, stores }).params();
      let scanParams = MallStores.scan.params();
      expect(getParams).to.deep.equal({
        Key: {
          partition_key: "mIxEdCaSe#Abcd",
          sort_key: "MALL#DEFG#STORES#1",
        },
        TableName: "StoreDirectory",
      });
      expect(bulkGetParams).to.deep.equal([
        {
          RequestItems: {
            StoreDirectory: {
              Keys: [
                {
                  partition_key: "mIxEdCaSe#Abcd",
                  sort_key: "MALL#DEFG#STORES#1",
                },
              ],
            },
          },
        },
      ]);
      expect(deleteParams).to.deep.equal({
        Key: {
          partition_key: "mIxEdCaSe#Abcd",
          sort_key: "MALL#DEFG#STORES#1",
        },
        TableName: "StoreDirectory",
      });
      expect(bulkDeleteParams).to.deep.equal([
        {
          RequestItems: {
            StoreDirectory: [
              {
                DeleteRequest: {
                  Key: {
                    partition_key: "mIxEdCaSe#Abcd",
                    sort_key: "MALL#DEFG#STORES#1",
                  },
                },
              },
            ],
          },
        },
      ]);
      expect(removeParams).to.deep.equal({
        Key: {
          partition_key: "mIxEdCaSe#Abcd",
          sort_key: "MALL#DEFG#STORES#1",
        },
        TableName: "StoreDirectory",
        ConditionExpression:
          "attribute_exists(#partition_key) AND attribute_exists(#sort_key)",
        ExpressionAttributeNames: {
          "#partition_key": "partition_key",
          "#sort_key": "sort_key",
        },
      });
      expect(updateParams).to.deep.equal({
        UpdateExpression:
          "SET #value = :value_u0, #id = :id_u0, #mall = :mall_u0, #stores = :stores_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0",
        ExpressionAttributeNames: {
          "#id": "id",
          "#mall": "mall",
          "#stores": "stores",
          "#value": "value",
          "#__edb_e__": "__edb_e__",
          "#__edb_v__": "__edb_v__",
        },
        ExpressionAttributeValues: {
          ":id_u0": "Abcd",
          ":mall_u0": "Defg",
          ":stores_u0": 1,
          ":value_u0": "Ahssfh",
          ":__edb_e___u0": "MallStores",
          ":__edb_v___u0": "1",
        },
        TableName: "StoreDirectory",
        Key: {
          partition_key: "mIxEdCaSe#Abcd",
          sort_key: "MALL#DEFG#STORES#1",
        },
      });
      expect(patchParams).to.deep.equal({
        UpdateExpression:
          "SET #value = :value_u0, #id = :id_u0, #mall = :mall_u0, #stores = :stores_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0",
        ExpressionAttributeNames: {
          "#value": "value",
          "#id": "id",
          "#mall": "mall",
          "#stores": "stores",
          "#__edb_e__": "__edb_e__",
          "#__edb_v__": "__edb_v__",
          "#partition_key": "partition_key",
          "#sort_key": "sort_key",
        },
        ExpressionAttributeValues: {
          ":id_u0": "Abcd",
          ":mall_u0": "Defg",
          ":stores_u0": 1,
          ":value_u0": "Ahssfh",
          ":__edb_e___u0": "MallStores",
          ":__edb_v___u0": "1",
        },
        TableName: "StoreDirectory",
        Key: {
          partition_key: "mIxEdCaSe#Abcd",
          sort_key: "MALL#DEFG#STORES#1",
        },
        ConditionExpression:
          "attribute_exists(#partition_key) AND attribute_exists(#sort_key)",
      });
      expect(createParams).to.deep.equal({
        Item: {
          id: "Abcd",
          mall: "Defg",
          stores: 1,
          value: "Ahssfh",
          partition_key: "mIxEdCaSe#Abcd",
          sort_key: "MALL#DEFG#STORES#1",
          partition_key_idx1: "MALL#DEFG",
          sort_key_idx1: "iD#Abcd#sToReS#1",
          __edb_e__: "MallStores",
          __edb_v__: "1",
        },
        TableName: "StoreDirectory",
        ConditionExpression:
          "attribute_not_exists(#partition_key) AND attribute_not_exists(#sort_key)",
        ExpressionAttributeNames: {
          "#partition_key": "partition_key",
          "#sort_key": "sort_key",
        },
      });
      expect(putParams).to.deep.equal({
        Item: {
          id: "Abcd",
          mall: "Defg",
          stores: 1,
          value: "Ahssfh",
          partition_key: "mIxEdCaSe#Abcd",
          sort_key: "MALL#DEFG#STORES#1",
          partition_key_idx1: "MALL#DEFG",
          sort_key_idx1: "iD#Abcd#sToReS#1",
          __edb_e__: "MallStores",
          __edb_v__: "1",
        },
        TableName: "StoreDirectory",
      });
      expect(batchPutParams).to.deep.equal([
        {
          RequestItems: {
            StoreDirectory: [
              {
                PutRequest: {
                  Item: {
                    __edb_e__: "MallStores",
                    __edb_v__: "1",
                    id: "Abcd",
                    mall: "Defg",
                    partition_key: "mIxEdCaSe#Abcd",
                    partition_key_idx1: "MALL#DEFG",
                    sort_key: "MALL#DEFG#STORES#1",
                    sort_key_idx1: "iD#Abcd#sToReS#1",
                    stores: 1,
                    value: "Ahssfh",
                  },
                },
              },
            ],
          },
        },
      ]);
      expect(query1).to.deep.equal({
        KeyConditionExpression: "#pk = :pk and #sk1 = :sk1",
        TableName: "StoreDirectory",
        ExpressionAttributeNames: {
          "#pk": "partition_key",
          "#sk1": "sort_key",
          "#mall": "mall",
          "#stores": "stores",
        },
        ExpressionAttributeValues: {
          ":mall0": "Defg",
          ":stores0": 1,
          ":pk": "mIxEdCaSe#Abcd",
          ":sk1": "MALL#DEFG#STORES#1",
        },
        FilterExpression: "(#mall = :mall0) AND #stores = :stores0",
      });
      expect(query2).to.deep.equal({
        KeyConditionExpression: "#pk = :pk and #sk1 = :sk1",
        TableName: "StoreDirectory",
        ExpressionAttributeNames: {
          "#pk": "partition_key_idx1",
          "#sk1": "sort_key_idx1",
          "#id": "id",
          "#stores": "stores",
        },
        ExpressionAttributeValues: {
          ":id0": "Abcd",
          ":stores0": 1,
          ":pk": "MALL#DEFG",
          ":sk1": "iD#Abcd#sToReS#1",
        },
        FilterExpression: "(#id = :id0) AND #stores = :stores0",
        IndexName: "idx1",
      });
      expect(scanParams).to.deep.equal({
        TableName: "StoreDirectory",
        ExpressionAttributeNames: {
          "#partition_key": "partition_key",
          "#sort_key": "sort_key",
          "#__edb_e__": "__edb_e__",
          "#__edb_v__": "__edb_v__",
        },
        ExpressionAttributeValues: {
          ":partition_key": "mIxEdCaSe#",
          ":sort_key": "MALL#",
          ":__edb_e__0": "MallStores",
          ":__edb_v__0": "1",
        },
        FilterExpression:
          "begins_with(#partition_key, :partition_key) AND begins_with(#sort_key, :sort_key) AND (#__edb_e__ = :__edb_e__0) AND #__edb_v__ = :__edb_v__0",
      });
    });
  });
  describe("Making keys", () => {
    let MallStores = new Entity(schema);
    let mall = "EastPointe";
    let store = "LatteLarrys";
    let building = "BuildingA";
    let id = uuid();
    let category = "coffee";
    let unit = "B54";
    let leaseEnd = "2020-01-20";
    it("Should return the approprate pk and sk for a given index", () => {
      let index = schema.indexes.categories.index;
      let { pk, sk } = MallStores._makeIndexKeys({
        index,
        pkAttributes: { mall },
        skAttributes: [{ category, building, unit, store }],
      });
      expect(pk).to.equal(
        "$MallStoreDirectory_1#mall_EastPointe".toLowerCase(),
      );
      expect(sk)
        .to.be.an("array")
        .and.have.length(1)
        .and.include(
          "$MallStores#category_coffee#building_BuildingA#unit_B54#store_LatteLarrys".toLowerCase(),
        );
    });
    it("Should identify when a composite attribute cannot be made based on the data provided", () => {
      let schema = {
        service: "MallStoreDirectory",
        entity: "MallStores",
        table: "StoreDirectory",
        version: "1",
        attributes: {
          id: {
            type: "string",
            field: "id",
          },
          mall: {
            type: "string",
            required: true,
            field: "mall",
          },
          stores: {
            type: "number",
          },
        },
        filters: {},
        indexes: {
          store: {
            pk: {
              field: "pk",
              facets: ["id"],
            },
            sk: {
              field: "sk",
              facets: ["mall", "stores"],
            },
          },
        },
      };
      let MallStores = new Entity(schema);
      let tests = [
        {
          happy: true,
          input: {
            id: "12345",
            mall: "Washington Square",
            stores: 1,
          },
          output: {
            Item: {
              id: "12345",
              mall: "Washington Square",
              stores: 1,
              pk: "$mallstoredirectory_1#id_12345",
              sk: "$mallstores#mall_washington square#stores_1",
              __edb_e__: "MallStores",
              __edb_v__: "1",
            },
            TableName: "StoreDirectory",
          },
        },
        {
          happy: true,
          input: {
            id: "12345",
            mall: "Washington Square",
            stores: 0,
          },
          output: {
            Item: {
              id: "12345",
              mall: "Washington Square",
              stores: 0,
              pk: "$mallstoredirectory_1#id_12345",
              sk: "$mallstores#mall_washington square#stores_0",
              __edb_e__: "MallStores",
              __edb_v__: "1",
            },
            TableName: "StoreDirectory",
          },
        },
        {
          happy: true,
          input: {
            id: "12345",
            mall: "",
            stores: 1,
          },
          output: {
            Item: {
              id: "12345",
              mall: "",
              stores: 1,
              pk: "$mallstoredirectory_1#id_12345",
              sk: "$mallstores#mall_#stores_1",
              __edb_e__: "MallStores",
              __edb_v__: "1",
            },
            TableName: "StoreDirectory",
          },
        },
        {
          happy: false,
          input: {
            id: "12345",
            mall: "Washington Square",
            stores: undefined,
          },
          output: `Incomplete or invalid key composite attributes supplied. Missing properties: "stores" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#incomplete-composite-attributes`,
        },
        {
          happy: false,
          input: {
            id: "12345",
            mall: "Washington Square",
            stores: null,
          },
          output: `Invalid value type at entity path: "stores". Received value of type "object", expected value of type "number"`,
        },
        {
          happy: false,
          input: {
            id: "12345",
            mall,
          },
          output: `Incomplete or invalid key composite attributes supplied. Missing properties: "stores" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#incomplete-composite-attributes`,
        },
      ];
      for (let test of tests) {
        if (test.happy) {
          expect(MallStores.put(test.input).params()).to.deep.equal(
            test.output,
          );
        } else {
          expect(() => MallStores.put(test.input).params()).to.throw(
            test.output,
          );
        }
      }
    });

    it("Should use the index field names as theyre specified on the model", () => {
      let schema = {
        service: "MallStoreDirectory",
        entity: "MallStores",
        table: "StoreDirectory",
        version: "1",
        attributes: {
          id: {
            type: "string",
            field: "id",
          },
          mall: {
            type: "string",
            required: true,
            field: "mall",
          },
          stores: {
            type: "number",
          },
          value: {
            type: "string",
          },
        },
        filters: {},
        indexes: {
          store: {
            pk: {
              field: "partition_key",
              facets: ["id"],
            },
            sk: {
              field: "sort_key",
              facets: ["mall", "stores"],
            },
          },
          other: {
            index: "idx1",
            pk: {
              field: "partition_key_idx1",
              facets: ["mall"],
            },
            sk: {
              field: "sort_key_idx1",
              facets: ["id", "stores"],
            },
          },
        },
      };
      let MallStores = new Entity(schema);
      let id = "abcd";
      let mall = "defg";
      let stores = 1;
      let value = "ahssfh";
      let getParams = MallStores.get({ id, mall, stores }).params();
      let deleteParams = MallStores.delete({ id, mall, stores }).params();
      let removeParams = MallStores.remove({ id, mall, stores }).params();
      let updateParams = MallStores.update({ id, mall, stores })
        .set({ value })
        .params();
      let patchParams = MallStores.patch({ id, mall, stores })
        .set({ value })
        .params();
      let createParams = MallStores.create({
        id,
        mall,
        stores,
        value,
      }).params();
      let putParams = MallStores.put({ id, mall, stores, value }).params();
      let query1 = MallStores.query.store({ id, mall, stores }).params();
      let query2 = MallStores.query.other({ id, mall, stores }).params();
      let scanParams = MallStores.scan.params();
      expect(getParams).to.deep.equal({
        Key: {
          partition_key: "$mallstoredirectory_1#id_abcd",
          sort_key: "$mallstores#mall_defg#stores_1",
        },
        TableName: "StoreDirectory",
      });
      expect(deleteParams).to.deep.equal({
        Key: {
          partition_key: "$mallstoredirectory_1#id_abcd",
          sort_key: "$mallstores#mall_defg#stores_1",
        },
        TableName: "StoreDirectory",
      });
      expect(removeParams).to.deep.equal({
        Key: {
          partition_key: "$mallstoredirectory_1#id_abcd",
          sort_key: "$mallstores#mall_defg#stores_1",
        },
        TableName: "StoreDirectory",
        ConditionExpression:
          "attribute_exists(#partition_key) AND attribute_exists(#sort_key)",
        ExpressionAttributeNames: {
          "#partition_key": "partition_key",
          "#sort_key": "sort_key",
        },
      });
      expect(updateParams).to.deep.equal({
        UpdateExpression:
          "SET #value = :value_u0, #id = :id_u0, #mall = :mall_u0, #stores = :stores_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0",
        ExpressionAttributeNames: {
          "#value": "value",
          "#id": "id",
          "#mall": "mall",
          "#stores": "stores",
          "#__edb_e__": "__edb_e__",
          "#__edb_v__": "__edb_v__",
        },
        ExpressionAttributeValues: {
          ":value_u0": "ahssfh",
          ":id_u0": "abcd",
          ":mall_u0": "defg",
          ":stores_u0": 1,
          ":__edb_e___u0": "MallStores",
          ":__edb_v___u0": "1",
        },
        TableName: "StoreDirectory",
        Key: {
          partition_key: "$mallstoredirectory_1#id_abcd",
          sort_key: "$mallstores#mall_defg#stores_1",
        },
      });
      expect(patchParams).to.deep.equal({
        UpdateExpression:
          "SET #value = :value_u0, #id = :id_u0, #mall = :mall_u0, #stores = :stores_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0",
        ExpressionAttributeNames: {
          "#value": "value",
          "#id": "id",
          "#mall": "mall",
          "#stores": "stores",
          "#__edb_e__": "__edb_e__",
          "#__edb_v__": "__edb_v__",
          "#partition_key": "partition_key",
          "#sort_key": "sort_key",
        },
        ExpressionAttributeValues: {
          ":value_u0": "ahssfh",
          ":id_u0": "abcd",
          ":mall_u0": "defg",
          ":stores_u0": 1,
          ":__edb_e___u0": "MallStores",
          ":__edb_v___u0": "1",
        },
        TableName: "StoreDirectory",
        Key: {
          partition_key: "$mallstoredirectory_1#id_abcd",
          sort_key: "$mallstores#mall_defg#stores_1",
        },
        ConditionExpression:
          "attribute_exists(#partition_key) AND attribute_exists(#sort_key)",
      });
      expect(createParams).to.deep.equal({
        Item: {
          id: "abcd",
          mall: "defg",
          stores: 1,
          value: "ahssfh",
          partition_key: "$mallstoredirectory_1#id_abcd",
          sort_key: "$mallstores#mall_defg#stores_1",
          partition_key_idx1: "$mallstoredirectory_1#mall_defg",
          sort_key_idx1: "$mallstores#id_abcd#stores_1",
          __edb_e__: "MallStores",
          __edb_v__: "1",
        },
        TableName: "StoreDirectory",
        ConditionExpression:
          "attribute_not_exists(#partition_key) AND attribute_not_exists(#sort_key)",
        ExpressionAttributeNames: {
          "#partition_key": "partition_key",
          "#sort_key": "sort_key",
        },
      });
      expect(putParams).to.deep.equal({
        Item: {
          id: "abcd",
          mall: "defg",
          stores: 1,
          value: "ahssfh",
          partition_key: "$mallstoredirectory_1#id_abcd",
          sort_key: "$mallstores#mall_defg#stores_1",
          partition_key_idx1: "$mallstoredirectory_1#mall_defg",
          sort_key_idx1: "$mallstores#id_abcd#stores_1",
          __edb_e__: "MallStores",
          __edb_v__: "1",
        },
        TableName: "StoreDirectory",
      });
      expect(query1).to.deep.equal({
        KeyConditionExpression: "#pk = :pk and #sk1 = :sk1",
        TableName: "StoreDirectory",
        ExpressionAttributeNames: {
          "#pk": "partition_key",
          "#sk1": "sort_key",
          "#mall": "mall",
          "#stores": "stores",
        },
        ExpressionAttributeValues: {
          ":mall0": "defg",
          ":stores0": 1,
          ":pk": "$mallstoredirectory_1#id_abcd",
          ":sk1": "$mallstores#mall_defg#stores_1",
        },
        FilterExpression: "(#mall = :mall0) AND #stores = :stores0",
      });
      expect(query2).to.deep.equal({
        KeyConditionExpression: "#pk = :pk and #sk1 = :sk1",
        TableName: "StoreDirectory",
        ExpressionAttributeNames: {
          "#pk": "partition_key_idx1",
          "#sk1": "sort_key_idx1",
          "#stores": "stores",
          "#id": "id",
        },
        ExpressionAttributeValues: {
          ":id0": "abcd",
          ":stores0": 1,
          ":pk": "$mallstoredirectory_1#mall_defg",
          ":sk1": "$mallstores#id_abcd#stores_1",
        },
        FilterExpression: "(#id = :id0) AND #stores = :stores0",
        IndexName: "idx1",
      });
      expect(scanParams).to.deep.equal({
        TableName: "StoreDirectory",
        ExpressionAttributeNames: {
          "#partition_key": "partition_key",
          "#sort_key": "sort_key",
          "#__edb_e__": "__edb_e__",
          "#__edb_v__": "__edb_v__",
        },
        ExpressionAttributeValues: {
          ":partition_key": "$mallstoredirectory_1#id_",
          ":sort_key": "$mallstores#mall_",
          ":__edb_e__0": "MallStores",
          ":__edb_v__0": "1",
        },
        FilterExpression:
          "begins_with(#partition_key, :partition_key) AND begins_with(#sort_key, :sort_key) AND (#__edb_e__ = :__edb_e__0) AND #__edb_v__ = :__edb_v__0",
      });
    });
    it("Should stop making a key early when there is a gap in the supplied composite attributes", () => {
      let index = schema.indexes.categories.index;
      let { pk, sk } = MallStores._makeIndexKeys({
        index,
        pkAttributes: { mall },
        skAttributes: [{ category, building, store }],
      });
      expect(pk).to.equal(
        "$MallStoreDirectory_1#mall_EastPointe".toLowerCase(),
      );
      expect(sk)
        .to.be.an("array")
        .and.have.length(1)
        .and.include(
          "$MallStores#category_coffee#building_BuildingA#unit_".toLowerCase(),
        );
    });
    it("Should overload a PK with Entity details for entity scoping when an index lacks an SK", () => {
      let MallStores = new Entity(schema);
      let id = "12345";
      let mall = "EastPointe";
      let store = "LatteLarrys";
      let building = "BuildingA";
      let category = "food/coffee";
      let unit = "B54";
      let leaseEnd = "2020-01-20";
      let rent = "0.00";
      let getParams = MallStores.get({ id }).params();
      let updateParams = MallStores.update({ id }).set({ rent }).params();
      let patchParams = MallStores.patch({ id }).set({ rent }).params();
      let putParams = MallStores.put({
        id,
        mall,
        store,
        building,
        unit,
        category,
        leaseEnd,
        rent,
      }).params();
      let createParams = MallStores.create({
        id,
        mall,
        store,
        building,
        unit,
        category,
        leaseEnd,
        rent,
      }).params();
      let scanParams = MallStores.scan
        .filter((attr) => attr.id.eq(id))
        .params();
      let queryParams = MallStores.query.store({ id }).params();
      let findParams = MallStores.find({ id }).params();
      let matchParams = MallStores.match({ id }).params();
      const PK = "$mallstoredirectory_1$mallstores#id_12345";
      expect(getParams.Key.pk).to.equal(PK);
      expect(getParams.Key.sk).to.be.undefined;
      expect(updateParams.Key.pk).to.equal(PK);
      expect(updateParams.Key.sk).to.be.undefined;
      expect(patchParams.Key.pk).to.equal(PK);
      expect(patchParams.Key.sk).to.be.undefined;
      expect(putParams.Item.pk).to.equal(PK);
      expect(putParams.Item.sk).to.be.undefined;
      expect(createParams.Item.pk).to.equal(PK);
      expect(createParams.Item.sk).to.be.undefined;
      expect(queryParams.ExpressionAttributeValues[":pk"]).to.equal(PK);
      expect(queryParams.ExpressionAttributeValues[":sk"]).to.be.undefined;
      expect(scanParams.ExpressionAttributeValues[":pk"]).to.equal(
        PK.replace(id, ""),
      );
      expect(scanParams.ExpressionAttributeValues[":sk"]).to.be.undefined;
      expect(findParams.ExpressionAttributeValues[":pk"]).to.equal(PK);
      expect(findParams.ExpressionAttributeValues[":sk"]).to.be.undefined;
      expect(matchParams.ExpressionAttributeValues[":pk"]).to.equal(PK);
      expect(matchParams.ExpressionAttributeValues[":sk"]).to.be.undefined;
    });
    it("Should create the correct key structure when a table has a PK and an SK", () => {
      let schema = {
        service: "MallStoreDirectory",
        entity: "MallStores",
        table: "StoreDirectory",
        version: "1",
        attributes: {
          id: {
            type: "string",
            field: "id",
          },
          mall: {
            type: "string",
            required: true,
            field: "mall",
          },
          store: {
            type: "string",
            required: true,
            field: "storeId",
          },
          building: {
            type: "string",
            required: true,
            field: "buildingId",
          },
          unit: {
            type: "string",
            required: true,
            field: "unitId",
          },
          category: {
            type: [
              "food/coffee",
              "food/meal",
              "clothing",
              "electronics",
              "department",
              "misc",
            ],
            required: true,
          },
          leaseEnd: {
            type: "string",
            required: true,
          },
          rent: {
            type: "string",
            required: false,
            default: "0.00",
          },
          adjustments: {
            type: "string",
            required: false,
          },
        },
        filters: {},
        indexes: {
          store: {
            pk: {
              field: "pk",
              facets: ["id"],
            },
            sk: {
              field: "sk",
              facets: ["mall"],
            },
          },
          units: {
            index: "gsi1pk-gsi1sk-index",
            pk: {
              field: "gsi1pk",
              facets: ["mall"],
            },
            sk: {
              field: "gsi1sk",
              facets: ["building", "unit", "store"],
            },
          },
        },
      };

      let MallStores = new Entity(schema);
      let id = "12345";
      let mall = "EastPointe";
      let store = "LatteLarrys";
      let building = "BuildingA";
      let category = "food/coffee";
      let unit = "B54";
      let leaseEnd = "2020-01-20";
      let rent = "0.00";
      let getParams = MallStores.get({ id, mall }).params();
      let updateParams = MallStores.update({ id, mall }).set({ rent }).params();
      let patchParams = MallStores.patch({ id, mall }).set({ rent }).params();
      let putParams = MallStores.put({
        id,
        mall,
        store,
        building,
        unit,
        category,
        leaseEnd,
        rent,
      }).params();
      let createParams = MallStores.create({
        id,
        mall,
        store,
        building,
        unit,
        category,
        leaseEnd,
        rent,
      }).params();
      let scanParams = MallStores.scan
        .filter((attr) => attr.id.eq(id))
        .params();
      let queryParams = MallStores.query.store({ id, mall }).params();
      let findParams = MallStores.find({ id, mall }).params();
      let matchParams = MallStores.find({ id, mall }).params();
      let partialQueryParams = MallStores.query.store({ id }).params();
      let partialFindParams = MallStores.find({ id }).params();
      let partialMatchParams = MallStores.find({ id }).params();
      const PK = "$mallstoredirectory_1#id_12345";
      const SK = "$mallstores#mall_eastpointe";
      expect(getParams.Key.pk).to.equal(PK);
      expect(getParams.Key.sk).to.equal(SK);
      expect(updateParams.Key.pk).to.equal(PK);
      expect(updateParams.Key.sk).to.equal(SK);
      expect(patchParams.Key.pk).to.equal(PK);
      expect(patchParams.Key.sk).to.equal(SK);
      expect(putParams.Item.pk).to.equal(PK);
      expect(putParams.Item.sk).to.equal(SK);
      expect(createParams.Item.pk).to.equal(PK);
      expect(createParams.Item.sk).to.equal(SK);
      expect(queryParams.ExpressionAttributeValues[":pk"]).to.equal(PK);
      expect(queryParams.ExpressionAttributeValues[":sk1"]).to.equal(SK);
      expect(scanParams.ExpressionAttributeValues[":pk"]).to.equal(
        PK.replace(id.toLowerCase(), ""),
      );
      expect(scanParams.ExpressionAttributeValues[":sk"]).to.equal(
        SK.replace(mall.toLowerCase(), ""),
      );
      expect(findParams.ExpressionAttributeValues[":pk"]).to.equal(PK);
      expect(findParams.ExpressionAttributeValues[":sk1"]).to.equal(SK);
      expect(matchParams.ExpressionAttributeValues[":pk"]).to.equal(PK);
      expect(matchParams.ExpressionAttributeValues[":sk1"]).to.equal(SK);
      expect(partialQueryParams.ExpressionAttributeValues[":pk"]).to.equal(PK);
      expect(partialQueryParams.ExpressionAttributeValues[":sk1"]).to.equal(
        SK.replace(mall.toLowerCase(), ""),
      );
      expect(partialFindParams.ExpressionAttributeValues[":pk"]).to.equal(PK);
      expect(partialFindParams.ExpressionAttributeValues[":sk1"]).to.equal(
        SK.replace(mall.toLowerCase(), ""),
      );
      expect(partialMatchParams.ExpressionAttributeValues[":pk"]).to.equal(PK);
      expect(partialMatchParams.ExpressionAttributeValues[":sk1"]).to.equal(
        SK.replace(mall.toLowerCase(), ""),
      );
    });
    it("Should return the approprate pk and multiple sks when given multiple", () => {
      let index = schema.indexes.shops.index;
      let { pk, sk } = MallStores._makeIndexKeys({
        index,
        pkAttributes: { store },
        skAttributes: [
          { mall, building: "building1" },
          { mall, building: "building5" },
        ],
      });
      expect(pk).to.equal(
        "$MallStoreDirectory_1#store_LatteLarrys".toLowerCase(),
      );
      expect(sk)
        .to.be.an("array")
        .and.have.length(2)
        .and.to.have.members([
          "$MallStores#mall_EastPointe#building_building1#unit_".toLowerCase(),
          "$MallStores#mall_EastPointe#building_building5#unit_".toLowerCase(),
        ]);
    });
    it("Should return the appropriate pk and multiple sks when given multiple without a tailing label", () => {
      let index = schema.indexes.shops.index;
      let { pk, sk } = MallStores._makeIndexKeysWithoutTail(
        {
          query: {
            index,
            keys: {
              pk: { store },
            },
            options: {},
          },
        },
        [
          { mall, building: "building1" },
          { mall, building: "building5" },
        ],
      );
      expect(pk).to.equal(
        "$MallStoreDirectory_1#store_LatteLarrys".toLowerCase(),
      );
      expect(sk)
        .to.be.an("array")
        .and.have.length(2)
        .and.to.have.members([
          "$MallStores#mall_EastPointe#building_building1".toLowerCase(),
          "$MallStores#mall_EastPointe#building_building5".toLowerCase(),
        ]);
    });
    it("Should throw on bad index", () => {
      expect(() =>
        MallStores._makeIndexKeys({
          index: "bad_index",
        }),
      ).to.throw("Invalid index: bad_index");
    });

    it("Should allow composite attributes to be a composite attribute template (string)", () => {
      const schema = {
        service: "MallStoreDirectory",
        entity: "MallStores",
        table: "StoreDirectory",
        version: "1",
        attributes: {
          id: {
            type: "string",
            field: "storeLocationId",
          },
          date: {
            type: "string",
            field: "dateTime",
          },
          prop1: {
            type: "string",
          },
          prop2: {
            type: "string",
          },
        },
        indexes: {
          record: {
            pk: {
              field: "pk",
              facets: "id_${id}#p1_${prop1}",
            },
            sk: {
              field: "sk",
              facets: "d_${date}#p2_${prop2}",
            },
          },
        },
      };
      let mallStore = new Entity(schema);
      let putParams = mallStore
        .put({
          id: "IDENTIFIER",
          date: "DATE",
          prop1: "PROPERTY1",
          prop2: "PROPERTY2",
        })
        .params();
      expect(putParams).to.deep.equal({
        Item: {
          __edb_e__: "MallStores",
          __edb_v__: "1",
          storeLocationId: "IDENTIFIER",
          dateTime: "DATE",
          prop1: "PROPERTY1",
          prop2: "PROPERTY2",
          pk: "id_identifier#p1_property1",
          sk: "d_date#p2_property2",
        },
        TableName: "StoreDirectory",
      });
    });
    it("Create operation should include correct conditions to prevent overwriting existing record", () => {
      let schema = {
        service: "MallStoreDirectory",
        entity: "MallStores",
        table: "StoreDirectory",
        version: "1",
        attributes: {
          id: {
            type: "string",
            field: "id",
          },
          mall: {
            type: "string",
            required: true,
            field: "mall",
          },
          store: {
            type: "string",
            required: true,
            field: "storeId",
          },
          building: {
            type: "string",
            required: true,
            field: "buildingId",
          },
          unit: {
            type: "string",
            required: true,
            field: "unitId",
          },
          category: {
            type: [
              "food/coffee",
              "food/meal",
              "clothing",
              "electronics",
              "department",
              "misc",
            ],
            required: true,
          },
          leaseEnd: {
            type: "string",
            required: true,
          },
          rent: {
            type: "string",
            required: false,
            default: "0.00",
          },
          adjustments: {
            type: "string",
            required: false,
          },
        },
        filters: {},
        indexes: {
          store: {
            pk: {
              field: "pk",
              facets: ["id"],
            },
            sk: {
              field: "sk",
              facets: ["mall"],
            },
          },
          units: {
            index: "gsi1pk-gsi1sk-index",
            pk: {
              field: "gsi1pk",
              facets: ["mall"],
            },
            sk: {
              field: "gsi1sk",
              facets: ["building", "unit", "store"],
            },
          },
        },
      };
      let MallStores = new Entity(schema);
      let id = "12345";
      let mall = "EastPointe";
      let store = "LatteLarrys";
      let building = "BuildingA";
      let category = "food/coffee";
      let unit = "B54";
      let leaseEnd = "2020-01-20";
      let rent = "0.00";
      let createParams = MallStores.create({
        id,
        mall,
        store,
        building,
        unit,
        category,
        leaseEnd,
        rent,
      }).params();
      expect(createParams).to.deep.equal({
        Item: {
          id: "12345",
          mall: "EastPointe",
          storeId: "LatteLarrys",
          buildingId: "BuildingA",
          unitId: "B54",
          category: "food/coffee",
          leaseEnd: "2020-01-20",
          rent: "0.00",
          pk: "$mallstoredirectory_1#id_12345",
          sk: "$mallstores#mall_eastpointe",
          gsi1pk: "$mallstoredirectory_1#mall_eastpointe",
          gsi1sk: "$mallstores#building_buildinga#unit_b54#store_lattelarrys",
          __edb_e__: "MallStores",
          __edb_v__: "1",
        },
        TableName: "StoreDirectory",
        ConditionExpression:
          "attribute_not_exists(#pk) AND attribute_not_exists(#sk)",
        ExpressionAttributeNames: { "#pk": "pk", "#sk": "sk" },
      });
    });
    it("Patch operation should include correct conditions to prevent insert record when trying to update existing", () => {
      let schema = {
        service: "MallStoreDirectory",
        entity: "MallStores",
        table: "StoreDirectory",
        version: "1",
        attributes: {
          id: {
            type: "string",
            field: "id",
          },
          mall: {
            type: "string",
            required: true,
            field: "mall",
          },
          store: {
            type: "string",
            required: true,
            field: "storeId",
          },
          building: {
            type: "string",
            required: true,
            field: "buildingId",
          },
          unit: {
            type: "string",
            required: true,
            field: "unitId",
          },
          category: {
            type: [
              "food/coffee",
              "food/meal",
              "clothing",
              "electronics",
              "department",
              "misc",
            ],
            required: true,
          },
          leaseEnd: {
            type: "string",
            required: true,
          },
          rent: {
            type: "string",
            required: false,
            default: "0.00",
          },
          adjustments: {
            type: "string",
            required: false,
          },
        },
        filters: {},
        indexes: {
          store: {
            pk: {
              field: "pk",
              facets: ["id"],
            },
            sk: {
              field: "sk",
              facets: ["mall"],
            },
          },
          units: {
            index: "gsi1pk-gsi1sk-index",
            pk: {
              field: "gsi1pk",
              facets: ["mall"],
            },
            sk: {
              field: "gsi1sk",
              facets: ["building", "unit", "store"],
            },
          },
        },
      };
      let MallStores = new Entity(schema);
      let id = "12345";
      let mall = "EastPointe";
      let store = "LatteLarrys";
      let building = "BuildingA";
      let category = "food/coffee";
      let unit = "B54";
      let leaseEnd = "2020-01-20";
      let rent = "0.00";
      let patchParams = MallStores.patch({ id, mall }).set({ rent }).params();
      expect(patchParams).to.deep.equal({
        UpdateExpression:
          "SET #rent = :rent_u0, #id = :id_u0, #mall = :mall_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0",
        ExpressionAttributeNames: {
          "#id": "id",
          "#mall": "mall",
          "#rent": "rent",
          "#__edb_e__": "__edb_e__",
          "#__edb_v__": "__edb_v__",
          "#pk": "pk",
          "#sk": "sk",
        },
        ExpressionAttributeValues: {
          ":id_u0": "12345",
          ":rent_u0": "0.00",
          ":mall_u0": "EastPointe",
          ":__edb_e___u0": "MallStores",
          ":__edb_v___u0": "1",
        },
        TableName: "StoreDirectory",
        Key: {
          pk: "$mallstoredirectory_1#id_12345",
          sk: "$mallstores#mall_eastpointe",
        },
        ConditionExpression: "attribute_exists(#pk) AND attribute_exists(#sk)",
      });
    });
    it("Should allow for both a composite attribute array and a composite attribute template to be passed", () => {
      const entity = new Entity({
        model: {
          entity: "test",
          service: "tester",
          version: "1",
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
          },
          attr4: {
            type: "string",
          },
        },
        indexes: {
          record: {
            pk: {
              field: "pk",
              composite: ["attr1", "attr2"],
              template: "${attr1}#${attr2}",
            },
            sk: {
              field: "sk",
              composite: ["attr3", "attr4"],
              template: "${attr3}#${attr4}",
            },
          },
          theseRecords: {
            index: "gsi1",
            pk: {
              field: "gsi1pk",
              composite: ["attr1", "attr2", "attr3", "attr4"],
              template: "${attr1}#${attr2}#${attr3}#${attr4}",
            },
            sk: {
              // empty properties
              field: "gsi1sk",
              composite: [],
              template: "",
            },
          },
          thoseRecords: {
            index: "gsi2",
            pk: {
              field: "gsi2pk",
              composite: ["attr1", "attr2", "attr3", "attr4"],
              template: "${attr1}#${attr2}#${attr3}#${attr4}",
            },
            // no pk
          },
        },
      });
    });
    it("Should throw when a supplied composite attribute array does not match a composite attribute template's parsed attributes - On PK Definition", () => {
      const schema = {
        model: {
          entity: "test",
          service: "tester",
          version: "1",
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
          },
          attr4: {
            type: "string",
          },
        },
        indexes: {
          record: {
            pk: {
              field: "pk",
              composite: ["attr1", "attr2"],
              template: "${attr2}#${attr1}",
            },
            sk: {
              field: "sk",
              composite: ["attr3", "attr4"],
              template: "${attr3}#${attr4}",
            },
          },
        },
      };
      expect(() => new Entity(schema)).to.throw(
        `Incompatible PK 'template' and 'composite' properties for defined on index "(Primary Index)". PK "template" string is defined as having composite attributes "attr2", "attr1" while PK "composite" array is defined with composite attributes "attr1", "attr2" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#incompatible-key-composite-attribute-template`,
      );
    });
    it("Should throw when a supplied composite attribute array does not match a composite attribute template's parsed attributes - On SK Definition", () => {
      const schema = {
        model: {
          entity: "test",
          service: "tester",
          version: "1",
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
          },
          attr4: {
            type: "string",
          },
        },
        indexes: {
          record: {
            pk: {
              field: "pk",
              composite: ["attr2"],
              template: "${attr2}",
            },
            sk: {
              field: "sk",
              composite: ["attr3", "attr4"],
              template: "${attr4}#${attr3}",
            },
          },
        },
      };
      expect(() => new Entity(schema)).to.throw(
        `Incompatible SK 'template' and 'composite' properties for defined on index "(Primary Index)". SK "template" string is defined as having composite attributes "attr4", "attr3" while SK "composite" array is defined with composite attributes "attr3", "attr4" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#incompatible-key-composite-attribute-template`,
      );
    });
    it("Should allow for custom labels for composite attributes", () => {
      const schema = {
        service: "MallStoreDirectory",
        entity: "MallStores",
        table: "StoreDirectory",
        version: "1",
        attributes: {
          id: {
            type: "string",
            field: "storeLocationId",
            label: "i",
          },
          date: {
            type: "string",
            field: "dateTime",
            label: "d",
          },
          prop1: {
            type: "string",
          },
          prop2: {
            type: "string",
          },
          prop3: {
            type: "string",
            label: "p3",
          },
          prop4: {
            type: "string",
            label: "four",
          },
        },
        indexes: {
          record: {
            pk: {
              field: "pk",
              facets: ["id", "prop1"],
            },
            sk: {
              field: "sk",
              facets: ["date", "prop2", "prop3"],
            },
          },
          mixedFacetTemplates: {
            index: "gsi1",
            pk: {
              field: "gsi1pk",
              facets: ["id", "prop3"],
            },
            sk: {
              field: "gsi1sk",
              template: "${date}#p2_${prop2}#propzduce_${prop2}",
            },
          },
          justTemplate: {
            index: "gsi2",
            pk: {
              field: "gsi2pk",
              template: "idz_${id}#${prop1}#third_${prop3}",
            },
            sk: {
              field: "gsi2sk",
              facets: "${date}|${prop2}",
            },
          },
          moreMixed: {
            index: "gsi3",
            pk: {
              field: "gsi3pk",
              template: "${date}#p2_${prop2}#propz3_${prop3}",
            },
            sk: {
              field: "gsi3sk",
              facets: ["prop1", "prop4"],
            },
          },
          noSkFacetArray: {
            index: "gsi4",
            pk: {
              field: "gsi4pk",
              facets: ["date", "prop2", "prop3"],
            },
          },
          noSkFacetTemplate: {
            index: "gsi5",
            pk: {
              field: "gsi5pk",
              template: "${date}#p2_${prop2}#propz3_${prop3}",
            },
          },
        },
      };
      let data = {
        id: "IDENTIFIER",
        date: "2020-11-16",
        prop1: "PROPERTY1",
        prop2: "PROPERTY2",
        prop3: "PROPERTY3",
        prop4: "PROPERTY4",
      };
      let mallStore = new Entity(schema);
      let putParams = mallStore.put(data).params();
      let recordParams = mallStore.query.record(data).params();
      let mixedFacetTemplatesParams = mallStore.query
        .mixedFacetTemplates(data)
        .params();
      let justTemplateParams = mallStore.query.justTemplate(data).params();
      let moreMixedParams = mallStore.query.moreMixed(data).params();
      let noSkFacetArrayParams = mallStore.query.noSkFacetArray(data).params();
      let noSkFacetTemplateParams = mallStore.query
        .noSkFacetTemplate(data)
        .params();
      expect(recordParams).to.deep.equal({
        KeyConditionExpression: "#pk = :pk and #sk1 = :sk1",
        TableName: "StoreDirectory",
        ExpressionAttributeNames: {
          "#pk": "pk",
          "#sk1": "sk",
          "#dateTime": "dateTime",
          "#prop2": "prop2",
          "#prop3": "prop3",
          "#prop4": "prop4",
        },
        ExpressionAttributeValues: {
          ":dateTime0": data.date,
          ":prop20": "PROPERTY2",
          ":prop30": "PROPERTY3",
          ":prop40": "PROPERTY4",
          ":pk": "$mallstoredirectory_1#i_identifier#prop1_property1",
          ":sk1": "$mallstores#d_2020-11-16#prop2_property2#p3_property3",
        },
        FilterExpression:
          "(#prop4 = :prop40) AND #dateTime = :dateTime0 AND #prop2 = :prop20 AND #prop3 = :prop30",
      });
      expect(mixedFacetTemplatesParams).to.deep.equal({
        KeyConditionExpression: "#pk = :pk and #sk1 = :sk1",
        TableName: "StoreDirectory",
        ExpressionAttributeNames: {
          "#pk": "gsi1pk",
          "#sk1": "gsi1sk",
          "#dateTime": "dateTime",
          "#prop2": "prop2",
          "#prop1": "prop1",
          "#prop4": "prop4",
        },
        ExpressionAttributeValues: {
          ":pk": "$mallstoredirectory_1#i_identifier#p3_property3",
          ":sk1": "2020-11-16#p2_property2#propzduce_property2",
          ":prop10": "PROPERTY1",
          ":prop20": "PROPERTY2",
          ":prop40": "PROPERTY4",
          ":dateTime0": data.date,
        },
        FilterExpression:
          "(#prop1 = :prop10) AND #prop4 = :prop40 AND #dateTime = :dateTime0 AND #prop2 = :prop20",
        IndexName: "gsi1",
      });
      expect(justTemplateParams).to.deep.equal({
        KeyConditionExpression: "#pk = :pk and #sk1 = :sk1",
        TableName: "StoreDirectory",
        ExpressionAttributeNames: {
          "#pk": "gsi2pk",
          "#sk1": "gsi2sk",
          "#dateTime": "dateTime",
          "#prop2": "prop2",
          "#prop4": "prop4",
        },
        ExpressionAttributeValues: {
          ":pk": "idz_identifier#property1#third_property3",
          ":sk1": "2020-11-16|property2",
          ":prop20": "PROPERTY2",
          ":prop40": "PROPERTY4",
          ":dateTime0": data.date,
        },
        FilterExpression:
          "(#prop4 = :prop40) AND #dateTime = :dateTime0 AND #prop2 = :prop20",
        IndexName: "gsi2",
      });
      expect(moreMixedParams).to.deep.equal({
        KeyConditionExpression: "#pk = :pk and #sk1 = :sk1",
        TableName: "StoreDirectory",
        ExpressionAttributeNames: {
          "#pk": "gsi3pk",
          "#sk1": "gsi3sk",
          "#prop1": "prop1",
          "#storeLocationId": "storeLocationId",
          "#prop4": "prop4",
        },
        ExpressionAttributeValues: {
          ":prop10": "PROPERTY1",
          ":prop40": "PROPERTY4",
          ":storeLocationId0": "IDENTIFIER",
          ":pk": "2020-11-16#p2_property2#propz3_property3",
          ":sk1": "$mallstores#prop1_property1#four_property4",
        },
        FilterExpression:
          "(#storeLocationId = :storeLocationId0) AND #prop1 = :prop10 AND #prop4 = :prop40",
        IndexName: "gsi3",
      });
      expect(noSkFacetArrayParams).to.deep.equal({
        KeyConditionExpression: "#pk = :pk",
        TableName: "StoreDirectory",
        ExpressionAttributeNames: { "#pk": "gsi4pk" },
        ExpressionAttributeValues: {
          ":pk":
            "$mallstoredirectory_1$mallstores#d_2020-11-16#prop2_property2#p3_property3",
        },
        IndexName: "gsi4",
      });
      expect(noSkFacetTemplateParams).to.deep.equal({
        KeyConditionExpression: "#pk = :pk",
        TableName: "StoreDirectory",
        ExpressionAttributeNames: { "#pk": "gsi5pk" },
        ExpressionAttributeValues: {
          ":pk": "2020-11-16#p2_property2#propz3_property3",
        },
        IndexName: "gsi5",
      });
      expect(putParams).to.deep.equal({
        Item: {
          __edb_e__: "MallStores",
          __edb_v__: "1",
          storeLocationId: "IDENTIFIER",
          dateTime: "2020-11-16",
          prop1: "PROPERTY1",
          prop2: "PROPERTY2",
          prop3: "PROPERTY3",
          prop4: "PROPERTY4",
          pk: "$mallstoredirectory_1#i_identifier#prop1_property1",
          sk: "$mallstores#d_2020-11-16#prop2_property2#p3_property3",
          gsi1pk: "$mallstoredirectory_1#i_identifier#p3_property3",
          gsi1sk: "2020-11-16#p2_property2#propzduce_property2",
          gsi2pk: "idz_identifier#property1#third_property3",
          gsi2sk: "2020-11-16|property2",
          gsi3pk: "2020-11-16#p2_property2#propz3_property3",
          gsi3sk: "$mallstores#prop1_property1#four_property4",
          gsi4pk:
            "$mallstoredirectory_1$mallstores#d_2020-11-16#prop2_property2#p3_property3",
          gsi5pk: "2020-11-16#p2_property2#propz3_property3",
        },
        TableName: "StoreDirectory",
      });
    });
    it("Should default labels to composite attribute attribute names in composite attribute template (string)", () => {
      const schema = {
        service: "MallStoreDirectory",
        entity: "MallStores",
        table: "StoreDirectory",
        version: "1",
        attributes: {
          id: {
            type: "string",
            field: "storeLocationId",
          },
          date: {
            type: "string",
            field: "dateTime",
          },
          prop1: {
            type: "string",
          },
          prop2: {
            type: "string",
          },
        },
        indexes: {
          record: {
            pk: {
              field: "pk",
              facets: "id_${id}#${prop1}",
            },
            sk: {
              field: "sk",
              facets: "${date}#p2_${prop2}",
            },
          },
        },
      };
      let mallStore = new Entity(schema);
      let putParams = mallStore
        .put({
          id: "IDENTIFIER",
          date: "DATE",
          prop1: "PROPERTY1",
          prop2: "PROPERTY2",
        })
        .params();
      expect(putParams).to.deep.equal({
        Item: {
          __edb_e__: "MallStores",
          __edb_v__: "1",
          storeLocationId: "IDENTIFIER",
          dateTime: "DATE",
          prop1: "PROPERTY1",
          prop2: "PROPERTY2",
          pk: "id_identifier#property1",
          sk: "date#p2_property2",
        },
        TableName: "StoreDirectory",
      });
    });

    it("Should allow for mixed custom/composed composite attributes, and adding collection prefixes when defined", () => {
      const schema = {
        service: "MallStoreDirectory",
        entity: "MallStores",
        table: "StoreDirectory",
        version: "1",
        attributes: {
          id: {
            type: "string",
            field: "storeLocationId",
          },
          date: {
            type: "string",
            field: "dateTime",
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
          record: {
            pk: {
              field: "pk",
              facets: "id_${id}#${prop1}#wubba_${prop3}",
            },
            sk: {
              field: "sk",
              facets: ["date", "prop2"],
            },
            collection: "testing",
          },
        },
      };
      let mallStore = new Entity(schema);
      let putParams = mallStore
        .put({
          id: "IDENTIFIER",
          date: "DATE",
          prop1: "PROPERTY1",
          prop2: "PROPERTY2",
          prop3: "PROPERTY3",
        })
        .params();
      expect(putParams).to.deep.equal({
        Item: {
          __edb_e__: "MallStores",
          __edb_v__: "1",
          storeLocationId: "IDENTIFIER",
          dateTime: "DATE",
          prop1: "PROPERTY1",
          prop2: "PROPERTY2",
          prop3: "PROPERTY3",
          pk: "id_identifier#property1#wubba_property3",
          sk: "$testing#mallstores#date_date#prop2_property2",
        },
        TableName: "StoreDirectory",
      });
    });
    it("Allow for static facet template values", () => {
      const schema = {
        service: "MallStoreDirectory",
        entity: "MallStores",
        table: "StoreDirectory",
        version: "1",
        attributes: {
          id: {
            type: "string",
            field: "storeLocationId",
          },
          date: {
            type: "string",
            field: "dateTime",
          },
          prop1: {
            type: "string",
          },
          prop2: {
            type: "string",
          },
        },
        indexes: {
          record: {
            pk: {
              field: "pk",
              facets: "id_${id}#p1_${prop1}",
            },
            sk: {
              field: "sk",
              facets: `dbsfhdfhsdshfshf`,
            },
          },
        },
      };
      const entity = new Entity(schema);
      const getParams = entity.get({ id: "abc", prop1: "def" }).params();
      const queryParams = entity.query
        .record({ id: "abc", prop1: "def" })
        .params();
      const deleteParams = entity.delete({ id: "abc", prop1: "def" }).params();
      const removeParams = entity.remove({ id: "abc", prop1: "def" }).params();
      expect(queryParams).to.deep.equal({
        KeyConditionExpression: "#pk = :pk and #sk1 = :sk1",
        TableName: "StoreDirectory",
        ExpressionAttributeNames: { "#pk": "pk", "#sk1": "sk" },
        ExpressionAttributeValues: {
          ":pk": "id_abc#p1_def",
          ":sk1": "dbsfhdfhsdshfshf",
        },
      });
      expect(getParams).to.deep.equal({
        Key: { pk: "id_abc#p1_def", sk: "dbsfhdfhsdshfshf" },
        TableName: "StoreDirectory",
      });
      expect(deleteParams).to.deep.equal({
        Key: { pk: "id_abc#p1_def", sk: "dbsfhdfhsdshfshf" },
        TableName: "StoreDirectory",
      });
      expect(removeParams).to.deep.equal({
        Key: { pk: "id_abc#p1_def", sk: "dbsfhdfhsdshfshf" },
        TableName: "StoreDirectory",
        ConditionExpression: "attribute_exists(#pk) AND attribute_exists(#sk)",
        ExpressionAttributeNames: { "#pk": "pk", "#sk": "sk" },
      });
    });
    it("Allow for static template values with a composite", () => {
      const schema = {
        service: "MallStoreDirectory",
        entity: "MallStores",
        table: "StoreDirectory",
        version: "1",
        attributes: {
          id: {
            type: "string",
            field: "storeLocationId",
          },
          date: {
            type: "string",
            field: "dateTime",
          },
          prop1: {
            type: "string",
          },
          prop2: {
            type: "string",
          },
        },
        indexes: {
          record: {
            pk: {
              field: "pk",
              composite: ["id", "prop1"],
              template: "id_${id}#p1_${prop1}",
            },
            sk: {
              field: "sk",
              composite: [],
              template: `dbsfhdfhsdshfshf`,
            },
          },
        },
      };
      const entity = new Entity(schema);
      const getParams = entity.get({ id: "abc", prop1: "def" }).params();
      const queryParams = entity.query
        .record({ id: "abc", prop1: "def" })
        .params();
      const deleteParams = entity.delete({ id: "abc", prop1: "def" }).params();
      const removeParams = entity.remove({ id: "abc", prop1: "def" }).params();
      expect(queryParams).to.deep.equal({
        KeyConditionExpression: "#pk = :pk and #sk1 = :sk1",
        TableName: "StoreDirectory",
        ExpressionAttributeNames: { "#pk": "pk", "#sk1": "sk" },
        ExpressionAttributeValues: {
          ":pk": "id_abc#p1_def",
          ":sk1": "dbsfhdfhsdshfshf",
        },
      });
      expect(getParams).to.deep.equal({
        Key: { pk: "id_abc#p1_def", sk: "dbsfhdfhsdshfshf" },
        TableName: "StoreDirectory",
      });
      expect(deleteParams).to.deep.equal({
        Key: { pk: "id_abc#p1_def", sk: "dbsfhdfhsdshfshf" },
        TableName: "StoreDirectory",
      });
      expect(removeParams).to.deep.equal({
        Key: { pk: "id_abc#p1_def", sk: "dbsfhdfhsdshfshf" },
        TableName: "StoreDirectory",
        ConditionExpression: "attribute_exists(#pk) AND attribute_exists(#sk)",
        ExpressionAttributeNames: { "#pk": "pk", "#sk": "sk" },
      });
    });
    it("Allow for static template values without a composite", () => {
      const schema = {
        service: "MallStoreDirectory",
        entity: "MallStores",
        table: "StoreDirectory",
        version: "1",
        attributes: {
          id: {
            type: "string",
            field: "storeLocationId",
          },
          date: {
            type: "string",
            field: "dateTime",
          },
          prop1: {
            type: "string",
          },
          prop2: {
            type: "string",
          },
        },
        indexes: {
          record: {
            pk: {
              field: "pk",
              template: "id_${id}#p1_${prop1}",
            },
            sk: {
              field: "sk",
              template: `dbsfhdfhsdshfshf`,
            },
          },
        },
      };
      const entity = new Entity(schema);
      const getParams = entity.get({ id: "abc", prop1: "def" }).params();
      const queryParams = entity.query
        .record({ id: "abc", prop1: "def" })
        .params();
      const deleteParams = entity.delete({ id: "abc", prop1: "def" }).params();
      const removeParams = entity.remove({ id: "abc", prop1: "def" }).params();
      expect(queryParams).to.deep.equal({
        KeyConditionExpression: "#pk = :pk and #sk1 = :sk1",
        TableName: "StoreDirectory",
        ExpressionAttributeNames: { "#pk": "pk", "#sk1": "sk" },
        ExpressionAttributeValues: {
          ":pk": "id_abc#p1_def",
          ":sk1": "dbsfhdfhsdshfshf",
        },
      });
      expect(getParams).to.deep.equal({
        Key: { pk: "id_abc#p1_def", sk: "dbsfhdfhsdshfshf" },
        TableName: "StoreDirectory",
      });
      expect(deleteParams).to.deep.equal({
        Key: { pk: "id_abc#p1_def", sk: "dbsfhdfhsdshfshf" },
        TableName: "StoreDirectory",
      });
      expect(removeParams).to.deep.equal({
        Key: { pk: "id_abc#p1_def", sk: "dbsfhdfhsdshfshf" },
        TableName: "StoreDirectory",
        ConditionExpression: "attribute_exists(#pk) AND attribute_exists(#sk)",
        ExpressionAttributeNames: { "#pk": "pk", "#sk": "sk" },
      });
    });
    it("Should accept attributes with string values and interpret them as the attribute's `type`", () => {
      const tests = [
        {
          success: true,
          output: {
            types: {
              prop1: "string",
              prop2: "number",
              prop3: "boolean",
              prop4: "enum",
            },
            enumArray: {
              prop4: ["val1", "val2", "val3"],
            },
          },
          input: {
            model: {
              service: "MallStoreDirectory",
              entity: "MallStores",
              table: "StoreDirectory",
              version: "1",
              attributes: {
                prop1: "string",
                prop2: "number",
                prop3: "boolean",
                prop4: ["val1", "val2", "val3"],
              },
              indexes: {
                record: {
                  pk: {
                    field: "pk",
                    facets: ["prop1"],
                  },
                  sk: {
                    field: "sk",
                    facets: ["prop2"],
                  },
                },
              },
            },
          },
        },
        {
          success: false,
          output: {
            err: `Invalid composite attribute definition: Composite attributes must be one of the following: string, number, boolean, enum. The attribute "prop1" is defined as being type "invalid_value" but is a composite attribute of the following indexes: Table Index`,
          },
          input: {
            model: {
              service: "MallStoreDirectory",
              entity: "MallStores",
              table: "StoreDirectory",
              version: "1",
              attributes: {
                prop1: "invalid_value",
                prop2: "number",
                prop3: "boolean",
              },
              indexes: {
                record: {
                  pk: {
                    field: "pk",
                    facets: ["prop1"],
                  },
                  sk: {
                    field: "sk",
                    facets: ["prop2"],
                  },
                },
              },
            },
          },
        },
      ];

      for (let test of tests) {
        if (test.success) {
          let entity = new Entity(test.input.model);
          expect(entity.model.schema.attributes.prop1.type).to.equal(
            test.output.types.prop1,
          );
          expect(entity.model.schema.attributes.prop2.type).to.equal(
            test.output.types.prop2,
          );
          expect(entity.model.schema.attributes.prop3.type).to.equal(
            test.output.types.prop3,
          );
          expect(entity.model.schema.attributes.prop4.type).to.equal(
            test.output.types.prop4,
          );
          expect(entity.model.schema.attributes.prop4.enumArray).to.deep.equal(
            test.output.enumArray.prop4,
          );
        } else {
          expect(() => new Entity(test.input.model)).to.throw(test.output.err);
        }
      }
    });
    it("Should throw when defined composite attributes are not in attributes: composite attribute template and composite attribute array", () => {
      const schema = {
        service: "MallStoreDirectory",
        entity: "MallStores",
        table: "StoreDirectory",
        version: "1",
        attributes: {
          id: {
            type: "string",
            field: "storeLocationId",
          },
          date: {
            type: "string",
            field: "dateTime",
          },
          prop1: {
            type: "string",
          },
          prop2: {
            type: "string",
          },
        },
        indexes: {
          record: {
            pk: {
              field: "pk",
              facets: ["id", "prop5"],
            },
            sk: {
              field: "sk",
              facets: "${date}#p3_${prop3}#p4_${prop4}",
            },
          },
        },
      };
      expect(() => new Entity(schema)).to.throw(
        `Invalid key composite attribute template. The following composite attribute attributes were described in the key composite attribute template but were not included model's attributes: "pk: prop5", "sk: prop3", "sk: prop4"`,
      );
    });
  });

  describe("Identifying indexes by composite attributes", () => {
    let MallStores = new Entity(schema);
    let mall = "123";
    let store = "123";
    let building = "123";
    let id = "123";
    let category = "123";
    let unit = "123";
    let leaseEnd = "123";
    it("Should decide to scan with Match method", () => {
      let { index, keys, shouldScan } = MallStores._findBestIndexKeyMatch({
        leaseEnd,
      });
      let params = MallStores.match({ leaseEnd }).params();
      expect(params).to.be.deep.equal({
        TableName: "StoreDirectory",
        ExpressionAttributeNames: {
          "#__edb_e__": "__edb_e__",
          "#__edb_v__": "__edb_v__",
          "#leaseEnd": "leaseEnd",
          "#pk": "pk",
        },
        ExpressionAttributeValues: {
          ":__edb_e__0": "MallStores",
          ":__edb_v__0": "1",
          ":leaseEnd0": "123",
          ":pk": "$mallstoredirectory_1$mallstores#id_",
        },
        FilterExpression:
          "begins_with(#pk, :pk) AND (#leaseEnd = :leaseEnd0) AND #__edb_e__ = :__edb_e__0 AND #__edb_v__ = :__edb_v__0",
      });
      expect(shouldScan).to.be.true;
      expect(keys).to.be.deep.equal([]);
      expect(index).to.be.equal("");
    });
    it("Should decide to scan with Find method", () => {
      let { index, keys, shouldScan } = MallStores._findBestIndexKeyMatch({
        leaseEnd,
      });
      let params = MallStores.find({ leaseEnd }).params();
      expect(params).to.be.deep.equal({
        TableName: "StoreDirectory",
        ExpressionAttributeNames: {
          "#__edb_e__": "__edb_e__",
          "#__edb_v__": "__edb_v__",
          "#pk": "pk",
        },
        ExpressionAttributeValues: {
          ":__edb_e__0": "MallStores",
          ":__edb_v__0": "1",
          ":pk": "$mallstoredirectory_1$mallstores#id_",
        },
        FilterExpression:
          "begins_with(#pk, :pk) AND (#__edb_e__ = :__edb_e__0) AND #__edb_v__ = :__edb_v__0",
      });
      expect(shouldScan).to.be.true;
      expect(keys).to.be.deep.equal([]);
      expect(index).to.be.equal("");
    });
    it("Should decide to scan and not add undefined values to the query filters with Match method", () => {
      let { index, keys, shouldScan } = MallStores._findBestIndexKeyMatch({
        leaseEnd,
      });
      let mallId = undefined;
      let params = MallStores.match({ leaseEnd, mallId })
        .where(() => "")
        .params();
      expect(params).to.be.deep.equal({
        TableName: "StoreDirectory",
        ExpressionAttributeNames: {
          "#__edb_e__": "__edb_e__",
          "#__edb_v__": "__edb_v__",
          "#leaseEnd": "leaseEnd",
          "#pk": "pk",
        },
        ExpressionAttributeValues: {
          ":__edb_e__0": "MallStores",
          ":__edb_v__0": "1",
          ":leaseEnd0": "123",
          ":pk": "$mallstoredirectory_1$mallstores#id_",
        },
        FilterExpression:
          "begins_with(#pk, :pk) AND (#leaseEnd = :leaseEnd0) AND #__edb_e__ = :__edb_e__0 AND #__edb_v__ = :__edb_v__0",
      });
      expect(shouldScan).to.be.true;
      expect(keys).to.be.deep.equal([]);
      expect(index).to.be.equal("");
    });
    it("Should decide to scan and not add undefined values to the query filters for Find", () => {
      let { index, keys, shouldScan } = MallStores._findBestIndexKeyMatch({
        leaseEnd,
      });
      let mallId = undefined;
      let params = MallStores.find({ leaseEnd, mallId })
        .where(() => "")
        .params();
      expect(params).to.be.deep.equal({
        TableName: "StoreDirectory",
        ExpressionAttributeNames: {
          "#__edb_e__": "__edb_e__",
          "#__edb_v__": "__edb_v__",
          "#pk": "pk",
        },
        ExpressionAttributeValues: {
          ":__edb_e__0": "MallStores",
          ":__edb_v__0": "1",
          ":pk": "$mallstoredirectory_1$mallstores#id_",
        },
        FilterExpression:
          "begins_with(#pk, :pk) AND (#__edb_e__ = :__edb_e__0) AND #__edb_v__ = :__edb_v__0",
      });
      expect(shouldScan).to.be.true;
      expect(keys).to.be.deep.equal([]);
      expect(index).to.be.equal("");
    });
    it("Should match on the primary index with Match method", () => {
      let { index, keys } = MallStores._findBestIndexKeyMatch({ id });
      let params = MallStores.match({ id }).params();
      expect(params).to.be.deep.equal({
        TableName: "StoreDirectory",
        ExpressionAttributeNames: { "#id": "storeLocationId", "#pk": "pk" },
        ExpressionAttributeValues: {
          ":id0": "123",
          ":pk": "$mallstoredirectory_1$mallstores#id_123",
        },
        KeyConditionExpression: "#pk = :pk",
        FilterExpression: "#id = :id0",
      });
      expect(keys).to.be.deep.equal([{ name: "id", type: "pk" }]);
      expect(index).to.be.equal("");
    });
    it("Should match on the primary index with Find method", () => {
      let { index, keys } = MallStores._findBestIndexKeyMatch({ id });
      let params = MallStores.find({ id }).params();
      expect(params).to.be.deep.equal({
        TableName: "StoreDirectory",
        ExpressionAttributeNames: { "#pk": "pk" },
        ExpressionAttributeValues: {
          ":pk": "$mallstoredirectory_1$mallstores#id_123",
        },
        KeyConditionExpression: "#pk = :pk",
      });
      expect(keys).to.be.deep.equal([{ name: "id", type: "pk" }]);
      expect(index).to.be.equal("");
    });
    it("Should match on gsi1pk-gsi1sk-index with Match method", () => {
      let { index, keys } = MallStores._findBestIndexKeyMatch({
        mall,
        building,
        unit,
      });
      let params = MallStores.match({ mall, building, unit }).params();
      expect(params).to.be.deep.equal({
        KeyConditionExpression: "#pk = :pk and begins_with(#sk1, :sk1)",
        TableName: "StoreDirectory",
        ExpressionAttributeNames: {
          "#mall": "mall",
          "#building": "buildingId",
          "#unit": "unitId",
          "#pk": "gsi1pk",
          "#sk1": "gsi1sk",
          "#buildingId": "buildingId",
          "#unitId": "unitId",
        },
        ExpressionAttributeValues: {
          ":buildingId0": "123",
          ":unitId0": "123",
          ":mall0": "123",
          ":building0": "123",
          ":unit0": "123",
          ":pk": "$mallstoredirectory_1#mall_123",
          ":sk1": "$mallstores#building_123#unit_123#store_",
        },
        IndexName: "gsi1pk-gsi1sk-index",
        FilterExpression:
          "(#buildingId = :buildingId0) AND #unitId = :unitId0 AND #mall = :mall0 AND #building = :building0 AND #unit = :unit0",
      });
      expect(keys).to.be.deep.equal([
        { name: "mall", type: "pk" },
        { name: "building", type: "sk" },
        { name: "unit", type: "sk" },
      ]);
      expect(index).to.be.deep.equal(schema.indexes.units.index);
    });
    it("Should match on gsi1pk-gsi1sk-index with Find method", () => {
      let { index, keys } = MallStores._findBestIndexKeyMatch({
        mall,
        building,
        unit,
      });
      let params = MallStores.find({ mall, building, unit }).params();
      expect(params).to.be.deep.equal({
        KeyConditionExpression: "#pk = :pk and begins_with(#sk1, :sk1)",
        TableName: "StoreDirectory",
        ExpressionAttributeNames: {
          "#pk": "gsi1pk",
          "#sk1": "gsi1sk",
          "#unitId": "unitId",
          "#buildingId": "buildingId",
        },
        ExpressionAttributeValues: {
          ":pk": "$mallstoredirectory_1#mall_123",
          ":sk1": "$mallstores#building_123#unit_123#store_",
          ":buildingId0": "123",
          ":unitId0": "123",
        },
        FilterExpression: "(#buildingId = :buildingId0) AND #unitId = :unitId0",
        IndexName: "gsi1pk-gsi1sk-index",
      });
      expect(keys).to.be.deep.equal([
        { name: "mall", type: "pk" },
        { name: "building", type: "sk" },
        { name: "unit", type: "sk" },
      ]);
      expect(index).to.be.deep.equal(schema.indexes.units.index);
    });
    it("Should match on gsi2pk-gsi2sk-index", () => {
      let { index, keys } = MallStores._findBestIndexKeyMatch({
        mall,
        leaseEnd,
      });
      expect(keys).to.be.deep.equal([
        { name: "mall", type: "pk" },
        { name: "leaseEnd", type: "sk" },
      ]);
      expect(index).to.be.deep.equal(schema.indexes.leases.index);
    });
    it("Should match on gsi3pk-gsi3sk-index", () => {
      let { index, keys } = MallStores._findBestIndexKeyMatch({
        mall,
        category,
      });
      expect(keys).to.be.deep.equal([
        { name: "mall", type: "pk" },
        { name: "category", type: "sk" },
      ]);
      expect(index).to.be.deep.equal(schema.indexes.categories.index);
    });
    it("Should match on gsi4pk-gsi4sk-index", () => {
      let { index, keys } = MallStores._findBestIndexKeyMatch({ mall, store });
      expect(keys).to.be.deep.equal([
        { name: "store", type: "pk" },
        { name: "mall", type: "sk" },
      ]);
      expect(index).to.be.deep.equal(schema.indexes.shops.index);
    });
    it("Should pick either gsi4pk-gsi4sk-index or gsi3pk-gsi3sk-index because both are viable indexes", () => {
      let { index, keys } = MallStores._findBestIndexKeyMatch({
        mall,
        store,
        building,
        category,
      });
      expect(keys).to.be.deep.equal([
        { name: "store", type: "pk" },
        { name: "mall", type: "sk" },
        { name: "building", type: "sk" },
      ]);
      expect(index).to.be.deep.equal(schema.indexes.shops.index);
    });
    it("Should match not match any index", () => {
      let { index, keys } = MallStores._findBestIndexKeyMatch({ unit });
      expect(keys).to.be.deep.equal([]);
      expect(index).to.be.deep.equal("");
    });

    it("Should account for schemas with unfinished partition keys when tied", () => {
      const entity = new Entity(
        {
          model: {
            entity: "group",
            version: "1",
            service: "organizer",
          },
          attributes: {
            accountId: {
              type: "string",
            },
            groupId: {
              type: "string",
            },
            groupName: {
              type: "string",
            },
          },
          indexes: {
            onPRIMARY: {
              pk: {
                field: "PRIMARY_KEY",
                composite: ["accountId", "groupId"],
              },
              sk: {
                field: "SORT_KEY",
                composite: [],
              },
            },
            onACCOUNT: {
              index: "INDEX_1",
              collection: ["account"],
              pk: {
                field: "INDEX_1_PRIMARY",
                composite: ["accountId"],
              },
              sk: {
                field: "INDEX_1_SORT",
                composite: ["groupId"],
              },
            },
          },
        },
        { table },
      );
      const accountId = uuid();
      let { index, keys, shouldScan } = entity._findBestIndexKeyMatch({
        accountId,
      });
      expect(keys).to.be.deep.equal([{ name: "accountId", type: "pk" }]);
      expect(index).to.be.deep.equal(entity.schema.indexes.onACCOUNT.index);
      const params = entity.match({ accountId }).params();
      expect(params).to.deep.equal({
        KeyConditionExpression: "#pk = :pk and begins_with(#sk1, :sk1)",
        TableName: "electro",
        ExpressionAttributeNames: {
          "#accountId": "accountId",
          "#pk": "INDEX_1_PRIMARY",
          "#sk1": "INDEX_1_SORT",
        },
        ExpressionAttributeValues: {
          ":accountId0": accountId,
          ":pk": `$organizer#accountid_${accountId}`,
          ":sk1": "$account#group_1#groupid_",
        },
        IndexName: "INDEX_1",
        FilterExpression: "#accountId = :accountId0",
      });
    });

    it("Should account for schemas with unfinished partition keys", () => {
      const entity = new Entity(
        {
          model: {
            entity: "group",
            version: "1",
            service: "organizer",
          },
          attributes: {
            accountId: {
              type: "string",
            },
            groupId: {
              type: "string",
            },
            userId: {
              type: "string",
            },
            transactionId: {
              type: "string",
            },
            contractId: {
              type: "string",
            },
            groupName: {
              type: "string",
            },
          },
          indexes: {
            onPRIMARY: {
              pk: {
                field: "PRIMARY_KEY",
                composite: [
                  "accountId",
                  "groupId",
                  "userId",
                  "transactionId",
                  "contractId",
                ],
              },
              sk: {
                field: "SORT_KEY",
                composite: [],
              },
            },
            onACCOUNT: {
              index: "INDEX_1",
              pk: {
                field: "INDEX_1_PRIMARY",
                composite: ["accountId", "contractId", "transactionId"],
              },
              sk: {
                field: "INDEX_1_SORT",
                composite: ["groupName"],
              },
            },
          },
        },
        { table },
      );
      const accountId = uuid();
      const groupId = uuid();
      const userId = uuid();
      const contractId = uuid();
      let { keys, shouldScan } = entity._findBestIndexKeyMatch({
        contractId,
        accountId,
        groupId,
        userId,
      });
      expect(keys).to.be.deep.equal([]);
      expect(shouldScan).to.be.true;
      const params = entity
        .find({ accountId, contractId, accountId, groupId, userId })
        .params();
      expect(params).to.deep.equal({
        TableName: "electro",
        ExpressionAttributeNames: {
          "#PRIMARY_KEY": "PRIMARY_KEY",
          "#SORT_KEY": "SORT_KEY",
          "#__edb_e__": "__edb_e__",
          "#__edb_v__": "__edb_v__",
        },
        ExpressionAttributeValues: {
          ":PRIMARY_KEY": "$organizer#accountid_",
          ":SORT_KEY": "$group_1",
          ":__edb_e__0": "group",
          ":__edb_v__0": "1",
        },
        FilterExpression:
          "begins_with(#PRIMARY_KEY, :PRIMARY_KEY) AND begins_with(#SORT_KEY, :SORT_KEY) AND (#__edb_e__ = :__edb_e__0) AND #__edb_v__ = :__edb_v__0",
      });
    });
  });
  describe("_expectFacets", () => {
    let MallStores = new Entity(schema);
    let mall = "mall-value";
    let store = "store-value";
    let building = "building-value";
    let id = "id-value";
    let category = "category-value";
    let unit = "unit-value";
    let leaseEnd = "lease-value";
    it("Should find all, pk, and sk matches", () => {
      let index = schema.indexes.units.index;
      let facets = MallStores.model.facets.byIndex[index];
      let all = facets.all.map((facet) => facet.name);
      let allMatches = MallStores._expectFacets(
        { store, mall, building, unit },
        all,
      );
      let pkMatches = MallStores._expectFacets(
        { store, mall, building, unit },
        facets.pk,
      );
      let skMatches = MallStores._expectFacets(
        { store, mall, building, unit },
        facets.sk,
      );
      expect(allMatches).to.be.deep.equal({ mall, building, unit, store });
      expect(pkMatches).to.be.deep.equal({ mall });
      expect(skMatches).to.be.deep.equal({ building, unit, store });
    });
    it("Should find missing properties from supplied keys", () => {
      let index = schema.indexes.units.index;
      let facets = MallStores.model.facets.byIndex[index];
      let all = facets.all.map((facet) => facet.name);
      let allMatches = () => MallStores._expectFacets({ store }, all);
      let pkMatches = () =>
        MallStores._expectFacets(
          { store, building, unit },
          facets.pk,
          "partition keys",
        );
      let skMatches = () =>
        MallStores._expectFacets(
          { store, mall, building },
          facets.sk,
          "sort keys",
        );
      expect(allMatches).to.throw(
        'Incomplete or invalid key composite attributes supplied. Missing properties: "mall", "building", "unit"',
      );
      expect(pkMatches).to.throw(
        'Incomplete or invalid partition keys supplied. Missing properties: "mall"',
      );
      expect(skMatches).to.throw(
        'Incomplete or invalid sort keys supplied. Missing properties: "unit"',
      );
    });
  });
  describe("Filters", () => {
    let MallStores = new Entity(schema);
    it("Should inject model filters in clauses without causing side effects on the clauses object", () => {
      function rentsLeaseEndFilter(
        { rent, leaseEnd, mall } = {},
        { lowRent, beginning, end, location } = {},
      ) {
        return `(${rent.gte(lowRent)} AND ${mall.eq(
          location,
        )}) OR ${leaseEnd.between(beginning, end)}`;
      }
      let injected = MallStores._filterBuilder.injectFilterClauses(clauses, {
        rentsLeaseEndFilter,
      });
      let injectedChildren = Object.values(injected).filter(
        ({ children }) =>
          children.includes("rentsLeaseEndFilter") || !children.includes("go"),
      );

      // Inject children to include the model filter AND a "filter" for inline filters.
      expect(injectedChildren)
        .to.be.an("array")
        .and.have.length(Object.keys(injected).length);

      expect(injected).includes.property("rentsLeaseEndFilter");
      expect(injected).includes.property("filter");
      expect(injected.rentsLeaseEndFilter).to.have.keys([
        "name",
        "children",
        "action",
      ]);
      expect(injected.filter).to.have.keys(["children", "action", "name"]);
      expect(clauses).to.not.deep.equal(injected);
      expect(clauses).to.not.have.key("rentsLeaseEndFilter");
      let noSideEffectsOnClauses = Object.values(clauses).every(
        ({ children }) => !children.includes("rentsLeaseEndFilter"),
      );
      expect(noSideEffectsOnClauses).to.be.true;
    });
    it("Should add filtered fields to the begins with params", () => {
      let mall = "EastPointe";
      let building = "BuildingA";
      let lowRent = "50.00";
      let beginning = "20200101";
      let end = "20200401";
      let location = mall;
      let buildingAUinits = MallStores.query
        .units({ mall, building })
        .rentsLeaseEndFilter({ lowRent, beginning, end, location })
        .params();
      expect(buildingAUinits).to.be.deep.equal({
        IndexName: "gsi1pk-gsi1sk-index",
        TableName: "StoreDirectory",
        ExpressionAttributeNames: {
          "#rent": "rent",
          "#mall": "mall",
          "#leaseEnd": "leaseEnd",
          "#pk": "gsi1pk",
          "#sk1": "gsi1sk",
          "#buildingId": "buildingId",
        },
        ExpressionAttributeValues: {
          ":rent0": "50.00",
          ":mall0": "EastPointe",
          ":leaseEnd0": "20200101",
          ":leaseEnd1": "20200401",
          ":buildingId0": "BuildingA",
          ":pk": "$MallStoreDirectory_1#mall_EastPointe".toLowerCase(),
          ":sk1": "$MallStores#building_BuildingA#unit_".toLowerCase(),
        },
        KeyConditionExpression: "#pk = :pk and begins_with(#sk1, :sk1)",
        FilterExpression:
          "(#buildingId = :buildingId0) AND (#rent >= :rent0 AND #mall = :mall0) OR (#leaseEnd between :leaseEnd0 and :leaseEnd1)",
      });
    });

    it("Should add filtered fields to the begins with params", () => {
      let mall = "EastPointe";
      let building = "BuildingA";
      let lowRent = "50.00";
      let beginning = "20200101";
      let end = "20200401";
      let location = mall;
      let buildingAUinits = MallStores.query
        .units({ mall, building })
        .rentsLeaseEndFilter({ lowRent, beginning, end, location })
        .params();
      expect(buildingAUinits).to.be.deep.equal({
        IndexName: "gsi1pk-gsi1sk-index",
        TableName: "StoreDirectory",
        ExpressionAttributeNames: {
          "#rent": "rent",
          "#mall": "mall",
          "#leaseEnd": "leaseEnd",
          "#pk": "gsi1pk",
          "#sk1": "gsi1sk",
          "#buildingId": "buildingId",
        },
        ExpressionAttributeValues: {
          ":rent0": "50.00",
          ":mall0": "EastPointe",
          ":leaseEnd0": "20200101",
          ":leaseEnd1": "20200401",
          ":buildingId0": "BuildingA",
          ":pk": "$MallStoreDirectory_1#mall_EastPointe".toLowerCase(),
          ":sk1": "$MallStores#building_BuildingA#unit_".toLowerCase(),
        },
        KeyConditionExpression: "#pk = :pk and begins_with(#sk1, :sk1)",
        FilterExpression:
          "(#buildingId = :buildingId0) AND (#rent >= :rent0 AND #mall = :mall0) OR (#leaseEnd between :leaseEnd0 and :leaseEnd1)",
      });
    });
    it("Should add filtered fields to the between params", () => {
      let mall = "EastPointe";
      let buildingOne = "BuildingA";
      let buildingTwo = "BuildingF";
      let lowRent = "50.00";
      let beginning = "20200101";
      let end = "20200401";
      let location = mall;
      let category = "food/coffee";
      let eastPointeCoffeeShops = MallStores.query
        .categories({ mall, category })
        .between({ building: buildingOne }, { building: buildingTwo })
        .rentsLeaseEndFilter({ lowRent, beginning, end, location })
        .params();
      expect(eastPointeCoffeeShops).to.be.deep.equal({
        IndexName: "gsi3pk-gsi3sk-index",
        TableName: "StoreDirectory",
        ExpressionAttributeNames: {
          "#rent": "rent",
          "#mall": "mall",
          "#leaseEnd": "leaseEnd",
          "#pk": "gsi3pk",
          "#sk1": "gsi3sk",
          "#buildingId": "buildingId",
          "#category": "category",
        },
        ExpressionAttributeValues: {
          ":buildingId0": "BuildingF",
          ":rent0": "50.00",
          ":mall0": "EastPointe",
          ":leaseEnd0": "20200101",
          ":leaseEnd1": "20200401",
          ":category0": "food/coffee",
          ":pk": "$MallStoreDirectory_1#mall_EastPointe".toLowerCase(),
          ":sk1":
            "$MallStores#category_food/coffee#building_BuildingA".toLowerCase(),
          ":sk2":
            "$MallStores#category_food/coffee#building_BuildingG".toLowerCase(),
        },
        KeyConditionExpression: "#pk = :pk and #sk1 BETWEEN :sk1 AND :sk2",
        FilterExpression:
          "(#category = :category0) AND #buildingId <= :buildingId0 AND (#rent >= :rent0 AND #mall = :mall0) OR (#leaseEnd between :leaseEnd0 and :leaseEnd1)",
      });
    });
    it("Should add filtered fields to the comparison params", () => {
      let mall = "EastPointe";
      let lowRent = "50.00";
      let beginning = "20200101";
      let end = "20200401";
      let location = mall;
      let leaseEnd = "20201231";
      let leasesAboutToExpire = MallStores.query
        .leases({ mall })
        .lte({ leaseEnd })
        .rentsLeaseEndFilter({ lowRent, beginning, end, location })
        .params();

      expect(leasesAboutToExpire).to.be.deep.equal({
        IndexName: "gsi2pk-gsi2sk-index",
        TableName: "StoreDirectory",
        ExpressionAttributeNames: {
          "#rent": "rent",
          "#mall": "mall",
          "#leaseEnd": "leaseEnd",
          "#pk": "gsi2pk",
          "#sk1": "gsi2sk",
        },
        ExpressionAttributeValues: {
          ":rent0": "50.00",
          ":mall0": "EastPointe",
          ":leaseEnd0": "20201231",
          ":leaseEnd1": "20200101",
          ":leaseEnd2": "20200401",
          ":pk": "$MallStoreDirectory_1#mall_EastPointe".toLowerCase(),
          ":sk1": "$MallStores#leaseEnd_20201232".toLowerCase(),
        },
        KeyConditionExpression: "#pk = :pk and #sk1 < :sk1",
        FilterExpression:
          "(#leaseEnd <= :leaseEnd0) AND (#rent >= :rent0 AND #mall = :mall0) OR (#leaseEnd between :leaseEnd1 and :leaseEnd2)",
      });
    });
  });
  describe("table definition", () => {
    it("should allow the table to be defined on the model", () => {
      let model = {
        service: "myservice",
        entity: "myentity",
        table: "electro",
        version: "1",
        attributes: {
          id: "string",
          org: "string",
          type: "string",
        },
        indexes: {
          thing: {
            collection: "things",
            pk: {
              field: "pk",
              facets: ["type", "org"],
            },
            sk: {
              field: "sk",
              facets: ["id"],
            },
          },
        },
      };
      let facets = { type: "abc", org: "def", id: "hij" };
      let entity = new Entity(model);
      let params = entity.get(facets).params();
      expect(params.TableName).to.equal("electro");
    });
    it("should allow the table to be defined on the config", () => {
      let model = {
        model: {
          service: "myservice",
          entity: "myentity",
          version: "1",
        },
        attributes: {
          id: "string",
          org: "string",
          type: "string",
        },
        indexes: {
          thing: {
            collection: "things",
            pk: {
              field: "pk",
              facets: ["type", "org"],
            },
            sk: {
              field: "sk",
              facets: ["id"],
            },
          },
        },
      };
      let table = "electro";
      let facets = { type: "abc", org: "def", id: "hij" };
      let entity = new Entity(model, { table });
      let params = entity.get(facets).params();
      expect(params.TableName).to.equal(table);
    });
    it("should allow the table to be defined in query options", () => {
      let model = {
        model: {
          service: "myservice",
          entity: "myentity",
          version: "1",
        },
        attributes: {
          id: "string",
          org: "string",
          type: "string",
        },
        indexes: {
          thing: {
            collection: "things",
            pk: {
              field: "pk",
              facets: ["type", "org"],
            },
            sk: {
              field: "sk",
              facets: ["id"],
            },
          },
        },
      };
      let table = "electro";
      let facets = { type: "abc", org: "def", id: "hij" };
      let entity = new Entity(model);
      let params = entity.get(facets).params({ table });
      expect(params.TableName).to.equal(table);
    });
    it("should not allow the table to be undefined", () => {
      let model = {
        model: {
          service: "myservice",
          entity: "myentity",
          version: "1",
        },
        attributes: {
          id: "string",
          org: "string",
          type: "string",
        },
        indexes: {
          thing: {
            collection: "things",
            pk: {
              field: "pk",
              facets: ["type", "org"],
            },
            sk: {
              field: "sk",
              facets: ["id"],
            },
          },
        },
      };
      let entity = new Entity(model);
      let facets = { type: "abc", org: "def", id: "hij" };
      expect(() => entity.get(facets).params()).to.throw(
        "Table name not defined. Table names must be either defined on the model, instance configuration, or as a query option.",
      );
    });
  });
  describe("key prefixes", () => {
    describe("beta", () => {
      const base = JSON.stringify({
        service: "myservice",
        entity: "myentity",
        table: "electro",
        version: "1",
        attributes: {
          id: "string",
          org: "string",
          type: "string",
        },
        indexes: {
          thing: {
            collection: "things",
            pk: {
              field: "pk",
              facets: ["type", "org"],
            },
            sk: {
              field: "sk",
              facets: ["id"],
            },
          },
        },
      });
      let facets = { type: "abc", org: "def", id: "hij" };
      describe("collections", () => {
        it("should add a collection name to the sk", () => {
          let model = JSON.parse(base);
          let entity = new Entity(model);
          let params = entity.get(facets).params();
          expect(params).to.deep.equal({
            Key: {
              pk: "$myservice_1#type_abc#org_def",
              sk: "$things#myentity#id_hij",
            },
            TableName: "electro",
          });
        });
        it("throw when a collection is added to an index without an SK", () => {
          let model = JSON.parse(base);
          delete model.indexes.thing.sk;
          expect(() => new Entity(model)).to.throw(
            "Invalid Access pattern definition for 'thing': '(Primary Index)', contains a collection definition without a defined SK. Collections can only be defined on indexes with a defined SK. - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#collection-without-an-sk",
          );
        });
        it("should ignore collection when sk is custom", () => {
          let model = JSON.parse(base);
          model.indexes.thing.pk.facets = "$blablah#t_${type}#o_${org}";
          let entity = new Entity(model);
          let params = entity.get(facets).params();
          expect(params).to.deep.equal({
            Key: { pk: "$blablah#t_abc#o_def", sk: "$things#myentity#id_hij" },
            TableName: "electro",
          });
        });
      });
      describe("no sk", () => {
        it("it should make an entity specific pk when there is no sk", () => {
          let model = JSON.parse(base);
          delete model.indexes.thing.sk;
          delete model.indexes.thing.collection;
          let entity = new Entity(model);
          let params = entity.get(facets).params();
          expect(params).to.deep.equal({
            Key: { pk: "$myservice_1$myentity#type_abc#org_def" },
            TableName: "electro",
          });
        });
      });
    });
    describe("v1", () => {
      const base = JSON.stringify({
        table: "electro",
        model: {
          service: "myservice",
          entity: "myentity",
          version: "1",
        },
        attributes: {
          id: "string",
          org: "string",
          type: "string",
        },
        indexes: {
          thing: {
            collection: "things",
            pk: {
              field: "pk",
              facets: ["type", "org"],
            },
            sk: {
              field: "sk",
              facets: ["id"],
            },
          },
        },
      });
      let facets = { type: "abc", org: "def", id: "hij" };
      describe("collections", () => {
        it("should add a collection name to the sk", () => {
          let model = JSON.parse(base);
          let entity = new Entity(model);
          let params = entity.get(facets).params();
          expect(params).to.deep.equal({
            Key: {
              pk: "$myservice#type_abc#org_def",
              sk: "$things#myentity_1#id_hij",
            },
            TableName: "electro",
          });
        });
        it("throw when a collection is added to an index without an SK", () => {
          let model = JSON.parse(base);
          delete model.indexes.thing.sk;
          expect(() => new Entity(model)).to.throw(
            "Invalid Access pattern definition for 'thing': '(Primary Index)', contains a collection definition without a defined SK. Collections can only be defined on indexes with a defined SK. - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#collection-without-an-sk",
          );
        });
        it("should ignore collection when sk is custom", () => {
          let model = JSON.parse(base);
          model.indexes.thing.pk.facets = "$blablah#t_${type}#o_${org}";
          let entity = new Entity(model);
          let params = entity.get(facets).params();
          expect(params).to.deep.equal({
            Key: {
              pk: "$blablah#t_abc#o_def",
              sk: "$things#myentity_1#id_hij",
            },
            TableName: "electro",
          });
        });
      });
      describe("no sk", () => {
        it("it should make an entity specific pk when there is no sk", () => {
          let model = JSON.parse(base);
          delete model.indexes.thing.sk;
          delete model.indexes.thing.collection;
          let entity = new Entity(model);
          let params = entity.get(facets).params();
          expect(params).to.deep.equal({
            Key: { pk: "$myservice$myentity_1#type_abc#org_def" },
            TableName: "electro",
          });
        });
      });
    });
  });
  describe("Custom Identifiers", () => {
    const schema = {
      model: {
        service: "MallStoreDirectory",
        entity: "MallStores",
        version: "1",
      },
      table: "StoreDirectory",
      attributes: {
        id: {
          type: "string",
          default: () => uuid(),
          field: "storeLocationId",
        },
        mall: {
          type: "string",
          required: true,
          field: "mall",
        },
        store: {
          type: "string",
          required: true,
          field: "storeId",
        },
        building: {
          type: "string",
          required: true,
          field: "buildingId",
        },
        unit: {
          type: "string",
          required: true,
          field: "unitId",
        },
      },
      indexes: {
        store: {
          pk: {
            field: "pk",
            facets: ["id"],
          },
          sk: {
            field: "sk",
            facets: [],
          },
        },
        units: {
          index: "gsi1pk-gsi1sk-index",
          pk: {
            field: "gsi1pk",
            facets: ["mall"],
          },
          sk: {
            field: "gsi1sk",
            facets: ["building", "store"],
          },
        },
      },
    };

    const id = "123-456-789";
    const mall = "EastPointe";
    const store = "LatteLarrys";
    const building = "BuildingA";
    const unit = "A1";

    const tests = [
      {
        success: true,
        description: "default identifiers",
        custom: false,
        input: {},
        output: {
          Item: {
            storeLocationId: "123-456-789",
            mall: "EastPointe",
            storeId: "LatteLarrys",
            buildingId: "BuildingA",
            unitId: "A1",
            pk: "$mallstoredirectory#id_123-456-789",
            sk: "$mallstores_1",
            gsi1pk: "$mallstoredirectory#mall_eastpointe",
            gsi1sk: "$mallstores_1#building_buildinga#store_lattelarrys",
            __edb_e__: "MallStores",
            __edb_v__: "1",
          },
          TableName: "test",
        },
      },
      {
        success: true,
        description: "custom version identifier",
        custom: true,
        input: { type: "version", value: "custom_version" },
        output: {
          Item: {
            storeLocationId: "123-456-789",
            mall: "EastPointe",
            storeId: "LatteLarrys",
            buildingId: "BuildingA",
            unitId: "A1",
            pk: "$mallstoredirectory#id_123-456-789",
            sk: "$mallstores_1",
            gsi1pk: "$mallstoredirectory#mall_eastpointe",
            gsi1sk: "$mallstores_1#building_buildinga#store_lattelarrys",
            __edb_e__: "MallStores",
            custom_version: "1",
          },
          TableName: "test",
        },
      },
      {
        success: true,
        description: "custom entity identifier",
        custom: true,
        input: { type: "entity", value: "custom_entity" },
        output: {
          Item: {
            storeLocationId: "123-456-789",
            mall: "EastPointe",
            storeId: "LatteLarrys",
            buildingId: "BuildingA",
            unitId: "A1",
            pk: "$mallstoredirectory#id_123-456-789",
            sk: "$mallstores_1",
            gsi1pk: "$mallstoredirectory#mall_eastpointe",
            gsi1sk: "$mallstores_1#building_buildinga#store_lattelarrys",
            custom_entity: "MallStores",
            __edb_v__: "1",
          },
          TableName: "test",
        },
      },
      {
        description: "invalid custom identifier: undefined",
        input: { value: "custom_version" },
        custom: true,
        success: false,
        error: `Invalid identifier type: "". Valid identifiers include: "entity", "version" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#invalid-identifier`,
      },
      {
        description: "invalid custom identifier: bad value",
        input: { type: "bad_value", value: "custom_version" },
        custom: true,
        success: false,
        error: `Invalid identifier type: "bad_value". Valid identifiers include: "entity", "version" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#invalid-identifier`,
      },
    ];
    for (let test of tests) {
      it(test.description, () => {
        let entity = new Entity(schema, { table: "test" });
        if (test.custom) {
          if (test.success) {
            entity.setIdentifier(test.input.type, test.input.value);
          } else {
            expect(() =>
              entity.setIdentifier(test.input.type, test.input.value),
            ).to.throw(test.error);
          }
        }
        if (test.success) {
          let params = entity.put({ id, mall, store, building, unit }).params();
          expect(params).to.deep.equal(test.output);
        }
      });
    }
    it("Should not allow setIdentifier to be used on identifiers that dont exist", () => {
      let entity = new Entity(schema, { table: "test" });
      expect(() => entity.setIdentifier("doesnt_exist")).to.throw(
        `Invalid identifier type: "doesnt_exist". Valid identifiers include: "entity", "version" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#invalid-identifier`,
      );
    });
  });
  describe("Misconfiguration", () => {
    it("Should check for duplicate indexes", () => {
      let schema = {
        model: {
          entity: "MyEntity",
          service: "MyService",
          version: "1",
        },
        table: "MyTable",
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
          index1: {
            pk: {
              field: "pk",
              facets: ["prop1"],
            },
            sk: {
              field: "sk",
              facets: ["prop2", "prop3"],
            },
          },
          index2: {
            pk: {
              field: "pk",
              facets: ["prop3"],
            },
            sk: {
              field: "sk",
              facets: ["prop2", "prop1"],
            },
          },
        },
      };
      expect(() => new Entity(schema)).to.throw(
        "Duplicate index defined in model found in Access Pattern 'index2': '(Primary Index)'. This could be because you forgot to specify the index name of a secondary index defined in your model. - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#duplicate-indexes",
      );
    });
    it("Should check for duplicate indexes on secondary index", () => {
      let schema = {
        model: {
          entity: "MyEntity",
          service: "MyService",
          version: "1",
        },
        table: "MyTable",
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
          index1: {
            pk: {
              field: "pk",
              facets: ["prop1"],
            },
            sk: {
              field: "sk",
              facets: ["prop2", "prop3"],
            },
          },
          index2: {
            index: "gsi1",
            pk: {
              field: "gsi1pk",
              facets: ["prop3"],
            },
            sk: {
              field: "gsi1sk",
              facets: ["prop2", "prop1"],
            },
          },
          index3: {
            index: "gsi1",
            pk: {
              field: "gsi2pk",
              facets: ["prop3"],
            },
            sk: {
              field: "gsi2sk",
              facets: ["prop2", "prop1"],
            },
          },
        },
      };
      expect(() => new Entity(schema)).to.throw(
        "Duplicate index defined in model found in Access Pattern 'index3': 'gsi1' - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#duplicate-indexes",
      );
    });
    it("Should check for index and collection name overlap", () => {
      let schema = {
        model: {
          entity: "MyEntity",
          service: "MyService",
          version: "1",
        },
        table: "MyTable",
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
          index1: {
            collection: "collectionA",
            pk: {
              field: "pk",
              facets: ["prop1"],
            },
            sk: {
              field: "sk",
              facets: ["prop2", "prop3"],
            },
          },
          index2: {
            index: "gsi1",
            collection: "collectionA",
            pk: {
              field: "gsi1pk",
              facets: ["prop3"],
            },
            sk: {
              field: "gsi1sk",
              facets: ["prop2", "prop1"],
            },
          },
        },
      };
      expect(() => new Entity(schema)).to.throw(
        `Duplicate collection, "collectionA" is defined across multiple indexes "index1" and "index2". Collections must be unique names across indexes for an Entity. - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#duplicate-collections`,
      );
    });
    it("should require a valid schema", () => {
      expect(() => new Entity()).to.throw(
        `instance requires property "model", instance requires property "attributes", instance requires property "indexes", instance.model is required - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#invalid-model`,
      );
    });
  });
  describe("v1 and beta models", () => {
    let id = "123-456-789";
    let mall = "EastPointe";
    let store = "LatteLarrys";
    let building = "BuildingA";
    let unit = "A1";
    let tests = [
      {
        description: "No SK, beta model",
        queries: [
          {
            type: "get",
            input: { id },
            output: {
              Key: {
                pk: "$mallstoredirectory_1$mallstores#id_123-456-789",
              },
              TableName: "StoreDirectory",
            },
          },
          {
            type: "put",
            input: { id, mall, store, building, unit },
            output: {
              Item: {
                storeLocationId: "123-456-789",
                mall: "EastPointe",
                storeId: "LatteLarrys",
                buildingId: "BuildingA",
                unitId: "A1",
                pk: "$mallstoredirectory_1$mallstores#id_123-456-789",
                gsi1pk: "$mallstoredirectory_1$mallstores#mall_eastpointe",
                __edb_e__: "MallStores",
                __edb_v__: "1",
              },
              TableName: "StoreDirectory",
            },
          },
          {
            type: "create",
            input: { id, mall, store, building, unit },
            output: {
              Item: {
                storeLocationId: "123-456-789",
                mall: "EastPointe",
                storeId: "LatteLarrys",
                buildingId: "BuildingA",
                unitId: "A1",
                pk: "$mallstoredirectory_1$mallstores#id_123-456-789",
                gsi1pk: "$mallstoredirectory_1$mallstores#mall_eastpointe",
                __edb_e__: "MallStores",
                __edb_v__: "1",
              },
              TableName: "StoreDirectory",
              ConditionExpression: "attribute_not_exists(#pk)",
              ExpressionAttributeNames: {
                "#pk": "pk",
              },
            },
          },
          {
            type: "update",
            input: { id },
            set: { unit: "abc" },
            output: {
              UpdateExpression:
                "SET #unit = :unit_u0, #id = :id_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0",
              ExpressionAttributeNames: {
                "#unit": "unitId",
                "#id": "id",
                "#__edb_e__": "__edb_e__",
                "#__edb_v__": "__edb_v__",
              },
              ExpressionAttributeValues: {
                ":unit_u0": "abc",
                ":id_u0": "123-456-789",
                ":__edb_e___u0": "MallStores",
                ":__edb_v___u0": "1",
              },
              TableName: "StoreDirectory",
              Key: {
                pk: "$mallstoredirectory_1$mallstores#id_123-456-789",
              },
            },
          },
          {
            type: "patch",
            input: { id },
            set: { unit: "abc" },
            output: {
              ConditionExpression: "attribute_exists(#pk)",
              UpdateExpression:
                "SET #unit = :unit_u0, #id = :id_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0",
              ExpressionAttributeNames: {
                "#unit": "unitId",
                "#id": "id",
                "#__edb_e__": "__edb_e__",
                "#__edb_v__": "__edb_v__",
                "#pk": "pk",
              },
              ExpressionAttributeValues: {
                ":unit_u0": "abc",
                ":id_u0": "123-456-789",
                ":__edb_e___u0": "MallStores",
                ":__edb_v___u0": "1",
              },
              TableName: "StoreDirectory",
              Key: {
                pk: "$mallstoredirectory_1$mallstores#id_123-456-789",
              },
            },
          },
          {
            type: "query",
            index: "units",
            input: { mall, building, store },
            output: {
              KeyConditionExpression: "#pk = :pk",
              TableName: "StoreDirectory",
              ExpressionAttributeNames: { "#pk": "gsi1pk" },
              ExpressionAttributeValues: {
                ":pk": "$mallstoredirectory_1$mallstores#mall_eastpointe",
              },
              IndexName: "gsi1pk-gsi1sk-index",
            },
          },
        ],
        schema: {
          service: "MallStoreDirectory",
          entity: "MallStores",
          table: "StoreDirectory",
          version: "1",
          attributes: {
            id: {
              type: "string",
              default: () => uuid(),
              field: "storeLocationId",
            },
            mall: {
              type: "string",
              required: true,
              field: "mall",
            },
            store: {
              type: "string",
              required: true,
              field: "storeId",
            },
            building: {
              type: "string",
              required: true,
              field: "buildingId",
            },
            unit: {
              type: "string",
              required: true,
              field: "unitId",
            },
          },
          indexes: {
            store: {
              pk: {
                field: "pk",
                facets: ["id"],
              },
            },
            units: {
              index: "gsi1pk-gsi1sk-index",
              pk: {
                field: "gsi1pk",
                facets: ["mall"],
              },
            },
          },
        },
      },
      {
        description: "Has SK, beta model",
        queries: [
          {
            type: "get",
            input: { id },
            output: {
              Key: {
                pk: "$mallstoredirectory_1#id_123-456-789",
                sk: "$mallstores",
              },
              TableName: "StoreDirectory",
            },
          },
          {
            type: "put",
            input: { id, mall, store, building, unit },
            output: {
              Item: {
                storeLocationId: "123-456-789",
                mall: "EastPointe",
                storeId: "LatteLarrys",
                buildingId: "BuildingA",
                unitId: "A1",
                pk: "$mallstoredirectory_1#id_123-456-789",
                sk: "$mallstores",
                gsi1pk: "$mallstoredirectory_1#mall_eastpointe",
                gsi1sk: "$mallstores#building_buildinga#store_lattelarrys",
                __edb_e__: "MallStores",
                __edb_v__: "1",
              },
              TableName: "StoreDirectory",
            },
          },
          {
            type: "create",
            input: { id, mall, store, building, unit },
            output: {
              Item: {
                storeLocationId: "123-456-789",
                mall: "EastPointe",
                storeId: "LatteLarrys",
                buildingId: "BuildingA",
                unitId: "A1",
                pk: "$mallstoredirectory_1#id_123-456-789",
                sk: "$mallstores",
                gsi1pk: "$mallstoredirectory_1#mall_eastpointe",
                gsi1sk: "$mallstores#building_buildinga#store_lattelarrys",
                __edb_e__: "MallStores",
                __edb_v__: "1",
              },
              TableName: "StoreDirectory",
              ConditionExpression:
                "attribute_not_exists(#pk) AND attribute_not_exists(#sk)",
              ExpressionAttributeNames: { "#pk": "pk", "#sk": "sk" },
            },
          },
          {
            type: "update",
            input: { id },
            set: { unit: "abc" },
            output: {
              UpdateExpression:
                "SET #unit = :unit_u0, #id = :id_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0",
              ExpressionAttributeNames: {
                "#unit": "unitId",
                "#id": "id",
                "#__edb_e__": "__edb_e__",
                "#__edb_v__": "__edb_v__",
              },
              ExpressionAttributeValues: {
                ":unit_u0": "abc",
                ":id_u0": "123-456-789",
                ":__edb_e___u0": "MallStores",
                ":__edb_v___u0": "1",
              },
              TableName: "StoreDirectory",
              Key: {
                pk: "$mallstoredirectory_1#id_123-456-789",
                sk: "$mallstores",
              },
            },
          },
          {
            type: "patch",
            input: { id },
            set: { unit: "abc" },
            output: {
              ConditionExpression:
                "attribute_exists(#pk) AND attribute_exists(#sk)",
              UpdateExpression:
                "SET #unit = :unit_u0, #id = :id_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0",
              ExpressionAttributeNames: {
                "#unit": "unitId",
                "#id": "id",
                "#__edb_e__": "__edb_e__",
                "#__edb_v__": "__edb_v__",
                "#pk": "pk",
                "#sk": "sk",
              },
              ExpressionAttributeValues: {
                ":unit_u0": "abc",
                ":id_u0": "123-456-789",
                ":__edb_e___u0": "MallStores",
                ":__edb_v___u0": "1",
              },
              TableName: "StoreDirectory",
              Key: {
                pk: "$mallstoredirectory_1#id_123-456-789",
                sk: "$mallstores",
              },
            },
          },
          {
            type: "query",
            index: "units",
            input: { mall, building, store },
            output: {
              KeyConditionExpression: "#pk = :pk and #sk1 = :sk1",
              TableName: "StoreDirectory",
              ExpressionAttributeNames: { "#pk": "gsi1pk", "#sk1": "gsi1sk" },
              ExpressionAttributeValues: {
                ":pk": "$mallstoredirectory_1#mall_eastpointe",
                ":sk1": "$mallstores#building_buildinga#store_lattelarrys",
              },
              IndexName: "gsi1pk-gsi1sk-index",
            },
          },
        ],
        schema: {
          service: "MallStoreDirectory",
          entity: "MallStores",
          table: "StoreDirectory",
          version: "1",
          attributes: {
            id: {
              type: "string",
              default: () => uuid(),
              field: "storeLocationId",
            },
            mall: {
              type: "string",
              required: true,
              field: "mall",
            },
            store: {
              type: "string",
              required: true,
              field: "storeId",
            },
            building: {
              type: "string",
              required: true,
              field: "buildingId",
            },
            unit: {
              type: "string",
              required: true,
              field: "unitId",
            },
          },
          indexes: {
            store: {
              pk: {
                field: "pk",
                facets: ["id"],
              },
              sk: {
                field: "sk",
                facets: [],
              },
            },
            units: {
              index: "gsi1pk-gsi1sk-index",
              pk: {
                field: "gsi1pk",
                facets: ["mall"],
              },
              sk: {
                field: "gsi1sk",
                facets: ["building", "store"],
              },
            },
          },
        },
      },
      {
        description: "No SK, v1 model",
        queries: [
          {
            type: "get",
            input: { id },
            output: {
              Key: {
                pk: "$mallstoredirectory$mallstores_1#id_123-456-789",
              },
              TableName: "StoreDirectory",
            },
          },
          {
            type: "put",
            input: { id, mall, store, building, unit },
            output: {
              Item: {
                storeLocationId: "123-456-789",
                mall: "EastPointe",
                storeId: "LatteLarrys",
                buildingId: "BuildingA",
                unitId: "A1",
                pk: "$mallstoredirectory$mallstores_1#id_123-456-789",
                gsi1pk: "$mallstoredirectory#mall_eastpointe",
                gsi1sk: "$mallstores_1#building_buildinga#store_lattelarrys",
                __edb_e__: "MallStores",
                __edb_v__: "1",
              },
              TableName: "StoreDirectory",
            },
          },
          {
            type: "create",
            input: { id, mall, store, building, unit },
            output: {
              Item: {
                storeLocationId: "123-456-789",
                mall: "EastPointe",
                storeId: "LatteLarrys",
                buildingId: "BuildingA",
                unitId: "A1",
                pk: "$mallstoredirectory$mallstores_1#id_123-456-789",
                gsi1pk: "$mallstoredirectory#mall_eastpointe",
                gsi1sk: "$mallstores_1#building_buildinga#store_lattelarrys",
                __edb_e__: "MallStores",
                __edb_v__: "1",
              },
              TableName: "StoreDirectory",
              ConditionExpression: "attribute_not_exists(#pk)",
              ExpressionAttributeNames: {
                "#pk": "pk",
              },
            },
          },
          {
            type: "update",
            input: { id },
            set: { unit: "abc" },
            output: {
              UpdateExpression:
                "SET #unit = :unit_u0, #id = :id_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0",
              ExpressionAttributeNames: {
                "#unit": "unitId",
                "#id": "id",
                "#__edb_e__": "__edb_e__",
                "#__edb_v__": "__edb_v__",
              },
              ExpressionAttributeValues: {
                ":unit_u0": "abc",
                ":id_u0": "123-456-789",
                ":__edb_e___u0": "MallStores",
                ":__edb_v___u0": "1",
              },
              TableName: "StoreDirectory",
              Key: {
                pk: "$mallstoredirectory$mallstores_1#id_123-456-789",
              },
            },
          },
          {
            type: "patch",
            input: { id },
            set: { unit: "abc" },
            output: {
              ConditionExpression: "attribute_exists(#pk)",
              UpdateExpression:
                "SET #unit = :unit_u0, #id = :id_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0",
              ExpressionAttributeNames: {
                "#unit": "unitId",
                "#id": "id",
                "#__edb_e__": "__edb_e__",
                "#__edb_v__": "__edb_v__",
                "#pk": "pk",
              },
              ExpressionAttributeValues: {
                ":unit_u0": "abc",
                ":id_u0": "123-456-789",
                ":__edb_e___u0": "MallStores",
                ":__edb_v___u0": "1",
              },
              TableName: "StoreDirectory",
              Key: {
                pk: "$mallstoredirectory$mallstores_1#id_123-456-789",
              },
            },
          },
          {
            type: "query",
            index: "units",
            input: { mall, building, store },
            output: {
              KeyConditionExpression: "#pk = :pk and #sk1 = :sk1",
              TableName: "StoreDirectory",
              ExpressionAttributeNames: { "#pk": "gsi1pk", "#sk1": "gsi1sk" },
              ExpressionAttributeValues: {
                ":pk": "$mallstoredirectory#mall_eastpointe",
                ":sk1": "$mallstores_1#building_buildinga#store_lattelarrys",
              },
              IndexName: "gsi1pk-gsi1sk-index",
            },
          },
        ],
        schema: {
          model: {
            service: "MallStoreDirectory",
            entity: "MallStores",
            version: "1",
          },
          table: "StoreDirectory",
          attributes: {
            id: {
              type: "string",
              default: () => uuid(),
              field: "storeLocationId",
            },
            mall: {
              type: "string",
              required: true,
              field: "mall",
            },
            store: {
              type: "string",
              required: true,
              field: "storeId",
            },
            building: {
              type: "string",
              required: true,
              field: "buildingId",
            },
            unit: {
              type: "string",
              required: true,
              field: "unitId",
            },
          },
          indexes: {
            store: {
              pk: {
                field: "pk",
                facets: ["id"],
              },
            },
            units: {
              index: "gsi1pk-gsi1sk-index",
              pk: {
                field: "gsi1pk",
                facets: ["mall"],
              },
              sk: {
                field: "gsi1sk",
                facets: ["building", "store"],
              },
            },
          },
        },
      },
      {
        description: "Has SK, v1 model",
        queries: [
          {
            type: "get",
            input: { id },
            output: {
              Key: {
                pk: "$mallstoredirectory#id_123-456-789",
                sk: "$mallstores_1",
              },
              TableName: "StoreDirectory",
            },
          },
          {
            type: "put",
            input: { id, mall, store, building, unit },
            output: {
              Item: {
                storeLocationId: "123-456-789",
                mall: "EastPointe",
                storeId: "LatteLarrys",
                buildingId: "BuildingA",
                unitId: "A1",
                pk: "$mallstoredirectory#id_123-456-789",
                sk: "$mallstores_1",
                gsi1pk: "$mallstoredirectory#mall_eastpointe",
                gsi1sk: "$mallstores_1#building_buildinga#store_lattelarrys",
                __edb_e__: "MallStores",
                __edb_v__: "1",
              },
              TableName: "StoreDirectory",
            },
          },
          {
            type: "create",
            input: { id, mall, store, building, unit },
            output: {
              Item: {
                storeLocationId: "123-456-789",
                mall: "EastPointe",
                storeId: "LatteLarrys",
                buildingId: "BuildingA",
                unitId: "A1",
                pk: "$mallstoredirectory#id_123-456-789",
                sk: "$mallstores_1",
                gsi1pk: "$mallstoredirectory#mall_eastpointe",
                gsi1sk: "$mallstores_1#building_buildinga#store_lattelarrys",
                __edb_e__: "MallStores",
                __edb_v__: "1",
              },
              TableName: "StoreDirectory",
              ConditionExpression:
                "attribute_not_exists(#pk) AND attribute_not_exists(#sk)",
              ExpressionAttributeNames: { "#pk": "pk", "#sk": "sk" },
            },
          },
          {
            type: "update",
            input: { id },
            set: { unit: "abc" },
            output: {
              UpdateExpression:
                "SET #unit = :unit_u0, #id = :id_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0",
              ExpressionAttributeNames: {
                "#unit": "unitId",
                "#id": "id",
                "#__edb_e__": "__edb_e__",
                "#__edb_v__": "__edb_v__",
              },
              ExpressionAttributeValues: {
                ":unit_u0": "abc",
                ":id_u0": "123-456-789",
                ":__edb_e___u0": "MallStores",
                ":__edb_v___u0": "1",
              },
              TableName: "StoreDirectory",
              Key: {
                pk: "$mallstoredirectory#id_123-456-789",
                sk: "$mallstores_1",
              },
            },
          },
          {
            type: "patch",
            input: { id },
            set: { unit: "abc" },
            output: {
              ConditionExpression:
                "attribute_exists(#pk) AND attribute_exists(#sk)",
              UpdateExpression:
                "SET #unit = :unit_u0, #id = :id_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0",
              ExpressionAttributeNames: {
                "#unit": "unitId",
                "#id": "id",
                "#__edb_e__": "__edb_e__",
                "#__edb_v__": "__edb_v__",
                "#pk": "pk",
                "#sk": "sk",
              },
              ExpressionAttributeValues: {
                ":unit_u0": "abc",
                ":id_u0": "123-456-789",
                ":__edb_e___u0": "MallStores",
                ":__edb_v___u0": "1",
              },
              TableName: "StoreDirectory",
              Key: {
                pk: "$mallstoredirectory#id_123-456-789",
                sk: "$mallstores_1",
              },
            },
          },
          {
            type: "query",
            index: "units",
            input: { mall, building, store },
            output: {
              KeyConditionExpression: "#pk = :pk and #sk1 = :sk1",
              TableName: "StoreDirectory",
              ExpressionAttributeNames: { "#pk": "gsi1pk", "#sk1": "gsi1sk" },
              ExpressionAttributeValues: {
                ":pk": "$mallstoredirectory#mall_eastpointe",
                ":sk1": "$mallstores_1#building_buildinga#store_lattelarrys",
              },
              IndexName: "gsi1pk-gsi1sk-index",
            },
          },
        ],
        schema: {
          model: {
            service: "MallStoreDirectory",
            entity: "MallStores",
            version: "1",
          },
          table: "StoreDirectory",
          attributes: {
            id: {
              type: "string",
              default: () => uuid(),
              field: "storeLocationId",
            },
            mall: {
              type: "string",
              required: true,
              field: "mall",
            },
            store: {
              type: "string",
              required: true,
              field: "storeId",
            },
            building: {
              type: "string",
              required: true,
              field: "buildingId",
            },
            unit: {
              type: "string",
              required: true,
              field: "unitId",
            },
          },
          indexes: {
            store: {
              pk: {
                field: "pk",
                facets: ["id"],
              },
              sk: {
                field: "sk",
                facets: [],
              },
            },
            units: {
              index: "gsi1pk-gsi1sk-index",
              pk: {
                field: "gsi1pk",
                facets: ["mall"],
              },
              sk: {
                field: "gsi1sk",
                facets: ["building", "store"],
              },
            },
          },
        },
      },
      {
        description: "Has SK, v1 model, Collection",
        queries: [
          {
            type: "get",
            input: { id },
            output: {
              Key: {
                pk: "$mallstoredirectory#id_123-456-789",
                sk: "$collection_name#mallstores_1",
              },
              TableName: "StoreDirectory",
            },
          },
          {
            type: "put",
            input: { id, mall, store, building, unit },
            output: {
              Item: {
                storeLocationId: "123-456-789",
                mall: "EastPointe",
                storeId: "LatteLarrys",
                buildingId: "BuildingA",
                unitId: "A1",
                pk: "$mallstoredirectory#id_123-456-789",
                sk: "$collection_name#mallstores_1",
                gsi1pk: "$mallstoredirectory#mall_eastpointe",
                gsi1sk: "$mallstores_1#building_buildinga#store_lattelarrys",
                __edb_e__: "MallStores",
                __edb_v__: "1",
              },
              TableName: "StoreDirectory",
            },
          },
          {
            type: "create",
            input: { id, mall, store, building, unit },
            output: {
              Item: {
                storeLocationId: "123-456-789",
                mall: "EastPointe",
                storeId: "LatteLarrys",
                buildingId: "BuildingA",
                unitId: "A1",
                pk: "$mallstoredirectory#id_123-456-789",
                sk: "$collection_name#mallstores_1",
                gsi1pk: "$mallstoredirectory#mall_eastpointe",
                gsi1sk: "$mallstores_1#building_buildinga#store_lattelarrys",
                __edb_e__: "MallStores",
                __edb_v__: "1",
              },
              TableName: "StoreDirectory",
              ConditionExpression:
                "attribute_not_exists(#pk) AND attribute_not_exists(#sk)",
              ExpressionAttributeNames: {
                "#pk": "pk",
                "#sk": "sk",
              },
            },
          },
          {
            type: "update",
            input: { id },
            set: { unit: "abc" },
            output: {
              UpdateExpression:
                "SET #unit = :unit_u0, #id = :id_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0",
              ExpressionAttributeNames: {
                "#unit": "unitId",
                "#id": "id",
                "#__edb_e__": "__edb_e__",
                "#__edb_v__": "__edb_v__",
              },
              ExpressionAttributeValues: {
                ":unit_u0": "abc",
                ":id_u0": "123-456-789",
                ":__edb_e___u0": "MallStores",
                ":__edb_v___u0": "1",
              },
              TableName: "StoreDirectory",
              Key: {
                pk: "$mallstoredirectory#id_123-456-789",
                sk: "$collection_name#mallstores_1",
              },
            },
          },
          {
            type: "patch",
            input: { id },
            set: { unit: "abc" },
            output: {
              ConditionExpression:
                "attribute_exists(#pk) AND attribute_exists(#sk)",
              UpdateExpression:
                "SET #unit = :unit_u0, #id = :id_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0",
              ExpressionAttributeNames: {
                "#unit": "unitId",
                "#id": "id",
                "#__edb_e__": "__edb_e__",
                "#__edb_v__": "__edb_v__",
                "#pk": "pk",
                "#sk": "sk",
              },
              ExpressionAttributeValues: {
                ":unit_u0": "abc",
                ":id_u0": "123-456-789",
                ":__edb_e___u0": "MallStores",
                ":__edb_v___u0": "1",
              },
              TableName: "StoreDirectory",
              Key: {
                pk: "$mallstoredirectory#id_123-456-789",
                sk: "$collection_name#mallstores_1",
              },
            },
          },
          {
            type: "query",
            index: "units",
            input: { mall, building, store },
            output: {
              KeyConditionExpression: "#pk = :pk and #sk1 = :sk1",
              TableName: "StoreDirectory",
              ExpressionAttributeNames: { "#pk": "gsi1pk", "#sk1": "gsi1sk" },
              ExpressionAttributeValues: {
                ":pk": "$mallstoredirectory#mall_eastpointe",
                ":sk1": "$mallstores_1#building_buildinga#store_lattelarrys",
              },
              IndexName: "gsi1pk-gsi1sk-index",
            },
          },
        ],
        schema: {
          model: {
            service: "MallStoreDirectory",
            entity: "MallStores",
            version: "1",
          },
          table: "StoreDirectory",
          attributes: {
            id: {
              type: "string",
              default: () => uuid(),
              field: "storeLocationId",
            },
            mall: {
              type: "string",
              required: true,
              field: "mall",
            },
            store: {
              type: "string",
              required: true,
              field: "storeId",
            },
            building: {
              type: "string",
              required: true,
              field: "buildingId",
            },
            unit: {
              type: "string",
              required: true,
              field: "unitId",
            },
          },
          indexes: {
            store: {
              collection: "collection_name",
              pk: {
                field: "pk",
                facets: ["id"],
              },
              sk: {
                field: "sk",
                facets: [],
              },
            },
            units: {
              index: "gsi1pk-gsi1sk-index",
              pk: {
                field: "gsi1pk",
                facets: ["mall"],
              },
              sk: {
                field: "gsi1sk",
                facets: ["building", "store"],
              },
            },
          },
        },
      },
    ];
    for (let test of tests) {
      describe(test.description, () => {
        let db = new Entity(test.schema);
        for (let i = 0; i < test.queries.length; i++) {
          const query = test.queries[i];
          it(`Should create params for a ${query.type}`, () => {
            try {
              let params;
              if (query.type === "query") {
                params = db.query[query.index](query.input).params();
              } else if (query.type === "update" || query.type === "patch") {
                params = db[query.type](query.input).set(query.set).params();
              } else {
                params = db[query.type](query.input).params();
              }
              expect(params).to.deep.equal(query.output);
            } catch (err) {
              err.message = `at index ${i}: ${err.message}`;
            }
          });
        }
      });
    }
  });
  describe("Attribute getters and setters", () => {
    it("Should npt call the attribute setters for a composite attribute when building a table key", () => {
      let setCalls = {
        prop1: 0,
        prop2: 0,
        prop3: 0,
        prop4: 0,
        prop5: 0,
        prop6: 0,
        prop7: 0,
      };
      let schema = {
        model: {
          entity: "setters",
          service: "testing",
          version: "1",
        },
        attributes: {
          prop1: {
            type: "string",
            set: (val) => {
              setCalls.prop1++;
              return `${val}-prop1`;
            },
          },
          prop2: {
            type: "string",
            set: (val) => {
              setCalls.prop2++;
              return `${val}-prop2`;
            },
          },
          prop3: {
            type: "string",
            set: (val) => {
              setCalls.prop3++;
              return `${val}-prop3`;
            },
          },
          prop4: {
            type: "string",
            set: (val) => {
              setCalls.prop4++;
              return `${val}-prop4`;
            },
          },
          prop5: {
            type: "string",
            set: (val) => {
              setCalls.prop5++;
              return `${val}-prop5`;
            },
          },
          prop6: {
            type: "string",
            set: (val) => {
              setCalls.prop6++;
              return `${val}-prop6`;
            },
          },
          prop7: {
            type: "string",
            set: (val) => {
              setCalls.prop7++;
              return `${val}-prop7`;
            },
          },
        },
        indexes: {
          setters: {
            pk: {
              field: "pk",
              facets: ["prop1"],
            },
            sk: {
              field: "sk",
              facets: ["prop2"],
            },
          },
          gsi1: {
            index: "gsi1",
            pk: {
              field: "gsi1pk",
              facets: ["prop3"],
            },
            sk: {
              field: "gsi1sk",
              facets: ["prop4"],
            },
          },
          gsi2: {
            index: "gsi2",
            pk: {
              field: "gsi2pk",
              facets: ["prop5"],
            },
            sk: {
              field: "gsi2sk",
              facets: ["prop6"],
            },
          },
        },
      };
      let prop1 = "abc";
      let prop2 = "def";
      let prop3 = "hij";
      let prop4 = "klm";
      let prop5 = "nop";
      let prop6 = "qrs";
      let entity = new Entity(schema, { table: "test" });
      let tableIndexGet = entity.get({ prop1, prop2 }).params();
      let tableIndexQueryFull = entity.query.setters({ prop1, prop2 }).params();
      let tableIndexQueryPartial = entity.query.setters({ prop1 }).params();
      let gsiQueryFull = entity.query.gsi1({ prop3, prop4 }).params();
      let gsiQueryPartial = entity.query.gsi1({ prop3 }).params();
      expect(tableIndexGet).to.deep.equal({
        Key: {
          pk: "$testing#prop1_abc",
          sk: "$setters_1#prop2_def",
        },
        TableName: "test",
      });
      expect(tableIndexQueryFull).to.deep.equal({
        KeyConditionExpression: "#pk = :pk and #sk1 = :sk1",
        TableName: "test",
        ExpressionAttributeNames: { "#pk": "pk", "#sk1": "sk" },
        ExpressionAttributeValues: {
          ":pk": "$testing#prop1_abc",
          ":sk1": "$setters_1#prop2_def",
        },
      });
      expect(tableIndexQueryPartial).to.deep.equal({
        KeyConditionExpression: "#pk = :pk and begins_with(#sk1, :sk1)",
        TableName: "test",
        ExpressionAttributeNames: { "#pk": "pk", "#sk1": "sk" },
        ExpressionAttributeValues: {
          ":pk": "$testing#prop1_abc",
          ":sk1": "$setters_1#prop2_",
        },
      });
      expect(gsiQueryFull).to.deep.equal({
        KeyConditionExpression: "#pk = :pk and #sk1 = :sk1",
        TableName: "test",
        ExpressionAttributeNames: { "#pk": "gsi1pk", "#sk1": "gsi1sk" },
        ExpressionAttributeValues: {
          ":pk": "$testing#prop3_hij",
          ":sk1": "$setters_1#prop4_klm",
        },
        IndexName: "gsi1",
      });
      expect(gsiQueryPartial).to.deep.equal({
        KeyConditionExpression: "#pk = :pk and begins_with(#sk1, :sk1)",
        TableName: "test",
        ExpressionAttributeNames: { "#pk": "gsi1pk", "#sk1": "gsi1sk" },
        ExpressionAttributeValues: {
          ":pk": "$testing#prop3_hij",
          ":sk1": "$setters_1#prop4_",
        },
        IndexName: "gsi1",
      });
    });
    it("Should not call the attribute setters for a composite attribute when building tables keys that index doesnt have a sort key", () => {
      let setCalls = {
        prop1: 0,
        prop2: 0,
        prop3: 0,
        prop4: 0,
        prop5: 0,
        prop6: 0,
        prop7: 0,
      };
      let schema = {
        model: {
          entity: "setters",
          service: "testing",
          version: "1",
        },
        attributes: {
          prop1: {
            type: "string",
            set: (val) => {
              setCalls.prop1++;
              return `${val}-prop1`;
            },
          },
          prop3: {
            type: "string",
            set: (val) => {
              setCalls.prop3++;
              return `${val}-prop3`;
            },
          },
        },
        indexes: {
          setters: {
            pk: {
              field: "pk",
              facets: ["prop1"],
            },
          },
          gsi1: {
            index: "gsi1",
            pk: {
              field: "gsi1pk",
              facets: ["prop3"],
            },
          },
        },
      };
      let prop1 = "abc";
      let prop3 = "hij";
      let entity = new Entity(schema, { table: "test" });
      let tableIndexGet = entity.get({ prop1 }).params();
      let tableIndexQueryFull = entity.query.setters({ prop1 }).params();
      let tableIndexQueryPartial = entity.query.setters({ prop1 }).params();
      let gsiQueryFull = entity.query.gsi1({ prop3 }).params();
      let gsiQueryPartial = entity.query.gsi1({ prop3 }).params();
      expect(tableIndexGet).to.deep.equal({
        Key: {
          pk: "$testing$setters_1#prop1_abc",
        },
        TableName: "test",
      });
      expect(tableIndexQueryFull).to.deep.equal({
        KeyConditionExpression: "#pk = :pk",
        TableName: "test",
        ExpressionAttributeNames: { "#pk": "pk" },
        ExpressionAttributeValues: {
          ":pk": "$testing$setters_1#prop1_abc",
        },
      });
      expect(tableIndexQueryPartial).to.deep.equal({
        KeyConditionExpression: "#pk = :pk",
        TableName: "test",
        ExpressionAttributeNames: { "#pk": "pk" },
        ExpressionAttributeValues: { ":pk": "$testing$setters_1#prop1_abc" },
      });
      expect(gsiQueryFull).to.deep.equal({
        KeyConditionExpression: "#pk = :pk",
        TableName: "test",
        ExpressionAttributeNames: { "#pk": "gsi1pk" },
        ExpressionAttributeValues: {
          ":pk": "$testing$setters_1#prop3_hij",
        },
        IndexName: "gsi1",
      });
      expect(gsiQueryPartial).to.deep.equal({
        KeyConditionExpression: "#pk = :pk",
        TableName: "test",
        ExpressionAttributeNames: { "#pk": "gsi1pk" },
        ExpressionAttributeValues: { ":pk": "$testing$setters_1#prop3_hij" },
        IndexName: "gsi1",
      });
    });
    it("Should not call the attribute setters when deleting a record", () => {
      let setCalls = {
        prop1: 0,
        prop2: 0,
        prop3: 0,
        prop4: 0,
        prop5: 0,
        prop6: 0,
        prop7: 0,
      };
      let schema = {
        model: {
          entity: "setters",
          service: "testing",
          version: "1",
        },
        attributes: {
          prop1: {
            type: "string",
            set: (val) => {
              setCalls.prop1++;
              return `${val}-prop1`;
            },
          },
          prop2: {
            type: "string",
            set: (val) => {
              setCalls.prop2++;
              return `${val}-prop2`;
            },
          },
          prop3: {
            type: "string",
            set: (val) => {
              setCalls.prop3++;
              return `${val}-prop3`;
            },
          },
          prop4: {
            type: "string",
            set: (val) => {
              setCalls.prop4++;
              return `${val}-prop4`;
            },
          },
          prop5: {
            type: "string",
            set: (val) => {
              setCalls.prop5++;
              return `${val}-prop5`;
            },
          },
          prop6: {
            type: "string",
            set: (val) => {
              setCalls.prop6++;
              return `${val}-prop6`;
            },
          },
          prop7: {
            type: "string",
            set: (val) => {
              setCalls.prop7++;
              return `${val}-prop7`;
            },
          },
        },
        indexes: {
          setters: {
            pk: {
              field: "pk",
              facets: ["prop1"],
            },
            sk: {
              field: "sk",
              facets: ["prop2"],
            },
          },
          gsi1: {
            index: "gsi1",
            pk: {
              field: "gsi1pk",
              facets: ["prop3"],
            },
            sk: {
              field: "gsi1sk",
              facets: ["prop4"],
            },
          },
          gsi2: {
            index: "gsi2",
            pk: {
              field: "gsi2pk",
              facets: ["prop5"],
            },
            sk: {
              field: "gsi2sk",
              facets: ["prop6"],
            },
          },
        },
      };
      let entity = new Entity(schema, { table: "test" });
      let params = entity.delete({ prop1: "abc", prop2: "def" }).params();
      expect(setCalls.prop1).to.equal(0);
      expect(setCalls.prop2).to.equal(0);
      expect(setCalls.prop3).to.equal(0);
      expect(setCalls.prop4).to.equal(0);
      expect(setCalls.prop5).to.equal(0);
      expect(setCalls.prop6).to.equal(0);
      expect(setCalls.prop7).to.equal(0);
      expect(params).to.deep.equal({
        Key: { pk: "$testing#prop1_abc", sk: "$setters_1#prop2_def" },
        TableName: "test",
      });
    });
    it("Should call the attribute setters when updating that attribute", () => {
      let setCalls = {
        prop1: 0,
        prop2: 0,
        prop3: 0,
        prop4: 0,
        prop5: 0,
        prop6: 0,
        prop7: 0,
      };
      let schema = {
        model: {
          entity: "setters",
          service: "testing",
          version: "1",
        },
        attributes: {
          prop1: {
            type: "string",
            set: (val) => {
              setCalls.prop1++;
              return `${val}-prop1`;
            },
          },
          prop2: {
            type: "string",
            set: (val) => {
              setCalls.prop2++;
              return `${val}-prop2`;
            },
          },
          prop3: {
            type: "string",
            set: (val) => {
              setCalls.prop3++;
              return `${val}-prop3`;
            },
          },
          prop4: {
            type: "string",
            set: (val) => {
              setCalls.prop4++;
              return `${val}-prop4`;
            },
          },
          prop5: {
            type: "string",
            set: (val) => {
              setCalls.prop5++;
              return `${val}-prop5`;
            },
          },
          prop6: {
            type: "string",
            set: (val) => {
              setCalls.prop6++;
              return `${val}-prop6`;
            },
          },
          prop7: {
            type: "string",
            set: (val) => {
              setCalls.prop7++;
              return `${val}-prop7`;
            },
          },
        },
        indexes: {
          setters: {
            pk: {
              field: "pk",
              facets: ["prop1"],
            },
            sk: {
              field: "sk",
              facets: ["prop2"],
            },
          },
          gsi1: {
            index: "gsi1",
            pk: {
              field: "gsi1pk",
              facets: ["prop3"],
            },
            sk: {
              field: "gsi1sk",
              facets: ["prop4"],
            },
          },
          gsi2: {
            index: "gsi2",
            pk: {
              field: "gsi2pk",
              facets: ["prop5"],
            },
            sk: {
              field: "gsi2sk",
              facets: ["prop6"],
            },
          },
        },
      };
      let entity = new Entity(schema, { table: "test" });
      let params = entity
        .update({ prop1: "abc", prop2: "def" })
        .set({ prop7: "hij" })
        .params();
      let secondaryIndexParams = entity
        .update({ prop1: "abc", prop2: "def" })
        .set({ prop3: "hij", prop4: "jkl", prop5: "lmn" })
        .params();
      expect(setCalls.prop1).to.equal(0);
      expect(setCalls.prop2).to.equal(0);
      expect(setCalls.prop3).to.equal(1);
      expect(setCalls.prop4).to.equal(1);
      expect(setCalls.prop5).to.equal(1);
      expect(setCalls.prop6).to.equal(0);
      expect(setCalls.prop7).to.equal(1);
      expect(params).to.deep.equal({
        UpdateExpression:
          "SET #prop7 = :prop7_u0, #prop1 = :prop1_u0, #prop2 = :prop2_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0",
        ExpressionAttributeNames: {
          "#prop7": "prop7",
          "#prop1": "prop1",
          "#prop2": "prop2",
          "#__edb_e__": "__edb_e__",
          "#__edb_v__": "__edb_v__",
        },
        ExpressionAttributeValues: {
          ":prop7_u0": "hij-prop7",
          ":prop1_u0": "abc",
          ":prop2_u0": "def",
          ":__edb_e___u0": "setters",
          ":__edb_v___u0": "1",
        },
        TableName: "test",
        Key: { pk: "$testing#prop1_abc", sk: "$setters_1#prop2_def" },
      });
      expect(secondaryIndexParams).to.be.deep.equal({
        UpdateExpression:
          "SET #prop3 = :prop3_u0, #prop4 = :prop4_u0, #prop5 = :prop5_u0, #gsi1pk = :gsi1pk_u0, #gsi1sk = :gsi1sk_u0, #gsi2pk = :gsi2pk_u0, #prop1 = :prop1_u0, #prop2 = :prop2_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0",
        ExpressionAttributeNames: {
          "#prop1": "prop1",
          "#prop2": "prop2",
          "#prop3": "prop3",
          "#prop4": "prop4",
          "#prop5": "prop5",
          "#gsi1pk": "gsi1pk",
          "#gsi1sk": "gsi1sk",
          "#gsi2pk": "gsi2pk",
          "#__edb_e__": "__edb_e__",
          "#__edb_v__": "__edb_v__",
        },
        ExpressionAttributeValues: {
          ":prop1_u0": "abc",
          ":prop2_u0": "def",
          ":prop3_u0": "hij-prop3",
          ":prop4_u0": "jkl-prop4",
          ":prop5_u0": "lmn-prop5",
          ":gsi1pk_u0": "$testing#prop3_hij-prop3",
          ":gsi1sk_u0": "$setters_1#prop4_jkl-prop4",
          ":gsi2pk_u0": "$testing#prop5_lmn-prop5",
          ":__edb_e___u0": "setters",
          ":__edb_v___u0": "1",
        },
        TableName: "test",
        Key: { pk: "$testing#prop1_abc", sk: "$setters_1#prop2_def" },
      });
    });
    it("Should call the attribute setters when patching that attribute", () => {
      let setCalls = {
        prop1: 0,
        prop2: 0,
        prop3: 0,
        prop4: 0,
        prop5: 0,
        prop6: 0,
        prop7: 0,
      };
      let schema = {
        model: {
          entity: "setters",
          service: "testing",
          version: "1",
        },
        attributes: {
          prop1: {
            type: "string",
            set: (val) => {
              setCalls.prop1++;
              return `${val}-prop1`;
            },
          },
          prop2: {
            type: "string",
            set: (val) => {
              setCalls.prop2++;
              return `${val}-prop2`;
            },
          },
          prop3: {
            type: "string",
            set: (val) => {
              setCalls.prop3++;
              return `${val}-prop3`;
            },
          },
          prop4: {
            type: "string",
            set: (val) => {
              setCalls.prop4++;
              return `${val}-prop4`;
            },
          },
          prop5: {
            type: "string",
            set: (val) => {
              setCalls.prop5++;
              return `${val}-prop5`;
            },
          },
          prop6: {
            type: "string",
            set: (val) => {
              setCalls.prop6++;
              return `${val}-prop6`;
            },
          },
          prop7: {
            type: "string",
            set: (val) => {
              setCalls.prop7++;
              return `${val}-prop7`;
            },
          },
        },
        indexes: {
          setters: {
            pk: {
              field: "pk",
              facets: ["prop1"],
            },
            sk: {
              field: "sk",
              facets: ["prop2"],
            },
          },
          gsi1: {
            index: "gsi1",
            pk: {
              field: "gsi1pk",
              facets: ["prop3"],
            },
            sk: {
              field: "gsi1sk",
              facets: ["prop4"],
            },
          },
          gsi2: {
            index: "gsi2",
            pk: {
              field: "gsi2pk",
              facets: ["prop5"],
            },
            sk: {
              field: "gsi2sk",
              facets: ["prop6"],
            },
          },
        },
      };
      let entity = new Entity(schema, { table: "test" });
      let params = entity
        .patch({ prop1: "abc", prop2: "def" })
        .set({ prop7: "hij" })
        .params();
      let secondaryIndexParams = entity
        .patch({ prop1: "abc", prop2: "def" })
        .set({ prop3: "hij", prop4: "jkl", prop5: "lmn" })
        .params();
      expect(setCalls.prop1).to.equal(0);
      expect(setCalls.prop2).to.equal(0);
      expect(setCalls.prop3).to.equal(1);
      expect(setCalls.prop4).to.equal(1);
      expect(setCalls.prop5).to.equal(1);
      expect(setCalls.prop6).to.equal(0);
      expect(setCalls.prop7).to.equal(1);
      expect(params).to.deep.equal({
        UpdateExpression:
          "SET #prop7 = :prop7_u0, #prop1 = :prop1_u0, #prop2 = :prop2_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0",
        ExpressionAttributeNames: {
          "#prop7": "prop7",
          "#prop1": "prop1",
          "#prop2": "prop2",
          "#__edb_e__": "__edb_e__",
          "#__edb_v__": "__edb_v__",
          "#pk": "pk",
          "#sk": "sk",
        },
        ExpressionAttributeValues: {
          ":prop7_u0": "hij-prop7",
          ":prop1_u0": "abc",
          ":prop2_u0": "def",
          ":__edb_e___u0": "setters",
          ":__edb_v___u0": "1",
        },
        TableName: "test",
        Key: { pk: "$testing#prop1_abc", sk: "$setters_1#prop2_def" },
        ConditionExpression: "attribute_exists(#pk) AND attribute_exists(#sk)",
      });
      expect(secondaryIndexParams).to.be.deep.equal({
        UpdateExpression:
          "SET #prop3 = :prop3_u0, #prop4 = :prop4_u0, #prop5 = :prop5_u0, #gsi1pk = :gsi1pk_u0, #gsi1sk = :gsi1sk_u0, #gsi2pk = :gsi2pk_u0, #prop1 = :prop1_u0, #prop2 = :prop2_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0",
        ExpressionAttributeNames: {
          "#prop1": "prop1",
          "#prop2": "prop2",
          "#prop3": "prop3",
          "#prop4": "prop4",
          "#prop5": "prop5",
          "#gsi1pk": "gsi1pk",
          "#gsi1sk": "gsi1sk",
          "#gsi2pk": "gsi2pk",
          "#__edb_e__": "__edb_e__",
          "#__edb_v__": "__edb_v__",
          "#pk": "pk",
          "#sk": "sk",
        },
        ExpressionAttributeValues: {
          ":prop1_u0": "abc",
          ":prop2_u0": "def",
          ":prop3_u0": "hij-prop3",
          ":prop4_u0": "jkl-prop4",
          ":prop5_u0": "lmn-prop5",
          ":gsi1pk_u0": "$testing#prop3_hij-prop3",
          ":gsi1sk_u0": "$setters_1#prop4_jkl-prop4",
          ":gsi2pk_u0": "$testing#prop5_lmn-prop5",
          ":__edb_e___u0": "setters",
          ":__edb_v___u0": "1",
        },
        TableName: "test",
        Key: { pk: "$testing#prop1_abc", sk: "$setters_1#prop2_def" },
        ConditionExpression: "attribute_exists(#pk) AND attribute_exists(#sk)",
      });
    });
    it("Should call the attribute setters when putting that attribute", () => {
      let setCalls = {
        prop1: 0,
        prop2: 0,
        prop3: 0,
        prop4: 0,
        prop5: 0,
        prop6: 0,
        prop7: 0,
      };
      let schema = {
        model: {
          entity: "setters",
          service: "testing",
          version: "1",
        },
        attributes: {
          prop1: {
            type: "string",
            set: (val) => {
              setCalls.prop1++;
              return `${val}-prop1`;
            },
          },
          prop2: {
            type: "string",
            set: (val) => {
              setCalls.prop2++;
              return `${val}-prop2`;
            },
          },
          prop3: {
            type: "string",
            set: (val) => {
              setCalls.prop3++;
              return `${val}-prop3`;
            },
          },
          prop4: {
            type: "string",
            set: (val) => {
              setCalls.prop4++;
              return `${val}-prop4`;
            },
          },
          prop5: {
            type: "string",
            set: (val) => {
              setCalls.prop5++;
              return `${val}-prop5`;
            },
          },
          prop6: {
            type: "string",
            set: (val) => {
              setCalls.prop6++;
              return `${val}-prop6`;
            },
          },
          prop7: {
            type: "string",
            set: (val) => {
              setCalls.prop7++;
              return `${val}-prop7`;
            },
          },
        },
        indexes: {
          setters: {
            pk: {
              field: "pk",
              facets: ["prop1"],
            },
            sk: {
              field: "sk",
              facets: ["prop2"],
            },
          },
          gsi1: {
            index: "gsi1",
            pk: {
              field: "gsi1pk",
              facets: ["prop3"],
            },
            sk: {
              field: "gsi1sk",
              facets: ["prop4"],
            },
          },
          gsi2: {
            index: "gsi2",
            pk: {
              field: "gsi2pk",
              facets: ["prop5"],
            },
            sk: {
              field: "gsi2sk",
              facets: ["prop6"],
            },
          },
        },
      };
      let prop1 = "abc";
      let prop2 = "def";
      let prop3 = "hij";
      let prop4 = "klm";
      let prop5 = "nop";
      let prop6 = "qrs";
      let prop7 = "tuv";
      let entity = new Entity(schema, { table: "test" });
      let params = entity
        .put({ prop1, prop2, prop3, prop4, prop5, prop6, prop7 })
        .params();
      // expect(setCalls.prop1).to.equal(1);
      // expect(setCalls.prop2).to.equal(1);
      // expect(setCalls.prop3).to.equal(1);
      // expect(setCalls.prop4).to.equal(1);
      // expect(setCalls.prop5).to.equal(1);
      // expect(setCalls.prop6).to.equal(1);
      // expect(setCalls.prop7).to.equal(1);
      expect(params).to.deep.equal({
        Item: {
          prop1: "abc-prop1",
          prop2: "def-prop2",
          prop3: "hij-prop3",
          prop4: "klm-prop4",
          prop5: "nop-prop5",
          prop6: "qrs-prop6",
          prop7: "tuv-prop7",
          pk: "$testing#prop1_abc-prop1",
          sk: "$setters_1#prop2_def-prop2",
          gsi1pk: "$testing#prop3_hij-prop3",
          gsi1sk: "$setters_1#prop4_klm-prop4",
          gsi2pk: "$testing#prop5_nop-prop5",
          gsi2sk: "$setters_1#prop6_qrs-prop6",
          __edb_e__: "setters",
          __edb_v__: "1",
        },
        TableName: "test",
      });
    });
    it("Should call the attribute setters when creating that attribute", () => {
      let setCalls = {
        prop1: 0,
        prop2: 0,
        prop3: 0,
        prop4: 0,
        prop5: 0,
        prop6: 0,
        prop7: 0,
      };
      let schema = {
        model: {
          entity: "setters",
          service: "testing",
          version: "1",
        },
        attributes: {
          prop1: {
            type: "string",
            set: (val) => {
              setCalls.prop1++;
              return `${val}-prop1`;
            },
          },
          prop2: {
            type: "string",
            set: (val) => {
              setCalls.prop2++;
              return `${val}-prop2`;
            },
          },
          prop3: {
            type: "string",
            set: (val) => {
              setCalls.prop3++;
              return `${val}-prop3`;
            },
          },
          prop4: {
            type: "string",
            set: (val) => {
              setCalls.prop4++;
              return `${val}-prop4`;
            },
          },
          prop5: {
            type: "string",
            set: (val) => {
              setCalls.prop5++;
              return `${val}-prop5`;
            },
          },
          prop6: {
            type: "string",
            set: (val) => {
              setCalls.prop6++;
              return `${val}-prop6`;
            },
          },
          prop7: {
            type: "string",
            set: (val) => {
              setCalls.prop7++;
              return `${val}-prop7`;
            },
          },
        },
        indexes: {
          setters: {
            pk: {
              field: "pk",
              facets: ["prop1"],
            },
            sk: {
              field: "sk",
              facets: ["prop2"],
            },
          },
          gsi1: {
            index: "gsi1",
            pk: {
              field: "gsi1pk",
              facets: ["prop3"],
            },
            sk: {
              field: "gsi1sk",
              facets: ["prop4"],
            },
          },
          gsi2: {
            index: "gsi2",
            pk: {
              field: "gsi2pk",
              facets: ["prop5"],
            },
            sk: {
              field: "gsi2sk",
              facets: ["prop6"],
            },
          },
        },
      };
      let prop1 = "abc";
      let prop2 = "def";
      let prop3 = "hij";
      let prop4 = "klm";
      let prop5 = "nop";
      let prop6 = "qrs";
      let prop7 = "tuv";
      let entity = new Entity(schema, { table: "test" });
      let params = entity
        .create({ prop1, prop2, prop3, prop4, prop5, prop6, prop7 })
        .params();
      // expect(setCalls.prop1).to.equal(1);
      // expect(setCalls.prop2).to.equal(1);
      // expect(setCalls.prop3).to.equal(1);
      // expect(setCalls.prop4).to.equal(1);
      // expect(setCalls.prop5).to.equal(1);
      // expect(setCalls.prop6).to.equal(1);
      expect(setCalls.prop7).to.equal(1);
      expect(params).to.deep.equal({
        Item: {
          prop1: "abc-prop1",
          prop2: "def-prop2",
          prop3: "hij-prop3",
          prop4: "klm-prop4",
          prop5: "nop-prop5",
          prop6: "qrs-prop6",
          prop7: "tuv-prop7",
          pk: "$testing#prop1_abc-prop1",
          sk: "$setters_1#prop2_def-prop2",
          gsi1pk: "$testing#prop3_hij-prop3",
          gsi1sk: "$setters_1#prop4_klm-prop4",
          gsi2pk: "$testing#prop5_nop-prop5",
          gsi2sk: "$setters_1#prop6_qrs-prop6",
          __edb_e__: "setters",
          __edb_v__: "1",
        },
        TableName: "test",
        ConditionExpression:
          "attribute_not_exists(#pk) AND attribute_not_exists(#sk)",
        ExpressionAttributeNames: {
          "#pk": "pk",
          "#sk": "sk",
        },
      });
    });
    it("Should call the attribute setters when putting that attribute even if that attribute was not supplied", () => {
      let setCalls = {
        prop1: 0,
        prop2: 0,
        prop3: 0,
        prop4: 0,
        prop5: 0,
        prop6: 0,
        prop7: 0,
      };
      let schema = {
        model: {
          entity: "setters",
          service: "testing",
          version: "1",
        },
        attributes: {
          prop1: {
            type: "string",
            set: (val) => {
              setCalls.prop1++;
              return `${val}-prop1`;
            },
          },
          prop2: {
            type: "string",
            set: (val) => {
              setCalls.prop2++;
              return `${val}-prop2`;
            },
          },
          prop3: {
            type: "string",
            set: (val) => {
              setCalls.prop3++;
              return `${val}-prop3`;
            },
          },
          prop4: {
            type: "string",
            set: (val) => {
              setCalls.prop4++;
              return `${val}-prop4`;
            },
          },
          prop5: {
            type: "string",
            set: (val) => {
              setCalls.prop5++;
              return `${val}-prop5`;
            },
          },
          prop6: {
            type: "string",
            set: (val) => {
              setCalls.prop6++;
              return `${val}-prop6`;
            },
          },
          prop7: {
            type: "string",
            set: (val) => {
              setCalls.prop7++;
              return `${val}-prop7`;
            },
          },
        },
        indexes: {
          setters: {
            pk: {
              field: "pk",
              facets: ["prop1"],
            },
            sk: {
              field: "sk",
              facets: ["prop2"],
            },
          },
          gsi1: {
            index: "gsi1",
            pk: {
              field: "gsi1pk",
              facets: ["prop3"],
            },
            sk: {
              field: "gsi1sk",
              facets: ["prop4"],
            },
          },
          gsi2: {
            index: "gsi2",
            pk: {
              field: "gsi2pk",
              facets: ["prop5"],
            },
            sk: {
              field: "gsi2sk",
              facets: ["prop6"],
            },
          },
        },
      };
      let entity = new Entity(schema, { table: "test" });
      let params = entity
        .put({
          prop1: "abc",
          prop2: "def",
          prop3: "hij",
          prop4: "klm",
          prop5: "nop",
        })
        .params();
      // expect(setCalls.prop1).to.equal(1);
      // expect(setCalls.prop2).to.equal(1);
      // expect(setCalls.prop3).to.equal(1);
      // expect(setCalls.prop4).to.equal(1);
      // expect(setCalls.prop5).to.equal(1);
      // expect(setCalls.prop6).to.equal(1);
      // expect(setCalls.prop7).to.equal(1);
      expect(params).to.deep.equal({
        Item: {
          prop1: "abc-prop1",
          prop2: "def-prop2",
          prop3: "hij-prop3",
          prop4: "klm-prop4",
          prop5: "nop-prop5",
          prop6: "undefined-prop6",
          prop7: "undefined-prop7",
          pk: "$testing#prop1_abc-prop1",
          sk: "$setters_1#prop2_def-prop2",
          gsi1pk: "$testing#prop3_hij-prop3",
          gsi1sk: "$setters_1#prop4_klm-prop4",
          gsi2pk: "$testing#prop5_nop-prop5",
          gsi2sk: "$setters_1#prop6_undefined-prop6",
          __edb_e__: "setters",
          __edb_v__: "1",
        },
        TableName: "test",
      });
    });
    it("Should call the attribute setters when putting that attribute and will not set a value the value if it is undefined", () => {
      let setCalls = {
        prop1: 0,
        prop2: 0,
        prop3: 0,
        prop4: 0,
        prop5: 0,
        prop6: 0,
        prop7: 0,
      };
      let schema = {
        model: {
          entity: "setters",
          service: "testing",
          version: "1",
        },
        attributes: {
          prop1: {
            type: "string",
            set: (val) => {
              setCalls.prop1++;
              return `${val}-prop1`;
            },
          },
          prop2: {
            type: "string",
            set: (val) => {
              setCalls.prop2++;
              return `${val}-prop2`;
            },
          },
          prop3: {
            type: "string",
            set: (val) => {
              setCalls.prop3++;
              return `${val}-prop3`;
            },
          },
          prop4: {
            type: "string",
            set: (val) => {
              setCalls.prop4++;
              return `${val}-prop4`;
            },
          },
          prop5: {
            type: "string",
            set: (val) => {
              setCalls.prop5++;
              return undefined;
            },
          },
          prop6: {
            type: "string",
            set: (val) => {
              setCalls.prop6++;
              return undefined;
            },
          },
          prop7: {
            type: "string",
            set: (val) => {
              setCalls.prop7++;
              return undefined;
            },
          },
        },
        indexes: {
          setters: {
            pk: {
              field: "pk",
              facets: ["prop1"],
            },
            sk: {
              field: "sk",
              facets: ["prop2"],
            },
          },
          gsi1: {
            index: "gsi1",
            pk: {
              field: "gsi1pk",
              facets: ["prop3"],
            },
            sk: {
              field: "gsi1sk",
              facets: ["prop4"],
            },
          },
          gsi2: {
            index: "gsi2",
            pk: {
              field: "gsi2pk",
              facets: ["prop5"],
            },
            sk: {
              field: "gsi2sk",
              facets: ["prop6"],
            },
          },
        },
      };
      let entity = new Entity(schema, { table: "test" });
      let params = entity
        .put({
          prop1: "abc",
          prop2: "def",
          prop3: "hij",
          prop4: "klm",
          prop5: "nop",
        })
        .params();
      expect(params).to.deep.equal({
        Item: {
          prop1: "abc-prop1",
          prop2: "def-prop2",
          prop3: "hij-prop3",
          prop4: "klm-prop4",
          pk: "$testing#prop1_abc-prop1",
          sk: "$setters_1#prop2_def-prop2",
          gsi1pk: "$testing#prop3_hij-prop3",
          gsi1sk: "$setters_1#prop4_klm-prop4",
          __edb_e__: "setters",
          __edb_v__: "1",
        },
        TableName: "test",
      });
    });
  });
  describe("Numeric and boolean keys", () => {
    it("Should create keys with primitive types other than strings if specified as a template without prefix", () => {
      const entity = new Entity(
        {
          model: {
            entity: "nonstring_indexes",
            service: "tests",
            version: "1",
          },
          attributes: {
            number1: {
              type: "number",
            },
            number2: {
              type: "number",
            },
            number3: {
              type: "number",
            },
          },
          indexes: {
            record: {
              pk: {
                field: "pk",
                template: "${number1}",
              },
              sk: {
                field: "sk",
                template: "${number2}",
              },
            },
            anotherRecord: {
              index: "gsi1",
              pk: {
                field: "gsi1pk",
                template: "${number2}",
              },
              sk: {
                field: "gsi1sk",
                template: "${number1}",
              },
            },
            yetAnotherRecord: {
              index: "gsi2",
              pk: {
                field: "gsi2pk",
                template: "${number1}",
              },
            },
            andAnotherOne: {
              index: "gsi3",
              pk: {
                field: "gsi3pk",
                template: "${number2}",
              },
            },
          },
        },
        { table: "electro_nostringkeys" },
      );
      let putParams = entity.put({ number1: 55, number2: 66 }).params();
      let getParams = entity.get({ number1: 55, number2: 66 }).params();
      let deleteParams = entity.delete({ number1: 55, number2: 66 }).params();
      let updateParams = entity
        .update({ number1: 55, number2: 66 })
        .set({ number3: 77 })
        .params();
      let queryParams = entity.query.record({ number1: 55 }).params();
      expect(putParams).to.deep.equal({
        Item: {
          number1: 55,
          number2: 66,
          pk: 55,
          sk: 66,
          gsi1pk: 66,
          gsi1sk: 55,
          gsi2pk: 55,
          gsi3pk: 66,
          __edb_e__: "nonstring_indexes",
          __edb_v__: "1",
        },
        TableName: "electro_nostringkeys",
      });

      expect(getParams).to.deep.equal({
        Key: {
          pk: 55,
          sk: 66,
        },
        TableName: "electro_nostringkeys",
      });

      expect(queryParams).to.deep.equal({
        KeyConditionExpression: "#pk = :pk",
        TableName: "electro_nostringkeys",
        ExpressionAttributeNames: { "#pk": "pk" },
        ExpressionAttributeValues: { ":pk": 55 },
      });

      expect(deleteParams).to.deep.equal({
        Key: {
          pk: 55,
          sk: 66,
        },
        TableName: "electro_nostringkeys",
      });

      expect(updateParams).to.deep.equal({
        UpdateExpression:
          "SET #number3 = :number3_u0, #number1 = :number1_u0, #number2 = :number2_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0",
        ExpressionAttributeNames: {
          "#number3": "number3",
          "#number1": "number1",
          "#number2": "number2",
          "#__edb_e__": "__edb_e__",
          "#__edb_v__": "__edb_v__",
        },
        ExpressionAttributeValues: {
          ":number3_u0": 77,
          ":number1_u0": 55,
          ":number2_u0": 66,
          ":__edb_e___u0": "nonstring_indexes",
          ":__edb_v___u0": "1",
        },
        TableName: "electro_nostringkeys",
        Key: { pk: 55, sk: 66 },
      });
    });
  });
  describe("Composite Key Templates", () => {
    it("Should not allow an empty values within template brackets", () => {
      // empty template brackets
      expect(
        () =>
          new Entity(
            {
              model: {
                entity: "templates",
                service: "test",
                version: "1",
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
                },
              },
              indexes: {
                record: {
                  pk: {
                    field: "pk",
                    template: "myprefix1_${attr1}#${}",
                  },
                  sk: {
                    field: "sk",
                    template: "myprefix2_${attr2}#mypostfix2",
                  },
                },
              },
            },
            { table: "table" },
          ),
      ).to.throw(
        'Invalid key composite attribute template. Empty expression "${}" provided. Expected attribute name.',
      );

      // spaces within template brackets
      expect(
        () =>
          new Entity(
            {
              model: {
                entity: "templates",
                service: "test",
                version: "1",
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
                },
              },
              indexes: {
                record: {
                  pk: {
                    field: "pk",
                    template: "myprefix1_${attr1}#${     }",
                  },
                  sk: {
                    field: "sk",
                    template: "myprefix2_${attr2}#mypostfix2",
                  },
                },
              },
            },
            { table: "table" },
          ),
      ).to.throw(
        'Invalid key composite attribute template. Empty expression "${     }" provided. Expected attribute name.',
      );
    });

    it("Should allow composite templates to have trailing labels", () => {
      const entity = new Entity(
        {
          model: {
            entity: "templates",
            service: "test",
            version: "1",
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
            },
          },
          indexes: {
            record: {
              pk: {
                field: "pk",
                template: "myprefix1_${attr1}#mypostfix1",
              },
              sk: {
                field: "sk",
                template: "myprefix2_${attr2}#mypostfix2",
              },
            },
          },
        },
        { table: "table" },
      );
      let getParams = entity.get({ attr1: "abc", attr2: "def" }).params();
      expect(() => entity.get({ attr1: "abc" }).params()).to.throw(
        'Incomplete or invalid key composite attributes supplied. Missing properties: "attr2" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#incomplete-composite-attributes',
      );
      expect(() => entity.delete({ attr1: "abc" }).params()).to.throw(
        'Incomplete or invalid key composite attributes supplied. Missing properties: "attr2" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#incomplete-composite-attributes',
      );
      expect(() => entity.remove({ attr1: "abc" }).params()).to.throw(
        'Incomplete or invalid key composite attributes supplied. Missing properties: "attr2" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#incomplete-composite-attributes',
      );
      expect(() =>
        entity.update({ attr1: "abc" }).set({ attr3: "def" }).params(),
      ).to.throw(
        'Incomplete or invalid key composite attributes supplied. Missing properties: "attr2" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#incomplete-composite-attributes',
      );
      expect(() =>
        entity.patch({ attr1: "abc" }).set({ attr3: "def" }).params(),
      ).to.throw(
        'Incomplete or invalid key composite attributes supplied. Missing properties: "attr2" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#incomplete-composite-attributes',
      );
      expect(() =>
        entity.put({ attr1: "abc", attr3: "def" }).params(),
      ).to.throw(
        'Incomplete or invalid key composite attributes supplied. Missing properties: "attr2" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#incomplete-composite-attributes',
      );
      expect(() =>
        entity.create({ attr1: "abc", attr3: "def" }).params(),
      ).to.throw(
        'Incomplete or invalid key composite attributes supplied. Missing properties: "attr2" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#incomplete-composite-attributes',
      );

      // empty strings don't count
      expect(() => entity.get({ attr1: "abc", attr2: "" }).params()).to.not
        .throw;
      expect(() => entity.delete({ attr1: "abc", attr2: "" }).params()).to.not
        .throw;
      expect(() => entity.remove({ attr1: "abc", attr2: "" }).params()).to.not
        .throw;
      expect(() =>
        entity
          .update({ attr1: "abc", attr2: "" })
          .set({ attr3: "def" })
          .params(),
      ).to.not.throw;
      expect(() =>
        entity
          .patch({ attr1: "abc", attr2: "" })
          .set({ attr3: "def" })
          .params(),
      ).to.not.throw;
      expect(() =>
        entity.put({ attr1: "abc", attr3: "def", attr2: "" }).params(),
      ).to.not.throw;
      expect(() =>
        entity.create({ attr1: "abc", attr3: "def", attr2: "" }).params(),
      ).to.not.throw;

      let queryParams1 = entity.query.record({ attr1: "abc" }).params();
      let queryParams2 = entity.query
        .record({ attr1: "abc", attr2: "def" })
        .params();
      expect(getParams).to.deep.equal({
        Key: { pk: "myprefix1_abc#mypostfix1", sk: "myprefix2_def#mypostfix2" },
        TableName: "table",
      });
      expect(queryParams1).to.deep.equal({
        KeyConditionExpression: "#pk = :pk and begins_with(#sk1, :sk1)",
        TableName: "table",
        ExpressionAttributeNames: { "#pk": "pk", "#sk1": "sk" },
        ExpressionAttributeValues: {
          ":pk": "myprefix1_abc#mypostfix1",
          ":sk1": "myprefix2_",
        },
      });
      expect(queryParams2).to.deep.equal({
        KeyConditionExpression: "#pk = :pk and #sk1 = :sk1",
        TableName: "table",
        ExpressionAttributeNames: { "#pk": "pk", "#sk1": "sk" },
        ExpressionAttributeValues: {
          ":pk": "myprefix1_abc#mypostfix1",
          ":sk1": "myprefix2_def#mypostfix2",
        },
      });
    });
    it("Should identify all composite attributes and labels for a given template", () => {
      // `schema` used here does not (currently) impact the use of the `_parseComposedKey` method.
      const entity = new Entity(schema);
      let newTemplateSyntax = {
        loneValue: entity._parseTemplateKey("${myValue}"),
        allSquished: entity._parseTemplateKey(
          "${myValue1}${myValue2}${myValue3}",
        ),
        labeledWithOneSquish: entity._parseTemplateKey(
          "myLabel${myValue}${myOtherValue}",
        ),
        allLabeledWithDividers: entity._parseTemplateKey(
          "mylabel_${myValue}#other_${myOtherValue}",
        ),
        allLabelNoValue: entity._parseTemplateKey("static_value"),
        trailingLabel: entity._parseTemplateKey(
          "label_${myAttribute}#trailing",
        ),
      };
      expect(newTemplateSyntax.loneValue).to.deep.equal([
        {
          name: "myValue",
          label: "",
        },
      ]);
      expect(newTemplateSyntax.allSquished).to.deep.equal([
        {
          name: "myValue1",
          label: "",
        },
        {
          name: "myValue2",
          label: "",
        },
        {
          name: "myValue3",
          label: "",
        },
      ]);
      expect(newTemplateSyntax.labeledWithOneSquish).to.deep.equal([
        {
          name: "myValue",
          label: "myLabel",
        },
        {
          name: "myOtherValue",
          label: "",
        },
      ]);
      expect(newTemplateSyntax.allLabeledWithDividers).to.deep.equal([
        {
          name: "myValue",
          label: "mylabel_",
        },
        {
          name: "myOtherValue",
          label: "#other_",
        },
      ]);
      expect(newTemplateSyntax.allLabelNoValue).to.deep.equal([
        {
          name: "",
          label: "static_value",
        },
      ]);
      expect(newTemplateSyntax.trailingLabel).to.deep.equal([
        {
          name: "myAttribute",
          label: "label_",
        },
        {
          name: "",
          label: "#trailing",
        },
      ]);
    });
  });
  describe("Edge-cases around including composite attributes in updates", () => {
    const entity = new Entity(
      {
        model: {
          entity: "update-edgecases",
          service: "test",
          version: "1",
        },
        attributes: {
          prop0: {
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
          prop10: {
            type: "string",
          },
          prop11: {
            type: "string",
          },
          prop12: {
            type: "string",
          },
          prop13: {
            type: "string",
          },
          prop14: {
            type: "string",
          },
          prop15: {
            type: "string",
          },
        },
        indexes: {
          accessPattern1: {
            pk: {
              field: "pk",
              composite: ["prop1"],
            },
            sk: {
              field: "sk",
              composite: ["prop2"],
            },
          },
          accessPattern2: {
            index: "gsi1pk-gsi1sk-index",
            pk: {
              field: "gsi1pk",
              composite: ["prop3"],
            },
            sk: {
              field: "gsi1sk",
              composite: ["prop2", "prop4"],
            },
          },
          accessPattern3: {
            index: "gsi2pk-gsi2sk-index",
            pk: {
              field: "gsi2pk",
              composite: ["prop5"],
            },
            sk: {
              field: "gsi2sk",
              composite: ["prop2", "prop6", "prop7"],
            },
          },
          accessPattern4: {
            index: "gsi3pk-gsi3sk-index",
            pk: {
              field: "gsi3pk",
              composite: ["prop8"],
            },
            sk: {
              field: "gsi3sk",
              composite: ["prop9", "prop2"],
            },
          },
          accessPattern5: {
            index: "gsi4pk-gsi4sk-index",
            pk: {
              field: "gsi4pk",
              composite: ["prop10"],
            },
            sk: {
              field: "gsi4sk",
              composite: ["prop11", "prop2", "prop12"],
            },
          },
          accessPattern6: {
            index: "gsi5pk-gsi5sk-index",
            pk: {
              field: "gsi5pk",
              composite: ["prop13"],
            },
            sk: {
              field: "gsi5sk",
              composite: ["prop14", "prop15", "prop2"],
            },
          },
        },
      },
      { table: "test_table" },
    );
    const prop0 = "value0";
    const prop1 = "value1";
    const prop2 = "value2";
    const prop4 = "value4";
    const prop6 = "value6";
    const prop7 = "value7";
    const prop9 = "value9";
    const prop11 = "value11";
    const prop14 = "value14";
    const prop15 = "value15";
    const tests = [
      {
        description: "should not throw and only update prop0",
        success: true,
        input: { prop0 },
        output: {
          UpdateExpression:
            "SET #prop0 = :prop0_u0, #prop1 = :prop1_u0, #prop2 = :prop2_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0",
          ExpressionAttributeNames: {
            "#prop0": "prop0",
            "#prop1": "prop1",
            "#prop2": "prop2",
            "#__edb_e__": "__edb_e__",
            "#__edb_v__": "__edb_v__",
          },
          ExpressionAttributeValues: {
            ":prop0_u0": "value0",
            ":prop1_u0": "value1",
            ":prop2_u0": "value2",
            ":__edb_e___u0": "update-edgecases",
            ":__edb_v___u0": "1",
          },
          TableName: "test_table",
          Key: {
            pk: "$test#prop1_value1",
            sk: "$update-edgecases_1#prop2_value2",
          },
        },
      },
      {
        description: "should update prop4 and set gsi1sk",
        success: true,
        input: { prop0, prop4 },
        output: {
          UpdateExpression:
            "SET #prop0 = :prop0_u0, #prop4 = :prop4_u0, #gsi1sk = :gsi1sk_u0, #prop1 = :prop1_u0, #prop2 = :prop2_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0",
          ExpressionAttributeNames: {
            "#prop0": "prop0",
            "#prop4": "prop4",
            "#gsi1sk": "gsi1sk",
            "#prop1": "prop1",
            "#prop2": "prop2",
            "#__edb_e__": "__edb_e__",
            "#__edb_v__": "__edb_v__",
          },
          ExpressionAttributeValues: {
            ":prop0_u0": "value0",
            ":prop4_u0": "value4",
            ":gsi1sk_u0": "$update-edgecases_1#prop2_value2#prop4_value4",
            ":prop1_u0": "value1",
            ":prop2_u0": "value2",
            ":__edb_e___u0": "update-edgecases",
            ":__edb_v___u0": "1",
          },
          TableName: "test_table",
          Key: {
            pk: "$test#prop1_value1",
            sk: "$update-edgecases_1#prop2_value2",
          },
        },
      },
      {
        description:
          "should throw because result would create incomplete key without prop7",
        success: false,
        input: { prop0, prop6 },
        output: `Incomplete composite attributes: Without the composite attributes "prop7" the following access patterns cannot be updated: "accessPattern3". If a composite attribute is readOnly and cannot be set, use the 'composite' chain method on update to supply the value for key formatting purposes. - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#incomplete-composite-attributes`,
      },
      {
        description:
          "should throw because result would create incomplete key without prop6",
        success: false,
        input: { prop0, prop7 },
        output: `Incomplete composite attributes: Without the composite attributes "prop6" the following access patterns cannot be updated: "accessPattern3". If a composite attribute is readOnly and cannot be set, use the 'composite' chain method on update to supply the value for key formatting purposes. - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#incomplete-composite-attributes`,
      },
      {
        description: "should update prop9 and build gsi3sk",
        success: true,
        input: { prop0, prop9 },
        output: {
          UpdateExpression:
            "SET #prop0 = :prop0_u0, #prop9 = :prop9_u0, #gsi3sk = :gsi3sk_u0, #prop1 = :prop1_u0, #prop2 = :prop2_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0",
          ExpressionAttributeNames: {
            "#prop0": "prop0",
            "#prop9": "prop9",
            "#gsi3sk": "gsi3sk",
            "#prop1": "prop1",
            "#prop2": "prop2",
            "#__edb_e__": "__edb_e__",
            "#__edb_v__": "__edb_v__",
          },
          ExpressionAttributeValues: {
            ":prop0_u0": "value0",
            ":prop9_u0": "value9",
            ":gsi3sk_u0": "$update-edgecases_1#prop9_value9#prop2_value2",
            ":prop1_u0": "value1",
            ":prop2_u0": "value2",
            ":__edb_e___u0": "update-edgecases",
            ":__edb_v___u0": "1",
          },
          TableName: "test_table",
          Key: {
            pk: "$test#prop1_value1",
            sk: "$update-edgecases_1#prop2_value2",
          },
        },
      },
      {
        description:
          "should throw because result would create incomplete key without prop12",
        success: false,
        input: { prop0, prop11 },
        output: `Incomplete composite attributes: Without the composite attributes "prop12" the following access patterns cannot be updated: "accessPattern5". If a composite attribute is readOnly and cannot be set, use the 'composite' chain method on update to supply the value for key formatting purposes. - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#incomplete-composite-attributes`,
      },
      {
        description:
          "should throw because result would create incomplete key without prop15",
        success: false,
        input: { prop0, prop14 },
        output: `Incomplete composite attributes: Without the composite attributes "prop15" the following access patterns cannot be updated: "accessPattern6". If a composite attribute is readOnly and cannot be set, use the 'composite' chain method on update to supply the value for key formatting purposes. - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#incomplete-composite-attributes`,
      },
      {
        description:
          "should throw because result would create incomplete key without prop14",
        success: false,
        input: { prop0, prop15 },
        output: `Incomplete composite attributes: Without the composite attributes "prop14" the following access patterns cannot be updated: "accessPattern6". If a composite attribute is readOnly and cannot be set, use the 'composite' chain method on update to supply the value for key formatting purposes. - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#incomplete-composite-attributes`,
      },
      {
        description: "should update prop14, prop15, and set gsi5sk",
        success: true,
        input: { prop0, prop14, prop15 },
        output: {
          UpdateExpression:
            "SET #prop0 = :prop0_u0, #prop14 = :prop14_u0, #prop15 = :prop15_u0, #gsi5sk = :gsi5sk_u0, #prop1 = :prop1_u0, #prop2 = :prop2_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0",
          ExpressionAttributeNames: {
            "#prop0": "prop0",
            "#prop14": "prop14",
            "#prop15": "prop15",
            "#gsi5sk": "gsi5sk",
            "#prop1": "prop1",
            "#prop2": "prop2",
            "#__edb_e__": "__edb_e__",
            "#__edb_v__": "__edb_v__",
          },
          ExpressionAttributeValues: {
            ":prop0_u0": "value0",
            ":prop14_u0": "value14",
            ":prop15_u0": "value15",
            ":gsi5sk_u0":
              "$update-edgecases_1#prop14_value14#prop15_value15#prop2_value2",
            ":prop1_u0": "value1",
            ":prop2_u0": "value2",
            ":__edb_e___u0": "update-edgecases",
            ":__edb_v___u0": "1",
          },
          TableName: "test_table",
          Key: {
            pk: "$test#prop1_value1",
            sk: "$update-edgecases_1#prop2_value2",
          },
        },
      },
    ];

    for (const test of tests) {
      it(test.description, () => {
        let output;
        let success = true;
        try {
          output = entity.update({ prop1, prop2 }).set(test.input).params();
        } catch (err) {
          success = false;
          output = err.message;
        }
        expect(output).to.deep.equal(test.output);
        expect(success).to.equal(test.success);
      });
    }
  });

  describe('when watch "*" is used', () => {
    it("should create keys using the result of the attributes setter regardless if the attribute was supplied", () => {
      const UrlEntity = new Entity(
        {
          model: {
            entity: "url",
            version: "1",
            service: "app",
          },
          attributes: {
            url: {
              type: "string",
              required: true,
            },
            citation: {
              type: "string",
              required: true,
            },
            description: {
              type: "string",
              required: false,
            },
            createdAt: {
              type: "number",
              default: () => 123,
              // cannot be modified after created
              readOnly: true,
            },
            updatedAt: {
              type: "number",
              // watch for changes to any attribute
              watch: "*",
              // set current timestamp when updated
              set: () => 456,
              readOnly: true,
            },
          },
          indexes: {
            urls: {
              pk: {
                field: "pk",
                composite: ["url"],
              },
            },
            byUpdated: {
              index: "gsi1pk-gsi1sk-index",
              pk: {
                // map to your GSI Hash/Partition key
                field: "gsi1pk",
                composite: [],
              },
              sk: {
                // map to your GSI Range/Sort key
                field: "gsi1sk",
                composite: ["updatedAt"],
              },
            },
          },
        },
        { table },
      );

      const createParams = UrlEntity.create({
        url: "https://www.test.com",
        citation: "test",
      }).params();

      expect(createParams).to.deep.equal({
        Item: {
          url: "https://www.test.com",
          citation: "test",
          createdAt: 123,
          updatedAt: 456,
          pk: "$app$url_1#url_https://www.test.com",
          gsi1pk: "$app",
          gsi1sk: "$url_1#updatedat_456",
          __edb_e__: "url",
          __edb_v__: "1",
        },
        TableName: "electro",
        ConditionExpression: "attribute_not_exists(#pk)",
        ExpressionAttributeNames: {
          "#pk": "pk",
        },
      });

      const queryParams = UrlEntity.query.byUpdated({}).params();

      expect(queryParams).to.deep.equal({
        KeyConditionExpression: "#pk = :pk and begins_with(#sk1, :sk1)",
        TableName: "electro",
        ExpressionAttributeNames: {
          "#pk": "gsi1pk",
          "#sk1": "gsi1sk",
        },
        ExpressionAttributeValues: {
          ":pk": "$app",
          ":sk1": "$url_1#updatedat_",
        },
        IndexName: "gsi1pk-gsi1sk-index",
      });
    });
  });
});
