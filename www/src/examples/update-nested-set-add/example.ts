import { StoreLocations } from "./entity";

const cityId = "Atlanta1";
const mallId = "EastPointe";
const storeId = "LatteLarrys";
const buildingId = "BuildingA1";

// Set values must use the DocumentClient to create a `set`
const newSetValue = StoreLocations.client.createSet("setItemValue");

// via Chain Method
await StoreLocations.update({ cityId, mallId, storeId, buildingId })
  // @ts-ignore -- bracket-index attribute names are not yet supported by the TS types
  .add({ "listAttribute[1].setAttribute": newSetValue })
  .go();

// via Data Method
await StoreLocations.update({ cityId, mallId, storeId, buildingId })
  .data(({ listAttribute }, { add }) => {
    add(listAttribute[1].setAttribute, newSetValue);
  })
  .go();
