import { StoreLocations } from "./entity";

await StoreLocations.query
  .stores({
    cityId: "Atlanta1",
    mallId: "EastPointe",
    buildingId: "f34",
  })
  .go();
