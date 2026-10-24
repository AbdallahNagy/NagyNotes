import { useStore } from '@nanostores/preact';
import { IconButton } from '@/components/ui/IconButton';
import { $sidebar, setSidebarHidden } from '@/lib/client/library-state';
import { useMediaQuery } from '@/lib/client/use-media-query';
import { $drawerOpen } from '@/lib/client/ui-state';
import styles from './MenuButton.module.css';

/** Mobile: opens the library drawer. Desktop: brings back the sidebar after it was hidden. */
export default function MenuButton() {
  const drawerOpen = useStore($drawerOpen, { ssr: () => false });
  const { hidden } = useStore($sidebar, { ssr: 'initial' });
  const isMobile = useMediaQuery('(max-width: 759.98px)');

  if (!isMobile) {
    return (
      <IconButton
        icon="sidebar-simple"
        iconSize={20}
        size={40}
        label="Show sidebar"
        class={styles.show}
        aria-controls="sidebar"
        aria-expanded={!hidden}
        onClick={() => setSidebarHidden(false)}
      />
    );
  }

  return (
    <IconButton
      icon="list"
      iconSize={20}
      size={40}
      label="Open library"
      class={styles.menu}
      aria-controls="sidebar"
      aria-expanded={drawerOpen}
      onClick={() => $drawerOpen.set(true)}
    />
  );
}
