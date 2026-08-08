import { animals } from "./entity";

await animals
  .update({ animal: "tiger", name: "janet" })
  .set({ keeper: "Joe Exotic" })
  .where(({ dangerous }, { eq }) => eq(dangerous, true))
  .go();
