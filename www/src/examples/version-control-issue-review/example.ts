import { store } from "./service";
import type { IssueIds } from "./types";

export async function reviewIssue(
  issue: IssueIds,
  cursor?: string
) {
  return store.collections.issueReview(issue).go({ cursor, order: "desc" });
}

await reviewIssue({ repoOwner: "tywalch", repoName: "electrodb", issueNumber: "287" });
