import { service } from "./service";

const results = await service.collections
  .inventory({ country: "US", region: "Georgia", city: "Atlanta" })
  .go();
// results.data.InventoryItem -> InventoryItem[]
// results.data.Warehouse -> Warehouse[]
