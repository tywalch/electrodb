import { StoreLocations } from "./entity";

const unprocessed = await StoreLocations.put([
  {
    cityId: "LosAngeles1",
    storeId: "LatteLarrys",
    mallId: "EastPointe",
    buildingId: "F34",
    unitId: "a1",
    category: "food/coffee",
    leaseEndDate: "2022-03-22",
    rent: "4500.00",
  },
  {
    cityId: "LosAngeles1",
    storeId: "MochaJoes",
    mallId: "EastPointe",
    buildingId: "F35",
    unitId: "a2",
    category: "food/coffee",
    leaseEndDate: "2021-01-22",
    rent: "1500.00",
  },
]).go({ concurrent: 1 }); // `concurrent` value is optional and default's to `1`
