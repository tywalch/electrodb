import { taskManager } from "./service";

const title = "Junior Software Engineer";
const salary = "100000";

const developers = await taskManager.entities.employee.query
  .roles({ title })
  .gt({ salary })
  .go();
