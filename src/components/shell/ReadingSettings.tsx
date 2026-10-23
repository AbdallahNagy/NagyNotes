import { useStore } from '@nanostores/preact';
import { useEffect, useRef } from 'preact/hooks';
import { $prefs, defaultPrefs, setPref, type Prefs } from '@/lib/client/prefs';
import { $settingsOpen } from '@/lib/client/ui-state';
import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { SegmentedControl, type SegmentOption } from '@/components/ui/SegmentedControl';
import styles from './ReadingSettings.module.css';

interface Group<K extends keyof Prefs> {
  key: K;
  label: string;
  options: readonly SegmentOption<Prefs[K]>[];
}

const SIZE_GROUP: Group<'size'> = {
  key: 'size',
  label: 'Text size',
  options: [
    { value: 's', label: 'A−' },
    { value: 'm', label: 'A' },
    { value: 'l', label: 'A+' },
  ],
};
const MEASURE_GROUP: Group<'measure'> = {
  key: 'measure',
  label: 'Line width',
  options: [
    { value: 'narrow', label: 'Narrow' },
    { value: 'normal', label: 'Normal' },
    { value: 'wide', label: 'Wide' },
  ],
};
const FONT_GROUP: Group<'font'> = {
  key: 'font',
  label: 'Font',
  options: [
    { value: 'serif', label: 'Serif' },
    { value: 'sans', label: 'Sans' },
  ],
};
const THEME_GROUP: Group<'theme'> = {
  key: 'theme',
  label: 'Theme',
  options: [
    { value: 'light', label: 'Light' },
    { value: 'sepia', label: 'Sepia' },
    { value: 'dark', label: 'Dark' },
  ],
};

const DIALOG_ID = 'reading-settings';
const TITLE_ID = 'reading-settings-title';

export default function ReadingSettings() {
  const open = useStore($settingsOpen, { ssr: () => false });
  const prefs = useStore($prefs, { ssr: () => defaultPrefs(false) });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    dialogRef.current?.querySelector<HTMLElement>('[role="radio"][tabindex="0"]')?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      $settingsOpen.set(false);
      triggerRef.current?.focus();
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (dialogRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      $settingsOpen.set(false);
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open]);

  const renderGroup = <K extends keyof Prefs>({ key, label, options }: Group<K>) => (
    <div class={styles.group} key={key}>
      <span class={styles.groupLabel}>{label}</span>
      <SegmentedControl
        label={label}
        options={options}
        value={prefs[key]}
        onChange={(value) => setPref(key, value)}
        spaced
      />
    </div>
  );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        class={styles.trigger}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={DIALOG_ID}
        aria-label="Reading settings"
        title="Reading settings"
        onClick={() => $settingsOpen.set(!open)}
      >
        <Icon name="text-aa" size={19} />
        <span class={styles.triggerLabel} aria-hidden="true">
          Reading
        </span>
      </button>
      {open && (
        <div
          ref={dialogRef}
          id={DIALOG_ID}
          role="dialog"
          aria-labelledby={TITLE_ID}
          class={styles.dialog}
        >
          <div class={styles.titleRow}>
            <span id={TITLE_ID} class={styles.title}>
              Reading settings
            </span>
            <IconButton
              icon="x"
              iconSize={16}
              size={28}
              label="Close"
              class={styles.close}
              onClick={() => {
                $settingsOpen.set(false);
                triggerRef.current?.focus();
              }}
            />
          </div>
          {renderGroup(SIZE_GROUP)}
          {renderGroup(MEASURE_GROUP)}
          {renderGroup(FONT_GROUP)}
          {renderGroup(THEME_GROUP)}
          <span class={styles.note}>Saved on this device.</span>
        </div>
      )}
    </>
  );
}
