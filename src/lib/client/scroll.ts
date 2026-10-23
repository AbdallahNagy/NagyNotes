const MAIN_ID = 'main';

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** `<main id="main">` is the only scrolling container in the app shell. */
export function getMain(): HTMLElement | null {
  return document.getElementById(MAIN_ID);
}

export function scrollMainTo(top: number): void {
  getMain()?.scrollTo({ top, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
}

/** Distance from the top of the scroll container's content to the element. */
export function offsetInMain(element: HTMLElement, main: HTMLElement): number {
  return element.getBoundingClientRect().top - main.getBoundingClientRect().top + main.scrollTop;
}

/** Smooth-scrolls so the element sits `gap` px below the top of the container. */
export function scrollMainToElement(element: HTMLElement, gap = 24): void {
  const main = getMain();
  if (main) scrollMainTo(offsetInMain(element, main) - gap);
}

export function scrollMainToId(id: string): void {
  const target = document.getElementById(id);
  if (target) scrollMainToElement(target);
}
