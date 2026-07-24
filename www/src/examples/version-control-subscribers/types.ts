export const StatusTypes = ["Open", "Closed"] as const;

export type Status = (typeof StatusTypes)[number];

export function toStatusCode(status: unknown) {
  for (let index in StatusTypes) {
    if (StatusTypes[index] === status) {
      return `${index}`;
    }
  }
}

export function toStatusString(code: unknown) {
  for (let index in StatusTypes) {
    if (`${index}` === code) {
      return StatusTypes[index];
    }
  }
}

export const PullRequestTicket = "PullRequest";
export const IssueTicket = "Issue";
export const IsNotTicket = "";
export const TicketTypes = [
  IssueTicket,
  PullRequestTicket,
  IsNotTicket,
] as const;

export const NotYetViewed = "#";

export type SubscriptionTypes = (typeof TicketTypes)[number];

export type IssueIds = {
  repoOwner: string;
  repoName: string;
  issueNumber: string;
};

export type PullRequestIds = {
  repoOwner: string;
  repoName: string;
  pullRequestNumber: string;
};

export type IssueCommentIds = IssueIds & {
  commentId: string;
  username: string;
};

export type PullRequestCommentIds = PullRequestIds & {
  commentId: string;
  username: string;
};

export function isIssueCommentIds(comment: any): comment is IssueCommentIds {
  return comment.issueNumber !== undefined && comment.username !== undefined;
}

export function isPullRequestCommentIds(
  comment: any,
): comment is PullRequestCommentIds {
  return (
    comment.pullRequestNumber !== undefined && comment.username !== undefined
  );
}
