import { useStore } from '@nanostores/preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import {
  $bookmarks,
  $progress,
  $recent,
  $sidebar,
  collapseAllFolders,
  expandFolders,
  setSidebarRail,
  toggleFolder,
} from '@/lib/client/library-state';
import { useMediaQuery } from '@/lib/client/use-media-query';
import { $drawerOpen } from '@/lib/client/ui-state';
import { foldersToReveal, normalizePath } from '@/lib/content/sidebar-tree';
import type { PostIndexEntry, SidebarNode } from '@/lib/content/types';
import { FolderTree } from './FolderTree';
import { useDrawer } from './use-drawer';
import styles from './Sidebar.module.css';

interface SidebarProps {
  tree: SidebarNode[];
  index: PostIndexEntry[];
  /** Path of the page being rendered, so the active row is right before hydration. */
  initialPath: string;
}

export default function Sidebar({ tree, index, initialPath }: SidebarProps) {
  const [currentPath, setCurrentPath] = useState(normalizePath(initialPath));
  const serverState = useMemo(
    () => ({ expanded: foldersToReveal(tree, initialPath), rail: false }),
    [tree, initialPath],
  );

  const sidebar = useStore($sidebar, { ssr: () => serverState });
  const bookmarks = useStore($bookmarks, { ssr: () => [] });
  const progress = useStore($progress, { ssr: () => ({}) });
  const recent = useStore($recent, { ssr: () => [] });
  const drawerOpen = useStore($drawerOpen, { ssr: () => false });

  const isMobile = useMediaQuery('(max-width: 759.98px)');
  const drawerActive = isMobile && drawerOpen;
  const drawerRef = useRef<HTMLElement>(null);
  useDrawer(drawerActive, drawerRef);

  useEffect(() => {
    const reveal = () => {
      setCurrentPath(normalizePath(location.pathname));
      expandFolders(foldersToReveal(tree, location.pathname));
    };
    reveal();
    document.addEventListener('astro:page-load', reveal);
    return () => document.removeEventListener('astro:page-load', reveal);
  }, [tree]);

  const expanded = useMemo(() => new Set(sidebar.expanded), [sidebar.expanded]);
  const bookmarkSet = useMemo(() => new Set(bookmarks), [bookmarks]);
  const recentEntries = useMemo(() => {
    const byId = new Map(index.map((entry) => [entry.id, entry]));
    return recent.flatMap((id) => byId.get(id) ?? []);
  }, [index, recent]);

  return (
    <>
      <aside
        id="sidebar"
        ref={drawerRef}
        class={styles.sidebar}
        data-open={drawerActive || undefined}
      >
        <div class={styles.full}>
          <div class={styles.top}>
            <span class={styles.heading}>Library</span>
            <IconButton
              icon="caret-double-left"
              label="Hide folders"
              size={32}
              iconSize={17}
              class={styles.collapse}
              onClick={() => setSidebarRail(true)}
            />
            <IconButton
              data-drawer-close
              icon="x"
              label="Close"
              size={32}
              iconSize={17}
              class={styles.closeDrawer}
              onClick={() => $drawerOpen.set(false)}
            />
          </div>
          <div class={styles.scroll}>
            {recentEntries.length > 0 && (
              <section aria-label="Recent">
                <div class={styles.sectionLabel}>Recent</div>
                <ul class={styles.recentList}>
                  {recentEntries.map((entry) => (
                    <li key={entry.id}>
                      <a class={styles.recent} href={entry.url}>
                        <Icon name="clock-counter-clockwise" size={14} />
                        <span class={styles.recentTitle}>{entry.title}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            <div class={styles.foldersHeader}>
              <span class={styles.sectionLabelInline}>Folders</span>
              <button type="button" class={styles.collapseAll} onClick={collapseAllFolders}>
                Collapse all
              </button>
            </div>
            <nav aria-label="Folders">
              <FolderTree
                nodes={tree}
                expanded={expanded}
                currentPath={currentPath}
                bookmarks={bookmarkSet}
                progress={progress}
                onToggle={toggleFolder}
              />
            </nav>
          </div>
        </div>
        <div class={styles.rail}>
          <IconButton
            icon="sidebar-simple"
            label="Show folders"
            onClick={() => setSidebarRail(false)}
          />
          <a class={styles.railLink} href="/" aria-label="Home" title="Home">
            <Icon name="house" size={18} />
          </a>
        </div>
      </aside>
      <div
        role="presentation"
        class={styles.scrim}
        data-open={drawerActive || undefined}
        onClick={() => $drawerOpen.set(false)}
      />
    </>
  );
}
