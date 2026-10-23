import { $sidebar } from './library-state';
import { $prefs, applyPrefs } from './prefs';
import { scrollMainTo } from './scroll';
import { $drawerOpen, $settingsOpen } from './ui-state';

const LOADED_ATTRIBUTE = 'data-loaded';
const RAIL_ATTRIBUTE = 'data-rail';

function syncDocument(root: HTMLElement): void {
  applyPrefs(root, $prefs.get());
  root.toggleAttribute(RAIL_ATTRIBUTE, $sidebar.get().rail);
}

function resetScroll(): void {
  const main = document.getElementById('main');
  if (!main) return;
  const target = location.hash ? document.getElementById(location.hash.slice(1)) : null;
  if (target) target.scrollIntoView();
  else main.scrollTop = 0;
}

/**
 * Keeps <html> in step with the stores and carries that state across client-side navigations,
 * so a page swap never flashes the wrong theme, layout or loader.
 */
export function initDocumentState(): void {
  const root = document.documentElement;
  syncDocument(root);
  $prefs.subscribe(() => syncDocument(root));
  $sidebar.subscribe(() => syncDocument(root));

  document.addEventListener('astro:before-swap', (event) => {
    const incoming = event.newDocument.documentElement;
    syncDocument(incoming);
    incoming.toggleAttribute(LOADED_ATTRIBUTE, root.hasAttribute(LOADED_ATTRIBUTE));
  });

  document.addEventListener('click', (event) => {
    if (event.target instanceof Element && event.target.closest('[data-back-to-top]')) {
      scrollMainTo(0);
    }
  });

  document.addEventListener('astro:page-load', () => {
    $drawerOpen.set(false);
    $settingsOpen.set(false);
    resetScroll();
  });
}
