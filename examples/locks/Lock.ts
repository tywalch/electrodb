import { DocumentClient } from "../..";
import { LockItem, LockManager, createLockManager } from "./LockManager";
import { Key, Lock, LockStatus } from "./types";

type GetTimeToExpirationOptions = {
  expiresAt: number;
};

function getTimeToExpiration(options: GetTimeToExpirationOptions) {
  const { expiresAt } = options;

  // clamp to zero for simplicity
  return Math.max(expiresAt - Date.now(), 0);
}

export type GetKeyOptions = {
  lockManager: LockManager;
  aquiredLock: LockItem;
};

// LockManager depenedency injection makes it much easier to test this function
export function getKey(options: GetKeyOptions): Key {
  const { lockManager, aquiredLock } = options;
  const { keyId, expiresAt, targetId } = aquiredLock;

  // We encapsulate a little bit of state here to save us uncessary calls to the database.
  let released = false;
  return {
    release: async () => {
      if (!released || getTimeToExpiration({ expiresAt }) === 0) {
        released = await lockManager.removeLockItem({ keyId, targetId });
      }
      return released;
    },
    remaining: () => {
      if (released) {
        return 0;
      }
      return getTimeToExpiration({ expiresAt });
    },
  };
}

export type GetLockOptions = {
  defaultTtl: number;
  lockManager: LockManager;
};

// LockManager depenedency injection makes it much easier to test this function
export function getLock(options: GetLockOptions): Lock {
  const { lockManager, defaultTtl } = options;

  return {
    aquire: async (id: string, ttl: number = defaultTtl) => {
      const aquiredLock = await lockManager.createLockItem({
        targetId: id,
        ttl,
      });
      if (!aquiredLock) {
        return null;
      }
      return getKey({ lockManager, aquiredLock });
    },
    check: async (id: string): Promise<LockStatus> => {
      const item = await lockManager.getLockItem({ targetId: id });
      const available =
        !!item && getTimeToExpiration({ expiresAt: item.expiresAt }) > 0;

      if (!available) {
        return {
          available: false,
        };
      }

      return {
        available: true,
        expiresAt: item.expiresAt,
      };
    },
  };
}

export type CreateLockOptions = {
  defaultTtl: number;
  table: string;
  client: DocumentClient;
};

// Another shallow function for glueing together the dependencies
export function createLock(options: CreateLockOptions) {
  const { defaultTtl, table, client } = options;
  const lockManager = createLockManager({ client, table });

  return getLock({ lockManager, defaultTtl });
}
