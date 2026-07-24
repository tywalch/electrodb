import { StoreLocations } from "./entity";

let mallId = "EastPointe";
let buildingId = "BuildingA1";
let storeId = "LatteLarrys";

let stores = await StoreLocations.query
  .units({ mallId, buildingId, storeId })
  .go();
