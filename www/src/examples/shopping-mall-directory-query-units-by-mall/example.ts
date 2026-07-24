import { StoreLocations } from "./entity";

let mallId = "EastPointe";

let stores = await StoreLocations.query.units({ mallId }).go();
