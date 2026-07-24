import type { CreateEntityItem } from "electrodb";
import { mi6 } from "./service";

type NewAgent = CreateEntityItem<typeof mi6.entities.agent>;

async function createNewAgent(newAgent: NewAgent) {
  return mi6.transaction
    .write(({ agent, constraint }) => [
      agent.create(newAgent).commit({ response: "all_old" }),
      constraint
        .create({
          name: "email",
          value: newAgent.email,
          entity: agent.schema.model.entity,
        })
        .commit(),
    ])
    .go();
}

await createNewAgent({
  id: "7",
  designation: "00",
  email: "james.bond@mi6.gov.uk",
  firstName: "James",
  lastName: "Bond",
  alive: true,
});
