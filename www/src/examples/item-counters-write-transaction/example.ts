import { AccountService } from "./service";

export type CreateEmployeeOptions = {
  organizationId: string;
  teamId: string;
  employeeId: string;
  name: string;
};

export function createEmployee(options: CreateEmployeeOptions) {
  const { organizationId, employeeId, name, teamId } = options;

  return AccountService.transaction
    .write(({ Employee, OrganizationItemCounter, GlobalCounter, TeamCounter }) => [
      Employee.create({ organizationId, employeeId, name }).commit(),

      GlobalCounter.upsert({}).add({ count: 1 }).commit(),
      TeamCounter.upsert({ organizationId, teamId }).add({ count: 1 }).commit(),
      OrganizationItemCounter.upsert({ organizationId, kind: "employee" })
        .add({ count: 1 })
        .commit(),
    ])
    .go();
}

export type RemoveEmployeeOptions = {
  organizationId: string;
  teamId: string;
  employeeId: string;
};

export function removeEmployee(options: RemoveEmployeeOptions) {
  const { organizationId, employeeId, teamId } = options;

  return AccountService.transaction
    .write(({ Employee, OrganizationItemCounter, GlobalCounter, TeamCounter }) => [
      Employee.remove({ organizationId, employeeId }).commit(),

      GlobalCounter.upsert({}).subtract({ count: 1 }).commit(),
      TeamCounter.upsert({ organizationId, teamId }).subtract({ count: 1 }).commit(),
      OrganizationItemCounter.upsert({ organizationId, kind: "employee" })
        .subtract({ count: 1 })
        .commit(),
    ])
    .go();
}

await createEmployee({
  organizationId: "acme-corp",
  teamId: "engineering",
  employeeId: "emp-001",
  name: "Jane Smith",
});
