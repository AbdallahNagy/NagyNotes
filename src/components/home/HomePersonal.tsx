import { useStore } from '@nanostores/preact';
import { useMemo } from 'preact/hooks';
import { Icon } from '@/components/ui/Icon';
import { BOOKMARK_CARD_LIMIT } from '@/config/site';
import { $bookmarks, $progress, $recent, READ_THRESHOLD } from '@/lib/client/library-state';
import { minutesLeft } from '@/lib/content/reading-time';
import type { PostIndexEntry } from '@/lib/content/types';
import styles from './HomePersonal.module.css';

interface HomePersonalProps {
  index: PostIndexEntry[];
}

/** "Continue reading" and "Bookmarks", both built from what this browser remembers. */
export default function HomePersonal({ index }: HomePersonalProps) {
  const bookmarks = useStore($bookmarks, { ssr: () => [] });
  const progress = useStore($progress, { ssr: () => ({}) });
  const recent = useStore($recent, { ssr: () => [] });

  const byId = useMemo(() => new Map(index.map((entry) => [entry.id, entry])), [index]);
  const bookmarked = bookmarks.flatMap((id) => byId.get(id) ?? []);
  const continuing = recent
    .flatMap((id) => byId.get(id) ?? [])
    .find((post) => {
      const percent = progress[post.id] ?? 0;
      return percent > 0 && percent < READ_THRESHOLD;
    });
  const continuingPercent = continuing ? (progress[continuing.id] ?? 0) : 0;

  return (
    <div class={styles.cards}>
      {continuing && (
        <a class={styles.continue} href={continuing.url}>
          <span class={styles.label}>
            <Icon name="book-open" />
            Continue reading
          </span>
          <span class={styles.title}>{continuing.title}</span>
          <span class={styles.meta}>
            {continuing.folderPath.join(' / ')} ·{' '}
            {minutesLeft(continuing.readTime, continuingPercent / 100)} min left
          </span>
          <span class={styles.track} aria-hidden="true">
            <span class={styles.fill} style={{ width: `${continuingPercent}%` }} />
          </span>
        </a>
      )}
      <section class={styles.card}>
        <h2 class={styles.label}>
          <Icon name="bookmark-simple" />
          Bookmarks · {bookmarked.length}
        </h2>
        {bookmarked.slice(0, BOOKMARK_CARD_LIMIT).map((post) => (
          <a key={post.id} class={styles.bookmark} href={post.url}>
            {post.title}
          </a>
        ))}
        {bookmarked.length === 0 && (
          <span class={styles.empty}>Bookmark a post to keep it here.</span>
        )}
      </section>
    </div>
  );
}
