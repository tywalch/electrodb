import { animals } from "./entity";

animals.query
  .exhibit({ habitat: "Africa", enclosure: "5b" })
  .where(
    (attr, op) => `
    ${op.eq(attr.dangerous, true)} AND ${op.notExists(attr.lastFed)}
  `,
  )
  .go();
