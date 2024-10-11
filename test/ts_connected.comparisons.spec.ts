import { expect } from "chai";
import { generateParams, assertsIsTestEvaluation, TestCase, evaluateTestCase } from './generation/comparisonTests/testCaseGenerators';
import testCases from './generation/comparisonTests/testCases.json';
import v2TestCases from './generation/comparisonTests/versionTwoTestCases.json';

const v2TestCaseLookup = v2TestCases.reduce<Record<string, any>>((lookup, item) => {
  lookup[item.id] = item;
  return lookup;
}, {});

function assertsIsTestCase(item: unknown): asserts item is TestCase {
  if (!item) {
    throw new Error('Is not test case');
  }
}

describe('when using the comparison execution option', () => {
  for (const testCase of testCases) {
    assertsIsTestCase(testCase)
    describe(`when executing a comparison query with the ${testCase.input.operator === '' ? 'starts_with' : testCase.input.operator} operator against a ${testCase.input.type} ${testCase.input.target === 'Entity' ? 'index' : 'collection'} with the comparison option ${testCase.input.compare}`, () => {
      for (const evaluation of testCase.evaluations) {
        it(`should evaluate ${evaluation.name} with the options: ${JSON.stringify(evaluation)}`, () => {
          try {
            assertsIsTestEvaluation(evaluation);
            const params = generateParams(testCase.input);
            evaluateTestCase(testCase, evaluation, params);
            expect(params).to.deep.equal(testCase.output);
          } catch(err: any) {
            err.message = `error on test case ${testCase.id}: ${err.message}`;
            throw err;
          }
        });
      }
      if (testCase.input.compare === 'v2') {
        // each exception has been verified
        const exceptions = {
          nowHasIdentifierFilters: [
            // now has identifier filters
            'v2::collection:clusteredRegion|hasCollection:true|operator:gte|parts:country:USA|state:Wisconsin,city:Madison|county:Dane|target:Service|type:clustered',
            // now has identifier filters
            'v2::collection:clusteredRegion|hasCollection:true|operator:gt|parts:country:USA|state:Wisconsin,city:Madison|county:Dane|target:Service|type:clustered',
            // now has identifier filters
            'v2::collection:clusteredRegion|hasCollection:true|operator:lt|parts:country:USA|state:Wisconsin,city:Madison|county:Dane|target:Service|type:clustered',
            // now has identifier filters
            'v2::collection:clusteredRegion|hasCollection:true|operator:lte|parts:country:USA|state:Wisconsin,city:Madison|county:Dane|target:Service|type:clustered',
            // now has identifier filters
            'v2::collection:clusteredRegion|hasCollection:true|operator:between|parts:country:USA|state:Wisconsin,city:Madison|county:Dane,city:Marshall|county:Dane|target:Service|type:clustered',
          ],
          minorFilterOrderChanges: [
            // minor changes to filter order
            'v2::hasCollection:true|index:clusteredLocation|operator:gt|parts:country:USA|state:Wisconsin,city:Madison|county:Dane|target:Entity|type:clustered',
            // minor changes to filter order
            'v2::hasCollection:true|index:isolatedLocation|operator:gt|parts:country:USA|state:Wisconsin,city:Madison|county:Dane|target:Entity|type:isolated',
            // minor changes to filter order
            'v2::hasCollection:false|index:location|operator:gt|parts:country:USA|state:Wisconsin,city:Madison|county:Dane|target:Entity|type:isolated',

            // minor changes to filter order
            'v2::hasCollection:true|index:clusteredLocation|operator:lte|parts:country:USA|state:Wisconsin,city:Madison|county:Dane|target:Entity|type:clustered',
            // minor changes to filter order
            'v2::hasCollection:true|index:isolatedLocation|operator:lte|parts:country:USA|state:Wisconsin,city:Madison|county:Dane|target:Entity|type:isolated',
            // minor changes to filter order
            'v2::hasCollection:false|index:location|operator:lte|parts:country:USA|state:Wisconsin,city:Madison|county:Dane|target:Entity|type:isolated',

            // minor changes to filter order
            'v2::hasCollection:true|index:clusteredLocation|operator:between|parts:country:USA|state:Wisconsin,city:Madison|county:Dane,city:Marshall|county:Dane|target:Entity|type:clustered',
            // minor changes to filter order
            'v2::hasCollection:true|index:isolatedLocation|operator:between|parts:country:USA|state:Wisconsin,city:Madison|county:Dane,city:Marshall|county:Dane|target:Entity|type:isolated',
            // minor changes to filter order
            'v2::hasCollection:false|index:location|operator:between|parts:country:USA|state:Wisconsin,city:Madison|county:Dane,city:Marshall|county:Dane|target:Entity|type:isolated',
          ]
        }

        it('should result in the same query parameter output as v2 electrodb', () => {
          try {
            const v3Params = generateParams(testCase.input);
            const v2TestCase = v2TestCaseLookup[testCase.id];
            expect(v2TestCase).to.not.be.undefined;
            const v2Params = v2TestCase.output;
            if (exceptions.nowHasIdentifierFilters.includes(testCase.id)) {
              if (v3Params.ExpressionAttributeNames) {
                delete v3Params.ExpressionAttributeNames['#__edb_e__']
                delete v3Params.ExpressionAttributeNames['#__edb_v__']
              }
              if (v3Params.ExpressionAttributeValues) {
                delete v3Params.ExpressionAttributeValues[":__edb_e___Attraction"]
                delete v3Params.ExpressionAttributeValues[":__edb_v___Attraction"]
              }
              if (v3Params.FilterExpression) {
                delete v3Params.FilterExpression;
              }
              delete v2Params.ExpressionAttributeNames['#__edb_e__']
              delete v2Params.ExpressionAttributeNames['#__edb_v__']
              delete v2Params.ExpressionAttributeValues[":__edb_e___Attraction"]
              delete v2Params.ExpressionAttributeValues[":__edb_v___Attraction"]
              delete v2Params.FilterExpression;
            } else if (exceptions.minorFilterOrderChanges.includes(testCase.id)) {
              delete v3Params.FilterExpression;
              delete v2Params.FilterExpression;
            }
            expect(v3Params).to.deep.equal(v2Params);
          } catch(err: any) {
            err.message = `testcase id: ${testCase.id} ${err.message}`;
            throw err;
          }
        });
      }
    });
  }
});