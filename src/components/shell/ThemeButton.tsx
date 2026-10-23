import { cycleTheme } from '@/lib/client/prefs';
import { Icon } from '@/components/ui/Icon';
import styles from './ThemeButton.module.css';

/** The icon follows <html data-theme> in CSS, so it is right on first paint, before hydration. */
export default function ThemeButton() {
  return (
    <button
      type="button"
      class={styles.button}
      aria-label="Switch theme"
      title="Switch theme"
      onClick={cycleTheme}
    >
      <Icon name="sun" size={19} class={styles.sun} />
      <Icon name="coffee" size={19} class={styles.coffee} />
      <Icon name="moon" size={19} class={styles.moon} />
    </button>
  );
}
