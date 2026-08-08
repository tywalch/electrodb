import { EmployeeApp } from "./service";
import { Employee } from "./entities";

const startDate = "2020-05-01";
const endDate = "2020-06-01";

// on the service
await EmployeeApp.entities.employees.query
  .coworkers({ office: "gw zoo" })
  .where(
    ({ birthday, dateHired }, { between }) => `
        ${between(dateHired, startDate, endDate)} OR
        ${between(birthday, startDate, endDate)}
    `,
  )
  .go();

// on the entity
await Employee.query
  .coworkers({ office: "gw zoo" })
  .where(
    ({ birthday, dateHired }, { between }) => `
        ${between(dateHired, startDate, endDate)} OR
        ${between(birthday, startDate, endDate)}
    `,
  )
  .go();
