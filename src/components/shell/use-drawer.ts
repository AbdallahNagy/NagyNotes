import type { RefObject } from 'preact';
import { useEffect } from 'preact/hooks';
import { $drawerOpen } from '@/lib/client/ui-state';

const INERT_SELECTOR = '[data-drawer-inert]';
const INITIAL_FOCUS_SELECTOR = '[data-drawer-close]';

/**
 * While the mobile drawer is open: makes the rest of the page inert, moves focus into the drawer,
 * closes on Escape and returns focus to where it came from.
 */
export function useDrawer(active: boolean, drawer: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    if (!active) return;

    const opener = document.activeElement;
    const inertElements = document.querySelectorAll<HTMLElement>(INERT_SELECTOR);
    inertElements.forEach((element) => {
      element.inert = true;
    });
    drawer.current?.querySelector<HTMLElement>(INITIAL_FOCUS_SELECTOR)?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') $drawerOpen.set(false);
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      inertElements.forEach((element) => {
        element.inert = false;
      });
      if (opener instanceof HTMLElement) opener.focus();
    };
  }, [active, drawer]);
}
