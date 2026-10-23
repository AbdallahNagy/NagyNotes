import { describe, expect, it } from 'vitest';
import { filterPosts, postsForUrls } from '@/lib/content/text-search';
import type { PostIndexEntry } from '@/lib/content/types';

const entry = (id: string, title: string, summary: string): PostIndexEntry => ({
  id,
  url: `/${id}`,
  title,
  summary,
  date: '2026-01-01T00:00:00.000Z',
  readTime: 1,
  folderId: null,
  folderPath: [],
});

const index = [
  entry('a/oauth', 'What OAuth solves', 'Why passwords stopped being acceptable.'),
  entry('a/keys', 'API keys done right', 'Issue, scope and rotate them.'),
  entry('b/retry', 'Retry policies', 'Backoff for 429 responses.'),
];

describe('filterPosts', () => {
  it('matches titles case-insensitively', () => {
    expect(filterPosts(index, 'oauth').map((e) => e.id)).toEqual(['a/oauth']);
  });

  it('matches summaries', () => {
    expect(filterPosts(index, 'ROTATE').map((e) => e.id)).toEqual(['a/keys']);
  });

  it('keeps index order and returns nothing for blank or unmatched queries', () => {
    expect(filterPosts(index, 'o').map((e) => e.id)).toEqual(['a/oauth', 'a/keys', 'b/retry']);
    expect(filterPosts(index, '   ')).toEqual([]);
    expect(filterPosts(index, 'zzz')).toEqual([]);
  });
});

describe('postsForUrls', () => {
  it('keeps the ranking of the engine', () => {
    expect(postsForUrls(index, ['/b/retry', '/a/oauth']).map((e) => e.id)).toEqual([
      'b/retry',
      'a/oauth',
    ]);
  });

  it('tolerates trailing slashes and .html, and skips unknown urls', () => {
    expect(postsForUrls(index, ['/a/keys/', '/b/retry.html', '/missing']).map((e) => e.id)).toEqual(
      ['a/keys', 'b/retry'],
    );
  });
});
