/* istanbul ignore file */
import { faker } from "@faker-js/faker";
import * as models from "./models";
import { initializeTable, table, createItems } from "../common";

/**
 * ATTENTION READ FIRST:
 * It is recommended that you use the dynamodb-local docker image for this example. For more information on how to
 * download visit: https://hub.docker.com/r/amazon/dynamodb-local
 *
 * If you intend on running this example against your own aws account, modify the config in the
 * file `/examples/common/client.ts` to match your account. This includes *removing* the `endpoint` property
 * which is used when connecting to the local docker dynamo instance described above.
 **/

function createMockData() {
  const users = createItems(50, () => models.createMockUser());
  const usernames = users.map((user) => user.username);

  const repos = faker.helpers.arrayElements(users).map((user) => {
    return models.createMockRepository({
      repoOwner: user.username,
    });
  });

  const issues = repos.map((repo) => {
    const { repoName, repoOwner } = repo;
    const username = faker.helpers.arrayElement(usernames);
    return models.createMockIssue({ repoName, repoOwner, username });
  });

  const issueComments = issues.map((issue) => {
    const { repoName, repoOwner } = issue;
    const username = faker.helpers.arrayElement([
      faker.helpers.arrayElement(usernames),
      issue.username,
      repoOwner,
    ]);

    return models.createMockIssueComment({ repoName, repoOwner, username });
  });

  const pullRequests = repos.map((repo) => {
    const { repoName, repoOwner } = repo;
    const username = faker.helpers.arrayElement(usernames);
    return models.createMockPullRequest({ repoName, repoOwner, username });
  });

  const pullRequestComments = pullRequests.map((issue) => {
    const { repoName, repoOwner } = issue;
    const username = faker.helpers.arrayElement([
      faker.helpers.arrayElement(usernames),
      issue.username,
      repoOwner,
    ]);

    return models.createMockPullRequestComment({
      repoName,
      repoOwner,
      username,
    });
  });

  const subscriptions = faker.helpers
    .arrayElements([issues, pullRequests])
    .flat()
    .map((ticket) => {
      const { repoName, repoOwner, ticketType, ticketNumber } = ticket;
      const username = faker.helpers.arrayElement(usernames);

      return models.createMockSubscription({
        username,
        repoName,
        repoOwner,
        ticketType,
        ticketNumber,
      });
    });

  return {
    users,
    repos,
    issues,
    issueComments,
    pullRequests,
    pullRequestComments,
    subscriptions,
  };
}

type LoadTableOptions = {
  users: models.CreateUser[];
  repos: models.CreateRepository[];
  issues: models.CreateIssue[];
  issueComments: models.CreateIssueComment[];
  pullRequests: models.CreatePullRequest[];
  pullRequestComments: models.CreatePullRequestComment[];
  subscriptions: models.CreateSubscription[];
};

async function loadTable(options: LoadTableOptions) {
  await models.User.put(options.users).go({ concurrency: 3 });
  await models.Repository.put(options.repos).go({ concurrency: 3 });
  await models.Issue.put(options.issues).go({ concurrency: 3 });
  await models.IssueComment.put(options.issueComments).go({ concurrency: 3 });
  await models.PullRequest.put(options.pullRequests).go({ concurrency: 3 });
  await models.PullRequestComment.put(options.pullRequestComments).go({
    concurrency: 3,
  });
  await models.Subscription.put(options.subscriptions).go({ concurrency: 3 });
}

async function main() {
  await initializeTable({ tableName: table });
  const data = createMockData();
  await loadTable(data);
}

main().catch(console.error);
