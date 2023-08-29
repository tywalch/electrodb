/* istanbul ignore file */
import { v4 as uuid } from 'uuid';
import { faker } from '@faker-js/faker';
import { Entity, CreateEntityItem, EntityItem } from '../../../';
import { table, client } from '../../common';

// the "book" entity holds represents a physical book at the library
// because book details (like the author or release date) do not
// change over time, we can use denormalization to remove the need
// for a single book entity. This allows us to treat this entity as
// both an authority on book information and an individual book.
export const Book = new Entity(
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
            }
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
            editions: {
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
    }, { table, client });


export type CreateBookItem = CreateEntityItem<typeof Book>;

export type BookItem = EntityItem<typeof Book>;
export const BOOK_IS_AVAILABLE = 'AVAILABLE';

export function createMockBook(overrides?: Partial<CreateBookItem>): CreateBookItem {
    return {
        bookId: uuid(),
        bookTitle: faker.music.songName(),
        isbn: uuid(), // really? no isbn in fakerjs?
        description: faker.lorem.paragraph(),
        loanEndDate: faker.date.soon().toDateString(),
        loanStartDate: faker.date.recent().toDateString(),
        memberId: uuid(),
        publisher: faker.company.name(),
        releaseDate: faker.date.past().toDateString(),
        authorLastName: faker.person.lastName(),
        authorFirstName: faker.person.firstName(),
        ...overrides
    };
}