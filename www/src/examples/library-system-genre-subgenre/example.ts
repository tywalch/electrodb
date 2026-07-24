import { genre } from "./entities";

const { data, cursor } = await genre.query
  .categories({ genre: "horror", subgenre: "killer clowns" })
  .go();
