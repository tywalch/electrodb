import { animals } from "./entity";

animals.query
  .exhibit({ habitat: "Africa", enclosure: "5b" })
  .where(({ dangerous }, { eq }) => eq(dangerous, true))
  .go();
