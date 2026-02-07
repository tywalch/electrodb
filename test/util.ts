import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

export function expectEnv(name: string): string {
  const env = process.env[name];
  if (!env) {
    throw new Error(`Environment variable ${name} is not set`);
  }
  return env;
}

type Configuration = {
  client: DynamoDBClient,
  table: string
};

export function maybeGetMultiAttributeEntityConfiguration(): Configuration | null {
  const condition = process.env.MULTI_ATTRIBUTE_DYNANODB_TABLE_NAME !== undefined &&
  process.env.MULTI_ATTRIBUTE_DYNANODB_REGION !== undefined &&
  process.env.MULTI_ATTRIBUTE_DYNANODB_ACCESS_KEY_ID !== undefined &&
  process.env.MULTI_ATTRIBUTE_DYNANODB_SECRET_ACCESS_KEY !== undefined;
  if (condition) {
    const table = expectEnv("MULTI_ATTRIBUTE_DYNANODB_TABLE_NAME");
    const client = new DynamoDBClient({
      region: expectEnv("MULTI_ATTRIBUTE_DYNANODB_REGION"),
      credentials: {
        accessKeyId: expectEnv("MULTI_ATTRIBUTE_DYNANODB_ACCESS_KEY_ID"),
        secretAccessKey: expectEnv("MULTI_ATTRIBUTE_DYNANODB_SECRET_ACCESS_KEY"),
      }
    });
    return { table, client };
  }
  return null;
}

export function maybeDescribeMultiAttributeTest(name: string, fn: (config: Configuration) => void) {
  const config = maybeGetMultiAttributeEntityConfiguration();
  if (config) {
    describe(name, () => {
      fn(config);
    });
  } else {
    console.warn(`Skipping tests for "${name}"`);
    describe.skip(name, () => {});
  }
}