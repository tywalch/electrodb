import { animals } from "./entity";

animals.query
  .exhibit({ habitat: "Africa", enclosure: "5b" })
  .where(
    ({ keeper }, { name, value, eq }) => `
    ${name(keeper)} = ${value(keeper, "Tiger King")}
  `,
  )
  .go();
