import { animals } from "./entity";

animals.query
  .exhibit({ habitat: "Tundra" })
  .where(({ offspring }, { eq }) => eq(offspring[0].name, "Blitzen"))
  .go();
