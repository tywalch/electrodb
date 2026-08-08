import { StoreLocations } from "./entity";

let storeId = "LatteLarrys";
let mallId = "EastPointe";
let buildingId = "BuildingA1";
let cityId = "Atlanta1";

await StoreLocations.patch({ storeId, mallId, buildingId, cityId })
  .set({ leaseEndDate: "2021-02-28" })
  .go();
