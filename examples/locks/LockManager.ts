import { v4 as uuid } from "uuid";
import { Entity, DocumentClient } from "../..";

export type CreateLockEntityOptions = {
  table: string;
  client: DocumentClient;
};

export function createLockEntity(options: CreateLockEntityOptions) {
  const { table, client } = options;

  return new Entity(
    {
      model: {
        entity: "lock",
        version: "1",
        service: "app",
      },
      attributes: {
        targetId: {
          type: "string",
        },
        keyId: {
          type: "string",
          required: true,
        },
        expiresAt: {
          type: "number",
          required: true,
        },
      },
      indexes: {
        lock: {
          pk: {
            field: "pk",
            composite: ["targetId"],
          },
          sk: {
            field: "sk",
            composite: [],
          },
        },
      },
    },
    { table, client },
  );
}

type CreateLockEntityResponse = ReturnType<typeof createLockEntity>;

// Personal preference, I like to size down large types whenever possible. This allows me to be explicit about what I need from the Entity and limit my exposure to [normal] churn cause by typing changes.
export type LockEntity = {
  get: CreateLockEntityResponse["get"];
  delete: CreateLockEntityResponse["delete"];
  upsert: CreateLockEntityResponse["upsert"];
};

export interface ConditionalCheckFailedException {
  code: "ConditionalCheckFailedException";
}

export function isConditionalCheckFailedException(
  err: unknown,
): err is ConditionalCheckFailedException {
  return (
    !!err &&
    typeof err === "object" &&
    "code" in err &&
    err["code"] === "ConditionalCheckFailedException"
  );
}

export type RemoveLockItemOptions = {
  keyId: string;
  targetId: string;
};

export type CreateLockItemOptions = {
  targetId: string;
  ttl: number;
};

export type GetLockItemOptions = {
  targetId: string;
};

export type LockItem = {
  keyId: string;
  targetId: string;
  expiresAt: number;
};

// Don't pass around electro, it is a large class with very complex typing. Instead, encapsulate it's usage into an interface that can be more easily mocked. This allows us to test the lock manager without having to mock electro.
export interface LockManager {
  removeLockItem: (options: RemoveLockItemOptions) => Promise<boolean>;
  createLockItem: (options: CreateLockItemOptions) => Promise<LockItem | null>;
  getLockItem: (options: GetLockItemOptions) => Promise<LockItem | null>;
}

type ElectroLockManagerOptions = {
  lockEntity: LockEntity;
};

// Avoid doing more work in this class than what is neccessary to work with dynamodb/electrodb. Design this indirection as a building block for your business logic. This allows you to test the business logic that uses the LockManager without having to mock electro itself. Keep this abstraction stateless.
export class ElectroLockManager implements LockManager {
  // We use a class here because it allows for concise dependency injection. We do not use it to store state other than a reference to the supplied LockEntity.
  private lockEntity: LockEntity;

  constructor(options: ElectroLockManagerOptions) {
    const { lockEntity } = options;
    this.lockEntity = lockEntity;
  }

  async removeLockItem(options: RemoveLockItemOptions): Promise<boolean> {
    const { keyId, targetId } = options;
    try {
      await this.lockEntity
        .delete({ targetId })
        .where((a, { eq }) => eq(a.keyId, keyId))
        .where((a, { gte }) => gte(a.expiresAt, Date.now()))
        .go({ originalErr: true });

      return true;
    } catch (err: unknown) {
      if (isConditionalCheckFailedException(err)) {
        return false;
      }
      throw err;
    }
  }

  async createLockItem(
    options: CreateLockItemOptions,
  ): Promise<LockItem | null> {
    const { targetId, ttl } = options;

    const keyId = uuid();
    const now = Date.now();
    const expiresAt = ttl + now;

    try {
      await this.lockEntity
        .upsert({ targetId, expiresAt, keyId })
        .where(
          (a, { notExists, lt }) => `
          ${lt(a.expiresAt, now)} OR ${notExists(a.keyId)}
        `,
        )
        .go({ originalErr: true, response: "all_new" });

      return { keyId, expiresAt, targetId };
    } catch (err: unknown) {
      if (isConditionalCheckFailedException(err)) {
        return null;
      }
      throw err;
    }
  }

  async getLockItem(options: GetLockItemOptions): Promise<LockItem | null> {
    const { targetId } = options;
    const { data } = await this.lockEntity.get({ targetId }).go();
    return data;
  }
}

export type CreateLockManagerOptions = {
  table: string;
  client: DocumentClient;
};

// We want to lean into dependency injection, so the ElectroLockManager should accept a LockEntity and the code that supplies it should be shallow to limit the need for testing.
// This function also injects a client and table name, which can allow for easier testing injection and usage in an application.
export function createLockManager(options: CreateLockManagerOptions) {
  const { table, client } = options;
  const lockEntity = createLockEntity({ table, client });

  return new ElectroLockManager({ lockEntity });
}
