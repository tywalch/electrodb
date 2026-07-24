import { StoreLocations } from "./entity";

const cityId = "Atlanta1";
const mallId = "EastPointe";
const storeId = "LatteLarrys";
const buildingId = "BuildingA1";

await StoreLocations.update({ cityId, mallId, storeId, buildingId })
  .data((a, o) => {
    const newTenant = o.value(a.tenants, ["larry"]);
    o.set(a.category, "food/meal"); // electrodb "enum"   -> dynamodb "string"
    o.add(a.tenants, newTenant); // electrodb "set"    -> dynamodb "set"
    o.add(a.warnings, 1); // electrodb "number" -> dynamodb "number"
    o.subtract(a.deposit, 200); // electrodb "number" -> dynamodb "number"
    o.remove(a.discount); // electrodb "number" -> dynamodb "number"
    o.append(a.rentalAgreement, [
      {
        // electrodb "list"   -> dynamodb "list"
        type: "amendment", // electrodb "map"    -> dynamodb "map"
        detail: "no soup for you",
      },
    ]);
    o.delete(a.tags, ["coffee"]);
    o.del(a.contact, ["555-345-2222"]); // electrodb "set"    -> dynamodb "set"
    o.add(a.fees, o.name(a.petFee)); // electrodb "number" -> dynamodb "number"
  })
  .where((attr, op) => op.eq(attr.category, "food/coffee"))
  .go();
