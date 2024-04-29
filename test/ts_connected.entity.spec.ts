import { DocumentClient, PutItemInput } from "aws-sdk/clients/dynamodb";
import { Entity, EntityRecord, createWriteTransaction, ElectroEvent } from "../";
import { expect } from "chai";
import { v4 as uuid } from "uuid";
const u = require("../src/util");

type ConversionTest = {
  item: any;
  keys: any;
  success: boolean;
  target: "byCategory" | "byOrganization" | "top";
  description: string;
  error: string;
  strict?: "all" | "pk" | "none";
};

const conversionTests: ConversionTest[] = require("./conversions");

const client = new DocumentClient({
  endpoint: process.env.LOCAL_DYNAMO_ENDPOINT ?? "http://localhost:8000",
  region: "us-east-1",
});

const table = "electro";

describe("conversions", () => {
  const table = "electro";
  const serviceName = uuid();
  const entity = new Entity(
    {
      model: {
        entity: uuid(),
        version: "1",
        service: serviceName,
      },
      attributes: {
        organizationId: {
          type: "string",
        },
        accountId: {
          type: "string",
        },
        name: {
          type: "string",
        },
        description: {
          type: "string",
        },
        city: {
          type: "string",
        },
        county: {
          type: "string",
        },
        state: {
          type: "string",
        },
        count: {
          type: "number",
        },
        kind: {
          type: "string",
        },
      },
      indexes: {
        defaultKeyStructure: {
          collection: "defaultKeyCollection",
          pk: {
            field: "pk",
            composite: ["organizationId", "state"],
          },
          sk: {
            field: "sk",
            composite: ["accountId", "name"],
          },
        },
        customKeyStructure: {
          collection: "customKeyCollection",
          index: "gsi1pk-gsi1sk-index",
          pk: {
            field: "gsi1pk",
            composite: ["name"],
            template: "location#${name}",
          },
          sk: {
            field: "gsi1sk",
            composite: ["state", "county", "city"],
            template: "state#${state}#county#${county}#city#${city}e1",
          },
        },
        pkOnlyDefaultKeyStructure: {
          index: "gsi2pk-gsi2sk-index",
          pk: {
            field: "gsi2pk",
            composite: ["organizationId", "state"],
          },
        },
        pkOnlyCustomKeyStructure: {
          index: "gsi3pk-gsi3sk-index",
          pk: {
            field: "gsi3pk",
            composite: ["name"],
            template: "location#${name}",
          },
        },
        attributeRefKeyStructure: {
          collection: "attributeRefKeyStructureCollection",
          index: "gsi4pk-gsi4sk-index",
          pk: {
            field: "gsi4pk",
            composite: ["kind"],
            template: "${kind}",
          },
          sk: {
            field: "gsi4sk",
            composite: ["count"],
            template: "${count}",
          },
        },

        defaultKeyStructureClustered: {
          type: "clustered",
          index: "gsi5pk-gsi5sk-index",
          collection: "defaultKeyClusteredCollection",
          pk: {
            field: "gsi5pk",
            composite: ["organizationId", "state"],
          },
          sk: {
            field: "gsi5sk",
            composite: ["accountId", "name"],
          },
        },
        customKeyStructureClustered: {
          type: "clustered",
          collection: "customKeyClusteredCollection",
          index: "gsi6pk-gsi6sk-index",
          pk: {
            field: "gsi6pk",
            composite: ["name"],
            template: "location#${name}",
          },
          sk: {
            field: "gsi6sk",
            composite: ["state", "county", "city"],
            template: "state#${state}#county#${county}#city#${city}e1",
          },
        },
        attributeRefKeyStructureClustered: {
          type: "clustered",
          collection: "attributeRefKeyStructureClusteredCollectionClustered",
          index: "gsi9pk-gsi9sk-index",
          pk: {
            field: "gsi9pk",
            composite: ["kind"],
            template: "${kind}",
          },
          sk: {
            field: "gsi9sk",
            composite: ["count"],
            template: "${count}",
          },
        },

        defaultKeyStructureClusteredCaseless: {
          type: "clustered",
          index: "gsi10pk-gsi10sk-index",
          collection: "defaultKeyClusteredCaselessCollection",
          pk: {
            field: "gsi10pk",
            composite: ["organizationId", "state"],
            casing: "none",
          },
          sk: {
            field: "gsi10sk",
            composite: ["accountId", "name"],
            casing: "none",
          },
        },
        customKeyStructureClusteredCaseless: {
          type: "clustered",
          collection: "customKeyClusteredCaselessCollection",
          index: "gsi11pk-gsi11sk-index",
          pk: {
            field: "gsi11pk",
            composite: ["name"],
            template: "location#${name}",
            casing: "none",
          },
          sk: {
            field: "gsi11sk",
            composite: ["state", "county", "city"],
            casing: "none",
            template: "state#${state}#county#${county}#city#${city}e1",
          },
        },
        pkOnlyDefaultKeyStructureClusteredCaseless: {
          index: "gsi12pk-gsi12sk-index",
          pk: {
            field: "gsi12pk",
            casing: "none",
            composite: ["organizationId", "state"],
          },
        },
        pkOnlyCustomKeyStructureClusteredCaseless: {
          index: "gsi13pk-gsi13sk-index",
          pk: {
            field: "gsi13pk",
            casing: "none",
            composite: ["name"],
            template: "location#${name}",
          },
        },
        attributeRefKeyStructureClusteredCaseless: {
          type: "clustered",
          collection: "attributeRefKeyStructureClusteredCollection",
          index: "gsi14pk-gsi14sk-index",
          pk: {
            field: "gsi14pk",
            casing: "none",
            composite: ["kind"],
            template: "${kind}",
          },
          sk: {
            field: "gsi14sk",
            casing: "none",
            composite: ["count"],
            template: "${count}",
          },
        },
      },
    },
    { table, client },
  );

  const validateMatchingCorrespondence = (options: {
    label: string;
    pkComposite: string[];
    skComposite: string[];
    provided: Record<string, any>;
    composite: Record<string, any>;
  }): void => {
    const { label, pkComposite, skComposite, composite, provided } = options;
    try {
      expect(pkComposite.length + skComposite.length).to.be.greaterThan(0);
      expect(Object.keys(provided).length).to.be.greaterThan(0);
      expect(Object.keys(composite).length).to.be.greaterThan(0);

      for (const attribute of pkComposite) {
        const compositeValue = composite[attribute];
        expect(compositeValue).to.not.be.undefined;

        const itemValue = provided[attribute];
        expect(itemValue).to.not.be.undefined;
        expect(`${itemValue}`.toLowerCase()).to.equal(
          `${compositeValue}`.toLowerCase(),
        );
      }
      let skBroken = false;
      for (const attribute of skComposite) {
        const compositeValue = composite[attribute];

        const itemValue = provided[attribute];

        if (itemValue === undefined) {
          skBroken = true;
        }

        if (compositeValue === undefined && itemValue !== undefined) {
          throw new Error("Composite broken but should not be");
        }

        expect(`${itemValue}`.toLowerCase()).to.equal(
          `${compositeValue}`.toLowerCase(),
        );
      }
    } catch (err: any) {
      err.message = `${label}: ${err.message}`;
      throw err;
    }
  };

  const evaluateFromComposite = (item: typeof record) => {
    const cursor = entity.conversions.fromComposite.toCursor(item);
    expect(cursor).not.to.be.null;

    const keys = entity.conversions.fromComposite.toKeys(item);
    expect(keys).not.to.be.null;

    const cursorFromKeys = entity.conversions.fromKeys.toCursor(keys!);
    expect(cursorFromKeys).not.to.be.null;
    expect(cursor).to.equal(cursorFromKeys);

    const keysFromCursor = entity.conversions.fromCursor.toKeys(cursor!);
    expect(keysFromCursor).not.to.be.null;

    const compositeFromCursor = entity.conversions.fromCursor.toComposite(
      cursor!,
    );
    expect(compositeFromCursor).not.to.be.null;

    const compositeFromKeys = entity.conversions.fromKeys.toComposite(keys!);
    expect(compositeFromKeys).not.to.be.null;
    expect(keys).to.deep.equal(keysFromCursor);

    expect(Object.entries(compositeFromCursor!).length).to.be.greaterThan(0);

    for (const [accessPattern, definition] of Object.entries(
      entity.schema.indexes,
    )) {
      try {
        validateMatchingCorrespondence({
          label: `${accessPattern} from cursor`,
          skComposite:
            "sk" in definition && definition.sk.composite
              ? definition.sk.composite
              : [],
          pkComposite: definition.pk.composite,
          composite: compositeFromCursor!,
          provided: item,
        });

        validateMatchingCorrespondence({
          label: `${accessPattern} from keys`,
          skComposite:
            "sk" in definition && definition.sk.composite
              ? definition.sk.composite
              : [],
          pkComposite: definition.pk.composite,
          composite: compositeFromKeys!,
          provided: item,
        });
      } catch (err) {
        console.log({
          decodedCursor: u.cursorFormatter.deserialize(cursor),
          item,
          cursor,
          keys,
          cursorFromKeys,
          keysFromCursor,
          compositeFromCursor,
          compositeFromKeys,
        });
        throw err;
      }
    }
  };

  const evaluateFromKeys = (keys: any) => {
    const item = entity.conversions.fromKeys.toComposite(keys);
    if (!item) {
      throw new Error("Item not defined!");
    }
    // @ts-ignore
    const cursor = entity.conversions.fromComposite.toCursor(item);
    expect(cursor).not.to.be.null;

    const keysFromCursor = entity.conversions.fromCursor.toKeys(cursor!);
    expect(keysFromCursor).not.to.be.null;

    const cursorFromKeys = entity.conversions.fromKeys.toCursor(
      keysFromCursor!,
    );
    expect(cursorFromKeys).not.to.be.null;
    expect(cursor).to.equal(cursorFromKeys);

    const compositeFromCursor = entity.conversions.fromCursor.toComposite(
      cursor!,
    );
    expect(compositeFromCursor).not.to.be.null;

    // @ts-ignore
    const keysFromComposite = entity.conversions.fromComposite.toKeys(item);
    expect(keysFromComposite).not.to.be.null;
    expect(keysFromCursor).to.deep.equal(keysFromComposite);

    const compositeFromKeys = entity.conversions.fromKeys.toComposite(
      keysFromComposite!,
    );

    expect(Object.entries(compositeFromCursor!).length).to.be.greaterThan(0);
    expect(!!compositeFromKeys).to.be.true;
    for (const [accessPattern, definition] of Object.entries(
      entity.schema.indexes,
    )) {
      try {
        validateMatchingCorrespondence({
          label: `${accessPattern} from cursor`,
          skComposite:
            "sk" in definition && definition.sk.composite
              ? definition.sk.composite
              : [],
          pkComposite: definition.pk.composite,
          composite: compositeFromCursor!,
          provided: item,
        });

        validateMatchingCorrespondence({
          label: `${accessPattern} from keys`,
          skComposite:
            "sk" in definition && definition.sk.composite
              ? definition.sk.composite
              : [],
          pkComposite: definition.pk.composite,
          composite: compositeFromKeys!,
          provided: item,
        });
      } catch (err) {
        console.log({
          decodedCursor: u.cursorFormatter.deserialize(cursor),
          keys,
          item,
          cursor,
          cursorFromKeys,
          keysFromCursor,
          compositeFromCursor,
          keysFromComposite,
          compositeFromKeys,
          definition,
        });
        throw err;
      }
    }
  };

  const evaluateAccessPattern = (
    accessPattern: keyof typeof entity.schema.indexes,
    item: typeof record,
  ) => {
    const cursor =
      entity.conversions.byAccessPattern[accessPattern].fromComposite.toCursor(
        item,
      );
    expect(cursor).not.to.be.null;

    const keys =
      entity.conversions.byAccessPattern[accessPattern].fromComposite.toKeys(
        item,
      );
    expect(keys).not.to.be.null;

    const cursorFromKeys = entity.conversions.byAccessPattern[
      accessPattern
    ].fromKeys.toCursor(keys!);
    expect(cursorFromKeys).not.to.be.null;
    expect(cursor).to.equal(cursorFromKeys);

    const keysFromCursor = entity.conversions.byAccessPattern[
      accessPattern
    ].fromCursor.toKeys(cursor!);
    expect(keysFromCursor).not.to.be.null;

    const compositeFromCursor = entity.conversions.byAccessPattern[
      accessPattern
    ].fromCursor.toComposite(cursor!);
    expect(compositeFromCursor).not.to.be.null;

    const compositeFromKeys = entity.conversions.byAccessPattern[
      accessPattern
    ].fromKeys.toComposite(keys!);
    expect(compositeFromKeys).not.to.be.null;
    expect(keys).to.deep.equal(keysFromCursor);

    expect(Object.entries(compositeFromCursor!).length).to.be.greaterThan(0);
    const definition = entity.schema.indexes[accessPattern];
    try {
      validateMatchingCorrespondence({
        label: `${accessPattern} from cursor`,
        skComposite:
          "sk" in definition && definition.sk.composite
            ? definition.sk.composite
            : [],
        pkComposite: definition.pk.composite,
        composite: compositeFromCursor!,
        provided: item,
      });

      validateMatchingCorrespondence({
        label: `${accessPattern} from keys`,
        skComposite:
          "sk" in definition && definition.sk.composite
            ? definition.sk.composite
            : [],
        pkComposite: definition.pk.composite,
        composite: compositeFromKeys!,
        provided: item,
      });
    } catch (err) {
      console.log({
        decodedCursor: u.cursorFormatter.deserialize(cursor),
        accessPattern,
        item,
        cursor,
        keys,
        cursorFromKeys,
        keysFromCursor,
        compositeFromCursor,
        compositeFromKeys,
        definition,
      });
      throw err;
    }
  };

  const evaluateAccessPatternFromKeys = (
    accessPattern: keyof typeof entity.schema.indexes,
    keys: any,
  ) => {
    const item =
      entity.conversions.byAccessPattern[accessPattern].fromKeys.toComposite(
        keys,
      );
    if (!item) {
      throw new Error("Item not defined!");
    }
    // @ts-ignore
    const cursor = entity.conversions.byAccessPattern[accessPattern].fromComposite.toCursor(item);
    expect(cursor).not.to.be.null;

    const keysFromCursor = entity.conversions.byAccessPattern[
      accessPattern
    ].fromCursor.toKeys(cursor!);
    expect(keysFromCursor).not.to.be.null;

    const cursorFromKeys = entity.conversions.byAccessPattern[
      accessPattern
    ].fromKeys.toCursor(keysFromCursor!);
    expect(cursorFromKeys).not.to.be.null;
    expect(cursor).to.equal(cursorFromKeys);

    const compositeFromCursor = entity.conversions.byAccessPattern[
      accessPattern
    ].fromCursor.toComposite(cursor!);
    expect(compositeFromCursor).not.to.be.null;

    // @ts-ignore
    const keysFromComposite =entity.conversions.byAccessPattern[accessPattern].fromComposite.toKeys(item);
    expect(keysFromComposite).not.to.be.null;
    expect(keysFromCursor).to.deep.equal(keysFromComposite);

    expect(Object.entries(compositeFromCursor!).length).to.be.greaterThan(0);
    const compositeFromKeys = entity.conversions.byAccessPattern[
      accessPattern
    ].fromKeys.toComposite(keysFromComposite!);
    expect(!!compositeFromKeys).to.be.true;

    const definition = entity.schema.indexes[accessPattern];
    try {
      validateMatchingCorrespondence({
        label: `${accessPattern} from cursor`,
        skComposite:
          "sk" in definition && definition.sk.composite
            ? definition.sk.composite
            : [],
        pkComposite: definition.pk.composite,
        composite: compositeFromCursor!,
        provided: item,
      });

      validateMatchingCorrespondence({
        label: `${accessPattern} from keys`,
        skComposite:
          "sk" in definition && definition.sk.composite
            ? definition.sk.composite
            : [],
        pkComposite: definition.pk.composite,
        composite: compositeFromKeys!,
        provided: item,
      });
    } catch (err) {
      console.log({
        accessPattern,
        keys,
        item,
        cursor,
        cursorFromKeys,
        keysFromCursor,
        compositeFromCursor,
        keysFromComposite,
        compositeFromKeys,
        definition,
      });
      throw err;
    }
  };

  const record = {
    name: "nameProperty",
    accountId: "accountIdProperty",
    organizationId: "organizationIdProperty",
    city: "cityProperty",
    county: "countyProperty",
    state: "stateProperty",
    count: 10,
    kind: "kindProperty",
  };

  describe("top-level conversions", () => {
    it("should perform all conversions without loss starting with an item", () => {
      evaluateFromComposite(record);
    });

    it("should perform all conversions without loss starting with keys", () => {
      const params = entity.put(record).params();
      const keys = params.Item;
      for (const prop in params.Item) {
        if (prop.startsWith("gsi") || prop === "pk" || prop === "sk") {
          keys[prop] = params.Item[prop];
        }
      }
      evaluateFromKeys(keys);
    });

    describe("should create keys based on strictness", () => {
      const table = uuid();
      const entityName = "conversionentity";
      const serviceName = "conversionservice";
      const entity = new Entity(
        {
          model: {
            service: serviceName,
            entity: entityName,
            version: "1",
          },
          attributes: {
            accountId: {
              type: "string",
            },
            organizationId: {
              type: "string",
            },
            id: {
              type: "string",
            },
            category: {
              type: "string",
            },
            createdAt: {
              type: "number",
            },
            name: {
              type: "string",
            },
            description: {
              type: "string",
            },
          },
          indexes: {
            byOrganization: {
              pk: {
                field: "pk",
                composite: ["organizationId"],
              },
              sk: {
                field: "sk",
                composite: ["accountId", "id"],
              },
            },
            byCategory: {
              index: "gsi1pk-gsi1sk-index",
              pk: {
                field: "gsi1pk",
                composite: ["category"],
              },
              sk: {
                field: "gsi1sk",
                composite: ["createdAt", "name"],
              },
            },
          },
        },
        { table },
      );

      function getConversion(
        target: ConversionTest["target"],
        strict?: "all" | "pk" | "none",
      ) {
        switch (target) {
          case "byCategory":
            return (composite: any) =>
              entity.conversions.byAccessPattern.byCategory.fromComposite.toKeys(
                composite,
                { strict },
              );
          case "byOrganization":
            return (composite: any) =>
              entity.conversions.byAccessPattern.byOrganization.fromComposite.toKeys(
                composite,
                { strict },
              );
          case "top":
            return (composite: any) =>
              entity.conversions.fromComposite.toKeys(composite, { strict });
          default:
            throw new Error(`Unknown target: "${target}"`);
        }
      }

      for (const test of conversionTests) {
        it(test.description, () => {
          const conversion = getConversion(test.target, test.strict);
          try {
            const keys = conversion(test.item);
            expect(keys).to.deep.equal(test.keys);
          } catch (err: any) {
            expect(err.message).to.deep.equal(test.error);
          }
        });
      }
    });
  });

  describe("byAccessPattern conversions", () => {
    const accessPatterns = [
      ["has default electrodb key structure", "defaultKeyStructure"],
      ["has custom key structure using template", "customKeyStructure"],
      [
        "has default key structure but with only a pk",
        "pkOnlyDefaultKeyStructure",
      ],
      [
        "has custom key structure with template but with only a pk",
        "pkOnlyCustomKeyStructure",
      ],
      ["has direct attribute reference key", "attributeRefKeyStructure"],
      [
        "has default key structure but on a clustered index",
        "defaultKeyStructureClustered",
      ],
      [
        "has custom key structure but with a clustered index",
        "customKeyStructureClustered",
      ],
      [
        "has direct attribute reference but with index defined as clustered",
        "attributeRefKeyStructureClustered",
      ],
      [
        "has default key structure but on a clustered index and caseless keys",
        "defaultKeyStructureClusteredCaseless",
      ],
      [
        "has custom key structure but with a clustered index and caseless keys",
        "customKeyStructureClusteredCaseless",
      ],
      [
        "has default key structure but with only a pk and caseless keys",
        "pkOnlyDefaultKeyStructureClusteredCaseless",
      ],
      [
        "has custom key structure with template but with only a pk and caseless keys",
        "pkOnlyCustomKeyStructureClusteredCaseless",
      ],
      [
        "has direct attribute reference key and caseless keys",
        "attributeRefKeyStructureClusteredCaseless",
      ],
    ] as const;

    const record = {
      name: "nameProperty",
      accountId: "accountIdProperty",
      organizationId: "organizationIdProperty",
      city: "cityProperty",
      county: "countyProperty",
      state: "stateProperty",
      count: 10,
      kind: "kindProperty",
    };

    for (let i = 0; i < accessPatterns.length; i++) {
      const [description, accessPattern] = accessPatterns[i];

      it(`should perform all conversions without loss starting with an item for an index that ${description}`, () => {
        evaluateAccessPattern(accessPattern, record);
      });

      it(`should perform all conversions without loss starting with keys for an index that ${description}`, () => {
        const params = entity.put(record).params();
        const keys: Record<string, string | number> = {};
        for (const prop in params.Item) {
          if (prop.startsWith("gsi") || prop === "pk" || prop === "sk") {
            keys[prop] = params.Item[prop];
          }
        }

        expect(Object.keys(keys).length).to.equal(22);

        evaluateAccessPatternFromKeys(accessPattern, keys);
      });
    }
  });
});

describe("key formatting", () => {
  describe("pre and post fixing attribute reference keys", () => {
    // it('should always correctly add prefixes and postfixes to keys - issue#225', () => {
    const table = "your_table_name";

    const createEntity = (options: {
      pkTemplate: string;
      skTemplate: string;
      pkCasing: "upper" | "lower" | "none" | "default";
      skCasing: "upper" | "lower" | "none" | "default";
    }) => {
      const { skTemplate, pkTemplate, pkCasing, skCasing } = options;
      return new Entity(
        {
          model: {
            entity: "notification",
            version: "1",
            service: "notifications",
          },
          attributes: {
            userId: {
              type: "string",
            },
            message: {
              type: "string",
            },
            time: {
              type: "string",
            },
          },
          indexes: {
            byUserId: {
              pk: {
                field: "userId",
                template: pkTemplate,
                composite: ["userId"],
                casing: pkCasing,
              },
              sk: {
                field: "requestId",
                template: skTemplate,
                composite: ["time"],
                casing: skCasing,
              },
            },
          },
        },
        {
          table,
        },
      );
    };

    const casings = ["none", "upper", "lower", "default"] as const;

    const fixings = [
      ["prefix-", ""],
      ["", "-postfix"],
      ["prefix-", "-postfix"],
      ["", ""],
    ];

    function createTemplates(key: string) {
      const templates: [string, (test: string, val: string) => void][] = [];
      for (const [prefix, postfix] of fixings) {
        let template = "${" + key + "}";
        if (prefix) {
          template = prefix + template;
        }
        if (postfix) {
          template = template + postfix;
        }
        const test = (test: string, val: string) => {
          const prefixIsValid =
            !prefix || val.toLowerCase().startsWith(prefix.toLowerCase());
          const postfixIsValid =
            !postfix || val.toLowerCase().endsWith(postfix.toLowerCase());
          const skException = test.startsWith("sk");

          if (prefixIsValid && (postfixIsValid || skException)) {
            return;
          }

          throw new Error(
            `${test}. Expected ${test} value "${val}" to have prefix "${
              prefix || "(NONE)"
            }" and postfix "${postfix || "(NONE)"}"`,
          );
        };
        templates.push([template, test]);
      }
      return templates;
    }

    const pkTemplates = createTemplates("userId");
    const skTemplates = createTemplates("time");
    const pkCasing = "default" as const;
    const skCasing = "default" as const;

    for (const pkCasing of casings) {
      for (const skCasing of casings) {
        for (const [pkTemplate, pkTest] of pkTemplates) {
          for (const [skTemplate, skTest] of skTemplates) {
            const entity = createEntity({
              skTemplate: skTemplate,
              pkTemplate: pkTemplate,
              pkCasing,
              skCasing,
            });

            describe(`when pk casing is ${pkCasing}, sk casing is ${skCasing}, the pk template is ${pkTemplate}, or the sk template is ${skTemplate}`, () => {
              it("should perform begins with query", () => {
                const queryParams1 = entity.query
                  .byUserId({
                    userId: "Brad-01",
                  })
                  .params();

                pkTest("pk", queryParams1["ExpressionAttributeValues"][":pk"]);
                if (skTemplate[0] !== "$") {
                  skTest(
                    "sk",
                    queryParams1["ExpressionAttributeValues"][":sk1"],
                  );
                }
              });

              it("should perform a gte query", () => {
                const queryParamsGte = entity.query
                  .byUserId({
                    userId: "Brad-01",
                  })
                  .gte({ time: "2022-01-01T00:00:00.000Z" })
                  .params();
                // queryParamsGte).to.equal('brad-01-no;
                pkTest(
                  "pk",
                  queryParamsGte["ExpressionAttributeValues"][":pk"],
                );
                if (queryParamsGte["ExpressionAttributeValues"][":sk1"]) {
                  skTest(
                    "sk",
                    queryParamsGte["ExpressionAttributeValues"][":sk1"],
                  );
                }
              });
              it("should perform a gt query", () => {
                const queryParamsGt = entity.query
                  .byUserId({
                    userId: "Brad-01",
                  })
                  .gt({ time: "2022-01-01T00:00:00.000Z" })
                  .params();
                // queryParamsGt).to.equal('brad-01-no;
                pkTest("pk", queryParamsGt["ExpressionAttributeValues"][":pk"]);
                skTest(
                  "sk",
                  queryParamsGt["ExpressionAttributeValues"][":sk1"],
                );
              });

              it("should perform a lte query", () => {
                const queryParamsLte = entity.query
                  .byUserId({
                    userId: "Brad-01",
                  })
                  .lte({ time: "2022-01-01T00:00:00.000Z" })
                  .params();
                // queryParamsLte).to.equal(';
                pkTest(
                  "pk",
                  queryParamsLte["ExpressionAttributeValues"][":pk"],
                );
                skTest(
                  "sk",
                  queryParamsLte["ExpressionAttributeValues"][":sk1"],
                );
              });

              it("should perform a lt query", () => {
                const queryParamsLt = entity.query
                  .byUserId({
                    userId: "Brad-01",
                  })
                  .lt({ time: "2022-01-01T00:00:00.000Z" })
                  .params();
                // queryParamsLt).to.equal(';
                pkTest("pk", queryParamsLt["ExpressionAttributeValues"][":pk"]);
                skTest(
                  "sk",
                  queryParamsLt["ExpressionAttributeValues"][":sk1"],
                );
              });

              it("should perform a between query", () => {
                const queryParamsBetween = entity.query
                  .byUserId({
                    userId: "Brad-01",
                  })
                  .between(
                    { time: "2022-01-01T00:00:00.000Z" },
                    { time: "2023-01-01T00:00:00.000Z" },
                  )
                  .params();

                // queryParamsBetween).to.equal(';
                pkTest(
                  "pk",
                  queryParamsBetween["ExpressionAttributeValues"][":pk"],
                );
                skTest(
                  "sk1",
                  queryParamsBetween["ExpressionAttributeValues"][":sk1"],
                );
                skTest(
                  "sk2",
                  queryParamsBetween["ExpressionAttributeValues"][":sk2"],
                );
              });

              it("should perform a begins with query", () => {
                const queryParamsBegins = entity.query
                  .byUserId({
                    userId: "Brad-01",
                  })
                  .begins({
                    time: "2022-01-01",
                  })
                  .params();
                // queryParamsBegins).to.equal(';
                pkTest(
                  "pk",
                  queryParamsBegins["ExpressionAttributeValues"][":pk"],
                );
                skTest(
                  "sk",
                  queryParamsBegins["ExpressionAttributeValues"][":sk1"],
                );
              });

              it("should perform a full equality with query", () => {
                const queryParamsBegins = entity.query
                  .byUserId({
                    userId: "Brad-01",
                    time: "2022-01-01",
                  })
                  .params();
                // queryParamsBegins).to.equal(';
                pkTest(
                  "pk",
                  queryParamsBegins["ExpressionAttributeValues"][":pk"],
                );
                skTest(
                  "sk",
                  queryParamsBegins["ExpressionAttributeValues"][":sk1"],
                );
              });

              it("should perform a create operation", () => {
                // expected - pk is brad-01-notification
                const createParams = entity
                  .create({
                    userId: "Brad-01",
                    time: "2020-01-01T00:00:00.000Z",
                    message: "Hi",
                  })
                  .params();
                // createParams).to.equal(';
                pkTest("pk", createParams.Item.userId);
                skTest("sk", createParams.Item.requestId);
              });

              it("should perform a batch put operation", () => {
                const batchPutParams = entity
                  .put([
                    {
                      userId: "Brad-01",
                      time: "2020-01-01T00:00:00.000Z",
                      message: "Hi",
                    },
                  ])
                  .params();
                pkTest(
                  "pk",
                  batchPutParams[0].RequestItems[table][0].PutRequest.Item
                    .userId,
                );
                skTest(
                  "sk",
                  batchPutParams[0].RequestItems[table][0].PutRequest.Item
                    .requestId,
                );
              });

              it("should perform an update", () => {
                const updateParams = entity
                  .update({
                    userId: "Brad-01",
                    time: "2020-01-01T00:00:00.000Z",
                  })
                  .set({
                    message: "Hello",
                  })
                  .params();

                pkTest("pk", updateParams.Key.userId);
                skTest("sk", updateParams.Key.requestId);
              });

              it("should perform a get operation", () => {
                const getParams = entity
                  .get({
                    time: "123",
                    userId: "Brad-01",
                  })
                  .params();

                pkTest("pk", getParams["Key"]["userId"]);
                skTest("sk", getParams["Key"]["requestId"]);
              });

              it("should perform a batch get operation", () => {
                const batchGetParams = entity
                  .get([
                    {
                      time: "123",
                      userId: "Brad-01",
                    },
                  ])
                  .params();
                pkTest(
                  "pk",
                  batchGetParams[0].RequestItems[table].Keys[0].userId,
                );
                skTest(
                  "sk",
                  batchGetParams[0].RequestItems[table].Keys[0].requestId,
                );
              });
            });
          }
        }
      }
    }
  });
});

describe("static template key ownership", () => {
  it("should return items when no composite attributes are in the key templates", async () => {
    const table = "electro";
    const ProductSchema = new Entity(
      {
        model: {
          entity: "Product",
          version: "1",
          service: "aa",
        },
        attributes: {
          name: {
            type: "string",
          },
          enabled: {
            type: "boolean",
          },
        },
        indexes: {
          primary: {
            pk: {
              field: "pk",
              casing: "none",
              template: "#PRODUCTS",
              composite: [],
            },
            sk: {
              field: "sk",
              casing: "none",
              template: "#PRODUCTS",
              composite: [],
            },
          },
        },
      },
      { table, client },
    );

    const item = {
      pk: "#PRODUCTS",
      sk: "#PRODUCTS",
      enabled: true,
      name: uuid(),
    };

    await client
      .put({
        Item: item,
        TableName: table,
      })
      .promise();

    const getResults = await ProductSchema.get({}).go({
      ignoreOwnership: true,
    });

    expect(getResults.data).to.deep.equal({
      enabled: item.enabled,
      name: item.name,
    });

    const queryResults = await ProductSchema.query
      .primary({})
      .go({ ignoreOwnership: true });

    expect(queryResults.data[0]).to.deep.equal({
      enabled: item.enabled,
      name: item.name,
    });
  });

  it("should return items when no composite attributes are in the key templates and no sk", async () => {
    const table = "electro_nosort";
    const ProductSchema = new Entity(
      {
        model: {
          entity: "Product",
          version: "1",
          service: "aa",
        },
        attributes: {
          name: {
            type: "string",
          },
          enabled: {
            type: "boolean",
          },
        },
        indexes: {
          primary: {
            pk: {
              field: "partition_key",
              casing: "none",
              template: "#PRODUCTS",
              composite: [],
            },
          },
        },
      },
      { table, client },
    );

    const item = {
      partition_key: "#PRODUCTS",
      enabled: true,
      name: uuid(),
    };

    await client
      .put({
        Item: item,
        TableName: table,
      })
      .promise();

    const results = await ProductSchema.get({}).go({ ignoreOwnership: true });

    expect(results.data).to.deep.equal({
      enabled: item.enabled,
      name: item.name,
    });
  });
});

describe("index casting", () => {
  it('should not allow "number" cast to be used when more than one composite attribute is used with composites', () => {
    const gameId = uuid();
    const gamerTag = uuid();
    const timestamp = Date.now();
    const score = 500;

    const item = {
      gameId,
      gamerTag,
      timestamp,
      score,
    };

    const table = "electro_castkeys";
    expect(
      () =>
        new Entity(
          {
            model: {
              entity: "HighScore",
              version: "1",
              service: "Leaderboard",
            },
            attributes: {
              gameId: {
                type: "string",
              },
              gamerTag: {
                type: "string",
              },
              timestamp: {
                type: "number",
              },
              score: {
                type: "number",
              },
            },
            indexes: {
              castToNumber: {
                pk: {
                  field: "pk",
                  cast: "string",
                  composite: ["gamerTag"],
                },
                sk: {
                  field: "sk",
                  cast: "number",
                  composite: ["score", "timestamp"],
                },
              },
            },
          },
          { table, client },
        ),
    ).to.throw(
      'Invalid "cast" option provided for sk definition on index "(Primary Index)". Keys can only be cast to \'number\' if they are a composite of one numeric attribute. - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#invalid-model',
    );
  });

  it('should not allow "number" cast to be used when more than one composite attribute is used with templates', () => {
    const gameId = uuid();
    const gamerTag = uuid();
    const timestamp = Date.now();
    const score = 500;

    const item = {
      gameId,
      gamerTag,
      timestamp,
      score,
    };

    const table = "electro_castkeys";
    expect(
      () =>
        new Entity(
          {
            model: {
              entity: "HighScore",
              version: "1",
              service: "Leaderboard",
            },
            attributes: {
              gameId: {
                type: "string",
              },
              gamerTag: {
                type: "string",
              },
              timestamp: {
                type: "number",
              },
              score: {
                type: "number",
              },
            },
            indexes: {
              castToNumber: {
                pk: {
                  field: "pk",
                  cast: "string",
                  composite: ["gamerTag"],
                },
                sk: {
                  field: "sk",
                  cast: "number",
                  composite: ["score", "timestamp"],
                  template: "${score}#${timestamp}",
                },
              },
            },
          },
          { table, client },
        ),
    ).to.throw(
      'Invalid "cast" option provided for sk definition on index "(Primary Index)". Keys can only be cast to \'number\' if they are a composite of one numeric attribute. - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#invalid-model',
    );
  });

  it('should allow querying externally created items with numeric keys using ignoreOwnership', async () => {
    const table = "electro_nostringkeys";
    const fieldRefEntity = new Entity({
      model: {
          entity: 'fieldRefEntity',
          version: '1',
          service: "test",
      },
      attributes: {
          pk: {
              type: 'number',
          },
          sk: {
              type: 'number',
          },
      },
      indexes: {
          edocs: {
              pk: {
                  field: 'pk',
                  composite: ['pk'],
              },
              sk: {
                  field: 'sk',
                  composite: ['sk'],
              },
          }
      },
    }, { table, client });
  
    const now = Date.now();
  
    const params = fieldRefEntity.create({
      pk: now, 
      sk: 987,
    }).params<PutItemInput>();

    delete params.Item["__edb_e__"];
    delete params.Item["__edb_v__"];

    await client.put(params).promise();

    const results = await fieldRefEntity.query.edocs({ pk: now }).go({ ignoreOwnership: true });

    expect(results.data).to.deep.equal([{ pk: now, sk: 987 }]);

    const outOfTheBoxNumericSupport = new Entity({
      model: {
          entity: 'outOfTheBoxNumericSupport',
          version: '1',
          service: "test",
      },
      attributes: {
          prop1: {
              type: 'number',
          },
          prop2: {
              type: 'number',
          },
      },
      indexes: {
          edocs: {
              pk: {
                  field: 'pk',
                  composite: ['prop1'],
                  cast: 'number',
              },
              sk: {
                  field: 'sk',
                  composite: ['prop2'],
                  cast: 'number',
              },
          }
      },
    }, { table, client });

    const prop1 = now + 1;
    const prop2 = 987;
  
    const params2 = outOfTheBoxNumericSupport
      .create({ prop1, prop2 })
      .params<PutItemInput>();

    delete params2.Item["__edb_e__"];
    delete params2.Item["__edb_v__"];

    await client.put(params2).promise();

    const results2 = await outOfTheBoxNumericSupport.query.edocs({ prop1 }).go({ ignoreOwnership: true });

    expect(results2.data).to.deep.equal([{ prop1, prop2 }]);
  });

  it('should allow numeric sort keys', async () => {
    const table = "electro_nostringkeys";
    const products = new Entity(
        {
          model: {
            entity: 'products',
            version: '1',
            service: 'star'
          },
          attributes: {
            pk: {
              type: 'number'
            },
            sk: {
              type: 'number'
            }
          },
          indexes: {
            record: {
              pk: {
                field: 'pk',
                composite: ['pk'],
                template: '${pk}',
              },
              sk: {
                field: 'sk',
                composite: ['sk'],
                template: '${sk}'
              }
            }
          }
        },
        { client, table }
    );

    const items = [
      {pk: 8, sk: -1},
      {pk: 8, sk: 0},
      {pk: 8, sk: 1},
      {pk: 8, sk: 2},
      {pk: 8, sk: 3},
      {pk: 8, sk: 4},
      {pk: 8, sk: 5},
    ];

    await products.put(items).go();
    
    const queryParams = products.query.record({ pk: 8, sk: 4 }).params();
    expect(queryParams).to.deep.equal({
      KeyConditionExpression: '#pk = :pk and #sk1 = :sk1',
      TableName: table,
      ExpressionAttributeNames: { '#pk': 'pk', '#sk1': 'sk' },
      ExpressionAttributeValues: { ':pk': 8, ':sk1': 4 }
    });

    const queryResults = await products.query.record({ pk: 8, sk: 4 }).go();
    expect(queryResults.data).to.deep.equal([
      items[5],
    ]);

    const beginsWithParams = products.query.record({ pk: 8 }).begins({ sk: 4 }).params();
    expect(beginsWithParams).to.deep.equal({
      KeyConditionExpression: '#pk = :pk and begins_with(#sk1, :sk1)',
      TableName: table,
      ExpressionAttributeNames: { '#pk': 'pk', '#sk1': 'sk' },
      ExpressionAttributeValues: { ':pk': 8, ':sk1': 4 }
    });

    const beginsWithResults = await products.query.record({ pk: 8 })
      .begins({ sk: 4 })
      .go()
      .then(() => ({err: null}))
      .catch((err) => ({err}));
    expect(beginsWithResults.err?.message).to.equal(`Error thrown by DynamoDB client: "Invalid KeyConditionExpression: Incorrect operand type for operator or function; operator or function: begins_with, operand type: N" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#aws-error`);

    const gtParams = products.query.record({ pk: 8 }).gt({ sk: 4 }).params();
    expect(gtParams).to.deep.equal({
      TableName: 'electro_nostringkeys',
      ExpressionAttributeNames: { '#pk': 'pk', '#sk1': 'sk' },
      ExpressionAttributeValues: { ':pk': 8, ':sk1': 4 },
      KeyConditionExpression: '#pk = :pk and #sk1 > :sk1'
    });

    const gtResults = await products.query.record({ pk: 8 }).gt({ sk: 4 }).go();
    expect(gtResults.data).to.deep.equal(items.filter(item => item.sk > 4));

    const gteParams = products.query.record({ pk: 8 }).gte({ sk: 4 }).params();
    expect(gteParams).to.deep.equal({
      TableName: 'electro_nostringkeys',
      ExpressionAttributeNames: { '#pk': 'pk', '#sk1': 'sk' },
      ExpressionAttributeValues: { ':pk': 8, ':sk1': 4 },
      KeyConditionExpression: '#pk = :pk and #sk1 >= :sk1'
    });

    const gteResults = await products.query.record({ pk: 8 }).gte({ sk: 4 }).go();
    expect(gteResults.data).to.deep.equal(items.filter(item => item.sk >= 4));

    const ltParams = products.query.record({ pk: 8 }).lt({ sk: 4 }).params();
    expect(ltParams).to.deep.equal({
      TableName: 'electro_nostringkeys',
      ExpressionAttributeNames: { '#pk': 'pk', '#sk1': 'sk' },
      ExpressionAttributeValues: { ':pk': 8, ':sk1': 4 },
      KeyConditionExpression: '#pk = :pk and #sk1 < :sk1'
    });

    const ltResults = await products.query.record({ pk: 8 }).lt({ sk: 4 }).go();
    expect(ltResults.data).to.deep.equal(items.filter(item => item.sk < 4));

    
    const lteParams = products.query.record({ pk: 8 }).lte({ sk: 4 }).params();
    expect(lteParams).to.deep.equal({
      TableName: 'electro_nostringkeys',
      ExpressionAttributeNames: { '#pk': 'pk', '#sk1': 'sk' },
      ExpressionAttributeValues: { ':pk': 8, ':sk1': 4 },
      KeyConditionExpression: '#pk = :pk and #sk1 <= :sk1'
    });

    const lteResults = await products.query.record({ pk: 8 }).lte({ sk: 4 }).go();
    expect(lteResults.data).to.deep.equal(items.filter(item => item.sk <= 4));
    
    const betweenParams = products.query.record({ pk: 8 })
      .between(
        { sk: 2 },
        { sk: 4 })
      .params();
    expect(betweenParams).to.deep.equal({
      TableName: 'electro_nostringkeys',
      ExpressionAttributeNames: { '#pk': 'pk', '#sk1': 'sk' },
      ExpressionAttributeValues: { ':pk': 8, ':sk1': 2, ':sk2': 4 },
      KeyConditionExpression: '#pk = :pk and #sk1 BETWEEN :sk1 AND :sk2'
    });

    const betweenResults = await products.query.record({ pk: 8 })
    .between(
      { sk: 2 },
      { sk: 4 })
    .go();
    expect(betweenResults.data).to.deep.equal(items.filter(item => item.sk >= 2 && item.sk <= 4));
  });

  it("should reject when provided string index composite cannot be cast to number", () => {
    const gamerTag = uuid();

    const table = "electro_castkeys";
    const booleanHighScore = new Entity(
      {
        model: {
          entity: "BooleanHighScore",
          version: "1",
          service: "Leaderboard",
        },
        attributes: {
          gamerTag: {
            type: "string",
          },
          score: {
            type: "boolean",
          },
        },
        indexes: {
          castToNumber: {
            pk: {
              field: "pk",
              cast: "string",
              composite: ["gamerTag"],
            },
            sk: {
              field: "sk",
              cast: "number",
              composite: ["score"],
            },
          },
        },
      },
      { table, client },
    );

    const stringHighScore = new Entity(
      {
        model: {
          entity: "stringHighScore",
          version: "1",
          service: "Leaderboard",
        },
        attributes: {
          gamerTag: {
            type: "string",
          },
          score: {
            type: "string",
          },
        },
        indexes: {
          castToNumber: {
            pk: {
              field: "pk",
              cast: "string",
              composite: ["gamerTag"],
            },
            sk: {
              field: "sk",
              cast: "number",
              composite: ["score"],
            },
          },
        },
      },
      { table, client },
    );

    const successCases = [
      {
        expected: 1,
        params: booleanHighScore.put({ gamerTag, score: true }).params(),
      },
      {
        expected: 0,
        params: booleanHighScore.put({ gamerTag, score: false }).params(),
      },
      {
        expected: 1,
        params: stringHighScore.put({ gamerTag, score: "1" }).params(),
      },
      {
        expected: 100,
        params: stringHighScore.put({ gamerTag, score: "100" }).params(),
      },
      {
        expected: 50,
        params: stringHighScore.put({ gamerTag, score: "0050" }).params(),
      },
    ];

    for (const successCase of successCases) {
      expect(successCase.params.Item.sk).to.equal(successCase.expected);
    }

    expect(() =>
      stringHighScore.put({ gamerTag, score: "abc" }).params(),
    ).to.throw("");
  });

  it("should allow for more granular control to choose how they can type their keys", async () => {
    const table = "electro_castkeys";
    const highScore = new Entity(
      {
        model: {
          entity: "HighScore",
          version: "1",
          service: "Leaderboard",
        },
        attributes: {
          gameId: {
            type: "string",
          },
          gamerTag: {
            type: "string",
          },
          timestamp: {
            type: "number",
          },
          score: {
            type: "number",
          },
        },
        indexes: {
          castToNumber: {
            pk: {
              field: "pk",
              cast: "number",
              composite: ["score"],
            },
            sk: {
              field: "sk",
              cast: "number",
              composite: ["timestamp"],
            },
          },
          castToNumberNoSk: {
            index: "gsi2pk-gsi2sk-index",
            pk: {
              field: "gsi2pk",
              cast: "number",
              composite: ["score"],
            },
          },
          castViaTemplate: {
            index: "gsi3pk-gsi3sk-index",
            pk: {
              field: "gsi3pk",
              composite: ["score"],
              template: "${score}",
            },
            sk: {
              field: "gsi3sk",
              composite: ["timestamp"],
              template: "${timestamp}",
            },
          },
          castToString: {
            index: "gsi4pk-gsi4sk-index",
            pk: {
              field: "gsi4pk",
              cast: "string",
              composite: ["score"],
              template: "${score}",
            },
            sk: {
              field: "gsi4sk",
              cast: "string",
              composite: ["timestamp"],
              template: "${timestamp}",
            },
          },
          castToStringNoSk: {
            index: "gsi5pk-gsi5sk-index",
            pk: {
              field: "gsi5pk",
              cast: "string",
              composite: ["score"],
              template: "${score}",
            },
          },
        },
      },
      { table, client },
    );

    const gameId = uuid();
    const gamerTag = uuid();
    const timestamp = Date.now();
    const score = 500;

    const item = {
      gameId,
      gamerTag,
      timestamp,
      score,
    };

    const params = highScore.put(item).params();
    expect(params.Item).to.deep.equal({
      __edb_e__: "HighScore",
      __edb_v__: "1",
      gameId,
      gamerTag,
      timestamp,
      score,
      pk: score,
      sk: timestamp,
      gsi2pk: score,
      gsi3pk: score,
      gsi3sk: timestamp,
      gsi4pk: `${score}`,
      gsi4sk: `${timestamp}`,
      gsi5pk: `${score}`,
    });

    await highScore.put(item).go();

    const castToNumber = await highScore.query
      .castToNumber({ score, timestamp })
      .go()
      .then((r) => r.data[0]);
    expect(castToNumber).to.deep.equal(item);

    const castToNumberNoSk = await highScore.query
      .castToNumberNoSk({ score })
      .go()
      .then((r) => r.data[0]);
    expect(castToNumberNoSk).to.deep.equal(item);

    const castViaTemplate = await highScore.query
      .castViaTemplate({ score, timestamp })
      .go()
      .then((r) => r.data[0]);
    expect(castViaTemplate).to.deep.equal(item);

    const castToString = await highScore.query
      .castToString({ score, timestamp })
      .go()
      .then((r) => r.data[0]);
    expect(castToString).to.deep.equal(item);

    const castToStringNoSk = await highScore.query
      .castToStringNoSk({ score })
      .go()
      .then((r) => r.data[0]);
    expect(castToStringNoSk).to.deep.equal(item);
  });
});

describe("attribute watch", () => {
  it("should use an attribute's field name when updating an attribute via 'watch'", () => {
    const tasks = new Entity(
      {
        model: {
          entity: "tasks",
          version: "1",
          service: "taskapp",
        },
        attributes: {
          id: { type: "string" },
          expiresAt: { type: "string" },
          localFieldName: {
            type: "string",
            field: "TTL", // This should be used when updating
            watch: ["expiresAt"],
            set: (_, { expiresAt }) => expiresAt.split("").reverse().join(""),
          },
        },
        indexes: {
          byId: {
            pk: { field: "PK", composite: ["id"] },
            sk: { field: "SK", composite: [] },
          },
        },
      },
      { table: "taskapp" },
    );

    const expiresAt = "abc";
    const params1 = tasks.update({ id: "test" }).set({ expiresAt }).params();
    expect(params1).to.deep.equal({
      UpdateExpression:
        "SET #expiresAt = :expiresAt_u0, #TTL = :TTL_u0, #id = :id_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0",
      ExpressionAttributeNames: {
        "#expiresAt": "expiresAt",
        "#TTL": "TTL",
        "#id": "id",
        "#__edb_e__": "__edb_e__",
        "#__edb_v__": "__edb_v__",
      },
      ExpressionAttributeValues: {
        ":expiresAt_u0": "abc",
        ":TTL_u0": "cba",
        ":id_u0": "test",
        ":__edb_e___u0": "tasks",
        ":__edb_v___u0": "1",
      },
      TableName: "taskapp",
      Key: {
        PK: "$taskapp#id_test",
        SK: "$tasks_1",
      },
    });

    const params2 = tasks
      .update({ id: "test" })
      .set({ expiresAt, localFieldName: "1" })
      .params();
    expect(params2).to.deep.equal({
      UpdateExpression:
        "SET #expiresAt = :expiresAt_u0, #localFieldName = :localFieldName_u0, #id = :id_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0",
      ExpressionAttributeNames: {
        "#expiresAt": "expiresAt",
        "#localFieldName": "TTL",
        "#id": "id",
        "#__edb_e__": "__edb_e__",
        "#__edb_v__": "__edb_v__",
      },
      ExpressionAttributeValues: {
        ":expiresAt_u0": "abc",
        ":localFieldName_u0": "cba",
        ":id_u0": "test",
        ":__edb_e___u0": "tasks",
        ":__edb_v___u0": "1",
      },
      TableName: "taskapp",
      Key: {
        PK: "$taskapp#id_test",
        SK: "$tasks_1",
      },
    });
  });
});

describe("sparse index formatting", () => {
  it("when keys are attribute names, should not produce empty string pk key", () => {
    const table = "your_table_name";
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
            required: false,
          },
          code: {
            type: "string",
            required: false,
          },
        },
        indexes: {
          projects: {
            pk: {
              field: "pk",
              composite: ["team"],
            },
          },

          withCode: {
            // sparse index that should only be populated if code set
            index: "with-code-index",
            pk: {
              field: "code",
              composite: ["code"],
            },
            sk: {
              field: "task",
              composite: ["task"],
            },
          },
        },
      },
      { table },
    );

    const params1 = tasks.put({ team: "team", task: undefined }).params();
    expect(params1).to.deep.equal({
      Item: {
        team: "team",
        pk: "$taskapp$tasks_1#team_team",
        __edb_e__: "tasks",
        __edb_v__: "1",
      },
      TableName: "your_table_name",
    });

    const params2 = tasks.put({ team: "team" }).params();
    expect(params2).to.deep.equal({
      Item: {
        team: "team",
        pk: "$taskapp$tasks_1#team_team",
        __edb_e__: "tasks",
        __edb_v__: "1",
      },
      TableName: "your_table_name",
    });

    const params3 = tasks.put({ team: "team", task: "abc" }).params();
    expect(params3).to.deep.equal({
      Item: {
        team: "team",
        task: "abc",
        pk: "$taskapp$tasks_1#team_team",
        __edb_e__: "tasks",
        __edb_v__: "1",
      },
      TableName: "your_table_name",
    });

    const params4 = tasks.put({ team: "team", code: "abc" }).params();
    expect(params4).to.deep.equal({
      Item: {
        team: "team",
        code: "abc",
        pk: "$taskapp$tasks_1#team_team",
        __edb_e__: "tasks",
        __edb_v__: "1",
      },
      TableName: "your_table_name",
    });
  });
});

describe('field translation', () => {
  const serviceName = uuid();
  const TestEntity = new Entity(
      {
        model: {
          entity: "test",
          service: serviceName,
          version: "1",
        },
        attributes: {
          entityId: {
            field: "entity_id",
            type: "string",
          },
          otherId: {
            field: "other_id",
            type: "string",
          },
          thirdId: {
            field: "third_id",
            type: "string"
          },
          numParam: {
            type: "number",
            field: "num_param"
          },
          setParam: {
            type: "set",
            items: "string",
            field: "set_param"
          },
          listParam: {
            type: "list",
            items: {
              type: "string"
            },
            field: "list_param"
          },
          anyParam: {
            type: 'any',
            field: 'any_param'
          }
        },
        indexes: {
          test: {
            pk: {
              field: "pk",
              composite: ["entityId"],
            },
            sk: {
              field: "sk",
              composite: ["otherId", "thirdId"],
            },
          },
        },
      },
      { table: "electro" }
  );

  const entityId = 'abc';
  const otherId = 'def';
  const thirdId = 'ghi';
  const numParam = 123;
  const setParam = ['abc', 'def'];
  const listParam = ['ghi', 'jkl'];
  const anyParam = 'mno';

  describe('when performing upsert operation', () => {
    it('should translate attribute field names on set', () => {
      const params = TestEntity.upsert({entityId, otherId, thirdId}).set({numParam, setParam, listParam}).params();
      expect(params.ExpressionAttributeNames['#entityId']).to.equal('entity_id');
      expect(params.ExpressionAttributeNames['#otherId']).to.equal('other_id');
      expect(params.ExpressionAttributeNames['#thirdId']).to.equal('third_id');
      expect(params.ExpressionAttributeNames['#numParam']).to.equal('num_param');
      expect(params.ExpressionAttributeNames['#setParam']).to.equal('set_param');
      expect(params.ExpressionAttributeNames['#listParam']).to.equal('list_param');
    });

    it('should translate attribute field names on add', () => {
      const params = TestEntity.upsert({entityId, otherId, thirdId}).add({numParam, setParam}).params();
      expect(params.ExpressionAttributeNames['#entityId']).to.equal('entity_id');
      expect(params.ExpressionAttributeNames['#otherId']).to.equal('other_id');
      expect(params.ExpressionAttributeNames['#thirdId']).to.equal('third_id');
      expect(params.ExpressionAttributeNames['#numParam']).to.equal('num_param');
      expect(params.ExpressionAttributeNames['#setParam']).to.equal('set_param');
    });

    it('should translate attribute field names on subtract', () => {
      const params = TestEntity.upsert({entityId, otherId, thirdId}).subtract({numParam}).params();
      expect(params.ExpressionAttributeNames['#entityId']).to.equal('entity_id');
      expect(params.ExpressionAttributeNames['#otherId']).to.equal('other_id');
      expect(params.ExpressionAttributeNames['#thirdId']).to.equal('third_id');
      expect(params.ExpressionAttributeNames['#numParam']).to.equal('num_param');
    });

    it('should translate attribute field names on append', () => {
      const params = TestEntity.upsert({entityId, otherId, thirdId}).append({listParam}).params();
      expect(params.ExpressionAttributeNames['#entityId']).to.equal('entity_id');
      expect(params.ExpressionAttributeNames['#otherId']).to.equal('other_id');
      expect(params.ExpressionAttributeNames['#thirdId']).to.equal('third_id');
      expect(params.ExpressionAttributeNames['#listParam']).to.equal('list_param');
    });

    it('should translate attribute field names on ifNotExists', () => {
      const params = TestEntity.upsert({entityId, otherId, thirdId}).ifNotExists({numParam, setParam, listParam}).params();
      expect(params.ExpressionAttributeNames['#entityId']).to.equal('entity_id');
      expect(params.ExpressionAttributeNames['#otherId']).to.equal('other_id');
      expect(params.ExpressionAttributeNames['#thirdId']).to.equal('third_id');
      expect(params.ExpressionAttributeNames['#numParam']).to.equal('num_param');
      expect(params.ExpressionAttributeNames['#setParam']).to.equal('set_param');
      expect(params.ExpressionAttributeNames['#listParam']).to.equal('list_param');
    });
  })

  const updateMethods = ['update', 'patch'] as const;
  for (const updateMethod of updateMethods) {
    describe(`when performing ${updateMethod} operation`, () => {
      it('should translate attribute field names on set', () => {
        const params = TestEntity[updateMethod]({entityId, otherId, thirdId}).set({numParam, setParam, listParam}).params();
        expect(params.ExpressionAttributeNames['#entity_id']).to.equal('entity_id');
        expect(params.ExpressionAttributeNames['#other_id']).to.equal('other_id');
        expect(params.ExpressionAttributeNames['#third_id']).to.equal('third_id');
        expect(params.ExpressionAttributeNames['#numParam']).to.equal('num_param');
        expect(params.ExpressionAttributeNames['#setParam']).to.equal('set_param');
        expect(params.ExpressionAttributeNames['#listParam']).to.equal('list_param');
      });

      it('should translate attribute field names on add', () => {
        const params = TestEntity[updateMethod]({entityId, otherId, thirdId}).add({numParam, setParam}).params();
        expect(params.ExpressionAttributeNames['#entity_id']).to.equal('entity_id');
        expect(params.ExpressionAttributeNames['#other_id']).to.equal('other_id');
        expect(params.ExpressionAttributeNames['#third_id']).to.equal('third_id');
        expect(params.ExpressionAttributeNames['#numParam']).to.equal('num_param');
        expect(params.ExpressionAttributeNames['#setParam']).to.equal('set_param');
      });

      it('should translate attribute field names on subtract', () => {
        const params = TestEntity[updateMethod]({entityId, otherId, thirdId}).subtract({numParam}).params();
        expect(params.ExpressionAttributeNames['#entity_id']).to.equal('entity_id');
        expect(params.ExpressionAttributeNames['#other_id']).to.equal('other_id');
        expect(params.ExpressionAttributeNames['#third_id']).to.equal('third_id');
        expect(params.ExpressionAttributeNames['#numParam']).to.equal('num_param');
      });

      it('should translate attribute field names on append', () => {
        const params = TestEntity[updateMethod]({entityId, otherId, thirdId}).append({listParam}).params();
        expect(params.ExpressionAttributeNames['#entity_id']).to.equal('entity_id');
        expect(params.ExpressionAttributeNames['#other_id']).to.equal('other_id');
        expect(params.ExpressionAttributeNames['#third_id']).to.equal('third_id');
        expect(params.ExpressionAttributeNames['#listParam']).to.equal('list_param');
      });

      it('should translate attribute field names on delete', () => {
        const params = TestEntity[updateMethod]({entityId, otherId, thirdId}).delete({setParam}).params();
        expect(params.ExpressionAttributeNames['#entity_id']).to.equal('entity_id');
        expect(params.ExpressionAttributeNames['#other_id']).to.equal('other_id');
        expect(params.ExpressionAttributeNames['#third_id']).to.equal('third_id');
        expect(params.ExpressionAttributeNames['#setParam']).to.equal('set_param');
      });

      it('should translate attribute field names on remove', () => {
        const params = TestEntity[updateMethod]({entityId, otherId, thirdId}).remove(['numParam', 'setParam', 'listParam']).params();
        expect(params.ExpressionAttributeNames['#entity_id']).to.equal('entity_id');
        expect(params.ExpressionAttributeNames['#other_id']).to.equal('other_id');
        expect(params.ExpressionAttributeNames['#third_id']).to.equal('third_id');
        expect(params.ExpressionAttributeNames['#numParam']).to.equal('num_param');
        expect(params.ExpressionAttributeNames['#setParam']).to.equal('set_param');
        expect(params.ExpressionAttributeNames['#listParam']).to.equal('list_param');
      });

      it('should translate attribute field names on data set', () => {
        const params = TestEntity[updateMethod]({entityId, otherId, thirdId}).data((attr, {set}) => {
          set(attr.numParam, numParam);
          set(attr.setParam, setParam);
          set(attr.listParam, listParam);
        }).params();
        expect(params.ExpressionAttributeNames['#entity_id']).to.equal('entity_id');
        expect(params.ExpressionAttributeNames['#other_id']).to.equal('other_id');
        expect(params.ExpressionAttributeNames['#third_id']).to.equal('third_id');
        expect(params.ExpressionAttributeNames['#numParam']).to.equal('num_param');
        expect(params.ExpressionAttributeNames['#setParam']).to.equal('set_param');
        expect(params.ExpressionAttributeNames['#listParam']).to.equal('list_param');
      });

      it('should translate attribute field names on data add', () => {
        const params = TestEntity[updateMethod]({entityId, otherId, thirdId}).data((attr, op) => {
          op.add(attr.numParam, numParam);
          op.add(attr.setParam, setParam);
        }).params();
        expect(params.ExpressionAttributeNames['#entity_id']).to.equal('entity_id');
        expect(params.ExpressionAttributeNames['#other_id']).to.equal('other_id');
        expect(params.ExpressionAttributeNames['#third_id']).to.equal('third_id');
        expect(params.ExpressionAttributeNames['#numParam']).to.equal('num_param');
        expect(params.ExpressionAttributeNames['#setParam']).to.equal('set_param');
      });

      it('should translate attribute field names on data delete', () => {
        const params = TestEntity[updateMethod]({entityId, otherId, thirdId}).data((attr, op) => {
          op.delete(attr.setParam, setParam);
        }).params();
        expect(params.ExpressionAttributeNames['#entity_id']).to.equal('entity_id');
        expect(params.ExpressionAttributeNames['#other_id']).to.equal('other_id');
        expect(params.ExpressionAttributeNames['#third_id']).to.equal('third_id');
        expect(params.ExpressionAttributeNames['#setParam']).to.equal('set_param');
      });

      it('should translate attribute field names on data subtract', () => {
        const params = TestEntity[updateMethod]({entityId, otherId, thirdId}).data((attr, op) => {
          op.subtract(attr.numParam, numParam);
        }).params();
        expect(params.ExpressionAttributeNames['#entity_id']).to.equal('entity_id');
        expect(params.ExpressionAttributeNames['#other_id']).to.equal('other_id');
        expect(params.ExpressionAttributeNames['#third_id']).to.equal('third_id');
        expect(params.ExpressionAttributeNames['#numParam']).to.equal('num_param');
      });

      it('should translate attribute field names on data append', () => {
        const params = TestEntity[updateMethod]({entityId, otherId, thirdId}).data((attr, op) => {
          op.append(attr.listParam, listParam);
        }).params();
        expect(params.ExpressionAttributeNames['#entity_id']).to.equal('entity_id');
        expect(params.ExpressionAttributeNames['#other_id']).to.equal('other_id');
        expect(params.ExpressionAttributeNames['#third_id']).to.equal('third_id');
        expect(params.ExpressionAttributeNames['#listParam']).to.equal('list_param');
      });

      it('should translate attribute field names on data remove', () => {
        const params = TestEntity[updateMethod]({entityId, otherId, thirdId}).data((attr, op) => {
          op.remove(attr.numParam);
          op.remove(attr.setParam);
          op.remove(attr.listParam);
        }).params();

        expect(params.ExpressionAttributeNames['#entity_id']).to.equal('entity_id');
        expect(params.ExpressionAttributeNames['#other_id']).to.equal('other_id');
        expect(params.ExpressionAttributeNames['#third_id']).to.equal('third_id');
        expect(params.ExpressionAttributeNames['#numParam']).to.equal('num_param');
        expect(params.ExpressionAttributeNames['#setParam']).to.equal('set_param');
        expect(params.ExpressionAttributeNames['#listParam']).to.equal('list_param');
      });
    });
  }

  const insertMethods = ['put', 'create'] as const;
  for (const insertMethod of insertMethods) {
    it(`should translate attribute field names on ${insertMethod} operation`, () => {
      const params = TestEntity[insertMethod]({entityId, otherId, thirdId, numParam, setParam, listParam}).params();
      expect(params.Item.entity_id).to.equal(entityId);
      expect(params.Item.other_id).to.equal(otherId);
      expect(params.Item.third_id).to.equal(thirdId);
      expect(params.Item.num_param).to.equal(numParam);
      expect(params.Item.list_param).to.deep.equal(listParam);
    });
  }

  describe('when performing queries', async () => {
    const sortKeyOperations = ['begins', 'gt', 'gte', 'lt', 'lte'] as const;
    for (const sortKeyOperation of sortKeyOperations) {
      it(`should translate attribute field names on when using the ${sortKeyOperation} sort key operation`, async () => {
        const params = TestEntity.query.test({entityId})[sortKeyOperation]({otherId, thirdId}).params();
        if (params.FilterExpression) {
          for (const [key, value] of Object.entries(params.ExpressionAttributeNames)) {
            if (key.includes('other')) {
              expect(value).to.equal('other_id');
            } else if (key.includes('third')) {
              expect(value).to.equal('third_id');
            }
          }
        }
      });
    }
  });

  describe('when performing filters', () => {
    const filterOperations = ['begins', 'between', 'contains', 'eq', 'escape', 'exists', 'eqOrNotExists', 'field', 'gt', 'gte', 'lt', 'lte', 'name', 'ne', 'notContains', 'notExists', 'size', 'type', 'value'] as const;

    it('test case should contain all filter operations', () => {
      let foundFilterOperations: string[] = [];
      TestEntity.query.test({entityId}).where((_, op) => {
        foundFilterOperations = Object.getOwnPropertyNames(op);
        return '';
      }).params();
      expect(foundFilterOperations.sort()).to.deep.equal([...filterOperations].sort());
    });

    for (const filterOperation of filterOperations) {
      it(`should translate attribute field names on when using the ${filterOperation} filter operation`, () => {
        const params = TestEntity.query.test({entityId, otherId, thirdId}).where((attr, op) => {
          switch (filterOperation) {
            case 'between':
              return `${op.between(attr.anyParam, 1, 2)}`;
            case 'exists':
            case 'notExists':
            case 'name':
              return `${op[filterOperation](attr.anyParam)}`;
            case 'type':
              return `${op.type(attr.anyParam, 'S')}`;
            case 'eqOrNotExists':
            case 'escape':
              return '';
            default:
              return `${op[filterOperation](attr.anyParam, anyParam)}`;
          }
        }).params();

        if (filterOperation === 'eqOrNotExists' || 'escape') {
          return;
        }
        const keyValue = Object.entries(params.ExpressionAttributeNames).find((([key]) => key.includes('any')));
        expect(keyValue).not.to.be.undefined;
        if (keyValue) {
          const [_, value] = keyValue;
          expect(value).to.equal(anyParam);
        }
      });
    }
  });

  describe('when attribute names have special characters', () => {
    const table = "electro";
    const serviceName = uuid();
    // example from original GitHub issue
    const weirdProp1 = 'example-key XXX _ 1 2 3 4' as const;
    // this will nest under, and be a valid attribute name
    const weirdProp2 = 'hello this is a full on sentence.' as const;
    // this one has ONLY invalid characters (special case that should be handled)
    const weirdProp3 = '\' -~!@#$%^&*()+="/?><.,`\'' as const;
    // this one has only invalid characters except two numbers (special case that should be handled)
    const weirdProp4 = '\' -~!@#$%^&*()+="/?><.,`\'55' as const;
    const entity = new Entity({
      model: {
        entity: "specialCharacters",
        version: "1",
        service: serviceName,
      },
      attributes: {
        prop1: {
          type: "string",
        },
        prop2: {
          type: "string",
        },
        prop3: {
          type: "string"
        },
        [weirdProp1]: {
          type: "map",
          required: true,
          properties: {
            [weirdProp2]: {
              type: 'number',
              required: true,
            },
            [weirdProp4]: {
              type: 'string',
              required: true,
            }
          }
        },
        [weirdProp3]: {
          type: 'string',
          required: true,
        }
      },
      indexes: {
        record: {
          pk: {
            field: "pk",
            composite: ["prop1"],
          },
          sk: {
            field: "sk",
            composite: ["prop2"]
          }
        }
      },
    }, { table, client });

    it('should create valid parameters with where query filters', async () => {
      const prop1 = uuid();
      await entity.create({
        prop1,
        prop2: 'value1',
        [weirdProp1]: {
          [weirdProp2]: 1,
          [weirdProp4]: 'test1',
        },
        [weirdProp3]: 'test1'
      }).go();

      await entity.create({
        prop1,
        prop2: 'value2',
        [weirdProp1]: {
          [weirdProp2]: 2,
          [weirdProp4]: 'test2',
        },
        [weirdProp3]: 'test2'
      }).go();

      await entity.create({
        prop1,
        prop2: 'value3',
        [weirdProp1]: {
          [weirdProp2]: 2,
          [weirdProp4]: 'test3',
        },
        [weirdProp3]: 'test3'
      }).go();

      const params = entity.query
          .record({ prop1 })
          .where((attr, { eq }) => `
            ${eq(attr[weirdProp1][weirdProp2], 2)} AND ${eq(attr[weirdProp3], 'test2')} AND ${eq(attr[weirdProp1][weirdProp4], 'test2')}
          `)
          .params();

      expect(params.ExpressionAttributeNames['#examplekeyXXX_1234']).to.equal(weirdProp1);
      expect(params.ExpressionAttributeNames['#hellothisisafullonsentence']).to.equal(weirdProp2);
      expect(params.ExpressionAttributeNames['#p']).to.equal(weirdProp3);
      expect(params.ExpressionAttributeNames['#p55']).to.equal(weirdProp4);

      const { data } = await entity.query
        .record({ prop1 })
        .where((attr, { eq }) => `
          ${eq(attr[weirdProp1][weirdProp2], 2)} AND ${eq(attr[weirdProp3], 'test2')} AND ${eq(attr[weirdProp1][weirdProp4], 'test2')}
        `)
        .go();

      expect(data.length).to.equal(1);
      expect(data[0].prop2).to.equal('value2');
    });

    it('should create valid parameters with where mutation conditions', async () => {
      const prop1 = uuid();
      const prop2 = "value1";
      const prop3 = "value2";
      await entity.create({
        prop1,
        prop2,
        [weirdProp1]: {
          [weirdProp2]: 1,
          [weirdProp4]: 'test1',
        },
        [weirdProp3]: 'test1'
      }).go();

      const params = entity.update({prop1, prop2})
          .set({ prop3 })
          .where((attr, { ne }) => `
            ${ne(attr[weirdProp1][weirdProp2], 1)} AND ${ne(attr[weirdProp3], 'test1')} AND ${ne(attr[weirdProp1][weirdProp4], 'test1')}
          `)
          .params();

      expect(params.ExpressionAttributeNames['#examplekeyXXX_1234']).to.equal(weirdProp1);
      expect(params.ExpressionAttributeNames['#hellothisisafullonsentence']).to.equal(weirdProp2);
      expect(params.ExpressionAttributeNames['#p']).to.equal(weirdProp3);
      expect(params.ExpressionAttributeNames['#p55']).to.equal(weirdProp4);

      const err = await entity.update({prop1, prop2})
          .set({ prop3 })
          .where((attr, { ne }) => `
            ${ne(attr[weirdProp1][weirdProp2], 1)} AND ${ne(attr[weirdProp3], 'test1')} AND ${ne(attr[weirdProp1][weirdProp4], 'test1')}
          `)
          .go()
          .then(() => null)
          .catch(e => e);

      expect(!!err).to.be.true;
      if (err) {
        expect(err.cause.code).to.equal('ConditionalCheckFailedException');
      }

      const { data } = await entity.patch({prop1, prop2})
          .set({ prop3 })
          .where((attr, { ne }) => `
            ${ne(attr[weirdProp1][weirdProp2], 2)} AND ${ne(attr[weirdProp3], 'test2')} AND ${ne(attr[weirdProp1][weirdProp4], 'test2')}
          `)
          .go({ response: 'all_new' });

      expect(data.prop3).to.equal(prop3);
    });

    it('should create valid parameters with where data updates', async () => {
      const prop1 = uuid();
      const prop2 = 'value1';
      await entity.create({
        prop1,
        prop2,
        [weirdProp1]: {
          [weirdProp2]: 1,
          [weirdProp4]: 'test1',
        },
        [weirdProp3]: 'test1'
      }).go();

      const params = entity.patch({prop1, prop2})
          .data((attr, op) => {
            op.set(attr[weirdProp1][weirdProp2], 2);
            op.set(attr[weirdProp1][weirdProp4], 'test2');
            op.set(attr[weirdProp3], 'test2');
          })
          .params();

      expect(params.ExpressionAttributeNames['#examplekeyXXX_1234']).to.equal(weirdProp1);
      expect(params.ExpressionAttributeNames['#hellothisisafullonsentence']).to.equal(weirdProp2);
      expect(params.ExpressionAttributeNames['#p']).to.equal(weirdProp3);
      expect(params.ExpressionAttributeNames['#p55']).to.equal(weirdProp4);

      const { data } = await entity.patch({prop1, prop2})
          .data((attr, op) => {
            op.set(attr[weirdProp1][weirdProp2], 2);
            op.set(attr[weirdProp1][weirdProp4], 'test2');
            op.set(attr[weirdProp3], 'test2');
          })
          .go({response: 'all_new'});

      expect(data[weirdProp1][weirdProp2]).to.equal(2);
      expect(data[weirdProp1][weirdProp4]).to.equal('test2');
      expect(data[weirdProp3]).to.equal('test2');
    });
  });
});

describe('index scope', () => {
  const serviceName = uuid();
  const withScope = new Entity(
      {
        model: {
          entity: serviceName,
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
          },
          prop4: {
            type: 'list',
            items: {
              type: 'string'
            }
          }
        },
        indexes: {
          test: {
            scope: 'scope1',
            pk: {
              field: "pk",
              composite: ["prop1"],
            },
            sk: {
              field: "sk",
              composite: ["prop2"],
            },
          },
          reverse: {
            index: 'gsi1pk-gsi1sk-index',
            scope: 'scope2',
            pk: {
              field: "gsi1pk",
              composite: ["prop2"],
            },
            sk: {
              field: "gsi1sk",
              composite: ["prop1"],
            },
          },
        },
      },
      { table: "electro", client }
  );

  const withoutScope = new Entity(
      {
        model: {
          entity: serviceName,
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
          },
          prop4: {
            type: 'list',
            items: {
              type: 'string'
            }
          }
        },
        indexes: {
          test: {
            pk: {
              field: "pk",
              composite: ["prop1"],
            },
            sk: {
              field: "sk",
              composite: ["prop2"],
            },
          },
          reverse: {
            index: 'gsi1pk-gsi1sk-index',
            pk: {
              field: "gsi1pk",
              composite: ["prop2"],
            },
            sk: {
              field: "gsi1sk",
              composite: ["prop1"],
            },
          },
        },
      },
      { table: "electro", client }
  );

  it('should add scope value to all keys', () => {
    const getParams = withScope.get({prop1: 'abc', prop2: 'def'}).params();
    expect(getParams.Key.pk).to.equal('$test_scope1#prop1_abc');

    const queryParams = withScope.query.test({prop1: 'abc'}).params();
    expect(queryParams.ExpressionAttributeValues[':pk']).to.equal('$test_scope1#prop1_abc');

    const queryParams2 = withScope.query.reverse({prop2: 'def'}).params();
    expect(queryParams2.ExpressionAttributeValues[':pk']).to.equal('$test_scope2#prop2_def');

    const scanParams = withScope.scan.params();
    expect(scanParams.ExpressionAttributeValues[':pk']).to.equal('$test_scope1#prop1_');

    const deleteParams = withScope.delete({prop1: 'abc', prop2: 'def'}).params();
    expect(deleteParams.Key.pk).to.equal('$test_scope1#prop1_abc');

    const removeParams = withScope.remove({prop1: 'abc', prop2: 'def'}).params();
    expect(removeParams.Key.pk).to.equal('$test_scope1#prop1_abc');

    const updateParams = withScope.update({prop1: 'abc', prop2: 'def'}).set({prop3: 'ghi'}).params();
    expect(updateParams.Key.pk).to.equal('$test_scope1#prop1_abc');

    const patchParams = withScope.patch({prop1: 'abc', prop2: 'def'}).set({prop3: 'ghi'}).params();
    expect(patchParams.Key.pk).to.equal('$test_scope1#prop1_abc');

    const putParams = withScope.put({prop1: 'abc', prop2: 'def'}).params();
    expect(putParams.Item.pk).to.equal('$test_scope1#prop1_abc');

    const createParams = withScope.create({prop1: 'abc', prop2: 'def'}).params();
    expect(createParams.Item.pk).to.equal('$test_scope1#prop1_abc');

    const upsertParams = withScope.upsert({prop1: 'abc', prop2: 'def'}).set({prop3: 'ghi'}).params();
    expect(upsertParams.Key.pk).to.equal('$test_scope1#prop1_abc');

    const batchGetParams = withScope.get([{prop1: 'abc', prop2: 'def'}]).params();
    expect(batchGetParams[0].RequestItems.electro.Keys[0].pk).to.equal('$test_scope1#prop1_abc');

    const batchDeleteParams = withScope.delete([{prop1: 'abc', prop2: 'def'}]).params();
    expect(batchDeleteParams[0].RequestItems.electro[0].DeleteRequest.Key.pk).to.equal('$test_scope1#prop1_abc');

    const batchPutParams = withScope.put([{prop1: 'abc', prop2: 'def'}]).params();
    expect(batchPutParams[0].RequestItems.electro[0].PutRequest.Item.pk).to.equal('$test_scope1#prop1_abc');

    const keys = withScope.conversions.fromComposite.toKeys({prop1: 'abc', prop2: 'def'});
    expect(keys.pk).to.equal('$test_scope1#prop1_abc');
    expect(keys.gsi1pk).to.equal('$test_scope2#prop2_def');

    const keysComposite = withScope.conversions.fromKeys.toComposite(keys);
    expect(keysComposite).to.deep.equal({prop1: 'abc', prop2: 'def'});

    const indexKeys = withScope.conversions.byAccessPattern.test.fromComposite.toKeys({prop1: 'abc', prop2: 'def'});
    expect(indexKeys.pk).to.equal('$test_scope1#prop1_abc');

    const indexKeysComposite = withScope.conversions.byAccessPattern.test.fromKeys.toComposite(indexKeys);
    expect(indexKeysComposite).to.deep.equal({prop1: 'abc', prop2: 'def'});

    const reverseKeys = withScope.conversions.byAccessPattern.reverse.fromComposite.toKeys({prop1: 'abc', prop2: 'def'});
    expect(reverseKeys.gsi1pk).to.equal('$test_scope2#prop2_def');
    expect(keys.pk).to.equal('$test_scope1#prop1_abc');

    const reverseKeysComposite = withScope.conversions.byAccessPattern.reverse.fromKeys.toComposite(reverseKeys);
    expect(reverseKeysComposite).to.deep.equal({prop1: 'abc', prop2: 'def'});
  });

  it('should query scoped indexes without issue', async () => {
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

    const [
      scopeRecord,
      withoutScopeRecord
    ] = await Promise.all([
        withScope.create(record1).go(),
        withoutScope.create(record2).go(),
    ]);

    expect(scopeRecord.data).to.deep.equal(record1);
    expect(withoutScopeRecord.data).to.deep.equal(record2);

    const scopeGet = await withScope.get({prop1, prop2}).go();
    expect(scopeGet.data).to.deep.equal(record1);

    const withoutScopeGet = await withoutScope.get({prop1, prop2}).go();
    expect(withoutScopeGet.data).to.deep.equal(record2);

    const scopeQuery = await withScope.query.test({prop1}).go();
    expect(scopeQuery.data).to.deep.equal([record1]);

    const withoutScopeQuery = await withoutScope.query.test({prop1}).go();
    expect(withoutScopeQuery.data).to.deep.equal([record2]);

    const reverseScopeQuery = await withScope.query.reverse({prop2}).go();
    expect(reverseScopeQuery.data).to.deep.equal([record1]);

    const reverseWithoutScopeQuery = await withoutScope.query.reverse({prop2}).go();
    expect(reverseWithoutScopeQuery.data).to.deep.equal([record2]);

    const batchGetScopeRecords = await withScope.get([{prop1, prop2}]).go();
    expect(batchGetScopeRecords.data).to.deep.equal([record1]);

    const batchGetWithoutScopeRecords = await withoutScope.get([{prop1, prop2}]).go();
    expect(batchGetWithoutScopeRecords.data).to.deep.equal([record2]);

    const updatedScopeRecord = await withScope.update({prop1, prop2}).set({prop4: ['updated1']}).go({response: 'all_new'});
    expect(updatedScopeRecord.data).to.deep.equal({
      ...record1,
      prop4: ['updated1'],
    });

    const updatedWithoutScopeRecord = await withoutScope.update({prop1, prop2}).set({prop4: ['updated2']}).go({response: 'all_new'});
    expect(updatedWithoutScopeRecord.data).to.deep.equal({
      ...record2,
      prop4: ['updated2'],
    });

    const patchedScopeRecord = await withScope.patch({prop1, prop2}).append({prop4: ['patched1']}).go({response: 'all_new'});
    expect(patchedScopeRecord.data).to.deep.equal({
      ...record1,
      prop4: ['updated1', 'patched1'],
    });

    const patchedWithoutScopeRecord = await withoutScope.patch({prop1, prop2}).append({prop4: ['patched2']}).go({response: 'all_new'});
    expect(patchedWithoutScopeRecord.data).to.deep.equal({
      ...record2,
      prop4: ['updated2', 'patched2'],
    });

    const upsertedScopeRecord = await withScope.upsert({prop1, prop2}).append({prop4: ['upserted1']}).go({response: 'all_new'});
    expect(upsertedScopeRecord.data).to.deep.equal({
      ...record1,
      prop4: ['updated1', 'patched1', 'upserted1'],
    });

    const upsertedWithoutScopeRecord = await withoutScope.upsert({prop1, prop2}).append({prop4: ['upserted2']}).go({response: 'all_new'});
    expect(upsertedWithoutScopeRecord.data).to.deep.equal({
      ...record2,
      prop4: ['updated2', 'patched2', 'upserted2'],
    });
  });
});

describe("index condition", () => {
  type IndexName = 'sparse1' | 'sparse2' | 'sparse3';
  type ConditionArguments = {
    index: IndexName;
    attr: any;
  }
  type TestEntityCondition = (options: ConditionArguments) => boolean;
  function createTestEntity(fn: TestEntityCondition) {
    return new Entity(
        {
          model: {
            entity: uuid(),
            service: uuid(),
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
              type: "string"
            },
            prop4: {
              type: "string"
            },
            prop5: {
              type: "string"
            },
            prop6: {
              type: "string"
            },
            prop7: {
              type: "string"
            },
            prop8: {
              type: "string"
            },
            prop9: {
              type: "string"
            }
          },
          indexes: {
            test: {
              collection: 'testing',
              pk: {
                field: "pk",
                composite: ["prop1"],
              },
              sk: {
                field: "sk",
                composite: ["prop2"],
              },
            },
            sparse1: {
              index: 'gsi1pk-gsi1sk-index',
              condition: (attr) => {
                return fn({index: 'sparse1', attr});
              },
              pk: {
                field: "gsi1pk",
                composite: ["prop1"],
              },
              sk: {
                field: "gsi1sk",
                composite: ["prop2"],
              },
            },
            sparse2: {
              index: 'gsi2pk-gsi2sk-index',
              condition: (attr) => {
                return fn({ index: 'sparse2', attr });
              },
              pk: {
                field: 'gsi2pk',
                composite: ['prop2', 'prop3']
              },
              sk: {
                field: 'gsi2sk',
                composite: ['prop1', 'prop4', 'prop5']
              }
            },
            sparse3: {
              index: 'gsi3pk-gsi3sk-index',
              condition: (attr) => {
                return fn({index: 'sparse3', attr});
              },
              pk: {
                field: 'gsi3pk',
                composite: ['prop6', 'prop7']
              },
              sk: {
                field: 'gsi3sk',
                composite: ['prop8', 'prop9']
              }
            }
          },
        },
        {table, client}
    );
  }

  function createTestEntityData(): EntityRecord<ReturnType<typeof createTestEntity>> {
    return {
      prop1: uuid(),
      prop2: uuid(),
      prop3: uuid(),
      prop4: uuid(),
      prop5: uuid(),
      prop6: uuid(),
      prop7: uuid(),
      prop8: uuid(),
      prop9: uuid(),
    }
  }

  function createConditionInvocationCollector(result: boolean) {
    let invocations: ConditionArguments[] = [];
    const condition: TestEntityCondition = (options) => {
      invocations.push(options);
      return result;
    }

    const clear = () => {
      invocations.length = 0;
    }

    return {
      clear,
      condition,
      invocations,
    }
  }

  function createParamsCollector() {
    let params: any;
    return {
      params: () => params,
      logger: (event: ElectroEvent) => {
        if (event.type === 'query') {
          params = event.params;
        }
      }
    }
  }

  function expectMessageIfThrows(fn: () => void, errMessage?: string) {
    let error: Error | undefined = undefined;
    try {
      fn();
    } catch(err: any) {
      error = err;
    }

    if (errMessage && !error) {
      throw new Error(`Expected error message: ${errMessage}`);
    } else if (errMessage && error) {
      expect(error.message).to.equal(errMessage);
    } else if (error) {
      throw error;
    }
  }

  const formatShouldStatement = (should: boolean) => `should${should ? ' ' : ' not '}`;

  describe('when all composite attributes are not provided', () => {
    const conditionCases  = [
        ['index condition is set and returns true', true],
        ['index condition is set and returns false', false],
        ['index condition is not set', undefined],
    ] as const;
    for (const [variation, setCondition] of conditionCases) {
      describe(`when composite attributes are distinct and ${variation}`, () => {
        const collector = createConditionInvocationCollector(!!setCondition);
        const conditionIsSet = setCondition !== undefined;
        const condition = conditionIsSet ? collector.condition : undefined;

        afterEach(() => {
          collector.clear();
        });

        const entity = new Entity(
            {
              model: {
                entity: uuid(),
                service: uuid(),
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
                  type: "string"
                },
              },
              indexes: {
                test: {
                  collection: 'testing',
                  pk: {
                    field: "pk",
                    composite: ["prop1"],
                  },
                  sk: {
                    field: "sk",
                    composite: ["prop2"],
                  },
                },
                sparse1: {
                  index: 'gsi1pk-gsi1sk-index',
                  // @ts-ignore
                  condition: condition,
                  pk: {
                    field: "gsi1pk",
                    composite: ["prop1"],
                  },
                  sk: {
                    field: "gsi1sk",
                    composite: ["prop2"],
                  },
                }
              },
            },
            {table, client}
        );

        it(`should not throw when impacting composite attributes on put`, () => {
          expectMessageIfThrows(() => {
            entity.put({
              prop1: uuid(),
              prop2: uuid(),
              prop3: uuid(),
            }).params();
          });

          if (conditionIsSet) {
            expect(collector.invocations.length).to.not.equal(0);
          }
        });

        it(`should not throw when impacting composite attributes on create`, () => {
          expectMessageIfThrows(() => {
            entity.create({
              prop1: uuid(),
              prop2: uuid(),
              prop3: uuid(),
            }).params();
          });

          if (conditionIsSet) {
            expect(collector.invocations.length).to.not.equal(0);
          }
        });

        it(`should not throw when impacting composite attributes on update`, () => {
          expectMessageIfThrows(() => {
            entity.update({ prop1: uuid(), prop2: uuid() })
                .set({ prop3: uuid() })
                .params();
          });

          if (conditionIsSet) {
            // when condition is "fixed" this should be changed to "to.not.equal(0)"
            expect(collector.invocations.length).to.not.equal(0);
          }
        });

        it(`should not throw when impacting composite attributes on patch`, () => {
          expectMessageIfThrows(() => {
            entity.patch({ prop1: uuid(), prop2: uuid() })
                .set({ prop3: uuid() })
                .params();
          });

          if (conditionIsSet) {
            // when condition is "fixed" this should be changed to "to.not.equal(0)"
            expect(collector.invocations.length).to.not.equal(0);
          }
        });

        it(`should not throw when impacting composite attributes on upsert`, () => {
          expectMessageIfThrows(() => {
            entity.upsert({
              prop1: uuid(),
              prop2: uuid(),
              prop3: uuid(),
            }).params();
          });

          if (conditionIsSet) {
            expect(collector.invocations.length).to.not.equal(0);
          }
        });
      });

      describe(`when composite attributes share main table index composites and ${variation}`, () => {
        const collector = createConditionInvocationCollector(!!setCondition);
        const conditionIsSet = setCondition !== undefined;
        const condition = conditionIsSet ? collector.condition : undefined;

        const entity = new Entity(
            {
              model: {
                entity: uuid(),
                service: uuid(),
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
                  type: "string"
                },
                prop4: {
                  type: "string"
                },
                prop5: {
                  type: "string"
                },
                prop6: {
                  type: "string"
                },
              },
              indexes: {
                test: {
                  collection: 'testing',
                  pk: {
                    field: "pk",
                    composite: ["prop1"],
                  },
                  sk: {
                    field: "sk",
                    composite: ["prop2"],
                  },
                },
                sparse2: {
                  index: 'gsi2pk-gsi2sk-index',
                  // @ts-ignore
                  condition: condition,
                  pk: {
                    field: 'gsi2pk',
                    composite: ['prop2', 'prop3']
                  },
                  sk: {
                    field: 'gsi2sk',
                    composite: ['prop1', 'prop4', 'prop5']
                  }
                },
              },
            },
            {table, client}
        );

        beforeEach(() => {
          collector.clear();
        });

        it(`${formatShouldStatement(conditionIsSet)}throw when partially providing composite attributes on put`, () => {
          const message = conditionIsSet
              ? 'Incomplete composite attributes provided for index gsi2pk-gsi2sk-index. Write operations that include composite attributes, for indexes with a condition callback defined, must always provide values for every index composite. This is to ensure consistency between index values and attribute values. Missing composite attributes identified: "prop3" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#invalid-index-composite-attributes-provided'
              : `Incomplete composite attributes: Without the composite attributes "prop3" the following access patterns cannot be updated: "sparse2". If a composite attribute is readOnly and cannot be set, use the 'composite' chain method on update to supply the value for key formatting purposes. - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#incomplete-composite-attributes`;

          expectMessageIfThrows(() => {
            entity.put({
              prop1: uuid(),
              prop2: uuid(),
              prop4: uuid(),
              prop5: uuid(),
            }).params();
          }, message);

          expect(collector.invocations.length).to.equal(0);
        });

        it(`${formatShouldStatement(conditionIsSet)}throw when missing composite attributes on put`, () => {
          const message = conditionIsSet
              ? 'Incomplete composite attributes provided for index gsi2pk-gsi2sk-index. Write operations that include composite attributes, for indexes with a condition callback defined, must always provide values for every index composite. This is to ensure consistency between index values and attribute values. Missing composite attributes identified: "prop3", "prop4", "prop5" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#invalid-index-composite-attributes-provided'
              : 'Incomplete composite attributes: Without the composite attributes "prop3", "prop4", "prop5" the following access patterns cannot be updated: "sparse2". If a composite attribute is readOnly and cannot be set, use the \'composite\' chain method on update to supply the value for key formatting purposes. - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#incomplete-composite-attributes';

          expectMessageIfThrows(() => {
            entity.put({
              prop1: uuid(),
              prop2: uuid(),
              prop6: uuid(),
            }).params();
          }, message);

          expect(collector.invocations.length).to.equal(0);
        });

        it(`${formatShouldStatement(conditionIsSet)}throw when partially providing composite attributes on create`, () => {
          const message = conditionIsSet
              ? 'Incomplete composite attributes provided for index gsi2pk-gsi2sk-index. Write operations that include composite attributes, for indexes with a condition callback defined, must always provide values for every index composite. This is to ensure consistency between index values and attribute values. Missing composite attributes identified: "prop4", "prop5" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#invalid-index-composite-attributes-provided'
              : 'Incomplete composite attributes: Without the composite attributes "prop4", "prop5" the following access patterns cannot be updated: "sparse2". If a composite attribute is readOnly and cannot be set, use the \'composite\' chain method on update to supply the value for key formatting purposes. - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#incomplete-composite-attributes';

          expectMessageIfThrows(() => {
            entity.create({
              prop1: uuid(),
              prop2: uuid(),
              prop3: uuid(),
            }).params();
          }, message);

          expect(collector.invocations.length).to.equal(0);
        });

        it(`${formatShouldStatement(conditionIsSet)}throw when missing composite attributes on create`, () => {
          const message = conditionIsSet
              ? 'Incomplete composite attributes provided for index gsi2pk-gsi2sk-index. Write operations that include composite attributes, for indexes with a condition callback defined, must always provide values for every index composite. This is to ensure consistency between index values and attribute values. Missing composite attributes identified: "prop3", "prop4", "prop5" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#invalid-index-composite-attributes-provided'
              : `Incomplete composite attributes: Without the composite attributes "prop3", "prop4", "prop5" the following access patterns cannot be updated: "sparse2". If a composite attribute is readOnly and cannot be set, use the 'composite' chain method on update to supply the value for key formatting purposes. - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#incomplete-composite-attributes`;

          expectMessageIfThrows(() => {
            entity.create({
              prop1: uuid(),
              prop2: uuid(),
              prop6: uuid(),
            }).params();
          }, message);

          expect(collector.invocations.length).to.equal(0);
        });

        it(`${formatShouldStatement(conditionIsSet)}throw when missing composite attributes on update`, () => {
          // Should remain after condition "fix", why throw when the user isn't trying to mutate prop3, prop4, or prop5.
          // Throwing would hurt dx because prop1 and prop2 are main table composites (ie immutable) and their presence
          // in the GSI would cause an undue burden on EVERY update operation.
          const message = undefined; // conditionIsSet ? 'Oops!' : undefined;

          expectMessageIfThrows(() => {
            entity.update({
              prop1: uuid(),
              prop2: uuid(),
            }).set({ prop6: uuid() }).params();
          }, message);

          expect(collector.invocations.length).to.equal(0);
        });

        it(`${formatShouldStatement(conditionIsSet)}throw when partially providing composite attributes on update`, () => {
          // this should throw when a condition cb is set because this would cause a recalculation but is missing prop3 for the index
          const message = conditionIsSet
              ? 'Incomplete composite attributes provided for index gsi2pk-gsi2sk-index. Write operations that include composite attributes, for indexes with a condition callback defined, must always provide values for every index composite. This is to ensure consistency between index values and attribute values. Missing composite attributes identified: "prop3" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#invalid-index-composite-attributes-provided'
              : undefined;

          expectMessageIfThrows(() => {
            entity.update({
              prop1: uuid(),
              prop2: uuid(),
            }).set({ prop4: uuid(), prop5: uuid() }).params();
          }, message);

          expect(collector.invocations.length).to.equal(0);
        });

        it(`${formatShouldStatement(conditionIsSet)}throw when partially providing composite attributes on patch`, () => {
          // this should throw when a condition cb is set because this would cause a recalculation but is missing prop4 and prop5 for the index
          const message = setCondition === undefined ? undefined : 'Incomplete composite attributes provided for index gsi2pk-gsi2sk-index. Write operations that include composite attributes, for indexes with a condition callback defined, must always provide values for every index composite. This is to ensure consistency between index values and attribute values. Missing composite attributes identified: "prop4", "prop5" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#invalid-index-composite-attributes-provided';

          expectMessageIfThrows(() => {
            entity.patch({
              prop1: uuid(),
              prop2: uuid(),
            }).set({ prop3: uuid() }).params();
          }, message);

          expect(collector.invocations.length).to.equal(0);
        });

        it(`${formatShouldStatement(conditionIsSet)}throw when partially providing composite attributes on upsert`, () => {
          const message = conditionIsSet
              ? 'Incomplete composite attributes provided for index gsi2pk-gsi2sk-index. Write operations that include composite attributes, for indexes with a condition callback defined, must always provide values for every index composite. This is to ensure consistency between index values and attribute values. Missing composite attributes identified: "prop3" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#invalid-index-composite-attributes-provided'
              : `Incomplete composite attributes: Without the composite attributes "prop3" the following access patterns cannot be updated: "sparse2". If a composite attribute is readOnly and cannot be set, use the 'composite' chain method on update to supply the value for key formatting purposes. - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#incomplete-composite-attributes`;

          expectMessageIfThrows(() => {
            entity.upsert({
              prop1: uuid(),
              prop2: uuid(),
              prop5: uuid(),
              prop4: uuid(),
            }).params();
          }, message);

          expect(collector.invocations.length).to.equal(0);
        });

        it(`${formatShouldStatement(conditionIsSet)}throw when missing composite attributes on upsert`, () => {
          const message = conditionIsSet
            ? 'Incomplete composite attributes provided for index gsi2pk-gsi2sk-index. Write operations that include composite attributes, for indexes with a condition callback defined, must always provide values for every index composite. This is to ensure consistency between index values and attribute values. Missing composite attributes identified: "prop3", "prop4", "prop5" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#invalid-index-composite-attributes-provided'
            : 'Incomplete composite attributes: Without the composite attributes "prop3", "prop4", "prop5" the following access patterns cannot be updated: "sparse2". If a composite attribute is readOnly and cannot be set, use the \'composite\' chain method on update to supply the value for key formatting purposes. - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#incomplete-composite-attributes';

          expectMessageIfThrows(() => {
            entity.upsert({
              prop1: uuid(),
              prop2: uuid(),
              prop6: uuid(),
            }).params();
          }, message);

          expect(collector.invocations.length).to.equal(0);
        });
      });

      describe(`when composite attributes are identical to main table index and ${variation}`, () => {
        const collector = createConditionInvocationCollector(!!setCondition);
        const conditionIsSet = setCondition !== undefined;
        const condition = conditionIsSet ? collector.condition : undefined;
        const entity = new Entity(
            {
              model: {
                entity: uuid(),
                service: uuid(),
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
                  type: "string"
                },
                prop4: {
                  type: "string"
                },
                prop5: {
                  type: "string"
                },
                prop6: {
                  type: "string"
                },
                prop7: {
                  type: "string"
                },
                prop8: {
                  type: "string"
                },
                prop9: {
                  type: "string"
                }
              },
              indexes: {
                test: {
                  collection: 'testing',
                  pk: {
                    field: "pk",
                    composite: ["prop1"],
                  },
                  sk: {
                    field: "sk",
                    composite: ["prop2"],
                  },
                },
                sparse3: {
                  index: 'gsi3pk-gsi3sk-index',
                  // @ts-ignore
                  condition: condition,
                  pk: {
                    field: 'gsi3pk',
                    composite: ['prop6', 'prop7']
                  },
                  sk: {
                    field: 'gsi3sk',
                    composite: ['prop8', 'prop9']
                  }
                }
              },
            },
            {table, client}
        );

        beforeEach(() => {
          collector.clear();
        });

        it('should not throw when providing unused composite attributes on update', () => {
          expectMessageIfThrows(() => {
            entity.update({
              prop1: uuid(),
              prop2: uuid(),
            }).composite({ prop6: uuid(), prop7: uuid() }).params();
            expect(collector.invocations.length).to.equal(0);
          });
        });

        it('should not throw when providing unused composite attributes on update', () => {
          expectMessageIfThrows(() => {
            entity.patch({
              prop1: uuid(),
              prop2: uuid(),
            }).composite({prop8: uuid(), prop9: uuid()}).params();
            expect(collector.invocations.length).to.equal(0);
          });
        });

        it(`${formatShouldStatement(conditionIsSet)}throw when partially providing composite attributes on put`, () => {
          const message = conditionIsSet ? 'Incomplete composite attributes provided for index gsi3pk-gsi3sk-index. Write operations that include composite attributes, for indexes with a condition callback defined, must always provide values for every index composite. This is to ensure consistency between index values and attribute values. Missing composite attributes identified: "prop8", "prop9" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#invalid-index-composite-attributes-provided' : undefined;

          expectMessageIfThrows(() => {
            entity.put({
              prop1: uuid(),
              prop2: uuid(),
              prop7: uuid(),
              prop6: uuid(),
            }).params();
          }, message);

          expect(collector.invocations.length).to.equal(0);
        });

        it(`${formatShouldStatement(conditionIsSet)}throw when partially providing composite attributes on create`, () => {
          const message = conditionIsSet ? 'Incomplete composite attributes provided for index gsi3pk-gsi3sk-index. Write operations that include composite attributes, for indexes with a condition callback defined, must always provide values for every index composite. This is to ensure consistency between index values and attribute values. Missing composite attributes identified: "prop6", "prop7" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#invalid-index-composite-attributes-provided' : undefined;

          expectMessageIfThrows(() => {
            entity.create({
              prop1: uuid(),
              prop2: uuid(),
              prop8: uuid(),
              prop9: uuid(),
            }).params();
          }, message);

          expect(collector.invocations.length).to.equal(0);
        });

        it(`${formatShouldStatement(conditionIsSet)}throw when partially providing composite attributes on update`, () => {
          const message = conditionIsSet ? 'Incomplete composite attributes provided for index gsi3pk-gsi3sk-index. Write operations that include composite attributes, for indexes with a condition callback defined, must always provide values for every index composite. This is to ensure consistency between index values and attribute values. Missing composite attributes identified: "prop8", "prop9" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#invalid-index-composite-attributes-provided' : undefined;

          expectMessageIfThrows(() => {
            entity.update({
              prop1: uuid(),
              prop2: uuid(),
            }).set({prop6: uuid(), prop7: uuid()}).params();
          }, message);

          expect(collector.invocations.length).to.equal(0);

          expectMessageIfThrows(() => {
            entity.update({ prop1: uuid(), prop2: uuid() })
                .set({ prop6: uuid(), prop7: uuid() })
                .composite({ prop8: uuid(), prop9: uuid() })
                .params();
          });

          if (conditionIsSet) {
            expect(collector.invocations.length).to.equal(1);
            for (let i = 0; i < collector.invocations.length; i++) {
              const prev = collector.invocations[i - 1];
              const invocation = collector.invocations[i];
              expect(invocation).to.have.keys('prop1', 'prop2', 'prop6', 'prop7', 'prop8', 'prop9');
              if (prev) {
                expect(prev).to.deep.equal(invocation)
              }
            }
          }
        });

        it(`${formatShouldStatement(conditionIsSet)}throw when partially providing composite attributes on patch`, () => {
          const message = conditionIsSet ? 'Incomplete composite attributes provided for index gsi3pk-gsi3sk-index. Write operations that include composite attributes, for indexes with a condition callback defined, must always provide values for every index composite. This is to ensure consistency between index values and attribute values. Missing composite attributes identified: "prop6", "prop7" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#invalid-index-composite-attributes-provided' : undefined;

          expectMessageIfThrows(() => {
            entity.patch({
              prop1: uuid(),
              prop2: uuid(),
            }).set({prop8: uuid(), prop9: uuid()}).params();
          }, message);

          expect(collector.invocations.length).to.equal(0);

          expectMessageIfThrows(() => {
            entity.patch({ prop1: uuid(), prop2: uuid() })
                .set({ prop8: uuid(), prop9: uuid() })
                .composite({ prop6: uuid(), prop7: uuid() })
                .params();
          });

          if (conditionIsSet) {
            expect(collector.invocations.length).to.equal(1);
            for (let i = 0; i <  collector.invocations.length; i++) {
              const prev = collector.invocations[i - 1];
              const invocation = collector.invocations[i];
              expect(invocation).to.have.keys('prop1', 'prop2', 'prop6', 'prop7', 'prop8', 'prop9');
              if (prev) {
                expect(prev).to.deep.equal(invocation)
              }
            }
          }
        });

        it(`${formatShouldStatement(conditionIsSet)}throw when partially providing composite attributes on upsert`, () => {
          const message = conditionIsSet ? 'Incomplete composite attributes provided for index gsi3pk-gsi3sk-index. Write operations that include composite attributes, for indexes with a condition callback defined, must always provide values for every index composite. This is to ensure consistency between index values and attribute values. Missing composite attributes identified: "prop8", "prop9" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#invalid-index-composite-attributes-provided' : undefined;

          expectMessageIfThrows(() => {
            entity.upsert({
              prop1: uuid(),
              prop2: uuid(),
              prop6: uuid(),
              prop7: uuid(),
            }).params();
          }, message);

          expect(collector.invocations.length).to.equal(0);
        });
      });
    }
  });

  it('should throw if condition is added to the main table index', () => {
    expect(() => new Entity({
      model: {
        entity: 'test',
        version: '1',
        service: 'test',
      },
      attributes: {
        prop1: {
          type: 'string'
        },
        prop2: {
          type: 'string'
        }
      },
      indexes: {
        record: {
          condition: () => true,
          pk: {
            field: 'pk',
            composite: ['prop1']
          },
          sk: {
            field: 'sk',
            composite: ['prop2']
          }
        }
      }
    })).to.throw("The index option 'condition' is only allowed on secondary indexes - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#invalid-index-option");
  });

  it('should prevent thrown exception from partial index update', () => {
    let conditionValue = false;
    const entity = new Entity({
      model: {
        entity: 'test',
        version: '1',
        service: 'test',
      },
      attributes: {
        prop1: {
          type: 'string'
        },
        prop2: {
          type: 'string'
        },
        prop3: {
          type: 'string'
        },
        prop4: {
          type: 'string'
        },
        prop5: {
          type: 'string'
        }
      },
      indexes: {
        record: {
          pk: {
            field: 'pk',
            composite: ['prop1']
          },
          sk: {
            field: 'sk',
            composite: ['prop2']
          }
        },
        secondary: {
          condition: () => conditionValue,
          index: 'gsi1pk-gsi1sk-index',
          pk: {
            field: 'gsi1pk',
            composite: ['prop3']
          },
          sk: {
            field: 'gsi1sk',
            composite: ['prop4', 'prop5']
          }
        }
      }
    }, { table });

    const prop1 = uuid();
    const prop2 = uuid();
    const prop3 = uuid();
    const prop4 = uuid();
    const prop5 = uuid();

    conditionValue = false;
    expect(() => entity.update({prop1, prop2}).set({prop3, prop5}).params()).to.throw('Incomplete composite attributes provided for index gsi1pk-gsi1sk-index. Write operations that include composite attributes, for indexes with a condition callback defined, must always provide values for every index composite. This is to ensure consistency between index values and attribute values. Missing composite attributes identified: "prop4" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#invalid-index-composite-attributes-provided');

    conditionValue = true;
    expect(() => entity.update({prop1, prop2}).set({prop3, prop5}).params()).to.throw('Incomplete composite attributes provided for index gsi1pk-gsi1sk-index. Write operations that include composite attributes, for indexes with a condition callback defined, must always provide values for every index composite. This is to ensure consistency between index values and attribute values. Missing composite attributes identified: "prop4" - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#invalid-index-composite-attributes-provided');
  });

  it('should check the index condition individually on the subject entity', () => {
    const collector1 = createConditionInvocationCollector(true);
    const collector2 = createConditionInvocationCollector(false);
    const data1 = createTestEntityData();
    const data2 = createTestEntityData();
    const entity1 = createTestEntity(collector1.condition);
    const entity2 = createTestEntity(collector2.condition);

    createWriteTransaction({ entity1, entity2 }, ({ entity1, entity2 }) => [
      entity1.put(data1).commit(),
      entity2.put(data2).commit(),
    ]).params();

    for (const invocation of collector1.invocations) {
      expect(invocation.attr).to.deep.equal(data1);
    }

    for (const invocation of collector2.invocations) {
      expect(invocation.attr).to.deep.equal(data2);
    }
  });

  type TestCase = [description: string, index: keyof (ReturnType<typeof createTestEntity>['query'])]
  const tests: TestCase[] = [
    ["an index with identical pk and sk composite attributes as the main table index", 'sparse1'],
    ["an index with at least the pk and sk composite attributes as the main table index", 'sparse2'],
    ["an index with distinct composite attributes", "sparse3"],
  ];
  for (const [description, index] of tests) {
    describe(`when using a conditional index with ${description}`, () => {
      for (const shouldWrite of [true, false]) {
        const prefix = shouldWrite ? 'should' : 'should not';
        it(`${prefix} write index with provided put attributes`, async () => {
          const { condition, invocations } = createConditionInvocationCollector(shouldWrite);
          const { params, logger } = createParamsCollector();
          const props = createTestEntityData();
          const entity = createTestEntity(condition);
          await entity.put(props).go({logger});

          // @ts-ignore
          const { data } = await entity.query[index](props).go();
          if (shouldWrite) {
            expect(data.length).to.equal(1);
            expect(data[0]).to.deep.equal(props);
            expect(params().Item[entity.schema.indexes[index].pk.field]).to.not.equal(undefined);
            expect(params().Item[entity.schema.indexes[index].sk.field]).to.not.equal(undefined);
          } else {
            expect(data.length).to.equal(0);
            expect(params().Item[entity.schema.indexes[index].pk.field]).to.equal(undefined);
            expect(params().Item[entity.schema.indexes[index].sk.field]).to.equal(undefined);
          }

          for (const invocation of invocations) {
            expect(invocation.attr).to.deep.equal(props);
          }
        });

        it(`${prefix} write index with provided create attributes`, async () => {
          const { condition, invocations } = createConditionInvocationCollector(shouldWrite);
          const { params, logger } = createParamsCollector();
          const props = createTestEntityData();
          const entity = createTestEntity(condition);
          await entity.create(props).go({logger});
          // @ts-ignore
          const { data } = await entity.query[index](props).go();
          if (shouldWrite) {
            expect(data.length).to.equal(1);
            expect(data[0]).to.deep.equal(props);
            expect(params().Item[entity.schema.indexes[index].pk.field]).to.not.equal(undefined);
            expect(params().Item[entity.schema.indexes[index].sk.field]).to.not.equal(undefined);
          } else {
            expect(data.length).to.equal(0);
            expect(params().Item[entity.schema.indexes[index].pk.field]).to.equal(undefined);
            expect(params().Item[entity.schema.indexes[index].sk.field]).to.equal(undefined);
          }

          for (const invocation of invocations) {
            expect(invocation.attr).to.deep.equal(props);
          }
        });

        it(`${prefix} write index with provided upsert attributes`, async () => {
          const { condition, invocations } = createConditionInvocationCollector(shouldWrite);
          const { params, logger } = createParamsCollector();
          const props = createTestEntityData();
          const entity = createTestEntity(condition);
          await entity.upsert(props).go({logger});
          // @ts-ignore
          const { data } = await entity.query[index](props).go();
          if (shouldWrite) {
            expect(data.length).to.equal(1);
            expect(data[0]).to.deep.equal(props);
          } else {
            expect(data.length).to.equal(0);
          }

          for (const invocation of invocations) {
            expect(invocation.attr).to.deep.equal(props);
          }
        });

        it(`${prefix} write index with provided upsert attributes across multiple method calls`, async () => {
          const { condition, invocations } = createConditionInvocationCollector(shouldWrite);
          const { params, logger } = createParamsCollector();
          const props = createTestEntityData();
          const entity = createTestEntity(condition);
          await entity.upsert({})
              .set({ prop1: props.prop1 })
              .set({ prop2: props.prop2 })
              .set({ prop3: props.prop3 })
              .set({ prop4: props.prop4 })
              .set({ prop5: props.prop5 })
              .set({ prop6: props.prop6 })
              .set({ prop7: props.prop7 })
              .set({ prop8: props.prop8 })
              .set({ prop9: props.prop9 })
              .go({logger});
          // @ts-ignore
          const { data } = await entity.query[index](props).go();
          if (shouldWrite) {
            expect(data.length).to.equal(1);
            expect(data[0]).to.deep.equal(props);
          } else {
            expect(data.length).to.equal(0);
          }

          for (const invocation of invocations) {
            expect(invocation.attr).to.deep.equal(props);
          }
        });


        it(`${prefix} write index with provided update attributes`, async () => {
          const {condition, invocations} = createConditionInvocationCollector(shouldWrite);
          const {params, logger} = createParamsCollector();
          const {prop1, prop2, ...props} = createTestEntityData();
          const entity = createTestEntity(condition);
          await entity.update({prop1, prop2}).set(props).go({logger});
          // @ts-ignore
          const {data} = await entity.query[index]({prop1, prop2, ...props}).go();
          if (shouldWrite) {
            expect(data.length).to.equal(1);
            expect(data[0]).to.deep.equal({prop1, prop2, ...props});
          } else {
            expect(data.length).to.equal(0);
          }

          for (const invocation of invocations) {
            expect(invocation.attr).to.deep.equal({prop1, prop2, ...props});
          }
        });

        it(`${prefix} write index with provided update attributes spread across multiple method calls`, async () => {
          const {condition, invocations} = createConditionInvocationCollector(shouldWrite);
          const {params, logger} = createParamsCollector();
          const {prop1, prop2, ...props} = createTestEntityData();
          const entity = createTestEntity(condition);
          await entity.update({prop1, prop2}).set({
            prop3: props.prop3,
            prop4: props.prop4,
          }).set({
            prop5: props.prop5,
            prop6: props.prop6,
          }).set({
            prop7: props.prop7,
            prop8: props.prop8,
            prop9: props.prop9,
          }).go({logger});
          // @ts-ignore
          const {data} = await entity.query[index]({prop1, prop2, ...props}).go();
          if (shouldWrite) {
            expect(data.length).to.equal(1);
            expect(data[0]).to.deep.equal({prop1, prop2, ...props});
          } else {
            expect(data.length).to.equal(0);
          }

          for (const invocation of invocations) {
            expect(invocation.attr).to.deep.equal({prop1, prop2, ...props});
          }
        });

        it(`${prefix} write index with provided patch attributes`, async () => {
          const {params, logger} = createParamsCollector();
          const {prop1, prop2, ...props} = createTestEntityData();
          const { prop1: _, prop2: __, ...initialValues } = createTestEntityData();
          let invocations: ConditionArguments[] = [];
          let allow = true;
          const condition = (args: ConditionArguments) => {
            invocations.push(args);
            return allow;
          }

          expect(props).to.not.deep.equal(initialValues);

          const entity = createTestEntity(condition);

          await entity.put({ prop1, prop2, ...initialValues }).go();

          // record should exist with temp values because `allow=true`
          // @ts-ignore
          const results = await entity.query[index]({ prop1, prop2, ...initialValues }).go();
          expect(results.data.length).to.equal(1);
          expect(results.data[0]).to.deep.equal({ prop1, prop2, ...initialValues });


          allow = false;
          // record should no longer exist on GSIs because `allow=false`
          await entity.put({ prop1, prop2, ...initialValues }).go();
          // @ts-ignore
          const results2 = await entity.query[index]({ prop1, prop2, ...initialValues }).go();
          // the main table index will always contain the item, but not the other GSIs
          const expectedLength = index === 'test' ? 1 : 0;
          expect(results2.data.length).to.equal(expectedLength);

          // "reset" `allow` and "reset" `invocations`
          allow = shouldWrite;
          invocations = [];

          await entity.patch({ prop1, prop2 }).set(props).go({ logger });
          // @ts-ignore
          const {data} = await entity.query[index]({prop1, prop2, ...props}).go();
          if (shouldWrite) {
            // patch should have added item to index
            expect(data.length).to.equal(1);
            expect(data[0]).to.deep.equal({prop1, prop2, ...props});
          } else {
            // patch should have removed item from index
            expect(data.length).to.equal(0);
          }

          for (const invocation of invocations) {
            expect(invocation.attr).to.deep.equal({ prop1, prop2, ...props });
          }
        });

        it(`${prefix} write index with provided batchPut attributes`, async () => {
          const { condition, invocations } = createConditionInvocationCollector(shouldWrite);
          const { params, logger } = createParamsCollector();
          const props = createTestEntityData();
          const entity = createTestEntity(condition);
          await entity.put([props]).go({logger});
          // @ts-ignore
          const { data } = await entity.query[index](props).go();
          if (shouldWrite) {
            expect(data.length).to.equal(1);
            expect(data[0]).to.deep.equal(props);
          } else {
            expect(data.length).to.equal(0);
          }

          for (const invocation of invocations) {
            expect(invocation.attr).to.deep.equal(props);
          }
        });

        it(`${prefix} write index with provided transactWrite attributes`, async () => {
          const { condition, invocations } = createConditionInvocationCollector(shouldWrite);
          const { params, logger } = createParamsCollector();
          const props = createTestEntityData();
          const entity = createTestEntity(condition);
          await createWriteTransaction({ entity }, ({ entity }) => [
            entity.put(props).commit(),
          ]).go({logger});
          // @ts-ignore
          const { data } = await entity.query[index](props).go();
          if (shouldWrite) {
            expect(data.length).to.equal(1);
            expect(data[0]).to.deep.equal(props);
          } else {
            expect(data.length).to.equal(0);
          }

          for (const invocation of invocations) {
            expect(invocation.attr).to.deep.equal(props);
          }
        });
      }
    });
  }

  it('should fix gh issue 366', async () => {
    const entityName = uuid();
    const updatedAt = new Date().toJSON();
    const createdAt = new Date().toJSON();
    const Thing = new Entity(
        {
          model: {
            service: 'test',
            entity: entityName,
            version: '1'
          },
          attributes: {
            id: {
              type: 'string',
              required: true,
              readOnly: true
            },
            organizationId: {
              type: 'string',
              required: true,
              readOnly: true
            },
            accountId: {
              type: 'string'
            },
            createdAt: {
              type: 'string',
              readOnly: true,
              required: true,
              default: () => createdAt,
              set: () => createdAt
            },
            updatedAt: {
              type: 'string',
              watch: '*',
              required: true,
              default: () => updatedAt,
              set: () => updatedAt
            },
            settledAt: {
              type: 'string',
              default: 'n/a'
            },
            effectiveAt: {
              type: 'string',
              default: 'n/a'
            },
            type: {
              type: 'string',
              required: true
            },
            category: {
              type: 'string',
              required: true
            },
            amount: {
              type: 'string',
              required: true
            },
            description: {
              type: 'string'
            }
          },
          indexes: {
            entries: {
              pk: {
                field: 'pk',
                composite: ['organizationId']
              },
              sk: {
                field: 'sk',
                composite: ['id']
              }
            },
            entriesByAccount: {
              index: 'gsi1pk-gsi1sk-index',
              pk: {
                field: 'gsi1pk',
                composite: ['organizationId']
              },
              sk: {
                field: 'gsi1sk',
                composite: ['accountId', 'id']
              }
            },
            entriesBySettledDate: {
              index: 'gsi2pk-gsi2sk-index',
              condition: (attr) => attr.settledAt !== 'n/a',
              pk: {
                field: 'gsi2pk',
                composite: ['organizationId']
              },
              sk: {
                field: 'gsi2sk',
                composite: ['settledAt']
              }
            },
            entriesByEffectiveDate: {
              index: 'gsi3pk-gsi3sk-index',
              condition: (attr) => attr.effectiveAt !== 'n/a',
              pk: {
                field: 'gsi3pk',
                composite: ['organizationId']
              },
              sk: {
                field: 'gsi3sk',
                composite: ['effectiveAt']
              }
            }
          }
        },
        { table, client }
    );

    // with `effectiveAt` set to 'n/a' and `settledAt` set to 'today' the `entriesByEffectiveDate` index should not be written
    const params1 = Thing.patch({ id: '123', organizationId: '123' })
        .set({ effectiveAt: 'n/a', accountId: '123', settledAt: 'today' })
        .params();

    expect(params1).to.deep.equal({
      "UpdateExpression": "SET #effectiveAt = :effectiveAt_u0, #accountId = :accountId_u0, #settledAt = :settledAt_u0, #updatedAt = :updatedAt_u0, #gsi1sk = :gsi1sk_u0, #gsi2pk = :gsi2pk_u0, #gsi2sk = :gsi2sk_u0, #organizationId = :organizationId_u0, #id = :id_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0 REMOVE #gsi3pk, #gsi3sk",
      "ExpressionAttributeNames": {
        "#pk": "pk",
        "#sk": "sk",
        "#accountId": "accountId",
        "#settledAt": "settledAt",
        "#updatedAt": "updatedAt",
        "#effectiveAt": "effectiveAt",
        "#gsi1sk": "gsi1sk",
        "#gsi2pk": "gsi2pk",
        "#gsi2sk": "gsi2sk",
        "#gsi3pk": "gsi3pk",
        "#gsi3sk": "gsi3sk",
        "#organizationId": "organizationId",
        "#id": "id",
        "#__edb_e__": "__edb_e__",
        "#__edb_v__": "__edb_v__"
      },
      "ExpressionAttributeValues": {
        ":accountId_u0": "123",
        ":settledAt_u0": "today",
        ":updatedAt_u0": updatedAt,
        ":effectiveAt_u0": "n/a",
        ":gsi1sk_u0": `$${entityName}_1#accountid_123#id_123`,
        // gsi2pk_u0 was not set prior to this fix
        ":gsi2pk_u0": "$test#organizationid_123",
        ":gsi2sk_u0": `$${entityName}_1#settledat_today`,
        ":organizationId_u0": "123",
        ":id_u0": "123",
        ":__edb_e___u0": `${entityName}`,
        ":__edb_v___u0": "1"
      },
      "TableName": "electro",
      "Key": {
        "pk": "$test#organizationid_123",
        "sk": `$${entityName}_1#id_123`
      },
      "ConditionExpression": "attribute_exists(#pk) AND attribute_exists(#sk)"
    });

    // with `effectiveAt` set to 'today' and `settledAt` set to 'n/a' the `entriesBySettledDate` index should not be written
    const params2 = Thing.patch({ id: '123', organizationId: '123' })
        .set({ effectiveAt: 'today', accountId: '123', settledAt: 'n/a' })
        .params();

    expect(params2).to.deep.equal({
      "UpdateExpression": "SET #effectiveAt = :effectiveAt_u0, #accountId = :accountId_u0, #settledAt = :settledAt_u0, #updatedAt = :updatedAt_u0, #gsi1sk = :gsi1sk_u0, #gsi3pk = :gsi3pk_u0, #gsi3sk = :gsi3sk_u0, #organizationId = :organizationId_u0, #id = :id_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0 REMOVE #gsi2pk, #gsi2sk",
      "ExpressionAttributeNames": {
        "#pk": "pk",
        "#sk": "sk",
        "#effectiveAt": "effectiveAt",
        "#settledAt": "settledAt",
        "#accountId": "accountId",
        "#updatedAt": "updatedAt",
        "#gsi1sk": "gsi1sk",
        "#gsi2pk": "gsi2pk",
        "#gsi2sk": "gsi2sk",
        "#gsi3pk": "gsi3pk",
        "#gsi3sk": "gsi3sk",
        "#organizationId": "organizationId",
        "#id": "id",
        "#__edb_e__": "__edb_e__",
        "#__edb_v__": "__edb_v__"
      },
      "ExpressionAttributeValues": {
        ":effectiveAt_u0": "today",
        ":settledAt_u0": "n/a",
        ":accountId_u0": "123",
        ":updatedAt_u0": updatedAt,
        ":gsi1sk_u0": `$${entityName}_1#accountid_123#id_123`,
        // gsi3pk_u0 was not set prior to this fix
        ":gsi3pk_u0": "$test#organizationid_123",
        ":gsi3sk_u0": `$${entityName}_1#effectiveat_today`,
        ":organizationId_u0": "123",
        ":id_u0": "123",
        ":__edb_e___u0": `${entityName}`,
        ":__edb_v___u0": "1"
      },
      "TableName": "electro",
      "Key": {
        "pk": "$test#organizationid_123",
        "sk": `$${entityName}_1#id_123`
      },
      "ConditionExpression": "attribute_exists(#pk) AND attribute_exists(#sk)"
    });

    const organizationId = uuid();
    const accountId = uuid();
    const id = uuid();
    const type = 'green'
    const category = 'liquid'
    const amount = '200'
    const description = 'a description';

    await Thing.create({
      organizationId,
      accountId,
      id,
      type,
      amount,
      category,
      description,
      settledAt: 'n/a',
      effectiveAt: 'n/a'
    }).go();

    // 'gsi1pk-gsi1sk-index' should have been written to
    const entriesByAccount = await Thing.query.entriesByAccount({ organizationId, accountId }).go();
    expect(entriesByAccount.data.length).to.equal(1);
    expect(entriesByAccount.data[0].id).to.equal(id);
    expect(entriesByAccount.data[0].organizationId).to.equal(organizationId);

    // 'gsi2pk-gsi2sk-index' should not have been written to
    const entriesBySettledDate = await Thing.query.entriesBySettledDate({ organizationId }).go();
    expect(entriesBySettledDate.data.length).to.equal(0);

    // with settledAt set to 'today', 'gsi2pk-gsi2sk-index' should be written to
    await Thing.patch({ id, organizationId }).set({ settledAt: 'today' }).go();
    const entriesBySettledDate2 = await Thing.query.entriesBySettledDate({ organizationId }).go();
    expect(entriesBySettledDate2.data.length).to.equal(1);
    expect(entriesBySettledDate2.data[0].id).to.equal(id);
    expect(entriesBySettledDate2.data[0].organizationId).to.equal(organizationId);

    // 'gsi3pk-gsi3sk-index' should not have been written to
    const entriesByEffectiveDate = await Thing.query.entriesByEffectiveDate({ organizationId }).go();
    expect(entriesByEffectiveDate.data.length).to.equal(0);

    // with effectiveAt set to 'today', 'gsi3pk-gsi3sk-index' should be written to
    await Thing.patch({ id, organizationId }).set({ effectiveAt: 'today' }).go();
    const entriesByEffectiveDate2 = await Thing.query.entriesByEffectiveDate({ organizationId }).go();
    expect(entriesByEffectiveDate2.data.length).to.equal(1);
    expect(entriesByEffectiveDate2.data[0].id).to.equal(id);
    expect(entriesByEffectiveDate2.data[0].organizationId).to.equal(organizationId);
  });
});


