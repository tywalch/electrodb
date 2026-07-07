import { Service } from "electrodb";
import { agent, constraint } from "./entities";

export const mi6 = new Service({ constraint, agent });
