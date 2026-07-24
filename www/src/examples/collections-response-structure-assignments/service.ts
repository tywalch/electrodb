import { Service } from "electrodb";
import { Employee, Task } from "./entities";

export const TaskApp = new Service({
  employee: Employee,
  task: Task,
});
