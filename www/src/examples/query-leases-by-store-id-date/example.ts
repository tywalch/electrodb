import { StoreLocations } from "./entity";

await StoreLocations.query
  .leases({
    storeId: "LatteLarrys",
    leaseEndDate: "2020-03-22",
  })
  .go();
