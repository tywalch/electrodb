import { Service } from "electrodb";
import { employee, office } from "./entities";

export const workforce = new Service({ employee, office });
