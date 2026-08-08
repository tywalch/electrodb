import { organization, user } from "./entities";

await organization.query.myIndex({ organizationId: "123" }).go();

await user.query.myIndex({ userId: "456" }).go();
