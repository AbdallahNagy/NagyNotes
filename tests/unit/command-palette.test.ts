import { describe, expect, it } from 'vitest';
import {
  flattenFolders,
  folderContents,
  isInScope,
  scopeTrail,
  searchFolders,
  splitMatch,
} from '@/lib/content/command-palette';
import { paletteGroups } from '@/lib/content/palette-groups';
import type { PostIndexEntry, SidebarNode } from '@/lib/content/types';

const post = (id: string, title: string, folderPath: string[]): PostIndexEntry => ({
  id,
  url: `/${id}`,
  title,
  summary: '',
  date: '2026-10-01T00:00:00.000Z',
  readTime: 3,
  folderId: id.slice(0, id.lastIndexOf('/')) || null,
  folderPath,
});

const index = [
  post('apis/auth/oauth/pkce', 'PKCE', ['APIs', 'Auth', 'OAuth']),
  post('apis/auth/keys', 'API keys', ['APIs', 'Auth']),
  post('apis/rate', 'Rate limits', ['APIs']),
  post('devops/pipelines', 'Pipelines', ['DevOps']),
];

const tree: SidebarNode[] = [
  {
    kind: 'folder',
    id: 'apis',
    url: '/apis',
    name: 'APIs',
    count: 3,
    children: [
      {
        kind: 'folder',
        id: 'apis/auth',
        url: '/apis/auth',
        name: 'Auth',
        count: 2,
        children: [
          {
            kind: 'folder',
            id: 'apis/auth/oauth',
            url: '/apis/auth/oauth',
            name: 'OAuth',
            count: 1,
            children: [
              {
                kind: 'post',
                id: 'apis/auth/oauth/pkce',
                url: '/apis/auth/oauth/pkce',
                title: 'PKCE',
              },
            ],
          },
          { kind: 'post', id: 'apis/auth/keys', url: '/apis/auth/keys', title: 'API keys' },
        ],
      },
      { kind: 'post', id: 'apis/rate', url: '/apis/rate', title: 'Rate limits' },
    ],
  },
  {
    kind: 'folder',
    id: 'devops',
    url: '/devops',
    name: 'DevOps',
    count: 1,
    children: [
      { kind: 'post', id: 'devops/pipelines', url: '/devops/pipelines', title: 'Pipelines' },
    ],
  },
];

describe('flattenFolders', () => {
  it('lists every folder in tree order with its ancestor names', () => {
    expect(flattenFolders(tree).map((folder) => [folder.id, folder.path])).toEqual([
      ['apis', []],
      ['apis/auth', ['APIs']],
      ['apis/auth/oauth', ['APIs', 'Auth']],
      ['devops', []],
    ]);
  });
});

describe('isInScope', () => {
  it('matches descendants only, never the scope itself or a prefix sibling', () => {
    expect(isInScope('apis/auth', null)).toBe(true);
    expect(isInScope('apis/auth', 'apis')).toBe(true);
    expect(isInScope('apis', 'apis')).toBe(false);
    expect(isInScope('apis-v2/x', 'apis')).toBe(false);
  });
});

describe('folderContents', () => {
  it('returns the top-level folders at the root', () => {
    const contents = folderContents(tree, index, null);
    expect(contents.folders.map((folder) => folder.id)).toEqual(['apis', 'devops']);
    expect(contents.posts).toEqual([]);
  });

  it('returns direct subfolders and posts of a folder, labelled with its path', () => {
    const contents = folderContents(tree, index, 'apis/auth');
    expect(contents.folders.map((folder) => [folder.id, folder.path])).toEqual([
      ['apis/auth/oauth', ['APIs', 'Auth']],
    ]);
    expect(contents.posts.map((entry) => entry.id)).toEqual(['apis/auth/keys']);
  });

  it('is empty for an unknown folder', () => {
    expect(folderContents(tree, index, 'nope')).toEqual({ folders: [], posts: [] });
  });
});

describe('searchFolders', () => {
  it('matches folder names case-insensitively anywhere in the tree', () => {
    expect(searchFolders(tree, 'AUTH', null).map((folder) => folder.id)).toEqual([
      'apis/auth',
      'apis/auth/oauth',
    ]);
  });

  it('only searches below the scope', () => {
    expect(searchFolders(tree, 'o', 'apis/auth').map((folder) => folder.id)).toEqual([
      'apis/auth/oauth',
    ]);
    expect(searchFolders(tree, 'devops', 'apis')).toEqual([]);
  });

  it('returns nothing for a blank query', () => {
    expect(searchFolders(tree, '  ', null)).toEqual([]);
  });
});

describe('scopeTrail', () => {
  it('lists the folders from the top down to the scope', () => {
    expect(scopeTrail(tree, 'apis/auth/oauth').map((folder) => folder.name)).toEqual([
      'APIs',
      'Auth',
      'OAuth',
    ]);
    expect(scopeTrail(tree, null)).toEqual([]);
  });
});

describe('splitMatch', () => {
  it('marks the first case-insensitive match', () => {
    expect(splitMatch('OAuth 2.0', 'auth')).toEqual([
      { text: 'O', match: false },
      { text: 'Auth', match: true },
      { text: ' 2.0', match: false },
    ]);
  });

  it('returns the whole text unmarked when there is no match', () => {
    expect(splitMatch('Pipelines', 'xyz')).toEqual([{ text: 'Pipelines', match: false }]);
    expect(splitMatch('Pipelines', '')).toEqual([{ text: 'Pipelines', match: false }]);
  });
});

describe('paletteGroups', () => {
  const library = { tree, index };
  const labels = (groups: ReturnType<typeof paletteGroups>) =>
    groups.map((group) => [group.label, group.items.map((item) => item.key)]);

  it('browses the top level with recent posts first', () => {
    const groups = paletteGroups({
      library,
      scopeId: null,
      query: '',
      postMatches: null,
      recentIds: ['devops/pipelines', 'missing'],
    });
    expect(labels(groups)).toEqual([
      ['Recent', ['post:devops/pipelines']],
      ['Folders', ['folder:apis', 'folder:devops']],
    ]);
  });

  it('inside a folder offers its page, then its subfolders and posts', () => {
    const groups = paletteGroups({
      library,
      scopeId: 'apis/auth',
      query: '',
      postMatches: null,
      recentIds: [],
    });
    expect(labels(groups)).toEqual([
      ['', ['open:apis/auth']],
      ['Folders', ['folder:apis/auth/oauth']],
      ['Posts', ['post:apis/auth/keys']],
    ]);
  });

  it('searches folders and keeps only post matches inside the scope', () => {
    const groups = paletteGroups({
      library,
      scopeId: 'apis',
      query: 'o',
      postMatches: index,
      recentIds: [],
    });
    expect(labels(groups)).toEqual([
      ['Folders', ['folder:apis/auth/oauth']],
      ['Posts', ['post:apis/auth/oauth/pkce', 'post:apis/auth/keys', 'post:apis/rate']],
    ]);
  });

  it('shows no post group while the full-text search is still running', () => {
    const groups = paletteGroups({
      library,
      scopeId: null,
      query: 'zzz',
      postMatches: null,
      recentIds: [],
    });
    expect(groups).toEqual([]);
  });
});
