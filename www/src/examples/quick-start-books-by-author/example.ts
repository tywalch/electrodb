import { Book } from "./entity";

const { data, cursor } = await Book.query
  .byAuthor({ author: "Stephen King" })
  .go();
