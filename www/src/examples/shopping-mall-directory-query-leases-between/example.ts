import { StoreLocations } from "./entity";

let storeId = "LatteLarrys";
let q4StartDate = "2020-10-01";
let q4EndDate = "2020-12-31";

let stores = await StoreLocations.query
  .leases({ storeId })
  .between({ leaseEndDate: q4StartDate }, { leaseEndDate: q4EndDate })
  .go();
