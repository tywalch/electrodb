import { genre } from "./entities";

await genre.query
  .author({ authorFirstName: "stephen", authorLastName: "king" })
  .go()
  .then((results) => {
    const uniqueGenres = new Set<string>();
    for (const { genre } of results.data) {
      uniqueGenres.add(genre);
    }
    return Array.from(uniqueGenres);
  });
