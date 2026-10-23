import { useStore } from '@nanostores/preact';
import { $bookmarks, toggleBookmark } from '@/lib/client/library-state';
import { Icon } from '@/components/ui/Icon';
import { cx } from '@/lib/client/cx';
import styles from './BookmarkButton.module.css';

export default function BookmarkButton({ postId }: { postId: string }) {
  const bookmarks = useStore($bookmarks, { ssr: () => [] });
  const bookmarked = bookmarks.includes(postId);

  return (
    <button
      type="button"
      class={cx(styles.button, bookmarked && styles.on)}
      aria-pressed={bookmarked}
      onClick={() => toggleBookmark(postId)}
    >
      <Icon name={bookmarked ? 'bookmark-simple-fill' : 'bookmark-simple'} size={15} />
      {bookmarked ? 'Bookmarked' : 'Bookmark'}
    </button>
  );
}
