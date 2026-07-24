import { Service } from "electrodb";
import { tableName } from "./table";
import {
  users,
  issues,
  repositories,
  pullRequests,
  subscriptions,
  issueComments,
  pullRequestComments,
} from "./entities";

export const store = new Service(
  {
    users,
    issues,
    repositories,
    pullRequests,
    subscriptions,
    issueComments,
    pullRequestComments,
  },
  { table: tableName },
);
