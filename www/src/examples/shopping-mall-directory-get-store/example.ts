import { StoreLocations } from "./entity";

let storeId = "LatteLarrys";
let mallId = "EastPointe";
let buildingId = "BuildingA1";
let cityId = "Atlanta1";

await StoreLocations.get({ storeId, mallId, buildingId, cityId }).go();
