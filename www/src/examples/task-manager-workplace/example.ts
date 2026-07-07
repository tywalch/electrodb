import { taskManager } from "./service";

const workplace = await taskManager.collections
  .workplaces({ office: "portland" })
  .go();
