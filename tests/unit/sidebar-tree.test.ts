import { describe, expect, it } from 'vitest';
import { findNodePath, foldersToReveal, normalizePath } from '@/lib/content/sidebar-tree';
import type { SidebarNode } from '@/lib/content/types';

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
