import { StoreLocations } from "./entity";

let storeId = "LatteLarrys";
let q2StartDate = "2020-04-01";

let stores = await StoreLocations.query
  .leases({ storeId })
  .lt({ leaseEndDate: q2StartDate })
  .go();
