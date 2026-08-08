import { StoreLocations } from "./entity";

await StoreLocations.delete({
  storeId: "LatteLarrys",
  mallId: "EastPointe",
  buildingId: "F34",
  cityId: "Atlanta1",
}).go();
