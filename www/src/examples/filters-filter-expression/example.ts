import { animals } from "./entity";

animals.query
  .exhibit({ habitat: "Africa" })
  .where(
    ({ isPregnant, offspring }, { exists, eq }) => `
    ${eq(isPregnant, true)} OR ${exists(offspring)}
  `,
  )
  .go();
