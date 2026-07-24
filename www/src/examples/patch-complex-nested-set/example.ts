import { StoreLocations } from "./entity";

const cityId = "Portland";
const mallId = "EastPointe";
const storeId = "LatteLarrys";
const buildingId = "A34";

// Set values must use the DocumentClient to create a `set`
const newSetValue = StoreLocations.client.createSet("setItemValue");

// via Chain Method
await StoreLocations.patch({ cityId, mallId, storeId, buildingId })
  .add({ "listAttribute[1].setAttribute": newSetValue })
  .go();

// via Data Method
await StoreLocations.patch({ cityId, mallId, storeId, buildingId })
  .data(({ listAttribute }, { add }) => {
    add(listAttribute[1].setAttribute, newSetValue);
  })
  .go();
