import { book } from "./entities";

const BOOK_IS_AVAILABLE = "AVAILABLE";

const { data, cursor } = await book.query
  .author({
    authorLastName: "king",
    authorFirstName: "stephen",
    loanEndDate: BOOK_IS_AVAILABLE,
  })
  .go();
