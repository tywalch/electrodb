/* istanbul ignore file */
// VersionControl (git) Service
// This example demonstrates more advanced modeling techniques using ElectroDB
import moment from "moment";

import {
  VersionControl,
  IssueIds,
  IssueCommentIds,
  PullRequestIds,
  PullRequestCommentIds,
  Status,
  IsNotTicket,
  NotYetViewed,
  OwnedItems,
  isIssueCommentIds,
  isPullRequestCommentIds,
} from "./models";

// Get Public Repositories By Username
export async function getPublicRepository(username: string) {
  return VersionControl.entities.repository.query.created({
    username,
    isPrivate: false,
  });
}

// Get PullRequest and Associated Comments -- newest comments first
export async function reviewPullRequest(options: {
  pr: PullRequestIds;
  cursor?: string;
}) {
  const { pr, cursor } = options;
  return VersionControl.collections
    .PRReview(pr)
    .go({ cursor, params: { ScanIndexForward: false } });
}

// Get Issue and Associated Comments -- newest comments first
export async function reviewIssue(options: {
  issue: IssueIds;
  cursor?: string;
}) {
  const { issue, cursor } = options;
  return VersionControl.collections
    .issueReview(issue)
    .go({ cursor, params: { ScanIndexForward: false } });
}

// Get PullRequests Created By User
export async function getUserPullRequests(options: {
  username: string;
  status?: Status;
  cursor?: string;
}) {
  const { username, status, cursor } = options;
  return VersionControl.entities.pullRequest.query
    .created({ username, status })
    .go({ cursor, params: { ScanIndexForward: false } });
}

// Close pull request -- guards: can only be performed by user who opened PR or the repo owner
export async function closePullRequest(user: string, pr: PullRequestIds) {
  return VersionControl.entities.pullRequest
    .update(pr)
    .set({ status: "Closed" })
    .where(
      ({ username, repoOwner }, { eq }) => `
            ${eq(username, user)} OR ${eq(repoOwner, user)}
        `,
    )
    .go();
}

// Get all user info, repos, pull requests, and issues in one query
export async function getFirstPageLoad(username: string) {
  const results: OwnedItems = {
    issue: [],
    pullRequest: [],
    repository: [],
    user: [],
  };

  let next = null;

  do {
    const { cursor, data } = await VersionControl.collections
      .owned({ username })
      .go();
    results.issue = results.issue.concat(data.issue);
    results.pullRequest = results.pullRequest.concat(data.pullRequest);
    results.repository = results.repository.concat(data.repository);
    results.user = results.user.concat(data.user);
    next = cursor;
  } while (next !== null);

  return results;
}

// Get Subscriptions for a given Repository, PullRequest, or Issue.
export async function getSubscribed(
  repoOwner: string,
  repoName: string,
  ticketNumber: string = IsNotTicket,
) {
  return VersionControl.collections
    .subscribers({ repoOwner, repoName, ticketNumber })
    .go();
}

const MinDate = "0000-00-00";
const MaxDate = "9999-99-99";

// Get unread comment replies
export async function getUnreadComments(user: string) {
  const start = {
    createdAt: MinDate,
    replyViewed: NotYetViewed,
  };
  const end = {
    createdAt: MaxDate,
    replyViewed: NotYetViewed,
  };
  let [issues, pullRequests] = await Promise.all([
    VersionControl.entities.issueComment.query
      .replies({ replyTo: user })
      .between(start, end)
      .go(),

    VersionControl.entities.pullRequestComment.query
      .replies({ replyTo: user })
      .between(start, end)
      .go(),
  ]);

  return {
    issues,
    pullRequests,
  };
}

// Mark comment reply as read -- guards: can only be done by the user who was being replied to
export async function readReply(
  user: string,
  comment: IssueCommentIds,
): Promise<boolean>;
export async function readReply(
  user: string,
  comment: PullRequestCommentIds,
): Promise<boolean>;
export async function readReply(user: string, comment: any): Promise<boolean> {
  const replyViewed = moment.utc().format();
  if (isIssueCommentIds(comment)) {
    return await VersionControl.entities.issueComment
      .patch(comment)
      .set({ replyViewed })
      .where(({ replyTo }, { eq }) => eq(replyTo, user))
      .go()
      .then(() => true)
      .catch(() => false);
  } else if (isPullRequestCommentIds(comment)) {
    return await VersionControl.entities.pullRequestComment
      .patch(comment)
      .set({ replyViewed })
      .where(({ replyTo }, { eq }) => eq(replyTo, user))
      .go()
      .then(() => true)
      .catch(() => false);
  } else {
    return false;
  }
}

export async function approvePullRequest(
  repoOwner: string,
  repoName: string,
  pullRequestNumber: string,
  username: string,
) {
  const pullRequest = await VersionControl.entities.pullRequest
    .get({ repoOwner, repoName, pullRequestNumber })
    .go();

  if (!pullRequest.data || !pullRequest.data.reviewers) {
    return false;
  }

  let index: number = -1;

  for (let i = 0; i < pullRequest.data.reviewers.length; i++) {
    const reviewer = pullRequest.data.reviewers[i];
    if (reviewer.username === username) {
      index = i;
    }
  }

  if (index === -1) {
    return false;
  }

  return VersionControl.entities.pullRequest
    .update({ repoOwner, repoName, pullRequestNumber })
    .data(({ reviewers }, { set }) => {
      set(reviewers[index].approved, true);
    })
    .where(
      ({ reviewers }, { eq }) => `
            ${eq(reviewers[index].username, username)};
        `,
    )
    .go()
    .then(() => true)
    .catch(() => false);
}

export async function followRepository(
  repoOwner: string,
  repoName: string,
  follower: string,
) {
  await VersionControl.entities.repository
    .update({ repoOwner, repoName })
    .add({ followers: [follower] })
    .go();
}
