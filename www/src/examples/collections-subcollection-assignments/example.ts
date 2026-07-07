import { TaskApp } from "./service";

const results = await TaskApp.collections
  .assignments({ employeeId: "JExotic" })
  .go();
