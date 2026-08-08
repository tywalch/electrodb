import { EmployeeApp } from "./service";
import { Employee } from "./entities";

// on the service
await EmployeeApp.entities.employees.query
  .directReports({ manager: "jlowe" })
  .go();

// on the entity
await Employee.query.directReports({ manager: "jlowe" }).go();
