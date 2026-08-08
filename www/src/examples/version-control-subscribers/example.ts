import { store } from "./service";
import { IsNotTicket } from "./types";

export async function getSubscribed(
  repoOwner: string,
  repoName: string,
  ticketNumber: string = IsNotTicket,
) {
  return store.collections
    .subscribers({ repoOwner, repoName, ticketNumber })
    .go();
}

await getSubscribed("tywalch", "electrodb");
