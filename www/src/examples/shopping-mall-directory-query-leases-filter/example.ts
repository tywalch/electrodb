import { StoreLocations } from "./entity";

let storeId = "LatteLarrys";
let yearStarDate = "2020-01-01";
let yearEndDate = "2020-12-31";

let stores = await StoreLocations.query
  .leases({ storeId })
  .between({ leaseEndDate: yearStarDate }, { leaseEndDate: yearEndDate })
  .where((attr, op) => op.eq(attr.category, "spite store"))
  .go();
