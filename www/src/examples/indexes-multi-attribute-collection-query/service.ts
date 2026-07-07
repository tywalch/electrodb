import { Service } from "electrodb";
import { InventoryItem, Warehouse } from "./entities";

export const service = new Service({ InventoryItem, Warehouse });
