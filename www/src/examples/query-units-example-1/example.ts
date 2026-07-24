import { StoreLocations } from "./entity";

// Example #1, access pattern `units`
await StoreLocations.query
  .units({ mallId: "EastPointe", buildingId: "f34" })
  .go();
// -----------------------^^^^^^^^^^^^^^^^^^^^^^
