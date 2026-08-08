import { StoreLocations } from "./entity";

await StoreLocations.create({
  mallId: "EastPointe",
  storeId: "LatteLarrys",
  buildingId: "BuildingA1",
  unitId: "B47",
  cityId: "Atlanta1",
  category: "spite store",
  leaseEndDate: "2020-02-29",
  rent: "5000.00",
}).go();
