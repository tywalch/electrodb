import { expect } from "chai";
import { v4 as uuid } from "uuid";
import { QueryInput } from "aws-sdk/clients/dynamodb";
import {
  Attraction,
  AttractionService, collections, collectionTypes,
  comparisons,
  ConfigurationItem,
  indexes, indexHasCollection,
  indexTypes, operatorParts,
  operators,
  pks,
  sks
} from "./inputs";

export type BitShiftEvaluation = {
  name: 'bitShift';
  isShifted: boolean;
}

export type AttributeFiltersPresence = 'all' | 'some' | 'none';

export type AttributeFiltersEvaluation = {
  name: 'attributeFilters';
  presence: AttributeFiltersPresence;
  occurrences: number;
  attributes: string[];
}

export type FilterExpressionPresentEvaluation = {
  name: 'filterExpressionPresent';
  isPresent: boolean;
}

export type TestEvaluation =
  | BitShiftEvaluation
  | AttributeFiltersEvaluation
  | FilterExpressionPresentEvaluation;

export type TestEvaluationName = TestEvaluation['name'];

export const TestEvaluationNames: Record<TestEvaluationName, TestEvaluationName> = {
  filterExpressionPresent: 'filterExpressionPresent',
  attributeFilters: 'attributeFilters',
  bitShift: 'bitShift',
}

export type TestCase = {
  input: ConfigurationItem;
  output: QueryInput;
  evaluations: TestEvaluation[];
  id: string;
};

export function generateParams(options: ConfigurationItem): QueryInput {
  const [ first, second, third ] = options.parts;
  if (options.target === 'Entity') {
    if (!options.operator) {
      return Attraction.query[options.index](first).params({ compare: options.compare });
    } else if (options.operator === 'between') {
      return Attraction.query[options.index](first).between(second ?? {}, third ?? {}).params({ compare: options.compare });
    } else {
      return Attraction.query[options.index](first)[options.operator](second ?? {}).params({ compare: options.compare });
    }
  } else {
    if (options.collection === 'clusteredRegion') {
      if (options.operator === '') {
        return AttractionService.collections.clusteredRegion(first).params({ compare: options.compare });
      } else if (options.operator === 'between') {
        return AttractionService.collections.clusteredRegion(first).between(second ?? {}, third ?? {}).params({ compare: options.compare })
      } else {
        return AttractionService.collections.clusteredRegion(first)[options.operator](second ?? {}).params({ compare: options.compare });
      }
    } else {
      return AttractionService.collections.isolatedRegion(first).params({ compare: options.compare });
    }
  }
}

function countOccurrences(str: string, subStr: string): number {
  if (subStr.length === 0) {
    return 0;
  }

  let count = 0;
  let pos = str.indexOf(subStr);

  while (pos !== -1) {
    count++;
    pos = str.indexOf(subStr, pos + subStr.length);
  }

  return count;
}

function isString(val: unknown): val is string {
  return typeof val === 'string'
}

export const testEvaluations = {
  attributeFilters: (testCase: TestCase, evaluation: AttributeFiltersEvaluation, params: QueryInput) => {
    let expression = params.FilterExpression || '';
    const uniqueAttributes = new Set(evaluation.attributes);
    let attributeCount = uniqueAttributes.size;
    let seenCount = 0;
    for (const attribute of uniqueAttributes) {
      try {
        const occurrences = countOccurrences(expression, `#${attribute}`);
        expect(occurrences).to.equal(evaluation.occurrences);
        if (occurrences > 0) {
          seenCount++;
        }
      } catch(err: any) {
        err.message = `${err.message} ${JSON.stringify({evaluation, attribute, params, testCase}, null, 2)}`;
        throw err;
      }
    }

    try {
      switch (evaluation.presence) {
        case "all":
          expect(seenCount).to.equal(evaluation.occurrences === 0 ? 0 : attributeCount);
          break;
        case "none":
          expect(seenCount).to.equal(0);
          break;
        case "some":
          expect(seenCount).to.be.lessThan(attributeCount);
          break;
      }
    } catch(err: any) {
      err.message = `${err.message} ${JSON.stringify({evaluation, testCase, params}, null, 2)}`;
      throw err;
    }
  },
  filterExpressionPresent: (testCase: TestCase, evaluation: FilterExpressionPresentEvaluation, params: QueryInput) => {
    try {
      let expression = params.FilterExpression;

      evaluation.isPresent
        ? expect(expression).to.not.be.undefined
        : expect(expression).to.be.undefined;
    } catch(err: any) {
      err.message = `${err.message} ${JSON.stringify({evaluation, testCase, params}, null, 2)}`;
      throw err;
    }
  },
  bitShift: (testCase: TestCase, evaluation: BitShiftEvaluation, params: QueryInput) => {
    // madison -> madison
    let expectedLastLetter = 'n';
    let attributeName = ':sk1';
    if (testCase.input.compare === 'v2') {
      if (['lte', 'gt', 'between'].includes(testCase.input.operator)) {
        // madison -> madisoo
        expectedLastLetter = 'o';
        if (testCase.input.operator === 'between') {
          attributeName = ':sk2';
          // mashall -> mashalm
          expectedLastLetter = 'm';
        }
      }
    }

    let attribute: string | undefined = undefined;
    if (params.ExpressionAttributeValues && attributeName in params.ExpressionAttributeValues) {
      const value = params.ExpressionAttributeValues[attributeName];
      if (isString(value)) {
        attribute = value;
      }
    }

    try {
      if (attribute === undefined) {
        throw new Error(`Attribute is not present in ExpressionAttributeNames: ${attributeName}`)
      }
      const lastLetter: string = attribute[attribute.length - 1];
      const isEqual = lastLetter === expectedLastLetter;
      expect(isEqual).to.equal(evaluation.isShifted);
    } catch(err: any) {
      err.message = `${err.message} ${JSON.stringify({testCase, evaluation, attribute, params}, null, 2)}`;
      throw err;
    }
  },
} as const;

export function evaluateTestCase(testCase: TestCase, evaluation: TestEvaluation, params: QueryInput) {
  switch(evaluation.name) {
    case "filterExpressionPresent":
      return testEvaluations.filterExpressionPresent(testCase, evaluation, params);
    case "bitShift":
      return testEvaluations.bitShift(testCase, evaluation, params);
    case "attributeFilters":
      return testEvaluations.attributeFilters(testCase, evaluation, params);
    default:
      throw new Error(
        `Unknown evaluation: ${JSON.stringify({ evaluation, params })}`,
      );
  }

}

export function assertsIsTestEvaluation(maybeEvaluation: unknown): asserts maybeEvaluation is TestEvaluation {
  const isTestEvaluation = typeof maybeEvaluation === 'object' && maybeEvaluation && 'name' in maybeEvaluation && typeof maybeEvaluation.name === 'string' && maybeEvaluation.name in TestEvaluationNames;
  if (!isTestEvaluation) {
    throw new Error('Unknown test evaluation');
  }
}

export function generateInitialConfiguration() {
  const config: ConfigurationItem[] = [];

  for (const compare of Object.values(comparisons)) {
    for (const operator of Object.values(operators)) {
      for (const index of Object.values(indexes)) {
        const type = indexTypes[index];
        const hasCollection = indexHasCollection[index];
        const parts = operatorParts[operator]
        config.push({
          hasCollection,
          operator,
          compare,
          target: 'Entity',
          parts,
          index,
          type,
        });
      }

      for (const collection of Object.values(collections)) {
        const parts = operatorParts[operator];
        const type = collectionTypes[collection];
        if (type === 'clustered') {
          config.push({
            hasCollection: true,
            target: 'Service',
            collection,
            operator,
            compare,
            parts,
            type,
          });
        }
      }
    }

    for (const collection of Object.values(collections)) {
      const operator = '' as const;
      const parts = operatorParts[operator];
      const type = collectionTypes[collection];
      if (type === 'isolated') {
        config.push({
          target: 'Service',
          hasCollection: true,
          collection,
          operator,
          compare,
          parts,
          type,
        });
      }
    }
  }

  return config;
}

export function makeDeterministicHash(config: unknown): string {
  switch (typeof config) {
    case "undefined":
    case "string":
    case "boolean":
    case "bigint":
    case "number":
      return `${config}`;
    case "symbol":
      return `${config.description}`;
    case "function":
      return `${config.toString()}`;
    case "object":
      if (!config) {
        return 'null';
      } else if (Array.isArray(config)) {
        return config.sort().map(c => makeDeterministicHash(c)).join(',');
      }
      return Object.entries(config)
        .sort(([a], [z]) => a.localeCompare(z))
        .map(([key, value]) => {
          return `${key}:${makeDeterministicHash(value)}`;
        })
        .join('|');
  }
}

function makeDeterministicTestCaseId(config: ConfigurationItem): string {
  const compare = config.compare;
  const newConfig: Omit<ConfigurationItem, 'compare'> & { compare?: string } = {...config};
  delete newConfig.compare;
  return `${compare}::${makeDeterministicHash(newConfig)}`
}

export function generateTestCases(configuration: ConfigurationItem[]): TestCase[] {
  const testCases: TestCase[] = [];
  for (const config of configuration) {
    const params = generateParams(config);

    testCases.push({
      id: `${makeDeterministicTestCaseId(config)}`,
      input: config,
      output: params,
      evaluations: [],
    });
  }

  return testCases.map((testCase): TestCase => {
    const allAttributes: string[] = testCase.input.parts.reduce<string[]>((attrs, obj) => {
      return [...attrs, ...Object.keys(obj)];
    }, []);
    const pkAttributes = allAttributes.filter((attr) => pks.has(attr));
    const skAttributes = allAttributes.filter((attr) => sks.has(attr));
    if (!testCase.input.compare || testCase.input.compare === 'keys') {
      testCase.evaluations.push({
        attributes: allAttributes,
        name: 'attributeFilters',
        presence: 'none',
        occurrences: 0,
      });

      const hasFilters = testCase.input.target === 'Service' || testCase.input.type === 'clustered';
      testCase.evaluations.push({
        name: 'filterExpressionPresent',
        isPresent: hasFilters,
      });

    } else if (testCase.input.compare === 'attributes') {
      let presence: AttributeFiltersPresence = 'all';
      let occurrences = 1;
      if (testCase.input.operator === 'between') {
        occurrences = 2;
      } else if (testCase.input.operator === 'begins') {
        presence = 'none';
        occurrences = 0;
      }
      if (testCase.input.target === 'Entity') {
        testCase.evaluations.push({
          attributes: skAttributes,
          name: 'attributeFilters',
          presence: presence,
          occurrences,
        });
      }

    } else if (testCase.input.compare === 'v2') {
      const v2ImpactedOperators = ['lte', 'gt', 'between', ''];
      const v2ShiftOperators = ['lte', 'gt', 'between'];
      const shouldAddSkFilters = v2ImpactedOperators.includes(testCase.input.operator);
      const shouldShift = v2ShiftOperators.includes(testCase.input.operator);

      if (testCase.input.target === 'Entity') {
        // testCase.evaluations.push({
        //   name: 'attributeFilters',
        //   presence: 'all',
        //   occurrences: 1,
        //   attributes: skAttributes,
        // });

        testCase.evaluations.push({
          occurrences: shouldAddSkFilters ? 1 : 0,
          attributes: skAttributes,
          name: 'attributeFilters',
          presence: 'all',
        });

        if (shouldShift) {
          testCase.evaluations.push({
            name: 'bitShift',
            isShifted: true,
          });
        }
      }
    }

    if ((testCase.input.target === 'Service' || testCase.input.type === 'clustered')) {
      const skipFilter = testCase.input.target !== 'Service' && testCase.input.compare === 'v2' && !['', 'gte', 'lt', 'begins', 'lte', 'gt', 'between'].includes(testCase.input.operator);
      testCase.evaluations.push({
        occurrences: skipFilter ? 0 : 1,
        presence: 'all',
        name: 'attributeFilters',
        attributes: ['__edb_v__', '__edb_e__']
      });
    }

    return testCase;
  });
}


