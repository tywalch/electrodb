import { animals } from "./entity";

animals.query
  .exhibit({ habitat: "Africa", enclosure: "5b" })
  .where(
    (_, { field, escape }) => `
    contains(${field("gsi1sk")}, ${escape("value")})
  `,
  )
  .go();
