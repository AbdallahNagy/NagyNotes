import { Icon } from '@/components/ui/Icon';
import type { PostIndexEntry } from '@/lib/content/types';
import { STATUS_ICON, type PostStatus } from './post-status';
import styles from './PostListRow.module.css';

interface PostListRowProps {
  post: PostIndexEntry;
  active: boolean;
  status?: PostStatus | null;
}

/** A post link labelled with its top-level folder, as used by the flat view and search results. */
export function PostListRow({ post, active, status = null }: PostListRowProps) {
  return (
    <a class={styles.row} href={post.url} aria-current={active ? 'page' : undefined}>
      <span class={styles.title}>
        {post.title}
        {status && <span class="visually-hidden"> ({status})</span>}
      </span>
      {status && <Icon name={STATUS_ICON[status]} size={13} class={styles.mark} />}
      <span class={styles.folder}>{post.folderPath[0]}</span>
    </a>
  );
}
