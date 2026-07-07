import { assets } from "./entity";

// the locations index (gsi1pk-gsi1sk-index) is a KEYS_ONLY projection
const { data, cursor } = await assets.query
  .locations({ state: "Georgia" })
  .go({ hydrate: true });
