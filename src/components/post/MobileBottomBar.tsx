import { useStore } from '@nanostores/preact';
import { useRef, useState } from 'preact/hooks';
import { Icon } from '@/components/ui/Icon';
import { cx } from '@/lib/client/cx';
import { $activeHeading, $scrollProgress } from '@/lib/client/reading-progress';
import { scrollMainToId } from '@/lib/client/scroll';
import { useDismissable } from '@/lib/client/use-dismissable';
import type { TocHeading } from '@/lib/content/headings';
import { minutesLeft } from '@/lib/content/reading-time';
import styles from './MobileBottomBar.module.css';

interface NavTarget {
  url: string;
  title: string;
}

interface MobileBottomBarProps {
  prev: NavTarget | null;
  next: NavTarget | null;
  headings: TocHeading[];
  readTime: number;
}

function StepLink({ target, direction }: { target: NavTarget | null; direction: 'prev' | 'next' }) {
  const icon = <Icon name={direction === 'prev' ? 'arrow-left' : 'arrow-right'} size={18} />;
  if (!target) {
    return (
      <span class={cx(styles.step, styles.disabled)} aria-hidden="true">
        {icon}
      </span>
    );
  }
  const label = `${direction === 'prev' ? 'Previous' : 'Next'}: ${target.title}`;
  return (
    <a class={styles.step} href={target.url} aria-label={label} title={label}>
      {icon}
    </a>
  );
}

/** Mobile only: previous/next links and a bottom sheet with the table of contents. */
export default function MobileBottomBar({ prev, next, headings, readTime }: MobileBottomBarProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const progress = useStore($scrollProgress, { ssr: () => null });
  const activeId = useStore($activeHeading, { ssr: () => null }) ?? headings[0]?.id;
  const sheetRef = useRef<HTMLDivElement>(null);
  const closeSheet = () => {
    setSheetOpen(false);
  };

  useDismissable({
    open: sheetOpen,
    onClose: closeSheet,
    container: sheetRef,
    initialFocus: 'a',
  });

  return (
    <>
      <nav class={styles.bar} aria-label="Post navigation" data-drawer-inert>
        <StepLink target={prev} direction="prev" />
        {headings.length > 0 ? (
          <button
            type="button"
            class={styles.contents}
            aria-haspopup="dialog"
            aria-expanded={sheetOpen}
            onClick={() => setSheetOpen(true)}
          >
            <Icon name="list-bullets" size={18} />
            Contents · {minutesLeft(readTime, progress ?? 0)} min left
          </button>
        ) : (
          <span class={styles.contents}>{minutesLeft(readTime, progress ?? 0)} min left</span>
        )}
        <StepLink target={next} direction="next" />
      </nav>
      {sheetOpen && (
        <>
          <div role="presentation" class={styles.scrim} onClick={closeSheet} />
          <div ref={sheetRef} role="dialog" aria-label="On this page" class={styles.sheet}>
            <div class={styles.handle} />
            <div class={styles.label}>On this page</div>
            <ul>
              {headings.map((heading) => (
                <li key={heading.id}>
                  <a
                    class={cx(styles.item, heading.id === activeId && styles.active)}
                    href={`#${heading.id}`}
                    onClick={(event) => {
                      event.preventDefault();
                      closeSheet();
                      scrollMainToId(heading.id);
                    }}
                  >
                    {heading.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </>
  );
}
