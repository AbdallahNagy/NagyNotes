import { cx } from '@/lib/client/cx';
import styles from './SegmentedControl.module.css';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  /** Accessible name of the group. */
  label: string;
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Leaves a 2px gap between segments, as in the reading settings popover. */
  spaced?: boolean;
}

const ARROW_STEP: Record<string, number> = {
  ArrowRight: 1,
  ArrowDown: 1,
  ArrowLeft: -1,
  ArrowUp: -1,
};

/** A radio group drawn as joined buttons. Arrow keys move the selection, as for native radios. */
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
  spaced = false,
}: SegmentedControlProps<T>) {
  const move = (event: KeyboardEvent, index: number) => {
    const step = ARROW_STEP[event.key];
    if (step === undefined) return;
    event.preventDefault();
    const nextIndex = (index + step + options.length) % options.length;
    const next = options[nextIndex];
    if (!next) return;
    onChange(next.value);
    const group = (event.currentTarget as HTMLElement).parentElement;
    group?.querySelectorAll<HTMLElement>('[role="radio"]')[nextIndex]?.focus();
  };

  return (
    <div role="radiogroup" aria-label={label} class={cx(styles.group, spaced && styles.spaced)}>
      {options.map((option, index) => {
        const checked = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            class={cx(styles.segment, checked && styles.checked)}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => move(event, index)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
