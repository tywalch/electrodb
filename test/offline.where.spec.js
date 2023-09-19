const { expect } = require("chai");
let { Entity } = require("../src/entity");

let model = {
  table: "electro",
  model: {
    service: "tests",
    entity: "filters",
    version: "1",
  },
  attributes: {
    pen: {
      type: "string",
      field: "p",
    },
    row: {
      type: "string",
      required: true,
      field: "r",
    },
    animal: {
      type: "string",
      required: true,
      field: "a",
    },
    dangerous: {
      type: "boolean",
      field: "d",
    },
    complex: {
      type: "any",
      field: "c",
    },
  },
  filters: {},
  indexes: {
    farm: {
      pk: {
        field: "pk",
        facets: ["pen"],
      },
      sk: {
        field: "sk",
        facets: ["row"],
      },
    },
  },
};

let WhereTests = new Entity(model);

let pen = "PEN_NAME";
let animals = [
  "Chicken",
  "Chick",
  "Cow",
  "Dog",
  "Pig",
  "Rooster",
  "Shark",
  "Sheep",
];

describe("Offline Where", () => {
  it("Should allow where clauses to return empty strings", () => {
    let animals = WhereTests.query
      .farm({ pen })
      .where(() => "")
      .where(() => "")
      .where(() => "")
      .params();

    expect(animals).to.deep.equal({
      KeyConditionExpression: "#pk = :pk and begins_with(#sk1, :sk1)",
      TableName: "electro",
      ExpressionAttributeNames: { "#pk": "pk", "#sk1": "sk" },
      ExpressionAttributeValues: {
        ":pk": "$tests#pen_pen_name",
        ":sk1": "$filters_1#row_",
      },
    });
  });
  it("Should filter 'eq' with 'where'", () => {
    let animals = WhereTests.query
      .farm({ pen })
      .where(({ animal }, op) => op.eq(animal, "Cow"))
      .params();

    expect(animals).to.deep.equal({
      KeyConditionExpression: "#pk = :pk and begins_with(#sk1, :sk1)",
      TableName: "electro",
      ExpressionAttributeNames: { "#animal": "a", "#pk": "pk", "#sk1": "sk" },
      ExpressionAttributeValues: {
        ":animal0": "Cow",
        ":pk": "$tests#pen_pen_name",
        ":sk1": "$filters_1#row_",
      },
      FilterExpression: "#animal = :animal0",
    });
  });

  it("Should allow for complex types in where clause", () => {
    let params = WhereTests.query
      .farm({ pen })
      .where(
        ({ complex }, { gte }) => `
				${gte(complex[0].coordinates.y, -56.0344)}
			`,
      )
      .params();
    expect(params).to.deep.equal({
      KeyConditionExpression: "#pk = :pk and begins_with(#sk1, :sk1)",
      TableName: "electro",
      ExpressionAttributeNames: {
        "#complex": "c",
        "#coordinates": "coordinates",
        "#y": "y",
        "#pk": "pk",
        "#sk1": "sk",
      },
      ExpressionAttributeValues: {
        ":complex0": -56.0344,
        ":pk": `$tests#pen_${pen.toLowerCase()}`,
        ":sk1": "$filters_1#row_",
      },
      FilterExpression: "#complex[0].#coordinates.#y >= :complex0",
    });
  });

  it("Should not allow random values to passed to where operations", () => {
    let query = () =>
      WhereTests.query
        .farm({ pen })
        .where((attr, op) => op.eq({}, "invalid"))
        .params();
    expect(query).to.throw(
      `Invalid Attribute in where clause passed to operation 'eq'. Use injected attributes only.`,
    );
  });

  it("Must validate the response of a where clause callback is a string", () => {
    let query = () =>
      WhereTests.query
        .farm({ pen })
        .where((attr, op) => null)
        .params();
    expect(query).to.throw(
      "Invalid response from where clause callback. Expected return result to be of type string",
    );
  });

  it("Where clause should be able to be used more than once, which will cause an implicit 'and'", () => {
    let params = WhereTests.query
      .farm({ pen })
      .where(({ animal }, { eq }) => eq(animal, "Chicken"))
      .where(({ dangerous }, { eq }) => eq(dangerous, true))
      .params();
    expect(params).to.deep.equal({
      KeyConditionExpression: "#pk = :pk and begins_with(#sk1, :sk1)",
      TableName: "electro",
      ExpressionAttributeNames: {
        "#animal": "a",
        "#dangerous": "d",
        "#pk": "pk",
        "#sk1": "sk",
      },
      ExpressionAttributeValues: {
        ":animal0": "Chicken",
        ":dangerous0": true,
        ":pk": `$tests#pen_${pen.toLowerCase()}`,
        ":sk1": "$filters_1#row_",
      },
      FilterExpression: "(#animal = :animal0) AND #dangerous = :dangerous0",
    });
  });
  it("Should apply the where clause as condition expression for mutation methods", () => {
    let deleteParams = WhereTests.delete({ pen: "abc", row: "def" })
      .where((attr, op) => op.eq(attr.animal, "cow"))
      .params();
    let removeParams = WhereTests.remove({ pen: "abc", row: "def" })
      .where((attr, op) => op.eq(attr.animal, "cow"))
      .params();
    let updateParams = WhereTests.update({ pen: "abc", row: "def" })
      .set({ dangerous: false })
      .where((attr, op) => op.eq(attr.animal, "cow"))
      .params();
    let patchParams = WhereTests.patch({ pen: "abc", row: "def" })
      .set({ dangerous: false })
      .where((attr, op) => op.eq(attr.animal, "cow"))
      .params();

    expect(deleteParams).to.deep.equal({
      Key: { pk: "$tests#pen_abc", sk: "$filters_1#row_def" },
      TableName: "electro",
      ConditionExpression: "#animal = :animal0",
      ExpressionAttributeNames: { "#animal": "a" },
      ExpressionAttributeValues: { ":animal0": "cow" },
    });

    expect(removeParams).to.deep.equal({
      Key: { pk: "$tests#pen_abc", sk: "$filters_1#row_def" },
      TableName: "electro",
      ConditionExpression:
        "attribute_exists(#pk) AND attribute_exists(#sk) AND #animal = :animal0",
      ExpressionAttributeNames: { "#animal": "a", "#pk": "pk", "#sk": "sk" },
      ExpressionAttributeValues: { ":animal0": "cow" },
    });

    expect(updateParams).to.deep.equal({
      UpdateExpression:
        "SET #dangerous = :dangerous_u0, #pen = :pen_u0, #row = :row_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0",
      ExpressionAttributeNames: {
        "#animal": "a",
        "#dangerous": "d",
        "#pen": "pen",
        "#row": "row",
        "#__edb_e__": "__edb_e__",
        "#__edb_v__": "__edb_v__",
      },
      ExpressionAttributeValues: {
        ":animal0": "cow",
        ":dangerous_u0": false,
        ":pen_u0": "abc",
        ":row_u0": "def",
        ":__edb_e___u0": "filters",
        ":__edb_v___u0": "1",
      },
      TableName: "electro",
      Key: { pk: "$tests#pen_abc", sk: "$filters_1#row_def" },
      ConditionExpression: "#animal = :animal0",
    });

    expect(patchParams).to.deep.equal({
      UpdateExpression:
        "SET #dangerous = :dangerous_u0, #pen = :pen_u0, #row = :row_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0",
      ExpressionAttributeNames: {
        "#animal": "a",
        "#dangerous": "d",
        "#pen": "pen",
        "#row": "row",
        "#__edb_e__": "__edb_e__",
        "#__edb_v__": "__edb_v__",
        "#pk": "pk",
        "#sk": "sk",
      },
      ExpressionAttributeValues: {
        ":animal0": "cow",
        ":dangerous_u0": false,
        ":pen_u0": "abc",
        ":row_u0": "def",
        ":__edb_e___u0": "filters",
        ":__edb_v___u0": "1",
      },
      TableName: "electro",
      Key: { pk: "$tests#pen_abc", sk: "$filters_1#row_def" },
      ConditionExpression:
        "attribute_exists(#pk) AND attribute_exists(#sk) AND #animal = :animal0",
    });
  });
});
