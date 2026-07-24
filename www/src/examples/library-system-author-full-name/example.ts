import { author } from "./entities";

await author.query
  .writer({ authorLastName: "smith", authorFirstName: "john" })
  .go();
