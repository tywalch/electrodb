import type { CreateEntityItem } from "electrodb";
import { taskManager } from "./service";
import { task } from "./entities";

type CreateTaskItem = CreateEntityItem<typeof task>;

function createNewTask(item: CreateTaskItem) {
  return taskManager.entities.task.put(item).go();
}

const newTask = await createNewTask({
  task: "design-review",
  project: "135-53",
  employee: "tyler.walch",
  description: "Review the new component library designs",
  points: 5,
});
