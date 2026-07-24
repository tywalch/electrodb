import { InventoryItem } from "./entity";

await InventoryItem.query
  .location({ country: "US", region: "Georgia", city: "Atlanta" })
  .between(
    { manufacturer: "Acme", model: "X1", count: 50 },
    { manufacturer: "Acme", model: "X1", count: 200 },
  )
  .go();
