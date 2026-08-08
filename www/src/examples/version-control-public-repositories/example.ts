import { store } from "./service";

export async function getPublicRepository(username: string) {
  return store.entities.repositories.query.created({
    username,
    isPrivate: false,
  }).go();
}

await getPublicRepository("tywalch");
