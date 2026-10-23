// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as LibraryState from '@/lib/client/library-state';
import { STORAGE_KEYS } from '@/lib/client/storage-keys';

type State = typeof LibraryState;

/** The stores read storage when their module loads, so each test gets a fresh module. */
async function loadState(stored: Record<string, string> = {}): Promise<State> {
  localStorage.clear();
  for (const [key, value] of Object.entries(stored)) localStorage.setItem(key, value);
  vi.resetModules();
  return import('@/lib/client/library-state');
}

beforeEach(() => {
  localStorage.clear();
});

describe('bookmarks', () => {
  it('toggles a bookmark on and off, newest first', async () => {
    const state = await loadState();
    state.toggleBookmark('a');
    state.toggleBookmark('b');
    expect(state.$bookmarks.get()).toEqual(['b', 'a']);

    state.toggleBookmark('b');
    expect(state.$bookmarks.get()).toEqual(['a']);
  });

  it('persists to localStorage and restores on load', async () => {
    const state = await loadState();
    state.toggleBookmark('a');
    expect(localStorage.getItem(STORAGE_KEYS.bookmarks)).toBe('["a"]');

    const reloaded = await loadState({ [STORAGE_KEYS.bookmarks]: '["x","y"]' });
    expect(reloaded.$bookmarks.get()).toEqual(['x', 'y']);
  });
});

describe('recent', () => {
  it('keeps posts unique, most recent first', async () => {
    const state = await loadState();
    state.pushRecent('a');
    state.pushRecent('b');
    state.pushRecent('a');
    expect(state.$recent.get()).toEqual(['a', 'b']);
  });

  it('is capped at three', async () => {
    const state = await loadState();
    for (const id of ['a', 'b', 'c', 'd']) state.pushRecent(id);
    expect(state.$recent.get()).toEqual(['d', 'c', 'b']);
  });
});

describe('progress', () => {
  it('keeps the maximum reached', async () => {
    const state = await loadState();
    state.recordProgress('a', 40);
    state.recordProgress('a', 20);
    expect(state.$progress.get()).toEqual({ a: 40 });

    state.recordProgress('a', 72.4);
    expect(state.$progress.get()).toEqual({ a: 72 });
  });

  it('clamps to 0-100 and ignores zero', async () => {
    const state = await loadState();
    state.recordProgress('a', 140);
    state.recordProgress('b', 0);
    state.recordProgress('c', -5);
    expect(state.$progress.get()).toEqual({ a: 100 });
  });
});

describe('sidebar', () => {
  it('toggles and adds folders without duplicating', async () => {
    const state = await loadState();
    state.expandFolders(['a', 'a/b']);
    state.expandFolders(['a/b', 'c']);
    expect(state.$sidebar.get().expanded).toEqual(['a', 'a/b', 'c']);

    state.toggleFolder('a/b');
    expect(state.$sidebar.get().expanded).toEqual(['a', 'c']);
    state.toggleFolder('a/b');
    expect(state.$sidebar.get().expanded).toEqual(['a', 'c', 'a/b']);
  });

  it('collapses everything and remembers the rail', async () => {
    const state = await loadState();
    state.expandFolders(['a']);
    state.setSidebarRail(true);
    state.collapseAllFolders();
    expect(state.$sidebar.get()).toEqual({ expanded: [], rail: true });
  });
});

describe('corrupt storage', () => {
  it('falls back to defaults for invalid JSON or shapes', async () => {
    const state = await loadState({
      [STORAGE_KEYS.bookmarks]: '{not json',
      [STORAGE_KEYS.recent]: '[1,2]',
      [STORAGE_KEYS.progress]: '"text"',
      [STORAGE_KEYS.sidebar]: '{"expanded":"x","rail":"yes"}',
    });
    expect(state.$bookmarks.get()).toEqual([]);
    expect(state.$recent.get()).toEqual([]);
    expect(state.$progress.get()).toEqual({});
    expect(state.$sidebar.get()).toEqual({ expanded: [], rail: false });
  });

  it('keeps working when localStorage throws', async () => {
    const state = await loadState();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    state.toggleBookmark('a');
    expect(state.$bookmarks.get()).toEqual(['a']);
    vi.restoreAllMocks();
  });
});
