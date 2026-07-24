import { book } from "./entities";

await book.query
  .releases({ bookTitle: "it" })
  .gte({ releaseDate: "1990-00-00" })
  .go();

await book.query
  .releases({ bookTitle: "it" })
  .between({ releaseDate: "1990-00-00" }, { releaseDate: "2019-99-99" })
  .go();
