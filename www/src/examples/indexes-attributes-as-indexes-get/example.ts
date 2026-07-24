import { myEntity } from "./entity";

await myEntity
  .get({
    accountId: "1111-2222-3333-4444",
    organizationId: "AAAA-BBBB-CCCC-DDDD",
  })
  .go();
