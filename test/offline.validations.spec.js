const { model } = require("../src/validations");
const { Entity } = require("../src/entity");
const { expect } = require("chai");
describe("Model Validation", () => {
  it("should throw on incorrect attribute signatures", () => {
    let record = {
      service: "testservice",
      entity: "testentity",
      table: "electro",
      version: "1",
      attributes: {
        prop1: {
          type: 1,
          field: 2,
          label: 3,
          readOnly: "not_bool",
          required: "also_not_bool",
          cast: 4,
          validate: "not_fn_or_regexp",
          get: "not_fn",
          set: "also_not_fn",
        },
      },
      indexes: {
        main: {
          pk: {
            field: "pk",
            facets: ["prop1"],
          },
        },
      },
    };
    expect(() => model(record)).to.throw(
      'instance requires property "model", instance.model is required, instance.attributes.prop1.type is not of a type(s) string,array, instance.attributes.prop1.field is not of a type(s) string, instance.attributes.prop1.label is not of a type(s) string, instance.attributes.prop1.readOnly is not of a type(s) boolean, instance.attributes.prop1.required is not of a type(s) boolean, instance.attributes.prop1.cast is not of a type(s) string, instance.attributes.prop1.cast is not one of enum values: string,number, instance.attributes.prop1.validate must be either a function or Regexp, instance.attributes.prop1.get must be a function, instance.attributes.prop1.set must be a function - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#invalid-model',
    );
  });
  it("should not allow composite attributes to be used more than once in one index if the number of attributes in the sk exceed one", () => {
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
            facets: ["id", "prop3"],
          },
          sk: {
            field: "sk",
            facets: ["date", "prop2", "id", "prop3"],
          },
        },
      },
    };
    expect(() => new Entity(schema)).to.throw(
      `The Access Pattern 'record' contains duplicate references the composite attribute(s): "id", "prop3". Composite attributes can only be used more than once in an index if your sort key is limitted to a single attribute. This is to prevent unexpected runtime errors related to the inability to generate keys. - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#duplicate-index-composite-attributes`,
    );
  });

  it("should allow composite attributes to be used more than once in one index if the number of attributes in the sk equal one", () => {
    const table = "electro";
    const Users = new Entity(
      {
        model: {
          entity: "user",
          service: "",
          version: "1",
        },
        attributes: {
          id: {
            type: "string",
            default: () => "abc",
          },
          name: {
            type: "string",
          },
        },

        indexes: {
          byAccount: {
            pk: {
              field: "pk",
              composite: ["id"],
            },
            sk: {
              field: "sk",
              composite: ["id"],
            },
          },
        },
      },
      { table },
    );

    const create = Users.create({ name: "tyler" }).params();
    const update = Users.update({ id: "abc" })
      .set({ name: "stephanie" })
      .params();
    const deleted = Users.delete({ id: "abc" }).params();
    const get = Users.get({ id: "abc" }).params();
    const query = Users.query.byAccount({ id: "abc" }).params();
    const queryBegins = Users.query
      .byAccount({ id: "abc" })
      .begins({})
      .params();
    const queryBetween = Users.query
      .byAccount({ id: "abc" })
      .between({}, {})
      .params();
    const queryGte = Users.query.byAccount({ id: "abc" }).gte({}).params();
    const queryGt = Users.query.byAccount({ id: "abc" }).gt({}).params();
    const queryLte = Users.query.byAccount({ id: "abc" }).lte({}).params();
    const queryLt = Users.query.byAccount({ id: "abc" }).lt({}).params();
    expect({
      create,
      update,
      deleted,
      get,
      query,
      queryBegins,
      queryBetween,
      queryGte,
      queryGt,
      queryLte,
      queryLt,
    }).to.deep.equal({
      create: {
        Item: {
          id: "abc",
          name: "tyler",
          pk: "$#id_abc",
          sk: "$user_1#id_abc",
          __edb_e__: "user",
          __edb_v__: "1",
        },
        TableName: "electro",
        ConditionExpression:
          "attribute_not_exists(#pk) AND attribute_not_exists(#sk)",
        ExpressionAttributeNames: {
          "#pk": "pk",
          "#sk": "sk",
        },
      },
      update: {
        UpdateExpression:
          "SET #name = :name_u0, #id = :id_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0",
        ExpressionAttributeNames: {
          "#name": "name",
          "#id": "id",
          "#__edb_e__": "__edb_e__",
          "#__edb_v__": "__edb_v__",
        },
        ExpressionAttributeValues: {
          ":name_u0": "stephanie",
          ":id_u0": "abc",
          ":__edb_e___u0": "user",
          ":__edb_v___u0": "1",
        },
        TableName: "electro",
        Key: {
          pk: "$#id_abc",
          sk: "$user_1#id_abc",
        },
      },
      deleted: {
        Key: {
          pk: "$#id_abc",
          sk: "$user_1#id_abc",
        },
        TableName: "electro",
      },
      get: {
        Key: {
          pk: "$#id_abc",
          sk: "$user_1#id_abc",
        },
        TableName: "electro",
      },
      query: {
        KeyConditionExpression: "#pk = :pk and #sk1 = :sk1",
        TableName: "electro",
        ExpressionAttributeNames: {
          "#pk": "pk",
          "#sk1": "sk",
        },
        ExpressionAttributeValues: {
          ":pk": "$#id_abc",
          ":sk1": "$user_1#id_abc",
        },
      },
      queryBegins: {
        KeyConditionExpression: "#pk = :pk and begins_with(#sk1, :sk1)",
        TableName: "electro",
        ExpressionAttributeNames: {
          "#pk": "pk",
          "#sk1": "sk",
        },
        ExpressionAttributeValues: {
          ":pk": "$#id_abc",
          ":sk1": "$user_1#id_abc",
        },
      },
      queryBetween: {
        TableName: "electro",
        ExpressionAttributeNames: {
          "#pk": "pk",
          "#sk1": "sk",
        },
        ExpressionAttributeValues: {
          ":pk": "$#id_abc",
          ":sk1": "$user_1#id_abc",
          ":sk2": "$user_1#id_abc",
        },
        KeyConditionExpression: "#pk = :pk and #sk1 BETWEEN :sk1 AND :sk2",
      },
      queryGte: {
        TableName: "electro",
        ExpressionAttributeNames: {
          "#pk": "pk",
          "#sk1": "sk",
        },
        ExpressionAttributeValues: {
          ":pk": "$#id_abc",
          ":sk1": "$user_1#id_abc",
        },
        KeyConditionExpression: "#pk = :pk and #sk1 >= :sk1",
      },
      queryGt: {
        TableName: "electro",
        ExpressionAttributeNames: {
          "#pk": "pk",
          "#sk1": "sk",
        },
        ExpressionAttributeValues: {
          ":pk": "$#id_abc",
          ":sk1": "$user_1#id_abc",
        },
        KeyConditionExpression: "#pk = :pk and #sk1 > :sk1",
      },
      queryLte: {
        TableName: "electro",
        ExpressionAttributeNames: {
          "#pk": "pk",
          "#sk1": "sk",
        },
        ExpressionAttributeValues: {
          ":pk": "$#id_abc",
          ":sk1": "$user_1#id_abc",
        },
        KeyConditionExpression: "#pk = :pk and #sk1 <= :sk1",
      },
      queryLt: {
        TableName: "electro",
        ExpressionAttributeNames: {
          "#pk": "pk",
          "#sk1": "sk",
        },
        ExpressionAttributeValues: {
          ":pk": "$#id_abc",
          ":sk1": "$user_1#id_abc",
        },
        KeyConditionExpression: "#pk = :pk and #sk1 < :sk1",
      },
    });
  });

  it("should allow composite attributes to be used more than once in one index if the number of attributes in the sk equal one and pk attributes is greater than one", () => {
    const table = "electro";
    const Users = new Entity(
      {
        model: {
          entity: "user",
          service: "",
          version: "1",
        },
        attributes: {
          id: {
            type: "string",
            default: () => "abc",
          },
          accountId: {
            type: "string",
          },
          name: {
            type: "string",
          },
        },

        indexes: {
          byAccount: {
            pk: {
              field: "pk",
              composite: ["accountId", "id"],
            },
            sk: {
              field: "sk",
              composite: ["id"],
            },
          },
        },
      },
      { table },
    );

    const create = Users.create({ name: "tyler", accountId: "acct1" }).params();
    const update = Users.update({ id: "abc", accountId: "acct1" })
      .set({ name: "stephanie" })
      .params();
    const deleted = Users.delete({ id: "abc", accountId: "acct1" }).params();
    const get = Users.get({ id: "abc", accountId: "acct1" }).params();
    const query = Users.query
      .byAccount({ id: "abc", accountId: "acct1" })
      .params();
    const queryBegins = Users.query
      .byAccount({ id: "abc", accountId: "acct1" })
      .begins({})
      .params();
    const queryBetween = Users.query
      .byAccount({ id: "abc", accountId: "acct1" })
      .between({}, {})
      .params();
    const queryGte = Users.query
      .byAccount({ id: "abc", accountId: "acct1" })
      .gte({})
      .params();
    const queryGt = Users.query
      .byAccount({ id: "abc", accountId: "acct1" })
      .gt({})
      .params();
    const queryLte = Users.query
      .byAccount({ id: "abc", accountId: "acct1" })
      .lte({})
      .params();
    const queryLt = Users.query
      .byAccount({ id: "abc", accountId: "acct1" })
      .lt({})
      .params();

    expect({
      create,
      update,
      deleted,
      get,
      query,
      queryBegins,
      queryBetween,
      queryGte,
      queryGt,
      queryLte,
      queryLt,
    }).to.deep.equal({
      create: {
        Item: {
          id: "abc",
          accountId: "acct1",
          name: "tyler",
          pk: "$#accountid_acct1#id_abc",
          sk: "$user_1#id_abc",
          __edb_e__: "user",
          __edb_v__: "1",
        },
        TableName: "electro",
        ConditionExpression:
          "attribute_not_exists(#pk) AND attribute_not_exists(#sk)",
        ExpressionAttributeNames: {
          "#pk": "pk",
          "#sk": "sk",
        },
      },
      update: {
        UpdateExpression:
          "SET #name = :name_u0, #accountId = :accountId_u0, #id = :id_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0",
        ExpressionAttributeNames: {
          "#name": "name",
          "#accountId": "accountId",
          "#id": "id",
          "#__edb_e__": "__edb_e__",
          "#__edb_v__": "__edb_v__",
        },
        ExpressionAttributeValues: {
          ":name_u0": "stephanie",
          ":accountId_u0": "acct1",
          ":id_u0": "abc",
          ":__edb_e___u0": "user",
          ":__edb_v___u0": "1",
        },
        TableName: "electro",
        Key: {
          pk: "$#accountid_acct1#id_abc",
          sk: "$user_1#id_abc",
        },
      },
      deleted: {
        Key: {
          pk: "$#accountid_acct1#id_abc",
          sk: "$user_1#id_abc",
        },
        TableName: "electro",
      },
      get: {
        Key: {
          pk: "$#accountid_acct1#id_abc",
          sk: "$user_1#id_abc",
        },
        TableName: "electro",
      },
      query: {
        KeyConditionExpression: "#pk = :pk and #sk1 = :sk1",
        TableName: "electro",
        ExpressionAttributeNames: {
          "#pk": "pk",
          "#sk1": "sk",
        },
        ExpressionAttributeValues: {
          ":pk": "$#accountid_acct1#id_abc",
          ":sk1": "$user_1#id_abc",
        },
      },
      queryBegins: {
        KeyConditionExpression: "#pk = :pk and begins_with(#sk1, :sk1)",
        TableName: "electro",
        ExpressionAttributeNames: {
          "#pk": "pk",
          "#sk1": "sk",
        },
        ExpressionAttributeValues: {
          ":pk": "$#accountid_acct1#id_abc",
          ":sk1": "$user_1#id_abc",
        },
      },
      queryBetween: {
        TableName: "electro",
        ExpressionAttributeNames: {
          "#pk": "pk",
          "#sk1": "sk",
        },
        ExpressionAttributeValues: {
          ":pk": "$#accountid_acct1#id_abc",
          ":sk1": "$user_1#id_abc",
          ":sk2": "$user_1#id_abc",
        },
        KeyConditionExpression: "#pk = :pk and #sk1 BETWEEN :sk1 AND :sk2",
      },
      queryGte: {
        TableName: "electro",
        ExpressionAttributeNames: {
          "#pk": "pk",
          "#sk1": "sk",
        },
        ExpressionAttributeValues: {
          ":pk": "$#accountid_acct1#id_abc",
          ":sk1": "$user_1#id_abc",
        },
        KeyConditionExpression: "#pk = :pk and #sk1 >= :sk1",
      },
      queryGt: {
        TableName: "electro",
        ExpressionAttributeNames: {
          "#pk": "pk",
          "#sk1": "sk",
        },
        ExpressionAttributeValues: {
          ":pk": "$#accountid_acct1#id_abc",
          ":sk1": "$user_1#id_abc",
        },
        KeyConditionExpression: "#pk = :pk and #sk1 > :sk1",
      },
      queryLte: {
        TableName: "electro",
        ExpressionAttributeNames: {
          "#pk": "pk",
          "#sk1": "sk",
        },
        ExpressionAttributeValues: {
          ":pk": "$#accountid_acct1#id_abc",
          ":sk1": "$user_1#id_abc",
        },
        KeyConditionExpression: "#pk = :pk and #sk1 <= :sk1",
      },
      queryLt: {
        TableName: "electro",
        ExpressionAttributeNames: {
          "#pk": "pk",
          "#sk1": "sk",
        },
        ExpressionAttributeValues: {
          ":pk": "$#accountid_acct1#id_abc",
          ":sk1": "$user_1#id_abc",
        },
        KeyConditionExpression: "#pk = :pk and #sk1 < :sk1",
      },
    });
  });

  it("should allow composite attributes to be used more than once in one index if the number of attributes in the sk equal one (custom keys)", () => {
    const table = "electro";
    const Users = new Entity(
      {
        model: {
          entity: "user",
          service: "",
          version: "1",
        },
        attributes: {
          id: {
            type: "string",
            default: () => "abc",
          },
          name: {
            type: "string",
          },
        },

        indexes: {
          byAccount: {
            pk: {
              field: "pk",
              composite: ["id"],
              template: "USER#${id}",
              casing: "none",
            },
            sk: {
              field: "sk",
              composite: ["id"],
              template: "USER#${id}",
              casing: "none",
            },
          },
          emailIndex: {
            index: "gsi1",
            pk: { field: "GSI1PK", composite: [] },
            sk: { field: "GSI1SK", composite: [] },
          },
        },
      },
      { table },
    );

    const create = Users.create({ name: "tyler" }).params();
    const update = Users.update({ id: "abc" })
      .set({ name: "stephanie" })
      .params();
    const deleted = Users.delete({ id: "abc" }).params();
    const get = Users.get({ id: "abc" }).params();
    const query = Users.query.byAccount({ id: "abc" }).params();
    expect({
      create,
      update,
      deleted,
      get,
      query,
    }).to.deep.equal({
      create: {
        Item: {
          id: "abc",
          name: "tyler",
          pk: "USER#abc",
          sk: "USER#abc",
          __edb_e__: "user",
          __edb_v__: "1",
        },
        TableName: "electro",
        ConditionExpression:
          "attribute_not_exists(#pk) AND attribute_not_exists(#sk)",
        ExpressionAttributeNames: {
          "#pk": "pk",
          "#sk": "sk",
        },
      },
      update: {
        UpdateExpression:
          "SET #name = :name_u0, #id = :id_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0",
        ExpressionAttributeNames: {
          "#name": "name",
          "#id": "id",
          "#__edb_e__": "__edb_e__",
          "#__edb_v__": "__edb_v__",
        },
        ExpressionAttributeValues: {
          ":name_u0": "stephanie",
          ":id_u0": "abc",
          ":__edb_e___u0": "user",
          ":__edb_v___u0": "1",
        },
        TableName: "electro",
        Key: {
          pk: "USER#abc",
          sk: "USER#abc",
        },
      },
      deleted: {
        Key: {
          pk: "USER#abc",
          sk: "USER#abc",
        },
        TableName: "electro",
      },
      get: {
        Key: {
          pk: "USER#abc",
          sk: "USER#abc",
        },
        TableName: "electro",
      },
      query: {
        KeyConditionExpression: "#pk = :pk and #sk1 = :sk1",
        TableName: "electro",
        ExpressionAttributeNames: {
          "#pk": "pk",
          "#sk1": "sk",
        },
        ExpressionAttributeValues: {
          ":pk": "USER#abc",
          ":sk1": "USER#abc",
        },
      },
    });
  });

  it("should not allow index fields to be used more than once in across indexes: duplicate pk/sk", () => {
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
            facets: ["id", "prop3"],
          },
          sk: {
            field: "pk",
            facets: ["date", "prop2"],
          },
        },
      },
    };
    expect(() => new Entity(schema)).to.throw(
      "The Access Pattern 'record' references the field 'pk' as the field name for both the PK and SK. Fields used for indexes need to be unique to avoid conflicts. - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#duplicate-index-fields",
    );
  });
});
