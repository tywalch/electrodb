import { StoreLocations } from "./entity";

let unprocessed = await StoreLocations.delete([
  {
    storeId: "LatteLarrys",
    mallId: "EastPointe",
    buildingId: "F34",
    cityId: "LosAngeles1",
  },
  {
    storeId: "MochaJoes",
    mallId: "EastPointe",
    buildingId: "F35",
    cityId: "LosAngeles1",
  },
]).go({ concurrent: 1 }); // `concurrent` value is optional and default's to `1`
