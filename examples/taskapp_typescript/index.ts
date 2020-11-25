import moment from "moment";
import taskr from "../taskapp/app";
import {employees} from "../taskapp/app";
import Loader from "../taskapp/loader";
/**
 * ATTENTION READ FIRST:
 * It is recomended that you use the dynamodb-local docker image for this example. For more
 * information on how to download visit: https://hub.docker.com/r/amazon/dynamodb-local
 *
 * If you intend on running this example against your own aws account, modify the config in
 * the file ./service to match your account. This includes *removing* the `endpoint` property,
 * which is used when connecting to the local docker dynamo instance described above.
**/

/**
 * Create a new instance of the TaskAppExample (Made for this example help create and load
 * the table with Task/Employee/Office data).
**/
const loader = new Loader(taskr);

/**
 * Uncomment the relevent lines to create a table, then load it, optionally delete, and finally query.
 * For more examples checkout the README.
**/
// Make table:
// loader.makeTable();

// Load table:
// loader.loadTable({employees: 500, tasks: 600});

// Drop table:
// loader.dropTable()

// Query table:
// query();

async function query() {
  // Use Collections to query across entities.
  // Find office and staff information for the "Scranton Branch"
  let scranton = await taskr.collections.workplaces({office: "Scranton Branch"}).go();
  console.log("Workplace Collection:", scranton, "\r\n");

  // Get employee details and all assigned
  let {firstName, lastName, employee} = scranton.employees[0];
  let kanban = await taskr.collections.assignments({employee}).go();
  console.log(`Assignments for ${firstName} ${lastName}:`, kanban, "\r\n");

  // Use Entities to drill into specific entities.
  // Find Junior Developers making more than 100,000
  let title = "Junior Software Engineer";
  let salary = "100000";
  let developers = await taskr.entities.employees.query.roles({title}).gt({salary}).go();
  console.log("Junior Developers with a salary greater than $100,000:", developers, "\r\n");

  // Find all open tasks for a given project less than or equal to 13 points
  const status = "open";
  let project = "135-53";
  let tasks = await taskr.entities.tasks.query
    .statuses({status, project})
    .where(({points}, {lte}) => lte(points, 13))
    .go();
  console.log("All open tasks for a given project less than or equal to 13 points:", tasks, "\r\n");

  // Find marketing team members who were hired in between two and five years ago:
  const team = "marketing";
  let twoYearsAgo = moment.utc().subtract(2, "years").format("YYYY-MM-DD");
  let fiveYearsAgo = moment.utc().subtract(5, "years").format("YYYY-MM-DD");
  let recentHires = await taskr.entities.employees.query
    .teams({team})
    .between(
      { dateHired: fiveYearsAgo },
      { dateHired: twoYearsAgo }
    ).go();
  console.log("Employees hired between two and five years ago:", recentHires, "\r\n");
  // Explore the models in `./models` and the README for more queries to try!
}
