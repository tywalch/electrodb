import { genre } from "./entities";

const { data, cursor } = await genre.query
  .author({
    authorFirstName: "stephen",
    authorLastName: "king",
    genre: "horror",
  })
  .go();
