import { StoreLocations } from "./entity";

const results1 = await StoreLocations.query
  .leases({ storeId: "LatteLarrys" })
  .go(); // no "cursor" passed to `.go()`

const results2 = await StoreLocations.query
  .leases({ storeId: "LatteLarrys" })
  .go({ cursor: results1.cursor }); // Paginate by querying with the "cursor" from your first query
