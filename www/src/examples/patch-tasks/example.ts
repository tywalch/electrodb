import { tasks } from "./entity";

await tasks
  .patch({
    team: "core",
    task: "45-662",
    project: "backend",
  })
  .set({ status: "open" })
  .add({ points: 5 })
  .append({
    comments: [
      {
        user: "janet",
        body: "This seems half-baked.",
      },
    ],
  })
  .where(({ status }, { eq }) => eq(status, "in-progress"))
  .go();
