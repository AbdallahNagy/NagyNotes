import { useStore } from '@nanostores/preact';
import { $scrollProgress } from '@/lib/client/reading-progress';
import styles from './ProgressBar.module.css';

/** The 2px reading progress line under the header; empty on pages that are not posts. */
export default function ProgressBar() {
  const progress = useStore($scrollProgress, { ssr: () => null });
  return (
    <div class={styles.track} aria-hidden="true">
      <div class={styles.fill} style={{ width: `${(progress ?? 0) * 100}%` }} />
    </div>
  );
}
