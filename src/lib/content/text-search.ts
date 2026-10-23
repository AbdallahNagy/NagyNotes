import { normalizePath } from './sidebar-tree';
import type { PostIndexEntry } from './types';

/** Case-insensitive substring match over title and summary, in index order. */
export function filterPosts(index: readonly PostIndexEntry[], query: string): PostIndexEntry[] {
  const needle = query.trim().toLowerCase();
  if (needle === '') return [];
  return index.filter((entry) => `${entry.title} ${entry.summary}`.toLowerCase().includes(needle));
}

/** Resolves search-engine result URLs to index entries, keeping the engine's ranking. */
export function postsForUrls(
  index: readonly PostIndexEntry[],
  urls: readonly string[],
): PostIndexEntry[] {
  const byUrl = new Map(index.map((entry) => [entry.url, entry]));
  return urls.flatMap((url) => byUrl.get(normalizePath(url.replace(/\.html$/, ''))) ?? []);
}
