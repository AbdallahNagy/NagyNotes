import { STORAGE_KEYS } from './storage-keys';

const FADE_MS = 400;
const MAX_VISIBLE_MS = 1100;

/** Fades the intro loader out once the page has loaded (or after at most 1.1s), once per session. */
export function initLoader(): void {
  const root = document.documentElement;
  const loader = document.querySelector<HTMLElement>('[data-loader]');
  if (!loader || root.hasAttribute('data-loaded')) return;

  let leaving = false;
  const leave = () => {
    if (leaving) return;
    leaving = true;
    loader.setAttribute('data-leaving', '');
    window.setTimeout(() => {
      root.setAttribute('data-loaded', '');
      try {
        sessionStorage.setItem(STORAGE_KEYS.loaderSeen, '1');
      } catch {
        // Without sessionStorage the loader simply shows again on the next full load.
      }
    }, FADE_MS);
  };

  if (document.readyState === 'complete') leave();
  else window.addEventListener('load', leave, { once: true });
  window.setTimeout(leave, MAX_VISIBLE_MS);
}
