import { StoreLocations } from "./entity";

const results = await StoreLocations.get({
  storeId: "LatteLarrys",
  mallId: "EastPointe",
  buildingId: "F34",
  cityId: "Atlanta1",
}).go();
