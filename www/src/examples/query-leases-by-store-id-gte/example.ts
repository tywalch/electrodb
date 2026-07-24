import { StoreLocations } from "./entity";

await StoreLocations.query
  .leases({ storeId: "LatteLarrys" })
  .gte({ leaseEndDate: "2020-03-00" })
  .go();
