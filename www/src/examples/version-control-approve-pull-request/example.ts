import { store } from "./service";

export async function approvePullRequest(
  repoOwner: string,
  repoName: string,
  pullRequestNumber: string,
  username: string,
) {
  const pullRequest = await store.entities.pullRequests
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

  return store.entities.pullRequests
    .update({ repoOwner, repoName, pullRequestNumber })
    .data(({ reviewers }, { set }) =>
      set(reviewers[index].approved, true)
    )
    .where(({ reviewers }, { eq }) =>
      eq(reviewers[index].username, username)
    )
    .go()
    .then(() => true)
    .catch(() => false);
}

await approvePullRequest("tywalch", "electrodb", "414", "sparky");
