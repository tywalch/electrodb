import { Book } from "./entity";

await Book.patch({
  bookId: "beedabe8-e34e-4d41-9272-0755be9a2a9f",
  storeId: "pdx-45",
})
  .set({
    price: 10,
    condition: "FAIR",
  })
  .go();
