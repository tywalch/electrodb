import { Service } from "electrodb";
import { User, Account } from "./entities";

export const AccountService = new Service({ User, Account });
