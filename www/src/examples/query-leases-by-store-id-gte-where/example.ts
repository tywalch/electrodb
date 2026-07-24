import { StoreLocations } from "./entity";

await StoreLocations.query
  .leases({ storeId: "LatteLarrys" })
  .gte({ leaseEndDate: "2010-00-00" })
  .where(
    (attr, op) => `
      ${op.eq(attr.cityId, "Atlanta1")} AND ${op.contains(
        attr.category,
        "food",
      )}
  `,
  )
  .go();
