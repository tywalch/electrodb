import { animals } from "./entity";

animals.query
  .farm({ habitat: "Africa" })
  .where(({ veterinarian }, { eq }) => eq(veterinarian.name, "Herb Peterson"))
  .go();
