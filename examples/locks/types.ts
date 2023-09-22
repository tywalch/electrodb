export type LockStatusAvailable = {
  available: true;
  expiresAt: number;
};

export type LockStatusUnavailable = {
  available: false;
};

export type LockStatus = LockStatusAvailable | LockStatusUnavailable;

export interface Key {
  release: () => Promise<boolean>;
  remaining: () => number;
}

export interface Lock {
  aquire: (id: string, ttl?: number) => Promise<Key | null>;
  check: (id: string) => Promise<LockStatus>;
}
