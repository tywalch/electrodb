import { StoreLocations } from "./entity";

// Example #2
await StoreLocations.query
  .units({ mallId: "EastPointe" })
  .begins({ buildingId: "f34" })
  .go();
// ---------------------------------^^^^^^^^^^^^^^^^^^^^^
