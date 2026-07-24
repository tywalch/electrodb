import { EmployeeApp } from "./service";
import { Employee } from "./entities";

// on the service
await EmployeeApp.entities.employees.query
  .roles({ title: "animal wrangler" })
  .lte({ salary: "150.00" })
  .go();

// on the entity
await Employee.query
  .roles({ title: "animal wrangler" })
  .lte({ salary: "150.00" })
  .go();
