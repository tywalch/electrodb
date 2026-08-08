import { taskManager } from "./service";

const { data, cursor } = await taskManager.collections
  .assignments({ employee: "tyler.walch" })
  .go();
