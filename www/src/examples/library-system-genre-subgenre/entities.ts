import { Entity } from "electrodb";
import { tableName } from "./table";

export const author = new Entity(
  {
    model: {
      entity: "author",
      version: "1",
      service: "library",
    },
    attributes: {
      authorFirstName: {
        type: "string",
        required: true,
      },
      authorLastName: {
        type: "string",
        required: true,
      },
      birthday: {
        type: "string",
      },
      bio: {
        type: "string",
        required: true,
      },
    },
    indexes: {
      writer: {
        pk: {
          field: "pk",
          composite: ["authorLastName"],
        },
        sk: {
          field: "sk",
          composite: ["authorFirstName", "birthday"],
        },
      },
      info: {
        collection: ["works"],
        index: "gsi2pk-gsi2sk-index",
        pk: {
          field: "gsi2pk",
          composite: ["authorLastName", "authorFirstName"],
        },
        sk: {
          field: "gsi2sk",
          composite: [],
        },
      },
    },
  },
  { table: tableName },
);

export const book = new Entity(
  {
    model: {
      entity: "book",
      version: "1",
      service: "library",
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
        required: true,
      },
      authorLastName: {
        type: "string",
        required: true,
      },
      isbn: {
        type: "string",
        required: true,
      },
      loanStartDate: {
        type: "string",
      },
      loanEndDate: {
        type: "string",
      },
      memberId: {
        type: "string",
      },
    },
    indexes: {
      copies: {
        collection: ["detail"],
        pk: {
          field: "pk",
          composite: ["isbn"],
        },
        sk: {
          field: "sk",
          composite: ["bookId"],
        },
      },
      loans: {
        collection: ["account"],
        index: "gsi1pk-gsi1sk-index",
        pk: {
          field: "gsi1pk",
          composite: ["memberId"],
        },
        sk: {
          field: "gsi1sk",
          composite: ["loanEndDate"],
        },
      },
      author: {
        collection: ["works"],
        index: "gsi2pk-gsi2sk-index",
        pk: {
          field: "gsi2pk",
          composite: ["authorLastName", "authorFirstName"],
        },
        sk: {
          field: "gsi2sk",
          composite: ["loanEndDate"],
        },
      },
      releases: {
        collection: ["titles"],
        index: "gsi3pk-gsi3sk-index",
        pk: {
          field: "gsi3pk",
          composite: ["bookTitle"],
        },
        sk: {
          field: "gsi3sk",
          composite: ["releaseDate"],
        },
      },
    },
  },
  { table: tableName },
);

export const genre = new Entity(
  {
    model: {
      entity: "genre",
      version: "1",
      service: "library",
    },
    attributes: {
      genre: {
        type: "string",
        required: true,
      },
      isbn: {
        type: "string",
      },
      bookTitle: {
        type: "string",
      },
      authorFirstName: {
        type: "string",
        required: true,
      },
      authorLastName: {
        type: "string",
        required: true,
      },
      subgenre: {
        type: "string",
      },
    },
    indexes: {
      book: {
        collection: ["detail"],
        pk: {
          field: "pk",
          composite: ["isbn"],
        },
        sk: {
          field: "sk",
          composite: ["genre", "subgenre"],
        },
      },
      categories: {
        index: "gsi1pk-gsi1sk-index",
        pk: {
          field: "gsi1pk",
          composite: ["genre"],
        },
        sk: {
          field: "gsi1sk",
          composite: ["subgenre"],
        },
      },
      author: {
        collection: ["works"],
        index: "gsi2pk-gsi2sk-index",
        pk: {
          field: "gsi2pk",
          composite: ["authorLastName", "authorFirstName"],
        },
        sk: {
          field: "gsi2sk",
          composite: ["genre"],
        },
      },
      title: {
        collection: ["titles"],
        index: "gsi3pk-gsi3sk-index",
        pk: {
          field: "gsi3pk",
          composite: ["bookTitle"],
        },
        sk: {
          field: "gsi3sk",
          composite: ["genre", "subgenre"],
        },
      },
    },
  },
  { table: tableName },
);

export const member = new Entity(
  {
    model: {
      entity: "member",
      version: "1",
      service: "library",
    },
    attributes: {
      memberId: {
        type: "string",
      },
      membershipStartDate: {
        type: "string",
      },
      membershipEndDate: {
        type: "string",
      },
      address: {
        type: "map",
        properties: {
          streetAddress: {
            type: "string",
          },
          city: {
            type: "string",
          },
          state: {
            type: "string",
          },
          zip: {
            type: "string",
          },
        },
      },
    },
    indexes: {
      member: {
        pk: {
          field: "pk",
          composite: ["memberId"],
        },
        sk: {
          field: "sk",
          composite: [],
        },
      },
      _: {
        // this is a duplicate access pattern for the entity
        // but exists to open the door to additional access
        // patterns on the gsi. The 'account' lets you get
        // loans and member information by memberId, but in
        // the future could have other associations by memberId
        // such as "notes", "fees", etc.
        collection: ["account"],
        index: "gsi1pk-gsi1sk-index",
        pk: {
          field: "gsi1pk",
          composite: ["memberId"],
        },
        sk: {
          field: "gsi1sk",
          composite: [],
        },
      },
    },
  },
  { table: tableName },
);
