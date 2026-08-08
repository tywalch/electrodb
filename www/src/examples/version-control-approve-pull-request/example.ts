import { store } from "./service";

export async function approvePullRequest(
  repoOwner: string,
  repoName: string,
  pullRequestNumber: string,
  username: string,
) {
  return store.entities.pullRequests
    .patch({ repoOwner, repoName, pullRequestNumber })
    .data(({ reviewers }, { set }) =>
      set(reviewers[username], {
        approved: true,
        updatedAt: new Date().toISOString(),
      })
    )
    .where(({ reviewers }, { exists }) =>
      exists(reviewers[username])
    )
    .go({ returnOnConditionCheckFailure: true })
    .then(({ rejected }) => !rejected);
}

await approvePullRequest("tywalch", "electrodb", "414", "sparky");
