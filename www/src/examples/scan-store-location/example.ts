import { StoreLocations } from "./entity";

await StoreLocations.scan
  .where(
    ({ category }, { eq }) => `
        ${eq(category, "food/coffee")} OR ${eq(category, "spite store")}
    `,
  )
  .where(
    ({ leaseEndDate }, { between }) => `
        ${between(leaseEndDate, "2020-03", "2020-04")}
    `,
  )
  .go();
