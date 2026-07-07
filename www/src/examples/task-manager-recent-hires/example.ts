import { taskManager } from "./service";

function yearsAgo(years: number): string {
  const date = new Date();
  date.setUTCFullYear(date.getUTCFullYear() - years);
  return date.toISOString().slice(0, 10);
}

const team = "marketing";
const twoYearsAgo = yearsAgo(2);
const fiveYearsAgo = yearsAgo(5);

const recentHires = await taskManager.entities.employee.query
  .teams({ team })
  .between({ dateHired: fiveYearsAgo }, { dateHired: twoYearsAgo })
  .go();
