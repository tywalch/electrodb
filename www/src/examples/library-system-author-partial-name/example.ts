import { author } from "./entities";

await author.query
  .writer({ authorLastName: "king" })
  .begins({ authorFirstName: "s" })
  .go();
