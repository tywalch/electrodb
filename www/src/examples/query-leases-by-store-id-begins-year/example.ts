import { StoreLocations } from "./entity";

await StoreLocations.query
  .leases({ storeId: "LatteLarrys" })
  .begins({ leaseEndDate: "2020-00-00" })
  .go();
