import { StoreLocations } from "./entity";

await StoreLocations.query
  .stores({
    cityId: "Atlanta1",
    mallId: "EastPointe",
    unitId: "B24",
  })
  .go();
