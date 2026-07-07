import { Book } from "./entity";

await Book.create({
  bookId: "beedabe8-e34e-4d41-9272-0755be9a2a9f",
  storeId: "pdx-45",
  author: "Stephen King",
  title: "IT",
  condition: "GOOD",
  price: 15,
  genre: ["HORROR", "THRILLER"],
  published: "1986-09-15",
}).go();
