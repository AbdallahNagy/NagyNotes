import { describe, expect, it } from 'vitest';
import { buildLibrary } from '@/lib/content/tree';
import { folder, post } from './fixtures';

const build = (
  posts: ReturnType<typeof post>[],
  folders: ReturnType<typeof folder>[] = [],
  includeDrafts = false,
) => buildLibrary(posts, folders, { includeDrafts });

describe('buildLibrary', () => {
  it('infers nested folders from post paths without _folder.md', () => {
    const library = build([post('apis/authentication/oauth-2-0/flow')]);

    expect([...library.folders.keys()].sort()).toEqual([
      'apis',
      'apis/authentication',
      'apis/authentication/oauth-2-0',
    ]);
    expect(library.rootFolderIds).toEqual(['apis']);
    expect(library.folders.get('apis')?.folderIds).toEqual(['apis/authentication']);
    expect(library.posts.get('apis/authentication/oauth-2-0/flow')?.folderId).toBe(
      'apis/authentication/oauth-2-0',
    );
  });

  it('prettifies folder names and lets metadata override them', () => {
    const library = build(
      [post('business-applications/dynamics/a'), post('devops/b')],
      [folder('devops', { title: 'DevOps', description: 'Shipping.', order: 3 })],
    );

    expect(library.folders.get('business-applications')?.name).toBe('Business Applications');
    expect(library.folders.get('devops')).toMatchObject({
      name: 'DevOps',
      description: 'Shipping.',
      order: 3,
    });
  });

  it('creates folders that only exist as metadata, including their ancestors', () => {
    const library = build([], [folder('a/b', { title: 'B' })]);

    expect([...library.folders.keys()].sort()).toEqual(['a', 'a/b']);
    expect(library.folders.get('a/b')?.postIds).toEqual([]);
  });

  it('keeps posts at the top level out of any folder', () => {
    const library = build([post('about'), post('apis/a')]);

    expect(library.rootPostIds).toEqual(['about']);
    expect(library.posts.get('about')?.folderId).toBeNull();
  });

  it('sorts folders by order (missing last), then name', () => {
    const library = build(
      [post('zeta/a'), post('alpha/a'), post('beta/a'), post('gamma/a')],
      [folder('zeta', { order: 1 }), folder('gamma', { order: 2 })],
    );

    expect(library.rootFolderIds).toEqual(['zeta', 'gamma', 'alpha', 'beta']);
  });

  it('sorts posts by order, then oldest date, then title', () => {
    const old = new Date('2026-01-01T00:00:00Z');
    const recent = new Date('2026-06-01T00:00:00Z');
    const library = build([
      post('f/unordered-new', { date: recent }),
      post('f/second', { order: 2, date: recent }),
      post('f/first', { order: 1, date: recent }),
      post('f/unordered-old', { date: old }),
      post('f/b-same-day', { date: recent, title: 'B' }),
      post('f/a-same-day', { date: recent, title: 'A' }),
    ]);

    expect(library.folders.get('f')?.postIds).toEqual([
      'f/first',
      'f/second',
      'f/unordered-old',
      'f/a-same-day',
      'f/b-same-day',
      'f/unordered-new',
    ]);
  });

  it('excludes drafts unless asked, and drops folders that only held drafts', () => {
    const posts = [post('live/a'), post('wip/b', { draft: true })];

    const published = build(posts);
    expect(published.posts.has('wip/b')).toBe(false);
    expect(published.folders.has('wip')).toBe(false);

    const withDrafts = build(posts, [], true);
    expect(withDrafts.posts.has('wip/b')).toBe(true);
    expect(withDrafts.folders.has('wip')).toBe(true);
  });

  it('computes reading time from the body', () => {
    const body = Array.from({ length: 500 }, () => 'word').join(' ');
    expect(build([post('a/long', { body })]).posts.get('a/long')?.readTime).toBe(3);
  });

  it('rejects post paths the comments table cannot key on', () => {
    expect(() => build([post('apis/My Post')])).toThrow(/Invalid post path "apis\/My Post"/);
    expect(() => build([post('apis/v1.2')])).toThrow(/Invalid post path/);
  });

  it('throws a clear error when a post collides with a folder name', () => {
    expect(() => build([post('apis/auth'), post('apis/auth/basic')])).toThrow(
      /post "apis\/auth" has the same path as a folder/,
    );
  });

  it('throws when a post collides with a metadata-only folder', () => {
    expect(() => build([post('apis/auth')], [folder('apis/auth')])).toThrow(
      /same path as a folder/,
    );
  });
});
