/* istanbul ignore file */
import {
  library,
  Author,
  Book,
  Genre,
  Member,
  BOOK_IS_AVAILABLE,
  BookItem,
} from "./models";

// get all copies of books by the authors last name

type GetCopiesByAuthorOptions = {
  authorFirstName: string;
  authorLastName: string;
  cursor?: string | null;
};

async function getCopiesByAuthor(options: GetCopiesByAuthorOptions) {
  const { authorFirstName, authorLastName, cursor } = options;
  return Book.query.author({ authorFirstName, authorLastName, cursor }).go();
}

// this same query can be used to get unique books (instead
// of individual copies) because this entity is denormalized
// and contains all data about the book itself

type GetBooksByAuthorOptions = {
  authorFirstName: string;
  authorLastName: string;
  cursor?: string | null;
};

async function getBooksByAuthor(options: GetBooksByAuthorOptions) {
  const { authorFirstName, authorLastName, cursor } = options;
  const seen = new Set<string>();
  const copies = await getCopiesByAuthor({
    authorFirstName,
    authorLastName,
    cursor,
  });
  const books = copies.data.filter((copy) => {
    const hasSeen = seen.has(copy.bookId);
    if (!hasSeen) {
      seen.add(copy.bookId);
    }
    return !hasSeen;
  });

  return {
    data: books,
    cursor: copies.cursor,
  };
}

// get all authors by last name and a
// partial first name.

type GetAuthorsByNameOptions = {
  fullLastName: string;
  partialFirstName?: string;
  cursor?: string | null;
};

async function getAuthorsByName(options: GetAuthorsByNameOptions) {
  const { fullLastName, partialFirstName, cursor } = options;
  return Author.query
    .writer({ authorLastName: fullLastName })
    .begins({ authorFirstName: partialFirstName })
    .go({ cursor });
}

// get all authors by the full name of the writer

type GetAuthorsByFullNameOptions = {
  authorFirstName: string;
  authorLastName: string;
  cursor?: string | null;
};

async function getAuthorsByFullName(options: GetAuthorsByFullNameOptions) {
  const { authorLastName, authorFirstName, cursor } = options;

  return Author.query
    .writer({
      authorLastName,
      authorFirstName,
    })
    .go({ cursor });
}

// get author details, books (or available copies), and genres by
// author full name. You can then create your own structure using
// all the returned records

type GetAuthorsBodyOfWorkOptions = {
  authorFirstName: string;
  authorLastName: string;
  cursor?: string | null;
};

async function getAuthorsBodyOfWork(options: GetAuthorsBodyOfWorkOptions) {
  const { authorLastName, authorFirstName, cursor } = options;

  const bodyOfWork = await library.collections
    .works({ authorLastName, authorFirstName })
    .go({ cursor });

  const [writer] = bodyOfWork.data.author;
  const books = bodyOfWork.data.book;
  const genres = bodyOfWork.data.genre;
  return {
    data: {
      writer,
      books,
      genres,
    },
    cursor: bodyOfWork.cursor,
  };
}

// get all copies of a book by isbn
async function getCopiesByIsbn(isbn: string) {
  return Book.query.copies({ isbn }).go();
}
// get all the books on loan to a specific member

async function getBooksOnLoan(memberId: string) {
  return Book.query.loans({ memberId }).go();
}

// get all overdue books by memberId
async function getOverdueBooks(memberId: string) {
  const today = new Date();
  Book.query.loans({ memberId }).gt({ loanEndDate: today.toDateString() }).go();
}

// get number of books checked out by user
async function getCheckedOutCount() {
  const loaned = await Book.query.loans({ memberId: "0000001" }).go();

  return loaned.data.length;
}

// get member information and their checked out books
// in a single dynamodb query
async function getAccountInfo(memberId: string) {
  const account = await library.collections.account({ memberId }).go();

  const [member] = account.data.member;
  const books = account.data.book;
  return {
    member,
    books,
  };
}

// get all copies available to be checked out. Our loanEndDate property
// either holds the date the book is due or the text 'AVAILABLE'
async function getAvailableCopies(
  authorLastName: string,
  authorFirstName: string,
  bookId: string,
) {
  return Book.query
    .author({
      authorLastName,
      authorFirstName,
      loanEndDate: BOOK_IS_AVAILABLE,
    })
    .where((a, o) => o.eq(a.bookId, bookId))
    .go();
}

// get all copies NOT available to be checked out. If a copy is checked
// out the loanEndDate value will be a date value. Date values have a
// format: YYYY-MM-DD which will sort _before_ 'AVAILABLE', so any copy
// with a loanEndDate < 'AVAILABLE' will be checked out
async function getLoanedCopies(
  authorLastName: string,
  authorFirstName: string,
  bookId: string,
) {
  return Book.query
    .author({
      authorLastName,
      authorFirstName,
    })
    .lt({ loanEndDate: BOOK_IS_AVAILABLE })
    .where((a, o) => o.eq(a.bookId, bookId))
    .go();
}

// Get books/copies by title
async function getCopiesByTitle(bookTitle: string) {
  return Book.query.editions({ bookTitle }).go();
}

// Get books/copies by title and partial release date. Queries can be
// provided partially like just the year, the year and month, etc.
async function getEditions(
  bookTitle: string,
  earliestReleaseDate: string,
  latestReleaseDate?: string,
) {
  if (latestReleaseDate) {
    return Book.query
      .editions({ bookTitle })
      .between(
        { releaseDate: earliestReleaseDate },
        { releaseDate: latestReleaseDate },
      )
      .go();
  } else {
    return Book.query
      .editions({ bookTitle })
      .gte({ releaseDate: earliestReleaseDate })
      .go();
  }
}

// get a book and its genres by isbn or book title

type GetBookDetailsOptions =
  | {
      isbn: string;
    }
  | {
      bookTitle: string;
    };
async function getBookDetails(options: GetBookDetailsOptions) {
  if ("isbn" in options) {
    return library.collections.detail({ isbn: options.isbn }).go();
  } else {
    return library.collections.titles({ bookTitle: options.bookTitle }).go();
  }
}

// get books within a genre and maybe subgenre

type GetCopiesByGenreOptions = {
  genre: string;
  subgenre?: string;
  cursor?: string | null;
};

async function getCopiesByGenre(options: GetCopiesByGenreOptions) {
  const { genre, subgenre, cursor } = options;
  const bookGenres = await Genre.query
    .categories({ genre, subgenre })
    .go({ cursor });
  const uniqueBookTitles = Array.from(
    new Set(bookGenres.data.map((book) => book.bookTitle)),
  );
  const copies: BookItem[] = [];
  await Promise.all(
    uniqueBookTitles.map(async (bookTitle) => {
      const books = await Book.query.editions({ bookTitle }).go();
      copies.push(...books.data);
    }),
  );

  return {
    data: copies,
    cursor: bookGenres.cursor,
  };
}

// get subgenres within a given author and genre

type GetBooksByAuthorAndGenreOptions = {
  authorFirstName: string;
  authorLastName: string;
  genre: string;
  subgenre?: string;
  cursor?: string | null;
};

async function getBooksByAuthorAndGenre(
  options: GetBooksByAuthorAndGenreOptions,
) {
  const { cursor, genre, authorLastName, authorFirstName, subgenre } = options;
  const bookGenres = await Genre.query
    .author({
      authorFirstName,
      authorLastName,
      genre,
      subgenre,
    })
    .go({ cursor });

  const { data } = await Book.get(bookGenres.data).go();

  return {
    data,
    cursor: bookGenres.cursor,
  };
}
