import { StoreLocations } from "./entity";

const cityId = "Portland";
const mallId = "EastPointe";
const storeId = "LatteLarrys";
const buildingId = "A34";

await StoreLocations.patch({ cityId, mallId, storeId, buildingId })
  .delete({ contact: ["555-345-2222"] })
  .where((attr, op) => op.eq(attr.category, "food/coffee"))
  .go();
