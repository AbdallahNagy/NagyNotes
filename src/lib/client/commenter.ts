import { persistentJsonAtom } from './persistent';
import { STORAGE_KEYS } from './storage-keys';

/** The name a reader last commented with, so they do not retype it. */
export const $commenterName = persistentJsonAtom<string>(
  STORAGE_KEYS.commenterName,
  '',
  (raw, fallback) => (typeof raw === 'string' ? raw : fallback),
);
