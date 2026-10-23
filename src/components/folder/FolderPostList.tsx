import { useStore } from '@nanostores/preact';
import { useMemo, useState } from 'preact/hooks';
import { IconButton } from '@/components/ui/IconButton';
import { SegmentedControl, type SegmentOption } from '@/components/ui/SegmentedControl';
import { $bookmarks, $progress, READ_THRESHOLD, toggleBookmark } from '@/lib/client/library-state';
import { formatDate } from '@/lib/format';
import type { PostIndexEntry } from '@/lib/content/types';
import styles from './FolderPostList.module.css';

type SortMode = 'order' | 'newest';

const SORT_OPTIONS: readonly SegmentOption<SortMode>[] = [
  { value: 'order', label: 'Reading order' },
  { value: 'newest', label: 'Newest' },
];

interface FolderPostListProps {
  /** Posts in reading order. */
  posts: PostIndexEntry[];
  /** Number of folders in the path to this folder, to show sub-paths for descendant posts. */
  folderDepth: number;
  /** `false` when the folder has no posts of its own and lists everything below it. */
  ownPosts: boolean;
}

function readStatus(percent: number): string | null {
  if (percent >= READ_THRESHOLD) return 'Read';
  return percent > 0 ? `${percent}% read` : null;
}

export default function FolderPostList({ posts, folderDepth, ownPosts }: FolderPostListProps) {
  const [sort, setSort] = useState<SortMode>('order');
  const bookmarks = useStore($bookmarks, { ssr: () => [] });
  const progress = useStore($progress, { ssr: () => ({}) });

  const sorted = useMemo(
    () => (sort === 'newest' ? [...posts].sort((a, b) => b.date.localeCompare(a.date)) : posts),
    [posts, sort],
  );

  return (
    <section>
      <div class={styles.head}>
        <h2 class={styles.label}>
          {ownPosts ? 'Posts' : 'All posts'} · {posts.length}
        </h2>
        <SegmentedControl
          label="Sort posts"
          options={SORT_OPTIONS}
          value={sort}
          onChange={setSort}
        />
      </div>
      <ol class={styles.list}>
        {sorted.map((post, position) => {
          const bookmarked = bookmarks.includes(post.id);
          const meta = [
            `${post.readTime} min`,
            formatDate(post.date),
            ownPosts ? null : post.folderPath.slice(folderDepth).join(' / '),
            readStatus(progress[post.id] ?? 0),
          ].filter(Boolean);

          return (
            <li key={post.id} class={styles.row}>
              <span class={styles.number}>{String(position + 1).padStart(2, '0')}</span>
              <a class={styles.main} href={post.url}>
                <span class={styles.title}>{post.title}</span>
                <span class={styles.summary}>{post.summary}</span>
                <span class={styles.meta}>{meta.join(' · ')}</span>
              </a>
              <IconButton
                icon={bookmarked ? 'bookmark-simple-fill' : 'bookmark-simple'}
                iconSize={17}
                label={`${bookmarked ? 'Remove bookmark' : 'Bookmark'}: ${post.title}`}
                aria-pressed={bookmarked}
                class={styles.bookmark}
                onClick={() => toggleBookmark(post.id)}
              />
            </li>
          );
        })}
      </ol>
    </section>
  );
}
