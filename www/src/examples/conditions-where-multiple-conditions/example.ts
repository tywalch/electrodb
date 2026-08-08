import { animals } from "./entity";

await animals
  .update({ animal: "tiger", name: "janet" })
  .set({ keeper: "Joe Exotic" })
  .where(
    (attr, op) => `
    ${op.eq(attr.dangerous, true)} AND ${op.notExists(attr.lastFed)}
  `,
  )
  .go();
