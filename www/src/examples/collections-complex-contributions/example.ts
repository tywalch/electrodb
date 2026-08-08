import { TaskApp } from "./service";

// contributions
const results = await TaskApp.collections
  .contributions({ employeeId: "JExotic" })
  .go();
