import { Service } from "electrodb";
import { employees, tasks } from "./entities";

export const TaskApp = new Service({ employees, tasks });
