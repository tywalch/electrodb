import { StoreLocations } from "./entity";

await StoreLocations.remove({
  storeId: "LatteLarrys",
  mallId: "EastPointe",
  buildingId: "F34",
  cityId: "Atlanta1",
}).go();
