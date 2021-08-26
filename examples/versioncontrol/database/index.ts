import {Service} from "../../../";

import {repositories} from "./repositories";
import {subscriptions} from "./subscriptions";
import {users} from "./users";
import {pullRequests, pullRequestComments} from "./pullrequests";
import {issues, issueComments} from "./issues";
import {CreateEntityItem, UpdateEntityItem, EntityItem, EntityRecord, CollectionItem} from "../../../";
import {Status, SubscriptionTypes, IsNotTicket, isIssueCommentIds, isPullRequestCommentIds, NotYetViewed} from "./types"

export const table = "electro";

export const store = new Service({
  users,
  issues,
  repositories,
  pullRequests,
  subscriptions,
  issueComments,
  pullRequestComments,
}, {table});

export type CreateRepository = CreateEntityItem<typeof repositories>;
export type UpdateRepository = UpdateEntityItem<typeof repositories>;
export type RepositoryItem = EntityItem<typeof repositories>;
export type RepositoryIds = Parameters<typeof repositories.get>[0][0];

export type CreateUser = CreateEntityItem<typeof users>;
export type UpdateUser = UpdateEntityItem<typeof users>;
export type UserItem = EntityItem<typeof users>;
export type UserIds = Parameters<typeof users.get>[0][0];

export type CreatePullRequest = CreateEntityItem<typeof pullRequests>;
export type UpdatePullRequest = UpdateEntityItem<typeof pullRequests>;
export type PullRequestItem = EntityItem<typeof pullRequests>;
export type PullRequestIds = Parameters<typeof pullRequests.get>[0][0];
export type PullRequest = EntityRecord<typeof pullRequests>;

export type CreatePullRequestComment = CreateEntityItem<typeof pullRequestComments>;
export type UpdatePullRequestComment = UpdateEntityItem<typeof pullRequestComments>;
export type PullRequestCommentItem = EntityItem<typeof pullRequestComments>;
export type PullRequestCommentIds = Parameters<typeof pullRequestComments.get>[0][0];

export type CreateIssue = CreateEntityItem<typeof issues>;
export type UpdateIssue = UpdateEntityItem<typeof issues>;
export type IssueItem = EntityItem<typeof issues>;
export type IssueIds = Parameters<typeof issues.get>[0][0];

export type CreateIssueComment = CreateEntityItem<typeof issueComments>;
export type UpdateIssueComment = UpdateEntityItem<typeof issueComments>;
export type IssueCommentItem = EntityItem<typeof issueComments>;
export type IssueCommentIds = Parameters<typeof issueComments.get>[0][0];

export type CreateSubscription = CreateEntityItem<typeof subscriptions>;
export type UpdateSubscription = UpdateEntityItem<typeof subscriptions>;
export type SubscriptionItem = EntityItem<typeof subscriptions>;
export type SubscriptionIds = Parameters<typeof subscriptions.get>[0][0];

export type OwnedItems = CollectionItem<typeof store, "owned">;

export { NotYetViewed, Status, SubscriptionTypes, IsNotTicket, isIssueCommentIds, isPullRequestCommentIds };

