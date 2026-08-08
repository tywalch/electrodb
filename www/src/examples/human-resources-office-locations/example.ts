import { EmployeeApp } from "./service";
import { Office } from "./entities";

// on the service
await EmployeeApp.entities.offices.query
  .locations({ country: "usa", state: "florida" })
  .go();

// on the entity
await Office.query.locations({ country: "usa", state: "florida" }).go();
