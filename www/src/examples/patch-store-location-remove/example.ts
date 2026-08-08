import { StoreLocations } from "./entity";

const cityId = "Portland";
const mallId = "EastPointe";
const storeId = "LatteLarrys";
const buildingId = "A34";

await StoreLocations.patch({ cityId, mallId, storeId, buildingId })
  .remove(["discount"])
  .where((attr, op) => op.eq(attr.category, "food/coffee"))
  .go();
