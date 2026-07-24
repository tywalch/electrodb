import { EmployeeApp } from "./service";

await EmployeeApp.collections.workplaces({ office: "big cat rescue" }).go();
