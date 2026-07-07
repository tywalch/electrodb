import { StoreLocations } from "./entity";

await StoreLocations.match({
  mallId: "EastPointe",
  buildingId: "BuildingA1",
  leaseEndDate: "2020-03-22",
  rent: "1500.00",
}).go();
