import { StoreLocations } from "./entity";

await StoreLocations.upsert({
  cityId: "Atlanta1",
  storeId: "LatteLarrys",
  mallId: "EastPointe",
  buildingId: "BuildingA1",
  unitId: "B47",
  category: "food/coffee",
  leaseEndDate: "2020-03-22",
  rent: "4500.00",
})
  .add({ deposit: 100, tenants: ["Larry David"] })
  .ifNotExists({ warnings: 0 })
  .subtract({ petFee: 250 })
  .append({
    rentalAgreement: [
      {
        type: "amendment",
        detail: "Larry David accepts coffee liability",
      },
    ],
  })
  .go();
