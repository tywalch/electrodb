const moment = require("moment");
const TaskAppExample = require("./app");
const {EmployeesModel, TasksModel, OfficesModel} = require("./models");
const DynamoDB = require("aws-sdk/clients/dynamodb");

/**
 * It is recomended that you use the dynamodb-local docker image for this example. For more
 * information on how to download visit: https://hub.docker.com/r/amazon/dynamodb-local
 * 
 * If you intend on running this example against your own aws account, modify the config to
 * account for the needs of your account. This includes *removing* the `endpoint` property,
 * which is used when connecting to the local docker dynamo instance described above.  
**/
const client = new DynamoDB.DocumentClient({region: "us-east-1", endpoint: "http://localhost:8000"});

/**
 * Create a new instance of the TaskAppExample (A class that extends Service, allowing you 
 * to create and load the table with Task/Employee/Office data).
**/
const taskr = new TaskAppExample({
  version: "1",
  service: "EmployeeApp",
  table: "electro",
}, {client});

/**
 * Join in the Employees, Tasks, and Offices models
**/
taskr
  .join(EmployeesModel)
  .join(TasksModel)
  .join(OfficesModel);

/**
 * Uncomment the relevent lines to create a table, then load it, optionally delete, and finally query.
 * For more examples checkout the README.
**/

// Make table:
taskr.makeTable();

// Load table:
// taskr.loadTable({employees: 100, tasks: 200});

// Drop table:
// taskr.dropTable()

// Query table:
// query(taskr)

async function query(taskr) {

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
  let salary = "100000"
  let developers = await taskr.entities.employees.query.roles({title}).gt({salary}).go();
  console.log("Junior Developers with a salary greater than $100,000:", developers, "\r\n");

  
  // Find all open tasks for a given project less than or equal to 13 points
  let status = "open"
  let project = "135-53";
  let tasks = await taskr.entities.tasks.query
    .statuses({status, project})
    .where(({points}, {lte}) => lte(points, 13))
    .go();
  console.log("All open tasks for a given project less than or equal to 13 points:", tasks, "\r\n");
  

  // Find marketing team members who were hired in between two and five years ago:
  let team = "marketing";
  let twoYearsAgo = moment.utc().subtract(2, "years").format("YYYY-MM-DD");
  let fiveYearsAgo = moment.utc().subtract(5, "years").format("YYYY-MM-DD");
  let recentHires = await taskr.entities.employees.query
    .teams({team})
    .between(
      { dateHired: fiveYearsAgo },
      { dateHired: twoYearsAgo }
    ).go()
  console.log("Employees hired between two and five years ago:", recentHires, "\r\n");
  
  // Explore the models in `./models` and the README for more queries to try!
}

