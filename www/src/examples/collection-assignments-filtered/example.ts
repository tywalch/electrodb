import { TaskApp } from "./service";

const results = await TaskApp.collections
  .assignments({ employeeId: "CBaskin" })
  .where(({ projectId }, { notExists, contains }) => `
    ${notExists(projectId)} OR ${contains(projectId, "murder")}
  `)
  .go();
