import { book } from "./entities";

const { data, cursor } = await book.query
  .copies({ isbn: "9783453435773" })
  .go();
