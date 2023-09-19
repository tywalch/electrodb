/* istanbul ignore file */
import { v4 as uuid } from "uuid";
import { faker } from "@faker-js/faker";
import { CreateEntityItem, Entity, EntityItem } from "../../../";
import { table, client } from "../../common";

// The "member" entity represents a single individual
// library card holding member.
export const Member = new Entity(
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
  { table, client },
);

export type CreateMemberItem = CreateEntityItem<typeof Member>;

export type MemberItem = EntityItem<typeof Member>;

export function createMockMember(
  overrides?: Partial<CreateMemberItem>,
): CreateMemberItem {
  return {
    memberId: uuid(),
    address: {
      streetAddress: faker.location.streetAddress(),
      city: faker.location.city(),
      zip: faker.location.zipCode(),
      state: faker.location.state(),
    },
    membershipStartDate: faker.date.past().toDateString(),
    membershipEndDate: faker.date.future().toDateString(),
    ...overrides,
  };
}
