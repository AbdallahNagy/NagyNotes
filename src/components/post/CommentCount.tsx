import { useStore } from '@nanostores/preact';
import { Icon } from '@/components/ui/Icon';
import { scrollMainToId } from '@/lib/client/scroll';
import { $commentCount } from '@/lib/client/ui-state';
import { COMMENTS_ID } from './comments-id';
import styles from './CommentCount.module.css';

/** Jumps to the comments; shown once they have loaded, and never when comments are unavailable. */
export default function CommentCount() {
  const count = useStore($commentCount, { ssr: () => null });
  if (count === null) return null;

  return (
    <button
      type="button"
      class={styles.button}
      aria-label={`${count} comments, jump to comments`}
      onClick={() => scrollMainToId(COMMENTS_ID)}
    >
      <Icon name="chat-circle" size={15} />
      {count}
    </button>
  );
}
