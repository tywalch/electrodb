import { StoreLocations } from "./entity";

await StoreLocations.query
  // @ts-expect-error - missing the `cityId` PK composite attribute
  .stores({
    mallId: "EastPointe",
  })
  .go();
