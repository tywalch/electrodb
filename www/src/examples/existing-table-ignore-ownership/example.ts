import { StoreLocations } from "./entity";

// when querying the table
const results = await StoreLocations.get({
  cityId: "Atlanta1",
  mallId: "EastPointe",
  buildingId: "BuildingA1",
  storeId: "LatteLarrys",
}).go({ ignoreOwnership: true });
