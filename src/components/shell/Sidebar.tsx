import { useStore } from '@nanostores/preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { IconButton } from '@/components/ui/IconButton';
import {
  $bookmarks,
  $progress,
  $recent,
  $sidebar,
  collapseAllFolders,
  expandFolders,
  expandNextLevel,
  setSidebarHidden,
  setSidebarView,
  toggleFolder,
  type SidebarState,
} from '@/lib/client/library-state';
import { SIDEBAR_WIDTH } from '@/lib/client/sidebar-width';
import { useMediaQuery } from '@/lib/client/use-media-query';
import { useSearch } from '@/lib/client/use-search';
import { $drawerOpen } from '@/lib/client/ui-state';
import {
  flatPostsNewestFirst,
  foldersToReveal,
  nextExpandDepth,
  normalizePath,
} from '@/lib/content/sidebar-tree';
import type { PostIndexEntry, SidebarNode } from '@/lib/content/types';
import { FlatPostList } from './FlatPostList';
import { FolderTree } from './FolderTree';
import { RecentList } from './RecentList';
import { SearchResults } from './SearchResults';
import { SidebarFilter } from './SidebarFilter';
import { SidebarResizer } from './SidebarResizer';
import { TreeControls } from './TreeControls';
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
  const [query, setQuery] = useState('');
  const matches = useSearch(query, index);
  const serverState = useMemo<SidebarState>(
    () => ({
      expanded: foldersToReveal(tree, initialPath),
      hidden: false,
      width: SIDEBAR_WIDTH.default,
      view: 'tree',
    }),
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
  const flatPosts = useMemo(() => flatPostsNewestFirst(index), [index]);
  const canExpand = nextExpandDepth(tree, expanded) !== null;
  const bookmarkSet = useMemo(() => new Set(bookmarks), [bookmarks]);
  const recentEntries = useMemo(() => {
    const byId = new Map(index.map((entry) => [entry.id, entry]));
    return recent.flatMap((id) => byId.get(id) ?? []);
  }, [index, recent]);

  const flat = sidebar.view === 'flat';
  const sectionLabel =
    matches !== null ? 'Matches' : flat ? `All posts · ${index.length}` : 'Folders';
  const navLabel = matches !== null ? 'Search results' : flat ? 'All posts' : 'Folders';

  return (
    <>
      <aside
        id="sidebar"
        ref={drawerRef}
        class={styles.sidebar}
        data-open={drawerActive ? '' : undefined}
      >
        <div class={styles.full}>
          <div class={styles.top}>
            <span class={styles.heading}>Library</span>
            <IconButton
              icon="caret-double-left"
              label="Hide sidebar"
              size={32}
              iconSize={17}
              class={styles.collapse}
              onClick={() => setSidebarHidden(true)}
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
          <div class={styles.filterBox}>
            <SidebarFilter value={query} onInput={setQuery} />
          </div>
          <div class={styles.scroll}>
            {matches === null && <RecentList entries={recentEntries} />}
            <div class={styles.foldersHeader}>
              <span class={styles.sectionLabelInline}>{sectionLabel}</span>
              {matches === null && (
                <TreeControls
                  view={sidebar.view}
                  canExpand={canExpand}
                  canCollapse={expanded.size > 0}
                  onExpand={() => expandNextLevel(tree)}
                  onCollapse={collapseAllFolders}
                  onViewChange={setSidebarView}
                />
              )}
            </div>
            <nav aria-label={navLabel}>
              {matches !== null ? (
                <SearchResults results={matches} query={query} currentPath={currentPath} />
              ) : flat ? (
                <FlatPostList
                  posts={flatPosts}
                  currentPath={currentPath}
                  bookmarks={bookmarkSet}
                  progress={progress}
                />
              ) : (
                <FolderTree
                  nodes={tree}
                  expanded={expanded}
                  currentPath={currentPath}
                  bookmarks={bookmarkSet}
                  progress={progress}
                  onToggle={toggleFolder}
                />
              )}
            </nav>
          </div>
        </div>
        <SidebarResizer width={sidebar.width} />
      </aside>
      <div
        role="presentation"
        class={styles.scrim}
        data-open={drawerActive ? '' : undefined}
        onClick={() => $drawerOpen.set(false)}
      />
    </>
  );
}
