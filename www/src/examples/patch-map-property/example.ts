import { StoreLocations } from "./entity";

const cityId = "Atlanta1";
const mallId = "EastPointe";
const storeId = "LatteLarrys";
const buildingId = "BuildingA1";

// via Chain Method
await StoreLocations.patch({ cityId, mallId, storeId, buildingId })
  // @ts-ignore -- dot-path attribute names are not yet supported by the TS types
  .set({ "mapAttribute.mapProperty": "value" })
  .go();

// via Data Method
await StoreLocations.patch({ cityId, mallId, storeId, buildingId })
  .data(({ mapAttribute }, { set }) => set(mapAttribute.mapProperty, "value"))
  .go();
