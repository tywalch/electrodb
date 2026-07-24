import { genre } from "./entities";

await genre.query.book({ isbn: "9783453435773" }).go();
await genre.query.title({ bookTitle: "it" }).go();
