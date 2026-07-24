import { StoreLocations } from "./entity";

await StoreLocations.query
  .leases({ storeId: "LatteLarrys" })
  .between({ leaseEndDate: "2010-00-00" }, { leaseEndDate: "2020-99-99" })
  .go();
