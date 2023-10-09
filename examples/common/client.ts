/* istanbul ignore file */
import DynamoDB, {
  DocumentClient,
  CreateTableInput,
} from "aws-sdk/clients/dynamodb";

process.env.AWS_NODEJS_CONNECTION_REUSE_ENABLED = "1";

/**
 * It is recomended that you use the dynamodb-local docker image for this example. For more
 * information on how to download visit: https://hub.docker.com/r/amazon/dynamodb-local
 *
 * If you intend on running this example against your own aws account, modify the config
 * to match your account. This includes *removing* the `endpoint` property, which is used
 * when connecting to the local docker dynamo instance described above.
 **/

export const configuration = {
  endpoint: "http://localhost:8000",
  region: "us-east-1",
};

export const client = new DocumentClient(configuration);
export const dynamodb = new DynamoDB(configuration);

export type { DynamoDB, DocumentClient, CreateTableInput };
