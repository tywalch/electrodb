/* istanbul ignore file */
import { v4 as uuid } from 'uuid';
import { faker } from '@faker-js/faker';
import { CreateEntityItem, Entity, EntityItem } from '../../../';
import { table, client } from '../../common';

// The "genre" entity is an instance of a genre, subgenre,
// and book (via isbn). We can freely associate these with
// books, adding and removing as needed.
// Note: we have denormalized the bookTitle onto this record
// to give context to queries without requiring a lookup to
export const Genre = new Entity(
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
                type: 'string',
                required: true,
            },
            bookId: {
                type: 'string',
                required: true,
            },
            bookTitle: {
                type: 'string',
                required: true,
            },
            authorFirstName: {
                type: 'string',
                required: true
            },
            authorLastName: {
                type: 'string',
                required: true
            },
            subgenre: {
                type: 'string'
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
                    composite: ["genre", "subgenre"]
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
    }, { table, client });

export type CreateGenreItem = CreateEntityItem<typeof Genre>;

export type GenreItem = EntityItem<typeof Genre>;

export function createMockGenre(overrides?: Partial<CreateGenreItem>): CreateGenreItem {
    return {
        bookId: uuid(),
        isbn: uuid(),
        genre: faker.helpers.arrayElement(['horror', 'adventure', 'romance', 'non-fiction', 'young adult', 'sports', 'mystery', 'thriller', 'travel', 'biography', 'technical']),
        bookTitle: faker.music.songName(),
        subgenre: faker.music.genre(),
        authorLastName: faker.person.lastName(),
        authorFirstName: faker.person.firstName(),
        ...overrides
    };
}