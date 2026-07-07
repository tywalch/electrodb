import { StoreLocations } from "./entity";

await StoreLocations.query
  .stores({
    cityId: "Atlanta1",
    mallId: "EastPointe",
    storeId: "LatteLarrys",
    buildingId: "f34",
  })
  .go();
