import type { PostIndexEntry } from '@/lib/content/types';
import { PostListRow } from './PostListRow';
import { postStatus } from './post-status';

interface FlatPostListProps {
  /** Already in display order. */
  posts: readonly PostIndexEntry[];
  currentPath: string;
  bookmarks: ReadonlySet<string>;
  progress: Readonly<Record<string, number>>;
}

export function FlatPostList({ posts, currentPath, bookmarks, progress }: FlatPostListProps) {
  return (
    <ul>
      {posts.map((post) => (
        <li key={post.id}>
          <PostListRow
            post={post}
            active={post.url === currentPath}
            status={postStatus(bookmarks.has(post.id), progress[post.id] ?? 0)}
          />
        </li>
      ))}
    </ul>
  );
}
