import { EmployeeApp } from "./service";
import { Task } from "./entities";

// on the service
await EmployeeApp.entities.tasks.query.assigned({ employee: "cbaskin" }).go();

// on the entity
await Task.query.assigned({ employee: "cbaskin" }).go();
