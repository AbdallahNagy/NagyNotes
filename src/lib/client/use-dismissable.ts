import type { RefObject } from 'preact';
import { useLayoutEffect } from 'preact/hooks';

interface DismissableOptions {
  open: boolean;
  onClose: () => void;
  container: RefObject<HTMLElement | null>;
  /** Clicks on this element do not count as "outside" (the control that toggles the popup). */
  trigger?: RefObject<HTMLElement | null>;
  /** Selector for the element to focus when the popup opens. */
  initialFocus?: string;
  closeOnOutsideClick?: boolean;
}

/**
 * Behaviour shared by popups: focus moves in when one opens, Escape (and optionally an outside
 * click) closes it, and focus returns to where it was when nothing else has claimed it.
 * A layout effect, so focus and listeners are in place as soon as the popup is on screen.
 */
export function useDismissable({
  open,
  onClose,
  container,
  trigger,
  initialFocus,
  closeOnOutsideClick = false,
}: DismissableOptions): void {
  useLayoutEffect(() => {
    if (!open) return;

    const opener = document.activeElement;
    if (initialFocus) container.current?.querySelector<HTMLElement>(initialFocus)?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (container.current?.contains(target) || trigger?.current?.contains(target)) return;
      onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    if (closeOnOutsideClick) document.addEventListener('pointerdown', onPointerDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
      if (document.activeElement === document.body && opener instanceof HTMLElement) opener.focus();
    };
  }, [open, onClose, container, trigger, initialFocus, closeOnOutsideClick]);
}
