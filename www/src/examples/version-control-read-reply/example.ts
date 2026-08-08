import { store } from "./service";
import {
  isIssueCommentIds,
  isPullRequestCommentIds,
  type IssueCommentIds,
  type PullRequestCommentIds,
} from "./types";

export async function markAsRead(user: string, comment: IssueCommentIds): Promise<boolean>;
export async function markAsRead(user: string, comment: PullRequestCommentIds): Promise<boolean>;
export async function markAsRead(user: string, comment: any): Promise<boolean> {
  const replyViewed = new Date().toISOString();
  if (isIssueCommentIds(comment)) {
    return await store.entities.issueComments
      .patch(comment)
      .set({ replyViewed })
      .where(({ replyTo }, { eq }) => eq(replyTo, user))
      .go()
      .then(() => true)
      .catch(() => false);
  } else if (isPullRequestCommentIds(comment)) {
    return await store.entities.pullRequestComments
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

await markAsRead("tywalch", {
  repoOwner: "tywalch",
  repoName: "electrodb",
  issueNumber: "287",
  commentId: "comment-001",
  username: "sparky",
});
