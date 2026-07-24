import { tasks } from "./entity";

// This works - filtering on projected attributes
const { data } = await tasks.query
  .statusIndex({ status: "open" })
  .where(({ name }, { eq }) => eq(name, "Important Task"))
  .go();
