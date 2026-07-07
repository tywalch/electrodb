import { StoreLocations } from "./entity";

await StoreLocations.find({
  mallId: "EastPointe",
  buildingId: "BuildingA1",
}).go();
