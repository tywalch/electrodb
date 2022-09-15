import { Entity, Service } from "../../";

const table = "your_table_name";

// the "author" entity holds information about each author
// that has a book at the library
const author = new Entity(
    {
        model: {
            entity: "author",
            version: "1",
            service: "library"
        },
        attributes: {
            authorFirstName: {
                type: "string",
                required: true
            },
            authorLastName: {
                type: "string",
                required: true
            },
            birthday: {
                type: "string",
            },
            bio: {
                type: "string",
                required: true,
            }
        },
        indexes: {
            writer: {
                pk: {
                    field: "pk",
                    composite: ["authorLastName"]
                },
                sk: {
                    field: "sk",
                    composite: ["authorFirstName", "birthday"]
                }
            },
            info: {
                collection: ['works'],
                index: "gsi2pk-gsi2sk-index",
                pk: {
                    field: "gsi2pk",
                    composite: ["authorLastName", "authorFirstName"]
                },
                sk: {
                    field: "gsi2sk",
                    composite: []
                }
            },
        }
    },
    { table }
);

// the "book" entity holds represents a physical book at the library
// because book details (like the the author or release date) do not
// change over time, we can use denormalization to remove the need
// for a single book entity. This allows us to treat this entity as
// both an authority on book information and an individual book.
const book = new Entity(
    {
        model: {
            entity: "book",
            version: "1",
            service: "library"
        },
        attributes: {
            bookId: {
                type: "string",
            },
            bookTitle: {
                type: "string",
                required: true,
            },
            description: {
                type: "string",
                required: true,
            },
            publisher: {
                type: "string",
                required: true,
            },
            releaseDate: {
                type: "string",
                required: true,
            },
            authorFirstName: {
                type: "string",
                required: true
            },
            authorLastName: {
                type: "string",
                required: true
            },
            isbn: {
                type: "string",
                required: true,
            },
            loanStartDate: {
                type: "string"
            },
            loanEndDate: {
                type: "string",
            },
            memberId: {
                type: "string"
            },
        },
        indexes: {
            copies: {
                collection: ['detail'],
                pk: {
                    field: "pk",
                    composite: ["isbn"]
                },
                sk: {
                    field: "sk",
                    composite: ["bookId"]
                }
            },
            loans: {
                collection: ['account'],
                index: "gsi1pk-gsi1sk-index",
                pk: {
                    field: "gsi1pk",
                    composite: ["memberId"]
                },
                sk: {
                    field: "gsi1sk",
                    composite: ["loanEndDate"]
                }
            },
            author: {
                collection: ['works'],
                index: "gsi2pk-gsi2sk-index",
                pk: {
                    field: "gsi2pk",
                    composite: ["authorLastName", "authorFirstName"]
                },
                sk: {
                    field: "gsi2sk",
                    composite: ["loanEndDate"]
                }
            },
            releases: {
                collection: ['titles'],
                index: "gsi3pk-gsi3sk-index",
                pk: {
                    field: "gsi3pk",
                    composite: ["bookTitle"]
                },
                sk: {
                    field: "gsi3sk",
                    composite: ["releaseDate"]
                }
            },
        }
    },
    { table }
);

// The "genre" entity is an instance of a genre, subgenre,
// and book (via isbn). We can freely associate these with
// books, adding and removing as needed.
// Note: we have denormalized the bookTitle onto this record
// to give context to queries without requiring a lookup to
const genre = new Entity(
    {
        model: {
            entity: "genre",
            version: "1",
            service: "library"
        },
        attributes: {
            genre: {
                type: "string",
                required: true
            },
            isbn: {
                type: "string"
            },
            bookTitle: {
                type: "string"
            },
            authorFirstName: {
                type: "string",
                required: true
            },
            authorLastName: {
                type: "string",
                required: true
            },
            subgenre: {
                type: "string"
            }
        },
        indexes: {
            book: {
                collection: ['detail'],
                pk: {
                    field: "pk",
                    composite: ["isbn"]
                },
                sk: {
                    field: "sk",
                    composite: ["genre", "subgenre"]
                }
            },
            categories: {
                index: "gsi1pk-gsi1sk-index",
                pk: {
                    field: "gsi1pk",
                    composite: ["genre"]
                },
                sk: {
                    field: "gsi1sk",
                    composite: ["subgenre"]
                }
            },
            author: {
                collection: ['works'],
                index: "gsi2pk-gsi2sk-index",
                pk: {
                    field: "gsi2pk",
                    composite: ["authorLastName", "authorFirstName"]
                },
                sk: {
                    field: "gsi2sk",
                    composite: ["genre"]
                }
            },
            title: {
                collection: ['titles'],
                index: "gsi3pk-gsi3sk-index",
                pk: {
                    field: "gsi3pk",
                    composite: ["bookTitle"]
                },
                sk: {
                    field: "gsi13sk",
                    composite: ["genre", "subgenre"]
                }
            },

        }
    },
    { table }
);

// The "member" entity represents a single individual
// library card holding member.
const member = new Entity(
    {
        model: {
            entity: "member",
            version: "1",
            service: "library"
        },
        attributes: {
            memberId: {
                type: "string",
            },
            membershipStartDate: {
                type: "string"
            },
            membershipEndDate: {
                type: "string"
            },
            address: {
                type: "map",
                properties: {
                    streetAddress: {
                        type: "string"
                    },
                    city: {
                        type: "string"
                    },
                    state: {
                        type: "string"
                    },
                    zip: {
                        type: "string"
                    }
                }
            }
        },
        indexes: {
            member: {
                pk: {
                    field: "pk",
                    composite: ["memberId"]
                },
                sk: {
                    field: "sk",
                    composite: []
                }
            },
            _: {
                // this is a duplicate access pattern for the entity
                // but exists to open the door to additional access
                // patterns on the gsi. The 'account' lets you get
                // loans and member information by memberId, but in
                // the future could have other associations by memberId
                // such as "notes", "fees", etc.
                collection: ['account'],
                index: "gsi1pk-gsi1sk-index",
                pk: {
                    field: "gsi1pk",
                    composite: ["memberId"]
                },
                sk: {
                    field: "gsi1sk",
                    composite: []
                }
            }
        }
    },
    { table }
);

const library = new Service({
    author,
    book,
    genre,
    member,
});

const BOOK_IS_AVAILABLE = 'AVAILABLE';

// get all copies of books by the authors last name
author.query
    .writer({authorLastName: 'king'})
    .go();

// this same query can be used to get unique books
// (instead of individual copies) because this
// entity is denormalized
author.query
    .writer({authorLastName: 'king'})
    .go()

// get all books by last name and a
// partial first name.
author.query
    .writer({authorLastName: 'king'})
    .begins({authorFirstName: 's'})
    .go();

// get all books by the full name of the writer
author.query
    .writer({authorLastName: 'king', authorFirstName: 'stephen'})
    .go();

// get author details, books (or available copies), and genres by
// author full name. You can then create your own structure using
// all the returned records
library.collections
    .works({authorLastName: 'king', authorFirstName: 'stephen'})
    .go()
    .then(works => {
        const [writer] = works.data.author;
        const books = works.data.book;
        const genres = works.data.genre;
        return {
            writer,
            books,
            genres,
        };
    })

// get all copies of a book by isbn
book.query.copies({isbn: '9783453435773'}).go();

// get all of the books on loan to a specific member
book.query.loans({memberId: '0000001'}).go();

// get all overdue books by memberId
const today = '2022-07-30';
book.query
    .loans({memberId: '0000001'})
    .gt({loanEndDate: today})
    .go();

// get number of books checked out by user
book.query
    .loans({memberId: '0000001'})
    .go()
    .then(loans => loans.data.length)

// get member information and their checked out books
// in a single dynamodb query
library.collections
    .account({memberId: '0000001'})
    .go()
    .then(result => {
        const [member] = result.data.member;
        const books = result.data.book;
        return {
            member,
            books,
        };
    })

// Get all books/copies by an author's full name. This is a duplicate
// access pattern for this entity but it allows for additional access
// patterns, including a cross-entity collection
book.query.author({authorLastName: 'king', authorFirstName: 'stephen'}).go();

// get all copies available to be checked out. Our loanEndDate property
// either holds the date the book is due or the text 'AVAILABLE'
book.query.author({
    authorLastName: 'king',
    authorFirstName: 'stephen',
    loanEndDate: BOOK_IS_AVAILABLE
}).go();

// get all copies NOT available to be checked out. If a copy is checked
// out the loanEndDate value will be a date value. Date values have a
// format: YYYY-MM-DD which will sort _before_ 'AVAILABLE', so any copy
// with a loanEndDate < 'AVAILABLE' will be checked out
book.query.author({
    authorLastName: 'king',
    authorFirstName: 'stephen',
}).lt({loanEndDate: BOOK_IS_AVAILABLE}).go();

// Get books/copies by title
book.query.releases({bookTitle: 'it'}).go();

// Get books/copies by title and partial release date. Queries can be
// provided partially like just the year, the year and month, etc.
book.query
    .releases({bookTitle: 'it'})
    .gte({releaseDate: '1990'})
    .go();

book.query
    .releases({bookTitle: 'it'})
    .between(
        {releaseDate: '1990'},
        {releaseDate: '2019'})
    .go();

// get the genres and subgenres associated with a book
genre.query.book({isbn: '9783453435773'}).go();
genre.query.title({bookTitle: 'it'}).go();

// get the sub genres associated with a book and one of its main genres
genre.query.book({isbn: '9783453435773', genre: 'horror'}).go();
genre.query.title({bookTitle: 'it', genre: 'horror'}).go();

// get a book and its genres by isbn or book title
library.collections.detail({isbn: '9783453435773'}).go();
library.collections.titles({bookTitle: 'it'}).go();

// get books within a genre
genre.query.categories({genre: 'horror'}).go();

// get books within a genre and subgrene
genre.query.categories({genre: 'horror', subgenre: 'killer clowns'}).go();

// get genres by a given author full name
genre.query
    .author({authorFirstName: 'stephen', authorLastName: 'king'})
    .go()
    .then(results => {
        const uniqueGenres = new Set<string>();
        for (const {genre} of results.data) {
            uniqueGenres.add(genre);
        }
        return Array.from(uniqueGenres);
    });

// get subgenres within a given author and genre
genre.query.author({
    authorFirstName: 'stephen',
    authorLastName: 'king',
    genre: 'horror',
}).go()

// get member information by memberId
member.query.member({memberId: '0000001'}).go();
