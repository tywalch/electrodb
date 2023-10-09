/* istanbul ignore file */
import path from "path";
import moment from "moment";

import { taskManager, CreateTaskItem } from "./models";

/**
 * ATTENTION READ FIRST:
 * It is recommended that you use the dynamodb-local docker image for this example. For more information on how to
 * download visit: https://hub.docker.com/r/amazon/dynamodb-local
 *
 * If you intend on running this example against your own aws account, modify the config in the
 * file `/examples/common/client.ts` to match your account. This includes *removing* the `endpoint` property
 * which is used when connecting to the local docker dynamo instance described above.
 **/

async function query() {
  let records = await taskManager.entities.employee.scan.go();
  if (records.data.length === 0) {
    console.log(`
    Table is empty, be sure to load data into the table by uncommenting out 'loader.loadTable' in ${path.resolve(
      __dirname,
      "./index.js",
    )}
    `);
    process.exit(1);
  }
  const officeName = records.data[0].officeName;
  // Use Collections to query across entities.
  // Find office and staff information an office
  let workplace = await taskManager.collections.workplaces({ officeName }).go();
  console.log("Workplace Collection:", workplace.data, "\r\n");

  // Get employee details and all assigned
  let { firstName, lastName, employee } = workplace.data.employee[0];
  let kanban = await taskManager.collections.assignments({ employee }).go();
  console.log(`Assignments for ${firstName} ${lastName}:`, kanban, "\r\n");

  // Use Entities to drill into specific entities.
  // Find Junior Developers making more than 100,000
  let title = "Junior Software Engineer";
  let salary = "100000";
  let developers = await taskManager.entities.employee.query
    .roles({ title })
    .gt({ salary })
    .go();
  console.log(
    "Junior Developers with a salary greater than $100,000:",
    developers.data,
    "\r\n",
  );

  // Find all open tasks for a given project less than or equal to 13 points
  const status = "open";
  let project = "135-53";
  let tasks = await taskManager.entities.task.query
    .statuses({ status, project })
    .where(({ points }, { lte }) => lte(points, 13))
    .go();
  console.log(
    "All open tasks for a given project less than or equal to 13 points:",
    tasks.data,
    "\r\n",
  );

  // Find marketing team members who were hired in between two and five years ago:
  const team = "marketing";
  let twoYearsAgo = moment.utc().subtract(2, "years").format("YYYY-MM-DD");
  let fiveYearsAgo = moment.utc().subtract(5, "years").format("YYYY-MM-DD");
  let recentHires = await taskManager.entities.employee.query
    .teams({ team })
    .between({ dateHired: fiveYearsAgo }, { dateHired: twoYearsAgo })
    .go();
  console.log(
    "Employees hired between two and five years ago:",
    recentHires.data,
    "\r\n",
  );

  // CreateEntityItem< typeof YOUR_ENTITY > is exported to help you type items as they are used for creation
  function createNewTask(item: CreateTaskItem) {
    return taskManager.entities.task.put(item).go();
  }
}

async function main() {
  await query();
}

main().catch(console.error);
