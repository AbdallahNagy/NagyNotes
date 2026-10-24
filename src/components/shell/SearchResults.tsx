import type { PostIndexEntry } from '@/lib/content/types';
import { PostListRow } from './PostListRow';
import styles from './SearchResults.module.css';

interface SearchResultsProps {
  results: PostIndexEntry[];
  query: string;
  currentPath: string;
}

/** Flat list of matches, each labelled with its top-level folder. */
export function SearchResults({ results, query, currentPath }: SearchResultsProps) {
  if (results.length === 0) {
    return <div class={styles.empty}>No posts match “{query.trim()}”.</div>;
  }

  return (
    <ul aria-label="Matching posts">
      {results.map((post) => (
        <li key={post.id}>
          <PostListRow post={post} active={post.url === currentPath} />
        </li>
      ))}
    </ul>
  );
}
