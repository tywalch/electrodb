import { tasks } from "./entity";

const { data } = await tasks.query
  .statusIndex({ status: "open" })
  .where((attr, op) => op.eq(attr.name, "Important Task"))
  .go({
    hydrate: true,
    attributes: ["taskId", "name", "description"],
  });

// data will only contain: { taskId: string, name: string, description: string }[]
