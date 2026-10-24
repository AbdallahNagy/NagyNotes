import { Icon } from '@/components/ui/Icon';
import styles from './SidebarFilter.module.css';

interface SidebarFilterProps {
  value: string;
  onInput: (value: string) => void;
}

export function SidebarFilter({ value, onInput }: SidebarFilterProps) {
  return (
    <label class={styles.filter}>
      <Icon name="magnifying-glass" size={15} />
      <input
        type="search"
        class={styles.input}
        value={value}
        placeholder="Filter posts…"
        aria-label="Filter posts"
        autocomplete="off"
        onInput={(event) => onInput(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && value !== '') {
            event.stopPropagation();
            onInput('');
          }
        }}
      />
    </label>
  );
}
