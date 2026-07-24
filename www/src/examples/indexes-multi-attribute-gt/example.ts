import { InventoryItem } from "./entity";

await InventoryItem.query
  .location({ country: "US", region: "Georgia", city: "Atlanta" })
  .gt({ manufacturer: "Acme", model: "X1", count: 100 })
  .go();
