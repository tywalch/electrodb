import { Service } from "electrodb";
import { employees, tasks, projectMembers } from "./entities";

export const TaskApp = new Service({
  employees,
  tasks,
  projectMembers,
});
