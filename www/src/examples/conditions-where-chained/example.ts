import { animals } from "./entity";

await animals
  .update({ animal: "tiger", name: "janet" })
  .set({ keeper: "Joe Exotic" })
  .where(
    (attr, op) => `
    ${op.eq(attr.dangerous, true)} OR ${op.notExists(attr.lastFed)}
  `,
  )
  .where(({ birthday }, { between }) => {
    const today = Date.now();
    const lastMonth = today - 1000 * 60 * 60 * 24 * 30;
    return between(birthday, String(lastMonth), String(today));
  })
  .go();
