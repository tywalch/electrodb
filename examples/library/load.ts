/* istanbul ignore file */
import { faker } from "@faker-js/faker";
import {
  createMockAuthor,
  createMockMember,
  createMockBook,
  createMockGenre,
  Genre,
  Member,
  Author,
  Book,
  BookItem,
  MemberItem,
  GenreItem,
  AuthorItem,
} from "./models";
import {
  initializeTable,
  table,
  createItems,
  uniqueItems,
  dynamodb,
  tableDefinition,
} from "../common";

/**
 * ATTENTION READ FIRST:
 * It is recommended that you use the dynamodb-local docker image for this example. For more information on how to
 * download visit: https://hub.docker.com/r/amazon/dynamodb-local
 *
 * If you intend on running this example against your own aws account, modify the config in the
 * file `/examples/common/client.ts` to match your account. This includes *removing* the `endpoint` property
 * which is used when connecting to the local docker dynamo instance described above.
 **/

function createMockData() {
  const members = createItems(20, () => createMockMember());

  const authors = createItems(20, () => createMockAuthor());

  const books = authors.flatMap((author) => {
    const { authorLastName, authorFirstName } = author;
    const bookCount = faker.number.int({ min: 2, max: 22 });
    return createItems(bookCount, () => {
      return createMockBook({ authorFirstName, authorLastName });
    });
  });

  const genres = books.flatMap((book) => {
    const { authorLastName, authorFirstName, bookTitle, isbn, bookId } = book;

    const author = authors.find((author) => {
      return (
        author.authorLastName === authorLastName &&
        author.authorFirstName === authorLastName
      );
    });

    const genreCount = faker.number.int({ min: 1, max: 2 });

    const genres = createItems(genreCount, () => {
      return createMockGenre({
        isbn,
        bookId,
        bookTitle,
        authorLastName,
        authorFirstName,
      });
    });

    const uniqueGenres = uniqueItems(genres, "isbn", "genre", "subgenre");

    if (author) {
      author.genres = uniqueItems(uniqueGenres, "genre").map(
        (items) => items.genre,
      );
    }

    return uniqueGenres;
  });

  return {
    members,
    authors,
    books,
    genres,
  };
}

type LoadTableOptions = {
  books: BookItem[];
  authors: AuthorItem[];
  members: MemberItem[];
  genres: GenreItem[];
};

async function loadTable(options: LoadTableOptions) {
  const { books, genres, members, authors } = options;
  await Genre.put(genres).go({ concurrency: 3 });
  await Member.put(members).go({ concurrency: 3 });
  await Author.put(authors).go({ concurrency: 3 });
  await Book.put(books).go({ concurrency: 3 });
}

async function main() {
  await initializeTable({
    definition: tableDefinition,
    dropOnExists: false,
    dynamodb,
  });
  const data = createMockData();
  await loadTable(data);
}

main().catch(console.error);
