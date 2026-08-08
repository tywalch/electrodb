import { StoreLocations } from "./entity";

await StoreLocations.query
  .leases({ storeId: "LatteLarrys" })
  .gt({ leaseEndDate: "2020-04-00" })
  .go();
