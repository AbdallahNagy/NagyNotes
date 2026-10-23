import { filterPosts, postsForUrls } from '@/lib/content/text-search';
import type { PostIndexEntry } from '@/lib/content/types';

const PAGEFIND_URL = '/pagefind/pagefind.js';
const MAX_RESULTS = 20;

interface PagefindResultData {
  url: string;
}

interface Pagefind {
  search(term: string): Promise<{ results: { data(): Promise<PagefindResultData> }[] }>;
}

const isPagefind = (value: unknown): value is Pagefind =>
  typeof value === 'object' &&
  value !== null &&
  'search' in value &&
  typeof value.search === 'function';

let pagefind: Promise<Pagefind | null> | undefined;

/** Pagefind only exists after `pnpm build`; in dev the import fails and `null` is cached. */
function loadPagefind(): Promise<Pagefind | null> {
  pagefind ??= (async () => {
    try {
      const module: unknown = await import(/* @vite-ignore */ PAGEFIND_URL);
      return isPagefind(module) ? module : null;
    } catch {
      return null;
    }
  })();
  return pagefind;
}

/**
 * Full-text search over titles, headings, body and code via Pagefind. Without a built index it
 * falls back to a substring match on title and summary.
 */
export async function searchPosts(
  query: string,
  index: readonly PostIndexEntry[],
): Promise<PostIndexEntry[]> {
  const engine = await loadPagefind();
  if (!engine) return filterPosts(index, query);

  try {
    const { results } = await engine.search(query);
    const found = await Promise.all(results.slice(0, MAX_RESULTS).map((result) => result.data()));
    return postsForUrls(
      index,
      found.map(({ url }) => url),
    );
  } catch {
    return filterPosts(index, query);
  }
}
