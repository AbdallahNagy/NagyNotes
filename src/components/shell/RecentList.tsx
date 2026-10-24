import { Icon } from '@/components/ui/Icon';
import type { PostIndexEntry } from '@/lib/content/types';
import styles from './RecentList.module.css';

export function RecentList({ entries }: { entries: PostIndexEntry[] }) {
  if (entries.length === 0) return null;

  return (
    <section aria-label="Recent">
      <div class={styles.label}>Recent</div>
      <ul>
        {entries.map((entry) => (
          <li key={entry.id}>
            <a class={styles.item} href={entry.url}>
              <Icon name="clock-counter-clockwise" size={14} />
              <span class={styles.title}>{entry.title}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
