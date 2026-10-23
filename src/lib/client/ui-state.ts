import { atom } from 'nanostores';

/** Mobile navigation drawer. */
export const $drawerOpen = atom(false);

export const $settingsOpen = atom(false);

/** Number of comments on the open post; `null` until loaded or when comments are unavailable. */
export const $commentCount = atom<number | null>(null);
