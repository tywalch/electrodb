import { taskManager } from "./service";

const status = "open";
const project = "135-53";

const tasks = await taskManager.entities.task.query
  .statuses({ status, project })
  .where(({ points }, { lte }) => lte(points, 13))
  .go();
