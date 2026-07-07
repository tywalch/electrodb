// EntityItem is the type for a returned item
// QueryResponse is the type for the full electrodb response to a query
import type { EntityItem, QueryResponse } from "electrodb";

// (your entity)
import { users } from "./entity";

type UserItem = EntityItem<typeof users>;
type UserQueryResponse = QueryResponse<typeof users>;

async function getTeamMembers(team: string) {
  let members: UserItem[] = [];
  let cursor = null;
  do {
    const results: UserQueryResponse = await users.query
      .members({ team })
      .go({ cursor });
    members = [...members, ...results.data];
    cursor = results.cursor;
  } while (cursor !== null);

  return members;
}

await getTeamMembers("engineering");
