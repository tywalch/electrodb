import { Service } from "electrodb";
import {
  Employee,
  OrganizationItemCounter,
  TeamCounter,
  GlobalCounter,
} from "./entities";

export const AccountService = new Service({
  Employee,
  OrganizationItemCounter,
  TeamCounter,
  GlobalCounter,
});
