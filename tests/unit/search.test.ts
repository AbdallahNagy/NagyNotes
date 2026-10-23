import { describe, expect, it } from 'vitest';
import { searchPosts } from '@/lib/client/search';
import type { PostIndexEntry } from '@/lib/content/types';

const index: PostIndexEntry[] = [
  {
    id: 'a/oauth',
    url: '/a/oauth',
    title: 'What OAuth solves',
    summary: 'Tokens instead of passwords.',
    date: '2026-01-01T00:00:00.000Z',
    readTime: 1,
    folderId: 'a',
    folderPath: ['A'],
  },
];

describe('searchPosts', () => {
  it('falls back to a title and summary match when no Pagefind index is available', async () => {
    const found = await searchPosts('tokens', index);
    expect(found.map((e) => e.id)).toEqual(['a/oauth']);
  });
});
