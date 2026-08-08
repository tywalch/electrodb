import { store } from "./service";
import { NotYetViewed } from "./types";

export async function getUnreadComments(user: string, start: string, end: string) {
  const first = { updatedAt: start, replyViewed: NotYetViewed };
  const last = { updatedAt: end, replyViewed: NotYetViewed };

  const [issues, pullRequests] = await Promise.all([
    store.entities.issueComments.query
      .replies({ replyTo: user })
      .between(first, last)
      .go(),

    store.entities.pullRequestComments.query
      .replies({ replyTo: user })
      .between(first, last)
      .go(),
  ]);

  return {
    issues,
    pullRequests,
  };
}

await getUnreadComments("tywalch", "0000-00-00", "9999-99-99");
