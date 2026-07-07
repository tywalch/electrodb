import { animals } from "./entity";

await animals
  .update({ animal: "tiger", name: "janet" })
  .set({ keeper: "Joe Exotic" })
  .where(({ veterinarian }, { eq }) => eq(veterinarian.name, "Herb Peterson"))
  .go();
