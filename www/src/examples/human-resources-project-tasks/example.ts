import { EmployeeApp } from "./service";
import { Task } from "./entities";

// on the service
await EmployeeApp.entities.tasks.query
  .project({ project: "Murder Carol" })
  .go();

// on the entity
await Task.query.project({ project: "Murder Carol" }).go();
