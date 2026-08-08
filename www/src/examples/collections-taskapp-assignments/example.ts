import { TaskApp } from "./service";

await TaskApp.collections.assignments({ employeeId: "JExotic" }).go();
