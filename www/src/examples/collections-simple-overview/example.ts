import { TaskApp } from "./service";

// overview
const results = await TaskApp.collections
  .overview({ projectId: "SD-204" })
  .go();
