/* istanbul ignore file */
import { Author } from './author';
import { Book } from './book';
import { Genre } from './genre';
import { Member } from './member';
import { Service } from "../../..";
import { table, client } from '../../common';

export { createMockAuthor, AuthorItem } from './author';
export { createMockGenre, GenreItem } from './genre';
export { createMockMember, MemberItem } from './member';
export { createMockBook, BOOK_IS_AVAILABLE, BookItem } from './book';

export const library = new Service({
    author: Author,
    book: Book,
    genre: Genre,
    member: Member,
}, { table, client });

export {
    Author,
    Book,
    Genre,
    Member,
}