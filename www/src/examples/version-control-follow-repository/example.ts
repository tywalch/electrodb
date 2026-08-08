import { store } from "./service";

export async function followRepository(
  repoOwner: string,
  repoName: string,
  follower: string,
) {
  await store.entities.repositories
    .update({ repoOwner, repoName })
    .add({ followers: [follower] })
    .go();
}

await followRepository("tywalch", "electrodb", "sparky");
