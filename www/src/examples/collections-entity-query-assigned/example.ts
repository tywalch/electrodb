import { TaskApp } from "./service";

await TaskApp.entities.task.query.assigned({ employeeId: "JExotic" }).go();
