import { Book } from "./entity";

const { data, cursor } = await Book.query
  .byLocation({ storeId: "pdx-45" })
  .where(({ price }, { lte }) => lte(price, 10))
  .go();
