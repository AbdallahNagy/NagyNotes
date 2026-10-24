import {
  persistentAtom,
  setPersistentEngine,
  windowPersistentEvents,
  type PersistentStore,
} from '@nanostores/persistent';
import type { WritableAtom } from 'nanostores';

/**
 * localStorage can be missing or throw (private windows, blocked site data, full quota). Every
 * access goes through this proxy so a failure degrades to "not persisted" instead of an exception.
 */
function createSafeLocalStorage(): PersistentStore {
  const attempt = <T>(action: () => T, fallback: T): T => {
    try {
      return action();
    } catch {
      return fallback;
    }
  };
  return new Proxy<PersistentStore>(
    {},
    {
      get: (_target, key) =>
        typeof key === 'string'
          ? attempt(() => localStorage.getItem(key) ?? undefined, undefined)
          : undefined,
      has: (_target, key) =>
        typeof key === 'string' && attempt(() => localStorage.getItem(key) !== null, false),
      set: (_target, key, value: string) => {
        if (typeof key === 'string') attempt(() => localStorage.setItem(key, value), undefined);
        return true;
      },
      deleteProperty: (_target, key) => {
        if (typeof key === 'string') attempt(() => localStorage.removeItem(key), undefined);
        return true;
      },
    },
  );
}

// Server rendering has no storage: stores stay in memory and hold their initial value.
if (typeof window !== 'undefined') {
  setPersistentEngine(createSafeLocalStorage(), windowPersistentEvents);
}

/**
 * A persisted atom stored as JSON. Anything unreadable or failing `parse` falls back to `initial`,
 * so corrupt or outdated storage can never break the page.
 */
export function persistentJsonAtom<T>(
  key: string,
  initial: T,
  parse: (raw: unknown, fallback: T) => T,
): WritableAtom<T> {
  return persistentAtom<T>(key, initial, {
    encode: (value) => JSON.stringify(value),
    decode: (stored) => {
      try {
        return parse(JSON.parse(stored) as unknown, initial);
      } catch {
        return initial;
      }
    },
  });
}
