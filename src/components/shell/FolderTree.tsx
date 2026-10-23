import { Icon } from '@/components/ui/Icon';
import { cx } from '@/lib/client/cx';
import { READ_THRESHOLD } from '@/lib/client/library-state';
import type { SidebarNode } from '@/lib/content/types';
import styles from './FolderTree.module.css';

interface TreeState {
  expanded: ReadonlySet<string>;
  currentPath: string;
  bookmarks: ReadonlySet<string>;
  progress: Readonly<Record<string, number>>;
  onToggle: (folderId: string) => void;
}

interface FolderTreeProps extends TreeState {
  nodes: readonly SidebarNode[];
  depth?: number;
}

const indent = (depth: number) => ({ paddingLeft: `${4 + depth * 16}px` });

function PostMark({ bookmarked, read }: { bookmarked: boolean; read: boolean }) {
  if (bookmarked) {
    return (
      <>
        <Icon name="bookmark-simple-fill" size={13} class={styles.mark} />
        <span class="visually-hidden">(bookmarked)</span>
      </>
    );
  }
  if (read) {
    return (
      <>
        <Icon name="check" size={13} class={styles.mark} />
        <span class="visually-hidden">(read)</span>
      </>
    );
  }
  return null;
}

export function FolderTree({ nodes, depth = 0, ...state }: FolderTreeProps) {
  const { expanded, currentPath, bookmarks, progress, onToggle } = state;

  return (
    <ul class={styles.list}>
      {nodes.map((node) => {
        const active = node.url === currentPath;

        if (node.kind === 'post') {
          return (
            <li key={node.id}>
              <div class={cx(styles.row, active && styles.active)} style={indent(depth)}>
                <span class={styles.slot} />
                <a
                  class={cx(styles.link, styles.post)}
                  href={node.url}
                  aria-current={active ? 'page' : undefined}
                >
                  {node.title}
                </a>
                <PostMark
                  bookmarked={bookmarks.has(node.id)}
                  read={(progress[node.id] ?? 0) >= READ_THRESHOLD}
                />
              </div>
            </li>
          );
        }

        const open = expanded.has(node.id);
        return (
          <li key={node.id}>
            <div
              class={cx(styles.row, styles.folder, active && styles.active)}
              style={indent(depth)}
            >
              <button
                type="button"
                class={styles.caret}
                aria-expanded={open}
                aria-label={`${open ? 'Collapse' : 'Expand'} ${node.name}`}
                onClick={() => onToggle(node.id)}
              >
                <Icon name={open ? 'caret-down' : 'caret-right'} size={12} />
              </button>
              <a
                class={styles.link}
                href={node.url}
                aria-current={active ? 'page' : undefined}
                onClick={(event) => {
                  if (!active) return;
                  event.preventDefault();
                  onToggle(node.id);
                }}
              >
                {node.name}
              </a>
              <span class={styles.count}>{node.count}</span>
            </div>
            {open && <FolderTree nodes={node.children} depth={depth + 1} {...state} />}
          </li>
        );
      })}
    </ul>
  );
}
