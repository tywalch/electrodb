/* istanbul ignore file */
import moment from "moment";
import { faker } from '@faker-js/faker';
import { Entity, CreateEntityItem, EntityItem } from '../../../';
import {TicketTypes, IsNotTicket} from "./types";
import { table, client } from '../../common';

const RepositorySubscription = "#";

export const Subscription = new Entity({
    model: {
        entity: "subscription",
        service: "version-control",
        version: "1"
    },
    attributes: {
        repoName: {
            type: "string",
            required: true,
        },
        repoOwner: {
            type: "string",
            required: true,
        },
        username: {
            type: "string",
            required: true,
        },
        ticketNumber: {
            type: "string",
            default: () => IsNotTicket,
            set: (ticketNumber) => {
                if (ticketNumber === IsNotTicket) {
                    return RepositorySubscription;
                } else {
                    return ticketNumber;
                }
            },
            get: (ticketNumber) => {
                if (ticketNumber === RepositorySubscription) {
                    return IsNotTicket;
                } else {
                    return ticketNumber;
                }
            }
        },
        ticketType: {
            type: TicketTypes,
            default: () => IsNotTicket,
            set: (ticketType) => {
                if (ticketType === IsNotTicket) {
                    return RepositorySubscription;
                } else {
                    return ticketType;
                }
            },
            get: (ticketType) => {
                if (ticketType === RepositorySubscription) {
                    return IsNotTicket;
                } else {
                    return ticketType;
                }
            }
        },
        createdAt: {
            type: "string",
            set: () => moment.utc().format(),
            default: () => moment.utc().format(),
            readOnly: true,
        },
        updatedAt: {
            type: "string",
            watch: "*",
            set: () => moment.utc().format(),
            readOnly: true,
        },
    },
    indexes: {
        repository: {
            pk: {
                composite: ["repoOwner", "repoName"],
                field: "pk"
            },
            sk: {
                composite: ["username", "ticketType", "ticketNumber"],
                field: "sk"
            }
        },
        user: {
            collection: "watching",
            index: "gsi3pk-gsi3sk-index",
            pk: {
                composite: ["username"],
                field: "gsi3pk"
            },
            sk: {
                composite: ["ticketType", "ticketNumber"],
                field: "gsi3sk"
            }
        },
        tickets: {
            collection: "subscribers",
            index: "gsi4pk-gsi4sk-index",
            pk: {
                composite: ["repoOwner", "repoName", "ticketNumber"],
                field: "gsi4pk"
            },
            sk: {
                composite: ["ticketType", "username"],
                field: "gsi4sk"
            }
        }
    }
}, { table, client });

export type CreateSubscriptionItem = CreateEntityItem<typeof Subscription>;

export type SubscriptionItem = EntityItem<typeof Subscription>;

export function createMockSubscription(overrides?: Partial<CreateSubscriptionItem>): CreateSubscriptionItem {
    return {
        repoName: `${faker.hacker.verb()}${faker.hacker.noun()}`,
        repoOwner: faker.internet.userName(),
        ticketType: faker.helpers.arrayElement(['Issue', 'PullRequest']),
        username: faker.internet.userName(),
        ticketNumber: faker.number.int({min: 1, max: 9000}).toString().padStart(4, '0'),
        ...overrides
    };
}