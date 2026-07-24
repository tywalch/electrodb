import type { EntityItem } from "electrodb";
import { issues, pullRequests, repositories, users } from "./entities";
import { store } from "./service";

type OwnedItems = {
  issues: EntityItem<typeof issues>[];
  pullRequests: EntityItem<typeof pullRequests>[];
  repositories: EntityItem<typeof repositories>[];
  users: EntityItem<typeof users>[];
};

export async function getFirstPageLoad(username: string) {
  const results: OwnedItems = {
    issues: [],
    pullRequests: [],
    repositories: [],
    users: [],
  };

  let next = null;

  do {
    const { cursor, data } = await store.collections.owned({ username }).go();
    results.issues = results.issues.concat(data.issues);
    results.pullRequests = results.pullRequests.concat(data.pullRequests);
    results.repositories = results.repositories.concat(data.repositories);
    results.users = results.users.concat(data.users);
    next = cursor;
  } while (next !== null);

  return results;
}

await getFirstPageLoad("tywalch");
