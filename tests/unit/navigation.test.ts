import { beforeAll, describe, expect, it } from 'vitest';
import {
  buildPostIndex,
  buildSidebarTree,
  childFolderCards,
  descendantPosts,
  folderBreadcrumbs,
  folderCard,
  getFolder,
  getPost,
  latestPosts,
  newestInFolder,
  postBreadcrumbs,
  prevNext,
  toIndexEntry,
} from '@/lib/content/navigation';
import { buildLibrary } from '@/lib/content/tree';
import type { Library } from '@/lib/content/types';
import { folder, post } from './fixtures';

let library: Library;

beforeAll(() => {
  library = buildLibrary(
    [
      post('apis/authentication/oauth-2-0/intro', { order: 1, date: new Date('2026-09-30') }),
      post('apis/authentication/oauth-2-0/flow', { order: 2, date: new Date('2026-10-18') }),
      post('apis/authentication/keys', { order: 1, date: new Date('2026-09-22') }),
      post('apis/rate-limiting/basics', { order: 1, date: new Date('2026-10-03') }),
      post('devops/pipelines/deploy', { order: 1, date: new Date('2026-08-14') }),
    ],
    [
      folder('apis', { title: 'APIs', order: 1 }),
      folder('apis/authentication', { title: 'Authentication', order: 1 }),
      folder('apis/authentication/oauth-2-0', { title: 'OAuth 2.0', order: 1 }),
      folder('apis/rate-limiting', { title: 'Rate limiting', order: 2 }),
      folder('devops', { title: 'DevOps', order: 3 }),
      folder('empty', { title: 'Empty', order: 9 }),
    ],
    { includeDrafts: false },
  );
});

describe('breadcrumbs', () => {
  it('lists Home plus every ancestor folder for a post', () => {
    expect(postBreadcrumbs(library, 'apis/authentication/oauth-2-0/flow')).toEqual([
      { label: 'Home', url: '/' },
      { label: 'APIs', url: '/apis' },
      { label: 'Authentication', url: '/apis/authentication' },
      { label: 'OAuth 2.0', url: '/apis/authentication/oauth-2-0' },
    ]);
  });

  it('lists only the ancestors for a folder page', () => {
    expect(folderBreadcrumbs(library, 'apis/authentication')).toEqual([
      { label: 'Home', url: '/' },
      { label: 'APIs', url: '/apis' },
    ]);
    expect(folderBreadcrumbs(library, 'apis')).toEqual([{ label: 'Home', url: '/' }]);
  });
});

describe('prevNext', () => {
  it('returns siblings in reading order', () => {
    const { prev, next } = prevNext(library, 'apis/authentication/oauth-2-0/flow');
    expect(prev?.id).toBe('apis/authentication/oauth-2-0/intro');
    expect(next).toBeNull();
  });

  it('is null at the start of a folder and never crosses folders', () => {
    const { prev, next } = prevNext(library, 'apis/authentication/oauth-2-0/intro');
    expect(prev).toBeNull();
    expect(next?.id).toBe('apis/authentication/oauth-2-0/flow');
  });

  it('is null on both sides for a lone post', () => {
    expect(prevNext(library, 'devops/pipelines/deploy')).toEqual({ prev: null, next: null });
  });
});

describe('descendants and counts', () => {
  it('lists descendant posts with subfolders before the folder own posts', () => {
    expect(descendantPosts(library, 'apis/authentication').map((p) => p.id)).toEqual([
      'apis/authentication/oauth-2-0/intro',
      'apis/authentication/oauth-2-0/flow',
      'apis/authentication/keys',
    ]);
  });

  it('counts descendant posts and folders for a card', () => {
    expect(folderCard(library, getFolder(library, 'apis'))).toMatchObject({
      name: 'APIs',
      postCount: 4,
      folderCount: 3,
    });
    expect(folderCard(library, getFolder(library, 'empty'))).toMatchObject({
      postCount: 0,
      folderCount: 0,
    });
  });

  it('lists child folder cards in display order', () => {
    expect(childFolderCards(library, null).map((c) => c.id)).toEqual(['apis', 'devops', 'empty']);
    expect(childFolderCards(library, 'apis').map((c) => c.id)).toEqual([
      'apis/authentication',
      'apis/rate-limiting',
    ]);
  });
});

describe('latest', () => {
  it('orders all posts newest first and honours the limit', () => {
    expect(latestPosts(library, 3).map((p) => p.id)).toEqual([
      'apis/authentication/oauth-2-0/flow',
      'apis/rate-limiting/basics',
      'apis/authentication/oauth-2-0/intro',
    ]);
  });

  it('returns the newest descendants of a folder', () => {
    expect(newestInFolder(library, 'apis/authentication', 2).map((p) => p.id)).toEqual([
      'apis/authentication/oauth-2-0/flow',
      'apis/authentication/oauth-2-0/intro',
    ]);
  });
});

describe('serialisable views', () => {
  it('builds index entries with folder display names', () => {
    const entry = toIndexEntry(library, getPost(library, 'apis/authentication/keys'));
    expect(entry).toEqual({
      id: 'apis/authentication/keys',
      url: '/apis/authentication/keys',
      title: 'apis/authentication/keys',
      summary: 'Summary of apis/authentication/keys',
      date: '2026-09-22T00:00:00.000Z',
      readTime: 1,
      folderId: 'apis/authentication',
      folderPath: ['APIs', 'Authentication'],
    });
  });

  it('indexes every post in tree order', () => {
    expect(buildPostIndex(library).map((e) => e.id)).toEqual([
      'apis/authentication/oauth-2-0/intro',
      'apis/authentication/oauth-2-0/flow',
      'apis/authentication/keys',
      'apis/rate-limiting/basics',
      'devops/pipelines/deploy',
    ]);
  });

  it('builds the sidebar tree with subfolders first and descendant counts', () => {
    const [apis] = buildSidebarTree(library);
    expect(apis).toMatchObject({ kind: 'folder', name: 'APIs', count: 4 });
    expect(apis?.kind === 'folder' && apis.children.map((c) => c.id)).toEqual([
      'apis/authentication',
      'apis/rate-limiting',
    ]);
  });
});
