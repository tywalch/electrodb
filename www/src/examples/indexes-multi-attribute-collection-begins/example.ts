import { service } from "./service";

const filtered = await service.collections
  .inventory({ country: "US", region: "Georgia" })
  .begins({ city: "A" })
  .go();
// results.data.InventoryItem -> InventoryItem[]
// results.data.Warehouse -> Warehouse[]
