import { useStore } from '@nanostores/preact';
import { Icon } from '@/components/ui/Icon';
import { cx } from '@/lib/client/cx';
import { $activeHeading, $scrollProgress } from '@/lib/client/reading-progress';
import { scrollMainToId } from '@/lib/client/scroll';
import type { TocHeading } from '@/lib/content/headings';
import { minutesLeft } from '@/lib/content/reading-time';
import styles from './Toc.module.css';

interface TocProps {
  headings: TocHeading[];
  readTime: number;
}

export default function Toc({ headings, readTime }: TocProps) {
  const progress = useStore($scrollProgress, { ssr: () => null });
  const activeId = useStore($activeHeading, { ssr: () => null }) ?? headings[0]?.id;

  if (headings.length === 0) return null;

  return (
    <nav class={styles.toc} aria-label="On this page">
      <div class={styles.label}>On this page</div>
      <ul class={styles.list}>
        {headings.map((heading) => {
          const active = heading.id === activeId;
          return (
            <li key={heading.id}>
              <a
                class={cx(styles.item, active && styles.active)}
                href={`#${heading.id}`}
                aria-current={active ? 'location' : undefined}
                onClick={(event) => {
                  event.preventDefault();
                  scrollMainToId(heading.id);
                }}
              >
                {heading.text}
              </a>
            </li>
          );
        })}
      </ul>
      <div class={styles.footer}>
        <span>{minutesLeft(readTime, progress ?? 0)} min left</span>
        <button type="button" class={styles.top} data-back-to-top>
          <Icon name="arrow-up" />
          Back to top
        </button>
      </div>
    </nav>
  );
}
