import { workforce } from "./service";

await workforce.transaction
  .get(({ employee, office }) => [
    employee.get({ employeeId: "employee-1" }).commit(),
    office.get({ officeId: "office-1" }).commit(),
  ])
  .go();
