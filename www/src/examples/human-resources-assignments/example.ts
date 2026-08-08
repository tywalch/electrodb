import { EmployeeApp } from "./service";

await EmployeeApp.collections.assignments({ employee: "CBaskin" }).go();
