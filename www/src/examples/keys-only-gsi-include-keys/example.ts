import { assets } from "./entity";

// The elements in the `data` array are just the keys of the index, despite the typing saying otherwise.
const { data, cursor } = await assets.query
  .locations({ state: "Georgia" })
  .go({ data: "includeKeys" });
