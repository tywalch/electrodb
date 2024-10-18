import { resolve } from 'path';
import { writeFileSync } from 'fs';
import { generateInitialConfiguration, generateTestCases } from "./testCaseGenerators";

function main() {
  const configuration = generateInitialConfiguration();
  const testCases = generateTestCases(configuration);
  const withoutEvaluation = testCases.filter((testCase) => testCase.evaluations.length === 0);
  if (withoutEvaluation.length > 0) {
    console.log(JSON.stringify({ withoutEvaluation }, null, 4));
    throw new Error(`Some did not have evaluations, ${withoutEvaluation.length}`);
  }
  writeFileSync(resolve(__dirname, './testCases.json'), JSON.stringify(testCases, null, 2));
}

main();