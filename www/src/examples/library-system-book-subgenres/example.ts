import { genre } from "./entities";

await genre.query.book({ isbn: "9783453435773", genre: "horror" }).go();
await genre.query.title({ bookTitle: "it", genre: "horror" }).go();
