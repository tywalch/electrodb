import { StoreLocations } from "./entity";

await StoreLocations.query.leases({ storeId: "LatteLarrys" }).go();
