import { InventoryItem } from "./entity";

await InventoryItem.query
  .location({ country: "US", region: "Georgia", city: "Atlanta" })
  .begins({ manufacturer: "A" })
  .go();
