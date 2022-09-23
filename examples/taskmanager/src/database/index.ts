/* istanbul ignore file */

import { Service } from "../../../../index";
import { employee } from "./employee";
import { task } from "./task";
import { office } from "./office";

export * from './task';
export * from './office';
export * from './employee';

/**
 * Create a new Service instance
 **/
export const taskManager = new Service({employee, task, office});