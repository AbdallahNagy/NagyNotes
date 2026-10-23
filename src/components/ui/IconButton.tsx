import type { ButtonHTMLAttributes } from 'preact';
import type { IconName } from '@/lib/icons.generated';
import { cx } from '@/lib/client/cx';
import { Icon } from './Icon';
import styles from './IconButton.module.css';

type IconButtonProps = Omit<ButtonHTMLAttributes, 'size' | 'label' | 'class' | 'style'> & {
  icon: IconName;
  class?: string;
  /** Accessible name, also shown as the tooltip. */
  label: string;
  /** Button width and height in px. */
  size?: number;
  iconSize?: number;
};

export function IconButton({
  icon,
  label,
  size = 36,
  iconSize = 18,
  class: className,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      class={cx(styles.button, className)}
      style={{ width: size, height: size }}
      {...rest}
    >
      <Icon name={icon} size={iconSize} />
    </button>
  );
}
