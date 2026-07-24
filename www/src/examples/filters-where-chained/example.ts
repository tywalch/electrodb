import { animals } from "./entity";

animals.query
  .habitats({ habitat: "Africa", enclosure: "5b" })
  .where((attr, op) => `
    ${op.eq(attr.dangerous, true)} OR ${op.notExists(attr.lastFed)}
  `)
  .where(({ birthday }, { between }) => {
    const today = Date.now();
    const lastMonth = today - 1000 * 60 * 60 * 24 * 30;
    return between(birthday, lastMonth, today);
  })
  .go();
