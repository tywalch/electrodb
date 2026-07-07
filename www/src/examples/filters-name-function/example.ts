import { animals } from "./entity";

animals.query
  .exhibit({ habitat: "Africa", enclosure: "5b" })
  .where(
    ({ lastFedBy, keeper }, { name }) => `
    ${name(lastFedBy)} != ${name(keeper)}
  `,
  )
  .go();
