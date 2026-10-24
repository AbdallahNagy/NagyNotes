import { useStore } from '@nanostores/preact';
import { navigate } from 'astro:transitions/client';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { Icon } from '@/components/ui/Icon';
import { $recent } from '@/lib/client/library-state';
import { loadLibrary } from '@/lib/client/library-data';
import { useSearch } from '@/lib/client/use-search';
import { scopeTrail } from '@/lib/content/command-palette';
import { paletteGroups, type PaletteItem } from '@/lib/content/palette-groups';
import type { LibraryData, PostIndexEntry } from '@/lib/content/types';
import { optionId, PaletteResults } from './PaletteResults';
import styles from './CommandPalette.module.css';

const NO_POSTS: PostIndexEntry[] = [];
const LIST_ID = 'command-palette-list';

/** "⌘ K" on Apple platforms, "Ctrl K" elsewhere; decided after mount to keep SSR stable. */
function useShortcutLabel(): string {
  const [label, setLabel] = useState('Ctrl K');
  useEffect(() => {
    if (/Mac|iPhone|iPad/.test(navigator.platform)) setLabel('⌘ K');
  }, []);
  return label;
}

/** Search and browse every folder and post. Opens from the header button or Ctrl/⌘ + K. */
export default function CommandPalette() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [library, setLibrary] = useState<LibraryData | null>(null);
  const [failed, setFailed] = useState(false);
  const [scopeId, setScopeId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const recent = useStore($recent, { ssr: () => [] });
  const shortcut = useShortcutLabel();
  const postMatches = useSearch(query, library?.index ?? NO_POSTS);

  const groups = useMemo(
    () =>
      library ? paletteGroups({ library, scopeId, query, postMatches, recentIds: recent }) : [],
    [library, scopeId, query, postMatches, recent],
  );
  const items = useMemo(() => groups.flatMap((group) => group.items), [groups]);
  const trail = library ? scopeTrail(library.tree, scopeId) : [];
  const searching = query.trim() !== '' && postMatches === null;

  const open = () => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    dialog.showModal();
    inputRef.current?.focus();
    loadLibrary().then(setLibrary, () => setFailed(true));
  };
  const close = () => dialogRef.current?.close();

  const enterFolder = (id: string | null) => {
    setScopeId(id);
    setQuery('');
    inputRef.current?.focus();
  };

  const choose = (item: PaletteItem) => {
    if (item.kind === 'folder') {
      enterFolder(item.folder.id);
      return;
    }
    close();
    void navigate(item.kind === 'post' ? item.post.url : item.folder.url);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 'k' || !(event.ctrlKey || event.metaKey)) return;
      event.preventDefault();
      if (dialogRef.current?.open) close();
      else open();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  });

  useEffect(() => setActive(0), [query, scopeId]);

  useEffect(() => {
    document.getElementById(optionId(active))?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const onInputKeyDown = (event: KeyboardEvent) => {
    const step = { ArrowDown: 1, ArrowUp: -1 }[event.key];
    if (step !== undefined && items.length > 0) {
      event.preventDefault();
      setActive((current) => (current + step + items.length) % items.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const item = items[active];
      if (item) choose(item);
    } else if (event.key === 'Backspace' && query === '' && scopeId !== null) {
      event.preventDefault();
      enterFolder(trail.at(-2)?.id ?? null);
    }
  };

  const status = failed
    ? "The library couldn't be loaded."
    : !library || searching
      ? null
      : items.length === 0
        ? query.trim() === ''
          ? 'This folder is empty.'
          : `Nothing matches “${query.trim()}”.`
        : null;

  return (
    <>
      <button
        type="button"
        class={styles.trigger}
        aria-keyshortcuts="Control+K Meta+K"
        aria-haspopup="dialog"
        onClick={open}
      >
        <Icon name="magnifying-glass" size={16} />
        <span class={styles.triggerLabel}>Search…</span>
        <kbd class={styles.triggerKey} aria-hidden="true">
          {shortcut}
        </kbd>
      </button>

      {/* Clicks on the dialog itself land on its backdrop: outside the panel. */}
      {/* eslint-disable-next-line jsx-a11y-x/click-events-have-key-events, jsx-a11y-x/no-noninteractive-element-interactions */}
      <dialog
        ref={dialogRef}
        class={styles.dialog}
        aria-label="Search the library"
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
        onClose={() => {
          setScopeId(null);
          setQuery('');
          setFailed(false);
        }}
      >
        <div class={styles.panel}>
          <div class={styles.inputRow}>
            <Icon name="magnifying-glass" size={18} class={styles.inputIcon} />
            {trail.length > 0 && (
              <button
                type="button"
                class={styles.scope}
                title="Back (Backspace)"
                onClick={() => enterFolder(trail.at(-2)?.id ?? null)}
              >
                {trail.map((folder) => folder.name).join(' / ')}
                <Icon name="x" size={12} />
              </button>
            )}
            <input
              ref={inputRef}
              class={styles.input}
              type="text"
              value={query}
              placeholder={
                trail.length > 0 ? 'Search in this folder…' : 'Search posts and folders…'
              }
              role="combobox"
              aria-expanded="true"
              aria-controls={LIST_ID}
              aria-autocomplete="list"
              aria-activedescendant={items.length > 0 ? optionId(active) : undefined}
              autocomplete="off"
              spellcheck={false}
              onInput={(event) => setQuery(event.currentTarget.value)}
              onKeyDown={onInputKeyDown}
            />
          </div>

          <div class={styles.body}>
            {status && (
              <p class={styles.status} role="status">
                {status}
              </p>
            )}
            <PaletteResults
              id={LIST_ID}
              groups={groups}
              active={active}
              query={query}
              scopeDepth={trail.length}
              onHover={setActive}
              onChoose={choose}
            />
          </div>

          <div class={styles.footer} aria-hidden="true">
            <span>
              <kbd>↑</kbd>
              <kbd>↓</kbd> navigate
            </span>
            <span>
              <kbd>↵</kbd> open
            </span>
            {trail.length > 0 && (
              <span>
                <kbd>⌫</kbd> back
              </span>
            )}
            <span>
              <kbd>esc</kbd> close
            </span>
          </div>
        </div>
      </dialog>
    </>
  );
}
