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
}).go({ returnOnConditionCheckFailure: "all_old" });

if (result.rejected) {
  console.log("already exists:", result.data);
} else {
  console.log("created:", result.data);
}
