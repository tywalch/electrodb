/* istanbul ignore file */
import { Service } from "../../../";
import { table, client } from "../../common";

import { User } from "./user";
import { Repository } from "./repository";
import { Subscription } from "./subscription";
import { Issue, IssueComment } from "./issue";
import { PullRequest, PullRequestComment } from "./pullrequest";
import {
  CreateEntityItem,
  UpdateEntityItem,
  EntityItem,
  EntityRecord,
  CollectionItem,
} from "../../../";
import {
  Status,
  SubscriptionTypes,
  IsNotTicket,
  isIssueCommentIds,
  isPullRequestCommentIds,
  NotYetViewed,
} from "./types";

export { createMockUser } from "./user";
export { createMockRepository } from "./repository";
export { createMockSubscription } from "./subscription";
export { createMockIssue, createMockIssueComment } from "./issue";
export {
  createMockPullRequest,
  createMockPullRequestComment,
} from "./pullrequest";

export const VersionControl = new Service(
  {
    user: User,
    issue: Issue,
    repository: Repository,
    pullRequest: PullRequest,
    subscription: Subscription,
    issueComment: IssueComment,
    pullRequestComment: PullRequestComment,
  },
  { table, client },
);

export {
  User,
  Repository,
  Subscription,
  Issue,
  IssueComment,
  PullRequest,
  PullRequestComment,
};

export type CreateRepository = CreateEntityItem<typeof Repository>;
export type UpdateRepository = UpdateEntityItem<typeof Repository>;
export type RepositoryItem = EntityItem<typeof Repository>;
export type RepositoryIds = Parameters<typeof Repository.get>[0][0];

export type CreateUser = CreateEntityItem<typeof User>;
export type UpdateUser = UpdateEntityItem<typeof User>;
export type UserItem = EntityItem<typeof User>;
export type UserIds = Parameters<typeof User.get>[0][0];

export type CreatePullRequest = CreateEntityItem<typeof PullRequest>;
export type UpdatePullRequest = UpdateEntityItem<typeof PullRequest>;
export type PullRequestItem = EntityItem<typeof PullRequest>;
export type PullRequestIds = Parameters<typeof PullRequest.get>[0][0];
export type PullRequest = EntityRecord<typeof PullRequest>;

export type CreatePullRequestComment = CreateEntityItem<
  typeof PullRequestComment
>;
export type UpdatePullRequestComment = UpdateEntityItem<
  typeof PullRequestComment
>;
export type PullRequestCommentItem = EntityItem<typeof PullRequestComment>;
export type PullRequestCommentIds = Parameters<
  typeof PullRequestComment.get
>[0][0];

export type CreateIssue = CreateEntityItem<typeof Issue>;
export type UpdateIssue = UpdateEntityItem<typeof Issue>;
export type IssueItem = EntityItem<typeof Issue>;
export type IssueIds = Parameters<typeof Issue.get>[0][0];

export type CreateIssueComment = CreateEntityItem<typeof IssueComment>;
export type UpdateIssueComment = UpdateEntityItem<typeof IssueComment>;
export type IssueCommentItem = EntityItem<typeof IssueComment>;
export type IssueCommentIds = Parameters<typeof IssueComment.get>[0][0];

export type CreateSubscription = CreateEntityItem<typeof Subscription>;
export type UpdateSubscription = UpdateEntityItem<typeof Subscription>;
export type SubscriptionItem = EntityItem<typeof Subscription>;
export type SubscriptionIds = Parameters<typeof Subscription.get>[0][0];

export type OwnedItems = CollectionItem<typeof VersionControl, "owned">;

export {
  NotYetViewed,
  Status,
  SubscriptionTypes,
  IsNotTicket,
  isIssueCommentIds,
  isPullRequestCommentIds,
};
