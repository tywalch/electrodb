import { InventoryItem } from "./entity";

const results = await InventoryItem.query
  .location({ country: "US", region: "Georgia", city: "Atlanta" })
  .go();
