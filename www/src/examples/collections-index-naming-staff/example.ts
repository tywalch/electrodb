import { employee } from "./entity";

await employee.query.staff({ organizationId: "nike" }).go();
