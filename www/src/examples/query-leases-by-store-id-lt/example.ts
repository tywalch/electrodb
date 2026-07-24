import { StoreLocations } from "./entity";

await StoreLocations.query
  .leases({ storeId: "LatteLarrys" })
  .lt({ leaseEndDate: "2021-00-00" })
  .go();
