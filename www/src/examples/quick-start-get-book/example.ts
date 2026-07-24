import { Book } from "./entity";

const book = await Book.get({
  bookId: "beedabe8-e34e-4d41-9272-0755be9a2a9f",
  storeId: "pdx-45",
}).go();
