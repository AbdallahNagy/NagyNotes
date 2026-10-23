import { useStore } from '@nanostores/preact';
import { $drawerOpen } from '@/lib/client/ui-state';
import { IconButton } from '@/components/ui/IconButton';
import styles from './MenuButton.module.css';

export default function MenuButton() {
  const open = useStore($drawerOpen, { ssr: () => false });
  return (
    <IconButton
      icon="list"
      iconSize={20}
      size={40}
      label="Open library"
      class={styles.menu}
      aria-controls="sidebar"
      aria-expanded={open}
      onClick={() => $drawerOpen.set(true)}
    />
  );
}
