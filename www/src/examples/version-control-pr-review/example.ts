import { store } from "./service";
import type { PullRequestIds } from "./types";

export async function reviewPullRequest(
  pr: PullRequestIds,
  cursor?: string
) {
  return store.collections.PRReview(pr).go({ cursor, order: "desc" });
}

await reviewPullRequest({
  repoOwner: "tywalch",
  repoName: "electrodb",
  pullRequestNumber: "414"
});
