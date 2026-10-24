import { IconButton } from '@/components/ui/IconButton';
import type { SidebarView } from '@/lib/client/library-state';
import styles from './TreeControls.module.css';

interface TreeControlsProps {
  view: SidebarView;
  canExpand: boolean;
  canCollapse: boolean;
  onExpand: () => void;
  onCollapse: () => void;
  onViewChange: (view: SidebarView) => void;
}

const BUTTON = { size: 28, iconSize: 15 } as const;

/** Expand / collapse buttons (tree view only) and the Tree | Flat toggle. */
export function TreeControls({
  view,
  canExpand,
  canCollapse,
  onExpand,
  onCollapse,
  onViewChange,
}: TreeControlsProps) {
  return (
    <div class={styles.group} role="group" aria-label="Folder view">
      {view === 'tree' && (
        <>
          <IconButton
            {...BUTTON}
            icon="arrows-out-simple"
            label="Expand one level"
            class={styles.button}
            disabled={!canExpand}
            onClick={onExpand}
          />
          <IconButton
            {...BUTTON}
            icon="arrows-in-simple"
            label="Collapse all"
            class={styles.button}
            disabled={!canCollapse}
            onClick={onCollapse}
          />
        </>
      )}
      <IconButton
        {...BUTTON}
        icon="tree-structure"
        label="Tree view"
        class={styles.button}
        aria-pressed={view === 'tree'}
        onClick={() => onViewChange('tree')}
      />
      <IconButton
        {...BUTTON}
        icon="list"
        label="Flat view"
        class={styles.button}
        aria-pressed={view === 'flat'}
        onClick={() => onViewChange('flat')}
      />
    </div>
  );
}
