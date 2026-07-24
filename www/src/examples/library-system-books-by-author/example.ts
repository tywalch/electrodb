import { author } from "./entities";

const { data, cursor } = await author.query
  .writer({ authorLastName: "king" })
  .go();
