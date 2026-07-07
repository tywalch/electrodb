import { tasks } from "./entity";

// With hydration, you get all attributes but can only filter on projected ones
const { data } = await tasks.query
  .statusIndex({ status: "open" })
  .where((attr, op) => op.eq(attr.name, "Important Task"))
  .go({ hydrate: true });

// data will contain all attributes: { taskId, projectId, name, description, status, priority, createdAt, updatedAt }[]
