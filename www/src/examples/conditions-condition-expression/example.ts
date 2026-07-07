import { animals } from "./entity";

await animals
  .update({
    animal: "blackbear",
    name: "Isabelle",
  })
  // no longer pregnant because Ernesto was born!
  .set({
    isPregnant: false,
    lastEvaluation: "2021-09-12",
    lastEvaluationBy: "stephanie.adler",
  })
  // welcome to the world Ernesto!
  .append({
    offspring: [
      {
        name: "Ernesto",
        birthday: "2021-09-12",
        note: "healthy birth, mild pollen allergy",
      },
    ],
  })
  // using the where clause can guard against making
  // updates against stale data
  .where(
    ({ isPregnant, lastEvaluation }, { lt, eq }) => `
    ${eq(isPregnant, true)} AND ${lt(lastEvaluation, "2021-09-12")}
  `,
  )
  .go();
