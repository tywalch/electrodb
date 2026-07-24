import { store } from "./service";
import type { PullRequestIds } from "./types";

// The "created" and "enhancements" indexes compose their sort keys from
// `status` and `createdAt`. Because `createdAt` is readOnly it cannot be
// `set()`, so the `composite()` chain method supplies its value for key
// formatting (and adds a condition asserting it hasn't changed).
export async function closePullRequest(
  user: string,
  pr: PullRequestIds,
  createdAt: string,
) {
  return store.entities.pullRequests
    .update(pr)
    .set({ status: "Closed" })
    .composite({ createdAt })
    .where(
      ({ username, repoOwner }, { eq }) => `
            ${eq(username, user)} OR ${eq(repoOwner, user)}
        `,
    )
    .go();
}

await closePullRequest(
  "tywalch",
  { repoOwner: "tywalch", repoName: "electrodb", pullRequestNumber: "414" },
  "2023-08-22T17:26:27.718Z",
);
