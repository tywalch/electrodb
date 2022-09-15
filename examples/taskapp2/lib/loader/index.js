/* istanbul ignore file */
const makeLoader = require("./mock");
const makeTabler = require("../../../taskmanager/src/client");
const definition = require("../../../taskmanager/src/config/definition.json")

class TaskAppExampleLoader {
  constructor(service) {
    this.db = service;
  }
  /**
   * makeTable generates a new table
   */
  async makeTable() {
    if (this.db.client === undefined) {
      throw new Error("Operation requires DynamoDB DocumentClient. Please include a DynamoDB DocumentClient on class instantiation.")
    }
    let table = makeTabler(this.db.service.table, this.db.client.options);
    let exists = await table.exists().catch(err => console.log(err) || true);
    if (exists) {
      console.log("Table already exists!");
    } else {
      return table.create(definition)
        .then(() => console.log("Table created!"))
        .catch(err => {
          console.log("Error creating table", err);
          throw err;
        });
    }
  }

  async dropTable() {
    let tabler = makeTabler(this.db.service.table, this.db.client.options);
    return tabler.drop()
      .then(() => console.log("Table dropped!"))
      .catch(err => {
        console.log("Error dropping table", err);
        throw err;
      });
  }
  /**
   * loadTable loads the TaskApp Service with records. Requires DynamoDB DocumentClient and uses the models as theyre defined in this example
   * @param {number} employees the number of employee records to create
   * @param {number} tasks the number of task records create
   */

  loadTable({employees = 1, tasks = 1, offices = []} = {}) {
    if (this.db.client === undefined) {
      throw new Error("Operation requires DynamoDB DocumentClient. Please include a DynamoDB DocumentClient on class instantiation.")
    }
    if (typeof employees !== "number" || employees < 0) {
      throw new Error("Please include a number of employees to load that is greater than 0");
    }
    if (typeof tasks !== "number" || tasks < 0) {
      throw new Error("Please include a number of employees to load that is greater than 0");
    }
    let loader = makeLoader(this);
    
    return loader.load(employees, tasks, {offices})
  }
}

module.exports = TaskAppExampleLoader;
