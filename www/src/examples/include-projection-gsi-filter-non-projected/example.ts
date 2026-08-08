import { tasks } from "./entity";

// This would not work - filtering on non-projected attributes
const { data } = await tasks.query
  .statusIndex({ status: "open" })
  // @ts-expect-error - `description` is not included in the statusIndex projection
  .where(({ description }, { eq }) => eq(description, "Some description"))
  .go();
