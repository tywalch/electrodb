import { StoreLocations } from "./entity";

const { data, unprocessed } = await StoreLocations.get([
  {
    storeId: "LatteLarrys",
    mallId: "EastPointe",
    buildingId: "F34",
    cityId: "Atlanta1",
  },
  {
    storeId: "MochaJoes",
    mallId: "WestEnd",
    buildingId: "A21",
    cityId: "Madison2",
  },
]).go({ concurrent: 1 }); // `concurrent` value is optional and default's to `1`
