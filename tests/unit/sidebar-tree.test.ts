import { describe, expect, it } from 'vitest';
import {
  findNodePath,
  flatPostsNewestFirst,
  folderIdsAtDepth,
  foldersToReveal,
  nextExpandDepth,
  normalizePath,
} from '@/lib/content/sidebar-tree';
import type { PostIndexEntry, SidebarNode } from '@/lib/content/types';

const tree: SidebarNode[] = [
  {
    kind: 'folder',
    id: 'apis',
    url: '/apis',
    name: 'APIs',
    count: 1,
    children: [
      {
        kind: 'folder',
        id: 'apis/auth',
        url: '/apis/auth',
        name: 'Auth',
        count: 1,
        children: [{ kind: 'post', id: 'apis/auth/keys', url: '/apis/auth/keys', title: 'Keys' }],
      },
    ],
  },
];

describe('normalizePath', () => {
  it('drops trailing slashes but keeps the root', () => {
    expect(normalizePath('/apis/')).toBe('/apis');
    expect(normalizePath('/')).toBe('/');
  });
});

describe('findNodePath', () => {
  it('returns the chain down to the node', () => {
    expect(findNodePath(tree, '/apis/auth/keys').map((n) => n.id)).toEqual([
      'apis',
      'apis/auth',
      'apis/auth/keys',
    ]);
  });

  it('returns an empty chain for unknown urls', () => {
    expect(findNodePath(tree, '/nope')).toEqual([]);
  });
});

describe('foldersToReveal', () => {
  it('opens the ancestors of a post', () => {
    expect(foldersToReveal(tree, '/apis/auth/keys')).toEqual(['apis', 'apis/auth']);
  });

  it('opens a folder together with its ancestors', () => {
    expect(foldersToReveal(tree, '/apis/auth/')).toEqual(['apis', 'apis/auth']);
  });

  it('opens nothing for home or unknown pages', () => {
    expect(foldersToReveal(tree, '/')).toEqual([]);
    expect(foldersToReveal(tree, '/missing')).toEqual([]);
  });
});

const folder = (id: string, children: SidebarNode[] = []): SidebarNode => ({
  kind: 'folder',
  id,
  url: `/${id}`,
  name: id,
  count: 0,
  children,
});

const nested: SidebarNode[] = [
  folder('a', [folder('a/x', [folder('a/x/deep')]), folder('a/y')]),
  folder('b'),
  { kind: 'post', id: 'loose', url: '/loose', title: 'Loose' },
];

describe('folderIdsAtDepth', () => {
  it('lists the folders at each depth and skips posts', () => {
    expect(folderIdsAtDepth(nested, 0)).toEqual(['a', 'b']);
    expect(folderIdsAtDepth(nested, 1)).toEqual(['a/x', 'a/y']);
    expect(folderIdsAtDepth(nested, 2)).toEqual(['a/x/deep']);
    expect(folderIdsAtDepth(nested, 3)).toEqual([]);
  });
});

describe('nextExpandDepth', () => {
  it('starts at the top level', () => {
    expect(nextExpandDepth(nested, new Set())).toBe(0);
  });

  it('moves down once a level is fully open', () => {
    expect(nextExpandDepth(nested, new Set(['a', 'b']))).toBe(1);
    expect(nextExpandDepth(nested, new Set(['a', 'b', 'a/x', 'a/y']))).toBe(2);
  });

  it('stays on the shallowest level that still has a closed folder', () => {
    expect(nextExpandDepth(nested, new Set(['a', 'a/x', 'a/x/deep']))).toBe(0);
  });

  it('is null when everything is open or there are no folders', () => {
    expect(nextExpandDepth(nested, new Set(['a', 'b', 'a/x', 'a/y', 'a/x/deep']))).toBeNull();
    expect(nextExpandDepth([], new Set())).toBeNull();
  });
});

describe('flatPostsNewestFirst', () => {
  const entry = (id: string, date: string, title = id): PostIndexEntry => ({
    id,
    url: `/${id}`,
    title,
    summary: '',
    date,
    readTime: 1,
    folderId: null,
    folderPath: [],
  });

  it('sorts by date descending, then title, without mutating the input', () => {
    const index = [
      entry('old', '2025-01-01T00:00:00.000Z'),
      entry('b', '2026-03-01T00:00:00.000Z', 'Beta'),
      entry('a', '2026-03-01T00:00:00.000Z', 'Alpha'),
    ];
    expect(flatPostsNewestFirst(index).map((post) => post.id)).toEqual(['a', 'b', 'old']);
    expect(index.map((post) => post.id)).toEqual(['old', 'b', 'a']);
  });
});
