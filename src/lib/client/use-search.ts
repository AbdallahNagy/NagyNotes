import { useEffect, useState } from 'preact/hooks';
import type { PostIndexEntry } from '@/lib/content/types';
import { searchPosts } from './search';

const DEBOUNCE_MS = 150;

/** Matches for `query` once typing pauses, or `null` while the query is empty. */
export function useSearch(
  query: string,
  index: readonly PostIndexEntry[],
): PostIndexEntry[] | null {
  const [results, setResults] = useState<PostIndexEntry[] | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed === '') {
      setResults(null);
      return;
    }

    let stale = false;
    const timer = window.setTimeout(() => {
      void searchPosts(trimmed, index).then((found) => {
        if (!stale) setResults(found);
      });
    }, DEBOUNCE_MS);

    return () => {
      stale = true;
      window.clearTimeout(timer);
    };
  }, [query, index]);

  return results;
}
