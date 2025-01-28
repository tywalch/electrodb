process.env.AWS_NODEJS_CONNECTION_REUSE_ENABLED = "1";
import { CustomAttributeType, Entity, Attribute, Service } from "../index";
import { createNumberEntity } from "./mocks.test";
import { expect } from "chai";
import { v4 as uuid } from "uuid";
import moment from "moment";
import DynamoDB from "aws-sdk/clients/dynamodb";

const client = new DynamoDB.DocumentClient({
  region: "us-east-1",
  endpoint: process.env.LOCAL_DYNAMO_ENDPOINT,
});

function print(label: string, val: any): void;
function print(val: any): void;
function print(maybeLabel: any, val = maybeLabel) {
  if (typeof maybeLabel === "string") {
    console.log(maybeLabel, JSON.stringify(val, null, 4));
  } else {
    console.log(JSON.stringify(val, null, 4));
  }
}

const table = "electro";

const users = new Entity(
  {
    model: {
      entity: "user",
      service: "versioncontrol",
      version: "1",
    },
    attributes: {
      username: {
        type: "string",
      },
      fullName: {
        type: "string",
      },
      photo: {
        type: "string",
      },
      bio: {
        type: "string",
      },
      location: {
        type: "string",
      },
      pinned: {
        type: "any",
      },
    },
    indexes: {
      user: {
        collection: "overview",
        pk: {
          composite: ["username"],
          field: "pk",
        },
        sk: {
          composite: [],
          field: "sk",
        },
      },
      _: {
        collection: "owned",
        index: "gsi1pk-gsi1sk-index",
        pk: {
          composite: ["username"],
          field: "gsi1pk",
        },
        sk: {
          field: "gsi1sk",
          composite: [],
        },
      },
      geographics: {
        index: "gsi2pk-gsi2sk-index",
        pk: {
          composite: ["location"],
          field: "gsi2pk",
        },
        sk: {
          composite: [],
          field: "gsi2sk",
        },
      },
    },
  },
  { table, client },
);

const licenses = [
  "afl-3.0",
  "apache-2.0",
  "artistic-2.0",
  "bsl-1.0",
  "bsd-2-clause",
  "bsd-3-clause",
  "bsd-3-clause-clear",
  "cc",
  "cc0-1.0",
  "cc-by-4.0",
  "cc-by-sa-4.0",
  "wtfpl",
  "ecl-2.0",
  "epl-1.0",
  "epl-2.0",
  "eupl-1.1",
  "agpl-3.0",
  "gpl",
  "gpl-2.0",
  "gpl-3.0",
  "lgpl",
  "lgpl-2.1",
  "lgpl-3.0",
  "isc",
  "lppl-1.3c",
  "ms-pl",
  "mit",
  "mpl-2.0",
  "osl-3.0",
  "postgresql",
  "ofl-1.1",
  "ncsa",
  "unlicense",
  "zlib",
] as const;

const repositories = new Entity(
  {
    model: {
      entity: "repositories",
      service: "versioncontrol",
      version: "1",
    },
    attributes: {
      repoName: {
        type: "string",
      },
      repoOwner: {
        type: "string",
      },
      about: {
        type: "string",
      },
      username: {
        type: "string",
        readOnly: true,
        watch: ["repoOwner"],
        set: (_, { repoOwner }) => repoOwner,
      },
      description: {
        type: "string",
      },
      isPrivate: {
        type: "boolean",
      },
      license: {
        type: licenses,
      },
      defaultBranch: {
        type: "string",
        default: "main",
      },
      stars: {
        type: "number",
        default: 0,
      },
      createdAt: {
        type: "string",
        default: () => moment.utc().format(),
        readOnly: true,
      },
      recentCommits: {
        type: "list",
        items: {
          type: "map",
          properties: {
            sha: {
              type: "string",
            },
            data: {
              type: "string",
            },
            message: {
              type: "string",
            },
            views: {
              type: "number",
            },
            timestamp: {
              type: "number",
            },
          },
        },
      },
      custom: {
        type: "any",
      },
      views: {
        type: "number",
      },
      tags: {
        type: "set",
        items: "string",
      },
      followers: {
        type: "set",
        items: "string",
      },
      files: {
        type: "list",
        items: {
          type: "string",
        },
      },
    },
    indexes: {
      repositories: {
        collection: "alerts",
        pk: {
          composite: ["repoOwner"],
          field: "pk",
        },
        sk: {
          composite: ["repoName"],
          field: "sk",
        },
      },
      created: {
        collection: "owned",
        index: "gsi1pk-gsi1sk-index",
        pk: {
          composite: ["username"],
          field: "gsi1pk",
        },
        sk: {
          composite: ["isPrivate", "createdAt"],
          field: "gsi1sk",
        },
      },
    },
  },
  { table, client },
);

const StoreLocations = new Entity(
  {
    model: {
      service: "MallStoreDirectory",
      entity: "MallStore",
      version: "1",
    },
    attributes: {
      cityId: {
        type: "string",
        required: true,
      },
      mallId: {
        type: "string",
        required: true,
      },
      storeId: {
        type: "string",
        required: true,
      },
      buildingId: {
        type: "string",
        required: true,
      },
      unitId: {
        type: "string",
        required: true,
      },
      category: {
        type: [
          "spite store",
          "food/coffee",
          "food/meal",
          "clothing",
          "electronics",
          "department",
          "misc",
        ],
        required: true,
      },
      leaseEndDate: {
        type: "string",
        required: true,
      },
      rent: {
        type: "number",
        required: true,
      },
      discount: {
        type: "number",
        required: false,
        default: 0,
      },
      tenant: {
        type: "set",
        items: "string",
      },
      deposit: {
        type: "number",
      },
      rentalAgreement: {
        type: "list",
        items: {
          type: "map",
          properties: {
            type: {
              type: "string",
              required: true,
            },
            detail: {
              type: "string",
              required: true,
            },
          },
        },
      },
      tags: {
        type: "set",
        items: "string",
      },
      contact: {
        type: "set",
        items: "string",
      },
      leaseHolders: {
        type: "set",
        items: "string",
      },
      petFee: {
        type: "number",
      },
      totalFees: {
        type: "number",
      },
      listAttribute: {
        type: "list",
        items: {
          type: "map",
          properties: {
            setAttribute: {
              type: "set",
              items: "string",
            },
          },
        },
      },
      mapAttribute: {
        type: "map",
        properties: {
          mapProperty: {
            type: "string",
          },
        },
      },
    },
    indexes: {
      stores: {
        pk: {
          field: "pk",
          composite: ["cityId", "mallId"],
        },
        sk: {
          field: "sk",
          composite: ["buildingId", "storeId"],
        },
      },
      units: {
        index: "gis1pk-gsi1sk-index",
        pk: {
          field: "gis1pk",
          composite: ["mallId"],
        },
        sk: {
          field: "gsi1sk",
          composite: ["buildingId", "unitId"],
        },
      },
      leases: {
        index: "gis2pk-gsi2sk-index",
        pk: {
          field: "gis2pk",
          composite: ["storeId"],
        },
        sk: {
          field: "gsi2sk",
          composite: ["leaseEndDate"],
        },
      },
    },
  },
  { table, client },
);

describe("Update Item", () => {
  describe("updating deeply nested attributes", () => {
    it("should apply nested defaults on creation", () => {
      const customers = new Entity(
        {
          model: {
            entity: "customer",
            service: "company",
            version: "1",
          },
          attributes: {
            id: { type: "string" },
            email: { type: "string" },
            name: {
              type: "map",
              properties: {
                legal: {
                  type: "map",
                  properties: {
                    first: { type: "string" },
                    middle: { type: "string" },
                  },
                },
              },
            },
            name2: {
              type: "map",
              properties: {
                legal: {
                  type: "map",
                  properties: {
                    first: { type: "string" },
                    middle: { type: "string", default: "jorge" },
                  },
                },
              },
            },
            name3: {
              type: "map",
              properties: {
                legal: {
                  type: "map",
                  properties: {
                    first: { type: "string" },
                    middle: { type: "string", default: "jorge" },
                  },
                  default: {},
                },
              },
            },
            name4: {
              type: "map",
              properties: {
                legal: {
                  type: "map",
                  properties: {
                    first: { type: "string" },
                    middle: {
                      type: "string",
                      default: "jorge",
                      required: true,
                    },
                  },
                },
              },
            },
            name5: {
              type: "map",
              properties: {
                legal: {
                  type: "map",
                  properties: {
                    first: { type: "string" },
                    middle: {
                      type: "string",
                      default: "jorge",
                      required: true,
                    },
                  },
                },
              },
            },
            name6: {
              type: "map",
              properties: {
                legal: {
                  type: "map",
                  properties: {
                    first: { type: "string" },
                    middle: {
                      type: "string",
                      default: "jorge",
                      required: true,
                    },
                  },
                  default: {},
                },
              },
            },
            name7: {
              type: "map",
              properties: {
                legal: {
                  type: "map",
                  properties: {
                    first: { type: "string" },
                    middle: {
                      type: "string",
                      default: "jorge",
                      required: true,
                    },
                  },
                  default: {},
                },
              },
              required: true,
              default: () => ({}),
            },
            name8: {
              type: "map",
              properties: {
                legal: {
                  type: "map",
                  properties: {
                    first: { type: "string" },
                    middle: { type: "string", required: true },
                  },
                  default: {},
                },
              },
            },
          },
          indexes: {
            primary: {
              pk: {
                field: "pk",
                composite: ["id"],
              },
              sk: {
                field: "sk",
                composite: [],
              },
            },
          },
        },
        { table },
      );

      const p1 = customers
        .create({
          id: "test",
          email: "user@example.com",
          name: {
            // should save as is
            legal: {},
          },
          name2: {}, // should save as is
          name3: {}, // should walk up defaults
          name4: {}, // should stop when defaults stop
          name5: { legal: {} }, // should be fine with nested required flag on 'middle' because 'middle' has default
          name6: {}, // no typing issue with default missing because it
          // name:7  does not need to be included despite being 'required', will be set by defaults
        })
        .params();

      expect(p1).to.deep.equal({
        Item: {
          id: "test",
          email: "user@example.com",
          name: {
            legal: {},
          },
          name2: {},
          name3: {
            legal: {
              middle: "jorge",
            },
          },
          name4: {},
          name5: {
            legal: {
              middle: "jorge",
            },
          },
          name6: {
            legal: {
              middle: "jorge",
            },
          },
          name7: {
            legal: {
              middle: "jorge",
            },
          },
          // "name8": {}, // should not exist
          pk: "$company#id_test",
          sk: "$customer_1",
          __edb_e__: "customer",
          __edb_v__: "1",
        },
        TableName: "electro",
        ConditionExpression:
          "attribute_not_exists(#pk) AND attribute_not_exists(#sk)",
        ExpressionAttributeNames: {
          "#pk": "pk",
          "#sk": "sk",
        },
      });

      expect(() =>
        customers
          .create({
            id: "test",
            email: "user@example.com",
            name8: {}, // unfortunate combination, user defined illogical defaults that resulted in non-typed validation error
          })
          .params(),
      ).to.throw(
        'Invalid value type at entity path: "name8.legal.middle". Value is required. - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#invalid-attribute',
      );
    });

    it("should not clobber a deeply nested attribute when updating", async () => {
      const customers = new Entity(
        {
          model: {
            entity: "customer",
            service: "company",
            version: "1",
          },
          attributes: {
            id: { type: "string" },
            email: { type: "string" },
            name: {
              type: "map",
              properties: {
                legal: {
                  type: "map",
                  properties: {
                    first: { type: "string" },
                    middle: { type: "string" },
                    last: { type: "string" },
                  },
                },
              },
            },
          },
          indexes: {
            primary: {
              pk: {
                field: "pk",
                composite: ["id"],
              },
              sk: {
                field: "sk",
                composite: [],
              },
            },
          },
        },
        { table, client },
      );

      const id1 = uuid();
      const id2 = uuid();
      const email = "user@example.com";

      await customers.create({ id: id1, email }).go();
      await customers.create({ id: id2, email, name: { legal: {} } }).go();

      const retrieved1 = await customers
        .get({ id: id1 })
        .go()
        .then((res) => res.data);
      const retrieved2 = await customers
        .get({ id: id2 })
        .go()
        .then((res) => res.data);

      expect(retrieved1).to.deep.equal({
        email,
        id: id1,
        // name: {} should not exist (wasn't put)
      });

      expect(retrieved2).to.deep.equal({
        email,
        id: id2,
        name: {
          legal: {},
        },
      });

      const updated1 = await customers
        .patch({ id: id1 })
        .data((attr, op) => {
          op.set(attr.name.legal.first, "joe");
          op.set(attr.name.legal.last, "exotic");
        })
        .go({ response: "all_new" })
        .then((res) => res.data)
        .then((data) => ({ success: true, result: data }))
        .catch((err) => ({ success: false, result: err }));

      expect(updated1.success).to.be.false;
      expect(updated1.result.message).to.equal(
        'Error thrown by DynamoDB client: "The document path provided in the update expression is invalid for update" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#aws-error',
      );

      const updated2 = await customers
        .patch({ id: id2 })
        .data((attr, op) => {
          op.set(attr.name.legal.first, "joe");
          op.set(attr.name.legal.last, "exotic");
        })
        .go({ response: "all_new" })
        .then((res) => res.data);

      expect(updated2).to.deep.equal({
        id: id2,
        email,
        name: {
          legal: {
            first: "joe",
            last: "exotic",
          },
        },
      });
    });

    it("should allow non-existent lists to be appended to with upsert", async () => {
      const StoreLocations = new Entity(
        {
          model: {
            service: "MallStoreDirectory",
            entity: "MallStore",
            version: "1",
          },
          attributes: {
            cityId: {
              type: "string",
              required: true,
            },
            mallId: {
              type: "string",
              required: true,
            },
            storeId: {
              type: "string",
              required: true,
            },
            buildingId: {
              type: "string",
              required: true,
            },
            unitId: {
              type: "string",
              required: true,
            },
            category: {
              type: [
                "spite store",
                "food/coffee",
                "food/meal",
                "clothing",
                "electronics",
                "department",
                "misc",
              ],
              required: true,
            },
            leaseEndDate: {
              type: "string",
              required: true,
            },
            rent: {
              type: "string",
              required: true,
              validate: /^(\d+\.\d{2})$/,
            },
            discount: {
              type: "string",
              required: false,
              default: "0.00",
              validate: /^(\d+\.\d{2})$/,
            },
            tenants: {
              type: "set",
              items: "string",
            },
            warnings: {
              type: "number",
              default: 0,
            },
            deposit: {
              type: "number",
            },
            contact: {
              type: "set",
              items: "string",
            },
            rentalAgreement: {
              type: "list",
              items: {
                type: "map",
                properties: {
                  type: {
                    type: "string",
                  },
                  detail: {
                    type: "string",
                  },
                },
              },
            },
            petFee: {
              type: "number",
            },
            fees: {
              type: "number",
            },
            tags: {
              type: "set",
              items: "string",
            },
          },
          indexes: {
            stores: {
              pk: {
                field: "pk",
                composite: ["cityId", "mallId"],
              },
              sk: {
                field: "sk",
                composite: ["buildingId", "storeId"],
              },
            },
            units: {
              index: "gsi1pk-gsi1sk-index",
              pk: {
                field: "gsi1pk",
                composite: ["mallId"],
              },
              sk: {
                field: "gsi1sk",
                composite: ["buildingId", "unitId"],
              },
            },
            leases: {
              index: "gsi2pk-gsi2sk-index",
              pk: {
                field: "gsi2pk",
                composite: ["storeId"],
              },
              sk: {
                field: "gsi2sk",
                composite: ["leaseEndDate"],
              },
            },
          },
        },
        { table, client },
      );

      const cityId = uuid();
      const storeId = "LatteLarrys";
      const mallId = "EastPointe";
      const buildingId = "BuildingA1";
      const unitId = "B47";
      const category = "food/coffee";
      const leaseEndDate = "2020-03-22";
      const rent = "4500.00";
      const deposit = 100;
      const tenants = ["Larry David"];
      const warnings = 0;
      const petFee = 250;
      const rentalAgreement = [
        {
          type: "amendment",
          detail: "Larry David accepts coffee liability",
        },
      ];

      const { data } = await StoreLocations.upsert({
        cityId,
        storeId,
        mallId,
        buildingId,
        unitId,
        category,
        leaseEndDate,
        rent,
      })
        .add({ deposit, tenants })
        .ifNotExists({ warnings })
        .subtract({ petFee })
        .append({ rentalAgreement })
        .go({ response: "all_new" });

      expect(data).to.deep.equal({
        cityId,
        storeId,
        mallId,
        buildingId,
        unitId,
        category,
        leaseEndDate,
        rent,
        deposit,
        tenants,
        warnings,
        rentalAgreement,
        discount: "0.00",
        petFee: 0 - petFee,
      });
    });

    it("should allow non-existent lists to be appended to with transact upsert", async () => {
      const StoreLocations = new Entity(
        {
          model: {
            service: "MallStoreDirectory",
            entity: "MallStore",
            version: "1",
          },
          attributes: {
            cityId: {
              type: "string",
              required: true,
            },
            mallId: {
              type: "string",
              required: true,
            },
            storeId: {
              type: "string",
              required: true,
            },
            buildingId: {
              type: "string",
              required: true,
            },
            unitId: {
              type: "string",
              required: true,
            },
            category: {
              type: [
                "spite store",
                "food/coffee",
                "food/meal",
                "clothing",
                "electronics",
                "department",
                "misc",
              ],
              required: true,
            },
            leaseEndDate: {
              type: "string",
              required: true,
            },
            rent: {
              type: "string",
              required: true,
              validate: /^(\d+\.\d{2})$/,
            },
            discount: {
              type: "string",
              required: false,
              default: "0.00",
              validate: /^(\d+\.\d{2})$/,
            },
            tenants: {
              type: "set",
              items: "string",
            },
            warnings: {
              type: "number",
              default: 0,
            },
            deposit: {
              type: "number",
            },
            contact: {
              type: "set",
              items: "string",
            },
            rentalAgreement: {
              type: "list",
              items: {
                type: "map",
                properties: {
                  type: {
                    type: "string",
                  },
                  detail: {
                    type: "string",
                  },
                },
              },
            },
            petFee: {
              type: "number",
            },
            fees: {
              type: "number",
            },
            tags: {
              type: "set",
              items: "string",
            },
          },
          indexes: {
            stores: {
              pk: {
                field: "pk",
                composite: ["cityId", "mallId"],
              },
              sk: {
                field: "sk",
                composite: ["buildingId", "storeId"],
              },
            },
            units: {
              index: "gsi1pk-gsi1sk-index",
              pk: {
                field: "gsi1pk",
                composite: ["mallId"],
              },
              sk: {
                field: "gsi1sk",
                composite: ["buildingId", "unitId"],
              },
            },
            leases: {
              index: "gsi2pk-gsi2sk-index",
              pk: {
                field: "gsi2pk",
                composite: ["storeId"],
              },
              sk: {
                field: "gsi2sk",
                composite: ["leaseEndDate"],
              },
            },
          },
        },
        { table, client },
      );

      const service = new Service({StoreLocations});

      const cityId = uuid();
      const storeId = "LatteLarrys";
      const mallId = "EastPointe";
      const buildingId = "BuildingA1";
      const unitId = "B47";
      const category = "food/coffee";
      const leaseEndDate = "2020-03-22";
      const rent = "4500.00";
      const deposit = 100;
      const tenants = ["Larry David"];
      const warnings = 0;
      const petFee = 250;
      const rentalAgreement = [
        {
          type: "amendment",
          detail: "Larry David accepts coffee liability",
        },
      ];

      const { canceled } = await service.transaction.write(({StoreLocations}) => [
        StoreLocations.upsert({
            cityId,
            storeId,
            mallId,
            buildingId,
            unitId,
            category,
            leaseEndDate,
            rent,
          })
          .add({ deposit, tenants })
          .ifNotExists({ warnings })
          .subtract({ petFee })
          .append({ rentalAgreement }).commit({ response: "all_old" })
      ]).go();

      expect(canceled).to.be.false;
      const { data } = await StoreLocations.get({ cityId, storeId, buildingId, mallId }).go();

      expect(data).to.deep.equal({
        cityId,
        storeId,
        mallId,
        buildingId,
        unitId,
        category,
        leaseEndDate,
        rent,
        deposit,
        tenants,
        warnings,
        rentalAgreement,
        discount: "0.00",
        petFee: 0 - petFee,
      });
    });

    it("should allow non-existent numbers to be added", async () => {
      const { entity } = createNumberEntity({ client, table });
      const name = uuid();
      const type = uuid();
      await entity.create({ name, type }).go();
      const num = 2;
      const before = await entity
        .patch({ name, type })
        .data(({ prop }, { add }) => {
          add(prop, num);
        })
        .go({ response: "all_old" });
      const after = await entity.get({ name, type }).go();
      expect(before.data.prop).to.be.undefined;
      expect(after.data?.prop).to.equal(num);
    });

    it("should allow non-existent numbers to be subtracted", async () => {
      const { entity } = createNumberEntity({ client, table });
      const name = uuid();
      const type = uuid();
      await entity.create({ name, type }).go();
      const num = 2;
      const before = await entity
        .patch({ name, type })
        .data(({ prop }, { subtract }) => {
          subtract(prop, num);
        })
        .go({ response: "all_old" });
      const after = await entity.get({ name, type }).go();
      expect(before.data.prop).to.be.undefined;
      expect(after.data?.prop).to.equal(0 - num);
    });

    it("should allow default numbers to be provided to subtract", async () => {
      const { entity } = createNumberEntity({ client, table });
      const name = uuid();
      const type = uuid();
      await entity.create({ name, type }).go();
      const num = 2;
      const before = await entity
        .patch({ name, type })
        .data(({ prop }, { subtract }) => {
          subtract(prop, num, 5);
        })
        .go({ response: "all_old" });
      const after = await entity.get({ name, type }).go();
      expect(before.data.prop).to.be.undefined;
      expect(after.data?.prop).to.equal(5 - num);
    });

    it("should allow default numbers to be provided to add", async () => {
      const { entity } = createNumberEntity({ client, table });
      const name = uuid();
      const type = uuid();
      await entity.create({ name, type }).go();
      const num = 2;
      const before = await entity
        .patch({ name, type })
        .data(({ prop }, { add }) => {
          add(prop, num, 5);
        })
        .go({ response: "all_old" });
      const after = await entity.get({ name, type }).go();
      expect(before.data.prop).to.be.undefined;
      expect(after.data?.prop).to.equal(5 + num);
    });

    describe("undefined values when using data method", () => {
      const createEntityWithAttributeType = (attrType: Attribute["type"]) => {
        return new Entity(
          {
            model: {
              entity: "tasks",
              version: "1",
              service: "taskapp",
            },
            attributes: {
              id: {
                type: "string",
                required: true,
              },
              prop:
                attrType === "map"
                  ? { type: "map", properties: { val: { type: "string" } } }
                  : attrType === "list"
                  ? { type: "list", items: { type: "string" } }
                  : attrType === "set"
                  ? { type: "set", items: "string" }
                  : { type: "string" },
            },
            indexes: {
              projects: {
                pk: {
                  field: "pk",
                  composite: ["id"],
                },
                sk: {
                  field: "sk",
                  // create composite keys for partial sort key queries
                  composite: [],
                },
              },
            },
          },
          { table, client },
        );
      };

      const types: ReadonlyArray<Attribute["type"]> = [
        "map",
        "list",
        "set",
        "string",
      ];
      const operations = ["set", "add", "subtract"] as const;

      for (const type of types) {
        it(`should not apply "set" operation when passed an undefined value for a "${type}" attribute`, async () => {
          const entity = createEntityWithAttributeType(type);
          const performUpdate = async (val: any) => {
            let params: any;
            const id = uuid();
            const results = await entity
              .update({ id })
              .data((attr, op) => {
                op.set(attr.prop, val);
              })
              .go({
                response: "all_new",
                logger: (event) => {
                  if (event.type === "query") {
                    params = event.params;
                  }
                },
              });

            return {
              id,
              params,
              data: results.data,
            };
          };

          const { data, params, id } = await performUpdate(undefined);
          expect(params).to.deep.equal({
            UpdateExpression:
              "SET #id = :id_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0",
            ExpressionAttributeNames: {
              "#id": "id",
              "#__edb_e__": "__edb_e__",
              "#__edb_v__": "__edb_v__",
            },
            ExpressionAttributeValues: {
              ":id_u0": id,
              ":__edb_e___u0": "tasks",
              ":__edb_v___u0": "1",
            },
            TableName: "electro",
            Key: {
              pk: `$taskapp#id_${id}`,
              sk: "$tasks_1",
            },
            ReturnValues: "ALL_NEW",
          });
          expect(data).to.deep.equal({ id });
        });
      }
    });

    describe("Set attributes and empty sets", () => {
      const tasks = new Entity(
        {
          model: {
            entity: "tasks",
            version: "1",
            service: "taskapp",
          },
          attributes: {
            id: {
              type: "string",
              required: true,
            },
            str: {
              type: "string",
            },
            set: {
              type: "set",
              items: "string",
            },
            map: {
              type: "map",
              properties: {
                set: {
                  type: "set",
                  items: "string",
                },
                map: {
                  type: "map",
                  properties: {
                    set: {
                      type: "set",
                      items: "string",
                    },
                  },
                },
              },
            },
          },
          indexes: {
            projects: {
              pk: {
                field: "pk",
                composite: ["id"],
              },
              sk: {
                field: "sk",
                // create composite keys for partial sort key queries
                composite: [],
              },
            },
          },
        },
        { table, client },
      );
      it("should not try perform a set operation an empty Set attribute", async () => {
        const id = uuid();
        let params1: any;
        await tasks.create({ id, map: { map: {} } }).go();
        await tasks
          .update({ id })
          .data((attr, op) => {
            op.set(attr.set, []);
            op.set(attr.map.set, []);
            op.set(attr.map.map.set, []);
          })
          .go({
            logger: (event) => {
              if (event.type === "query") {
                params1 = event.params;
              }
            },
          });

        expect(params1).to.deep.equal({
          UpdateExpression:
            "SET #id = :id_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0",
          ExpressionAttributeNames: {
            "#id": "id",
            "#__edb_e__": "__edb_e__",
            "#__edb_v__": "__edb_v__",
          },
          ExpressionAttributeValues: {
            ":id_u0": id,
            ":__edb_e___u0": "tasks",
            ":__edb_v___u0": "1",
          },
          TableName: "electro",
          Key: {
            pk: `$taskapp#id_${id}`,
            sk: "$tasks_1",
          },
        });

        // should perform set just fine
        const id2 = uuid();
        let params2: any;
        await tasks.create({ id: id2, map: { map: {} } }).go();
        await tasks
          .update({ id: id2 })
          .data((attr, op) => {
            op.set(attr.set, ["set1"]);
            op.set(attr.map.set, ["set2"]);
            op.set(attr.map.map.set, ["set3"]);
          })
          .go({
            logger: (event) => {
              if (event.type === "query") {
                params2 = event.params;
              }
            },
          });
        expect(params2.UpdateExpression).to.equal(
          "SET #set = :set_u0, #map.#set = :set_u1, #map.#map.#set = :set_u2, #id = :id_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0",
        );
        expect(
          params2.ExpressionAttributeValues[":set_u0"].values,
        ).to.deep.equal(["set1"]);
        expect(
          params2.ExpressionAttributeValues[":set_u1"].values,
        ).to.deep.equal(["set2"]);
        expect(
          params2.ExpressionAttributeValues[":set_u2"].values,
        ).to.deep.equal(["set3"]);
      });

      it("should not try perform an add operation an empty Set attribute", async () => {
        const id = uuid();
        let params1: any;
        await tasks.create({ id, map: { map: {} } }).go();
        await tasks
          .update({ id })
          .data((attr, op) => {
            op.add(attr.set, []);
            op.add(attr.map.set, []);
            op.add(attr.map.map.set, []);
          })
          .go({
            logger: (event) => {
              if (event.type === "query") {
                params1 = event.params;
              }
            },
          });

        expect(params1).to.deep.equal({
          UpdateExpression:
            "SET #id = :id_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0",
          ExpressionAttributeNames: {
            "#id": "id",
            "#__edb_e__": "__edb_e__",
            "#__edb_v__": "__edb_v__",
          },
          ExpressionAttributeValues: {
            ":id_u0": id,
            ":__edb_e___u0": "tasks",
            ":__edb_v___u0": "1",
          },
          TableName: "electro",
          Key: {
            pk: `$taskapp#id_${id}`,
            sk: "$tasks_1",
          },
        });

        // should perform add just fine
        const id2 = uuid();
        let params2: any;
        await tasks.create({ id: id2, map: { map: {} } }).go();
        await tasks
          .update({ id: id2 })
          .data((attr, op) => {
            op.add(attr.set, ["set1"]);
            op.add(attr.map.set, ["set2"]);
            op.add(attr.map.map.set, ["set3"]);
          })
          .go({
            logger: (event) => {
              if (event.type === "query") {
                params2 = event.params;
              }
            },
          });
        expect(params2.UpdateExpression).to.equal(
          "SET #id = :id_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0 ADD #set :set_u0, #map.#set :set_u1, #map.#map.#set :set_u2",
        );
        expect(
          params2.ExpressionAttributeValues[":set_u0"].values,
        ).to.deep.equal(["set1"]);
        expect(
          params2.ExpressionAttributeValues[":set_u1"].values,
        ).to.deep.equal(["set2"]);
        expect(
          params2.ExpressionAttributeValues[":set_u2"].values,
        ).to.deep.equal(["set3"]);
      });
    });

    describe("Map Attributes and empty objects", () => {
      it("should return an empty object with a Map Attribute when one is set via a static default", async () => {
        const entityWithDefault = new Entity(
          {
            model: {
              entity: "emptyObjects",
              service: "mapAttributeTests",
              version: "1",
            },
            attributes: {
              prop1: {
                type: "string",
              },
              prop2: {
                type: "map",
                properties: {
                  prop3: {
                    type: "string",
                  },
                },
                default: {},
              },
            },
            indexes: {
              record: {
                pk: {
                  field: "pk",
                  composite: ["prop1"],
                },
                sk: {
                  field: "sk",
                  composite: [],
                },
              },
            },
          },
          { table, client },
        );
        const prop1 = uuid();

        const created = await entityWithDefault.put({ prop1 }).go();
        const item = await entityWithDefault.get({ prop1 }).go();
        const expected = {
          prop1,
          prop2: {},
        };
        expect(created.data).to.deep.equal(expected);
        expect(item.data).to.deep.equal(expected);
      });

      it("should return an empty object with a Map Attribute when one is set via a default function", async () => {
        const entityWithDefault = new Entity(
          {
            model: {
              entity: "emptyObjects",
              service: "mapAttributeTests",
              version: "1",
            },
            attributes: {
              prop1: {
                type: "string",
              },
              prop2: {
                type: "map",
                properties: {
                  prop3: {
                    type: "string",
                  },
                },
                default: () => {
                  return {};
                },
              },
            },
            indexes: {
              record: {
                pk: {
                  field: "pk",
                  composite: ["prop1"],
                },
                sk: {
                  field: "sk",
                  composite: [],
                },
              },
            },
          },
          { table, client },
        );
        const prop1 = uuid();
        const created = await entityWithDefault.put({ prop1 }).go();
        const item = await entityWithDefault.get({ prop1 }).go();
        const expected = {
          prop1,
          prop2: {},
        };
        expect(created.data).to.deep.equal(expected);
        expect(item.data).to.deep.equal(expected);
      });

      it("should return an empty object with a Map Attribute when one is set via the setter", async () => {
        const entityWithObjSetter = new Entity(
          {
            model: {
              entity: "emptyObjects",
              service: "mapAttributeTests",
              version: "1",
            },
            attributes: {
              prop1: {
                type: "string",
              },
              prop2: {
                type: "map",
                properties: {
                  prop3: {
                    type: "string",
                  },
                },
                set: () => {
                  return {};
                },
              },
            },
            indexes: {
              record: {
                pk: {
                  field: "pk",
                  composite: ["prop1"],
                },
                sk: {
                  field: "sk",
                  composite: [],
                },
              },
            },
          },
          { table, client },
        );
        const prop1 = uuid();
        const created = await entityWithObjSetter.put({ prop1 }).go();
        const item = await entityWithObjSetter.get({ prop1 }).go();
        const expected = {
          prop1,
          prop2: {},
        };
        expect(created.data).to.deep.equal(expected);
        expect(item.data).to.deep.equal(expected);
      });

      it("should return an empty object with a Map Attribute when one is put on the item directly", async () => {
        const entityWithoutDefaultOrSetter = new Entity(
          {
            model: {
              entity: "emptyObject",
              service: "mapAttributeTests",
              version: "1",
            },
            attributes: {
              prop1: {
                type: "string",
              },
              prop2: {
                type: "map",
                properties: {
                  prop3: {
                    type: "string",
                  },
                },
              },
            },
            indexes: {
              record: {
                pk: {
                  field: "pk",
                  composite: ["prop1"],
                },
                sk: {
                  field: "sk",
                  composite: [],
                },
              },
            },
          },
          { table, client },
        );
        const prop1 = uuid();
        const prop2 = {};
        const created = await entityWithoutDefaultOrSetter
          .put({ prop1, prop2 })
          .go();
        const item = await entityWithoutDefaultOrSetter.get({ prop1 }).go();
        const expected = {
          prop1,
          prop2,
        };
        expect(created.data).to.deep.equal(expected);
        expect(item.data).to.deep.equal(expected);
      });

      it("should not return an empty object with a Map Attribute when one is not put on the item directly", async () => {
        const entityWithoutDefaultOrSetter = new Entity(
          {
            model: {
              entity: "emptyObjects",
              service: "mapAttributeTests",
              version: "1",
            },
            attributes: {
              prop1: {
                type: "string",
              },
              prop2: {
                type: "map",
                properties: {
                  prop3: {
                    type: "string",
                  },
                },
              },
            },
            indexes: {
              record: {
                pk: {
                  field: "pk",
                  composite: ["prop1"],
                },
                sk: {
                  field: "sk",
                  composite: [],
                },
              },
            },
          },
          { table, client },
        );
        const prop1 = uuid();
        const created = await entityWithoutDefaultOrSetter.put({ prop1 }).go();
        const item = await entityWithoutDefaultOrSetter.get({ prop1 }).go();
        const expected = {
          prop1,
        };
        expect(created.data).to.deep.equal(expected);
        expect(item.data).to.deep.equal(expected);
      });

      it("should return an empty object with a Map Attribute when one is updated on the item directly", async () => {
        const entityWithoutDefaultOrSetter = new Entity(
          {
            model: {
              entity: "emptyObjects",
              service: "mapAttributeTests",
              version: "1",
            },
            attributes: {
              prop1: {
                type: "string",
              },
              prop2: {
                type: "map",
                properties: {
                  prop3: {
                    type: "string",
                  },
                },
              },
            },
            indexes: {
              record: {
                pk: {
                  field: "pk",
                  composite: ["prop1"],
                },
                sk: {
                  field: "sk",
                  composite: [],
                },
              },
            },
          },
          { table, client },
        );
        const prop1 = uuid();
        const expected = {
          prop1,
          prop2: {},
        };
        const updated = await entityWithoutDefaultOrSetter
          .update({ prop1 })
          .data((attr, op) => {
            op.set(attr.prop2, {});
          })
          .go({ response: "all_new" });

        expect(updated.data).to.deep.equal(expected);
        const updatedItem = await entityWithoutDefaultOrSetter
          .get({ prop1 })
          .go();
        expect(updatedItem.data).to.deep.equal(expected);
      });
    });
  });
  describe("conditions and updates", () => {
    let cityId = uuid();
    const mallId = "EastPointe";
    const storeId = "LatteLarrys";
    const buildingId = "A34";
    beforeEach(async () => {
      cityId = uuid();
      await StoreLocations.put({
        cityId,
        storeId,
        mallId,
        buildingId,
        unitId: "B47",
        category: "food/coffee",
        leaseEndDate: "2020-03-22",
        rent: 4500,
        tenant: ["tom"],
        deposit: 1000,
        rentalAgreement: [
          {
            type: "ammendment",
            detail: "dont wear puffy shirt",
          },
        ],
        tags: ["family_friendly"],
        contact: ["555-555-5555"],
        mapAttribute: {
          mapProperty: "before",
        },
        listAttribute: [
          {
            setAttribute: ["555-555-5555"],
          },
          {
            setAttribute: ["666-666-6666"],
          },
        ],
      }).go();
    });

    it("should conditionally update a map attribute", async () => {
      const composite = { cityId, mallId, storeId, buildingId };
      const results1 = await StoreLocations.get(composite)
        .go()
        .then((res) => res.data);

      await StoreLocations.update(composite)
        .data(({ mapAttribute }, { set }) =>
          set(mapAttribute.mapProperty, "after1"),
        )
        .where(({ mapAttribute }, { eq }) => {
          return results1?.mapAttribute?.mapProperty
            ? eq(mapAttribute.mapProperty, results1.mapAttribute.mapProperty)
            : "";
        })
        .go()
        .then((res) => res.data);

      const results2 = await StoreLocations.get(composite)
        .go()
        .then((res) => res.data);

      expect(results2).to.deep.equal({
        cityId,
        storeId,
        mallId,
        buildingId,
        unitId: "B47",
        category: "food/coffee",
        leaseEndDate: "2020-03-22",
        rent: 4500,
        tenant: ["tom"],
        deposit: 1000,
        rentalAgreement: [
          {
            type: "ammendment",
            detail: "dont wear puffy shirt",
          },
        ],
        tags: ["family_friendly"],
        contact: ["555-555-5555"],
        mapAttribute: {
          mapProperty: "after1",
        },
        listAttribute: [
          {
            setAttribute: ["555-555-5555"],
          },
          {
            setAttribute: ["666-666-6666"],
          },
        ],
        discount: 0,
      });

      let update = await StoreLocations.update(composite)
        .data(({ mapAttribute }, { set }) =>
          set(mapAttribute.mapProperty, "after1"),
        )
        .where(({ mapAttribute }, { eq }) => {
          return results1?.mapAttribute?.mapProperty
            ? eq(mapAttribute.mapProperty, results1.mapAttribute.mapProperty)
            : "";
        })
        .go()
        .then(() => {})
        .catch((err) => err);

      expect(update.message).to.equal(
        'Error thrown by DynamoDB client: "The conditional request failed" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#aws-error',
      );
    });

    it("should conditionally update a list attribute", async () => {
      const composite = { cityId, mallId, storeId, buildingId };
      const results1 = await StoreLocations.get(composite)
        .go()
        .then((res) => res.data);

      await StoreLocations.update(composite)
        .data(({ rentalAgreement }, { set }) =>
          set(rentalAgreement[0].detail, "no soup for you"),
        )
        .where(({ rentalAgreement }, { eq }) => {
          return results1?.rentalAgreement?.[0]?.detail
            ? eq(rentalAgreement[0].detail, results1.rentalAgreement[0].detail)
            : "";
        })
        .go()
        .then((res) => res.data);

      const results2 = await StoreLocations.get(composite)
        .go()
        .then((res) => res.data);

      expect(results2).to.deep.equal({
        cityId,
        storeId,
        mallId,
        buildingId,
        unitId: "B47",
        category: "food/coffee",
        leaseEndDate: "2020-03-22",
        rent: 4500,
        tenant: ["tom"],
        deposit: 1000,
        rentalAgreement: [
          {
            type: "ammendment",
            detail: "no soup for you",
          },
        ],
        tags: ["family_friendly"],
        contact: ["555-555-5555"],
        mapAttribute: {
          mapProperty: "before",
        },
        listAttribute: [
          {
            setAttribute: ["555-555-5555"],
          },
          {
            setAttribute: ["666-666-6666"],
          },
        ],
        discount: 0,
      });

      let update = await StoreLocations.update(composite)
        .data(({ rentalAgreement }, { set }) =>
          set(rentalAgreement[0].detail, "no soup for you"),
        )
        .where(({ rentalAgreement }, { eq }) => {
          return results1?.rentalAgreement?.[0]?.detail
            ? eq(rentalAgreement[0].detail, results1.rentalAgreement[0].detail)
            : "";
        })
        .go()
        .then(() => {})
        .catch((err) => err);

      expect(update.message).to.equal(
        'Error thrown by DynamoDB client: "The conditional request failed" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#aws-error',
      );
    });
  });

  describe("readme examples", () => {
    let cityId = uuid();
    const mallId = "EastPointe";
    const storeId = "LatteLarrys";
    const buildingId = "A34";
    beforeEach(async () => {
      cityId = uuid();
      await StoreLocations.put({
        cityId,
        storeId,
        mallId,
        buildingId,
        unitId: "B47",
        category: "food/coffee",
        leaseEndDate: "2020-03-22",
        rent: 4500,
        tenant: ["tom"],
        deposit: 1000,
        rentalAgreement: [
          {
            type: "ammendment",
            detail: "dont wear puffy shirt",
          },
        ],
        tags: ["family_friendly"],
        contact: ["555-555-5555"],
        mapAttribute: {
          mapProperty: "before",
        },
        listAttribute: [
          {
            setAttribute: ["555-555-5555"],
          },
          {
            setAttribute: ["666-666-6666"],
          },
        ],
      }).go();
    });

    it("should perform complex data type update example 1", async () => {
      await StoreLocations.update({ cityId, mallId, storeId, buildingId })
        // @ts-ignore
        .set({ "mapAttribute.mapProperty": "value1" })
        .go();

      let item1 = await StoreLocations.get({
        cityId,
        mallId,
        storeId,
        buildingId,
      })
        .go()
        .then((res) => res.data);

      expect(item1).to.deep.equal({
        cityId,
        mallId: "EastPointe",
        mapAttribute: {
          mapProperty: "value1",
        },
        rentalAgreement: [
          {
            type: "ammendment",
            detail: "dont wear puffy shirt",
          },
        ],
        discount: 0,
        rent: 4500,
        storeId: "LatteLarrys",
        buildingId: "A34",
        tags: ["family_friendly"],
        leaseEndDate: "2020-03-22",
        contact: ["555-555-5555"],
        deposit: 1000,
        unitId: "B47",
        category: "food/coffee",
        listAttribute: [
          {
            setAttribute: ["555-555-5555"],
          },
          {
            setAttribute: ["666-666-6666"],
          },
        ],
        tenant: ["tom"],
      });

      await StoreLocations.update({ cityId, mallId, storeId, buildingId })
        .data(({ mapAttribute }, { set }) =>
          set(mapAttribute.mapProperty, "value2"),
        )
        .go();

      let item2 = await StoreLocations.get({
        cityId,
        mallId,
        storeId,
        buildingId,
      })
        .go()
        .then((res) => res.data);

      expect(item2).to.deep.equal({
        cityId,
        mallId: "EastPointe",
        mapAttribute: {
          mapProperty: "value2",
        },
        rentalAgreement: [
          {
            type: "ammendment",
            detail: "dont wear puffy shirt",
          },
        ],
        discount: 0,
        rent: 4500,
        storeId: "LatteLarrys",
        buildingId: "A34",
        tags: ["family_friendly"],
        leaseEndDate: "2020-03-22",
        contact: ["555-555-5555"],
        deposit: 1000,
        unitId: "B47",
        category: "food/coffee",
        listAttribute: [
          {
            setAttribute: ["555-555-5555"],
          },
          {
            setAttribute: ["666-666-6666"],
          },
        ],
        tenant: ["tom"],
      });
    });

    it("should perform complex data type update example 2", async () => {
      await StoreLocations.update({ cityId, mallId, storeId, buildingId })
        // @ts-ignore
        .remove(["listAttribute[0]"])
        .go()
        .then((res) => res.data);

      let item1 = await StoreLocations.get({
        cityId,
        mallId,
        storeId,
        buildingId,
      })
        .go()
        .then((res) => res.data);

      expect(item1).to.deep.equal({
        cityId,
        mallId: "EastPointe",
        mapAttribute: {
          mapProperty: "before",
        },
        rentalAgreement: [
          {
            type: "ammendment",
            detail: "dont wear puffy shirt",
          },
        ],
        discount: 0,
        rent: 4500,
        storeId: "LatteLarrys",
        buildingId: "A34",
        tags: ["family_friendly"],
        leaseEndDate: "2020-03-22",
        contact: ["555-555-5555"],
        deposit: 1000,
        unitId: "B47",
        category: "food/coffee",
        listAttribute: [
          {
            setAttribute: ["666-666-6666"],
          },
        ],
        tenant: ["tom"],
      });

      await StoreLocations.update({ cityId, mallId, storeId, buildingId })
        .data(({ listAttribute }, { remove }) => remove(listAttribute[0]))
        .go();

      let item2 = await StoreLocations.get({
        cityId,
        mallId,
        storeId,
        buildingId,
      })
        .go()
        .then((res) => res.data);

      expect(item2).to.deep.equal({
        cityId,
        mallId: "EastPointe",
        mapAttribute: {
          mapProperty: "before",
        },
        rentalAgreement: [
          {
            type: "ammendment",
            detail: "dont wear puffy shirt",
          },
        ],
        discount: 0,
        rent: 4500,
        storeId: "LatteLarrys",
        buildingId: "A34",
        tags: ["family_friendly"],
        leaseEndDate: "2020-03-22",
        contact: ["555-555-5555"],
        deposit: 1000,
        unitId: "B47",
        category: "food/coffee",
        listAttribute: [],
        tenant: ["tom"],
      });
    });

    it("should perform complex data type update example 3", async () => {
      const newSetValue1 = ["setItemValue1"];
      const newSetValue2 = ["setItemValue2"];

      await StoreLocations.update({ cityId, mallId, storeId, buildingId })
        // @ts-ignore
        .add({ "listAttribute[1].setAttribute": newSetValue1 })
        .go()
        .then((res) => res.data);

      let item1 = await StoreLocations.get({
        cityId,
        mallId,
        storeId,
        buildingId,
      })
        .go()
        .then((res) => res.data);

      expect(item1).to.deep.equal({
        cityId,
        mallId: "EastPointe",
        mapAttribute: {
          mapProperty: "before",
        },
        rentalAgreement: [
          {
            type: "ammendment",
            detail: "dont wear puffy shirt",
          },
        ],
        discount: 0,
        rent: 4500,
        storeId: "LatteLarrys",
        buildingId: "A34",
        tags: ["family_friendly"],
        leaseEndDate: "2020-03-22",
        contact: ["555-555-5555"],
        deposit: 1000,
        unitId: "B47",
        category: "food/coffee",
        listAttribute: [
          {
            setAttribute: ["555-555-5555"],
          },
          {
            setAttribute: ["666-666-6666", "setItemValue1"],
          },
        ],
        tenant: ["tom"],
      });

      await StoreLocations.update({ cityId, mallId, storeId, buildingId })
        .data(({ listAttribute }, { add }) => {
          add(listAttribute[1].setAttribute, newSetValue2);
        })
        .go()
        .then((res) => res.data);

      let item2 = await StoreLocations.get({
        cityId,
        mallId,
        storeId,
        buildingId,
      })
        .go()
        .then((res) => res.data);

      expect(item2).to.deep.equal({
        cityId,
        mallId: "EastPointe",
        mapAttribute: {
          mapProperty: "before",
        },
        rentalAgreement: [
          {
            type: "ammendment",
            detail: "dont wear puffy shirt",
          },
        ],
        discount: 0,
        rent: 4500,
        storeId: "LatteLarrys",
        buildingId: "A34",
        tags: ["family_friendly"],
        leaseEndDate: "2020-03-22",
        contact: ["555-555-5555"],
        deposit: 1000,
        unitId: "B47",
        category: "food/coffee",
        listAttribute: [
          {
            setAttribute: ["555-555-5555"],
          },
          {
            setAttribute: ["666-666-6666", "setItemValue1", "setItemValue2"],
          },
        ],
        tenant: ["tom"],
      });
    });

    it("should generate the same parameters as shown in the readme examples", () => {
      const cityId = uuid();
      const mallId = "EastPointe";
      const storeId = "LatteLarrys";
      const buildingId = "A34";
      const setParameters = StoreLocations.update({
        cityId,
        mallId,
        storeId,
        buildingId,
      })
        .set({ category: "food/meal" })
        .where((attr, op) => op.eq(attr.category, "food/coffee"))
        .params();

      expect(setParameters).to.deep.equal({
        UpdateExpression:
          "SET #category = :category_u0, #cityId = :cityId_u0, #mallId = :mallId_u0, #buildingId = :buildingId_u0, #storeId = :storeId_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0",
        ExpressionAttributeNames: {
          "#category": "category",
          "#buildingId": "buildingId",
          "#cityId": "cityId",
          "#mallId": "mallId",
          "#storeId": "storeId",
          "#__edb_e__": "__edb_e__",
          "#__edb_v__": "__edb_v__",
        },
        ExpressionAttributeValues: {
          ":category0": "food/coffee",
          ":category_u0": "food/meal",
          ":buildingId_u0": "A34",
          ":cityId_u0": cityId,
          ":mallId_u0": mallId,
          ":storeId_u0": storeId,
          ":__edb_e___u0": "MallStore",
          ":__edb_v___u0": "1",
        },
        TableName: "electro",
        Key: {
          pk: `$mallstoredirectory#cityid_${cityId}#mallid_eastpointe`,
          sk: "$mallstore_1#buildingid_a34#storeid_lattelarrys",
        },
        ConditionExpression: "#category = :category0",
      });

      const removeParameters = StoreLocations.update({
        cityId,
        mallId,
        storeId,
        buildingId,
      })
        .remove(["discount"])
        .where((attr, op) => op.eq(attr.discount, 10))
        .params();

      expect(removeParameters).to.deep.equal({
        UpdateExpression:
          "SET #cityId = :cityId_u0, #mallId = :mallId_u0, #buildingId = :buildingId_u0, #storeId = :storeId_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0 REMOVE #discount",
        ExpressionAttributeNames: {
          "#discount": "discount",
          "#buildingId": "buildingId",
          "#cityId": "cityId",
          "#mallId": "mallId",
          "#storeId": "storeId",
          "#__edb_e__": "__edb_e__",
          "#__edb_v__": "__edb_v__",
        },
        ExpressionAttributeValues: {
          ":discount0": 10,
          ":buildingId_u0": "A34",
          ":cityId_u0": cityId,
          ":mallId_u0": mallId,
          ":storeId_u0": storeId,
          ":__edb_e___u0": "MallStore",
          ":__edb_v___u0": "1",
        },
        TableName: "electro",
        Key: {
          pk: `$mallstoredirectory#cityid_${cityId}#mallid_eastpointe`,
          sk: "$mallstore_1#buildingid_a34#storeid_lattelarrys",
        },
        ConditionExpression: "#discount = :discount0",
      });

      const addParameters = StoreLocations.update({
        cityId,
        mallId,
        storeId,
        buildingId,
      })
        .add({
          rent: 100, // "number" attribute
          tenant: ["larry"], // "set" attribute
        })
        .where((attr, op) => op.eq(attr.category, "food/coffee"))
        .params();

      expect(JSON.parse(JSON.stringify(addParameters))).to.deep.equal({
        UpdateExpression:
          "SET #cityId = :cityId_u0, #mallId = :mallId_u0, #buildingId = :buildingId_u0, #storeId = :storeId_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0 ADD #rent :rent_u0, #tenant :tenant_u0",
        ExpressionAttributeNames: {
          "#category": "category",
          "#rent": "rent",
          "#tenant": "tenant",
          "#buildingId": "buildingId",
          "#cityId": "cityId",
          "#mallId": "mallId",
          "#storeId": "storeId",
          "#__edb_e__": "__edb_e__",
          "#__edb_v__": "__edb_v__",
        },
        ExpressionAttributeValues: {
          ":category0": "food/coffee",
          ":rent_u0": 100,
          ":tenant_u0": ["larry"],
          ":buildingId_u0": "A34",
          ":cityId_u0": cityId,
          ":mallId_u0": mallId,
          ":storeId_u0": storeId,
          ":__edb_e___u0": "MallStore",
          ":__edb_v___u0": "1",
        },
        TableName: "electro",
        Key: {
          pk: `$mallstoredirectory#cityid_${cityId}#mallid_eastpointe`,
          sk: "$mallstore_1#buildingid_a34#storeid_lattelarrys",
        },
        ConditionExpression: "#category = :category0",
      });

      const subtractParameters = StoreLocations.update({
        cityId,
        mallId,
        storeId,
        buildingId,
      })
        .subtract({ deposit: 500 })
        .where((attr, op) => op.eq(attr.category, "food/coffee"))
        .params();

      expect(subtractParameters).to.deep.equal({
        UpdateExpression:
          "SET #deposit = (if_not_exists(#deposit, :deposit_default_value_u0) - :deposit_u0), #cityId = :cityId_u0, #mallId = :mallId_u0, #buildingId = :buildingId_u0, #storeId = :storeId_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0",
        ExpressionAttributeNames: {
          "#category": "category",
          "#deposit": "deposit",
          "#buildingId": "buildingId",
          "#cityId": "cityId",
          "#mallId": "mallId",
          "#storeId": "storeId",
          "#__edb_e__": "__edb_e__",
          "#__edb_v__": "__edb_v__",
        },
        ExpressionAttributeValues: {
          ":deposit_default_value_u0": 0,
          ":category0": "food/coffee",
          ":deposit_u0": 500,
          ":buildingId_u0": "A34",
          ":cityId_u0": cityId,
          ":mallId_u0": mallId,
          ":storeId_u0": storeId,
          ":__edb_e___u0": "MallStore",
          ":__edb_v___u0": "1",
        },
        TableName: "electro",
        Key: {
          pk: `$mallstoredirectory#cityid_${cityId}#mallid_eastpointe`,
          sk: "$mallstore_1#buildingid_a34#storeid_lattelarrys",
        },
        ConditionExpression: "#category = :category0",
      });

      const appendParameters = StoreLocations.update({
        cityId,
        mallId,
        storeId,
        buildingId,
      })
        .append({
          rentalAgreement: [
            {
              type: "ammendment",
              detail: "no soup for you",
            },
          ],
        })
        .where((attr, op) => op.eq(attr.category, "food/coffee"))
        .params();

      expect(appendParameters).to.deep.equal({
        UpdateExpression:
          "SET #rentalAgreement = list_append(if_not_exists(#rentalAgreement, :rentalAgreement_default_value_u0), :rentalAgreement_u0), #cityId = :cityId_u0, #mallId = :mallId_u0, #buildingId = :buildingId_u0, #storeId = :storeId_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0",
        ExpressionAttributeNames: {
          "#category": "category",
          "#rentalAgreement": "rentalAgreement",
          "#buildingId": "buildingId",
          "#cityId": "cityId",
          "#mallId": "mallId",
          "#storeId": "storeId",
          "#__edb_e__": "__edb_e__",
          "#__edb_v__": "__edb_v__",
        },
        ExpressionAttributeValues: {
          ":category0": "food/coffee",
          ":rentalAgreement_default_value_u0": [],
          ":rentalAgreement_u0": [
            {
              type: "ammendment",
              detail: "no soup for you",
            },
          ],
          ":buildingId_u0": "A34",
          ":cityId_u0": cityId,
          ":mallId_u0": mallId,
          ":storeId_u0": storeId,
          ":__edb_e___u0": "MallStore",
          ":__edb_v___u0": "1",
        },
        TableName: "electro",
        Key: {
          pk: `$mallstoredirectory#cityid_${cityId}#mallid_eastpointe`,
          sk: "$mallstore_1#buildingid_a34#storeid_lattelarrys",
        },
        ConditionExpression: "#category = :category0",
      });

      const deleteParameters = StoreLocations.update({
        cityId,
        mallId,
        storeId,
        buildingId,
      })
        .delete({ contact: ["555-345-2222"] })
        .where((attr, op) => op.eq(attr.category, "food/coffee"))
        .params();

      expect(JSON.parse(JSON.stringify(deleteParameters))).to.deep.equal({
        UpdateExpression:
          "SET #cityId = :cityId_u0, #mallId = :mallId_u0, #buildingId = :buildingId_u0, #storeId = :storeId_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0 DELETE #contact :contact_u0",
        ExpressionAttributeNames: {
          "#category": "category",
          "#contact": "contact",
          "#buildingId": "buildingId",
          "#cityId": "cityId",
          "#mallId": "mallId",
          "#storeId": "storeId",
          "#__edb_e__": "__edb_e__",
          "#__edb_v__": "__edb_v__",
        },
        ExpressionAttributeValues: {
          ":category0": "food/coffee",
          ":contact_u0": ["555-345-2222"],
          ":buildingId_u0": "A34",
          ":cityId_u0": cityId,
          ":mallId_u0": mallId,
          ":storeId_u0": storeId,
          ":__edb_e___u0": "MallStore",
          ":__edb_v___u0": "1",
        },
        TableName: "electro",
        Key: {
          pk: `$mallstoredirectory#cityid_${cityId}#mallid_eastpointe`,
          sk: "$mallstore_1#buildingid_a34#storeid_lattelarrys",
        },
        ConditionExpression: "#category = :category0",
      });

      const allParameters = StoreLocations.update({
        cityId,
        mallId,
        storeId,
        buildingId,
      })
        .data((attr, op) => {
          const newTenant = op.value(attr.tenant, ["larry"]);
          op.set(attr.category, "food/meal");
          op.add(attr.tenant, newTenant);
          op.add(attr.rent, 100);
          op.subtract(attr.deposit, 200);
          op.remove(attr.discount);
          op.append(attr.rentalAgreement, [
            { type: "ammendment", detail: "no soup for you" },
          ]);
          op.delete(attr.tags, ["coffee"]);
          op.del(attr.contact, ["555-345-2222"]);
          op.add(attr.totalFees, op.name(attr.petFee));
          op.add(attr.leaseHolders, newTenant);
        })
        .where((attr, op) => op.eq(attr.category, "food/coffee"))
        .params();

      expect(JSON.parse(JSON.stringify(allParameters))).to.deep.equal({
        UpdateExpression:
          "SET #category = :category_u0, #deposit = (if_not_exists(#deposit, :deposit_default_value_u0) - :deposit_u0), #rentalAgreement = list_append(if_not_exists(#rentalAgreement, :rentalAgreement_default_value_u0), :rentalAgreement_u0), #totalFees = #totalFees + #petFee, #cityId = :cityId_u0, #mallId = :mallId_u0, #buildingId = :buildingId_u0, #storeId = :storeId_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0 REMOVE #discount ADD #tenant :tenant_u0, #rent :rent_u0, #leaseHolders :tenant_u0 DELETE #tags :tags_u0, #contact :contact_u0",
        ExpressionAttributeNames: {
          "#category": "category",
          "#tenant": "tenant",
          "#rent": "rent",
          "#deposit": "deposit",
          "#discount": "discount",
          "#rentalAgreement": "rentalAgreement",
          "#tags": "tags",
          "#contact": "contact",
          "#totalFees": "totalFees",
          "#petFee": "petFee",
          "#leaseHolders": "leaseHolders",
          "#buildingId": "buildingId",
          "#cityId": "cityId",
          "#mallId": "mallId",
          "#storeId": "storeId",
          "#__edb_e__": "__edb_e__",
          "#__edb_v__": "__edb_v__",
        },
        ExpressionAttributeValues: {
          ":rentalAgreement_default_value_u0": [],
          ":deposit_default_value_u0": 0,
          ":category0": "food/coffee",
          ":category_u0": "food/meal",
          ":rent_u0": 100,
          ":deposit_u0": 200,
          ":rentalAgreement_u0": [
            {
              type: "ammendment",
              detail: "no soup for you",
            },
          ],
          ":contact_u0": ["555-345-2222"],
          ":tags_u0": ["coffee"],
          ":tenant_u0": ["larry"],
          ":buildingId_u0": "A34",
          ":cityId_u0": cityId,
          ":mallId_u0": mallId,
          ":storeId_u0": storeId,
          ":__edb_e___u0": "MallStore",
          ":__edb_v___u0": "1",
        },
        TableName: "electro",
        Key: {
          pk: `$mallstoredirectory#cityid_${cityId}#mallid_eastpointe`,
          sk: "$mallstore_1#buildingid_a34#storeid_lattelarrys",
        },
        ConditionExpression: "#category = :category0",
      });
    });
  });

  it("should allow operations to be all chained together", async () => {
    const repoName = uuid();
    const repoOwner = uuid();
    const createdAt = "2021-07-01";

    const recentCommits = [
      {
        sha: "8ca4d4b2",
        data: "1627158426",
        message: "fixing bug",
        views: 50,
      },
      {
        sha: "25d68f54",
        data: "1627158100",
        message: "adding bug",
        views: 25,
      },
    ];

    const created = await repositories
      .put({
        repoName,
        repoOwner,
        createdAt,
        recentCommits,
        about: "my about details",
        isPrivate: false,
        license: "apache-2.0",
        description: "my description",
        stars: 10,
        defaultBranch: "main",
        tags: ["tag1", "tag2"],
        custom: {
          prop1: "abc",
          prop2: 100,
          prop3: 200,
          prop4: "xyz",
        },
        followers: ["tywalch"],
        views: 99,
        files: ["index.ts", "package.json"],
      })
      .go()
      .then((res) => res.data);

    const updates = {
      prop2: 15,
      tags: "tag1",
      stars: 8,
      description: "updated description",
      files: ["README.md"],
      about: "about",
      license: "cc",
      followers: "tinkertamper",
      prop1: "def",
      recentCommitsViews: 3,
    };

    const params: any = repositories
      .update({ repoName, repoOwner })
      .add({ followers: ["tinkertamper"] })
      .subtract({ stars: updates.stars })
      .append({ files: updates.files })
      .set({ description: updates.description })
      .remove(["about"])
      .delete({ tags: [updates.tags] })
      .data((attr, op) => {
        op.set(attr.custom.prop1, updates.prop1);
        op.set(attr.custom["prop1 "], updates.prop1);
        op.set(attr.custom["prop1  "], updates.prop1);
        op.add(attr.views, op.name(attr.custom.prop3));
        op.add(attr.recentCommits[0].views, updates.recentCommitsViews);
        op.remove(attr.recentCommits[1].message);
      })
      .params();

    expect(params).to.deep.equal({
      UpdateExpression: 
        "SET #stars = (if_not_exists(#stars, :stars_default_value_u0) - :stars_u0), #files = list_append(if_not_exists(#files, :files_default_value_u0), :files_u0), #description = :description_u0, #custom.#prop1 = :custom_u0, #views = #views + #custom.#prop3, #repoOwner = :repoOwner_u0, #repoName = :repoName_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0 REMOVE #about, #recentCommits[1].#message ADD #followers :followers_u0, #recentCommits[0].#views :views_u0 DELETE #tags :tags_u0",
      ExpressionAttributeNames: {
        "#followers": "followers",
        "#stars": "stars",
        "#files": "files",
        "#description": "description",
        "#about": "about",
        "#tags": "tags",
        "#custom": "custom",
        "#prop1": "prop1",
        "#prop1_2": "prop1 ",
        "#prop1_3": "prop1  ",
        "#views": "views",
        "#prop3": "prop3",
        "#recentCommits": "recentCommits",
        "#message": "message",
        "#repoName": "repoName",
        "#repoOwner": "repoOwner",
        "#__edb_e__": "__edb_e__",
        "#__edb_v__": "__edb_v__",
      },
      ExpressionAttributeValues: {
        ":files_default_value_u0": [],
        ":stars_default_value_u0": 0,
        ":followers_u0": params.ExpressionAttributeValues[":followers_u0"],
        ":stars_u0": 8,
        ":files_u0": ["README.md"],
        ":description_u0": "updated description",
        ":tags_u0": params.ExpressionAttributeValues[":tags_u0"],
        ":custom_u0": "def",
        ":custom_u1": "def",
        ":custom_u2": "def",
        ":views_u0": 3,
        ":repoName_u0": repoName,
        ":repoOwner_u0": repoOwner,
        ":__edb_e___u0": "repositories",
        ":__edb_v___u0": "1",
      },
      TableName: "electro",
      Key: {
        pk: `$versioncontrol#repoowner_${repoOwner}`,
        sk: `$alerts#repositories_1#reponame_${repoName}`,
      },
    });

    await repositories
      .update({ repoName, repoOwner })
      .add({ followers: [updates.followers] })
      .subtract({ stars: updates.stars })
      .append({ files: updates.files })
      .set({ description: updates.description })
      .remove(["about"])
      .delete({ tags: [updates.tags] })
      .data((attr, op) => {
        op.set(attr.custom.prop1, updates.prop1);
        op.add(attr.views, op.name(attr.custom.prop3));
        op.add(attr.recentCommits[0].views, updates.recentCommitsViews);
        op.remove(attr.recentCommits[1].message);
      })
      .go()
      .then((res) => res.data);

    const item = await repositories
      .get({ repoName, repoOwner })
      .go()
      .then((res) => res.data);

    const expected = {
      repoOwner: repoOwner,
      repoName: repoName,
      custom: {
        prop2: 100,
        prop1: "def",
        prop4: "xyz",
        prop3: 200,
      },
      defaultBranch: "main",
      description: updates.description,
      recentCommits: [
        {
          data: "1627158426",
          message: "fixing bug",
          sha: "8ca4d4b2",
          views:
            (created?.recentCommits?.[0]?.views || 0) +
            updates.recentCommitsViews,
        },
        {
          data: "1627158100",
          sha: "25d68f54",
          views: 25,
        },
      ],
      isPrivate: false,
      stars: (created.stars || 0) - (updates.stars || 0),
      tags: ["tag2"],
      createdAt: createdAt,
      license: "apache-2.0",
      followers: [updates.followers, ...(created.followers ?? [])],
      files: [...(created.files ?? []), ...updates.files],
      views: created.views + created.custom.prop3,
      username: repoOwner,
    };

    expect(item).to.deep.equal(expected);
  });

  describe("append operations", () => {
    it("should only allow attributes with type 'list', or 'any'", async () => {
      const repoName = uuid();
      const repoOwner = uuid();
      const append = { description: "my description" } as any;
      const err = await repositories
        .update({ repoName, repoOwner })
        .append(append)
        .go()
        .catch((err) => err);

      expect(err.message).to.equal(
        `Invalid Update Attribute Operation: "APPEND" Operation can only be performed on attributes with type "list" or "any".`,
      );
    });

    it("should append items to a list", async () => {
      const repoName = uuid();
      const repoOwner = uuid();
      const createdAt = "2021-07-01";
      const recentCommits = [
        {
          sha: "8ca4d4b2",
          data: "1627158426",
          message: "fixing bug",
        },
      ];

      const additionalCommit = [
        {
          sha: "25d68f54",
          data: "1627158100",
          message: "adding bug",
        },
      ];

      const created = await repositories
        .put({
          repoName,
          repoOwner,
          createdAt,
          recentCommits,
          isPrivate: false,
          license: "apache-2.0",
          description: "my description",
          stars: 10,
          defaultBranch: "main",
          tags: ["tag1", "tag2"],
        })
        .go()
        .then((res) => res.data);

      await repositories
        .update({ repoName, repoOwner })
        .append({
          recentCommits: additionalCommit,
        })
        .go();

      const item = await repositories
        .get({ repoName, repoOwner })
        .go()
        .then((res) => res.data);

      expect(item).to.deep.equal({
        ...created,
        recentCommits: [...recentCommits, ...additionalCommit],
      });
    });

    it("should support append being called twice in a chain", async () => {
      const repoName = uuid();
      const repoOwner = uuid();
      const createdAt = "2021-07-01";
      const firstCommit = [
        {
          sha: "8ca4d4b2",
          message: "fixing bug",
          timestamp: 1627158426,
        },
      ];

      const secondCommit = [
        {
          sha: "25d68f54",
          message: "adding bug",
          timestamp: 1627158100,
        },
      ];

      const custom = [
        {
          status: "started",
          timestamp: 1627158100,
        },
      ];

      const customUpdate = [
        {
          status: "working",
          timestamp: 1627198100,
        },
      ];

      const created = await repositories
        .put({
          repoName,
          repoOwner,
          createdAt,
          recentCommits: firstCommit,
          custom: custom,
          isPrivate: false,
          license: "apache-2.0",
          description: "my description",
          stars: 10,
          defaultBranch: "main",
          tags: ["tag1", "tag2"],
        })
        .go()
        .then((res) => res.data);

      await repositories
        .update({ repoName, repoOwner })
        .append({
          recentCommits: secondCommit,
        })
        .append({
          custom: customUpdate,
        })
        .go();

      const item = await repositories
        .get({ repoName, repoOwner })
        .go()
        .then((res) => res.data);

      expect(item).to.deep.equal({
        ...created,
        recentCommits: [...firstCommit, ...secondCommit],
        custom: [...custom, ...customUpdate],
      });
    });

    it("should append items to a list with data method", async () => {
      const repoName = uuid();
      const repoOwner = uuid();
      const createdAt = "2021-07-01";
      const recentCommits = [
        {
          sha: "8ca4d4b2",
          data: "1627158426",
          message: "fixing bug",
        },
      ];
      const additionalCommit = [
        {
          sha: "25d68f54",
          data: "1627158100",
          message: "adding bug",
          views: 10,
          timestamp: Date.now(),
          // abc: "def"
        },
      ];
      const created = await repositories
        .put({
          repoName,
          repoOwner,
          createdAt,
          recentCommits,
          isPrivate: false,
          license: "apache-2.0",
          description: "my description",
          stars: 10,
          defaultBranch: "main",
          tags: ["tag1", "tag2"],
        })
        .go()
        .then((res) => res.data);

      await repositories
        .update({ repoName, repoOwner })
        .data(({ recentCommits }, { append }) =>
          append(recentCommits, additionalCommit),
        )
        .go();

      const item = await repositories
        .get({ repoName, repoOwner })
        .go()
        .then((res) => res.data);

      expect(item).to.deep.equal({
        ...created,
        recentCommits: [...recentCommits, ...additionalCommit],
      });
    });
  });
  describe("remove operations", () => {
    it("should allow for deleting all PK elements on a gsi to create a sparse index", async () => {
      const username = uuid();
      const location = uuid();

      await users
        .create({
          username,
          location,
          bio: "I make things.",
          fullName: "tyler walch",
        })
        .go();

      const itemBefore = await users
        .get({ username })
        .go({ data: 'raw' })
        .then((res) => res.data);

      expect(itemBefore).to.deep.equal({
        Item: {
          pk: `$versioncontrol#username_${username}`,
          sk: "$overview#user_1",

          gsi1pk: `$versioncontrol#username_${username}`,
          gsi1sk: "$owned#user_1",

          gsi2pk: `$versioncontrol#location_${location}`,
          gsi2sk: "$user_1",

          location: location,
          username: username,

          bio: "I make things.",
          fullName: "tyler walch",

          __edb_e__: "user",
          __edb_v__: "1",
        },
      });

      const params = users.update({ username }).remove(["location"]).params();

      expect(params).to.deep.equal({
        UpdateExpression:
          "SET #username = :username_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0 REMOVE #location, #gsi2pk",
        ExpressionAttributeNames: {
          "#location": "location",
          "#gsi2pk": "gsi2pk",
          "#username": "username",
          "#__edb_e__": "__edb_e__",
          "#__edb_v__": "__edb_v__",
        },
        ExpressionAttributeValues: {
          ":username_u0": username,
          ":__edb_e___u0": "user",
          ":__edb_v___u0": "1",
        },
        TableName: "electro",
        Key: {
          pk: `$versioncontrol#username_${username}`,
          sk: "$overview#user_1",
        },
      });

      await users.update({ username }).remove(["location"]).go();

      const itemAfter = await users
        .get({ username })
        .go({ data: 'raw' })
        .then((res) => res.data);

      expect(itemAfter).to.deep.equal({
        Item: {
          pk: `$versioncontrol#username_${username}`,
          sk: "$overview#user_1",

          gsi1pk: `$versioncontrol#username_${username}`,
          gsi1sk: "$owned#user_1",

          gsi2sk: "$user_1",

          username: username,
          bio: "I make things.",
          fullName: "tyler walch",
          __edb_v__: "1",
          __edb_e__: "user",
        },
      });
    });

    it("should allow for deleting all SK elements on a gsi to create a sparse index", async () => {
      const users = new Entity(
        {
          model: {
            entity: "user",
            service: "versioncontrol",
            version: "1",
          },
          attributes: {
            username: {
              type: "string",
            },
            email: {
              type: "string",
            },
            device: {
              type: "string",
            },
            bio: {
              type: "string",
            },
            location: {
              type: "string",
            },
            fullName: {
              type: "string",
            },
          },
          indexes: {
            user: {
              pk: {
                composite: ["username"],
                field: "pk",
              },
              sk: {
                composite: [],
                field: "sk",
              },
            },
            approved: {
              index: "gsi1pk-gsi1sk-index",
              pk: {
                composite: ["email"],
                field: "gsi1pk",
              },
              sk: {
                field: "gsi1sk",
                composite: ["device"],
              },
            },
          },
        },
        { table, client },
      );
      const username = uuid();
      const location = uuid();
      const device = uuid();
      const email = uuid();

      await users
        .create({
          email,
          device,
          username,
          location,
          bio: "I make things.",
          fullName: "tyler walch",
        })
        .go();

      const itemBefore = await users
        .get({ username })
        .go({ data: 'raw' })
        .then((res) => res.data);

      expect(itemBefore).to.deep.equal({
        Item: {
          pk: `$versioncontrol#username_${username}`,
          sk: "$user_1",

          gsi1pk: `$versioncontrol#email_${email}`,
          gsi1sk: `$user_1#device_${device}`,

          email: email,
          device: device,
          location: location,
          username: username,

          bio: "I make things.",
          fullName: "tyler walch",

          __edb_e__: "user",
          __edb_v__: "1",
        },
      });

      const params = users.update({ username }).remove(["device"]).params();

      expect(params).to.deep.equal({
        UpdateExpression:
          "SET #username = :username_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0 REMOVE #device, #gsi1sk",
        ExpressionAttributeNames: {
          "#device": "device",
          "#gsi1sk": "gsi1sk",
          "#username": "username",
          "#__edb_e__": "__edb_e__",
          "#__edb_v__": "__edb_v__",
        },
        ExpressionAttributeValues: {
          ":username_u0": username,
          ":__edb_e___u0": "user",
          ":__edb_v___u0": "1",
        },
        TableName: "electro",
        Key: {
          pk: `$versioncontrol#username_${username}`,
          sk: "$user_1",
        },
      });

      await users.update({ username }).remove(["device"]).go();

      const itemAfter = await users
        .get({ username })
        .go({ data: 'raw' })
        .then((res) => res.data);

      expect(itemAfter).to.deep.equal({
        Item: {
          pk: `$versioncontrol#username_${username}`,
          sk: "$user_1",

          gsi1pk: `$versioncontrol#email_${email}`,

          username: username,
          location: location,
          email: email,

          bio: "I make things.",
          fullName: "tyler walch",

          __edb_v__: "1",
          __edb_e__: "user",
        },
      });
    });

    it("should allow for partial update of a gsi composite index with the composite method on patch", () => {
      const table = "electro";
      const Organization = new Entity(
        {
          model: {
            entity: "organization",
            service: "app",
            version: "1",
          },
          attributes: {
            id: {
              type: "string",
            },
            name: {
              type: "string",
              required: true,
            },
            description: {
              type: "string",
            },
            deleted: {
              type: "boolean",
              default: false,
            },
            createdAt: {
              type: "string",
              readOnly: true,
              required: true,
              set: () => new Date().toISOString(),
              default: () => new Date().toISOString(),
            },
          },
          indexes: {
            record: {
              pk: {
                field: "pk",
                composite: ["id"],
              },
              sk: {
                field: "sk",
                composite: [],
              },
            },
            all: {
              index: "gsi1pk-gsi1sk-index",
              pk: {
                field: "gsi1pk",
                composite: [],
              },
              sk: {
                field: "gsi1sk",
                composite: ["deleted", "createdAt"], // SK has both readonly and mutable attributes
              },
            },
          },
        },
        { table },
      );

      expect(() =>
        Organization.patch({ id: "2Tz0fHi80CE3dqA6bMIehSvTryv" })
          .set({ deleted: true })
          .params(),
      ).to.throw(
        `Incomplete composite attributes: Without the composite attributes "createdAt" the following access patterns cannot be updated: "all". If a composite attribute is readOnly and cannot be set, use the 'composite' chain method on update to supply the value for key formatting purposes. - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#incomplete-composite-attributes`,
      );

      const params = Organization.patch({ id: "2Tz0fHi80CE3dqA6bMIehSvTryv" })
        .composite({ createdAt: "2023-08-22" })
        .set({ deleted: true })
        .params();

      expect(params).to.deep.equal({
        UpdateExpression:
          "SET #deleted = :deleted_u0, #gsi1sk = :gsi1sk_u0, #id = :id_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0",
        ExpressionAttributeNames: {
          "#pk": "pk",
          "#sk": "sk",
          "#createdAt": "createdAt",
          "#deleted": "deleted",
          "#gsi1sk": "gsi1sk",
          "#id": "id",
          "#__edb_e__": "__edb_e__",
          "#__edb_v__": "__edb_v__",
        },
        ExpressionAttributeValues: {
          ":createdAt0": "2023-08-22",
          ":deleted_u0": true,
          ":gsi1sk_u0": "$organization_1#deleted_true#createdat_2023-08-22",
          ":id_u0": "2Tz0fHi80CE3dqA6bMIehSvTryv",
          ":__edb_e___u0": "organization",
          ":__edb_v___u0": "1",
        },
        TableName: "electro",
        Key: {
          pk: "$app#id_2tz0fhi80ce3dqa6bmiehsvtryv",
          sk: "$organization_1",
        },
        ConditionExpression:
          "attribute_exists(#pk) AND attribute_exists(#sk) AND #createdAt = :createdAt0",
      });
    });

    it("should allow for partial update of a gsi composite index with the composite method on update", () => {
      const table = "electro";
      const Organization = new Entity(
        {
          model: {
            entity: "organization",
            service: "app",
            version: "1",
          },
          attributes: {
            id: {
              type: "string",
            },
            name: {
              type: "string",
              required: true,
            },
            description: {
              type: "string",
            },
            deleted: {
              type: "boolean",
              default: false,
            },
            createdAt: {
              type: "string",
              readOnly: true,
              required: true,
              set: () => new Date().toISOString(),
              default: () => new Date().toISOString(),
            },
          },
          indexes: {
            record: {
              pk: {
                field: "pk",
                composite: ["id"],
              },
              sk: {
                field: "sk",
                composite: [],
              },
            },
            all: {
              index: "gsi1pk-gsi1sk-index",
              pk: {
                field: "gsi1pk",
                composite: [],
              },
              sk: {
                field: "gsi1sk",
                composite: ["deleted", "createdAt"], // SK has both readonly and mutable attributes
              },
            },
          },
        },
        { table },
      );

      expect(() =>
        Organization.update({ id: "2Tz0fHi80CE3dqA6bMIehSvTryv" })
          .set({ deleted: true })
          .params(),
      ).to.throw(
        `Incomplete composite attributes: Without the composite attributes "createdAt" the following access patterns cannot be updated: "all". If a composite attribute is readOnly and cannot be set, use the 'composite' chain method on update to supply the value for key formatting purposes. - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#incomplete-composite-attributes`,
      );

      const params = Organization.update({ id: "2Tz0fHi80CE3dqA6bMIehSvTryv" })
        .composite({ createdAt: "2023-08-22" })
        .set({ deleted: true })
        .params();

      expect(params).to.deep.equal({
        UpdateExpression:
          "SET #deleted = :deleted_u0, #gsi1sk = :gsi1sk_u0, #id = :id_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0",
        ExpressionAttributeNames: {
          "#createdAt": "createdAt",
          "#deleted": "deleted",
          "#gsi1sk": "gsi1sk",
          "#id": "id",
          "#__edb_e__": "__edb_e__",
          "#__edb_v__": "__edb_v__",
        },
        ExpressionAttributeValues: {
          ":createdAt0": "2023-08-22",
          ":deleted_u0": true,
          ":gsi1sk_u0": "$organization_1#deleted_true#createdat_2023-08-22",
          ":id_u0": "2Tz0fHi80CE3dqA6bMIehSvTryv",
          ":__edb_e___u0": "organization",
          ":__edb_v___u0": "1",
        },
        TableName: "electro",
        Key: {
          pk: "$app#id_2tz0fhi80ce3dqa6bmiehsvtryv",
          sk: "$organization_1",
        },
        ConditionExpression: "#createdAt = :createdAt0",
      });
    });

    it("should not allow for partial deletion of a gsi composite index", async () => {
      const users = new Entity(
        {
          model: {
            entity: "user",
            service: "versioncontrol",
            version: "1",
          },
          attributes: {
            username: {
              type: "string",
            },
            email: {
              type: "string",
            },
            device: {
              type: "string",
            },
            bio: {
              type: "string",
            },
            location: {
              type: "string",
            },
            fullName: {
              type: "string",
            },
          },
          indexes: {
            user: {
              pk: {
                composite: ["username"],
                field: "pk",
              },
              sk: {
                composite: [],
                field: "sk",
              },
            },
            approved: {
              index: "gsi1pk-gsi1sk-index",
              pk: {
                composite: ["email"],
                field: "gsi1pk",
              },
              sk: {
                field: "gsi1sk",
                composite: ["location", "device"],
              },
            },
          },
        },
        { table, client },
      );
      const username = uuid();
      const location = uuid();
      const device = uuid();
      const email = uuid();

      await users
        .create({
          email,
          device,
          username,
          location,
          bio: "I make things.",
          fullName: "tyler walch",
        })
        .go();

      const itemBefore = await users
        .get({ username })
        .go({ data: 'raw' })
        .then((res) => res.data);

      expect(itemBefore).to.deep.equal({
        Item: {
          pk: `$versioncontrol#username_${username}`,
          sk: "$user_1",

          gsi1pk: `$versioncontrol#email_${email}`,
          gsi1sk: `$user_1#location_${location}#device_${device}`,

          email: email,
          device: device,
          location: location,
          username: username,

          bio: "I make things.",
          fullName: "tyler walch",

          __edb_e__: "user",
          __edb_v__: "1",
        },
      });

      const error = () =>
        users.update({ username }).remove(["device"]).params();

      expect(error).to.throw(
        `Incomplete composite attributes: Without the composite attributes "location" the following access patterns cannot be updated: "approved". If a composite attribute is readOnly and cannot be set, use the 'composite' chain method on update to supply the value for key formatting purposes. - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#incomplete-composite-attributes`,
      );

      const error2 = await users
        .update({ username })
        .remove(["location"])
        .go()
        .catch((err) => err);
      expect(error2.message).to.equal(
        `Incomplete composite attributes: Without the composite attributes "device" the following access patterns cannot be updated: "approved". If a composite attribute is readOnly and cannot be set, use the 'composite' chain method on update to supply the value for key formatting purposes. - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#incomplete-composite-attributes`,
      );
    });

    it("should respect readOnly", async () => {
      const repoName = uuid();
      const repoOwner = uuid();

      await repositories
        .put({
          repoName,
          repoOwner,
          isPrivate: false,
        })
        .go();

      const removal = ["createdAt"] as any;

      const removeError = await repositories
        .update({ repoName, repoOwner })
        .remove(removal)
        .go()
        .catch((err) => err);

      expect(removeError.message).to.equal(
        `Attribute "createdAt" is Read-Only and cannot be removed - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#invalid-attribute`,
      );

      const dataRemoveError = await repositories
        .update({ repoName, repoOwner })
        .data((attr, op) => {
          // @ts-ignore
          op.remove(attr.isPrivate);
          // @ts-ignore
          op.remove(attr.createdAt);
        })
        .go()
        .catch((err) => err);
      expect(dataRemoveError.message).to.not.be.undefined;
      expect(dataRemoveError.message).to.equal(
        `Attribute "createdAt" is Read-Only and cannot be updated - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#invalid-attribute`,
      );
    });

    it("should remove properties from an item via the update method", async () => {
      const repoName = uuid();
      const repoOwner = uuid();
      const createdAt = "2021-07-01";
      await repositories
        .put({
          repoName,
          repoOwner,
          createdAt,
          isPrivate: false,
          license: "apache-2.0",
          description: "my description",
          recentCommits: [
            {
              sha: "8ca4d4b2",
              data: "1627158426",
              message: "fixing bug",
            },
            {
              sha: "25d68f54",
              data: "1627158100",
              message: "adding bug",
            },
          ],
          stars: 10,
          defaultBranch: "main",
          tags: ["tag1", "tag2"],
        })
        .go();

      await repositories
        .update({ repoName, repoOwner })
        .remove([
          "license",
          "description",
          "recentCommits",
          "stars",
          "defaultBranch",
          "tags",
        ])
        .go();

      const item = await repositories
        .get({ repoName, repoOwner })
        .go()
        .then((res) => res.data);

      expect(item).to.deep.equal({
        createdAt,
        repoOwner,
        repoName,
        username: repoOwner,
        isPrivate: false,
      });
    });

    it("should remove properties from an item via the patch method", async () => {
      const repoName = uuid();
      const repoOwner = uuid();
      const createdAt = "2021-07-01";
      await repositories
        .put({
          repoName,
          repoOwner,
          createdAt,
          isPrivate: false,
          license: "apache-2.0",
          description: "my description",
          recentCommits: [
            {
              sha: "8ca4d4b2",
              data: "1627158426",
              message: "fixing bug",
            },
            {
              sha: "25d68f54",
              data: "1627158100",
              message: "adding bug",
            },
          ],
          stars: 10,
          defaultBranch: "main",
          tags: ["tag1", "tag2"],
        })
        .go();

      await repositories
        .patch({ repoName, repoOwner })
        .remove([
          "license",
          "description",
          "recentCommits",
          "stars",
          "defaultBranch",
          "tags",
        ])
        .go();

      const item = await repositories
        .get({ repoName, repoOwner })
        .go()
        .then((res) => res.data);

      expect(item).to.deep.equal({
        createdAt,
        repoOwner,
        repoName,
        username: repoOwner,
        isPrivate: false,
      });
    });

    it("should remove properties from an item with data method", async () => {
      const repoName = uuid();
      const repoOwner = uuid();
      const createdAt = "2021-07-01";

      await repositories
        .put({
          repoName,
          repoOwner,
          createdAt,
          isPrivate: false,
          license: "apache-2.0",
          description: "my description",
          recentCommits: [
            {
              sha: "8ca4d4b2",
              data: "1627158426",
              message: "fixing bug",
            },
            {
              sha: "25d68f54",
              data: "1627158100",
              message: "adding bug",
            },
          ],
          stars: 10,
          defaultBranch: "main",
          tags: ["tag1", "tag2"],
        })
        .go();

      await repositories
        .update({ repoName, repoOwner })
        .data((a, { remove }) => {
          remove(a.license);
          remove(a.description);
          remove(a.recentCommits);
          remove(a.stars);
          remove(a.defaultBranch);
          remove(a.tags);
        })
        .go();

      const item = await repositories
        .get({ repoName, repoOwner })
        .go()
        .then((res) => res.data);

      expect(item).to.deep.equal({
        createdAt,
        repoOwner,
        repoName,
        username: repoOwner,
        isPrivate: false,
      });
    });
  });
  describe("delete operations", () => {
    it("should delete a value from the Set type attribute", async () => {
      const repoName = uuid();
      const repoOwner = uuid();

      await repositories
        .create({
          repoName,
          repoOwner,
          stars: 10,
          isPrivate: false,
          defaultBranch: "main",
          tags: ["tag1", "tag2"],
        })
        .go();

      await repositories
        .update({ repoName, repoOwner })
        .delete({ tags: ["tag1"] })
        .go();

      const results = await repositories
        .get({ repoName, repoOwner })
        .go()
        .then((res) => res.data);

      expect(results?.tags).to.deep.equal(["tag2"]);
    });
    it("should delete a value from the Set type attribute with data method", async () => {
      const repoName = uuid();
      const repoOwner = uuid();

      await repositories
        .create({
          repoName,
          repoOwner,
          stars: 10,
          isPrivate: false,
          defaultBranch: "main",
          tags: ["tag1", "tag2"],
        })
        .go()
        .then((res) => res.data);

      await repositories
        .update({ repoName, repoOwner })
        .data(({ tags }, { del }) => del(tags, ["tag1"]))
        .go();

      const results = await repositories
        .get({ repoName, repoOwner })
        .go()
        .then((res) => res.data);

      expect(results?.tags).to.deep.equal(["tag2"]);
    });

    it("should only allow attributes with type 'set', or 'any'", async () => {
      const repoName = uuid();
      const repoOwner = uuid();

      const deletion = { description: "my description" } as any;

      const err = await repositories
        .update({ repoName, repoOwner })
        .delete(deletion)
        .go()
        .catch((err) => err);

      expect(err.message).to.equal(
        `Invalid Update Attribute Operation: "DELETE" Operation can only be performed on attributes with type "set" or "any".`,
      );
    });
  });

  describe("add operations", () => {
    it("should increment the 'stars' property", async () => {
      const repoName = uuid();
      const repoOwner = uuid();
      const repo = await repositories
        .create({
          repoName,
          repoOwner,
          isPrivate: false,
          defaultBranch: "main",
        })
        .go()
        .then((res) => res.data);
      expect(repo.stars).to.equal(0);

      await repositories.update({ repoName, repoOwner }).add({ stars: 1 }).go();

      const results = await repositories
        .get({ repoName, repoOwner })
        .go()
        .then((res) => res.data);

      expect(results?.stars).to.equal(1);
    });

    it("should only update attribute when it doesnt yet exist", async () => {
      const repoName = uuid();
      const repoOwner = uuid();

      const description1 = uuid();
      const description2 = uuid();

      await repositories
        .put({
          repoName,
          repoOwner,
          isPrivate: true,
        })
        .go();

      await repositories
        .update({ repoName, repoOwner })
        .data(({ description }, { ifNotExists }) => {
          ifNotExists(description, description1);
        })
        .go();

      const value1 = await repositories
        .get({ repoName, repoOwner })
        .go()
        .then((res) => res.data);
      if (!value1) {
        throw new Error("expected value1");
      }
      await repositories
        .update({ repoName, repoOwner })
        .data(({ description }, { ifNotExists }) => {
          ifNotExists(description, description2);
        })
        .go();

      const value2 = await repositories
        .get({ repoName, repoOwner })
        .go()
        .then((res) => res.data);
      if (!value2) {
        throw new Error("expected value1");
      }

      expect(value1.description).to.equal(value2.description);
      expect(value1.description).to.equal(description1);
    });

    it("should add 5 'stars' to the repository", async () => {
      const repoName = uuid();
      const repoOwner = uuid();

      const repo = await repositories
        .create({
          repoName,
          repoOwner,
          stars: 10,
          isPrivate: false,
          defaultBranch: "main",
        })
        .go()
        .then((res) => res.data);

      expect(repo.stars).to.equal(10);

      await repositories.update({ repoName, repoOwner }).add({ stars: 5 }).go();

      const results = await repositories
        .get({ repoName, repoOwner })
        .go()
        .then((res) => res.data);

      expect(results?.stars).to.equal(15);
    });

    it("should add 5 'stars' to the repository with the data method", async () => {
      const repoName = uuid();
      const repoOwner = uuid();
      const repo = await repositories
        .create({
          repoName,
          repoOwner,
          stars: 10,
          isPrivate: false,
          defaultBranch: "main",
        })
        .go()
        .then((res) => res.data);

      expect(repo.stars).to.equal(10);

      await repositories
        .update({ repoName, repoOwner })
        .data(({ stars }, { add }) => add(stars, 5))
        .go()
        .then((res) => res.data);

      const results = await repositories
        .get({ repoName, repoOwner })
        .go()
        .then((res) => res.data);

      expect(results?.stars).to.equal(15);
    });

    it("should add an item to the tags property Set", async () => {
      const repoName = uuid();
      const repoOwner = uuid();

      await repositories
        .create({
          repoName,
          repoOwner,
          stars: 10,
          isPrivate: false,
          defaultBranch: "main",
          tags: ["tag1", "tag2"],
        })
        .go();

      await repositories
        .update({ repoName, repoOwner })
        .add({ tags: ["tag3"] })
        .go();

      const results = await repositories
        .get({ repoName, repoOwner })
        .go()
        .then((res) => res.data);

      expect(results?.tags).to.deep.equal(["tag1", "tag2", "tag3"]);
    });

    it("should only allow attributes with type 'number', 'set' or 'any'", async () => {
      const repoName = uuid();
      const repoOwner = uuid();

      const addition = { description: "my description" } as any;

      const err = await repositories
        .update({ repoName, repoOwner })
        .add(addition)
        .go()
        .catch((err) => err);

      expect(err.message).to.equal(
        `Invalid Update Attribute Operation: "ADD" Operation can only be performed on attributes with type "number", "set", or "any".`,
      );
    });
  });
  describe("subtract operations", () => {
    it("should decrement the 'stars' property", async () => {
      const repoName = uuid();
      const repoOwner = uuid();

      const repo = await repositories
        .create({
          repoName,
          repoOwner,
          stars: 5,
          isPrivate: false,
          defaultBranch: "main",
        })
        .go()
        .then((res) => res.data);

      expect(repo.stars).to.equal(5);

      await repositories
        .update({ repoName, repoOwner })
        .subtract({ stars: 1 })
        .go();

      const results = await repositories
        .get({ repoName, repoOwner })
        .go()
        .then((res) => res.data);

      expect(results?.stars).to.equal(4);
    });

    it("should remove 3 'stars' from the repository", async () => {
      const repoName = uuid();
      const repoOwner = uuid();

      const repo = await repositories
        .create({
          repoName,
          repoOwner,
          stars: 5,
          isPrivate: false,
          defaultBranch: "main",
        })
        .go()
        .then((res) => res.data);

      expect(repo.stars).to.equal(5);

      await repositories
        .update({ repoName, repoOwner })
        .subtract({ stars: 3 })
        .go();

      const results = await repositories
        .get({ repoName, repoOwner })
        .go()
        .then((res) => res.data);

      expect(results?.stars).to.equal(2);
    });

    it("should remove 3 'stars' from the repository with the data method", async () => {
      const repoName = uuid();
      const repoOwner = uuid();

      const repo = await repositories
        .create({
          repoName,
          repoOwner,
          stars: 5,
          isPrivate: false,
          defaultBranch: "main",
        })
        .go()
        .then((res) => res.data);

      expect(repo.stars).to.equal(5);

      await repositories
        .update({ repoName, repoOwner })
        .data(({ stars }, { subtract }) => subtract(stars, 3))
        .go();

      const results = await repositories
        .get({ repoName, repoOwner })
        .go()
        .then((res) => res.data);

      expect(results?.stars).to.equal(2);
    });
  });
  describe("name operation", () => {
    it("should allow name to be passed to other operation", async () => {
      const repoName = uuid();
      const repoOwner = uuid();

      const repo = await repositories
        .create({
          repoName,
          repoOwner,
          stars: 5,
          isPrivate: false,
          defaultBranch: "main",
          views: 10,
        })
        .go()
        .then((res) => res.data);

      expect(repo.stars).to.equal(5);

      await repositories
        .update({ repoName, repoOwner })
        .data(({ stars, views }, { name, add }) => add(views, name(stars)))
        .go();

      const results = await repositories
        .get({ repoName, repoOwner })
        .go()
        .then((res) => res.data);

      expect(results?.views).to.equal(15);
    });

    it("should only allow types", async () => {});
  });
  describe("value operation", () => {
    it("should only allow types", async () => {
      const repoName = uuid();
      const repoOwner = uuid();

      const repo = await repositories
        .create({
          repoName,
          repoOwner,
          stars: 5,
          isPrivate: false,
          views: 10,
        })
        .go()
        .then((res) => res.data);

      expect(repo.stars).to.equal(5);
      expect(repo.views).to.equal(10);

      const updateParams = repositories
        .update({ repoName, repoOwner })
        .data(({ stars, views }, { value, add }) => {
          const newStars = value(stars, 20);
          add(views, newStars);
          add(stars, newStars);
        })
        .params();

      expect(updateParams).to.deep.equal({
        UpdateExpression:
          "SET #views = #views + :stars_u0, #stars = #stars + :stars_u0, #repoOwner = :repoOwner_u0, #repoName = :repoName_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0",
        ExpressionAttributeNames: {
          "#stars": "stars",
          "#views": "views",
          "#repoName": "repoName",
          "#repoOwner": "repoOwner",
          "#__edb_e__": "__edb_e__",
          "#__edb_v__": "__edb_v__",
        },
        ExpressionAttributeValues: {
          ":stars_u0": 20,
          ":repoName_u0": repoName,
          ":repoOwner_u0": repoOwner,
          ":__edb_e___u0": "repositories",
          ":__edb_v___u0": "1",
        },
        TableName: "electro",
        Key: {
          pk: `$versioncontrol#repoowner_${repoOwner}`,
          sk: `$alerts#repositories_1#reponame_${repoName}`,
        },
      });

      const value = await repositories
        .update({ repoName, repoOwner })
        .data(({ stars, views }, { value, add }) => {
          const newStars = value(stars, 20);
          add(views, newStars);
          add(stars, newStars);
        })
        .go();

      const results = await repositories
        .get({ repoName, repoOwner })
        .go()
        .then((res) => res.data);

      expect(results?.views).to.equal(30);
      expect(results?.stars).to.equal(25);
    });
  });
  describe("update data method value validation", () => {
    it("update should trigger attribute validation functions", () => {
      const counter = {
        cityId: 0,
        mallId: 0,
        storeId: 0,
        buildingId: 0,
        unitId: 0,
        category: 0,
        leaseEndDate: 0,
        rent: 0,
        discount: 0,
        tenant: 0,
        deposit: 0,
        rentalAgreement: 0,
        rentalAgreementChildren: {
          type: 0,
          detail: 0,
        },
        tags: 0,
        contact: 0,
        leaseHolders: 0,
        petFee: 0,
        totalFees: 0,
        listAttribute: 0,
        listAttributeChildren: {
          setAttribute: 0,
        },
        mapAttribute: 0,
        mapAttributeChildren: {
          mapProperty: 0,
        },
      };
      const StoreLocations = new Entity(
        {
          model: {
            service: "MallStoreDirectory",
            entity: "MallStore",
            version: "1",
          },
          attributes: {
            cityId: {
              validate: () => {
                counter.cityId++;
                return true;
              },
              type: "string",
              required: true,
            },
            mallId: {
              validate: () => {
                counter.mallId++;
                return true;
              },
              type: "string",
              required: true,
            },
            storeId: {
              validate: () => {
                counter.storeId++;
                return true;
              },
              type: "string",
              required: true,
            },
            buildingId: {
              validate: () => {
                counter.buildingId++;
                return true;
              },
              type: "string",
              required: true,
            },
            unitId: {
              validate: () => {
                counter.unitId++;
                return true;
              },
              type: "string",
              required: true,
            },
            category: {
              validate: () => {
                counter.category++;
                return true;
              },
              type: [
                "spite store",
                "food/coffee",
                "food/meal",
                "clothing",
                "electronics",
                "department",
                "misc",
              ],
              required: true,
            },
            leaseEndDate: {
              validate: () => {
                counter.leaseEndDate++;
                return true;
              },
              type: "string",
              required: true,
            },
            rent: {
              validate: () => {
                counter.rent++;
                return true;
              },
              type: "number",
              required: true,
            },
            discount: {
              validate: () => {
                counter.discount++;
                return true;
              },
              type: "number",
              required: false,
              default: 0,
            },
            tenant: {
              validate: () => {
                counter.tenant++;
                return true;
              },
              type: "set",
              items: "string",
            },
            deposit: {
              validate: () => {
                counter.deposit++;
                return true;
              },
              type: "number",
            },
            rentalAgreement: {
              validate: () => {
                counter.rentalAgreement++;
                return true;
              },
              type: "list",
              items: {
                type: "map",
                properties: {
                  type: {
                    validate: () => {
                      counter.rentalAgreementChildren.type++;
                      return true;
                    },
                    type: "string",
                    required: true,
                  },
                  detail: {
                    validate: () => {
                      counter.rentalAgreementChildren.detail++;
                      return true;
                    },
                    type: "string",
                    required: true,
                  },
                },
              },
            },
            tags: {
              validate: () => {
                counter.tags++;
                return true;
              },
              type: "set",
              items: "string",
            },
            contact: {
              validate: () => {
                counter.contact++;
                return true;
              },
              type: "set",
              items: "string",
            },
            leaseHolders: {
              validate: () => {
                counter.leaseHolders++;
                return true;
              },
              type: "set",
              items: "string",
            },
            petFee: {
              validate: () => {
                counter.petFee++;
                return true;
              },
              type: "number",
            },
            totalFees: {
              validate: () => {
                counter.totalFees++;
                return true;
              },
              type: "number",
            },
            listAttribute: {
              validate: () => {
                counter.listAttribute++;
                return true;
              },
              type: "list",
              items: {
                type: "map",
                properties: {
                  setAttribute: {
                    validate: () => {
                      counter.listAttributeChildren.setAttribute++;
                      return true;
                    },
                    type: "set",
                    items: "string",
                  },
                },
              },
            },
            mapAttribute: {
              validate: () => {
                counter.mapAttribute++;
                return true;
              },
              type: "map",
              properties: {
                mapProperty: {
                  validate: () => {
                    counter.mapAttributeChildren.mapProperty++;
                    return true;
                  },
                  type: "string",
                },
              },
            },
          },
          indexes: {
            stores: {
              pk: {
                field: "pk",
                composite: ["cityId", "mallId"],
              },
              sk: {
                field: "sk",
                composite: ["buildingId", "storeId"],
              },
            },
            units: {
              index: "gis1pk-gsi1sk-index",
              pk: {
                field: "gis1pk",
                composite: ["mallId"],
              },
              sk: {
                field: "gsi1sk",
                composite: ["buildingId", "unitId"],
              },
            },
            leases: {
              index: "gis2pk-gsi2sk-index",
              pk: {
                field: "gis2pk",
                composite: ["storeId"],
              },
              sk: {
                field: "gsi2sk",
                composite: ["leaseEndDate"],
              },
            },
          },
        },
        { table, client },
      );
      const cityId = uuid();
      const mallId = "EastPointe";
      const storeId = "LatteLarrys";
      const buildingId = "A34";
      StoreLocations.update({ cityId, mallId, storeId, buildingId })
        .data((attr, op) => {
          const newTenant = op.value(attr.tenant, ["larry"]);
          op.set(attr.category, "food/meal");
          op.add(attr.tenant, newTenant);
          op.add(attr.rent, 100);
          op.subtract(attr.deposit, 200);
          op.remove(attr.discount);
          op.append(attr.rentalAgreement, [
            { type: "ammendment", detail: "no soup for you" },
          ]);
          op.delete(attr.tags, ["coffee"]);
          op.del(attr.contact, ["555-345-2222"]);
          op.add(attr.totalFees, 2);
          op.add(attr.leaseHolders, newTenant);
          op.set(attr.mapAttribute.mapProperty, "mapPropertyValue");
        })
        .where((attr, op) => op.eq(attr.category, "food/coffee"))
        .params();

      expect(counter).to.deep.equal({
        cityId: 0, // keys not validated
        mallId: 0, // keys not validated
        storeId: 0, // keys not validated
        buildingId: 0, // keys not validated
        unitId: 0,
        category: 1,
        leaseEndDate: 0,
        rent: 1,
        discount: 0, // deletes do not invoke `validate`
        tenant: 1,
        deposit: 1,
        rentalAgreement: 1,
        rentalAgreementChildren: {
          type: 1,
          detail: 1,
        },
        tags: 1,
        contact: 1,
        leaseHolders: 0, // use of `name()` op kicks electro out of validation flow
        petFee: 0,
        totalFees: 1,
        listAttribute: 0,
        listAttributeChildren: {
          setAttribute: 0,
        },
        mapAttribute: 0,
        mapAttributeChildren: {
          mapProperty: 1,
        },
      });
    });
  });
  describe("string regex validation", () => {
    const entity = new Entity(
      {
        model: {
          entity: "regex_test",
          service: "testing",
          version: "1",
        },
        attributes: {
          stringVal: {
            type: "string",
            validate: /^abc.*/gi,
          },
          map: {
            type: "map",
            properties: {
              nestedString: {
                type: "string",
                validate: /^abc/gi,
              },
              nestedSet: {
                type: "set",
                items: "string",
                validate: /^abc/gi,
              },
              nestedList: {
                type: "list",
                items: {
                  type: "string",
                  validate: /^abc/gi,
                },
              },
            },
          },
          list: {
            type: "list",
            items: {
              type: "string",
              validate: /^abc/gi,
            },
          },
          set: {
            type: "set",
            items: "string",
            validate: /^abc/gi,
          },
        },
        indexes: {
          record: {
            pk: {
              field: "pk",
              composite: ["stringVal"],
            },
            sk: {
              field: "sk",
              composite: [],
            },
          },
        },
      },
      { client, table },
    );
    it("should validate strings", async () => {
      const stringVal = uuid();
      const error = await entity
        .put({ stringVal })
        .go()
        .then(() => false)
        .catch((err) => err.message);
        expect(error).to.be.string(
          'Invalid value for attribute "stringVal": Failed model defined regex',
        );
    });
    it("should validate string sets", async () => {
      const stringVal = `abc${uuid()}`;
      const setValue = ["def"];
      const error = await entity
        .update({ stringVal })
        .set({ set: setValue })
        .go()
        .then(() => false)
        .catch((err) => err.message);
      expect(error).to.be.string(
        'Invalid value for attribute "set": Failed model defined regex',
      );
    });
    it("should validate string lists", async () => {
      const stringVal = `abc${uuid()}`;
      const listValue = ["def"];
      const error = await entity
        .update({ stringVal })
        .set({ list: listValue })
        .go()
        .then(() => false)
        .catch((err) => err.message);
      expect(error).to.be.string(
        'Invalid value for attribute "list[*]": Failed model defined regex',
      );
    });
    it("should validate string map properties", async () => {
      const stringVal = `abc${uuid()}`;
      const nestedString = "def";
      const error = await entity
        .update({ stringVal })
        .set({ map: { nestedString } })
        .go()
        .then(() => false)
        .catch((err) => err.message);
      expect(error).to.be.string(
        'Invalid value for attribute "map.nestedString": Failed model defined regex',
      );
    });
    it("should validate string set map properties", async () => {
      const stringVal = `abc${uuid()}`;
      const nestedSet = ["def"];
      const error = await entity
        .update({ stringVal })
        .set({ map: { nestedSet } })
        .go()
        .then(() => false)
        .catch((err) => err.message);
      expect(error).to.be.string(
        'Invalid value for attribute "map.nestedSet": Failed model defined regex',
      );
    });
    it("should validate string list map properties", async () => {
      const stringVal = `abc${uuid()}`;
      const nestedList = ["def"];
      const error = await entity
        .update({ stringVal })
        .set({ map: { nestedList } })
        .go({ originalErr: true })
        .then(() => false)
        .catch((err) => err.message);
      expect(error).to.be.string(
        'Invalid value for attribute "map.nestedList[*]"',
      );
    });
  });

  it("should perform crud on custom attribute", async () => {
    const entity = new Entity(
      {
        model: {
          service: "any_service",
          entity: uuid(),
          version: "1",
        },
        attributes: {
          prop1: {
            type: "string",
          },
          prop2: {
            type: CustomAttributeType<{
              strProp: string;
              numProp: number;
              maybeProp?: string;
            }>("any"),
          },
        },
        indexes: {
          record: {
            pk: {
              field: "pk",
              composite: ["prop1"],
            },
            sk: {
              field: "sk",
              composite: [],
            },
          },
        },
      },
      { table, client },
    );

    const prop1 = uuid();
    const numProp = 10;
    const strProp = "value1";
    await entity.put({ prop1, prop2: { numProp, strProp } }).go();
    const getVal = await entity.get({ prop1 }).go();
    expect(getVal.data).to.deep.equal({ prop1, prop2: { numProp, strProp } });
    const updated = await entity
      .update({ prop1 })
      .data((attr, op) => {
        op.add(attr.prop2.numProp, numProp);
        op.set(attr.prop2.strProp, "value2");
      })
      .go({ response: "all_new" });
    expect(updated.data.prop2).to.deep.equal({
      numProp: 20,
      strProp: "value2",
    });
  });

  describe("enum sets", () => {
    const prop1 = uuid();
    const STRING_SET = ["ONE", "TWO", "THREE"] as const;
    const STRING_VAL = "ONE";
    const NUM_SET = [1, 2, 3] as const;
    const NUM_VAL = 1;

    it("should allow for enum string set attributes", async () => {
      const entity = new Entity(
        {
          model: {
            service: "any_service",
            entity: uuid(),
            version: "1",
          },
          attributes: {
            prop1: {
              type: "string",
            },
            prop2: {
              type: "set",
              items: STRING_SET,
            },
          },
          indexes: {
            record: {
              pk: {
                field: "pk",
                composite: ["prop1"],
              },
              sk: {
                field: "sk",
                composite: [],
              },
            },
          },
        },
        { table, client },
      );
      await entity
        .put({
          prop1,
          prop2: [STRING_VAL],
        })
        .go();
      const result = await entity.get({ prop1 }).go();
      expect(result.data).to.deep.equal({
        prop1,
        prop2: [STRING_VAL],
      });
    });

    it("should allow for enum number set attributes", async () => {
      const entity = new Entity(
        {
          model: {
            service: "any_service",
            entity: uuid(),
            version: "1",
          },
          attributes: {
            prop1: {
              type: "string",
            },
            prop2: {
              type: "set",
              items: NUM_SET,
            },
          },
          indexes: {
            record: {
              pk: {
                field: "pk",
                composite: ["prop1"],
              },
              sk: {
                field: "sk",
                composite: [],
              },
            },
          },
        },
        { table, client },
      );
      await entity
        .put({
          prop1,
          prop2: [NUM_VAL],
        })
        .go();
      const result = await entity.get({ prop1 }).go();
      expect(result.data).to.deep.equal({
        prop1,
        prop2: [NUM_VAL],
      });
    });

    it("should allow for nested enum string set attributes", async () => {
      const entity = new Entity(
        {
          model: {
            service: "any_service",
            entity: uuid(),
            version: "1",
          },
          attributes: {
            prop1: {
              type: "string",
            },
            prop2: {
              type: "map",
              properties: {
                nested: {
                  type: "set",
                  items: STRING_SET,
                },
              },
            },
          },
          indexes: {
            record: {
              pk: {
                field: "pk",
                composite: ["prop1"],
              },
              sk: {
                field: "sk",
                composite: [],
              },
            },
          },
        },
        { table, client },
      );
      await entity
        .put({
          prop1,
          prop2: {
            nested: [STRING_VAL],
          },
        })
        .go();
      const result = await entity.get({ prop1 }).go();
      expect(result.data).to.deep.equal({
        prop1,
        prop2: {
          nested: [STRING_VAL],
        },
      });
    });

    it("should allow for enum string set attributes", async () => {
      const entity = new Entity(
        {
          model: {
            service: "any_service",
            entity: uuid(),
            version: "1",
          },
          attributes: {
            prop1: {
              type: "string",
            },
            prop2: {
              type: "map",
              properties: {
                nested: {
                  type: "set",
                  items: NUM_SET,
                },
              },
            },
          },
          indexes: {
            record: {
              pk: {
                field: "pk",
                composite: ["prop1"],
              },
              sk: {
                field: "sk",
                composite: [],
              },
            },
          },
        },
        { table, client },
      );
      await entity
        .put({
          prop1,
          prop2: {
            nested: [NUM_VAL],
          },
        })
        .go();
      const result = await entity.get({ prop1 }).go();
      expect(result.data).to.deep.equal({
        prop1,
        prop2: {
          nested: [NUM_VAL],
        },
      });
    });
  });

  describe("custom types", () => {
    it("should allow custom opaque ids", async () => {
      const UniqueKeySymbol: unique symbol = Symbol();
      type EmployeeID = string & { [UniqueKeySymbol]: any };

      const UniqueAgeSymbol: unique symbol = Symbol();
      type Month = number & { [UniqueAgeSymbol]: any };

      const createNewKey = (): EmployeeID => {
        return uuid() as EmployeeID;
      };

      const createMonth = (months: number): Month => {
        return months as Month;
      };

      const person = new Entity(
        {
          model: {
            entity: "personnel",
            service: "workplace",
            version: "1",
          },
          attributes: {
            employeeId: {
              type: CustomAttributeType<EmployeeID>("string"),
            },
            firstName: {
              type: "string",
              required: true,
            },
            lastName: {
              type: "string",
              required: true,
            },
            ageInMonths: {
              type: CustomAttributeType<Month>("number"),
            },
          },
          indexes: {
            record: {
              pk: {
                field: "pk",
                composite: ["employeeId"],
              },
              sk: {
                field: "sk",
                composite: [],
              },
            },
          },
        },
        { table, client },
      );
      const employeeId = createNewKey();
      const item = {
        employeeId,
        firstName: "tyler",
        lastName: "walch",
        ageInMonths: createMonth(400),
      };
      await person.create(item).go();
      const record = await person.get({ employeeId }).go();
      expect(record.data).to.deep.equal(item);
    });

    it("should allow for complex unions", async () => {
      type PersonnelRole =
        | {
            type: "employee";
            startDate: number;
            endDate?: number;
          }
        | {
            type: "contractor";
            contractStartDate: number;
            contractEndDate: number;
          };

      const person = new Entity(
        {
          model: {
            entity: "personnel",
            service: "workplace",
            version: "1",
          },
          attributes: {
            id: {
              type: "string",
            },
            role: {
              type: CustomAttributeType<PersonnelRole>("any"),
              required: true,
            },
          },
          indexes: {
            record: {
              pk: {
                field: "pk",
                composite: ["id"],
              },
              sk: {
                field: "sk",
                composite: [],
              },
            },
          },
        },
        { table, client },
      );
      const id = uuid();
      const role: PersonnelRole = {
        type: "employee",
        startDate: Date.now() - 1000 * 60 * 60 * 24 * 365 * 2,
      };
      const item = { id, role };
      await person.create(item).go();
      const record = await person.get({ id }).go();
      expect(record.data).to.deep.equal(item);
    });
  });

  describe("updating on upsert", () => {
    const createdAt = Date.now();
    const updatedAt = Date.now();
    it("should accept table index composites attributes anywhere in the upsert chain", async () => {
      const serviceName = uuid();
      const UrlEntity = new Entity(
        {
          model: {
            entity: "url",
            version: "1",
            service: serviceName,
          },
          attributes: {
            id: {
              type: "string",
            },
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
            count: {
              type: "number",
            },
            hits: {
              type: "number",
              required: true,
            },
            minimum: {
              type: "number",
            },
            maximum: {
              type: "number",
              readOnly: true,
            },
            secure: {
              type: "boolean",
              readOnly: true,
              required: true,
              default: () => false,
              watch: ["protocol"],
              set: (_, { protocol }) => {
                return protocol === "https";
              },
            },
            protocol: {
              type: "string",
              readOnly: true,
              required: true,
            },
            createdAt: {
              type: "number",
              default: () => createdAt,
              // cannot be modified after created
              readOnly: true,
            },
            updatedAt: {
              type: "number",
              // watch for changes to any attribute
              watch: "*",
              // set current timestamp when updated
              set: () => updatedAt,
              readOnly: true,
            },
          },
          indexes: {
            urls: {
              pk: {
                field: "pk",
                composite: ["id"],
              },
              sk: {
                field: "sk",
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
        { table, client },
      );

      const id = uuid();
      const url = "www.cool.com";
      const citation = "my_citation";
      const description = "my_description";
      const count = 2;
      const hits = 3;
      const minimum = 1;
      const maximum = 20;
      const protocol = "https";
      const params = UrlEntity.upsert({
        // this object contains no composite attributes
        citation,
        protocol,
        description,
      })
        .set({ id, maximum })
        .add({ count })
        .subtract({ hits, minimum })
        .set({ url })
        .params();

      expect(params).to.deep.equal({
        TableName: "electro",
        UpdateExpression:
          "SET #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0, #id = :id_u0, #url = :url_u0, #citation = :citation_u0, #description = :description_u0, #maximum = if_not_exists(#maximum, :maximum_u0), #secure = if_not_exists(#secure, :secure_u0), #protocol = if_not_exists(#protocol, :protocol_u0), #createdAt = if_not_exists(#createdAt, :createdAt_u0), #updatedAt = :updatedAt_u0, #gsi1pk = :gsi1pk_u0, #gsi1sk = :gsi1sk_u0, #hits = (if_not_exists(#hits, :hits_default_value_u0) - :hits_u0), #minimum = (if_not_exists(#minimum, :minimum_default_value_u0) - :minimum_u0) ADD #count :count_u0",
        ExpressionAttributeNames: {
          "#__edb_e__": "__edb_e__",
          "#__edb_v__": "__edb_v__",
          "#id": "id",
          "#url": "url",
          "#citation": "citation",
          "#description": "description",
          "#secure": "secure",
          "#protocol": "protocol",
          "#createdAt": "createdAt",
          "#updatedAt": "updatedAt",
          "#gsi1pk": "gsi1pk",
          "#gsi1sk": "gsi1sk",
          "#count": "count",
          "#maximum": "maximum",
          "#hits": "hits",
          "#minimum": "minimum",
        },
        ExpressionAttributeValues: {
          ":__edb_e___u0": "url",
          ":__edb_v___u0": "1",
          ":id_u0": id,
          ":url_u0": "www.cool.com",
          ":citation_u0": "my_citation",
          ":description_u0": "my_description",
          ":secure_u0": true,
          ":protocol_u0": "https",
          ":createdAt_u0": createdAt,
          ":updatedAt_u0": updatedAt,
          ":gsi1pk_u0": `$${serviceName}`,
          ":gsi1sk_u0": `$url_1#updatedat_${updatedAt}`,
          ":count_u0": count,
          ":maximum_u0": maximum,
          ":hits_u0": hits,
          ":hits_default_value_u0": 0,
          ":minimum_u0": minimum,
          ":minimum_default_value_u0": 0,
        },
        Key: {
          pk: `$${serviceName}#id_${id}`,
          sk: "$url_1#url_www.cool.com",
        },
      });
    });

    it("should perform ifNotExists while performing an upsert", async () => {
      const serviceName = uuid();
      const UrlEntity = new Entity(
        {
          model: {
            entity: "url",
            version: "1",
            service: serviceName,
          },
          attributes: {
            id: {
              type: "string",
            },
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
            count: {
              type: "number",
            },
            hits: {
              type: "number",
              required: true,
            },
            minimum: {
              type: "number",
            },
            maximum: {
              type: "number",
              readOnly: true,
            },
            secure: {
              type: "boolean",
              required: true,
              default: () => false,
              watch: ["protocol"],
              set: (_, { protocol }) => {
                return protocol === "https";
              },
            },
            protocol: {
              type: "string",
              required: true,
            },
            createdAt: {
              type: "number",
              default: () => createdAt,
              // cannot be modified after created
              readOnly: true,
            },
            updatedAt: {
              type: "number",
              // watch for changes to any attribute
              watch: "*",
              // set current timestamp when updated
              set: () => updatedAt,
              readOnly: true,
            },
          },
          indexes: {
            urls: {
              pk: {
                field: "pk",
                composite: ["id"],
              },
              sk: {
                field: "sk",
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
        { table, client },
      );

      const id = uuid();
      const url = "www.cool.com";
      const citation = "my_citation";
      const description = "my_description";
      const count = 2;
      const hits = 3;
      const minimum = 1;
      const maximum = 20;
      const protocol = "https";

      await UrlEntity.upsert({
        id,
        url,
        citation,
        description,
        count,
        hits,
        minimum,
        maximum,
        protocol,
      }).go();

      const firstUpsert = await UrlEntity.get({ id, url }).go();

      expect(firstUpsert.data).to.deep.equal({
        updatedAt,
        createdAt,
        id,
        url,
        citation,
        description,
        count,
        hits,
        minimum,
        maximum,
        protocol,
        secure: true,
      });

      await UrlEntity.upsert({
        id,
        url,
        citation,
        description,
        protocol,
      })
        .ifNotExists({
          minimum: minimum + 50,
          maximum: maximum + 50,
        })
        .add({
          count,
          hits,
        })
        .go();

      const secondUpsert = await UrlEntity.get({ id, url }).go();

      expect(secondUpsert.data).to.deep.equal({
        secure: true,
        updatedAt,
        createdAt,
        id,
        url,
        citation,
        description,
        minimum,
        maximum,
        protocol,
        count: count * 2,
        hits: hits * 2,
      });
    });

    it("should perform ifNotExists while performing a transact upsert", async () => {
      const serviceName = uuid();
      const UrlEntity = new Entity(
        {
          model: {
            entity: "url",
            version: "1",
            service: serviceName,
          },
          attributes: {
            id: {
              type: "string",
            },
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
            count: {
              type: "number",
            },
            hits: {
              type: "number",
              required: true,
            },
            minimum: {
              type: "number",
            },
            maximum: {
              type: "number",
              readOnly: true,
            },
            secure: {
              type: "boolean",
              required: true,
              default: () => false,
              watch: ["protocol"],
              set: (_, { protocol }) => {
                return protocol === "https";
              },
            },
            protocol: {
              type: "string",
              required: true,
            },
            createdAt: {
              type: "number",
              default: () => createdAt,
              // cannot be modified after created
              readOnly: true,
            },
            updatedAt: {
              type: "number",
              // watch for changes to any attribute
              watch: "*",
              // set current timestamp when updated
              set: () => updatedAt,
              readOnly: true,
            },
          },
          indexes: {
            urls: {
              pk: {
                field: "pk",
                composite: ["id"],
              },
              sk: {
                field: "sk",
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
        { table, client },
      );

      const service = new Service({ UrlEntity });

      const id = uuid();
      const url = "www.cool.com";
      const citation = "my_citation";
      const description = "my_description";
      const count = 2;
      const hits = 3;
      const minimum = 1;
      const maximum = 20;
      const protocol = "https";

      await service.transaction.write(({UrlEntity}) => [ 
        UrlEntity.upsert({
          id,
          url,
          citation,
          description,
          count,
          hits,
          minimum,
          maximum,
          protocol,
        }).commit()
      ]).go();

      const firstUpsert = await UrlEntity.get({ id, url }).go();

      expect(firstUpsert.data).to.deep.equal({
        updatedAt,
        createdAt,
        id,
        url,
        citation,
        description,
        count,
        hits,
        minimum,
        maximum,
        protocol,
        secure: true,
      });

      await service.transaction.write(({UrlEntity}) => [
        UrlEntity.upsert({
          id,
          url,
          citation,
          description,
          protocol,
        }).ifNotExists({
            minimum: minimum + 50,
            maximum: maximum + 50,
          })
          .add({
            count,
            hits,
          })
          .commit()
      ]).go();

      const secondUpsert = await UrlEntity.get({ id, url }).go();

      expect(secondUpsert.data).to.deep.equal({
        secure: true,
        updatedAt,
        createdAt,
        id,
        url,
        citation,
        description,
        minimum,
        maximum,
        protocol,
        count: count * 2,
        hits: hits * 2,
      });
    });

    it("should perform add, subtract, and append while performing an upsert", async () => {
      const serviceName = uuid();
      const UrlEntity = new Entity(
        {
          model: {
            entity: "url",
            version: "1",
            service: serviceName,
          },
          attributes: {
            id: {
              type: "string",
            },
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
            count: {
              type: "number",
            },
            hits: {
              type: "number",
              required: true,
            },
            minimum: {
              type: "number",
            },
            maximum: {
              type: "number",
              readOnly: true,
            },
            secure: {
              type: "boolean",
              required: true,
              default: () => false,
              watch: ["protocol"],
              set: (_, { protocol }) => {
                return protocol === "https";
              },
            },
            protocol: {
              type: "string",
              required: true,
            },
            createdAt: {
              type: "number",
              default: () => createdAt,
              // cannot be modified after created
              readOnly: true,
            },
            updatedAt: {
              type: "number",
              // watch for changes to any attribute
              watch: "*",
              // set current timestamp when updated
              set: () => updatedAt,
              readOnly: true,
            },
          },
          indexes: {
            urls: {
              pk: {
                field: "pk",
                composite: ["id"],
              },
              sk: {
                field: "sk",
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
        { table, client },
      );

      const id = uuid();
      const url = "www.cool.com";
      const citation = "my_citation";
      const description = "my_description";
      const count = 2;
      const hits = 3;
      const minimum = 1;
      const maximum = 20;
      const protocol = "https";

      await UrlEntity.upsert({
        // this object contains no composite attributes
        citation,
        protocol,
        description,
      })
        .set({ id, maximum })
        .add({ count })
        .subtract({ hits, minimum })
        .set({ url })
        .go();

      const afterFirstUpsert = await UrlEntity.get({ id, url }).go();

      const afterFirstUpsertExpected = {
        id,
        url,
        citation,
        updatedAt,
        createdAt,
        protocol,
        count,
        maximum,
        description,
        secure: true,
        hits: 0 - hits,
        minimum: 0 - minimum,
      };

      expect(afterFirstUpsert.data).to.deep.equal(afterFirstUpsertExpected);

      await UrlEntity.upsert({
        citation,
        description,
        // protocol changes, so should watcher "secure"
        protocol: "http",
      })
        .set({
          id,
          // different value for readonly maximum
          maximum: maximum * 2,
        })
        .add({ count })
        .subtract({ hits, minimum })
        .set({ url })
        .go();

      const afterSecondUpsert = await UrlEntity.get({ id, url }).go();

      expect(afterSecondUpsert.data).to.deep.equal({
        ...afterFirstUpsertExpected,
        updatedAt,
        createdAt,

        // protocol changed so should watcher attribute
        protocol: "http",
        secure: false,

        // maximum was readOnly so should not have been altered
        maximum: maximum,

        // count was added to count again
        count: afterFirstUpsertExpected.count * count,

        // hits/minimum was subtracted again
        hits: afterFirstUpsertExpected.hits - hits,
        minimum: afterFirstUpsertExpected.minimum - minimum,
      });
    });

    it("should perform add, subtract, and append while performing a transact upsert", async () => {
      const serviceName = uuid();
      const UrlEntity = new Entity(
        {
          model: {
            entity: "url",
            version: "1",
            service: serviceName,
          },
          attributes: {
            id: {
              type: "string",
            },
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
            count: {
              type: "number",
            },
            hits: {
              type: "number",
              required: true,
            },
            minimum: {
              type: "number",
            },
            maximum: {
              type: "number",
              readOnly: true,
            },
            secure: {
              type: "boolean",
              required: true,
              default: () => false,
              watch: ["protocol"],
              set: (_, { protocol }) => {
                return protocol === "https";
              },
            },
            protocol: {
              type: "string",
              required: true,
            },
            createdAt: {
              type: "number",
              default: () => createdAt,
              // cannot be modified after created
              readOnly: true,
            },
            updatedAt: {
              type: "number",
              // watch for changes to any attribute
              watch: "*",
              // set current timestamp when updated
              set: () => updatedAt,
              readOnly: true,
            },
          },
          indexes: {
            urls: {
              pk: {
                field: "pk",
                composite: ["id"],
              },
              sk: {
                field: "sk",
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
        { table, client },
      );

      const service = new Service({ UrlEntity });

      const id = uuid();
      const url = "www.cool.com";
      const citation = "my_citation";
      const description = "my_description";
      const count = 2;
      const hits = 3;
      const minimum = 1;
      const maximum = 20;
      const protocol = "https";

      await service.transaction.write(({UrlEntity}) => [
        UrlEntity.upsert({
            // this object contains no composite attributes
            citation,
            protocol,
            description,
          })
          .set({ id, maximum })
          .add({ count })
          .subtract({ hits, minimum })
          .set({ url })
          .commit()
      ]).go();

      const afterFirstUpsert = await UrlEntity.get({ id, url }).go();

      const afterFirstUpsertExpected = {
        id,
        url,
        citation,
        updatedAt,
        createdAt,
        protocol,
        count,
        maximum,
        description,
        secure: true,
        hits: 0 - hits,
        minimum: 0 - minimum,
      };

      expect(afterFirstUpsert.data).to.deep.equal(afterFirstUpsertExpected);

      await service.transaction.write(({UrlEntity}) => [
        UrlEntity.upsert({
          citation,
          description,
          // protocol changes, so should watcher "secure"
          protocol: "http",
        })
        .set({
          id,
          // different value for readonly maximum
          maximum: maximum * 2,
        })
        .add({ count })
        .subtract({ hits, minimum })
        .set({ url })
        .commit()
      ]).go();

      const afterSecondUpsert = await UrlEntity.get({ id, url }).go();

      expect(afterSecondUpsert.data).to.deep.equal({
        ...afterFirstUpsertExpected,
        updatedAt,
        createdAt,

        // protocol changed so should watcher attribute
        protocol: "http",
        secure: false,

        // maximum was readOnly so should not have been altered
        maximum: maximum,

        // count was added to count again
        count: afterFirstUpsertExpected.count * count,

        // hits/minimum was subtracted again
        hits: afterFirstUpsertExpected.hits - hits,
        minimum: afterFirstUpsertExpected.minimum - minimum,
      });
    });

    // Removing this test, but keeping the event it becomes relevant again -- I think it makes things much more
    // complicated (therefore harder for a user to understand/reason about) to use default values in this way.
    //  it('should utilize default values while performing upsert and result in the same outcomes as create', async () => {
    //     const serviceName = uuid();
    //     const minimumDefault = 4;
    //     const maximumDefault = 8;
    //     const UrlEntity = new Entity(
    //         {
    //             model: {
    //                 entity: "url",
    //                 version: "1",
    //                 service: serviceName,
    //             },
    //             attributes: {
    //                 id: {
    //                     type: 'string',
    //                 },
    //                 url: {
    //                     type: "string",
    //                     required: true,
    //                 },
    //                 citation: {
    //                     type: "string",
    //                     required: true,
    //                 },
    //                 description: {
    //                     type: "string",
    //                     required: false,
    //                 },
    //                 count: {
    //                     type: "number",
    //                 },
    //                 hits: {
    //                     type: "number",
    //                     required: true,
    //                 },
    //                 minimum: {
    //                     type: "number",
    //                     default: minimumDefault,
    //                 },
    //                 maximum: {
    //                     type: 'number',
    //                     default: maximumDefault
    //                 },
    //                 secure: {
    //                     type: 'boolean',
    //                     readOnly: true,
    //                     required: true,
    //                     default: () => false,
    //                     watch: ['protocol'],
    //                     set: (_, { protocol }) => {
    //                         return protocol === 'https';
    //                     }
    //                 },
    //                 protocol: {
    //                     type: 'string',
    //                     readOnly: true,
    //                     required: true,
    //                 },
    //                 createdAt: {
    //                     type: "number",
    //                     default: () => createdAt,
    //                     // cannot be modified after created
    //                     readOnly: true,
    //                 },
    //                 updatedAt: {
    //                     type: "number",
    //                     // watch for changes to any attribute
    //                     watch: "*",
    //                     // set current timestamp when updated
    //                     set: () => updatedAt,
    //                     readOnly: true,
    //                 },
    //             },
    //             indexes: {
    //                 urls: {
    //                     pk: {
    //                         field: "pk",
    //                         composite: ['id'],
    //                     },
    //                     sk: {
    //                         field: 'sk',
    //                         composite: ["url"],
    //                     }
    //                 },
    //                 byUpdated: {
    //                     index: "gsi1pk-gsi1sk-index",
    //                     pk: {
    //                         // map to your GSI Hash/Partition key
    //                         field: "gsi1pk",
    //                         composite: [],
    //                     },
    //                     sk: {
    //                         // map to your GSI Range/Sort key
    //                         field: "gsi1sk",
    //                         composite: ["updatedAt"],
    //                     },
    //                 },
    //             },
    //         },
    //         { table, client }
    //     );
    //
    //     const url = 'www.cool.com';
    //     const citation = 'my_citation';
    //     const description = 'my_description';
    //     const count = 2;
    //     const hits = 3;
    //     const protocol = 'https';
    //
    //     // item1 (and the objects that use it's value as a base)
    //     // purposely avoid defaulted attributes: "minimum" and "maximum".
    //     // They should be set with the defaults set in the model
    //     const item1 = {
    //          id: uuid(),
    //          url,
    //          hits,
    //          count,
    //          protocol,
    //          citation,
    //          description,
    //     };
    //
    //      const item2 = {
    //          ...item1,
    //          id: uuid(),
    //      };
    //
    //      const item3 = {
    //          ...item1,
    //          id: uuid()
    //      };
    //
    //      const item4 = {
    //          ...item1,
    //          id: uuid()
    //      };
    //
    //     // normal create
    //     const createdItem1 = await UrlEntity.create(item1).go();
    //
    //     // normal upsert
    //     const upsertedItem2 = await UrlEntity.upsert(item2).go({ response: 'all_new' });
    //
    //     // upsert with add and subtract
    //     await UrlEntity.upsert(item3)
    //         .add({ minimum: 2 }).subtract({ maximum: 1 }).go();
    //
    //     // create and patch (equivelent of upsert with add and subtract)
    //     await UrlEntity.create(item4).go();
    //     await UrlEntity.patch(item4).add({minimum: 2}).subtract({ maximum: 1 }).go();
    //
    //     const storedItem1 = await UrlEntity.get(item1).go();
    //     const storedItem2 = await UrlEntity.get(item2).go();
    //
    //     // defaults should have been used
    //     expect(storedItem1.data?.minimum).to.equal(minimumDefault);
    //     expect(storedItem1.data?.maximum).to.equal(maximumDefault);
    //
    //     // defaults should have been used
    //     expect(storedItem2.data?.minimum).to.equal(minimumDefault);
    //     expect(storedItem2.data?.maximum).to.equal(maximumDefault);
    //
    //     // items should be identical except their id
    //      expect({
    //          ...storedItem1.data,
    //          id: null,
    //          updatedAt,
    //          createdAt,
    //      }).to.deep.equal({
    //          ...storedItem2.data,
    //          id: null,
    //          updatedAt,
    //          createdAt,
    //      });
    //
    //      // upsert results should equal the item inserted (all_new was used)
    //      expect({
    //          ...storedItem1.data,
    //          id: null,
    //          updatedAt,
    //          createdAt,
    //      }).to.deep.equal({
    //          ...upsertedItem2.data,
    //          updatedAt,
    //          createdAt,
    //          id: null,
    //      });
    //
    //      // upsert results should equal the same as create results (all_new was used)
    //      expect({
    //          ...createdItem1.data,
    //          id: null,
    //          updatedAt,
    //          createdAt,
    //      }).to.deep.equal({
    //          ...upsertedItem2.data,
    //          updatedAt,
    //          createdAt,
    //          id: null,
    //      });
    //
    //      const storedItem3 = await UrlEntity.get(item3).go();
    //      const storedItem4 = await UrlEntity.get(item4).go();
    //
    //     // defaults should have been used and then updated
    //     expect(storedItem3.data?.minimum).to.equal(minimumDefault + 2);
    //     expect(storedItem3.data?.maximum).to.equal(maximumDefault - 1);
    //
    //     // defaults should have been used and then updated
    //     expect(storedItem4.data?.minimum).to.equal(minimumDefault + 2);
    //     expect(storedItem4.data?.maximum).to.equal(maximumDefault - 1);
    //
    //     expect({
    //          ...storedItem3.data,
    //          id: null,
    //          updatedAt,
    //          createdAt,
    //      }).to.deep.equal({
    //          ...storedItem4.data,
    //          id: null,
    //          updatedAt,
    //          createdAt,
    //      });
    // });
  });
});
