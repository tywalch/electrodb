import { Service } from "electrodb";
import { employee, task, office } from "./entities";

export const taskManager = new Service({
  employee,
  task,
  office,
});
