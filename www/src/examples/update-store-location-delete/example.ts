import { StoreLocations } from "./entity";

const cityId = "Atlanta1";
const mallId = "EastPointe";
const storeId = "LatteLarrys";
const buildingId = "BuildingA1";

await StoreLocations.update({ cityId, mallId, storeId, buildingId })
  .delete({ contact: ["555-345-2222"] })
  .where((attr, op) => op.eq(attr.category, "food/coffee"))
  .go();
