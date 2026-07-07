import { StoreLocations } from "./entity";

const cityId = "Atlanta1";
const mallId = "EastPointe";
const storeId = "LatteLarrys";
const buildingId = "BuildingA1";

await StoreLocations.update({ cityId, mallId, storeId, buildingId })
  .add({
    warnings: 1, // "number" attribute
    tenants: ["larry"], // "set" attribute
  })
  .where((attr, op) => op.eq(attr.category, "food/coffee"))
  .go();
