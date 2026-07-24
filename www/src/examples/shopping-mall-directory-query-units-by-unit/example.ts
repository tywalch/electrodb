import { StoreLocations } from "./entity";

let mallId = "EastPointe";
let buildingId = "BuildingA1";
let unitId = "B47";

let stores = await StoreLocations.query
  .units({ mallId, buildingId, unitId })
  .go();
