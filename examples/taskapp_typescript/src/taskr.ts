process.env.AWS_NODEJS_CONNECTION_REUSE_ENABLED = "1";
import {Entity, Service} from "../../../";
import client from "./client";
import EmployeeModel from "./models/employees";
import TaskModel from "./models/tasks";
import OfficeModel from "./models/offices";

const table = "electro";

const employees = new Entity(EmployeeModel)
const tasks = new Entity(TaskModel);
const offices = new Entity(OfficeModel);

/**
 * Create a new Service instance
 **/
const taskr = new Service({employees, tasks, offices}, {client, table});

export default taskr;