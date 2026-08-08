import { library } from "./service";

await library.collections
  .works({ authorLastName: "king", authorFirstName: "stephen" })
  .go()
  .then((works) => {
    const [writer] = works.data.author;
    const books = works.data.book;
    const genres = works.data.genre;
    return {
      writer,
      books,
      genres,
    };
  });
