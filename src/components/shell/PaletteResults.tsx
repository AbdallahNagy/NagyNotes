import { Icon } from '@/components/ui/Icon';
import { cx } from '@/lib/client/cx';
import { splitMatch } from '@/lib/content/command-palette';
import type { PaletteGroup, PaletteItem } from '@/lib/content/palette-groups';
import styles from './CommandPalette.module.css';

export const optionId = (index: number) => `command-palette-option-${index}`;

interface PaletteResultsProps {
  id: string;
  groups: PaletteGroup[];
  /** Index of the highlighted item across all groups. */
  active: number;
  query: string;
  /** Folders above the browsed folder; paths are shown relative to it. */
  scopeDepth: number;
  onHover: (index: number) => void;
  onChoose: (item: PaletteItem) => void;
}

function Highlighted({ text, query }: { text: string; query: string }) {
  return (
    <>
      {splitMatch(text, query).map((part, i) =>
        part.match ? (
          <mark key={i} class={styles.match}>
            {part.text}
          </mark>
        ) : (
          part.text
        ),
      )}
    </>
  );
}

interface ItemContentProps {
  item: PaletteItem;
  query: string;
  scopeDepth: number;
}

function ItemContent({ item, query, scopeDepth }: ItemContentProps) {
  const relative = (path: readonly string[]) => path.slice(scopeDepth).join(' / ');

  switch (item.kind) {
    case 'open-folder':
      return (
        <>
          <Icon name="arrow-right" size={16} class={styles.itemIcon} />
          <span class={styles.itemTitle}>Open “{item.folder.name}” page</span>
        </>
      );
    case 'folder':
      return (
        <>
          <Icon name="folder-simple" size={16} class={cx(styles.itemIcon, styles.folderIcon)} />
          <span class={styles.itemTitle}>
            <Highlighted text={item.folder.name} query={query} />
          </span>
          <span class={styles.itemMeta}>{relative(item.folder.path)}</span>
          <span class={styles.itemCount}>{item.folder.count}</span>
          <Icon name="caret-right" size={12} class={styles.itemIcon} />
        </>
      );
    case 'post':
      return (
        <>
          <Icon name="file-text" size={16} class={styles.itemIcon} />
          <span class={styles.itemTitle}>
            <Highlighted text={item.post.title} query={query} />
          </span>
          <span class={styles.itemMeta}>{relative(item.post.folderPath)}</span>
        </>
      );
  }
}

/** The grouped options of the command palette; keyboard focus stays in the search input. */
export function PaletteResults({
  id,
  groups,
  active,
  query,
  scopeDepth,
  onHover,
  onChoose,
}: PaletteResultsProps) {
  let position = 0;

  return (
    <div id={id} role="listbox" aria-label="Results" class={styles.list}>
      {groups.map((group) => (
        <div key={group.label || 'actions'} role="group" aria-label={group.label || 'Actions'}>
          {group.label && (
            <div class={styles.groupLabel} aria-hidden="true">
              {group.label}
            </div>
          )}
          {group.items.map((item) => {
            const index = position++;
            return (
              // Options are chosen with the keyboard from the input (aria-activedescendant).
              // eslint-disable-next-line jsx-a11y-x/click-events-have-key-events
              <div
                key={item.key}
                id={optionId(index)}
                role="option"
                tabIndex={-1}
                aria-selected={index === active}
                class={cx(styles.item, index === active && styles.active)}
                onMouseMove={() => {
                  if (index !== active) onHover(index);
                }}
                onClick={() => onChoose(item)}
              >
                <ItemContent item={item} query={query} scopeDepth={scopeDepth} />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
