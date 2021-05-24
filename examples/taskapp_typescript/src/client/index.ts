import DynamoDB from "aws-sdk/clients/dynamodb";

/**
 * It is recomended that you use the dynamodb-local docker image for this example. For more
 * information on how to download visit: https://hub.docker.com/r/amazon/dynamodb-local
 *
 * If you intend on running this example against your own aws account, modify the config
 * to match your account. This includes *removing* the `endpoint` property, which is used
 * when connecting to the local docker dynamo instance described above.
 **/

const configuration = {
    endpoint: "http://localhost:8000",
    region: "us-east-1"
};

const client = new DynamoDB.DocumentClient(configuration);

export default client;