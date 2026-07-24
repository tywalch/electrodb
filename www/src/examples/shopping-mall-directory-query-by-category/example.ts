import { StoreLocations } from "./entity";

let mallId = "EastPointe";
let category = "food/coffee";

let stores = await StoreLocations.query
  .units({ mallId })
  .where((attr, op) => op.eq(attr.category, category))
  .go();
