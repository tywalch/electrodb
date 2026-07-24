import { Service } from "electrodb";
import { author, book, genre, member } from "./entities";

export const library = new Service({
  author,
  book,
  genre,
  member,
});
