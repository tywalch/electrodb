/* istanbul ignore file */
import data from "./data.json";
import { initializeTable, dynamodb, tableDefinition } from "../common";
import {
  OfficeItem,
  EmployeeItem,
  TaskItem,
  Task,
  Employee,
  Office,
} from "./models";

/**
 * ATTENTION READ FIRST:
 * It is recommended that you use the dynamodb-local docker image for this example. For more information on how to
 * download visit: https://hub.docker.com/r/amazon/dynamodb-local
 *
 * If you intend on running this example against your own aws account, modify the config in the
 * file `/examples/common/client.ts` to match your account. This includes *removing* the `endpoint` property
 * which is used when connecting to the local docker dynamo instance described above.
 **/

type LoadTableOptions = {
  tasks: TaskItem[];
  offices: OfficeItem[];
  employees: EmployeeItem[];
};

async function loadTable(options: LoadTableOptions) {
  const { tasks, offices, employees } = options;
  await Task.put(tasks).go({ concurrent: 3 });
  await Office.put(offices).go({ concurrent: 3 });
  await Employee.put(employees).go({ concurrent: 3 });
}

async function main() {
  await initializeTable({
    definition: tableDefinition,
    dropOnExists: false,
    dynamodb,
  });
  await loadTable(data as LoadTableOptions);
}

main().catch(console.error);
