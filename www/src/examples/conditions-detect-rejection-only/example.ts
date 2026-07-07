import { StoreLocations } from "./entity";

const result = await StoreLocations.create({
  cityId: "Atlanta1",
  storeId: "LatteLarrys",
  mallId: "EastPointe",
  buildingId: "BuildingA1",
  unitId: "B47",
  category: "food/coffee",
  leaseEndDate: "2020-03-22",
  rent: "4500.00",
}).go({ returnOnConditionCheckFailure: true });

if (result.rejected) {
  console.log("store already exists");
} else {
  console.log("created:", result.data);
}
