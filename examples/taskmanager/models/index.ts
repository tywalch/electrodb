/* istanbul ignore file */

import { Service } from "../../../";
import { Employee } from "./employee";
import { Task } from "./task";
import { Office } from "./office";

export * from './task';
export * from './office';
export * from './employee';

/**
 * Create a new Service instance
 **/
export const taskManager = new Service({
    employee: Employee,
    task: Task,
    office: Office,
});