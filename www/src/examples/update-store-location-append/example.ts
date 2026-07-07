import { StoreLocations } from "./entity";

const cityId = "Atlanta1";
const mallId = "EastPointe";
const storeId = "LatteLarrys";
const buildingId = "BuildingA1";

await StoreLocations.update({ cityId, mallId, storeId, buildingId })
  .append({
    rentalAgreement: [
      {
        type: "amendment",
        detail: "no soup for you",
      },
    ],
  })
  .where((attr, op) => op.eq(attr.category, "food/coffee"))
  .go();
