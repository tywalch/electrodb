import { book } from "./entities";

const BOOK_IS_AVAILABLE = "AVAILABLE";

const { data, cursor } = await book.query
  .author({
    authorLastName: "king",
    authorFirstName: "stephen",
  })
  .lt({ loanEndDate: BOOK_IS_AVAILABLE })
  .go();
