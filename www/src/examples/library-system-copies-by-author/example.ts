import { book } from "./entities";

const { data, cursor } = await book.query
  .author({ authorLastName: "king", authorFirstName: "stephen" })
  .go();
