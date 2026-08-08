import { StoreLocations } from "./entity";

const cityId = "Atlanta1";
const mallId = "EastPointe";
const storeId = "LatteLarrys";
const buildingId = "BuildingA1";

// via Chain Method
await StoreLocations.update({ cityId, mallId, storeId, buildingId })
  // @ts-ignore -- bracket-index attribute names are not yet supported by the TS types
  .remove(["listAttribute[0]"])
  .go();

// via Data Method
await StoreLocations.update({ cityId, mallId, storeId, buildingId })
  .data(({ listAttribute }, { remove }) => remove(listAttribute[0]))
  .go();
