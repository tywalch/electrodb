import { StoreLocations } from "./entity";

const result = await StoreLocations.patch({
  cityId: "Atlanta1",
  mallId: "EastPointe",
  storeId: "LatteLarrys",
  buildingId: "BuildingA1",
})
  .set({ rent: "5000.00" })
  .where(({ rent }, { lt }) => lt(rent, "4000.00"))
  .go({ returnOnConditionCheckFailure: "all_old" });

if (result.rejected) {
  console.log("current rent:", result.data?.rent);
}
