import { book } from "./entities";

const today = "2022-07-30";

const { data, cursor } = await book.query
  .loans({ memberId: "0000001" })
  .gt({ loanEndDate: today })
  .go();
