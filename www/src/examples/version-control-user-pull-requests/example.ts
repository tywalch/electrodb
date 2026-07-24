import { store } from "./service";
import type { Status } from "./types";

export async function getUserPullRequests(
  username: string,
  status?: Status,
  cursor?: string,
) {
  return store.entities.pullRequests.query
    .created({ username, status })
    .go({ cursor, order: "desc" });
}

await getUserPullRequests("tywalch", "Open");
