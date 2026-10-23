import { persistentJsonAtom } from './persistent';
import { STORAGE_KEYS } from './storage-keys';

export const MAX_RECENT = 3;
/** A post counts as read once this share of it has scrolled past. */
export const READ_THRESHOLD = 95;

export interface SidebarState {
  /** Ids of the folders that are open in the tree. */
  expanded: string[];
  /** Desktop only: the sidebar is collapsed to its icon rail. */
  rail: boolean;
}

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

const parseStringArray = (raw: unknown, fallback: string[]): string[] =>
  isStringArray(raw) ? raw : fallback;

function parseProgress(raw: unknown, fallback: Record<string, number>): Record<string, number> {
  if (typeof raw !== 'object' || raw === null) return fallback;
  const entries = Object.entries(raw).filter(
    (entry): entry is [string, number] => typeof entry[1] === 'number' && Number.isFinite(entry[1]),
  );
  return Object.fromEntries(entries);
}

function parseSidebar(raw: unknown, fallback: SidebarState): SidebarState {
  if (typeof raw !== 'object' || raw === null) return fallback;
  const { expanded, rail } = raw as Record<string, unknown>;
  return {
    expanded: isStringArray(expanded) ? expanded : fallback.expanded,
    rail: typeof rail === 'boolean' ? rail : fallback.rail,
  };
}

export const $bookmarks = persistentJsonAtom<string[]>(
  STORAGE_KEYS.bookmarks,
  [],
  parseStringArray,
);

export const $recent = persistentJsonAtom<string[]>(STORAGE_KEYS.recent, [], (raw, fallback) =>
  parseStringArray(raw, fallback).slice(0, MAX_RECENT),
);

/** Highest scroll progress (0-100) reached per post id. */
export const $progress = persistentJsonAtom<Record<string, number>>(
  STORAGE_KEYS.progress,
  {},
  parseProgress,
);

export const $sidebar = persistentJsonAtom<SidebarState>(
  STORAGE_KEYS.sidebar,
  { expanded: [], rail: false },
  parseSidebar,
);

export function toggleBookmark(postId: string): void {
  const bookmarks = $bookmarks.get();
  $bookmarks.set(
    bookmarks.includes(postId) ? bookmarks.filter((id) => id !== postId) : [postId, ...bookmarks],
  );
}

/** Most recently opened first, unique, capped at {@link MAX_RECENT}. */
export function pushRecent(postId: string): void {
  $recent.set([postId, ...$recent.get().filter((id) => id !== postId)].slice(0, MAX_RECENT));
}

/** Records scroll progress, keeping only the highest value reached. */
export function recordProgress(postId: string, percent: number): void {
  const rounded = Math.min(100, Math.max(0, Math.round(percent)));
  const progress = $progress.get();
  if (rounded <= (progress[postId] ?? 0)) return;
  $progress.set({ ...progress, [postId]: rounded });
}

export function toggleFolder(folderId: string): void {
  const { expanded, ...rest } = $sidebar.get();
  $sidebar.set({
    ...rest,
    expanded: expanded.includes(folderId)
      ? expanded.filter((id) => id !== folderId)
      : [...expanded, folderId],
  });
}

export function expandFolders(folderIds: readonly string[]): void {
  const state = $sidebar.get();
  const missing = folderIds.filter((id) => !state.expanded.includes(id));
  if (missing.length > 0) $sidebar.set({ ...state, expanded: [...state.expanded, ...missing] });
}

export function collapseAllFolders(): void {
  $sidebar.set({ ...$sidebar.get(), expanded: [] });
}

export function setSidebarRail(rail: boolean): void {
  $sidebar.set({ ...$sidebar.get(), rail });
}
