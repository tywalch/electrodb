import {Entity} from "../../../";
import moment from "moment";
import {TicketTypes, IsNotTicket} from "./types";

const RepositorySubscription = "#";

export const subscriptions = new Entity({
    model: {
        entity: "subscription",
        service: "versioncontrol",
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
            default: () => moment.utc().format(),
        }
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
})