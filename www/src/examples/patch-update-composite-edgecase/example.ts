import { entity } from "./entity";

await entity
  .patch({ attr1: "value1", attr2: "value2" })
  .set({ attr4: "value4" })
  .go();
