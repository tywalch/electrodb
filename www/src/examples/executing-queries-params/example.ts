import { StoreLocations } from "./entity";

const storeId = "LatteLarrys";

const params = StoreLocations.query
  .leases({ storeId })
  .between({ leaseEndDate: "2020-06-01" }, { leaseEndDate: "2020-07-31" })
  .where(({ rent }, { lte }) => lte(rent, "5000.00"))
  .params();
