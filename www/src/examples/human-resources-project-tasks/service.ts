import { Service } from "electrodb";
import { Employee, Task, Office } from "./entities";

export const EmployeeApp = new Service({
  employees: Employee,
  tasks: Task,
  offices: Office,
});
