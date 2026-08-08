import { animals } from "./entity";

await animals
  .update({ animal: "tiger", name: "janet" })
  .set({ keeper: "Joe Exotic" })
  .where(({ offspring }, { eq }) => eq(offspring[0].name, "Blitzen"))
  .go();
