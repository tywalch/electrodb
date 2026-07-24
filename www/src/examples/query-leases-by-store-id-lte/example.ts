import { StoreLocations } from "./entity";

await StoreLocations.query
  .leases({ storeId: "LatteLarrys" })
  .lte({ leaseEndDate: "2021-02-00" })
  .go();
