import { StoreLocations } from "./entity";

await StoreLocations.upsert({
  cityId: "Atlanta1",
  storeId: "LatteLarrys",
  mallId: "EastPointe",
  buildingId: "BuildingA1",
  unitId: "B47",
  category: "food/coffee",
  leaseEndDate: "2020-03-22",
  rent: "4500.00",
}).go();
