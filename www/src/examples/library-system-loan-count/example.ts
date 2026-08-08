import { book } from "./entities";

const count = await book.query
  .loans({ memberId: "0000001" })
  .go()
  .then((loans) => loans.data.length);
