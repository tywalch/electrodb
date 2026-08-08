import { animals } from "./entity";

await animals.query
  .exhibit({ habitat: "Africa", enclosure: "5b" })
  .where(
    ({ diet }, { size, escape }) => `
    ${size(diet)} > ${escape(2)}
  `,
  )
  .go();
